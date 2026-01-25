#!/bin/bash
cd "$(dirname "$0")"

echo "Cleaning up existing backend processes..."
# Kill any existing processes on port 8765 (WebSocket)
lsof -ti:8765 2>/dev/null | xargs -r kill -9 2>/dev/null
# Kill any existing processes on port 8000 (HTTP)
lsof -ti:8000 2>/dev/null | xargs -r kill -9 2>/dev/null

# Small delay to ensure ports are released
sleep 0.5

echo "Starting backend..."
source venv/bin/activate
cd backend
python main.py
