# Integration Verification Checklist

Use this checklist to verify that the integration is working correctly.

## ✅ Pre-Flight Checks

### Environment Setup
- [ ] Node.js 18+ is installed (`node --version`)
- [ ] Python 3.11+ is installed (`python3 --version`)
- [ ] npm dependencies installed for backend-api
- [ ] npm dependencies installed for minimal-frontend
- [ ] Python venv created for backend
- [ ] Firebase project created
- [ ] Firebase credentials obtained

### Configuration Files
- [ ] `backend-api/.env` exists and has all required variables
- [ ] `minimal-frontend/.env.local` exists with API URL
- [ ] Firebase credentials are correct in `.env`
- [ ] Perplexity API key is set in `.env`
- [ ] CORS_ORIGIN includes all necessary origins

### Extension Setup
- [ ] Chrome extension loaded in browser
- [ ] Extension icon appears in toolbar
- [ ] Extension popup opens when clicked

## 🚀 Service Startup Checks

### Backend API (Port 3001)
- [ ] Service starts without errors
- [ ] Health check responds: `curl http://localhost:3001/health`
- [ ] Returns: `{"status":"ok","timestamp":"..."}`
- [ ] No CORS errors in logs
- [ ] Firebase connection successful

### Frontend (Port 3000)
- [ ] Service starts without errors
- [ ] Page loads at http://localhost:3000
- [ ] Join code entry form is visible
- [ ] No console errors in browser DevTools

### Real-Time Backend (Port 8000)
- [ ] Service starts without errors
- [ ] Health check responds: `curl http://localhost:8000/health`
- [ ] WebSocket server running on port 8765
- [ ] Environment variables set correctly:
  - [ ] `ENABLE_AUDIO_RECORDING=true`
  - [ ] `BACKEND_API_URL=http://localhost:3001`

## 🔌 Connection Tests

### Extension → Real-Time Backend
- [ ] Extension popup shows "Connected" status
- [ ] Backend status indicator is green
- [ ] No connection errors in extension console
- [ ] WebSocket connection established (check DevTools → Network → WS)

### Real-Time Backend → Backend API
- [ ] Can create session via API
- [ ] Can upload audio via API
- [ ] CORS allows requests from localhost:8000
- [ ] No 403/CORS errors in logs

### Frontend → Backend API
- [ ] Can fetch sessions
- [ ] Can join with code
- [ ] No CORS errors in browser console
- [ ] API requests complete successfully

## 🎙️ Recording Functionality

### Start Recording
- [ ] Extension popup has "Start Recording" button
- [ ] Session title input is visible
- [ ] Can enter session title
- [ ] Click "Start Recording" succeeds
- [ ] Join code is displayed in popup
- [ ] Recording status shows "Recording..."
- [ ] Timer starts counting
- [ ] Session created in Firebase

### During Recording
- [ ] Recording status updates every second
- [ ] Timer increments correctly
- [ ] Can check status: `curl http://localhost:8000/api/recording/status`
- [ ] Returns: `{"recording": true, ...}`

### Stop Recording
- [ ] Click "Stop Recording" succeeds
- [ ] Recording status changes to "Not recording"
- [ ] Success message shows session ID
- [ ] Audio file uploaded to Firebase Storage
- [ ] Session status updated in Firestore

## 🌐 Frontend Access

### Join Code Entry
- [ ] Can access http://localhost:3000
- [ ] Join code input is visible
- [ ] Can enter 6-character code
- [ ] Invalid code shows error
- [ ] Valid code redirects to session page

### Session View
- [ ] Session page loads with join code
- [ ] Session title is displayed
- [ ] Status shows correctly (processing/ready)
- [ ] Transcript appears when ready
- [ ] Summary appears when ready
- [ ] Topics are displayed
- [ ] Search functionality works

## 🔧 Integration Features

### Automatic Workflow
- [ ] Starting recording creates session automatically
- [ ] Join code generated automatically
- [ ] Stopping recording uploads audio automatically
- [ ] Session status updates automatically
- [ ] No manual steps required

