#!/bin/bash

# Stop all services for the integrated Classroom Accessibility System

echo "🛑 Stopping Integrated Classroom Accessibility System..."
echo ""

# Function to stop a service
stop_service() {
    local name=$1
    local pidfile=$2
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $name (PID: $pid)..."
            kill $pid 2>/dev/null || true
            sleep 1
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null || true
            fi
            echo "   ✓ $name stopped"
        else
            echo "   ℹ $name not running"
        fi
        rm -f "$pidfile"
    else
        echo "   ℹ No PID file for $name"
    fi
}

# Stop all services
stop_service "Backend API" "backend-api.pid"
stop_service "Frontend" "frontend.pid"
stop_service "Real-Time Backend" "realtime-backend.pid"

# Kill any remaining processes on our ports
echo ""
echo "Cleaning up any remaining processes on ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:8765 | xargs kill -9 2>/dev/null || true

echo ""
echo "✅ All services stopped successfully!"
echo ""
