# Complete Integration Guide - Classroom Accessibility System

This guide covers the complete integration of the backend API, frontend, and Chrome extension for the Classroom Accessibility System.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                          │
│  - Real-time speaker overlay on Teams                       │
│  - Recording controls                                        │
│  - Session management                                        │
└────────────┬────────────────────────────────────────────────┘
             │
             │ WebSocket (8765) + HTTP (8000)
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Real-Time Recognition Backend                   │
│  - Speaker identification (port 8000)                        │
│  - Audio recording                                           │
│  - WebSocket server (port 8765)                             │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTP API (3001)
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Express)                       │
│  - Session management (port 3001)                           │
│  - Audio upload & storage                                   │
│  - Firebase integration                                      │
│  - Transcript processing coordination                        │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Firebase
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  - Student access (port 3000)                               │
│  - Join code entry                                          │
│  - Transcript & summary viewing                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Initial Setup

Run the setup script to install dependencies and configure environment files:

```bash
./setup_integration.sh
```

This will:
- Install npm packages for backend-api and minimal-frontend
- Create `.env` files if they don't exist
- Verify the project structure

### 2. Start All Services

Start all services with a single command:

```bash
./start_integrated_system.sh
```

**⚠️ CRITICAL AUDIO SETUP (Required for Live Recognition):**
1. Open `pavucontrol`
2. **Playback Tab**: Set Chrome output to "Virtual Speaker for Teams"
3. **Recording Tab**: Set python3.10 input to "Monitor of Virtual Speaker for Teams"

This starts:
- **Backend API** on port 3001
- **Frontend** on port 3000
- **Real-Time Recognition Backend** on port 8000

Logs are saved to the `logs/` directory.

### 3. Load Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `Extension` folder from this project
5. The extension icon should appear in your toolbar

### 4. Stop All Services

When done, stop all services:

```bash
./stop_integrated_system.sh
```

Or press `Ctrl+C` if you're watching the logs.

## Manual Setup (Alternative)

If you prefer to start services individually:

### Terminal 1: Backend API

```bash
cd backend-api
npm install
npm run dev
```

### Terminal 2: Frontend

```bash
cd minimal-frontend
npm install
npm run dev
```

### Terminal 3: Real-Time Backend

```bash
cd backend
# Activate virtual environment if needed
source ../venv/bin/activate  # or your venv path

# Start with recording enabled
ENABLE_AUDIO_RECORDING=true BACKEND_API_URL=http://localhost:3001 python main.py
```

## Usage Workflow

### For Instructors

1. **Before Class:**
   - Ensure all services are running
   - Load the Chrome extension
   - Join your Teams meeting

2. **Start of Class:**
   - Click the extension icon
   - Enter a session title (e.g., "Lecture 5: Data Structures")
   - Click "🎙️ Start Recording"
   - Note the join code displayed - share this with students
   - Click "▶ Start" to begin real-time speaker recognition

3. **During Class:**
   - The overlay shows current speaker in real-time
   - Recording continues in the background
   - Students can see the join code to access transcripts later

4. **End of Class:**
   - Click "⏹ Stop" to stop recognition
   - Click "⏸️ Stop Recording"
   - Audio is automatically uploaded and will be processed

### For Students

1. **Access Transcripts:**
   - Go to http://localhost:3000
   - Enter the join code provided by instructor
   - View transcript, summary, and key topics

2. **Alternative Access:**
   - Click the extension icon
   - Click "📄 View Transcripts"
   - Enter join code

## API Endpoints

### Real-Time Backend (Port 8000)

- `GET /health` - Health check
- `POST /api/recognition/start` - Start speaker recognition
- `POST /api/recognition/stop` - Stop speaker recognition
- `POST /api/recording/start` - Start audio recording
  ```json
  {
    "session_title": "Lecture Title",
    "auto_create_session": true
  }
  ```
- `POST /api/recording/stop` - Stop recording and upload
- `GET /api/recording/status` - Get recording status

### Backend API (Port 3001)

- `GET /health` - Health check
- `POST /api/sessions/create` - Create new session
- `POST /api/sessions/join` - Join session with code
- `GET /api/sessions/:id` - Get session details
- `POST /api/upload/:sessionId/audio` - Upload audio file
- `GET /api/classes` - List classes
- `POST /api/classes/create` - Create new class

### Frontend (Port 3000)

- `/` - Join code entry page
- `/s/:sessionId` - Session view (transcript & summary)
- `/admin` - Admin dashboard

## Environment Variables

### backend-api/.env

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_STORAGE_BUCKET=your-bucket

