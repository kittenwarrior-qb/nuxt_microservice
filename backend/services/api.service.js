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
        path: "/api/v1",
        
        whitelist: [
          "database.healthCheck",
          "users.*",
          "products.*",
          "categories.*",
          "orders.*"
        ],
        
        use: [],
        
        mergeParams: true,
        
        authentication: true,
        
        authorization: true,
        
        autoAliases: true,
        
        aliases: {
          "GET /health": "database.healthCheck",
          "POST /auth/register": "users.register",
          "POST /auth/login": "users.login",
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
      // Skip authentication for public routes
      const publicRoutes = [
        "/api/v1/health",
        "/api/v1/auth/register",
        "/api/v1/auth/login"
      ];
      
      if (publicRoutes.includes(req.url)) {
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
