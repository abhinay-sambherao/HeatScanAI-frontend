const API = 'http://127.0.0.1:8000';
let selectedFile = null;

// VIEWS
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  if (name === 'products') loadProducts();
  if (name === 'dashboard') loadDashboard();
}

// UPLOAD
const zone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');

zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.classList.remove('dragover');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

function handleFile(file) {
  selectedFile = file;
  const url = URL.createObjectURL(file);
  const area = document.getElementById('preview-area');
  area.innerHTML = `
    <div class="preview">
      <img src="${url}" alt="Preview">
      <div class="info">
        <div class="name">${file.name}</div>
        <div class="size">${(file.size/1024).toFixed(1)} KB</div>
      </div>
      <button class="remove" onclick="resetUpload()">&times;</button>
    </div>`;
  area.style.display = 'block';
  zone.style.display = 'none';
  document.getElementById('scan-btn').disabled = false;
}

function resetUpload() {
  selectedFile = null;
  document.getElementById('preview-area').style.display = 'none';
  document.getElementById('preview-area').innerHTML = '';
  document.getElementById('progress-area').style.display = 'none';
  document.getElementById('results-area').innerHTML = '';
  document.getElementById('error-area').innerHTML = '';
  document.getElementById('scan-btn').disabled = true;
  zone.style.display = 'block';
  fileInput.value = '';
}

async function runOCR() {
  if (!selectedFile) return;
  const btn = document.getElementById('scan-btn');
  const progressArea = document.getElementById('progress-area');
  const errorArea = document.getElementById('error-area');
  const resultsArea = document.getElementById('results-area');

  btn.disabled = true;
  btn.innerHTML = '&#8987; Scanning...';
  errorArea.innerHTML = '';
  resultsArea.innerHTML = '';

  const steps = ['Uploading image...', 'Preprocessing (OpenCV)...', 'Running OCR (PaddleOCR)...', 'Extracting fields...', 'Matching products...', 'Done!'];
  progressArea.style.display = 'block';
  progressArea.innerHTML = `
    <div class="progress-bar"><div class="fill" id="progress-fill" style="width:0%"></div></div>
    <div class="progress-steps" id="progress-steps"></div>`;

  let stepIdx = 0;
  const stepInterval = setInterval(() => {
    if (stepIdx < steps.length) {
      const el = document.getElementById('progress-steps');
      el.innerHTML = steps.slice(0, stepIdx + 1).map((s, i) =>
        `<div class="step ${i < stepIdx ? 'done' : ''}"><span class="check">${i < stepIdx ? '&#10003;' : '&#9679;'}</span> ${s}</div>`
      ).join('');
      document.getElementById('progress-fill').style.width = ((stepIdx + 1) / steps.length * 100) + '%';
      stepIdx++;
    }
  }, 400);

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);
    const res = await fetch(`${API}/ocr`, { method: 'POST', body: formData });
    clearInterval(stepInterval);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'OCR failed');
    }

    const data = await res.json();
    document.getElementById('progress-fill').style.width = '100%';
    setTimeout(() => { progressArea.style.display = 'none'; }, 500);
    renderResults(data);
  } catch (err) {
    clearInterval(stepInterval);
    progressArea.style.display = 'none';
    errorArea.innerHTML = `<div class="error">&#9888; ${err.message}</div>`;
  }

  btn.disabled = false;
  btn.innerHTML = '&#9654; Scan Now';
}

function renderResults(data) {
  const area = document.getElementById('results-area');
  const confClass = data.confidence >= 70 ? 'confidence-high' : data.confidence >= 40 ? 'confidence-medium' : 'confidence-low';

  let matchesHtml = '';
  if (data.matches && data.matches.length) {
    matchesHtml = data.matches.map(m => `
      <div class="match-card">
        <div class="match-header">
          <h4>${m.manufacturer} ${m.model}</h4>
          <span class="match-score">${m.score.toFixed(1)}% match</span>
        </div>
        <div class="match-details">
          ${m.energy_class ? `<span>Energy: ${m.energy_class}</span>` : ''}
          ${m.fuel_type ? `<span>Fuel: ${m.fuel_type}</span>` : ''}
          ${m.heat_output ? `<span>Output: ${m.heat_output}</span>` : ''}
        </div>
        ${m.reason ? `<div class="match-reason">${m.reason}</div>` : ''}
      </div>`).join('');
  } else {
    matchesHtml = '<div class="empty"><div class="icon">&#128269;</div><p>No matches found in the product database</p></div>';
  }

  area.innerHTML = `
    <div class="card">
      <div class="card-body">
        <div class="result-header">
          <h2>Scan Results</h2>
          <span class="confidence-badge ${confClass}">${data.confidence.toFixed(0)}% confidence</span>
        </div>
        <div class="fields-grid">
          <div class="field-item"><div class="label">Manufacturer</div><div class="value">${data.manufacturer || 'Not detected'}</div></div>
          <div class="field-item"><div class="label">Model</div><div class="value">${data.model || 'Not detected'}</div></div>
          <div class="field-item"><div class="label">OCR Confidence</div><div class="value">${data.confidence.toFixed(1)}%</div></div>
          <div class="field-item"><div class="label">Matches Found</div><div class="value">${data.matches ? data.matches.length : 0}</div></div>
        </div>
        <h3 style="font-size:15px; margin-bottom:12px;">Product Matches</h3>
        ${matchesHtml}
        <details style="margin-top:16px;">
          <summary style="cursor:pointer; font-size:13px; color:var(--text-secondary);">Show raw OCR text</summary>
          <div class="raw-text">${data.raw_text || '(empty)'}</div>
        </details>
      </div>
    </div>`;
}

