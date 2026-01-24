/**
 * Teams Accessibility Overlay - Content Script
 * Connects to WebSocket backend for real-time speaker identification
 */

class TeamsAccessibilityOverlay {
  constructor() {
    this.settings = {};
    this.currentSpeaker = null;
    this.currentConfidence = 0.0;
    this.lastSpeakers = [];
    this.ws = null;
    this.wsReconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000;
    this.wsStatus = 'disconnected'; // disconnected, connecting, connected
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.injectOverlay();
    this.setupEventListeners();
    this.connectWebSocket();
    this.startHeartbeat();
  }

  async loadSettings() {
    const data = await chrome.storage.sync.get(null);
    this.settings = {
      enabled: data.enabled ?? true,
      fontSize: data.fontSize ?? 48,
      position: data.position ?? 'top',
      bgOpacity: data.bgOpacity ?? 0.9,
      showLastSpeakers: data.showLastSpeakers ?? true,
      showConfidence: data.showConfidence ?? false,
      debug: data.debug ?? false
    };
    this.applySettings();
  }

  injectOverlay() {
    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.id = 'teams-accessibility-overlay';
    this.overlay.setAttribute('role', 'status');
    this.overlay.setAttribute('aria-live', 'polite');
    this.overlay.setAttribute('aria-atomic', 'true');
    
    // Main banner
    this.banner = document.createElement('div');
    this.banner.className = 'banner';
    
    // Speaker name
    this.speakerName = document.createElement('div');
    this.speakerName.className = 'speaker-name';
    this.speakerName.textContent = 'Connecting...';
    
    // Confidence (optional)
    this.confidenceDisplay = document.createElement('div');
    this.confidenceDisplay.className = 'confidence';
    this.confidenceDisplay.style.display = 'none';
    
    // Status indicator
    this.statusIndicator = document.createElement('div');
    this.statusIndicator.className = 'status-indicator';
    this.statusIndicator.textContent = '●';
    this.updateStatusIndicator('disconnected');
    
    // Last speakers panel (optional)
    this.lastSpeakersPanel = document.createElement('div');
    this.lastSpeakersPanel.className = 'last-speakers';
    
    this.banner.append(this.speakerName, this.confidenceDisplay, this.statusIndicator);
    this.overlay.append(this.banner, this.lastSpeakersPanel);
    
    document.documentElement.appendChild(this.overlay);
  }

  applySettings() {
    if (!this.overlay) return;
    
    this.overlay.style.display = this.settings.enabled ? 'flex' : 'none';
    this.overlay.style.fontSize = `${this.settings.fontSize}px`;
    
    const positions = {
      top: 'top: 20px; left: 50%; transform: translateX(-50%);',
      center: 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
      bottom: 'bottom: 20px; left: 50%; transform: translateX(-50%);'
    };
    this.overlay.style.cssText += positions[this.settings.position] || positions.top;
    
    this.banner.style.background = `rgba(0, 0, 0, ${this.settings.bgOpacity})`;
    this.lastSpeakersPanel.style.display = this.settings.showLastSpeakers ? 'block' : 'none';
    this.confidenceDisplay.style.display = this.settings.showConfidence || this.settings.debug ? 'block' : 'none';
  }

  updateStatusIndicator(status) {
    if (!this.statusIndicator) return;
    
    const colors = {
      'connected': '#4caf50',
      'connecting': '#ff9800',
      'disconnected': '#f44336',
      'listening': '#2196f3',
      'idle': '#9e9e9e',
      'error': '#f44336'
    };
    
    this.statusIndicator.style.color = colors[status] || colors['disconnected'];
    this.wsStatus = status;
  }

  connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.updateStatusIndicator('connecting');
    this.wsReconnectAttempts++;

