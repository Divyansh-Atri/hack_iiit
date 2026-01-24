"""
Real-time speaker recognition using SpeechBrain
"""

import os
import numpy as np
import torch
import torchaudio
from speechbrain.pretrained import EncoderClassifier
from scipy.spatial.distance import cosine
from collections import deque
from typing import Dict, Optional, Tuple
import json

class SpeakerRecognizer:
    def __init__(self, 
                 data_dir="data",
                 switch_threshold=0.70,
                 low_threshold=0.55,
                 margin=0.05,
                 window_size=5,
                 consecutive_required=2):
        """
        Initialize speaker recognizer
        
        Args:
            data_dir: Directory containing students.json and embeddings/
            switch_threshold: Minimum confidence to switch speakers
            low_threshold: Below this, mark as uncertain
            margin: Minimum confidence margin over previous speaker
            window_size: Number of recent predictions to keep
            consecutive_required: Required consecutive predictions to switch
        """
        self.data_dir = data_dir
        self.embeddings_dir = os.path.join(data_dir, "embeddings")
        self.students_file = os.path.join(data_dir, "students.json")
        
        self.switch_threshold = switch_threshold
        self.low_threshold = low_threshold
        self.margin = margin
        self.window_size = window_size
        self.consecutive_required = consecutive_required
        
        # Load SpeechBrain model
        print("[Recognition] Loading SpeechBrain model...")
        self.classifier = EncoderClassifier.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            run_opts={"device": "cpu"}
        )
        print("[Recognition] Model loaded")
        
        # State
        self.students = {}
        self.embeddings = {}
        self.current_speaker = None
        self.current_confidence = 0.0
        self.prediction_window = deque(maxlen=window_size)
        
        # Load enrolled students
        self.load_students()
    
    def load_students(self):
        """Load student data and embeddings"""
        if not os.path.exists(self.students_file):
            print(f"[Recognition] No students file found at {self.students_file}")
            return
        
        try:
            with open(self.students_file, 'r') as f:
                self.students = json.load(f)
            
            # Load embeddings
            for student_id, student_data in self.students.items():
                embedding_path = os.path.join(self.embeddings_dir, f"{student_id}.npy")
                if os.path.exists(embedding_path):
                    self.embeddings[student_id] = np.load(embedding_path)
                    print(f"[Recognition] Loaded embedding for {student_data['name']}")
                else:
                    print(f"[Recognition] Warning: No embedding for {student_data['name']}")
            
            print(f"[Recognition] Loaded {len(self.embeddings)} enrolled speakers")
        except Exception as e:
            print(f"[Recognition] Error loading students: {e}")
    
    def reload_students(self):
        """Reload students (called after enrollment)"""
        self.students = {}
        self.embeddings = {}
        self.load_students()
    
    def compute_embedding(self, audio: np.ndarray, sample_rate: int = 16000) -> np.ndarray:
        """
        Compute speaker embedding from audio
        
        Args:
            audio: Audio array (1D numpy array)
            sample_rate: Sample rate (should be 16000 for SpeechBrain)
        
        Returns:
            Embedding vector
        """
        # Convert to tensor and ensure correct shape
        if isinstance(audio, np.ndarray):
            audio_tensor = torch.from_numpy(audio).float()
        else:
            audio_tensor = audio.float()
        
        # Ensure mono and correct shape: (1, samples)
        if len(audio_tensor.shape) == 1:
            audio_tensor = audio_tensor.unsqueeze(0)
        if len(audio_tensor.shape) == 2 and audio_tensor.shape[0] > 1:
            audio_tensor = audio_tensor[0:1, :]
        
        # Resample if needed
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            audio_tensor = resampler(audio_tensor)
        
        # Compute embedding
        with torch.no_grad():
            embedding = self.classifier.encode_batch(audio_tensor)
            embedding = embedding.squeeze().cpu().numpy()
        
        return embedding
    
    def recognize(self, audio: np.ndarray, sample_rate: int = 16000) -> Tuple[Optional[str], float, Dict[str, float]]:
        """
        Recognize speaker from audio
        
        Returns:
            (speaker_id, confidence, all_scores)
        """
        if len(self.embeddings) == 0:
            return None, 0.0, {}
        
        # Compute embedding
        try:
            test_embedding = self.compute_embedding(audio, sample_rate)
        except Exception as e:
            print(f"[Recognition] Error computing embedding: {e}")
            return None, 0.0, {}
        
        # Compute similarity scores
        scores = {}
        for student_id, ref_embedding in self.embeddings.items():
            # Cosine similarity
            u = test_embedding.flatten()
            v = ref_embedding.flatten()
            similarity = 1.0 - cosine(u, v)
            scores[student_id] = float(similarity)
        
        # Get best match
        if not scores:
            return None, 0.0, {}
        
        best_id = max(scores, key=scores.get)
        best_score = scores[best_id]
        
        return best_id, best_score, scores
    
    def process_with_hysteresis(self, audio: np.ndarray, sample_rate: int = 16000) -> Tuple[Optional[str], float, bool]:
        """
        Process audio with anti-flicker hysteresis logic
        
        Returns:
            (speaker_id, confidence, should_update)
        """
        # Recognize current frame
        speaker_id, confidence, all_scores = self.recognize(audio, sample_rate)
        
        # Add to prediction window
        self.prediction_window.append({
            "speaker_id": speaker_id,
            "confidence": confidence,
            "timestamp": len(self.prediction_window)
        })
        
        # Need enough predictions
        if len(self.prediction_window) < self.consecutive_required:
            return self.current_speaker, self.current_confidence, False
        
        # Check if new speaker has been top-1 for required consecutive frames
        recent = list(self.prediction_window)[-self.consecutive_required:]
        recent_speakers = [p["speaker_id"] for p in recent]
        
        # All recent predictions should be the same speaker
        if len(set(recent_speakers)) == 1 and recent_speakers[0] is not None:
            candidate = recent_speakers[0]
            candidate_confidence = recent[-1]["confidence"]
            
            # Decision logic
            should_switch = False
            
            if self.current_speaker is None:
                # First speaker
                should_switch = candidate_confidence >= self.switch_threshold
            elif candidate == self.current_speaker:
                # Same speaker, update confidence
                should_switch = True
            else:
                # Different speaker - check thresholds
                current_conf = self.current_confidence
                if candidate_confidence >= self.switch_threshold:
                    # High confidence switch
                    should_switch = True
                elif candidate_confidence >= current_conf + self.margin:
                    # Margin-based switch
                    should_switch = True
                elif candidate_confidence < self.low_threshold:
                    # Too low, don't switch
                    should_switch = False
                else:
                    # Keep current
                    should_switch = False
            
            if should_switch:
                self.current_speaker = candidate
                self.current_confidence = candidate_confidence
                return candidate, candidate_confidence, True
        
        # No change or uncertain
        if self.current_speaker and self.current_confidence < self.low_threshold:
            # Mark as uncertain but keep last stable speaker
            return self.current_speaker, self.current_confidence, False
        
        return self.current_speaker, self.current_confidence, False
    
    def get_speaker_name(self, student_id: Optional[str]) -> str:
        """Get speaker name from student ID"""
        if student_id is None:
            return "(uncertain)"
        if student_id in self.students:
            return self.students[student_id]["name"]
        return "(unknown)"
