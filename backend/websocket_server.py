"""
WebSocket server for real-time speaker updates to extension
"""

import asyncio
import websockets
import json
from datetime import datetime
from typing import Set, Optional

class WebSocketServer:
    def __init__(self, host="127.0.0.1", port=8765):
        self.host = host
        self.port = port
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.current_state = {
            "state": "idle",
            "message": "Waiting to start",
            "speaker": None,
            "confidence": 0.0
        }
    
    async def register_client(self, websocket):
        """Register a new client"""
        self.clients.add(websocket)
        print(f"[WS] Client connected. Total clients: {len(self.clients)}")
        
        # Send current state immediately
        await self.send_status(websocket)
        if self.current_state["speaker"]:
            await self.send_speaker_update(websocket)
    
    async def unregister_client(self, websocket):
        """Unregister a client"""
        self.clients.discard(websocket)
        print(f"[WS] Client disconnected. Total clients: {len(self.clients)}")
    
    async def send_to_all(self, message: dict):
        """Send message to all connected clients"""
        if not self.clients:
            return
        
        message_str = json.dumps(message)
        disconnected = set()
        
        for client in self.clients:
            try:
                await client.send(message_str)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
        
        # Clean up disconnected clients
        for client in disconnected:
            self.clients.discard(client)
    
    async def send_speaker_update(self, websocket: Optional[websockets.WebSocketServerProtocol] = None, 
                                  name: str = None, confidence: float = 0.0):
        """Send speaker update message"""
        message = {
            "type": "speaker",
            "name": name or self.current_state.get("speaker", "(uncertain)"),
            "confidence": confidence or self.current_state.get("confidence", 0.0),
            "source": "speechbrain",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        self.current_state["speaker"] = name
        self.current_state["confidence"] = confidence
        
        if websocket:
            await websocket.send(json.dumps(message))
        else:
            await self.send_to_all(message)
    
    async def send_status(self, websocket: Optional[websockets.WebSocketServerProtocol] = None,
                         state: str = None, message: str = None):
        """Send status update"""
        status = {
            "type": "status",
            "state": state or self.current_state["state"],
            "message": message or self.current_state["message"],
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        if state:
            self.current_state["state"] = state
        if message:
            self.current_state["message"] = message
        
        if websocket:
            await websocket.send(json.dumps(status))
        else:
            await self.send_to_all(status)
    
    async def send_levels(self, rms: float, vad_state: str):
        """Send audio levels (optional debug)"""
        message = {
            "type": "levels",
            "rms": rms,
            "vad": vad_state,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        await self.send_to_all(message)
    
    async def handle_client(self, websocket, path):
        """Handle individual client connection"""
        await self.register_client(websocket)
        try:
            # Keep connection alive and handle incoming messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    # Handle client commands if needed
                    if data.get("type") == "ping":
                        await websocket.send(json.dumps({"type": "pong"}))
                except json.JSONDecodeError:
                    pass
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister_client(websocket)
    
    async def start(self):
        """Start WebSocket server"""
        print(f"[WS] Starting WebSocket server on ws://{self.host}:{self.port}")
        async with websockets.serve(self.handle_client, self.host, self.port):
            await asyncio.Future()  # Run forever
