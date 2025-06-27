import { test } from "@playwright/test";
import { Camoufox } from "camoufox-js";
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

// OS types for Camoufox fingerprint rotation
const osTypes = ['windows', 'macos', 'linux'];

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
      // DISABLED: Smart delay strategy for Camoufox native testing
      // if (index > 0 && index % 3 === 0) {
      //   const groupDelay = 60000 + Math.random() * 60000; // 1-2 minutes between groups
      //   console.log(`⏸️ Group delay after ${index} shows: ${(groupDelay/1000).toFixed(1)}s`);
      //   await new Promise(resolve => setTimeout(resolve, groupDelay));
      // }
    const userInfo = getUserInfo(process.env);
    
    // DISABLED: Random start delay for Camoufox native testing
    // const startDelay = Math.random() * 3000;
    const showName = url.match(/show\/([^\/]+)/)?.[1] || "unknown";
    console.log(`🎭 [${showName}] Starting immediately (Camoufox native test)...`);
    // await new Promise(resolve => setTimeout(resolve, startDelay));
    
    // In CI, run headless; locally, run headful for debugging
    const headless = process.env.CI === 'true';
    
    // Random OS for Camoufox fingerprint generation
    const randomOS = osTypes[Math.floor(Math.random() * osTypes.length)];
    console.log(`🦊 Using Camoufox with ${randomOS} fingerprint and automated anti-detection`);
    
let browser;
    try {
      browser = await Camoufox({
        headless,
        timeout: 30000,
        // Enhanced Camoufox configuration for maximum stealth
        os: randomOS, // Random OS fingerprint (windows/macos/linux)
        // Let Camoufox automatically generate realistic:
        // - User agents matching the OS
        // - Screen resolutions and viewport sizes
        // - Font lists and font metrics
        // - Navigator properties
        // - Timezone and locale
        // - Device characteristics
        // - Hardware concurrency
        // - Memory info
        // All at C++ level for undetectable fingerprints
      });
    } catch (browserError) {
      console.error(`Failed to launch browser for ${url}:`, browserError);
      throw new Error(`Browser launch failed: ${browserError.message}`);
    }
    
    try {
      await broadwayDirect({ browser, userInfo, url });
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
