# TheGioiDiDong - E-commerce Platform

A modern e-commerce platform built with Nuxt 4 (frontend) and Moleculer.js microservices (backend).

## 🏗️ Architecture

- **Frontend**: Nuxt 4 with TypeScript, Tailwind CSS, Pinia
- **Backend**: Moleculer.js microservices with PostgreSQL
- **Authentication**: Firebase Auth
- **Database**: PostgreSQL with Sequelize ORM
- **Cache**: Redis
- **Message Broker**: NATS
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/your-username/thegioididong.git
cd thegioididong
```

### 2. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### 3. Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PgAdmin**: http://localhost:5050 (optional, use profile: tools)

## 🛠️ Development

### Local Development

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker Development

```bash
# Run with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Run only database services
docker-compose up postgres redis nats

# Run with tools (PgAdmin)
docker-compose --profile tools up
```

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL password | `your_secure_password` |
| `JWT_SECRET` | JWT signing secret | `your-32-char-secret` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `your-project-id` |
| `FIREBASE_API_KEY` | Firebase API key | `your-api-key` |

See `.env.example` for complete list.

## 🚀 Deployment

### Production Deployment

1. **Prepare environment**:
   ```bash
   cp .env.example .env
   # Fill in production values
   ```

2. **Deploy with Docker Compose**:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### CI/CD with GitHub Actions

The project includes automated CI/CD pipeline:

- **On Push**: Runs tests and builds Docker images
- **On Main Branch**: Deploys to production
- **Docker Images**: Pushed to GitHub Container Registry

#### Setup CI/CD

1. **Enable GitHub Actions** in your repository
2. **Set up secrets** (if deploying to server):
   - `HOST`: Server IP address
   - `USERNAME`: SSH username
   - `SSH_KEY`: Private SSH key

## 📁 Project Structure

```
thegioididong/
├── frontend/                 # Nuxt 4 frontend
│   ├── app/                 # Nuxt 4 app directory
│   ├── components/          # Vue components
│   ├── pages/              # Route pages
│   ├── stores/             # Pinia stores
│   ├── middleware/         # Route middleware
│   └── Dockerfile          # Frontend container
├── backend/                # Moleculer.js backend
│   ├── services/           # Microservices
│   ├── api/               # API gateway
│   ├── config/            # Configuration
│   └── Dockerfile         # Backend container
├── docker-compose.yml     # Production compose
├── .github/workflows/     # CI/CD pipelines
└── README.md
```

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests with Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📊 Monitoring

- **Health Checks**: Built-in health endpoints
- **Logs**: Centralized logging with Docker
- **Metrics**: Moleculer built-in metrics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- Create an issue for bug reports
- Check existing issues before creating new ones
- Provide detailed information for faster resolution
