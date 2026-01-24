/**
 * Extension Popup UI
 */

class Popup {
  constructor() {
    this.settings = {};
    this.wsStatus = 'unknown';
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.render();
    this.checkBackendConnection();
    setInterval(() => this.checkBackendConnection(), 5000);
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
  }

  bindEvents() {
    document.getElementById('enabled').addEventListener('change', (e) => {
      this.settings.enabled = e.target.checked;
    });

    document.getElementById('fontSizeRange').addEventListener('input', (e) => {
      this.settings.fontSize = parseInt(e.target.value);
      document.getElementById('fontSize').textContent = this.settings.fontSize;
    });

    document.getElementById('position').addEventListener('change', (e) => {
      this.settings.position = e.target.value;
    });

    document.getElementById('bgOpacity').addEventListener('input', (e) => {
      this.settings.bgOpacity = parseFloat(e.target.value);
      document.getElementById('opacityValue').textContent = 
        Math.round(this.settings.bgOpacity * 100) + '%';
    });

    document.getElementById('showLastSpeakers').addEventListener('change', (e) => {
      this.settings.showLastSpeakers = e.target.checked;
    });

    document.getElementById('showConfidence').addEventListener('change', (e) => {
      this.settings.showConfidence = e.target.checked;
    });

    document.getElementById('debug').addEventListener('change', (e) => {
      this.settings.debug = e.target.checked;
    });

    document.getElementById('fontLarger').onclick = () => this.adjustFont(4);
    document.getElementById('fontSmaller').onclick = () => this.adjustFont(-4);

    document.getElementById('save').onclick = () => this.saveSettings();
    document.getElementById('reconnect').onclick = () => this.reconnect();
    document.getElementById('enrollment').onclick = () => this.openEnrollment();
    document.getElementById('startRecognition').onclick = () => this.startRecognition();
    document.getElementById('stopRecognition').onclick = () => this.stopRecognition();
  }

  render() {
    document.getElementById('enabled').checked = this.settings.enabled;
    document.getElementById('fontSizeRange').value = this.settings.fontSize;
    document.getElementById('fontSize').textContent = this.settings.fontSize;
    document.getElementById('position').value = this.settings.position;
    document.getElementById('bgOpacity').value = this.settings.bgOpacity;
    document.getElementById('opacityValue').textContent = 
      Math.round(this.settings.bgOpacity * 100) + '%';
    document.getElementById('showLastSpeakers').checked = this.settings.showLastSpeakers;
    document.getElementById('showConfidence').checked = this.settings.showConfidence;
    document.getElementById('debug').checked = this.settings.debug;
    
    this.updateConnectionStatus();
  }

  adjustFont(delta) {
    this.settings.fontSize = Math.max(24, Math.min(120, this.settings.fontSize + delta));
    document.getElementById('fontSizeRange').value = this.settings.fontSize;
    document.getElementById('fontSize').textContent = this.settings.fontSize;
  }

  async saveSettings() {
    await chrome.storage.sync.set(this.settings);
    
    // Notify content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('teams.microsoft.com')) {
      await chrome.tabs.sendMessage(tab.id, { 
        action: 'updateSettings', 
        settings: this.settings 
      });
    }
    
    document.getElementById('save').textContent = '✅ Saved!';
    setTimeout(() => {
      document.getElementById('save').textContent = '💾 Save Settings';
    }, 1500);
  }

  async checkBackendConnection() {
    try {
      const response = await fetch('http://127.0.0.1:8000/health');
      if (response.ok) {
        this.wsStatus = 'connected';
      } else {
        this.wsStatus = 'error';
      }
    } catch (error) {
      this.wsStatus = 'disconnected';
    }
    this.updateConnectionStatus();
  }

  updateConnectionStatus() {
    const statusEl = document.getElementById('backendStatus');
    if (!statusEl) return;
    
    const statuses = {
      'connected': { text: 'Connected', color: '#4caf50' },
      'disconnected': { text: 'Disconnected', color: '#f44336' },
      'error': { text: 'Error', color: '#ff9800' },
      'unknown': { text: 'Checking...', color: '#9e9e9e' }
    };
    
    const status = statuses[this.wsStatus] || statuses['unknown'];
    statusEl.textContent = status.text;
    statusEl.style.color = status.color;
  }

  async reconnect() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('teams.microsoft.com')) {
      await chrome.tabs.sendMessage(tab.id, { action: 'reconnect' });
    }
    this.checkBackendConnection();
  }

  openEnrollment() {
    chrome.tabs.create({ url: 'http://127.0.0.1:8000' });
  }

  async startRecognition() {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/recognition/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_record: true })
      });
      const result = await response.json();
      if (result.status === 'started') {
        let message = 'Recognition started';
        if (result.recording) {
          message += '\nRecording started automatically';
          if (result.join_code) {
            message += `\nJoin code: ${result.join_code}`;
            message += '\nShare this code with students to access transcript';
          }
        }
        alert(message);
      } else {
        alert('Recognition already running');
      }
    } catch (error) {
      alert('Error starting recognition: ' + error.message);
    }
  }

  async stopRecognition() {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/recognition/stop', {
        method: 'POST'
      });
      const result = await response.json();
      let message = 'Recognition stopped';
      if (result.session_id) {
        message += `\nRecording saved to session: ${result.session_id}`;
        message += '\nAudio will be processed automatically';
      }
      alert(message);
    } catch (error) {
      alert('Error stopping recognition: ' + error.message);
    }
  }
}

new Popup();
