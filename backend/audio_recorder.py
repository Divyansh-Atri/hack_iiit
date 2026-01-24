"""
Audio recorder for integration with transcript system
Records audio during recognition sessions and uploads to transcript system
"""

import numpy as np
import wave
import tempfile
import os
import requests
from pathlib import Path
from typing import Optional
from datetime import datetime
import threading
import queue

class AudioRecorder:
    def __init__(self, sample_rate=16000, backend_api_url="http://localhost:3001"):
        """
        Initialize audio recorder
        
        Args:
            sample_rate: Audio sample rate (should match AudioCapture)
            backend_api_url: URL of the transcript system backend API
        """
        self.sample_rate = sample_rate
        self.backend_api_url = backend_api_url
        self.is_recording = False
        self.audio_buffer = []
        self.recording_thread = None
        self.session_id = None
        self.class_id = None
        self.session_title = None
        self.lock = threading.Lock()
        
    def start_recording(self, session_id: Optional[str] = None, 
                       class_id: Optional[str] = None,
                       session_title: Optional[str] = None):
        """
        Start recording audio
        
        Args:
            session_id: Existing session ID (if None, creates new session)
            class_id: Class ID (required if creating new session)
            session_title: Session title (required if creating new session)
        
        Returns:
            True if started successfully, False otherwise
        """
        with self.lock:
            if self.is_recording:
                print("[AudioRecorder] Already recording")
                return False
            
            # Set session info
            self.class_id = class_id
            self.session_title = session_title or f"Session {datetime.now().strftime('%Y-%m-%d %H:%M')}"

            # Create session first if needed
            if not session_id and class_id:
                session_id = self._create_session()
                if not session_id:
                    print("[AudioRecorder] Failed to create session, cannot start recording")
                    return False
            
            if not session_id:
                print("[AudioRecorder] Error: session_id or class_id required")
                return False
            
            self.is_recording = True
            self.audio_buffer = []
            self.session_id = session_id
            
            print(f"[AudioRecorder] Started recording for session: {self.session_id}")
            return True
    
    def add_audio_chunk(self, audio: np.ndarray):
        """Add audio chunk to buffer (called from recognition loop)"""
        if self.is_recording:
            with self.lock:
                # Convert to int16 for WAV format
                audio_int16 = (audio * 32767).astype(np.int16)
                self.audio_buffer.append(audio_int16.tobytes())
    
    def stop_recording(self) -> Optional[str]:
        """
        Stop recording and upload to transcript system
        
        Returns:
            Session ID if successful, None otherwise
        """
        with self.lock:
            if not self.is_recording:
                return None
            
            self.is_recording = False
            
            if len(self.audio_buffer) == 0:
                print("[AudioRecorder] No audio recorded")
                return self.session_id  # Return session_id even if no audio
            
            print(f"[AudioRecorder] Stopping recording, {len(self.audio_buffer)} chunks")
            
            # Session should already exist (created in start_recording)
            if not self.session_id:
                print("[AudioRecorder] Warning: No session_id, cannot upload")
                return None
            
            # Save audio to temporary file
            audio_file = self._save_audio()
            if not audio_file:
                return self.session_id  # Return session_id even if save failed
            
            # Upload audio
            success = self._upload_audio(audio_file)
            
            # Cleanup
            if os.path.exists(audio_file):
                os.remove(audio_file)
            
            if success:
                print(f"[AudioRecorder] Audio uploaded successfully. Session ID: {self.session_id}")
                # Trigger automatic processing
                self._trigger_processing()
                return self.session_id
            else:
                return self.session_id  # Return session_id even if upload failed
    
    def _trigger_processing(self):
        """Trigger automatic processing of the session"""
        try:
            response = requests.post(
                f"{self.backend_api_url}/api/sessions/{self.session_id}/process",
                timeout=10
            )
            if response.ok:
                print(f"[AudioRecorder] Processing triggered for session: {self.session_id}")
                # Note: Actual STT processing happens via worker script
                # This just marks it as ready for processing
            else:
                print(f"[AudioRecorder] Failed to trigger processing: {response.status_code}")
        except Exception as e:
            print(f"[AudioRecorder] Error triggering processing: {e}")
            print(f"[AudioRecorder] Process manually with: ./scripts/process_session.sh {self.session_id}")
    
    def _create_session(self) -> Optional[str]:
        """Create a new session in the transcript system"""
        try:
            response = requests.post(
                f"{self.backend_api_url}/api/sessions/create",
                json={
                    "classId": self.class_id,
                    "title": self.session_title,
                    "createdBy": "real-time-recognition"
                },
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            session_id = data.get("sessionId")
            join_code = data.get("joinCode")
            
            if session_id:
                print(f"[AudioRecorder] Created session: {session_id} (Join code: {join_code})")
                return session_id
            else:
                print("[AudioRecorder] Failed to create session: no sessionId in response")
                return None
        except Exception as e:
            print(f"[AudioRecorder] Error creating session: {e}")
            return None
    
    def _save_audio(self) -> Optional[str]:
        """Save recorded audio to temporary WAV file"""
        try:
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            temp_file.close()
            
            # Write WAV file
            with wave.open(temp_file.name, 'wb') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(self.sample_rate)
                
                # Write all audio chunks
                for chunk in self.audio_buffer:
                    wav_file.writeframes(chunk)
            
            file_size = os.path.getsize(temp_file.name)
            duration = len(b''.join(self.audio_buffer)) / (self.sample_rate * 2)  # 2 bytes per sample
            print(f"[AudioRecorder] Saved audio: {file_size} bytes, {duration:.1f} seconds")
            
            return temp_file.name
        except Exception as e:
            print(f"[AudioRecorder] Error saving audio: {e}")
            return None
    
    def _upload_audio(self, audio_file: str) -> bool:
        """Upload audio file to transcript system"""
        try:
            with open(audio_file, 'rb') as f:
                files = {'audio': (os.path.basename(audio_file), f, 'audio/wav')}
                response = requests.post(
                    f"{self.backend_api_url}/api/upload/{self.session_id}/audio",
                    files=files,
                    timeout=300  # 5 minute timeout for large files
                )
                response.raise_for_status()
                print(f"[AudioRecorder] Audio uploaded successfully")
                return True
        except Exception as e:
            print(f"[AudioRecorder] Error uploading audio: {e}")
            return False
    
    def _trigger_processing(self):
        """Trigger automatic processing of the session"""
        try:
            response = requests.post(
                f"{self.backend_api_url}/api/sessions/{self.session_id}/process",
                timeout=10
            )
            if response.ok:
                print(f"[AudioRecorder] Processing triggered for session: {self.session_id}")
                # Note: Actual STT processing happens via worker script
                # This just marks it as ready for processing
            else:
                print(f"[AudioRecorder] Failed to trigger processing: {response.status_code}")
        except Exception as e:
            print(f"[AudioRecorder] Error triggering processing: {e}")
            print(f"[AudioRecorder] Process manually with: ./scripts/process_session.sh {self.session_id}")
    
    def get_status(self) -> dict:
        """Get recording status"""
        with self.lock:
            if self.is_recording:
                duration = len(b''.join(self.audio_buffer)) / (self.sample_rate * 2)
                return {
                    "recording": True,
                    "session_id": self.session_id,
                    "duration_seconds": duration,
                    "chunks": len(self.audio_buffer)
                }
            else:
                return {
                    "recording": False,
                    "session_id": self.session_id
                }
