#!/bin/bash

# ngrok Webhook Testing Script
# This script starts ngrok tunnel and provides webhook URLs for Twilio configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NGROK_PORT=${NGROK_PORT:-3000}
NGROK_REGION=${NGROK_REGION:-us}
NGROK_LOG_LEVEL=${NGROK_LOG_LEVEL:-info}

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
    echo -e "${BLUE}     Webhook Testing Setup     ${NC}"
    echo -e "${BLUE}================================${NC}"
    echo
}

# Function to check if ngrok is installed
check_ngrok() {
    if ! command -v ngrok &> /dev/null; then
        print_error "ngrok is not installed!"
        echo
        echo "Please install ngrok:"
        echo "  macOS: brew install ngrok"
        echo "  Windows: choco install ngrok"
        echo "  Linux: Download from https://ngrok.com/download"
        echo
        exit 1
    fi
}

# Function to check if ngrok is authenticated
check_ngrok_auth() {
    if ! ngrok config check &> /dev/null; then
        print_warning "ngrok is not authenticated!"
        echo
        echo "Please authenticate ngrok:"
        echo "  1. Sign up at https://ngrok.com"
        echo "  2. Get your authtoken from the dashboard"
        echo "  3. Run: ngrok config add-authtoken YOUR_AUTHTOKEN"
        echo
        exit 1
    fi
}

