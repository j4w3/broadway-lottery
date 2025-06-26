# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Broadway Lottery is a Playwright-based automation tool that enters users into Broadway show lotteries on Broadway Direct. It runs daily via GitHub Actions to automatically submit entries for multiple shows.

## Key Architecture

### Core Modules
- `src/broadway-direct.ts`: Main browser automation logic using Playwright with stealth plugin
- `src/get-user-info.ts`: Validates and parses user information from environment variables
- `src/types.ts`: TypeScript interfaces (UserInfo, Country types)
- `e2e/broadway-direct.spec.ts`: Playwright test that performs the actual lottery entries

### Technology Stack
- **TypeScript** with Babel transpilation (no tsconfig.json)
- **Playwright** for browser automation with stealth plugin to avoid detection
- **Jest** for unit tests, **Playwright Test** for E2E tests
- **GitHub Actions** for daily automated runs

## Essential Commands

```bash
# Install dependencies
npm install

# Run unit tests (Jest)
npm test

# Run E2E tests locally (Playwright)
npm run playwright

# The project primarily runs via GitHub Actions, not local development
```

## Testing Strategy

- **Unit tests** (`/tests/`): Test user info validation logic
- **E2E tests** (`/e2e/`): Perform actual lottery signups
- Tests run on every push/PR via GitHub Actions
- E2E tests use non-headless mode and stealth plugin

## GitHub Actions Workflows

1. **playwright.yml**: Main lottery signup (daily at 14:23 UTC)
2. **playwright-p2.yml**: Second person signup (daily at 14:28 UTC)
3. **tests.yml**: CI tests on push/PR

## Required GitHub Secrets

All user information must be configured as repository secrets:
- `FIRST_NAME`, `LAST_NAME`, `EMAIL`
- `NUMBER_OF_TICKETS` (1 or 2)
- `DOB_MONTH`, `DOB_DAY`, `DOB_YEAR`
- `ZIP`, `COUNTRY` (USA/CANADA/OTHER)

P2 variants (e.g., `P2_FIRST_NAME`) for second person.

**Optional Configuration Secrets:**
- `MAX_RETRIES`, `PAGE_TIMEOUT`, `NAVIGATION_TIMEOUT`
- `MIN_DELAY`, `MAX_DELAY` (for configurable random delays)

## Important Implementation Details

1. **Show List**: Configured in `e2e/broadway-direct.spec.ts:14` - modify this array to change which shows to enter
2. **Stealth Mode**: Uses puppeteer-extra-plugin-stealth to avoid bot detection
3. **Retry Logic**: Automatic retries (default: 2) for failed operations with exponential backoff
4. **Configurable Delays**: Random delays between submissions (configurable via env vars)
5. **Timeout Management**: Separate timeouts for page operations and navigation
6. **Form Validation**: Validates that required form elements exist before filling
7. **Screenshot Capture**: Captures screenshots at key points and errors
8. **Error Resilience**: Individual entry failures don't stop processing other entries/shows
9. **Headless Mode**: Runs headless in CI (`CI=true`), headful locally for debugging
10. **Success Tracking**: Logs detailed success/failure summaries with success rates

## Development Guidelines

- When modifying lottery logic, test thoroughly with `npm run playwright` before committing
- Maintain stealth measures (random delays, non-headless mode in dev)
- Keep show URLs up to date in the test spec
- Ensure all personal information stays in GitHub secrets, never in code
- The project is designed for GitHub Actions automation, not continuous local development

---

# SESSION CONTINUATION NOTES - CRITICAL ISSUE IDENTIFIED

## Current Status (Last Updated: 2025-01-26)

### ✅ **Recent Fixes Completed**
- **Modal Handling**: Fixed navigation timeouts by implementing `dismissEmailModal()` function
- **Navigation Strategy**: Changed from `networkidle` to `domcontentloaded` for reliability
- **Sequential Execution**: Reduced parallel workers from 3 to 1 to avoid conflicts
- **Tests Complete Successfully**: No more timeout errors

### 🚫 **CRITICAL ISSUE: Cloudflare Detection Failure**

**Problem**: Tests complete successfully but don't enter lotteries because Cloudflare is blocking access, but our detection logic doesn't catch it.

**Evidence from Latest Run Screenshots**:
- `aladdin-landing-*.png`: Shows "Verifying you are human. This may take a few seconds." with Cloudflare branding
- `mj-ny-landing-*.png`: Same Cloudflare verification page
- `wicked-landing-*.png`: Blank/white page (complete block)
- **All tests report**: "No lotteries found on page" instead of detecting Cloudflare

**Log Analysis**: Tests report success but with "Total lotteries: 0" for all shows - this is the false negative we need to fix.

## **NEXT SESSION PRIORITY ACTIONS**

### 🔍 **1. Enhanced Cloudflare Detection (CRITICAL)**
**File**: `src/broadway-direct.ts:107-135` - `isCloudflareChallenge()` function

