#!/usr/bin/env python3
"""
STT Worker - Processes audio files and generates transcripts
Uses faster-whisper for local, privacy-friendly speech-to-text
"""

import os
import sys
import json
import tempfile
import requests
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore, storage
from dotenv import load_dotenv
from faster_whisper import WhisperModel
from pydub import AudioSegment

# Load environment variables
load_dotenv()

# Initialize Firebase
if not firebase_admin._apps:
    private_key = os.getenv('FIREBASE_PRIVATE_KEY', '')
    
    if not private_key:
        raise ValueError('Missing FIREBASE_PRIVATE_KEY in .env file')
    
    # Remove quotes if present (from .env file)
    private_key = private_key.strip().strip('"').strip("'")
    
    # Replace escaped newlines with actual newlines
    private_key = private_key.replace('\\n', '\n')
    
    # Ensure private key has proper headers if missing
    if 'BEGIN PRIVATE KEY' not in private_key:
        private_key = f'-----BEGIN PRIVATE KEY-----\n{private_key}\n-----END PRIVATE KEY-----\n'
    
    if not os.getenv('FIREBASE_PROJECT_ID'):
        raise ValueError('Missing FIREBASE_PROJECT_ID in .env file')
    
    if not os.getenv('FIREBASE_CLIENT_EMAIL'):
        raise ValueError('Missing FIREBASE_CLIENT_EMAIL in .env file')
    
    try:
        cred = credentials.Certificate({
            'project_id': os.getenv('FIREBASE_PROJECT_ID'),
            'client_email': os.getenv('FIREBASE_CLIENT_EMAIL'),
            'private_key': private_key,
        })
        firebase_admin.initialize_app(cred)
        print('Firebase Admin initialized successfully')
    except Exception as e:
        raise ValueError(f'Failed to initialize Firebase Admin: {str(e)}')

db = firestore.client()
storage_client = storage.bucket()

# STT Configuration
WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'base')
WHISPER_DEVICE = os.getenv('WHISPER_DEVICE', 'cpu')
WHISPER_LANGUAGE = os.getenv('WHISPER_LANGUAGE', 'en') or None
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:3001')

# Initialize Whisper model (lazy load)
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print(f"Loading Whisper model: {WHISPER_MODEL} on {WHISPER_DEVICE}")
        _whisper_model = WhisperModel(WHISPER_MODEL, device=WHISPER_DEVICE)
    return _whisper_model