# Function to check if port is available
check_port() {
    if lsof -Pi :$NGROK_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_status "Port $NGROK_PORT is in use - this is expected for webhook testing!"
        echo
        echo "The port is being used by your development server, which is correct."
        echo "ngrok will tunnel to this port to expose your local server to the internet."
        echo
    else
        print_warning "Port $NGROK_PORT is NOT in use!"
        echo
        echo "This might indicate that your development server is not running."
        echo "Please start your development server first:"
        echo "  pnpm dev"
        echo
        echo "Or use a different port if your server is running on a different port:"
        echo "  NGROK_PORT=3001 $0"
        echo
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Function to start ngrok tunnel
start_ngrok() {
    print_status "Starting ngrok tunnel on port $NGROK_PORT..."
    echo
    
    # Start ngrok in background
    ngrok http $NGROK_PORT \
        --region=$NGROK_REGION \
        --log=stdout \
        --log-level=$NGROK_LOG_LEVEL \
        --log-format=logfmt \
        > /tmp/ngrok.log 2>&1 &
    
    NGROK_PID=$!
    
    # Wait for ngrok to start
    print_status "Waiting for ngrok to start..."
    sleep 3
    
    # Check if ngrok started successfully
    if ! kill -0 $NGROK_PID 2>/dev/null; then
        print_error "Failed to start ngrok!"
        echo "Check the log file: /tmp/ngrok.log"
        exit 1
    fi
    
    print_status "ngrok tunnel started successfully!"
}

# Function to get ngrok URL
get_ngrok_url() {
    # Wait for ngrok API to be available
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
            break
        fi
        
        print_status "Waiting for ngrok API... (attempt $attempt/$max_attempts)"
        sleep 1
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Failed to connect to ngrok API!"
        exit 1
    fi
    
    # Get the HTTPS URL
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | \
        python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for tunnel in data['tunnels']:
        if tunnel['proto'] == 'https':
            print(tunnel['public_url'])
            break
except:
    pass
" 2>/dev/null)
    
    if [ -z "$NGROK_URL" ]; then
        print_error "Failed to get ngrok URL!"
        exit 1
    fi
    
    print_status "ngrok URL: $NGROK_URL"
}

# Function to display webhook URLs
display_webhook_urls() {
    echo
    print_status "Webhook URLs for Twilio Configuration:"
    echo
    echo "Voice Webhook:"
    echo "  $NGROK_URL/api/webhooks/twilio/voice"
    echo
    echo "SMS Webhook:"
    echo "  $NGROK_URL/api/webhooks/twilio/sms"
    echo
    echo "Status Callback:"
    echo "  $NGROK_URL/api/webhooks/twilio/status"
    echo
    echo "Recording Webhook:"
    echo "  $NGROK_URL/api/webhooks/twilio/recording"
    echo
    echo "Transcription Webhook:"
    echo "  $NGROK_URL/api/webhooks/twilio/transcription"
    echo
}

# Function to display Twilio configuration instructions
display_twilio_instructions() {
    echo
    print_status "Twilio Configuration Instructions:"
    echo
    echo "1. Go to Twilio Console: https://console.twilio.com/"
    echo "2. Navigate to Phone Numbers → Manage → Active numbers"
    echo "3. Click on your purchased number"
    echo "4. Set the following webhook URLs:"
    echo
    echo "   Voice URL: $NGROK_URL/api/webhooks/twilio/voice"
    echo "   SMS URL: $NGROK_URL/api/webhooks/twilio/sms"
    echo "   Status Callback URL: $NGROK_URL/api/webhooks/twilio/status"
    echo
    echo "5. Save the configuration"
    echo
}

# Function to display testing instructions
display_testing_instructions() {
    echo
    print_status "Testing Instructions:"
    echo
    echo "1. Start your development server:"
    echo "   pnpm dev"
    echo
    echo "2. Test webhook endpoints:"
    echo "   curl -X POST $NGROK_URL/api/webhooks/twilio/voice \\"
    echo "     -H 'Content-Type: application/x-www-form-urlencoded' \\"
    echo "     -d 'CallSid=test&From=%2B15551234567&To=%2B15551234568&CallStatus=ringing'"
    echo
    echo "3. Monitor webhook requests:"
    echo "   Open http://localhost:4040 in your browser"
    echo
    echo "4. Make test calls to your Twilio number"
    echo
}

# Function to display environment variables
display_environment_variables() {
    echo
    print_status "Environment Variables:"
    echo
    echo "Add the following to your .env.local file:"
    echo
    echo "TWILIO_WEBHOOK_URL=\"$NGROK_URL\""
    echo
}

# Function to handle cleanup
cleanup() {
    echo
    print_status "Stopping ngrok tunnel..."
    
    if [ ! -z "$NGROK_PID" ]; then
        kill $NGROK_PID 2>/dev/null || true
    fi
    
    # Kill any remaining ngrok processes
    pkill -f "ngrok http" 2>/dev/null || true
    
    print_status "ngrok tunnel stopped."
    echo
}

# Function to monitor ngrok status
monitor_ngrok() {
    echo
    print_status "Monitoring ngrok tunnel..."
    echo "Press Ctrl+C to stop the tunnel"
    echo
    
    # Set up signal handlers
    trap cleanup EXIT INT TERM
    
    # Monitor ngrok process
    while kill -0 $NGROK_PID 2>/dev/null; do
        sleep 1
    done
    
    print_error "ngrok tunnel stopped unexpectedly!"
    exit 1
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -p, --port PORT     Port to tunnel (default: 3000)"
    echo "  -r, --region REGION ngrok region (default: us)"
    echo "  -l, --log-level LEVEL Log level (default: info)"
    echo "  -h, --help          Show this help message"
    echo
    echo "Environment Variables:"
    echo "  NGROK_PORT          Port to tunnel (default: 3000)"
    echo "  NGROK_REGION        ngrok region (default: us)"
    echo "  NGROK_LOG_LEVEL     Log level (default: info)"
    echo
    echo "Examples:"
    echo "  $0                  # Start tunnel on port 3000"
    echo "  $0 -p 3001         # Start tunnel on port 3001"
    echo "  $0 -r eu           # Start tunnel in EU region"
    echo "  NGROK_PORT=3001 $0 # Start tunnel on port 3001"
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            NGROK_PORT="$2"
            shift 2
            ;;
        -r|--region)
            NGROK_REGION="$2"
            shift 2
            ;;
        -l|--log-level)
            NGROK_LOG_LEVEL="$2"
            shift 2
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
    check_ngrok
    check_ngrok_auth
    check_port
    
    # Start ngrok tunnel
    start_ngrok
    
    # Get ngrok URL
    get_ngrok_url
    
    # Display information
    display_webhook_urls
    display_twilio_instructions
    display_testing_instructions
    display_environment_variables
    
    # Monitor ngrok tunnel
    monitor_ngrok
}

# Run main function
main "$@"
