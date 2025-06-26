import { test } from "@playwright/test";
import { chromium } from "@playwright/test";
import { getUserInfo } from "../src/get-user-info";
import { broadwayDirect } from "../src/broadway-direct";

// Global circuit breaker for Cloudflare detection
let cloudflareDetected = false;
let cloudflareShow = '';

const urls = [
  "https://lottery.broadwaydirect.com/show/aladdin/",
  "https://lottery.broadwaydirect.com/show/mj-ny/",
  "https://lottery.broadwaydirect.com/show/six-ny/",
  "https://lottery.broadwaydirect.com/show/the-lion-king/",
  "https://lottery.broadwaydirect.com/show/dbh-nyc/",
  "https://lottery.broadwaydirect.com/show/wicked/",
  "https://lottery.broadwaydirect.com/show/st-nyc/",
];

// Shuffle URLs to randomize order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const shuffledUrls = shuffleArray(urls);

// Create batches for parallel execution within batches
const batches = [
  shuffledUrls.slice(0, 3),  // Batch 1: First 3 shows
  shuffledUrls.slice(3, 5),  // Batch 2: Next 2 shows  
  shuffledUrls.slice(5)      // Batch 3: Last 2 shows
];

// User agents for rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
];

// Viewport sizes for randomization
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1680, height: 1050 },
  { width: 1280, height: 720 },
  { width: 1600, height: 900 }
];

// Use serial execution with smart delays to maintain performance
test.describe.serial('Broadway lottery entries', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (cloudflareDetected) {
      console.log(`⚡ CIRCUIT BREAKER ACTIVE: Skipping test due to Cloudflare detection on ${cloudflareShow}`);
      testInfo.skip();
    }
  });

  shuffledUrls.forEach((url, index) => {
    test(`Sign up at ${url}`, async () => {
      // Smart delay strategy: delay every 3 shows to break up patterns
      if (index > 0 && index % 3 === 0) {
        const groupDelay = 60000 + Math.random() * 60000; // 1-2 minutes between groups
        console.log(`⏸️ Group delay after ${index} shows: ${(groupDelay/1000).toFixed(1)}s`);
        await new Promise(resolve => setTimeout(resolve, groupDelay));
      }
    const userInfo = getUserInfo(process.env);
    
    // Add small random start delay to distribute load naturally (0-3 seconds)
    const startDelay = Math.random() * 3000;
    const showName = url.match(/show\/([^\/]+)/)?.[1] || "unknown";
    console.log(`🎭 [${showName}] Starting in ${(startDelay/1000).toFixed(1)}s...`);
    await new Promise(resolve => setTimeout(resolve, startDelay));
    
    // In CI, run headless; locally, run headful for debugging
    const headless = process.env.CI === 'true';
    
    // Random viewport and user agent for each show
    const viewport = viewports[Math.floor(Math.random() * viewports.length)];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    console.log(`🔧 Using viewport: ${viewport.width}x${viewport.height}, UA: ${userAgent.split(' ')[5] || 'Custom'}`);
    
    // Random browser arguments for more variation
    const randomArgs = [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor',
      '--disable-ipc-flooding-protection',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-field-trial-config',
      '--disable-background-networking'
    ];
    
let browser;
    try {
      browser = await chromium.launch({ 
        headless,
        timeout: 30000,
        // Enhanced anti-detection browser arguments with randomization
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--no-default-browser-check',
          '--no-first-run',
          '--password-store=basic',
          '--use-mock-keychain',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--mute-audio',
          '--no-zygote',
          `--user-agent=${userAgent}`,
          `--window-size=${viewport.width},${viewport.height}`,
          ...randomArgs.slice(0, Math.floor(Math.random() * 4) + 2) // Random subset of stealth args
        ]
      });
    } catch (browserError) {
      console.error(`Failed to launch browser for ${url}:`, browserError);
      throw new Error(`Browser launch failed: ${browserError.message}`);
    }
    
    try {
      await broadwayDirect({ browser, userInfo, url, viewport });
    } catch (error) {
      const showName = url.match(/show\/([^\/]+)/)?.[1] || "unknown";
      console.error(`💥 [${showName}] Failed to complete lottery signup:`, {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        url: url,
        timestamp: new Date().toISOString()
      });
      
      // Check if it's a Cloudflare error and activate circuit breaker
      if (error.message && error.message.includes('Cloudflare')) {
        cloudflareDetected = true;
        cloudflareShow = showName;
        console.log(`⚡ CIRCUIT BREAKER ACTIVATED: Cloudflare detected on ${showName}, stopping all remaining tests`);
        // Fail immediately without retries
        test.fail();
      }
      
      throw error; // Re-throw to mark test as failed
    } finally {
      // Ensure browser is closed even on error
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.warn(`Failed to close browser for ${url}:`, closeError);
        }
      }
    }
    });
  });
});

// Global test completion handler
test.afterAll(async () => {
  console.log('\n=== TEST SUITE COMPLETION SUMMARY ===');
  if (cloudflareDetected) {
    console.log(`⚡ Circuit breaker was activated due to Cloudflare detection on: ${cloudflareShow}`);
    console.log('🚨 Some tests may have been skipped to prevent further blocking');
  } else {
    console.log('✅ All tests completed without circuit breaker activation');
  }
  console.log('=====================================\n');
});
