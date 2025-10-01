# Development Environment Setup

This guide will help you set up a complete development environment for the KIN Communications Platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Twilio Configuration](#twilio-configuration)
- [Quickbase Configuration](#quickbase-configuration)
- [Webhook Testing Setup](#webhook-testing-setup)
- [Verification Steps](#verification-steps)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: Version 18 or higher
- **pnpm**: Version 8 or higher
- **PostgreSQL**: Version 15 or higher
- **Git**: Latest version
- **ngrok**: For webhook testing

### Required Accounts

- **Twilio Account**: For voice and SMS functionality
- **Quickbase Account**: For CRM integration
- **GitHub Account**: For code repository access

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/kin-communications-platform.git
cd kin-communications-platform
```

### 2. Install Node.js and pnpm

#### macOS (using Homebrew)
```bash
brew install node@18
brew install pnpm
```

#### Windows (using Chocolatey)
```bash
choco install nodejs --version=18.19.0
npm install -g pnpm
```

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Install ngrok

```bash
# macOS
brew install ngrok

# Windows
choco install ngrok

# Linux
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin
```

## Environment Configuration

### 1. Create Environment File

```bash
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kin_communications_dev"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Twilio Configuration
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+15551234567"
TWILIO_WEBHOOK_URL="https://your-ngrok-url.ngrok.io"

# Quickbase Configuration
QUICKBASE_REALM="your-realm.quickbase.com"
QUICKBASE_USER_TOKEN="your-quickbase-user-token"
QUICKBASE_APP_ID="your-quickbase-app-id"

# Socket.io Configuration
SOCKET_IO_CORS_ORIGIN="http://localhost:3000"

# Development Settings
NODE_ENV="development"
```

## Database Setup

### 1. Install PostgreSQL

#### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Windows
Download and install from [PostgreSQL website](https://www.postgresql.org/download/windows/)

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install postgresql-15 postgresql-client-15
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kin_communications_dev;

# Create user (optional)
CREATE USER kin_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE kin_communications_dev TO kin_user;

# Exit psql
\q
```

### 3. Run Database Migrations

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### 4. Seed Database (Optional)

```bash
pnpm prisma db seed
```

## Twilio Configuration

### 1. Create Twilio Account

1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account
3. Verify your phone number

### 2. Get API Credentials

1. Navigate to Account → API Keys & Tokens
2. Copy your Account SID and Auth Token
3. Add them to your `.env.local` file

### 3. Purchase Phone Number

1. Go to Phone Numbers → Manage → Buy a number
2. Choose a number with Voice and SMS capabilities
3. Add the number to your `.env.local` file

### 4. Configure Webhooks

1. Go to Phone Numbers → Manage → Active numbers
2. Click on your purchased number
3. Set webhook URLs:
   - Voice: `https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice`
   - SMS: `https://your-ngrok-url.ngrok.io/api/webhooks/twilio/sms`
   - Status: `https://your-ngrok-url.ngrok.io/api/webhooks/twilio/status`

## Quickbase Configuration

### 1. Create Quickbase Account

1. Go to [Quickbase](https://www.quickbase.com/)
2. Sign up for a developer account
3. Create a new application

### 2. Get API Credentials

1. Go to your Quickbase realm
2. Navigate to Settings → API
3. Generate a User Token
4. Note your App ID

### 3. Configure Environment Variables

Add your Quickbase credentials to `.env.local`:

```env
QUICKBASE_REALM="your-realm.quickbase.com"
QUICKBASE_USER_TOKEN="your-user-token"
QUICKBASE_APP_ID="your-app-id"
```

## Webhook Testing Setup

### 1. Start ngrok Tunnel

```bash
# Start ngrok tunnel on port 3000
pnpm webhook:tunnel

# Or manually
ngrok http 3000
```

### 2. Update Webhook URLs

1. Copy the HTTPS URL from ngrok output
2. Update `TWILIO_WEBHOOK_URL` in `.env.local`
3. Update webhook URLs in Twilio Console

### 3. Test Webhook Delivery

```bash
# Test webhook endpoint
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=test&From=%2B15551234567&To=%2B15551234568&CallStatus=ringing"
```

## Verification Steps

### 1. Start Development Server

```bash
pnpm dev
```

The application should start on `http://localhost:3000`

### 2. Verify Database Connection

```bash
pnpm prisma studio
```

This should open Prisma Studio in your browser.

### 3. Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test contacts endpoint
curl http://localhost:3000/api/contacts
```

### 4. Test Webhook Endpoints

```bash
# Test voice webhook
curl -X POST http://localhost:3000/api/webhooks/twilio/voice \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=test&From=%2B15551234567&To=%2B15551234568&CallStatus=ringing"
```

### 5. Test Socket.io Connection

1. Open browser developer tools
2. Navigate to `http://localhost:3000`
3. Check console for Socket.io connection messages

### 6. Run Tests

```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run end-to-end tests
pnpm e2e
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@15

# Check connection
psql -U postgres -d kin_communications_dev
```

#### 2. Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use a different port
PORT=3001 pnpm dev
```

#### 3. Twilio Webhook Issues

**Error**: `Invalid Twilio signature`

**Solution**:
1. Verify `TWILIO_AUTH_TOKEN` in `.env.local`
2. Check webhook URL in Twilio Console
3. Ensure ngrok tunnel is running
4. Test with Twilio's webhook testing tool

#### 4. Quickbase API Issues

**Error**: `Quickbase API error: Invalid credentials`

**Solution**:
1. Verify `QUICKBASE_USER_TOKEN` is valid
2. Check `QUICKBASE_REALM` format
3. Ensure `QUICKBASE_APP_ID` is correct
4. Test API connection manually

#### 5. Socket.io Connection Issues

**Error**: `Socket.io connection failed`

**Solution**:
1. Check `SOCKET_IO_CORS_ORIGIN` in `.env.local`
2. Verify server is running
3. Check browser console for errors
4. Test with different browsers

#### 6. Build Issues

**Error**: `TypeScript compilation errors`

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Check TypeScript errors
pnpm type-check

# Fix linting issues
pnpm lint:fix
```

### Getting Help

1. **Check the logs**: Look at browser console and server logs
2. **Verify configuration**: Double-check all environment variables
3. **Test components**: Test each component individually
4. **Check documentation**: Refer to API documentation
5. **Ask for help**: Create an issue or contact the team

### Useful Commands

```bash
# Start development server
pnpm dev

# Start with webhook tunneling
pnpm dev:with-tunnel

# Run tests
pnpm test

# Run linting
pnpm lint

# Check types
pnpm type-check

# Build for production
pnpm build

# Start production server
pnpm start

# Database operations
pnpm prisma migrate dev
pnpm prisma generate
pnpm prisma studio
pnpm prisma db seed

# Webhook testing
pnpm webhook:tunnel
```

## Next Steps

Once your development environment is set up:

1. **Read the documentation**: Start with [API Standards](api-standards.md)
2. **Explore the codebase**: Check out the [Architecture Overview](architecture.md)
3. **Run the tests**: Ensure everything is working correctly
4. **Start developing**: Create your first feature branch
5. **Join the community**: Connect with other developers

## Additional Resources

- [Contributing Guide](../CONTRIBUTING.md)
- [Testing Guide](testing.md)
- [Webhook Testing Guide](webhook-testing.md)
- [API Documentation](../api-standards.md)
- [Database Patterns](../database-patterns.md)
- [Performance Optimization](../performance-optimization.md)

---

Happy coding! 🚀
