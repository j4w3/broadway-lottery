import { Browser, Page } from "playwright";
import { UserInfo } from "./types";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

// Configuration constants
const CONFIG = {
  // Number of retry attempts for failed operations
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || "2"),
  // Base timeout for page operations (ms)
  PAGE_TIMEOUT: parseInt(process.env.PAGE_TIMEOUT || "30000"),
  // Random delay range (ms)
  MIN_DELAY: parseInt(process.env.MIN_DELAY || "1000"),
  MAX_DELAY: parseInt(process.env.MAX_DELAY || "3000"),
  // Network timeout for navigation
  NAVIGATION_TIMEOUT: parseInt(process.env.NAVIGATION_TIMEOUT || "60000"),
};

// Randomized user agents for retry attempts
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
];

// Get random user agent
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Ensure screenshots directory exists
const screenshotsDir = join(process.cwd(), "screenshots");
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

// Utility function for configurable random delay
function getRandomDelay(): number {
  return Math.floor(Math.random() * (CONFIG.MAX_DELAY - CONFIG.MIN_DELAY + 1)) + CONFIG.MIN_DELAY;
}

// Human-like typing with random delays
async function humanLikeType(page: Page, selector: string, text: string): Promise<void> {
  const element = page.locator(selector);
  await element.click();
  await page.waitForTimeout(100 + Math.random() * 200); // Random delay
  
  // Type with human-like pace
  for (const char of text) {
    await element.type(char);
    await page.waitForTimeout(50 + Math.random() * 100);
  }
}

// Add random mouse movements for more human-like behavior
async function addHumanBehavior(page: Page): Promise<void> {
  // Random viewport movements
  const viewport = page.viewportSize();
  if (viewport) {
    const x = Math.floor(Math.random() * viewport.width);
    const y = Math.floor(Math.random() * viewport.height);
    await page.mouse.move(x, y);
    await page.waitForTimeout(100 + Math.random() * 300);
  }
}

// Simulate tab behavior with multiple pages
async function simulateTabBehavior(context: any): Promise<Page> {
  console.log('🔄 Simulating multi-tab browsing...');
  
  // Open a few background tabs to simulate real browsing
  const backgroundPages = [];
  const backgroundUrls = [
    'https://www.google.com/search?q=broadway+shows+nyc',
    'https://www.timeout.com/newyork/theater',
    'https://www.broadway.com/'
  ];
  
  // Open 1-2 background tabs
  const numTabs = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numTabs; i++) {
    const bgPage = await context.newPage();
    await bgPage.goto(backgroundUrls[i], { waitUntil: 'domcontentloaded' });
    backgroundPages.push(bgPage);
    await bgPage.waitForTimeout(1000 + Math.random() * 2000);
  }
  
  // Create main page
  const mainPage = await context.newPage();
  
  // Randomly switch between tabs
  await mainPage.waitForTimeout(2000 + Math.random() * 3000);
  if (backgroundPages.length > 0 && Math.random() > 0.5) {
    const randomTab = backgroundPages[Math.floor(Math.random() * backgroundPages.length)];
    await randomTab.bringToFront();
    await randomTab.waitForTimeout(1000 + Math.random() * 2000);
    await mainPage.bringToFront();
  }
  
  console.log(`✅ Opened ${backgroundPages.length} background tabs`);
  return mainPage;
}

// Detect Cloudflare challenge page
async function isCloudflareChallenge(page: Page): Promise<boolean> {
  try {
    // Check for Cloudflare challenge indicators
    const challengeSelectors = [
      'text="Verifying you are human"',
      'text="Please wait while we check your browser"',
      'text="Checking your browser before accessing"',
      '[class*="cf-browser-verification"]',
      '#cf-wrapper',
      '.cf-im-under-attack'
    ];
    
    for (const selector of challengeSelectors) {
      if (await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false)) {
        return true;
      }
    }
    
    // Check URL for Cloudflare patterns
    const url = page.url();
    if (url.includes('__cf_chl_rt_tk') || url.includes('cf-browser-verification')) {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Enhanced stealth setup for browser context
async function setupStealthContext(page: Page): Promise<void> {
  // Remove webdriver property and other automation indicators
  await page.addInitScript(() => {
    // Remove webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Mock plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          name: 'Chrome PDF Plugin',
          filename: 'internal-pdf-viewer',
          description: 'Portable Document Format'
        },
        {
          name: 'Chrome PDF Viewer',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          description: ''
        }
      ],
    });
    
    // Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    
    // Mock permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
    
    // Hide automation indicators
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  });
}

