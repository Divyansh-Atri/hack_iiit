#!/bin/bash
# Helper script to process a session after audio upload

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_ID=$1

if [ -z "$SESSION_ID" ]; then
    echo "Usage: $0 <session_id>"
    echo ""
    echo "Example:"
    echo "  $0 abc123xyz"
    exit 1
fi

echo "Processing session: $SESSION_ID"
echo ""

# Navigate to STT worker directory
cd "$SCRIPT_DIR/stt-worker"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Error: Virtual environment not found. Run ./install_and_run.sh first."
    exit 1
fi

# Run processing
python process_audio.py "$SESSION_ID"

echo ""
echo "Processing complete!"
echo "Check the session at: http://localhost:3000/s/$SESSION_ID"
