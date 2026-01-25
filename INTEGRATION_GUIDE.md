# System Integration Guide

## Overview

The Classroom Accessibility System consists of two integrated modules that work together:

1. **Real-Time Speaker Recognition**: Identifies speakers during live classes
2. **Transcript and Summary System**: Processes recorded audio into transcripts and summaries

## How They Work Together

### Automatic Integration Flow

```
┌─────────────────────────────────────┐
│  Real-Time Speaker Recognition      │
│  (During Live Class)                │
│                                     │
│  1. Captures audio from Teams       │
│  2. Identifies speakers in real-time│
│  3. Records audio (optional)        │
└──────────────┬──────────────────────┘
               │
               │ When class ends
               ▼
┌─────────────────────────────────────┐
│  Audio Recording Module              │
│                                     │
│  1. Saves recorded audio to file    │
│  2. Creates session in Firebase     │
│  3. Uploads audio to transcript API │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Transcript System                   │
│                                     │
│  1. STT Worker processes audio      │
│  2. Generates transcript            │
│  3. Perplexity creates summary      │
│  4. Stores in Firebase              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Student Access                     │
│                                     │
│  Students access via join code      │
│  View transcript, summary, topics   │
└─────────────────────────────────────┘
```

## Setup Integration

### Step 1: Enable Recording in Real-Time System

Set environment variables before starting the backend:

```bash
export ENABLE_AUDIO_RECORDING=true
export BACKEND_API_URL=http://localhost:3001
```

Or add to your startup script:

```bash
# In backend/main.py or startup script
ENABLE_AUDIO_RECORDING=true
BACKEND_API_URL=http://localhost:3001
python backend/main.py
```

### Step 2: Ensure Both Systems Are Running

**Terminal 1 - Real-Time Recognition Backend**:
```bash
cd backend
source ../venv/bin/activate
ENABLE_AUDIO_RECORDING=true BACKEND_API_URL=http://localhost:3001 python main.py
```

**Terminal 2 - Transcript System Backend**:
```bash
cd backend-api
npm run dev
```

**Terminal 3 - Transcript System Frontend** (optional):
```bash
cd minimal-frontend
npm run dev
```

### Step 3: Start Recording During Class

#### Option A: Via API (Recommended)

Before starting recognition, create a class in the transcript system, then:

```bash
# Start recording (before or during class)
curl -X POST http://127.0.0.1:8000/api/recording/start \
  -H "Content-Type: application/json" \
  -d '{"class_id": "your-class-id", "session_title": "Lecture 1: Introduction"}'

# Start recognition
curl -X POST http://127.0.0.1:8000/api/recognition/start

# ... class happens ...

# Stop recognition (automatically stops recording and uploads)
curl -X POST http://127.0.0.1:8000/api/recognition/stop
```

#### Option B: Via Enrollment UI

Add recording controls to the enrollment UI (http://127.0.0.1:8000) or use the extension popup.

### Step 4: Process Audio

After recording stops, the audio is automatically uploaded. Process it:

```bash
# Get session ID from the stop_recording response, then:
./scripts/process_session.sh <session_id>
```

Or the system can be configured to auto-process.

## API Endpoints for Integration

### Real-Time System (Port 8000)

**Start Recording**:
```
POST /api/recording/start
Body: {"class_id": "class123", "session_title": "Lecture 1"}
```

**Stop Recording**:
```
POST /api/recording/stop
Returns: {"status": "recording_stopped", "session_id": "session123"}
```

**Get Recording Status**:
```
GET /api/recording/status
Returns: {"recording": true, "session_id": "...", "duration_seconds": 120, "chunks": 240}
```

### Transcript System (Port 3001)

**Create Session** (called automatically by recorder):
```
POST /api/sessions/create
Body: {"classId": "class123", "title": "Lecture 1", "createdBy": "real-time-recognition"}
```

**Upload Audio** (called automatically by recorder):
```
POST /api/upload/{sessionId}/audio
Content-Type: multipart/form-data
Body: audio file
```

## Workflow Example

### Complete Class Session

1. **Before Class**:
   ```bash
   # Start real-time recognition backend
   cd backend
   ENABLE_AUDIO_RECORDING=true BACKEND_API_URL=http://localhost:3001 python main.py
   
   # Start transcript system backend
   cd ../backend-api
   npm run dev
   ```

2. **Start of Class**:
   ```bash
   # Create class in transcript system (via admin UI or API)
   # Then start recording
   curl -X POST http://127.0.0.1:8000/api/recording/start \
     -d '{"class_id": "class123", "session_title": "Today\'s Lecture"}'
   
   # Start recognition
   curl -X POST http://127.0.0.1:8000/api/recognition/start
   ```

3. **During Class**:
   - Real-time speaker identification works as normal
   - Audio is being recorded in the background
   - Check status: `curl http://127.0.0.1:8000/api/recording/status`

4. **End of Class**:
   ```bash
   # Stop recognition (automatically stops recording and uploads)
   curl -X POST http://127.0.0.1:8000/api/recognition/stop
   # Response: {"status": "recording_stopped", "session_id": "session123"}
   ```

5. **Process Audio**:
   ```bash
   # Use the session_id from step 4
   ./scripts/process_session.sh session123
   ```

6. **Access Results**:
   - Get join code from admin dashboard or API
   - Students access at: http://localhost:3000
   - Enter join code to view transcript and summary

## Configuration

### Environment Variables

**Real-Time Backend** (`backend/`):
```bash
ENABLE_AUDIO_RECORDING=true          # Enable recording integration
BACKEND_API_URL=http://localhost:3001  # Transcript system API URL
```

**Transcript System Backend** (`backend-api/.env`):
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
PERPLEXITY_API_KEY=...
PORT=3001
```

## Troubleshooting

### Recording Not Starting

- Check `ENABLE_AUDIO_RECORDING=true` is set
- Verify transcript system backend is running on port 3001
- Check `BACKEND_API_URL` is correct
- Verify class_id exists in Firebase

### Audio Not Uploading

- Check network connectivity between systems
- Verify Firebase credentials in transcript system
- Check backend-api logs for errors
- Ensure session was created successfully

### Processing Fails

- Verify STT worker has Firebase credentials
- Check audio file was uploaded successfully
- Review STT worker logs
- Ensure backend API is accessible from STT worker

## Benefits of Integration

1. **Seamless Workflow**: Record during class, process automatically after
2. **No Manual Upload**: Audio automatically flows to transcript system
3. **Session Management**: Sessions created automatically with metadata
4. **Speaker Context**: Can potentially link speaker IDs to transcript segments (future enhancement)

## Future Enhancements

- Automatic processing trigger after upload
- Speaker-tagged transcript segments (link recognition to transcript)
- Real-time partial transcript streaming
- Automatic session creation from class schedule
