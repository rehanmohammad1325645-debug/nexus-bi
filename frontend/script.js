// script.js

// --- DOM Elements ---
// Login Elements
const loginApp = document.getElementById('login-app');
const dashboardApp = document.getElementById('dashboard-app');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

// Dashboard Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const historyContainer = document.getElementById('history-container');
const apiStatusSpan = document.getElementById('api-status');

// Templates
const userMsgTemplate = document.getElementById('user-msg-template');
const aiMsgTemplate = document.getElementById('ai-msg-template');

// Chart Colors Config
const chartColors = {
    brand: '#14b8a6',
    brandFade: 'rgba(20, 184, 166, 0.2)',
    accent: '#8b5cf6',
    accentFade: 'rgba(139, 92, 246, 0.2)',
    blue: '#3b82f6',
    orange: '#f97316',
    grid: 'rgba(255, 255, 255, 0.05)',
    text: '#94a3b8'
};
Chart.defaults.color = chartColors.text;
Chart.defaults.font.family = 'Inter, sans-serif';

// App State
let isProcessing = false;
let chartIdCounter = 0;

// Database of predefined mock responses reflecting "Customer Behavior.csv" data
const mockDatabase = [
    {
        id: 'mock-demographics',
        keywords: ['age', 'group', 'demographics', 'distribution', 'bar', 'line', 'pie', 'chart'],
        text: `<h3>Customer Age Demographics</h3>
               <p>I have generated a visualization of your customer age distribution. Most users fall in the 35-50 age bracket.</p>`,
        chartConfig: {
            type: 'bar',
            data: {
                labels: ['18-24', '25-34', '35-50', '51+'],
                datasets: [{
                    label: 'Count',
                    data: [1200, 2450, 3100, 1850],
                    backgroundColor: [chartColors.blue, chartColors.accent, chartColors.brand, chartColors.orange],
                    borderRadius: 4
                }]
            }
        }
    },
    {
        id: 'mock-market',
        keywords: ['product', 'share', 'distribution', 'market', 'pie', 'doughnut', 'bar', 'line', 'chart'],
        text: `<h3>Market Share Distribution</h3>
               <p>Here is a breakdown of your current market share distribution across different product categories.</p>`,
        chartConfig: {
            type: 'pie',
            data: {
                labels: ['Product A', 'Product B', 'Product C', 'Other'],
                datasets: [{
                    data: [40, 25, 20, 15],
                    backgroundColor: [chartColors.brand, chartColors.accent, chartColors.blue, chartColors.orange],
                    borderWidth: 0
                }]
            }
        }
    }
];

// CSV Data Store
let currentDataset = null;
let currentFileName = "customer_behavior.csv";
let chartRegistry = {}; // Store chart instances to update them

// Helper to calculate statistics
function calculateStats(data, column) {
    const values = data.map(r => r[column]).filter(v => typeof v === 'number');
    if (values.length === 0) return null;
    return {
        avg: (values.reduce((a, b) => a + b, 0) / values.length).toLocaleString(undefined, { maximumFractionDigits: 1 }),
        max: Math.max(...values).toLocaleString(),
        min: Math.min(...values).toLocaleString(),
        count: values.length
    };
}

// --- FILE UPLOAD LOGIC ---
const csvFileInput = document.getElementById('csv-file-input');
const dataSourcesList = document.getElementById('data-sources-list');

csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    currentFileName = file.name;
    
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            currentDataset = results.data;
            console.log("Parsed CSV:", currentDataset);
            
            // Add to sidebar
            addNewDataSource(file.name);
            
            // Notify in chat
            addBotMessage(`<h3>File Uploaded: ${file.name}</h3>
                           <p>Successfully parsed <strong>${currentDataset.length}</strong> rows. I am now ready to analyze this data.</p>
                           <p>Try asking: <em>"Analyze this file"</em> or <em>"Show me a summary"</em>.</p>`);
        }
    });
});

