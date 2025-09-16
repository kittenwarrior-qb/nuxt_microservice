# TheGioiDiDong - E-commerce Platform with Firebase Authentication

A modern e-commerce platform built with Nuxt.js frontend and Moleculer microservices backend, featuring Firebase authentication with multiple login providers.

## Features

- 🔐 **Firebase Authentication** with multiple providers (Google, Facebook, Email)
- 🏪 **Microservices Architecture** using Moleculer framework
- 🎨 **Modern UI** with Nuxt.js and Tailwind CSS
- 📱 **Responsive Design** for all devices
- 🔒 **Protected Routes** with middleware
- 🗄️ **PostgreSQL Database** with Sequelize ORM
- 📊 **State Management** with Pinia

## Tech Stack

### Backend
- **Framework**: Moleculer (Node.js microservices)
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: Firebase Admin SDK
- **API Gateway**: Moleculer Web
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: Nuxt.js 3 (Vue.js)
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Authentication**: Firebase SDK
- **TypeScript**: Full TypeScript support

## Setup Instructions

### Prerequisites
- Node.js 16+ 
- PostgreSQL database
- Firebase project with authentication enabled

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and update with your values:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=tgdd
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   ```

3. **Start the backend**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and update with your Firebase config:
   ```env
   # Firebase Configuration
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   
   # API Configuration
   API_BASE_URL=http://localhost:3000/api/v1
   ```

3. **Start the frontend**:
   ```bash
   npm run dev
   ```

### Firebase Setup

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com)

2. **Enable Authentication**:
   - Go to Authentication > Sign-in method
   - Enable Email/Password, Google, and Facebook providers
   - Configure OAuth redirect domains

3. **Generate Service Account Key**:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Use the credentials in your backend `.env` file

4. **Configure Web App**:
   - Go to Project Settings > General
   - Add a web app and copy the config
   - Use the config in your frontend `.env` file

## Project Structure

```
├── backend/
│   ├── services/
│   │   ├── api.service.js          # API Gateway
│   │   ├── auth.service.js         # Firebase Auth Service
│   │   ├── users.service.js        # User Management
│   │   └── ...
│   ├── config/
│   │   └── database.js             # Database Configuration
│   └── package.json
│
├── frontend/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.vue           # Login Page
│   │   │   └── register.vue        # Registration Page
│   │   ├── dashboard.vue           # Protected Dashboard
│   │   └── index.vue               # Landing Page
│   ├── stores/
│   │   └── auth.ts                 # Authentication Store
│   ├── middleware/
│   │   ├── auth.ts                 # Auth Middleware
│   │   └── guest.ts                # Guest Middleware
│   ├── plugins/
│   │   └── firebase.client.ts      # Firebase Configuration
│   └── package.json
```

## Authentication Flow

1. **User Registration/Login**:
   - Users can sign up/in with email/password, Google, or Facebook
   - Firebase handles authentication and returns ID token

2. **Backend Verification**:
   - Frontend sends Firebase ID token to backend
   - Backend verifies token with Firebase Admin SDK
   - User data is synced with local database

3. **Session Management**:
   - Frontend stores authentication state in Pinia store
   - Protected routes use auth middleware
   - Automatic token refresh handled by Firebase

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register with email/password
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/firebase` - Verify Firebase token
- `GET /api/v1/auth/me` - Get current user

### Protected Routes
All other API routes require authentication via Bearer token.

## Development

### Backend Development
```bash
cd backend
npm run dev  # Start with hot reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Start development server
```

### Database Migration
```bash
cd backend
npm run migrate  # Run database migrations
```

## Security Features

- **Firebase Authentication** with multiple providers
- **JWT Token Verification** on backend
- **Rate Limiting** to prevent abuse
- **CORS Protection** with configurable origins
- **Helmet Security Headers**
- **Input Validation** with Joi
- **Password Hashing** with bcrypt

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
