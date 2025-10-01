# Testing Guide

This guide covers all aspects of testing in the KIN Communications Platform, including unit tests, integration tests, end-to-end tests, and webhook testing.

## Table of Contents

- [Testing Overview](#testing-overview)
- [Unit Testing with Vitest](#unit-testing-with-vitest)
- [Integration Testing](#integration-testing)
- [End-to-End Testing with Playwright](#end-to-end-testing-with-playwright)
- [Webhook Testing](#webhook-testing)
- [Testing Patterns](#testing-patterns)
- [Mocking Strategies](#mocking-strategies)
- [Test Data Management](#test-data-management)
- [Continuous Integration](#continuous-integration)
- [Best Practices](#best-practices)

## Testing Overview

The KIN Communications Platform uses a comprehensive testing strategy:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **End-to-End Tests**: Test complete user workflows
- **Webhook Tests**: Test Twilio webhook integration
- **Performance Tests**: Test application performance

### Testing Stack

- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **Supertest**: API testing
- **React Testing Library**: Component testing
- **Prisma**: Database testing

## Unit Testing with Vitest

### Configuration

Vitest is configured in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

### Running Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test tests/lib/utils.test.ts

# Run tests matching pattern
pnpm test --grep "formatPhoneNumber"
```

### Writing Unit Tests

#### Example: Testing Utility Functions

```typescript
import { describe, it, expect } from 'vitest'
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/utils'

describe('Phone Number Utilities', () => {
  describe('formatPhoneNumber', () => {
    it('should format valid phone numbers correctly', () => {
      expect(formatPhoneNumber('+15551234567')).toBe('+1 (555) 123-4567')
      expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567')
    })

    it('should handle invalid phone numbers', () => {
      expect(formatPhoneNumber('invalid')).toBe('invalid')
      expect(formatPhoneNumber('')).toBe('')
    })
  })

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('+15551234567')).toBe(true)
      expect(validatePhoneNumber('15551234567')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('invalid')).toBe(false)
      expect(validatePhoneNumber('123')).toBe(false)
    })
  })
})
```

#### Example: Testing React Components

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContactForm } from '@/components/ContactForm'

describe('ContactForm', () => {
  it('should render form fields', () => {
    render(<ContactForm />)
    
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const mockSubmit = vi.fn()
    render(<ContactForm onSubmit={mockSubmit} />)
    
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'John' }
    })
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Doe' }
    })
    fireEvent.change(screen.getByLabelText('Phone Number'), {
      target: { value: '+15551234567' }
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john.doe@example.com' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: 'Save Contact' }))
    
    expect(mockSubmit).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      phone: '+15551234567',
      email: 'john.doe@example.com'
    })
  })
})
```

## Integration Testing

### API Route Testing

#### Example: Testing Contact API

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/contacts/route'

describe('/api/contacts', () => {
  beforeEach(async () => {
    // Set up test data
    await testUtils.createTestContact()
  })

  afterEach(async () => {
    // Clean up test data
    await testUtils.cleanup()
  })

  describe('GET /api/contacts', () => {
    it('should return contacts for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/contacts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.contacts).toHaveLength(1)
      expect(data.contacts[0].firstName).toBe('John')
    })

    it('should handle search query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/contacts?search=John')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(testUtils.prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                firstName: expect.objectContaining({
                  contains: 'John'
                })
              })
            ])
          })
        })
      )
    })
  })

  describe('POST /api/contacts', () => {
    it('should create a new contact', async () => {
      const newContact = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+15551234568',
        email: 'jane.smith@example.com',
        department: 'Marketing'
      }

      const request = new NextRequest('http://localhost:3000/api/contacts', {
        method: 'POST',
        body: JSON.stringify(newContact),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.contact.firstName).toBe('Jane')
    })

    it('should validate required fields', async () => {
      const invalidContact = {
        firstName: '',
        lastName: 'Smith',
        phone: 'invalid-phone',
        email: 'invalid-email'
      }

      const request = new NextRequest('http://localhost:3000/api/contacts', {
        method: 'POST',
        body: JSON.stringify(invalidContact),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })
})
```

### Database Integration Testing

#### Example: Testing Database Operations

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

describe('Database Operations', () => {
  let prisma: PrismaClient

  beforeEach(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
    await prisma.$connect()
  })

  afterEach(async () => {
    await prisma.contact.deleteMany()
    await prisma.$disconnect()
  })

  it('should create a contact', async () => {
    const contact = await prisma.contact.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales'
      }
    })

    expect(contact.id).toBeDefined()
    expect(contact.firstName).toBe('John')
    expect(contact.lastName).toBe('Doe')
  })

  it('should find contacts by phone number', async () => {
    await prisma.contact.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales'
      }
    })

    const contact = await prisma.contact.findFirst({
      where: {
        phone: '+15551234567'
      }
    })

    expect(contact).toBeDefined()
    expect(contact?.firstName).toBe('John')
  })
})
```

## End-to-End Testing with Playwright

### Configuration

Playwright is configured in `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ]
})
```

### Running E2E Tests

```bash
# Run all E2E tests
pnpm e2e

# Run E2E tests in headed mode
pnpm e2e:headed

# Run specific test file
pnpm e2e tests/e2e/voicemail.spec.ts

# Run tests in specific browser
pnpm e2e --project=chromium

# Run tests with debug mode
pnpm e2e --debug
```

### Writing E2E Tests

#### Example: Testing Voicemail Functionality

```typescript
import { test, expect } from '@playwright/test'

test.describe('Voicemail Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/queue')
    await page.waitForLoadState('networkidle')
  })

  test('should display voicemail queue', async ({ page }) => {
    await expect(page.locator('[data-testid="voicemail-queue"]')).toBeVisible()
    await expect(page.locator('[data-testid="voicemail-item"]')).toHaveCount.greaterThan(0)
  })

  test('should play voicemail audio', async ({ page }) => {
    await page.locator('[data-testid="voicemail-item"]').first().click()
    await page.locator('[data-testid="play-button"]').click()
    
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible()
    await expect(page.locator('[data-testid="play-button"]')).toHaveAttribute('data-playing', 'true')
  })

  test('should assign voicemail to user', async ({ page }) => {
    await page.locator('[data-testid="voicemail-item"]').first().click()
    await page.locator('[data-testid="assign-button"]').click()
    
    await page.locator('[data-testid="user-select"]').click()
    await page.locator('[data-testid="user-option"]').first().click()
    await page.locator('[data-testid="confirm-assignment"]').click()
    
    await expect(page.locator('[data-testid="assignment-success"]')).toBeVisible()
  })
})
```

#### Example: Testing Admin Panel

```typescript
import { test, expect } from '@playwright/test'

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')
  })

  test('should manage users', async ({ page }) => {
    await page.locator('[data-testid="nav-users"]').click()
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-user-button"]')).toBeVisible()
  })

  test('should add new user', async ({ page }) => {
    await page.locator('[data-testid="nav-users"]').click()
    await page.locator('[data-testid="add-user-button"]').click()
    
    await page.locator('[data-testid="user-name-input"]').fill('John Doe')
    await page.locator('[data-testid="user-email-input"]').fill('john.doe@example.com')
    await page.locator('[data-testid="user-role-select"]').selectOption('USER')
    
    await page.locator('[data-testid="save-user-button"]').click()
    
    await expect(page.locator('[data-testid="user-success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="users-table"]')).toContainText('John Doe')
  })
})
```

## Webhook Testing

### Testing Twilio Webhooks

#### Example: Testing Voice Webhook

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/webhooks/twilio/voice/route'

describe('Twilio Voice Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle incoming call webhook', async () => {
    const webhookData = {
      CallSid: 'CA1234567890abcdef',
      From: '+15551234567',
      To: '+15551234568',
      CallStatus: 'ringing',
      Direction: 'inbound'
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
      method: 'POST',
      body: new URLSearchParams(webhookData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'test-signature'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should reject invalid Twilio signature', async () => {
    vi.mocked(validateTwilioSignature).mockReturnValue(false)

    const webhookData = {
      CallSid: 'CA1234567890abcdef',
      From: '+15551234567',
      To: '+15551234568',
      CallStatus: 'ringing'
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
      method: 'POST',
      body: new URLSearchParams(webhookData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'invalid-signature'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid Twilio signature')
  })
})
```

### Testing Webhook with ngrok

```bash
# Start ngrok tunnel
pnpm webhook:tunnel

# Test webhook endpoint
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=test&From=%2B15551234567&To=%2B15551234568&CallStatus=ringing"
```

## Testing Patterns

### Page Object Pattern

```typescript
// tests/e2e/page-objects/VoicemailPage.ts
export class VoicemailPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/queue')
    await this.page.waitForLoadState('networkidle')
  }

  async getVoicemailItems() {
    return this.page.locator('[data-testid="voicemail-item"]')
  }

  async clickFirstVoicemail() {
    await this.getVoicemailItems().first().click()
  }

  async playAudio() {
    await this.page.locator('[data-testid="play-button"]').click()
  }

  async assignToUser(userName: string) {
    await this.page.locator('[data-testid="assign-button"]').click()
    await this.page.locator('[data-testid="user-select"]').click()
    await this.page.locator(`[data-testid="user-option-${userName}"]`).click()
    await this.page.locator('[data-testid="confirm-assignment"]').click()
  }
}

// Usage in test
test('should assign voicemail to user', async ({ page }) => {
  const voicemailPage = new VoicemailPage(page)
  await voicemailPage.goto()
  await voicemailPage.clickFirstVoicemail()
  await voicemailPage.assignToUser('John Doe')
  
  await expect(page.locator('[data-testid="assignment-success"]')).toBeVisible()
})
```

### Test Data Factories

```typescript
// tests/factories/ContactFactory.ts
export class ContactFactory {
  static create(overrides = {}) {
    return {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+15551234567',
      email: 'john.doe@example.com',
      department: 'Sales',
      ...overrides
    }
  }

  static createMany(count: number, overrides = {}) {
    return Array.from({ length: count }, (_, index) => 
      this.create({
        firstName: `User${index + 1}`,
        email: `user${index + 1}@example.com`,
        ...overrides
      })
    )
  }
}

// Usage in test
test('should create multiple contacts', async () => {
  const contacts = ContactFactory.createMany(5)
  
  for (const contact of contacts) {
    await prisma.contact.create({ data: contact })
  }
  
  const allContacts = await prisma.contact.findMany()
  expect(allContacts).toHaveLength(5)
})
```

## Mocking Strategies

### Mocking External Services

```typescript
// Mock Twilio SDK
vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        sid: 'test-message-sid',
        status: 'sent'
      })
    },
    calls: {
      create: vi.fn().mockResolvedValue({
        sid: 'test-call-sid',
        status: 'initiated'
      })
    }
  }))
}))

