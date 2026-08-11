// API base URL — override via <script>window.__API__='...'</script> (e.g. a Netlify
// snippet / env var) or a deployed tunnel URL; defaults to the local backend.
const API = (typeof window !== 'undefined' && window.__API__) || 'http://127.0.0.1:8000';
let selectedFiles = [];
let locationData = { latitude: null, longitude: null, address: null, city: null, installation_year: null };
let cameraStream = null;

// ─── I18N ──────────────────────────────────────────────
const translations = {
  de: {
    gdpr_title: 'Datenschutzhinweis',
    gdpr_intro: 'Mit der Nutzung dieser Anwendung erklären Sie sich mit der folgenden Datenverarbeitung einverstanden:',
    gdpr_item1: 'Erfassung und Speicherung von hochgeladenen Kamerabildern von Heizungs-Typenschildern',
    gdpr_item2: 'Automatische Texterkennung (OCR) und Extraktion von Hersteller-, Modell- und Effizienzdaten',
    gdpr_item3: 'Optional: Erfassung Ihres Standorts (GPS oder manuelle Eingabe) zur regionalen Identifikation von Heizsystemen',
    gdpr_item4: 'Speicherung der Ergebnisse in einer Datenbank zur Produktzuordnung und Analyse',
    gdpr_note: 'Ihre Daten werden ausschließlich für den Betrieb dieser Plattform verwendet und nicht an Dritte weitergegeben. Sie können Ihre Einwilligung jederzeit widerrufen.',
    gdpr_decline: 'Ablehnen',
    gdpr_accept: 'Akzeptieren',
    nav_upload: 'Upload',
    nav_products: 'Produkte',
    nav_dashboard: 'Dashboard',
    connected: 'Verbunden',
    disconnected: 'Getrennt',
    scan_header: 'Heizungsscanner',
    upload_title: 'Typenschild-Foto hochladen',
    upload_sub: 'Bild ablegen oder klicken zum Auswählen',
    or: 'oder',
    take_photo: 'Foto aufnehmen',
    scan_now: 'Scannen',
    scanning: 'Scanne...',
    clear: 'Zurücksetzen',
    db_browser: 'Datenbank durchsuchen',
    search_placeholder: 'Suche nach Modell, EPREL-ID, Hersteller...',
    search: 'Suchen',
    all_categories: 'Alle Kategorien',
    all_energy: 'Alle Effizienzklassen',
    all_fuels: 'Alle Brennstoffe',
    fuel_gas: 'Gas',
    fuel_oil: 'Öl',
    fuel_electric: 'Strom',
    fuel_biomass: 'Biomasse',
    fuel_solar: 'Solar',
    products: 'Produkte',
    loading: 'Lade...',
    recent_scans: 'Letzte OCR-Scans',
    manufacturers: 'Hersteller',
    camera_title: 'Foto aufnehmen',
    capture: 'Aufnehmen',
    cancel: 'Abbrechen',
    camera_denied: 'Kamerazugriff verweigert. Bitte laden Sie stattdessen eine Datei hoch.',
    gps_error: 'Standort konnte nicht ermittelt werden: {msg}. Manuell eingeben oder überspringen.',
    geo_unsupported: 'Standortermittlung wird von Ihrem Browser nicht unterstützt.',
    location_title: 'Standort & Baujahr',
    location_sub: 'Wo und wann wurde diese Heizung installiert? Dies hilft bei der regionalen Identifikation und Altersbestimmung.',
    loc_gps: 'Aktuellen Standort verwenden',
    loc_manual: 'Manuell eingeben',
    skip: 'Überspringen',
    loc_addr_ph: 'Straße',
    loc_city_ph: 'Stadt',
    loc_lat_ph: 'Breitengrad (optional)',
    loc_lng_ph: 'Längengrad (optional)',
    install_year_ph: 'Baujahr (z.B. 2015)',
    confirm_location: 'Standort bestätigen',
    location: 'Standort',
    add_location: 'Standort + Baujahr',
    not_detected: 'Nicht erkannt',
    ocr_confidence: 'OCR-Konfidenz',
    matches_found: 'Gefundene Treffer',
    no_matches: 'Keine Treffer in der Produktdatenbank gefunden',
    product_matches: 'Produkt-Treffer',
    show_raw_ocr: 'Rohen OCR-Text anzeigen',
    raw_ocr_empty: '(leer)',
    scan_results: 'Scan-Ergebnisse',
    confidence: 'Konfidenz',
    match: 'Übereinstimmung',
    scanning_steps: ['Bild wird hochgeladen...', 'Vorverarbeitung (OpenCV)...', 'OCR läuft (PaddleOCR)...', 'Felder extrahieren...', 'Produkte abgleichen...', 'Fertig!'],
    uploading: 'Bild wird hochgeladen...',
    preprocessing: 'Vorverarbeitung (OpenCV)...',
    running_ocr: 'OCR läuft (PaddleOCR)...',
    extracting: 'Felder extrahieren...',
    matching: 'Produkte abgleichen...',
    done: 'Fertig!',
    manufacturer: 'Hersteller',
    model: 'Modell',
    category: 'Kategorie',
    energy: 'Energie',
    fuel: 'Brennstoff',
    output: 'Leistung',
    eprel_id: 'EPREL-ID',
    supplier: 'Lieferant',
    eprel_reg: 'EPREL-Registrierungsnummer',
    show_raw_data: 'Rohe EPREL-Daten',
    close: 'Schließen',
    error_ocr: 'OCR-Verarbeitung fehlgeschlagen',
    error_load_products: 'Produkte konnten nicht geladen werden',
    error_load_detail: 'Produktdetail konnte nicht geladen werden',
    error_load_dashboard: 'Dashboard konnte nicht geladen werden',
    page: 'Seite',
    of: 'von',
    no_products: 'Keine Produkte gefunden',
    no_scans: 'Noch keine Scans. Laden Sie ein Bild hoch, um zu starten.',
    products_count: '{n} Produkte',
    guide_prompt: 'Wo finde ich die Daten auf dem Typenschild?',
    guide_show: 'Hilfe anzeigen',
    guide_title: 'Typenschild-Guide',
    guide_intro: 'So finden Sie die wichtigsten Informationen auf dem Typenschild Ihrer Heizung. Achten Sie auf die farbig markierten Bereiche:',
    guide_mfr: 'Herstellername',
    guide_model: 'Modellbezeichnung & Typ',
    guide_energy: 'Energieeffizienzklasse',
    guide_output: 'Nennwärmeleistung (kW)',
    guide_fuel: 'Brennstoff / Gas-Kategorie',
    guide_serial: 'Seriennummer (S/N)',
    guide_year: 'Baujahr / Herstellungsdatum',
    guide_tips_title: 'Tipps für gute Ergebnisse:',
    guide_tip1: 'Halten Sie die Kamera parallel zum Typenschild (nicht schräg)',
    guide_tip2: 'Sorgen Sie für gleichmäßige Beleuchtung ohne Spiegelungen',
    guide_tip3: 'Reinigen Sie das Typenschild falls nötig mit einem trockenen Tuch',
    guide_tip4: 'Machen Sie mehrere Fotos aus verschiedenen Winkeln — das System wählt automatisch die beste Erkennung aus',
    images_count: '{n} Bilder',
    per_image_results: 'Einzelergebnisse anzeigen',
    hide_per_image: 'Einzelergebnisse ausblenden',
    img_uploaded: 'Hochgeladen',
    multi_hint: 'Wählen Sie mehrere Bilder aus verschiedenen Winkeln für optimale Ergebnisse',
  },
  en: {
    gdpr_title: 'Privacy Notice',
    gdpr_intro: 'By using this application you consent to the following data processing:',
    gdpr_item1: 'Collection and storage of uploaded camera images of heating system nameplates',
    gdpr_item2: 'Automatic text recognition (OCR) and extraction of manufacturer, model and efficiency data',
    gdpr_item3: 'Optional: Collection of your location (GPS or manual input) for regional identification of heating systems',
    gdpr_item4: 'Storage of results in a database for product matching and analysis',
    gdpr_note: 'Your data is used exclusively for operating this platform and is not shared with third parties. You can withdraw your consent at any time.',
    gdpr_decline: 'Decline',
    gdpr_accept: 'Accept',
    nav_upload: 'Upload',
    nav_products: 'Products',
    nav_dashboard: 'Dashboard',
    connected: 'Connected',
    disconnected: 'Disconnected',
    scan_header: 'Scan a Heating System',
    upload_title: 'Upload a nameplate photo',
    upload_sub: 'Drag & drop or click to select an image',
    or: 'or',
    take_photo: 'Take Photo',
    scan_now: 'Scan Now',
    scanning: 'Scanning...',
    clear: 'Clear',
    db_browser: 'Database Browser',
    search_placeholder: 'Search by model, EPREL ID, manufacturer...',
    search: 'Search',
    all_categories: 'All categories',
    all_energy: 'All energy classes',
    all_fuels: 'All fuels',
    fuel_gas: 'Gas',
    fuel_oil: 'Oil',
    fuel_electric: 'Electricity',
    fuel_biomass: 'Biomass',
    fuel_solar: 'Solar',
    products: 'Products',
    loading: 'Loading...',
    recent_scans: 'Recent OCR Scans',
    manufacturers: 'Manufacturers',
    camera_title: 'Take a Photo',
    capture: 'Capture',
    cancel: 'Cancel',
    camera_denied: 'Camera access denied. Please upload a file instead.',
    gps_error: 'Could not get location: {msg}. Enter manually or skip.',
    geo_unsupported: 'Geolocation is not supported by your browser.',
    location_title: 'Location & Installation Year',
    location_sub: 'Where and when was this heating system installed? This helps with regional identification and age determination.',
    loc_gps: 'Use Current Location',
    loc_manual: 'Enter Manually',
    skip: 'Skip',
    loc_addr_ph: 'Street address',
    loc_city_ph: 'City',
    loc_lat_ph: 'Latitude (optional)',
    loc_lng_ph: 'Longitude (optional)',
    install_year_ph: 'Installation year (e.g. 2015)',
    confirm_location: 'Confirm Location',
    location: 'Location',
    add_location: 'Location + Year',
    not_detected: 'Not detected',
    ocr_confidence: 'OCR Confidence',
    matches_found: 'Matches Found',
    no_matches: 'No matches found in the product database',
    product_matches: 'Product Matches',
    show_raw_ocr: 'Show raw OCR text',
    raw_ocr_empty: '(empty)',
    scan_results: 'Scan Results',
    confidence: 'Confidence',
    match: 'Match',
    scanning_steps: ['Uploading image...', 'Preprocessing (OpenCV)...', 'Running OCR (PaddleOCR)...', 'Extracting fields...', 'Matching products...', 'Done!'],
    uploading: 'Uploading image...',
    preprocessing: 'Preprocessing (OpenCV)...',
    running_ocr: 'Running OCR (PaddleOCR)...',
    extracting: 'Extracting fields...',
    matching: 'Matching products...',
    done: 'Done!',
    manufacturer: 'Manufacturer',
    model: 'Model',
    category: 'Category',
    energy: 'Energy',
    fuel: 'Fuel',
    output: 'Output',
    eprel_id: 'EPREL ID',
    supplier: 'Supplier',
    eprel_reg: 'EPREL Registration Number',
    show_raw_data: 'Raw EPREL data',
    close: 'Close',
    error_ocr: 'OCR processing failed',
    error_load_products: 'Failed to load products',
    error_load_detail: 'Failed to load product detail',
    error_load_dashboard: 'Failed to load dashboard',
    page: 'Page',
    of: 'of',
    no_products: 'No products found',
    no_scans: 'No scans yet. Upload an image to get started.',
    products_count: '{n} products',
    guide_prompt: 'Where to find the information on the nameplate?',
    guide_show: 'Show guide',
    guide_title: 'Nameplate Guide',
    guide_intro: 'Here is how to find the key information on your heating system\'s nameplate. Look for the color-coded areas:',
    guide_mfr: 'Manufacturer name',
    guide_model: 'Model designation & type',
    guide_energy: 'Energy efficiency class',
    guide_output: 'Rated heat output (kW)',
    guide_fuel: 'Fuel / Gas category',
    guide_serial: 'Serial number (S/N)',
    guide_year: 'Year of manufacture',
    guide_tips_title: 'Tips for best results:',
    guide_tip1: 'Hold the camera parallel to the nameplate (not at an angle)',
    guide_tip2: 'Ensure even lighting without reflections',
    guide_tip3: 'Clean the nameplate with a dry cloth if necessary',
    guide_tip4: 'Take multiple photos from different angles — the system will automatically pick the best results',
    images_count: '{n} images',
    per_image_results: 'Show per-image results',
    hide_per_image: 'Hide per-image results',
    img_uploaded: 'Uploaded',
    multi_hint: 'Select multiple images from different angles for optimal results',
  },
};