function addNewDataSource(name) {
    // Unselect others
    document.querySelectorAll('#data-sources-list button').forEach(b => {
        b.classList.remove('border-emerald-500/20', 'bg-emerald-500/5');
        b.querySelector('.w-2')?.remove();
    });

    const btn = document.createElement('button');
    btn.className = "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group border border-emerald-500/20 bg-emerald-500/5";
    btn.innerHTML = `
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
            <i class="ph ph-file-csv text-emerald-400"></i>
        </div>
        <div class="flex-1 overflow-hidden">
            <p class="text-sm font-medium text-slate-200 truncate">${name}</p>
            <p class="text-xs text-slate-400">User Uploaded</p>
        </div>
        <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
    `;
    dataSourcesList.prepend(btn);
}

// --- DYNAMIC CHART GENERATION ENGINE ---
function generateDynamicChart(data, targetType = null, targetDataCol = null) {
    if (!data || data.length === 0) return null;
    
    // Auto-clean data: Ensure numbers ARE numbers
    const cleanData = data.filter(r => Object.keys(r).length > 1).map(row => {
        const newRow = {...row};
        Object.keys(newRow).forEach(key => {
            const val = newRow[key];
            if (typeof val === 'string') {
                const cleaned = val.replace(/,/g, '').trim();
                if (cleaned !== '' && !isNaN(cleaned)) {
                    newRow[key] = parseFloat(cleaned);
                }
            }
        });
        return newRow;
    });

    const headers = Object.keys(cleanData[0]);
    const numCols = headers.filter(h => typeof cleanData[0][h] === 'number');
    const catCols = headers.filter(h => typeof cleanData[0][h] === 'string');

    if (numCols.length === 0) return null;

    // Use specific column if provided, otherwise default to the first one
    const dataCol = targetDataCol || numCols[0];
    const labelCol = catCols.length > 0 ? catCols[0] : null;

    // Aggregate data for chart
    const aggregated = {};
    cleanData.slice(0, 500).forEach(row => {
        const key = labelCol ? (row[labelCol] || 'Unknown') : 'Record';
        const val = row[dataCol];
        if (typeof val === 'number') {
            aggregated[key] = (aggregated[key] || 0) + val;
        }
    });

    const labels = Object.keys(aggregated).slice(0, 12);
    const values = Object.values(aggregated).slice(0, 12);

    const types = ['bar', 'pie', 'line', 'doughnut', 'polarArea'];
    let selectedType = targetType || types[Math.floor(Math.random() * 3)];
    if (!types.includes(selectedType)) selectedType = 'bar';

    return {
        type: selectedType,
        data: {
            labels: labels,
            datasets: [{
                label: `Total ${dataCol}`,
                data: values,
                backgroundColor: [
                    'rgba(20, 184, 166, 0.7)', // Brand
                    'rgba(139, 92, 246, 0.7)', // Accent
                    'rgba(59, 130, 246, 0.7)', // Blue
                    'rgba(249, 115, 22, 0.7)', // Orange
                    'rgba(244, 63, 94, 0.7)',  // Rose
                    'rgba(234, 179, 8, 0.7)',  // Yellow
                    'rgba(34, 197, 94, 0.7)',  // Green
                ],
                borderColor: selectedType === 'line' ? chartColors.brand : 'rgba(255,255,255,0.1)',
                borderWidth: 2,
                fill: selectedType === 'line',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: (selectedType === 'pie' || selectedType === 'doughnut' || selectedType === 'polarArea'),
            aspectRatio: (selectedType === 'pie' || selectedType === 'doughnut' || selectedType === 'polarArea') ? 1.5 : undefined,
            scales: (selectedType !== 'pie' && selectedType !== 'doughnut' && selectedType !== 'polarArea') ? {
                y: { grid: { color: chartColors.grid }, beginAtZero: true },
                x: { grid: { display: false } }
            } : {},
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { 
                    display: (selectedType === 'pie' || selectedType === 'doughnut' || selectedType === 'polarArea'), 
                    position: 'bottom', 
                    labels: { 
                        color: chartColors.text, 
                        boxWidth: 10, 
                        padding: 12,
                        font: { size: 11 }
                    } 
                }
            }
        }
    };
}

/**
 * Switch chart type dynamically
 */
window.updateVisualization = function(canvasId, type) {
    const chartInstance = chartRegistry[canvasId];
    if (!chartInstance) return;

    let newConfig;
    
    if (chartInstance.originalData) {
        // Dynamic Data Mode
        newConfig = generateDynamicChart(chartInstance.originalData, type, chartInstance.dataCol);
    } else if (chartInstance.mockId) {
        // Mock Data Mode
        const mockItem = mockDatabase.find(m => m.id === chartInstance.mockId);
        if (!mockItem) return;
        
        // Clone and modify type
        newConfig = JSON.parse(JSON.stringify(mockItem.chartConfig));
        newConfig.type = type;
        
        // Remove scales for pie/doughnut if switching from bar/line
        if (['pie', 'doughnut', 'polarArea'].includes(type)) {
            newConfig.options = newConfig.options || {};
            delete newConfig.options.scales;
        } else {
            // Restore scales for bar/line
            newConfig.options = newConfig.options || {};
            newConfig.options.scales = {
                y: { grid: { color: chartColors.grid }, beginAtZero: true },
                x: { grid: { display: false } }
            };
        }
    }

    if (!newConfig) return;
    
    // Destroy and recreate
    chartInstance.chart.destroy();

    const canvas = document.getElementById(canvasId);
    const wrapper = canvas.parentElement;
    
    if (['pie', 'doughnut', 'polarArea'].includes(type)) {
        wrapper.classList.add('flex', 'flex-col', 'items-center', 'justify-center');
        canvas.style.maxWidth = '400px';
    } else {
        wrapper.classList.remove('flex', 'flex-col', 'items-center', 'justify-center');
        canvas.style.maxWidth = 'none';
    }

    chartRegistry[canvasId].chart = new Chart(canvas, newConfig);
};

const defaultResponse = {
    text: `<h3>Ready to Analyze</h3>
           <p>I have processed your data. Please specify what column or trend you'd like to visualize from the uploaded CSV.</p>`,
    chartConfig: null
};


// --- LOGIN LOGIC ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Animate login button
    const btn = document.getElementById('login-submit-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="font-semibold text-white tracking-wide">Authenticating...</span>';
    
    // Simulate auth delay
    setTimeout(() => {
        loginApp.classList.add('opacity-0');
        setTimeout(() => {
            loginApp.classList.add('hidden');
            
            // Show Dashboard
            dashboardApp.classList.remove('hidden');
            setTimeout(() => {
                dashboardApp.classList.remove('opacity-0');
                checkApiHealth();
                userInput.focus();
            }, 50);
        }, 700); // Wait for fade out
    }, 1000);
});

