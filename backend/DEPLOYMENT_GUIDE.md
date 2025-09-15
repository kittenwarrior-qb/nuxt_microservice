# Deployment Guide for TheGioiDiDong Microservices

## Quick Start

### 1. Local Development Setup

```bash
# Clone and setup
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Install dependencies
npm install

# Start PostgreSQL (if not using Docker)
# Make sure PostgreSQL is running on localhost:5432

# Start the application
npm run dev
```

### 2. Docker Development Setup

```bash
# Start all services with Docker Compose
npm run dc:up

# View logs
docker-compose logs -f

# Stop services
npm run dc:down
```

## Production Deployment

### 1. Environment Variables for Production

```env
NODE_ENV=production
PORT=3000

# Database (use your production PostgreSQL)
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=thegioididong_production
DB_USER=your-production-user
DB_PASSWORD=your-secure-password
DB_SSL=true

# Moleculer (use production message broker)
TRANSPORTER=nats://your-nats-cluster:4222
CACHER=redis://your-redis-cluster:6379

# Security
JWT_SECRET=your-very-secure-jwt-secret-at-least-32-characters
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. Database Migration Strategy

```bash
# Production migration workflow
npm run migrate

# Or using Docker
docker-compose exec app npm run migrate
```

### 3. Scaling Considerations

#### Horizontal Scaling
- Each service can be scaled independently
- Use load balancers for API gateway instances
- Database read replicas for read-heavy operations

#### Service Distribution
```yaml
# Example Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thegioididong-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: thegioididong-api
  template:
    metadata:
      labels:
        app: thegioididong-api
    spec:
      containers:
      - name: api
        image: thegioididong/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: SERVICES
          value: "api"
```

### 4. Monitoring and Logging

#### Health Checks
```bash
# Check application health
curl http://localhost:3000/api/v1/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Metrics Collection
Enable Prometheus metrics in production:

```javascript
// In moleculer.config.js
metrics: {
  enabled: true,
  reporter: {
    type: "Prometheus",
    options: {
      port: 3030,
      endpoint: "/metrics",
    }
  }
}
```

#### Logging Best Practices
```javascript
// Structured logging example
this.logger.info("User created", {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString()
});
```

### 5. Security Checklist

- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Use parameterized queries
- [ ] Implement proper CORS
- [ ] Use secure JWT secrets
- [ ] Enable database SSL
- [ ] Implement API authentication
- [ ] Set up proper firewall rules
- [ ] Regular security updates

### 6. Performance Optimization

#### Database Optimization
```sql
-- Add indexes for frequently queried fields
CREATE INDEX CONCURRENTLY idx_products_category_active 
ON catalog.products(category_id, is_active);

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Caching Strategy
```javascript
// Service-level caching
settings: {
  $cache: {
    keys: ["id"],
    ttl: 3600 // 1 hour
  }
}
```

#### Connection Pooling
```javascript
// Optimize database pool settings
pool: {
  max: 20,           // Maximum connections
  min: 5,            // Minimum connections
  acquire: 30000,    // Maximum time to get connection
  idle: 10000,       // Maximum idle time
}
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database connectivity
docker-compose exec postgres psql -U postgres -d thegioididong_db -c "SELECT 1;"

# Check connection pool
# Monitor active connections in PostgreSQL
SELECT count(*) FROM pg_stat_activity;
```

#### 2. Service Discovery Problems
```bash
# Check service registry
# In moleculer REPL
mol$ nodes
mol$ services
```

#### 3. Memory Leaks
```bash
# Monitor memory usage
docker stats

# Use Node.js memory profiling
node --inspect index.js
```

#### 4. High CPU Usage
```bash
# Profile CPU usage
node --prof index.js
node --prof-process isolate-*.log > processed.txt
```

### Debugging Tools

#### 1. Moleculer REPL
```bash
# Connect to running broker
npm run cli

# Available commands:
mol$ nodes        # List nodes
mol$ services     # List services
mol$ actions      # List actions
mol$ call users.list  # Call action
```

#### 2. Database Debugging
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d thegioididong_db

# Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 5;
```

#### 3. Application Logs
```bash
# Follow application logs
docker-compose logs -f app

# Filter specific service logs
docker-compose logs -f app | grep "users.service"
```

## Backup and Recovery

### 1. Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres thegioididong_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres thegioididong_db < backup.sql
```

### 2. Automated Backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U postgres thegioididong_db | gzip > "backup_${DATE}.sql.gz"

# Keep only last 7 days
find . -name "backup_*.sql.gz" -mtime +7 -delete
```

### 3. Point-in-Time Recovery
Enable WAL archiving in PostgreSQL for point-in-time recovery:

```postgresql
# In postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
```

## CI/CD Pipeline

### 1. GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Your deployment script here
          echo "Deploying to production..."
```

### 2. Docker Build Optimization
```dockerfile
# Multi-stage build for smaller images
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Maintenance

### 1. Regular Tasks
- Monitor database performance
- Update dependencies monthly
- Review and rotate logs
- Check security vulnerabilities
- Update SSL certificates

### 2. Database Maintenance
```sql
-- Analyze tables for better query planning
ANALYZE;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Reindex if needed
REINDEX DATABASE thegioididong_db;
```

### 3. Monitoring Alerts
Set up alerts for:
- High CPU/Memory usage
- Database connection pool exhaustion
- Slow response times
- Error rates above threshold
- Disk space usage

This deployment guide provides a comprehensive foundation for running your PostgreSQL + Moleculer microservices in production. Adjust the configurations based on your specific infrastructure and requirements.
