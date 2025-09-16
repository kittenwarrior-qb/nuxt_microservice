# 🚀 Hướng dẫn Deploy TheGioiDiDong với Docker và Vercel

## 📋 Yêu cầu
- Docker Desktop
- Node.js 18+
- Vercel CLI
- Git

## 🐳 Chạy với Docker

### 1. Chạy Backend với Docker

```bash
# Di chuyển vào thư mục backend
cd backend

# Build Docker image
docker build -t thegioididong-backend .

# Chạy container đơn lẻ
docker run -p 3001:3001 -e NODE_ENV=development thegioididong-backend

# HOẶC chạy với docker-compose (bao gồm database)
docker-compose up -d
```

### 2. Kiểm tra Backend
- API: http://localhost:3001
- Swagger Docs: http://localhost:3001/docs
- Health Check: http://localhost:3001/api/v1/health

### 3. Chạy Frontend (Development)
```bash
cd frontend
npm install
npm run dev
```

## ☁️ Deploy lên Vercel

### Backend Deploy

#### Bước 1: Cài đặt Vercel CLI
```bash
npm i -g vercel
```

#### Bước 2: Login Vercel
```bash
vercel login
```

#### Bước 3: Deploy Backend
```bash
cd backend
vercel --prod
```

#### Bước 4: Cấu hình Environment Variables trên Vercel
Vào Vercel Dashboard > Project Settings > Environment Variables:

```
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret-here
FIREBASE_PROJECT_ID=multiple-authentication-97210
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY=your-firebase-private-key
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=thegioididong_db
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Frontend Deploy

#### Bước 1: Cập nhật API URL
Trong `frontend/nuxt.config.ts`:
```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.NODE_ENV === 'production' 
        ? 'https://your-backend.vercel.app' 
        : 'http://localhost:3001'
    }
  }
})
```

#### Bước 2: Deploy Frontend
```bash
cd frontend
vercel --prod
```

## 🔧 Cấu hình Database

### Sử dụng Vercel Postgres (Khuyến nghị)
1. Vào Vercel Dashboard
2. Tạo Postgres Database
3. Copy connection string vào environment variables

### Hoặc sử dụng External Database
- Neon.tech (Free tier)
- PlanetScale
- Railway
- Supabase

## 📝 Scripts hữu ích

### Docker Commands
```bash
# Xem logs
docker-compose logs -f app

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Rebuild và restart
docker-compose up --build -d
```

### Vercel Commands
```bash
# Deploy preview
vercel

# Deploy production
vercel --prod

# Xem logs
vercel logs

# Xem domains
vercel domains
```

## 🔍 Troubleshooting

### Lỗi CORS
- Kiểm tra `CORS_ORIGIN` environment variable
- Đảm bảo frontend URL được thêm vào CORS config

### Lỗi Database Connection
- Kiểm tra database credentials
- Đảm bảo database accessible từ Vercel

### Lỗi Firebase Auth
- Kiểm tra Firebase service account credentials
- Đảm bảo Firebase project ID đúng

## 🌐 URLs sau khi deploy

### Production URLs
- Backend API: `https://your-backend.vercel.app`
- Frontend: `https://your-frontend.vercel.app`
- API Docs: `https://your-backend.vercel.app/docs`

### Development URLs
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:3000`

## 📊 Monitoring

### Vercel Analytics
- Tự động enabled cho production deployments
- Xem performance metrics trong Vercel dashboard

### Health Checks
- Backend health: `/api/v1/health`
- Swagger docs: `/docs`

## 🔐 Security Notes

1. **Environment Variables**: Không commit `.env` files
2. **JWT Secret**: Sử dụng strong random string cho production
3. **Firebase Keys**: Giữ private keys an toàn
4. **CORS**: Chỉ allow trusted domains
5. **Rate Limiting**: Đã configured trong API gateway

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs: `vercel logs`
2. Kiểm tra environment variables
3. Test local trước khi deploy
4. Kiểm tra network connectivity
