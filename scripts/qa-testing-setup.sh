#!/bin/bash

# KIN Communications Platform - QA Testing Setup Script
# This script prepares the environment for comprehensive end-to-end testing

set -e

echo "🚀 Starting QA Testing Setup for KIN Communications Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if ! command -v npx &> /dev/null; then
        missing_deps+=("npx")
    fi
    
    if ! command -v ngrok &> /dev/null; then
        missing_deps+=("ngrok")
    fi
    
    if ! command -v psql &> /dev/null; then
        missing_deps+=("postgresql")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_error "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Setup environment variables for testing
setup_environment() {
    print_status "Setting up environment variables for testing..."
    
    # Create .env.test file if it doesn't exist
    if [ ! -f .env.test ]; then
        print_status "Creating .env.test file..."
        cat > .env.test << EOF
# QA Testing Environment Variables
NODE_ENV=test
DATABASE_URL="postgresql://test_user:test_password@localhost:5432/kin_communications_test"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key-for-qa-testing"

# Twilio Test Credentials
TWILIO_ACCOUNT_SID="test_account_sid"
TWILIO_AUTH_TOKEN="test_auth_token"
TWILIO_PHONE_NUMBER="+15551234567"
TWILIO_WEBHOOK_URL="https://test-ngrok-url.ngrok.io"

# Quickbase Test Credentials
QUICKBASE_REALM="test-realm"
QUICKBASE_USER_TOKEN="test_user_token"
QUICKBASE_APP_TOKEN="test_app_token"

# Socket.io Configuration
SOCKET_IO_PORT=3001
SOCKET_IO_CORS_ORIGIN="http://localhost:3000"

# Test Data Configuration
TEST_DATA_ENABLED=true
TEST_PHONE_NUMBERS="+15551234567,+15559876543,+15551111111"
TEST_CUSTOMER_PHONES="+15552222222,+15553333333,+15554444444"

# Performance Testing
PERFORMANCE_TEST_ENABLED=true
MAX_CONCURRENT_USERS=30
LOAD_TEST_DURATION=300

# Security Testing
SECURITY_TEST_ENABLED=true
WEBHOOK_SIGNATURE_VALIDATION=true
RATE_LIMITING_ENABLED=true

# Cross-Browser Testing
BROWSER_TEST_ENABLED=true
SUPPORTED_BROWSERS="chrome,firefox,safari,edge"

# Mobile Testing
MOBILE_TEST_ENABLED=true
MOBILE_DEVICES="iphone14,ipad,samsung-galaxy"
EOF
        print_success "Created .env.test file"
    else
        print_warning ".env.test file already exists, skipping creation"
    fi
    
    # Load environment variables
    set -a
    source .env.test
    set +a
    print_success "Environment variables loaded"
}

# Setup test database
setup_test_database() {
    print_status "Setting up test database..."
    
    # Check if test database exists
    if psql -h localhost -U test_user -d kin_communications_test -c "SELECT 1;" &> /dev/null; then
        print_warning "Test database already exists, dropping and recreating..."
        psql -h localhost -U test_user -d postgres -c "DROP DATABASE IF EXISTS kin_communications_test;"
    fi
    
    # Create test database
    psql -h localhost -U test_user -d postgres -c "CREATE DATABASE kin_communications_test;"
    print_success "Test database created"
    
    # Run database migrations
    print_status "Running database migrations..."
    pnpm prisma migrate deploy --schema=./prisma/schema.prisma
    print_success "Database migrations completed"
    
    # Seed test data
    print_status "Seeding test data..."
    pnpm run db:seed:test
    print_success "Test data seeded"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install pnpm dependencies
    pnpm install
    print_success "pnpm dependencies installed"
    
    # Install Playwright browsers
    print_status "Installing Playwright browsers..."
    pnpm playwright install --with-deps
    print_success "Playwright browsers installed"
}

# Setup ngrok for webhook testing
setup_ngrok() {
    print_status "Setting up ngrok for webhook testing..."
    
    # Check if ngrok is already running
    if pgrep -f "ngrok" > /dev/null; then
        print_warning "ngrok is already running, stopping existing instance..."
        pkill -f "ngrok"
        sleep 2
    fi
    
    # Start ngrok tunnel
    print_status "Starting ngrok tunnel..."
    ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
    NGROK_PID=$!
    
    # Wait for ngrok to start
    sleep 5
    
    # Get ngrok URL
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
    
    if [ "$NGROK_URL" = "null" ] || [ -z "$NGROK_URL" ]; then
        print_error "Failed to get ngrok URL"
        exit 1
    fi
    
    print_success "ngrok tunnel started: $NGROK_URL"
    echo "NGROK_URL=$NGROK_URL" >> .env.test
    
    # Save ngrok PID for cleanup
    echo $NGROK_PID > ngrok.pid
}

