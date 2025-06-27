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