// Session warming - visit main site first to establish session
async function warmSession(page: Page, targetUrl: string): Promise<void> {
  console.log('🔥 Warming session with natural browsing...');
  
  // Random referrers for more natural traffic
  const referrers = [
    'https://www.google.com/',
    'https://www.bing.com/',
    'https://www.facebook.com/',
    'https://www.instagram.com/',
    'https://www.reddit.com/r/Broadway/'
  ];
  
  const referrer = referrers[Math.floor(Math.random() * referrers.length)];
  
  // Set referrer for initial navigation
  await page.setExtraHTTPHeaders({
    'Referer': referrer
  });
  
  // Visit main Broadway Direct site first
  await page.goto('https://www.broadwaydirect.com/', { 
    waitUntil: 'networkidle',
    timeout: CONFIG.NAVIGATION_TIMEOUT 
  });
  
  console.log(`📍 Landed on main site with referrer: ${referrer}`);
  
  // Check for immediate Cloudflare challenge
  if (await isCloudflareChallenge(page)) {
    console.log('🚫 Cloudflare detected on main site - aborting warm-up');
    throw new Error('Cloudflare challenge detected during session warming');
  }
  
  // Reduced but natural browsing (30-45 seconds total)
  await addHumanBehavior(page);
  await page.waitForTimeout(3000 + Math.random() * 5000);
  
  // Quick scroll
  await page.mouse.wheel(0, 200 + Math.random() * 300);
  await page.waitForTimeout(2000 + Math.random() * 3000);
  
  // Click on Shows link if available
  try {
    const showsLink = await page.locator('a:has-text("Shows")').first();
    if (await showsLink.isVisible({ timeout: 5000 })) {
      console.log('📍 Clicking Shows link...');
      await showsLink.click();
      await page.waitForTimeout(3000 + Math.random() * 5000);
      await addHumanBehavior(page);
    }
  } catch (e) {
    console.log('Shows link not found, continuing...');
  }
  
  // Navigate to lottery section via clicking if possible
  try {
    const lotteryLink = await page.locator('a[href*="lottery"]').first();
    if (await lotteryLink.isVisible({ timeout: 5000 })) {
      console.log('📍 Clicking lottery link...');
      await lotteryLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Fallback to direct navigation
      await page.goto('https://lottery.broadwaydirect.com/', { 
        waitUntil: 'networkidle',
        timeout: CONFIG.NAVIGATION_TIMEOUT 
      });
    }
  } catch (e) {
    await page.goto('https://lottery.broadwaydirect.com/', { 
      waitUntil: 'networkidle',
      timeout: CONFIG.NAVIGATION_TIMEOUT 
    });
  }
  
  // Quick check for Cloudflare on lottery page
  if (await isCloudflareChallenge(page)) {
    console.log('🚫 Cloudflare detected on lottery page');
    throw new Error('Cloudflare challenge detected on lottery page');
  }
  
  // Brief interaction on lottery page
  await addHumanBehavior(page);
  await page.waitForTimeout(2000 + Math.random() * 3000);
  
  console.log('✅ Session warmed');
}

