#!/bin/bash

# AAA Platform Quick Start Script
# Usage: ./quick-start.sh [command]
# Commands: dev, build, test, deploy

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTROL_PLANE="$PROJECT_ROOT/aaa-platform/control-plane"
GENAI_CORE="$PROJECT_ROOT/aaa-platform/genai-core"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version must be 18+. Current: $(node -v)"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed. Please install Python 3.10+"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 -c 'import sys; print(sys.version_info.minor)')
    if [ "$PYTHON_VERSION" -lt 10 ]; then
        log_error "Python version must be 3.10+. Current: $(python3 --version)"
        exit 1
    fi
    
    # Check .env file
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        log_warn ".env file not found. Copying from .env.example..."
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        log_warn "Please edit .env with your API keys before continuing."
        exit 1
    fi
    
    log_info "All prerequisites met!"
}

start_dev() {
    check_prerequisites
    
    log_info "Starting AAA Platform in development mode..."
    
    # Start GenAI Core in background
    log_info "Starting GenAI Core on http://localhost:8000..."
    cd "$GENAI_CORE"
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -q -r requirements.txt
    python main.py &
    GENAI_PID=$!
    
    # Start Control Plane
    log_info "Starting Control Plane on http://localhost:3000..."
    cd "$CONTROL_PLANE"
    npm install --silent
    npm run dev &
    CONTROL_PID=$!
    
    log_info "Both services started!"
    log_info "  Control Plane: http://localhost:3000"
    log_info "  GenAI Core:    http://localhost:8000"
    log_info ""
    log_info "Press Ctrl+C to stop all services"
    
    # Handle cleanup on exit
    trap "kill $GENAI_PID $CONTROL_PID 2>/dev/null; exit" INT TERM
    wait
}

build_docker() {
    log_info "Building Docker images..."
    cd "$PROJECT_ROOT"
    docker-compose build
    log_info "Docker images built successfully!"
}

deploy_docker() {
    log_info "Deploying with Docker Compose..."
    cd "$PROJECT_ROOT"
    docker-compose up -d --build
    log_info "Deployment complete!"
    log_info "  Control Plane: http://localhost:3000"
    log_info "  GenAI Core:    http://localhost:8000"
}

run_tests() {
    log_info "Running tests..."
    
    # Control Plane tests
    log_info "Testing Control Plane..."
    cd "$CONTROL_PLANE"
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        npm test
    else
        log_warn "No tests configured for Control Plane"
    fi
    
    # GenAI Core tests
    log_info "Testing GenAI Core..."
    cd "$GENAI_CORE"
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -q -r requirements.txt
    if [ -f "pytest.ini" ] || [ -d "tests" ]; then
        pytest
    else
        log_warn "No tests configured for GenAI Core"
    fi
    
    log_info "All tests completed!"
}

check_status() {
    log_info "Checking AAA Platform status..."
    
    # Check Control Plane
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        log_info "Control Plane: ${GREEN}ONLINE${NC}"
    else
        log_warn "Control Plane: ${RED}OFFLINE${NC}"
    fi
    
    # Check GenAI Core
    if curl -s http://localhost:8000 > /dev/null 2>&1; then
        log_info "GenAI Core: ${GREEN}ONLINE${NC}"
    else
        log_warn "GenAI Core: ${RED}OFFLINE${NC}"
    fi
}

show_help() {
    echo "AAA Platform Quick Start Script"
    echo ""
    echo "Usage: ./quick-start.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev      Start development servers"
    echo "  build    Build Docker images"
    echo "  deploy   Deploy with Docker Compose"
    echo "  test     Run test suites"
    echo "  status   Check service status"
    echo "  help     Show this help message"
}

# Main command handler
case "${1:-help}" in
    dev)
        start_dev
        ;;
    build)
        build_docker
        ;;
    deploy)
        deploy_docker
        ;;
    test)
        run_tests
        ;;
    status)
        check_status
        ;;
    help|*)
        show_help
        ;;
esac
