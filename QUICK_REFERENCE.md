# 🚀 Hyrlqi - Quick Reference

## ⚡ Quick Start Commands

```bash
# 1. One-command setup (if services are already installed)
npm run dev

# 2. Access your app
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

---

## 🛠️ Setup Commands

```bash
# Install prerequisites (macOS)
brew install node postgresql redis
brew services start postgresql redis

# Setup project
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Setup database
psql postgres -c "CREATE DATABASE hyrlqi_gambling; CREATE USER hyrlqi_user WITH PASSWORD 'hyrlqi_secure_password_2024'; GRANT ALL PRIVILEGES ON DATABASE hyrlqi_gambling TO hyrlqi_user;"

# Create environment files
JWT_SECRET=$(openssl rand -hex 32) && cat > backend/.env << EOF
DATABASE_URL="postgresql://hyrlqi_user:hyrlqi_secure_password_2024@localhost:5432/hyrlqi_gambling"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="$JWT_SECRET"
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

echo 'NEXT_PUBLIC_API_URL="http://localhost:3001"' > frontend/.env.local

# Initialize database
cd backend && npx prisma generate && npx prisma db push && cd ..
```

---

## 🎮 Game URLs

| Game | URL | Description |
|------|-----|-------------|
| **Home** | http://localhost:3000 | Main landing page |
| **Plinko** | http://localhost:3000/games/plinko | Ball drop game with multipliers |
| **Mines** | http://localhost:3000/games/mines | Find gems, avoid mines |
| **Crash** | http://localhost:3000/games/crash | Flying plane multiplier game |

---

## 🔧 Troubleshooting Commands

```bash
# Check service status
brew services list | grep -E "(postgresql|redis)"
curl http://localhost:3001/health
curl http://localhost:3000

# Restart services
brew services restart postgresql redis
pkill -f "npm run dev"
npm run dev

# Clear and reinstall
rm -rf node_modules */node_modules
rm package-lock.json */package-lock.json
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..

# Database reset
cd backend
npx prisma db push --force-reset
npx prisma generate
cd ..
```

---

## 📊 Monitoring Commands

```bash
# View logs
tail -f backend/logs/*.log  # If logging to files
npm run dev                 # See live logs

# Database admin
cd backend && npx prisma studio  # Access at http://localhost:5555

# API testing
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"test","password":"password123","confirmPassword":"password123"}'
```

---

## 🎯 Default Credentials

- **New User Registration**: Any email/username
- **Starting Balance**: $1000 (virtual)
- **Database**: `hyrlqi_gambling`
- **DB User**: `hyrlqi_user`
- **Ports**: Frontend (3000), Backend (3001)

---

## 🚨 Emergency Reset

```bash
# Complete reset (nuclear option)
pkill -f node
brew services restart postgresql redis
rm -rf node_modules */node_modules */dist */.next
rm package-lock.json */package-lock.json
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..
cd backend && npx prisma generate && npx prisma db push --force-reset && cd ..
npm run dev
```

---

**Need more help? Check `RUN_GUIDE.md` for detailed instructions!**
