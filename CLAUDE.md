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
- **Camoufox** - Anti-detection Firefox browser for undetectable automation
- **Playwright** for browser automation API
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

- **IMPORTANT**: Cannot test E2E locally - testing must be done via GitHub Actions
- When modifying lottery logic, push to GitHub and test via Actions workflow
- Maintain stealth measures (random delays, non-headless mode in CI)
- Keep show URLs up to date in the test spec
- Ensure all personal information stays in GitHub secrets, never in code
- The project is designed for GitHub Actions automation, not continuous local development

## Recent Performance Optimizations (2025-01-26)

### Achieved Results
- **Performance**: Reduced runtime from 30 minutes to ~5 minutes (84% improvement)
- **Reliability**: Fixed navigation timeouts and test structure issues
- **Success Rate**: Tests now successfully access lottery pages and detect available entries

### Key Changes Made
1. **Removed session warming** - Direct navigation to lottery pages
2. **Optimized test execution** - Smart delays between groups instead of individual shows
3. **Enhanced browser configuration** - Random user agents and viewports per show
4. **Fixed technical issues** - Resolved viewport API and test worker conflicts

### Current Architecture Notes
- Tests run sequentially with strategic group delays
- Circuit breaker stops all tests if access issues detected
- Enhanced error detection and diagnostic screenshots
- Randomized browser profiles to appear more natural

## Current Strategy: Prevention-First Approach (2025-01-27)

### CORE PHILOSOPHY: Avoid Cloudflare Challenges, Don't Retry After Getting Them
**Implementation Date**: 2025-01-27
**Status**: Testing in production via GitHub Actions

**Key Insight**: If we get Cloudflare challenges, our automation behavior is detectable. The solution is to be more human-like, not to retry after getting caught.

### NEW APPROACH: Human-Like Behavior
**Longer Delays**: 5-12 seconds between entries (vs previous 1-3 seconds)
**Fail Fast**: Cloudflare challenge = immediate failure with clear error message
**More Natural Form Filling**: Realistic pauses, "reading" behavior, form review steps
**Reduced Retries**: Only 1 retry for technical issues, 0 retries for Cloudflare

**Form Element Selectors** (Direct ID targeting):
```typescript
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
```

**Human-Like Form Filling**:
- 2-5 second "reading" pause before filling
- 300-800ms delays between fields
- "Review" behavior before agreeing to terms
- 500-1000ms final pause before submission

**Country Selection**: Uses option values (USA=2, CANADA=3, OTHER=5)

### FALLBACK METHOD: Label-Based Targeting  
**Previous Implementation**: Used `page.getByLabel()` selectors
**Use If**: Direct ID selectors fail due to site changes

### Key Changes Made (2025-01-27)
1. **Philosophy**: Prevention over recovery - don't retry Cloudflare challenges
2. **Delays**: Increased to 5-12 seconds between entries for human pacing
3. **Form Behavior**: Added realistic reading/review pauses
4. **Timeouts**: Increased to 45s page timeout for patient behavior
5. **Error Handling**: Fail fast with clear "automation behavior needs adjustment" message
6. **Landing Page Behavior**: 15-30 seconds of realistic browsing before entry attempts
7. **Entry Approach**: Human-like button hovering and decision-making process
8. **Anti-Detection Upgrade**: Replaced custom stealth with Camoufox professional solution

## Camoufox Anti-Detection System (2025-01-27)

### Why Camoufox?
Replaced custom JavaScript-based stealth measures with **Camoufox** - a purpose-built anti-detection browser that operates at the C++ level for undetectable automation.

### Camoufox Advantages Over Previous Approach
- **C++ Level Fingerprinting**: Spoofs browser characteristics at implementation level (vs JavaScript)
- **Professional Solution**: Designed specifically for bypassing sophisticated bot detection
- **Automatic Fingerprint Generation**: Realistic device characteristics without manual configuration
- **Font Fingerprinting Protection**: Randomizes font metrics to prevent detection
- **Playwright Invisibility**: Makes Playwright completely undetectable to JavaScript inspection

### Current Implementation
- **Browser Engine**: Custom Firefox build with anti-detection features
- **OS Rotation**: Random windows/macos/linux fingerprints per show
- **Automatic Stealth**: All fingerprinting handled transparently by Camoufox
- **No Manual Configuration**: Camoufox generates realistic user agents, viewports, fonts, etc.

### Removed Custom Stealth Measures
Since Camoufox handles everything automatically, removed:
- Manual user agent rotation
- Custom viewport management  
- JavaScript-based webdriver property hiding
- Manual navigator property spoofing
- Custom browser argument injection

## Enhanced Debugging System (2025-01-27)

