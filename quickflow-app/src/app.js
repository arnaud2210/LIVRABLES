// ==========================================
// QuickFlow - Application principale
// ==========================================

// État global de l'application
const state = {
    selectedSource: null,
    isRecording: false,
    recordingStartTime: null,
    steps: [],
    apiKey: null,
    currentView: 'dashboard',
    savedProcedures: [],
    sharedProcedures: [],
    departments: [
        { id: 'it', name: 'IT', icon: 'fa-laptop-code', color: 'azure-primary' },
        { id: 'rh', name: 'Ressources Humaines', icon: 'fa-users', color: 'emerald-500' },
        { id: 'finance', name: 'Finance', icon: 'fa-chart-line', color: 'amber-500' },
        { id: 'marketing', name: 'Marketing', icon: 'fa-bullhorn', color: 'pink-500' },
        { id: 'legal', name: 'Juridique', icon: 'fa-scale-balanced', color: 'purple-500' },
        { id: 'support', name: 'Support Client', icon: 'fa-headset', color: 'cyan-500' }
    ],
    selectedDepartments: [],
    // User profile
    userProfile: null,
    // Lightbox
    currentLightboxIndex: 0,
    // Auto-save
    autoSaveInterval: null,
    lastSaveTime: null,
    currentProcedureId: null,
    // Dark mode
    isDarkMode: false,
    // Auto-capture
    isCapturePaused: false
};

// Éléments DOM
const elements = {
    // Views
    dashboardView: document.getElementById('dashboardView'),
    sourceSelection: document.getElementById('sourceSelection'),
    recordingView: document.getElementById('recordingView'),
    previewView: document.getElementById('previewView'),

    // Sidebar navigation
    navDashboard: document.getElementById('navDashboard'),
    navNewProcedure: document.getElementById('navNewProcedure'),
    navMyProcedures: document.getElementById('navMyProcedures'),
    navSharedWithMe: document.getElementById('navSharedWithMe'),
    departmentList: document.getElementById('departmentList'),
    sidebarSettingsBtn: document.getElementById('sidebarSettingsBtn'),

    // Dashboard
    statTotalProcedures: document.getElementById('statTotalProcedures'),
    statTotalSteps: document.getElementById('statTotalSteps'),
    statSharedCount: document.getElementById('statSharedCount'),
    quickActionNew: document.getElementById('quickActionNew'),
    recentProceduresList: document.getElementById('recentProceduresList'),

    // Back buttons
    backToDashboard: document.getElementById('backToDashboard'),
    backFromRecording: document.getElementById('backFromRecording'),
    backFromPreview: document.getElementById('backFromPreview'),

    // Source selection
    sourcesList: document.getElementById('sourcesList'),
    refreshSourcesBtn: document.getElementById('refreshSourcesBtn'),

    // Recording
    stepCount: document.getElementById('stepCount'),
    recordingTime: document.getElementById('recordingTime'),
    captureStepBtn: document.getElementById('captureStepBtn'),
    stopRecordingBtn: document.getElementById('stopRecordingBtn'),
    pauseCaptureBtn: document.getElementById('pauseCaptureBtn'),
    pauseIcon: document.getElementById('pauseIcon'),
    pauseText: document.getElementById('pauseText'),
    autoCaptureIndicator: document.getElementById('autoCaptureIndicator'),
    autoCaptureStatus: document.getElementById('autoCaptureStatus'),

    // Preview
    procedureTitle: document.getElementById('procedureTitle'),
    stepsList: document.getElementById('stepsList'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    newRecordingBtn: document.getElementById('newRecordingBtn'),
    saveBtn: document.getElementById('saveBtn'),
    shareBtn: document.getElementById('shareBtn'),

    // Export dropdown
    exportBtn: document.getElementById('exportBtn'),
    exportMenu: document.getElementById('exportMenu'),
    exportPdf: document.getElementById('exportPdf'),
    exportHtml: document.getElementById('exportHtml'),
    exportMarkdown: document.getElementById('exportMarkdown'),
    exportGif: document.getElementById('exportGif'),

    // Share modal
    shareModal: document.getElementById('shareModal'),
    closeShareModal: document.getElementById('closeShareModal'),
    shareDepartmentList: document.getElementById('shareDepartments'),
    confirmShareBtn: document.getElementById('confirmShare'),
    cancelShareBtn: document.getElementById('cancelShare'),

    // Profile modal
    profileModal: document.getElementById('profileModal'),
    profileDepartments: document.getElementById('profileDepartments'),
    userDepartmentBadge: document.getElementById('userDepartmentBadge'),
    userDepartmentName: document.getElementById('userDepartmentName'),

    // Lightbox
    lightbox: document.getElementById('lightbox'),
    lightboxImage: document.getElementById('lightboxImage'),
    lightboxCaption: document.getElementById('lightboxCaption'),
    lightboxCounter: document.getElementById('lightboxCounter'),
    closeLightbox: document.getElementById('closeLightbox'),
    lightboxPrev: document.getElementById('lightboxPrev'),
    lightboxNext: document.getElementById('lightboxNext'),

    // Toast
    toastContainer: document.getElementById('toastContainer'),

    // Search
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear'),
    searchResults: document.getElementById('searchResults'),
    searchResultCount: document.getElementById('searchResultCount'),

    // Dark mode
    darkModeBtn: document.getElementById('darkModeBtn'),
    darkModeIcon: document.getElementById('darkModeIcon'),
    darkModeText: document.getElementById('darkModeText'),

    // Shortcuts modal
    shortcutsModal: document.getElementById('shortcutsModal'),
    closeShortcutsModal: document.getElementById('closeShortcutsModal'),
    showShortcutsBtn: document.getElementById('showShortcutsBtn'),

    // Change department
    changeDepartmentBtn: document.getElementById('changeDepartmentBtn'),

    // Settings
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    openOutputBtn: document.getElementById('openOutputBtn'),

    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText')
};

// ==========================================
// Initialisation
// ==========================================

async function init() {
    // Charger la clé API sauvegardée
    state.apiKey = await window.electronAPI.getApiKey();
    if (state.apiKey) {
        elements.apiKeyInput.value = '••••••••••••••••';
    }

    // Charger le thème sauvegardé
    initTheme();

    // Charger le profil utilisateur
    loadUserProfile();

    // Charger les procédures sauvegardées (localStorage)
    loadSavedProcedures();

    // Event listeners
    setupEventListeners();

    // Vérifier si c'est la première utilisation
    if (!state.userProfile) {
        showProfileModal();
    } else {
        // Afficher le dashboard par défaut
        showView('dashboard');
        renderDashboard();
        renderDepartmentList();
        updateUserDepartmentBadge();
    }

    // Démarrer l'auto-save
    startAutoSave();
}

function setupEventListeners() {
    // Sidebar navigation
    elements.navDashboard?.addEventListener('click', () => {
        setActiveNav('dashboard');
        showView('dashboard');
        renderDashboard();
    });
    elements.navNewProcedure?.addEventListener('click', () => {
        setActiveNav('newProcedure');
        showView('source');
        loadSources();
    });
    elements.navMyProcedures?.addEventListener('click', () => {
        setActiveNav('myProcedures');
        showView('dashboard');
        renderMyProcedures();
    });
    elements.navSharedWithMe?.addEventListener('click', () => {
        setActiveNav('sharedWithMe');
        showView('dashboard');
        renderSharedProcedures();
    });
    elements.sidebarSettingsBtn?.addEventListener('click', () => toggleModal(true));

    // Quick actions
    elements.quickActionNew?.addEventListener('click', () => {
        setActiveNav('newProcedure');
        showView('source');
        loadSources();
    });

    // Back buttons
    elements.backToDashboard?.addEventListener('click', () => {
        setActiveNav('dashboard');
        showView('dashboard');
        renderDashboard();
    });
    elements.backFromRecording?.addEventListener('click', () => {
        if (confirm('Voulez-vous annuler l\'enregistrement en cours ?')) {
            state.isRecording = false;
            state.steps = [];
            setActiveNav('dashboard');
            showView('dashboard');
            renderDashboard();
        }
    });
    elements.backFromPreview?.addEventListener('click', () => {
        setActiveNav('dashboard');
        showView('dashboard');
        renderDashboard();
    });

    // Sources
    elements.refreshSourcesBtn?.addEventListener('click', loadSources);

    // Recording
    elements.captureStepBtn?.addEventListener('click', captureStep);
    elements.stopRecordingBtn?.addEventListener('click', stopRecording);
    elements.pauseCaptureBtn?.addEventListener('click', togglePauseCapture);

    // Preview
    elements.analyzeBtn?.addEventListener('click', analyzeWithAI);
    elements.newRecordingBtn?.addEventListener('click', resetToStart);
    elements.saveBtn?.addEventListener('click', saveProcedure);
    elements.shareBtn?.addEventListener('click', () => toggleShareModal(true));

    // Export dropdown
    elements.exportBtn?.addEventListener('click', toggleExportMenu);
    elements.exportPdf?.addEventListener('click', () => { hideExportMenu(); generatePDF(); });
    elements.exportHtml?.addEventListener('click', () => { hideExportMenu(); generateHTML(); });
    elements.exportMarkdown?.addEventListener('click', () => { hideExportMenu(); generateMarkdown(); });
    elements.exportGif?.addEventListener('click', () => { hideExportMenu(); generateGIF(); });

    // Fermer le menu en cliquant ailleurs
    document.addEventListener('click', (e) => {
        if (elements.exportBtn && elements.exportMenu &&
            !elements.exportBtn.contains(e.target) && !elements.exportMenu.contains(e.target)) {
            hideExportMenu();
        }
    });

    // Share modal
    elements.closeShareModal?.addEventListener('click', () => toggleShareModal(false));
    elements.cancelShareBtn?.addEventListener('click', () => toggleShareModal(false));
    elements.confirmShareBtn?.addEventListener('click', confirmShare);
    elements.shareModal?.addEventListener('click', (e) => {
        if (e.target === elements.shareModal) toggleShareModal(false);
    });

    // Lightbox
    elements.closeLightbox?.addEventListener('click', closeLightbox);
    elements.lightboxPrev?.addEventListener('click', () => navigateLightbox(-1));
    elements.lightboxNext?.addEventListener('click', () => navigateLightbox(1));
    elements.lightbox?.addEventListener('click', (e) => {
        if (e.target === elements.lightbox) closeLightbox();
    });

    // Search
    elements.searchInput?.addEventListener('input', handleSearch);
    elements.searchClear?.querySelector('button')?.addEventListener('click', clearSearch);

    // Dark mode
    elements.darkModeBtn?.addEventListener('click', toggleDarkMode);

    // Shortcuts modal
    elements.showShortcutsBtn?.addEventListener('click', () => toggleShortcutsModal(true));
    elements.closeShortcutsModal?.addEventListener('click', () => toggleShortcutsModal(false));
    elements.shortcutsModal?.addEventListener('click', (e) => {
        if (e.target === elements.shortcutsModal) toggleShortcutsModal(false);
    });

    // Change department
    elements.changeDepartmentBtn?.addEventListener('click', () => {
        toggleModal(false);
        showProfileModal();
    });

    // Settings
    elements.settingsBtn?.addEventListener('click', () => toggleModal(true));
    elements.closeSettingsBtn?.addEventListener('click', () => toggleModal(false));
    elements.saveApiKeyBtn?.addEventListener('click', saveApiKey);
    elements.openOutputBtn?.addEventListener('click', () => window.electronAPI.openOutputFolder());

    // Fermer modal en cliquant à l'extérieur
    elements.settingsModal?.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) toggleModal(false);
    });

    // Keyboard shortcuts
    setupKeyboardShortcuts();
}