# Perplexity API
PERPLEXITY_API_KEY=your-api-key

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS - Multiple origins supported
CORS_ORIGIN=http://localhost:3000,http://localhost:8000,http://127.0.0.1:8000,http://127.0.0.1:3000

# Security
JOIN_CODE_LENGTH=6
MAX_JOIN_ATTEMPTS=5
JOIN_CODE_RATE_LIMIT_WINDOW_MS=60000
```

### minimal-frontend/.env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### backend (Environment Variables)

Set these when starting the real-time backend:

```bash
ENABLE_AUDIO_RECORDING=true
BACKEND_API_URL=http://localhost:3001
```

## Extension Features

### Popup Controls

1. **Backend Status** - Shows connection to real-time backend
2. **Recognition Controls**
   - Start/Stop speaker recognition
   - Reconnect to backend
   - Open enrollment page

3. **Recording Controls**
   - Session title input
   - Start/Stop recording
   - Recording status with timer
   - View transcripts button

4. **Display Settings**
   - Enable/disable overlay
   - Font size adjustment
   - Position (top/center/bottom)
   - Background opacity
   - Show last 3 speakers
   - Show confidence percentage
   - Debug mode

### Keyboard Shortcuts

- `Alt+O` - Toggle overlay
- `Alt+↑` - Increase font size
- `Alt+↓` - Decrease font size

## Troubleshooting

### Backend API won't start

- Check if port 3001 is already in use: `lsof -i:3001`
- Verify Firebase credentials in `.env`
- Check logs: `cat logs/backend-api.log`

### Frontend won't start

- Check if port 3000 is already in use: `lsof -i:3000`
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check logs: `cat logs/frontend.log`

### Real-Time Backend issues

- Check if port 8000 is already in use: `lsof -i:8000`
- Verify Python environment is activated
- Check environment variables are set
- Check logs: `cat logs/realtime-backend.log`

### Extension not connecting

- Verify real-time backend is running on port 8000
- Check WebSocket connection (port 8765)
- Open Chrome DevTools → Console for errors
- Try clicking "🔄 Reconnect" in extension popup

### CORS errors

- Verify `CORS_ORIGIN` in `backend-api/.env` includes all needed origins
- Check browser console for specific CORS error messages
- Ensure backend API is running before frontend

### Recording not working

- Verify `ENABLE_AUDIO_RECORDING=true` is set
- Check `BACKEND_API_URL` points to correct backend API
- Ensure backend API is running and accessible
- Check recording status: `curl http://127.0.0.1:8000/api/recording/status`

## File Structure

```
.
├── backend/                    # Real-time recognition backend (Python)
│   ├── main.py
│   ├── audio_recorder.py
│   └── ...
├── backend-api/               # Transcript system backend (Node.js)
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   └── .env
├── minimal-frontend/          # Student frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx
│   │   └── s/[id]/
│   ├── package.json
│   └── .env.local
├── Extension/                 # Chrome extension
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── content_script.js
│   └── ...
├── setup_integration.sh       # Setup script
├── start_integrated_system.sh # Start all services
├── stop_integrated_system.sh  # Stop all services
└── INTEGRATION_COMPLETE.md    # This file
```

## Testing the Integration

### 1. Test Backend API

```bash
# Health check
curl http://localhost:3001/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Test Real-Time Backend

```bash
# Health check
curl http://localhost:8000/health

# Start recording
curl -X POST http://127.0.0.1:8000/api/recording/start \
  -H "Content-Type: application/json" \
  -d '{"session_title": "Test Session"}'

# Check status
curl http://127.0.0.1:8000/api/recording/status

# Stop recording
curl -X POST http://127.0.0.1:8000/api/recording/stop
```

### 3. Test Frontend

Open http://localhost:3000 in your browser and verify the join code entry page loads.

### 4. Test Extension

1. Load extension in Chrome
2. Click extension icon
3. Verify backend status shows "Connected"
4. Try starting/stopping recognition

## Production Deployment

For production deployment:

1. **Update environment variables** with production values
2. **Build frontend**: `cd minimal-frontend && npm run build`
3. **Build backend API**: `cd backend-api && npm run build`
4. **Use process manager** like PM2 for Node.js services
5. **Use systemd** or supervisor for Python backend
6. **Configure reverse proxy** (nginx/Apache) for proper routing
7. **Enable HTTPS** for all services
8. **Update CORS_ORIGIN** to production domains
9. **Package extension** for Chrome Web Store

## Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Review the INTEGRATION_GUIDE.md
3. Check individual component READMEs
4. Verify all environment variables are set correctly

## License

See project LICENSE file.
