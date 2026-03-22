# Classroom Accessibility System

A comprehensive system for real-time speaker identification and classroom transcript management designed for accessibility. The system consists of two integrated modules: real-time speaker recognition for live classes and a transcript/summary system for post-class review.

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Components](#components)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [How to Run](#how-to-run)
8. [API Documentation](#api-documentation)
9. [Development](#development)
10. [Troubleshooting](#troubleshooting)
11. [Security and Privacy](#security-and-privacy)

##  Quick Start - Integrated System

**New! Complete integration of all components with one-command setup:**

```bash
# One-time setup (installs dependencies, creates env files)
./setup_integration.sh

# Start all services (Backend API, Frontend, Real-Time Backend)
./start_integrated_system.sh

# Stop all services
./stop_integrated_system.sh
```

**What you get:**
-  Backend API running on port 3001
-  Frontend running on port 3000  
-  Real-Time Recognition Backend on port 8000
-  Chrome Extension with recording controls
-  Automatic audio upload and transcript processing
-  Join code generation for students

**Documentation:**
- 📖 **[INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md)** - Complete integration guide
- 📋 **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference for daily use
- 🔧 **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Original integration workflow


## Overview

### Problem Statement

In discussion-oriented classroom environments, particularly in online settings, students with hearing impairments face significant challenges:

1. **Real-time Context Loss**: A single shared microphone produces continuous audio with no speaker identity, making it difficult to follow discussions.
2. **Post-Class Review**: Students need accessible ways to review what was taught, including structured summaries and searchable transcripts.

### Solution

This system provides a fully integrated solution that works automatically end-to-end:

1. **Real-Time Speaker Recognition**: When you start recognition via the browser extension, it automatically:
   - Identifies speakers in real-time and displays names on overlay
   - Records audio continuously in the background
   - Creates a session in the transcript system
   - Generates a join code for students

2. **Automatic Processing Pipeline**: After class ends (when you click "Stop"):
   - Audio is automatically uploaded to Firebase Storage
   - STT worker automatically transcribes the audio to text
   - Perplexity API automatically generates structured summaries
   - Results are automatically saved to Firebase
   - Students can immediately access transcript and summary on the website using the join code

**Complete Flow**: Extension Start → Record Audio → Show Speakers → Stop → Upload → Transcribe → Summarize → Website (all automatic, no manual steps)

### Key Features

- **On-Device Processing**: Real-time speaker recognition runs entirely locally for privacy
- **Local Speech-to-Text**: Uses faster-whisper for privacy-friendly transcription
- **AI-Powered Summaries**: Structured summaries with evidence quotes using Perplexity API
- **Accessible Access**: Join code-based access for students (no login required)
- **Searchable Transcripts**: Full-text search within transcripts
- **Privacy-First**: Audio deleted after processing by default

## System Architecture

### Real-Time Speaker Recognition

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│  Chrome/Brave   │◄──WS───►│  Python Backend  │◄──Audio─►│  PipeWire    │
│   Extension     │         │                  │         │  Virtual Sink│
│                 │         │  - WebSocket     │         │              │
│  - Overlay UI   │         │  - FastAPI       │         │  Teams Audio │
│  - WebSocket    │         │  - Recognition  │         │  Output      │
│  - Settings     │         │  - VAD          │         └──────────────┘
└─────────────────┘         └──────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  Enrollment UI   │
                            │  http://8000     │
                            └──────────────────┘
```

### Transcript and Summary System

```
┌──────────────────┐
│  Minimal         │  Next.js Frontend
│  Frontend         │  (Port 3000)
└────────┬─────────┘
         │ HTTP/REST
         ▼
┌──────────────────┐
│  Backend API     │  Node.js + Express
│  (Port 3001)     │  Firebase Admin SDK
└────────┬─────────┘  Perplexity API
         │
         │ Firestore
         ▼
┌──────────────────┐
│  Firebase        │  Firestore + Storage
└────────┬─────────┘
         │
         │ Auto-trigger
         ▼
┌──────────────────┐
│  Auto-Processor  │  Watches for new sessions
│  (Background)    │  Triggers STT worker
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  STT Worker      │  Python + faster-whisper
│  (Local)         │  Transcribes → Triggers Summary
└──────────────────┘
```

### Complete Integrated Flow

```
Extension "Start" Click
    │
    ├─► Real-Time Recognition Starts
    │   └─► Shows speaker names on overlay
    │
    ├─► Recording Starts Automatically
    │   └─► Audio chunks saved to buffer
    │
    └─► Session Created in Firebase
        └─► Join code generated

[During Class]
    │
    ├─► Speaker identification (real-time)
    └─► Audio recording (background)

Extension "Stop" Click
    │
    ├─► Recording Stops
    ├─► Audio Uploaded to Firebase Storage
    └─► Session Status → "processing"

[Automatic Processing]
    │
    ├─► Auto-Processor detects new session
    ├─► STT Worker transcribes audio
    │   └─► Transcript saved to Firestore
    │   └─► Triggers summarization
    │
    └─► Perplexity generates summary
        └─► Summary saved to Firestore
        └─► Session Status → "ready"

[Website Access]
    │
    └─► Students enter join code
        └─► View transcript, summary, topics
```

## Components

### 1. Real-Time Speaker Recognition

**Location**: `backend/`, `Extension/`

**Technology Stack**:
- Python 3.11+ with FastAPI and WebSockets
- SpeechBrain (ECAPA-TDNN) for speaker recognition
- PipeWire for audio capture
- Chrome/Brave browser extension

**Key Files**:
- `backend/main.py` - Entry point (starts WebSocket + FastAPI)
- `backend/speaker_recognition.py` - Speaker identification logic
- `backend/websocket_server.py` - Real-time communication
- `Extension/content_script.js` - Browser overlay and WebSocket client

### 2. Transcript and Summary System

**Backend API** (`backend-api/`):
- Node.js + Express + TypeScript
- Firebase Admin SDK for database operations
- Perplexity API integration for summarization
- RESTful API for session and class management

**STT Worker** (`stt-worker/`):
- Python script using faster-whisper
- Local speech-to-text processing
- Timestamped segment generation
- Firestore integration

**Frontend** (`minimal-frontend/`):
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Join code-based access
- Admin dashboard for session management

## Installation

### Prerequisites

- **Operating System**: Linux (Fedora/RHEL/Debian/Ubuntu) with PipeWire
- **Node.js**: 18.0 or later
- **Python**: 3.11 or later
- **Browser**: Brave or Chrome (Chromium-based)
- **Audio Control**: `pavucontrol` (Required for routing audio)
- **Build Tools**: gcc, g++, gfortran, python3-devel, openblas-devel, lapack-devel, pkg-config

### Automated Installation

Run the installation script from the project root:
```bash
./install_and_run.sh
```

**⚠️ CRITICAL AUDIO SETUP (Every time you restart):**

For live recognition to work, you MUST route audio using `pavucontrol`:

1.  **Install pavucontrol**: `sudo apt install pavucontrol` (or `dnf install pavucontrol`)
2.  **Start the System**: `./start_integrated_system.sh`
3.  **Open Extension**: Click "Start" to begin listening.
4.  **Open pavucontrol**:
    -   **Playback Tab**: Change Chrome/Teams output to **"Virtual Speaker for Teams"**.
    -   **Recording Tab**: Change python3.10 input to **"Monitor of Virtual Speaker for Teams"**.

If you skip this, the system will listen to your microphone (silence) instead of the meeting!

```bash
./install_and_run.sh
```

This script will:
1. Check prerequisites (Node.js, Python)
2. Install all dependencies for all components
3. Create environment configuration files
4. Start Backend API (port 3001)
5. Start Frontend (port 3000)
6. Start Auto-Processor (watches for new sessions)
7. Create helper scripts

**Stop all services**:
```bash
./stop_all.sh
```

**See `HOW_TO_RUN.md` for complete step-by-step instructions.**

### Manual Installation

#### Step 1: System Dependencies

**Fedora/RHEL**:
```bash
sudo dnf install gcc gcc-c++ gcc-gfortran python3-devel openblas-devel lapack-devel pkg-config
```

**Debian/Ubuntu**:
```bash
sudo apt-get install gcc g++ gfortran python3-dev libopenblas-dev liblapack-dev pkg-config
```

#### Step 2: Real-Time Speaker Recognition Setup

```bash
# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create data directories
mkdir -p backend/data/embeddings backend/data/logs
```

#### Step 3: Transcript System Setup

**Backend API**:
```bash
cd backend-api
npm install
cp .env.example .env
# Edit .env with Firebase credentials and Perplexity API key
```

**STT Worker**:
```bash
cd stt-worker
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Firebase credentials
```

**Frontend**:
```bash
cd minimal-frontend
npm install
cp .env.example .env.local
# Edit .env.local if needed (API URL is auto-configured)
```

#### Step 4: Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database (production mode)
3. Enable Firebase Storage
4. Go to Project Settings → Service Accounts
5. Generate a new private key (download JSON)
6. Extract credentials:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (preserve `\n` characters)

#### Step 5: Deploy Firebase Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
cd firebase-config
firebase deploy --only firestore:rules,storage:rules,firestore:indexes
```

## Configuration

### Environment Variables

**Backend API** (`backend-api/.env`):
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
PERPLEXITY_API_KEY=pplx-...
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

**STT Worker** (`stt-worker/.env`):
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
BACKEND_API_URL=http://localhost:3001
WHISPER_MODEL=base
WHISPER_DEVICE=cpu
WHISPER_LANGUAGE=en
```

**Frontend** (`minimal-frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Audio Device Configuration

For real-time speaker recognition, create a PipeWire virtual sink:

```bash
pactl load-module module-null-sink sink_name=teams_speaker_capture sink_properties=device.description="Teams Speaker Capture"
```

Route Teams audio to this sink using `pavucontrol` or system audio settings.

### Recognition Parameters

Modify in `backend/speaker_recognition.py`:
```python
switch_threshold=0.70    # Minimum confidence to switch speakers
low_threshold=0.55       # Below this threshold = uncertain
margin=0.05              # Minimum margin over current speaker
window_size=5            # Prediction window size
consecutive_required=2   # Required consecutive predictions
```

## How to Run

For complete step-by-step instructions, see **`HOW_TO_RUN.md`**.

### Quick Start

1. **First-time setup**:
   ```bash
   ./install_and_run.sh
   ```

2. **Create a class** (get class_id):
   - Open http://localhost:3000/admin
   - Create a class
   - Note the class_id

3. **Start real-time backend** (with auto-recording):
   ```bash
   cd backend
   source ../venv/bin/activate
   AUTO_RECORDING_ENABLED=true DEFAULT_CLASS_ID=your-class-id BACKEND_API_URL=http://localhost:3001 python main.py
   ```

4. **Use the extension**:
   - Load extension in browser
   - Click "Start" in extension
   - Everything happens automatically

See `HOW_TO_RUN.md` for detailed instructions.

## Usage

### Integrated Workflow (Fully Automatic)

The system works automatically end-to-end: when you click "Start" in the extension, it automatically records audio, converts it to text, summarizes it with Perplexity, and displays it on the website.

**Complete Automatic Flow**:

1. **One-Time Setup**:
   ```bash
   # Step 1: Create a class in admin dashboard (http://localhost:3000/admin)
   # Step 2: Get the class_id from the response or Firestore
   # Step 3: Set it as default for automatic recording
   export DEFAULT_CLASS_ID=your-class-id
   export BACKEND_API_URL=http://localhost:3001
   export AUTO_RECORDING_ENABLED=true
   ```

2. **Start All Systems** (use install_and_run.sh or manually):
   ```bash
   # Option A: Use integrated script (recommended)
   ./install_and_run.sh
   # This starts: Backend API, Frontend, and Auto-Processor
   
   # Option B: Manual start
   # Terminal 1: Real-time recognition backend (with auto-recording)
   cd backend
   source ../venv/bin/activate
   AUTO_RECORDING_ENABLED=true DEFAULT_CLASS_ID=your-class-id BACKEND_API_URL=http://localhost:3001 python main.py
   
   # Terminal 2: Transcript system backend
   cd backend-api && npm run dev
   
   # Terminal 3: Automatic STT processor (watches for new sessions)
   cd stt-worker
   source venv/bin/activate
   python auto_processor.py
   
   # Terminal 4: Frontend
   cd minimal-frontend && npm run dev
   ```

3. **Start Class** (via Extension):
   - Open Teams meeting
   - Click extension icon → Click "Start" button
   - **What happens automatically**:
     - Real-time speaker identification starts (shows names on overlay)
     - Recording starts automatically
     - Session created in Firebase
     - Join code generated and shown in popup
     - Students can immediately access website with join code

4. **During Class**:
   - Real-time speaker names displayed on overlay
   - Audio recorded continuously in background
   - Students can access website with join code (shows "processing" status)

5. **End of Class**:
   - Click "Stop" in extension
   - **Automatic sequence (no manual steps)**:
     1. Recording stops
     2. Audio uploaded to Firebase Storage automatically
     3. Session status → "processing"
     4. Auto-processor detects new session (within 30 seconds)
     5. STT worker automatically transcribes audio → saves transcript to Firestore
     6. Summarization automatically triggered → Perplexity generates summary
     7. Summary saved to Firestore
     8. Session status → "ready"
     9. **Results appear on website automatically**

6. **Access Results**:
   - Join code shown in extension popup when starting
   - Students visit http://localhost:3000
   - Enter join code
   - View transcript, summary, topics, search

**Complete Timeline**:
- **Extension Start** → Recording + Real-time recognition begin
- **During Class** → Audio recorded, speakers identified
- **Extension Stop** → Upload → Transcribe → Summarize (all automatic)
- **Website** → Results appear automatically (within 2-5 minutes for 1-hour class)

**Key Features**:
- **Fully Automatic**: Click "Start" → Everything happens automatically
- **Zero Manual Steps**: Recording → Upload → Transcription → Summarization → Website (all automatic)
- **Real-Time**: Speaker identification works during class
- **Post-Class**: Transcript and summary ready automatically within minutes

See `AUTOMATIC_FLOW.md` for detailed flow documentation.

### Real-Time Speaker Recognition (Standalone)

1. **Start Backend**:
   ```bash
   cd backend
   source ../venv/bin/activate
   python main.py
   ```

2. **Load Browser Extension**:
   - Open `brave://extensions/` or `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select the `Extension` directory

3. **Enroll Students**:
   - Open http://127.0.0.1:8000
   - Add students and record/upload audio samples (20-40 seconds each)

4. **Start Recognition**:
   - Join a Microsoft Teams meeting
   - Route Teams audio to "Teams Speaker Capture" virtual sink
   - Click extension icon and click "Start"
   - Overlay displays current speaker identification

### Transcript and Summary System

1. **Start Services**:
   ```bash
   ./install_and_run.sh
   ```
   Or manually:
   ```bash
   # Terminal 1: Backend API
   cd backend-api
   npm run dev

   # Terminal 2: Frontend
   cd minimal-frontend
   npm run dev
   ```

2. **Create a Class** (Admin):
   - Open http://localhost:3000/admin
   - Click "Create Class"
   - Enter class name and instructor

3. **Create a Session** (Admin):
   - Click "Create Session"
   - Select class and enter session title
   - Note the join code (e.g., `ABC123`)

4. **Upload Audio**:
   ```bash
   ./scripts/upload_audio.sh <session_id> <audio_file.wav>
   ```

5. **Process Audio**:
   ```bash
   ./scripts/process_session.sh <session_id>
   ```

6. **Access Session** (Student):
   - Open http://localhost:3000
   - Enter join code
   - View transcript, summary, topics, and search

## API Documentation

### Real-Time Speaker Recognition API

**WebSocket** (ws://127.0.0.1:8765):
- Messages from backend: `{type: "speaker", name: "...", confidence: 0.85}`
- Messages to backend: `{type: "ping"}`

**HTTP API** (http://127.0.0.1:8000):
- `GET /` - Enrollment UI
- `GET /health` - Health check
- `GET /api/students` - List enrolled students
- `POST /api/students` - Add student
- `POST /api/students/{id}/enroll` - Enroll student from audio
- `POST /api/recognition/start` - Start recognition
- `POST /api/recognition/stop` - Stop recognition

### Transcript System API

**Backend API** (http://localhost:3001):

**Sessions**:
- `POST /api/sessions/create` - Create new session
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:sessionId?joinCode=XXX` - Get session
- `POST /api/sessions/join` - Verify join code and get session
- `POST /api/sessions/:sessionId/process` - Mark session for processing
- `POST /api/sessions/:sessionId/summarize` - Generate summary

**Classes**:
- `POST /api/classes/create` - Create new class
- `GET /api/classes` - List all classes
- `GET /api/classes/:classId` - Get class details

**Upload**:
- `POST /api/upload/:sessionId/audio` - Upload audio file (multipart/form-data)

## Development

### Project Structure

```
Hack-IIIT/
├── backend/                 # Real-time speaker recognition
│   ├── main.py
│   ├── speaker_recognition.py
│   ├── websocket_server.py
│   └── data/
│
├── Extension/              # Browser extension
│   ├── manifest.json
│   ├── content_script.js
│   └── popup.js
│
├── backend-api/            # Transcript system backend
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   └── services/
│   └── package.json
│
├── stt-worker/             # Speech-to-text worker
│   ├── process_audio.py
│   └── requirements.txt
│
├── minimal-frontend/        # Frontend application
│   ├── app/
│   └── package.json
│
├── firebase-config/         # Firebase rules and indexes
│
├── scripts/                 # Helper scripts
│
└── install_and_run.sh      # Main setup script
```

### Running in Development

**Real-Time Recognition Backend**:
```bash
cd backend
source ../venv/bin/activate
python main.py
```

**Backend API**:
```bash
cd backend-api
npm run dev
```

**Frontend**:
```bash
cd minimal-frontend
npm run dev
```

**STT Worker** (manual processing):
```bash
cd stt-worker
source venv/bin/activate
python process_audio.py <session_id>
```

### Testing

```bash
# Test transcript system
./scripts/test_system.sh

# Test backend API health
curl http://localhost:3001/health
```

## Troubleshooting

### Real-Time Speaker Recognition

**No audio device found**:
```bash
python -c "import sounddevice as sd; print(sd.query_devices())"
pactl list short sources | grep monitor
```

**VAD always reports silence**:
- Verify audio levels in enrollment UI
- Verify audio levels in enrollment UI
- Lower `energy_threshold` in `backend/vad.py`
- **Check Audio Routing (Most Common Issue)**:
    1.  Open `pavucontrol`.
    2.  Check **Recording** tab.
    3.  Ensure `python3.10` (or `ALSA plug-in`) is capturing from **"Monitor of Virtual Speaker for Teams"**.
    4.  If it's capturing from "Internal Microphone", change it!

**Recognition not functioning**:
- Verify student enrollment: Check `backend/data/students.json`
- Verify embeddings exist: `ls backend/data/embeddings/`
- Test with demo mode in enrollment UI

### Transcript System

**Backend API won't start**:
- Check `.env` file exists and has all required variables
- Ensure `FIREBASE_PRIVATE_KEY` has `\n` characters preserved
- Verify Firebase credentials are correct

**Audio Upload fails with "Bucket does not exist"**:
- Go to [Firebase Console](https://console.firebase.google.com) -> Storage
- Click "Get Started" if not already set up
- Create the default bucket (it should match `your-project-id.appspot.com`)
- Verify `FIREBASE_STORAGE_BUCKET` in `.env` matches this bucket name

**STT Worker fails**:
- Install ffmpeg: `sudo apt-get install ffmpeg` or `sudo dnf install ffmpeg`
- Check audio file format (supports mp3, wav, webm)
- Verify Firebase credentials in `.env`

**Frontend can't connect**:
- Verify backend API is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in backend

**Port already in use**:
```bash
# Stop all services
./stop_all.sh

# Or kill specific ports
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

## Security and Privacy

### Privacy Features

**Real-Time Recognition**:
- All processing occurs locally (no cloud connectivity)
- No raw audio storage (only voice embeddings)
- Localhost binding (127.0.0.1 only)
- No microphone access required from extension

**Transcript System**:
- Local STT processing (faster-whisper runs on-device)
- Audio deleted after processing by default (configurable)
- Join code-based access (no personal data required)
- Firestore security rules enforce access control

### Data Storage

**Real-Time Recognition**:
- `backend/data/students.json`: Student metadata only
- `backend/data/embeddings/*.npy`: Voice embeddings (192 dimensions)
- No raw audio files stored

**Transcript System**:
- Firestore: Transcripts, summaries, session metadata
- Firebase Storage: Temporary audio storage (deleted after processing)
- No PII stored unless explicitly consented

### Consent Requirements

Voice identification involves sensitive biometric data. Ensure all participants provide informed consent for:
- Voice enrollment and embedding generation
- Real-time speaker identification during meetings
- Local storage of voice embeddings
- Audio recording and transcription (for transcript system)

### Security Measures

- Firestore security rules enforce access control
- Join codes are rate-limited
- Admin routes protected (Firebase Auth optional)
- Private keys stored in environment variables (never committed)
- CORS configured for specific origins

## Performance

### Real-Time Recognition

- **Latency**: 0.5-2.0 seconds end-to-end
- **Accuracy**: High confidence (≥0.70) is very reliable
- **Anti-Flicker**: Hysteresis prevents rapid speaker switching

### Transcript System

- **STT Processing**: ~1-5 minutes for 1-hour audio (depends on model size)
- **Summarization**: ~10-30 seconds per transcript
- **Storage**: Efficient Firestore queries with indexes

## Cost Considerations

### Firebase

- Firestore: $0.06 per 100k reads, $0.18 per 100k writes
- Storage: $0.026/GB/month, $0.12/GB downloads
- Estimated: $10-20/month for 100 sessions

### Perplexity API

- Pricing varies by model
- Estimated: $1-3/month for 100 sessions

## License

This project is designed for accessibility purposes. Use responsibly and in accordance with applicable regulations.

## Acknowledgments

- SpeechBrain - ECAPA-TDNN speaker recognition model
- faster-whisper - Efficient Whisper implementation
- PipeWire - Modern audio system for Linux
- Firebase - Backend infrastructure
- Perplexity - AI summarization API
