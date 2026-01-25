#!/bin/bash

# Start all services for the integrated Classroom Accessibility System

set -e

echo "🚀 Starting Integrated Classroom Accessibility System..."
echo ""

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:8765 | xargs kill -9 2>/dev/null || true

# Create logs directory
mkdir -p logs

echo ""
echo "Starting services..."
echo ""

# Start Backend API (Transcript System)
echo "1. Starting Backend API on port 3001..."
cd backend-api
npm run dev > ../logs/backend-api.log 2>&1 &
BACKEND_API_PID=$!
echo $BACKEND_API_PID > ../backend-api.pid
cd ..
echo "   ✓ Backend API started (PID: $BACKEND_API_PID)"

# Wait for backend API to be ready
sleep 3

# Start Frontend
echo "2. Starting Frontend on port 3000..."
cd minimal-frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
cd ..
echo "   ✓ Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
sleep 3

# Start Real-Time Recognition Backend
echo "3. Starting Real-Time Recognition Backend on port 8000..."
cd backend
PULSE_SOURCE="teams_monitor" ENABLE_AUDIO_RECORDING=true BACKEND_API_URL=http://localhost:3001 python main.py > ../logs/realtime-backend.log 2>&1 &
REALTIME_PID=$!
echo $REALTIME_PID > ../realtime-backend.pid
cd ..
echo "   ✓ Real-Time Backend started (PID: $REALTIME_PID)"

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📊 Service Status:"
echo "  - Backend API:      http://localhost:3001/health (PID: $BACKEND_API_PID)"
echo "  - Frontend:         http://localhost:3000 (PID: $FRONTEND_PID)"
echo "  - Real-Time Backend: http://localhost:8000 (PID: $REALTIME_PID)"
echo ""
echo "📝 Logs are available in the logs/ directory"
echo "   - Backend API:      logs/backend-api.log"
echo "   - Frontend:         logs/frontend.log"
echo "   - Real-Time:        logs/realtime-backend.log"
echo ""
echo "🛑 To stop all services, run: ./stop_integrated_system.sh"
echo ""
echo "💡 Don't forget to load the Extension in Chrome:"
echo "   1. Open chrome://extensions/"
echo "   2. Enable 'Developer mode'"
echo "   3. Click 'Load unpacked'"
echo "   4. Select the 'Extension' folder"
echo ""

# Keep script running and show logs
echo "Press Ctrl+C to stop all services..."
trap "echo ''; echo 'Stopping all services...'; kill $BACKEND_API_PID $FRONTEND_PID $REALTIME_PID 2>/dev/null; rm -f *.pid; echo 'All services stopped.'; exit 0" INT

# Follow the logs
tail -f logs/*.log
