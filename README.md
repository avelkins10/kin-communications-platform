# KIN Communications Hub

[![CI/CD](https://github.com/your-org/kin-communications-hub/workflows/CI/badge.svg)](https://github.com/your-org/kin-communications-hub/actions)
[![E2E Tests](https://github.com/your-org/kin-communications-hub/workflows/E2E/badge.svg)](https://github.com/your-org/kin-communications-hub/actions)
[![Coverage](https://codecov.io/gh/your-org/kin-communications-hub/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/kin-communications-hub)
[![Webhook Security](https://img.shields.io/badge/Webhook%20Security-✅%20Enabled-green)](docs/development/webhook-testing.md)
[![Signature Validation](https://img.shields.io/badge/Signature%20Validation-✅%20Required-green)](docs/development/webhook-testing.md)
[![Idempotency](https://img.shields.io/badge/Idempotency-✅%20Automatic-green)](docs/development/webhook-testing.md)

A comprehensive communications platform built with Next.js 14, featuring Twilio Voice integration, TaskRouter intelligent routing, Quickbase CRM integration, contact management, call history tracking, and advanced voicemail management.

## Features

- **Enhanced Contact Management**: Two-section structure (Customers & Employees) with advanced filtering, SLA tracking, and staleness management
- **Quickbase CRM Integration**: Real-time customer data synchronization, Project Coordinator assignment, project status tracking, and communication activity logging
- **Twilio Voice Integration**: Outbound calling, inbound call handling, and call recording
- **TaskRouter Integration**: Intelligent task routing with keyword detection, time-based routing, and configurable routing rules
- **Worker Management**: Real-time worker status tracking, activity management, and task assignment
- **SMS Messaging**: Send and receive SMS messages with contact integration
- **Message Templates**: Create and manage reusable message templates
- **Bulk Messaging**: Send messages to multiple contacts with rate limiting
- **Call History**: Complete call tracking with recording playback and transcription
- **Voicemail Management**: Comprehensive voicemail system with transcription, priority detection, and email notifications
- **Real-time Updates**: Webhook-based call status updates and recording processing
- **Customer Context Panel**: Quickbase iframe integration for direct record access
- **Admin Panel**: Comprehensive administrative interface for system management
- **User Management**: Create, update, and manage user accounts with role-based access control
- **Phone Number Management**: Purchase, configure, and manage Twilio phone numbers
- **IVR Menu Designer**: Visual designer for interactive voice response menus
- **Business Hours Configuration**: Set operating hours, holidays, and special schedules
- **System Settings**: Configure global system preferences and behavior
- **Routing Rules Builder**: Drag-and-drop visual builder for intelligent routing rules
- **Authentication**: Secure user authentication with NextAuth.js
- **Webhook Security**: All Twilio webhooks secured with signature validation and idempotency checks
- **Call Ownership**: Automatic call assignment to project coordinators with fallback to default employees
- **Responsive UI**: Modern interface built with Tailwind CSS and shadcn/ui
- **Performance Optimization**: Next.js caching, database optimization, and comprehensive monitoring
- **Error Handling**: Robust error boundaries, logging, and recovery mechanisms
- **Bulk Actions**: Efficient multi-item operations with confirmation dialogs
- **Health Monitoring**: System health checks and performance metrics

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Voice**: Twilio Programmable Voice API
- **TaskRouter**: Twilio TaskRouter for intelligent task routing and worker management
- **CRM**: Quickbase RESTful API integration
- **Authentication**: NextAuth.js with credentials provider
- **Database**: PostgreSQL with Prisma migrations and JSONB support
- **Caching**: Next.js built-in caching (`unstable_cache` + tags) and in-memory caching for short-lived hints
- **Monitoring**: Winston logging, Sentry error tracking, custom metrics
- **Performance**: Optimized database indexes, connection pooling, query optimization

## Quick Start

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Configure the following required variables:
   
   **Database & Authentication:**
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_URL`: Your application URL
   - `NEXTAUTH_SECRET`: Random secret for NextAuth
   - `GOOGLE_CLIENT_ID`: Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
   - `GOOGLE_ALLOWED_DOMAIN`: Allowed domain for Google OAuth
   
   **Twilio Configuration:**
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
   - `TWILIO_PHONE_NUMBER`: Your Twilio phone number
   - `TWILIO_AGENT_PHONE`: Agent phone number for call routing
   - `TWILIO_API_KEY`: Twilio API Key (for TaskRouter token generation)
   - `TWILIO_API_SECRET`: Twilio API Secret (for TaskRouter token generation)
   
   **TaskRouter Configuration:**
   - `TWILIO_WORKSPACE_SID`: Your Twilio TaskRouter Workspace SID
   - `TWILIO_WORKFLOW_SID`: Default TaskRouter Workflow SID
   - `TWILIO_TASKROUTER_ENABLED`: Enable TaskRouter integration (true/false)
   
   **TaskRouter Task Queues:**
   - `TWILIO_DEFAULT_TASK_QUEUE_SID`: Default TaskRouter Task Queue SID
   - `TWILIO_PERMITS_TASK_QUEUE_SID`: Permits department Task Queue SID
   - `TWILIO_UTILITIES_TASK_QUEUE_SID`: Utilities department Task Queue SID
   - `TWILIO_SCHEDULING_TASK_QUEUE_SID`: Scheduling department Task Queue SID
   - `TWILIO_EMERGENCY_TASK_QUEUE_SID`: Emergency department Task Queue SID
   - `TWILIO_BILLING_TASK_QUEUE_SID`: Billing department Task Queue SID
   - `TWILIO_SUPPORT_TASK_QUEUE_SID`: Support department Task Queue SID
   
   **TaskRouter Activities (Public - accessible from client):**
   - `NEXT_PUBLIC_AVAILABLE_ACTIVITY_SID`: Available Activity SID
   - `NEXT_PUBLIC_BUSY_ACTIVITY_SID`: Busy Activity SID
   
   **Routing Configuration:**
   - `AFTER_HOURS_ROUTING`: After hours routing strategy (voicemail/transfer)
   - `AFTER_HOURS_TRANSFER_NUMBER`: Phone number for after hours transfers
   
   **Public URLs:**
   - `PUBLIC_BASE_URL`: Your application's public base URL (for webhooks) - **MUST use HTTPS**
   - `NEXT_PUBLIC_BASE_URL`: Your application's public base URL (for client-side)
   - `NEXT_PUBLIC_TWILIO_PHONE_NUMBER`: Your Twilio phone number (for client-side display)
   
   **Call Ownership Configuration:**
   - `DEFAULT_EMPLOYEE_NUMBER`: Default employee phone number for call assignment (E.164 format)
   - `BUSINESS_HOURS_START`: Business hours start time (24-hour format, e.g., "08:00")
   - `BUSINESS_HOURS_END`: Business hours end time (24-hour format, e.g., "18:00")
   - `BUSINESS_HOURS_TIMEZONE`: Business hours timezone (e.g., "America/New_York")
   
   **Quickbase CRM Integration:**
   - `QUICKBASE_REALM`: Your Quickbase realm name
   - `QUICKBASE_USER_TOKEN`: Your Quickbase user token
   - `QUICKBASE_APP_ID`: Your Quickbase application ID
   - `QUICKBASE_TABLE_ID`: Your Quickbase table ID (alternative to app ID)
   - `QUICKBASE_BASE_URL`: Quickbase API base URL (default: https://api.quickbase.com/v1)
   - `QUICKBASE_ENABLED`: Enable/disable Quickbase integration (default: true)
   
   **Quickbase Communication Logging:**
   - `QUICKBASE_TABLE_COMMUNICATIONS`: Table ID for logging calls, SMS, and voicemails
   - `QUICKBASE_FID_CUSTOMER`: Field ID for customer reference
   - `QUICKBASE_FID_TYPE`: Field ID for communication type (call, sms, voicemail)
   - `QUICKBASE_FID_DIRECTION`: Field ID for direction (inbound, outbound)
   - `QUICKBASE_FID_TIMESTAMP`: Field ID for timestamp
   - `QUICKBASE_FID_DURATION`: Field ID for duration
   - `QUICKBASE_FID_AGENT`: Field ID for agent/user
   - `QUICKBASE_FID_NOTES`: Field ID for notes/details
   - `QUICKBASE_FID_RECORDING`: Field ID for recording URL
   - `QUICKBASE_FID_STATUS`: Field ID for status
   
   **Quickbase Project Coordinator:**
   - `QUICKBASE_TABLE_PC`: Table ID for project coordinator lookup
   - `QUICKBASE_FID_PC_ID`: Field ID for coordinator ID
   - `QUICKBASE_FID_PC_NAME`: Field ID for coordinator name
   - `QUICKBASE_FID_PC_EMAIL`: Field ID for coordinator email
   - `QUICKBASE_FID_PC_PHONE`: Field ID for coordinator phone
   - `QUICKBASE_FID_PC_AVAILABILITY`: Field ID for availability status
   - `QUICKBASE_FID_PC_ASSIGNED_CUSTOMERS`: Field ID for assigned customers
   - `QUICKBASE_FID_PC_WORKLOAD`: Field ID for current workload
   
   **Email Configuration:**
   - `SMTP_HOST`: SMTP server for email notifications
   - `SMTP_PORT`: SMTP port (usually 587 for TLS)
   - `SMTP_SECURE`: Use secure connection (true/false)
   - `SMTP_USER`: Email address for sending notifications
   - `SMTP_PASS`: Email password or app password
   - `VOICEMAIL_EMAIL_ENABLED`: Enable/disable voicemail email notifications (true/false)
   - `VOICEMAIL_FROM_EMAIL`: From address for voicemail email notifications
   
   **Socket.io Configuration:**
   - `NEXT_PUBLIC_SOCKET_URL`: Socket.io server URL for client connections (default: http://localhost:3000)
   - `SOCKET_IO_CORS_ORIGIN`: CORS origin for Socket.io connections (default: http://localhost:3000)
   - `SOCKET_IO_PATH`: Socket.io path (default: /api/socket)
   - `REALTIME_NOTIFICATIONS_ENABLED`: Enable real-time notifications (default: true)
   - `PRESENCE_TIMEOUT`: Presence timeout in milliseconds (default: 30000)
   - `HEARTBEAT_INTERVAL`: Heartbeat interval in milliseconds (default: 10000)
   - `MAX_RECONNECT_ATTEMPTS`: Maximum reconnection attempts (default: 5)
   - `RECONNECT_DELAY`: Reconnection delay in milliseconds (default: 1000)
   
   **Monitoring and Logging:**
   - `METRICS_API_KEY`: API key for accessing metrics endpoint (required for non-interactive access)
   - `NEXT_PUBLIC_BASE_URL`: Base URL for the application (used for webhook callbacks)
   - `SENTRY_DSN`: Sentry DSN for error tracking and monitoring

3. **Set up the database**:
   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate
   ```
   
   **Note**: The application requires the `pg_trgm` PostgreSQL extension for efficient voicemail search. This extension is automatically enabled during migration, but ensure your PostgreSQL instance supports it.

4. **Start the development server**:
   ```bash
   pnpm dev
   ```

5. **Access the application**: http://localhost:3000

## Webhook Security

All Twilio webhooks are now secured with signature validation and idempotency checks:

- **Signature Validation**: All webhooks require valid Twilio signatures to prevent unauthorized access
- **Idempotency**: Duplicate webhooks are automatically handled via the `WebhookLog` table
- **Call Ownership**: Calls are automatically assigned to project coordinators or default employees
- **Environment Validation**: Recording callback URLs are validated for HTTPS and accessibility

## Quick Start for Webhook Testing

1. **Set up ngrok for local development**:
   ```bash
   # Install ngrok
   brew install ngrok  # macOS
   
   # Start tunnel
   ngrok http 3000
   ```

2. **Configure Twilio webhook URLs**:
   ```
   Voice URL: https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice
   Status Callback URL: https://your-ngrok-url.ngrok.io/api/webhooks/twilio/status
   Recording Callback URL: https://your-ngrok-url.ngrok.io/api/webhooks/twilio/recording
   ```

3. **Test webhooks locally**:
   ```bash
   # Test voice webhook
   curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -H "X-Twilio-Signature: YOUR_SIGNATURE" \
     -d "CallSid=CA1234567890abcdef&From=%2B15551234567&To=%2B15551234568&CallStatus=ringing"
   ```

4. **Verify call ownership**: Check that calls appear in the history UI for assigned users

See [docs/development/webhook-testing.md](docs/development/webhook-testing.md) for detailed webhook testing procedures.

## Development Workflow

### Testing

The project includes comprehensive testing infrastructure:

- **Unit Tests**: Vitest for component and utility testing
- **Integration Tests**: API endpoint testing with Supertest
- **E2E Tests**: Playwright for end-to-end user flows
- **Webhook Testing**: ngrok integration for local webhook testing
- **QA Testing**: Comprehensive end-to-end testing for all 10 phases
- **Performance Testing**: Load testing with 30 concurrent users
- **Security Testing**: Webhook security and vulnerability testing
- **Cross-Browser Testing**: Chrome, Firefox, Safari, Edge compatibility
- **Mobile Testing**: Tablet and mobile device responsiveness

```bash
# Run all tests
pnpm test:all

# Run specific test suites
pnpm test              # Unit tests
pnpm test:integration  # Integration tests
pnpm e2e              # End-to-end tests

# Test with coverage
pnpm test:coverage

# Watch mode for development
pnpm test:watch

# QA Testing - Comprehensive end-to-end testing
pnpm test:qa                    # Run all QA tests
pnpm test:qa:comprehensive      # Comprehensive QA tests
pnpm test:qa:voice             # Voice calling integration tests
pnpm test:qa:sms               # SMS messaging integration tests
pnpm test:qa:voicemail         # Voicemail transcription tests
pnpm test:qa:quickbase         # Quickbase integration tests
pnpm test:qa:taskrouter        # TaskRouter functionality tests
pnpm test:qa:admin             # Admin panel functionality tests
pnpm test:qa:realtime          # Real-time features tests
pnpm test:performance          # Performance tests (30 concurrent users)
pnpm test:security             # Security tests
pnpm test:cross-browser        # Cross-browser compatibility tests
pnpm test:mobile               # Mobile responsiveness tests

# QA Testing Setup and Management
pnpm qa:setup                  # Setup QA testing environment
pnpm qa:run                    # Run QA testing suite
pnpm qa:cleanup                # Cleanup QA testing environment
```

### QA Testing

The project includes a comprehensive QA testing strategy that validates all 10 phases of the KIN Communications Platform:

#### Test Suites

1. **Comprehensive QA Tests**: Validates all 10 phases in a single comprehensive test suite
2. **Voice Calling Integration**: Tests Phase 3 voice calling functionality
3. **SMS Messaging Integration**: Tests Phase 4 SMS messaging functionality
4. **Voicemail Transcription**: Tests Phase 5 voicemail system
5. **Quickbase Integration**: Tests Phase 6 CRM integration
6. **TaskRouter Functionality**: Tests Phase 7 intelligent routing
7. **Admin Panel Functionality**: Tests Phase 8 admin features
8. **Real-time Features**: Tests Phase 9 real-time functionality
9. **Performance Tests**: Validates system performance with 30 concurrent users
10. **Security Tests**: Validates webhook security and protection measures
11. **Cross-Browser Compatibility**: Tests Chrome, Firefox, Safari, Edge support
12. **Mobile Responsiveness**: Tests tablet and mobile device support

#### Test Environment Setup

```bash
# Quick setup for QA testing
pnpm qa:setup

# This will:
# 1. Install all dependencies
# 2. Setup test database
# 3. Create test users and data
# 4. Start ngrok tunnel
# 5. Configure test environment
```

#### Test Execution

```bash
# Run all QA tests
pnpm test:qa

# Run specific test suites
pnpm test:qa:comprehensive      # All 10 phases
pnpm test:qa:voice             # Voice calling only
pnpm test:qa:sms               # SMS messaging only
pnpm test:performance          # Performance testing
pnpm test:security             # Security testing
```

#### Test Reports

QA tests generate comprehensive reports including:
- HTML test reports with screenshots and videos
- Performance metrics and analysis
- Security validation results
- Cross-browser compatibility results
- Mobile responsiveness validation

See [docs/qa-testing/README.md](docs/qa-testing/README.md) for detailed QA testing documentation.

#### Testing Documentation

- **[UAT Test Plan](docs/testing/uat-test-plan.md)**: Comprehensive user acceptance testing plan covering all user roles and workflows
- **[UAT Test Results Template](docs/testing/uat-test-results-template.md)**: Template for documenting UAT test execution results
- **[Test Results Template](docs/testing/test-results-template.md)**: Standardized template for documenting test results across all testing phases
- **[Issue Tracking](docs/testing/issue-tracking.md)**: Comprehensive guide for tracking, managing, and resolving testing issues
- **[QA Testing Guide](docs/qa-testing/README.md)**: Complete guide to QA testing infrastructure and procedures
- **[Test Scenarios](docs/qa-testing/test-scenarios.md)**: Detailed test scenarios for all 10 phases of the platform
- **[Performance Testing](docs/qa-testing/performance-testing.md)**: Performance testing procedures and benchmarks
- **[Security Testing](docs/qa-testing/security-testing.md)**: Security testing procedures and validation

### Git Workflow

We follow a structured Git workflow with conventional commits:

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Feature development branches
- **hotfix/***: Critical production fixes

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

### Webhook Testing

For local webhook testing with Twilio:

```bash
# Start ngrok tunnel
pnpm webhook:tunnel

# This will:
# 1. Start ngrok on port 3000
# 2. Display the public URL
# 3. Provide Twilio webhook configuration instructions
```

### Development Workflow for Webhooks

1. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

2. **Update Twilio webhook URLs**:
   - Use the ngrok URL to configure webhook endpoints in Twilio console
   - Ensure all webhook URLs use HTTPS (required by Twilio)

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Test webhooks**:
   - Make test calls to trigger webhooks
   - Verify signature validation is working
   - Check that calls are assigned to correct users
   - Test idempotency by sending duplicate webhooks

See [docs/development/webhook-testing.md](docs/development/webhook-testing.md) for detailed webhook testing procedures.

### CI/CD

The project includes automated CI/CD pipelines:

- **CI Pipeline**: Runs on every PR with linting, type checking, and tests
- **Deploy Pipeline**: Automatic deployment to Vercel on main branch
- **E2E Pipeline**: End-to-end testing against deployed preview environments

See [docs/development/setup.md](docs/development/setup.md) for complete development setup instructions.

## Socket.io Setup

The application uses Socket.io for real-time communication. The Socket.io server is automatically initialized when you start the application.

### Local Development
- Socket.io server runs on the same port as your Next.js application (default: 3000)
- WebSocket endpoint: `ws://localhost:3000/api/socket`
- HTTP endpoint: `http://localhost:3000/api/socket`

### Production
- Update `NEXT_PUBLIC_SOCKET_URL` to your production domain
- Update `SOCKET_IO_CORS_ORIGIN` to your production domain
- Ensure your hosting platform supports WebSocket connections

### Testing Socket.io Connection
1. Open browser developer tools
2. Navigate to your application
3. Check the console for Socket.io connection messages
4. You should see "Socket.io connected" when successfully connected

### Verifying Real-time Events
To test that Socket.io is working correctly:
1. Open two browser sessions
2. In one session, trigger an action that broadcasts an event (e.g., create a voicemail)
3. The other session should receive the real-time update

## Twilio Configuration

### Webhook Setup

Configure the following webhook URLs in your Twilio console:

1. **Voice Webhook**: `https://yourdomain.com/api/webhooks/twilio/voice`
   - Handles inbound calls and returns TwiML responses
   - Automatically identifies customers in Quickbase by phone number

2. **Status Callback**: `https://yourdomain.com/api/webhooks/twilio/status`
   - Receives call status updates (ringing, answered, completed, etc.)
   - Logs communication activity to Quickbase when calls complete

3. **Recording Callback**: `https://yourdomain.com/api/webhooks/twilio/recording`
   - Processes completed call recordings

4. **SMS Webhook**: `https://yourdomain.com/api/webhooks/twilio/sms`
   - Handles inbound SMS messages
   - Automatically identifies customers in Quickbase by phone number

5. **Message Status Callback**: `https://yourdomain.com/api/webhooks/twilio/message-status`
   - Receives SMS delivery status updates
   - Logs SMS communication activity to Quickbase

6. **Transcription Callback**: `https://yourdomain.com/api/webhooks/twilio/transcription`
   - Handles voicemail transcriptions with automatic priority detection

7. **TaskRouter Webhook**: `https://yourdomain.com/api/webhooks/taskrouter`
   - Handles TaskRouter events (task creation, assignment, completion, worker activity changes)
   - Updates local database with real-time TaskRouter state

### Phone Number Configuration

1. Purchase a Twilio phone number
2. Set the voice webhook URL to your application's voice endpoint
3. Set the SMS webhook URL to your application's SMS endpoint
4. Enable call recording and transcription if desired
5. Configure message status callbacks for SMS delivery tracking

### TaskRouter Configuration

1. **Create TaskRouter Workspace**: Set up a TaskRouter workspace in your Twilio console
2. **Configure Activities**: Create activities for Available, Offline, Busy, and Wrap-up states
3. **Set up Task Queues**: Create task queues for different departments (General Support, Voicemail, etc.)
4. **Create Workflows**: Define workflows that route tasks to appropriate queues
5. **Configure Webhooks**: Set up TaskRouter event webhooks to receive real-time updates
6. **Worker Setup**: Create workers for each user who will handle tasks

## Call Ownership

The platform automatically assigns incoming calls to the appropriate employee:

### How It Works

1. **Project Coordinator Assignment**: If the caller is a known contact with an assigned project coordinator, the call is assigned to that coordinator
2. **Default Employee Fallback**: If no project coordinator is assigned, the call is assigned to the default employee specified in `DEFAULT_EMPLOYEE_NUMBER`
3. **Graceful Degradation**: If no user can be resolved, the call is created without assignment (visible in "Unassigned Calls" filter)

### Configuration

- **Default Employee**: Set `DEFAULT_EMPLOYEE_NUMBER` to the phone number of your default employee (E.164 format)
- **Project Coordinators**: Assign project coordinators to contacts in the contact management system
- **Business Hours**: Configure business hours to determine call routing (business hours vs. after hours)

### Viewing Assigned Calls

- **History UI**: Calls are filtered by the logged-in user by default
- **Unassigned Filter**: Use the "Unassigned Calls" filter to see calls that need assignment
- **Admin View**: Administrators can view all calls regardless of assignment

## Quickbase CRM Integration

### Overview

KIN Communications integrates with Quickbase for customer data lookup and communication logging. This integration enables intelligent call routing and comprehensive compliance tracking.

### Key Features

- **Customer Lookup**: Automatic customer identification by phone number during incoming calls
- **Intelligent Routing**: Route calls to assigned project coordinators based on Quickbase data
- **Communication Logging**: Automatic logging of all calls, SMS, and voicemails for compliance
- **Project Coordinator Integration**: Match Quickbase coordinators with local users for seamless routing
- **Graceful Degradation**: System continues to work even if Quickbase is unavailable

### Setup

1. **Get Quickbase Credentials**:
   - Obtain your Quickbase realm name
   - Generate a user token with appropriate permissions
   - Note your application ID and table IDs

2. **Configure Environment Variables**:
   - Set basic Quickbase configuration (realm, token, app ID)
   - Configure field IDs to match your Quickbase app structure
   - Set table IDs for communications and project coordinator lookups

3. **Field Mapping**:
   The integration uses these default field IDs (configurable via environment variables):
   - **Field 148**: Customer Phone Number
   - **Field 346**: Project Coordinator Assignment  
   - **Field 255**: Project Status

### How It Works

#### Customer Lookup Flow
```
Incoming Call → Phone Lookup → Customer Data → Routing Decision
     ↓              ↓              ↓              ↓
  Twilio      Quickbase API    Customer Info   Agent/Queue
```

#### Communication Logging Flow
```
Twilio Webhook → Database Update → Quickbase Logging
     ↓                ↓                    ↓
  Call/SMS/VM    Local Storage      Compliance Log
```

### Configuration

#### Basic Configuration
```bash
QUICKBASE_ENABLED="true"                    # Enable/disable integration
QUICKBASE_REALM="your-realm"               # Your Quickbase realm
QUICKBASE_USER_TOKEN="your-user-token"     # API authentication token
QUICKBASE_APP_ID="your-app-id"             # Your Quickbase app ID
```

#### Communication Logging
```bash
QUICKBASE_TABLE_COMMUNICATIONS="table-id"  # Table for logging communications
QUICKBASE_FID_CUSTOMER="1"                 # Customer reference field
QUICKBASE_FID_TYPE="2"                     # Communication type field
QUICKBASE_FID_DIRECTION="3"                # Direction field
QUICKBASE_FID_TIMESTAMP="4"                # Timestamp field
QUICKBASE_FID_DURATION="5"                 # Duration field
QUICKBASE_FID_AGENT="6"                    # Agent field
QUICKBASE_FID_NOTES="7"                    # Notes field
QUICKBASE_FID_RECORDING="8"                # Recording URL field
QUICKBASE_FID_STATUS="9"                   # Status field
```

#### Project Coordinator
```bash
QUICKBASE_TABLE_PC="pc-table-id"           # Project coordinator table
QUICKBASE_FID_PC_ID="1"                    # Coordinator ID field
QUICKBASE_FID_PC_NAME="2"                  # Coordinator name field
QUICKBASE_FID_PC_EMAIL="3"                 # Coordinator email field
QUICKBASE_FID_PC_PHONE="4"                 # Coordinator phone field
QUICKBASE_FID_PC_AVAILABILITY="5"          # Availability status field
```

### Features

- **Automatic Customer Identification**: Inbound calls and SMS automatically look up customers by phone number
- **Intelligent Routing**: Route calls to assigned project coordinators with fallback to default routing
- **Communication Logging**: All calls, SMS, and voicemails are logged to Quickbase for compliance
- **Project Coordinator Integration**: Match Quickbase coordinators with local users via `quickbaseUserId`
- **Error Handling**: Graceful degradation when Quickbase is unavailable
- **Performance**: Timeout protection and non-blocking operations
- **Monitoring**: Comprehensive error tracking and logging

### Troubleshooting

#### Common Issues

1. **Customer not found**: Verify phone field ID (148) and phone number formats
2. **Coordinator not routing**: Check coordinator field ID (346) and local user `quickbaseUserId`
3. **Communication logging failing**: Verify table IDs and field mappings
4. **Authentication errors**: Check user token validity and permissions

#### Disabling Quickbase

To disable Quickbase integration without breaking the app:
```bash
QUICKBASE_ENABLED="false"
```

This will:
- Skip all Quickbase lookups and logging
- Continue normal call handling and routing
- Log warnings about disabled integration

### Documentation

- [Quickbase Customer Lookup](docs/quickbase/customer-lookup.md) - Detailed customer lookup documentation
- [Quickbase Communication Logging](docs/quickbase/communication-logging.md) - Communication logging guide
- [Environment Variables](docs/quickbase/environment-variables.md) - Complete configuration reference

## API Endpoints

### Calls
- `GET /api/calls` - List calls with search and filtering
- `GET /api/calls/[id]` - Get call details
- `POST /api/calls/[id]/control` - Control active calls (mute, hold, hangup, transfer)

### Enhanced Contact Management
- `GET /api/contacts` - List contacts with enhanced filtering (section type, project status, SLA violations, staleness)
- `POST /api/contacts` - Create new contact with enhanced fields
- `PUT /api/contacts/[id]` - Update contact with business logic validation
- `DELETE /api/contacts/[id]` - Delete contact
- `POST /api/contacts/[id]/call` - Initiate outbound call
- `POST /api/contacts/[id]/sms` - Send SMS to contact
- `GET /api/contacts/configurations` - Get current contact configuration
- `PUT /api/contacts/configurations` - Update contact configuration (manager only)
- `PUT /api/contacts/[id]/project-coordinator` - Update project coordinator assignment
- `PUT /api/contacts/[id]/project-status` - Update project status
- `POST /api/contacts/bulk/status` - Bulk update contact status
- `POST /api/contacts/bulk/project-coordinator` - Bulk assign project coordinators
- `POST /api/contacts/bulk/staleness` - Bulk mark contacts as stale/active

### Messages
- `GET /api/messages` - List messages with search and filtering
- `POST /api/messages` - Send single or bulk messages
- `GET /api/conversations` - List conversations with contacts
- `GET /api/conversations/[contactId]` - Get conversation thread with contact

### Message Templates
- `GET /api/message-templates` - List message templates
- `POST /api/message-templates` - Create new template
- `PUT /api/message-templates/[id]` - Update template
- `DELETE /api/message-templates/[id]` - Delete template

### Voicemails
- `GET /api/voicemails` - List voicemails with search and filtering
- `POST /api/voicemails` - Create new voicemail
- `GET /api/voicemails/[id]` - Get voicemail details
- `PUT /api/voicemails/[id]` - Update voicemail
- `DELETE /api/voicemails/[id]` - Delete voicemail
- `POST /api/voicemails/[id]/callback` - Initiate callback to voicemail caller
- `PUT /api/voicemails/[id]/read` - Mark voicemail as read/unread
- `PUT /api/voicemails/[id]/assign` - Assign voicemail to user
- `POST /api/voicemails/bulk` - Perform bulk operations on voicemails
- `GET /api/voicemails/stats` - Get voicemail statistics

### QuickBase CRM Integration
- `GET /api/quickbase/customers` - Look up customers by phone, email, or ID
- `GET /api/quickbase/customers/[id]` - Get customer details by QuickBase ID
- `GET /api/quickbase/project-coordinators` - Look up Project Coordinators
- `POST /api/quickbase/communications` - Log communication activity
- `GET /api/quickbase/projects` - Get project status and details
- `POST /api/quickbase/sync` - Synchronize customer data
- `POST /api/quickbase/sync/customers` - Real-time customer data synchronization with enhanced fields

### TaskRouter
- `GET /api/taskrouter/workers` - List all workers with filtering options
- `POST /api/taskrouter/workers` - Create new worker
- `GET /api/taskrouter/workers/[id]` - Get worker details
- `PUT /api/taskrouter/workers/[id]` - Update worker information
- `DELETE /api/taskrouter/workers/[id]` - Delete worker
- `POST /api/taskrouter/workers/[id]/token` - Generate worker access token
- `PUT /api/taskrouter/workers/[id]/activity` - Update worker activity status
- `GET /api/taskrouter/tasks` - List tasks with filtering options
- `POST /api/taskrouter/tasks` - Create new task with intelligent routing
- `GET /api/taskrouter/tasks/[id]` - Get task details
- `PUT /api/taskrouter/tasks/[id]` - Update task attributes and status
- `DELETE /api/taskrouter/tasks/[id]` - Cancel task
- `GET /api/taskrouter/routing-rules` - List routing rules
- `POST /api/taskrouter/routing-rules` - Create new routing rule
- `GET /api/taskrouter/routing-rules/[id]` - Get routing rule details
- `PUT /api/taskrouter/routing-rules/[id]` - Update routing rule
- `DELETE /api/taskrouter/routing-rules/[id]` - Delete routing rule
- `POST /api/taskrouter/routing-rules/test` - Test routing rules with simulated scenarios

### Admin Panel
- `GET /api/admin/users` - List all users with filtering and search
- `POST /api/admin/users` - Create new user account
- `GET /api/admin/users/[id]` - Get user details
- `PUT /api/admin/users/[id]` - Update user information
- `DELETE /api/admin/users/[id]` - Deactivate user account
- `GET /api/admin/phone-numbers` - List purchased phone numbers
- `POST /api/admin/phone-numbers` - Purchase new phone number
- `POST /api/admin/phone-numbers/search` - Search available phone numbers
- `GET /api/admin/phone-numbers/[id]` - Get phone number details
- `PUT /api/admin/phone-numbers/[id]` - Update phone number configuration
- `DELETE /api/admin/phone-numbers/[id]` - Release phone number
- `GET /api/admin/business-hours` - Get business hours configuration
- `PUT /api/admin/business-hours` - Update business hours and holidays
- `GET /api/admin/ivr` - List IVR menus
- `POST /api/admin/ivr` - Create new IVR menu
- `GET /api/admin/ivr/[id]` - Get IVR menu details
- `PUT /api/admin/ivr/[id]` - Update IVR menu
- `DELETE /api/admin/ivr/[id]` - Deactivate IVR menu
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update system settings

### Cache Management
- `POST /api/cache/invalidate` - Invalidate cache entries for users or patterns

**Cache Invalidation Endpoint:**
The `/api/cache/invalidate` endpoint allows authorized users to invalidate cached data.

**Request Body:**
```json
{
  "userId": "optional-user-id",    // Invalidate specific user's cache (admin or same user)
  "pattern": "optional-pattern"    // Invalidate by pattern (admin only)
}
```

**Authorization:**
- **Regular users**: Can only invalidate their own cache (no userId/pattern specified)
- **Admin users**: Can invalidate any user's cache or by pattern
- **Rate limiting**: 10 requests per minute per user

**Response:**
```json
{
  "success": true,
  "count": 5,                      // Number of keys invalidated (for pattern invalidation)
  "message": "Cache invalidated for user: user-id"
}
```

### Monitoring and Metrics
- `GET /api/metrics` - Get system performance metrics and statistics
- `POST /api/metrics?format=prometheus` - Export metrics in Prometheus format

**Metrics API Access:**
The `/api/metrics` endpoint requires either:
- An admin user session (for interactive access)
- A valid API key via `Bearer <METRICS_API_KEY>` header or `?apiKey=<METRICS_API_KEY>` query parameter (for non-interactive access)

Configure the `METRICS_API_KEY` environment variable with a strong random key for secure API access.

### Webhooks
- `POST /api/webhooks/twilio/voice` - Handle inbound calls with Quickbase customer identification and TaskRouter integration
- `POST /api/webhooks/twilio/status` - Process call status updates and log to Quickbase
- `POST /api/webhooks/twilio/recording` - Process recording completion
- `POST /api/webhooks/twilio/sms` - Handle inbound SMS messages with Quickbase customer identification and TaskRouter integration
- `POST /api/webhooks/twilio/message-status` - Process SMS delivery status updates and log to Quickbase
- `POST /api/webhooks/twilio/transcription` - Process transcription completion with priority detection
- `POST /api/webhooks/taskrouter` - Handle TaskRouter events and update local database

## Data Fetching Strategy

The application uses lightweight, manual `fetch` calls inside custom hooks with consistent loading/error state handling and explicit refresh methods. This approach provides:

- Simple state management without additional dependencies
- Explicit control over when data is fetched
- Consistent error handling across the application
- Easy debugging and testing

Future enhancements could include React Query for advanced caching and real-time invalidation if needed.

## Development

### Database Migrations

When making schema changes:

```bash
# Create a new migration
pnpm prisma:migrate

# Reset the database (development only)
pnpm prisma:reset
```

### Code Structure

- `src/app/` - Next.js 14 app router pages and API routes
- `src/components/` - Reusable UI components
- `src/lib/` - Utility functions, database client, and business logic
- `src/types/` - TypeScript type definitions
- `prisma/` - Database schema and migrations

## Deployment

1. Set up a PostgreSQL database
2. Configure environment variables for production
3. Run database migrations
4. Deploy to your preferred platform (Vercel, Railway, etc.)
5. Update Twilio webhook URLs to point to your production domain

### Serverless Deployment Considerations

When deploying to serverless platforms (Vercel, Netlify, AWS Lambda), consider the following:

#### Environment Variables
- Set `ENABLE_METRICS_CRON=true` if you want to enable background metrics collection
- Configure `VERCEL`, `AWS_LAMBDA_FUNCTION_NAME`, or `NETLIFY` environment variables for proper serverless detection
- Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` for error tracking and monitoring

#### Monitoring & Logging
- File-based logging is automatically disabled in serverless environments
- Metrics collection timers are disabled by default in production serverless environments
- Use external monitoring services (Sentry, DataDog) for error tracking and metrics
- Console logging is preserved for serverless function logs

#### Performance
- Database connections are optimized for serverless with connection pooling
- Prefer Next.js `unstable_cache` for query caching and tag-based revalidation
- In-memory cache is per-instance and ephemeral in serverless; use it only for short-lived hints
- Consider using edge functions for static content and API routes

#### Limitations
- No persistent file system (logs are written to console only)
- Background timers are disabled to prevent function timeouts
- In-memory cache does not persist across invocations or instances
- Long-running operations should be moved to background jobs or external services

### Performance Optimizations

The application includes several performance optimizations for production deployment:

#### Next.js Optimizations
- **Next.js Cache**: Use `unstable_cache` with tags; invalidate via `revalidateTag` on writes
- **Image Optimization**: WebP/AVIF formats with 60s minimum cache TTL
- **Bundle Optimization**: SWC minification and package import optimization
- **Compression**: Gzip compression enabled for all responses
- **Static Assets**: Immutable caching for `_next/static` files (1 year)
- **API Routes**: 60s cache with stale-while-revalidate for API responses

#### Socket.io Optimizations
- **Compression**: Per-message deflate with 1KB threshold and concurrency limits
- **Memory Management**: Connection timeouts and buffer size limits
- **Performance Monitoring**: Connection/disconnection metrics tracking
- **Serverless Compatibility**: Conditional cleanup based on environment

#### Vercel-Specific Optimizations
- **Function Timeouts**: Optimized for different API route types
- **Health Check Cron**: Automated health monitoring every 5 minutes
- **Socket.io Rewrites**: Proper routing for WebSocket connections
- **Cache Headers**: Optimized caching strategies for different content types

### Database Connection Pooling

For Neon/Prisma, prefer Prisma Accelerate/Data Proxy or Neon pooling. Example DSN:

`DATABASE_URL=postgres://.../db?sslmode=require&pgbouncer=true&pool_timeout=5`

Configure Prisma client limits via env (e.g., `connection_limit`). See Neon + Prisma best practices.

### Sentry Configuration

The application includes Sentry integration for error tracking and performance monitoring:

#### Setup
1. Create a Sentry project at [sentry.io](https://sentry.io)
2. Add your DSN to environment variables:
   - `SENTRY_DSN` - Server-side error tracking
   - `NEXT_PUBLIC_SENTRY_DSN` - Client-side error tracking

#### Features
- Automatic error capture and reporting
- Performance monitoring and transaction tracking
- Session replay for debugging user interactions
- Custom error boundaries with Sentry integration
- Server and client-side error tracking

#### Configuration Files
- `sentry.client.config.ts` - Client-side Sentry configuration
- `sentry.server.config.ts` - Server-side Sentry configuration

The error boundary component automatically reports errors to Sentry when configured.

## Voicemail System

The voicemail system provides comprehensive management of voicemail messages with the following features:

### Features
- **Automatic Voicemail Creation**: Voicemails are automatically created when calls are recorded
- **Transcription**: Automatic transcription of voicemail messages using Twilio's speech-to-text
- **Priority Detection**: Automatic priority assignment based on transcription keywords
- **Email Notifications**: Configurable email notifications for new voicemails and transcriptions
- **Assignment**: Assign voicemails to specific users for follow-up
- **Bulk Operations**: Perform bulk actions on multiple voicemails
- **Search & Filtering**: Advanced search and filtering capabilities with PostgreSQL trigram indexing for fast text search on voicemail transcriptions and notes
- **Callback Integration**: One-click callback to voicemail callers

### Priority Levels
- **LOW**: Standard voicemails
- **NORMAL**: Default priority for new voicemails
- **HIGH**: Detected from keywords like "important", "priority", "soon"
- **URGENT**: Detected from keywords like "urgent", "emergency", "asap", "critical"

### Email Notifications
Configure SMTP settings in your environment variables to enable email notifications:
- New voicemail notifications
- Transcription completion notifications
- Assignment notifications

## Admin Panel

The comprehensive admin panel provides centralized management of all system components through a modern, tabbed interface.

### Features

- **Dashboard**: System overview with real-time metrics, performance indicators, and recent activity
- **User Management**: Create, update, and manage user accounts with role-based access control
- **Phone Number Management**: Purchase, configure, and manage Twilio phone numbers with webhook setup
- **Routing Rules Builder**: Drag-and-drop visual builder for intelligent routing rules with flow preview
- **Business Hours Configuration**: Set operating hours, holidays, and special schedules with visual editor
- **IVR Menu Designer**: Visual designer for interactive voice response menus with flow testing
- **System Settings**: Configure global system preferences including routing, voicemail, recording, and notifications

### Access

The admin panel is accessible at `/dashboard/admin` and requires appropriate permissions. It provides:

- **Real-time Updates**: Automatic refresh of metrics and data
- **Visual Flow Designers**: Drag-and-drop interfaces for routing rules and IVR menus
- **Comprehensive Testing**: Built-in testing tools for routing rules and IVR flows
- **Bulk Operations**: Efficient management of multiple items
- **System Health Monitoring**: Real-time system status and performance metrics

## TaskRouter Integration

### Features

- **Intelligent Routing**: Automatic task routing based on keywords, time, customer data, and configurable rules
- **Worker Management**: Real-time worker status tracking and activity management
- **Task Queues**: Organize tasks by department, priority, and type
- **Routing Rules**: Visual rule builder for complex routing logic
- **Real-time Updates**: Webhook-based updates for task assignments and worker status changes
- **Client-side SDK**: Browser-based worker interface for accepting and managing tasks

### Routing Logic

The system uses a multi-layered routing approach:

1. **Keyword Detection**: Analyzes call/SMS content for department-specific keywords
2. **Quickbase Integration**: Routes based on customer data and Project Coordinator assignment
3. **Time-based Routing**: Handles after-hours calls with voicemail or callback options
4. **Configurable Rules**: Custom routing rules with conditions and actions
5. **Fallback Routing**: Default queue assignment when no specific rules match

### Worker Interface

Workers can:
- View assigned tasks in real-time
- Accept or reject task reservations
- Update their activity status (Available, Busy, Offline, Wrap-up)
- Complete tasks and add notes
- View task history and statistics

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**: 
   - Ensure your `TWILIO_AUTH_TOKEN` is correct
   - Verify `PUBLIC_BASE_URL` is set and uses HTTPS
   - Check that webhook URLs match exactly in Twilio console

2. **Calls not being created**: 
   - Check Twilio credentials and phone number configuration
   - Verify webhook URLs are accessible from Twilio
   - Check application logs for webhook processing errors

3. **Calls not appearing in history**: 
   - Check that `userId` is being set during call creation
   - Verify `DEFAULT_EMPLOYEE_NUMBER` is configured
   - Check that contact has `projectCoordinatorId` set
   - Use "Unassigned Calls" filter to see calls without assignment

4. **Recordings not appearing**: 
   - Verify recording callback URL is configured in Twilio
   - Check that `PUBLIC_BASE_URL` is accessible
   - Verify TwiML includes correct `recordingStatusCallback`

5. **Database connection issues**: 
   - Check your `DATABASE_URL` format and database accessibility
   - Verify database migrations have been run

6. **Voicemail emails not sending**: 
   - Verify SMTP configuration and email credentials
   - Check email notification settings

7. **Transcriptions not updating**: 
   - Check transcription callback URL configuration in Twilio
   - Verify webhook signature validation

8. **TaskRouter tasks not routing**: 
   - Verify TaskRouter workspace configuration and webhook URLs
   - Check routing rules configuration

9. **Workers not receiving tasks**: 
   - Check worker activity status and task queue configuration
   - Verify TaskRouter webhook URLs

10. **Routing rules not working**: 
    - Test rules using the built-in testing endpoint
    - Check rule conditions and actions

11. **Webhook timeouts**: 
    - Optimize webhook handler performance
    - Use async processing for heavy operations
    - Monitor webhook response times

12. **Duplicate webhooks**: 
    - The platform automatically handles idempotency via `WebhookLog` table
    - Check `WebhookLog` table for processed webhook IDs
    - Verify webhook SID is being used correctly

### Logs

Check the application logs for detailed error messages. Webhook processing errors are logged with full context for debugging.

### Documentation Links

- **[Webhook Testing Guide](docs/development/webhook-testing.md)**: Comprehensive guide for testing webhooks with ngrok and security validation
- **[Twilio Integration](docs/twilio-integration.md)**: Detailed Twilio setup and configuration
- **[TWILIO_SETUP.md](TWILIO_SETUP.md)**: Quick setup guide for Twilio configuration

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for detailed information on:

- Git workflow and branch strategy
- Conventional commit standards
- Code quality requirements
- Testing requirements
- Pull request process

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Run the test suite: `pnpm test:all`
6. Submit a pull request with a clear description

### Development Setup

See [docs/development/setup.md](docs/development/setup.md) for complete development environment setup instructions.

## License

This project is licensed under the MIT License.
