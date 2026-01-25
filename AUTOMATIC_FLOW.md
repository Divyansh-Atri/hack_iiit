# Automatic Flow Documentation

## How the Complete System Works

### Overview

When you click "Start" in the browser extension, the entire system works automatically:

1. **Extension Start** → Recording begins automatically
2. **During Class** → Real-time speaker identification + audio recording
3. **Extension Stop** → Audio uploaded automatically
4. **Automatic Processing** → Transcription → Summarization
5. **Website** → Results appear automatically

## Step-by-Step Automatic Flow

### Step 1: Extension Start (User Action)

**User clicks "Start" in extension popup**

**What happens automatically**:
1. Extension sends `POST /api/recognition/start` to backend (port 8000)
2. Backend starts recognition loop
3. If `AUTO_RECORDING_ENABLED=true` and `DEFAULT_CLASS_ID` is set:
   - Recording starts automatically
   - Session created in Firebase via transcript API
   - Join code generated
   - Join code shown in extension popup

**Code flow**:
```
Extension popup.js → startRecognition()
  ↓
Backend main.py → /api/recognition/start
  ↓
RecognitionLoop.start(auto_start_recording=True)
  ↓
AudioRecorder.start_recording(class_id, session_title)
  ↓
Creates session via POST /api/sessions/create
  ↓
Returns session_id and join_code to extension
```

### Step 2: During Class (Automatic)

**What happens continuously**:
1. Audio captured from Teams (via PipeWire virtual sink)
2. Each audio chunk:
   - Processed for speaker recognition → Name shown on overlay
   - Saved to recording buffer (if recording enabled)
3. Status updates sent via WebSocket to extension

**Code flow**:
```
AudioCapture → audio chunks
  ↓
RecognitionLoop.process_audio_chunk()
  ├─► Speaker recognition → WebSocket → Extension overlay
  └─► AudioRecorder.add_audio_chunk() → Buffer
```

### Step 3: Extension Stop (User Action)

**User clicks "Stop" in extension popup**

**What happens automatically**:
1. Extension sends `POST /api/recognition/stop` to backend
2. Backend stops recognition loop
3. Recording stops automatically
4. Audio buffer saved to WAV file
5. Audio uploaded to Firebase Storage
6. Session status set to "processing"
7. Processing triggered via API

**Code flow**:
```
Extension popup.js → stopRecognition()
  ↓
Backend main.py → /api/recognition/stop
  ↓
RecognitionLoop.stop()
  ↓
AudioRecorder.stop_recording()
  ├─► Save audio to WAV file
  ├─► Upload to Firebase Storage
  └─► Trigger processing via POST /api/sessions/{id}/process
```

### Step 4: Automatic Processing (Background)

**Auto-Processor watches for new sessions**

**What happens automatically**:
1. Auto-processor (running in background) queries Firestore every 30 seconds
2. Finds sessions with status "processing" and audio uploaded
3. Calls STT worker: `python process_audio.py {session_id}`
4. STT worker:
   - Downloads audio from Firebase Storage
   - Transcribes using faster-whisper
   - Saves transcript to Firestore
   - Triggers summarization via `POST /api/sessions/{id}/summarize`
5. Backend API:
   - Calls Perplexity API with transcript
   - Generates structured summary
   - Saves summary to Firestore
   - Sets session status to "ready"

**Code flow**:
```
Auto-Processor (auto_processor.py)
  ↓ (every 30 seconds)
Query Firestore: status="processing" AND audio uploaded
  ↓
For each new session:
  ↓
subprocess.run(["python", "process_audio.py", session_id])
  ↓
STT Worker (process_audio.py)
  ├─► Download audio
  ├─► Transcribe with Whisper
  ├─► Save transcript to Firestore
  └─► POST /api/sessions/{id}/summarize
      ↓
Backend API (summarization.ts)
  ├─► Call Perplexity API
  ├─► Generate summary
  └─► Save to Firestore
      ↓
Session status → "ready"
```

### Step 5: Website Access (Student)

**Student enters join code on website**

**What happens**:
1. Frontend sends `POST /api/sessions/join` with join code
2. Backend verifies join code
3. Returns session data (transcript, summary, topics)
4. Frontend displays everything

**Code flow**:
```
Student → http://localhost:3000
  ↓
Enter join code
  ↓
POST /api/sessions/join
  ↓
Backend verifies → Returns session
  ↓
Frontend displays:
  - Transcript (full text)
  - Summary (short, detailed, bullet points)
  - Topics (with descriptions)
  - Search functionality
```

## Configuration for Automatic Flow

### Required Environment Variables

**Backend** (`backend/.env` or environment):
```bash
AUTO_RECORDING_ENABLED=true
DEFAULT_CLASS_ID=your-class-id-here
BACKEND_API_URL=http://localhost:3001
```

**STT Worker** (`stt-worker/.env`):
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
BACKEND_API_URL=http://localhost:3001
```

### Starting All Services

```bash
# Terminal 1: Real-time recognition (with auto-recording)
cd backend
source ../venv/bin/activate
AUTO_RECORDING_ENABLED=true DEFAULT_CLASS_ID=your-class-id BACKEND_API_URL=http://localhost:3001 python main.py

# Terminal 2: Transcript system backend
cd backend-api
npm run dev

# Terminal 3: Auto-processor (watches and processes automatically)
cd stt-worker
source venv/bin/activate
python auto_processor.py

# Terminal 4: Frontend (optional)
cd minimal-frontend
npm run dev
```

Or use the integrated script:
```bash
./install_and_run.sh
# (Make sure to set DEFAULT_CLASS_ID first)
```

## Timeline Example

**10:00 AM - Class Starts**:
- Teacher clicks "Start" in extension
- Recording starts automatically
- Session created: `session_abc123`
- Join code: `XYZ789`
- Students can already access website (will show "processing")

**10:00-11:00 AM - During Class**:
- Real-time speaker names on overlay
- Audio recording continuously
- Students see "processing" status on website

**11:00 AM - Class Ends**:
- Teacher clicks "Stop" in extension
- Audio uploaded (takes ~10 seconds)
- Session status → "processing"

**11:00-11:05 AM - Automatic Processing**:
- Auto-processor detects new session (within 30 seconds)
- STT worker transcribes (takes 2-4 minutes for 1-hour audio)
- Transcript saved to Firestore
- Perplexity generates summary (takes ~30 seconds)
- Summary saved to Firestore
- Session status → "ready"

**11:05 AM - Results Available**:
- Students refresh website
- Full transcript, summary, topics now visible
- Search functionality works

## Verification

Check that everything is working:

1. **Recording Status**:
   ```bash
   curl http://127.0.0.1:8000/api/recording/status
   ```

2. **Session Status**:
   ```bash
   curl http://localhost:3001/api/sessions/{session_id}
   ```

3. **Auto-Processor Logs**:
   ```bash
   tail -f auto-processor.log
   ```

4. **STT Worker Logs**:
   Check auto-processor.log for processing output

## Troubleshooting

**Recording not starting automatically**:
- Check `AUTO_RECORDING_ENABLED=true`
- Check `DEFAULT_CLASS_ID` is set
- Verify class_id exists in Firebase

**Processing not happening**:
- Check auto-processor is running
- Check auto-processor.log for errors
- Verify STT worker has Firebase credentials
- Check backend API is accessible from STT worker

**Summary not generating**:
- Check Perplexity API key in backend-api/.env
- Check backend API logs for errors
- Verify transcript was saved successfully
