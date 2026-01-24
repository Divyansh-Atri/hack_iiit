#!/bin/bash

# Quick Student Enrollment Script
# Usage: ./quick_enroll.sh

set -e

echo "🎓 Student Voice Enrollment - Quick Start"
echo "=========================================="
echo ""

# Check if backend is running
if ! curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "⚠️  Backend is not running!"
    echo ""
    echo "Starting backend..."
    cd backend
    source ../venv/bin/activate
    python main.py &
    BACKEND_PID=$!
    echo "Backend started (PID: $BACKEND_PID)"
    sleep 3
    cd ..
fi

echo "✅ Backend is running"
echo ""
echo "📝 Enrollment Interface:"
echo "   → Open: http://127.0.0.1:8000"
echo ""
echo "📋 Quick Instructions:"
echo ""
echo "1️⃣  Add Student:"
echo "   - Enter name and roll number"
echo "   - Click 'Add Student'"
echo ""
echo "2️⃣  Enroll Voice:"
echo ""
echo "   Option A - Upload Audio File:"
echo "   - Select student from dropdown"
echo "   - Choose audio file (WAV, 20-40 seconds)"
echo "   - Click 'Enroll from File'"
echo ""
echo "   Option B - Record in Browser:"
echo "   - Select student from dropdown"
echo "   - Click microphone button (🎤)"
echo "   - Speak for 20-40 seconds"
echo "   - Click stop button (⏹)"
echo ""
echo "3️⃣  Test Recognition:"
echo "   - Upload a test audio file"
echo "   - Click 'Test Recognition'"
echo "   - Check confidence scores"
echo ""
echo "📚 For detailed guide, see: ENROLLMENT_GUIDE.md"
echo ""
echo "Press Ctrl+C to stop backend when done"
echo ""

# Open browser
if command -v xdg-open > /dev/null; then
    xdg-open http://127.0.0.1:8000
elif command -v open > /dev/null; then
    open http://127.0.0.1:8000
else
    echo "Please open http://127.0.0.1:8000 in your browser"
fi

# Wait for user to stop
if [ ! -z "$BACKEND_PID" ]; then
    wait $BACKEND_PID
fi
