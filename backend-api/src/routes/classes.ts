import express, { Request, Response } from 'express';
import { db } from '../config/firebase';
import { createClassSchema } from '../utils/validation';
import * as admin from 'firebase-admin';

const router = express.Router();

// Create a new class
router.post('/create', async (req: Request, res: Response) => {
  try {
    const data = createClassSchema.parse(req.body);

    const classData = {
      name: data.name,
      instructor: data.instructor,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const classRef = await db.collection('classes').add(classData);
    
    res.status(201).json({
      classId: classRef.id,
      ...classData,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Get all classes
router.get('/', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('classes').orderBy('createdAt', 'desc').get();
    const classes = snapshot.docs.map(doc => ({
      classId: doc.id,
      ...doc.data(),
    }));

    res.json(classes);
  } catch (error: any) {
    console.error('Error listing classes:', error);
    res.status(500).json({ error: 'Failed to list classes' });
  }
});

// Get class by ID
router.get('/:classId', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const classDoc = await db.collection('classes').doc(classId).get();
    
    if (!classDoc.exists) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({
      classId: classDoc.id,
      ...classDoc.data(),
    });
  } catch (error: any) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

export default router;
