import { test } from "@playwright/test";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { getUserInfo } from "../src/get-user-info";
import { broadwayDirect } from "../src/broadway-direct";

// Configure stealth plugin
chromium.use(stealthPlugin());

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

shuffledUrls.forEach((url, index) => {
  test(`Sign up at ${url}`, async () => {
    const userInfo = getUserInfo(process.env);
    
    // Add delay between tests (30-60 seconds after first test)
    if (index > 0) {
      const delay = 30000 + Math.random() * 30000; // 30-60 seconds
      console.log(`⏳ Waiting ${Math.round(delay/1000)}s before next show...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // In CI, run headless; locally, run headful for debugging
    const headless = process.env.CI === 'true';
    
    // Random viewport
    const viewport = viewports[Math.floor(Math.random() * viewports.length)];
    
    const browser = await chromium.launch({ 
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
    
    try {
      await broadwayDirect({ browser, userInfo, url, viewport });
    } catch (error) {
      console.error(`Failed to complete lottery signup for ${url}:`, error);
      throw error; // Re-throw to mark test as failed
    }
  });
});
