// ==========================================
// QuickFlow - Application principale
// ==========================================

// État global de l'application
const state = {
    selectedSource: null,
    isRecording: false,
    recordingStartTime: null,
    steps: [],
    apiKey: null
};

// Éléments DOM
const elements = {
    // Views
    sourceSelection: document.getElementById('sourceSelection'),
    recordingView: document.getElementById('recordingView'),
    previewView: document.getElementById('previewView'),

    // Source selection
    sourcesList: document.getElementById('sourcesList'),
    refreshSourcesBtn: document.getElementById('refreshSourcesBtn'),

    // Recording
    stepCount: document.getElementById('stepCount'),
    recordingTime: document.getElementById('recordingTime'),
    captureStepBtn: document.getElementById('captureStepBtn'),
    stopRecordingBtn: document.getElementById('stopRecordingBtn'),

    // Preview
    procedureTitle: document.getElementById('procedureTitle'),
    stepsList: document.getElementById('stepsList'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    generatePdfBtn: document.getElementById('generatePdfBtn'),
    newRecordingBtn: document.getElementById('newRecordingBtn'),

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

    // Charger les sources d'écran
    await loadSources();

    // Event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Sources
    elements.refreshSourcesBtn.addEventListener('click', loadSources);

    // Recording
    elements.captureStepBtn.addEventListener('click', captureStep);
    elements.stopRecordingBtn.addEventListener('click', stopRecording);

    // Preview
    elements.analyzeBtn.addEventListener('click', analyzeWithAI);
    elements.generatePdfBtn.addEventListener('click', generatePDF);
    elements.newRecordingBtn.addEventListener('click', resetToStart);

    // Settings
    elements.settingsBtn.addEventListener('click', () => toggleModal(true));
    elements.closeSettingsBtn.addEventListener('click', () => toggleModal(false));
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    elements.openOutputBtn.addEventListener('click', () => window.electronAPI.openOutputFolder());

    // Fermer modal en cliquant à l'extérieur
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) toggleModal(false);
    });
}

// ==========================================
// Gestion des sources d'écran
// ==========================================

async function loadSources() {
    elements.sourcesList.innerHTML = `
        <div class="col-span-full text-center py-8 text-slate-500">
            <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
            <p>Chargement des sources...</p>
        </div>
    `;

    try {
        const sources = await window.electronAPI.getSources();
        renderSources(sources);
    } catch (error) {
        elements.sourcesList.innerHTML = `
            <div class="col-span-full text-center py-8 text-red-400">
                <i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
                <p>Erreur lors du chargement des sources</p>
            </div>
        `;
    }
}

function renderSources(sources) {
    elements.sourcesList.innerHTML = sources.map(source => `
        <div class="source-card cursor-pointer bg-dark-900 rounded-xl border border-slate-800 hover:border-primary-500 transition overflow-hidden group"
             data-source-id="${source.id}">
            <div class="aspect-video bg-slate-800 overflow-hidden">
                <img src="${source.thumbnail}" alt="${source.name}" class="w-full h-full object-cover group-hover:scale-105 transition">
            </div>
            <div class="p-3">
                <p class="text-sm font-medium truncate">${source.name}</p>
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

function startRecording() {
    state.isRecording = true;
    state.recordingStartTime = Date.now();
    state.steps = [];

    showView('recording');
    updateStepCount();
    startTimer();
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

function stopRecording() {
    state.isRecording = false;

    if (state.steps.length === 0) {
        alert('Aucune étape capturée. Veuillez capturer au moins une étape.');
        resetToStart();
        return;
    }

    showView('preview');
    renderSteps();
}

// ==========================================
// Prévisualisation et édition
// ==========================================

function renderSteps() {
    elements.stepsList.innerHTML = state.steps.map((step, index) => `
        <div class="step-card bg-dark-900 rounded-xl border border-slate-800 overflow-hidden" data-step-index="${index}">
            <div class="flex">
                <div class="w-80 flex-shrink-0 bg-slate-800">
                    <img src="${step.image}" alt="Étape ${index + 1}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <span class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                                ${index + 1}
                            </span>
                            <input type="text" value="${step.title}" 
                                   class="step-title bg-transparent text-lg font-bold focus:outline-none border-b border-transparent focus:border-primary-500"
                                   placeholder="Titre de l'étape">
                        </div>
                        <button class="delete-step-btn p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                    <textarea class="step-description w-full bg-slate-800/50 rounded-lg p-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                              rows="3" placeholder="Description de l'étape (sera enrichie par l'IA)...">${step.description}</textarea>
                </div>
            </div>
        </div>
    `).join('');

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
}

function deleteStep(index) {
    state.steps.splice(index, 1);
    renderSteps();
}

// ==========================================
// Analyse IA
// ==========================================

async function analyzeWithAI() {
    if (!state.apiKey) {
        alert('Veuillez configurer votre clé API OpenAI dans les paramètres.');
        toggleModal(true);
        return;
    }

    showLoading('Analyse IA en cours...');

    try {
        for (let i = 0; i < state.steps.length; i++) {
            elements.loadingText.textContent = `Analyse de l'étape ${i + 1}/${state.steps.length}...`;

            const step = state.steps[i];
            const analysis = await analyzeScreenshot(step.image, i + 1, state.steps.length);

            if (analysis) {
                state.steps[i].title = analysis.title || state.steps[i].title;
                state.steps[i].description = analysis.description || '';
            }
        }

        // Générer aussi un titre global si vide
        if (!elements.procedureTitle.value) {
            elements.procedureTitle.value = await generateProcedureTitle();
        }

        renderSteps();
        alert('Analyse terminée avec succès !');
    } catch (error) {
        console.error('Erreur lors de l\'analyse:', error);
        alert(`Erreur lors de l'analyse IA:\n\n${error.message}\n\nVérifiez que votre clé API est valide et que vous avez accès au modèle GPT-4o.`);
    }

    hideLoading();
}

