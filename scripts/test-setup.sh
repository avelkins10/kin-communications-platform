#!/bin/bash

# Test Environment Setup Script
# This script sets up the test environment for automated testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_NAME=${TEST_DB_NAME:-kin_communications_test}
TEST_DB_USER=${TEST_DB_USER:-postgres}
TEST_DB_PASSWORD=${TEST_DB_PASSWORD:-postgres}
TEST_DB_HOST=${TEST_DB_HOST:-localhost}
TEST_DB_PORT=${TEST_DB_PORT:-5432}
TEST_DB_URL="postgresql://$TEST_DB_USER:$TEST_DB_PASSWORD@$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  KIN Communications Platform  ${NC}"
    echo -e "${BLUE}     Test Environment Setup     ${NC}"
    echo -e "${BLUE}================================${NC}"
    echo
}

# Function to check if PostgreSQL is running
check_postgresql() {
    print_status "Checking PostgreSQL connection..."
    
    if ! pg_isready -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER > /dev/null 2>&1; then
        print_error "PostgreSQL is not running or not accessible!"
        echo
        echo "Please ensure PostgreSQL is running:"
        echo "  macOS: brew services start postgresql@15"
        echo "  Linux: sudo systemctl start postgresql"
        echo "  Windows: Start PostgreSQL service"
        echo
        exit 1
    fi
    
    print_status "PostgreSQL is running and accessible."
}

# Function to check if database exists
check_database() {
    print_status "Checking if test database exists..."
    
    if psql -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER -lqt | cut -d \| -f 1 | grep -qw $TEST_DB_NAME; then
        print_status "Test database '$TEST_DB_NAME' already exists."
        return 0
    else
        print_warning "Test database '$TEST_DB_NAME' does not exist."
        return 1
    fi
}

# Function to create test database
create_database() {
    print_status "Creating test database '$TEST_DB_NAME'..."
    
    # Create database
    createdb -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER $TEST_DB_NAME 2>/dev/null || {
        print_error "Failed to create test database!"
        echo
        echo "Please check:"
        echo "  1. PostgreSQL is running"
        echo "  2. User '$TEST_DB_USER' has CREATE DATABASE privileges"
        echo "  3. Database name '$TEST_DB_NAME' is not already in use"
        echo
        exit 1
    }
    
    print_status "Test database created successfully."
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Set environment variable for test database
    export DATABASE_URL="$TEST_DB_URL"
    
    # Run Prisma migrations
    if ! pnpm prisma migrate deploy > /dev/null 2>&1; then
        print_error "Failed to run database migrations!"
        echo
        echo "Please check:"
        echo "  1. Database connection is working"
        echo "  2. Prisma schema is valid"
        echo "  3. Migration files are present"
        echo
        exit 1
    fi
    
    print_status "Database migrations completed successfully."
}

# Function to generate Prisma client
generate_prisma_client() {
    print_status "Generating Prisma client..."
    
    if ! pnpm prisma generate > /dev/null 2>&1; then
        print_error "Failed to generate Prisma client!"
        echo
        echo "Please check:"
        echo "  1. Prisma schema is valid"
        echo "  2. Dependencies are installed"
        echo
        exit 1
    fi
    
    print_status "Prisma client generated successfully."
}

# Function to seed test data
seed_test_data() {
    print_status "Seeding test data..."
    
    # Set environment variable for test database
    export DATABASE_URL="$TEST_DB_URL"
    
    # Run seed script if it exists
    if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
        if ! pnpm prisma db seed > /dev/null 2>&1; then
            print_warning "Failed to seed test data (this is optional)."
        else
            print_status "Test data seeded successfully."
        fi
    else
        print_warning "No seed script found. Skipping test data seeding."
    fi
}

# Function to verify test setup
verify_setup() {
    print_status "Verifying test setup..."
    
    # Test database connection
    if ! psql -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER -d $TEST_DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        print_error "Failed to connect to test database!"
        exit 1
    fi
    
    # Test Prisma connection
    export DATABASE_URL="$TEST_DB_URL"
    if ! pnpm prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        print_error "Failed to connect to test database via Prisma!"
        exit 1
    fi
    
    print_status "Test setup verified successfully."
}

