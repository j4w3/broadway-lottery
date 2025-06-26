# Verification Checklist for Phase 1 Changes

## Changes Made

### 1. GitHub Actions Ubuntu Fix
- ✅ Updated `playwright.yml` to use `ubuntu-22.04` instead of implied latest
- ✅ Updated `playwright-p2.yml` to use `ubuntu-22.04` 
- ✅ Updated action versions to v4

### 2. Screenshot Capture Implementation
- ✅ Added screenshot capture at key points:
  - Landing page
  - Form page before filling
  - Filled form before submission
  - Error screenshots
- ✅ Screenshots saved with descriptive names (show-name-stage-timestamp.png)
- ✅ Created screenshots directory automatically
- ✅ Added screenshots to .gitignore

### 3. Error Handling Improvements
- ✅ Added TypeScript types to broadway-direct.ts
- ✅ Added try-catch blocks for resilience
- ✅ Individual entry failures don't stop entire process
- ✅ Added detailed console logging

### 4. GitHub Actions Artifacts
- ✅ Added screenshot upload to workflows
- ✅ Separate artifact names for P2 workflow

### 5. Local Testing Support
- ✅ Added .env.example file
- ✅ Added DRY_RUN mode support
- ✅ Updated .gitignore for .env
- ✅ Enabled dotenv in playwright.config.ts
- ✅ Headless mode based on CI environment variable

## How to Test Locally (if you have browser deps)

1. Copy .env.example to .env
2. Set DRY_RUN=true in .env
3. Run: `npm run playwright -- --grep "aladdin"`

## How to Test in GitHub Actions

1. Push changes to a test branch
2. Go to Actions tab
3. Select "Playwright Tests" workflow
4. Click "Run workflow" → Select your branch → Run
5. Check:
   - Workflow completes without Ubuntu package errors
   - Screenshots artifact is uploaded
   - Console logs show progress

## Expected Behavior

1. **Ubuntu Fix**: No more "Package 'libasound2' has no installation candidate" errors
2. **Screenshots**: Multiple PNG files in artifacts showing:
   - aladdin-landing-[timestamp].png
   - aladdin-form-0-[timestamp].png
   - aladdin-before-submit-0-[timestamp].png
3. **Logging**: Clear progress messages in workflow logs
4. **DRY_RUN**: When enabled, forms filled but not submitted

## Files Modified

1. `.github/workflows/playwright.yml`
2. `.github/workflows/playwright-p2.yml`
3. `src/broadway-direct.ts`
4. `e2e/broadway-direct.spec.ts`
5. `playwright.config.ts`
6. `.gitignore`
7. `README.md`
8. `CLAUDE.md`
9. Added: `.env.example`