async function analyzeScreenshot(imageBase64, stepNumber, totalSteps) {
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
                    content: `Tu es un expert en rédaction de procédures techniques. Analyse ce screenshot qui représente l'étape ${stepNumber} sur ${totalSteps} d'une procédure. 
                    Réponds UNIQUEMENT en JSON avec ce format:
                    {
                        "title": "Titre court et clair de l'action (ex: Cliquer sur le bouton Nouveau)",
                        "description": "Description détaillée de ce qu'il faut faire, où cliquer, quoi remplir. Sois précis sur les emplacements."
                    }`
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Analyse cette capture d\'écran et génère le titre et la description de l\'étape.' },
                        { type: 'image_url', image_url: { url: imageBase64 } }
                    ]
                }
            ],
            max_tokens: 500
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    try {
        const content = data.choices[0].message.content;
        // Extraire le JSON de la réponse
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Erreur parsing JSON:', e);
    }

    return null;
}

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
        alert('Erreur lors de la génération du PDF.');
    }

    hideLoading();
}

function generatePDFContent(title) {
    const date = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const stepsHTML = state.steps.map((step, index) => `
        <div class="step" style="page-break-inside: avoid; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 15px; border-bottom: 1px solid #e2e8f0;">
                <h3 style="margin: 0; color: #1e293b; font-size: 16px;">
                    <span style="display: inline-block; width: 28px; height: 28px; background: #2563eb; color: white; border-radius: 50%; text-align: center; line-height: 28px; margin-right: 10px; font-size: 14px;">${index + 1}</span>
                    ${step.title}
                </h3>
            </div>
            <div style="padding: 15px;">
                <img src="${step.image}" style="max-width: 100%; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 15px;">
                <p style="margin: 0; color: #475569; line-height: 1.6;">${step.description || '<em style="color: #94a3b8;">Aucune description</em>'}</p>
            </div>
        </div>
    `).join('');

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
                    Généré le ${date} • ${state.steps.length} étape(s) • QuickFlow
                </div>
            </div>
            
            ${stepsHTML}
            
            <div class="footer">
                Document généré automatiquement par QuickFlow
            </div>
        </body>
        </html>
    `;
}

// ==========================================
// Utilitaires
// ==========================================

function showView(view) {
    elements.sourceSelection.classList.add('hidden');
    elements.recordingView.classList.add('hidden');
    elements.previewView.classList.add('hidden');

    switch (view) {
        case 'source':
            elements.sourceSelection.classList.remove('hidden');
            break;
        case 'recording':
            elements.recordingView.classList.remove('hidden');
            break;
        case 'preview':
            elements.previewView.classList.remove('hidden');
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
        alert('Clé API invalide. Elle doit commencer par "sk-".');
        return;
    }

    await window.electronAPI.saveApiKey(apiKey);
    state.apiKey = apiKey;
    elements.apiKeyInput.value = '••••••••••••••••';

    alert('Clé API sauvegardée !');
    toggleModal(false);
}

function showLoading(text = 'Chargement...') {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function resetToStart() {
    state.selectedSource = null;
    state.isRecording = false;
    state.steps = [];
    elements.procedureTitle.value = '';
    elements.recordingTime.textContent = '00:00';

    showView('source');
    loadSources();
}

// ==========================================
// Démarrage
// ==========================================

init();
