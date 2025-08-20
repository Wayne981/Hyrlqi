#!/bin/bash

# Hyrlqi Quick Start Script
# This script helps you get the application running quickly

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command_exists psql; then
        print_warning "PostgreSQL client not found. Make sure PostgreSQL is installed and running."
    fi
    
    if ! command_exists redis-cli; then
        print_warning "Redis client not found. Make sure Redis is installed and running."
    fi
    
    print_success "Prerequisites check completed"
}

# Check if services are running
check_services() {
    print_status "Checking required services..."
    
    # Check PostgreSQL
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        print_success "PostgreSQL is running"
    else
        print_warning "PostgreSQL is not running. Please start PostgreSQL service."
        echo "  macOS: brew services start postgresql@15"
        echo "  Ubuntu: sudo systemctl start postgresql"
    fi
    
    # Check Redis
    if redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is running"
    else
        print_warning "Redis is not running. Please start Redis service."
        echo "  macOS: brew services start redis"
        echo "  Ubuntu: sudo systemctl start redis-server"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if database exists
    if psql "postgresql://hyrlqi_user:hyrlqi_secure_password_2024@localhost:5432/hyrlqi_gambling" -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "Database connection successful"
    else
        print_status "Creating database and user..."
        
        # Try to create user and database
        psql postgres -c "CREATE USER hyrlqi_user WITH PASSWORD 'hyrlqi_secure_password_2024';" 2>/dev/null || true
        psql postgres -c "CREATE DATABASE hyrlqi_gambling OWNER hyrlqi_user;" 2>/dev/null || true
        psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE hyrlqi_gambling TO hyrlqi_user;" 2>/dev/null || true
        
        print_success "Database setup completed"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    npm install
    
    # Backend dependencies
    cd backend
    npm install
    cd ..
    
    # Frontend dependencies
    cd frontend
    npm install
    cd ..
    
    print_success "Dependencies installed"
}

# Setup Prisma
setup_prisma() {
    print_status "Setting up Prisma..."
    
    cd backend
    
    # Generate Prisma client
    npx prisma generate
    
    # Push database schema
    npx prisma db push
    
    cd ..
    
    print_success "Prisma setup completed"
}

# Start the application
start_application() {
    print_status "Starting the application..."
    
    print_success "🚀 Starting Hyrlqi Gambling Platform..."
    echo ""
    echo "📍 Application URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001"
    echo "   Health:   http://localhost:3001/health"
    echo ""
    echo "🎮 Available Games:"
    echo "   • Plinko - Physics-based ball drop"
    echo "   • Mines - Strategic minefield navigation"  
    echo "   • Crash - Real-time multiplier game"
    echo ""
    echo "👤 Test Account:"
    echo "   Register at http://localhost:3000/auth/register"
    echo "   You'll get $1000 starting balance"
    echo ""
    echo "⏹️  To stop: Press Ctrl+C"
    echo "=============================================="
    echo ""
    
    # Start the application
    npm run dev
}

# Main function
main() {
    echo "🎰 Hyrlqi Gambling Platform - Quick Start"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    check_services
    
    # Ask if user wants to continue with setup
    echo ""
    read -p "Do you want to continue with the setup? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled by user"
        exit 0
    fi
    
    setup_database
    install_dependencies
    setup_prisma
    start_application
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"
