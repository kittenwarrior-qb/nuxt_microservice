const admin = require('firebase-admin');
const { Errors } = require('moleculer');

let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized || admin.apps.length > 0) return;

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.warn('⚠️ Firebase environment variables not set. Firebase authentication will be disabled.');
    return;
  }

  try {
    // Làm sạch key trước khi dùng (chống lỗi xuống dòng + dấu ngoặc kép)
    const cleanedKey = process.env.FIREBASE_PRIVATE_KEY
      .replace(/\\n/g, '\n')
      .replace(/^"|"$/g, '') // bỏ ngoặc kép đầu/cuối nếu có
      .trim();

    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: '',
      private_key: cleanedKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  }
}

module.exports = {
  name: 'auth',

  settings: {
    defaultName: 'auth',
  },

  actions: {
    verifyToken: {
      rest: 'POST /firebase',
      params: {
        token: 'string',
      },
      async handler(ctx) {
        const { token } = ctx.params;
        initializeFirebase();

        if (!firebaseInitialized) {
          throw new Errors.MoleculerError('Firebase not configured', 500, 'FIREBASE_NOT_CONFIGURED');
        }

        try {
          const decodedToken = await admin.auth().verifyIdToken(token);

          let user = null;
          try {
            user = await ctx.call('users.syncFirebaseUser', {
              firebaseUser: decodedToken,
            });
          } catch (error) {
            this.logger.warn('Failed to sync with users service:', error.message);
            user = {
              id: null,
              firebase_uid: decodedToken.uid,
              email: decodedToken.email,
              name: decodedToken.name || null,
              picture: decodedToken.picture || null,
              email_verified: decodedToken.email_verified || false,
              provider: decodedToken.firebase?.sign_in_provider || 'password',
            };
          }

          return { success: true, user };
        } catch (error) {
          this.logger.error('Token verification failed:', error);
          throw new Errors.MoleculerError('Invalid token', 401, 'INVALID_TOKEN');
        }
      },
    },

    createCustomToken: {
      params: {
        uid: 'string',
        additionalClaims: { type: 'object', optional: true },
      },
      async handler(ctx) {
        try {
          const customToken = await admin
            .auth()
            .createCustomToken(ctx.params.uid, ctx.params.additionalClaims);
          return { customToken };
        } catch (error) {
          this.logger.error('Custom token creation failed:', error);
          throw new Error('Failed to create custom token');
        }
      },
    },

    getFirebaseUser: {
      params: { uid: 'string' },
      async handler(ctx) {
        try {
          return await admin.auth().getUser(ctx.params.uid);
        } catch (error) {
          this.logger.error('Failed to get Firebase user:', error);
          throw new Error('User not found');
        }
      },
    },

    setCustomClaims: {
      params: { uid: 'string', claims: 'object' },
      async handler(ctx) {
        try {
          await admin.auth().setCustomUserClaims(ctx.params.uid, ctx.params.claims);
          return { success: true };
        } catch (error) {
          this.logger.error('Failed to set custom claims:', error);
          throw new Error('Failed to update user claims');
        }
      },
    },

    revokeRefreshTokens: {
      params: { uid: 'string' },
      async handler(ctx) {
        try {
          await admin.auth().revokeRefreshTokens(ctx.params.uid);
          return { success: true };
        } catch (error) {
          this.logger.error('Failed to revoke refresh tokens:', error);
          throw new Error('Failed to revoke tokens');
        }
      },
    },
  },

  methods: {
    async validateFirebaseToken(token) {
      try {
        return await admin.auth().verifyIdToken(token);
      } catch {
        throw new Error('Invalid Firebase token');
      }
    },
  },

  started() {
    this.logger.info('🔥 Firebase Auth service started');
  },
};
