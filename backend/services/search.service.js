const { Client } = require('@elastic/elasticsearch');
const sequelize = require("../config/database");

module.exports = {
  name: 'search',

  settings: {
    // Config via env
    elastic: {
      node: process.env.ELASTICSEARCH_NODE,
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
      apiKey: process.env.ELASTICSEARCH_API_KEY,
      index: process.env.ELASTICSEARCH_INDEX || 'products',
    },
    suggestLimit: parseInt(process.env.SEARCH_SUGGEST_LIMIT || '8', 10),
    // Production optimizations
    minSearchLength: parseInt(process.env.MIN_SEARCH_LENGTH || '2', 10),
    cacheEnabled: process.env.NODE_ENV === 'production',
    cacheTTL: parseInt(process.env.SEARCH_CACHE_TTL || '300', 10), // 5 minutes
  },

  async created() {
    const { node, username, password, apiKey } = this.settings.elastic;
    if (node) {
      const auth = apiKey ? { apiKey } : (username && password ? { username, password } : undefined);
      this.es = new Client({ node, auth });
      this.logger.info('Elasticsearch client initialized');
      
      // Auto-setup ES in production
      if (process.env.NODE_ENV === 'production') {
        this.autoSetupElasticsearch();
      }
    } else {
      this.logger.warn('Elasticsearch is not configured. Falling back to PostgreSQL LIKE search for suggestions.');
      this.es = null;
    }
  },

  actions: {
    suggest: {
      rest: 'GET /search/suggest',
      params: {
        q: { type: 'string', min: 1, optional: false },
        limit: { type: 'number', optional: true, convert: true, default: ctx => ctx.service.settings.suggestLimit },
      },
      async handler(ctx) {
        const { q, limit } = ctx.params;
        const trimmed = q.trim();
        
        // Early return for empty or too short queries
        if (!trimmed || trimmed.length < this.settings.minSearchLength) {
          return [];
        }

        // Simple cache key for production
        const cacheKey = `search:${trimmed}:${limit}`;
        if (this.settings.cacheEnabled && this.broker.cacher) {
          const cached = await this.broker.cacher.get(cacheKey);
          if (cached) return cached;
        }

        // Prefer Elasticsearch if configured
        if (this.es) {
          try {
            const index = this.settings.elastic.index;
            const result = await this.es.search({
              index,
              size: limit,
              query: {
                multi_match: {
                  query: trimmed,
                  fields: ['name^3', 'brand^2', 'category'],
                  type: 'bool_prefix',
                },
              },
              _source: ['id', 'name', 'price', 'brand', 'category', 'img'],
            });

            const hits = result.hits?.hits || [];
            return hits.map(h => ({ id: h._source.id, name: h._source.name, price: h._source.price, brand: h._source.brand, category: h._source.category, img: h._source.img }));
          } catch (err) {
            this.logger.error('Elasticsearch suggest error:', err);
            // Fallback to DB if ES fails
          }
        }

        // PostgreSQL fallback using simple optimized search
        const fallbackSql = `
          SELECT id, name, price, brand, category, img
          FROM products
          WHERE name IS NOT NULL 
            AND TRIM(name) != ''
            AND (name ILIKE :prefix OR name ILIKE :like)
          ORDER BY 
            CASE WHEN name ILIKE :prefix THEN 1 ELSE 2 END,
            id DESC
          LIMIT :limit
        `;
        const suggestions = await sequelize.query(fallbackSql, {
          replacements: { 
            like: `%${trimmed}%`, 
            prefix: `${trimmed}%`,
            limit 
          },
          type: sequelize.QueryTypes.SELECT,
        });

        // Cache results in production
        if (this.settings.cacheEnabled && this.broker.cacher) {
          await this.broker.cacher.set(cacheKey, suggestions, this.settings.cacheTTL);
        }

        return suggestions;
      }
    },
  },

  methods: {
    async autoSetupElasticsearch() {
      try {
        this.logger.info('🚀 Auto-setting up Elasticsearch...');
        
        // Wait for ES to be ready
        await this.waitForES();
        
        // Create index if not exists
        const indexCreated = await this.createIndexIfNotExists();
        
        // Import data if index is empty
        if (indexCreated) {
          await this.importDataIfEmpty();
        }
        
        this.logger.info('✅ Elasticsearch auto-setup completed!');
      } catch (error) {
        this.logger.warn('⚠️ Elasticsearch auto-setup failed:', error.message);
      }
    },

    async waitForES(maxRetries = 30) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          await this.es.ping();
          return;
        } catch (error) {
          this.logger.info(`⏳ Waiting for Elasticsearch... (${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
      throw new Error('Elasticsearch not available');
    },

    async createIndexIfNotExists() {
      const index = this.settings.elastic.index;
      const exists = await this.es.indices.exists({ index });
      
      if (!exists) {
        this.logger.info(`📋 Creating index: ${index}`);
        await this.es.indices.create({
          index,
          body: {
            settings: { number_of_shards: 1, number_of_replicas: 0 },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                brand: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                category: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                price: { type: 'keyword' },
                img: { type: 'keyword' },
                created_at: { type: 'date' }
              }
            }
          }
        });
        return true;
      }
      return false;
    },

    async importDataIfEmpty() {
      const index = this.settings.elastic.index;
      const count = await this.es.count({ index });
      
      if (count.count > 0) {
        this.logger.info(`ℹ️ Index has ${count.count} documents, skipping import`);
        return;
      }

      this.logger.info('📤 Importing products to Elasticsearch...');
      
      // Get products from PostgreSQL
      const sequelize = require("../config/database");
      const [products] = await sequelize.query(`
        SELECT id, name, price, brand, category, img, created_at
        FROM products 
        WHERE name IS NOT NULL AND TRIM(name) != ''
        ORDER BY created_at DESC
        LIMIT 5000
      `);

      if (products.length === 0) {
        this.logger.warn('⚠️ No products found in database');
        return;
      }

      // Bulk import
      const body = [];
      products.forEach(product => {
        body.push({ index: { _index: index, _id: product.id } });
        body.push({
          id: product.id,
          name: product.name,
          price: product.price,
          brand: product.brand,
          category: product.category,
          img: product.img,
          created_at: product.created_at
        });
      });

      await this.es.bulk({ refresh: true, body });
      this.logger.info(`✅ Imported ${products.length} products to Elasticsearch!`);
    }
  }
};
