#!/bin/bash

# KIN Communications Platform - Pre-Testing Validation Script
# This script performs systematic validation of all platform components

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation report file
REPORT_FILE="validation-report-$(date +%Y%m%d-%H%M%S).md"
LOG_FILE="validation-log-$(date +%Y%m%d-%H%M%S).log"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            echo "✅ $message" >> "$REPORT_FILE"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            echo "❌ $message" >> "$REPORT_FILE"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            echo "⚠️  $message" >> "$REPORT_FILE"
            ;;
        "info")
            echo -e "${BLUE}ℹ️  $message${NC}"
            echo "ℹ️  $message" >> "$REPORT_FILE"
            ;;
    esac
    echo "$message" >> "$LOG_FILE"
}

# Function to check command availability
check_command() {
    if command -v $1 &> /dev/null; then
        print_status "success" "$1 is installed"
        return 0
    else
        print_status "error" "$1 is not installed"
        return 1
    fi
}

# Function to check environment variables
check_env_var() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        print_status "error" "$var_name is not set"
        return 1
    else
        print_status "success" "$var_name is configured"
        return 0
    fi
}

# Function to test API endpoint
test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local auth_required=$3
    
    if [ "$auth_required" = "true" ]; then
        # For authenticated endpoints, we'll skip in this basic validation
        print_status "info" "Skipping authenticated endpoint: $endpoint (requires session)"
        return 0
    fi
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        print_status "success" "Endpoint $endpoint returned $response"
        return 0
    else
        print_status "error" "Endpoint $endpoint returned $response (expected $expected_status)"
        return 1
    fi
}

# Initialize report
echo "# KIN Communications Platform - Validation Report" > "$REPORT_FILE"
echo "Generated on: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Start validation
print_status "info" "Starting KIN Communications Platform validation..."
echo "" >> "$REPORT_FILE"

# 1. Check Prerequisites
echo "## Prerequisites Check" >> "$REPORT_FILE"
print_status "info" "Checking prerequisites..."

check_command "node"
check_command "npm"
check_command "psql"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
if [ "$NODE_MAJOR" -ge 18 ]; then
    print_status "success" "Node.js version $NODE_VERSION meets requirements"
else
    print_status "error" "Node.js version $NODE_VERSION does not meet requirements (need 18+)"
fi

echo "" >> "$REPORT_FILE"

# 2. Check Environment Configuration
echo "## Environment Configuration" >> "$REPORT_FILE"
print_status "info" "Checking environment configuration..."

# Load environment variables if .env.local exists
if [ -f ".env.local" ]; then
    set -a
    . ./.env.local
    set +a
    print_status "success" ".env.local file found"
else
    print_status "error" ".env.local file not found"
fi

# Check critical environment variables
ENV_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "NEXT_PUBLIC_SOCKET_URL"
)

env_check_passed=true
for var in "${ENV_VARS[@]}"; do
    if ! check_env_var "$var"; then
        env_check_passed=false
    fi
done

echo "" >> "$REPORT_FILE"

# 3. Database Connectivity
echo "## Database Connectivity" >> "$REPORT_FILE"
print_status "info" "Testing database connectivity..."

# Test database connection using Prisma
if npm run db:generate > /dev/null 2>&1; then
    print_status "success" "Prisma client generated successfully"
else
    print_status "error" "Failed to generate Prisma client"
fi

# Check migration status
if npx prisma migrate status > /dev/null 2>&1; then
    print_status "success" "Database migrations are up to date"
else
    print_status "warning" "Database migrations may need to be applied"
fi

echo "" >> "$REPORT_FILE"

# 4. Build Status
echo "## Build Status" >> "$REPORT_FILE"
print_status "info" "Checking build status..."

if [ -d ".next" ]; then
    print_status "success" "Next.js build directory exists"
else
    print_status "warning" "Next.js build directory not found - run 'npm run build'"
fi

echo "" >> "$REPORT_FILE"

# 5. API Endpoint Testing
echo "## API Endpoint Validation" >> "$REPORT_FILE"
print_status "info" "Testing API endpoints..."

# Check if server is running
SERVER_RUNNING=false
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>/dev/null | grep -q "200\|302"; then
    SERVER_RUNNING=true
    print_status "success" "Server is running on port 3000"
else
    print_status "warning" "Server not detected on port 3000 - some tests will be skipped"
fi

if [ "$SERVER_RUNNING" = true ]; then
    # Test public endpoints
    test_endpoint "/api/health" "200" "false"
    test_endpoint "/" "200" "false"
    test_endpoint "/login" "200" "false"
    
    # Test protected endpoints (will redirect or return 401)
    test_endpoint "/api/contacts" "401" "true"
    test_endpoint "/dashboard" "302" "true"
