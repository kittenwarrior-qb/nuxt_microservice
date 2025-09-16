const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const { DataTypes, Op } = require("sequelize");
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
      tableName: "products"
    }
  },

  settings: {
    fields: [
      "id",
      "name",
      "price",
      "price_old",
      "percent",
      "brand",
      "category",
      "img",
      "rating",
      "flash_sale_count",
      "sold",
      "is_flash_sale",
      "is_new",
      "is_loan",
      "is_online",
      "is_upcoming",
      "link",
      "createdAt",
      "updatedAt"
    ],

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
      // Avoid returning cached data across different filters
      cache: false,
      params: {
        page: { type: "number", optional: true, default: 1, convert: true },
        pageSize: { type: "number", optional: true, default: 12, convert: true },
        category: { type: "string", optional: true },
        brand: { type: "string", optional: true },
        is_flash_sale: { type: "boolean", optional: true, convert: true },
        is_new: { type: "boolean", optional: true, convert: true },
        withMeta: { type: "boolean", optional: true, convert: true, default: false }
      },
      async handler(ctx) {
        const { page, pageSize, category, brand, is_flash_sale, is_new, withMeta } = ctx.params;

        try {
          // Essential field filters - always applied
          let whereConditions = [
            "name IS NOT NULL AND TRIM(name) != '' AND name != 'null'",
            "price IS NOT NULL AND TRIM(price) != '' AND price != 'null' AND price != '0'",
            "category IS NOT NULL AND TRIM(category) != '' AND category != 'null'",
            "brand IS NOT NULL AND TRIM(brand) != '' AND brand != 'null'",
            "img IS NOT NULL AND TRIM(img) != '' AND img != 'null'"
          ];
          
          const replacements = {};
          let decodedCategory;

          // Optional filters: robust matching (case-insensitive, trim, and partial)
          if (category) {
            decodedCategory = decodeURIComponent(category);
            // Try exact first, but also allow partial match to be tolerant to minor variations
            whereConditions.push("(LOWER(TRIM(category)) = LOWER(TRIM(:category)) OR LOWER(category) LIKE LOWER(:category_like))");
            replacements.category = decodedCategory;
            replacements.category_like = `%${decodedCategory}%`;
          }

          if (brand) {
            const decodedBrand = decodeURIComponent(brand);
            whereConditions.push("(LOWER(TRIM(brand)) = LOWER(TRIM(:brand)) OR LOWER(brand) LIKE LOWER(:brand_like))");
            replacements.brand = decodedBrand;
            replacements.brand_like = `%${decodedBrand}%`;
          }

          if (is_flash_sale !== undefined) {
            whereConditions.push("is_flash_sale = :is_flash_sale");
            replacements.is_flash_sale = is_flash_sale;
          }

          if (is_new !== undefined) {
            whereConditions.push("is_new = :is_new");
            replacements.is_new = is_new;
          }

          const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

          // Count total matching records
          const countSql = `
            SELECT COUNT(*)::int AS count
            FROM products
            ${whereClause}
          `;

          // Light diagnostics to ensure filters are applied correctly
          this.logger.info("products.list params:", { page, pageSize, category: decodedCategory || null, brand: brand || null, is_flash_sale, is_new });
          this.logger.info("products.list where:", whereClause);
          const countResult = await sequelize.query(countSql, {
            replacements,
            type: sequelize.QueryTypes.SELECT
          });
          const total = Array.isArray(countResult) && countResult.length > 0 ? countResult[0].count : 0;

          const offset = (page - 1) * pageSize;
          const sqlQuery = `
            SELECT * FROM products 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
          `;

          replacements.limit = pageSize;
          replacements.offset = offset;


          this.logger.info("products.list SQL:", sqlQuery);
          this.logger.info("products.list replacements:", replacements);
          const products = await sequelize.query(sqlQuery, {
            replacements,
            type: sequelize.QueryTypes.SELECT
          });

          // Attach tags from product_tags (batch load)
          const ids = products.map(p => p.id);
          if (ids.length > 0) {
            const tagRows = await sequelize.query(
              `SELECT product_id, tag FROM product_tags WHERE product_id IN (:ids) ORDER BY product_id`,
              {
                replacements: { ids },
                type: sequelize.QueryTypes.SELECT
              }
            );
            const tagMap = {};
            for (const row of tagRows) {
              if (!tagMap[row.product_id]) tagMap[row.product_id] = [];
              tagMap[row.product_id].push(row.tag);
            }
            for (let product of products) {
              product.tags = tagMap[product.id] || [];
            }
          } else {
            for (let product of products) product.tags = [];
          }

          if (!ctx.meta.$responseHeaders) ctx.meta.$responseHeaders = {};
          ctx.meta.$responseHeaders["X-Total-Count"] = String(total);
          ctx.meta.$responseHeaders["Cache-Control"] = "no-store";
          if (decodedCategory)
            ctx.meta.$responseHeaders["X-Resolved-Category"] = encodeURIComponent(decodedCategory);
          if (brand)
            ctx.meta.$responseHeaders["X-Resolved-Brand"] = brand;

          // Return format based on withMeta parameter
          if (!withMeta) {
            return products;
          }

          return { 
            items: products, 
            total, 
            page, 
            pageSize, 
            filters: { 
              category: decodedCategory || null, 
              brand: brand || null 
            } 
          };
        } catch (error) {
          this.logger.error("Error in products.list:", error);
          throw error;
        }
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

        // Attach tags for single product
        const tagRows = await sequelize.query(
          `SELECT tag FROM product_tags WHERE product_id = :id ORDER BY tag`,
          {
            replacements: { id },
            type: sequelize.QueryTypes.SELECT
          }
        );
        product.tags = tagRows.map(r => r.tag);

        return product;
      }
    },

    search: {
      rest: "GET /search",
      params: {
        q: "string",
        page: { type: "number", optional: true, default: 1, convert: true },
        pageSize: { type: "number", optional: true, default: 10, convert: true }
      },
      async handler(ctx) {
        const { q, page, pageSize } = ctx.params;

        const products = await this.adapter.find({
          query: {
            name: { [Op.iLike]: `%${q}%` }
          },
          offset: (page - 1) * pageSize,
          limit: pageSize,
          sort: "-created_at"
        });

        // Attach tags from product_tags (batch load)
        const ids = products.map(p => p.id);
        if (ids.length > 0) {
          const tagRows = await sequelize.query(
            `SELECT product_id, tag FROM product_tags WHERE product_id IN (:ids) ORDER BY product_id`,
            {
              replacements: { ids },
              type: sequelize.QueryTypes.SELECT
            }
          );
          const tagMap = {};
          for (const row of tagRows) {
            if (!tagMap[row.product_id]) tagMap[row.product_id] = [];
            tagMap[row.product_id].push(row.tag);
          }
          for (let product of products) {
            product.tags = tagMap[product.id] || [];
          }
        } else {
          for (let product of products) product.tags = [];
        }

        return products;
      }
    },

    flashSale: {
      rest: "GET /flash-sale",
      params: {
        page: { type: "number", optional: true, default: 1, convert: true },
        pageSize: { type: "number", optional: true, default: 10, convert: true }
      },
      async handler(ctx) {
        const { page, pageSize } = ctx.params;

        const products = await this.adapter.find({
          query: { is_flash_sale: true },
          offset: (page - 1) * pageSize,
          limit: pageSize,
          sort: "-created_at"
        });

        // Add empty tags array to each product for now
        for (let product of products) {
          product.tags = [];
        }

        return products;
      }
    },

    newProducts: {
      rest: "GET /new",
      params: {
        page: { type: "number", optional: true, default: 1, convert: true },
        pageSize: { type: "number", optional: true, default: 10, convert: true }
      },
      async handler(ctx) {
        const { page, pageSize } = ctx.params;

        const products = await this.adapter.find({
          query: { is_new: true },
          offset: (page - 1) * pageSize,
          limit: pageSize,
          sort: "-created_at"
        });

        // Add empty tags array to each product for now
        for (let product of products) {
          product.tags = [];
        }

        return products;
      }
    },

    categories: {
      rest: "GET /categories",
      async handler(ctx) {
        const products = await this.adapter.find({
          query: {},
          fields: ["category"]
        });

        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
        return { categories };
      }
    }
  },

  async started() {
    this.logger.info("Products service started");
  }
};