function getLang() {
  return localStorage.getItem('heatscan_lang') || (navigator.language && navigator.language.startsWith('de') ? 'de' : 'de');
}

function t(key, vars) {
  const lang = getLang();
  let val = translations[lang] && translations[lang][key];
  if (!val) val = translations.en[key] || key;
  if (vars) {
    for (const k in vars) val = val.replace('{' + k + '}', vars[k]);
  }
  return val;
}

function applyI18n() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.getElementById('lang-toggle').textContent = lang === 'de' ? 'EN' : 'DE';
  // data-i18n: replace textContent
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && !el.hasAttribute('data-i18n-done')) {
      el.textContent = t(key);
      el.setAttribute('data-i18n-done', '1');
    }
  });
  // data-i18n-placeholder: replace placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(key);
  });
}

function toggleLang() {
  const cur = getLang();
  const next = cur === 'de' ? 'en' : 'de';
  localStorage.setItem('heatscan_lang', next);
  // Remove done markers so applyI18n re-applies
  document.querySelectorAll('[data-i18n-done]').forEach(el => el.removeAttribute('data-i18n-done'));
  applyI18n();
  // Refresh dynamic content
  if (document.getElementById('view-products').classList.contains('active')) loadProducts();
  if (document.getElementById('view-dashboard').classList.contains('active')) loadDashboard();
}

