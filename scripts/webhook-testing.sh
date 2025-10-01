#!/bin/bash

# Webhook Testing Script for KIN Communications Hub
# This script helps configure and test Twilio webhooks for development and testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3000"}
NGROK_URL=${NGROK_URL:-""}
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID:-""}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN:-""}
TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER:-""}
TWILIO_PHONE_SID=${TWILIO_PHONE_SID:-""}

# Webhook endpoints
VOICE_WEBHOOK="/api/webhooks/twilio/voice"
SMS_WEBHOOK="/api/webhooks/twilio/sms"
MESSAGE_STATUS_WEBHOOK="/api/webhooks/twilio/message-status"
RECORDING_WEBHOOK="/api/webhooks/twilio/recording"
TRANSCRIPTION_WEBHOOK="/api/webhooks/twilio/transcription"
STATUS_WEBHOOK="/api/webhooks/twilio/status"

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

# Function to check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed. JSON responses will not be formatted"
    fi
    
    print_success "Dependencies check completed"
}

# Function to validate environment variables
validate_env() {
    print_status "Validating environment variables..."
    
    if [ -z "$TWILIO_ACCOUNT_SID" ]; then
        print_error "TWILIO_ACCOUNT_SID is not set"
        exit 1
    fi
    
    if [ -z "$TWILIO_AUTH_TOKEN" ]; then
        print_error "TWILIO_AUTH_TOKEN is not set"
        exit 1
    fi
    
    if [ -z "$TWILIO_PHONE_SID" ]; then
        print_error "TWILIO_PHONE_SID is not set"
        exit 1
    fi
    
    print_success "Environment variables validated"
}

# Function to start ngrok if not already running
start_ngrok() {
    if [ -n "$NGROK_URL" ]; then
        print_status "Using provided NGROK_URL: $NGROK_URL"
        return
    fi
    
    print_status "Checking if ngrok is running..."
    
    if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null || echo "")
        if [ -n "$NGROK_URL" ]; then
            print_success "Found running ngrok tunnel: $NGROK_URL"
            return
        fi
    fi
    
    print_warning "ngrok is not running. Please start ngrok with: ngrok http 3000"
    print_warning "Then set NGROK_URL environment variable or restart this script"
    exit 1
}

# Function to test webhook endpoint
test_webhook() {
    local endpoint=$1
    local method=${2:-"POST"}
    local data=$3
    local description=$4
    
    print_status "Testing $description..."
    
    local url="${BASE_URL}${endpoint}"
    local response
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
    fi
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        print_success "$description - HTTP $http_code"
        if command -v jq &> /dev/null && echo "$body" | jq . > /dev/null 2>&1; then
            echo "$body" | jq .
        else
            echo "$body"
        fi
    else
        print_error "$description - HTTP $http_code"
        echo "$body"
    fi
    
    echo ""
}

# Function to update Twilio webhook URLs
update_twilio_webhooks() {
    print_status "Updating Twilio webhook URLs..."
    
    local webhook_base="$NGROK_URL"
    
    # Update voice webhook
    print_status "Updating voice webhook URL..."
    curl -s -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/IncomingPhoneNumbers/$TWILIO_PHONE_SID.json" \
        -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
        -d "VoiceUrl=${webhook_base}${VOICE_WEBHOOK}" \
        -d "VoiceMethod=POST" \
        -d "StatusCallback=${webhook_base}${STATUS_WEBHOOK}" \
        -d "StatusCallbackMethod=POST" \
        -d "SmsUrl=${webhook_base}${SMS_WEBHOOK}" \
        -d "SmsMethod=POST" \
        -d "SmsStatusCallback=${webhook_base}${MESSAGE_STATUS_WEBHOOK}" \
        -d "SmsStatusCallbackMethod=POST" > /dev/null
    
    
    print_success "Twilio webhook URLs updated"
}

# Function to test webhook security
test_webhook_security() {
    print_status "Testing webhook security..."
    
    # Test with invalid signature
    test_webhook "$VOICE_WEBHOOK" "POST" '{
        "CallSid": "CA1234567890abcdef1234567890abcdef",
        "From": "+15551234567",
        "To": "+15559876543",
        "CallStatus": "ringing",
        "Direction": "inbound"
    }' "Voice webhook with invalid signature (should fail)"
    
    # Test with valid signature (this would require proper signature computation)
    print_warning "Valid signature testing requires proper implementation of signature computation"
}

