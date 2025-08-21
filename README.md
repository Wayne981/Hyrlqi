# 🎰 Hyrlqi - Ofform Gambling Platform

A modern, full-stack gambling platform featuring **Plinko**, **Mines**, and **Crash** games with real-time multiplayer functionality, elegant UI, and provably fair gaming.

![Hyrlqi Platform](https://img.shields.io/badge/Status-Ready%20to%20Play-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Next.js](https://img.shields.io/badge/Next.js-14-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue)
![Redis](https://img.shields.io/badge/Redis-6+-red)

## 🎮 Features

### 🎯 **Plinko Game**
- Physics-based ball drop simulation
- Adjustable risk levels (Low/Medium/High)
- Customizable rows (8-16)
- Real-time multiplier calculation

### 💎 **Mines Game**
- Interactive 5x5 grid gameplay
- Progressive multiplier system
- Customizable mine count (1-24)
- Strategic cash-out decisions

### 🛩️ **Crash Game**
- Real-time multiplier growth
- Animated plane graphics
- Instant cash-out functionality
- Auto cash-out feature
- Live game history

### 👤 **User System**
- Secure JWT authentication
- $1000 starting balance
- Real-time balance updates
- Transaction history
- Profile management

### 🎨 **Modern UI/UX**
- Responsive design
- Dark theme with gradients
- Smooth animations
- Mobile-friendly interface
- Real-time notifications

## 🚀 Quick Start

```bash
# 1. Install prerequisites (macOS)
brew install node postgresql redis
brew services start postgresql redis

# 2. Setup project
git clone <repo-url>
cd Hyrlqi
npm install

# 3. Run the app
npm run dev
```

**Access your platform:**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| **[📖 Complete Setup Guide](./RUN_GUIDE.md)** | Detailed installation and setup instructions |
| **[⚡ Quick Reference](./QUICK_REFERENCE.md)** | Essential commands and troubleshooting |
| **[🚀 Production Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)** | Deploy to production servers |
| **[🐳 Docker Guide](./DEPLOYMENT_GUIDE.md)** | Containerized deployment |

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API server
- **TypeScript** - Type-safe development
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **Prisma** - Database ORM
- **JWT** - Authentication
- **Socket.io** - Real-time communication

### Frontend  
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **Axios** - API client
- **React Hot Toast** - Notifications

### DevOps
- **Docker** + **Docker Compose** - Containerization
- **Nginx** - Reverse proxy and load balancing
- **GitHub Actions** - CI/CD pipeline
- **PM2** - Process management

## 📊 Project Structure

```
Hyrlqi/
├── 🎮 Games
│   ├── Plinko - Physics-based ball drop
│   ├── Mines - Strategic grid game  
│   └── Crash - Real-time multiplier
├── 🔧 Backend (Node.js/Express)
│   ├── Authentication & Authorization
│   ├── Game Logic & Engines
│   ├── Database Management
│   └── Real-time Communication
├── 🎨 Frontend (Next.js/React)
│   ├── Modern UI Components
│   ├── Game Interfaces
│   ├── User Dashboard
│   └── Responsive Design
├── 🗄️ Database (PostgreSQL)
│   ├── User Management
│   ├── Game History
│   ├── Transactions
│   └── Statistics
└── ⚡ Cache (Redis)
    ├── Session Storage
    ├── Game State
    └── Real-time Data
```

## 🎯 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- npm 9+

### Installation
1. **Clone the repository**
2. **Follow the [Complete Setup Guide](./RUN_GUIDE.md)**
3. **Start playing at http://localhost:3000**

### First Steps
1. **Register** a new account
2. **Get $1000** starting balance
3. **Play games** and test features
4. **Explore** the admin dashboard

## 🎮 Game Rules

### Plinko
- Drop a ball through pegs
- Ball lands in multiplier slots
- Higher risk = higher potential rewards
- Provably fair randomization

### Mines  
- Click grid cells to reveal gems
- Avoid mines to keep winnings
- Cash out anytime to secure profits
- More mines = higher multipliers

### Crash
- Watch the multiplier grow
- Cash out before the crash
- Higher multipliers = higher risk
- Auto cash-out available

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Joi schema validation
- **SQL Injection Protection** - Prisma ORM
- **XSS Protection** - Helmet.js middleware
- **CORS Configuration** - Controlled cross-origin requests

## 🚀 Performance

- **Redis Caching** - Fast data retrieval
- **Database Indexing** - Optimized queries
- **Connection Pooling** - Efficient DB connections
- **Asset Optimization** - Next.js built-in optimizations
- **Lazy Loading** - Components load on demand
- **Code Splitting** - Reduced bundle sizes

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests  
cd frontend
npm test

# Run end-to-end tests
npm run test:e2e
```

## 📈 Monitoring

- **Health Checks** - `/health` endpoint
- **Error Logging** - Structured error handling
- **Performance Metrics** - Response time tracking
- **Database Monitoring** - Query performance
- **Real-time Analytics** - User activity tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **📖 Documentation**: Check the guides in this repository
- **🐛 Issues**: Report bugs via GitHub Issues
- **💬 Discussions**: Use GitHub Discussions for questions
- **📧 Contact**: [Your contact information]

## 🎉 Ready to Play?

**[🚀 Get Started with the Setup Guide →](./RUN_GUIDE.md)**

---

**Built with ❤️ for the gambling community**

*Disclaimer: This is a demo gambling platform for educational purposes. Please gamble responsibly.*
