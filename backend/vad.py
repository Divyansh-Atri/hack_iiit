"""
Voice Activity Detection (VAD) for speech segmentation
"""

import numpy as np
from collections import deque

class VADProcessor:
    def __init__(self, 
                 energy_threshold=0.01,
                 frame_duration_ms=30,
                 min_speech_duration_ms=300,
                 min_silence_duration_ms=200):
        """
        Initialize VAD processor
        
        Args:
            energy_threshold: RMS energy threshold for speech detection
            frame_duration_ms: Duration of each analysis frame
            min_speech_duration_ms: Minimum duration to consider as speech
            min_silence_duration_ms: Minimum silence to end speech segment
        """
        self.energy_threshold = energy_threshold
        self.frame_duration_ms = frame_duration_ms
        self.min_speech_frames = int(min_speech_duration_ms / frame_duration_ms)
        self.min_silence_frames = int(min_silence_duration_ms / frame_duration_ms)
        
        self.speech_frames = 0
        self.silence_frames = 0
        self.is_speaking = False
        self.speech_buffer = deque(maxlen=100)  # Keep last 100 frames for analysis
    
    def compute_rms(self, audio_chunk: np.ndarray) -> float:
        """Compute RMS energy of audio chunk"""
        if len(audio_chunk) == 0:
            return 0.0
        return np.sqrt(np.mean(audio_chunk ** 2))
    
    def process_frame(self, audio_chunk: np.ndarray, sample_rate: int = 16000) -> dict:
        """
        Process a single audio frame
        
        Returns:
            dict with keys: 'vad' ('speech' or 'silence'), 'rms', 'is_speaking'
        """
        rms = self.compute_rms(audio_chunk)
        self.speech_buffer.append(rms)
        
        # Simple energy-based VAD
        is_speech = rms > self.energy_threshold
        
        if is_speech:
            self.speech_frames += 1
            self.silence_frames = 0
            
            # Start speaking if we've had enough speech frames
            if not self.is_speaking and self.speech_frames >= self.min_speech_frames:
                self.is_speaking = True
        else:
            self.silence_frames += 1
            self.speech_frames = 0
            
            # Stop speaking if we've had enough silence
            if self.is_speaking and self.silence_frames >= self.min_silence_frames:
                self.is_speaking = False
        
        return {
            "vad": "speech" if self.is_speaking else "silence",
            "rms": float(rms),
            "is_speaking": self.is_speaking
        }
    
    def reset(self):
        """Reset VAD state"""
        self.speech_frames = 0
        self.silence_frames = 0
        self.is_speaking = False
        self.speech_buffer.clear()
    
    def get_average_energy(self) -> float:
        """Get average energy over recent frames"""
        if len(self.speech_buffer) == 0:
            return 0.0
        return float(np.mean(self.speech_buffer))
