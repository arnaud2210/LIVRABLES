const { app, BrowserWindow, ipcMain, desktopCapturer, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let isRecording = false;
let capturedScreenshots = [];
let clickEvents = [];

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        titleBarStyle: 'default',
        backgroundColor: '#0f172a'
    });

    mainWindow.loadFile('src/index.html');
    
    // Ouvrir DevTools en mode développement
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

// Obtenir les sources d'écran disponibles
ipcMain.handle('get-sources', async () => {
    const sources = await desktopCapturer.getSources({ 
        types: ['screen', 'window'],
        thumbnailSize: { width: 1920, height: 1080 }
    });
    return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
    }));
});

// Capturer un screenshot
ipcMain.handle('capture-screenshot', async (event, sourceId) => {
    const sources = await desktopCapturer.getSources({ 
        types: ['screen', 'window'],
        thumbnailSize: { width: 1920, height: 1080 }
    });
    
    const source = sources.find(s => s.id === sourceId);
    if (source) {
        const screenshot = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            image: source.thumbnail.toDataURL(),
            clickPosition: null
        };
        return screenshot;
    }
    return null;
});

// Sauvegarder les données de session
ipcMain.handle('save-session', async (event, sessionData) => {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `session_${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(sessionData, null, 2));
    
    return filepath;
});

// Sauvegarder le PDF
ipcMain.handle('save-pdf', async (event, { filename, data }) => {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filepath = path.join(outputDir, filename);
    
    // Convertir base64 en buffer et sauvegarder
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(filepath, buffer);
    
    return filepath;
});

// Lire la clé API depuis le fichier de config
ipcMain.handle('get-api-key', async () => {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return config.openaiApiKey || null;
    }
    return null;
});

// Sauvegarder la clé API
ipcMain.handle('save-api-key', async (event, apiKey) => {
    const configPath = path.join(__dirname, 'config.json');
    let config = {};
    
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    
    config.openaiApiKey = apiKey;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    return true;
});

// Ouvrir le dossier output
ipcMain.handle('open-output-folder', async () => {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    require('electron').shell.openPath(outputDir);
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
