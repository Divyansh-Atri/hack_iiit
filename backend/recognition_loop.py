"""
Real-time recognition processing loop
"""

import asyncio
import numpy as np
from audio_capture import AudioCapture
from vad import VADProcessor
from speaker_recognition import SpeakerRecognizer
from websocket_server import WebSocketServer
from audio_recorder import AudioRecorder
from typing import Optional
from datetime import datetime

class RecognitionLoop:
    def __init__(self, 
                 ws_server: WebSocketServer,
                 recognizer: SpeakerRecognizer,
                 vad: VADProcessor,
                 audio_capture: AudioCapture,
                 device_index: Optional[int] = None,
                 device_name: Optional[str] = None,
                 event_loop: Optional[asyncio.AbstractEventLoop] = None,
                 enable_recording: bool = False,
                 backend_api_url: str = "http://localhost:3001"):
        self.ws_server = ws_server
        self.recognizer = recognizer
        self.vad = vad
        self.audio_capture = audio_capture
        self.is_running = False
        self.last_status_update = 0
        self.event_loop = event_loop
        
        # Audio recorder for transcript system integration
        self.audio_recorder = None
        self.continuous_processor = None
        if enable_recording:
            self.audio_recorder = AudioRecorder(
                sample_rate=audio_capture.sample_rate,
                backend_api_url=backend_api_url
            )
            
            # Initialize continuous processor if real-time processing enabled
            from config import Config
            if Config.ENABLE_REAL_TIME_PROCESSING:
                from continuous_processor import ContinuousProcessor
                self.continuous_processor = ContinuousProcessor(
                    audio_recorder=self.audio_recorder,
                    backend_api_url=backend_api_url,
                    process_interval_minutes=Config.PROCESS_INTERVAL_MINUTES
                )
        
        # Set audio device
        if device_name:
            self.audio_capture.set_device(device_name=device_name)
        elif device_index is not None:
            self.audio_capture.set_device(device_index=device_index)
        else:
            # Auto-select monitor device
            self.audio_capture.set_device()
    
    async def process_audio_chunk(self, audio: np.ndarray):
        """Process a chunk of audio"""
        try:
            # Record audio if recorder is enabled
            if self.audio_recorder:
                self.audio_recorder.add_audio_chunk(audio)
            
            # VAD processing
            vad_result = self.vad.process_frame(audio, self.audio_capture.sample_rate)
            
            # Only process if speech detected
            if vad_result["is_speaking"]:
                # Always print for debugging
                print(f"[RecognitionLoop] Speech detected! (RMS: {vad_result['rms']:.4f})")
                
                # Speaker recognition
                speaker_id, confidence, should_update = self.recognizer.process_with_hysteresis(
                    audio, 
                    self.audio_capture.sample_rate
                )
                
                # Debug log for recognition result
                print(f"[RecognitionLoop] Result: {speaker_id} ({confidence:.1%}) - Update: {should_update}")
                
                if should_update or speaker_id != self.recognizer.current_speaker:
                    speaker_name = self.recognizer.get_speaker_name(speaker_id)
                    await self.ws_server.send_speaker_update(
                        name=speaker_name,
                        confidence=confidence
                    )
                
                # Send audio levels in debug mode (optional)
                # await self.ws_server.send_levels(vad_result["rms"], vad_result["vad"])
            
            # Status heartbeat every 5 seconds
            import time
            current_time = time.time()
            if current_time - self.last_status_update > 5.0:
                status_msg = f"Listening... ({len(self.recognizer.embeddings)} speakers enrolled)"
                if self.audio_recorder and self.audio_recorder.is_recording:
                    status = self.audio_recorder.get_status()
                    status_msg += f" | Recording: {status.get('duration_seconds', 0):.0f}s"
                await self.ws_server.send_status(
                    state="listening",
                    message=status_msg
                )
                self.last_status_update = current_time
        
        except Exception as e:
            print(f"[RecognitionLoop] Error processing audio: {e}")
            await self.ws_server.send_status(
                state="error",
                message=f"Processing error: {str(e)}"
            )
    
    def start(self, auto_start_recording: bool = True):
        """Start recognition loop"""
        if self.is_running:
            print("[RecognitionLoop] Already running")
            return
        
        print("[RecognitionLoop] Starting recognition...")
        self.is_running = True
        
        # Start audio capture with callback
        self.audio_capture.start_capture(self._audio_callback)
        
        # Auto-start recording if enabled and recorder exists
        if auto_start_recording and self.audio_recorder:
            from config import Config
            class_id = Config.get_class_id()
            if class_id:
                print(f"[RecognitionLoop] Auto-starting recording for class: {class_id}")
                success = self.audio_recorder.start_recording(
                    class_id=class_id,
                    session_title=f"Live Session {datetime.now().strftime('%Y-%m-%d %H:%M')}"
                )
                
                # Start continuous processing if enabled
                if success and self.continuous_processor and self.audio_recorder.session_id:
                    self.continuous_processor.start(self.audio_recorder.session_id)
            else:
                print("[RecognitionLoop] Recording enabled but DEFAULT_CLASS_ID not set. Recording will not start automatically.")
        
        # Update status
        asyncio.create_task(self.ws_server.send_status(
            state="listening",
            message="Recognition started"
        ))
    
    def stop(self):
        """Stop recognition loop"""
        if not self.is_running:
            return
        
        print("[RecognitionLoop] Stopping recognition...")
        self.is_running = False
        self.audio_capture.stop_capture()
        self.vad.reset()
        
        # Stop continuous processing
        if self.continuous_processor:
            self.continuous_processor.stop()
        
        # Stop recording and upload if enabled
        if self.audio_recorder:
            session_id = self.audio_recorder.stop_recording()
            if session_id:
                print(f"[RecognitionLoop] Recording saved to session: {session_id}")
                print(f"[RecognitionLoop] Process with: ./scripts/process_session.sh {session_id}")
        
        # Update status
        asyncio.create_task(self.ws_server.send_status(
            state="idle",
            message="Recognition stopped"
        ))
    
    def start_recording(self, class_id: str, session_title: str = None):
        """Start recording audio for transcript system"""
        if self.audio_recorder:
            return self.audio_recorder.start_recording(
                class_id=class_id,
                session_title=session_title
            )
        else:
            print("[RecognitionLoop] Recording not enabled. Set enable_recording=True")
            return False
    
    def stop_recording(self):
        """Stop recording and upload to transcript system"""
        if self.audio_recorder:
            return self.audio_recorder.stop_recording()
        return None
    
    def _audio_callback(self, audio: np.ndarray):
        """Synchronous callback from audio capture"""
        # Schedule async processing
        if not self.is_running:
            return
        
        try:
            # Use provided event loop or get current
            loop = self.event_loop
            if loop is None:
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    # No running loop, try to get event loop
                    loop = asyncio.get_event_loop()
            
            # Schedule coroutine in the event loop
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    self.process_audio_chunk(audio),
                    loop
                )
            else:
                # Loop not running, create task
                asyncio.create_task(self.process_audio_chunk(audio))
        except Exception as e:
            print(f"[RecognitionLoop] Error scheduling audio processing: {e}")
