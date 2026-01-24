# Teams Accessibility Overlay

A Chrome/Brave Manifest V3 extension that provides **real-time speaker identification** for hearing-impaired users during Microsoft Teams web meetings.

## Features

- **Large, high-contrast overlay** showing "Speaking: [Full Name]"
- **Near real-time updates** (<500ms) using captions, UI indicators, or manual selection
- **Always-on-top** banner readable from a distance
- **Settings panel** for font size, position, opacity, and more
- **Keyboard shortcuts** (Alt+O, Alt+S, Alt+↑/↓)
- **Privacy-first**: 100% client-side, no audio recording, no data sent anywhere
- **Resilient** to Teams UI changes using MutationObserver + structural selectors

##  Installation

1. Clone or download this repository
2. Open `chrome://extensions/` 
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select this folder
5. Pin the extension to your toolbar
6. Navigate to [teams.microsoft.com](https://teams.microsoft.com)

##  Setup Instructions

### Enable Live Captions in Teams (Recommended for best results):
1. Join a meeting
2. Click **More actions** (`...`) → **Turn on live captions**
3. Select your language
4. **Best results** when multiple participants speak clearly

### Keyboard Shortcuts:
- `Alt+O` - Toggle overlay
- `Alt+S` - Manual speaker selection  
- `Alt+↑ / Alt+↓` - Increase/decrease font size

##  Detection Strategies (Automatic Fallback)

1. **Captions** (highest accuracy): Parses live caption lines like "John Doe: Hello"
2. **UI Indicators**: Detects glowing borders/speaking icons on participant tiles
3. **Manual**: `Alt+S` to quickly pick from participant list

##  Customization

Open the extension popup to adjust:
- **Font size** (24px - 120px, default 48px)
- **Position** (top/center/bottom)
- **Background opacity**
- **Show last 3 speakers** panel
- **Debug mode** (logs + visual indicators)
- **Test mode** (simulates speaker changes)

##  Privacy & Security

**100% private** - All processing happens on your device  
 **No audio recording** or microphone access  
 **No data uploaded** to any servers  
 **Manifest V3** compliant (service worker only when needed)  
 **No network requests** beyond Chrome storage sync  

**Limitations**:
- Web version only (`teams.microsoft.com`)
- Caption accuracy depends on Teams live captions quality
- UI detection may need selector tweaks if Teams changes dramatically
- Manual selection required if auto-detection fails

## Troubleshooting

**"No speakers detected"**:
1. Enable Teams live captions first
2. Toggle Debug mode to see what's being observed
3. Use `Alt+S` for manual selection

**Overlay not showing**:
- Check if you're on `teams.microsoft.com`
- Try `Alt+O` toggle
- Reload extension in `chrome://extensions/`

**Teams updated, detection broken**:
1. Enable Debug mode
2. Check console logs for observed elements
3. Update selectors in `content_script.js`: