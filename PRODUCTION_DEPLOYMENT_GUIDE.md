# 🚀 Production Deployment Guide

## Overview

This guide covers deploying the Hyrlqi gambling platform to production environments. Choose the deployment method that best fits your needs.

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure you have:

### ✅ Testing Complete
- [ ] All games tested locally (Plinko, Mines, Crash)
- [ ] Authentication system verified
- [ ] Real-time features working
- [ ] Database operations successful
- [ ] Security measures tested
- [ ] Performance benchmarks met

### ✅ Production Requirements
- [ ] Domain name registered
- [ ] SSL certificate obtained
- [ ] Production database server
- [ ] Redis server for production
- [ ] Monitoring tools selected
- [ ] Backup strategy planned

## 🐳 Option 1: Docker Deployment (Recommended)

### 1.1 Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Domain with DNS configured

### 1.2 Production Environment Setup

Create production environment files:

**backend/.env.production:**
```env
DATABASE_URL="postgresql://username:password@your-db-host:5432/hyrlqi_production"
REDIS_URL="redis://your-redis-host:6379"
JWT_SECRET="your-super-secure-jwt-secret-minimum-32-characters"
NODE_ENV="production"
PORT="3001"
FRONTEND_URL="https://your-domain.com"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"
PLINKO_HOUSE_EDGE="0.01"
MINES_HOUSE_EDGE="0.01"
CRASH_HOUSE_EDGE="0.01"
BCRYPT_ROUNDS="12"
SESSION_EXPIRE_DAYS="7"
LOG_LEVEL="info"
```

**frontend/.env.production:**
```env
NEXT_PUBLIC_API_URL="https://api.your-domain.com"
```

### 1.3 Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hyrlqi_production
      POSTGRES_USER: your_username
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://your_username:your_secure_password@postgres:5432/hyrlqi_production
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.your-domain.com
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 1.4 Production Nginx Configuration

Create `nginx/nginx.prod.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Frontend
        location / {
            proxy_pass http://frontend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 1.5 Deploy with Docker

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up --build -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop containers
docker-compose -f docker-compose.prod.yml down
```

## ☁️ Option 2: Cloud Deployment

### 2.1 AWS Deployment

**Using AWS ECS with Fargate:**

1. **Create ECR repositories:**
```bash
aws ecr create-repository --repository-name hyrlqi-backend
aws ecr create-repository --repository-name hyrlqi-frontend
```

2. **Build and push images:**
```bash
# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -t hyrlqi-backend ./backend
docker tag hyrlqi-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/hyrlqi-backend:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/hyrlqi-backend:latest

# Build and push frontend
docker build -t hyrlqi-frontend ./frontend
docker tag hyrlqi-frontend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/hyrlqi-frontend:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/hyrlqi-frontend:latest
```

3. **Create ECS task definition and service**
4. **Setup RDS PostgreSQL and ElastiCache Redis**
5. **Configure Application Load Balancer**
6. **Setup Route 53 for DNS**

### 2.2 Google Cloud Platform

**Using Cloud Run:**

```bash
# Build and deploy backend
gcloud builds submit --tag gcr.io/your-project/hyrlqi-backend ./backend
gcloud run deploy hyrlqi-backend --image gcr.io/your-project/hyrlqi-backend --platform managed

# Build and deploy frontend
gcloud builds submit --tag gcr.io/your-project/hyrlqi-frontend ./frontend
gcloud run deploy hyrlqi-frontend --image gcr.io/your-project/hyrlqi-frontend --platform managed
```

### 2.3 DigitalOcean App Platform

Create `app.yaml`:

```yaml
name: hyrlqi-gambling-platform
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-username/hyrlqi
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 2
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
  - key: REDIS_URL
    value: ${redis.DATABASE_URL}

- name: frontend
  source_dir: /frontend
  github:
    repo: your-username/hyrlqi
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 2
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: NEXT_PUBLIC_API_URL
    value: https://backend-hyrlqi.ondigitalocean.app

databases:
- name: db
  engine: PG
  version: "13"
  size: basic-xs

- name: redis
  engine: REDIS
  version: "6"
  size: basic-xs
```

## 🔒 SSL Certificate Setup

### Option 1: Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Commercial SSL

1. Purchase SSL certificate from provider
2. Generate CSR and private key
3. Install certificate files
4. Configure Nginx with certificate paths

## 📊 Monitoring and Logging

### 1. Application Monitoring

**Using PM2 (for non-Docker deployments):**

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hyrlqi-backend',
      script: 'dist/server.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### 2. Log Management

**Using ELK Stack:**

```yaml
# Add to docker-compose.prod.yml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

### 3. Performance Monitoring

**Using New Relic:**

```bash
# Install New Relic agent
npm install newrelic

# Add to backend/src/server.ts (first line)
require('newrelic');
```

## 🔐 Security Hardening

### 1. Environment Variables

```bash
# Use secrets management
# AWS: AWS Secrets Manager
# GCP: Secret Manager
# Azure: Key Vault
# DigitalOcean: App Platform Secrets
```

### 2. Database Security

```sql
-- Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;

-- Enable SSL connections only
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/cert.pem';
ALTER SYSTEM SET ssl_key_file = '/path/to/key.pem';
```

### 3. Network Security

```bash
# Configure firewall (UFW on Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 📈 Scaling Considerations

### 1. Horizontal Scaling

```yaml
# Scale services in docker-compose
services:
  backend:
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
```

### 2. Database Scaling

```bash
# PostgreSQL read replicas
# Redis clustering
# Connection pooling with PgBouncer
```

### 3. CDN Setup

```bash
# CloudFlare setup
# AWS CloudFront
# Google Cloud CDN
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
        cd ../frontend && npm ci
        
    - name: Run tests
      run: |
        cd backend && npm test
        cd ../frontend && npm test
        
    - name: Build applications
      run: |
        cd backend && npm run build
        cd ../frontend && npm run build
        
    - name: Deploy to production
      run: |
        # Your deployment commands here
        docker-compose -f docker-compose.prod.yml up --build -d
```

## 🗄️ Backup Strategy

### 1. Database Backups

```bash
# Daily PostgreSQL backups
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump "postgresql://username:password@host:5432/hyrlqi_production" > "$BACKUP_DIR/hyrlqi_$DATE.sql"

# Keep only last 30 days
find $BACKUP_DIR -name "hyrlqi_*.sql" -mtime +30 -delete
```

### 2. Redis Backups

```bash
# Redis backup
redis-cli --rdb /backups/redis_$(date +%Y%m%d_%H%M%S).rdb
```

### 3. Application Backups

```bash
# Code and configuration backup
tar -czf /backups/app_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/app
```

## 🚀 Go-Live Checklist

### Final Pre-Launch Steps

- [ ] SSL certificate installed and working
- [ ] Domain DNS configured correctly
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring tools configured
- [ ] Backup systems tested
- [ ] Load testing completed
- [ ] Error tracking enabled

### Launch Day

1. **Deploy to production**
2. **Verify all services are running**
3. **Test critical user flows**
4. **Monitor error rates and performance**
5. **Have rollback plan ready**

### Post-Launch

1. **Monitor application metrics**
2. **Review error logs**
3. **Check user feedback**
4. **Plan feature updates**
5. **Optimize performance**

---

## 🎉 You're Ready for Production!

Your Hyrlqi gambling platform is now ready for production deployment. Choose the deployment method that best fits your infrastructure and requirements.

**Need help with deployment?** Let me know which option you'd like to pursue and I can provide more specific guidance!

🚀 **Good luck with your launch!**
