#!/bin/bash
# Stop all services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Stopping all services..."

# Stop Backend API
if [ -f "$SCRIPT_DIR/backend-api.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/backend-api.pid")
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping Backend API (PID: $PID)..."
        kill $PID
        rm "$SCRIPT_DIR/backend-api.pid"
        echo "Backend API stopped"
    else
        rm "$SCRIPT_DIR/backend-api.pid"
    fi
fi

# Stop Frontend
if [ -f "$SCRIPT_DIR/frontend.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/frontend.pid")
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping Frontend (PID: $PID)..."
        kill $PID
        rm "$SCRIPT_DIR/frontend.pid"
        echo "Frontend stopped"
    else
        rm "$SCRIPT_DIR/frontend.pid"
    fi
fi

# Stop Auto-Processor
if [ -f "$SCRIPT_DIR/auto-processor.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/auto-processor.pid")
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping Auto-Processor (PID: $PID)..."
        kill $PID
        rm "$SCRIPT_DIR/auto-processor.pid"
        echo "Auto-Processor stopped"
    else
        rm "$SCRIPT_DIR/auto-processor.pid"
    fi
fi

# Kill by port as fallback
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "All services stopped"
