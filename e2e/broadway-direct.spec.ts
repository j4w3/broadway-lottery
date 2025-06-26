import { test } from "@playwright/test";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { getUserInfo } from "../src/get-user-info";
import { broadwayDirect } from "../src/broadway-direct";

// Configure stealth plugin
chromium.use(stealthPlugin());

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

// Viewport sizes for randomization
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1680, height: 1050 }
];

// Use serial execution for proper circuit breaker behavior
test.describe.serial('Broadway lottery entries', () => {
  test.beforeEach(async ({}, testInfo) => {
    // Check circuit breaker before each test
    if (cloudflareDetected) {
      console.log(`⚡ CIRCUIT BREAKER ACTIVE: Skipping test due to Cloudflare detection on ${cloudflareShow}`);
      testInfo.skip();
    }
  });

  shuffledUrls.forEach((url, index) => {
    test(`Sign up at ${url}`, async () => {
    const userInfo = getUserInfo(process.env);
    
    // Add small random start delay to distribute load naturally (0-3 seconds)
    const startDelay = Math.random() * 3000;
    const showName = url.match(/show\/([^\/]+)/)?.[1] || "unknown";
    console.log(`🎭 [${showName}] Starting in ${(startDelay/1000).toFixed(1)}s...`);
    await new Promise(resolve => setTimeout(resolve, startDelay));
    
    // In CI, run headless; locally, run headful for debugging
    const headless = process.env.CI === 'true';
    
    // Random viewport
    const viewport = viewports[Math.floor(Math.random() * viewports.length)];
    
let browser;
    try {
      browser = await chromium.launch({ 
        headless,
        timeout: 30000,
        viewport,
        // Enhanced anti-detection browser arguments
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-back-forward-cache',
          '--disable-ipc-flooding-protection',
          '--enable-features=NetworkService,NetworkServiceInProcess',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--no-first-run',
          '--password-store=basic',
          '--use-mock-keychain',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--mute-audio',
          '--no-zygote',
          '--disable-background-networking',
          `--window-size=${viewport.width},${viewport.height}`
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
});
