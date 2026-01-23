# QuickFlow - Architecture Documentation

> **Last Updated:** 2026-01-22

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Electron 28.x |
| **Language** | JavaScript (ES6+) |
| **UI Framework** | Tailwind CSS (CDN) |
| **AI Integration** | OpenAI GPT-4o-mini |
| **PDF Output** | Browser Print API |
| **Build Tool** | electron-builder |

---

## Process Architecture

### Main Process (`main.js`)
The main process runs in Node.js and handles:
- Window lifecycle management
- Native APIs (desktopCapturer, shell)
- File system operations
- IPC message handling

### Renderer Process (`src/app.js`)
The renderer process runs in Chromium and handles:
- User interface rendering
- State management
- External API calls (OpenAI)
- PDF content generation

### Preload Script (`preload.js`)
The preload script provides a secure bridge:
- Exposes limited IPC methods via `contextBridge`
- Maintains context isolation
- Prevents direct Node.js access from renderer

---

## IPC Communication

```
┌──────────────┐                    ┌──────────────┐
│   Renderer   │                    │     Main     │
│   Process    │                    │   Process    │
├──────────────┤                    ├──────────────┤
│              │  get-sources       │              │
│              │ ──────────────────►│              │
│              │ ◄────────────────  │              │
│              │  [sources array]   │              │
│              │                    │              │
│              │ capture-screenshot │              │
│              │ ──────────────────►│              │
│              │ ◄────────────────  │              │
│              │  {screenshot obj}  │              │
│              │                    │              │
│              │  save-pdf          │              │
│              │ ──────────────────►│              │
│              │ ◄────────────────  │              │
│              │  filepath          │              │
└──────────────┘                    └──────────────┘
```

---

## Data Flow

### Recording Flow
1. User selects capture source (screen/window)
2. User clicks "Capture" at each important step
3. Main process captures thumbnail via `desktopCapturer`
4. Screenshot stored in renderer state as base64

### AI Analysis Flow
1. User clicks "Analyze with AI"
2. Renderer sends each screenshot to OpenAI API
3. GPT-4o-mini returns JSON with title/description
4. State updated with AI-generated content

### PDF Generation Flow
1. User clicks "Generate PDF"
2. Renderer generates HTML template with embedded images
3. Opens new browser window with content
4. Triggers print dialog for PDF export

---

## State Management

```javascript
// Global application state (src/app.js)
const state = {
    selectedSource: null,      // ID of selected screen/window
    isRecording: false,        // Recording status flag
    recordingStartTime: null,  // Timestamp for duration calc
    steps: [],                 // Array of captured steps
    apiKey: null               // OpenAI API key
};

// Step object structure
{
    id: number,           // Unique timestamp ID
    timestamp: string,    // ISO timestamp
    image: string,        // Base64 data URL
    title: string,        // Step title (editable)
    description: string   // Step description (editable)
}
```

---

## External Integrations

### OpenAI API
- **Endpoint:** `https://api.openai.com/v1/chat/completions`
- **Model:** `gpt-4o-mini`
- **Features Used:**
  - Vision (image analysis)
  - Chat completions
- **Auth:** Bearer token from `config.json`

---

## Security Model

| Feature | Implementation |
|---------|----------------|
| Context Isolation | ✅ Enabled |
| Node Integration | ✅ Disabled |
| Remote Module | ✅ Disabled (default) |
| IPC Whitelist | ✅ Only specific handlers exposed |
| CSP | ✅ Configured in HTML meta tag |

### Content Security Policy
```html
default-src 'self';
script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob:;
connect-src 'self' https://api.openai.com
```

---

## Build Configuration

### Package Scripts
```json
{
  "start": "electron .",
  "dev": "electron . --dev",
  "build": "electron-builder --win",
  "build:dir": "electron-builder --win --dir"
}
```

### Build Output
- **Format:** Portable Windows executable
- **Output Dir:** `dist/`
- **Naming:** `QuickFlow-${version}.exe`
