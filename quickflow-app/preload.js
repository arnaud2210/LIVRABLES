const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Screen capture
    getSources: () => ipcRenderer.invoke('get-sources'),
    captureScreenshot: (sourceId) => ipcRenderer.invoke('capture-screenshot', sourceId),

    // File operations
    saveSession: (sessionData) => ipcRenderer.invoke('save-session', sessionData),
    savePdf: (filename, data) => ipcRenderer.invoke('save-pdf', { filename, data }),
    openOutputFolder: () => ipcRenderer.invoke('open-output-folder'),

    // API Key management
    getApiKey: () => ipcRenderer.invoke('get-api-key'),
    saveApiKey: (apiKey) => ipcRenderer.invoke('save-api-key', apiKey)
});
