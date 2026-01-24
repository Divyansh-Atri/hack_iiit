# How to Run the Complete System

## Quick Start (Recommended)

### Step 1: One-Time Setup

```bash
# 1. Create a class in the transcript system
# Open http://localhost:3000/admin (after starting frontend)
# Click "Create Class" and note the class_id from the response

# 2. Set default class ID for automatic recording
export DEFAULT_CLASS_ID=your-class-id-here
export BACKEND_API_URL=http://localhost:3001
export AUTO_RECORDING_ENABLED=true
```

### Step 2: Start All Systems

**Option A: Use the integrated script (easiest)**

```bash
# This sets up and starts: Backend API, Frontend, and Auto-Processor
./install_and_run.sh
```

Then in a separate terminal, start the real-time recognition backend:

```bash
# Terminal 2: Real-time recognition backend
cd backend
source ../venv/bin/activate
AUTO_RECORDING_ENABLED=true DEFAULT_CLASS_ID=your-class-id BACKEND_API_URL=http://localhost:3001 python main.py
```

**Option B: Manual start (for more control)**

```bash
# Terminal 1: Transcript System Backend
cd backend-api
npm run dev

# Terminal 2: Transcript System Frontend
cd minimal-frontend
npm run dev

# Terminal 3: Auto-Processor (watches for new sessions and processes them)
cd stt-worker
source venv/bin/activate
python auto_processor.py

# Terminal 4: Real-time Recognition Backend
cd backend
source ../venv/bin/activate
AUTO_RECORDING_ENABLED=true DEFAULT_CLASS_ID=your-class-id BACKEND_API_URL=http://localhost:3001 python main.py
```

### Step 3: Use the System

1. **Load Browser Extension**:
   - Open `brave://extensions/` or `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the `Extension` directory

2. **Enroll Students** (one-time, before first class):
   - Open http://127.0.0.1:8000
   - Add students and record/upload audio samples

3. **Start a Class**:
   - Join Microsoft Teams meeting
   - Route Teams audio to "Teams Speaker Capture" virtual sink (using pavucontrol)
   - Click extension icon → Click "Start"
   - Recording starts automatically
   - Join code shown in popup (share with students)

4. **During Class**:
   - Real-time speaker names appear on overlay
   - Audio being recorded in background
   - Students can access website with join code

5. **End Class**:
   - Click "Stop" in extension
   - Everything processes automatically (2-5 minutes for 1-hour class)
   - Results appear on website automatically

6. **Access Results**:
   - Students visit http://localhost:3000
   - Enter join code
   - View transcript, summary, topics

## Detailed Setup Instructions

### Prerequisites Check

```bash
# Check Node.js
node --version  # Should be 18+

# Check Python
python3 --version  # Should be 3.11+

# Check if systems are installed
cd backend-api && test -d node_modules && echo "Backend API ready" || echo "Run: npm install"
cd ../stt-worker && test -d venv && echo "STT Worker ready" || echo "Run: python3 -m venv venv && pip install -r requirements.txt"
cd ../minimal-frontend && test -d node_modules && echo "Frontend ready" || echo "Run: npm install"
```

### First-Time Setup

If you haven't set up the systems yet:

```bash
# Run the installation script
./install_and_run.sh

# This will:
# - Install all dependencies
# - Create .env files from .env.example
# - Start Backend API, Frontend, and Auto-Processor
```

### Configure Environment Variables

**Backend (for auto-recording)**:
```bash
# Create backend/.env or set environment variables
export AUTO_RECORDING_ENABLED=true
export DEFAULT_CLASS_ID=your-class-id-here  # Get from admin dashboard
export BACKEND_API_URL=http://localhost:3001
```

**Backend API** (`backend-api/.env`):
```
FIREBASE_PROJECT_ID=teams-2d189
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@teams-2d189.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=teams-2d189.appspot.com
PERPLEXITY_API_KEY=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
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

**STT Worker** (`stt-worker/.env`):
```
FIREBASE_PROJECT_ID=teams-2d189
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@teams-2d189.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
BACKEND_API_URL=http://localhost:3001
WHISPER_MODEL=base
WHISPER_DEVICE=cpu
WHISPER_LANGUAGE=en
```

### Get Class ID

Before starting, you need a class ID:

1. Start the frontend: `cd minimal-frontend && npm run dev`
2. Open http://localhost:3000/admin
3. Click "Create Class"
4. Enter class name and instructor
5. Note the `classId` from the response (or check browser network tab)
6. Use this as `DEFAULT_CLASS_ID`

## Running the Complete System

### Terminal Layout

You'll need 4 terminals (or use the integrated script for 3):

```
Terminal 1: Transcript Backend API (port 3001)
Terminal 2: Transcript Frontend (port 3000)
Terminal 3: Auto-Processor (background watcher)
Terminal 4: Real-time Recognition Backend (port 8000)
```

### Start Commands

**Terminal 1 - Transcript Backend API**:
```bash
cd backend-api
npm run dev
# Should see: Backend API server running on http://localhost:3001
```

**Terminal 2 - Transcript Frontend**:
```bash
cd minimal-frontend
npm run dev
# Should see: ready - started server on 0.0.0.0:3000
```

