export async function broadwayDirect({ browser, userInfo, url }) {
  const page = await browser.newPage();

  console.log(`Navigating to URL: ${url}`);
  await page.goto(url);

  console.log("Fetching links with role 'link' and name containing 'Enter'");
  const links = await page.getByRole("link", { name: /Enter/i }).all();
  console.log(`Found ${links.length} links`);

  console.log("Extracting href attributes from links");
  const hrefs = await Promise.all(
    links.map((link, index) => {
      return link.getAttribute("href").then(href => {
        console.log(`Link ${index} href before any interaction: ${href}`);
        return href;
      });
    })
  );

  if (url.includes('aladdin')) {
    hrefs[0] = 'https://lottery.broadwaydirect.com/enter-lottery/?lottery=774351&window=popup';
    console.log('Link replaced');
  }
  
  for (let i = 0; i < hrefs.length; i++) {
    const href = hrefs[i];
    if (!href) {
      console.log("No href found, skipping this link.");
      continue;
    }
    
    console.log(`Navigating to href: ${href}`);
    await page.goto(href);

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
    console.log("Agreeing to terms");
    await page.locator("#dlslot_agree").check({ force: true });

    // Submit the form
    console.log("Submitting the form");
    await page.getByLabel("Enter").click();

    // Wait for a random timeout to avoid spamming the API
    console.log("Waiting post submission");
    const breakTime = Math.floor(Math.random() * 1000) + 1;
    await page.waitForTimeout(breakTime);
  }

  console.log("Closing browser");
  await browser.close();
}
