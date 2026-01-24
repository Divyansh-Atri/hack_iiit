#!/usr/bin/env python3
"""
Main entry point for Teams Speaker Recognition Backend
Starts both WebSocket server and FastAPI enrollment server
"""

import asyncio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from websocket_server import WebSocketServer
from enrollment_api import router as enrollment_router, data_manager
from audio_capture import AudioCapture
from speaker_recognition import SpeakerRecognizer
from vad import VADProcessor
from recognition_loop import RecognitionLoop

# Global instances (shared across requests)
ws_server_instance = None
recognition_loop_instance = None

# Create FastAPI app
app = FastAPI(title="Teams Speaker Recognition Enrollment")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include enrollment routes (router already has /api prefix)
app.include_router(enrollment_router)

@app.post("/api/recognition/start")
async def start_recognition(device_index: int = None, device_name: str = None, auto_record: bool = True):
    """Start recognition (automatically starts recording if enabled)"""
    global recognition_loop_instance
    if recognition_loop_instance and recognition_loop_instance.is_running:
        return {"status": "already_running"}
    
    recognition_loop_instance.start(auto_start_recording=auto_record)
    
    # Return session info if recording started
    response = {"status": "started"}
    if recognition_loop_instance.audio_recorder and recognition_loop_instance.audio_recorder.is_recording:
        response["recording"] = True
        response["session_id"] = recognition_loop_instance.audio_recorder.session_id
        if recognition_loop_instance.audio_recorder.session_id:
            # Get join code from transcript system
            try:
                import requests
                from config import Config
                session_response = requests.get(
                    f"{Config.BACKEND_API_URL}/api/sessions/{recognition_loop_instance.audio_recorder.session_id}",
                    timeout=5
                )
                if session_response.ok:
                    session_data = session_response.json()
                    response["join_code"] = session_data.get("joinCode")
            except:
                pass
    
    return response

@app.post("/api/recognition/stop")
async def stop_recognition():
    """Stop recognition (automatically stops recording and uploads)"""
    global recognition_loop_instance
    response = {"status": "stopped"}
    
    if recognition_loop_instance:
        # Get session_id before stopping (if recording)
        session_id = None
        if recognition_loop_instance.audio_recorder and recognition_loop_instance.audio_recorder.is_recording:
            session_id = recognition_loop_instance.audio_recorder.session_id
        
        recognition_loop_instance.stop()
        
        if session_id:
            response["session_id"] = session_id
            # Get join code
            try:
                import requests
                from config import Config
                session_response = requests.get(
                    f"{Config.BACKEND_API_URL}/api/sessions/{session_id}",
                    timeout=5
                )
                if session_response.ok:
                    session_data = session_response.json()
                    response["join_code"] = session_data.get("joinCode")
            except:
                pass
    
    return response

@app.post("/api/recording/start")
async def start_recording(class_id: str, session_title: str = None):
    """Start recording audio for transcript system"""
    global recognition_loop_instance
    if not recognition_loop_instance:
        return {"error": "Recognition not initialized"}, 400
    
    if not recognition_loop_instance.audio_recorder:
        return {"error": "Recording not enabled. Set ENABLE_AUDIO_RECORDING=true"}, 400
    
    success = recognition_loop_instance.start_recording(
        class_id=class_id,
        session_title=session_title
    )
    
    if success:
        return {"status": "recording_started"}
    else:
        return {"error": "Failed to start recording"}, 500

@app.post("/api/recording/stop")
async def stop_recording():
    """Stop recording and upload to transcript system"""
    global recognition_loop_instance
    if not recognition_loop_instance or not recognition_loop_instance.audio_recorder:
        return {"error": "Recording not enabled"}, 400
    
    session_id = recognition_loop_instance.stop_recording()
    if session_id:
        return {"status": "recording_stopped", "session_id": session_id}
    else:
        return {"error": "Failed to stop recording"}, 500

@app.get("/api/recording/status")
async def get_recording_status():
    """Get recording status"""
    global recognition_loop_instance
    if not recognition_loop_instance or not recognition_loop_instance.audio_recorder:
        return {"recording": False}
    
    return recognition_loop_instance.audio_recorder.get_status()

@app.get("/api/recognition/status")
async def get_recognition_status():
    """Get recognition status"""
    global recognition_loop_instance
    if recognition_loop_instance:
        return {
            "running": recognition_loop_instance.is_running,
            "device": recognition_loop_instance.audio_capture.device_name
        }
    return {"running": False}

# Serve static files for enrollment UI
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def root():
    """Serve enrollment page"""
    html_path = os.path.join(os.path.dirname(__file__), "static", "enrollment.html")
    if os.path.exists(html_path):
        return FileResponse(html_path)
    return {"message": "Teams Speaker Recognition Backend", "status": "running"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "teams-speaker-recognition"}

async def main():
    """Start both servers"""
    global ws_server_instance, recognition_loop_instance
    
    print("=" * 60)
    print("Teams Speaker Recognition Backend")
    print("=" * 60)
    print("\nStarting servers...")
    print("  - WebSocket: ws://127.0.0.1:8765")
    print("  - Enrollment UI: http://127.0.0.1:8000")
    print("\nPress Ctrl+C to stop\n")
    
    # Initialize components
    ws_server_instance = WebSocketServer()
    recognizer = SpeakerRecognizer()
    recognizer.data_manager = data_manager  # Share data manager
    
    # Reload students when data changes
    def reload_callback():
        recognizer.reload_students()
    
    vad = VADProcessor()
    audio_capture = AudioCapture()
    
    # Get event loop for recognition loop
    event_loop = asyncio.get_event_loop()
    
    # Create recognition loop (with optional recording integration)
    from config import Config
    
    # Enable recording if configured
    recording_enabled = Config.AUTO_RECORDING_ENABLED or os.getenv("ENABLE_AUDIO_RECORDING", "false").lower() == "true"
    
    recognition_loop_instance = RecognitionLoop(
        ws_server_instance,
        recognizer,
        vad,
        audio_capture,
        event_loop=event_loop,
        enable_recording=recording_enabled,
        backend_api_url=Config.BACKEND_API_URL
    )
    
    if recording_enabled:
        if Config.get_class_id():
            print(f"[Main] Auto-recording enabled for class: {Config.get_class_id()}")
        else:
            print("[Main] Auto-recording enabled but DEFAULT_CLASS_ID not set")
            print("[Main] Set DEFAULT_CLASS_ID environment variable or recording will not start automatically")
    
    # Start WebSocket server in background
    ws_task = asyncio.create_task(ws_server_instance.start())
    
    # Start FastAPI server
    config = uvicorn.Config(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
    server = uvicorn.Server(config)
    
    # Run both
    try:
        await asyncio.gather(ws_task, server.serve())
    finally:
        # Cleanup
        if recognition_loop_instance:
            recognition_loop_instance.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nShutting down...")
        sys.exit(0)