// ==========================================
// Gestion des sources d'écran
// ==========================================

async function loadSources() {
    elements.sourcesList.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16">
            <div class="relative w-16 h-16 mb-4">
                <div class="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-azure-primary border-r-accent-cyan animate-spin"></div>
            </div>
            <p class="text-lg font-medium text-gray-700">Chargement des sources...</p>
            <p class="text-sm text-gray-500 mt-1">Détection des écrans et fenêtres</p>
        </div>
    `;

    try {
        const sources = await window.electronAPI.getSources();
        renderSources(sources);
    } catch (error) {
        elements.sourcesList.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16">
                <div class="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
                </div>
                <p class="text-lg font-medium text-red-600">Erreur de chargement</p>
                <p class="text-sm text-gray-500 mt-1">Impossible de détecter les sources d'écran</p>
            </div>
        `;
    }
}

function renderSources(sources) {
    elements.sourcesList.innerHTML = sources.map((source, index) => `
        <div class="source-card group relative bg-white rounded-2xl overflow-hidden cursor-pointer hover-lift shadow-md border border-gray-100 hover:border-azure-primary/50"
             data-source-id="${source.id}"
             style="animation: fadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; animation-delay: ${index * 0.05}s; opacity: 0;">
            <div class="aspect-video relative overflow-hidden bg-gray-100">
                <img src="${source.thumbnail}" alt="${source.name}" class="w-full h-full object-cover transition-smooth group-hover:scale-105">
                <div class="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent"></div>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth">
                    <span class="px-5 py-2.5 bg-gradient-to-r from-azure-primary to-accent-cyan text-white backdrop-blur-sm rounded-xl font-medium text-sm shadow-lg">
                        <i class="fa-solid fa-play mr-2"></i>Sélectionner
                    </span>
                </div>
            </div>
            <div class="p-4 border-t border-gray-100">
                <p class="font-medium truncate text-gray-800">${source.name}</p>
                <p class="text-xs text-gray-500 mt-1">Cliquez pour démarrer</p>
            </div>
        </div>
    `).join('');

    // Ajouter les event listeners
    document.querySelectorAll('.source-card').forEach(card => {
        card.addEventListener('click', () => selectSource(card.dataset.sourceId));
    });
}

function selectSource(sourceId) {
    state.selectedSource = sourceId;
    startRecording();
}

// ==========================================
// Enregistrement
// ==========================================

async function startRecording() {
    state.isRecording = true;
    state.recordingStartTime = Date.now();
    state.steps = [];
    state.isCapturePaused = false;

    showView('recording');
    updateStepCount();
    startTimer();

    // Start auto-capture
    try {
        await window.electronAPI.startAutoCapture(state.selectedSource);

        // Listen for auto-capture events
        window.electronAPI.onAutoCapture((screenshot) => {
            if (state.isRecording && !state.isCapturePaused) {
                handleAutoCapture(screenshot);
            }
        });

        updatePauseButton();
        showToast('Capture automatique activée - cliquez sur l\'écran surveillé', 'success');
    } catch (error) {
        console.error('Error starting auto-capture:', error);
        showToast('Erreur lors du démarrage de la capture automatique', 'error');
    }
}

function startTimer() {
    const timerInterval = setInterval(() => {
        if (!state.isRecording) {
            clearInterval(timerInterval);
            return;
        }

        const elapsed = Math.floor((Date.now() - state.recordingStartTime) / 1000);
        const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const seconds = String(elapsed % 60).padStart(2, '0');
        elements.recordingTime.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

async function captureStep() {
    showLoading('Capture en cours...');

    try {
        const screenshot = await window.electronAPI.captureScreenshot(state.selectedSource);

        if (screenshot) {
            state.steps.push({
                id: screenshot.id,
                timestamp: screenshot.timestamp,
                image: screenshot.image,
                sourceName: screenshot.sourceName || 'Écran', // Contexte: nom de la fenêtre/app
                title: `Étape ${state.steps.length + 1}`,
                description: ''
            });

            updateStepCount();
        }
    } catch (error) {
        console.error('Erreur lors de la capture:', error);
    }

    hideLoading();
}

function updateStepCount() {
    elements.stepCount.textContent = state.steps.length;
}

async function stopRecording() {
    state.isRecording = false;

    // Stop auto-capture
    try {
        await window.electronAPI.stopAutoCapture();
        window.electronAPI.removeAutoCaptureListener();
    } catch (error) {
        console.error('Error stopping auto-capture:', error);
    }

    if (state.steps.length === 0) {
        showToast('Aucune étape capturée. Veuillez capturer au moins une étape.', 'warning');
        resetToStart();
        return;
    }

    showView('preview');
    renderSteps();
    showToast(`${state.steps.length} étape(s) capturée(s)`, 'success');
}

// Handle auto-captured screenshot
async function handleAutoCapture(screenshot) {
    if (!screenshot) return;

    // Add red highlight at click position
    let finalImage = screenshot.image;
    if (screenshot.clickPosition) {
        finalImage = await addClickHighlight(screenshot.image, screenshot.clickPosition);
    }

    state.steps.push({
        id: screenshot.id,
        timestamp: screenshot.timestamp,
        image: finalImage,
        originalImage: screenshot.image, // Keep original for annotations
        sourceName: screenshot.sourceName || 'Écran',
        title: `Étape ${state.steps.length + 1}`,
        description: '',
        clickPosition: screenshot.clickPosition,
        annotations: [] // For future annotations
    });

    updateStepCount();

    // Visual feedback
    if (elements.autoCaptureIndicator) {
        elements.autoCaptureIndicator.classList.add('scale-105');
        setTimeout(() => {
            elements.autoCaptureIndicator.classList.remove('scale-105');
        }, 200);
    }
}

// Add red highlight circle at click position
async function addClickHighlight(imageDataUrl, clickPosition) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Get screen dimensions to calculate scale
            // The screenshot is 1920x1080 max, we need to map click coords
            const screenWidth = window.screen.width * window.devicePixelRatio;
            const screenHeight = window.screen.height * window.devicePixelRatio;

            // Calculate scale factors
            const scaleX = img.width / screenWidth;
            const scaleY = img.height / screenHeight;

            // Map click position to image coordinates
            const x = clickPosition.x * scaleX;
            const y = clickPosition.y * scaleY;

            // Draw red highlight circle
            const radius = 30;

            // Outer glow
            ctx.beginPath();
            ctx.arc(x, y, radius + 10, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 8;
            ctx.stroke();

            // Main circle
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Inner dot
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#FF0000';
            ctx.fill();

            // Add pulsing ring effect (static representation)
            ctx.beginPath();
            ctx.arc(x, y, radius + 20, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.15)';
            ctx.lineWidth = 4;
            ctx.stroke();

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            resolve(imageDataUrl); // Return original if error
        };
        img.src = imageDataUrl;
    });
}

// Toggle pause/resume capture
async function togglePauseCapture() {
    try {
        const result = await window.electronAPI.togglePauseAutoCapture();
        state.isCapturePaused = result.paused;
        updatePauseButton();

        if (state.isCapturePaused) {
            showToast('Capture en pause', 'info');
        } else {
            showToast('Capture reprise', 'success');
        }
    } catch (error) {
        console.error('Error toggling pause:', error);
    }
}

// Update pause button appearance
function updatePauseButton() {
    if (!elements.pauseIcon || !elements.pauseText || !elements.autoCaptureStatus) return;

    if (state.isCapturePaused) {
        elements.pauseIcon.className = 'fa-solid fa-play';
        elements.pauseText.textContent = 'Reprendre';
        elements.pauseCaptureBtn.classList.remove('bg-amber-500', 'hover:bg-amber-600');
        elements.pauseCaptureBtn.classList.add('bg-green-500', 'hover:bg-green-600');
        elements.autoCaptureStatus.textContent = '(en pause)';
        elements.autoCaptureStatus.classList.remove('text-green-600');
        elements.autoCaptureStatus.classList.add('text-amber-600');
    } else {
        elements.pauseIcon.className = 'fa-solid fa-pause';
        elements.pauseText.textContent = 'Pause';
        elements.pauseCaptureBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        elements.pauseCaptureBtn.classList.add('bg-amber-500', 'hover:bg-amber-600');
        elements.autoCaptureStatus.textContent = '(cliquez sur l\'écran surveillé)';
        elements.autoCaptureStatus.classList.remove('text-amber-600');
        elements.autoCaptureStatus.classList.add('text-green-600');
    }
}

// ==========================================
// Prévisualisation et édition
// ==========================================

