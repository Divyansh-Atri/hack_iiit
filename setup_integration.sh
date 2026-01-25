#!/bin/bash

# Classroom Accessibility System - Integration Setup Script
# This script sets up and integrates the backend API with the frontend and extension

set -e  # Exit on error

echo "🚀 Starting Classroom Accessibility System Integration..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "backend-api" ] || [ ! -d "minimal-frontend" ] || [ ! -d "Extension" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo -e "${BLUE}Step 1: Installing Backend API Dependencies${NC}"
cd backend-api
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
else
    echo "✓ Dependencies already installed"
fi
cd ..

echo ""
echo -e "${BLUE}Step 2: Installing Frontend Dependencies${NC}"
cd minimal-frontend
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
else
    echo "✓ Dependencies already installed"
fi
cd ..

echo ""
echo -e "${BLUE}Step 3: Checking Environment Files${NC}"

# Check backend-api .env
if [ ! -f "backend-api/.env" ]; then
    echo "⚠️  Creating backend-api/.env from .env.example"
    cp backend-api/.env.example backend-api/.env
    echo "✓ Created backend-api/.env"
else
    echo "✓ backend-api/.env exists"
fi

# Check frontend .env.local
if [ ! -f "minimal-frontend/.env.local" ]; then
    echo "⚠️  Creating minimal-frontend/.env.local"
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > minimal-frontend/.env.local
    echo "✓ Created minimal-frontend/.env.local"
else
    echo "✓ minimal-frontend/.env.local exists"
fi

echo ""
echo -e "${GREEN}✅ Integration setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "To run the complete system, you need to start three services:"
echo ""
echo "1. Backend API (Transcript System):"
echo "   cd backend-api && npm run dev"
echo ""
echo "2. Frontend (Student Access):"
echo "   cd minimal-frontend && npm run dev"
echo ""
echo "3. Real-Time Recognition Backend:"
echo "   cd backend && ENABLE_AUDIO_RECORDING=true BACKEND_API_URL=http://localhost:3001 python main.py"
echo ""
echo "4. Load the Extension in Chrome:"
echo "   - Open chrome://extensions/"
echo "   - Enable 'Developer mode'"
echo "   - Click 'Load unpacked'"
echo "   - Select the 'Extension' folder"
echo ""
echo -e "${YELLOW}Quick Start (All Services):${NC}"
echo "Run: ./start_integrated_system.sh"
echo ""
echo -e "${BLUE}Access Points:${NC}"
echo "  - Backend API: http://localhost:3001/health"
echo "  - Frontend: http://localhost:3000"
echo "  - Real-Time Backend: http://localhost:8000"
echo "  - Extension: Load in Chrome from Extension folder"
echo ""
