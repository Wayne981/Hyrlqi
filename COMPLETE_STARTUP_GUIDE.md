# 🚀 Complete Hyrlqi Startup Guide

## Prerequisites Check

Before starting, ensure you have:
- **Node.js 18+** installed
- **PostgreSQL 13+** running
- **Redis 6+** running
- **Git** for version control

## 📋 Step 1: Environment Setup

### 1.1 Create Backend Environment File
```bash
# Create backend environment file
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
```

### 1.2 Create Frontend Environment File
```bash
# Create frontend environment file
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL="http://localhost:3001"
EOF
```

## 📋 Step 2: Database Setup

### 2.1 Install and Start PostgreSQL

**On macOS (using Homebrew):**
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database user and database
psql postgres -c "CREATE USER hyrlqi_user WITH PASSWORD 'hyrlqi_secure_password_2024';"
psql postgres -c "CREATE DATABASE hyrlqi_gambling OWNER hyrlqi_user;"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE hyrlqi_gambling TO hyrlqi_user;"
```

**On Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user and database
sudo -u postgres psql -c "CREATE USER hyrlqi_user WITH PASSWORD 'hyrlqi_secure_password_2024';"
sudo -u postgres psql -c "CREATE DATABASE hyrlqi_gambling OWNER hyrlqi_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hyrlqi_gambling TO hyrlqi_user;"
```

**On Windows:**
```bash
# Download and install PostgreSQL from https://www.postgresql.org/download/windows/
# Use pgAdmin or command line to create user and database
```

### 2.2 Install and Start Redis

**On macOS (using Homebrew):**
```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis
```

**On Ubuntu/Debian:**
```bash
# Install Redis
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**On Windows:**
```bash
# Download Redis from https://github.com/microsoftarchive/redis/releases
# Or use Windows Subsystem for Linux (WSL)
```

## 📋 Step 3: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

## 📋 Step 4: Database Migration and Setup

```bash
# Navigate to backend directory
cd backend

# Generate Prisma client
npx prisma generate

# Push database schema (creates tables)
npx prisma db push

# Optional: View database in Prisma Studio
npx prisma studio
# This opens http://localhost:5555 to view your database

# Return to root directory
cd ..
```

## 📋 Step 5: Verify Services

### 5.1 Check PostgreSQL Connection
```bash
# Test database connection
psql "postgresql://hyrlqi_user:hyrlqi_secure_password_2024@localhost:5432/hyrlqi_gambling" -c "SELECT version();"
```

### 5.2 Check Redis Connection
```bash
# Test Redis connection
redis-cli ping
# Should return "PONG"
```

## 📋 Step 6: Start the Application

### Option A: Start Both Services Together (Recommended)
```bash
# Start both frontend and backend in development mode
npm run dev
```

### Option B: Start Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 📋 Step 7: Access the Application

Once started, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Prisma Studio**: http://localhost:5555 (if running)

## 📋 Step 8: Test the Application

### 8.1 Register a New User
1. Go to http://localhost:3000
2. Click "Sign Up" 
3. Fill in the registration form
4. You'll receive $1000 starting balance

### 8.2 Test Each Game

**Plinko Game:**
1. Navigate to Games → Plinko
2. Select risk level and bet amount
3. Watch the ball drop and see results

**Mines Game:**
1. Navigate to Games → Mines
2. Set grid size and mine count
3. Reveal cells and cash out strategically

**Crash Game:**
1. Navigate to Games → Crash
2. Place a bet with optional auto cash-out
3. Watch the multiplier grow and cash out

### 8.3 Test Real-time Features
- Open multiple browser tabs
- Register different users
- Play games and watch live activity feed
- Test chat functionality

## 🔧 Troubleshooting

### Common Issues and Solutions

**Issue: Database connection failed**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql
# or
sudo systemctl status postgresql

# Check database exists
psql postgres -c "\l" | grep hyrlqi_gambling
```

**Issue: Redis connection failed**
```bash
# Check if Redis is running
brew services list | grep redis
# or
sudo systemctl status redis-server

# Test Redis connection
redis-cli ping
```

**Issue: Port already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**Issue: Prisma client not found**
```bash
cd backend
npx prisma generate
```

**Issue: Environment variables not loaded**
```bash
# Check if .env files exist
ls -la backend/.env
ls -la frontend/.env.local

# Restart the application after creating .env files
```

## 📊 Monitoring and Logs

### View Application Logs
```bash
# Backend logs (if running separately)
cd backend && npm run dev

# Frontend logs (if running separately)  
cd frontend && npm run dev

# Combined logs (if using npm run dev from root)
npm run dev
```

### Check Database Content
```bash
# Open Prisma Studio to view database
cd backend
npx prisma studio
```

### Monitor Redis
```bash
# Redis CLI monitor
redis-cli monitor

# Check Redis info
redis-cli info
```

## 🧪 Testing Checklist

Before moving to production, test these features:

### ✅ Authentication
- [ ] User registration with validation
- [ ] User login with JWT tokens
- [ ] Password change functionality
- [ ] Session management
- [ ] Logout functionality

### ✅ Games
- [ ] Plinko: All risk levels and row counts
- [ ] Mines: Different grid sizes and mine counts  
- [ ] Crash: Betting and cash-out functionality
- [ ] Game history tracking
- [ ] Balance updates after games

### ✅ Real-time Features
- [ ] Live user count updates
- [ ] Real-time game activity feed
- [ ] WebSocket connections
- [ ] Chat functionality (if implemented)

### ✅ Security
- [ ] Rate limiting on API endpoints
- [ ] Input validation on forms
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] Authentication token security

### ✅ Performance
- [ ] Page load speeds
- [ ] Game response times
- [ ] Database query performance
- [ ] Redis caching effectiveness

### ✅ UI/UX
- [ ] Responsive design on mobile
- [ ] Smooth animations
- [ ] Error handling and user feedback
- [ ] Loading states
- [ ] Form validation messages

## 🚀 Ready for Production?

Once you've tested everything locally and confirmed all features work:

1. **All games function correctly** ✅
2. **Authentication system works** ✅  
3. **Real-time features active** ✅
4. **Database operations successful** ✅
5. **Security measures in place** ✅
6. **Performance is acceptable** ✅
7. **UI/UX is polished** ✅

Then you're ready to proceed with production deployment!

## 📞 Next Steps

After local testing is complete, I'll provide you with:

1. **Production Deployment Guide**
2. **Docker Configuration**
3. **Cloud Deployment Options**
4. **SSL Certificate Setup**
5. **Environment Variable Management**
6. **Monitoring and Logging Setup**
7. **Backup and Recovery Procedures**

---

**Happy Testing!** 🎮 Let me know when you've verified everything works locally and are ready for production deployment.
