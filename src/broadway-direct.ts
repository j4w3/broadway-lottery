import { Browser, Page } from "playwright";
import { UserInfo } from "./types";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

// Configuration constants - more human-like defaults
const CONFIG = {
  // Number of retry attempts for failed operations (only for technical issues, not Cloudflare)
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || "1"), // Reduced retries since we fail fast on Cloudflare
  // Base timeout for page operations (ms)
  PAGE_TIMEOUT: parseInt(process.env.PAGE_TIMEOUT || "45000"), // Increased for more patient behavior
  // Random delay range (ms) - much more human-like
  MIN_DELAY: parseInt(process.env.MIN_DELAY || "5000"), // Minimum 5 seconds between entries
  MAX_DELAY: parseInt(process.env.MAX_DELAY || "12000"), // Maximum 12 seconds between entries
  // Network timeout for navigation
  NAVIGATION_TIMEOUT: parseInt(process.env.NAVIGATION_TIMEOUT || "90000"), // Increased patience
};

// Note: User agent rotation now handled automatically by Camoufox

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
  try {
    // Check if page is still valid
    if (!page || page.isClosed()) {
      console.log('⚠️ Page context invalid, skipping human behavior simulation');
      return;
    }
    
    // Random viewport movements - use default viewport dimensions
    const viewport = { width: 1920, height: 1080 }; // Default fallback
    const x = Math.floor(Math.random() * viewport.width);
    const y = Math.floor(Math.random() * viewport.height);
    
    // Safely attempt mouse movement
    if (page.mouse) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(100 + Math.random() * 300);
    }
  } catch (error) {
    console.log('⚠️ Human behavior simulation error:', error.message);
    // Continue execution even if mouse movement fails
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
      'text="This may take a few seconds"',
      'text="Please wait while we check your browser"',
      'text="Checking your browser before accessing"',
      'text="needs to review the security of your connection"',
      'text="Performance & security by Cloudflare"',
      '[class*="cf-browser-verification"]',
      '#cf-wrapper',
      '.cf-im-under-attack',
      'text="Ray ID:"'
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
    
    // Check page title for Cloudflare patterns
    const title = await page.title();
    if (title.includes('Just a moment') || title.includes('Checking your browser')) {
      return true;
    }
    
    // Check for blank page (complete block)
    const bodyText = await page.locator('body').textContent();
    if (bodyText && bodyText.trim().length < 50 && url.includes('lottery.broadwaydirect.com')) {
      // Very little content on what should be a content-rich page
      console.log('Detected possible blank page block');
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// More natural delay between entries to avoid appearing automated
async function waitBetweenEntries(showName: string, entryNumber: number): Promise<void> {
  const delay = getRandomDelay();
  console.log(`⏳ Waiting ${delay/1000}s before next entry for ${showName}... (human pacing)`);
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Simulate realistic human behavior on landing pages before entering lotteries
async function simulateHumanLandingPageBehavior(page: Page, showName: string): Promise<void> {
  console.log(`👀 Simulating human browsing behavior on ${showName} landing page...`);
  
  try {
    // Extended reading time - humans spend time reading show info
    console.log(`📖 Reading show information for ${showName}...`);
    await page.waitForTimeout(3000 + Math.random() * 5000); // 3-8 seconds initial read
    
    // Realistic scrolling behavior
    console.log(`📜 Scrolling through ${showName} page content...`);
    const viewportHeight = 1080; // Default viewport height
    
    // Scroll down slowly like a human reading
    for (let i = 0; i < 3; i++) {
      const scrollAmount = 200 + Math.random() * 300; // 200-500px
      await page.mouse.wheel(0, scrollAmount);
      await page.waitForTimeout(1000 + Math.random() * 2000); // Pause to "read"
      
      // DISABLED: Random mouse movements for Camoufox native testing
      // await addHumanBehavior(page);
    }
    
    // Scroll back to top to see lottery options
    await page.mouse.wheel(0, -800);
    await page.waitForTimeout(1000 + Math.random() * 2000);
    
    // Simulate examining lottery options - hover over lottery information
    console.log(`🎟️ Examining lottery options for ${showName}...`);
    
    // Look for lottery container elements to hover over
    const lotteryContainers = await page.locator('[class*="lottery"], [class*="entry"], .entry-item, [id*="lottery"]').all();
    
    if (lotteryContainers.length > 0) {
      // Hover over 1-2 lottery containers as if examining them
      const containersToExamine = Math.min(2, lotteryContainers.length);
      for (let i = 0; i < containersToExamine; i++) {
        try {
          await lotteryContainers[i].hover();
          await page.waitForTimeout(2000 + Math.random() * 3000); // 2-5 seconds examining
          console.log(`🔍 Examined lottery option ${i + 1} for ${showName}`);
        } catch (error) {
          // Continue if hover fails
        }
      }
    }
    
    // Final decision-making pause
    console.log(`🤔 Making entry decision for ${showName}...`);
    await page.waitForTimeout(2000 + Math.random() * 4000); // 2-6 seconds deciding
    
    console.log(`✅ Completed realistic browsing simulation for ${showName} (total ~15-30 seconds)`);
    
  } catch (error) {
    console.log(`⚠️ Error during landing page simulation for ${showName}: ${error.message}`);
    // Continue anyway - this is enhancement, not critical
  }
}

// Human-like approach to clicking "Enter Now" buttons with realistic decision process
async function clickEnterButtonWithHumanBehavior(page: Page, showName: string, buttonIndex: number): Promise<string | null> {
  console.log(`🎯 Approaching entry ${buttonIndex + 1} for ${showName} with human-like behavior...`);
  
  try {
    // Get the Enter Now button
    const enterButtons = await page.getByRole("link", { name: /Enter Now/i }).all();
    if (buttonIndex >= enterButtons.length) {
      throw new Error(`Button ${buttonIndex + 1} not found`);
    }
    
    const button = enterButtons[buttonIndex];
    
    // Human-like approach: move mouse toward button area first
    console.log(`🖱️ Moving mouse toward entry button ${buttonIndex + 1} for ${showName}...`);
    const buttonBox = await button.boundingBox();
    if (buttonBox) {
      // Move mouse near the button (not exactly on it yet)
      const nearX = buttonBox.x + buttonBox.width * 0.3;
      const nearY = buttonBox.y + buttonBox.height * 0.3;
      await page.mouse.move(nearX, nearY);
      await page.waitForTimeout(500 + Math.random() * 1000); // Pause as if locating button
      
      // Now hover over the button
      await button.hover();
      console.log(`⏸️ Hovering over entry button ${buttonIndex + 1} for ${showName}...`);
      await page.waitForTimeout(1000 + Math.random() * 2000); // 1-3 seconds hover (human decision time)
    }
    
    // Final decision pause before clicking
    console.log(`💭 Final decision pause before entering ${showName} lottery ${buttonIndex + 1}...`);
    await page.waitForTimeout(800 + Math.random() * 1500); // 0.8-2.3 seconds final decision
    
    // Get the href before clicking
    const href = await button.getAttribute("href");
    
    // Click with human timing
    console.log(`🖱️ Clicking Enter Now button for ${showName} entry ${buttonIndex + 1}...`);
    await button.click();
    
    return href;
    
  } catch (error) {
    console.log(`⚠️ Error with human-like button click for ${showName}: ${error.message}`);
    throw error;
  }
}

// Enhanced debugging function to capture page state
async function capturePageState(page: Page, showName: string, stage: string, entryIndex?: number): Promise<void> {
  try {
    const timestamp = Date.now();
    const entryStr = entryIndex !== undefined ? `-${entryIndex}` : '';
    const screenshotPath = join(screenshotsDir, `${showName}-${stage}${entryStr}-${timestamp}.png`);
    
    console.log(`📸 Capturing ${stage} state for ${showName}${entryIndex ? ` entry ${entryIndex}` : ''}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    // Log comprehensive page state
    const url = page.url();
    const title = await page.title().catch(() => 'Unable to get title');
    const userAgent = await page.evaluate(() => navigator.userAgent).catch(() => 'Unable to get UA');
    
    console.log(`📊 Page State [${stage}]:`);
    console.log(`   🔗 URL: ${url}`);
    console.log(`   📄 Title: ${title}`);
    console.log(`   🤖 User Agent: ${userAgent.slice(0, 80)}...`);
    
    // Check for common error indicators (be more specific to avoid false positives)
    const bodyText = await page.locator('body').textContent().catch(() => '');
    const hasCloudflare = bodyText.includes('Cloudflare') || bodyText.includes('Just a moment') || bodyText.includes('Verifying you are human');
    // More specific error detection - avoid false positives from normal page content
    const hasError = bodyText.includes('Error 404') || bodyText.includes('Error 500') || bodyText.includes('Internal Server Error') || bodyText.includes('Not Found');
    const isEmpty = bodyText.trim().length < 100;
    
    if (hasCloudflare) console.log(`   🚫 Cloudflare indicators detected`);
    if (hasError) console.log(`   ❌ Error indicators detected`);
    if (isEmpty) console.log(`   ⚠️ Page appears nearly empty (${bodyText.trim().length} chars)`);
    
    // Log visible form elements if this is a form page
    if (stage.includes('form') || stage.includes('entry')) {
      await logFormElementsState(page, showName, entryIndex);
    }
    
    console.log(`   📸 Screenshot saved: ${screenshotPath}`);
    
  } catch (error) {
    console.log(`⚠️ Error capturing page state for ${stage}: ${error.message}`);
  }
}

// Log form elements state for debugging
async function logFormElementsState(page: Page, showName: string, entryIndex?: number): Promise<void> {
  console.log(`📝 Form Elements State for ${showName}${entryIndex ? ` entry ${entryIndex}` : ''}:`);
  
  const formElements = [
    { name: 'firstName', selector: '#dlslot_name_first' },
    { name: 'lastName', selector: '#dlslot_name_last' },
    { name: 'tickets', selector: '#dlslot_ticket_qty' },
    { name: 'email', selector: '#dlslot_email' },
    { name: 'zip', selector: '#dlslot_zip' },
    { name: 'country', selector: '#dlslot_country' },
    { name: 'dobMonth', selector: '#dlslot_dob_month' },
    { name: 'dobDay', selector: '#dlslot_dob_day' },
    { name: 'dobYear', selector: '#dlslot_dob_year' },
    { name: 'agree', selector: '#dlslot_agree' },
    { name: 'submit', selector: 'input[type="submit"]' }
  ];
  
  for (const element of formElements) {
    try {
      const locator = page.locator(element.selector);
      const isVisible = await locator.isVisible({ timeout: 1000 }).catch(() => false);
      const isEnabled = isVisible ? await locator.isEnabled().catch(() => false) : false;
      const value = isVisible ? await locator.inputValue().catch(() => 'N/A') : 'N/A';
      
      const status = isVisible ? (isEnabled ? '✅' : '🔒') : '❌';
      console.log(`   ${status} ${element.name} (${element.selector}): ${isVisible ? 'visible' : 'not found'}${isEnabled ? ', enabled' : ''}${value !== 'N/A' && value ? `, value: "${value}"` : ''}`);
    } catch (error) {
      console.log(`   ⚠️ ${element.name}: Error checking - ${error.message}`);
    }
  }
}

// Note: Stealth measures now handled automatically by Camoufox at C++ level

// Handle email signup modal that blocks navigation completion
async function dismissEmailModal(page: Page): Promise<boolean> {
  try {
    console.log('🔍 Checking for email signup modal...');
    
    // Common modal selectors for "BE THE FIRST TO KNOW" popup
    const modalSelectors = [
      '[class*="modal"] button[class*="close"]',
      '[class*="modal"] [aria-label="Close"]',
      '[class*="modal"] .close',
      '[class*="popup"] button[class*="close"]',
      'button:has-text("×")',
      'button:has-text("Close")',
      '[data-dismiss="modal"]',
      '.modal-close',
      '#modal-close'
    ];
    
    // Wait briefly for modal to appear
    await page.waitForTimeout(2000);
    
    // Try to find and close the modal
    for (const selector of modalSelectors) {
      const closeButton = page.locator(selector).first();
      if (await closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`📱 Found modal close button: ${selector}`);
        await closeButton.click();
        await page.waitForTimeout(1000); // Wait for modal to close
        console.log('✅ Email modal dismissed');
        return true;
      }
    }
    
    // Try clicking outside modal to dismiss
    await page.mouse.click(100, 100);
    await page.waitForTimeout(500);
    
    console.log('ℹ️ No modal found or could not dismiss');
    return false;
  } catch (error) {
    console.log(`⚠️ Modal dismissal error: ${error.message}`);
    return false;
  }
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

// Human-like form submission with prevention-first approach
async function submitFormWithHumanBehavior(
  page: Page,
  userInfo: UserInfo,
  showName: string,
  entryIndex: number
): Promise<void> {
  // Capture initial form state with comprehensive debugging
  await capturePageState(page, showName, 'form-initial', entryIndex);

  // Validate form elements exist using actual HTML IDs
  const formElements = {
    firstName: page.locator("#dlslot_name_first"),
    lastName: page.locator("#dlslot_name_last"),
    tickets: page.locator("#dlslot_ticket_qty"),
    email: page.locator("#dlslot_email"),
    zip: page.locator("#dlslot_zip"),
    country: page.locator("#dlslot_country"),
    agree: page.locator("#dlslot_agree"),
    submit: page.locator('input[type="submit"]')
  };

  // Check if required elements exist (fail fast if not)
  await Promise.all([
    formElements.firstName.waitFor({ timeout: 10000 }),
    formElements.lastName.waitFor({ timeout: 10000 }),
    formElements.email.waitFor({ timeout: 10000 })
  ]);

  // More human-like behavior: pause and "read" the form
  console.log(`📝 Reading form for ${showName} entry ${entryIndex}...`);
  // DISABLED: Form reading delay and behavior for Camoufox native testing
  // await page.waitForTimeout(2000 + Math.random() * 3000);
  // await addHumanBehavior(page);
  
  // Fill out the form - DISABLED delays for Camoufox native testing
  await formElements.firstName.click();
  // await page.waitForTimeout(300 + Math.random() * 500);
  await formElements.firstName.fill(userInfo.firstName);
  // await page.waitForTimeout(500 + Math.random() * 800);
  
  await formElements.lastName.click();
  // await page.waitForTimeout(250 + Math.random() * 400);
  await formElements.lastName.fill(userInfo.lastName);
  // await page.waitForTimeout(400 + Math.random() * 600);
  
  await formElements.tickets.click();
  await page.waitForTimeout(200 + Math.random() * 300);
  await formElements.tickets.selectOption(userInfo.numberOfTickets);
  await page.waitForTimeout(400 + Math.random() * 600);
  
  await formElements.email.click();
  // await page.waitForTimeout(300 + Math.random() * 500);
  await formElements.email.fill(userInfo.email);
  // await page.waitForTimeout(500 + Math.random() * 700);

  // Enter Date of Birth with realistic human delays
  const dobMonth = page.locator("#dlslot_dob_month");
  const dobDay = page.locator("#dlslot_dob_day");
  const dobYear = page.locator("#dlslot_dob_year");
  
  await dobMonth.waitFor({ timeout: 5000 });
  await dobMonth.click();
  // await page.waitForTimeout(200 + Math.random() * 300);
  await dobMonth.fill(userInfo.dateOfBirth.month);
  // await page.waitForTimeout(300 + Math.random() * 400);
  
  await dobDay.click();
  // await page.waitForTimeout(150 + Math.random() * 250);
  await dobDay.fill(userInfo.dateOfBirth.day);
  // await page.waitForTimeout(250 + Math.random() * 350);
  
  await dobYear.click();
  // await page.waitForTimeout(200 + Math.random() * 300);
  await dobYear.fill(userInfo.dateOfBirth.year);
  // await page.waitForTimeout(400 + Math.random() * 600);

  await formElements.zip.click();
  // await page.waitForTimeout(250 + Math.random() * 400);
  await formElements.zip.fill(userInfo.zip);
  // await page.waitForTimeout(300 + Math.random() * 500);
  
  await formElements.country.click();
  // await page.waitForTimeout(200 + Math.random() * 400);
  // Use the actual option values from HTML: USA=2, CANADA=3, OTHER=5
  const countryValue = userInfo.countryOfResidence === 'USA' ? '2' : 
                      userInfo.countryOfResidence === 'CANADA' ? '3' : '5';
  await formElements.country.selectOption(countryValue);
  await page.waitForTimeout(400 + Math.random() * 600);

  // DISABLED: Form review behavior for Camoufox native testing
  console.log(`👀 Reviewing form for ${showName} entry ${entryIndex}...`);
  // await addHumanBehavior(page);
  // await page.waitForTimeout(1000 + Math.random() * 2000);
  
  // Agree to terms
  await formElements.agree.click({ force: true });
  // await page.waitForTimeout(800 + Math.random() * 1200);

  // Capture form state before submission
  await capturePageState(page, showName, 'form-filled', entryIndex);

  // Check for dry run mode
  if (process.env.DRY_RUN === 'true') {
    console.log(`[DRY RUN] Would submit entry ${entryIndex} for ${showName} (skipping actual submission)`);
  } else {
    // DISABLED: Final pause before submitting for Camoufox native testing
    console.log(`🎯 Submitting entry ${entryIndex} for ${showName}...`);
    // await page.waitForTimeout(500 + Math.random() * 1000);
    
    // Submit the form
    await formElements.submit.click();
    console.log(`📤 Submit button clicked for ${showName} entry ${entryIndex}`);
    
    // DISABLED: Wait after submission for Camoufox native testing
    // await page.waitForTimeout(3000 + Math.random() * 2000);
    await page.waitForTimeout(2000); // Minimal wait for page processing
    await capturePageState(page, showName, 'form-submitted', entryIndex);
  }
}

// Enhanced retry for form submissions with user agent rotation (legacy function for backward compatibility)
async function retryFormSubmission<T>(
  operation: (page: Page) => Promise<T>,
  page: Page,
  operationName: string,
  maxRetries: number = CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Note: User agent rotation handled automatically by Camoufox
      return await operation(page);
    } catch (error) {
      lastError = error as Error;
      console.warn(`${operationName} failed (attempt ${attempt}/${maxRetries + 1}): ${error.message}`);
      
      if (attempt <= maxRetries) {
        const delay = (getRandomDelay() * attempt) + (Math.random() * 5000); // Enhanced exponential backoff
        console.log(`Retrying in ${delay.toFixed(0)}ms with fresh session...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // DISABLED: Extra human behavior between retries for Camoufox native testing
        // await addHumanBehavior(page);
      }
    }
  }
  
  throw lastError;
}

export async function broadwayDirect({ 
  browser, 
  userInfo, 
  url 
}: { 
  browser: Browser; 
  userInfo: UserInfo; 
  url: string;
}) {
  // Create isolated browser context - Camoufox automatically handles fingerprinting
  const context = await browser.newContext({
    // Camoufox handles viewport, userAgent, locale, timezone automatically
    // Only set essential non-fingerprint settings
    acceptDownloads: false,
    javaScriptEnabled: true,
  });
  
  // DISABLED: Multi-tab browsing simulation for Camoufox native testing  
  // const page = await simulateTabBehavior(context);
  const page = await context.newPage();
  
  // Set page timeouts
  page.setDefaultTimeout(CONFIG.PAGE_TIMEOUT);
  page.setDefaultNavigationTimeout(CONFIG.NAVIGATION_TIMEOUT);
  
  // Note: Stealth measures automatically handled by Camoufox
  
  // Extract show name from URL for screenshot naming
  const showName = url.match(/show\/([^\/]+)/)?.[1] || "unknown";
  console.log(`Processing show: ${showName} at ${url}`);
  console.log(`Config: retries=${CONFIG.MAX_RETRIES}, delay=${CONFIG.MIN_DELAY}-${CONFIG.MAX_DELAY}ms, timeout=${CONFIG.PAGE_TIMEOUT}ms`);
  
  // Skip session warming - go directly to lottery page
  console.log(`🎯 Going directly to ${showName} lottery page...`);
  
  let successCount = 0;
  let failureCount = 0;
  let enterNowButtons: any[] = []; // Declare enterNowButtons in outer scope
  
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
          
          // DISABLED: Natural delay and behavior after click for Camoufox native testing
          // await page.waitForTimeout(2000 + Math.random() * 3000);
          // await addHumanBehavior(page);
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
    
    // Handle any modals on the show landing page
    await dismissEmailModal(page);
    
    // Capture landing page state after modal handling
    await capturePageState(page, showName, 'landing-ready');

    // Check for Cloudflare challenge after navigation
    console.log(`Checking for Cloudflare challenge on ${showName} page...`);
    const isCloudflare = await isCloudflareChallenge(page);
    if (isCloudflare) {
      console.log('🚫 CLOUDFLARE DETECTED - Page blocked by verification');
      throw new Error('Cloudflare challenge detected on lottery page');
    }

    // Log page state for diagnosis
    console.log(`📄 Page title: ${await page.title()}`);
    console.log(`🔗 Current URL: ${page.url()}`);

    // Check lottery availability (business logic - no retry needed)
    console.log(`Checking lottery availability for ${showName}...`);
    
    // Look for "Enter Now" buttons (open lotteries)
    enterNowButtons = await page.getByRole("link", { name: /Enter Now/i }).all();
    
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
        // Capture detailed state when no lotteries found for debugging
        await capturePageState(page, showName, 'no-lotteries');
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
    
    // DISABLED: Human behavior simulation for Camoufox native testing
    // await simulateHumanLandingPageBehavior(page, showName);
    
    // Capture state after navigation (no human behavior simulation)
    await capturePageState(page, showName, 'post-navigation');
    
    console.log(`✅ Found ${enterNowButtons.length} open lottery entries for ${showName}`);

    // Process each lottery entry with enhanced human behavior
    for (let i = 0; i < enterNowButtons.length; i++) {
      console.log(`Processing entry ${i + 1}/${enterNowButtons.length} for ${showName}`);
      
      try {
        // Use human-like button clicking approach instead of direct navigation
        console.log(`🎯 Using human-like approach for entry ${i + 1} for ${showName}...`);
        
        // DISABLED: Inter-entry delay for Camoufox native testing
        // if (i > 0) {
        //   console.log(`⏸️ Brief pause between entries for ${showName}...`);
        //   await page.waitForTimeout(3000 + Math.random() * 5000); // 3-8 seconds between entries
        // }
        
        // DISABLED: Human-like button clicking for Camoufox native testing
        // const href = await clickEnterButtonWithHumanBehavior(page, showName, i);
        
        // Standard button clicking
        const enterButtons = await page.getByRole("link", { name: /Enter Now/i }).all();
        if (i >= enterButtons.length) {
          throw new Error(`Button ${i + 1} not found`);
        }
        await enterButtons[i].click();
        console.log(`🖱️ Clicked Enter Now button ${i + 1} for ${showName}`);
        
        // Wait for navigation to complete
        await page.waitForLoadState('domcontentloaded');
        console.log(`📍 Navigation completed for ${showName} entry ${i + 1}`);
        
        // Check for Cloudflare challenge
        if (await isCloudflareChallenge(page)) {
          console.log(`🚫 CLOUDFLARE CHALLENGE DETECTED for ${showName} entry ${i + 1}`);
          await capturePageState(page, showName, 'cloudflare', i + 1);
          throw new Error(`Cloudflare challenge detected for ${showName} entry ${i + 1}`);
        }
        
        // Capture navigation success state
        await capturePageState(page, showName, 'entry-navigated', i + 1);
        
        // Handle any modals on the form page
        await dismissEmailModal(page);
        
        // Handle potential cookie banners quietly
        try {
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
        }

        // Use the new human-like form submission approach
        await submitFormWithHumanBehavior(page, userInfo, showName, i + 1);
        
        successCount++;
        console.log(`✅ Successfully submitted entry ${i + 1} for ${showName}`);

        // Human-like delay before next entry
        await waitBetweenEntries(showName, i + 1);
        
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
        
        // Capture error state with detailed debugging
        try {
          await capturePageState(page, showName, 'error', i + 1);
        } catch (screenshotError) {
          console.warn(`Could not capture error state: ${screenshotError.message}`);
        }
        
        // Continue with next entry instead of failing completely
        continue;
      }
    }
    
    // Log summary for this show
    const totalEntries = enterNowButtons.length;
    console.log(`\n📊 ${showName.toUpperCase()} SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}/${totalEntries}`);
    console.log(`   ❌ Failed: ${failureCount}/${totalEntries}`);
    console.log(`   📈 Success Rate: ${totalEntries > 0 ? Math.round((successCount / totalEntries) * 100) : 0}%`);
    
  } catch (error) {
    const totalEntries = enterNowButtons.length || 1; // Use the correct buttons array
    failureCount = totalEntries; // Count all as failures if fatal error
    console.error(`💥 Fatal error processing ${showName}: ${error.message}`);
    
    // Capture fatal error state with debugging info
    try {
      await capturePageState(page, showName, 'fatal-error');
    } catch (screenshotError) {
      console.warn(`Could not capture fatal error state: ${screenshotError.message}`);
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