### Extension Features
- [ ] "View Transcripts" button opens frontend
- [ ] Recording timer updates in real-time
- [ ] Can start/stop recognition
- [ ] Can start/stop recording independently
- [ ] Settings persist across sessions

## 📊 End-to-End Test

### Complete Workflow
1. [ ] Start all services with `./start_integrated_system.sh`
2. [ ] Open extension popup
3. [ ] Enter session title: "Test Session"
4. [ ] Click "Start Recording"
5. [ ] Verify join code appears
6. [ ] Record for 30 seconds (speak or play audio)
7. [ ] Click "Stop Recording"
8. [ ] Verify success message with session ID
9. [ ] Open frontend at http://localhost:3000
10. [ ] Enter the join code
11. [ ] Verify session page loads
12. [ ] Verify status shows "processing"
13. [ ] Wait for processing to complete
14. [ ] Verify transcript appears
15. [ ] Verify summary appears

## 🐛 Troubleshooting Verification

### If Extension Won't Connect
- [ ] Real-time backend is running
- [ ] Port 8000 is accessible
- [ ] Port 8765 is accessible
- [ ] No firewall blocking connections
- [ ] Check browser console for errors

### If Recording Won't Start
- [ ] `ENABLE_AUDIO_RECORDING=true` is set
- [ ] Backend API is running
- [ ] `BACKEND_API_URL` is correct
- [ ] Firebase credentials are valid
- [ ] Check real-time backend logs

### If Audio Won't Upload
- [ ] Backend API is accessible
- [ ] Firebase Storage is enabled
- [ ] Storage bucket exists
- [ ] Credentials have write permissions
- [ ] Check backend-api logs

### If Frontend Won't Load
- [ ] Port 3000 is not in use
- [ ] `NEXT_PUBLIC_API_URL` is set
- [ ] Backend API is running
- [ ] No build errors
- [ ] Check browser console

## 📝 Logs to Check

### Backend API Logs
```bash
tail -f logs/backend-api.log
```
Look for:
- [ ] "Backend API server running on http://localhost:3001"
- [ ] No error messages
- [ ] Successful requests logged

### Frontend Logs
```bash
tail -f logs/frontend.log
```
Look for:
- [ ] "ready - started server on 0.0.0.0:3000"
- [ ] No compilation errors
- [ ] No runtime errors

### Real-Time Backend Logs
```bash
tail -f logs/realtime-backend.log
```
Look for:
- [ ] "WebSocket server started on port 8765"
- [ ] "FastAPI server started on port 8000"
- [ ] No connection errors
- [ ] Successful recording start/stop

## ✨ Success Indicators

### You know integration is working when:
- [ ] All services start with one command
- [ ] Extension connects to backend automatically
- [ ] Recording creates session without manual API calls
- [ ] Join code is generated automatically
- [ ] Audio uploads without manual intervention
- [ ] Students can access transcripts with join code
- [ ] No manual file transfers needed
- [ ] Complete workflow works end-to-end

## 🎯 Final Verification

### Integration Complete When:
- [ ] Can record a class session via extension
- [ ] Join code is shared with students
- [ ] Audio is processed automatically
- [ ] Students can view transcript and summary
- [ ] No errors in any logs
- [ ] All components communicate successfully
- [ ] Workflow is seamless and automatic

---

## 📞 If Issues Persist

1. Check all logs in `logs/` directory
2. Review `INTEGRATION_COMPLETE.md` for detailed troubleshooting
3. Verify all environment variables are set correctly
4. Ensure all ports are free (3000, 3001, 8000, 8765)
5. Check Firebase console for errors
6. Review browser console for client-side errors

## 🎉 Success!

If all checks pass, your integration is complete and working correctly!

You can now:
- Record classes with one click
- Generate join codes automatically
- Share transcripts with students
- Process audio automatically
- Access everything through a unified interface

Enjoy your integrated Classroom Accessibility System! 🚀
