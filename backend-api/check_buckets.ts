
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) throw new Error('Missing FIREBASE_PRIVATE_KEY');

    privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });
}

async function listBuckets() {
    try {
        const [buckets] = await admin.storage().bucket('any-name').storage.getBuckets();
        console.log('Buckets:');
        buckets.forEach(bucket => {
            console.log(`- ${bucket.name}`);
        });
        if (buckets.length === 0) {
            console.log("No buckets found.");
        }
    } catch (error) {
        console.error('Error listing buckets:', error);
    }
}

listBuckets();