### Comprehensive Screenshot Strategy
**Screenshots captured at every major step**:
- `{show}-landing-ready-{timestamp}.png` - After modal handling
- `{show}-no-lotteries-{timestamp}.png` - When no lotteries found (for debugging)
- `{show}-entry-navigated-{entry}-{timestamp}.png` - After navigating to entry form
- `{show}-form-initial-{entry}-{timestamp}.png` - Form page loaded
- `{show}-form-filled-{entry}-{timestamp}.png` - Form completed, before submit
- `{show}-form-submitted-{entry}-{timestamp}.png` - After submission
- `{show}-cloudflare-{entry}-{timestamp}.png` - If Cloudflare challenge detected
- `{show}-error-{entry}-{timestamp}.png` - On any error
- `{show}-fatal-error-{timestamp}.png` - On fatal errors

### Enhanced Logging Information
**For each screenshot**, logs include:
- Current URL and page title
- User agent being used
- Page content analysis (Cloudflare indicators, errors, empty pages)
- Form elements state (visible, enabled, current values)

**Form Element Validation**:
- Checks visibility and enabled state of all form fields
- Reports current values for debugging
- Uses ✅ (visible+enabled), 🔒 (visible+disabled), ❌ (not found) indicators

### Debugging Benefits
- **Visual confirmation** of what the automation sees at each step
- **Form validation** to identify missing or changed selectors
- **Cloudflare detection** with visual proof of challenge pages
- **Error correlation** between logs and visual state
- **Progress tracking** through the entire submission process

### Usage for Troubleshooting
1. **Check landing-ready screenshots** for initial page state
2. **Review form-initial screenshots** to verify form elements exist
3. **Examine form-filled screenshots** to confirm data entry
4. **Analyze error screenshots** to understand failure points
5. **Cross-reference logs** with visual evidence in screenshots

---

# CURRENT SESSION STATUS - CAMOUFOX NATIVE TESTING

## Session Overview (2025-01-27)
**Branch**: `camoufox-integration`  
**Goal**: Test if Camoufox's native anti-detection features alone can bypass Cloudflare without manual behavioral simulation  
**Status**: Ready for testing - all manual behavioral features disabled

## Recent Work Completed

### 1. GitHub Actions Workflow Optimization
**Files Modified**: `.github/workflows/playwright.yml`, `.github/workflows/playwright-p2.yml`

**Changes Made**:
- ✅ **Replaced Playwright browser caching** with Camoufox caching (`~/.cache/camoufox`)
- ✅ **Updated installation strategy**: `npx playwright install-deps` (system dependencies only) + `npx camoufox-js fetch`
- ✅ **Removed redundant browser downloads** - no longer downloading both Playwright and Camoufox browsers
- ✅ **Proper cache key**: `camoufox-browser-${{ hashFiles('package-lock.json') }}`

**Benefits**:
- Faster CI builds with proper Camoufox browser caching
- Reduced bandwidth usage by avoiding redundant downloads
- System dependencies still available for Camoufox via `playwright install-deps`

### 2. Manual Behavioral Feature Disabling
**Files Modified**: `e2e/broadway-direct.spec.ts`, `src/broadway-direct.ts`

**All Manual Behaviors DISABLED for Native Testing**:
- ❌ **Group delays**: 1-2 minute delays between show batches
- ❌ **Human landing page simulation**: 15-30 seconds of scrolling/reading
- ❌ **Entry delays**: 3-8 second pauses between lottery entries
- ❌ **Manual mouse movements**: Random cursor positioning and movements
- ❌ **Multi-tab browsing**: Background tab simulation
- ❌ **Form filling delays**: Random 200ms-800ms pauses between field entries
- ❌ **Decision pauses**: Button hovering and final submission delays
- ❌ **Reading behaviors**: Form review and "thinking" time simulation

**What Remains ACTIVE**:
- ✅ **Core functionality**: Lottery detection, form filling, error handling
- ✅ **Cloudflare detection**: Enhanced detection patterns for verification pages
- ✅ **Circuit breaker**: Stops all tests when Cloudflare detected
- ✅ **Screenshot capture**: Full diagnostic screenshots at key stages
- ✅ **Camoufox stealth**: C++ level fingerprinting and anti-detection
- ✅ **Minimal processing wait**: 2-second timeout after form submission

## Testing Hypothesis

**Primary Question**: Can Camoufox's professional anti-detection features (C++ fingerprinting, automatic stealth) successfully bypass Cloudflare without any manual behavioral simulation?

**Expected Outcomes**:
1. **SUCCESS**: Camoufox native features are sufficient - no Cloudflare challenges detected
2. **PARTIAL SUCCESS**: Some shows work, others trigger Cloudflare - suggests site-specific detection
3. **FAILURE**: Cloudflare challenges still occur - indicates behavioral patterns are still necessary

## Code Changes Summary

