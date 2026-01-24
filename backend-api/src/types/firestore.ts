// Firestore data models

export interface Class {
  name: string;
  instructor: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface Session {
  classId: string;
  startedAt: FirebaseFirestore.Timestamp | null;
  endedAt: FirebaseFirestore.Timestamp | null;
  joinCode: string;
  title: string;
  createdBy: string;
  status: 'scheduled' | 'live' | 'processing' | 'ready' | 'error';
  audioProcessing: {
    source: string;
    sampleRate: number | null;
    durationSec: number | null;
    deletedAudio: boolean;
  };
  transcript: {
    fullText: string;
    language: string;
    createdAt: FirebaseFirestore.Timestamp | null;
  } | null;
  summary: {
    short: string;
    detailed: string;
    bulletPoints: string[];
    keyDecisions: string[];
    actionItems: string[];
    evidence: Array<{ quote: string; context: string }>;
  } | null;
  topics: Array<{
    name: string;
    description: string;
    timestamps?: Array<{ startMs: number; endMs: number }>;
  }>;
  speakers: Array<{
    speakerId: string;
    displayName: string;
    confidence?: number;
  }>;
  segments: Array<{
    startMs: number;
    endMs: number;
    speakerId: string | null;
    text: string;
  }>;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'admin' | 'student';
  createdAt: FirebaseFirestore.Timestamp;
}

export interface AccessLog {
  sessionId: string;
  userId: string | null;
  joinCode: string;
  ipAddress: string;
  timestamp: FirebaseFirestore.Timestamp;
  success: boolean;
}
