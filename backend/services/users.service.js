const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = {
  name: "users",
  
  mixins: [DbService],
  
  adapter: new SequelizeAdapter(sequelize),
  
  model: {
    name: "users",
    define: {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value) {
          if (value) {
            const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
            this.setDataValue('password', bcrypt.hashSync(value, rounds));
          }
        }
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'first_name'
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'last_name'
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: /^[+]?[\d\s\-()]+$/
        }
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
      },
      role: {
        type: DataTypes.ENUM('admin', 'user', 'moderator'),
        defaultValue: 'user'
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'email_verified'
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at'
      },
      facebookId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'facebook_id'
      },
      githubId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'github_id'
      },
      googleId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'google_id'
      },
      avatarUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'avatar_url'
      },
      authProvider: {
        type: DataTypes.STRING(50),
        defaultValue: 'local',
        field: 'auth_provider'
      }
    },
    options: {
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['email'] },
        { fields: ['role'] },
        { fields: ['is_active'] },
        { fields: ['email_verified'] }
      ]
    }
  },
  
  settings: {
    fields: [
      "id", 
      "email", 
      "firstName", 
      "lastName", 
      "phone",
      "isActive", 
      "role", 
      "emailVerified",
      "lastLoginAt",
      "facebookId",
      "githubId", 
      "googleId",
      "avatarUrl",
      "authProvider",
      "createdAt", 
      "updatedAt"
    ],
    
    scopes: {
      active: { isActive: true },
      admins: { role: 'admin' },
      verified: { emailVerified: true }
    },
    
    defaultScopes: ["active"]
  },
  
  actions: {
    register: {
      rest: "POST /register",
      params: {
        email: "email",
        password: { type: "string", min: 6, optional: true },
        firstName: "string",
        lastName: "string",
        phone: { type: "string", optional: true },
        authProvider: { type: "string", optional: true, default: "local" },
        facebookId: { type: "string", optional: true },
        githubId: { type: "string", optional: true },
        googleId: { type: "string", optional: true },
        avatarUrl: { type: "string", optional: true }
      },
      async handler(ctx) {
        const { email, password, firstName, lastName, phone } = ctx.params;
        
        // Check if user already exists
        const existingUser = await this.adapter.findOne({ email });
        if (existingUser) {
          throw new Error("User already exists with this email");
        }
        
        // Create new user
        const userData = {
          email,
          firstName,
          lastName,
          phone,
          authProvider: ctx.params.authProvider || 'local',
          facebookId: ctx.params.facebookId,
          githubId: ctx.params.githubId,
          googleId: ctx.params.googleId,
          avatarUrl: ctx.params.avatarUrl
        };
        
        if (password) {
          userData.password = password;
        }
        
        const user = await this.adapter.insert(userData);
        
        // Generate JWT token
        const token = this.generateToken(user);
        
        this.logger.info(`New user registered: ${email}`);
        
        return {
          user: this.transformDocuments(ctx, {}, user),
          token
        };
      }
    },
    
    login: {
      rest: "POST /login",
      params: {
        email: "email",
        password: "string"
      },
      async handler(ctx) {
        const { email, password } = ctx.params;
        
        // Find user (including inactive users for login attempt)
        const user = await this.adapter.findOne({ email }, { scope: false });
        if (!user) {
          throw new Error("Invalid credentials");
        }
        
        // Check if user is active
        if (!user.isActive) {
          throw new Error("Account is deactivated");
        }
        
        // Verify password
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }
        
        // Update last login
        await this.adapter.updateById(user.id, {
          lastLoginAt: new Date()
        });
        
        // Generate JWT token
        const token = this.generateToken(user);
        
        this.logger.info(`User logged in: ${email}`);
        
        return {
          user: this.transformDocuments(ctx, {}, user),
          token
        };
      }
    },
    
    me: {
      rest: "GET /me",
      auth: "required",
      async handler(ctx) {
        const userId = ctx.meta.user.id;
        const user = await this.adapter.findById(userId);
        
        if (!user) {
          throw new Error("User not found");
        }
        
        return this.transformDocuments(ctx, {}, user);
      }
    },
    
    verifyToken: {
      params: {
        token: "string"
      },
      async handler(ctx) {
        const { token } = ctx.params;
        
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await this.adapter.findById(decoded.id);
          
          if (!user || !user.isActive) {
            throw new Error("User not found or inactive");
          }
          
          return this.transformDocuments(ctx, {}, user);
        } catch (error) {
          throw new Error("Invalid or expired token");
        }
      }
    },
    
    changePassword: {
      rest: "PUT /change-password",
      auth: "required",
      params: {
        currentPassword: "string",
        newPassword: { type: "string", min: 6 }
      },
      async handler(ctx) {
        const { currentPassword, newPassword } = ctx.params;
        const userId = ctx.meta.user.id;
        
        const user = await this.adapter.findById(userId, { scope: false });
        if (!user) {
          throw new Error("User not found");
        }
        
        // Verify current password
        const isValid = bcrypt.compareSync(currentPassword, user.password);
        if (!isValid) {
          throw new Error("Current password is incorrect");
        }
        
        // Update password
        await this.adapter.updateById(userId, {
          password: newPassword
        });
        
        this.logger.info(`Password changed for user: ${user.email}`);
        
        return { message: "Password changed successfully" };
      }
    },
    
    updateProfile: {
      rest: "PUT /profile",
      auth: "required",
      params: {
        firstName: { type: "string", optional: true },
        lastName: { type: "string", optional: true },
        phone: { type: "string", optional: true }
      },
      async handler(ctx) {
        const userId = ctx.meta.user.id;
        const updateData = ctx.params;
        
        const user = await this.adapter.updateById(userId, updateData);
        
        this.logger.info(`Profile updated for user: ${ctx.meta.user.email}`);
        
        return this.transformDocuments(ctx, {}, user);
      }
    }
  },
  
  methods: {
    generateToken(user) {
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role
      };
      
      const options = {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      };
      
      return jwt.sign(payload, process.env.JWT_SECRET, options);
    },
    
    transformDocuments(ctx, params, docs) {
      // Remove password from response
      if (Array.isArray(docs)) {
        return docs.map(doc => {
          const { password, ...user } = doc.toJSON ? doc.toJSON() : doc;
          return user;
        });
      } else {
        const { password, ...user } = docs.toJSON ? docs.toJSON() : docs;
        return user;
      }
    }
  },
  
  async started() {
    this.logger.info("Users service started");
  }
};
