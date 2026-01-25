# Build Plan - Classroom Transcript & Summary System

## Step-by-Step Implementation Checklist

### Phase 1: Project Structure & Configuration
- [x] Create folder structure (minimal-frontend, backend-api, stt-worker)
- [ ] Set up TypeScript configs for Node.js backend
- [ ] Set up Next.js minimal frontend
- [ ] Create Python worker environment
- [ ] Set up Firebase project configuration files

### Phase 2: Firebase Setup
- [ ] Create Firestore data models/types
- [ ] Write Firestore security rules
- [ ] Create Firestore indexes
- [ ] Set up Firebase Admin SDK configuration
- [ ] Create environment variable templates

### Phase 3: Backend API (Node.js + Express)
- [ ] Create Express server with TypeScript
- [ ] Implement Firebase Admin SDK integration
- [ ] Create session management endpoints:
  - POST /api/sessions/create
  - GET /api/sessions/:sessionId
  - POST /api/sessions/:sessionId/verify-code
- [ ] Implement audio upload endpoint:
  - POST /api/sessions/:sessionId/upload-audio
- [ ] Implement processing trigger:
  - POST /api/sessions/:sessionId/process
- [ ] Implement join code verification:
  - POST /api/sessions/join
- [ ] Add error handling and validation (Zod schemas)

### Phase 4: STT Worker (Python)
- [ ] Set up faster-whisper or Whisper
- [ ] Create worker script that:
  - Downloads audio from Firebase Storage
  - Runs STT with timestamps
  - Writes transcript to Firestore
  - Triggers summarization job
- [ ] Add speaker diarization support (optional)
- [ ] Handle error cases and retries

### Phase 5: Perplexity Integration
- [ ] Create summarization endpoint in backend
- [ ] Design prompt for structured JSON output
- [ ] Implement Perplexity API client
- [ ] Add JSON validation with Zod
- [ ] Store results in Firestore
- [ ] Handle rate limiting and errors

### Phase 6: Minimal Frontend (Next.js)
- [ ] Set up Next.js with TypeScript + Tailwind
- [ ] Create /join page (join code input)
- [ ] Create /s/[sessionId] page (session viewer)
- [ ] Create /admin dashboard (session management)
- [ ] Add search functionality
- [ ] Add accessibility features (large text, contrast)
- [ ] Implement Firebase Auth for admin

### Phase 7: Privacy & Security
- [ ] Add consent banner/checkbox
- [ ] Implement audio retention policy
- [ ] Add join code rate limiting
- [ ] Secure admin routes
- [ ] Add privacy policy page

### Phase 8: Documentation & Deployment
- [ ] Write comprehensive README
- [ ] Document environment variables
- [ ] Create deployment instructions
- [ ] Add troubleshooting guide
- [ ] Document cost considerations

## Implementation Order

1. **Backend API** (foundation)
2. **Firebase setup** (data layer)
3. **STT Worker** (processing)
4. **Perplexity integration** (AI summarization)
5. **Minimal Frontend** (UI)
6. **Security & Privacy** (compliance)
7. **Documentation** (completion)

## Key Design Decisions

- **Backend**: Express server (easier local dev than Cloud Functions)
- **STT**: faster-whisper (local, privacy-friendly, fast)
- **Storage**: Firebase Storage for audio (temporary)
- **Database**: Firestore with structured collections
- **Auth**: Join codes for students, Firebase Auth for admin
- **Hosting**: Vercel for frontend, Firebase Functions or separate server for backend
