"""
Continuous processing module for real-time transcription and summarization
Processes audio in chunks and updates summaries periodically
"""

import asyncio
import threading
import time
import requests
import numpy as np
from typing import Optional
from datetime import datetime
from audio_recorder import AudioRecorder

class ContinuousProcessor:
    def __init__(self, audio_recorder: AudioRecorder, 
                 backend_api_url: str = "http://localhost:3001",
                 process_interval_minutes: int = 10):
        """
        Initialize continuous processor
        
        Args:
            audio_recorder: AudioRecorder instance
            backend_api_url: Backend API URL
            process_interval_minutes: Process audio every N minutes
        """
        self.audio_recorder = audio_recorder
        self.backend_api_url = backend_api_url
        self.process_interval = process_interval_minutes * 60  # Convert to seconds
        self.is_processing = False
        self.processing_thread = None
        self.last_process_time = 0
        self.session_id = None
        
    def start(self, session_id: str):
        """Start continuous processing"""
        if self.is_processing:
            return
        
        self.session_id = session_id
        self.is_processing = True
        self.last_process_time = time.time()
        
        # Start processing thread
        self.processing_thread = threading.Thread(target=self._processing_loop, daemon=True)
        self.processing_thread.start()
        print(f"[ContinuousProcessor] Started continuous processing for session: {session_id}")
    
    def stop(self):
        """Stop continuous processing"""
        self.is_processing = False
        if self.processing_thread:
            self.processing_thread.join(timeout=5)
        print("[ContinuousProcessor] Stopped continuous processing")
    
    def _processing_loop(self):
        """Main processing loop"""
        while self.is_processing:
            try:
                current_time = time.time()
                elapsed = current_time - self.last_process_time
                
                if elapsed >= self.process_interval:
                    self._process_chunk()
                    self.last_process_time = current_time
                
                time.sleep(60)  # Check every minute
            except Exception as e:
                print(f"[ContinuousProcessor] Error in processing loop: {e}")
                time.sleep(60)
    
    def _process_chunk(self):
        """Process current audio chunk"""
        if not self.audio_recorder or not self.audio_recorder.is_recording:
            return
        
        try:
            # Get current audio buffer
            with self.audio_recorder.lock:
                if len(self.audio_recorder.audio_buffer) == 0:
                    return
                
                # Save current chunk to temp file
                chunk_file = self._save_chunk()
                if not chunk_file:
                    return
            
            # Upload chunk for processing
            print(f"[ContinuousProcessor] Processing audio chunk...")
            self._upload_and_process_chunk(chunk_file)
            
        except Exception as e:
            print(f"[ContinuousProcessor] Error processing chunk: {e}")
    
    def _save_chunk(self) -> Optional[str]:
        """Save current audio buffer chunk to file"""
        import tempfile
        import wave
        import os
        
        try:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            temp_file.close()
            
            with wave.open(temp_file.name, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(self.audio_recorder.sample_rate)
                
                # Write current buffer
                for chunk in self.audio_recorder.audio_buffer:
                    wav_file.writeframes(chunk)
            
            return temp_file.name
        except Exception as e:
            print(f"[ContinuousProcessor] Error saving chunk: {e}")
            return None
    
    def _upload_and_process_chunk(self, audio_file: str):
        """Upload chunk and trigger processing"""
        try:
            # Upload to a temporary session or append to main session
            # For now, we'll process the full session periodically
            # This can be enhanced to process incremental chunks
            
            # Trigger processing of the main session
            response = requests.post(
                f"{self.backend_api_url}/api/sessions/{self.session_id}/process",
                timeout=30
            )
            
            if response.ok:
                print(f"[ContinuousProcessor] Processing triggered for session: {self.session_id}")
            else:
                print(f"[ContinuousProcessor] Failed to trigger processing: {response.status_code}")
        except Exception as e:
            print(f"[ContinuousProcessor] Error uploading chunk: {e}")
