const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Screen capture
    getSources: () => ipcRenderer.invoke('get-sources'),
    captureScreenshot: (sourceId) => ipcRenderer.invoke('capture-screenshot', sourceId),

    // Auto-capture (click detection)
    startAutoCapture: (sourceId) => ipcRenderer.invoke('start-auto-capture', sourceId),
    stopAutoCapture: () => ipcRenderer.invoke('stop-auto-capture'),
    togglePauseAutoCapture: () => ipcRenderer.invoke('toggle-pause-auto-capture'),
    getAutoCaptureStatus: () => ipcRenderer.invoke('get-auto-capture-status'),
    onAutoCapture: (callback) => {
        ipcRenderer.on('auto-capture', (event, screenshot) => callback(screenshot));
    },
    removeAutoCaptureListener: () => {
        ipcRenderer.removeAllListeners('auto-capture');
    },

    // File operations
    saveSession: (sessionData) => ipcRenderer.invoke('save-session', sessionData),
    savePdf: (filename, data) => ipcRenderer.invoke('save-pdf', { filename, data }),
    saveHtml: (filename, content) => ipcRenderer.invoke('save-html', { filename, content }),
    saveMarkdown: (folderName, markdown, images) => ipcRenderer.invoke('save-markdown', { folderName, markdown, images }),
    generateGif: (images, delay, filename) => ipcRenderer.invoke('generate-gif', { images, delay, filename }),
    openOutputFolder: () => ipcRenderer.invoke('open-output-folder'),

    // API Key management
    getApiKey: () => ipcRenderer.invoke('get-api-key'),
    saveApiKey: (apiKey) => ipcRenderer.invoke('save-api-key', apiKey)
});