function renderSteps() {
    // Grouper les étapes par chapitre si disponible
    let currentChapter = null;
    let stepsHTML = '';

    state.steps.forEach((step, index) => {
        // Afficher le header de chapitre si nouveau chapitre
        if (step.chapter && step.chapter !== currentChapter) {
            currentChapter = step.chapter;
            stepsHTML += `
                <div class="chapter-header flex items-center gap-4 my-8 py-4 px-6 bg-gradient-to-r from-azure-primary/10 to-transparent rounded-2xl border-l-4 border-azure-primary"
                     style="animation: fadeSlideIn 0.4s ease forwards; animation-delay: ${index * 0.05}s; opacity: 0;">
                    <div class="w-10 h-10 rounded-xl bg-azure-primary/20 flex items-center justify-center">
                        <i class="fa-solid fa-bookmark text-azure-primary"></i>
                    </div>
                    <h3 class="text-xl font-bold gradient-text">${currentChapter}</h3>
                </div>
            `;
        }

        stepsHTML += `
            <div class="step-card bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100"
                 data-step-index="${index}"
                 draggable="false"
                 style="animation: fadeSlideIn 0.4s ease forwards; animation-delay: ${index * 0.08}s; opacity: 0;">
                <div class="flex flex-col lg:flex-row">
                    <!-- Drag Handle -->
                    <div class="drag-handle hidden lg:flex items-center justify-center w-10 bg-gray-50 border-r border-gray-100 cursor-grab hover:bg-azure-primary/10 transition-colors">
                        <i class="fa-solid fa-grip-vertical text-gray-400"></i>
                    </div>

                    <!-- Image Section -->
                    <div class="lg:w-[380px] flex-shrink-0 relative group bg-gray-100 cursor-pointer step-image-container" data-step-index="${index}">
                        <img src="${step.image}" alt="Étape ${index + 1}" class="w-full h-56 lg:h-full object-cover">
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/30 hidden lg:block"></div>
                        <div class="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent"></div>
                        <!-- Step number badge - Azure style -->
                        <div class="absolute top-4 left-4">
                            <span class="w-12 h-12 bg-gradient-to-br from-azure-primary to-accent-cyan text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                                ${index + 1}
                            </span>
                        </div>
                        <!-- Zoom icon on hover -->
                        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth">
                            <div class="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                <i class="fa-solid fa-expand text-azure-primary"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Content Section -->
                    <div class="flex-1 p-6 space-y-4">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex-1">
                                <input type="text" value="${step.title}"
                                       class="step-title w-full bg-transparent text-xl font-bold focus:outline-none border-b-2 border-gray-200 focus:border-azure-primary transition-smooth pb-2 placeholder-gray-400 text-gray-800"
                                       placeholder="Titre de l'étape">
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <button class="annotate-step-btn p-3 text-gray-400 hover:text-azure-primary hover:bg-azure-primary/10 rounded-xl transition-smooth" title="Annoter l'image">
                                    <i class="fa-solid fa-pen-ruler"></i>
                                </button>
                                <button class="delete-step-btn p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-smooth">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>

                        ${step.sourceName ? `
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600">
                                <i class="fa-solid fa-window-maximize text-azure-primary"></i>
                                <span>${step.sourceName}</span>
                            </span>
                        </div>
                        ` : ''}

                        <textarea class="step-description w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-azure-primary/30 focus:border-azure-primary resize-none transition-smooth placeholder-gray-400"
                                  rows="4" placeholder="Décrivez cette étape... (sera enrichie par l'IA)">${step.description}</textarea>
                    </div>
                </div>
            </div>
        `;
    });

    elements.stepsList.innerHTML = stepsHTML;

    // Event listeners pour les étapes
    document.querySelectorAll('.step-title').forEach((input, index) => {
        input.addEventListener('change', (e) => {
            state.steps[index].title = e.target.value;
        });
    });

    document.querySelectorAll('.step-description').forEach((textarea, index) => {
        textarea.addEventListener('change', (e) => {
            state.steps[index].description = e.target.value;
        });
    });

    document.querySelectorAll('.delete-step-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => deleteStep(index));
    });

    // Annotate button
    document.querySelectorAll('.annotate-step-btn').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openAnnotationEditor(index);
        });
    });

    // Lightbox click on images
    document.querySelectorAll('.step-image-container').forEach((container) => {
        container.addEventListener('click', () => {
            const stepIndex = parseInt(container.dataset.stepIndex);
            openLightbox(stepIndex);
        });
    });

    // Initialize drag and drop
    initDragAndDrop();
}

function deleteStep(index) {
    state.steps.splice(index, 1);
    renderSteps();
}

// ==========================================
// Analyse IA Contextuelle
// ==========================================

/**
 * Analyse contextuelle intelligente - V2
 * 1. Analyse globale pour comprendre l'objectif de la procédure
 * 2. Analyse détaillée de chaque étape avec le contexte complet
 */
async function analyzeWithAI() {
    if (!state.apiKey) {
        showToast('Veuillez configurer votre clé API OpenAI dans les paramètres.', 'warning');
        toggleModal(true);
        return;
    }

    if (state.steps.length === 0) {
        showToast('Aucune étape à analyser.', 'warning');
        return;
    }

    showLoading('Analyse IA contextuelle en cours...');

    try {
        // Phase 1: Analyse globale - comprendre l'objectif de la procédure
        elements.loadingText.textContent = 'Phase 1/2: Compréhension globale...';
        const globalContext = await analyzeGlobalContext();

        console.log('Contexte global:', globalContext);

        // Phase 2: Analyse détaillée de chaque étape avec le contexte
        for (let i = 0; i < state.steps.length; i++) {
            elements.loadingText.textContent = `Phase 2/2: Étape ${i + 1}/${state.steps.length}...`;

            const analysis = await analyzeStepWithContext(i, globalContext);

            if (analysis) {
                state.steps[i].title = analysis.title || state.steps[i].title;
                state.steps[i].description = analysis.description || '';
                state.steps[i].chapter = analysis.chapter || null; // Nouveau: chapitrage auto
            }
        }

        // Définir le titre de la procédure depuis le contexte global
        if (!elements.procedureTitle.value && globalContext.procedureTitle) {
            elements.procedureTitle.value = globalContext.procedureTitle;
        }

        renderSteps();
        showToast('Analyse contextuelle terminée avec succès !', 'success');
    } catch (error) {
        console.error('Erreur lors de l\'analyse:', error);
        showToast(`Erreur IA: ${error.message}`, 'error', 5000);
    }

    hideLoading();
}

/**
 * Phase 1: Analyse globale de toutes les captures
 * Envoie un aperçu de toutes les images pour comprendre le contexte général
 */
async function analyzeGlobalContext() {
    // Construire le contexte avec métadonnées
    const sourceNames = [...new Set(state.steps.map(s => s.sourceName))];
    const timestamps = state.steps.map(s => s.timestamp);
    const duration = state.steps.length > 1
        ? Math.round((new Date(timestamps[timestamps.length - 1]) - new Date(timestamps[0])) / 1000)
        : 0;

    // Préparer les images pour l'analyse (max 10 pour limiter les tokens)
    const imagesToAnalyze = state.steps.length <= 10
        ? state.steps
        : state.steps.filter((_, i) => i % Math.ceil(state.steps.length / 10) === 0 || i === state.steps.length - 1);

    const imageContents = imagesToAnalyze.map((step, idx) => ({
        type: 'image_url',
        image_url: { url: step.image, detail: 'low' } // low detail pour économiser les tokens
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu es un expert en analyse de procédures informatiques. Tu reçois ${imagesToAnalyze.length} captures d'écran d'une procédure de ${state.steps.length} étapes au total.

CONTEXTE TECHNIQUE:
- Application(s) utilisée(s): ${sourceNames.join(', ')}
- Nombre total d'étapes: ${state.steps.length}
- Durée de capture: ${duration} secondes

MISSION: Analyse ces captures pour comprendre:
1. L'OBJECTIF GLOBAL de la procédure (que cherche à accomplir l'utilisateur?)
2. Le DOMAINE MÉTIER (administration système, bureautique, développement, etc.)
3. Les CHAPITRES LOGIQUES (groupes d'étapes liées)

Réponds UNIQUEMENT en JSON:
{
    "procedureTitle": "Titre professionnel de la procédure (ex: Configuration du VPN entreprise)",
    "objective": "Description de l'objectif en 1-2 phrases",
    "domain": "Domaine métier identifié",
    "chapters": [
        {"name": "Nom du chapitre", "startStep": 1, "endStep": 3},
        {"name": "Autre chapitre", "startStep": 4, "endStep": 6}
    ],
    "technicalTerms": ["terme1", "terme2"],
    "difficulty": "débutant|intermédiaire|avancé"
}`
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Voici les ${imagesToAnalyze.length} captures d'écran de la procédure. Analyse le contexte global.`
                        },
                        ...imageContents
                    ]
                }
            ],
            max_tokens: 800
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    try {
        const content = data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Erreur parsing contexte global:', e);
    }

    // Fallback si parsing échoue
    return {
        procedureTitle: 'Procédure',
        objective: 'Non déterminé',
        domain: 'Général',
        chapters: [],
        technicalTerms: [],
        difficulty: 'intermédiaire'
    };
}

/**
 * Phase 2: Analyse détaillée d'une étape avec son contexte
 */
async function analyzeStepWithContext(stepIndex, globalContext) {
    const step = state.steps[stepIndex];
    const totalSteps = state.steps.length;

    // Construire le contexte des étapes adjacentes
    const previousStep = stepIndex > 0 ? state.steps[stepIndex - 1] : null;
    const nextStep = stepIndex < totalSteps - 1 ? state.steps[stepIndex + 1] : null;

    // Trouver le chapitre de cette étape
    const chapter = globalContext.chapters?.find(
        ch => stepIndex + 1 >= ch.startStep && stepIndex + 1 <= ch.endStep
    );

    // Construire le message avec contexte riche
    const contextInfo = `
CONTEXTE DE LA PROCÉDURE:
- Objectif: ${globalContext.objective}
- Domaine: ${globalContext.domain}
- Titre: ${globalContext.procedureTitle}
${chapter ? `- Chapitre actuel: "${chapter.name}"` : ''}
${globalContext.technicalTerms?.length ? `- Termes techniques: ${globalContext.technicalTerms.join(', ')}` : ''}

POSITION DANS LA SÉQUENCE:
- Étape ${stepIndex + 1} sur ${totalSteps}
${previousStep ? `- Étape précédente: "${previousStep.title}"` : '- (Première étape de la procédure)'}
${nextStep ? `- Étape suivante disponible` : '- (Dernière étape de la procédure)'}

APPLICATION: ${step.sourceName}
`;

    const messages = [
        {
            role: 'system',
            content: `Tu es un expert en rédaction de documentation technique. Tu rédiges l'étape ${stepIndex + 1}/${totalSteps} d'une procédure.

${contextInfo}

CONSIGNES DE RÉDACTION:
1. Le TITRE doit être une action claire et contextuelle (pas juste "Cliquer sur OK" mais "Valider la configuration réseau")
2. La DESCRIPTION doit guider précisément l'utilisateur: où regarder, quoi cliquer, quoi saisir
3. UTILISE le vocabulaire du domaine métier identifié
4. Si c'est la première étape d'un chapitre, mentionne-le
5. Fais le LIEN avec l'étape précédente si pertinent

Réponds UNIQUEMENT en JSON:
{
    "title": "Titre de l'action contextuel (max 60 caractères)",
    "description": "Instructions détaillées avec emplacements précis (2-4 phrases)",
    "chapter": "${chapter?.name || ''}"
}`
        },
        {
            role: 'user',
            content: [
                { type: 'text', text: 'Analyse cette capture et rédige l\'étape avec le contexte fourni.' },
                { type: 'image_url', image_url: { url: step.image } }
            ]
        }
    ];

    // Ajouter l'image de l'étape précédente pour le contexte visuel (si disponible)
    if (previousStep && stepIndex <= 5) { // Limite aux 5 premières étapes pour économiser les tokens
        messages[1].content.push({
            type: 'text',
            text: '(Image de l\'étape précédente pour référence:)'
        });
        messages[1].content.push({
            type: 'image_url',
            image_url: { url: previousStep.image, detail: 'low' }
        });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            max_tokens: 400
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    try {
        const content = data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Erreur parsing étape:', e);
    }

    return null;
}

/**
 * Génère un titre de procédure (fallback si pas de contexte global)
 */
async function generateProcedureTitle() {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Génère un titre court et professionnel pour une procédure basée sur ces étapes. Réponds uniquement avec le titre, sans guillemets.'
                },
                {
                    role: 'user',
                    content: state.steps.map((s, i) => `Étape ${i + 1}: ${s.title}`).join('\n')
                }
            ],
            max_tokens: 50
        })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Procédure';
}

