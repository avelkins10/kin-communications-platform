#!/bin/bash

# KIN Communications Platform - QA Testing Runner Script
# This script runs comprehensive end-to-end testing with proper reporting

set -e

echo "🚀 Starting QA Testing Runner for KIN Communications Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_test() {
    echo -e "${PURPLE}[TEST]${NC} $1"
}

# Configuration
TEST_RESULTS_DIR="test-results/qa"
TEST_ARTIFACTS_DIR="tests/artifacts"
TEST_SCREENSHOTS_DIR="tests/screenshots"
TEST_VIDEOS_DIR="tests/videos"
TEST_REPORTS_DIR="tests/reports"

# Create directories
create_directories() {
    print_status "Creating test directories..."
    mkdir -p "$TEST_RESULTS_DIR"
    mkdir -p "$TEST_ARTIFACTS_DIR"
    mkdir -p "$TEST_SCREENSHOTS_DIR"
    mkdir -p "$TEST_VIDEOS_DIR"
    mkdir -p "$TEST_REPORTS_DIR"
    print_success "Test directories created"
}

# Load environment variables
load_environment() {
    print_status "Loading environment variables..."
    if [ -f .env.test ]; then
        export $(cat .env.test | grep -v '^#' | xargs)
        print_success "Environment variables loaded"
    else
        print_error ".env.test file not found. Please run setup script first."
        exit 1
    fi
}

# Start application
start_application() {
    print_status "Starting application for testing..."
    
    # Kill any existing processes
    pkill -f "next dev" || true
    pkill -f "node server.js" || true
    
    # Start the application
    npm run dev > app.log 2>&1 &
    APP_PID=$!
    
    # Wait for application to start
    print_status "Waiting for application to start..."
    sleep 10
    
    # Check if application is running
    if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_error "Application failed to start"
        exit 1
    fi
    
    print_success "Application started successfully (PID: $APP_PID)"
    echo $APP_PID > app.pid
}

# Start ngrok tunnel
start_ngrok() {
    print_status "Starting ngrok tunnel..."
    
    # Check if ngrok is already running
    if pgrep -f "ngrok" > /dev/null; then
        print_warning "ngrok is already running"
        return
    fi
    
    # Start ngrok tunnel
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
    echo $NGROK_PID > ngrok.pid
    echo "NGROK_URL=$NGROK_URL" >> .env.test
}

# Run comprehensive QA tests
run_comprehensive_qa() {
    print_test "Running comprehensive QA tests..."
    
    npx playwright test tests/e2e/comprehensive-qa.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/comprehensive-qa" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=60000
    
    if [ $? -eq 0 ]; then
        print_success "Comprehensive QA tests passed"
    else
        print_error "Comprehensive QA tests failed"
        return 1
    fi
}

# Run voice calling integration tests
run_voice_calling_tests() {
    print_test "Running voice calling integration tests..."
    
    npx playwright test tests/e2e/voice-calling-integration.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/voice-calling" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=120000
    
    if [ $? -eq 0 ]; then
        print_success "Voice calling integration tests passed"
    else
        print_error "Voice calling integration tests failed"
        return 1
    fi
}

# Run SMS messaging integration tests
run_sms_messaging_tests() {
    print_test "Running SMS messaging integration tests..."
    
    npx playwright test tests/e2e/sms-messaging-integration.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/sms-messaging" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=60000
    
    if [ $? -eq 0 ]; then
        print_success "SMS messaging integration tests passed"
    else
        print_error "SMS messaging integration tests failed"
        return 1
    fi
}

# Run voicemail transcription tests
run_voicemail_transcription_tests() {
    print_test "Running voicemail transcription tests..."
    
    npx playwright test tests/e2e/voicemail-transcription.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/voicemail-transcription" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=90000
    
    if [ $? -eq 0 ]; then
        print_success "Voicemail transcription tests passed"
    else
        print_error "Voicemail transcription tests failed"
        return 1
    fi
}

# Run Quickbase integration tests
run_quickbase_integration_tests() {
    print_test "Running Quickbase integration tests..."
    
    npx playwright test tests/e2e/quickbase-integration.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/quickbase-integration" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=60000
    
    if [ $? -eq 0 ]; then
        print_success "Quickbase integration tests passed"
    else
        print_error "Quickbase integration tests failed"
        return 1
    fi
}