# Function to simulate webhook calls
simulate_webhooks() {
    print_status "Simulating webhook calls..."
    
    # Test voice webhook
    test_webhook "$VOICE_WEBHOOK" "POST" "CallSid=CA1234567890abcdef1234567890abcdef&From=%2B15551234567&To=%2B15559876543&CallStatus=ringing&Direction=inbound&CallerName=Test%20Caller&CallerCity=Test%20City" "Voice webhook simulation"
    
    # Test SMS webhook
    test_webhook "$SMS_WEBHOOK" "POST" "MessageSid=SM1234567890abcdef1234567890abcdef&From=%2B15551234567&To=%2B15559876543&Body=Test%20SMS%20message&MessageStatus=received&Direction=inbound" "SMS webhook simulation"
    
    # Test message status webhook
    test_webhook "$MESSAGE_STATUS_WEBHOOK" "POST" "MessageSid=SM1234567890abcdef1234567890abcdef&MessageStatus=delivered&To=%2B15559876543&From=%2B15551234567" "Message status webhook simulation"
    
    # Test recording webhook
    test_webhook "$RECORDING_WEBHOOK" "POST" "CallSid=CA1234567890abcdef1234567890abcdef&RecordingSid=RE1234567890abcdef1234567890abcdef&RecordingUrl=https%3A//api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE123.mp3&RecordingDuration=30" "Recording webhook simulation"
}

# Function to test test-only simulation endpoints
test_simulation_endpoints() {
    print_status "Testing simulation endpoints..."
    
    # Test call simulation
    test_webhook "/api/test/simulate/call" "POST" '{
        "from": "+15551234567",
        "to": "+15559876543"
    }' "Call simulation endpoint"
    
    # Test SMS simulation
    test_webhook "/api/test/simulate/sms" "POST" '{
        "from": "+15551234567",
        "to": "+15559876543",
        "body": "Test simulation SMS"
    }' "SMS simulation endpoint"
    
    # Test voicemail simulation
    test_webhook "/api/test/simulate/voicemail" "POST" '{
        "from": "+15551234567",
        "to": "+15559876543",
        "transcription": "This is a test voicemail transcription"
    }' "Voicemail simulation endpoint"
    
    # Test queue update simulation
    test_webhook "/api/test/simulate/queue-update" "POST" '{
        "queueId": "support_queue",
        "waitingCount": 2,
        "availableAgents": 1
    }' "Queue update simulation endpoint"
}

# Function to show help
show_help() {
    echo "Webhook Testing Script for KIN Communications Hub"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup           - Setup webhook URLs in Twilio"
    echo "  test            - Test webhook endpoints"
    echo "  simulate        - Test simulation endpoints"
    echo "  security        - Test webhook security"
    echo "  all             - Run all tests"
    echo "  help            - Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BASE_URL        - Base URL for the application (default: http://localhost:3000)"
    echo "  NGROK_URL       - ngrok URL (auto-detected if not set)"
    echo "  TWILIO_ACCOUNT_SID - Twilio Account SID"
    echo "  TWILIO_AUTH_TOKEN  - Twilio Auth Token"
    echo "  TWILIO_PHONE_NUMBER - Twilio Phone Number (display only)"
    echo "  TWILIO_PHONE_SID    - Twilio Phone Number SID (required)"
    echo ""
    echo "Examples:"
    echo "  $0 setup        # Setup webhook URLs"
    echo "  $0 test         # Test webhook endpoints"
    echo "  $0 all          # Run all tests"
}

# Main function
main() {
    local command=${1:-"help"}
    
    case $command in
        "setup")
            check_dependencies
            validate_env
            start_ngrok
            update_twilio_webhooks
            ;;
        "test")
            check_dependencies
            validate_env
            simulate_webhooks
            ;;
        "simulate")
            check_dependencies
            test_simulation_endpoints
            ;;
        "security")
            check_dependencies
            validate_env
            test_webhook_security
            ;;
        "all")
            check_dependencies
            validate_env
            start_ngrok
            update_twilio_webhooks
            simulate_webhooks
            test_simulation_endpoints
            test_webhook_security
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