logoutBtn.addEventListener('click', () => {
    dashboardApp.classList.add('opacity-0');
    setTimeout(() => {
        dashboardApp.classList.add('hidden');
        loginApp.classList.remove('hidden');
        const btn = document.getElementById('login-submit-btn');
        btn.innerHTML = '<div class="relative flex items-center justify-center gap-2 py-3"><span class="font-semibold text-white tracking-wide">Enter Dashboard</span><i class="ph-bold ph-arrow-right text-white"></i></div>';
        
        setTimeout(() => {
            loginApp.classList.remove('opacity-0');
        }, 50);
    }, 700);
});


// --- DASHBOARD API LOGIC ---

// Simulate System Ready Status (Since it's fully standalone)
function checkApiHealth() {
    apiStatusSpan.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span class="text-sm font-medium text-emerald-400">Core Systems Online</span>';
}


// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value.trim() !== '') {
        sendBtn.removeAttribute('disabled');
        sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        sendBtn.setAttribute('disabled', 'true');
        sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
});

// Handle Enter key
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

sendBtn.addEventListener('click', handleSend);

// Handle suggestion clicks
document.querySelectorAll('.suggestion-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const text = this.querySelector('span:nth-child(2)').innerText.replace(/"/g, '');
        userInput.value = text;
        handleSend();
    });
});

async function handleSend() {
    const text = userInput.value.trim();
    if (!text || isProcessing) return;

    // Hide welcome screen
    if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
        welcomeScreen.classList.add('opacity-0');
        setTimeout(() => welcomeScreen.classList.add('hidden'), 500);
    }

    // Reset input
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.setAttribute('disabled', 'true');
    sendBtn.classList.add('opacity-50', 'cursor-not-allowed');

    addHistoryItem(text);
    appendUserMessage(text);
    await processAIResponseViaAPI(text);
}

function appendUserMessage(text) {
    const clone = userMsgTemplate.content.cloneNode(true);
    clone.querySelector('.content').textContent = text;
    chatContainer.appendChild(clone);
    scrollToBottom();
}

