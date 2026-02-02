#!/bin/bash

# Railway Deployment Script for AAA Platform
# This script helps automate the Railway deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Railway CLI is installed
check_railway_cli() {
    print_header "Checking Railway CLI"

    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
        print_success "Railway CLI installed"
    else
        print_success "Railway CLI found"
    fi
}

# Login to Railway
railway_login() {
    print_header "Railway Login"

    if railway whoami &> /dev/null; then
        print_success "Already logged in to Railway"
    else
        print_info "Opening browser for Railway login..."
        railway login
        print_success "Logged in to Railway"
    fi
}

# Link project
link_project() {
    print_header "Linking Railway Project"

    print_info "Select your project: aaa-platform-production"
    print_info "Select service: control-plane"

    railway link
    print_success "Project linked"
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"

    cd "$(dirname "$0")/../control-plane" || exit

    print_info "Generating Prisma Client..."
    railway run npx prisma generate

    print_info "Running migrations..."
    railway run npx prisma migrate deploy

    print_info "Applying multi-tenant migration..."
    railway run psql \$DATABASE_URL -f prisma/migrations/add_multi_tenant_isolation.sql

    print_success "Migrations completed"

    cd - > /dev/null
}

# Verify deployment
verify_deployment() {
    print_header "Verifying Deployment"

    print_info "Checking control-plane status..."
    CONTROL_URL=$(railway status | grep "URL" | awk '{print $2}')

    if [ -n "$CONTROL_URL" ]; then
        print_info "Control Plane URL: $CONTROL_URL"

        print_info "Testing health endpoint..."
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CONTROL_URL")

        if [ "$HTTP_CODE" = "200" ]; then
            print_success "Control plane is healthy"
        else
            print_warning "Control plane returned HTTP $HTTP_CODE"
        fi
    else
        print_warning "Could not determine control plane URL"
    fi
}

# Show logs
show_logs() {
    print_header "Recent Logs"

    print_info "Showing last 50 lines of logs..."
    railway logs --lines 50
}

# Main menu
show_menu() {
    print_header "AAA Platform Railway Deployment"

    echo "1. Initial Setup (Install CLI, Login, Link Project)"
    echo "2. Run Database Migrations"
    echo "3. Deploy Latest Changes"
    echo "4. View Logs"
    echo "5. Open Railway Dashboard"
    echo "6. Full Deployment (Setup + Migrations + Deploy)"
    echo "7. Verify Deployment"
    echo "8. Exit"
    echo
    read -p "Select option (1-8): " choice

    case $choice in
        1)
            check_railway_cli
            railway_login
            link_project
            print_success "Initial setup complete!"
            ;;
        2)
            run_migrations
            ;;
        3)
            print_header "Deploying Latest Changes"
            print_info "Make sure you've committed and pushed your changes to GitHub"
            read -p "Have you pushed to GitHub? (y/n): " pushed
            if [ "$pushed" = "y" ]; then
                print_info "Railway will auto-deploy from GitHub"
                print_info "Or manually trigger: railway up"
                railway status
            else
                print_warning "Please commit and push changes first"
            fi
            ;;
        4)
            show_logs
            ;;
        5)
            print_header "Opening Railway Dashboard"
            railway open
            ;;
        6)
            check_railway_cli
            railway_login
            link_project
            run_migrations
            verify_deployment
            print_success "Full deployment complete!"
            ;;
        7)
            verify_deployment
            ;;
        8)
            print_info "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac

    # Ask if user wants to continue
    echo
    read -p "Press Enter to return to menu (or Ctrl+C to exit)..."
    show_menu
}

# Main execution
main() {
    # Check if running from correct directory
    if [ ! -f "package.json" ] && [ ! -d "aaa-platform" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    show_menu
}

# Run main function
main
