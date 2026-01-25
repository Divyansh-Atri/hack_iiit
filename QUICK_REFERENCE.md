# Quick Reference - Integrated System

## 🚀 Quick Start

```bash
# One-time setup
./setup_integration.sh

# Start all services
./start_integrated_system.sh

# Stop all services
./stop_integrated_system.sh
```

## 📍 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:3001 | Transcript system API |
| Frontend | http://localhost:3000 | Student access portal |
| Real-Time Backend | http://localhost:8000 | Speaker recognition |
| Extension | Chrome Extensions | Instructor controls |

## 🎯 Common Tasks

### Start a Class Recording

1. Open Chrome extension
2. Enter session title
3. Click "🎙️ Start Recording"
4. Share the join code with students
5. Click "▶ Start" for real-time recognition

### Stop Recording

1. Click "⏹ Stop" (recognition)
2. Click "⏸️ Stop Recording"
3. Audio uploads automatically

### Access Transcripts (Students)

1. Go to http://localhost:3000
2. Enter join code
3. View transcript and summary

## 🔧 Troubleshooting

### Check Service Status

```bash
# Backend API
curl http://localhost:3001/health

# Real-Time Backend
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000
```

### View Logs

```bash
# All logs
tail -f logs/*.log

# Specific service
tail -f logs/backend-api.log
tail -f logs/frontend.log
tail -f logs/realtime-backend.log
```

### Kill Stuck Processes

```bash
# Kill by port
lsof -ti:3001 | xargs kill -9  # Backend API
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # Real-Time Backend
```

## 🔑 Environment Variables

### Required for Real-Time Backend

```bash
ENABLE_AUDIO_RECORDING=true
BACKEND_API_URL=http://localhost:3001
```

### Backend API (.env)

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `PERPLEXITY_API_KEY`
- `CORS_ORIGIN`

### Frontend (.env.local)

- `NEXT_PUBLIC_API_URL=http://localhost:3001`

## 📡 API Endpoints

### Recording Control

```bash
# Start recording
curl -X POST http://127.0.0.1:8000/api/recording/start \
  -H "Content-Type: application/json" \
  -d '{"session_title": "Lecture 1"}'

# Stop recording
curl -X POST http://127.0.0.1:8000/api/recording/stop

# Check status
curl http://127.0.0.1:8000/api/recording/status
```

### Recognition Control

```bash
# Start recognition
curl -X POST http://127.0.0.1:8000/api/recognition/start

# Stop recognition
curl -X POST http://127.0.0.1:8000/api/recognition/stop
```

## 🎨 Extension Features

### Keyboard Shortcuts
- `Alt+O` - Toggle overlay
- `Alt+↑` - Increase font size
- `Alt+↓` - Decrease font size

### Popup Controls
- Backend connection status
- Start/Stop recognition
- Start/Stop recording
- Session title input
- Recording timer
- View transcripts
- Display settings

## 📂 File Locations

```
backend-api/.env          # Backend API configuration
minimal-frontend/.env.local  # Frontend configuration
logs/                     # Service logs
*.pid                     # Process IDs
Extension/                # Chrome extension files
```

## 🔄 Integration Flow

```
Extension → Real-Time Backend → Backend API → Firebase
    ↓              ↓                  ↓            ↓
  Teams      Speaker ID          Sessions    Storage
              Audio              Upload      Transcripts
```

## 💡 Tips

1. **Always start Backend API first** - Other services depend on it
2. **Check logs** if something doesn't work
3. **Share join codes** with students before class
4. **Keep extension popup open** to see recording timer
5. **Use descriptive session titles** for easy identification

## 📞 Support

- Check `INTEGRATION_COMPLETE.md` for detailed documentation
- Review `INTEGRATION_GUIDE.md` for workflow examples
- Check individual component READMEs
- View logs for error messages
