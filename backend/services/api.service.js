const ApiGateway = require("moleculer-web");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerSpec = require("../swagger.config");

// Build allowed CORS origins from environment for flexibility in Docker/prod
const envOrigins = process.env.FRONTEND_ORIGINS
  ? process.env.FRONTEND_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];
const defaultOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);
const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));

module.exports = {
  name: "api",
  
  mixins: [ApiGateway],
  
  settings: {
    port: process.env.PORT || 3001,
    ip: "0.0.0.0",
    
    use: [],
    
    routes: [
      {
        path: "/",
        
        aliases: {
          "GET /": (req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              message: "TheGioiDiDong API Server",
              version: "1.0.0",
              documentation: "/docs",
              endpoints: {
                products: "/api/v1/products",
                categories: "/api/v1/categories",
                health: "/api/v1/health"
              }
            }));
          },
          "GET /docs": (req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>TheGioiDiDong API Documentation</title>
                <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
              </head>
              <body>
                <div id="swagger-ui"></div>
                <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
                <script>
                  SwaggerUIBundle({
                    url: '/api-docs.json',
                    dom_id: '#swagger-ui',
                    presets: [
                      SwaggerUIBundle.presets.apis,
                      SwaggerUIBundle.presets.standalone
                    ]
                  });
                </script>
              </body>
              </html>
            `);
          },
          "GET /api-docs.json": (req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(swaggerSpec));
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
          "orders.*",
          "chat.*",
          "location.*",
          "search.*"
        ],
        
        use: [
          cors({
            origin: (origin, callback) => {
              // Allow no-origin requests (like curl or server-to-server)
              if (!origin) return callback(null, true);
              if (allowedOrigins.includes(origin)) {
                return callback(null, true);
              }
              return callback(new Error(`Not allowed by CORS: ${origin}`));
            },
            credentials: process.env.CORS_CREDENTIALS === "true" || true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
          })
        ],
        
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
    
    // Initialize Socket.IO after server starts
    if (this.server) {
      const chatService = this.broker.getLocalService("chat");
      if (chatService) {
        chatService.initSocketIO(this.server);
      }
    }
  }
};
