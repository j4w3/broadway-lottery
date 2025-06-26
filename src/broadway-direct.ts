import { Browser, Page } from "playwright";
import { UserInfo } from "./types";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

// Ensure screenshots directory exists
const screenshotsDir = join(process.cwd(), "screenshots");
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
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
  
  // Extract show name from URL for screenshot naming
  const showName = url.match(/show\/([^\/]+)/)?.[1] || "unknown";
  console.log(`Processing show: ${showName} at ${url}`);
  
  try {
    await page.goto(url);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: join(screenshotsDir, `${showName}-landing-${Date.now()}.png`),
      fullPage: true 
    });

    const links = await page.getByRole("link", { name: /Enter/i }).all();
    const hrefs = await Promise.all(
      links.map((link) => link.getAttribute("href"))
    );
    
    console.log(`Found ${hrefs.length} lottery entries for ${showName}`);

    for (let i = 0; i < hrefs.length; i++) {
      const href = hrefs[i];
      if (!href) {
        continue;
      }
      
      console.log(`Processing entry ${i + 1}/${hrefs.length} for ${showName}`);
      
      try {
        await page.goto(href);

        // Take screenshot of form page
        await page.screenshot({ 
          path: join(screenshotsDir, `${showName}-form-${i}-${Date.now()}.png`),
          fullPage: true 
        });

        // Fill out the form
        await page.getByLabel("First Name").fill(userInfo.firstName);
        await page.getByLabel("Last Name").fill(userInfo.lastName);
        await page
          .getByLabel("Qty of Tickets Requested")
          .selectOption(userInfo.numberOfTickets);
        await page.getByLabel("Email").fill(userInfo.email);

        // Enter Date of Birth
        await page.locator("#dlslot_dob_month").fill(userInfo.dateOfBirth.month);
        await page.locator("#dlslot_dob_day").fill(userInfo.dateOfBirth.day);
        await page.locator("#dlslot_dob_year").fill(userInfo.dateOfBirth.year);

        await page.getByLabel("Zip").fill(userInfo.zip);
        await page
          .getByLabel("Country of Residence")
          .selectOption({ label: userInfo.countryOfResidence });

        // Agree to terms
        await page.locator("#dlslot_agree").check({ force: true });

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
          await page.getByLabel("Enter").click();
          console.log(`Successfully submitted entry ${i + 1} for ${showName}`);
        }

        // Wait for a random timeout to avoid spamming the API
        const breakTime = Math.floor(Math.random() * 1000) + 1;
        await page.waitForTimeout(breakTime);
        
      } catch (entryError) {
        console.error(`Error processing entry ${i + 1} for ${showName}: ${entryError.message}`);
        
        // Take error screenshot
        await page.screenshot({ 
          path: join(screenshotsDir, `${showName}-error-${i}-${Date.now()}.png`),
          fullPage: true 
        });
        
        // Continue with next entry instead of failing completely
        continue;
      }
    }
    
  } catch (error) {
    console.error(`Fatal error processing ${showName}: ${error.message}`);
    
    // Take error screenshot
    await page.screenshot({ 
      path: join(screenshotsDir, `${showName}-fatal-error-${Date.now()}.png`),
      fullPage: true 
    });
    
    throw error;
  } finally {
    await browser.close();
  }
}