// Mock Prisma Client
vi.mock('@/lib/db', () => ({
  prisma: mockDeep<PrismaClient>()
}))

// Mock Socket.io
vi.mock('socket.io', () => ({
  Server: vi.fn(() => mockSocketServer)
}))
```

### Mocking API Responses

```typescript
// Mock API responses
beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('should handle API errors', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
    json: () => Promise.resolve({ error: 'Internal server error' })
  })

  const result = await fetchContacts()
  
  expect(result.error).toBe('Internal server error')
})
```

## Test Data Management

### Database Seeding

```typescript
// tests/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  // Create test users
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      },
      {
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER'
      }
    ]
  })

  // Create test contacts
  await prisma.contact.createMany({
    data: [
      {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+15551234568',
        email: 'jane.smith@example.com',
        department: 'Marketing'
      }
    ]
  })
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Test Cleanup

```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

let testPrisma: PrismaClient

beforeAll(async () => {
  testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
  await testPrisma.$connect()
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

afterEach(async () => {
  // Clean up test data
  await testPrisma.contact.deleteMany()
  await testPrisma.user.deleteMany()
  await testPrisma.webhookLog.deleteMany()
})
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: kin_communications_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - uses: pnpm/action-setup@v2
        with:
          version: '8'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run unit tests
        run: pnpm test
      
      - name: Run integration tests
        run: pnpm test:integration
      
      - name: Run E2E tests
        run: pnpm e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            test-results/
            playwright-report/
            coverage/
```