// ─── GDPR ──────────────────────────────────────────────
function consentGiven() {
  return localStorage.getItem('heatscan_consent') === 'accepted';
}

function acceptGDPR() {
  localStorage.setItem('heatscan_consent', 'accepted');
  document.getElementById('gdpr-modal').style.display = 'none';
}

function declineGDPR() {
  localStorage.setItem('heatscan_consent', 'declined');
  document.getElementById('gdpr-modal').style.display = 'none';
  alert('Sie müssen der Datenverarbeitung zustimmen, um diese Anwendung nutzen zu können.');
}

function showGDPR() {
  document.getElementById('gdpr-modal').style.display = 'flex';
}

// ─── VIEWS ─────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  const target = event.target.closest('button');
  if (target) target.classList.add('active');
  if (name === 'products') loadProducts();
  if (name === 'dashboard') loadDashboard();
}

// ─── UPLOAD ────────────────────────────────────────────
const zone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');

zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.classList.remove('dragover');
  if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', e => {
  if (e.target.files.length) handleFiles(e.target.files);
});

function handleFiles(files) {
  selectedFiles = Array.from(files);
  const area = document.getElementById('preview-area');
  const locInfo = getLocationSummary();
  const galleryHtml = selectedFiles.map((f, i) => `
    <div class="gallery-item" onclick="removeFile(${i})">
      <img src="${URL.createObjectURL(f)}" alt="${f.name}">
      <div class="gallery-check">&#10003;</div>
      <div class="gallery-name">${f.name}</div>
    </div>`).join('');

  area.innerHTML = `
    <div class="image-gallery">${galleryHtml}</div>
    <div class="preview-info">
      <span>${t('images_count', { n: selectedFiles.length })}</span>
      ${locInfo ? `<span class="location-badge" onclick="showLocationPrompt()">&#128205; ${locInfo}</span>` : `<span class="location-badge add" onclick="showLocationPrompt()">&#128205; <span data-i18n="add_location">Standort + Baujahr</span></span>`}
      <button class="btn btn-secondary" style="padding:4px 12px;font-size:12px;" onclick="resetUpload()">&times; ${t('clear')}</button>
    </div>`;
  area.style.display = 'block';
  zone.style.display = 'none';
  document.getElementById('scan-btn').disabled = false;
  showLocationPrompt();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  if (selectedFiles.length === 0) {
    resetUpload();
    return;
  }
  handleFiles(selectedFiles);
}

function resetUpload() {
  selectedFiles.forEach(f => URL.revokeObjectURL(f));
  selectedFiles = [];
  locationData = { latitude: null, longitude: null, address: null, city: null, installation_year: null };
  document.getElementById('preview-area').style.display = 'none';
  document.getElementById('preview-area').innerHTML = '';
  document.getElementById('progress-area').style.display = 'none';
  document.getElementById('results-area').innerHTML = '';
  document.getElementById('error-area').innerHTML = '';
  document.getElementById('scan-btn').disabled = true;
  zone.style.display = 'block';
  fileInput.value = '';
}

function getLocationSummary() {
  const l = locationData;
  const loc = l.city || l.address || (l.latitude && l.longitude ? `${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}` : l.latitude ? `${l.latitude.toFixed(4)}` : null);
  const yr = l.installation_year ? `Baujahr ${l.installation_year}` : null;
  return [loc, yr].filter(Boolean).join(' · ');
}

// ─── CAMERA ────────────────────────────────────────────
async function openCamera() {
  const modal = document.getElementById('camera-modal');
  modal.style.display = 'flex';
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
    });
    document.getElementById('camera-preview').srcObject = cameraStream;
  } catch (err) {
    alert(t('camera_denied'));
    closeCamera();
  }
}

function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  document.getElementById('camera-modal').style.display = 'none';
}

function capturePhoto() {
  const video = document.getElementById('camera-preview');
  const canvas = document.getElementById('camera-canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  canvas.toBlob(blob => {
    const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
    closeCamera();
    handleFiles([file]);
  }, 'image/jpeg', 0.92);
}

// ─── LOCATION ──────────────────────────────────────────
function showLocationPrompt() {
  document.getElementById('location-modal').style.display = 'flex';
}

function closeLocation(skipped) {
  document.getElementById('location-modal').style.display = 'none';
  if (skipped) {
    locationData = { latitude: null, longitude: null, address: null, city: null, installation_year: null };
  } else {
    const yr = parseInt(document.getElementById('loc-installation-year').value, 10);
    locationData.installation_year = (isNaN(yr) || yr < 1980 || yr > 2030) ? null : yr;
  }
  // Reset modal fields
  document.getElementById('loc-installation-year').value = '';
  document.getElementById('loc-address').value = '';
  document.getElementById('loc-city').value = '';
  document.getElementById('loc-latitude').value = '';
  document.getElementById('loc-longitude').value = '';
  document.getElementById('manual-location-form').style.display = 'none';
  document.querySelector('.location-options').style.display = 'flex';
  if (selectedFiles.length) {
    const area = document.getElementById('preview-area');
    const locInfo = getLocationSummary();
    const galleryHtml = selectedFiles.map((f, i) => `
      <div class="gallery-item" onclick="removeFile(${i})">
        <img src="${URL.createObjectURL(f)}" alt="${f.name}">
        <div class="gallery-check">&#10003;</div>
        <div class="gallery-name">${f.name}</div>
      </div>`).join('');
    area.innerHTML = `
      <div class="image-gallery">${galleryHtml}</div>
      <div class="preview-info">
        <span>${t('images_count', { n: selectedFiles.length })}</span>
        ${locInfo ? `<span class="location-badge" onclick="showLocationPrompt()">&#128205; ${locInfo}</span>` : `<span class="location-badge add" onclick="showLocationPrompt()">&#128205; <span data-i18n="add_location">Standort + Baujahr</span></span>`}
        <button class="btn btn-secondary" style="padding:4px 12px;font-size:12px;" onclick="resetUpload()">&times; ${t('clear')}</button>
      </div>`;
  }
}

function getGPSLocation() {
  if (!navigator.geolocation) {
    alert(t('geo_unsupported'));
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      locationData.latitude = pos.coords.latitude;
      locationData.longitude = pos.coords.longitude;
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18`)
        .then(r => r.json())
        .then(d => {
          const a = (d && d.address) || {};
          locationData.city = a.city || a.town || a.village || a.municipality || a.city_district || a.suburb || a.county || a.state || null;
          locationData.address = a.road ? `${a.road}${a.house_number ? ' ' + a.house_number : ''}` : null;
        })
        .catch(() => {})
        .finally(() => closeLocation(false));
    },
    err => {
      alert(t('gps_error', { msg: err.message }));
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function showManualLocation() {
  document.getElementById('manual-location-form').style.display = 'block';
  document.querySelector('.location-options').style.display = 'none';
}

function confirmManualLocation() {
  locationData.address = document.getElementById('loc-address').value || null;
  locationData.city = document.getElementById('loc-city').value || null;
  const lat = parseFloat(document.getElementById('loc-latitude').value);
  const lng = parseFloat(document.getElementById('loc-longitude').value);
  locationData.latitude = isNaN(lat) ? null : lat;
  locationData.longitude = isNaN(lng) ? null : lng;
  document.getElementById('manual-location-form').style.display = 'none';
  document.querySelector('.location-options').style.display = 'flex';
  closeLocation(false);
}

// ─── OCR SCAN ──────────────────────────────────────────
async function runOCR() {
  if (!selectedFiles.length) return;
  if (!consentGiven()) {
    showGDPR();
    return;
  }
  const btn = document.getElementById('scan-btn');
  const progressArea = document.getElementById('progress-area');
  const errorArea = document.getElementById('error-area');
  const resultsArea = document.getElementById('results-area');

  btn.disabled = true;
  btn.innerHTML = '&#8987; ' + t('scanning');
  errorArea.innerHTML = '';
  resultsArea.innerHTML = '';

  const steps = t('scanning_steps');
  progressArea.style.display = 'block';
  progressArea.innerHTML = `
    <div class="progress-bar"><div class="fill" id="progress-fill" style="width:0%"></div></div>
    <div class="progress-steps" id="progress-steps"></div>`;

  let stepIdx = 0;
  const totalSteps = steps.length - 1;  // "Done!" only shown once the response arrives
  const stepInterval = setInterval(() => {
    if (stepIdx < totalSteps) {
      const el = document.getElementById('progress-steps');
      el.innerHTML = steps.slice(0, stepIdx + 1).map((s, i) =>
        `<div class="step ${i < stepIdx ? 'done' : ''}"><span class="check">${i < stepIdx ? '&#10003;' : '&#9679;'}</span> ${s}</div>`
      ).join('');
      document.getElementById('progress-fill').style.width = Math.round((stepIdx + 1) / steps.length * 100) + '%';
      stepIdx++;
    }
  }, 400);

  try {
    const formData = new FormData();
    for (const f of selectedFiles) {
      formData.append('files', f);
    }
    if (locationData.latitude != null) formData.append('latitude', locationData.latitude);
    if (locationData.longitude != null) formData.append('longitude', locationData.longitude);
    if (locationData.address) formData.append('address', locationData.address);
    if (locationData.city) formData.append('city', locationData.city);
    if (locationData.installation_year) formData.append('installation_year', locationData.installation_year);

    const res = await fetch(`${API}/ocr`, { method: 'POST', body: formData });
    clearInterval(stepInterval);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || t('error_ocr'));
    }

    const data = await res.json();
    document.getElementById('progress-fill').style.width = '100%';
    document.getElementById('progress-steps').innerHTML = steps.map((s) =>
      `<div class="step done"><span class="check">&#10003;</span> ${s}</div>`
    ).join('');
    setTimeout(() => { progressArea.style.display = 'none'; }, 500);
    renderResults(data);
  } catch (err) {
    clearInterval(stepInterval);
    progressArea.style.display = 'none';
    errorArea.innerHTML = `<div class="error">&#9888; ${err.message}</div>`;
  }

  btn.disabled = false;
  btn.innerHTML = '&#9654; ' + t('scan_now');
}

