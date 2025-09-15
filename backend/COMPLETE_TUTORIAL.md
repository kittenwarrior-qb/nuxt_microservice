# Complete PostgreSQL + Moleculer Microservices Tutorial

## Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Setup](#quick-setup)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Configuration Files](#configuration-files)
7. [Core Services](#core-services)
8. [API Endpoints](#api-endpoints)
9. [Social Authentication](#social-authentication)
10. [Development Workflow](#development-workflow)
11. [Deployment](#deployment)
12. [Skeleton Files Guide](#skeleton-files-guide)

## Project Overview

This tutorial creates a complete e-commerce microservices backend using:
- **Moleculer Framework**: Fast, modern microservices framework
- **PostgreSQL**: Robust relational database
- **JWT Authentication**: Secure token-based auth with social login support
- **RESTful API**: Clean, scalable API design
- **Docker Support**: Complete containerization

### Architecture Benefits
- Scalable microservice design
- Independent service deployment
- Built-in load balancing and fault tolerance
- Social authentication (Facebook, GitHub, Google)
- Production-ready security features

## Prerequisites

- Node.js 16+
- PostgreSQL 12+
- Git
- Docker & Docker Compose (optional)

## Quick Setup

### 1. Initialize Project
```bash
mkdir thegioididong-backend
cd thegioididong-backend
npm init -y
```

### 2. Install Dependencies
```bash
# Core dependencies
npm install moleculer moleculer-db moleculer-db-adapter-sequelize moleculer-web
npm install sequelize pg pg-hstore
npm install bcryptjs jsonwebtoken dotenv
npm install helmet cors compression express-rate-limit joi

# Development dependencies
npm install --save-dev moleculer-repl nodemon jest eslint supertest
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Database Setup
```bash
# Create database
createdb tgdd

# Create users table
psql -U postgres -d tgdd -f scripts/create-users-table.sql
```

### 5. Start Development
```bash
npm run dev
```

## Project Structure

```
backend/
├── config/
│   └── database.js              # Database connection
├── services/
│   ├── api.service.js           # API Gateway
│   ├── database.service.js      # Database utilities
│   ├── users.service.js         # User authentication
│   ├── products.service.js      # Product management
│   ├── categories.service.js    # Category management
│   └── product_tags.service.js  # Product tagging
├── scripts/
│   ├── create-users-table.sql   # User table creation
│   └── init-db.sql             # Database initialization
├── .env.example                 # Environment template
├── .gitignore                  # Git ignore rules
├── docker-compose.yml          # Docker services
├── Dockerfile                  # Application container
├── healthcheck.js              # Health check script
├── index.js                    # Application entry point
├── moleculer.config.js         # Moleculer configuration
├── package.json                # Dependencies and scripts
└── README.md                   # Project documentation
```

## Database Schema

### Existing Tables (from your crawler)
```sql
-- Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    link TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
    id BIGINT PRIMARY KEY,
    name TEXT,
    price VARCHAR(100),
    price_old VARCHAR(100),
    percent VARCHAR(50),
    brand VARCHAR(100),
    category VARCHAR(100),
    img TEXT,
    rating VARCHAR(10),
    flash_sale_count VARCHAR(50),
    sold VARCHAR(100),
    is_flash_sale BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    is_loan BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    is_upcoming BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Tags
CREATE TABLE product_tags (
    id SERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### New Users Table (with Social Auth)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    
    -- Social Authentication Fields
    facebook_id VARCHAR(255),
    github_id VARCHAR(255),
    google_id VARCHAR(255),
    avatar_url TEXT,
    auth_provider VARCHAR(50) DEFAULT 'local',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Configuration Files

### 1. Environment Variables (`.env`)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tgdd
DB_USER=postgres
DB_PASSWORD=your_password
DB_DIALECT=postgres

# Application Configuration
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key

# Moleculer Configuration
TRANSPORTER=TCP
CACHER=Memory
LOGLEVEL=info

# Security
BCRYPT_ROUNDS=10
JWT_EXPIRES_IN=24h

# Social Auth (Optional)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Database Connection (`config/database.js`)
```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: process.env.DB_DIALECT,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

module.exports = sequelize;
```

### 3. Package.json Scripts
```json
{
  "scripts": {
    "dev": "moleculer-runner --repl --hot services/**/*.service.js",
    "start": "moleculer-runner services/**/*.service.js",
    "test": "jest",
    "migrate": "moleculer-runner --repl services/migration.service.js",
    "dc:up": "docker-compose up --build -d",
    "dc:down": "docker-compose down"
  }
}
```

## Core Services

### 1. API Gateway (`services/api.service.js`)
```javascript
const ApiGateway = require("moleculer-web");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

module.exports = {
  name: "api",
  mixins: [ApiGateway],
  
  settings: {
    port: process.env.PORT || 3000,
    ip: "0.0.0.0",
    
    use: [
      helmet(),
      cors({ origin: process.env.CORS_ORIGIN || "*" }),
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      })
    ],
    
    routes: [{
      path: "/api/v1",
      whitelist: [
        "database.healthCheck",
        "users.*",
        "products.*",
        "categories.*",
        "product_tags.*"
      ],
      
      aliases: {
        "GET /health": "database.healthCheck",
        "POST /auth/register": "users.register",
        "POST /auth/login": "users.login",
        "GET /auth/me": "users.me"
      },
      
      authentication: true,
      authorization: true
    }]
  },
  
  methods: {
    async authenticate(ctx, route, req) {
      const auth = req.headers["authorization"];
      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.slice(7);
        try {
          const user = await ctx.call("users.verifyToken", { token });
          return user;
        } catch (err) {
          return null;
        }
      }
      return null;
    },
    
    async authorize(ctx, route, req) {
      const publicRoutes = [
        "/api/v1/health",
        "/api/v1/auth/register", 
        "/api/v1/auth/login"
      ];
      
      if (publicRoutes.includes(req.url)) return true;
      if (!req.user) throw new Error("Authentication required");
      return true;
    }
  }
};
```

### 2. Users Service with Social Auth (`services/users.service.js`)
```javascript
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = {
  name: "users",
  mixins: [DbService],
  adapter: new SequelizeAdapter(sequelize),
  
  model: {
    name: "users",
    define: {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      password: { 
        type: DataTypes.STRING, 
        allowNull: true,
        set(value) {
          if (value) {
            const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
            this.setDataValue('password', bcrypt.hashSync(value, rounds));
          }
        }
      },
      firstName: { type: DataTypes.STRING, allowNull: false, field: 'first_name' },
      lastName: { type: DataTypes.STRING, allowNull: false, field: 'last_name' },
      phone: { type: DataTypes.STRING, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
      role: { type: DataTypes.ENUM('admin', 'user', 'moderator'), defaultValue: 'user' },
      emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'email_verified' },
      lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: 'last_login_at' },
      
      // Social Authentication Fields
      facebookId: { type: DataTypes.STRING(255), allowNull: true, field: 'facebook_id' },
      githubId: { type: DataTypes.STRING(255), allowNull: true, field: 'github_id' },
      googleId: { type: DataTypes.STRING(255), allowNull: true, field: 'google_id' },
      avatarUrl: { type: DataTypes.TEXT, allowNull: true, field: 'avatar_url' },
      authProvider: { type: DataTypes.STRING(50), defaultValue: 'local', field: 'auth_provider' }
    }
  },
  
  actions: {
    register: {
      rest: "POST /register",
      params: {
        email: "email",
        password: { type: "string", min: 6, optional: true },
        firstName: "string",
        lastName: "string",
        phone: { type: "string", optional: true },
        authProvider: { type: "string", optional: true, default: "local" },
        facebookId: { type: "string", optional: true },
        githubId: { type: "string", optional: true },
        googleId: { type: "string", optional: true },
        avatarUrl: { type: "string", optional: true }
      },
      async handler(ctx) {
        const { email, password, firstName, lastName } = ctx.params;
        
        const existingUser = await this.adapter.findOne({ email });
        if (existingUser) {
          throw new Error("User already exists with this email");
        }
        
        const userData = {
          email, firstName, lastName,
          phone: ctx.params.phone,
          authProvider: ctx.params.authProvider || 'local',
          facebookId: ctx.params.facebookId,
          githubId: ctx.params.githubId,
          googleId: ctx.params.googleId,
          avatarUrl: ctx.params.avatarUrl
        };
        
        if (password) userData.password = password;
        
        const user = await this.adapter.insert(userData);
        const token = this.generateToken(user);
        
        return {
          user: this.transformDocuments(ctx, {}, user),
          token
        };
      }
    },
    
    socialAuth: {
      rest: "POST /auth/social",
      params: {
        provider: { type: "enum", values: ["facebook", "github", "google"] },
        socialId: "string",
        email: "email",
        firstName: "string",
        lastName: "string",
        avatarUrl: { type: "string", optional: true }
      },
      async handler(ctx) {
        const { provider, socialId, email, firstName, lastName, avatarUrl } = ctx.params;
        
        // Check if user exists by social ID
        const socialField = `${provider}Id`;
        let user = await this.adapter.findOne({ [socialField]: socialId });
        
        if (!user) {
          // Check if user exists by email
          user = await this.adapter.findOne({ email });
          
          if (user) {
            // Link social account to existing user
            await this.adapter.updateById(user.id, { [socialField]: socialId, avatarUrl });
          } else {
            // Create new user
            user = await this.adapter.insert({
              email, firstName, lastName, avatarUrl,
              authProvider: provider,
              [socialField]: socialId,
              emailVerified: true
            });
          }
        }
        
        // Update last login
        await this.adapter.updateById(user.id, { lastLoginAt: new Date() });
        
        const token = this.generateToken(user);
        return {
          user: this.transformDocuments(ctx, {}, user),
          token
        };
      }
    }
  },
  
  methods: {
    generateToken(user) {
      return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
    },
    
    transformDocuments(ctx, params, docs) {
      if (Array.isArray(docs)) {
        return docs.map(doc => {
          const { password, ...user } = doc.toJSON ? doc.toJSON() : doc;
          return user;
        });
      } else {
        const { password, ...user } = docs.toJSON ? docs.toJSON() : docs;
        return user;
      }
    }
  }
};
```

## API Endpoints

### Authentication
```
POST /api/v1/auth/register     # Register new user
POST /api/v1/auth/login        # Login user
POST /api/v1/auth/social       # Social authentication
GET  /api/v1/auth/me           # Get current user
PUT  /api/v1/change-password   # Change password
PUT  /api/v1/profile           # Update profile
```

### Products
```
GET  /api/v1/products          # List products (with filters)
GET  /api/v1/products/:id      # Get product by ID
GET  /api/v1/products/search   # Search products
GET  /api/v1/products/flash-sale # Flash sale products
GET  /api/v1/products/new      # New products
```

### Categories
```
GET  /api/v1/categories        # List all categories
GET  /api/v1/categories/:id    # Get category by ID
GET  /api/v1/categories/:id/products # Products by category
```

### Product Tags
```
GET  /api/v1/product_tags/all  # All available tags
GET  /api/v1/product_tags/product/:id # Tags for product
GET  /api/v1/product_tags/tag/:tag/products # Products by tag
```

### System
```
GET  /api/v1/health           # Health check
```

## Social Authentication

### Facebook Integration
```javascript
// Frontend example
const facebookLogin = async () => {
  const response = await fetch('/api/v1/auth/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'facebook',
      socialId: fbUser.id,
      email: fbUser.email,
      firstName: fbUser.first_name,
      lastName: fbUser.last_name,
      avatarUrl: fbUser.picture?.data?.url
    })
  });
};
```

### GitHub Integration
```javascript
// Frontend example
const githubLogin = async () => {
  const response = await fetch('/api/v1/auth/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'github',
      socialId: githubUser.id.toString(),
      email: githubUser.email,
      firstName: githubUser.name?.split(' ')[0] || '',
      lastName: githubUser.name?.split(' ').slice(1).join(' ') || '',
      avatarUrl: githubUser.avatar_url
    })
  });
};
```

## Development Workflow

### 1. Adding New Service
```javascript
// services/example.service.js
module.exports = {
  name: "example",
  
  actions: {
    hello: {
      rest: "GET /hello",
      async handler(ctx) {
        return "Hello World!";
      }
    }
  }
};
```

### 2. Database Operations
```javascript
// Find records
const products = await this.adapter.find({
  query: { is_flash_sale: true },
  limit: 10,
  sort: [['created_at', 'DESC']]
});

// Create record
const product = await this.adapter.insert({
  name: "iPhone 15",
  price: "25000000",
  category: "Smartphone"
});

// Update record
await this.adapter.updateById(id, { price: "24000000" });

// Delete record
await this.adapter.removeById(id);
```

### 3. Service Communication
```javascript
// Call another service
const user = await ctx.call("users.get", { id: userId });

// Call with parameters
const products = await ctx.call("products.list", {
  category: "Smartphone",
  page: 1,
  pageSize: 20
});
```

## Deployment

### Docker Deployment
```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Environment
```env
NODE_ENV=production
DB_SSL=true
JWT_SECRET=very-secure-production-secret
CORS_ORIGIN=https://yourdomain.com
```

## Skeleton Files Guide

### Essential Files to Create

1. **Project Initialization**
   ```bash
   mkdir your-project && cd your-project
   npm init -y
   ```

2. **Core Dependencies** (copy to package.json)
   ```json
   {
     "dependencies": {
       "moleculer": "^0.14.29",
       "moleculer-db": "^0.8.23",
       "moleculer-db-adapter-sequelize": "^0.2.16",
       "moleculer-web": "^0.10.5",
       "sequelize": "^6.32.1",
       "pg": "^8.11.3",
       "pg-hstore": "^2.3.4",
       "bcryptjs": "^2.4.3",
       "jsonwebtoken": "^9.0.2",
       "dotenv": "^16.3.1",
       "helmet": "^7.0.0",
       "cors": "^2.8.5",
       "compression": "^1.7.4",
       "express-rate-limit": "^6.10.0"
     }
   }
   ```

3. **Directory Structure**
   ```bash
   mkdir -p config services scripts
   touch .env.example .gitignore
   ```

4. **Minimum Viable Files**
   - `index.js` - Application entry point
   - `config/database.js` - Database connection
   - `services/api.service.js` - API Gateway
   - `services/users.service.js` - Authentication
   - `.env.example` - Environment template

### Quick Start Template

Copy these files to get started quickly:

1. **index.js** - Basic Moleculer broker setup
2. **config/database.js** - PostgreSQL connection
3. **services/api.service.js** - HTTP API gateway
4. **services/users.service.js** - User management
5. **.env.example** - Configuration template

### Development Commands
```bash
npm install                    # Install dependencies
cp .env.example .env          # Create environment file
npm run dev                   # Start development server
```

### Testing Your Setup
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

This tutorial provides everything needed to build a production-ready microservices backend with PostgreSQL and social authentication support.
