# QA Testing Guide

## Overview

This guide provides comprehensive instructions for conducting Quality Assurance (QA) testing of the KIN Communications Hub. It covers setup, execution, and reporting procedures for all types of testing.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- **Node.js**: Version 18.x or higher
- **pnpm**: Version 8.x or higher
- **Docker**: For database and external services
- **Git**: For version control

### Browser Requirements
- **Chrome**: Version 90+ (for E2E testing)
- **Firefox**: Version 88+ (for cross-browser testing)
- **Safari**: Version 14+ (for cross-browser testing)
- **Edge**: Version 90+ (for cross-browser testing)

### External Services
- **Twilio Account**: For voice and SMS testing
- **Quickbase Account**: For customer data integration
- **TaskRouter Workspace**: For task management testing
- **ngrok**: For webhook testing (optional)

## Environment Setup

### 1. Clone Repository
```bash
git clone [repository-url]
cd kin-communications-hub
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Configuration
Create environment files for different testing environments:

#### Development Environment (.env.development)
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kin_communications_dev
NEXTAUTH_SECRET=dev-secret-key
NEXTAUTH_URL=http://localhost:3000
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+15551234567
QUICKBASE_REALM=your-quickbase-realm
QUICKBASE_USER_TOKEN=your-quickbase-token
QUICKBASE_APP_ID=your-quickbase-app-id
```

#### Test Environment (.env.test)
```env
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kin_communications_test
NEXTAUTH_SECRET=test-secret-key
NEXTAUTH_URL=http://localhost:3000
TWILIO_ACCOUNT_SID=test-account-sid
TWILIO_AUTH_TOKEN=test-auth-token
TWILIO_PHONE_NUMBER=+15551234567
QUICKBASE_REALM=test-realm
QUICKBASE_USER_TOKEN=test-user-token
QUICKBASE_APP_ID=test-app-id
TEST_MODE=true
```

#### Staging Environment (.env.staging)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@staging-db:5432/kin_communications_staging
NEXTAUTH_SECRET=staging-secret-key
NEXTAUTH_URL=https://staging.kin-communications.com
TWILIO_ACCOUNT_SID=staging-account-sid
TWILIO_AUTH_TOKEN=staging-auth-token
TWILIO_PHONE_NUMBER=+15551234567
QUICKBASE_REALM=staging-realm
QUICKBASE_USER_TOKEN=staging-user-token
QUICKBASE_APP_ID=staging-app-id
```

### 4. Database Setup
```bash
# Start PostgreSQL database
docker-compose up -d postgres

# Run database migrations
pnpm prisma migrate deploy

# Seed test data
pnpm test:seed
```

### 5. Install Playwright Browsers
```bash
pnpm playwright install --with-deps
```

## Test Execution

### Running Different Test Suites

#### 1. Unit Tests
```bash
# Run all unit tests
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run unit tests with coverage
pnpm test:coverage
```

#### 2. Integration Tests
```bash
# Run integration tests
pnpm test:integration

# Run specific integration test
pnpm test:integration -- --testNamePattern="API"
```

#### 3. End-to-End Tests
```bash
# Run all E2E tests
pnpm e2e

# Run E2E tests in headed mode
pnpm e2e:headed

# Run E2E tests with UI
pnpm e2e:ui

# Run E2E tests in debug mode
pnpm e2e:debug
```

#### 4. QA Tests (Multi-browser)
```bash
# Run all QA tests
pnpm e2e:qa

# Run QA tests for specific browser
pnpm e2e:qa:chromium
pnpm e2e:qa:firefox
pnpm e2e:qa:webkit

# Run QA tests for mobile
pnpm e2e:qa:mobile

# Run cross-browser tests
pnpm e2e:qa:cross-browser
```

#### 5. Performance Tests
```bash
# Run performance tests
pnpm e2e:qa --project=performance

# Run performance tests with specific environment
NODE_ENV=staging pnpm e2e:qa --project=performance
```

#### 6. Security Tests
```bash
# Run security tests
pnpm e2e:qa --project=security
```

### Test Configuration

#### Playwright Configuration
The main Playwright configuration is in `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

#### QA Configuration
The QA configuration is in `playwright.qa.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  testDir: './tests',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

## Test Data Management

### Test Data Seeding
Test data is automatically seeded when running tests. The seeding process:

1. **Users**: Creates test users with different roles (Admin, Supervisor, Agent)
2. **Contacts**: Creates sample customer contacts
3. **Phone Numbers**: Sets up test phone numbers
4. **Communications**: Creates sample calls, messages, and voicemails
5. **Quickbase Data**: Seeds customer and project data
6. **TaskRouter Data**: Creates test tasks and workflows

### Manual Test Data Creation
If you need to create additional test data:

```bash
# Seed specific test data
pnpm test:seed -- --users --contacts --communications

# Reset test data
pnpm test:reset

# Clean test data
pnpm test:clean
```

### Test Data Isolation
Each test run uses isolated test data:
- **Database**: Separate test database
- **Users**: Unique test user accounts
- **External Services**: Mock responses in TEST_MODE
- **Files**: Temporary test files

## Webhook Testing

### Using the Webhook Testing Script
The `scripts/webhook-testing.sh` script helps configure and test Twilio webhooks:

```bash
# Make script executable
chmod +x scripts/webhook-testing.sh

# Setup webhook URLs in Twilio
./scripts/webhook-testing.sh setup

# Test webhook endpoints
./scripts/webhook-testing.sh test

# Test simulation endpoints
./scripts/webhook-testing.sh simulate

# Test webhook security
./scripts/webhook-testing.sh security

