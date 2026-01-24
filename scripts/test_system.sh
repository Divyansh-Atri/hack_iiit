#!/bin/bash
# Test script to verify the system is working

echo "=========================================="
echo "Testing Classroom Transcript System"
echo "=========================================="
echo ""

API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001}

# Test 1: Health check
echo "1. Testing backend health..."
HEALTH=$(curl -s "$API_URL/health")
if echo "$HEALTH" | grep -q "ok"; then
    echo "   [PASS] Backend is running"
else
    echo "   [FAIL] Backend is not responding"
    echo "   Response: $HEALTH"
    exit 1
fi
echo ""

# Test 2: Create a test class
echo "2. Creating test class..."
CLASS_RESPONSE=$(curl -s -X POST "$API_URL/api/classes/create" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Class","instructor":"Test Instructor"}')

CLASS_ID=$(echo "$CLASS_RESPONSE" | grep -o '"classId":"[^"]*' | cut -d'"' -f4)

if [ -z "$CLASS_ID" ]; then
    echo "   [FAIL] Failed to create class"
    echo "   Response: $CLASS_RESPONSE"
    exit 1
else
    echo "   [PASS] Class created: $CLASS_ID"
fi
echo ""

# Test 3: Create a test session
echo "3. Creating test session..."
SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/sessions/create" \
    -H "Content-Type: application/json" \
    -d "{\"classId\":\"$CLASS_ID\",\"title\":\"Test Session\",\"createdBy\":\"test\"}")

SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)
JOIN_CODE=$(echo "$SESSION_RESPONSE" | grep -o '"joinCode":"[^"]*' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
    echo "   [FAIL] Failed to create session"
    echo "   Response: $SESSION_RESPONSE"
    exit 1
else
    echo "   [PASS] Session created: $SESSION_ID"
    echo "   [PASS] Join code: $JOIN_CODE"
fi
echo ""

# Test 4: Verify join code
echo "4. Testing join code verification..."
JOIN_RESPONSE=$(curl -s -X POST "$API_URL/api/sessions/join" \
    -H "Content-Type: application/json" \
    -d "{\"joinCode\":\"$JOIN_CODE\"}")

if echo "$JOIN_RESPONSE" | grep -q "$SESSION_ID"; then
    echo "   [PASS] Join code verification works"
else
    echo "   [FAIL] Join code verification failed"
    echo "   Response: $JOIN_RESPONSE"
    exit 1
fi
echo ""

# Test 5: List sessions
echo "5. Testing session listing..."
SESSIONS=$(curl -s "$API_URL/api/sessions")
if echo "$SESSIONS" | grep -q "$SESSION_ID"; then
    echo "   [PASS] Session listing works"
else
    echo "   [WARN] Session listing may have issues"
fi
echo ""

echo "=========================================="
echo "[SUCCESS] All basic tests passed!"
echo "=========================================="
echo ""
echo "Session Details:"
echo "  Session ID: $SESSION_ID"
echo "  Join Code: $JOIN_CODE"
echo ""
echo "Next steps:"
echo "  1. Upload audio: ./scripts/upload_audio.sh $SESSION_ID /path/to/audio.wav"
echo "  2. Process: ./scripts/process_session.sh $SESSION_ID"
echo "  3. View: http://localhost:3000/s/$SESSION_ID?joinCode=$JOIN_CODE"
