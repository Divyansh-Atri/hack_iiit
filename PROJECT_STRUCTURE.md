# Project Structure

This document describes the clean, organized structure of the Classroom Accessibility System.

## Directory Structure

```
Hack-IIIT/
├── backend/                    # Real-time speaker recognition backend
│   ├── main.py                # Entry point for speaker recognition
│   ├── speaker_recognition.py # Core speaker identification logic
│   ├── websocket_server.py    # WebSocket server for real-time communication
│   ├── audio_capture.py       # Audio input handling
│   ├── audio_recorder.py      # Recording functionality
│   ├── recognition_loop.py    # Main recognition loop
│   ├── enrollment_api.py      # Student enrollment API
│   ├── data_manager.py        # Data persistence
│   ├── vad.py                 # Voice Activity Detection
│   ├── config.py              # Configuration
│   ├── continuous_processor.py # Continuous processing
│   ├── .env.example           # Environment variables template
│   ├── data/                  # Runtime data (gitignored)
│   │   ├── embeddings/        # Voice embeddings
│   │   ├── logs/              # Application logs
│   │   └── students.json      # Student metadata
│   ├── pretrained_models/     # Downloaded ML models
│   └── static/                # Static files for enrollment UI
│
├── backend-api/                # Transcript system backend (Node.js)
│   ├── src/
│   │   ├── index.ts           # Express server entry point
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic
│   │   └── types/             # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example           # Environment variables template
│   └── .gitignore
│
├── minimal-frontend/           # Web application frontend (Next.js)
│   ├── app/                   # Next.js app directory
│   │   ├── page.tsx           # Home page (join code entry)
│   │   ├── session/           # Session view pages
│   │   ├── admin/             # Admin dashboard
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   ├── lib/                   # Utility functions
│   ├── public/                # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── .env.example           # Environment variables template
│   └── .gitignore
│
├── stt-worker/                 # Speech-to-text worker (Python)
│   ├── process_audio.py       # Main STT processing script
│   ├── auto_processor.py      # Automatic session processor
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Environment variables template
│
├── Extension/                  # Browser extension (Chrome/Brave)
│   ├── manifest.json          # Extension manifest
│   ├── content_script.js      # Overlay UI and WebSocket client
│   ├── popup.html             # Extension popup
│   ├── popup.js               # Popup logic
│   ├── background.js          # Background service worker
│   ├── styles.css             # Extension styles
│   └── icons/                 # Extension icons
│
├── firebase-config/            # Firebase configuration
│   ├── firestore.rules        # Firestore security rules
│   ├── storage.rules          # Storage security rules
│   └── firestore.indexes.json # Firestore indexes
│
├── scripts/                    # Utility scripts
│   ├── patch_speechbrain.py   # SpeechBrain patching
│   ├── process_session.sh     # Manual session processing
│   ├── run_realtime.sh        # Start real-time recognition
│   ├── test_system.sh         # System testing
│   └── upload_audio.sh        # Audio upload helper
│
├── Website/                    # Original website (legacy/reference)
│   └── ...                    # (May contain older frontend code)
│
├── backup_YYYYMMDD_HHMMSS/    # Backup of removed files
│   └── ...                    # (Automatically created by cleanup script)
│
├── venv/                       # Python virtual environment (gitignored)
│
├── .gitignore                  # Git ignore rules
├── README.md                   # Main project documentation
├── HOW_TO_RUN.md              # Detailed setup and usage guide
├── requirements.txt            # Python dependencies for backend
├── install_and_run.sh         # Main installation and startup script
├── stop_all.sh                # Stop all running services
├── verify_backend.sh          # Backend verification script
├── auto_setup.sh              # Automated setup script
└── cleanup_project.sh         # Project cleanup script

```

## Core Components

### 1. Real-Time Speaker Recognition (`backend/`)
- **Purpose**: Identifies speakers in real-time during online meetings
- **Technology**: Python, FastAPI, WebSockets, SpeechBrain
- **Entry Point**: `backend/main.py`
- **Port**: 8000 (HTTP), 8765 (WebSocket)

