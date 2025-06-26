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