// Utility function to retry operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`${operationName} failed (attempt ${attempt}/${maxRetries + 1}): ${error.message}`);
      
      if (attempt <= maxRetries) {
        const delay = getRandomDelay() * attempt; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Enhanced retry for form submissions with user agent rotation
async function retryFormSubmission<T>(
  operation: (page: Page) => Promise<T>,
  page: Page,
  operationName: string,
  maxRetries: number = CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Rotate user agent on retry attempts
      if (attempt > 1) {
        const newUserAgent = getRandomUserAgent();
        await page.setUserAgent(newUserAgent);
        console.log(`🔄 Retrying with different user agent: ${newUserAgent.slice(0, 50)}...`);
      }
      
      return await operation(page);
    } catch (error) {
      lastError = error as Error;
      console.warn(`${operationName} failed (attempt ${attempt}/${maxRetries + 1}): ${error.message}`);
      
      if (attempt <= maxRetries) {
        const delay = (getRandomDelay() * attempt) + (Math.random() * 5000); // Enhanced exponential backoff
        console.log(`Retrying in ${delay.toFixed(0)}ms with fresh session...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Add extra human behavior between retries
        await addHumanBehavior(page);
      }
    }
  }
  
  throw lastError;
}

export async function broadwayDirect({ 
  browser, 
  userInfo, 
  url,
  viewport 
}: { 
  browser: Browser; 
  userInfo: UserInfo; 
  url: string;
  viewport?: { width: number; height: number };
}) {
  // Create isolated browser context for this show
  const context = await browser.newContext({
    viewport: viewport || { width: 1920, height: 1080 },
    userAgent: getRandomUserAgent(),
    // Accept cookies
    acceptDownloads: false,
    hasTouch: false,
    isMobile: false,
    javaScriptEnabled: true,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    // Additional permissions
    permissions: ['geolocation'],
    geolocation: { latitude: 40.7128, longitude: -74.0060 }, // NYC
  });
  
  // Simulate tab behavior for more natural browsing
  const page = await simulateTabBehavior(context);
  
  // Set page timeouts
  page.setDefaultTimeout(CONFIG.PAGE_TIMEOUT);
  page.setDefaultNavigationTimeout(CONFIG.NAVIGATION_TIMEOUT);
  
  // Setup enhanced stealth measures
  await setupStealthContext(page);
  
  // Extract show name from URL for screenshot naming
  const showName = url.match(/show\/([^\/]+)/)?.[1] || "unknown";
  console.log(`Processing show: ${showName} at ${url}`);
  console.log(`Config: retries=${CONFIG.MAX_RETRIES}, delay=${CONFIG.MIN_DELAY}-${CONFIG.MAX_DELAY}ms, timeout=${CONFIG.PAGE_TIMEOUT}ms`);
  
  try {
    // Warm session to avoid cold start detection
    await warmSession(page, url);
  } catch (warmError) {
    // Take screenshot on warming failure
    try {
      await page.screenshot({ 
        path: join(screenshotsDir, `${showName}-warming-error-${Date.now()}.png`),
        fullPage: true 
      });
    } catch (e) {}
    
    // If Cloudflare detected during warming, fail fast
    if (warmError.message.includes('Cloudflare')) {
      console.error(`🚫 FAIL FAST: Cloudflare blocking detected for ${showName}`);
      throw new Error(`Cloudflare blocking active - skipping ${showName}`);
    }
    throw warmError;
  }
  
  // Save cookies after warming
  const cookies = await context.cookies();
  console.log(`🍪 Saved ${cookies.length} cookies from session`);
  
  let successCount = 0;
  let failureCount = 0;
  let hrefs: (string | null)[] = []; // Declare hrefs in outer scope
  
  try {
    // Try to navigate via clicking on show link if we're on lottery page
    let navigatedViaClick = false;
    if (page.url().includes('lottery.broadwaydirect.com') && !page.url().includes('/show/')) {
      try {
        // Look for show link
        const showLink = await page.locator(`a[href*="${showName}"]`).first();
        if (await showLink.isVisible({ timeout: 3000 })) {
          console.log(`📍 Clicking on ${showName} link...`);
          await showLink.click();
          await page.waitForLoadState('networkidle');
          navigatedViaClick = true;
          
          // Add natural delay after click
          await page.waitForTimeout(2000 + Math.random() * 3000);
          await addHumanBehavior(page);
        }
      } catch (e) {
        console.log('Show link not found, using direct navigation');
      }
    }
    
    // Fallback to direct navigation if click didn't work
    if (!navigatedViaClick) {
      await retryOperation(
        () => page.goto(url, { waitUntil: 'domcontentloaded' }),
        `Navigate to ${showName} landing page`
      );
    }
    
    // Take initial screenshot
    await page.screenshot({ 
      path: join(screenshotsDir, `${showName}-landing-${Date.now()}.png`),
      fullPage: true 
    });

    // Check lottery availability (business logic - no retry needed)
    console.log(`Checking lottery availability for ${showName}...`);
    
    // Look for "Enter Now" buttons (open lotteries)
    const enterNowButtons = await page.getByRole("link", { name: /Enter Now/i }).all();
    
    // Look for closed/upcoming indicators
    const closedButtons = await page.getByRole("link", { name: /(Closed|Upcoming)/i }).all();
    const closedText = await page.getByText(/(Closed|Upcoming)/i).all();
    const totalClosedCount = closedButtons.length + closedText.length;
    
    // Calculate total lotteries on this page
    const totalLotteries = enterNowButtons.length + totalClosedCount;
    
    // Check business state
    if (enterNowButtons.length === 0) {
      // No open lotteries found
      if (totalClosedCount > 0) {
        console.log(`ℹ️  ${showName}: All ${totalClosedCount} lotteries are closed/upcoming`);
      } else {
        console.log(`ℹ️  ${showName}: No lotteries found on page`);
      }
      
      // Log summary for all closed
      console.log(`\n📊 ${showName.toUpperCase()} SUMMARY:`);
      console.log(`   ℹ️  All lotteries currently closed/upcoming`);
      console.log(`   🎯 Total lotteries: ${totalLotteries}`);
      console.log(`   📈 Status: Not Available`);
      return; // Exit gracefully - this is normal, not an error
    } else {
      // Some lotteries are open!
      if (totalClosedCount > 0) {
        console.log(`✅ ${showName}: ${enterNowButtons.length}/${totalLotteries} lotteries available (${totalClosedCount} closed/upcoming)`);
      } else {
        console.log(`✅ ${showName}: All ${enterNowButtons.length} lotteries are available`);
      }
    }
    
    // Lottery is open - get the Enter Now links with retry (for technical failures only)
    const linkData = await retryOperation(async () => {
      const links = await page.getByRole("link", { name: /Enter Now/i }).all();
      const hrefs = await Promise.all(
        links.map((link) => link.getAttribute("href"))
      );
      
      // Filter out null hrefs
      const validHrefs = hrefs.filter(href => href !== null);
      
      // This should not happen since we already found Enter Now buttons above
      if (validHrefs.length === 0) {
        throw new Error("Enter Now buttons disappeared - possible page timing issue");
      }
      
      return { links, hrefs: validHrefs };
    }, `Get lottery entry links for ${showName}`);
    
    hrefs = linkData.hrefs; // Assign to outer scope variable
    console.log(`✅ Found ${hrefs.length} open lottery entries for ${showName}`);

    // Process each lottery entry
    for (let i = 0; i < hrefs.length; i++) {
      const href = hrefs[i];
      if (!href) {
        continue;
      }
      
      console.log(`Processing entry ${i + 1}/${hrefs.length} for ${showName}`);
      
      try {
        // Use enhanced retry logic for the entire entry submission process
        await retryFormSubmission(async () => {
          // Navigate to entry form with enhanced delay
          await page.waitForTimeout(2000 + Math.random() * 3000); // Pre-navigation delay
          await page.goto(href, { waitUntil: 'domcontentloaded' });
          
          // Check for Cloudflare challenge immediately after navigation
          if (await isCloudflareChallenge(page)) {
            console.log(`🚫 Cloudflare challenge detected for ${showName} entry ${i + 1}`);
            await page.screenshot({ 
              path: join(screenshotsDir, `${showName}-cloudflare-${i}-${Date.now()}.png`),
              fullPage: true 
            });
            
            // Wait for potential challenge completion (but don't wait forever)
            console.log('⏳ Waiting for Cloudflare challenge to resolve...');
            await page.waitForTimeout(15000); // Give Cloudflare time to process
            
            // Check again if we're past the challenge
            if (await isCloudflareChallenge(page)) {
              throw new Error(`Cloudflare challenge persists for ${showName} entry ${i + 1}`);
            }
            
            console.log('✅ Cloudflare challenge resolved');
          }
          
          // Add human behavior after potential challenge
          await addHumanBehavior(page);
          await page.waitForTimeout(1000 + Math.random() * 2000);
          
          // Handle potential cookie banners
          try {
            // Common cookie banner selectors
            const cookieSelectors = [
              '[id*="cookie"] button:has-text("Accept")',
              '[id*="cookie"] button:has-text("OK")', 
              '[id*="cookie"] button:has-text("Agree")',
              '[class*="cookie"] button',
              'button:has-text("Accept Cookies")'
            ];
            
            for (const selector of cookieSelectors) {
              const cookieBtn = page.locator(selector).first();
              if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await cookieBtn.click();
                console.log(`Dismissed cookie banner for ${showName}`);
                break;
              }
            }
          } catch (error) {
            // Cookie handling is optional, continue if it fails
            console.log(`No cookie banner found for ${showName}`);
          }

          // Take screenshot of form page
          await page.screenshot({ 
            path: join(screenshotsDir, `${showName}-form-${i}-${Date.now()}.png`),
            fullPage: true 
          });

          // Validate form elements exist
          const formElements = {
            firstName: page.getByLabel("First Name"),
            lastName: page.getByLabel("Last Name"),
            tickets: page.getByLabel("Qty of Tickets Requested"),
            email: page.getByLabel("Email"),
            zip: page.getByLabel("Zip"),
            country: page.getByLabel("Country of Residence"),
            agree: page.locator("#dlslot_agree"),
            submit: page.getByLabel("Enter")
          };

          // Check if required elements exist
          await Promise.all([
            formElements.firstName.waitFor({ timeout: 5000 }),
            formElements.lastName.waitFor({ timeout: 5000 }),
            formElements.email.waitFor({ timeout: 5000 })
          ]);

          // Add human-like behavior before filling form
          await addHumanBehavior(page);
          
          // Fill out the form with human-like typing and random delays
          await formElements.firstName.click();
          await page.waitForTimeout(200 + Math.random() * 300);
          await formElements.firstName.fill(userInfo.firstName);
          await page.waitForTimeout(300 + Math.random() * 500);
          
          await formElements.lastName.click();
          await page.waitForTimeout(150 + Math.random() * 250);
          await formElements.lastName.fill(userInfo.lastName);
          await page.waitForTimeout(200 + Math.random() * 400);
          
          await formElements.tickets.click();
          await page.waitForTimeout(100 + Math.random() * 200);
          await formElements.tickets.selectOption(userInfo.numberOfTickets);
          await page.waitForTimeout(250 + Math.random() * 350);
          
          await formElements.email.click();
          await page.waitForTimeout(180 + Math.random() * 320);
          await formElements.email.fill(userInfo.email);
          await page.waitForTimeout(200 + Math.random() * 400);

          // Enter Date of Birth with human-like delays
          const dobMonth = page.locator("#dlslot_dob_month");
          const dobDay = page.locator("#dlslot_dob_day");
          const dobYear = page.locator("#dlslot_dob_year");
          
          await dobMonth.waitFor({ timeout: 5000 });
          await dobMonth.click();
          await page.waitForTimeout(120 + Math.random() * 180);
          await dobMonth.fill(userInfo.dateOfBirth.month);
          await page.waitForTimeout(150 + Math.random() * 250);
          
          await dobDay.click();
          await page.waitForTimeout(100 + Math.random() * 150);
          await dobDay.fill(userInfo.dateOfBirth.day);
          await page.waitForTimeout(120 + Math.random() * 200);
          
          await dobYear.click();
          await page.waitForTimeout(110 + Math.random() * 160);
          await dobYear.fill(userInfo.dateOfBirth.year);
          await page.waitForTimeout(200 + Math.random() * 300);

          await formElements.zip.click();
          await page.waitForTimeout(130 + Math.random() * 220);
          await formElements.zip.fill(userInfo.zip);
          await page.waitForTimeout(180 + Math.random() * 280);
          
          await formElements.country.click();
          await page.waitForTimeout(150 + Math.random() * 250);
          await formElements.country.selectOption({ label: userInfo.countryOfResidence });
          await page.waitForTimeout(200 + Math.random() * 300);

          // Add another human behavior before final actions
          await addHumanBehavior(page);
          
          // Agree to terms with human-like delay
          await formElements.agree.click({ force: true });
          await page.waitForTimeout(400 + Math.random() * 600);

          // Take screenshot before submission
          await page.screenshot({ 
            path: join(screenshotsDir, `${showName}-before-submit-${i}-${Date.now()}.png`),
            fullPage: true 
          });

          // Check for dry run mode
          if (process.env.DRY_RUN === 'true') {
            console.log(`[DRY RUN] Would submit entry ${i + 1} for ${showName} (skipping actual submission)`);
          } else {
            // Submit the form
            await formElements.submit.click();
            // Wait for potential redirect or confirmation
            await page.waitForTimeout(2000);
          }
        }, `Submit entry ${i + 1} for ${showName}`);
        
        successCount++;
        console.log(`✅ Successfully submitted entry ${i + 1} for ${showName}`);

        // Wait for a configurable random timeout to avoid spamming
        const delay = getRandomDelay();
        console.log(`Waiting ${delay}ms before next entry...`);
        await page.waitForTimeout(delay);
        
      } catch (entryError) {
        failureCount++;
        const errorMessage = entryError.message;
        
        // Enhanced error categorization
        if (errorMessage.includes('Cloudflare')) {
          console.error(`🚫 CLOUDFLARE BLOCKED: Entry ${i + 1} for ${showName} - ${errorMessage}`);
          console.error(`💡 Consider adjusting anti-detection settings or retry timing`);
        } else if (errorMessage.includes('timeout')) {
          console.error(`⏰ TIMEOUT: Entry ${i + 1} for ${showName} - ${errorMessage}`);
        } else {
          console.error(`❌ Failed to submit entry ${i + 1} for ${showName} after ${CONFIG.MAX_RETRIES + 1} attempts: ${errorMessage}`);
        }
        
        // Take error screenshot
        try {
          await page.screenshot({ 
            path: join(screenshotsDir, `${showName}-error-${i}-${Date.now()}.png`),
            fullPage: true 
          });
        } catch (screenshotError) {
          console.warn(`Could not capture error screenshot: ${screenshotError.message}`);
        }
        
        // Continue with next entry instead of failing completely
        continue;
      }
    }
    
    // Log summary for this show
    const totalEntries = hrefs.length;
    console.log(`\n📊 ${showName.toUpperCase()} SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}/${totalEntries}`);
    console.log(`   ❌ Failed: ${failureCount}/${totalEntries}`);
    console.log(`   📈 Success Rate: ${totalEntries > 0 ? Math.round((successCount / totalEntries) * 100) : 0}%`);
    
  } catch (error) {
    const totalEntries = hrefs.length || 1; // Use the outer scope hrefs variable
    failureCount = totalEntries; // Count all as failures if fatal error
    console.error(`💥 Fatal error processing ${showName}: ${error.message}`);
    
    // Take error screenshot
    try {
      await page.screenshot({ 
        path: join(screenshotsDir, `${showName}-fatal-error-${Date.now()}.png`),
        fullPage: true 
      });
    } catch (screenshotError) {
      console.warn(`Could not capture fatal error screenshot: ${screenshotError.message}`);
    }
    
    // Log final summary even on fatal error
    console.log(`\n📊 ${showName.toUpperCase()} SUMMARY (FAILED):`);
    console.log(`   ❌ Fatal error occurred`);
    console.log(`   🎯 Total entries: ${totalEntries}`);
    console.log(`   📈 Success Rate: 0%`);
    
    throw error;
  } finally {
    // Close context instead of browser (browser stays open for other tests)
    await context.close();
  }
}
