#!/bin/bash
# Backend Verification Script
# Tests all critical endpoints and WebSocket connectivity

echo "=========================================="
echo "Backend API Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test /health endpoint
echo -n "Testing GET /health... "
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health)
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}✓ 200 OK${NC}"
else
    echo -e "${RED}✗ $HEALTH${NC}"
fi

# Test GET /api/students
echo -n "Testing GET /api/students... "
STUDENTS_GET=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/students)
if [ "$STUDENTS_GET" = "200" ]; then
    echo -e "${GREEN}✓ 200 OK${NC}"
    curl -s http://127.0.0.1:8000/api/students | python3 -m json.tool 2>/dev/null | head -10
else
    echo -e "${RED}✗ $STUDENTS_GET${NC}"
fi

# Test POST /api/students
echo -n "Testing POST /api/students... "
STUDENTS_POST=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8000/api/students -d "name=Test Student" -d "roll=TEST123")
if [ "$STUDENTS_POST" = "200" ]; then
    echo -e "${GREEN}✓ 200 OK${NC}"
else
    echo -e "${RED}✗ $STUDENTS_POST${NC}"
fi

# Test WebSocket connectivity
echo -n "Testing WebSocket ws://127.0.0.1:8765... "
WS_TEST=$(timeout 2 python3 -c "
import asyncio
import websockets
async def test():
    try:
        async with websockets.connect('ws://127.0.0.1:8765') as ws:
            print('OK')
    except Exception as e:
        print(f'FAIL: {e}')
asyncio.run(test())
" 2>&1)

if [[ "$WS_TEST" == *"OK"* ]]; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ $WS_TEST${NC}"
fi

# Check if backend is still running
echo ""
echo -n "Backend process status... "
if pgrep -f "python.*main.py" > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
    echo "PID: $(pgrep -f 'python.*main.py')"
else
    echo -e "${RED}✗ Not running${NC}"
fi

echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
