const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const { DataTypes, Op } = require("sequelize");
const sequelize = require("../config/database");

module.exports = {
  name: "product_tags",
  
  mixins: [DbService],
  
  adapter: new SequelizeAdapter(sequelize),
  
  model: {
    name: "product_tags",
    define: {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        }
      },
      tag: {
        type: DataTypes.STRING(255),
        allowNull: false
      }
    },
    options: {
      timestamps: true,
      underscored: true,
      tableName: 'product_tags',
      indexes: [
        { fields: ['product_id'] },
        { fields: ['tag'] }
      ]
    }
  },
  
  settings: {
    fields: ["id", "product_id", "tag", "createdAt"],
    
    scopes: {},
    
    defaultScopes: []
  },
  
  actions: {
    list: {
      rest: "GET /",
      params: {
        product_id: { type: "string", optional: true },
        tag: { type: "string", optional: true }
      },
      async handler(ctx) {
        const { product_id, tag } = ctx.params;
        
        let query = {};
        if (product_id) query.product_id = product_id;
        if (tag) query.tag = { $like: `%${tag}%` };
        
        const tags = await this.adapter.find({
          query,
          sort: [['tag', 'ASC']]
        });
        
        return tags;
      }
    },
    
    getByProduct: {
      rest: "GET /product/:product_id",
      params: {
        product_id: "string"
      },
      async handler(ctx) {
        const { product_id } = ctx.params;
        
        const tags = await this.adapter.find({
          query: { product_id },
          sort: [['tag', 'ASC']]
        });
        
        return tags.map(t => t.tag);
      }
    },
    
    getProductsByTag: {
      rest: "GET /tag/:tag/products",
      params: {
        tag: "string",
        page: { type: "number", optional: true, default: 1 },
        pageSize: { type: "number", optional: true, default: 10 }
      },
      async handler(ctx) {
        const { tag, page, pageSize } = ctx.params;
        
        // Get product IDs with this tag
        const taggedProducts = await this.adapter.find({
          query: { tag },
          fields: ["product_id"]
        });
        
        const productIds = taggedProducts.map(tp => tp.product_id);
        
        if (productIds.length === 0) {
          return [];
        }
        
        // Get products by IDs
        const products = await ctx.call("products.find", {
          query: { id: { $in: productIds } },
          offset: (page - 1) * pageSize,
          limit: pageSize
        });
        
        return products;
      }
    },
    
    getAllTags: {
      rest: "GET /all",
      async handler(ctx) {
        const tags = await this.adapter.db.query(
          "SELECT DISTINCT tag FROM product_tags ORDER BY tag ASC",
          { type: sequelize.QueryTypes.SELECT }
        );
        
        return tags.map(t => t.tag);
      }
    }
  },
  
  async started() {
    this.logger.info("Product Tags service started");
  }
};
