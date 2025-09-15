const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

module.exports = {
  name: "categories",
  
  mixins: [DbService],
  
  adapter: new SequelizeAdapter(sequelize),
  
  model: {
    name: "categories",
    define: {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      link: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    options: {
      timestamps: true,
      underscored: true,
      tableName: 'categories'
    }
  },
  
  settings: {
    fields: ["id", "name", "link", "createdAt", "updatedAt"],
    
    scopes: {},
    
    defaultScopes: []
  },
  
  actions: {
    list: {
      rest: "GET /",
      async handler(ctx) {
        const categories = await this.adapter.find({
          sort: [['name', 'ASC']]
        });
        
        return categories;
      }
    },
    
    get: {
      rest: "GET /:id",
      params: {
        id: "number"
      },
      async handler(ctx) {
        const { id } = ctx.params;
        const category = await this.adapter.findById(id);
        
        if (!category) {
          throw new Error("Category not found");
        }
        
        return category;
      }
    },
    
    products: {
      rest: "GET /:id/products",
      params: {
        id: "number",
        page: { type: "number", optional: true, default: 1 },
        pageSize: { type: "number", optional: true, default: 10 }
      },
      async handler(ctx) {
        const { id, page, pageSize } = ctx.params;
        
        // First get the category to get its name
        const category = await this.adapter.findById(id);
        if (!category) {
          throw new Error("Category not found");
        }
        
        // Then get products by category name
        const products = await ctx.call("products.list", {
          category: category.name,
          page,
          pageSize
        });
        
        return products;
      }
    }
  },
  
  async started() {
    this.logger.info("Categories service started");
  }
};
