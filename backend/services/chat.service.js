const { Server } = require("socket.io");
const cookie = require("cookie");

module.exports = {
  name: "chat",
  
  settings: {
    // In-memory message storage (consider using Redis for production)
    messages: []
  },
  
  actions: {
    /**
     * Get chat messages
     */
    getMessages: {
      rest: "GET /messages",
      handler(ctx) {
        return this.settings.messages;
      }
    },
    
    /**
     * Add a new message
     */
    addMessage: {
      params: {
        user: "string",
        text: "string"
      },
      handler(ctx) {
        const message = {
          id: Date.now(),
          user: ctx.params.user,
          text: ctx.params.text,
          timestamp: new Date().toISOString()
        };
        
        this.settings.messages.push(message);
        
        // Keep only last 100 messages
        if (this.settings.messages.length > 100) {
          this.settings.messages = this.settings.messages.slice(-100);
        }
        
        return message;
      }
    },
    
    /**
     * Clear all messages
     */
    clearMessages: {
      rest: "DELETE /messages",
      handler(ctx) {
        this.settings.messages = [];
        return { success: true };
      }
    }
  },
  
  methods: {
    /**
     * Initialize Socket.IO server
     */
    initSocketIO(server) {
      // Get allowed origins from environment variables
      const envOrigins = process.env.FRONTEND_ORIGINS ? 
        process.env.FRONTEND_ORIGINS.split(',').map(origin => origin.trim()) : [];
      
      const defaultOrigins = [
        process.env.FRONTEND_URL || "http://localhost:3000",
        process.env.CORS_ORIGIN || "http://localhost:3000"
      ];
      
      // Development fallbacks (only in development)
      const devOrigins = process.env.NODE_ENV === 'development' ? [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost",
        "*"
      ] : [];
      
      const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins, ...devOrigins])];
      
      this.io = new Server(server, {
        cors: {
          origin: true,
          credentials: true
        },
        path: "/socket.io/",
        transports: ["websocket", "polling"],
        allowEIO3: true
      });
      
      this.io.on("connection", (socket) => {
        this.logger.info(`Socket connected: ${socket.id}`);
        
        // Parse cookies to determine user role
        const cookies = socket.handshake.headers.cookie || "";
        const parsedCookies = cookie.parse(cookies);
        const role = parsedCookies.admin === "true" ? "admin" : "user";
        
        socket.role = role;
        
        // Send existing messages to new connection
        socket.emit("load_messages", this.settings.messages);
        
        // Handle new messages
        socket.on("send_message", async (data) => {
          try {
            if (!data.text || !data.text.trim()) {
              return;
            }
            
            // Add message to storage
            const message = await this.broker.call("chat.addMessage", {
              user: role,
              text: data.text.trim()
            });
            
            // Broadcast to all connected clients
            this.io.emit("receive_message", {
              user: message.user,
              text: message.text,
              timestamp: message.timestamp
            });
            
            this.logger.info(`Message from ${role}: ${data.text}`);
          } catch (error) {
            this.logger.error("Error handling message:", error);
            socket.emit("error", { message: "Failed to send message" });
          }
        });
        
        // Handle typing indicators
        socket.on("typing", (data) => {
          socket.broadcast.emit("user_typing", {
            user: role,
            isTyping: data.isTyping
          });
        });
        
        // Handle disconnect
        socket.on("disconnect", () => {
          this.logger.info(`Socket disconnected: ${socket.id}`);
        });
      });
      
      this.logger.info("Socket.IO server initialized");
    },
    
    /**
     * Get Socket.IO instance
     */
    getSocketIO() {
      return this.io;
    }
  },
  
  started() {
    this.logger.info("Chat service started");
  },
  
  stopped() {
    if (this.io) {
      this.io.close();
      this.logger.info("Socket.IO server closed");
    }
  }
};