# Run all tests
./scripts/webhook-testing.sh all
```

### Manual Webhook Testing
For manual webhook testing:

1. **Start ngrok** (if testing locally):
   ```bash
   ngrok http 3000
   ```

2. **Update Twilio webhook URLs**:
   - Voice webhook: `https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice`
   - SMS webhook: `https://your-ngrok-url.ngrok.io/api/webhooks/twilio/sms`
   - Status webhook: `https://your-ngrok-url.ngrok.io/api/webhooks/twilio/status`

3. **Test webhooks**:
   - Make test calls to your Twilio number
   - Send test SMS messages
   - Verify webhook responses

## Performance Testing

### Environment-Based Thresholds
Performance tests use different thresholds based on environment:

- **Development**: More lenient thresholds (5s page load, 2s API)
- **Staging**: Moderate thresholds (3s page load, 1.5s API)
- **Production**: Strict thresholds (2s page load, 1s API)
- **Test**: Very lenient thresholds (10s page load, 5s API)

### Running Performance Tests
```bash
# Run performance tests for current environment
pnpm e2e:qa --project=performance

# Run performance tests for specific environment
NODE_ENV=staging pnpm e2e:qa --project=performance

# Run performance tests with custom thresholds
PERFORMANCE_THRESHOLD_PAGE_LOAD=3000 pnpm e2e:qa --project=performance
```

### Performance Metrics
The performance tests measure:
- **Page Load Time**: Time to load and render pages
- **API Response Time**: Time for API calls to complete
- **Navigation Time**: Time to navigate between pages
- **Memory Usage**: JavaScript heap memory usage
- **Concurrent Users**: System behavior under load

## Cross-Browser Testing

### Supported Browsers
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome (Android), Safari (iOS)
- **Tablet**: Chrome (Android), Safari (iPad)

### Running Cross-Browser Tests
```bash
# Run all cross-browser tests
pnpm e2e:qa:cross-browser

# Run tests for specific browser
pnpm e2e:qa:chromium
pnpm e2e:qa:firefox
pnpm e2e:qa:webkit

# Run mobile tests
pnpm e2e:qa:mobile
```

### Browser-Specific Testing
Cross-browser tests include:
- **WebRTC Support**: Microphone and camera access
- **CSS Features**: Grid, Flexbox, CSS Variables
- **JavaScript Features**: ES6, Fetch API, WebSocket
- **Touch Events**: Mobile touch interactions
- **Performance**: Browser-specific performance characteristics

## Security Testing

### Running Security Tests
```bash
# Run all security tests
pnpm e2e:qa --project=security

# Run specific security test
pnpm e2e:qa --grep "webhook security"
```

### Security Test Coverage
Security tests cover:
- **Webhook Security**: Twilio signature validation
- **Input Validation**: SQL injection, XSS prevention
- **Authentication**: Login, session management
- **Authorization**: Role-based access control
- **Data Protection**: Sensitive data handling

## Test Reporting

### HTML Reports
Playwright generates HTML reports by default:
```bash
# View test report
pnpm playwright show-report
```

### Custom Reports
You can generate custom reports:
```bash
# Generate JUnit report
pnpm e2e --reporter=junit

# Generate JSON report
pnpm e2e --reporter=json

# Generate custom report
pnpm e2e --reporter=./custom-reporter.js
```

### Test Results
Test results include:
- **Test Status**: Passed, Failed, Skipped, Flaky
- **Execution Time**: Duration of each test
- **Screenshots**: Screenshots of failed tests
- **Videos**: Video recordings of test execution
- **Traces**: Detailed execution traces

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database status
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

#### 2. External Service Issues
```bash
# Check environment variables
echo $TWILIO_ACCOUNT_SID
echo $QUICKBASE_REALM

# Test external service connections
pnpm test:integration -- --testNamePattern="external services"
```

#### 3. Browser Issues
```bash
# Reinstall Playwright browsers
pnpm playwright install --with-deps

# Clear browser cache
pnpm playwright clear-cache
```

#### 4. Test Data Issues
```bash
# Reset test data
pnpm test:reset

# Re-seed test data
pnpm test:seed
```

### Debug Mode
Run tests in debug mode for troubleshooting:
```bash
# Debug E2E tests
pnpm e2e:debug

# Debug specific test
pnpm e2e:debug --grep "login test"

# Debug with browser dev tools
pnpm e2e:debug --headed
```

### Logging
Enable detailed logging:
```bash
# Enable debug logging
DEBUG=playwright:* pnpm e2e

# Enable specific logging
DEBUG=playwright:api pnpm e2e
```

## Best Practices

### Test Design
1. **Independent Tests**: Each test should be independent
2. **Clear Test Names**: Use descriptive test names
3. **Proper Setup/Teardown**: Clean up after each test
4. **Data Isolation**: Use unique test data
5. **Error Handling**: Test error scenarios

### Test Execution
1. **Parallel Execution**: Run tests in parallel when possible
2. **Retry Logic**: Use retry logic for flaky tests
3. **Timeout Management**: Set appropriate timeouts
4. **Resource Cleanup**: Clean up resources after tests
5. **Environment Isolation**: Use separate test environments

### Test Maintenance
1. **Regular Updates**: Keep tests up to date with code changes
2. **Test Review**: Review tests for accuracy and completeness
3. **Performance Monitoring**: Monitor test execution performance
4. **Flaky Test Management**: Identify and fix flaky tests
5. **Documentation**: Keep test documentation current

## Support

### Getting Help
- **Documentation**: Check this guide and other documentation
- **Issues**: Report issues in the project repository
- **Team Chat**: Ask questions in team communication channels
- **Code Review**: Request code reviews for test changes

### Contributing
- **Test Improvements**: Suggest improvements to tests
- **New Tests**: Add tests for new features
- **Documentation**: Improve test documentation
- **Tools**: Contribute to testing tools and utilities