fi

echo "" >> "$REPORT_FILE"

# 6. Socket.io Validation
echo "## Socket.io Configuration" >> "$REPORT_FILE"
print_status "info" "Checking Socket.io configuration..."

if [ "$SERVER_RUNNING" = true ]; then
    # Check if Socket.io endpoint responds
    socket_response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/socket.io/" 2>/dev/null || echo "000")
    if [ "$socket_response" = "400" ] || [ "$socket_response" = "200" ]; then
        print_status "success" "Socket.io endpoint is accessible"
    else
        print_status "warning" "Socket.io endpoint returned unexpected status: $socket_response"
    fi
else
    print_status "info" "Socket.io validation skipped (server not running)"
fi

echo "" >> "$REPORT_FILE"

# 7. UI Component Check
echo "## UI Component Status" >> "$REPORT_FILE"
print_status "info" "Checking UI components..."

# Check if component files exist
UI_COMPONENTS=(
    "src/components/ui/button.tsx"
    "src/components/ui/card.tsx"
    "src/components/ui/dialog.tsx"
    "src/components/ui/table.tsx"
    "src/components/ui/tabs.tsx"
)

components_found=0
for component in "${UI_COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        ((components_found++))
    fi
done

print_status "success" "Found $components_found/${#UI_COMPONENTS[@]} core UI components"

echo "" >> "$REPORT_FILE"

# 8. Test Suite Availability
echo "## Test Suite Status" >> "$REPORT_FILE"
print_status "info" "Checking test suite availability..."

# Check test directories
TEST_DIRS=(
    "tests/e2e"
    "tests/api"
    "tests/integration"
    "tests/security"
    "tests/performance"
)

test_dirs_found=0
for dir in "${TEST_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        ((test_dirs_found++))
    fi
done

print_status "success" "Found $test_dirs_found/${#TEST_DIRS[@]} test directories"

# Check for test configuration files
if [ -f "playwright.config.ts" ]; then
    print_status "success" "Playwright configuration found"
else
    print_status "warning" "Playwright configuration not found"
fi

echo "" >> "$REPORT_FILE"

# 9. Summary
echo "## Validation Summary" >> "$REPORT_FILE"
print_status "info" "Generating validation summary..."

# Count successes, errors, and warnings
SUCCESS_COUNT=$(grep -c "✅" "$REPORT_FILE" || true)
ERROR_COUNT=$(grep -c "❌" "$REPORT_FILE" || true)
WARNING_COUNT=$(grep -c "⚠️" "$REPORT_FILE" || true)

echo "" >> "$REPORT_FILE"
echo "### Results" >> "$REPORT_FILE"
echo "- ✅ Passed: $SUCCESS_COUNT" >> "$REPORT_FILE"
echo "- ❌ Failed: $ERROR_COUNT" >> "$REPORT_FILE"
echo "- ⚠️  Warnings: $WARNING_COUNT" >> "$REPORT_FILE"

# Determine overall status
if [ "$ERROR_COUNT" -eq 0 ]; then
    if [ "$WARNING_COUNT" -eq 0 ]; then
        echo "" >> "$REPORT_FILE"
        echo "### Status: READY FOR TESTING ✅" >> "$REPORT_FILE"
        print_status "success" "Platform validation completed successfully!"
    else
        echo "" >> "$REPORT_FILE"
        echo "### Status: READY WITH WARNINGS ⚠️" >> "$REPORT_FILE"
        print_status "warning" "Platform validation completed with warnings"
    fi
else
    echo "" >> "$REPORT_FILE"
    echo "### Status: NOT READY ❌" >> "$REPORT_FILE"
    print_status "error" "Platform validation failed - address errors before testing"
fi

echo "" >> "$REPORT_FILE"
echo "### Next Steps" >> "$REPORT_FILE"
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "1. Review and fix all errors marked with ❌" >> "$REPORT_FILE"
    echo "2. Re-run validation script" >> "$REPORT_FILE"
else
    echo "1. Run 'npm run dev' to start the development server" >> "$REPORT_FILE"
    echo "2. Run 'npm run validate:platform' for comprehensive testing" >> "$REPORT_FILE"
    echo "3. Review any warnings and address if needed" >> "$REPORT_FILE"
fi

# Final output
echo ""
print_status "info" "Validation report saved to: $REPORT_FILE"
print_status "info" "Detailed log saved to: $LOG_FILE"

# Exit with appropriate code
if [ "$ERROR_COUNT" -gt 0 ]; then
    exit 1
else
    exit 0
fi