# Create test users
create_test_users() {
    print_status "Creating test users..."
    
    # Create test users with different roles
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    
    const prisma = new PrismaClient();
    
    async function createTestUsers() {
        const users = [
            {
                name: 'QA Admin',
                email: 'qa-admin@example.com',
                password: await bcrypt.hash('password123', 10),
                role: 'admin',
                phone: '+15551234567'
            },
            {
                name: 'QA Agent',
                email: 'qa-agent@example.com',
                password: await bcrypt.hash('password123', 10),
                role: 'agent',
                phone: '+15551234568'
            },
            {
                name: 'QA Supervisor',
                email: 'qa-supervisor@example.com',
                password: await bcrypt.hash('password123', 10),
                role: 'supervisor',
                phone: '+15551234569'
            }
        ];
        
        for (const user of users) {
            await prisma.user.upsert({
                where: { email: user.email },
                update: user,
                create: user
            });
        }
        
        console.log('Test users created successfully');
        await prisma.\$disconnect();
    }
    
    createTestUsers().catch(console.error);
    "
    
    print_success "Test users created"
}

# Create test contacts
create_test_contacts() {
    print_status "Creating test contacts..."
    
    node -e "
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient();
    
    async function createTestContacts() {
        const contacts = [
            {
                name: 'Test Customer 1',
                phone: '+15552222222',
                email: 'customer1@example.com',
                company: 'Test Company 1',
                type: 'customer'
            },
            {
                name: 'Test Customer 2',
                phone: '+15553333333',
                email: 'customer2@example.com',
                company: 'Test Company 2',
                type: 'customer'
            },
            {
                name: 'VIP Customer',
                phone: '+15554444444',
                email: 'vip@example.com',
                company: 'VIP Company',
                type: 'vip'
            },
            {
                name: 'Field Crew Member',
                phone: '+15555555555',
                email: 'field@example.com',
                company: 'Field Services',
                type: 'field_crew'
            },
            {
                name: 'Sales Rep',
                phone: '+15556666666',
                email: 'sales@example.com',
                company: 'Sales Team',
                type: 'sales_rep'
            }
        ];
        
        for (const contact of contacts) {
            await prisma.contact.upsert({
                where: { phone: contact.phone },
                update: contact,
                create: contact
            });
        }
        
        console.log('Test contacts created successfully');
        await prisma.\$disconnect();
    }
    
    createTestContacts().catch(console.error);
    "
    
    print_success "Test contacts created"
}

# Setup test phone numbers
setup_test_phone_numbers() {
    print_status "Setting up test phone numbers..."
    
    node -e "
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient();
    
    async function setupTestPhoneNumbers() {
        const phoneNumbers = [
            {
                number: '+15551234567',
                friendlyName: 'Main Business Line',
                type: 'main',
                isActive: true
            },
            {
                number: '+15559876543',
                friendlyName: 'Support Line',
                type: 'support',
                isActive: true
            },
            {
                number: '+15551111111',
                friendlyName: 'Sales Line',
                type: 'sales',
                isActive: true
            }
        ];
        
        for (const phoneNumber of phoneNumbers) {
            await prisma.phoneNumber.upsert({
                where: { number: phoneNumber.number },
                update: phoneNumber,
                create: phoneNumber
            });
        }
        
        console.log('Test phone numbers configured successfully');
        await prisma.\$disconnect();
    }
    
    setupTestPhoneNumbers().catch(console.error);
    "
    
    print_success "Test phone numbers configured"
}

# Setup test data for all phases
setup_test_data() {
    print_status "Setting up comprehensive test data..."
    
    # Create test calls
    node -e "
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient();
    
    async function createTestCalls() {
        const calls = [
            {
                sid: 'CA_test_call_1',
                from: '+15552222222',
                to: '+15551234567',
                status: 'completed',
                direction: 'inbound',
                duration: 120,
                recordingUrl: 'https://example.com/recording1.mp3'
            },
            {
                sid: 'CA_test_call_2',
                from: '+15551234567',
                to: '+15553333333',
                status: 'completed',
                direction: 'outbound',
                duration: 180,
                recordingUrl: 'https://example.com/recording2.mp3'
            }
        ];
        
        for (const call of calls) {
            await prisma.call.upsert({
                where: { sid: call.sid },
                update: call,
                create: call
            });
        }
        
        console.log('Test calls created successfully');
        await prisma.\$disconnect();
    }
    
    createTestCalls().catch(console.error);
    "
    
    # Create test messages
    node -e "
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient();
    
    async function createTestMessages() {
        const messages = [
            {
                sid: 'SM_test_message_1',
                from: '+15552222222',
                to: '+15551234567',
                body: 'Test message from customer',
                status: 'delivered',
                direction: 'inbound'
            },
            {
                sid: 'SM_test_message_2',
                from: '+15551234567',
                to: '+15553333333',
                body: 'Test message to customer',
                status: 'delivered',
                direction: 'outbound'
            }
        ];
        
        for (const message of messages) {
            await prisma.message.upsert({
                where: { sid: message.sid },
                update: message,
                create: message
            });
        }
        
        console.log('Test messages created successfully');
        await prisma.\$disconnect();
    }
    
    createTestMessages().catch(console.error);
    "
    
    # Create test voicemails
    node -e "
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient();
    
    async function createTestVoicemails() {
        const voicemails = [
            {
                sid: 'VM_test_voicemail_1',
                from: '+15552222222',
                to: '+15551234567',
                transcription: 'Hello, this is a test voicemail message',
                recordingUrl: 'https://example.com/voicemail1.mp3',
                duration: 45,
                status: 'unread'
            },
            {
                sid: 'VM_test_voicemail_2',
                from: '+15553333333',
                to: '+15551234567',
                transcription: 'Another test voicemail message',
                recordingUrl: 'https://example.com/voicemail2.mp3',
                duration: 60,
                status: 'read'
            }
        ];
        
        for (const voicemail of voicemails) {
            await prisma.voicemail.upsert({
                where: { sid: voicemail.sid },
                update: voicemail,
                create: voicemail
            });
        }
        
        console.log('Test voicemails created successfully');
        await prisma.\$disconnect();
    }
    
    createTestVoicemails().catch(console.error);
    "
    
    print_success "Comprehensive test data created"
}