def download_audio(audio_url: str, output_path: str) -> str:
    """Download audio file from URL to local path"""
    print(f"Downloading audio from {audio_url}")
    response = requests.get(audio_url, stream=True)
    response.raise_for_status()
    
    with open(output_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    return output_path

def convert_audio_to_wav(input_path: str, output_path: str) -> str:
    """Convert audio file to WAV format (16kHz mono) for Whisper"""
    print(f"Converting audio to WAV: {input_path}")
    audio = AudioSegment.from_file(input_path)
    
    # Convert to mono and 16kHz (Whisper's preferred format)
    audio = audio.set_channels(1)
    audio = audio.set_frame_rate(16000)
    
    audio.export(output_path, format='wav')
    return output_path

def transcribe_audio(audio_path: str) -> tuple[List[Dict], str, str]:
    """
    Transcribe audio using Whisper
    Returns: (segments, full_text, detected_language)
    """
    print(f"Transcribing audio: {audio_path}")
    model = get_whisper_model()
    
    segments, info = model.transcribe(
        audio_path,
        language=WHISPER_LANGUAGE,
        beam_size=5,
        vad_filter=True,  # Use built-in VAD
    )
    
    detected_language = info.language
    full_text_parts = []
    segment_list = []
    
    for segment in segments:
        start_ms = int(segment.start * 1000)
        end_ms = int(segment.end * 1000)
        text = segment.text.strip()
        
        if text:
            full_text_parts.append(text)
            segment_list.append({
                'startMs': start_ms,
                'endMs': end_ms,
                'speakerId': None,  # Speaker diarization not implemented yet
                'text': text,
            })
    
    full_text = ' '.join(full_text_parts)
    
    print(f"Transcription complete: {len(segment_list)} segments, {len(full_text)} characters")
    print(f"Detected language: {detected_language}")
    
    return segment_list, full_text, detected_language

def get_audio_duration(audio_path: str) -> float:
    """Get audio duration in seconds"""
    audio = AudioSegment.from_file(audio_path)
    return len(audio) / 1000.0

def process_session(session_id: str) -> bool:
    """
    Process a session: download audio, transcribe, update Firestore, trigger summarization
    """
    try:
        print(f"\n{'='*60}")
        print(f"Processing session: {session_id}")
        print(f"{'='*60}\n")
        
        # Get session from Firestore
        session_ref = db.collection('sessions').document(session_id)
        session_doc = session_ref.get()
        
        if not session_doc.exists:
            print(f"Error: Session {session_id} not found")
            return False
        
        session_data = session_doc.to_dict()
        audio_url = session_data.get('audioProcessing', {}).get('source', '')
        
        if not audio_url:
            print(f"Error: No audio URL for session {session_id}")
            return False
        
        # Update status
        session_ref.update({
            'status': 'processing',
            'updatedAt': firestore.SERVER_TIMESTAMP,
        })
        
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Download audio
            audio_ext = Path(audio_url).suffix or '.wav'
            downloaded_path = temp_path / f'audio{audio_ext}'
            download_audio(audio_url, str(downloaded_path))
            
            # Convert to WAV if needed
            wav_path = temp_path / 'audio.wav'
            if audio_ext.lower() != '.wav':
                convert_audio_to_wav(str(downloaded_path), str(wav_path))
            else:
                # Still convert to ensure correct format
                convert_audio_to_wav(str(downloaded_path), str(wav_path))
            
            # Get audio duration
            duration_sec = get_audio_duration(str(wav_path))
            
            # Transcribe
            segments, full_text, detected_language = transcribe_audio(str(wav_path))
            
            # Update Firestore with transcript
            session_ref.update({
                'transcript': {
                    'fullText': full_text,
                    'language': detected_language,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                },
                'segments': segments,
                'audioProcessing.durationSec': duration_sec,
                'audioProcessing.sampleRate': 16000,  # Whisper uses 16kHz
                'updatedAt': firestore.SERVER_TIMESTAMP,
            })
            
            print(f"\n[SUCCESS] Transcript saved to Firestore")
            print(f"  - Segments: {len(segments)}")
            print(f"  - Duration: {duration_sec:.1f}s")
            print(f"  - Language: {detected_language}")
            
            # Trigger summarization via backend API
            try:
                print(f"\nTriggering summarization...")
                response = requests.post(
                    f"{BACKEND_API_URL}/api/sessions/{session_id}/summarize",
                    timeout=300,  # 5 minute timeout
                )
                response.raise_for_status()
                print(f"[SUCCESS] Summary generated successfully")
            except requests.exceptions.RequestException as e:
                print(f"[WARNING] Failed to trigger summarization: {e}")
                print(f"  You can manually trigger it via: POST /api/sessions/{session_id}/summarize")
            
            return True
            
    except Exception as e:
        print(f"\n[ERROR] Error processing session {session_id}: {e}")
        import traceback
        traceback.print_exc()
        
        # Update session status to error
        try:
            session_ref.update({
                'status': 'error',
                'updatedAt': firestore.SERVER_TIMESTAMP,
            })
        except:
            pass
        
        return False

def process_demo_audio(audio_path: str, session_id: Optional[str] = None):
    """
    Process a demo audio file (for testing)
    """
    print(f"\n{'='*60}")
    print(f"Processing demo audio: {audio_path}")
    print(f"{'='*60}\n")
    
    # Convert to WAV
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        wav_path = temp_path / 'audio.wav'
        convert_audio_to_wav(audio_path, str(wav_path))
        
        # Transcribe
        segments, full_text, detected_language = transcribe_audio(str(wav_path))
        duration_sec = get_audio_duration(str(wav_path))
        
        print(f"\n{'='*60}")
        print("TRANSCRIPTION RESULTS")
        print(f"{'='*60}")
        print(f"\nFull Text:\n{full_text}\n")
        print(f"\nSegments ({len(segments)}):")
        for seg in segments[:5]:  # Show first 5
            print(f"  [{seg['startMs']}ms-{seg['endMs']}ms] {seg['text']}")
        if len(segments) > 5:
            print(f"  ... and {len(segments) - 5} more")
        print(f"\nDuration: {duration_sec:.1f}s")
        print(f"Language: {detected_language}")
        
        # If session_id provided, update Firestore
        if session_id:
            session_ref = db.collection('sessions').document(session_id)
            session_ref.update({
                'transcript': {
                    'fullText': full_text,
                    'language': detected_language,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                },
                'segments': segments,
                'audioProcessing.durationSec': duration_sec,
                'audioProcessing.sampleRate': 16000,
                'updatedAt': firestore.SERVER_TIMESTAMP,
            })
            print(f"\n[SUCCESS] Saved to session {session_id}")

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python process_audio.py <session_id>     # Process session from Firestore")
        print("  python process_audio.py --demo <audio_file> [session_id]  # Process demo audio")
        sys.exit(1)
    
    if sys.argv[1] == '--demo':
        if len(sys.argv) < 3:
            print("Error: Provide audio file path for demo mode")
            sys.exit(1)
        audio_path = sys.argv[2]
        session_id = sys.argv[3] if len(sys.argv) > 3 else None
        process_demo_audio(audio_path, session_id)
    else:
        session_id = sys.argv[1]
        success = process_session(session_id)
        sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
