const ApiGateway = require("moleculer-web");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

module.exports = {
  name: "api",
  
  mixins: [ApiGateway],
  
  settings: {
    port: process.env.PORT || 3001,
    ip: "0.0.0.0",
    
    use: [
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
      }),
      cors({
        origin: process.env.CORS_ORIGIN || "*",
        credentials: process.env.CORS_CREDENTIALS === "true"
      }),
      rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: "Too many requests from this IP, please try again later."
      })
    ],
    
    routes: [
      {
        path: "/",
        
        aliases: {
          "GET /": (req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              message: "TheGioiDiDong API Server",
              version: "1.0.0",
              endpoints: {
                products: "/api/v1/products",
                categories: "/api/v1/categories",
                health: "/api/v1/health"
              }
            }));
          }
        }
      },
      {
        path: "/api/v1",
        
        whitelist: [
          "database.*",
          "users.*",
          "auth.*",
          "products.*",
          "categories.*",
          "product_tags.*",
          "orders.*"
        ],
        
        use: [],
        
        mergeParams: true,
        
        authentication: false,
        
        authorization: false,
        
        autoAliases: true,
        
        aliases: {
          "GET /health": (req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: "healthy",
              timestamp: new Date().toISOString(),
              uptime: process.uptime(),
              services: ["api", "auth", "products", "users", "categories"]
            }));
          },
          "POST /auth/register": "users.register",
          "POST /auth/login": "users.login",
          "POST /auth/firebase": "auth.verifyToken",
          "GET /auth/me": "users.me"
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
      
      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.slice(7);
        
        try {
          const user = await ctx.call("users.verifyToken", { token });
          return user;
        } catch (err) {
          this.logger.warn("Authentication failed:", err.message);
          return null;
        }
      }
      
      return null;
    },
    
    async authorize(ctx, route, req) {
      // Debug: Log the incoming request URL
      this.logger.info(`Authorization check for: ${req.method} ${req.url}`);
      
      // Skip authentication for public routes (without /api/v1 prefix)
      const publicRoutes = [
        "/health",
        "/auth/register", 
        "/auth/login",
        "/auth/firebase",
        "/products",
        "/products/new",
      ];
      
      if (publicRoutes.includes(req.url)) {
        this.logger.info(`Matched public route: ${req.url}`);
        return true;
      }
      
      // Check if user is authenticated
      if (!req.user) {
        throw new Error("Authentication required");
      }
      
      return true;
    }
  },
  
  started() {
    this.logger.info(`API Gateway started on port ${this.settings.port}`);
  }
};
