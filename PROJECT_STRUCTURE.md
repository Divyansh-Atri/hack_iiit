# Project Structure

Complete file tree for Teams Real-Time Speaker Identification System.

```
Hack-IIIT/
├── README.md                      # Main documentation with setup instructions
├── requirements.txt               # Python dependencies (pinned versions)
├── setup.sh                      # Automated setup script
├── .gitignore                    # Git ignore rules
│
├── backend/                      # Python backend server
│   ├── main.py                   # Entry point (starts WS + FastAPI)
│   ├── websocket_server.py      # WebSocket server (ws://127.0.0.1:8765)
│   ├── enrollment_api.py        # FastAPI enrollment endpoints
│   ├── audio_capture.py         # PipeWire audio capture (sounddevice)
│   ├── vad.py                   # Voice Activity Detection
│   ├── speaker_recognition.py   # SpeechBrain recognition + hysteresis
│   ├── recognition_loop.py      # Real-time processing loop
│   ├── data_manager.py          # Student data & embedding management
│   ├── static/
│   │   └── enrollment.html      # Enrollment web UI (HTML/JS)
│   └── data/                    # Runtime data (created automatically)
│       ├── students.json        # Student metadata
│       ├── embeddings/          # Speaker embeddings (.npy files)
│       └── logs/               # Optional logs
│
├── Extension/                    # Chrome/Brave MV3 extension
│   ├── manifest.json            # Extension manifest (MV3)
│   ├── content_script.js        # Overlay + WebSocket client
│   ├── popup.html               # Settings popup UI
│   ├── popup.js                 # Popup logic
│   ├── popup.css                # Popup styles
│   ├── overlay.css              # Overlay styles
│   ├── service_worker.js        # Background service worker
│   ├── icons/                   # Extension icons
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── README.md                # Extension documentation
│   └── INSTALLATION_GUIDE.md    # Installation guide
│
└── main/                        # Legacy/example code (can be removed)
    ├── enroll.py                # Example enrollment script
    ├── recognise.py             # Example recognition script
    └── data/                    # Example audio data
```

## Key Components

### Backend (`backend/`)

1. **main.py**: Orchestrates WebSocket and FastAPI servers
2. **websocket_server.py**: Real-time communication with extension
3. **enrollment_api.py**: REST API for student enrollment
4. **audio_capture.py**: Captures audio from PipeWire virtual sink
5. **vad.py**: Detects speech vs silence
6. **speaker_recognition.py**: SpeechBrain-based speaker identification
7. **recognition_loop.py**: Ties everything together for real-time processing
8. **data_manager.py**: Manages student data and embeddings

### Extension (`Extension/`)

1. **content_script.js**: Injects overlay, connects to WebSocket
2. **popup.html/js**: Settings UI for user preferences
3. **overlay.css**: High-contrast overlay styling
4. **manifest.json**: MV3 extension configuration

## Data Flow

```
Teams Audio → PipeWire Virtual Sink → Audio Capture → VAD → Recognition → WebSocket → Extension → Overlay
```

## File Sizes (Approximate)

- Backend Python files: ~15-20 KB total
- Extension JavaScript: ~10-15 KB total
- Enrollment UI: ~15 KB
- Total codebase: ~50-60 KB (excluding dependencies)

## Dependencies

See `requirements.txt` for complete list. Key:
- FastAPI, Uvicorn (web server)
- WebSockets (real-time communication)
- SoundDevice (audio capture)
- PyTorch, SpeechBrain (ML)
- NumPy, SciPy (numerical operations)
