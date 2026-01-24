#!/usr/bin/env python3
"""
Automatic processor that watches for new sessions and processes them
Runs as a background service
"""

import os
import sys
import time
import subprocess
from pathlib import Path
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
load_dotenv()

# Initialize Firebase
if not firebase_admin._apps:
    private_key = os.getenv('FIREBASE_PRIVATE_KEY', '').strip().strip('"').strip("'").replace('\\n', '\n')
    
    if 'BEGIN PRIVATE KEY' not in private_key:
        private_key = f'-----BEGIN PRIVATE KEY-----\n{private_key}\n-----END PRIVATE KEY-----\n'
    
    cred = credentials.Certificate({
        'project_id': os.getenv('FIREBASE_PROJECT_ID'),
        'client_email': os.getenv('FIREBASE_CLIENT_EMAIL'),
        'private_key': private_key,
    })
    firebase_admin.initialize_app(cred)

db = firestore.client()

def process_session(session_id: str):
    """Process a session using the process_audio.py script"""
    script_path = Path(__file__).parent / 'process_audio.py'
    
    try:
        result = subprocess.run(
            [sys.executable, str(script_path), session_id],
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout
        )
        
        if result.returncode == 0:
            print(f"[AutoProcessor] Successfully processed session: {session_id}")
            return True
        else:
            print(f"[AutoProcessor] Error processing session {session_id}: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print(f"[AutoProcessor] Timeout processing session: {session_id}")
        return False
    except Exception as e:
        print(f"[AutoProcessor] Error running processor: {e}")
        return False

def watch_for_sessions():
    """Watch for new sessions that need processing"""
    print("[AutoProcessor] Starting automatic session processor...")
    print("[AutoProcessor] Watching for sessions with status 'processing'...")
    
    processed_sessions = set()
    
    while True:
        try:
            # Query for sessions that need processing
            sessions = db.collection('sessions')\
                .where('status', '==', 'processing')\
                .where('audioProcessing.source', '!=', '')\
                .get()
            
            for session_doc in sessions:
                session_id = session_doc.id
                session_data = session_doc.to_dict()
                
                # Skip if already processed
                if session_id in processed_sessions:
                    continue
                
                # Check if audio is uploaded
                audio_source = session_data.get('audioProcessing', {}).get('source', '')
                if not audio_source:
                    continue
                
                print(f"\n[AutoProcessor] Found new session to process: {session_id}")
                print(f"[AutoProcessor] Title: {session_data.get('title', 'N/A')}")
                
                # Process the session
                if process_session(session_id):
                    processed_sessions.add(session_id)
                else:
                    # Mark as error
                    db.collection('sessions').document(session_id).update({
                        'status': 'error',
                        'updatedAt': firestore.SERVER_TIMESTAMP,
                    })
            
            # Sleep before next check
            time.sleep(30)  # Check every 30 seconds
            
        except KeyboardInterrupt:
            print("\n[AutoProcessor] Stopping...")
            break
        except Exception as e:
            print(f"[AutoProcessor] Error in watch loop: {e}")
            time.sleep(30)

if __name__ == '__main__':
    watch_for_sessions()
