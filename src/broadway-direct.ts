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

// Ensure screenshots directory exists
const screenshotsDir = join(process.cwd(), "screenshots");
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

// Utility function for configurable random delay
function getRandomDelay(): number {
  return Math.floor(Math.random() * (CONFIG.MAX_DELAY - CONFIG.MIN_DELAY + 1)) + CONFIG.MIN_DELAY;
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
        const delay = getRandomDelay();
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
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
  const page = await browser.newPage();
  
  // Set page timeouts
  page.setDefaultTimeout(CONFIG.PAGE_TIMEOUT);
  page.setDefaultNavigationTimeout(CONFIG.NAVIGATION_TIMEOUT);
  
  // Extract show name from URL for screenshot naming
  const showName = url.match(/show\/([^\/]+)/)?.[1] || "unknown";
  console.log(`Processing show: ${showName} at ${url}`);
  console.log(`Config: retries=${CONFIG.MAX_RETRIES}, delay=${CONFIG.MIN_DELAY}-${CONFIG.MAX_DELAY}ms, timeout=${CONFIG.PAGE_TIMEOUT}ms`);
  
  let successCount = 0;
  let failureCount = 0;
  
  try {
    // Navigate to landing page with retry
    await retryOperation(
      () => page.goto(url, { waitUntil: 'domcontentloaded' }),
      `Navigate to ${showName} landing page`
    );
    
    // Take initial screenshot
    await page.screenshot({ 
      path: join(screenshotsDir, `${showName}-landing-${Date.now()}.png`),
      fullPage: true 
    });

    // Find lottery entry links with retry
    const { links, hrefs } = await retryOperation(async () => {
      const links = await page.getByRole("link", { name: /Enter/i }).all();
      const hrefs = await Promise.all(
        links.map((link) => link.getAttribute("href"))
      );
      
      // Validate that we found lottery links
      if (hrefs.length === 0) {
        throw new Error("No lottery entry links found - page may have changed");
      }
      
      return { links, hrefs };
    }, `Find lottery entry links for ${showName}`);
    
    console.log(`Found ${hrefs.length} lottery entries for ${showName}`);

    for (let i = 0; i < hrefs.length; i++) {
      const href = hrefs[i];
      if (!href) {
        continue;
      }
      
      console.log(`Processing entry ${i + 1}/${hrefs.length} for ${showName}`);
      
      try {
        // Use retry logic for the entire entry submission process
        await retryOperation(async () => {
          // Navigate to entry form
          await page.goto(href, { waitUntil: 'domcontentloaded' });

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

          // Fill out the form with delays
          await formElements.firstName.fill(userInfo.firstName);
          await page.waitForTimeout(100);
          
          await formElements.lastName.fill(userInfo.lastName);
          await page.waitForTimeout(100);
          
          await formElements.tickets.selectOption(userInfo.numberOfTickets);
          await page.waitForTimeout(100);
          
          await formElements.email.fill(userInfo.email);
          await page.waitForTimeout(100);

          // Enter Date of Birth with validation
          const dobMonth = page.locator("#dlslot_dob_month");
          const dobDay = page.locator("#dlslot_dob_day");
          const dobYear = page.locator("#dlslot_dob_year");
          
          await dobMonth.waitFor({ timeout: 5000 });
          await dobMonth.fill(userInfo.dateOfBirth.month);
          await page.waitForTimeout(100);
          
          await dobDay.fill(userInfo.dateOfBirth.day);
          await page.waitForTimeout(100);
          
          await dobYear.fill(userInfo.dateOfBirth.year);
          await page.waitForTimeout(100);

          await formElements.zip.fill(userInfo.zip);
          await page.waitForTimeout(100);
          
          await formElements.country.selectOption({ label: userInfo.countryOfResidence });
          await page.waitForTimeout(100);

          // Agree to terms
          await formElements.agree.check({ force: true });
          await page.waitForTimeout(200);

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
        console.error(`❌ Failed to submit entry ${i + 1} for ${showName} after ${CONFIG.MAX_RETRIES + 1} attempts: ${entryError.message}`);
        
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
    failureCount = hrefs?.length || 1; // If we failed before finding hrefs, count as 1 failure
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
    console.log(`   📈 Success Rate: 0%`);
    
    throw error;
  } finally {
    await browser.close();
  }
}
