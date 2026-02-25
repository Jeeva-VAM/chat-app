# Chat App Backend Setup Script for Windows
Write-Host "🚀 Setting up Chat App Backend..." -ForegroundColor Green

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Install dependencies for all services
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "📦 Installing auth-service dependencies..." -ForegroundColor Yellow
Set-Location auth-service
npm install
Set-Location ..

Write-Host "📦 Installing user-service dependencies..." -ForegroundColor Yellow
Set-Location user-service
npm install
Set-Location ..

Write-Host "📦 Installing chat-service dependencies..." -ForegroundColor Yellow
Set-Location chat-service
npm install
Set-Location ..

Write-Host "📦 Installing media-service dependencies..." -ForegroundColor Yellow
Set-Location media-service
npm install
Set-Location ..

Write-Host "📦 Installing api-gateway dependencies..." -ForegroundColor Yellow
Set-Location api-gateway
npm install
Set-Location ..

Write-Host "✅ All dependencies installed" -ForegroundColor Green

# Create necessary directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path "uploads\temp" | Out-Null

# Generate encryption key if not exists
$envContent = Get-Content .env -Raw
if ($envContent -match "ENCRYPTION_KEY=your-32-character-encryption-key") {
    Write-Host "🔑 Generating encryption key..." -ForegroundColor Yellow
    $encryptionKey = -join ((1..64) | ForEach-Object {'{0:X}' -f (Get-Random -Max 16)})
    $encryptionKey = $encryptionKey.Substring(0, 64)
    $envContent = $envContent -replace "your-32-character-encryption-key", $encryptionKey
    Set-Content -Path .env -Value $envContent
    Write-Host "✅ Encryption key generated and updated in .env" -ForegroundColor Green
}

# Generate JWT secret if not exists
if ($envContent -match "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production") {
    Write-Host "🔑 Generating JWT secret..." -ForegroundColor Yellow
    $jwtSecret = -join ((1..128) | ForEach-Object {[char](Get-Random -Min 33 -Max 127)})
    $jwtSecret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($jwtSecret))
    $envContent = $envContent -replace "your-super-secret-jwt-key-change-this-in-production", $jwtSecret
    Set-Content -Path .env -Value $envContent
    Write-Host "✅ JWT secret generated and updated in .env" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Backend setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update Google OAuth credentials in .env file"
Write-Host "2. Update MongoDB Atlas connection strings (if using Atlas)"
Write-Host "3. Start infrastructure: docker-compose up -d mongodb redis zookeeper kafka"
Write-Host "4. Start services: npm run dev"
Write-Host ""
Write-Host "🔧 Development commands:" -ForegroundColor Cyan
Write-Host "  npm run dev                    # Start all services"
Write-Host "  npm run dev:auth              # Start auth service only"
Write-Host "  npm run dev:user              # Start user service only"
Write-Host "  npm run dev:chat              # Start chat service only"
Write-Host "  npm run dev:media             # Start media service only"
Write-Host "  npm run dev:gateway           # Start API gateway only"
Write-Host ""
Write-Host "🐳 Docker commands:" -ForegroundColor Cyan
Write-Host "  docker-compose up -d          # Start all services with Docker"
Write-Host "  docker-compose logs -f        # View logs"
Write-Host "  docker-compose down           # Stop all services"
Write-Host ""
Write-Host "🌐 Service URLs:" -ForegroundColor Cyan
Write-Host "  API Gateway:    http://localhost:3000"
Write-Host "  Auth Service:   http://localhost:3001"
Write-Host "  User Service:   http://localhost:3002"
Write-Host "  Chat Service:   http://localhost:3003"
Write-Host "  Media Service:  http://localhost:3004"
Write-Host ""
Write-Host "📖 API Documentation: http://localhost:3000/api" -ForegroundColor Yellow
Write-Host "🏥 Health Check:      http://localhost:3000/health" -ForegroundColor Yellow