## Best Practices

### 1. Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Keep tests focused and independent

### 2. Test Data

- Use factories for test data creation
- Clean up test data after each test
- Use realistic test data
- Avoid hardcoded values

### 3. Assertions

- Use specific assertions
- Test both positive and negative cases
- Verify error messages and status codes
- Test edge cases and boundary conditions

### 4. Performance

- Run tests in parallel when possible
- Use appropriate timeouts
- Mock external services
- Optimize test database operations

### 5. Maintenance

- Keep tests up to date with code changes
- Remove obsolete tests
- Refactor tests when needed
- Document complex test scenarios

### 6. Accessibility

- Test keyboard navigation
- Verify ARIA labels and roles
- Test screen reader compatibility
- Check color contrast and focus indicators

## Manual Testing

While automated tests cover most functionality, manual testing is still important for:

- User experience validation
- Visual regression testing
- Cross-browser compatibility
- Performance under real conditions
- Integration with external services

### Manual Testing Checklist

For comprehensive manual testing, refer to our [Manual Testing Checklist](../testing/manual-checklist.md) which covers:

- Authentication & Authorization
- Contact Management
- Twilio Integration
- Real-time Features
- User Interface
- Data Management
- Error Handling
- Security
- Performance
- Browser Compatibility

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Webhook Testing Guide](webhook-testing.md)
- [Manual Testing Checklist](../testing/manual-checklist.md)

---

Happy testing! 🧪
