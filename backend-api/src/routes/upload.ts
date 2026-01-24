import express, { Request, Response } from 'express';
import multer from 'multer';
import { storage, db } from '../config/firebase';
import * as admin from 'firebase-admin';
import path from 'path';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3', 'audio/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files (mp3, wav, webm) are allowed.'));
    }
  },
});

// Upload audio for a session
router.post('/:sessionId/audio', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Verify session exists
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Determine file extension
    const ext = path.extname(req.file.originalname) || '.wav';
    const fileName = `sessions/${sessionId}/raw_audio${ext}`;

    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          sessionId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly readable (for STT worker access)
    // In production, consider using signed URLs or service account access
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update session with audio info
    await db.collection('sessions').doc(sessionId).update({
      'audioProcessing.source': publicUrl,
      'audioProcessing.sampleRate': null, // Will be set by STT worker
      'audioProcessing.durationSec': null, // Will be set by STT worker
      status: 'processing',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      message: 'Audio uploaded successfully',
      sessionId,
      audioUrl: publicUrl,
      fileName,
    });
  } catch (error: any) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ error: 'Failed to upload audio', message: error.message });
  }
});

export default router;
