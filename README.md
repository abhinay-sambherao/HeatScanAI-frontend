# HeatScan AI Frontend

Standalone frontend for the EVH HeatScan AI Platform.

## Quick Start

Open `index.html` in a browser. The backend must be running at `http://127.0.0.1:8000`.

To override the backend URL, edit `js/app.js`:
```js
const API = 'http://your-backend-url:8000';
```

## Project Structure

```
├── index.html        # Main SPA entry point
├── css/
│   └── style.css     # All styles
├── js/
│   └── app.js        # All application logic
├── images/           # Static assets
└── .gitignore
```

## Features

- **Upload** — OCR scan of heating system nameplates
- **Products** — Search and browse the product database
- **Dashboard** — Scan history, manufacturer stats, system metrics

## Environment

Requires:
- Modern browser (Chrome, Firefox, Safari, Edge)
- Backend API at configured URL (`http://127.0.0.1:8000` by default)
