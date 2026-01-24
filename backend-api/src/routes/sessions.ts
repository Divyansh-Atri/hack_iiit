import express, { Request, Response } from 'express';
import { db } from '../config/firebase';
import { generateJoinCode, validateJoinCode } from '../utils/joinCode';
import { createSessionSchema, verifyJoinCodeSchema } from '../utils/validation';
import { generateSummary } from '../services/summarization';
import { checkRateLimit } from '../utils/rateLimit';
import * as admin from 'firebase-admin';

const router = express.Router();

// Create a new session
router.post('/create', async (req: Request, res: Response) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const joinCode = generateJoinCode();

    // Verify class exists
    const classDoc = await db.collection('classes').doc(data.classId).get();
    if (!classDoc.exists) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const sessionData = {
      classId: data.classId,
      startedAt: null,
      endedAt: null,
      joinCode,
      title: data.title,
      createdBy: data.createdBy,
      status: 'scheduled' as const,
      audioProcessing: {
        source: '',
        sampleRate: null,
        durationSec: null,
        deletedAudio: false,
      },
      transcript: null,
      summary: null,
      topics: [],
      speakers: [],
      segments: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const sessionRef = await db.collection('sessions').add(sessionData);
    
    res.status(201).json({
      sessionId: sessionRef.id,
      joinCode,
      ...sessionData,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session by ID (requires join code verification or admin)
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const joinCode = req.query.joinCode as string | undefined;

    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionDoc.data()!;

    // Verify join code if provided
    if (joinCode && session.joinCode !== joinCode) {
      return res.status(403).json({ error: 'Invalid join code' });
    }

    res.json({
      sessionId: sessionDoc.id,
      ...session,
    });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Verify join code and get session
router.post('/join', async (req: Request, res: Response) => {
  try {
    const { joinCode } = verifyJoinCodeSchema.parse(req.body);

    if (!validateJoinCode(joinCode)) {
      return res.status(400).json({ error: 'Invalid join code format' });
    }

    // Rate limiting
    const clientId = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimit = checkRateLimit(`join:${clientId}`);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many attempts. Please try again later.',
        resetAt: rateLimit.resetAt,
      });
    }

    const sessionsSnapshot = await db.collection('sessions')
      .where('joinCode', '==', joinCode)
      .limit(1)
      .get();

    if (sessionsSnapshot.empty) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionDoc = sessionsSnapshot.docs[0];
    const session = sessionDoc.data();

    // Log access attempt
    await db.collection('accessLogs').add({
      sessionId: sessionDoc.id,
      userId: null,
      joinCode,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: true,
    });

    res.json({
      sessionId: sessionDoc.id,
      ...session,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// List all sessions (admin only - add auth middleware later)
router.get('/', async (req: Request, res: Response) => {
  try {
    const classId = req.query.classId as string | undefined;
    let query: admin.firestore.Query = db.collection('sessions');

    if (classId) {
      query = query.where('classId', '==', classId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const sessions = snapshot.docs.map(doc => ({
      sessionId: doc.id,
      ...doc.data(),
    }));

    res.json(sessions);
  } catch (error: any) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// Trigger processing (after audio upload)
router.post('/:sessionId/process', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update status to processing
    await db.collection('sessions').doc(sessionId).update({
      status: 'processing',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Note: Actual STT processing is handled by Python worker
    // This endpoint just marks the session as ready for processing
    // The worker will update the session when done

    res.json({ message: 'Processing started', sessionId });
  } catch (error: any) {
    console.error('Error starting processing:', error);
    res.status(500).json({ error: 'Failed to start processing' });
  }
});

// Generate summary (called after transcript is ready)
router.post('/:sessionId/summarize', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionDoc.data()!;

    if (!session.transcript?.fullText) {
      return res.status(400).json({ error: 'Transcript not available' });
    }

    const summary = await generateSummary(
      session.transcript.fullText,
      session.segments || [],
      {
        title: session.title,
        duration: session.audioProcessing.durationSec || undefined,
      }
    );

    // Update session with summary
    await db.collection('sessions').doc(sessionId).update({
      summary,
      topics: summary.topics,
      status: 'ready',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ summary, sessionId });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    
    // Update session status to error
    await db.collection('sessions').doc(sessionId).update({
      status: 'error',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(500).json({ error: 'Failed to generate summary', message: error.message });
  }
});

export default router;
