#!/bin/bash

# Hyrlqi Deployment Script
# This script sets up and deploys the Hyrlqi gambling platform

set -e  # Exit on any error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        print_status "Creating backend/.env file..."
        cat > backend/.env << EOF
DATABASE_URL="postgresql://hyrlqi_user:hyrlqi_secure_password_2024@localhost:5432/hyrlqi_gambling"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="$(openssl rand -hex 32)"
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:3000"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"
PLINKO_HOUSE_EDGE="0.01"
MINES_HOUSE_EDGE="0.01"
CRASH_HOUSE_EDGE="0.01"
BCRYPT_ROUNDS="12"
SESSION_EXPIRE_DAYS="7"
LOG_LEVEL="info"
EOF
        print_success "Created backend/.env"
    else
        print_warning "backend/.env already exists, skipping..."
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env.local" ]; then
        print_status "Creating frontend/.env.local file..."
        cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL="http://localhost:3001"
EOF
        print_success "Created frontend/.env.local"
    else
        print_warning "frontend/.env.local already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    print_success "All dependencies installed"
}

# Generate Prisma client
generate_prisma() {
    print_status "Generating Prisma client..."
    cd backend
    npx prisma generate
    cd ..
    print_success "Prisma client generated"
}

# Build applications
build_applications() {
    print_status "Building applications..."
    
    # Build backend
    print_status "Building backend..."
    cd backend
    npm run build
    cd ..
    
    # Build frontend
    print_status "Building frontend..."
    cd frontend
    npm run build
    cd ..
    
    print_success "Applications built successfully"
}

# Start services with Docker
start_services() {
    print_status "Starting services with Docker..."
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start containers
    docker-compose up --build -d
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for database..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose exec -T postgres pg_isready -U hyrlqi_user -d hyrlqi_gambling >/dev/null 2>&1; then
            print_success "Database is ready"
            break
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    
    if [ $timeout -eq 0 ]; then
        print_error "Database failed to start within 60 seconds"
        exit 1
    fi
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
            print_success "Redis is ready"
            break
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    
    if [ $timeout -eq 0 ]; then
        print_error "Redis failed to start within 30 seconds"
        exit 1
    fi
    
    # Wait for backend
    print_status "Waiting for backend..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:3001/health >/dev/null 2>&1; then
            print_success "Backend is ready"
            break
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    
    if [ $timeout -eq 0 ]; then
        print_error "Backend failed to start within 60 seconds"
        exit 1
    fi
    
    # Wait for frontend
    print_status "Waiting for frontend..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "Frontend is ready"
            break
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    
    if [ $timeout -eq 0 ]; then
        print_error "Frontend failed to start within 60 seconds"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    cd backend
    npx prisma db push
    cd ..
    print_success "Database migrations completed"
}

# Display deployment information
show_deployment_info() {
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3001"
    echo "   Health Check: http://localhost:3001/health"
    echo ""
    echo "🗄️  Database Information:"
    echo "   PostgreSQL: localhost:5432"
    echo "   Database: hyrlqi_gambling"
    echo "   Username: hyrlqi_user"
    echo ""
    echo "🔴 Redis:"
    echo "   URL: localhost:6379"
    echo ""
    echo "📊 Monitoring:"
    echo "   Docker logs: docker-compose logs -f"
    echo "   Backend logs: docker-compose logs -f backend"
    echo "   Frontend logs: docker-compose logs -f frontend"
    echo ""
    echo "🎮 Games Available:"
    echo "   • Plinko - Physics-based ball drop game"
    echo "   • Mines - Strategic minefield navigation"
    echo "   • Crash - Real-time multiplier game"
    echo ""
    echo "🔒 Security Features:"
    echo "   • Provably fair algorithms"
    echo "   • JWT authentication"
    echo "   • Rate limiting"
    echo "   • Input validation"
    echo ""
    echo "To stop the application: docker-compose down"
    echo "To restart: docker-compose restart"
    echo "To view logs: docker-compose logs -f"
}

# Main deployment function
main() {
    echo "🚀 Starting Hyrlqi Deployment..."
    echo "=================================="
    
    check_prerequisites
    create_env_files
    install_dependencies
    generate_prisma
    
    # Ask user if they want to build or use development mode
    echo ""
    read -p "Do you want to run in production mode with Docker? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_applications
        start_services
        wait_for_services
        run_migrations
        show_deployment_info
    else
        print_status "Starting in development mode..."
        print_status "Make sure PostgreSQL and Redis are running locally"
        print_status "Run 'npm run dev' to start the development servers"
        
        echo ""
        echo "Development mode setup:"
        echo "1. Start PostgreSQL: brew services start postgresql (macOS) or sudo systemctl start postgresql (Linux)"
        echo "2. Start Redis: brew services start redis (macOS) or sudo systemctl start redis (Linux)"
        echo "3. Run migrations: cd backend && npx prisma db push"
        echo "4. Start development servers: npm run dev"
    fi
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