function renderResults(data) {
  const area = document.getElementById('results-area');
  const confClass = data.confidence >= 70 ? 'confidence-high' : data.confidence >= 40 ? 'confidence-medium' : 'confidence-low';

  let imageCountHtml = '';
  if (data.images && data.images.length > 0) {
    imageCountHtml = `<div class="field-item"><div class="label">${t('images_count', { n: '' }).trim() || 'Images'}</div><div class="value">${data.images.length}</div></div>`;
  }

  let matchesHtml = '';
  if (data.matches && data.matches.length) {
    matchesHtml = data.matches.map(m => `
      <div class="match-card">
        <div class="match-header">
          <h4>${m.manufacturer} ${m.model}</h4>
          <span class="match-score">${m.score.toFixed(1)}% ${t('match')}</span>
        </div>
        <div class="match-details">
          ${m.energy_class ? `<span>${t('energy')}: ${m.energy_class}</span>` : ''}
          ${m.fuel_type ? `<span>${t('fuel')}: ${t('fuel_' + m.fuel_type) || m.fuel_type}</span>` : ''}
          ${m.heat_output ? `<span>${t('output')}: ${m.heat_output}</span>` : ''}
        </div>
        ${m.reason ? `<div class="match-reason">${m.reason}</div>` : ''}
      </div>`).join('');
  } else {
    matchesHtml = `<div class="empty"><div class="icon">&#128269;</div><p>${t('no_matches')}</p></div>`;
  }

  let locHtml = '';
  if (data.latitude || data.longitude || data.city || data.address || data.installation_year) {
    const parts = [];
    if (data.address) parts.push(data.address);
    if (data.city) parts.push(data.city);
    if (data.latitude && data.longitude) parts.push(`${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`);
    else if (data.latitude) parts.push(`Lat: ${data.latitude.toFixed(4)}`);
    else if (data.longitude) parts.push(`Lng: ${data.longitude.toFixed(4)}`);
    if (data.installation_year) parts.push(`Baujahr ${data.installation_year}`);
    if (parts.length) {
      locHtml = `<div class="field-item"><div class="label">${t('location')}</div><div class="value">${parts.join(' · ')}</div></div>`;
    }
  }

  let perImageHtml = '';
  if (data.images && data.images.length > 1) {
    const imgCards = data.images.map(img => `
      <div class="per-image-card">
        <div class="img-head">${img.filename}</div>
        <div class="img-conf">${t('ocr_confidence')}: ${img.confidence.toFixed(1)}%</div>
        <div class="img-field"><span class="lbl">${t('manufacturer')}</span><span class="val">${img.manufacturer || '-'}</span></div>
        <div class="img-field"><span class="lbl">${t('model')}</span><span class="val">${img.model || '-'}</span></div>
        <div class="img-field"><span class="lbl">${t('energy')}</span><span class="val">${img.energy_class || '-'}</span></div>
        <div class="img-field"><span class="lbl">${t('fuel')}</span><span class="val">${img.fuel_type || '-'}</span></div>
        <div class="img-field"><span class="lbl">${t('output')}</span><span class="val">${img.heat_output || '-'}</span></div>
      </div>`).join('');
    perImageHtml = `
      <button class="per-image-toggle" onclick="togglePerImage(this)" data-open="false">${t('per_image_results')} (${data.images.length})</button>
      <div class="per-image-grid" style="display:none;">${imgCards}</div>`;
  }

  area.innerHTML = `
    <div class="card">
      <div class="card-body">
        <div class="result-header">
          <h2>${t('scan_results')}</h2>
          <span class="confidence-badge ${confClass}">${data.confidence.toFixed(0)}% ${t('confidence')}</span>
        </div>
        <div class="fields-grid">
          <div class="field-item"><div class="label">${t('manufacturer')}</div><div class="value">${data.manufacturer || t('not_detected')}</div></div>
          <div class="field-item"><div class="label">${t('model')}</div><div class="value">${data.model || t('not_detected')}</div></div>
          <div class="field-item"><div class="label">${t('energy')}</div><div class="value">${data.energy_class || '-'}</div></div>
          <div class="field-item"><div class="label">${t('fuel')}</div><div class="value">${data.fuel_type ? (t('fuel_' + data.fuel_type) || data.fuel_type) : '-'}</div></div>
          <div class="field-item"><div class="label">${t('output')}</div><div class="value">${data.heat_output || '-'}</div></div>
          <div class="field-item"><div class="label">${t('ocr_confidence')}</div><div class="value">${data.confidence.toFixed(1)}%</div></div>
          <div class="field-item"><div class="label">${t('matches_found')}</div><div class="value">${data.matches ? data.matches.length : 0}</div></div>
          ${imageCountHtml}
          ${locHtml}
        </div>
        <h3 style="font-size:15px; margin-bottom:12px;">${t('product_matches')}</h3>
        ${matchesHtml}
        ${perImageHtml}
        <details style="margin-top:16px;">
          <summary style="cursor:pointer; font-size:13px; color:var(--text-secondary);">${t('show_raw_ocr')}</summary>
          <div class="raw-text">${data.raw_text || t('raw_ocr_empty')}</div>
        </details>
      </div>
    </div>`;
}

