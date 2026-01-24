// PASTE service_worker.js CODE HERE
// Service worker for handling commands, storage, and messages
chrome.runtime.onInstalled.addListener(() => {
  // Default settings
  chrome.storage.sync.set({
    enabled: true,
    fontSize: 48,
    position: 'top',
    bgOpacity: 0.9,
    showLastSpeakers: true,
    detectionMode: 'auto', // 'captions', 'ui', 'manual', 'auto'
    debug: false,
    testMode: false
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(null, sendResponse);
    return true;
  }
  if (request.action === 'saveSettings') {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle command shortcuts
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url.includes('teams.microsoft.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { action: command });
    }
  });
});