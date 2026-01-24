#!/bin/bash
set -e

# Root setup
echo "Setting up root venv..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Backend API
echo "Setting up Backend API..."
cd backend-api
npm install
if [ ! -f .env ]; then
    cp .env.example .env
fi
cd ..

# Minimal Frontend
echo "Setting up Frontend..."
cd minimal-frontend
npm install
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    # Ensure API URL is set
    if ! grep -q "NEXT_PUBLIC_API_URL" .env.local; then
        echo "NEXT_PUBLIC_API_URL=http://localhost:3001" >> .env.local
    fi
fi
cd ..

# STT Worker
echo "Setting up STT Worker..."
cd stt-worker
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
if [ ! -f .env ]; then
    cp .env.example .env
fi
deactivate
cd ..

echo "Setup complete."
