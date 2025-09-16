const admin = require('firebase-admin');
const { Errors } = require('moleculer');

// Initialize Firebase Admin SDK only if environment variables are available
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized || admin.apps.length > 0) return;
  
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn('Firebase environment variables not set. Firebase authentication will be disabled.');
    return;
  }

  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: "",
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
  }
}

module.exports = {
  name: "auth",
  
  settings: {
    defaultName: "auth"
  },
  
  actions: {
    /**
     * Verify Firebase ID token
     */
    verifyToken: {
      rest: "POST /firebase",
      params: {
        token: "string"
      },
      async handler(ctx) {
        const { token } = ctx.params;
        
        // Initialize Firebase if not already done
        initializeFirebase();
        
        if (!firebaseInitialized) {
          throw new Errors.MoleculerError("Firebase not configured", 500, "FIREBASE_NOT_CONFIGURED");
        }
        
        try {
          // Verify the Firebase token
          const decodedToken = await admin.auth().verifyIdToken(token);
          
          // Try to sync with users service
          let user = null;
          try {
            user = await ctx.call("users.syncFirebaseUser", {
              firebaseUser: decodedToken
            });
          } catch (error) {
            this.logger.warn("Failed to sync with users service, falling back to Firebase data:", error.message);
            // Fallback: return Firebase user data if users service is unavailable
            user = {
              id: null,
              firebase_uid: decodedToken.uid,
              email: decodedToken.email,
              name: decodedToken.name || null,
              picture: decodedToken.picture || null,
              email_verified: decodedToken.email_verified || false,
              provider: decodedToken.firebase?.sign_in_provider || 'password'
            };
          }
          
          return {
            success: true,
            user: user
          };
          
        } catch (error) {
          this.logger.error("Token verification failed:", error);
          throw new Errors.MoleculerError("Invalid token", 401, "INVALID_TOKEN");
        }
      }
    },
    
    /**
     * Create custom token for user
     */
    createCustomToken: {
      params: {
        uid: "string",
        additionalClaims: { type: "object", optional: true }
      },
      async handler(ctx) {
        try {
          const customToken = await admin.auth().createCustomToken(
            ctx.params.uid, 
            ctx.params.additionalClaims
          );
          return { customToken };
        } catch (error) {
          this.logger.error("Custom token creation failed:", error);
          throw new Error("Failed to create custom token");
        }
      }
    },
    
    /**
     * Get user by Firebase UID
     */
    getFirebaseUser: {
      params: {
        uid: "string"
      },
      async handler(ctx) {
        try {
          const userRecord = await admin.auth().getUser(ctx.params.uid);
          return userRecord;
        } catch (error) {
          this.logger.error("Failed to get Firebase user:", error);
          throw new Error("User not found");
        }
      }
    },
    
    /**
     * Update user claims
     */
    setCustomClaims: {
      params: {
        uid: "string",
        claims: "object"
      },
      async handler(ctx) {
        try {
          await admin.auth().setCustomUserClaims(ctx.params.uid, ctx.params.claims);
          return { success: true };
        } catch (error) {
          this.logger.error("Failed to set custom claims:", error);
          throw new Error("Failed to update user claims");
        }
      }
    },
    
    /**
     * Revoke refresh tokens for user
     */
    revokeRefreshTokens: {
      params: {
        uid: "string"
      },
      async handler(ctx) {
        try {
          await admin.auth().revokeRefreshTokens(ctx.params.uid);
          return { success: true };
        } catch (error) {
          this.logger.error("Failed to revoke refresh tokens:", error);
          throw new Error("Failed to revoke tokens");
        }
      }
    }
  },
  
  methods: {
    /**
     * Validate Firebase token middleware
     */
    async validateFirebaseToken(token) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
      } catch (error) {
        throw new Error("Invalid Firebase token");
      }
    }
  },
  
  started() {
    this.logger.info("Firebase Auth service started");
  }
};