### Test Spec Changes (`e2e/broadway-direct.spec.ts`)
```typescript
// DISABLED: Smart delay strategy for Camoufox native testing
// if (index > 0 && index % 3 === 0) {
//   const groupDelay = 60000 + Math.random() * 60000; // 1-2 minutes between groups
//   console.log(`⏸️ Group delay after ${index} shows: ${(groupDelay/1000).toFixed(1)}s`);
//   await new Promise(resolve => setTimeout(resolve, groupDelay));
// }

// DISABLED: Random start delay for Camoufox native testing
// const startDelay = Math.random() * 3000;
console.log(`🎭 [${showName}] Starting immediately (Camoufox native test)...`);
// await new Promise(resolve => setTimeout(resolve, startDelay));
```

### Main Logic Changes (`src/broadway-direct.ts`)
```typescript
// DISABLED: Multi-tab browsing simulation for Camoufox native testing  
// const page = await simulateTabBehavior(context);
const page = await context.newPage();

// DISABLED: Human behavior simulation for Camoufox native testing
// await simulateHumanLandingPageBehavior(page, showName);

// DISABLED: Inter-entry delay for Camoufox native testing
// if (i > 0) {
//   console.log(`⏸️ Brief pause between entries for ${showName}...`);
//   await page.waitForTimeout(3000 + Math.random() * 5000); // 3-8 seconds between entries
// }

// DISABLED: Human-like button clicking for Camoufox native testing
// const href = await clickEnterButtonWithHumanBehavior(page, showName, i);
// Standard button clicking
const enterButtons = await page.getByRole("link", { name: /Enter Now/i }).all();
await enterButtons[i].click();
```

### Form Filling Changes
```typescript
// Fill out the form - DISABLED delays for Camoufox native testing
await formElements.firstName.click();
// await page.waitForTimeout(300 + Math.random() * 500);
await formElements.firstName.fill(userInfo.firstName);
// await page.waitForTimeout(500 + Math.random() * 800);
```

## Next Steps for Testing

### 1. Manual Test Trigger
Run the workflow manually via GitHub Actions to test Camoufox native behavior:
```bash
# Via GitHub UI: Actions → Playwright Tests → Run workflow (select camoufox-integration branch)
```

### 2. Monitor Results
**Success Indicators**:
- No Cloudflare challenge screenshots
- Successful lottery entries with "Entry submitted successfully" messages
- Normal processing times (< 10 minutes total)

**Failure Indicators**:
- Screenshots showing "Verifying you are human" pages
- Circuit breaker activation due to Cloudflare detection
- Tests reporting "No lotteries found" (potential false negative)

### 3. Analysis Approach
**If Successful**: Merge to main and monitor production performance
**If Failed**: Re-enable selective behavioral features:
1. Start with group delays (batch processing detection)
2. Add landing page simulation (content engagement)
3. Gradually add form filling delays
4. Add inter-entry delays as final measure

## Enhanced Cloudflare Detection

**Current Detection Patterns** (lines 107-155 in `src/broadway-direct.ts`):
```typescript
const challengeSelectors = [
  'text="Verifying you are human"',        // Current Cloudflare format
  'text="This may take a few seconds"',    // Current Cloudflare format
  'text="Please wait while we check your browser"',
  'text="Checking your browser before accessing"',
  'text="needs to review the security of your connection"',
  'text="Performance & security by Cloudflare"',
  '[class*="cf-browser-verification"]',
  '#cf-wrapper',
  '.cf-im-under-attack',
  'text="Ray ID:"'
];
```

**URL Pattern Detection**:
- `__cf_chl_rt_tk` parameter detection
- `cf-browser-verification` path detection

**Blank Page Detection**:
- Content analysis for suspiciously empty pages on lottery URLs

## Critical Context for Next Session

### Branch State
- **Current branch**: `camoufox-integration` 
- **Latest commit**: "Disable manual behavioral features for Camoufox native testing"
- **Status**: All changes committed and pushed, ready for testing

### Testing Strategy
This is a **controlled experiment** to isolate Camoufox's effectiveness:
1. **Baseline Test**: Pure Camoufox with minimal manual automation
2. **Incremental Addition**: If baseline fails, add behavioral features systematically
3. **Optimization**: Find minimum behavioral simulation needed with Camoufox

### Key Files to Monitor
- **Workflow logs**: GitHub Actions output for runtime and error patterns
- **Screenshots**: Artifact downloads to verify Cloudflare states
- **Circuit breaker logs**: Whether Cloudflare detection triggers early termination

### Success Metrics
- **No Cloudflare challenges**: Primary success indicator
- **Successful form submissions**: Secondary validation
- **Performance**: Should maintain ~5 minute runtime
- **Reliability**: All shows should process without circuit breaker activation

### Recovery Plan if Testing Fails
If Camoufox native approach triggers Cloudflare:
1. **Minimal behavioral addition**: Start with 30-60 second group delays only
2. **Landing page simulation**: Add 10-15 second reading behavior
3. **Form pacing**: Add minimal 1-2 second delays between fields
4. **Progressive enhancement**: Add features until Cloudflare avoidance achieved

This controlled approach will determine the optimal balance between Camoufox's automatic stealth and necessary behavioral simulation.