#!/bin/bash

# KIN Communications Platform - QA Testing Cleanup Script
# This script cleans up the QA testing environment

set -e

echo "🧹 Starting QA Testing Cleanup for KIN Communications Platform..."

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

# Stop running processes
stop_processes() {
    print_status "Stopping running processes..."
    
    # Stop application
    if [ -f app.pid ]; then
        APP_PID=$(cat app.pid)
        if kill -0 $APP_PID 2>/dev/null; then
            print_status "Stopping application (PID: $APP_PID)..."
            kill $APP_PID
            rm app.pid
            print_success "Application stopped"
        else
            print_warning "Application process not running"
            rm app.pid
        fi
    else
        print_warning "No application PID file found"
    fi
    
    # Stop ngrok
    if [ -f ngrok.pid ]; then
        NGROK_PID=$(cat ngrok.pid)
        if kill -0 $NGROK_PID 2>/dev/null; then
            print_status "Stopping ngrok (PID: $NGROK_PID)..."
            kill $NGROK_PID
            rm ngrok.pid
            print_success "ngrok stopped"
        else
            print_warning "ngrok process not running"
            rm ngrok.pid
        fi
    else
        print_warning "No ngrok PID file found"
    fi
    
    # Stop any remaining processes
    print_status "Stopping any remaining test processes..."
    pkill -f "next dev" || true
    pkill -f "node server.js" || true
    pkill -f "ngrok" || true
    pkill -f "playwright" || true
}

# Clean up log files
cleanup_logs() {
    print_status "Cleaning up log files..."
    
    # Remove application logs
    if [ -f app.log ]; then
        rm app.log
        print_success "Removed app.log"
    fi
    
    # Remove ngrok logs
    if [ -f ngrok.log ]; then
        rm ngrok.log
        print_success "Removed ngrok.log"
    fi
    
    # Remove test logs
    if [ -d tests/logs ]; then
        rm -rf tests/logs
        print_success "Removed test logs directory"
    fi
    
    # Remove npm logs
    if [ -f npm-debug.log ]; then
        rm npm-debug.log
        print_success "Removed npm-debug.log"
    fi
    
    if [ -f yarn-debug.log ]; then
        rm yarn-debug.log
        print_success "Removed yarn-debug.log"
    fi
}

# Clean up test artifacts
cleanup_artifacts() {
    print_status "Cleaning up test artifacts..."
    
    # Remove test results
    if [ -d tests/results ]; then
        rm -rf tests/results
        print_success "Removed test results directory"
    fi
    
    # Remove test artifacts
    if [ -d tests/artifacts ]; then
        rm -rf tests/artifacts
        print_success "Removed test artifacts directory"
    fi
    
    # Remove screenshots
    if [ -d tests/screenshots ]; then
        rm -rf tests/screenshots
        print_success "Removed screenshots directory"
    fi
    
    # Remove videos
    if [ -d tests/videos ]; then
        rm -rf tests/videos
        print_success "Removed videos directory"
    fi
    
    # Remove test reports
    if [ -d tests/reports ]; then
        rm -rf tests/reports
        print_success "Removed test reports directory"
    fi
    
    # Remove coverage reports
    if [ -d coverage ]; then
        rm -rf coverage
        print_success "Removed coverage directory"
    fi
    
    # Remove test cache
    if [ -d .playwright ]; then
        rm -rf .playwright
        print_success "Removed Playwright cache"
    fi
}

# Clean up test database
cleanup_database() {
    print_status "Cleaning up test database..."
    
    # Check if test database exists
    if psql -h localhost -U test_user -d kin_communications_test -c "SELECT 1;" &> /dev/null; then
        print_status "Dropping test database..."
        psql -h localhost -U test_user -d postgres -c "DROP DATABASE IF EXISTS kin_communications_test;" 2>/dev/null || true
        print_success "Test database dropped"
    else
        print_warning "Test database not found or already dropped"
    fi
}

# Clean up environment files
cleanup_environment() {
    print_status "Cleaning up environment files..."
    
    # Remove test environment file
    if [ -f .env.test ]; then
        rm .env.test
        print_success "Removed .env.test file"
    fi
    
    # Remove test configuration
    if [ -d tests/config ]; then
        rm -rf tests/config
        print_success "Removed test configuration directory"
    fi
    
    # Remove temporary files
    rm -f *.tmp
    rm -f *.temp
    print_success "Removed temporary files"
}

