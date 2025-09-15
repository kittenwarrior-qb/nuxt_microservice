const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const sequelize = require("../config/database");

module.exports = {
  name: "database",
  
  mixins: [DbService],
  
  adapter: new SequelizeAdapter(sequelize),
  
  settings: {
    idField: "id",
    pageSize: 10,
    maxPageSize: 100,
    maxLimit: -1,
    
    fields: ["id", "created_at", "updated_at"],
    
    defaultScopes: [],
    
    scopes: {},
    
    defaultQuery: {},
  },
  
  actions: {
    healthCheck: {
      rest: "GET /health",
      async handler(ctx) {
        try {
          await this.adapter.db.authenticate();
          
          // Check database version
          const result = await this.adapter.db.query('SELECT version()');
          const version = result[0][0].version;
          
          return {
            status: "healthy",
            database: "connected",
            version: version.split(' ')[0] + ' ' + version.split(' ')[1],
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
          };
        } catch (error) {
          this.logger.error("Database health check failed:", error);
          throw new Error(`Database connection failed: ${error.message}`);
        }
      }
    },
    
    migrate: {
      params: {
        force: { type: "boolean", optional: true, default: false }
      },
      async handler(ctx) {
        const { force } = ctx.params;
        
        try {
          await this.adapter.db.sync({ 
            force: force,
            alter: !force && process.env.NODE_ENV === 'development'
          });
          
          return { 
            status: "Migration completed successfully",
            force: force,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          this.logger.error("Migration failed:", error);
          throw new Error(`Migration failed: ${error.message}`);
        }
      }
    },
    
    seed: {
      async handler(ctx) {
        try {
          await this.seedDatabase();
          return { 
            status: "Database seeded successfully",
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          this.logger.error("Database seeding failed:", error);
          throw new Error(`Database seeding failed: ${error.message}`);
        }
      }
    },
    
    stats: {
      async handler(ctx) {
        try {
          // Get database statistics
          const stats = await this.adapter.db.query(`
            SELECT 
              schemaname,
              tablename,
              n_tup_ins as inserts,
              n_tup_upd as updates,
              n_tup_del as deletes,
              n_live_tup as live_tuples,
              n_dead_tup as dead_tuples
            FROM pg_stat_user_tables
            ORDER BY schemaname, tablename
          `);
          
          return {
            tables: stats[0],
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          this.logger.error("Failed to get database stats:", error);
          throw new Error(`Failed to get database stats: ${error.message}`);
        }
      }
    }
  },
  
  methods: {
    async seedDatabase() {
      this.logger.info("Starting database seeding...");
      
      // This method can be extended to seed initial data
      // For now, it's just a placeholder
      
      this.logger.info("Database seeding completed");
    },
    
    async createIndexes() {
      // Create additional indexes if needed
      this.logger.info("Creating additional database indexes...");
      
      try {
        // Example: Create text search indexes
        await this.adapter.db.query(`
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search 
          ON catalog.products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')))
        `);
        
        this.logger.info("Additional indexes created successfully");
      } catch (error) {
        this.logger.warn("Failed to create some indexes:", error.message);
      }
    }
  },
  
  async started() {
    try {
      // Test database connection
      await this.adapter.db.authenticate();
      this.logger.info("Database connection established successfully");
      
      // Run migrations in development
      if (process.env.NODE_ENV === "development") {
        await this.adapter.db.sync({ alter: true });
        this.logger.info("Database synchronized in development mode");
        
        // Create additional indexes
        await this.createIndexes();
      }
      
      // Log connection pool info
      const pool = this.adapter.db.connectionManager.pool;
      this.logger.info(`Database pool: ${pool.size}/${pool.options.max} connections`);
      
    } catch (error) {
      this.logger.error("Unable to connect to database:", error);
      throw error;
    }
  },
  
  async stopped() {
    try {
      await this.adapter.db.close();
      this.logger.info("Database connection closed");
    } catch (error) {
      this.logger.error("Error closing database connection:", error);
    }
  }
};
