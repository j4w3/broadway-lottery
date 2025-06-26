# Broadway Lottery

## Overview

The project was created to help sign up for Broadway musicals lottery tickets. Currently, it works for lotteries on the Broadway Direct website. The list of musicals is defined in the [source code](/e2e/broadway-direct.spec.ts#L14). You can edit that list directly on the website. The signup process is run at around 11 a.m. EST. The results are usually available around 3 p.m. EST. Enjoy the shows and please use this automation responsibly.

### Enhanced Features

#### Screenshot Debugging
The automation captures screenshots at key points during the lottery signup process:
- Landing page for each show
- Form page before filling
- Filled form before submission
- Error screenshots if something goes wrong

Screenshots are automatically uploaded as GitHub Actions artifacts and are available for 30 days after each run.

#### Retry Logic & Resilience
- **Automatic retries**: Failed operations are retried up to 2 times by default
- **Configurable timeouts**: Page and navigation timeouts can be customized
- **Individual failure isolation**: If one entry fails, others continue processing
- **Form validation**: Checks that required form elements exist before filling

#### Enhanced Logging
- Real-time progress updates for each show and entry
- Success/failure summary for each show
- Success rate calculations
- Configurable random delays between submissions

## How to use it

1. Fork the repository
2. Fill in your personal info in the repository secrets ([instructions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository))

### Secrets variables

The following variables are needed to run the signup automation. Replace the values with info about yourself:
```
FIRST_NAME: Donald
```
```
LAST_NAME: Duck
```
```
NUMBER_OF_TICKETS: 2 // Allowed values: 1 or 2
```
```
EMAIL: donald.duck@gmail.com
```
```
DOB_MONTH: 12
```
```
DOB_DAY: 12
```
```
DOB_YEAR: 2001
```
```
ZIP: 10007
```
```
COUNTRY: USA // Allowed values: USA, CANADA, OTHER
```

### Optional Advanced Configuration

You can optionally configure advanced settings by adding these variables to your repository secrets:

```
MAX_RETRIES: 2 // Number of retry attempts (default: 2)
PAGE_TIMEOUT: 30000 // Page operation timeout in ms (default: 30000)
NAVIGATION_TIMEOUT: 60000 // Navigation timeout in ms (default: 60000)
MIN_DELAY: 1000 // Minimum delay between submissions in ms (default: 1000)
MAX_DELAY: 3000 // Maximum delay between submissions in ms (default: 3000)
```