function togglePerImage(btn) {
  const grid = btn.nextElementSibling;
  const isOpen = btn.getAttribute('data-open') === 'true';
  grid.style.display = isOpen ? 'none' : 'grid';
  btn.setAttribute('data-open', isOpen ? 'false' : 'true');
  btn.textContent = isOpen ? t('per_image_results') + ' (' + grid.children.length + ')' : t('hide_per_image');
}

// ─── GUIDE ─────────────────────────────────────────────
function openGuide() {
  document.getElementById('guide-modal').style.display = 'flex';
}

function closeGuide() {
  document.getElementById('guide-modal').style.display = 'none';
}

// ─── PRODUCTS ──────────────────────────────────────────
let searchTimeout;
let currentPage = 1;
let totalProducts = 0;
const PAGE_SIZE = 50;

function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage = 1; loadProducts(); }, 300);
}

function goToPage(page) {
  currentPage = page;
  loadProducts();
}

async function loadProducts() {
  const search = document.getElementById('product-search').value;
  const category = document.getElementById('filter-category').value;
  const energy = document.getElementById('filter-energy').value;
  const fuel = document.getElementById('filter-fuel').value;
  const area = document.getElementById('products-table');
  const pagination = document.getElementById('pagination-controls');
  const spinner = document.getElementById('table-spinner');

  spinner.style.display = 'inline';

  try {
    let url = `${API}/products?search=${encodeURIComponent(search)}&page=${currentPage}&page_size=${PAGE_SIZE}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (energy) url += `&energy_class=${encodeURIComponent(energy)}`;
    if (fuel) url += `&fuel_type=${encodeURIComponent(fuel)}`;

    const res = await fetch(url);
    const data = await res.json();
    totalProducts = data.total;

    document.getElementById('product-count').textContent = t('products_count', { n: totalProducts });

    if (!data.items.length) {
      area.innerHTML = `<div class="empty"><div class="icon">&#128230;</div><p>${t('no_products')}</p></div>`;
      pagination.innerHTML = '';
      spinner.style.display = 'none';
      return;
    }

    area.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr>
          <th>${t('eprel_id')}</th>
          <th>${t('manufacturer')}</th>
          <th>${t('model')}</th>
          <th>${t('category')}</th>
          <th>${t('energy')}</th>
          <th>${t('fuel')}</th>
          <th>${t('output')}</th>
        </tr></thead>
        <tbody>${data.items.map(p => `
          <tr onclick="showProductDetail('${p.eprel_id}', this)" style="cursor:pointer;">
            <td style="font-family:monospace;font-size:12px;">${p.eprel_id}</td>
            <td style="font-weight:500;">${p.manufacturer_name || '-'}</td>
            <td style="font-weight:600;">${p.model}</td>
            <td>${p.category_name || '-'}</td>
            <td><span class="energy-badge">${p.energy_class || '-'}</span></td>
            <td>${p.fuel_type || '-'}</td>
            <td>${p.heat_output || '-'}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;

    const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
    let pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    pagination.innerHTML = `
      <button onclick="goToPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>&#9664;</button>
      ${pages.map(p => p === '...' ? '<span class="page-info">...</span>' : `<button class="${p === currentPage ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`).join('')}
      <button onclick="goToPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>&#9654;</button>
      <span class="page-info">${t('page')} ${currentPage} ${t('of')} ${totalPages}</span>`;
  } catch (err) {
    area.innerHTML = `<div class="error">${t('error_load_products')}: ${err.message}</div>`;
    pagination.innerHTML = '';
  }

  spinner.style.display = 'none';
}

async function showProductDetail(eprelId, row) {
  const panel = document.getElementById('product-detail');

  document.querySelectorAll('#products-table tr').forEach(r => r.style.background = '');
  if (row) row.style.background = 'rgba(228,0,0,.04)';

  try {
    const res = await fetch(`${API}/products/eprel/${eprelId}`);
    if (!res.ok) throw new Error('Not found');
    const p = await res.json();

    panel.style.display = 'block';
    panel.innerHTML = `
      <div class="card-header">${t('eprel_reg')} — ${p.model}</div>
      <div class="card-body">
        <div class="detail-grid">
          <div class="detail-field"><div class="label">${t('eprel_reg')}</div><div class="value">${p.eprel_id}</div></div>
          <div class="detail-field"><div class="label">${t('manufacturer')}</div><div class="value">${p.manufacturer_name || '-'}</div></div>
          <div class="detail-field"><div class="label">${t('model')}</div><div class="value">${p.model}</div></div>
          <div class="detail-field"><div class="label">${t('category')}</div><div class="value">${p.category_name || '-'}</div></div>
          <div class="detail-field"><div class="label">${t('energy')}</div><div class="value">${p.energy_class || '-'}</div></div>
          <div class="detail-field"><div class="label">${t('fuel')}</div><div class="value">${p.fuel_type || '-'}</div></div>
          <div class="detail-field"><div class="label">${t('output')}</div><div class="value">${p.heat_output || '-'}</div></div>
          <div class="detail-field"><div class="label">${t('supplier')}</div><div class="value">${p.supplier || '-'}</div></div>
        </div>
        <details class="detail-raw">
          <summary>${t('show_raw_data')}</summary>
          <pre>${JSON.stringify(p.raw_json, null, 2)}</pre>
        </details>
        <button class="btn btn-secondary" style="margin-top:16px;" onclick="document.getElementById('product-detail').style.display='none'">${t('close')}</button>
      </div>`;
  } catch (err) {
    panel.style.display = 'block';
    panel.innerHTML = `<div class="card-body"><div class="error">${t('error_load_detail')}: ${err.message}</div></div>`;
  }
}

async function initProductBrowser() {
  try {
    const res = await fetch(`${API}/categories`);
    if (res.ok) {
      const cats = await res.json();
      const select = document.getElementById('filter-category');
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        select.appendChild(opt);
      });
    }
  } catch(e) {}
}

// ─── DASHBOARD ─────────────────────────────────────────
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
      <div class="stat-card"><div class="stat-value">${metrics.products}</div><div class="stat-label">${t('products')}</div></div>
      <div class="stat-card"><div class="stat-value">${metrics.manufacturers}</div><div class="stat-label">${t('manufacturers')}</div></div>
      <div class="stat-card"><div class="stat-value">${metrics.total_scans}</div><div class="stat-label">${t('recent_scans')}</div></div>
      <div class="stat-card"><div class="stat-value">${metrics.crawler_runs}</div><div class="stat-label">Crawler Runs</div></div>`;

    if (history.items && history.items.length) {
      document.getElementById('ocr-history').innerHTML = `
        <div class="table-wrap"><table>
          <thead><tr><th>${t('eprel_id')}</th><th>${t('confidence')}</th><th>${t('location')}</th><th>${t('model')}</th></tr></thead>
          <tbody>${history.items.map(h => {
            const locParts = [];
            if (h.city) locParts.push(h.city);
            else if (h.latitude) locParts.push(`${h.latitude.toFixed(4)}, ${h.longitude ? h.longitude.toFixed(4) : ''}`);
            return `<tr><td>${h.filename}</td><td>${h.confidence.toFixed(1)}%</td><td>${locParts.length ? locParts.join(' · ') : '-'}</td><td>${new Date(h.created_at).toLocaleString(getLang() === 'de' ? 'de-DE' : 'en-GB')}</td></tr>`;
          }).join('')}</tbody>
        </table></div>`;
    } else {
      document.getElementById('ocr-history').innerHTML = `<div class="empty"><p>${t('no_scans')}</p></div>`;
    }

    document.getElementById('manufacturers-list').innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>${t('manufacturer')}</th><th>${t('products')}</th></tr></thead>
        <tbody>${manufacturers.map(m => `
          <tr><td style="font-weight:600;">${m.name}</td><td>${m.product_count}</td></tr>
        `).join('')}</tbody>
      </table></div>`;
  } catch (err) {
    document.getElementById('dashboard-stats').innerHTML = `<div class="error">${t('error_load_dashboard')}: ${err.message}</div>`;
  }
}

// ─── INIT ──────────────────────────────────────────────
function checkHealth(attemptsLeft) {
  attemptsLeft = attemptsLeft === undefined ? 3 : attemptsLeft;
  fetch(`${API}/health`).then(r => r.json()).then(d => {
    document.getElementById('status-text').textContent = t('connected');
    initProductBrowser();
  }).catch(() => {
    if (attemptsLeft > 1) {
      setTimeout(() => checkHealth(attemptsLeft - 1), 1500);
    } else {
      document.getElementById('status-text').textContent = t('disconnected');
      document.querySelector('.nav-status .dot').style.background = 'var(--danger)';
    }
  });
}
checkHealth();

// Apply i18n on load, show GDPR if needed
applyI18n();
if (!consentGiven()) {
  showGDPR();
}
