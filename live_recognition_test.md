# Quick Live Recognition Test

## Test if live recognition works now:

1. **Play audio in Chrome:**
   - Open a YouTube video in Chrome
   - Play it with sound

2. **Check backend logs:**
   ```bash
   tail -f logs/realtime-backend.log
   ```

3. **Look for:** Messages about speech detection or VAD activity

4. **If you see activity:** The system might already be capturing audio!

## If no activity detected:

The audio routing is more complex than expected. Here are your options:

### Option 1: Use PulseAudio/PipeWire GUI Tool

Install `pavucontrol`:
```bash
sudo apt install pavucontrol
```

Then:
1. Run `pavucontrol`
2. Go to "Playback" tab
3. Find Chrome
4. Change output to "Virtual Speaker for Teams"

### Option 2: Simpler Alternative - Screen Share Audio

Instead of complex routing:
1. In Teams, use "Share Screen" with "Include system audio"
2. This captures the audio directly
3. Backend can process it

### Option 3: Accept Current Functionality

The system works great for:
- Audio file processing
- Offline transcript generation  
- Recording and processing later

Live recognition requires system-level audio configuration that varies by Linux distribution and audio system.

## My Recommendation:

Try the YouTube test first. If the backend logs show activity, it might already be working!

If not, consider using the system for offline processing, which is already fully functional.
