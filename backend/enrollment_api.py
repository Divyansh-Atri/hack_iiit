"""
FastAPI endpoints for enrollment web UI
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
import os
import numpy as np
import torch
import torchaudio
from speechbrain.pretrained import EncoderClassifier
from data_manager import DataManager
import tempfile
import json

# Create router instead of app
router = APIRouter(prefix="/api", tags=["enrollment"])

# Keep app for backward compatibility (will be removed from main.py)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Teams Speaker Enrollment API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
data_manager = DataManager()
classifier = None

def get_classifier():
    """Lazy load classifier"""
    global classifier
    if classifier is None:
        print("[Enrollment] Loading SpeechBrain model...")
        classifier = EncoderClassifier.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            run_opts={"device": "cpu"}
        )
        print("[Enrollment] Model loaded")
    return classifier

@router.get("/students")
async def list_students():
    """List all enrolled students"""
    return {"students": data_manager.list_students()}

@router.post("/students")
async def add_student(name: str = Form(...), roll: str = Form("")):
    """Add a new student"""
    student_id = data_manager.add_student(name, roll)
    return {"id": student_id, "name": name, "roll": roll}

@router.put("/students/{student_id}")
async def update_student(student_id: str, name: str = Form(None), roll: str = Form(None)):
    """Update student information"""
    try:
        data_manager.update_student(student_id, name, roll)
        return {"success": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    """Delete a student"""
    data_manager.delete_student(student_id)
    return {"success": True}

@router.post("/students/{student_id}/enroll")
async def enroll_student(
    student_id: str,
    audio_file: UploadFile = File(...)
):
    """
    Enroll a student from uploaded audio file
    
    Accepts WAV files. Extracts embedding and stores it.
    """
    if student_id not in data_manager.students:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
        content = await audio_file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Load audio
        signal, sr = torchaudio.load(tmp_path)
        
        # Ensure mono
        if signal.shape[0] > 1:
            signal = signal[0:1, :]
        
        # Resample to 16kHz if needed
        if sr != 16000:
            resampler = torchaudio.transforms.Resample(sr, 16000)
            signal = resampler(signal)
        
        # Check duration
        duration = signal.shape[1] / 16000
        if duration < 0.3:
            raise HTTPException(status_code=400, detail="Audio too short (minimum 0.3 seconds)")
        
        # Compute embedding
        clf = get_classifier()
        with torch.no_grad():
            embedding = clf.encode_batch(signal)
            embedding = embedding.squeeze().cpu().numpy()
        
        # Save embedding
        data_manager.save_embedding(student_id, embedding)
        
        # Reload recognizer if running
        from main import recognition_loop_instance
        if recognition_loop_instance and recognition_loop_instance.recognizer:
            recognition_loop_instance.recognizer.reload_students()
        
        return {
            "success": True,
            "student_id": student_id,
            "duration_seconds": float(duration),
            "embedding_shape": list(embedding.shape)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing audio: {str(e)}")
    finally:
        # Delete temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.post("/students/{student_id}/enroll-multiple")
async def enroll_student_multiple(
    student_id: str,
    audio_files: list[UploadFile] = File(...)
):
    """
    Enroll a student from multiple audio files (averages embeddings)
    """
    if student_id not in data_manager.students:
        raise HTTPException(status_code=404, detail="Student not found")
    
    embeddings = []
    tmp_files = []
    
    try:
        clf = get_classifier()
        
        for audio_file in audio_files:
            # Save temporarily
            tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            content = await audio_file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
            tmp_files.append(tmp_path)
            
            # Load and process
            signal, sr = torchaudio.load(tmp_path)
            if signal.shape[0] > 1:
                signal = signal[0:1, :]
            if sr != 16000:
                resampler = torchaudio.transforms.Resample(sr, 16000)
                signal = resampler(signal)
            
            with torch.no_grad():
                embedding = clf.encode_batch(signal)
                embeddings.append(embedding.squeeze().cpu().numpy())
        
        # Average embeddings
        if embeddings:
            avg_embedding = np.mean(embeddings, axis=0)
            data_manager.save_embedding(student_id, avg_embedding)
            
            return {
                "success": True,
                "student_id": student_id,
                "files_processed": len(embeddings),
                "embedding_shape": list(avg_embedding.shape)
            }
        else:
            raise HTTPException(status_code=400, detail="No valid audio files")
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing audio: {str(e)}")
    finally:
        # Clean up temp files
        for tmp_path in tmp_files:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

@router.post("/test-recognition")
async def test_recognition(audio_file: UploadFile = File(...)):
    """
    Test recognition on a WAV file (demo mode)
    """
    # Save temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
        content = await audio_file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Load audio
        signal, sr = torchaudio.load(tmp_path)
        if signal.shape[0] > 1:
            signal = signal[0:1, :]
        if sr != 16000:
            resampler = torchaudio.transforms.Resample(sr, 16000)
            signal = resampler(signal)
        
        # Compute embedding
        clf = get_classifier()
        with torch.no_grad():
            test_embedding = clf.encode_batch(signal)
            test_embedding = test_embedding.squeeze().cpu().numpy()
        
        # Compare with all enrolled students
        results = []
        for student_id, student_data in data_manager.students.items():
            embedding = data_manager.load_embedding(student_id)
            if embedding is not None:
                from scipy.spatial.distance import cosine
                similarity = 1.0 - cosine(test_embedding.flatten(), embedding.flatten())
                results.append({
                    "student_id": student_id,
                    "name": student_data["name"],
                    "confidence": float(similarity)
                })
        
        # Sort by confidence
        results.sort(key=lambda x: x["confidence"], reverse=True)
        
        return {
            "results": results,
            "best_match": results[0] if results else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing audio: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.get("/devices")
async def list_audio_devices():
    """List available audio input devices"""
    import sounddevice as sd
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
    
    return {"devices": device_list}

@router.get("/calibration")
async def get_calibration_status():
    """Get calibration status (placeholder)"""
    return {"status": "ready"}

# Register routes with the app for backward compatibility
app.include_router(router)

