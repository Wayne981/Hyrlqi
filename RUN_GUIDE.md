# 🎰 Hyrlqi Ofform Gambling Platform - Setup & Run Guide

A complete gambling platform featuring **Plinko**, **Mines**, and **Crash** games with real-time multiplayer functionality.

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Running the Application](#running-the-application)
- [Game Features](#game-features)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

---

## 🛠️ Prerequisites

Before running the project, ensure you have the following installed:

### Required Software:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **PostgreSQL** (v13 or higher)
- **Redis** (v6 or higher)

### For macOS (using Homebrew):
```bash
# Install Node.js and npm
brew install node

# Install PostgreSQL
brew install postgresql
brew services start postgresql

# Install Redis
brew install redis
brew services start redis
```

### For Ubuntu/Debian:
```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

---

## ⚡ Quick Start

If you just want to get the app running quickly:

```bash
# 1. Navigate to project directory
cd /path/to/Hyrlqi

# 2. Run the quick start script
chmod +x quick-start.sh
./quick-start.sh
```

This script will:
- Install all dependencies
- Set up the database
- Create environment files
- Start both backend and frontend

**Access your app at:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

---

## 🔧 Detailed Setup

### Step 1: Clone and Navigate
```bash
git clone <your-repo-url>
cd Hyrlqi
```

### Step 2: Database Setup

#### Create PostgreSQL Database:
```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE hyrlqi_gambling;
CREATE USER hyrlqi_user WITH PASSWORD 'hyrlqi_secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE hyrlqi_gambling TO hyrlqi_user;
\q
```

#### Initialize Database Schema:
```bash
# Run the initialization script
psql "postgresql://hyrlqi_user:hyrlqi_secure_password_2024@localhost:5432/hyrlqi_gambling" -f backend/database/init.sql
```

### Step 3: Environment Configuration

#### Backend Environment (.env):
```bash
# Create backend/.env file
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

#### Frontend Environment (.env.local):
```bash
# Create frontend/.env.local file
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL="http://localhost:3001"
EOF
```

### Step 4: Install Dependencies

#### Root Dependencies:
```bash
npm install
```

#### Backend Dependencies:
```bash
cd backend
npm install
cd ..
```

#### Frontend Dependencies:
```bash
cd frontend
npm install
cd ..
```

### Step 5: Database Migration
```bash
cd backend
npx prisma generate
npx prisma db push
cd ..
```

---

## 🚀 Running the Application

### Option 1: Run Everything Together (Recommended)
```bash
# From project root
npm run dev
```

This starts both backend and frontend concurrently.

### Option 2: Run Services Separately

#### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### Verify Services Are Running:

#### Check Backend Health:
```bash
curl http://localhost:3001/health
```
**Expected Response:**
```json
{"status":"healthy","timestamp":"...","uptime":...}
```

#### Check Frontend:
```bash
curl http://localhost:3000
```
**Expected Response:** HTML page with title "Hyrlqi - Premium Gambling Platform"

---

## 🎮 Game Features

### 🎯 Plinko Game
- **URL**: http://localhost:3000/games/plinko
- **Features**:
  - Adjustable risk levels (Low/Medium/High)
  - Customizable row count (8-16 rows)
  - Visual ball drop animation
  - Real-time multiplier calculation

### 💎 Mines Game  
- **URL**: http://localhost:3000/games/mines
- **Features**:
  - 5x5 interactive grid
  - Adjustable mine count (1-24 mines)
  - Progressive multiplier system
  - Gem/bomb reveal animations

### 🛩️ Crash Game
- **URL**: http://localhost:3000/games/crash
- **Features**:
  - Real-time multiplier growth
  - Animated flying plane
  - Cash out at any time
  - Auto cash-out functionality
  - Live crash history

### 👤 User System
- **Registration**: Get $1000 starting balance
- **Authentication**: JWT-based secure login
- **Profile Management**: View stats and transaction history
- **Balance Tracking**: Real-time balance updates

---

## 🔧 Troubleshooting

### Common Issues:

#### 1. "Database connection failed"
```bash
# Check PostgreSQL is running
brew services list | grep postgresql
# or
sudo systemctl status postgresql

# Test connection
psql "postgresql://hyrlqi_user:hyrlqi_secure_password_2024@localhost:5432/hyrlqi_gambling" -c "SELECT 1;"
```

#### 2. "Redis connection failed"
```bash
# Check Redis is running
brew services list | grep redis
# or
sudo systemctl status redis

# Test connection
redis-cli ping
```

#### 3. "Port already in use"
```bash
# Kill processes on port 3000/3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

#### 4. "Module not found" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
rm package-lock.json backend/package-lock.json frontend/package-lock.json
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

#### 5. "Prisma client not generated"
```bash
cd backend
npx prisma generate
npx prisma db push
```

#### 6. Pages stuck on "Loading..."
This has been fixed with hydration guards. If you still see this:
```bash
# Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
# Or try incognito/private browsing mode
```

### Development Tools:

#### View Database:
```bash
cd backend
npx prisma studio
```
Access at: http://localhost:5555

#### View Logs:
```bash
# Backend logs
cd backend
npm run dev

# Frontend logs
cd frontend  
npm run dev
```

#### API Testing:
```bash
# Test API endpoints
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123","confirmPassword":"password123"}'
```

---

## 📁 Project Structure

```
Hyrlqi/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, error handling
│   │   ├── services/       # Game engines
│   │   └── server.ts       # Main server file
│   ├── prisma/            # Database schema
│   └── database/          # SQL initialization
├── frontend/              # Next.js React app
│   ├── src/
│   │   ├── app/           # Pages and layouts
│   │   ├── components/    # Reusable components
│   │   ├── lib/          # API client, utilities
│   │   └── store/        # State management
├── nginx/                # Production nginx config
├── docker-compose.yml    # Docker setup
└── package.json         # Root package file
```

---

## 🎯 Default Access

### User Accounts:
- **Registration**: Any email/username
- **Starting Balance**: $1000 (virtual currency)
- **Demo Mode**: Fully functional without real money

### Admin Features:
- **Health Check**: http://localhost:3001/health
- **API Documentation**: Available via API endpoints
- **Database Admin**: http://localhost:5555 (when Prisma Studio is running)

---

## 🚀 Production Deployment

For production deployment, see:
- `PRODUCTION_DEPLOYMENT_GUIDE.md`
- `DEPLOYMENT_GUIDE.md`
- `docker-compose.yml` for containerized deployment

---

## 📞 Support

If you encounter any issues:

1. **Check Prerequisites**: Ensure all required software is installed
2. **Verify Services**: Make sure PostgreSQL and Redis are running
3. **Check Logs**: Look at terminal output for error messages
4. **Clear Cache**: Try clearing browser cache and node_modules
5. **Port Conflicts**: Ensure ports 3000 and 3001 are available

---

## 🎉 You're Ready!

Once everything is running:

1. **Visit**: http://localhost:3000
2. **Register**: Create a new account (gets $1000 balance)
3. **Play**: Try all three games - Plinko, Mines, and Crash
4. **Enjoy**: Your fully functional gambling platform!

**Happy Gaming! 🎰🎮**