# Function to display test configuration
display_config() {
    echo
    print_status "Test Configuration:"
    echo
    echo "Database URL: $TEST_DB_URL"
    echo "Database Name: $TEST_DB_NAME"
    echo "Database Host: $TEST_DB_HOST"
    echo "Database Port: $TEST_DB_PORT"
    echo "Database User: $TEST_DB_USER"
    echo
}

# Function to display environment variables
display_environment_variables() {
    echo
    print_status "Environment Variables for Testing:"
    echo
    echo "Add the following to your .env.test file:"
    echo
    echo "DATABASE_URL=\"$TEST_DB_URL\""
    echo "NEXTAUTH_SECRET=\"test-secret-key-for-testing\""
    echo "NEXTAUTH_URL=\"http://localhost:3000\""
    echo "TWILIO_ACCOUNT_SID=\"test-account-sid\""
    echo "TWILIO_AUTH_TOKEN=\"test-auth-token\""
    echo "TWILIO_PHONE_NUMBER=\"+15551234567\""
    echo "TWILIO_WEBHOOK_URL=\"https://test.ngrok.io\""
    echo "QUICKBASE_REALM=\"test-realm\""
    echo "QUICKBASE_USER_TOKEN=\"test-user-token\""
    echo "QUICKBASE_APP_ID=\"test-app-id\""
    echo "SOCKET_IO_CORS_ORIGIN=\"http://localhost:3000\""
    echo "NODE_ENV=\"test\""
    echo
}

# Function to display testing instructions
display_testing_instructions() {
    echo
    print_status "Testing Instructions:"
    echo
    echo "1. Run unit tests:"
    echo "   pnpm test"
    echo
    echo "2. Run integration tests:"
    echo "   pnpm test:integration"
    echo
    echo "3. Run end-to-end tests:"
    echo "   pnpm e2e"
    echo
    echo "4. Run all tests:"
    echo "   pnpm test:all"
    echo
    echo "5. Run tests with coverage:"
    echo "   pnpm test:coverage"
    echo
}

# Function to cleanup test database
cleanup_database() {
    print_status "Cleaning up test database..."
    
    # Drop database
    dropdb -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER $TEST_DB_NAME 2>/dev/null || {
        print_warning "Failed to drop test database (it may not exist)."
    }
    
    print_status "Test database cleaned up."
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -c, --cleanup        Clean up test database and exit"
    echo "  -v, --verify         Verify test setup and exit"
    echo "  -h, --help           Show this help message"
    echo
    echo "Environment Variables:"
    echo "  TEST_DB_NAME         Test database name (default: kin_communications_test)"
    echo "  TEST_DB_USER         Test database user (default: postgres)"
    echo "  TEST_DB_PASSWORD     Test database password (default: postgres)"
    echo "  TEST_DB_HOST         Test database host (default: localhost)"
    echo "  TEST_DB_PORT         Test database port (default: 5432)"
    echo
    echo "Examples:"
    echo "  $0                   # Set up test environment"
    echo "  $0 -c               # Clean up test database"
    echo "  $0 -v               # Verify test setup"
    echo "  TEST_DB_NAME=my_test_db $0  # Use custom database name"
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--cleanup)
            print_header
            cleanup_database
            exit 0
            ;;
        -v|--verify)
            print_header
            verify_setup
            exit 0
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_header
    
    # Check prerequisites
    check_postgresql
    
    # Check if database exists
    if ! check_database; then
        create_database
    fi
    
    # Set up database
    run_migrations
    generate_prisma_client
    seed_test_data
    
    # Verify setup
    verify_setup
    
    # Display information
    display_config
    display_environment_variables
    display_testing_instructions
    
    print_status "Test environment setup completed successfully!"
    echo
}

# Run main function
main "$@"
