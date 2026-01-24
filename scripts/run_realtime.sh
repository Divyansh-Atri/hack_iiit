#!/bin/bash
# Helper script to run the real-time backend
# Note: Requires libportaudio2 installed on the system (sudo apt install libportaudio2)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Use the local python override if available
if [ -d "$SCRIPT_DIR/local_bin" ]; then
    export PATH="$SCRIPT_DIR/local_bin:$PATH"
fi

cd "$SCRIPT_DIR/backend"

# Activate root venv
if [ -f "../venv/bin/activate" ]; then
    source "../venv/bin/activate"
else
    echo "Error: Virtual environment not found. Please run setup first."
    exit 1
fi

# Configuration
export AUTO_RECORDING_ENABLED=true
export DEFAULT_CLASS_ID=ZgTJiZAW7Ht5qxzU3hTB # Found existing class
export BACKEND_API_URL=http://localhost:3001

echo "Target Class ID: $DEFAULT_CLASS_ID"
echo "Starting Real-Time Backend..."
python main.py
