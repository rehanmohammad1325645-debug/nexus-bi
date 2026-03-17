# Nexus BI | Conversational AI Business Intelligence Dashboard 🚀

Nexus BI is an advanced, AI-driven business intelligence dashboard designed to provide instant, conversational insights from your data. Built for speed, aesthetics, and flexibility, it allows users to upload any CSV file and interact with it through a stunning, glassmorphism-styled interface.

## ✨ Core Features

*   **🤖 Conversational Analyst**: Ask questions in plain English (e.g., "Show me demographics") and get instant visual answers.
*   **📂 Dynamic CSV Upload**: Upload any CSV file. The system automatically detects data types, headers, and values to generate relevant visualizations.
*   **📊 Interactive Visualization Engine**: 
    *   Toggle on-the-fly between **Bar, Pie, Line, Doughnut, and Polar Area** charts.
    *   Intelligent automatic chart selection based on your query.
*   **📑 Dashboard Stats**: Instant calculation of key metrics like **Averages, Maximums, and Record Counts** for every data scan.
*   **💎 Premium UI/UX**: 
    *   Sleek Dark Mode with Glassmorphism effects.
    *   Smooth CSS-driven floating bubble animations and micro-interactions.
    *   Fully responsive design for desktop and mobile.
*   **⚡ Zero-Dependency Frontend**: Runs directly in the browser using high-performance CDNs (Chart.js, PapaParse, Tailwind).

## 🚀 Getting Started

Nexus BI is designed for a seamless, zero-config experience.

1.  **Open the Dashboard**: Simply open `frontend/index.html` in any modern web browser.
2.  **Login**: Use the pre-filled mock credentials (or any text) to enter the interface.
3.  **Upload Data**: 
    *   Click the **Paperclip icon** in the chat bar or the **"Upload New CSV"** button in the sidebar.
    *   Select your CSV file (e.g., `customer_behavior.csv`).
4.  **Analyze**: 
    *   Type `"Analyze this data"` or `"Show me a pie chart"`.
    *   Use the switcher buttons beneath generated charts to explore different perspectives.

## 🛠️ Technology Stack

*   **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3.
*   **Styling**: Tailwind CSS (via CDN) for a modern, utility-first design system.
*   **Charts**: [Chart.js](https://www.chartjs.org/) for high-performance, interactive visualizations.
*   **Parsing**: [PapaParse](https://www.papaparse.com/) for lightning-fast client-side CSV processing.
*   **Icons**: Phosphor Icons for a clean, professional aesthetic.
*   **Backend (Optional)**: Node.js/Express server (located in `backend/`) for future API integrations.

## 🏆 Hackathon Submission

This project was developed for a high-intensity hackathon, focusing on:
1.  **Flexibility**: Handling "so many CSV files" dynamically.
2.  **User Experience**: Toppling the challenge with a "WOW" factor in design.
3.  **Instant Intelligence**: Moving from raw data to visual insight in seconds.

---
Developed with ❤️ by Rehan Mohammad.