### 2. Transcript System Backend (`backend-api/`)
- **Purpose**: Manages sessions, classes, and coordinates processing
- **Technology**: Node.js, Express, TypeScript, Firebase Admin SDK
- **Entry Point**: `backend-api/src/index.ts`
- **Port**: 3001

### 3. Frontend Application (`minimal-frontend/`)
- **Purpose**: Web interface for accessing transcripts and summaries
- **Technology**: Next.js 14, React, TypeScript, Tailwind CSS
- **Entry Point**: `minimal-frontend/app/page.tsx`
- **Port**: 3000

### 4. STT Worker (`stt-worker/`)
- **Purpose**: Converts audio recordings to text transcripts
- **Technology**: Python, faster-whisper
- **Entry Point**: `stt-worker/process_audio.py`
- **Mode**: Background worker (auto_processor.py)

### 5. Browser Extension (`Extension/`)
- **Purpose**: Provides overlay UI and controls for speaker recognition
- **Technology**: Vanilla JavaScript, Chrome Extension API
- **Entry Point**: `Extension/content_script.js`

## Data Flow

```
1. Extension Start
   └─► backend/main.py (WebSocket + Recording)
       └─► Real-time speaker identification
       └─► Audio recording to buffer

2. Extension Stop
   └─► Upload audio to Firebase Storage
       └─► backend-api creates session

3. Auto-Processing
   └─► stt-worker/auto_processor.py detects new session
       └─► stt-worker/process_audio.py transcribes
           └─► backend-api generates summary (Perplexity)

4. Student Access
   └─► minimal-frontend (join code)
       └─► backend-api (fetch session data)
           └─► Firebase Firestore
```

## Environment Files

Each component requires environment configuration:

- `backend/.env` - Not needed (uses system audio)
- `backend-api/.env` - Firebase credentials, Perplexity API key
- `stt-worker/.env` - Firebase credentials
- `minimal-frontend/.env.local` - API URL configuration

## Installation

Use the automated installation script:

```bash
./install_and_run.sh
```

This will:
1. Install all dependencies
2. Create environment files from examples
3. Start all services
4. Display access URLs

## Stopping Services

```bash
./stop_all.sh
```

## Removed Files (Cleaned Up)

The following files were removed during cleanup and backed up:

- `AUTOMATIC_FLOW.md` - Redundant documentation
- `BUILD_PLAN.md` - Redundant documentation
- `EXAMPLE_OUTPUT.md` - Redundant documentation
- `IMPLEMENTATION_SUMMARY.md` - Redundant documentation
- `INTEGRATION_GUIDE.md` - Redundant documentation
- `QUICK_START.md` - Redundant documentation
- `interfaces.py` - SpeechBrain patch file (not actively used)
- `interfaces_backup.py` - Backup file
- `patch_content.txt` - Temporary file
- `reproduce_issue.py` - Debug script
- `*.pid` - Process ID files
- `main/` - Old test scripts (superseded by `backend/`)
- `local_bin/` - Symlinks to system Python
- `hack_iiit/` - Empty git repository
- `Extra scripts/` - Duplicate scripts (functionality in `scripts/`)

All removed files are backed up in `backup_YYYYMMDD_HHMMSS/` directory.

## Key Scripts

- **`install_and_run.sh`** - One-command setup and start
- **`stop_all.sh`** - Stop all services
- **`cleanup_project.sh`** - Clean up redundant files
- **`verify_backend.sh`** - Verify backend API health

## Documentation

- **`README.md`** - Comprehensive project overview
- **`HOW_TO_RUN.md`** - Step-by-step setup and usage guide
- **`PROJECT_STRUCTURE.md`** - This file

## Notes

- All Python dependencies are managed via virtual environment (`venv/`)
- Node.js dependencies are in respective `node_modules/` (gitignored)
- Sensitive data (embeddings, logs, .env files) are gitignored
- Firebase credentials should never be committed to version control
