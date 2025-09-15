const { ServiceBroker } = require("moleculer");
const path = require("path");
require('dotenv').config();

// Create broker
const broker = new ServiceBroker({
  nodeID: process.env.NODE_ID || null,
  namespace: "thegioididong",
  
  logger: {
    type: "Console",
    options: {
      colors: true,
      moduleColors: false,
      formatter: "full"
    }
  },
  
  logLevel: process.env.LOGLEVEL || "info",
  
  transporter: process.env.TRANSPORTER || "TCP",
  cacher: process.env.CACHER || "Memory",
  
  serializer: "JSON",
  
  requestTimeout: 10 * 1000,
  retryPolicy: {
    enabled: false,
    retries: 5,
    delay: 100,
    maxDelay: 1000,
    factor: 2,
    check: err => err && !!err.retryable
  },
  
  maxCallLevel: 100,
  heartbeatInterval: 10,
  heartbeatTimeout: 30,
  
  tracking: {
    enabled: false,
    shutdownTimeout: 5000,
  },
  
  disableBalancer: false,
  
  registry: {
    strategy: "RoundRobin",
    preferLocal: true
  },
  
  circuitBreaker: {
    enabled: false,
    threshold: 0.5,
    minRequestCount: 20,
    windowTime: 60,
    halfOpenTime: 10 * 1000,
    check: err => err && err.code >= 500
  },
  
  bulkhead: {
    enabled: false,
    concurrency: 10,
    maxQueueSize: 100,
  },
  
  validator: true,
  
  metrics: {
    enabled: false,
    reporter: {
      type: "Prometheus",
      options: {
        port: 3030,
        endpoint: "/metrics",
      }
    }
  },
  
  tracing: {
    enabled: false,
    exporter: {
      type: "Console"
    }
  }
});

// Load services
broker.loadServices(path.join(__dirname, "services"), "**/*.service.js");

// Start broker
broker.start()
  .then(() => {
    broker.logger.info("✅ Moleculer broker started successfully");
    broker.logger.info(`🚀 API Gateway: http://localhost:${process.env.PORT || 3000}`);
  })
  .catch(err => {
    broker.logger.error("❌ Failed to start broker:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGINT", () => {
  broker.logger.info("🛑 Shutting down gracefully...");
  broker.stop()
    .then(() => {
      broker.logger.info("✅ Broker stopped successfully");
      process.exit(0);
    })
    .catch(err => {
      broker.logger.error("❌ Error during shutdown:", err);
      process.exit(1);
    });
});

process.on("SIGTERM", () => {
  broker.logger.info("🛑 Received SIGTERM, shutting down...");
  broker.stop()
    .then(() => {
      broker.logger.info("✅ Broker stopped successfully");
      process.exit(0);
    })
    .catch(err => {
      broker.logger.error("❌ Error during shutdown:", err);
      process.exit(1);
    });
});

module.exports = broker;
