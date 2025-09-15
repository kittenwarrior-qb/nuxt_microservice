# PostgreSQL Database with Moleculer Microservices Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Setup](#project-setup)
4. [Database Configuration](#database-configuration)
5. [Moleculer Service Architecture](#moleculer-service-architecture)
6. [Database Service Implementation](#database-service-implementation)
7. [Migration and Schema Management](#migration-and-schema-management)
8. [Best Practices](#best-practices)
9. [Deployment Considerations](#deployment-considerations)
10. [Troubleshooting](#troubleshooting)

## Overview

This guide will help you set up a robust PostgreSQL database system using Moleculer microservices framework with Node.js. Moleculer is a fast, modern, and powerful microservices framework that provides excellent database integration capabilities.

### Architecture Benefits
- **Microservice Pattern**: Each database operation can be isolated in separate services
- **Scalability**: Services can be scaled independently
- **Fault Tolerance**: Built-in circuit breaker and retry mechanisms
- **Load Balancing**: Automatic load balancing between service instances
- **Monitoring**: Built-in metrics and tracing

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL server (v12 or higher)
- Basic understanding of microservices architecture
- Familiarity with SQL and database design

## Project Setup

### 1. Install Required Dependencies

```bash
npm install moleculer
npm install moleculer-db moleculer-db-adapter-sequelize
npm install pg pg-hstore sequelize
npm install moleculer-web
npm install dotenv
npm install --save-dev moleculer-repl
```

### 2. Development Dependencies

```bash
npm install --save-dev nodemon jest moleculer-test
```

## Database Configuration

### 1. Environment Variables

Create a `.env` file in your backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=thegioididong_db
DB_USER=your_username
DB_PASSWORD=your_password
DB_DIALECT=postgres
DB_POOL_MAX=20
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# Moleculer Configuration
SERVICEDIR=services
SERVICES=api,users,products,orders
TRANSPORTER=nats://localhost:4222
CACHER=redis://localhost:6379
LOGGER=true
LOGLEVEL=info

# Application Configuration
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
```

### 2. Database Connection Configuration

Create `config/database.js`:

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

## Moleculer Service Architecture

### 1. Broker Configuration

Create `moleculer.config.js`:

```javascript
module.exports = {
  namespace: "thegioididong",
  nodeID: null,
  
  logger: {
    type: "Console",
    options: {
      colors: true,
      moduleColors: false,
      formatter: "full",
      objectPrinter: null,
      autoPadding: false
    }
  },
  
  logLevel: process.env.LOGLEVEL || "info",
  
  transporter: process.env.TRANSPORTER || "TCP",
  
  cacher: process.env.CACHER || "Memory",
  
  serializer: "JSON",
  
  requestTimeout: 10 * 1000,
  retryPolicy: {
    enabled: false,
    retries: 5,
    delay: 100,
    maxDelay: 1000,
    factor: 2,
    check: err => err && !!err.retryable
  },
  
  maxCallLevel: 100,
  heartbeatInterval: 10,
  heartbeatTimeout: 30,
  
  contextParamsCloning: false,
  tracking: {
    enabled: false,
    shutdownTimeout: 5000,
  },
  
  disableBalancer: false,
  
  registry: {
    strategy: "RoundRobin",
    preferLocal: true
  },
  
  circuitBreaker: {
    enabled: false,
    threshold: 0.5,
    minRequestCount: 20,
    windowTime: 60,
    halfOpenTime: 10 * 1000,
    check: err => err && err.code >= 500
  },
  
  bulkhead: {
    enabled: false,
    concurrency: 10,
    maxQueueSize: 100,
  },
  
  validator: true,
  
  errorHandler: null,
  
  metrics: {
    enabled: false,
    reporter: {
      type: "Prometheus",
      options: {
        port: 3030,
        endpoint: "/metrics",
      }
    }
  },
  
  tracing: {
    enabled: false,
    exporter: {
      type: "Console",
      options: {
        logger: null,
        colors: true,
        width: 100,
        gaugeWidth: 40
      }
    }
  },
  
  middlewares: [],
  
  replCommands: null,
  
  created(broker) {
    // Fired when the broker created
  },
  
  started(broker) {
    // Fired when the broker started
  },
  
  stopped(broker) {
    // Fired when the broker stopped
  }
};
```

## Database Service Implementation

### 1. Base Database Service

Create `services/database.service.js`:

```javascript
const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const sequelize = require("../config/database");

module.exports = {
  name: "database",
  
  mixins: [DbService],
  
  adapter: new SequelizeAdapter(sequelize),
  
  settings: {
    // Common database settings
    idField: "id",
    pageSize: 10,
    maxPageSize: 100,
    maxLimit: -1,
    
    // Field filtering
    fields: ["id", "created_at", "updated_at"],
    
    // Default scopes
    defaultScopes: [],
    
    // Available scopes
    scopes: {},
    
    // Default query parameters
    defaultQuery: {},
  },
  
  actions: {
    // Custom database actions
    healthCheck: {
      rest: "GET /health",
      async handler(ctx) {
        try {
          await this.adapter.db.authenticate();
          return {
            status: "healthy",
            database: "connected",
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          throw new Error(`Database connection failed: ${error.message}`);
        }
      }
    },
    
    migrate: {
      async handler(ctx) {
        try {
          await this.adapter.db.sync({ force: false });
          return { status: "Migration completed successfully" };
        } catch (error) {
          throw new Error(`Migration failed: ${error.message}`);
        }
      }
    }
  },
  
  methods: {
    // Custom methods
    async seedDatabase() {
      // Implement database seeding logic
      this.logger.info("Database seeding completed");
    }
  },
  
  async started() {
    // Test database connection
    try {
      await this.adapter.db.authenticate();
      this.logger.info("Database connection established successfully");
      
      // Run migrations in development
      if (process.env.NODE_ENV === "development") {
        await this.adapter.db.sync({ alter: true });
        this.logger.info("Database synchronized");
      }
    } catch (error) {
      this.logger.error("Unable to connect to database:", error);
      throw error;
    }
  }
};
```

### 2. User Service Example

Create `services/users.service.js`:

```javascript
const { ServiceBroker } = require("moleculer");
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
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          this.setDataValue('password', bcrypt.hashSync(value, 10));
        }
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      role: {
        type: DataTypes.ENUM('admin', 'user', 'moderator'),
        defaultValue: 'user'
      }
    },
    options: {
      timestamps: true,
      indexes: [
        { fields: ['email'] },
        { fields: ['role'] },
        { fields: ['isActive'] }
      ]
    }
  },
  
  settings: {
    fields: ["id", "email", "firstName", "lastName", "isActive", "role", "createdAt", "updatedAt"],
    
    scopes: {
      active: { isActive: true },
      admins: { role: 'admin' }
    },
    
    defaultScopes: ["active"]
  },
  
  actions: {
    register: {
      rest: "POST /register",
      params: {
        email: "email",
        password: { type: "string", min: 6 },
        firstName: "string",
        lastName: "string"
      },
      async handler(ctx) {
        const { email, password, firstName, lastName } = ctx.params;
        
        // Check if user already exists
        const existingUser = await this.adapter.findOne({ email });
        if (existingUser) {
          throw new Error("User already exists with this email");
        }
        
        // Create new user
        const user = await this.adapter.insert({
          email,
          password,
          firstName,
          lastName
        });
        
        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        return {
          user: this.transformDocuments(ctx, {}, user),
          token
        };
      }
    },
    
    login: {
      rest: "POST /login",
      params: {
        email: "email",
        password: "string"
      },
      async handler(ctx) {
        const { email, password } = ctx.params;
        
        // Find user
        const user = await this.adapter.findOne({ email });
        if (!user) {
          throw new Error("Invalid credentials");
        }
        
        // Verify password
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        return {
          user: this.transformDocuments(ctx, {}, user),
          token
        };
      }
    }
  },
  
  methods: {
    transformDocuments(ctx, params, docs) {
      // Remove password from response
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

### 3. API Gateway Service

Create `services/api.service.js`:

```javascript
const ApiGateway = require("moleculer-web");
const jwt = require("jsonwebtoken");

module.exports = {
  name: "api",
  
  mixins: [ApiGateway],
  
  settings: {
    port: process.env.PORT || 3000,
    
    ip: "0.0.0.0",
    
    use: [],
    
    routes: [
      {
        path: "/api/v1",
        
        whitelist: [
          "users.*",
          "products.*",
          "orders.*"
        ],
        
        use: [],
        
        mergeParams: true,
        
        authentication: false,
        
        authorization: true,
        
        autoAliases: true,
        
        aliases: {
          "GET /health": "database.healthCheck"
        },
        
        callingOptions: {},
        
        bodyParsers: {
          json: {
            strict: false,
            limit: "1MB"
          },
          urlencoded: {
            extended: true,
            limit: "1MB"
          }
        },
        
        mappingPolicy: "all",
        
        logging: true
      }
    ],
    
    log4XXResponses: false,
    logRequestParams: null,
    logResponseData: null,
    
    assets: {
      folder: "public",
      options: {}
    }
  },
  
  methods: {
    async authenticate(ctx, route, req) {
      const auth = req.headers["authorization"];
      
      if (auth && auth.startsWith("Bearer")) {
        const token = auth.slice(7);
        
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          return decoded;
        } catch (err) {
          throw new Error("Invalid token");
        }
      } else {
        return null;
      }
    },
    
    async authorize(ctx, route, req) {
      // Implement authorization logic
      return true;
    }
  }
};
```

## Migration and Schema Management

### 1. Migration Service

Create `services/migration.service.js`:

```javascript
module.exports = {
  name: "migration",
  
  actions: {
    up: {
      async handler(ctx) {
        const { version } = ctx.params;
        
        try {
          // Run specific migration
          await this.runMigration(version);
          return { status: `Migration ${version} completed` };
        } catch (error) {
          throw new Error(`Migration failed: ${error.message}`);
        }
      }
    },
    
    down: {
      async handler(ctx) {
        const { version } = ctx.params;
        
        try {
          // Rollback specific migration
          await this.rollbackMigration(version);
          return { status: `Migration ${version} rolled back` };
        } catch (error) {
          throw new Error(`Rollback failed: ${error.message}`);
        }
      }
    },
    
    status: {
      async handler(ctx) {
        // Return migration status
        return await this.getMigrationStatus();
      }
    }
  },
  
  methods: {
    async runMigration(version) {
      // Implement migration logic
      this.logger.info(`Running migration: ${version}`);
    },
    
    async rollbackMigration(version) {
      // Implement rollback logic
      this.logger.info(`Rolling back migration: ${version}`);
    },
    
    async getMigrationStatus() {
      // Return current migration status
      return {
        current: "001_initial",
        pending: [],
        applied: ["001_initial"]
      };
    }
  }
};
```

## Best Practices

### 1. Service Organization
- Keep services focused on single responsibilities
- Use mixins for common functionality
- Implement proper error handling
- Use validation for all inputs

### 2. Database Design
- Use UUIDs for primary keys in distributed systems
- Implement proper indexing strategy
- Use database constraints for data integrity
- Plan for horizontal scaling

### 3. Security
- Always hash passwords
- Implement JWT authentication
- Use environment variables for secrets
- Validate and sanitize all inputs
- Implement rate limiting

### 4. Performance
- Use database connection pooling
- Implement caching strategies
- Use database indexes effectively
- Monitor query performance

### 5. Monitoring and Logging
- Implement structured logging
- Use metrics and tracing
- Set up health checks
- Monitor database performance

## Deployment Considerations

### 1. Environment Configuration
```bash
# Production environment variables
NODE_ENV=production
DB_HOST=your-production-db-host
DB_SSL=true
TRANSPORTER=nats://your-nats-cluster
CACHER=redis://your-redis-cluster
```

### 2. Docker Configuration

Create `Dockerfile`:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
    depends_on:
      - postgres
      - redis
      - nats
  
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: thegioididong_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:6-alpine
  
  nats:
    image: nats:2-alpine

volumes:
  postgres_data:
```

### 3. Health Checks
Implement comprehensive health checks for:
- Database connectivity
- Service dependencies
- Memory usage
- Response times

### 4. Scaling Strategies
- Horizontal scaling of stateless services
- Database read replicas
- Connection pooling
- Load balancing

## Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**
   - Increase pool size
   - Check for connection leaks
   - Implement connection timeout

2. **Slow Queries**
   - Add database indexes
   - Optimize query structure
   - Use query analysis tools

3. **Memory Leaks**
   - Monitor memory usage
   - Check for unclosed connections
   - Use memory profiling tools

4. **Service Discovery Issues**
   - Check transporter configuration
   - Verify network connectivity
   - Monitor service registry

### Debugging Tools
- Use `moleculer-repl` for interactive debugging
- Enable detailed logging in development
- Use database query logging
- Implement performance monitoring

## Conclusion

This guide provides a solid foundation for building scalable PostgreSQL-based microservices using Moleculer. Remember to:

- Start simple and iterate
- Test thoroughly
- Monitor performance
- Plan for scale
- Keep security in mind

For more advanced features, refer to the official Moleculer documentation and PostgreSQL best practices guides.