    try {
      this.ws = new WebSocket('ws://127.0.0.1:8765');

      this.ws.onopen = () => {
        console.log('[Overlay] WebSocket connected');
        this.updateStatusIndicator('connected');
        this.wsReconnectAttempts = 0;
        this.speakerName.textContent = 'Listening for speakers...';
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('[Overlay] Error parsing message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Overlay] WebSocket error:', error);
        this.updateStatusIndicator('error');
      };

      this.ws.onclose = () => {
        console.log('[Overlay] WebSocket closed');
        this.updateStatusIndicator('disconnected');
        
        // Attempt reconnect
        if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => this.connectWebSocket(), this.reconnectDelay);
        } else {
          this.speakerName.textContent = 'Backend disconnected';
        }
      };
    } catch (error) {
      console.error('[Overlay] Error connecting WebSocket:', error);
      this.updateStatusIndicator('error');
      
      if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => this.connectWebSocket(), this.reconnectDelay);
      }
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'speaker':
        this.updateSpeaker(message.name, message.confidence);
        break;
      
      case 'status':
        this.handleStatus(message.state, message.message);
        break;
      
      case 'levels':
        if (this.settings.debug) {
          this.logDebug(`RMS: ${message.rms.toFixed(3)}, VAD: ${message.vad}`);
        }
        break;
      
      default:
        if (this.settings.debug) {
          console.log('[Overlay] Unknown message type:', message.type);
        }
    }
  }

  updateSpeaker(name, confidence) {
    if (!name) return;
    
    // Only update if name changed (hysteresis handled by backend)
    if (name !== this.currentSpeaker) {
      this.currentSpeaker = name;
      
      // Add to recent speakers
      this.lastSpeakers.unshift({
        name,
        confidence,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      });
      this.lastSpeakers = this.lastSpeakers.slice(0, 3);
      this.updateLastSpeakersList();
    }
    
    this.currentConfidence = confidence;
    
    // Update display
    let displayName = name;
    if (confidence < 0.55) {
      displayName = '(uncertain)';
    } else if (name === '(uncertain)') {
      displayName = this.lastSpeakers[0]?.name || 'Listening...';
    }
    
    this.speakerName.textContent = `Speaking: ${displayName}`;
    
    if (this.settings.showConfidence || this.settings.debug) {
      this.confidenceDisplay.textContent = `${(confidence * 100).toFixed(0)}%`;
    }
    
    if (this.settings.debug) {
      this.logDebug(`Speaker: ${name}, Confidence: ${(confidence * 100).toFixed(1)}%`);
    }
  }

  handleStatus(state, message) {
    this.updateStatusIndicator(state);
    
    if (state === 'error') {
      this.speakerName.textContent = `Error: ${message}`;
    } else if (state === 'idle') {
      this.speakerName.textContent = 'Idle - Waiting to start';
    } else if (state === 'listening') {
      // Keep current speaker, just update status
      if (!this.currentSpeaker) {
        this.speakerName.textContent = 'Listening for speakers...';
      }
    }
    
    if (this.settings.debug) {
      this.logDebug(`Status: ${state} - ${message}`);
    }
  }

  updateLastSpeakersList() {
    if (!this.settings.showLastSpeakers) return;
    
    this.lastSpeakersPanel.innerHTML = this.lastSpeakers
      .map(s => `<div>${this.escapeHtml(s.name)} <span>${(s.confidence * 100).toFixed(0)}%</span> <span>${s.time}</span></div>`)
      .join('');
  }

  setupEventListeners() {
    // Listen for messages from popup/service worker
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getSettings') {
        sendResponse(this.settings);
      } else if (request.action === 'updateSettings') {
        this.loadSettings();
        sendResponse({ success: true });
      } else if (request.action === 'reconnect') {
        this.connectWebSocket();
        sendResponse({ success: true });
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey) {
        switch (e.code) {
          case 'KeyO':
            e.preventDefault();
            this.toggleOverlay();
            break;
          case 'ArrowUp':
            e.preventDefault();
            this.adjustFontSize(4);
            break;
          case 'ArrowDown':
            e.preventDefault();
            this.adjustFontSize(-4);
            break;
        }
      }
    });
  }

  toggleOverlay() {
    this.settings.enabled = !this.settings.enabled;
    this.overlay.style.display = this.settings.enabled ? 'flex' : 'none';
    this.saveSettings();
  }

  adjustFontSize(delta) {
    this.settings.fontSize = Math.max(24, Math.min(120, this.settings.fontSize + delta));
    this.overlay.style.fontSize = `${this.settings.fontSize}px`;
    this.saveSettings();
  }

  async saveSettings() {
    await chrome.storage.sync.set(this.settings);
  }

  startHeartbeat() {
    // Ping WebSocket every 30 seconds to keep connection alive
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  logDebug(message) {
    if (this.settings.debug) {
      console.log('[Teams Accessibility]', message);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new TeamsAccessibilityOverlay());
} else {
  new TeamsAccessibilityOverlay();
}
