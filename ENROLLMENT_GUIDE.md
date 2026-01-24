# Student Voice Enrollment Guide

This guide explains how to add student voice samples to the system for real-time speaker recognition.

## Overview

The system uses **voice embeddings** (mathematical representations of voice characteristics) to identify speakers. To recognize a student, you need to:

1. **Add the student** to the system (name + optional roll number)
2. **Enroll their voice** by providing audio samples (20-40 seconds recommended)
3. The system creates a voice embedding and saves it for recognition

## Quick Start

### Step 1: Start the Backend

```bash
cd backend
source ../venv/bin/activate
python main.py
```

The enrollment UI will be available at: **http://127.0.0.1:8000**

### Step 2: Open Enrollment Interface

Open your browser and navigate to:
```
http://127.0.0.1:8000
```

You should see the **Teams Speaker Enrollment** interface.

## Enrollment Methods

There are **3 ways** to enroll students:

### Method 1: Upload Pre-recorded Audio Files (Recommended)

**Best for**: Bulk enrollment, high-quality samples

1. **Add Student**:
   - Enter student name (required)
   - Enter roll number (optional)
   - Click "Add Student"

2. **Prepare Audio File**:
   - **Format**: WAV (preferred) or any audio format
   - **Duration**: 20-40 seconds of clear speech
   - **Quality**: Clear voice, minimal background noise
   - **Content**: Natural speech (reading, conversation, etc.)

3. **Upload and Enroll**:
   - Select the student from dropdown
   - Click "Choose File" and select the audio file
   - Click "Enroll from File"
   - Wait for confirmation message

**Example Audio Requirements**:
```
✅ Good: 30-second recording of student reading a paragraph
✅ Good: 25-second recording of student answering questions
❌ Bad: 5-second "Hello" (too short)
❌ Bad: Noisy recording with music/background voices
```

### Method 2: Record Directly in Browser

**Best for**: Quick enrollment, testing

1. **Add Student** (if not already added)

2. **Select Student** from dropdown in enrollment section

3. **Click the Microphone Button** (🎤)
   - Browser will ask for microphone permission
   - Grant permission

4. **Record**:
   - Speak clearly for 20-40 seconds
   - You'll see audio level visualization
   - Click the Stop button (⏹) when done

5. **Automatic Enrollment**:
   - Recording is automatically processed
   - Embedding is created and saved
   - You'll see a success message

**Tips for Recording**:
- Use a good quality microphone
- Record in a quiet environment
- Speak naturally at normal pace
- Read a paragraph or answer questions
- Aim for 20-40 seconds of speech

### Method 3: Command Line / API

**Best for**: Automation, batch processing

#### Using cURL:

```bash
# Step 1: Add student
curl -X POST http://127.0.0.1:8000/api/students \
  -F "name=John Doe" \
  -F "roll=2021CS001"

# Response will include student_id (e.g., "abc123")

# Step 2: Enroll with audio file
curl -X POST http://127.0.0.1:8000/api/students/abc123/enroll \
  -F "audio_file=@/path/to/audio.wav"
```

#### Using Python:

```python
import requests

# Add student
response = requests.post(
    "http://127.0.0.1:8000/api/students",
    data={"name": "John Doe", "roll": "2021CS001"}
)
student_id = response.json()["id"]

# Enroll with audio
with open("audio.wav", "rb") as f:
    files = {"audio_file": f}
    response = requests.post(
        f"http://127.0.0.1:8000/api/students/{student_id}/enroll",
        files=files
    )
    print(response.json())
```

## Audio Requirements

### Minimum Requirements
- **Duration**: At least 0.3 seconds (but 20-40 seconds recommended)
- **Format**: WAV, MP3, or any audio format supported by torchaudio
- **Sample Rate**: Any (automatically resampled to 16kHz)
- **Channels**: Mono or Stereo (automatically converted to mono)

### Recommended Specifications
- **Duration**: 20-40 seconds of clear speech
- **Format**: WAV (16-bit PCM)
- **Sample Rate**: 16kHz
- **Channels**: Mono
- **Bitrate**: 256 kbps or higher
- **Background Noise**: Minimal
- **Speech Quality**: Clear, natural speaking

### What Makes Good Training Audio?

✅ **Good Examples**:
- Student reading a passage from a book
- Student answering interview questions
- Student giving a presentation
- Natural conversation (student speaking only)
- Clear recording with minimal echo

❌ **Bad Examples**:
- Very short clips (< 10 seconds)
- Multiple speakers talking
- Heavy background music
- Noisy environments (cafeteria, street)
- Whispered or shouted speech
- Phone call recordings (compressed audio)

## Bulk Enrollment

### Scenario: Enroll 50 students

1. **Collect Audio Samples**:
   - Ask each student to record 30-40 seconds of speech
   - Save files with student names: `john_doe.wav`, `jane_smith.wav`, etc.

2. **Create a CSV File** (`students.csv`):
   ```csv
   name,roll,audio_file
   John Doe,2021CS001,john_doe.wav
   Jane Smith,2021CS002,jane_smith.wav
   ...
   ```

3. **Use Bulk Enrollment Script**:

