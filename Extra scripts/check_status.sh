#!/bin/bash
# Check status of backend servers

echo "Teams Speaker Recognition - Status Check"
echo "=========================================="
echo ""

# Check if backend is running
if [ -f backend.pid ]; then
    PID=$(cat backend.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "✓ Backend process running (PID: $PID)"
    else
        echo "✗ Backend process not running (stale PID file)"
    fi
else
    echo "✗ No backend.pid file found"
fi

# Check WebSocket server
if lsof -i :8765 &>/dev/null; then
    echo "✓ WebSocket server running on port 8765"
else
    echo "✗ WebSocket server not running on port 8765"
fi

# Check FastAPI server
if lsof -i :8000 &>/dev/null; then
    echo "✓ Enrollment UI running on port 8000"
    if curl -s http://127.0.0.1:8000/health &>/dev/null; then
        echo "✓ Enrollment UI is responding"
    else
        echo "✗ Enrollment UI not responding"
    fi
else
    echo "✗ Enrollment UI not running on port 8000"
fi

# Check virtual sink
if pactl list short sinks | grep -q "teams_speaker_capture"; then
    echo "✓ Virtual sink 'teams_speaker_capture' exists"
else
    echo "✗ Virtual sink 'teams_speaker_capture' not found"
    echo "  Run: pactl load-module module-null-sink sink_name=teams_speaker_capture"
fi

# Check extension
if [ -d "Extension" ]; then
    echo "✓ Extension directory found"
else
    echo "✗ Extension directory not found"
fi

echo ""
echo "For detailed logs: tail -f backend.log"
