const { app, BrowserWindow, ipcMain, desktopCapturer, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { uIOhook, UiohookKey } = require('uiohook-napi');

let mainWindow;
let isRecording = false;
let capturedScreenshots = [];
let clickEvents = [];

// Auto-capture state
let autoCapture = {
    enabled: false,
    paused: false,
    sourceId: null,
    lastCaptureTime: 0,
    minDelay: 800, // Minimum 800ms between captures
    captureCount: 0
};

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
            sourceName: source.name, // Ajout du nom de la fenêtre/écran pour le contexte IA
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

// Sauvegarder le HTML standalone
ipcMain.handle('save-html', async (event, { filename, content }) => {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, content, 'utf-8');
    return filepath;
});

// Sauvegarder le Markdown avec images
ipcMain.handle('save-markdown', async (event, { folderName, markdown, images }) => {
    const baseDir = path.join(__dirname, 'output', folderName);
    const imagesDir = path.join(baseDir, 'images');

    // Créer les répertoires
    fs.mkdirSync(imagesDir, { recursive: true });

    // Sauvegarder chaque image
    images.forEach((img, i) => {
        const base64Data = img.base64.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(path.join(imagesDir, `step_${i + 1}.png`), buffer);
    });

    // Sauvegarder le markdown
    fs.writeFileSync(path.join(baseDir, 'procedure.md'), markdown, 'utf-8');
    return baseDir;
});

// Générer un GIF animé
ipcMain.handle('generate-gif', async (event, { images, delay, filename }) => {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        const sharp = require('sharp');
        const { GIFEncoder, quantize, applyPalette } = require('gifenc');

        const width = 800;
        const height = 450;

        // Créer l'encodeur GIF
        const gif = GIFEncoder();

        // Traiter chaque image
        for (const imgBase64 of images) {
            const base64Data = imgBase64.split(',')[1];
            const inputBuffer = Buffer.from(base64Data, 'base64');

            // Redimensionner et convertir en raw RGBA avec sharp
            const { data } = await sharp(inputBuffer)
                .resize(width, height, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
                .raw()
                .ensureAlpha()
                .toBuffer({ resolveWithObject: true });

            // Quantifier les couleurs (max 256 pour GIF)
            const palette = quantize(data, 256);
            // Réduire chaque pixel à son index de palette
            const indexed = applyPalette(data, palette);

            // Ajouter le frame avec le délai en millisecondes
            gif.writeFrame(indexed, width, height, { palette, delay });
        }

        // Finaliser le GIF
        gif.finish();

        const outputPath = path.join(outputDir, filename);
        fs.writeFileSync(outputPath, Buffer.from(gif.bytes()));
        return outputPath;
    } catch (error) {
        console.error('Erreur génération GIF:', error);
        throw error;
    }
});

// ==========================================
// Auto-Capture: Mouse Click Detection
// ==========================================

// Handle mouse click events
uIOhook.on('mousedown', async (e) => {
    // Only capture on left click (button 1)
    if (e.button !== 1) return;

    // Check if auto-capture is enabled and not paused
    if (!autoCapture.enabled || autoCapture.paused) return;

    // Check minimum delay between captures
    const now = Date.now();
    if (now - autoCapture.lastCaptureTime < autoCapture.minDelay) return;

    // Check if click is on the QuickFlow window (ignore our own window)
    if (mainWindow && mainWindow.isFocused()) return;

    // Capture screenshot
    try {
        autoCapture.lastCaptureTime = now;
        autoCapture.captureCount++;

        const sources = await desktopCapturer.getSources({
            types: ['screen', 'window'],
            thumbnailSize: { width: 1920, height: 1080 }
        });

        const source = sources.find(s => s.id === autoCapture.sourceId);
        if (source && mainWindow) {
            const screenshot = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                image: source.thumbnail.toDataURL(),
                sourceName: source.name,
                clickPosition: { x: e.x, y: e.y }
            };

            // Send to renderer
            mainWindow.webContents.send('auto-capture', screenshot);
        }
    } catch (error) {
        console.error('Auto-capture error:', error);
    }
});

// Start auto-capture
ipcMain.handle('start-auto-capture', async (event, sourceId) => {
    autoCapture.enabled = true;
    autoCapture.paused = false;
    autoCapture.sourceId = sourceId;
    autoCapture.captureCount = 0;
    autoCapture.lastCaptureTime = 0;

    // Start the hook if not already started
    try {
        uIOhook.start();
    } catch (e) {
        // Already started, ignore
    }

    return { success: true };
});

// Stop auto-capture
ipcMain.handle('stop-auto-capture', async () => {
    autoCapture.enabled = false;
    autoCapture.paused = false;
    autoCapture.sourceId = null;

    return { success: true, totalCaptures: autoCapture.captureCount };
});

// Pause/Resume auto-capture
ipcMain.handle('toggle-pause-auto-capture', async () => {
    autoCapture.paused = !autoCapture.paused;
    return { paused: autoCapture.paused };
});

// Get auto-capture status
ipcMain.handle('get-auto-capture-status', async () => {
    return {
        enabled: autoCapture.enabled,
        paused: autoCapture.paused,
        captureCount: autoCapture.captureCount
    };
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
    // Stop the mouse hook
    try {
        uIOhook.stop();
    } catch (e) {
        // Ignore
    }

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    // Ensure hook is stopped
    try {
        uIOhook.stop();
    } catch (e) {
        // Ignore
    }
});