**Terminal 3 - Auto-Processor**:
```bash
cd stt-worker
source venv/bin/activate
python auto_processor.py
# Should see: [AutoProcessor] Starting automatic session processor...
# Should see: [AutoProcessor] Watching for sessions with status 'processing'...
```

**Terminal 4 - Real-time Recognition**:
```bash
cd backend
source ../venv/bin/activate
AUTO_RECORDING_ENABLED=true DEFAULT_CLASS_ID=your-class-id BACKEND_API_URL=http://localhost:3001 python main.py
# Should see:
# Teams Speaker Recognition Backend
# Starting servers...
#   - WebSocket: ws://127.0.0.1:8765
#   - Enrollment UI: http://127.0.0.1:8000
```

### Verify Everything is Running

```bash
# Check Backend API
curl http://localhost:3001/health
# Should return: {"status":"ok",...}

# Check Frontend
curl http://localhost:3000
# Should return HTML

# Check Real-time Backend
curl http://127.0.0.1:8000/health
# Should return: {"status":"ok","service":"teams-speaker-recognition"}

# Check Auto-Processor
# Should see logs in terminal showing it's watching
```

## Using the System

### 1. Enroll Students (One-Time Setup)

1. Open http://127.0.0.1:8000
2. Add students (name and optional roll number)
3. For each student:
   - Click "Enroll Student"
   - Record 20-40 seconds of speech OR upload WAV file
4. Verify all students are enrolled

### 2. Start a Class Session

1. **Join Teams Meeting**:
   - Open Teams in browser
   - Join the meeting

2. **Route Audio** (one-time per session):
   - Open `pavucontrol` (or system audio settings)
   - Go to "Playback" tab
   - Route Teams audio to "Teams Speaker Capture"
   - Verify in "Recording" tab that monitor device appears

3. **Start Recognition**:
   - Click extension icon in browser
   - Click "Start" button
   - You should see:
     - "Recognition started"
     - "Recording started automatically"
     - "Join code: ABC123" (example)
   - Share join code with students

4. **During Class**:
   - Speaker names appear on overlay in real-time
   - Audio is being recorded automatically
   - Students can access website with join code

5. **End Class**:
   - Click "Stop" in extension
   - You should see: "Recording saved to session: session_xyz"
   - Processing happens automatically in background

### 3. Access Results

1. **Get Join Code**:
   - Shown in extension popup when starting
   - Or get from admin dashboard: http://localhost:3000/admin

2. **Student Access**:
   - Visit http://localhost:3000
   - Enter join code
   - View transcript, summary, topics
   - Use search to find specific content

## Stop All Services

```bash
# Stop everything
./stop_all.sh

# Or stop individually:
# - Backend API: Ctrl+C in Terminal 1
# - Frontend: Ctrl+C in Terminal 2
# - Auto-Processor: Ctrl+C in Terminal 3
# - Real-time Backend: Ctrl+C in Terminal 4
```

## Troubleshooting

### Services Not Starting

**Backend API fails**:
```bash
cd backend-api
# Check .env file exists
cat .env
# Check Firebase credentials are correct
npm run dev
```

**Frontend fails**:
```bash
cd minimal-frontend
# Check .env.local exists
cat .env.local
npm run dev
```

**Auto-Processor fails**:
```bash
cd stt-worker
# Check .env file
cat .env
# Verify venv is activated
source venv/bin/activate
python auto_processor.py
```

**Real-time Backend fails**:
```bash
cd backend
# Check venv is activated
source ../venv/bin/activate
# Check if DEFAULT_CLASS_ID is set
echo $DEFAULT_CLASS_ID
python main.py
```

### Recording Not Starting Automatically

- Check `AUTO_RECORDING_ENABLED=true` is set
- Check `DEFAULT_CLASS_ID` is set and valid
- Check `BACKEND_API_URL` is correct
- Verify transcript backend is running on port 3001

### Processing Not Happening

- Check auto-processor is running (Terminal 3)
- Check auto-processor.log for errors
- Verify STT worker has Firebase credentials
- Check backend API is accessible

### Join Code Not Working

- Verify session exists in Firestore
- Check join code is correct (6 characters, uppercase)
- Check Firestore rules are deployed
- Try accessing via admin dashboard first

## Quick Reference

**URLs**:
- Frontend: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin
- Backend API: http://localhost:3001
- Real-time Backend: http://127.0.0.1:8000
- Enrollment UI: http://127.0.0.1:8000

**Key Commands**:
```bash
# Start everything
./install_and_run.sh

# Stop everything
./stop_all.sh

# Check logs
tail -f backend-api.log
tail -f frontend.log
tail -f auto-processor.log

# Process session manually (if auto-processor not running)
./scripts/process_session.sh <session_id>
```

## Next Steps After Setup

1. Create your first class in admin dashboard
2. Set `DEFAULT_CLASS_ID` environment variable
3. Enroll students via enrollment UI
4. Start your first class session
5. Share join code with students
6. Stop class and wait for automatic processing
7. Students access results on website

That's it! The system is fully automatic from extension start to website results.
