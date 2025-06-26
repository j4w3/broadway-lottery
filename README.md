# Broadway Lottery 🎭

Automated entry system that runs daily via GitHub Actions.

> **For personal use only**

Based on the original [broadway-lottery](https://github.com/uzv2013/broadway-lottery) concept.

## 🚀 Quick Start

1. **Fork this repository**
2. **Set up your secrets** (see configuration below)
3. **Customize show list** in `/e2e/broadway-direct.spec.ts`
4. **Run via GitHub Actions** (scheduled at ~11 AM EST)

## 🔧 Configuration

### Required User Information
Add these to your [repository secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository):

```bash
# Personal Information
FIRST_NAME=Donald
LAST_NAME=Duck
EMAIL=donald.duck@gmail.com
NUMBER_OF_TICKETS=2          # 1 or 2
DOB_MONTH=12
DOB_DAY=12
DOB_YEAR=2001
ZIP=10007
COUNTRY=USA                  # USA, CANADA, or OTHER
```

### Advanced Configuration (Optional)
Fine-tune the automation behavior:

```bash
# Retry & Timeout Settings
MAX_RETRIES=2                # Number of retry attempts (default: 2)
PAGE_TIMEOUT=30000           # Page operation timeout in ms (default: 30000)
NAVIGATION_TIMEOUT=60000     # Navigation timeout in ms (default: 60000)

# Delay Settings (Anti-bot measures)
MIN_DELAY=1000              # Minimum delay between submissions in ms (default: 1000)
MAX_DELAY=3000              # Maximum delay between submissions in ms (default: 3000)

# Testing
DRY_RUN=true                # Fill forms but don't submit (for testing)
```

## 🎯 How It Works

The system runs automatically via GitHub Actions on a daily schedule.

## 🛠️ Development

### Local Testing
```bash
# Install dependencies
npm install

# Run tests locally
npm run playwright

# Run with dry run mode
DRY_RUN=true npm run playwright
```

### Show Configuration
Edit the show list in `/e2e/broadway-direct.spec.ts`:
```typescript
const showUrls = [
  "https://lottery.broadwaydirect.com/show/wicked/",
  "https://lottery.broadwaydirect.com/show/the-lion-king/",
  // Add more shows here
];
```

## 🔍 Troubleshooting

Check GitHub Actions logs and artifacts for debugging information.

## 🤝 Attribution

- **Original concept**: [uzv2013/broadway-lottery](https://github.com/uzv2013/broadway-lottery)
- **Enhanced by**: [j4w3](https://github.com/j4w3)

## ⚠️ Important

This tool is for personal use only. Use responsibly.

## 📄 License

ISC License - Feel free to fork and improve further!

---

**🎭 Enjoy the shows and happy lottery entering!**