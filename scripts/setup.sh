#!/bin/bash

# TeamFlow Setup Script
# This script sets up the development environment for TeamFlow

set -e

echo "🚀 TeamFlow Setup Script"
echo "========================"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed"
    echo "Please install pnpm: npm install -g pnpm@8.14.0"
    exit 1
fi

echo "✅ pnpm is installed"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example"
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration"
else
    echo "✅ .env file exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Start Docker services
echo ""
echo "🐳 Starting Docker services (PostgreSQL + Redis)..."
cd infrastructure
docker-compose up -d
cd ..

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
pnpm --filter @teamflow/database db:generate

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
pnpm db:migrate

# Seed database (optional)
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    pnpm db:seed
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development servers, run:"
echo "  pnpm dev"
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:4000"
echo "API Documentation will be available at: http://localhost:4000/api-docs"
echo ""
echo "To open Prisma Studio (database GUI), run:"
echo "  pnpm db:studio"
echo ""
echo "Happy coding! 🎉"