# Setup test configuration
setup_test_configuration() {
    print_status "Setting up test configuration..."
    
    # Create test configuration files
    mkdir -p tests/config
    
    # Create test configuration
    cat > tests/config/test-config.json << EOF
{
  "testUsers": {
    "admin": {
      "email": "qa-admin@example.com",
      "password": "password123",
      "role": "admin"
    },
    "agent": {
      "email": "qa-agent@example.com",
      "password": "password123",
      "role": "agent"
    },
    "supervisor": {
      "email": "qa-supervisor@example.com",
      "password": "password123",
      "role": "supervisor"
    }
  },
  "testContacts": {
    "customer": {
      "name": "Test Customer 1",
      "phone": "+15552222222",
      "email": "customer1@example.com",
      "company": "Test Company 1"
    },
    "vipCustomer": {
      "name": "VIP Customer",
      "phone": "+15554444444",
      "email": "vip@example.com",
      "company": "VIP Company"
    }
  },
  "testPhoneNumbers": {
    "main": "+15551234567",
    "support": "+15559876543",
    "sales": "+15551111111"
  },
  "performance": {
    "maxConcurrentUsers": 30,
    "loadTestDuration": 300,
    "responseTimeThreshold": 2000
  },
  "security": {
    "webhookSignatureValidation": true,
    "rateLimitingEnabled": true,
    "maxRequestsPerMinute": 100
  }
}
EOF
    
    print_success "Test configuration created"
}

# Setup cleanup function
setup_cleanup() {
    print_status "Setting up cleanup function..."
    
    cat > cleanup-qa.sh << 'EOF'
#!/bin/bash

echo "🧹 Cleaning up QA testing environment..."

# Stop ngrok if running
if [ -f ngrok.pid ]; then
    NGROK_PID=$(cat ngrok.pid)
    if kill -0 $NGROK_PID 2>/dev/null; then
        echo "Stopping ngrok..."
        kill $NGROK_PID
        rm ngrok.pid
    fi
fi

# Remove ngrok log
if [ -f ngrok.log ]; then
    rm ngrok.log
fi

# Clean up test database
echo "Cleaning up test database..."
psql -h localhost -U test_user -d postgres -c "DROP DATABASE IF EXISTS kin_communications_test;" 2>/dev/null || true

# Remove test environment file
if [ -f .env.test ]; then
    rm .env.test
fi

# Clean up test artifacts
rm -rf tests/artifacts/*
rm -rf tests/screenshots/*
rm -rf tests/videos/*

echo "✅ QA testing environment cleaned up"
EOF
    
    chmod +x cleanup-qa.sh
    print_success "Cleanup script created"
}

# Main setup function
main() {
    print_status "Starting QA testing setup..."
    
    check_dependencies
    setup_environment
    install_dependencies
    setup_test_database
    setup_ngrok
    create_test_users
    create_test_contacts
    setup_test_phone_numbers
    setup_test_data
    setup_test_configuration
    setup_cleanup
    
    print_success "QA testing setup completed successfully!"
    print_status "Next steps:"
    echo "1. Run 'pnpm run test:qa' to start comprehensive QA testing"
    echo "2. Run 'pnpm run test:performance' to test with 30 concurrent users"
    echo "3. Run 'pnpm run test:security' to validate webhook security"
    echo "4. Run 'pnpm run test:cross-browser' to test browser compatibility"
    echo "5. Run 'pnpm run test:mobile' to test mobile responsiveness"
    echo "6. Run './cleanup-qa.sh' to clean up when done"
    
    print_status "ngrok URL: $NGROK_URL"
    print_status "Test users created:"
    echo "  - Admin: qa-admin@example.com / password123"
    echo "  - Agent: qa-agent@example.com / password123"
    echo "  - Supervisor: qa-supervisor@example.com / password123"
}

# Run main function
main "$@"
