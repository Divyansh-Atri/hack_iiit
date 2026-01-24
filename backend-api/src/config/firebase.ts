import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('Missing FIREBASE_PRIVATE_KEY in .env file');
  }

  // Remove quotes if present (from .env file)
  privateKey = privateKey.replace(/^["']|["']$/g, '');
  
  // Replace escaped newlines with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');
  
  // Ensure private key has proper headers if missing
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
  }
  
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('Missing FIREBASE_PROJECT_ID in .env file');
  }
  
  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('Missing FIREBASE_CLIENT_EMAIL in .env file');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error: any) {
    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();
