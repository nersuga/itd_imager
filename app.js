/**
 * ITD Imager v2
 *
 * Веб-инструмент для подготовки и автозагрузки изображений (баннеров/постов) на платформу ИТД.
 * Включает: интерактивный crop-редактор, Median-Cut квантизацию цветов,
 * генерацию скриптов для API-загрузки и мобильный букмарклет.
 *
 * @file app.js
 * @author nersuga
 */

(function () {
  'use strict';

  // ═════════════════════════════════════
  // Конфигурация
  // ═════════════════════════════════════

  /**
   * Допустимые размеры холста [ширина, высота] в пикселях.
   * @type {Object<string, [number, number]>}
   */
  const SIZES = { banner: [1100, 380], post: [800, 500] };

  /** Минимальный допустимый зум */
  const MIN_ZOOM = 1;
  /** Максимальный допустимый зум */
  const MAX_ZOOM = 5;
  /** Шаг зума при одном скролле / нажатии кнопки */
  const ZOOM_STEP = 0.15;

  // ═════════════════════════════════════
  // Глобальное состояние приложения
  // ═════════════════════════════════════

  /**
   * @typedef {Object} AppState
   * @property {HTMLImageElement|null} img       — загруженное изображение
   * @property {'api'|'draw'}          mode      — текущий режим работы
   * @property {'banner'|'post'}       type      — тип холста
   * @property {string}                quality   — формат/качество вывода (например 'jpeg-85')
   * @property {number}                colors    — количество цветов для квантизации
   * @property {number}                brush     — размер кисти (px)
   * @property {number}                speed     — задержка рисования (ms)
   * @property {number}                zoom      — текущий зум (1 = 100%)
   * @property {number}                panX      — смещение по X (в пикселях изображения)
   * @property {number}                panY      — смещение по Y (в пикселях изображения)
   * @property {Object|null}           quantized — результат квантизации {palette, indexed, W, H}
   * @property {string|null}           script    — сгенерированный скрипт
   */

  /** @type {AppState} */
  const S = {
    img: null,
    mode: 'api',
    type: 'banner',
    quality: 'jpeg-85',
    colors: 64,
    brush: 4,
    speed: 1,
    zoom: 1,
    panX: 0, panY: 0,
    quantized: null,
    script: null,
  };

  // ═════════════════════════════════════
  // DOM-элементы
  // ═════════════════════════════════════

  /**
   * Получить DOM-элемент по ID.
   * @param {string} id — идентификатор элемента
   * @returns {HTMLElement|null}
   */
  const $ = id => document.getElementById(id);

  /** @type {Object<string, HTMLElement>} — кэш DOM-элементов */
  const dom = {};

  /** Список ID всех используемых элементов */
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
    'toastContainer',
  ];
  IDS.forEach(id => dom[id] = $(id));

  // ═════════════════════════════════════
  // Вспомогательные функции формата
  // ═════════════════════════════════════

  /**
   * Возвращает параметры формата изображения на основе текущей настройки качества.
   * @returns {[string, number|undefined, string]} — [MIME-тип, качество (0–1), расширение файла]
   */
  function fmt() {
    const q = S.quality;
    if (q === 'png') return ['image/png', undefined, 'png'];
    const [t, v] = q.split('-');
    return [t === 'jpeg' ? 'image/jpeg' : 'image/webp', +v / 100, t === 'jpeg' ? 'jpg' : 'webp'];
  }

  /**
   * Целевая ширина холста (px).
   * @returns {number}
   */
  function tw() { return SIZES[S.type][0]; }

  /**
   * Целевая высота холста (px).
   * @returns {number}
   */
  function th() { return SIZES[S.type][1]; }

  // ═════════════════════════════════════
  // Инициализация приложения
  // ═════════════════════════════════════

  /**
   * Главная функция инициализации — привязывает все обработчики событий,
   * определяет тип устройства и устанавливает режим по умолчанию.
   */
  function init() {
    // --- Дропзона (загрузка файлов) ---
    const dz = dom.dropzone;
    dz.addEventListener('click', () => dom.fileInput.click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); e.dataTransfer.files[0] && loadFile(e.dataTransfer.files[0]); });
    dom.fileInput.addEventListener('change', e => e.target.files[0] && loadFile(e.target.files[0]));

    // --- Переключение режима ---
    dom.modeApi.addEventListener('click', () => setMode('api'));
    dom.modeDraw.addEventListener('click', () => setMode('draw'));

    // --- Настройки ---
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

    // --- Зум ---
    dom.zoomIn.addEventListener('click', () => { setZoom(S.zoom * (1 + ZOOM_STEP)); });
    dom.zoomOut.addEventListener('click', () => { setZoom(S.zoom / (1 + ZOOM_STEP)); });
    dom.zoomReset.addEventListener('click', () => { S.zoom = 1; S.panX = 0; S.panY = 0; renderCrop(); });

    // --- Генерация и копирование ---
    dom.generateBtn.addEventListener('click', generate);
    dom.copyBtn.addEventListener('click', copyScript);

    // --- Копирование скрипта-инжектора (полный m.js) ---
    const copyInjectBtn = $('copyInject');
    if (copyInjectBtn) {
      copyInjectBtn.addEventListener('click', () => {
        copyInjectBtn.disabled = true;
        copyInjectBtn.textContent = '⏳ Загрузка...';
        fetch('./m.js')
          .then(r => r.text())
          .then(code => navigator.clipboard.writeText(code))
          .then(() => {
            copyInjectBtn.textContent = '✅ Скопировано!';
            toast('Скрипт скопирован — вставьте в консоль на итд.com', 'success');
            setTimeout(() => { copyInjectBtn.textContent = '📋 Скопировать скрипт'; copyInjectBtn.disabled = false; }, 3000);
          })
          .catch(() => {
            copyInjectBtn.textContent = '❌ Ошибка';
            setTimeout(() => { copyInjectBtn.textContent = '📋 Скопировать скрипт'; copyInjectBtn.disabled = false; }, 2000);
          });
      });
    }

    // --- Crop-взаимодействия (перетаскивание, пинч, скролл) ---
    initCropInteractions();


    // --- Автоопределение устройства ---
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth < 1024);
    if (isMobile) {
      S.type = 'post';
      dom.canvasType.value = 'post';
      S.quality = 'jpeg-70';
      dom.imageQuality.value = 'jpeg-70';
    }

    // Показываем инструкцию для нужного устройства
    const desktopInstr = $('desktopInstructions');
    const mobileInstr = $('mobileInstructions');
    if (isMobile) {
      if (desktopInstr) desktopInstr.classList.add('hidden');
    } else {
      if (mobileInstr) mobileInstr.classList.add('hidden');
    }

    setMode('api');
  }

  // ═════════════════════════════════════
  // Crop-взаимодействия (mouse + touch + pinch + wheel)
  // ═════════════════════════════════════

  /**
   * Инициализирует все взаимодействия с crop-канвасом:
   * перетаскивание (pointer), зум колёсиком (wheel), пинч (touch).
   */
  function initCropInteractions() {
    const cv = dom.cropCanvas;
    let dragging = false;
    let lastX, lastY;
    let pinchDist = 0;

    // --- Pointer (мышь / стилус / палец) ---
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

    // --- Зум колёсиком ---
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 / (1 + ZOOM_STEP) : (1 + ZOOM_STEP);
      setZoom(S.zoom * delta);
    }, { passive: false });

    // --- Touch-пинч (двумя пальцами) ---
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

    // Скрываем подсказку при первом взаимодействии
    cv.addEventListener('pointerdown', () => {
      dom.cropHint.classList.add('fade');
    }, { once: true });
  }

  /**
   * Панорамирование (сдвиг видимой области) при перетаскивании.
   * Преобразует экранные пиксели в координаты изображения и обновляет состояние.
   * @param {number} dxPx — смещение по X в экранных пикселях
   * @param {number} dyPx — смещение по Y в экранных пикселях
   */
  function pan(dxPx, dyPx) {
    const cv = dom.cropCanvas;
    const rect = cv.getBoundingClientRect();
    const scaleToCanvas = rect.width / tw();
    const imgScale = coverScale() * S.zoom;
    const dxImg = dxPx / (imgScale * scaleToCanvas);
    const dyImg = dyPx / (imgScale * scaleToCanvas);

    S.panX = clamp(S.panX + dxImg, -maxPanX(), maxPanX());
    S.panY = clamp(S.panY + dyImg, -maxPanY(), maxPanY());
    renderCrop();
  }

  /**
   * Вычисляет масштаб cover-заполнения (как CSS background-size: cover).
   * Возвращает коэффициент, при котором изображение полностью покрывает целевую область.
   * @returns {number}
   */
  function coverScale() {
    if (!S.img) return 1;
    return Math.max(tw() / S.img.width, th() / S.img.height);
  }

  /**
   * Максимально допустимый сдвиг по X (в пикселях изображения).
   * @returns {number}
   */
  function maxPanX() {
    if (!S.img) return 0;
    const s = coverScale() * S.zoom;
    const visW = tw() / s;
    return Math.max(0, (S.img.width - visW) / 2);
  }

  /**
   * Максимально допустимый сдвиг по Y (в пикселях изображения).
   * @returns {number}
   */
  function maxPanY() {
    if (!S.img) return 0;
    const s = coverScale() * S.zoom;
    const visH = th() / s;
    return Math.max(0, (S.img.height - visH) / 2);
  }

  /**
   * Устанавливает новый уровень зума с ограничением [MIN_ZOOM, MAX_ZOOM]
   * и перекламливает pan в допустимый диапазон.
   * @param {number} z — новый уровень зума
   */
  function setZoom(z) {
    S.zoom = clamp(z, MIN_ZOOM, MAX_ZOOM);
    S.panX = clamp(S.panX, -maxPanX(), maxPanX());
    S.panY = clamp(S.panY, -maxPanY(), maxPanY());
    dom.zoomInfo.textContent = Math.round(S.zoom * 100) + '%';
    renderCrop();
  }

  /**
   * Ограничивает значение в диапазоне [min, max].
   * @param {number} v   — значение
   * @param {number} min — нижняя граница
   * @param {number} max — верхняя граница
   * @returns {number}
   */
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // ═════════════════════════════════════
  // Загрузка файла
  // ═════════════════════════════════════

  /**
   * Загружает файл изображения, декодирует через FileReader → Image,
   * сохраняет в состояние и запускает рендер.
   * @param {File} file — файл из input или drop
   */
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

  /**
   * Сбрасывает состояние обрезки к начальным значениям (зум 100%, центр).
   */
  function resetCrop() {
    S.zoom = 1; S.panX = 0; S.panY = 0;
    dom.zoomInfo.textContent = '100%';
  }

  // ═════════════════════════════════════
  // Рендер-пайплайн
  // ═════════════════════════════════════

  /**
   * Основная функция рендера — показывает crop-редактор и запускает
   * отрисовку crop-канваса + превью результата.
   */
  function render() {
    if (!S.img) return;
    dom.cropEditor.classList.remove('hidden');
    dom.cropControls.classList.remove('hidden');
    dom.cropHint.classList.remove('fade');
    renderCrop();
    renderResult();
  }

  /**
   * Запланировать отрисовку crop-канваса через requestAnimationFrame
   * (объединяет несколько вызовов в один кадр).
   */
  let _rafCrop = 0;
  function renderCrop() {
    cancelAnimationFrame(_rafCrop);
    _rafCrop = requestAnimationFrame(_renderCrop);
  }

  /**
   * Непосредственная отрисовка crop-канваса:
   * рисует изображение с учётом зума/панорамирования и накладывает сетку третей.
   * @private
   */
  function _renderCrop() {
    const img = S.img;
    if (!img) return;

    const W = tw(), H = th();
    const cv = dom.cropCanvas;
    const dpr = window.devicePixelRatio || 1;

    // Размер канваса подгоняется под контейнер с учётом DevicePixelRatio
    const containerW = cv.parentElement.clientWidth;
    const displayH = (H / W) * containerW;
    cv.style.height = displayH + 'px';
    cv.width = containerW * dpr;
    cv.height = displayH * dpr;

    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    // Фон
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, containerW, displayH);

    // Координаты исходного фрагмента с учётом зума и панорамирования
    const s = coverScale() * S.zoom;
    const srcW = W / s;
    const srcH = H / s;
    const srcX = (img.width - srcW) / 2 - S.panX;
    const srcY = (img.height - srcH) / 2 - S.panY;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, containerW, displayH);

    // Сетка третей (полупрозрачные линии)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const x = (containerW / 3) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, displayH); ctx.stroke();
      const y = (displayH / 3) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(containerW, y); ctx.stroke();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Отложенное обновление результата (не запускаем квантизацию при каждом кадре)
    _debouncedResult();
  }

  /**
   * Дебаунс тяжёлого рендера результата (квантизация ~50 мс).
   * Сначала показывает быстрое превью, затем через 300 мс запускает полный рендер.
   * @private
   */
  let _debounceTimer = 0;
  function _debouncedResult() {
    clearTimeout(_debounceTimer);
    _quickResultPreview();
    _debounceTimer = setTimeout(() => _renderResult(), 300);
  }

  /**
   * Быстрое превью — рисует обрезанное изображение в результирующий канвас
   * без квантизации (мгновенная обратная связь при перетаскивании).
   * @private
   */
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

  /**
   * Возвращает канвас/OffscreenCanvas с обрезанным фрагментом изображения
   * в целевом разрешении (tw × th). Использует OffscreenCanvas если доступен.
   * @returns {HTMLCanvasElement|OffscreenCanvas|null}
   */
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

  /**
   * Запланировать полный рендер результата через requestAnimationFrame.
   */
  let _rafResult = 0;
  function renderResult() {
    cancelAnimationFrame(_rafResult);
    _rafResult = requestAnimationFrame(_renderResult);
  }

  /**
   * Полный рендер результата: рисует обрезанное изображение,
   * в режиме «Рисование» выполняет квантизацию и показывает палитру.
   * Обновляет статистику (размер файла, кол-во цветов).
   * @private
   */
  function _renderResult() {
    const img = S.img;
    if (!img) return;

    const cropped = getCroppedCanvas();
    if (!cropped) return;

    const W = tw(), H = th();
    const [mime, qual] = fmt();

    // Основной результат
    const rc = dom.resultCanvas;
    rc.width = W; rc.height = H;
    rc.getContext('2d').drawImage(cropped, 0, 0);

    // Квантизация (режим «Рисование»)
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

    // Размер файла
    const dataUrl = rc.toDataURL(mime, qual);
    const kb = ((dataUrl.length - 22) * 0.75 / 1024) | 0;
    dom.statSize.textContent = kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB';

    dom.previewSection.classList.remove('hidden');
    dom.scriptOutput.classList.add('hidden');
    S.script = null;
  }

  // ═════════════════════════════════════
  // Median-Cut квантизация цветов
  // ═════════════════════════════════════

  /**
   * Уменьшает количество цветов в изображении методом Median-Cut.
   * Дедуплицирует цвета, рекурсивно делит на бакеты, вычисляет палитру
   * как взвешенное среднее каждого бакета.
   *
   * @param {Uint8ClampedArray} pixels    — RGBA-пиксели (ImageData.data)
   * @param {number}            maxColors — максимальное количество цветов в палитре
   * @returns {{ palette: Array<[number,number,number]>, indexed: Uint16Array }}
   *   palette — массив RGB-цветов палитры,
   *   indexed — индекс ближайшего цвета палитры для каждого пикселя
   */
  function octreeQuantize(pixels, maxColors) {
    const N = pixels.length >> 2;

    // 1. Дедупликация: собираем уникальные цвета и их частоту
    const colorMap = new Map();
    for (let i = 0; i < N; i++) {
      const key = (pixels[i * 4] << 16) | (pixels[i * 4 + 1] << 8) | pixels[i * 4 + 2];
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    // Конвертируем в массив {r, g, b, count}
    const colors = new Array(colorMap.size);
    let ci = 0;
    colorMap.forEach((count, key) => {
      colors[ci++] = { r: (key >> 16) & 0xFF, g: (key >> 8) & 0xFF, b: key & 0xFF, count };
    });

    // 2. Median-Cut: делим бакеты по каналу с наибольшим взвешенным диапазоном
    let buckets = [colors];

    while (buckets.length < maxColors) {
      let bestIdx = -1, bestRange = -1;
      for (let i = 0; i < buckets.length; i++) {
        if (buckets[i].length <= 1) continue;
        const range = _bucketRange(buckets[i]);
        if (range.maxRange > bestRange) { bestRange = range.maxRange; bestIdx = i; }
      }
      if (bestIdx < 0 || bestRange <= 0) break;

      const bucket = buckets[bestIdx];
      const { channel } = _bucketRange(bucket);

      // Сортировка по каналу и разделение в медиане (по кол-ву пикселей)
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

    // 3. Палитра — взвешенное среднее RGB каждого бакета
    const palette = new Array(buckets.length);
    for (let i = 0; i < buckets.length; i++) {
      let tR = 0, tG = 0, tB = 0, tC = 0;
      for (const c of buckets[i]) {
        tR += c.r * c.count; tG += c.g * c.count; tB += c.b * c.count; tC += c.count;
      }
      palette[i] = [(tR / tC + .5) | 0, (tG / tC + .5) | 0, (tB / tC + .5) | 0];
    }

    // 4. Маппинг пикселей на ближайший цвет палитры (с кэшем)
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

  /**
   * Определяет канал (r/g/b) с наибольшим диапазоном значений внутри бакета.
   * @param {Array<{r:number, g:number, b:number, count:number}>} bucket
   * @returns {{ channel: string, maxRange: number }}
   * @private
   */
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

  /**
   * Находит индекс ближайшего цвета в палитре (евклидово расстояние в RGB).
   * @param {number} r — красный (0–255)
   * @param {number} g — зелёный (0–255)
   * @param {number} b — синий (0–255)
   * @param {Array<[number,number,number]>} palette — палитра цветов
   * @returns {number} — индекс ближайшего цвета
   * @private
   */
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
  // Переключение режимов
  // ═════════════════════════════════════

  /**
   * Переключает режим работы приложения (API / Рисование).
   * Обновляет UI-переключатель, показывает/скрывает настройки,
   * и перерисовывает результат.
   * @param {'api'|'draw'} mode — новый режим
   */
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
  // Утилиты
  // ═════════════════════════════════════

  /**
   * Преобразует RGB-массив в HEX-строку (#RRGGBB).
   * @param {[number, number, number]} c — цвет [R, G, B]
   * @returns {string} — HEX-представление, например '#FF00AA'
   */
  function hex(c) { return '#' + ((1 << 24) + (c[0] << 16) + (c[1] << 8) + c[2]).toString(16).slice(1).toUpperCase(); }

  // ═════════════════════════════════════
  // Генерация скриптов
  // ═════════════════════════════════════

  /**
   * Обработчик кнопки «Сгенерировать скрипт».
   * Вызывает нужный генератор (API / Draw), выводит результат и уведомляет пользователя.
   */
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

  /**
   * Генерирует скрипт для режима API:
   * конвертирует обрезанное изображение в base64, формирует JS-код,
   * который загружает файл через API платформы и устанавливает баннер.
   * @returns {string} — JavaScript-код для вставки в консоль
   */
  function genApi() {
    const [mime,, ext] = fmt();
    const dataUrl = dom.resultCanvas.toDataURL(mime, fmt()[1]);
    const b64 = dataUrl.split(',')[1];
    return `(async()=>{try{
const b=atob("${b64}"),a=new Uint8Array(b.length);
for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);
const f=new File([new Blob([a],{type:'${mime}'})], 'b.${ext}',{type:'${mime}'});
let d=localStorage.getItem('device-id');
if(!d){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.includes('device')){d=localStorage.getItem(k);break}}}
if(!d)d=crypto.randomUUID();
const h={'X-Device-Id':d,'X-Requested-With':'XMLHttpRequest'};
const r=await fetch('/api/v1/auth/refresh',{method:'POST',headers:{...h,'Content-Type':'application/json'},credentials:'include'});
if(!r.ok)throw Error('Необходимо войти в аккаунт ('+r.status+')');
const tk=(await r.json()).accessToken;
const fd=new FormData();fd.append('file',f);
const u=await fetch('/api/files/upload',{method:'POST',headers:{'Authorization':'Bearer '+tk,...h},body:fd,credentials:'include'});
if(!u.ok)throw Error('Ошибка загрузки: '+u.status);
const ud=await u.json();
await fetch('/api/users/me',{method:'PUT',headers:{'Authorization':'Bearer '+tk,'Content-Type':'application/json',...h},body:JSON.stringify({bannerId:ud.id}),credentials:'include'});
console.log('Готово');
}catch(e){console.error('Ошибка: '+e.message)}})();`;
  }

  /**
   * Генерирует скрипт для режима «Рисование»:
   * берёт квантизованное изображение, конвертирует в PNG base64,
   * формирует JS-код для загрузки через API.
   * @returns {string} — JavaScript-код для вставки в консоль
   */
  function genDraw() {
    if (!S.quantized) _renderResult();
    if (!S.quantized) return '// Ошибка: нет данных квантизации';
    const { palette, indexed, W, H } = S.quantized;

    // Рендерим квантизованное изображение в PNG base64
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

    return `(async()=>{try{
const b=atob("${b64}"),a=new Uint8Array(b.length);
for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);
const f=new File([new Blob([a],{type:'image/png'})], 'draw.png',{type:'image/png'});
let d=localStorage.getItem('device-id');
if(!d){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.includes('device')){d=localStorage.getItem(k);break}}}
if(!d)d=crypto.randomUUID();
const h={'X-Device-Id':d,'X-Requested-With':'XMLHttpRequest'};
const r=await fetch('/api/v1/auth/refresh',{method:'POST',headers:{...h,'Content-Type':'application/json'},credentials:'include'});
if(!r.ok)throw Error('Необходимо войти в аккаунт ('+r.status+')');
const tk=(await r.json()).accessToken;
const fd=new FormData();fd.append('file',f);
const u=await fetch('/api/files/upload',{method:'POST',headers:{'Authorization':'Bearer '+tk,...h},body:fd,credentials:'include'});
if(!u.ok)throw Error('Ошибка загрузки: '+u.status);
const ud=await u.json();
await fetch('/api/users/me',{method:'PUT',headers:{'Authorization':'Bearer '+tk,'Content-Type':'application/json',...h},body:JSON.stringify({bannerId:ud.id}),credentials:'include'});
console.log('Готово');
}catch(e){console.error('Ошибка: '+e.message)}})();`;
  }



  // ═════════════════════════════════════
  // Копирование и уведомления
  // ═════════════════════════════════════

  /**
   * Копирует сгенерированный скрипт в буфер обмена.
   */
  function copyScript() {
    if (!S.script) return;
    navigator.clipboard.writeText(S.script).then(() => {
      dom.copyBtn.textContent = '✅ Скопировано';
      dom.copyBtn.classList.add('copied');
      setTimeout(() => { dom.copyBtn.textContent = 'Копировать'; dom.copyBtn.classList.remove('copied'); }, 2000);
    });
  }

  /**
   * Показывает всплывающее уведомление (toast) в нижней части экрана.
   * @param {string} msg  — текст сообщения
   * @param {'success'|'error'} [type='success'] — тип уведомления
   */
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