// ==========================================
// Génération PDF
// ==========================================

async function generatePDF() {
    const title = elements.procedureTitle.value || 'Procédure';

    if (state.steps.some(s => !s.description)) {
        const proceed = confirm('Certaines étapes n\'ont pas de description. Voulez-vous continuer ?');
        if (!proceed) return;
    }

    showLoading('Génération du PDF...');

    try {
        // Créer le contenu HTML du PDF
        const pdfContent = generatePDFContent(title);

        // Utiliser une nouvelle fenêtre pour l'impression/sauvegarde
        const printWindow = window.open('', '_blank');
        printWindow.document.write(pdfContent);
        printWindow.document.close();

        // Attendre le chargement des images puis imprimer
        printWindow.onload = () => {
            printWindow.print();
        };

    } catch (error) {
        console.error('Erreur lors de la génération:', error);
        showToast('Erreur lors de la génération du PDF.', 'error');
    }

    hideLoading();
}

function generatePDFContent(title) {
    const date = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // Générer le HTML avec support des chapitres
    let currentChapter = null;
    let stepsHTML = '';

    // Générer la table des matières si chapitres disponibles
    const chapters = [...new Set(state.steps.map(s => s.chapter).filter(Boolean))];
    let tocHTML = '';
    if (chapters.length > 0) {
        tocHTML = `
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1e293b;">📑 Table des matières</h2>
                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                    ${chapters.map(ch => `<li style="margin: 5px 0;">${ch}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    state.steps.forEach((step, index) => {
        // Ajouter le header de chapitre si nouveau
        if (step.chapter && step.chapter !== currentChapter) {
            currentChapter = step.chapter;
            stepsHTML += `
                <div style="page-break-before: ${index > 0 ? 'always' : 'auto'}; background: linear-gradient(90deg, #2563eb20, transparent); border-left: 4px solid #2563eb; padding: 15px 20px; margin: 30px 0 20px 0; border-radius: 0 8px 8px 0;">
                    <h2 style="margin: 0; font-size: 20px; color: #1e40af;">📌 ${currentChapter}</h2>
                </div>
            `;
        }

        stepsHTML += `
            <div class="step" style="page-break-inside: avoid; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 15px; border-bottom: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; color: #1e293b; font-size: 16px;">
                        <span style="display: inline-block; width: 28px; height: 28px; background: #2563eb; color: white; border-radius: 50%; text-align: center; line-height: 28px; margin-right: 10px; font-size: 14px;">${index + 1}</span>
                        ${step.title}
                    </h3>
                    ${step.sourceName ? `<div style="margin-top: 8px; font-size: 12px; color: #94a3b8;"><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">🖥️ ${step.sourceName}</span></div>` : ''}
                </div>
                <div style="padding: 15px;">
                    <img src="${step.image}" style="max-width: 100%; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 15px;">
                    <p style="margin: 0; color: #475569; line-height: 1.6;">${step.description || '<em style="color: #94a3b8;">Aucune description</em>'}</p>
                </div>
            </div>
        `;
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; }
                .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { margin: 0 0 10px 0; font-size: 28px; color: #0f172a; }
                .header .meta { color: #64748b; font-size: 14px; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${title}</h1>
                <div class="meta">
                    Généré le ${date} • ${state.steps.length} étape(s) • QuickFlow V2
                </div>
            </div>

            ${tocHTML}

            ${stepsHTML}

            <div class="footer">
                Document généré automatiquement par QuickFlow V2 - Intelligence Contextuelle
            </div>
        </body>
        </html>
    `;
}

// ==========================================
// Export Menu
// ==========================================

function toggleExportMenu() {
    elements.exportMenu.classList.toggle('hidden');
}

function hideExportMenu() {
    elements.exportMenu.classList.add('hidden');
}

// ==========================================
// Génération HTML Standalone
// ==========================================

async function generateHTML() {
    const title = elements.procedureTitle.value || 'Procédure';

    if (state.steps.length === 0) {
        showToast('Aucune étape à exporter.', 'warning');
        return;
    }

    showLoading('Génération du HTML...');

    try {
        const htmlContent = generateHTMLContent(title);
        const filename = `${sanitizeFilename(title)}_${Date.now()}.html`;
        const filepath = await window.electronAPI.saveHtml(filename, htmlContent);

        showToast('HTML exporté avec succès !', 'success');
        window.electronAPI.openOutputFolder();
    } catch (error) {
        console.error('Erreur export HTML:', error);
        showToast('Erreur lors de l\'export HTML.', 'error');
    }

    hideLoading();
}

function generateHTMLContent(title) {
    const date = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    let currentChapter = null;
    let stepsHTML = '';
    let tocHTML = '';

    // Table des matières
    const chapters = [...new Set(state.steps.map(s => s.chapter).filter(Boolean))];
    if (chapters.length > 0) {
        tocHTML = `
            <div class="toc">
                <h2>📑 Table des matières</h2>
                <ul>
                    ${chapters.map((ch, idx) => `<li><a href="#chapter-${idx}">${ch}</a></li>`).join('')}
                </ul>
            </div>
        `;
    }

    let chapterIndex = 0;
    state.steps.forEach((step, index) => {
        if (step.chapter && step.chapter !== currentChapter) {
            currentChapter = step.chapter;
            stepsHTML += `
                <div id="chapter-${chapterIndex}" class="chapter-header">
                    <h2>📌 ${currentChapter}</h2>
                </div>
            `;
            chapterIndex++;
        }

        stepsHTML += `
            <div class="step" id="step-${index + 1}">
                <div class="step-header">
                    <h3>
                        <span class="step-number">${index + 1}</span>
                        ${step.title}
                    </h3>
                    ${step.sourceName ? `<span class="source-tag">🖥️ ${step.sourceName}</span>` : ''}
                </div>
                <div class="step-content">
                    <img src="${step.image}" alt="Étape ${index + 1}" loading="lazy">
                    <p>${step.description || '<em>Aucune description</em>'}</p>
                </div>
            </div>
        `;
    });

    // Navigation entre étapes
    const navHTML = `
        <div class="nav-bar">
            <span>Étape <span id="currentStep">1</span> / ${state.steps.length}</span>
            <div class="nav-buttons">
                <button onclick="goToStep('prev')">◀ Précédent</button>
                <button onclick="goToStep('next')">Suivant ▶</button>
            </div>
        </div>
    `;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            line-height: 1.6;
            padding: 20px;
        }
        .container { max-width: 900px; margin: 0 auto; }
        .header {
            background: linear-gradient(135deg, #1e293b, #0f172a);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2em; margin-bottom: 10px; color: #f8fafc; }
        .header .meta { color: #94a3b8; font-size: 0.9em; }
        .toc {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .toc h2 { font-size: 1.2em; margin-bottom: 15px; color: #f8fafc; }
        .toc ul { list-style: none; padding-left: 10px; }
        .toc li { margin: 8px 0; }
        .toc a { color: #60a5fa; text-decoration: none; }
        .toc a:hover { text-decoration: underline; }
        .chapter-header {
            background: linear-gradient(90deg, rgba(37, 99, 235, 0.2), transparent);
            border-left: 4px solid #2563eb;
            padding: 15px 20px;
            margin: 30px 0 20px;
            border-radius: 0 8px 8px 0;
        }
        .chapter-header h2 { color: #60a5fa; font-size: 1.3em; }
        .step {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            margin-bottom: 20px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .step:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
        }
        .step-header {
            background: #334155;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
        }
        .step-header h3 { display: flex; align-items: center; gap: 12px; color: #f8fafc; }
        .step-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: #2563eb;
            color: white;
            border-radius: 50%;
            font-size: 0.9em;
            font-weight: bold;
        }
        .source-tag {
            background: #475569;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.8em;
            color: #cbd5e1;
        }
        .step-content { padding: 20px; }
        .step-content img {
            width: 100%;
            border: 1px solid #475569;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        .step-content p { color: #cbd5e1; }
        .step-content em { color: #64748b; }
        .nav-bar {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            z-index: 100;
        }
        .nav-buttons { display: flex; gap: 10px; }
        .nav-buttons button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9em;
            transition: background 0.2s;
        }
        .nav-buttons button:hover { background: #3b82f6; }
        .footer {
            text-align: center;
            padding: 30px;
            color: #64748b;
            font-size: 0.85em;
            margin-bottom: 80px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <div class="meta">Généré le ${date} • ${state.steps.length} étape(s) • QuickFlow V2</div>
        </div>

        ${tocHTML}
        ${stepsHTML}

        <div class="footer">
            Document généré automatiquement par QuickFlow V2 - Intelligence Contextuelle
        </div>
    </div>

    ${navHTML}

    <script>
        let currentStep = 1;
        const totalSteps = ${state.steps.length};

        function goToStep(direction) {
            if (direction === 'next' && currentStep < totalSteps) {
                currentStep++;
            } else if (direction === 'prev' && currentStep > 1) {
                currentStep--;
            }
            document.getElementById('currentStep').textContent = currentStep;
            document.getElementById('step-' + currentStep).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Observer pour mettre à jour le numéro d'étape actuel au scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stepId = entry.target.id;
                    const stepNum = parseInt(stepId.replace('step-', ''));
                    if (!isNaN(stepNum)) {
                        currentStep = stepNum;
                        document.getElementById('currentStep').textContent = currentStep;
                    }
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.step').forEach(step => observer.observe(step));
    </script>
</body>
</html>
    `;
}

// ==========================================
// Génération Markdown + Images
// ==========================================

async function generateMarkdown() {
    const title = elements.procedureTitle.value || 'Procédure';

    if (state.steps.length === 0) {
        showToast('Aucune étape à exporter.', 'warning');
        return;
    }

    showLoading('Génération du Markdown...');

    try {
        const markdown = generateMarkdownContent(title);
        const images = state.steps.map(step => ({ base64: step.image }));
        const folderName = `${sanitizeFilename(title)}_${Date.now()}`;

        const folderPath = await window.electronAPI.saveMarkdown(folderName, markdown, images);

        showToast('Markdown exporté avec succès !', 'success');
        window.electronAPI.openOutputFolder();
    } catch (error) {
        console.error('Erreur export Markdown:', error);
        showToast('Erreur lors de l\'export Markdown.', 'error');
    }

    hideLoading();
}

function generateMarkdownContent(title) {
    const date = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    let markdown = `# ${title}\n\n`;
    markdown += `> Généré le ${date} • ${state.steps.length} étapes • QuickFlow V2\n\n`;

    // Table des matières
    const chapters = [...new Set(state.steps.map(s => s.chapter).filter(Boolean))];
    if (chapters.length > 0) {
        markdown += `## 📑 Table des matières\n\n`;
        chapters.forEach((ch, idx) => {
            markdown += `${idx + 1}. [${ch}](#${ch.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')})\n`;
        });
        markdown += `\n---\n\n`;
    }

    let currentChapter = null;
    state.steps.forEach((step, index) => {
        // Header de chapitre
        if (step.chapter && step.chapter !== currentChapter) {
            currentChapter = step.chapter;
            markdown += `## 📌 ${currentChapter}\n\n`;
        }

        markdown += `### Étape ${index + 1}: ${step.title}\n\n`;
        markdown += `![Étape ${index + 1}](./images/step_${index + 1}.png)\n\n`;

        if (step.description) {
            markdown += `${step.description}\n\n`;
        }

        if (step.sourceName) {
            markdown += `*🖥️ Application: ${step.sourceName}*\n\n`;
        }

        markdown += `---\n\n`;
    });

    markdown += `\n*Document généré automatiquement par QuickFlow V2*\n`;

    return markdown;
}

// ==========================================
// Génération GIF Animé
// ==========================================

async function generateGIF() {
    if (state.steps.length === 0) {
        showToast('Aucune étape à exporter.', 'warning');
        return;
    }

    if (state.steps.length < 2) {
        showToast('Au moins 2 étapes sont nécessaires pour créer un GIF animé.', 'warning');
        return;
    }

    showLoading('Génération du GIF animé...');

    try {
        const title = elements.procedureTitle.value || 'Procédure';
        const images = state.steps.map(step => step.image);
        const delay = 2000; // 2 secondes entre chaque frame
        const filename = `${sanitizeFilename(title)}_${Date.now()}.gif`;

        const filepath = await window.electronAPI.generateGif(images, delay, filename);

        showToast('GIF exporté avec succès !', 'success');
        window.electronAPI.openOutputFolder();
    } catch (error) {
        console.error('Erreur export GIF:', error);
        showToast('Erreur lors de l\'export GIF.', 'error');
    }

    hideLoading();
}

// ==========================================
// Utilitaires
// ==========================================

/**
 * Nettoie un nom de fichier pour le rendre valide
 */
function sanitizeFilename(name) {
    return name
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
}

// ==========================================
// Navigation & Dashboard
// ==========================================

function setActiveNav(navItem) {
    // Remove active class from all nav items
    const navItems = [elements.navDashboard, elements.navNewProcedure, elements.navMyProcedures, elements.navSharedWithMe];
    navItems.forEach(item => {
        if (item) {
            item.classList.remove('bg-azure-primary/10', 'text-azure-primary', 'border-azure-primary');
            item.classList.add('text-gray-600', 'hover:bg-gray-100');
        }
    });

    // Add active class to selected nav item
    const activeItem = {
        'dashboard': elements.navDashboard,
        'newProcedure': elements.navNewProcedure,
        'myProcedures': elements.navMyProcedures,
        'sharedWithMe': elements.navSharedWithMe
    }[navItem];

    if (activeItem) {
        activeItem.classList.remove('text-gray-600', 'hover:bg-gray-100');
        activeItem.classList.add('bg-azure-primary/10', 'text-azure-primary', 'border-azure-primary');
    }
}

function renderDashboard() {
    const visibleProcedures = getVisibleProcedures();
    const myProcedures = visibleProcedures.filter(p => isMyProcedure(p));

    // Update stats
    if (elements.statTotalProcedures) {
        elements.statTotalProcedures.textContent = myProcedures.length;
    }

    // Update sidebar procedure count
    const procedureCountEl = document.getElementById('procedureCount');
    if (procedureCountEl) {
        procedureCountEl.textContent = myProcedures.length;
    }

    // Stat shared (procedures I shared with others)
    const statSharedEl = document.getElementById('statShared');
    if (statSharedEl) {
        const sharedCount = myProcedures.filter(p => p.sharedWith?.length > 0).length;
        statSharedEl.textContent = sharedCount;
    }

    // Stat this week
    const statThisWeekEl = document.getElementById('statThisWeek');
    if (statThisWeekEl) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeekCount = myProcedures.filter(p => new Date(p.createdAt) > oneWeekAgo).length;
        statThisWeekEl.textContent = thisWeekCount;
    }

    // Update recent procedures title
    const parentDiv = elements.recentProceduresList?.closest('.bg-white');
    if (parentDiv) {
        const titleEl = parentDiv.querySelector('h3');
        if (titleEl) titleEl.textContent = 'Procédures récentes';
    }

    // Render recent procedures
    renderRecentProcedures();
}

function renderRecentProcedures() {
    if (!elements.recentProceduresList) return;

    const visibleProcedures = getVisibleProcedures();
    const recentProcedures = visibleProcedures.slice(-5).reverse();

    if (recentProcedures.length === 0) {
        elements.recentProceduresList.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fa-solid fa-folder-open text-4xl mb-4 text-gray-300"></i>
                <p class="font-medium">Aucune procédure récente</p>
                <p class="text-sm mt-1">Créez votre première procédure pour commencer</p>
            </div>
        `;
        return;
    }

    renderProcedureList(recentProcedures);
}

function renderProcedureList(procedures) {
    if (!elements.recentProceduresList) return;

    elements.recentProceduresList.innerHTML = procedures.map((proc, index) => {
        const isMine = isMyProcedure(proc);
        const ownerDept = state.departments.find(d => d.id === proc.ownerDepartment);

        return `
            <div class="procedure-card group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-azure-primary/50 hover:shadow-md transition-all cursor-pointer"
                 data-procedure-id="${proc.id}"
                 style="animation: fadeSlideIn 0.3s ease forwards; animation-delay: ${index * 0.05}s; opacity: 0;">
                <div class="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    ${proc.thumbnail ? `<img src="${proc.thumbnail}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-gray-400"><i class="fa-solid fa-image text-xl"></i></div>`}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-gray-800 truncate">${proc.title || 'Sans titre'}</h4>
                        ${!isMine ? `<span class="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">Partagé</span>` : ''}
                    </div>
                    <p class="text-sm text-gray-500 mt-1">
                        ${proc.steps?.length || 0} étapes • ${formatDate(proc.createdAt)}
                        ${!isMine && ownerDept ? ` • <i class="fa-solid ${ownerDept.icon} text-xs"></i> ${ownerDept.name}` : ''}
                    </p>
                    ${isMine && proc.sharedWith?.length > 0 ? `<span class="inline-flex items-center gap-1 text-xs text-azure-primary mt-1"><i class="fa-solid fa-share-nodes"></i> Partagé avec ${proc.sharedWith.length} département(s)</span>` : ''}
                </div>
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="open-procedure-btn p-2 text-azure-primary hover:bg-azure-primary/10 rounded-lg transition-colors" title="Ouvrir">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    ${isMine ? `
                        <button class="delete-procedure-btn p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners
    addProcedureCardListeners();
}

function addProcedureCardListeners() {
    document.querySelectorAll('.open-procedure-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.procedure-card');
            openProcedure(card.dataset.procedureId);
        });
    });
    document.querySelectorAll('.delete-procedure-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.procedure-card');
            deleteProcedure(card.dataset.procedureId);
        });
    });
    document.querySelectorAll('.procedure-card').forEach(card => {
        card.addEventListener('click', () => openProcedure(card.dataset.procedureId));
    });
}

function renderMyProcedures() {
    if (!elements.recentProceduresList) return;

    // Only show procedures I created
    const myProcedures = getVisibleProcedures().filter(p => isMyProcedure(p)).reverse();

    const parentDiv = elements.recentProceduresList.closest('.bg-white');
    if (parentDiv) {
        const titleEl = parentDiv.querySelector('h3');
        if (titleEl) titleEl.textContent = 'Mes Procédures';
    }

    if (myProcedures.length === 0) {
        elements.recentProceduresList.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fa-solid fa-folder-open text-4xl mb-4 text-gray-300"></i>
                <p class="font-medium">Aucune procédure sauvegardée</p>
                <p class="text-sm mt-1">Créez et sauvegardez des procédures pour les retrouver ici</p>
            </div>
        `;
        return;
    }

    renderProcedureList(myProcedures);
    addProcedureCardListeners();
}

function renderSharedProcedures() {
    if (!elements.recentProceduresList) return;

    // Show procedures shared WITH me (not created by me)
    const sharedWithMe = getVisibleProcedures().filter(p => !isMyProcedure(p)).reverse();

    const parentDiv = elements.recentProceduresList.closest('.bg-white');
    if (parentDiv) {
        const titleEl = parentDiv.querySelector('h3');
        if (titleEl) titleEl.textContent = 'Partagées avec moi';
    }

    if (sharedWithMe.length === 0) {
        elements.recentProceduresList.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fa-solid fa-share-nodes text-4xl mb-4 text-gray-300"></i>
                <p class="font-medium">Aucune procédure partagée avec vous</p>
                <p class="text-sm mt-1">Les procédures partagées par d'autres départements apparaîtront ici</p>
            </div>
        `;
        return;
    }

    renderProcedureList(sharedWithMe);
    addProcedureCardListeners();
}

function renderDepartmentList() {
    if (!elements.departmentList) return;

    elements.departmentList.innerHTML = state.departments.map(dept => `
        <button class="department-filter w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all text-left"
                data-department-id="${dept.id}">
            <i class="fa-solid ${dept.icon} w-5 text-center text-${dept.color}"></i>
            <span class="text-sm">${dept.name}</span>
        </button>
    `).join('');

    // Add event listeners for department filtering
    document.querySelectorAll('.department-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            const deptId = btn.dataset.departmentId;
            filterByDepartment(deptId);
        });
    });
}

function filterByDepartment(deptId) {
    if (!elements.recentProceduresList) return;

    // Show procedures that are shared with this specific department
    // (includes both my procedures I shared with them, and others' procedures shared with them that I can see)
    const filteredProcedures = getVisibleProcedures().filter(p =>
        p.sharedWith?.includes(deptId) || p.ownerDepartment === deptId
    ).reverse();

    const dept = state.departments.find(d => d.id === deptId);
    const parentDiv = elements.recentProceduresList.closest('.bg-white');
    if (parentDiv) {
        const titleEl = parentDiv.querySelector('h3');
        if (titleEl) titleEl.textContent = `Département: ${dept?.name || deptId}`;
    }

    if (filteredProcedures.length === 0) {
        elements.recentProceduresList.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fa-solid fa-filter text-4xl mb-4 text-gray-300"></i>
                <p class="font-medium">Aucune procédure pour ce département</p>
                <p class="text-sm mt-1">Les procédures du département ${dept?.name || deptId} apparaîtront ici</p>
            </div>
        `;
        return;
    }

    renderProcedureList(filteredProcedures);
    addProcedureCardListeners();
}

// ==========================================
// Procedure Management
// ==========================================

function loadSavedProcedures() {
    try {
        const saved = localStorage.getItem('quickflow_procedures');
        state.savedProcedures = saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Erreur chargement procédures:', e);
        state.savedProcedures = [];
    }
}

function saveProceduresToStorage() {
    try {
        localStorage.setItem('quickflow_procedures', JSON.stringify(state.savedProcedures));
    } catch (e) {
        console.error('Erreur sauvegarde procédures:', e);
    }
}

function saveProcedure(silent = false) {
    if (state.steps.length === 0) {
        if (!silent) showToast('Aucune étape à sauvegarder.', 'warning');
        return;
    }

    if (!state.userProfile) {
        if (!silent) showToast('Veuillez sélectionner votre département.', 'warning');
        return;
    }

    const title = elements.procedureTitle?.value || 'Sans titre';

    // Check if we're updating an existing procedure
    if (state.currentProcedureId) {
        const existingIndex = state.savedProcedures.findIndex(p => p.id === state.currentProcedureId);
        if (existingIndex !== -1) {
            state.savedProcedures[existingIndex] = {
                ...state.savedProcedures[existingIndex],
                title: title,
                steps: state.steps.map(s => ({ ...s })),
                thumbnail: state.steps[0]?.image || null,
                updatedAt: new Date().toISOString()
            };
            saveProceduresToStorage();
            state.lastSaveTime = Date.now();
            if (!silent) showToast('Procédure mise à jour !', 'success');
            return;
        }
    }

    // Create new procedure
    const procedure = {
        id: `proc_${Date.now()}`,
        title: title,
        steps: state.steps.map(s => ({ ...s })),
        thumbnail: state.steps[0]?.image || null,
        createdAt: new Date().toISOString(),
        ownerDepartment: state.userProfile.department,
        sharedWith: []
    };

    state.savedProcedures.push(procedure);
    state.currentProcedureId = procedure.id;
    saveProceduresToStorage();
    state.lastSaveTime = Date.now();

    if (!silent) showToast('Procédure sauvegardée !', 'success');
    renderDashboard();
}

function openProcedure(procedureId) {
    const procedure = state.savedProcedures.find(p => p.id === procedureId);
    if (!procedure) {
        showToast('Procédure introuvable.', 'error');
        return;
    }

    // Check permissions
    if (!state.userProfile) {
        showToast('Veuillez sélectionner votre département.', 'warning');
        return;
    }

    const canView = procedure.ownerDepartment === state.userProfile.department ||
                    (procedure.sharedWith && procedure.sharedWith.includes(state.userProfile.department));

    if (!canView) {
        showToast('Vous n\'avez pas accès à cette procédure.', 'error');
        return;
    }

    // Load procedure into state
    state.steps = procedure.steps.map(s => ({ ...s }));
    state.currentProcedureId = procedureId;

    if (elements.procedureTitle) {
        elements.procedureTitle.value = procedure.title;
    }

    // Show preview view
    showView('preview');
    renderSteps();
}

function deleteProcedure(procedureId) {
    const procedure = state.savedProcedures.find(p => p.id === procedureId);

    // Only owner can delete
    if (!procedure || !isMyProcedure(procedure)) {
        showToast('Vous ne pouvez supprimer que vos propres procédures.', 'error');
        return;
    }

    if (!confirm('Voulez-vous vraiment supprimer cette procédure ?')) return;

    state.savedProcedures = state.savedProcedures.filter(p => p.id !== procedureId);
    saveProceduresToStorage();

    showToast('Procédure supprimée.', 'success');
    renderDashboard();
}

// ==========================================
// Sharing
// ==========================================

function toggleShareModal(show) {
    if (!elements.shareModal) return;

    if (show) {
        renderShareDepartmentList();
        elements.shareModal.classList.remove('hidden');
    } else {
        elements.shareModal.classList.add('hidden');
        state.selectedDepartments = [];
    }
}

function renderShareDepartmentList() {
    if (!elements.shareDepartmentList) return;

    state.selectedDepartments = [];

    elements.shareDepartmentList.innerHTML = state.departments.map(dept => `
        <label class="share-department-option flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border-2 border-transparent"
               data-department-id="${dept.id}">
            <input type="checkbox" class="department-checkbox w-5 h-5 rounded text-azure-primary focus:ring-azure-primary" value="${dept.id}">
            <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <i class="fa-solid ${dept.icon} text-${dept.color}"></i>
            </div>
            <span class="font-medium text-gray-700">${dept.name}</span>
        </label>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.department-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const deptId = e.target.value;
            const label = e.target.closest('.share-department-option');

            if (e.target.checked) {
                state.selectedDepartments.push(deptId);
                label.classList.add('border-azure-primary', 'bg-azure-primary/5');
            } else {
                state.selectedDepartments = state.selectedDepartments.filter(id => id !== deptId);
                label.classList.remove('border-azure-primary', 'bg-azure-primary/5');
            }
        });
    });
}

function confirmShare() {
    if (state.selectedDepartments.length === 0) {
        showToast('Veuillez sélectionner au moins un département.', 'warning');
        return;
    }

    if (!state.userProfile) {
        showToast('Veuillez sélectionner votre département.', 'warning');
        return;
    }

    // Find current procedure by ID or create new one
    let procedure = state.currentProcedureId
        ? state.savedProcedures.find(p => p.id === state.currentProcedureId)
        : null;

    if (!procedure && state.steps.length > 0) {
        // Save procedure first
        const title = elements.procedureTitle?.value || 'Sans titre';
        procedure = {
            id: `proc_${Date.now()}`,
            title: title,
            steps: state.steps.map(s => ({ ...s })),
            thumbnail: state.steps[0]?.image || null,
            createdAt: new Date().toISOString(),
            ownerDepartment: state.userProfile.department,
            sharedWith: state.selectedDepartments
        };
        state.savedProcedures.push(procedure);
        state.currentProcedureId = procedure.id;
    } else if (procedure) {
        // Only owner can share
        if (!isMyProcedure(procedure)) {
            showToast('Vous ne pouvez partager que vos propres procédures.', 'error');
            toggleShareModal(false);
            return;
        }
        // Update existing procedure
        procedure.sharedWith = [...new Set([...(procedure.sharedWith || []), ...state.selectedDepartments])];
    }

    saveProceduresToStorage();

    const deptNames = state.selectedDepartments.map(id => {
        const dept = state.departments.find(d => d.id === id);
        return dept?.name || id;
    }).join(', ');

    showToast(`Procédure partagée avec: ${deptNames}`, 'success');
    toggleShareModal(false);
    renderDashboard();
}

// ==========================================
// Utility Functions
// ==========================================

function formatDate(isoString) {
    if (!isoString) return 'Date inconnue';
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function showView(view) {
    state.currentView = view;

    // Hide all views
    elements.dashboardView?.classList.add('hidden');
    elements.sourceSelection?.classList.add('hidden');
    elements.recordingView?.classList.add('hidden');
    elements.previewView?.classList.add('hidden');

    switch (view) {
        case 'dashboard':
            elements.dashboardView?.classList.remove('hidden');
            break;
        case 'source':
            elements.sourceSelection?.classList.remove('hidden');
            break;
        case 'recording':
            elements.recordingView?.classList.remove('hidden');
            break;
        case 'preview':
            elements.previewView?.classList.remove('hidden');
            break;
    }
}

function toggleModal(show) {
    if (show) {
        elements.settingsModal.classList.remove('hidden');
    } else {
        elements.settingsModal.classList.add('hidden');
    }
}

async function saveApiKey() {
    const apiKey = elements.apiKeyInput.value;

    if (!apiKey || !apiKey.startsWith('sk-')) {
        showToast('Clé API invalide. Elle doit commencer par "sk-".', 'error');
        return;
    }

    await window.electronAPI.saveApiKey(apiKey);
    state.apiKey = apiKey;
    elements.apiKeyInput.value = '••••••••••••••••';

    showToast('Clé API sauvegardée !', 'success');
    toggleModal(false);
}

function showLoading(text = 'Chargement...') {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

async function resetToStart() {
    // Stop auto-capture if running
    if (state.isRecording) {
        try {
            await window.electronAPI.stopAutoCapture();
            window.electronAPI.removeAutoCaptureListener();
        } catch (e) {
            // Ignore
        }
    }

    state.selectedSource = null;
    state.isRecording = false;
    state.steps = [];
    state.currentProcedureId = null;
    state.isCapturePaused = false;
    if (elements.procedureTitle) elements.procedureTitle.value = '';
    if (elements.recordingTime) elements.recordingTime.textContent = '00:00';

    setActiveNav('newProcedure');
    showView('source');
    loadSources();
}

// ==========================================
// Toast Notifications
// ==========================================

function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    const icons = {
        success: 'fa-check-circle text-green-500',
        error: 'fa-exclamation-circle text-red-500',
        info: 'fa-info-circle text-azure-primary',
        warning: 'fa-exclamation-triangle text-amber-500'
    };
    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-white border-gray-200',
        warning: 'bg-amber-50 border-amber-200'
    };

    toast.className = `toast flex items-center gap-3 px-5 py-4 ${bgColors[type]} rounded-xl shadow-lg border animate-slideIn pointer-events-auto`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type]} text-lg"></i>
        <span class="text-gray-800 font-medium">${message}</span>
    `;

    elements.toastContainer?.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('animate-slideIn');
        toast.classList.add('animate-slideOut');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==========================================
// User Profile & Permissions
// ==========================================

function loadUserProfile() {
    try {
        const saved = localStorage.getItem('quickflow_user_profile');
        state.userProfile = saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error('Erreur chargement profil:', e);
        state.userProfile = null;
    }
}

function saveUserProfile() {
    try {
        localStorage.setItem('quickflow_user_profile', JSON.stringify(state.userProfile));
    } catch (e) {
        console.error('Erreur sauvegarde profil:', e);
    }
}

function showProfileModal() {
    if (!elements.profileModal || !elements.profileDepartments) return;

    // Render department selection cards
    elements.profileDepartments.innerHTML = state.departments.map(dept => `
        <button class="profile-dept-btn flex flex-col items-center gap-3 p-5 bg-gray-50 hover:bg-azure-primary/10 border-2 border-gray-200 hover:border-azure-primary rounded-2xl transition-all group"
                data-department-id="${dept.id}">
            <div class="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <i class="fa-solid ${dept.icon} text-2xl text-${dept.color}"></i>
            </div>
            <span class="font-semibold text-gray-700 group-hover:text-azure-primary transition-colors">${dept.name}</span>
        </button>
    `).join('');

    // Add click listeners
    document.querySelectorAll('.profile-dept-btn').forEach(btn => {
        btn.addEventListener('click', () => selectUserDepartment(btn.dataset.departmentId));
    });

    elements.profileModal.classList.remove('hidden');
}

function selectUserDepartment(deptId) {
    const dept = state.departments.find(d => d.id === deptId);
    if (!dept) return;

    state.userProfile = {
        department: deptId,
        createdAt: new Date().toISOString()
    };

    saveUserProfile();
    elements.profileModal?.classList.add('hidden');

    showToast(`Bienvenue ! Vous êtes maintenant dans le département ${dept.name}`, 'success');

    // Initialize the app
    showView('dashboard');
    renderDashboard();
    renderDepartmentList();
    updateUserDepartmentBadge();
}

function updateUserDepartmentBadge() {
    if (!state.userProfile || !elements.userDepartmentName) return;

    const dept = state.departments.find(d => d.id === state.userProfile.department);
    if (dept) {
        elements.userDepartmentName.textContent = dept.name;
    }
}

function getVisibleProcedures() {
    if (!state.userProfile) return [];

    const userDept = state.userProfile.department;

    return state.savedProcedures.filter(proc => {
        // User can see if they are the owner OR if it's shared with their department
        return proc.ownerDepartment === userDept ||
               (proc.sharedWith && proc.sharedWith.includes(userDept));
    });
}

function isMyProcedure(proc) {
    return state.userProfile && proc.ownerDepartment === state.userProfile.department;
}

// ==========================================
// Lightbox
// ==========================================

function openLightbox(index) {
    if (!elements.lightbox || state.steps.length === 0) return;

    state.currentLightboxIndex = index;
    updateLightboxContent();
    elements.lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    elements.lightbox?.classList.add('hidden');
    document.body.style.overflow = '';
}

function navigateLightbox(direction) {
    const newIndex = state.currentLightboxIndex + direction;
    if (newIndex >= 0 && newIndex < state.steps.length) {
        state.currentLightboxIndex = newIndex;
        updateLightboxContent();
    }
}

function updateLightboxContent() {
    const step = state.steps[state.currentLightboxIndex];
    if (!step) return;

    if (elements.lightboxImage) elements.lightboxImage.src = step.image;
    if (elements.lightboxCaption) elements.lightboxCaption.textContent = step.title || `Étape ${state.currentLightboxIndex + 1}`;
    if (elements.lightboxCounter) elements.lightboxCounter.textContent = `${state.currentLightboxIndex + 1} / ${state.steps.length}`;

    // Show/hide navigation buttons
    if (elements.lightboxPrev) {
        elements.lightboxPrev.style.visibility = state.currentLightboxIndex > 0 ? 'visible' : 'hidden';
    }
    if (elements.lightboxNext) {
        elements.lightboxNext.style.visibility = state.currentLightboxIndex < state.steps.length - 1 ? 'visible' : 'hidden';
    }
}

// ==========================================
// Search
// ==========================================

function handleSearch() {
    const query = elements.searchInput?.value.trim() || '';

    if (query.length === 0) {
        clearSearch();
        return;
    }

    elements.searchClear?.classList.remove('hidden');
    elements.searchResults?.classList.remove('hidden');

    const results = searchProcedures(query);
    if (elements.searchResultCount) {
        elements.searchResultCount.textContent = results.length;
    }

    renderFilteredProcedures(results, `Résultats pour "${query}"`);
}

function clearSearch() {
    if (elements.searchInput) elements.searchInput.value = '';
    elements.searchClear?.classList.add('hidden');
    elements.searchResults?.classList.add('hidden');
    renderDashboard();
}

function searchProcedures(query) {
    const q = query.toLowerCase();
    return getVisibleProcedures().filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.steps && p.steps.some(s =>
            (s.title && s.title.toLowerCase().includes(q)) ||
            (s.description && s.description.toLowerCase().includes(q))
        ))
    );
}

function renderFilteredProcedures(procedures, title) {
    if (!elements.recentProceduresList) return;

    const parentDiv = elements.recentProceduresList.closest('.bg-white');
    if (parentDiv) {
        const titleEl = parentDiv.querySelector('h3');
        if (titleEl) titleEl.textContent = title;
    }

    if (procedures.length === 0) {
        elements.recentProceduresList.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fa-solid fa-search text-4xl mb-4 text-gray-300"></i>
                <p class="font-medium">Aucun résultat</p>
                <p class="text-sm mt-1">Essayez avec d'autres mots-clés</p>
            </div>
        `;
        return;
    }

    renderProcedureList(procedures);
}

// ==========================================
// Keyboard Shortcuts
// ==========================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in input/textarea
        const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

        // ? = Show shortcuts help (always works)
        if (e.key === '?' && !isTyping) {
            e.preventDefault();
            toggleShortcutsModal(true);
            return;
        }

        // Escape = Close modals/lightbox
        if (e.key === 'Escape') {
            closeLightbox();
            toggleModal(false);
            toggleShareModal(false);
            toggleShortcutsModal(false);
            elements.profileModal?.classList.add('hidden');
            return;
        }

        // Arrow keys in lightbox
        if (!elements.lightbox?.classList.contains('hidden')) {
            if (e.key === 'ArrowLeft') navigateLightbox(-1);
            if (e.key === 'ArrowRight') navigateLightbox(1);
            return;
        }

        // Ctrl+key shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    if (state.currentView === 'preview' && state.steps.length > 0) {
                        saveProcedure();
                    }
                    break;
                case 'n':
                    e.preventDefault();
                    setActiveNav('newProcedure');
                    showView('source');
                    loadSources();
                    break;
                case 'f':
                    e.preventDefault();
                    elements.searchInput?.focus();
                    break;
                case 'd':
                    e.preventDefault();
                    toggleDarkMode();
                    break;
            }
        }
    });
}

function toggleShortcutsModal(show) {
    if (show) {
        elements.shortcutsModal?.classList.remove('hidden');
    } else {
        elements.shortcutsModal?.classList.add('hidden');
    }
}

// ==========================================
// Dark Mode
// ==========================================

function initTheme() {
    const savedTheme = localStorage.getItem('quickflow_dark_mode');
    state.isDarkMode = savedTheme === 'true';

    if (state.isDarkMode) {
        document.body.classList.add('dark');
        updateDarkModeUI();
    }
}

function toggleDarkMode() {
    state.isDarkMode = !state.isDarkMode;
    document.body.classList.toggle('dark', state.isDarkMode);
    localStorage.setItem('quickflow_dark_mode', state.isDarkMode);

    updateDarkModeUI();
    showToast(state.isDarkMode ? 'Mode sombre activé' : 'Mode clair activé', 'info');
}

function updateDarkModeUI() {
    if (elements.darkModeIcon) {
        elements.darkModeIcon.className = state.isDarkMode
            ? 'fa-solid fa-sun w-5'
            : 'fa-solid fa-moon w-5';
    }
    if (elements.darkModeText) {
        elements.darkModeText.textContent = state.isDarkMode
            ? 'Mode clair'
            : 'Mode sombre';
    }
}

// ==========================================
// Auto-Save
// ==========================================

function startAutoSave() {
    // Clear any existing interval
    if (state.autoSaveInterval) {
        clearInterval(state.autoSaveInterval);
    }

    state.autoSaveInterval = setInterval(() => {
        if (state.currentView === 'preview' && state.steps.length > 0 && state.userProfile) {
            saveProcedure(true); // silent = true
        }
    }, 30000); // Every 30 seconds
}

// ==========================================
// Drag & Drop
// ==========================================

function initDragAndDrop() {
    const stepCards = document.querySelectorAll('.step-card');

    stepCards.forEach((card, index) => {
        const dragHandle = card.querySelector('.drag-handle');

        // Make only the handle trigger drag
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', () => {
                card.setAttribute('draggable', 'true');
            });
        }

        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            card.classList.add('dragging');
            setTimeout(() => card.style.opacity = '0.5', 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            card.style.opacity = '1';
            card.setAttribute('draggable', 'false');
            // Remove all drag-over classes
            document.querySelectorAll('.step-card').forEach(c => c.classList.remove('drag-over'));
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = document.querySelector('.step-card.dragging');
            if (dragging !== card) {
                card.classList.add('drag-over');
            }
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');

            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = index;

            if (fromIndex !== toIndex) {
                reorderSteps(fromIndex, toIndex);
            }
        });
    });
}

function reorderSteps(from, to) {
    const [moved] = state.steps.splice(from, 1);
    state.steps.splice(to, 0, moved);
    renderSteps();
    showToast('Étapes réorganisées', 'success');
}

// ==========================================
// Éditeur d'Annotations
// ==========================================

const annotationState = {
    isOpen: false,
    stepIndex: -1,
    currentTool: 'arrow',
    currentColor: '#EF4444',
    strokeWidth: 3,
    annotations: [],
    isDrawing: false,
    startX: 0,
    startY: 0,
    canvas: null,
    ctx: null,
    backgroundImage: null,
    tempAnnotation: null
};

// DOM elements for annotation
const annotationElements = {
    modal: document.getElementById('annotationModal'),
    canvas: document.getElementById('annotationCanvas'),
    container: document.getElementById('canvasContainer'),
    stepLabel: document.getElementById('annotationStepLabel'),
    textInput: document.getElementById('annotationTextInput'),
    strokeWidth: document.getElementById('strokeWidth'),
    strokeWidthValue: document.getElementById('strokeWidthValue')
};

function openAnnotationEditor(stepIndex) {
    const step = state.steps[stepIndex];
    if (!step) return;

    annotationState.isOpen = true;
    annotationState.stepIndex = stepIndex;
    annotationState.annotations = step.annotations ? [...step.annotations] : [];
    annotationState.canvas = annotationElements.canvas;
    annotationState.ctx = annotationState.canvas.getContext('2d');

    // Update UI
    annotationElements.stepLabel.textContent = `Étape ${stepIndex + 1}`;
    annotationElements.modal.classList.remove('hidden');

    // Load image and setup canvas
    const img = new Image();
    img.onload = () => {
        annotationState.backgroundImage = img;

        // Calculate canvas size to fit in viewport
        const maxWidth = window.innerWidth - 100;
        const maxHeight = window.innerHeight - 180;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
        }
        if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = width * ratio;
        }

        annotationState.canvas.width = width;
        annotationState.canvas.height = height;
        annotationState.scaleX = width / img.width;
        annotationState.scaleY = height / img.height;

        redrawCanvas();
    };
    img.src = step.originalImage || step.image;

    // Setup annotation event listeners
    setupAnnotationListeners();
}

function setupAnnotationListeners() {
    const canvas = annotationState.canvas;

    // Tool selection
    document.querySelectorAll('.annotation-tool').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.annotation-tool').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            annotationState.currentTool = btn.dataset.tool;
        });
    });

    // Color selection
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => {
                b.classList.remove('ring-2', 'ring-azure-light');
                b.style.borderColor = 'transparent';
            });
            btn.classList.add('ring-2', 'ring-azure-light');
            btn.style.borderColor = 'white';
            annotationState.currentColor = btn.dataset.color;
        });
    });

    // Stroke width
    annotationElements.strokeWidth?.addEventListener('input', (e) => {
        annotationState.strokeWidth = parseInt(e.target.value);
        annotationElements.strokeWidthValue.textContent = e.target.value;
    });

    // Canvas mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseleave', endDrawing);

    // Action buttons
    document.getElementById('undoAnnotation')?.addEventListener('click', undoAnnotation);
    document.getElementById('clearAnnotations')?.addEventListener('click', clearAnnotations);
    document.getElementById('cancelAnnotation')?.addEventListener('click', closeAnnotationEditor);
    document.getElementById('saveAnnotation')?.addEventListener('click', saveAnnotations);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleAnnotationKeyboard);
}

function handleAnnotationKeyboard(e) {
    if (!annotationState.isOpen) return;

    if (e.key === 'Escape') {
        closeAnnotationEditor();
    } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undoAnnotation();
    } else if (e.key === 'a' || e.key === 'A') {
        selectTool('arrow');
    } else if (e.key === 'c' || e.key === 'C') {
        selectTool('circle');
    } else if (e.key === 'r' || e.key === 'R') {
        selectTool('rect');
    } else if (e.key === 't' || e.key === 'T') {
        selectTool('text');
    } else if (e.key === 'h' || e.key === 'H') {
        selectTool('highlight');
    }
}

function selectTool(tool) {
    annotationState.currentTool = tool;
    document.querySelectorAll('.annotation-tool').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
}

function getCanvasCoords(e) {
    const rect = annotationState.canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function startDrawing(e) {
    const coords = getCanvasCoords(e);
    annotationState.isDrawing = true;
    annotationState.startX = coords.x;
    annotationState.startY = coords.y;

    if (annotationState.currentTool === 'text') {
        // Show text input
        const textInput = annotationElements.textInput;
        textInput.style.left = `${e.clientX}px`;
        textInput.style.top = `${e.clientY}px`;
        textInput.style.color = annotationState.currentColor;
        textInput.classList.remove('hidden');
        textInput.value = '';
        textInput.focus();

        textInput.onkeydown = (ke) => {
            if (ke.key === 'Enter') {
                addTextAnnotation(coords.x, coords.y, textInput.value);
                textInput.classList.add('hidden');
            } else if (ke.key === 'Escape') {
                textInput.classList.add('hidden');
            }
        };

        annotationState.isDrawing = false;
    }
}

function draw(e) {
    if (!annotationState.isDrawing) return;

    const coords = getCanvasCoords(e);
    const { startX, startY, currentTool, currentColor, strokeWidth } = annotationState;

    // Create temporary annotation for preview
    annotationState.tempAnnotation = {
        type: currentTool,
        startX, startY,
        endX: coords.x,
        endY: coords.y,
        color: currentColor,
        strokeWidth
    };

    redrawCanvas();
}

function endDrawing(e) {
    if (!annotationState.isDrawing) return;
    annotationState.isDrawing = false;

    const coords = getCanvasCoords(e);
    const { startX, startY, currentTool, currentColor, strokeWidth } = annotationState;

    // Only add if moved enough
    const distance = Math.sqrt(Math.pow(coords.x - startX, 2) + Math.pow(coords.y - startY, 2));
    if (distance > 5) {
        annotationState.annotations.push({
            type: currentTool,
            startX, startY,
            endX: coords.x,
            endY: coords.y,
            color: currentColor,
            strokeWidth
        });
    }

    annotationState.tempAnnotation = null;
    redrawCanvas();
}

function addTextAnnotation(x, y, text) {
    if (!text.trim()) return;

    annotationState.annotations.push({
        type: 'text',
        startX: x,
        startY: y,
        text: text,
        color: annotationState.currentColor,
        fontSize: 18
    });

    redrawCanvas();
}

function redrawCanvas() {
    const { ctx, canvas, backgroundImage, annotations, tempAnnotation, scaleX, scaleY } = annotationState;

    // Clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    // Draw all saved annotations
    annotations.forEach(ann => drawAnnotation(ctx, ann));

    // Draw temporary annotation (while drawing)
    if (tempAnnotation) {
        drawAnnotation(ctx, tempAnnotation);
    }
}

function drawAnnotation(ctx, ann) {
    ctx.strokeStyle = ann.color;
    ctx.fillStyle = ann.color;
    ctx.lineWidth = ann.strokeWidth || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (ann.type) {
        case 'arrow':
            drawArrow(ctx, ann.startX, ann.startY, ann.endX, ann.endY);
            break;

        case 'circle':
            drawCircle(ctx, ann.startX, ann.startY, ann.endX, ann.endY);
            break;

        case 'rect':
            drawRectangle(ctx, ann.startX, ann.startY, ann.endX, ann.endY);
            break;

        case 'highlight':
            drawHighlight(ctx, ann.startX, ann.startY, ann.endX, ann.endY, ann.color);
            break;

        case 'text':
            drawText(ctx, ann.startX, ann.startY, ann.text, ann.color, ann.fontSize);
            break;
    }
}

function drawArrow(ctx, x1, y1, x2, y2) {
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
}

function drawCircle(ctx, x1, y1, x2, y2) {
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const radiusX = Math.abs(x2 - x1) / 2;
    const radiusY = Math.abs(y2 - y1) / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawRectangle(ctx, x1, y1, x2, y2) {
    const width = x2 - x1;
    const height = y2 - y1;

    ctx.beginPath();
    ctx.strokeRect(x1, y1, width, height);
}

function drawHighlight(ctx, x1, y1, x2, y2, color) {
    const width = x2 - x1;
    const height = y2 - y1;

    // Semi-transparent highlight
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x1, y1, width, height);
    ctx.globalAlpha = 1.0;

    // Border
    ctx.strokeRect(x1, y1, width, height);
}

function drawText(ctx, x, y, text, color, fontSize) {
    ctx.font = `bold ${fontSize || 18}px Inter, sans-serif`;
    ctx.fillStyle = color;

    // Text shadow for visibility
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    ctx.fillText(text, x, y);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function undoAnnotation() {
    if (annotationState.annotations.length > 0) {
        annotationState.annotations.pop();
        redrawCanvas();
        showToast('Annotation annulée', 'info');
    }
}

function clearAnnotations() {
    annotationState.annotations = [];
    redrawCanvas();
    showToast('Annotations effacées', 'info');
}

function closeAnnotationEditor() {
    annotationState.isOpen = false;
    annotationElements.modal.classList.add('hidden');
    annotationElements.textInput.classList.add('hidden');

    // Remove event listeners
    document.removeEventListener('keydown', handleAnnotationKeyboard);
}

function saveAnnotations() {
    const { stepIndex, canvas, annotations, backgroundImage } = annotationState;

    // Draw final image with annotations
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d');

    if (backgroundImage) {
        finalCanvas.width = backgroundImage.width;
        finalCanvas.height = backgroundImage.height;

        // Draw original image at full resolution
        finalCtx.drawImage(backgroundImage, 0, 0);

        // Scale annotations to full resolution
        const scaleX = backgroundImage.width / canvas.width;
        const scaleY = backgroundImage.height / canvas.height;

        annotations.forEach(ann => {
            const scaledAnn = { ...ann };
            scaledAnn.startX *= scaleX;
            scaledAnn.startY *= scaleY;
            if (scaledAnn.endX !== undefined) {
                scaledAnn.endX *= scaleX;
                scaledAnn.endY *= scaleY;
            }
            scaledAnn.strokeWidth = (ann.strokeWidth || 3) * Math.max(scaleX, scaleY);
            if (scaledAnn.fontSize) {
                scaledAnn.fontSize *= Math.max(scaleX, scaleY);
            }
            drawAnnotation(finalCtx, scaledAnn);
        });
    }

    // Save to step
    state.steps[stepIndex].image = finalCanvas.toDataURL('image/png');
    state.steps[stepIndex].annotations = [...annotations];

    closeAnnotationEditor();
    renderSteps();
    showToast('Annotations sauvegardées', 'success');
}

// ==========================================
// Démarrage
// ==========================================

init();