**Current Detection Gaps**:
- Missing "Verifying you are human" text pattern
- Missing "This may take a few seconds" text pattern  
- Missing "Performance & security by Cloudflare" text pattern
- Not detecting blank/white pages (complete blocks)

**Required Updates**:
```typescript
// Add to challengeSelectors array in isCloudflareChallenge():
'text="Verifying you are human"',
'text="This may take a few seconds"', 
'text="needs to review the security of your connection"',
'text="Performance & security by Cloudflare"',

// Add blank page detection:
// Check if page has minimal content or is completely white
// Check page title for Cloudflare-specific patterns
```

### 📸 **2. Enhanced Screenshot Strategy**
**Current**: Only one screenshot at landing page  
**Problem**: Insufficient diagnostic coverage

**Add Screenshots At**:
- `src/broadway-direct.ts:378` - After session warming (catch early blocking)
- `src/broadway-direct.ts:495` - After modal dismissal but before lottery check
- `src/broadway-direct.ts:520` - When "No lotteries found" occurs (confirm not Cloudflare)

**File Pattern**: `{show}-{stage}-{timestamp}.png` where stage = `warming|post-modal|no-lotteries|cloudflare`

### 🔧 **3. Circuit Breaker Enhancement**
**File**: `e2e/broadway-direct.spec.ts:94-98`

**Current Issue**: Circuit breaker only activates on explicit Cloudflare errors, not detection

**Required Changes**:
- Check for Cloudflare in main broadwayDirect function, not just error handler
- Activate circuit breaker when `isCloudflareChallenge()` returns true
- Add cloudflare detection logging before "No lotteries found" logic

### 📊 **4. Improved Diagnostic Logging**
**File**: `src/broadway-direct.ts:497-520` - Lottery availability check section

**Current Issue**: "No lotteries found" could mean legitimate closure OR Cloudflare blocking

**Add Before Lottery Check**:
```typescript
// Log page state for diagnosis
console.log(`📄 Page title: ${await page.title()}`);
console.log(`🔗 Current URL: ${page.url()}`);

// Explicit Cloudflare check with detailed logging
const isCloudflare = await isCloudflareChallenge(page);
if (isCloudflare) {
  console.log('🚫 CLOUDFLARE DETECTED - Page blocked by verification');
  // Activate circuit breaker here
  throw new Error('Cloudflare challenge detected on lottery page');
}
```

### 🎯 **5. Alternative Access Strategies (Future)**
If Cloudflare continues blocking after detection fixes:

**Option A**: Skip main site warming entirely - go direct to lottery URLs  
**Option B**: Implement longer delays between all requests (5-10 minutes)  
**Option C**: Different stealth plugin configuration  
**Option D**: Residential proxy integration (advanced)

## **Code Locations Requiring Changes**

### **Primary Modifications**:
1. `src/broadway-direct.ts:107-135` - Enhance `isCloudflareChallenge()` detection patterns
2. `src/broadway-direct.ts:497-520` - Add Cloudflare check before lottery availability logic
3. `src/broadway-direct.ts:489` - Add post-modal diagnostic screenshot
4. `e2e/broadway-direct.spec.ts:107-108` - Enhance circuit breaker for Cloudflare detection

### **Testing Strategy**:
1. **Test detection against current screenshots** - Verify enhanced function catches blocking
2. **Add diagnostic screenshots** - Confirm they capture the right moments
3. **Test circuit breaker** - Ensure it stops tests when Cloudflare detected
4. **Validate reporting** - Clear "Cloudflare blocking" vs "no lotteries" distinction

## **Success Criteria for Next Session**
- [ ] `isCloudflareChallenge()` catches current "Verifying you are human" format
- [ ] Circuit breaker activates when Cloudflare detected (not just on errors)
- [ ] Enhanced screenshots provide full diagnostic view of blocking
- [ ] Tests fail explicitly with "Cloudflare blocking" instead of "no lotteries found"
- [ ] Clear logging distinguishes blocking vs legitimate lottery closures

## **Key Insights from This Session**
1. **Modal handling fixed navigation timeouts** ✅ - This was the correct solution
2. **Cloudflare evolved detection methods** 🚨 - Using verification pages that bypass our checks  
3. **False success worse than explicit failure** - Need clear error reporting
4. **Screenshots are crucial for debugging** - Visual confirmation reveals what logs miss
5. **Sequential execution works** - No more parallel worker conflicts

## **Alternative Hypotheses to Rule Out**
- **Timing-Based**: Verify if lotteries have specific open hours (all being closed is suspicious)
- **URL Changes**: Confirm lottery URLs are still valid and site structure unchanged
- **Session Issues**: Check if cookies/sessions from warming are being lost

---
*Last Session: Fixed modal timeouts, discovered Cloudflare detection gaps*  
*Next Session: Fix Cloudflare detection and implement comprehensive diagnostics*