# Clean up node modules and cache
cleanup_node_modules() {
    print_status "Cleaning up node modules and cache..."
    
    # Remove node modules
    if [ -d node_modules ]; then
        print_status "Removing node_modules..."
        rm -rf node_modules
        print_success "Removed node_modules directory"
    fi
    
    # Remove package-lock.json
    if [ -f package-lock.json ]; then
        rm package-lock.json
        print_success "Removed package-lock.json"
    fi
    
    # Remove yarn.lock
    if [ -f yarn.lock ]; then
        rm yarn.lock
        print_success "Removed yarn.lock"
    fi
    
    # Remove npm cache
    print_status "Clearing npm cache..."
    npm cache clean --force 2>/dev/null || true
    print_success "NPM cache cleared"
    
    # Remove yarn cache
    print_status "Clearing yarn cache..."
    yarn cache clean 2>/dev/null || true
    print_success "Yarn cache cleared"
}

# Clean up build artifacts
cleanup_build() {
    print_status "Cleaning up build artifacts..."
    
    # Remove Next.js build
    if [ -d .next ]; then
        rm -rf .next
        print_success "Removed Next.js build directory"
    fi
    
    # Remove build directory
    if [ -d build ]; then
        rm -rf build
        print_success "Removed build directory"
    fi
    
    # Remove dist directory
    if [ -d dist ]; then
        rm -rf dist
        print_success "Removed dist directory"
    fi
    
    # Remove out directory
    if [ -d out ]; then
        rm -rf out
        print_success "Removed out directory"
    fi
}

# Clean up system files
cleanup_system() {
    print_status "Cleaning up system files..."
    
    # Remove .DS_Store files
    find . -name ".DS_Store" -delete 2>/dev/null || true
    print_success "Removed .DS_Store files"
    
    # Remove Thumbs.db files
    find . -name "Thumbs.db" -delete 2>/dev/null || true
    print_success "Removed Thumbs.db files"
    
    # Remove temporary files
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name "*.temp" -delete 2>/dev/null || true
    print_success "Removed temporary files"
}

# Reset git repository
reset_git() {
    print_status "Resetting git repository..."
    
    # Check if we're in a git repository
    if [ -d .git ]; then
        # Reset any uncommitted changes
        git reset --hard HEAD 2>/dev/null || true
        print_success "Git repository reset"
        
        # Clean untracked files
        git clean -fd 2>/dev/null || true
        print_success "Git repository cleaned"
    else
        print_warning "Not in a git repository, skipping git cleanup"
    fi
}

# Main cleanup function
main() {
    # Parse command line arguments
    FULL_CLEANUP=false
    KEEP_DATABASE=false
    KEEP_NODE_MODULES=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --full)
                FULL_CLEANUP=true
                shift
                ;;
            --keep-database)
                KEEP_DATABASE=true
                shift
                ;;
            --keep-node-modules)
                KEEP_NODE_MODULES=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --full              Perform full cleanup including node_modules and database"
                echo "  --keep-database     Keep test database (don't drop it)"
                echo "  --keep-node-modules Keep node_modules (don't remove it)"
                echo "  --help              Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    print_status "Starting QA testing cleanup..."
    
    # Always stop processes
    stop_processes
    
    # Always clean up logs and artifacts
    cleanup_logs
    cleanup_artifacts
    
    # Clean up environment files
    cleanup_environment
    
    # Clean up build artifacts
    cleanup_build
    
    # Clean up system files
    cleanup_system
    
    # Conditional cleanup based on options
    if [ "$FULL_CLEANUP" = true ]; then
        if [ "$KEEP_DATABASE" = false ]; then
            cleanup_database
        fi
        
        if [ "$KEEP_NODE_MODULES" = false ]; then
            cleanup_node_modules
        fi
        
        reset_git
    fi
    
    print_success "QA testing cleanup completed!"
    
    if [ "$FULL_CLEANUP" = true ]; then
        print_status "Full cleanup performed. You may need to:"
        echo "1. Run 'npm install' to reinstall dependencies"
        echo "2. Run 'npm run db:setup' to recreate the database"
        echo "3. Run 'npm run db:seed' to seed the database"
    else
        print_status "Standard cleanup performed. Test environment is ready for next run."
    fi
}

# Run main function
main "$@"