# Run TaskRouter functionality tests
run_taskrouter_tests() {
    print_test "Running TaskRouter functionality tests..."
    
    npx playwright test tests/e2e/taskrouter-functionality.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/taskrouter" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=90000
    
    if [ $? -eq 0 ]; then
        print_success "TaskRouter functionality tests passed"
    else
        print_error "TaskRouter functionality tests failed"
        return 1
    fi
}

# Run admin panel functionality tests
run_admin_panel_tests() {
    print_test "Running admin panel functionality tests..."
    
    npx playwright test tests/e2e/admin-panel-functionality.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/admin-panel" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=60000
    
    if [ $? -eq 0 ]; then
        print_success "Admin panel functionality tests passed"
    else
        print_error "Admin panel functionality tests failed"
        return 1
    fi
}

# Run real-time features tests
run_realtime_features_tests() {
    print_test "Running real-time features tests..."
    
    npx playwright test tests/e2e/realtime-features.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/realtime-features" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=60000
    
    if [ $? -eq 0 ]; then
        print_success "Real-time features tests passed"
    else
        print_error "Real-time features tests failed"
        return 1
    fi
}

# Run performance tests
run_performance_tests() {
    print_test "Running performance tests (30 concurrent users)..."
    
    npx playwright test tests/performance/concurrent-users.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/performance" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=300000
    
    if [ $? -eq 0 ]; then
        print_success "Performance tests passed"
    else
        print_error "Performance tests failed"
        return 1
    fi
}

# Run security tests
run_security_tests() {
    print_test "Running security tests..."
    
    npx playwright test tests/security/webhook-security.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/security" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=60000
    
    if [ $? -eq 0 ]; then
        print_success "Security tests passed"
    else
        print_error "Security tests failed"
        return 1
    fi
}

# Run cross-browser compatibility tests
run_cross_browser_tests() {
    print_test "Running cross-browser compatibility tests..."
    
    npx playwright test tests/cross-browser/compatibility.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/cross-browser" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=120000
    
    if [ $? -eq 0 ]; then
        print_success "Cross-browser compatibility tests passed"
    else
        print_error "Cross-browser compatibility tests failed"
        return 1
    fi
}

# Run mobile responsiveness tests
run_mobile_tests() {
    print_test "Running mobile responsiveness tests..."
    
    npx playwright test tests/mobile/responsiveness.spec.ts \
        --reporter=html,json \
        --output-dir="$TEST_RESULTS_DIR/mobile" \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --timeout=90000
    
    if [ $? -eq 0 ]; then
        print_success "Mobile responsiveness tests passed"
    else
        print_error "Mobile responsiveness tests failed"
        return 1
    fi
}