```python
# bulk_enroll.py
import requests
import csv
import os

API_BASE = "http://127.0.0.1:8000/api"

def enroll_students(csv_file, audio_dir):
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Add student
            print(f"Adding {row['name']}...")
            response = requests.post(
                f"{API_BASE}/students",
                data={"name": row['name'], "roll": row['roll']}
            )
            student_id = response.json()["id"]
            
            # Enroll with audio
            audio_path = os.path.join(audio_dir, row['audio_file'])
            if os.path.exists(audio_path):
                print(f"Enrolling {row['name']}...")
                with open(audio_path, 'rb') as audio:
                    files = {"audio_file": audio}
                    response = requests.post(
                        f"{API_BASE}/students/{student_id}/enroll",
                        files=files
                    )
                    if response.ok:
                        print(f"✓ {row['name']} enrolled successfully")
                    else:
                        print(f"✗ {row['name']} enrollment failed: {response.json()}")
            else:
                print(f"✗ Audio file not found: {audio_path}")

# Run
enroll_students("students.csv", "audio_samples/")
```

Run the script:
```bash
python bulk_enroll.py
```

## Testing Recognition

After enrolling students, you can test if the system recognizes them correctly:

### Using the Web UI:

1. Go to **Test Recognition** section at http://127.0.0.1:8000
2. Upload a test audio file (different from enrollment audio)
3. Click "Test Recognition"
4. View results showing confidence scores for each student

### Expected Results:
```
Recognition Results:
• John Doe: 92.5%
• Jane Smith: 45.3%
• Bob Johnson: 38.7%

Best Match: John Doe (92.5%)
```

**Good Recognition**: 70-95% confidence
**Uncertain**: 50-70% confidence
**Poor Match**: < 50% confidence

## Troubleshooting

### Issue: "Audio too short" error

**Solution**: Ensure audio is at least 0.3 seconds, but preferably 20-40 seconds.

### Issue: Low recognition confidence

**Possible Causes**:
- Enrollment audio was too short
- Poor quality enrollment audio (noisy, distorted)
- Different recording conditions (enrollment vs. recognition)
- Voice has changed significantly

**Solutions**:
- Re-enroll with longer, clearer audio (30-40 seconds)
- Use similar recording conditions for enrollment and recognition
- Ensure enrollment audio has minimal background noise

### Issue: "Student not found" error

**Solution**: Make sure you've added the student first before enrolling.

### Issue: Browser microphone not working

**Solutions**:
- Check browser permissions (allow microphone access)
- Use HTTPS or localhost (required for microphone access)
- Try a different browser (Chrome/Brave recommended)

### Issue: Recognition not working in real-time

**Solution**: After enrolling new students, the system automatically reloads. If recognition is already running, it will pick up new students immediately.

## Data Storage

### Where is the data stored?

```
backend/data/
├── students.json          # Student metadata (names, IDs, roll numbers)
└── embeddings/
    ├── abc123.npy        # Voice embedding for student abc123
    ├── def456.npy        # Voice embedding for student def456
    └── ...
```

### What is stored?

- **students.json**: Student information (name, roll, ID, enrollment status)
- **embeddings/*.npy**: Voice embeddings (192-dimensional vectors)
- **NO raw audio is stored** (only embeddings for privacy)

### Backup and Transfer

To backup enrolled students:
```bash
# Backup
cp -r backend/data/students.json backend/data/embeddings/ /path/to/backup/

# Restore
cp -r /path/to/backup/students.json /path/to/backup/embeddings/ backend/data/
```

## API Reference

### List Students
```http
GET /api/students
```

**Response**:
```json
{
  "students": [
    {
      "id": "abc123",
      "name": "John Doe",
      "roll": "2021CS001",
      "enrolled": true
    }
  ]
}
```

### Add Student
```http
POST /api/students
Content-Type: multipart/form-data

name: John Doe
roll: 2021CS001
```

**Response**:
```json
{
  "id": "abc123",
  "name": "John Doe",
  "roll": "2021CS001"
}
```

### Enroll Student
```http
POST /api/students/{student_id}/enroll
Content-Type: multipart/form-data

audio_file: <binary audio data>
```

**Response**:
```json
{
  "success": true,
  "student_id": "abc123",
  "duration_seconds": 32.5,
  "embedding_shape": [192]
}
```

### Delete Student
```http
DELETE /api/students/{student_id}
```

**Response**:
```json
{
  "success": true
}
```

### Test Recognition
```http
POST /api/test-recognition
Content-Type: multipart/form-data

audio_file: <binary audio data>
```

**Response**:
```json
{
  "results": [
    {
      "student_id": "abc123",
      "name": "John Doe",
      "confidence": 0.925
    }
  ],
  "best_match": {
    "student_id": "abc123",
    "name": "John Doe",
    "confidence": 0.925
  }
}
```

## Best Practices

### For Enrollment:
1. ✅ Use 20-40 seconds of clear speech
2. ✅ Record in a quiet environment
3. ✅ Use good quality microphone
4. ✅ Have student speak naturally
5. ✅ Test recognition after enrollment
6. ✅ Re-enroll if confidence is low

### For Recognition:
1. ✅ Use similar audio quality as enrollment
2. ✅ Ensure clear audio input
3. ✅ Configure audio routing correctly (PipeWire virtual sink)
4. ✅ Monitor recognition confidence in real-time

### For Privacy:
1. ✅ Obtain consent before enrolling
2. ✅ Inform students about voice data storage
3. ✅ Only store embeddings (not raw audio)
4. ✅ Provide option to delete enrollment
5. ✅ Secure the backend/data directory

## Next Steps

After enrolling students:

1. **Test the System**: Use test recognition to verify enrollment quality
2. **Start Real-Time Recognition**: Run the backend and use the browser extension
3. **Configure Audio Routing**: Set up PipeWire virtual sink for Teams audio
4. **Load Extension**: Install the browser extension in Chrome/Brave
5. **Start a Meeting**: Join a Teams meeting and test speaker identification

For complete setup instructions, see **HOW_TO_RUN.md**.
