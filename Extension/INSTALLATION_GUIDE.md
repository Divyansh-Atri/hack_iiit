# Teams Accessibility Overlay - Installation Guide

## Quick Start

### Step 1: Open Browser Extensions
- Chrome: Navigate to `chrome://extensions/`
- Brave: Navigate to `brave://extensions/`
- Edge: Navigate to `edge://extensions/`

### Step 2: Enable Developer Mode
1. Look for the "Developer mode" toggle in the top-right corner
2. Turn it ON

### Step 3: Load the Extension
1. Click the "Load unpacked" button
2. Navigate to the Extension folder containing the Teams Accessibility Overlay files
3. Click "Select Folder"

### Step 4: Verify Installation
You should see:
- Teams Accessibility Overlay in your extensions list
- Version: 1.0.0
- Status: Enabled

### Step 5: Pin to Toolbar (Recommended)
1. Click the extensions icon in your browser toolbar
2. Find "Teams Accessibility Overlay"
3. Click the pin icon to keep it visible

---

## How to Use

### First Time Setup
1. Navigate to [teams.microsoft.com](https://teams.microsoft.com)
2. Join a meeting
3. Enable Live Captions in Teams:
   - Click More actions (`...`)
   - Select "Turn on live captions"
   - Choose your language

### Using the Extension
The overlay will automatically appear showing:
```
Speaking: [Full Name]
```

### Keyboard Shortcuts
- `Alt+O` - Toggle overlay on/off
- `Alt+S` - Manual speaker selection
- `Alt+↑` - Increase font size
- `Alt+↓` - Decrease font size

### Settings Panel
Click the extension icon to customize:
- Font size (24px - 120px)
- Position (top/center/bottom)
- Background opacity
- Show last 3 speakers
- Debug mode
- Test mode

---

## Troubleshooting

### Extension Not Loading
1. Make sure Developer Mode is enabled
2. Check that you selected the correct folder
3. Look for errors in the extensions page

### Overlay Not Showing
1. Verify you're on `teams.microsoft.com`
2. Try pressing `Alt+O` to toggle
3. Check if the extension is enabled
4. Reload the extension in `chrome://extensions/`

### No Speakers Detected
1. Enable Teams live captions first
2. Toggle Debug mode in settings
3. Use `Alt+S` for manual selection
4. Check browser console for errors (F12)

### Teams Updated and Detection Broken
1. Enable Debug mode
2. Check console logs (F12)
3. Report issue with console output

---

## Features

- Real-time speaker identification
- Large, high-contrast overlay
- Customizable font size and position
- Keyboard shortcuts
- Privacy-first (100% client-side)
- No audio recording
- No data uploaded
- Manifest V3 compliant

---

## Project Structure

```
teams-accessibility/
├── manifest.json          # Extension configuration
├── content_script.js      # Main detection logic
├── overlay.css           # Overlay styling
├── popup.html            # Settings UI
├── popup.js              # Settings logic
├── popup.css             # Settings styling
├── service_worker.js     # Background tasks
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # Documentation
```

---

## Privacy and Security

- 100% private - All processing on your device
- No audio recording or microphone access
- No data uploaded to any servers
- Manifest V3 compliant
- No network requests beyond Chrome storage sync

---

## Development

### Testing the Extension
1. Make changes to any file
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload the Teams page

### Debug Mode
1. Click the extension icon
2. Enable "Debug Mode"
3. Open browser console (F12)
4. Look for `[Teams Accessibility]` logs

### Test Mode
1. Click the extension icon
2. Enable "Test Mode"
3. Simulates speaker changes every 3 seconds
4. No need to be in a real meeting

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Enable Debug mode and check console logs
3. Verify all files are present in the extension folder
4. Make sure you're using Chrome/Brave/Edge (Chromium-based)

---

## License

This extension is designed for accessibility purposes.
Use responsibly and in accordance with your organization's policies.
