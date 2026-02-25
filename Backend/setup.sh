#!/bin/bash

# Chat App Backend Setup Script
echo "🚀 Setting up Chat App Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies for all services
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing auth-service dependencies..."
cd auth-service && npm install && cd ..

echo "📦 Installing user-service dependencies..."
cd user-service && npm install && cd ..

echo "📦 Installing chat-service dependencies..."
cd chat-service && npm install && cd ..

echo "📦 Installing media-service dependencies..."
cd media-service && npm install && cd ..

echo "📦 Installing api-gateway dependencies..."
cd api-gateway && npm install && cd ..

echo "✅ All dependencies installed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads/temp

# Generate encryption key if not exists
if ! grep -q "ENCRYPTION_KEY=your-32-character-encryption-key" .env; then
    echo "🔑 Generating encryption key..."
    ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    sed -i "s/your-32-character-encryption-key/$ENCRYPTION_KEY/" .env
    echo "✅ Encryption key generated and updated in .env"
fi

# Generate JWT secret if not exists
if ! grep -q "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production" .env; then
    echo "🔑 Generating JWT secret..."
    JWT_SECRET=$(openssl rand -base64 64 2>/dev/null || node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")
    sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
    echo "✅ JWT secret generated and updated in .env"
fi

echo ""
echo "🎉 Backend setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update Google OAuth credentials in .env file"
echo "2. Update MongoDB Atlas connection strings (if using Atlas)"
echo "3. Start infrastructure: docker-compose up -d mongodb redis zookeeper kafka"
echo "4. Start services: npm run dev"
echo ""
echo "🔧 Development commands:"
echo "  npm run dev                    # Start all services"
echo "  npm run dev:auth              # Start auth service only"
echo "  npm run dev:user              # Start user service only"
echo "  npm run dev:chat              # Start chat service only"
echo "  npm run dev:media             # Start media service only"
echo "  npm run dev:gateway           # Start API gateway only"
echo ""
echo "🐳 Docker commands:"
echo "  docker-compose up -d          # Start all services with Docker"
echo "  docker-compose logs -f        # View logs"
echo "  docker-compose down           # Stop all services"
echo ""
echo "🌐 Service URLs:"
echo "  API Gateway:    http://localhost:3000"
echo "  Auth Service:   http://localhost:3001"
echo "  User Service:   http://localhost:3002"
echo "  Chat Service:   http://localhost:3003"
echo "  Media Service:  http://localhost:3004"
echo ""
echo "📖 API Documentation: http://localhost:3000/api"
echo "🏥 Health Check:      http://localhost:3000/health"