// PRODUCTS
let searchTimeout;
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadProducts, 300);
}

async function loadProducts() {
  const search = document.getElementById('product-search').value;
  const area = document.getElementById('products-table');
  try {
    const res = await fetch(`${API}/products?search=${encodeURIComponent(search)}&page_size=50`);
    const data = await res.json();
    if (!data.items.length) {
      area.innerHTML = '<div class="empty"><div class="icon">&#128230;</div><p>No products found</p></div>';
      return;
    }
    area.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>EPREL ID</th><th>Manufacturer</th><th>Model</th><th>Energy</th><th>Fuel</th></tr></thead>
        <tbody>${data.items.map(p => `
          <tr>
            <td style="font-family:monospace;font-size:12px;">${p.eprel_id}</td>
            <td>${p.manufacturer_name || '-'}</td>
            <td style="font-weight:600;">${p.model}</td>
            <td>${p.energy_class || '-'}</td>
            <td>${p.fuel_type || '-'}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>
      <div style="margin-top:12px;font-size:13px;color:var(--text-secondary);">Showing ${data.items.length} of ${data.total} products</div>`;
  } catch (err) {
    area.innerHTML = `<div class="error">Failed to load products: ${err.message}</div>`;
  }
}

// DASHBOARD
async function loadDashboard() {
  try {
    const [metricsRes, historyRes, mfrRes] = await Promise.all([
      fetch(`${API}/metrics`),
      fetch(`${API}/admin/ocr-history`),
      fetch(`${API}/manufacturers`)
    ]);
    const metrics = await metricsRes.json();
    const history = await historyRes.json();
    const manufacturers = await mfrRes.json();

    document.getElementById('dashboard-stats').innerHTML = `
      <div class="stat-card"><div class="stat-value">${metrics.products}</div><div class="stat-label">Products</div></div>
      <div class="stat-card"><div class="stat-value">${metrics.manufacturers}</div><div class="stat-label">Manufacturers</div></div>
      <div class="stat-card"><div class="stat-value">${metrics.total_scans}</div><div class="stat-label">Total Scans</div></div>
      <div class="stat-card"><div class="stat-value">${metrics.crawler_runs}</div><div class="stat-label">Crawler Runs</div></div>`;

    if (history.items && history.items.length) {
      document.getElementById('ocr-history').innerHTML = `
        <div class="table-wrap"><table>
          <thead><tr><th>File</th><th>Confidence</th><th>Date</th></tr></thead>
          <tbody>${history.items.map(h => `
            <tr><td>${h.filename}</td><td>${h.confidence.toFixed(1)}%</td><td>${new Date(h.created_at).toLocaleString()}</td></tr>
          `).join('')}</tbody>
        </table></div>`;
    } else {
      document.getElementById('ocr-history').innerHTML = '<div class="empty"><p>No scans yet. Upload an image to get started.</p></div>';
    }

    document.getElementById('manufacturers-list').innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Products</th></tr></thead>
        <tbody>${manufacturers.map(m => `
          <tr><td style="font-weight:600;">${m.name}</td><td>${m.product_count}</td></tr>
        `).join('')}</tbody>
      </table></div>`;
  } catch (err) {
    document.getElementById('dashboard-stats').innerHTML = `<div class="error">Failed to load dashboard: ${err.message}</div>`;
  }
}

// INIT
fetch(`${API}/health`).then(r => r.json()).then(d => {
  document.getElementById('status-text').textContent = 'Connected';
}).catch(() => {
  document.getElementById('status-text').textContent = 'Disconnected';
  document.querySelector('.nav-status .dot').style.background = 'var(--danger)';
});
