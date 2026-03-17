const express = require('express');
const cors = require('cors');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../frontend')));

// Chart Colors (Same as frontend for consistency)
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

// Database of predefined mock responses
const responseDatabase = [
    {
        keywords: ['sales', 'region', 'distribution', 'q3'],
        text: `<h3>Q3 Sales Distribution by Region</h3>
               <p>Here is the breakdown of sales performance across key regions for the third quarter. **North America** continues to lead with a 45% share, followed by **Europe** at 30%.</p>
               <ul>
                 <li>North America showed a 12% YoY growth.</li>
                 <li>APAC region is emerging rapidly, driven by new product launches.</li>
               </ul>
               <p>I recommend allocating more marketing budget to the APAC region for Q4 to capture emerging market share.</p>`,
        chartConfig: {
            type: 'doughnut',
            data: {
                labels: ['North America', 'Europe', 'APAC', 'LATAM'],
                datasets: [{
                    data: [45, 30, 15, 10],
                    backgroundColor: [chartColors.brand, chartColors.accent, chartColors.blue, chartColors.orange],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: chartColors.text, padding: 20 } }
                },
                cutout: '70%'
            }
        }
    },
    {
        keywords: ['user', 'active', 'trend', 'month', 'engagement'],
        text: `<h3>Active User Trends (Last 6 Months)</h3>
               <p>I've analyzed the active user engagement over the last 6 months. We can observe a steady upward trajectory starting from March, peaking in July.</p>
               <p>The sudden spike in June correlates directly with the **V2.0 Platform Update** rollout.</p>`,
        chartConfig: {
            type: 'line',
            data: {
                labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Monthly Active Users (k)',
                    data: [120, 135, 142, 180, 250, 275],
                    borderColor: chartColors.accent,
                    backgroundColor: chartColors.accentFade,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#020617', // Match front-end background
                    pointBorderColor: chartColors.accent,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { grid: { color: chartColors.grid }, beginAtZero: true },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        }
    },
    {
        keywords: ['revenue', 'product', 'compare', 'top'],
        text: `<h3>Revenue Comparison by Product Line</h3>
               <p>Comparing our top 3 product lines for the current fiscal year:</p>
               <p><strong>Nexus Core Data</strong> remains our flagship revenue driver, though <strong>Cloud Storage Upgrades</strong> are showing the highest MoM growth rate.</p>`,
        chartConfig: {
            type: 'bar',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4 (Proj)'],
                datasets: [
                    { label: 'Nexus Core', data: [400, 450, 480, 520], backgroundColor: chartColors.brand, borderRadius: 4 },
                    { label: 'Cloud Storage', data: [150, 200, 280, 350], backgroundColor: chartColors.accent, borderRadius: 4 },
                    { label: 'API Access', data: [100, 110, 105, 120], backgroundColor: chartColors.blue, borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { stacked: false, grid: { color: chartColors.grid } },
                    x: { stacked: false, grid: { display: false } }
                }
            }
        }
    }
];

const defaultResponse = {
    text: `<h3>Data Analysis Complete</h3>
           <p>I have processed your query against the connected datasets. However, I couldn't find a direct visualization match for those specific parameters.</p>
           <p>Could you try rephrasing or specify if you want to look at <strong>Sales</strong>, <strong>User Engagement</strong>, or <strong>Revenue comparisons</strong>?</p>`,
    chartConfig: null
};

// --- API Endpoints ---

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'Nexus BI Backend is Running' });
});

// Chat Endpoint
app.post('/api/chat', (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const lowercaseText = query.toLowerCase();
    let bestMatch = defaultResponse;
    let maxMatches = 0;

    // Simulated simple NLP via keyword matching
    responseDatabase.forEach(item => {
        let matches = 0;
        item.keywords.forEach(kw => {
            if (lowercaseText.includes(kw)) matches++;
        });
        if (matches > maxMatches && matches > 0) {
            maxMatches = matches;
            bestMatch = item;
        }
    });

    // Simulated processing delay to make it feel like "AI"
    setTimeout(() => {
        res.json({
            response: bestMatch.text,
            chartConfig: bestMatch.chartConfig
        });
    }, 1500 + Math.random() * 1000); // Random delay between 1.5s - 2.5s
});

// Catch-all route to serve the index.html for any non-API routes 
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Nexus BI Backend Server successfully started on http://localhost:${PORT}`);
    console.log(`[Tip] API ready to accept POST requests at /api/chat`);
});
