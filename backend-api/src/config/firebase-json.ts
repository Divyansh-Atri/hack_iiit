// Alternative Firebase initialization using service account JSON file
// Usage: Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to point to your JSON file
// Example: FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  
  // Option 1: Load from JSON file (if path provided)
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: serviceAccount.project_id + '.appspot.com',
      });
      console.log('Firebase Admin initialized from JSON file');
    } catch (error: any) {
      throw new Error(`Failed to load Firebase service account JSON: ${error.message}`);
    }
  } else {
    // Option 2: Use environment variables (existing method)
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('Missing FIREBASE_PRIVATE_KEY in .env file (or set FIREBASE_SERVICE_ACCOUNT_PATH)');
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
      console.log('Firebase Admin initialized from environment variables');
    } catch (error: any) {
      throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
    }
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();
