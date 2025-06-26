import { test, chromium } from "@playwright/test";
import { getUserInfo } from "../src/get-user-info";
import { broadwayDirect } from "../src/broadway-direct";

const urls = [
  "https://lottery.broadwaydirect.com/show/aladdin/",
  "https://lottery.broadwaydirect.com/show/mj-ny/",
  "https://lottery.broadwaydirect.com/show/six-ny/",
  "https://lottery.broadwaydirect.com/show/the-lion-king/",
  "https://lottery.broadwaydirect.com/show/dbh-nyc/",
  "https://lottery.broadwaydirect.com/show/wicked/",
  "https://lottery.broadwaydirect.com/show/st-nyc/",
];

urls.forEach((url) => {
  test(`Sign up at ${url}`, async () => {
    const userInfo = getUserInfo(process.env);
    
    // In CI, run headless; locally, run headful for debugging
    const headless = process.env.CI === 'true';
    
    const browser = await chromium.launch({ 
      headless,
      timeout: 30000,
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
        '--disable-background-networking'
      ]
    });
    
    try {
      await broadwayDirect({ browser, userInfo, url });
    } catch (error) {
      console.error(`Failed to complete lottery signup for ${url}:`, error);
      throw error; // Re-throw to mark test as failed
    }
  });
});
