"""
Audio capture from PipeWire/PulseAudio using sounddevice
"""

import sounddevice as sd
import numpy as np
from typing import Optional, Callable
import queue
import threading

class AudioCapture:
    def __init__(self, sample_rate=16000, chunk_duration=1.0, hop_duration=0.5):
        """
        Initialize audio capture
        
        Args:
            sample_rate: Target sample rate (16000 for SpeechBrain)
            chunk_duration: Duration of each analysis chunk in seconds
            hop_duration: Hop size between chunks in seconds
        """
        self.sample_rate = sample_rate
        self.chunk_samples = int(chunk_duration * sample_rate)
        self.hop_samples = int(hop_duration * sample_rate)
        
        self.device_index = None
        self.device_name = None
        self.stream = None
        self.is_capturing = False
        self.audio_queue = queue.Queue()
        self.callback = None
        
        # Buffer for overlapping windows
        self.audio_buffer = np.zeros(self.chunk_samples, dtype=np.float32)
        self.buffer_pos = 0
    
    def list_devices(self) -> list:
        """List available audio input devices"""
        devices = sd.query_devices()
        device_list = []
        
        for i, device in enumerate(devices):
            if device['max_input_channels'] > 0:
                device_list.append({
                    "index": i,
                    "name": device['name'],
                    "channels": device['max_input_channels'],
                    "sample_rate": device['default_samplerate']
                })
        
        return device_list
    
    def find_monitor_device(self) -> Optional[int]:
        """Find a device with 'monitor' in the name (virtual sink)"""
        devices = self.list_devices()
        for device in devices:
            if 'monitor' in device['name'].lower():
                return device['index']
        return None
    
    def set_device(self, device_index: Optional[int] = None, device_name: Optional[str] = None):
        """
        Set audio input device
        
        Args:
            device_index: Device index (from list_devices)
            device_name: Device name (partial match)
        """
        if device_name:
            devices = self.list_devices()
            for device in devices:
                if device_name.lower() in device['name'].lower():
                    self.device_index = device['index']
                    self.device_name = device['name']
                    print(f"[Audio] Selected device: {device['name']} (index {device['index']})")
                    return
        
        if device_index is not None:
            self.device_index = device_index
            devices = self.list_devices()
            if device_index < len(devices):
                self.device_name = devices[device_index]['name']
                print(f"[Audio] Selected device: {self.device_name} (index {device_index})")
            return
        
        # Default: try to find monitor device first, then try pipewire
        monitor_idx = self.find_monitor_device()
        if monitor_idx is not None:
            self.device_index = monitor_idx
            devices = self.list_devices()
            self.device_name = devices[monitor_idx]['name']
            print(f"[Audio] Auto-selected monitor device: {self.device_name}")
        else:
            # Try pipewire device which gives access to all PipeWire streams
            devices = self.list_devices()
            for device in devices:
                if 'pipewire' in device['name'].lower():
                    self.device_index = device['index']
                    self.device_name = device['name']
                    print(f"[Audio] Using PipeWire device: {self.device_name} (index {device['index']})")
                    print(f"[Audio] This should capture from virtual audio devices")
                    return
            
            # Fallback to default input
            self.device_index = None
            self.device_name = "default"
            print(f"[Audio] Using default input device")
    
    def _audio_callback(self, indata, frames, time, status):
        """Callback for audio stream"""
        if status:
            print(f"[Audio] Status: {status}")
        
        # Convert to mono and float32
        if indata.shape[1] > 1:
            audio = np.mean(indata, axis=1).astype(np.float32)
        else:
            audio = indata[:, 0].astype(np.float32)
        
        # Add to buffer
        remaining = len(audio)
        start_pos = 0
        
        while remaining > 0:
            available = self.chunk_samples - self.buffer_pos
            to_copy = min(available, remaining)
            
            self.audio_buffer[self.buffer_pos:self.buffer_pos + to_copy] = audio[start_pos:start_pos + to_copy]
            self.buffer_pos += to_copy
            remaining -= to_copy
            start_pos += to_copy
            
            # If buffer is full, process and shift
            if self.buffer_pos >= self.chunk_samples:
                # Copy chunk
                chunk = self.audio_buffer.copy()
                
                # Shift buffer by hop size
                self.audio_buffer[:-self.hop_samples] = self.audio_buffer[self.hop_samples:]
                self.buffer_pos -= self.hop_samples
                
                # Queue for processing
                if self.callback:
                    try:
                        self.callback(chunk)
                    except Exception as e:
                        print(f"[Audio] Callback error: {e}")
    
    def start_capture(self, callback: Callable[[np.ndarray], None]):
        """Start capturing audio"""
        if self.is_capturing:
            self.stop_capture()
        
        self.callback = callback
        
        try:
            self.stream = sd.InputStream(
                device=self.device_index,
                channels=1,
                samplerate=self.sample_rate,
                dtype=np.float32,
                blocksize=int(self.sample_rate * 0.1),  # 100ms blocks
                callback=self._audio_callback
            )
            self.stream.start()
            self.is_capturing = True
            print(f"[Audio] Started capture from {self.device_name}")
        except Exception as e:
            print(f"[Audio] Error starting capture: {e}")
            raise
    
    def stop_capture(self):
        """Stop capturing audio"""
        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.stream = None
        self.is_capturing = False
        self.callback = None
        self.buffer_pos = 0
        self.audio_buffer.fill(0)
        print("[Audio] Stopped capture")