/**
 * Appends a bot message directly (for system notifications/uploads)
 */
function addBotMessage(htmlContent) {
    if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
        welcomeScreen.classList.add('opacity-0');
        setTimeout(() => welcomeScreen.classList.add('hidden'), 500);
    }
    
    const aiNode = aiMsgTemplate.content.cloneNode(true);
    const contentDiv = aiNode.querySelector('.content');
    const headerDiv = aiNode.querySelector('.border-b');
    const actionBtns = aiNode.querySelector('.action-buttons');
    const chartWrapper = aiNode.querySelector('.chart-wrapper');
    
    headerDiv.innerHTML = '<i class="ph-fill ph-info text-blue-400"></i> <span class="text-blue-400">System Notification</span>';
    contentDiv.innerHTML = htmlContent;
    chartWrapper.classList.add('hidden');
    actionBtns.classList.add('hidden');
    
    chatContainer.appendChild(aiNode);
    scrollToBottom();
}

async function processAIResponseViaAPI(userText) {
    isProcessing = true;
    
    // Create AI bubble with typing indicator
    const aiNode = aiMsgTemplate.content.cloneNode(true);
    const containerDiv = aiNode.querySelector('.flex.justify-start');
    const contentDiv = aiNode.querySelector('.content');
    const headerDiv = aiNode.querySelector('.border-b');
    const actionBtns = aiNode.querySelector('.action-buttons');
    const chartWrapper = aiNode.querySelector('.chart-wrapper');
    
    contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatContainer.appendChild(aiNode);
    scrollToBottom();

    let aiHtmlResponse = "";
    let chartConfig = null;

        // Update header on success
        headerDiv.innerHTML = '<i class="ph-fill ph-check-circle text-emerald-400"></i> <span class="text-emerald-400">Analysis Generated</span>';
        
        // Find best match response
        const lowercaseText = userText.toLowerCase();
        let aiResponse = null;

        // Detect requested chart type
        let requestedType = null;
        if (lowercaseText.includes('pie')) requestedType = 'pie';
        else if (lowercaseText.includes('bar')) requestedType = 'bar';
        else if (lowercaseText.includes('line')) requestedType = 'line';
        else if (lowercaseText.includes('doughnut')) requestedType = 'doughnut';

        if (currentDataset) {
            // Pick appropriate column for analysis
            const headers = Object.keys(currentDataset[0]);
            const numCols = headers.filter(h => !isNaN(currentDataset[0][h]));
            const dataCol = numCols[0];
            const stats = calculateStats(currentDataset, dataCol);

            // Dynamic Logic for uploaded file
            const dynamicChart = generateDynamicChart(currentDataset, requestedType);
            
            let statsHtml = "";
            if (stats) {
                statsHtml = `
                    <div class="grid grid-cols-3 gap-3 mb-4">
                        <div class="stats-card rounded-xl p-3">
                            <p class="text-[10px] text-slate-500 uppercase font-bold mb-1">AVERAGE</p>
                            <p class="text-lg font-bold text-emerald-400">${stats.avg}</p>
                        </div>
                        <div class="stats-card rounded-xl p-3">
                            <p class="text-[10px] text-slate-500 uppercase font-bold mb-1">HIGHEST</p>
                            <p class="text-lg font-bold text-accent-400">${stats.max}</p>
                        </div>
                        <div class="stats-card rounded-xl p-3">
                            <p class="text-[10px] text-slate-500 uppercase font-bold mb-1">RECORDS</p>
                            <p class="text-lg font-bold text-blue-400">${stats.count}</p>
                        </div>
                    </div>
                `;
            }

            aiResponse = {
                text: `<h3>Comprehensive Analysis: ${currentFileName}</h3>
                       <p>I have scanned the dataset and identified <strong>${dataCol}</strong> as the primary metric for visualization.</p>
                       ${statsHtml}
                       <p>You can toggle the visualization below to explore different perspectives of this data.</p>`,
                chartConfig: dynamicChart,
                dataCol: dataCol
            };
        } else {
            // Fallback to mock logic if no file uploaded
            let maxMatches = 0;
            let bestMatch = defaultResponse;
            mockDatabase.forEach(res => {
                let matches = 0;
                res.keywords.forEach(kw => {
                    if (lowercaseText.includes(kw)) matches++;
                });
                if (matches > maxMatches && matches > 0) {
                    maxMatches = matches;
                    bestMatch = res;
                }
            });
            
            // Deep clone mock response to avoid reference issues
            aiResponse = JSON.parse(JSON.stringify(bestMatch));
            aiResponse.mockId = bestMatch.id;

            // If user specifically asked for a type, override the mock type
            if (requestedType && aiResponse.chartConfig) {
                aiResponse.chartConfig.type = requestedType;
                if (['pie', 'doughnut', 'polarArea'].includes(requestedType)) {
                    delete aiResponse.chartConfig.options?.scales;
                }
            }
        }

        // Simulate network delay locally
        setTimeout(() => {
            // Render response content
            contentDiv.innerHTML = aiResponse.text;
            
            // Render Chart JS if data provided
            if (aiResponse.chartConfig) {
                chartWrapper.classList.remove('hidden');
                const canvasId = 'chart-' + chartIdCounter++;
                
                // Add Chart Type Switcher
                const switcher = document.createElement('div');
                switcher.className = "flex gap-2 mb-3 mt-1 justify-center";
                const chartTypes = [
                    { id: 'bar', icon: 'ph-chart-bar' },
                    { id: 'pie', icon: 'ph-chart-pie' },
                    { id: 'line', icon: 'ph-chart-line' },
                    { id: 'doughnut', icon: 'ph-chart-pie-slice' },
                    { id: 'polarArea', icon: 'ph-chart-polar-axial' }
                ];
                
                chartTypes.forEach(t => {
                    const btn = document.createElement('button');
                    btn.className = "px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-brand-500/20 hover:border-brand-500/30 transition-all text-slate-400 hover:text-brand-300 text-xs flex items-center gap-1.5";
                    btn.innerHTML = `<i class="ph ${t.icon}"></i> ${t.id.charAt(0).toUpperCase() + t.id.slice(1)}`;
                    btn.onclick = () => window.updateVisualization(canvasId, t.id);
                    switcher.appendChild(btn);
                });
                chartWrapper.appendChild(switcher);

                const canvas = document.createElement('canvas');
                canvas.id = canvasId;
                canvas.style.maxHeight = '300px';
                canvas.style.width = '100%';
                
                // Add centering classes to chart-wrapper if circular
                if (['pie', 'doughnut', 'polarArea'].includes(aiResponse.chartConfig.type)) {
                    chartWrapper.classList.add('flex', 'flex-col', 'items-center', 'justify-center');
                    canvas.style.maxWidth = '400px';
                } else {
                    chartWrapper.classList.remove('flex', 'flex-col', 'items-center', 'justify-center');
                    canvas.style.maxWidth = 'none';
                }
                
                chartWrapper.appendChild(canvas);
                
                const ctx = document.getElementById(canvasId);
                const chart = new Chart(ctx, aiResponse.chartConfig);

                // Register chart for updates
                chartRegistry[canvasId] = {
                    chart: chart,
                    originalData: currentDataset,
                    dataCol: aiResponse.dataCol,
                    mockId: aiResponse.mockId // Track if this was a mock chart
                };
            }

            actionBtns.classList.remove('hidden');
            actionBtns.classList.add('flex');
            
            scrollToBottom();
            isProcessing = false;
            userInput.focus();
        }, 1500 + Math.random() * 1000); // 1.5 - 2.5s delay
}

function scrollToBottom() {
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
}

function addHistoryItem(text) {
    const btn = document.createElement('button');
    btn.className = 'w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg truncate transition-colors animate-[slideInLeft_0.3s_ease-out]';
    btn.textContent = text;
    btn.onclick = () => {
        userInput.value = text;
        handleSend();
    };
    historyContainer.insertBefore(btn, historyContainer.firstChild);
}

function clearChat() {
    if (isProcessing) return;
    const messages = chatContainer.querySelectorAll('.flex.justify-start, .flex.justify-end');
    messages.forEach(msg => {
        if (!msg.id || msg.id !== 'welcome-screen') {
            msg.remove();
        }
    });
    welcomeScreen.classList.remove('hidden');
    setTimeout(() => welcomeScreen.classList.remove('opacity-0'), 50);
}
