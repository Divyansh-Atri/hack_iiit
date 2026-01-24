#!/bin/bash
# Helper script to upload audio to a session

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_ID=$1
AUDIO_FILE=$2

if [ -z "$SESSION_ID" ] || [ -z "$AUDIO_FILE" ]; then
    echo "Usage: $0 <session_id> <audio_file>"
    echo ""
    echo "Example:"
    echo "  $0 abc123xyz /path/to/audio.wav"
    exit 1
fi

if [ ! -f "$AUDIO_FILE" ]; then
    echo "Error: Audio file not found: $AUDIO_FILE"
    exit 1
fi

API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001}

echo "Uploading audio to session: $SESSION_ID"
echo "File: $AUDIO_FILE"
echo ""

curl -X POST "$API_URL/api/upload/$SESSION_ID/audio" \
    -F "audio=@$AUDIO_FILE;type=audio/wav"

echo ""
echo "Upload complete!"
echo "Now run: $SCRIPT_DIR/scripts/process_session.sh $SESSION_ID"
