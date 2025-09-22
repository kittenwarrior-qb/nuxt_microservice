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

  created() {
    const { node, username, password, apiKey } = this.settings.elastic;
    if (node) {
      const auth = apiKey ? { apiKey } : (username && password ? { username, password } : undefined);
      this.es = new Client({ node, auth });
      this.logger.info('Elasticsearch client initialized');
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
};
