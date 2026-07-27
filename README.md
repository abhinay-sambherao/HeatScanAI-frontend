# HeatScan AI — Frontend

Standalone SPA frontend for the HeatScan AI platform. Connects to the [HeatScanAI backend](https://github.com/abhinay-sambherao/HeatScanAI).

## Quick Start

```bash
# Option 1: Open directly
open index.html

# Option 2: Serve locally
python3 -m http.server 3000
# Then open http://localhost:3000
```

Backend must be running at `http://127.0.0.1:8000`.

## Features

- **Upload Tab** — Drag-and-drop nameplate photo → OCR scan → product matches
- **Products Tab** — Search and browse the EPREL product database
- **Dashboard Tab** — Scan history, manufacturer stats, system metrics

## Project Structure

```
├── index.html        # SPA entry point
├── css/
│   └── style.css     # All styles (EVH red theme)
├── js/
│   └── app.js        # All application logic
├── images/           # Static assets
├── README.md
└── .gitignore
```

## Configuration

Edit the API URL in `js/app.js`:
```js
const API = 'http://your-backend-url:8000';
```

## Tech

- Vanilla HTML/CSS/JS (no framework dependencies)
- Fetch API for backend communication
- Responsive design (mobile-friendly)
- EVH brand colors (red #E40000)

## Related

- [HeatScanAI Backend](https://github.com/abhinay-sambherao/HeatScanAI) — FastAPI + PaddleOCR + PostgreSQL
