/**
 * Extension Popup UI
 */

class Popup {
  constructor() {
    this.settings = {};
    this.wsStatus = 'unknown';
    this.recordingStatus = {
      isRecording: false,
      sessionId: null,
      joinCode: null,
      startTime: null
    };
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.render();
    this.checkBackendConnection();
    this.checkRecordingStatus();
    setInterval(() => this.checkBackendConnection(), 5000);
    setInterval(() => this.checkRecordingStatus(), 2000);
    setInterval(() => {
      if (this.recordingStatus.isRecording) {
        this.updateRecordingStatus();
      }
    }, 1000);
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

    // Recording controls
    document.getElementById('startRecording').onclick = () => this.startRecording();
    document.getElementById('stopRecording').onclick = () => this.stopRecording();
    document.getElementById('viewTranscripts').onclick = () => this.viewTranscripts();
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

  showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10000;
        max-width: 300px;
      `;
      document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    const colors = {
      'success': '#4caf50',
      'error': '#f44336',
      'warning': '#ff9800',
      'info': '#2196f3'
    };

    notification.style.cssText = `
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 16px;
      margin-bottom: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-size: 13px;
      line-height: 1.4;
      white-space: pre-line;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    if (!document.getElementById('notification-styles')) {
      style.id = 'notification-styles';
      document.head.appendChild(style);
    }

    container.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  async saveSettings() {
    await chrome.storage.sync.set(this.settings);

    // Notify content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && (tab.url.includes('teams.microsoft.com') || tab.url.includes('teams.live.com'))) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateSettings',
          settings: this.settings
        });
      } catch (error) {
        // Content script not loaded yet, settings will apply on next page load
        console.log('Content script not ready, settings saved for next load');
      }
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
    if (tab && tab.url && (tab.url.includes('teams.microsoft.com') || tab.url.includes('teams.live.com'))) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'reconnect' });
      } catch (error) {
        console.log('Content script not ready');
      }
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
        this.showNotification(message, 'success');
      } else {
        this.showNotification('Recognition already running', 'warning');
      }
    } catch (error) {
      this.showNotification('Error starting recognition: ' + error.message, 'error');
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
      this.showNotification(message, 'success');
    } catch (error) {
      this.showNotification('Error stopping recognition: ' + error.message, 'error');
    }
  }

  async startRecording() {
    const sessionTitle = document.getElementById('sessionTitle').value.trim();
    if (!sessionTitle) {
      this.showNotification('Please enter a session title', 'warning');
      return;
    }

    try {
      // Start recording with the backend
      const response = await fetch('http://127.0.0.1:8000/api/recording/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_title: sessionTitle,
          auto_create_session: true
        })
      });

      const result = await response.json();

      if (result.status === 'recording_started' || result.status === 'started') {
        this.recordingStatus.isRecording = true;
        this.recordingStatus.sessionId = result.session_id;
        this.recordingStatus.joinCode = result.join_code;
        this.recordingStatus.startTime = new Date();

        this.updateRecordingStatus();

        let message = `Recording started!\nSession: ${sessionTitle}`;
        if (result.join_code) {
          message += `\n\nJoin Code: ${result.join_code}\nShare this code with students to access the transcript later.`;
        }
        this.showNotification(message, 'success');
      } else {
        this.showNotification(result.message || 'Failed to start recording', 'error');
      }
    } catch (error) {
      this.showNotification('Error starting recording: ' + error.message, 'error');
    }
  }

  async stopRecording() {
    if (!this.recordingStatus.isRecording) {
      this.showNotification('No recording in progress', 'warning');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/recording/stop', {
        method: 'POST'
      });

      const result = await response.json();

      let message = 'Recording stopped and saved!';
      if (result.session_id) {
        message += `\n\nSession ID: ${result.session_id}`;
        if (this.recordingStatus.joinCode) {
          message += `\nJoin Code: ${this.recordingStatus.joinCode}`;
        }
        message += '\n\nThe audio will be processed automatically.';
        message += '\nStudents can access the transcript using the join code.';
      }

      this.showNotification(message, 'success');

      // Reset recording status
      this.recordingStatus.isRecording = false;
      this.recordingStatus.sessionId = null;
      this.recordingStatus.startTime = null;
      // Keep join code for reference

      this.updateRecordingStatus();
    } catch (error) {
      this.showNotification('Error stopping recording: ' + error.message, 'error');
    }
  }

  async checkRecordingStatus() {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/recording/status');
      const result = await response.json();

      if (result.recording !== this.recordingStatus.isRecording) {
        this.recordingStatus.isRecording = result.recording;
        this.recordingStatus.sessionId = result.session_id;
        this.updateRecordingStatus();
      }
    } catch (error) {
      // Silently fail - backend might not be running
    }
  }

  updateRecordingStatus() {
    const statusEl = document.getElementById('recordingStatus');
    if (!statusEl) return;

    if (this.recordingStatus.isRecording) {
      const duration = this.recordingStatus.startTime
        ? Math.floor((new Date() - this.recordingStatus.startTime) / 1000)
        : 0;
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      statusEl.textContent = `🔴 Recording... ${minutes}:${seconds.toString().padStart(2, '0')}`;
      statusEl.style.color = '#f44336';
      statusEl.style.fontWeight = 'bold';
    } else {
      statusEl.textContent = 'Not recording';
      statusEl.style.color = '#666';
      statusEl.style.fontWeight = 'normal';
    }
  }

  viewTranscripts() {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  }
}

new Popup();