# Generate comprehensive test report
generate_test_report() {
    print_status "Generating comprehensive test report..."
    
    # Create report directory
    REPORT_DIR="$TEST_REPORTS_DIR/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$REPORT_DIR"
    
    # Generate HTML report
    cat > "$REPORT_DIR/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KIN Communications Platform - QA Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { background: #d4edda; border-color: #c3e6cb; }
        .failed { background: #f8d7da; border-color: #f5c6cb; }
        .summary { background: #e2e3e5; padding: 15px; border-radius: 5px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric { background: white; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; }
        .metric-label { color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>KIN Communications Platform - QA Test Report</h1>
        <p>Generated on: $(date)</p>
        <p>Test Environment: QA Testing</p>
    </div>
    
    <div class="summary">
        <h2>Test Summary</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value" style="color: #28a745;">$TOTAL_PASSED</div>
                <div class="metric-label">Tests Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #dc3545;">$TOTAL_FAILED</div>
                <div class="metric-label">Tests Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #007bff;">$TOTAL_TESTS</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #ffc107;">$SUCCESS_RATE%</div>
                <div class="metric-label">Success Rate</div>
            </div>
        </div>
    </div>
    
    <div class="test-section $([ $COMPREHENSIVE_QA_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>Comprehensive QA Tests</h3>
        <p>Status: $([ $COMPREHENSIVE_QA_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests all 10 phases of the KIN Communications Platform</p>
    </div>
    
    <div class="test-section $([ $VOICE_CALLING_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>Voice Calling Integration</h3>
        <p>Status: $([ $VOICE_CALLING_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests Phase 3 voice calling functionality</p>
    </div>
    
    <div class="test-section $([ $SMS_MESSAGING_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>SMS Messaging Integration</h3>
        <p>Status: $([ $SMS_MESSAGING_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests Phase 4 SMS messaging functionality</p>
    </div>
    
    <div class="test-section $([ $VOICEMAIL_TRANSCRIPTION_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>Voicemail Transcription</h3>
        <p>Status: $([ $VOICEMAIL_TRANSCRIPTION_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests Phase 5 voicemail system</p>
    </div>
    
    <div class="test-section $([ $QUICKBASE_INTEGRATION_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>Quickbase Integration</h3>
        <p>Status: $([ $QUICKBASE_INTEGRATION_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests Phase 6 CRM integration</p>
    </div>
    
    <div class="test-section $([ $TASKROUTER_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>TaskRouter Functionality</h3>
        <p>Status: $([ $TASKROUTER_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests Phase 7 intelligent routing</p>
    </div>
    
    <div class="test-section $([ $ADMIN_PANEL_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>Admin Panel Functionality</h3>
        <p>Status: $([ $ADMIN_PANEL_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests Phase 8 admin features</p>
    </div>
    
    <div class="test-section $([ $REALTIME_FEATURES_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>Real-time Features</h3>
        <p>Status: $([ $REALTIME_FEATURES_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests Phase 9 real-time functionality</p>
    </div>
    
    <div class="test-section $([ $PERFORMANCE_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>Performance Tests</h3>
        <p>Status: $([ $PERFORMANCE_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests 30 concurrent users</p>
    </div>
    
    <div class="test-section $([ $SECURITY_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>Security Tests</h3>
        <p>Status: $([ $SECURITY_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests webhook security</p>
    </div>
    
    <div class="test-section $([ $CROSS_BROWSER_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>Cross-Browser Compatibility</h3>
        <p>Status: $([ $CROSS_BROWSER_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests Chrome, Firefox, Safari, Edge</p>
    </div>
    
    <div class="test-section $([ $MOBILE_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">
        <h3>Mobile Responsiveness</h3>
        <p>Status: $([ $MOBILE_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</p>
        <p>Tests tablet and mobile devices</p>
    </div>
    
    <div class="summary">
        <h2>Test Artifacts</h2>
        <p>Screenshots: <a href="../screenshots">View Screenshots</a></p>
        <p>Videos: <a href="../videos">View Videos</a></p>
        <p>Logs: <a href="../artifacts">View Logs</a></p>
    </div>
</body>
</html>
EOF
    
    print_success "Test report generated: $REPORT_DIR/index.html"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Stop application
    if [ -f app.pid ]; then
        APP_PID=$(cat app.pid)
        if kill -0 $APP_PID 2>/dev/null; then
            print_status "Stopping application..."
            kill $APP_PID
            rm app.pid
        fi
    fi
    
    # Stop ngrok
    if [ -f ngrok.pid ]; then
        NGROK_PID=$(cat ngrok.pid)
        if kill -0 $NGROK_PID 2>/dev/null; then
            print_status "Stopping ngrok..."
            kill $NGROK_PID
            rm ngrok.pid
        fi
    fi
    
    # Remove log files
    rm -f app.log ngrok.log
    
    print_success "Cleanup completed"
}

# Main function
main() {
    # Parse command line arguments
    TEST_SUITE=""
    while [[ $# -gt 0 ]]; do
        case $1 in
            --suite)
                TEST_SUITE="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [--suite SUITE_NAME]"
                echo "Available test suites:"
                echo "  comprehensive-qa    - Run all comprehensive QA tests"
                echo "  voice-calling       - Run voice calling integration tests"
                echo "  sms-messaging       - Run SMS messaging integration tests"
                echo "  voicemail           - Run voicemail transcription tests"
                echo "  quickbase           - Run Quickbase integration tests"
                echo "  taskrouter          - Run TaskRouter functionality tests"
                echo "  admin-panel         - Run admin panel functionality tests"
                echo "  realtime            - Run real-time features tests"
                echo "  performance         - Run performance tests"
                echo "  security            - Run security tests"
                echo "  cross-browser       - Run cross-browser compatibility tests"
                echo "  mobile              - Run mobile responsiveness tests"
                echo "  all                 - Run all test suites"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Set default test suite if not specified
    if [ -z "$TEST_SUITE" ]; then
        TEST_SUITE="all"
    fi
    
    print_status "Starting QA testing for suite: $TEST_SUITE"
    
    # Setup
    create_directories
    load_environment
    start_application
    start_ngrok
    
    # Initialize result variables
    COMPREHENSIVE_QA_RESULT=0
    VOICE_CALLING_RESULT=0
    SMS_MESSAGING_RESULT=0
    VOICEMAIL_TRANSCRIPTION_RESULT=0
    QUICKBASE_INTEGRATION_RESULT=0
    TASKROUTER_RESULT=0
    ADMIN_PANEL_RESULT=0
    REALTIME_FEATURES_RESULT=0
    PERFORMANCE_RESULT=0
    SECURITY_RESULT=0
    CROSS_BROWSER_RESULT=0
    MOBILE_RESULT=0
    
    # Run tests based on suite
    case $TEST_SUITE in
        "comprehensive-qa")
            run_comprehensive_qa
            COMPREHENSIVE_QA_RESULT=$?
            ;;
        "voice-calling")
            run_voice_calling_tests
            VOICE_CALLING_RESULT=$?
            ;;
        "sms-messaging")
            run_sms_messaging_tests
            SMS_MESSAGING_RESULT=$?
            ;;
        "voicemail")
            run_voicemail_transcription_tests
            VOICEMAIL_TRANSCRIPTION_RESULT=$?
            ;;
        "quickbase")
            run_quickbase_integration_tests
            QUICKBASE_INTEGRATION_RESULT=$?
            ;;
        "taskrouter")
            run_taskrouter_tests
            TASKROUTER_RESULT=$?
            ;;
        "admin-panel")
            run_admin_panel_tests
            ADMIN_PANEL_RESULT=$?
            ;;
        "realtime")
            run_realtime_features_tests
            REALTIME_FEATURES_RESULT=$?
            ;;
        "performance")
            run_performance_tests
            PERFORMANCE_RESULT=$?
            ;;
        "security")
            run_security_tests
            SECURITY_RESULT=$?
            ;;
        "cross-browser")
            run_cross_browser_tests
            CROSS_BROWSER_RESULT=$?
            ;;
        "mobile")
            run_mobile_tests
            MOBILE_RESULT=$?
            ;;
        "all")
            run_comprehensive_qa
            COMPREHENSIVE_QA_RESULT=$?
            
            run_voice_calling_tests
            VOICE_CALLING_RESULT=$?
            
            run_sms_messaging_tests
            SMS_MESSAGING_RESULT=$?
            
            run_voicemail_transcription_tests
            VOICEMAIL_TRANSCRIPTION_RESULT=$?
            
            run_quickbase_integration_tests
            QUICKBASE_INTEGRATION_RESULT=$?
            
            run_taskrouter_tests
            TASKROUTER_RESULT=$?
            
            run_admin_panel_tests
            ADMIN_PANEL_RESULT=$?
            
            run_realtime_features_tests
            REALTIME_FEATURES_RESULT=$?
            
            run_performance_tests
            PERFORMANCE_RESULT=$?
            
            run_security_tests
            SECURITY_RESULT=$?
            
            run_cross_browser_tests
            CROSS_BROWSER_RESULT=$?
            
            run_mobile_tests
            MOBILE_RESULT=$?
            ;;
        *)
            print_error "Unknown test suite: $TEST_SUITE"
            exit 1
            ;;
    esac
    
    # Calculate totals
    TOTAL_TESTS=11
    TOTAL_PASSED=0
    TOTAL_FAILED=0
    
    [ $COMPREHENSIVE_QA_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    [ $VOICE_CALLING_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    [ $SMS_MESSAGING_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    [ $VOICEMAIL_TRANSCRIPTION_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    [ $QUICKBASE_INTEGRATION_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    [ $TASKROUTER_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    [ $ADMIN_PANEL_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    [ $REALTIME_FEATURES_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    [ $PERFORMANCE_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    [ $SECURITY_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    [ $CROSS_BROWSER_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    [ $MOBILE_RESULT -eq 0 ] && ((TOTAL_PASSED++)) || ((TOTAL_FAILED++))
    
    SUCCESS_RATE=$((TOTAL_PASSED * 100 / TOTAL_TESTS))
    
    # Generate report
    generate_test_report
    
    # Print summary
    print_status "QA Testing Summary:"
    echo "  Total Tests: $TOTAL_TESTS"
    echo "  Passed: $TOTAL_PASSED"
    echo "  Failed: $TOTAL_FAILED"
    echo "  Success Rate: $SUCCESS_RATE%"
    
    # Cleanup
    cleanup
    
    # Exit with appropriate code
    if [ $TOTAL_FAILED -eq 0 ]; then
        print_success "All tests passed!"
        exit 0
    else
        print_error "Some tests failed!"
        exit 1
    fi
}

# Run main function
main "$@"
