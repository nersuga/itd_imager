// ── ITD Imager v2 — Senior-level app.js ──
// Crop editor + Octree quantization + Mobile bookmarklet

(function () {
  'use strict';

  // ═════════════════════════════════════
  // Config
  // ═════════════════════════════════════
  const SIZES = { banner: [1100, 380], post: [800, 500] };
  const MIN_ZOOM = 1, MAX_ZOOM = 5, ZOOM_STEP = 0.15;

  // ═════════════════════════════════════
  // State
  // ═════════════════════════════════════
  const S = {
    img: null,           // HTMLImageElement
    mode: 'api',         // 'api' | 'draw'
    type: 'banner',
    quality: 'jpeg-85',
    colors: 64,
    brush: 4,
    speed: 1,
    // Crop state
    zoom: 1,
    panX: 0, panY: 0,   // offset as ratio of movable range (0 = center)
    // Computed
    quantized: null,
    script: null,
  };

  // ═════════════════════════════════════
  // DOM refs
  // ═════════════════════════════════════
  const $ = id => document.getElementById(id);
  const dom = {};
  const IDS = [
    'dropzone','fileInput','cropEditor','cropCanvas','cropHint','cropControls',
    'zoomInfo','zoomIn','zoomOut','zoomReset',
    'previewSection','resultCanvas','quantizedCanvas','quantizedBox','resultLabel',
    'palettePreview','statColors','statSize',
    'modeIndicator','modeApi','modeDraw',
    'canvasType','imageQuality','colorCount','colorCountValue',
    'brushSize','drawSpeed',
    'colorsSetting','brushSizeSetting','speedSetting',
    'generateBtn','scriptOutput','scriptPre','copyBtn',
    'bookmarkletLink','copyBookmarklet','toastContainer',
  ];
  IDS.forEach(id => dom[id] = $(id));

  // ═════════════════════════════════════
  // Format helper
  // ═════════════════════════════════════
  function fmt() {
    const q = S.quality;
    if (q === 'png') return ['image/png', undefined, 'png'];
    const [t, v] = q.split('-');
    return [t === 'jpeg' ? 'image/jpeg' : 'image/webp', +v / 100, t === 'jpeg' ? 'jpg' : 'webp'];
  }

  function tw() { return SIZES[S.type][0]; }   // target width
  function th() { return SIZES[S.type][1]; }   // target height

  // ═════════════════════════════════════
  // Init
  // ═════════════════════════════════════
  function init() {
    // Dropzone
    const dz = dom.dropzone;
    dz.addEventListener('click', () => dom.fileInput.click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); e.dataTransfer.files[0] && loadFile(e.dataTransfer.files[0]); });
    dom.fileInput.addEventListener('change', e => e.target.files[0] && loadFile(e.target.files[0]));

    // Mode
    dom.modeApi.addEventListener('click', () => setMode('api'));
    dom.modeDraw.addEventListener('click', () => setMode('draw'));

    // Settings
    dom.canvasType.addEventListener('change', () => { S.type = dom.canvasType.value; resetCrop(); render(); });
    dom.imageQuality.addEventListener('change', () => { S.quality = dom.imageQuality.value; renderResult(); });
    let _colorDebounce = 0;
    dom.colorCount.addEventListener('input', () => {
      S.colors = +dom.colorCount.value;
      dom.colorCountValue.textContent = S.colors;
      clearTimeout(_colorDebounce);
      _colorDebounce = setTimeout(() => renderResult(), 200);
    });
    dom.brushSize.addEventListener('change', () => S.brush = +dom.brushSize.value);
    dom.drawSpeed.addEventListener('change', () => S.speed = +dom.drawSpeed.value);

    // Zoom
    dom.zoomIn.addEventListener('click', () => { setZoom(S.zoom * (1 + ZOOM_STEP)); });
    dom.zoomOut.addEventListener('click', () => { setZoom(S.zoom / (1 + ZOOM_STEP)); });
    dom.zoomReset.addEventListener('click', () => { S.zoom = 1; S.panX = 0; S.panY = 0; renderCrop(); });

    // Generate
    dom.generateBtn.addEventListener('click', generate);
    dom.copyBtn.addEventListener('click', copyScript);
    dom.copyBookmarklet.addEventListener('click', copyBookmarkletCode);

    // Crop pan/zoom interactions
    initCropInteractions();

    // Generate bookmarklet href
    updateBookmarklet();

    // Auto-detect device type by screen size
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth < 1024);
    if (isMobile) {
      S.type = 'post';
      dom.canvasType.value = 'post';
      S.quality = 'jpeg-70';
      dom.imageQuality.value = 'jpeg-70';
    }

    // Show relevant instructions per device
    const desktopInstr = $('desktopInstructions');
    const mobileInstr = $('mobileSection');
    if (isMobile) {
      if (desktopInstr) desktopInstr.classList.add('hidden');
    } else {
      if (mobileInstr) mobileInstr.classList.add('hidden');
    }

    setMode('api');
  }

  // ═════════════════════════════════════
  // Crop Interaction (mouse + touch + pinch + wheel)
  // ═════════════════════════════════════
  function initCropInteractions() {
    const cv = dom.cropCanvas;
    let dragging = false;
    let lastX, lastY;
    let pinchDist = 0;

    // Mouse
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch' && e.isPrimary === false) return;
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      cv.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    cv.addEventListener('pointermove', e => {
      if (!dragging || !S.img) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      pan(dx, dy);
    });

    cv.addEventListener('pointerup', () => dragging = false);
    cv.addEventListener('pointercancel', () => dragging = false);

    // Wheel zoom
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 / (1 + ZOOM_STEP) : (1 + ZOOM_STEP);
      setZoom(S.zoom * delta);
    }, { passive: false });

    // Touch pinch
    const touches = new Map();
    cv.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) touches.set(t.identifier, { x: t.clientX, y: t.clientY });
      if (touches.size === 2) {
        const pts = [...touches.values()];
        pinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      }
    }, { passive: true });

    cv.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) touches.set(t.identifier, { x: t.clientX, y: t.clientY });
      if (touches.size === 2) {
        const pts = [...touches.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        if (pinchDist > 0) setZoom(S.zoom * (dist / pinchDist));
        pinchDist = dist;
      }
    }, { passive: false });

    cv.addEventListener('touchend', e => {
      for (const t of e.changedTouches) touches.delete(t.identifier);
      if (touches.size < 2) pinchDist = 0;
    });

    // Fade hint
    cv.addEventListener('pointerdown', () => {
      dom.cropHint.classList.add('fade');
    }, { once: true });
  }

  function pan(dxPx, dyPx) {
    const cv = dom.cropCanvas;
    const rect = cv.getBoundingClientRect();
    // The image is drawn at a size based on zoom; convert px to logical
    const img = S.img;
    const scaleToCanvas = rect.width / tw();
    // How many image px we moved
    const imgScale = coverScale() * S.zoom;
    const dxImg = dxPx / (imgScale * scaleToCanvas);
    const dyImg = dyPx / (imgScale * scaleToCanvas);

    S.panX = clamp(S.panX + dxImg, -maxPanX(), maxPanX());
    S.panY = clamp(S.panY + dyImg, -maxPanY(), maxPanY());
    renderCrop();
  }

  function coverScale() {
    if (!S.img) return 1;
    return Math.max(tw() / S.img.width, th() / S.img.height);
  }

  function maxPanX() {
    if (!S.img) return 0;
    const s = coverScale() * S.zoom;
    const visW = tw() / s;
    return Math.max(0, (S.img.width - visW) / 2);
  }

  function maxPanY() {
    if (!S.img) return 0;
    const s = coverScale() * S.zoom;
    const visH = th() / s;
    return Math.max(0, (S.img.height - visH) / 2);
  }

  function setZoom(z) {
    S.zoom = clamp(z, MIN_ZOOM, MAX_ZOOM);
    // Re-clamp pan
    S.panX = clamp(S.panX, -maxPanX(), maxPanX());
    S.panY = clamp(S.panY, -maxPanY(), maxPanY());
    dom.zoomInfo.textContent = Math.round(S.zoom * 100) + '%';
    renderCrop();
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // ═════════════════════════════════════
  // Load file
  // ═════════════════════════════════════
  function loadFile(file) {
    if (!file.type.startsWith('image/')) return toast('Не изображение', 'error');
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        S.img = img;
        resetCrop();
        render();
        dom.generateBtn.disabled = false;
        dom.dropzone.classList.add('hidden');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function resetCrop() {
    S.zoom = 1; S.panX = 0; S.panY = 0;
    dom.zoomInfo.textContent = '100%';
  }

  // ═════════════════════════════════════
  // Render pipeline
  // ═════════════════════════════════════
  function render() {
    if (!S.img) return;
    dom.cropEditor.classList.remove('hidden');
    dom.cropControls.classList.remove('hidden');
    dom.cropHint.classList.remove('fade');
    renderCrop();
    renderResult();
  }

  // Render crop canvas (show user what will be cropped)
  let _rafCrop = 0;
  function renderCrop() {
    cancelAnimationFrame(_rafCrop);
    _rafCrop = requestAnimationFrame(_renderCrop);
  }

  function _renderCrop() {
    const img = S.img;
    if (!img) return;

    const W = tw(), H = th();
    const cv = dom.cropCanvas;
    const dpr = window.devicePixelRatio || 1;

    // Canvas CSS size = full width of container, height proportional
    const containerW = cv.parentElement.clientWidth;
    const displayH = (H / W) * containerW;
    cv.style.height = displayH + 'px';
    cv.width = containerW * dpr;
    cv.height = displayH * dpr;

    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, containerW, displayH);

    // Compute source rect from image
    const s = coverScale() * S.zoom;
    const srcW = W / s;
    const srcH = H / s;
    const srcX = (img.width - srcW) / 2 - S.panX;
    const srcY = (img.height - srcH) / 2 - S.panY;

    // Draw image scaled to canvas display area
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, containerW, displayH);

    // Grid overlay (thirds)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const x = (containerW / 3) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, displayH); ctx.stroke();
      const y = (displayH / 3) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(containerW, y); ctx.stroke();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Debounced result update — don't run quantization on every drag frame
    _debouncedResult();
  }

  // Debounce heavy result render (quantization ~50ms) — only after user stops dragging
  let _debounceTimer = 0;
  function _debouncedResult() {
    clearTimeout(_debounceTimer);
    // Quick preview: just update the result canvas without quantization
    _quickResultPreview();
    // Full render after 300ms idle
    _debounceTimer = setTimeout(() => _renderResult(), 300);
  }

  // Fast preview — just draw cropped image to result canvas (no quantization)
  function _quickResultPreview() {
    const img = S.img;
    if (!img) return;
    const cropped = getCroppedCanvas();
    if (!cropped) return;
    const W = tw(), H = th();
    const rc = dom.resultCanvas;
    rc.width = W; rc.height = H;
    rc.getContext('2d').drawImage(cropped, 0, 0);
    dom.previewSection.classList.remove('hidden');
  }

  // Get the cropped portion — use OffscreenCanvas (GPU) if available
  function getCroppedCanvas() {
    const img = S.img;
    if (!img) return null;
    const W = tw(), H = th();
    const s = coverScale() * S.zoom;
    const srcW = W / s, srcH = H / s;
    const srcX = (img.width - srcW) / 2 - S.panX;
    const srcY = (img.height - srcH) / 2 - S.panY;

    let cv, ctx;
    if (typeof OffscreenCanvas !== 'undefined') {
      cv = new OffscreenCanvas(W, H);
      ctx = cv.getContext('2d');
    } else {
      cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      ctx = cv.getContext('2d');
    }
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, W, H);
    return cv;
  }

  // Render result canvas
  let _rafResult = 0;
  function renderResult() {
    cancelAnimationFrame(_rafResult);
    _rafResult = requestAnimationFrame(_renderResult);
  }

  function _renderResult() {
    const img = S.img;
    if (!img) return;

    const cropped = getCroppedCanvas();
    if (!cropped) return;

    const W = tw(), H = th();
    const [mime, qual] = fmt();

    // Show result
    const rc = dom.resultCanvas;
    rc.width = W; rc.height = H;
    rc.getContext('2d').drawImage(cropped, 0, 0);

    // Quantized preview (draw mode)
    const qBox = dom.quantizedBox || dom.resultLabel?.parentElement;
    if (S.mode === 'draw') {
      const pixels = cropped.getContext('2d').getImageData(0, 0, W, H).data;
      const { palette, indexed } = octreeQuantize(pixels, S.colors);

      dom.quantizedBox.classList.remove('hidden');
      $('previewGrid').style.gridTemplateColumns = '1fr 1fr';

      const qc = dom.quantizedCanvas;
      qc.width = W; qc.height = H;
      const qctx = qc.getContext('2d');
      const qdata = qctx.createImageData(W, H);
      const d = qdata.data;
      for (let i = 0, len = indexed.length; i < len; i++) {
        const c = palette[indexed[i]];
        const j = i << 2;
        d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255;
      }
      qctx.putImageData(qdata, 0, 0);

      S.quantized = { palette, indexed, W, H };
      dom.statColors.textContent = palette.length;
      dom.palettePreview.innerHTML = palette.map(c => `<div class="swatch" style="background:${hex(c)}" title="${hex(c)}"></div>`).join('');
    } else {
      dom.quantizedBox.classList.add('hidden');
      $('previewGrid').style.gridTemplateColumns = '1fr';
      dom.statColors.textContent = '—';
      dom.palettePreview.innerHTML = '';
      S.quantized = null;
    }

    // Size
    const dataUrl = rc.toDataURL(mime, qual);
    const kb = ((dataUrl.length - 22) * 0.75 / 1024) | 0;
    dom.statSize.textContent = kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB';

    dom.previewSection.classList.remove('hidden');
    dom.scriptOutput.classList.add('hidden');
    S.script = null;
  }

  // ═════════════════════════════════════
  // Fast Median-Cut Quantization + Color Cache
  // ═════════════════════════════════════
  function octreeQuantize(pixels, maxColors) {
    const N = pixels.length >> 2;

    // 1. Deduplicate colors via Map → typically ~50K unique from 400K+ pixels
    const colorMap = new Map();
    for (let i = 0; i < N; i++) {
      const key = (pixels[i * 4] << 16) | (pixels[i * 4 + 1] << 8) | pixels[i * 4 + 2];
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    // Convert to array of {r,g,b,count}
    const colors = new Array(colorMap.size);
    let ci = 0;
    colorMap.forEach((count, key) => {
      colors[ci++] = { r: (key >> 16) & 0xFF, g: (key >> 8) & 0xFF, b: key & 0xFF, count };
    });

    // 2. Median-cut: split buckets on channel with max weighted range
    let buckets = [colors];

    while (buckets.length < maxColors) {
      // Find bucket with largest range (weighted by pixel count)
      let bestIdx = -1, bestRange = -1;
      for (let i = 0; i < buckets.length; i++) {
        if (buckets[i].length <= 1) continue;
        const range = _bucketRange(buckets[i]);
        if (range.maxRange > bestRange) { bestRange = range.maxRange; bestIdx = i; }
      }
      if (bestIdx < 0 || bestRange <= 0) break;

      const bucket = buckets[bestIdx];
      const { channel } = _bucketRange(bucket);

      // Sort by channel and split at median (by pixel count)
      bucket.sort((a, b) => a[channel] - b[channel]);
      let half = 0, total = 0;
      for (const c of bucket) total += c.count;
      let acc = 0, mid = 0;
      for (mid = 0; mid < bucket.length; mid++) {
        acc += bucket[mid].count;
        if (acc >= total / 2) { mid++; break; }
      }
      if (mid === 0) mid = 1;
      if (mid === bucket.length) mid = bucket.length - 1;

      buckets.splice(bestIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
    }

    // 3. Extract palette (weighted average per bucket)
    const palette = new Array(buckets.length);
    for (let i = 0; i < buckets.length; i++) {
      let tR = 0, tG = 0, tB = 0, tC = 0;
      for (const c of buckets[i]) {
        tR += c.r * c.count; tG += c.g * c.count; tB += c.b * c.count; tC += c.count;
      }
      palette[i] = [(tR / tC + .5) | 0, (tG / tC + .5) | 0, (tB / tC + .5) | 0];
    }

    // 4. Map pixels using color cache (each unique color looked up once)
    const cache = new Map();
    const indexed = new Uint16Array(N);

    for (let i = 0; i < N; i++) {
      const key = (pixels[i * 4] << 16) | (pixels[i * 4 + 1] << 8) | pixels[i * 4 + 2];
      let idx = cache.get(key);
      if (idx === undefined) {
        idx = _closest(pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2], palette);
        cache.set(key, idx);
      }
      indexed[i] = idx;
    }

    return { palette, indexed };
  }

  function _bucketRange(bucket) {
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    for (const c of bucket) {
      if (c.r < minR) minR = c.r; if (c.r > maxR) maxR = c.r;
      if (c.g < minG) minG = c.g; if (c.g > maxG) maxG = c.g;
      if (c.b < minB) minB = c.b; if (c.b > maxB) maxB = c.b;
    }
    const rR = maxR - minR, gR = maxG - minG, bR = maxB - minB;
    if (rR >= gR && rR >= bR) return { channel: 'r', maxRange: rR };
    if (gR >= bR) return { channel: 'g', maxRange: gR };
    return { channel: 'b', maxRange: bR };
  }

  function _closest(r, g, b, palette) {
    let minD = Infinity, idx = 0;
    for (let i = 0; i < palette.length; i++) {
      const dr = r - palette[i][0], dg = g - palette[i][1], db = b - palette[i][2];
      const d = dr * dr + dg * dg + db * db;
      if (d < minD) { minD = d; idx = i; }
    }
    return idx;
  }

  // ═════════════════════════════════════
  // Mode
  // ═════════════════════════════════════
  function setMode(mode) {
    S.mode = mode;
    dom.modeApi.classList.toggle('active', mode === 'api');
    dom.modeDraw.classList.toggle('active', mode === 'draw');
    dom.modeIndicator.className = 'indicator ' + (mode === 'api' ? 'left' : 'right');
    const d = mode === 'draw';
    dom.brushSizeSetting.classList.add('hidden');
    dom.speedSetting.classList.add('hidden');
    dom.colorsSetting.classList.toggle('hidden', !d);
    dom.scriptOutput.classList.add('hidden');
    S.script = null;
    if (S.img) renderResult();
  }

  // ═════════════════════════════════════
  // Helpers
  // ═════════════════════════════════════
  function hex(c) { return '#' + ((1 << 24) + (c[0] << 16) + (c[1] << 8) + c[2]).toString(16).slice(1).toUpperCase(); }

  // ═════════════════════════════════════
  // Generate
  // ═════════════════════════════════════
  function generate() {
    if (!S.img) return;
    dom.generateBtn.disabled = true;
    dom.generateBtn.textContent = 'Генерация…';
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          S.script = S.mode === 'api' ? genApi() : genDraw();
          dom.scriptPre.textContent = S.script;
          dom.scriptOutput.classList.remove('hidden');
          toast('Готово!', 'success');
        } catch (e) { toast(e.message, 'error'); console.error(e); }
        dom.generateBtn.disabled = false;
        dom.generateBtn.textContent = 'Сгенерировать скрипт';
      }, 30);
    });
  }

  // ── API Script ──
  function genApi() {
    const [mime,, ext] = fmt();
    // Use resultCanvas (DOM canvas) which always has toDataURL
    const dataUrl = dom.resultCanvas.toDataURL(mime, fmt()[1]);
    const b64 = dataUrl.split(',')[1];
    return `(async()=>{try{
const b=atob("${b64}"),a=new Uint8Array(b.length);
for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);
const f=new File([new Blob([a],{type:'${mime}'})], 'b.${ext}',{type:'${mime}'});
console.log('📤 '+Math.round(f.size/1024)+'KB');
let d=localStorage.getItem('device-id');
if(!d){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.includes('device')){d=localStorage.getItem(k);break}}}
if(!d)d=crypto.randomUUID();
const h={'X-Device-Id':d,'X-Requested-With':'XMLHttpRequest'};
const r=await fetch('/api/v1/auth/refresh',{method:'POST',headers:{...h,'Content-Type':'application/json'},credentials:'include'});
if(!r.ok)throw Error('Войдите! '+r.status);
const tk=(await r.json()).accessToken;
const fd=new FormData();fd.append('file',f);
const u=await fetch('/api/files/upload',{method:'POST',headers:{'Authorization':'Bearer '+tk,...h},body:fd,credentials:'include'});
if(!u.ok)throw Error('Upload: '+u.status);
const ud=await u.json();console.log('✅',ud);
await fetch('/api/users/me',{method:'PUT',headers:{'Authorization':'Bearer '+tk,'Content-Type':'application/json',...h},body:JSON.stringify({bannerId:ud.id}),credentials:'include'});
console.log('🎉 Готово! F5');
}catch(e){console.error('❌',e.message)}})();`;
  }

  // ── Draw Script ──
  // Загружает квантизованное изображение (с уменьшенной палитрой) через API
  // Рисовать на canvas сайта бесполезно — React-компонент стирает при re-render
  function genDraw() {
    if (!S.quantized) _renderResult();
    if (!S.quantized) return '// Ошибка: нет данных квантизации';
    const { palette, indexed, W, H } = S.quantized;

    // Render quantized image to canvas → base64
    const tmpCv = document.createElement('canvas');
    tmpCv.width = W; tmpCv.height = H;
    const tmpCtx = tmpCv.getContext('2d');
    const tmpData = tmpCtx.createImageData(W, H);
    const d = tmpData.data;
    for (let i = 0, len = indexed.length; i < len; i++) {
      const c = palette[indexed[i]];
      const j = i << 2;
      d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255;
    }
    tmpCtx.putImageData(tmpData, 0, 0);
    const b64 = tmpCv.toDataURL('image/png').split(',')[1];

    return `// ITD — Загрузка квантизованного изображения (${palette.length} цветов)
(async()=>{try{
const b=atob("${b64}"),a=new Uint8Array(b.length);
for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);
const f=new File([new Blob([a],{type:'image/png'})], 'draw.png',{type:'image/png'});
console.log('📤 Загрузка ('+Math.round(f.size/1024)+' KB, ${palette.length} цветов)...');
let d=localStorage.getItem('device-id');
if(!d){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.includes('device')){d=localStorage.getItem(k);break}}}
if(!d)d=crypto.randomUUID();
const h={'X-Device-Id':d,'X-Requested-With':'XMLHttpRequest'};
const r=await fetch('/api/v1/auth/refresh',{method:'POST',headers:{...h,'Content-Type':'application/json'},credentials:'include'});
if(!r.ok)throw Error('Войдите в аккаунт! '+r.status);
const tk=(await r.json()).accessToken;
const fd=new FormData();fd.append('file',f);
const u=await fetch('/api/files/upload',{method:'POST',headers:{'Authorization':'Bearer '+tk,...h},body:fd,credentials:'include'});
if(!u.ok)throw Error('Upload: '+u.status);
const ud=await u.json();console.log('✅ Файл загружен:',ud);
await fetch('/api/users/me',{method:'PUT',headers:{'Authorization':'Bearer '+tk,'Content-Type':'application/json',...h},body:JSON.stringify({bannerId:ud.id}),credentials:'include'});
console.log('🎉 Баннер установлен! F5');
}catch(e){console.error('❌',e.message)}})();`;
  }

  // ═════════════════════════════════════
  // Bookmarklet
  // ═════════════════════════════════════
  function updateBookmarklet() {
    // Self-contained bookmarklet: creates file picker on ITD site,
    // resizes image, uploads, sets banner
    const code = `javascript:void((async()=>{const W=${tw()},H=${th()};const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=async()=>{const f=i.files[0];if(!f)return;const img=new Image();img.src=URL.createObjectURL(f);await new Promise(r=>img.onload=r);const cv=Object.assign(document.createElement('canvas'),{width:W,height:H});const ctx=cv.getContext('2d');const s=Math.max(W/img.width,H/img.height);const sw=W/s,sh=H/s;ctx.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,0,0,W,H);cv.toBlob(async b=>{try{let d=localStorage.getItem('device-id')||crypto.randomUUID();const h={'X-Device-Id':d,'X-Requested-With':'XMLHttpRequest'};const r=await fetch('/api/v1/auth/refresh',{method:'POST',headers:{...h,'Content-Type':'application/json'},credentials:'include'});if(!r.ok)return alert('Войдите в аккаунт!');const tk=(await r.json()).accessToken;const fd=new FormData();fd.append('file',new File([b],'b.jpg',{type:'image/jpeg'}));const u=await fetch('/api/files/upload',{method:'POST',headers:{'Authorization':'Bearer '+tk,...h},body:fd,credentials:'include'});const ud=await u.json();await fetch('/api/users/me',{method:'PUT',headers:{'Authorization':'Bearer '+tk,'Content-Type':'application/json',...h},body:JSON.stringify({bannerId:ud.id}),credentials:'include'});alert('✅ Баннер установлен! Обновите страницу.')}catch(e){alert('❌ '+e.message)}},'image/jpeg',0.85)};i.click()})())`;

    dom.bookmarkletLink.href = code;
  }

  function copyBookmarkletCode() {
    navigator.clipboard.writeText(dom.bookmarkletLink.href).then(() => {
      dom.copyBookmarklet.textContent = '✅ Скопировано';
      setTimeout(() => dom.copyBookmarklet.textContent = '📋 Скопировать букмарклет', 2000);
    });
  }

  // ═════════════════════════════════════
  // Copy & Toast
  // ═════════════════════════════════════
  function copyScript() {
    if (!S.script) return;
    navigator.clipboard.writeText(S.script).then(() => {
      dom.copyBtn.textContent = '✅ Скопировано';
      dom.copyBtn.classList.add('copied');
      setTimeout(() => { dom.copyBtn.textContent = 'Копировать'; dom.copyBtn.classList.remove('copied'); }, 2000);
    });
  }

  function toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-text">${msg}</span>`;
    dom.toastContainer.appendChild(t);
    setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 300); }, 2700);
  }

  // ═════════════════════════════════════
  init();
})();
