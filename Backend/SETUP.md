# Setup Instructions

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **Docker & Docker Compose** installed
3. **MongoDB Atlas** account
4. **Cloudinary** account  
5. **Google Cloud Console** account for OAuth

## 🚀 Quick Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd chat-app/Backend
cp .env.example .env
```

### 2. Configure Environment Variables
Edit `.env` file and replace placeholder values:

#### Required Secrets (⚠️ Keep these secure):
- `JWT_SECRET` - Strong random string for JWT tokens
- `SESSION_SECRET` - Strong random string for sessions  
- `ENCRYPTION_KEY` - Exactly 32 characters for AES-256
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `CLOUDINARY_SECRET` - From Cloudinary dashboard
- `MONGODB_URI_*` - Your MongoDB Atlas connection strings

#### Generate Secure Keys:
```bash
# JWT Secret (64 chars)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Encryption Key (32 chars hex)  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URIs:
   - `http://localhost:3001/api/auth/google/callback`
4. Add JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:3001` 
   - `http://localhost:5173`

### 4. Install Dependencies
```bash
npm run install:all
```

### 5. Start Services
```bash
# Option 1: All services with Docker
docker-compose up -d

# Option 2: Development mode
npm run dev

# Option 3: Individual services
npm run dev:auth      # Auth service
npm run dev:user      # User service  
npm run dev:chat      # Chat service
npm run dev:media     # Media service
npm run dev:gateway   # API Gateway
```

## 🔗 Service URLs

- **API Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3001  
- **User Service**: http://localhost:3002
- **Chat Service**: http://localhost:3003
- **Media Service**: http://localhost:3004

## 🏥 Health Check

Visit http://localhost:3000/health to verify all services are running.

## ⚠️ Security Notes

- Never commit `.env` files to Git
- Use strong, unique secrets in production
- Enable IP whitelisting in MongoDB Atlas
- Use HTTPS in production
- Regularly rotate secrets

## 📚 API Documentation

Visit http://localhost:3000/api for full API documentation.

## 🐛 Troubleshooting

### Common Issues:

1. **Port conflicts**: Change ports in `.env` file
2. **MongoDB connection**: Check Atlas connection string and IP whitelist
3. **Google OAuth errors**: Verify redirect URIs match exactly
4. **File upload issues**: Check Cloudinary credentials
