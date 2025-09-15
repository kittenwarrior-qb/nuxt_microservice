const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

module.exports = {
  name: "products",
  
  mixins: [DbService],
  
  adapter: new SequelizeAdapter(sequelize),
  
  model: {
    name: "products",
    define: {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      price: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      price_old: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      percent: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      brand: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      img: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      rating: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      flash_sale_count: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      sold: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      is_flash_sale: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_new: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_loan: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_online: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_upcoming: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      link: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    options: {
      timestamps: true,
      underscored: true,
      tableName: 'products'
    }
  },
  
  settings: {
    fields: ["id", "name", "price", "price_old", "percent", "brand", "category", "img", "rating", "flash_sale_count", "sold", "is_flash_sale", "is_new", "is_loan", "is_online", "is_upcoming", "link", "createdAt", "updatedAt"],
    
    scopes: {
      flashSale: { is_flash_sale: true },
      newProducts: { is_new: true },
      withLoan: { is_loan: true },
      online: { is_online: true },
      upcoming: { is_upcoming: true }
    },
    
    defaultScopes: []
  },
  
  actions: {
    list: {
      rest: "GET /",
      params: {
        page: { type: "number", optional: true, default: 1 },
        pageSize: { type: "number", optional: true, default: 10 },
        category: { type: "string", optional: true },
        brand: { type: "string", optional: true },
        is_flash_sale: { type: "boolean", optional: true },
        is_new: { type: "boolean", optional: true }
      },
      async handler(ctx) {
        const { page, pageSize, category, brand, is_flash_sale, is_new } = ctx.params;
        
        let query = {};
        if (category) query.category = category;
        if (brand) query.brand = brand;
        if (is_flash_sale !== undefined) query.is_flash_sale = is_flash_sale;
        if (is_new !== undefined) query.is_new = is_new;
        
        const products = await this.adapter.find({
          query,
          offset: (page - 1) * pageSize,
          limit: pageSize,
          sort: [['created_at', 'DESC']]
        });
        
        return products;
      }
    },
    
    get: {
      rest: "GET /:id",
      params: {
        id: "string"
      },
      async handler(ctx) {
        const { id } = ctx.params;
        const product = await this.adapter.findById(id);
        
        if (!product) {
          throw new Error("Product not found");
        }
        
        return product;
      }
    },
    
    search: {
      rest: "GET /search",
      params: {
        q: "string",
        page: { type: "number", optional: true, default: 1 },
        pageSize: { type: "number", optional: true, default: 10 }
      },
      async handler(ctx) {
        const { q, page, pageSize } = ctx.params;
        
        const products = await this.adapter.find({
          query: {
            name: { $like: `%${q}%` }
          },
          offset: (page - 1) * pageSize,
          limit: pageSize,
          sort: [['created_at', 'DESC']]
        });
        
        return products;
      }
    },
    
    flashSale: {
      rest: "GET /flash-sale",
      params: {
        page: { type: "number", optional: true, default: 1 },
        pageSize: { type: "number", optional: true, default: 10 }
      },
      async handler(ctx) {
        const { page, pageSize } = ctx.params;
        
        const products = await this.adapter.find({
          query: { is_flash_sale: true },
          offset: (page - 1) * pageSize,
          limit: pageSize,
          sort: [['created_at', 'DESC']]
        });
        
        return products;
      }
    },
    
    newProducts: {
      rest: "GET /new",
      params: {
        page: { type: "number", optional: true, default: 1 },
        pageSize: { type: "number", optional: true, default: 10 }
      },
      async handler(ctx) {
        const { page, pageSize } = ctx.params;
        
        const products = await this.adapter.find({
          query: { is_new: true },
          offset: (page - 1) * pageSize,
          limit: pageSize,
          sort: [['created_at', 'DESC']]
        });
        
        return products;
      }
    }
  },
  
  async started() {
    this.logger.info("Products service started");
  }
};
