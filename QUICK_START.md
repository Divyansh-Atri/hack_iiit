# Quick Start Guide

## One-Command Installation

Run this single command to set up and start all services:

```bash
cd /home/divyansh/Hack-IIIT
./install_and_run.sh
```

The installation script performs complete setup and initialization:
1. Validates Python version compatibility
2. Creates Python virtual environment
3. Installs all required dependencies
4. Creates necessary data directories
5. Configures PipeWire virtual sink
6. Starts backend servers (WebSocket and FastAPI)
7. Opens enrollment UI in default browser
8. Creates helper scripts for management

## Post-Installation Steps

After running `./install_and_run.sh`:

1. **Backend Services Running:**
   - WebSocket Server: `ws://127.0.0.1:8765`
   - Enrollment UI: `http://127.0.0.1:8000`

2. **Load Browser Extension:**
   - Open `brave://extensions/` (or `chrome://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `Extension` directory

3. **Enroll Students:**
   - Enrollment UI should open automatically
   - Alternatively, visit: http://127.0.0.1:8000
   - Add students and record/upload audio samples

4. **Route Teams Audio:**
   - Start a Microsoft Teams meeting
   - Open `pavucontrol` (PulseAudio Volume Control)
   - **Playback Tab**: Route Teams audio output to "Virtual Speaker for Teams"
   - **Recording Tab**: Route python3.10 input to "Monitor of Virtual Speaker for Teams"

5. **Start Recognition:**
   - Click extension icon in browser toolbar
   - Click "Start" button to begin recognition

## Management Commands

```bash
# Check service status
./check_status.sh

# Stop backend services
./stop_backend.sh

# View backend logs
tail -f backend.log

# Restart backend services
./stop_backend.sh && ./install_and_run.sh
```

## Troubleshooting

**Backend Not Starting:**
- Check logs: `tail -f backend.log`
- Verify status: `./check_status.sh`
- Check port availability: `lsof -i :8765` and `lsof -i :8000`

**Virtual Sink Not Created:**
- Create manually: `pactl load-module module-null-sink sink_name=teams_speaker_capture`
- Verify creation: `pactl list short sinks | grep teams_speaker_capture`

**Extension Connection Issues:**
- Verify backend is running: `./check_status.sh`
- Click "Reconnect" button in extension popup
- Check browser console (F12) for error messages

## Background Execution

To run the backend in the background:

```bash
./install_and_run.sh > install.log 2>&1 &
```

Check service status:
```bash
./check_status.sh
```

Stop services:
```bash
./stop_backend.sh
```

---

For detailed documentation, see [README.md](README.md)
