# Broadway Lottery - Enhanced Edition 🎭

> **Enhanced fork** with advanced retry logic, form validation, and comprehensive error handling

An automated system for entering Broadway musical lottery tickets on the Broadway Direct website. This enhanced version adds production-ready reliability, debugging features, and configurable error handling to the [original concept](https://github.com/uzv2013/broadway-lottery).

## ✨ What's New in This Enhanced Version

### 🔄 **Retry Logic & Resilience**
- **Automatic retries**: Failed operations retry up to 2 times with exponential backoff
- **Individual failure isolation**: One failed entry doesn't stop processing others
- **Configurable timeouts**: Customizable page and navigation timeouts
- **Form validation**: Validates required elements exist before filling

### 📸 **Advanced Debugging**
- **Screenshot capture**: Automatic screenshots at key points (landing, form, pre-submit, errors)
- **Enhanced logging**: Real-time progress updates and detailed error reporting
- **Success tracking**: Success/failure summaries with success rate calculations
- **GitHub Actions artifacts**: Screenshots uploaded and available for 30 days

### ⚙️ **Configuration Management**
- **Environment variables**: Configurable retry counts, timeouts, and delays
- **Advanced settings**: Fine-tune behavior without code changes
- **Dry run mode**: Test form filling without actual submission

### 🛡️ **Production Ready**
- **Error handling**: Comprehensive error capture and recovery
- **Clean architecture**: Modular design with separation of concerns
- **Professional logging**: Structured output with emojis and status indicators

## 📊 Feature Comparison

| Feature | Original | Enhanced Version |
|---------|----------|------------------|
| Basic form filling | ✅ | ✅ |
| Retry logic | ❌ | ✅ (Configurable) |
| Error handling | Basic | ✅ Advanced |
| Screenshot debugging | ❌ | ✅ Full capture |
| Success tracking | ❌ | ✅ With rates |
| Configuration options | ❌ | ✅ Extensive |
| Form validation | ❌ | ✅ Pre-fill checks |
| Individual failure isolation | ❌ | ✅ Continue on error |

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

1. **Lottery Detection**: Scans Broadway Direct for open lotteries
2. **Form Processing**: Validates and fills entry forms with your information
3. **Smart Submission**: Handles errors gracefully with retry logic
4. **Results Tracking**: Logs success/failure rates for each show
5. **Screenshot Capture**: Documents the entire process for debugging

### Scheduled Execution
- **Runs**: ~11 AM EST daily via GitHub Actions
- **Results**: Usually available ~3 PM EST
- **Artifacts**: Screenshots and logs available for 30 days

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

### Common Issues

**No screenshots in artifacts?**
- Check GitHub Actions artifacts section after test completion
- Screenshots are only captured when lotteries are open or errors occur

**Form filling fails?**
- Enable `DRY_RUN=true` to test without submission
- Check screenshots for form structure changes
- Verify all required secrets are set

**High failure rates?**
- Increase `MAX_RETRIES` for unstable networks
- Adjust `PAGE_TIMEOUT` for slower loading
- Check if Broadway Direct has updated their form structure

### Debugging Steps
1. **Check logs**: Review GitHub Actions output for detailed error messages
2. **Review screenshots**: Download artifacts to see exact failure points
3. **Test locally**: Run with `DRY_RUN=true` to validate form detection
4. **Update selectors**: If forms change, selectors may need updates

## 📈 Success Monitoring

The enhanced version provides detailed success tracking:

```
📊 WICKED SUMMARY:
   ✅ Successful: 2/2
   ❌ Failed: 0/2
   📈 Success Rate: 100%
```

Monitor your success rates and adjust configuration as needed for optimal performance.

## 🤝 Attribution

This enhanced version builds upon the original Broadway lottery automation concept. Special thanks to the original creators for the foundational idea.

- **Original concept**: [uzv2013/broadway-lottery](https://github.com/uzv2013/broadway-lottery)
- **Enhanced by**: [j4w3](https://github.com/j4w3) with production-ready improvements

## ⚠️ Responsible Use

- Use this automation responsibly and in accordance with Broadway Direct's terms of service
- Don't run multiple instances or abuse the system
- Respect rate limits and implement appropriate delays
- This tool is for personal use only

## 📄 License

ISC License - Feel free to fork and improve further!

---

**🎭 Enjoy the shows and happy lottery entering!**