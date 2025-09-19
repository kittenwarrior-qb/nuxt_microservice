const { ServiceBroker } = require("moleculer");
const path = require("path");

// Create broker for serverless
const broker = new ServiceBroker({
  nodeID: "vercel-serverless",
  namespace: "thegioididong",
  
  logger: {
    type: "Console",
    options: {
      colors: false,
      moduleColors: false,
      formatter: "short"
    }
  },
  
  logLevel: "warn",
  
  transporter: null, 
  cacher: "Memory",
  
  serializer: "JSON",
  
  requestTimeout: 5 * 1000, 
  retryPolicy: {
    enabled: false
  },
  
  maxCallLevel: 10,
  heartbeatInterval: 0, // Disable heartbeat
  heartbeatTimeout: 0,
  
  tracking: {
    enabled: false
  },
  
  disableBalancer: true, // Single instance
  
  registry: {
    strategy: "RoundRobin",
    preferLocal: true
  },
  
  circuitBreaker: {
    enabled: false
  },
  
  bulkhead: {
    enabled: false
  },
  
  validator: true,
  
  metrics: {
    enabled: false
  },
  
  tracing: {
    enabled: false
  }
});

// Load services
broker.loadService(path.join(__dirname, "..", "services", "api.service.js"));
broker.loadService(path.join(__dirname, "..", "services", "auth.service.js"));
broker.loadService(path.join(__dirname, "..", "services", "products.service.js"));
broker.loadService(path.join(__dirname, "..", "services", "users.service.js"));
broker.loadService(path.join(__dirname, "..", "services", "categories.service.js"));

let isStarted = false;

module.exports = async (req, res) => {
  try {
    // Start broker only once
    if (!isStarted) {
      await broker.start();
      isStarted = true;
    }

    // Get the API service
    const apiService = broker.getLocalService("api");
    
    if (!apiService || !apiService.server) {
      throw new Error("API service not found or not started");
    }

    // Handle the request through the API service
    apiService.server(req, res);
    
  } catch (error) {
    console.error("Serverless function error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message
    });
  }
};
