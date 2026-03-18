/**
 * ITD Imager — Mobile Injector (m.js)
 *
 * Мини-скрипт для инъекции на сайт итд.com.
 * Добавляет плавающую кнопку 🎨 для загрузки баннера/поста
 * прямо с мобильного устройства без DevTools.
 *
 * Использование:
 *   fetch('https://nersuga.github.io/itd_imager/m.js').then(r=>r.text()).then(t=>{const s=document.createElement('script');s.textContent=t;document.head.appendChild(s)})
 *
 * @file m.js
 * @author nersuga
 */
(function () {
  'use strict';

  // Защита от повторной инъекции
  if (document.getElementById('itd-imager-fab')) return;

  // ── Размеры холстов ──
  var SIZES = { banner: [1100, 380], post: [800, 500] };

  // ── Стили ──
  var css = document.createElement('style');
  css.textContent = [
    '#itd-imager-fab{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;border:none;',
    'background:linear-gradient(135deg,#0080FF,#AF52DE);color:#fff;font-size:24px;cursor:pointer;z-index:99999;',
    'box-shadow:0 4px 20px rgba(0,0,0,.4);transition:transform .2s,box-shadow .2s;touch-action:manipulation}',
    '#itd-imager-fab:active{transform:scale(.92)}',
    '#itd-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:100000;',
    'display:flex;align-items:flex-end;justify-content:center;padding:0;opacity:0;transition:opacity .25s ease}',
    '#itd-overlay.show{opacity:1}',
    '#itd-modal{background:#1c1c1e;border-radius:20px 20px 0 0;padding:24px 20px env(safe-area-inset-bottom,16px);',
    'width:100%;max-width:420px;color:#f5f5f5;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;',
    'transform:translateY(100%);transition:transform .3s cubic-bezier(.32,.72,0,1)}',
    '#itd-overlay.show #itd-modal{transform:translateY(0)}',
    '#itd-modal *{box-sizing:border-box}',
    '.itd-m-title{text-align:center;font-size:17px;font-weight:700;margin-bottom:4px}',
    '.itd-m-sub{text-align:center;font-size:13px;color:rgba(255,255,255,.45);margin-bottom:20px}',
    '.itd-m-field{margin-bottom:14px}',
    '.itd-m-label{font-size:12px;font-weight:600;color:rgba(255,255,255,.5);text-transform:uppercase;',
    'letter-spacing:.5px;margin-bottom:6px;display:block}',
    '.itd-m-select{width:100%;padding:12px 14px;border-radius:14px;border:none;background:#2c2c2e;',
    'color:#fff;font-size:14px;font-family:inherit;appearance:none;',
    'background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' ',
    'viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/',
    '%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}',
    '.itd-m-drop{border:2px dashed rgba(255,255,255,.12);border-radius:16px;padding:28px 16px;text-align:center;',
    'cursor:pointer;transition:all .2s}',
    '.itd-m-drop:active{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.25)}',
    '.itd-m-drop-icon{font-size:32px;margin-bottom:8px}',
    '.itd-m-drop-text{font-size:14px;font-weight:500}',
    '.itd-m-drop-hint{font-size:12px;color:rgba(255,255,255,.3);margin-top:4px}',
    '.itd-m-preview{margin-top:12px;border-radius:12px;overflow:hidden;background:#000}',
    '.itd-m-preview img{width:100%;height:auto;display:block}',
    '.itd-m-status{margin-top:14px;font-size:13px;text-align:center;color:rgba(255,255,255,.5)}',
    '.itd-m-status.ok{color:#22c55e}',
    '.itd-m-status.err{color:#ef4444}',
    '.itd-m-btn{width:100%;padding:14px;border-radius:14px;border:none;font-size:15px;font-weight:600;',
    'font-family:inherit;cursor:pointer;transition:opacity .15s,transform .1s;margin-top:10px}',
    '.itd-m-btn:active{transform:scale(.97)}',
    '.itd-m-btn-primary{background:#fff;color:#000}',
    '.itd-m-btn-secondary{background:#2c2c2e;color:#fff}',
    '.itd-m-btn:disabled{opacity:.4;cursor:not-allowed}',
    '.itd-m-progress{height:3px;background:#2c2c2e;border-radius:2px;margin-top:12px;overflow:hidden}',
    '.itd-m-progress-fill{height:100%;background:linear-gradient(90deg,#0080FF,#AF52DE);border-radius:2px;',
    'transition:width .3s ease;width:0}',
  ].join('\n');
  document.head.appendChild(css);

  // ── FAB (плавающая кнопка) ──
  var fab = document.createElement('button');
  fab.id = 'itd-imager-fab';
  fab.textContent = '🎨';
  fab.title = 'ITD Imager';
  fab.addEventListener('click', openModal);
  document.body.appendChild(fab);

  // ── Модальное окно ──
  function openModal() {
    if (document.getElementById('itd-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'itd-overlay';
    overlay.innerHTML = [
      '<div id="itd-modal">',
      '  <div class="itd-m-title">🎨 ITD Imager</div>',
      '  <div class="itd-m-sub">Загрузка баннера на ИТД</div>',
      '  <div class="itd-m-field">',
      '    <span class="itd-m-label">Тип</span>',
      '    <select class="itd-m-select" id="itd-type">',
      '      <option value="banner">Баннер 1100×380</option>',
      '      <option value="post">Пост 800×500</option>',
      '    </select>',
      '  </div>',
      '  <div class="itd-m-drop" id="itd-drop">',
      '    <div class="itd-m-drop-icon">📷</div>',
      '    <div class="itd-m-drop-text">Нажмите для выбора фото</div>',
      '    <div class="itd-m-drop-hint">PNG, JPG, WebP</div>',
      '  </div>',
      '  <input type="file" id="itd-file" accept="image/*" style="display:none">',
      '  <div class="itd-m-preview" id="itd-preview" style="display:none"></div>',
      '  <div class="itd-m-progress" id="itd-progress" style="display:none"><div class="itd-m-progress-fill" id="itd-progress-fill"></div></div>',
      '  <div class="itd-m-status" id="itd-status" style="display:none"></div>',
      '  <button class="itd-m-btn itd-m-btn-primary" id="itd-upload" style="display:none" disabled>Загрузить</button>',
      '  <button class="itd-m-btn itd-m-btn-secondary" id="itd-close">Закрыть</button>',
      '</div>',
    ].join('\n');

    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('show'); });

    // Элементы модалки
    var drop = overlay.querySelector('#itd-drop');
    var fileInput = overlay.querySelector('#itd-file');
    var preview = overlay.querySelector('#itd-preview');
    var status = overlay.querySelector('#itd-status');
    var uploadBtn = overlay.querySelector('#itd-upload');
    var closeBtn = overlay.querySelector('#itd-close');
    var progress = overlay.querySelector('#itd-progress');
    var progressFill = overlay.querySelector('#itd-progress-fill');
    var typeSelect = overlay.querySelector('#itd-type');
    var selectedFile = null;

    // Закрытие
    function close() {
      overlay.classList.remove('show');
      setTimeout(function () { overlay.remove(); }, 300);
    }

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    closeBtn.addEventListener('click', close);

    // Выбор файла
    drop.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function () {
      var file = fileInput.files[0];
      if (!file) return;
      selectedFile = file;

      // Превью
      var reader = new FileReader();
      reader.onload = function (e) {
        preview.innerHTML = '<img src="' + e.target.result + '">';
        preview.style.display = '';
        drop.style.display = 'none';
        uploadBtn.style.display = '';
        uploadBtn.disabled = false;
        status.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });

    // Загрузка
    uploadBtn.addEventListener('click', async function () {
      if (!selectedFile) return;
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Обработка…';
      status.style.display = '';
      status.className = 'itd-m-status';
      status.textContent = 'Подготовка изображения…';
      progress.style.display = '';
      progressFill.style.width = '15%';

      try {
        var type = typeSelect.value;
        var W = SIZES[type][0];
        var H = SIZES[type][1];

        // Загрузка и обрезка изображения
        var img = new Image();
        img.src = URL.createObjectURL(selectedFile);
        await new Promise(function (r) { img.onload = r; });

        var cv = document.createElement('canvas');
        cv.width = W;
        cv.height = H;
        var ctx = cv.getContext('2d');
        var s = Math.max(W / img.width, H / img.height);
        var sw = W / s, sh = H / s;
        ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, W, H);

        progressFill.style.width = '35%';
        status.textContent = 'Авторизация…';

        // Получение токена
        var d = localStorage.getItem('device-id');
        if (!d) {
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.includes('device')) { d = localStorage.getItem(k); break; }
          }
        }
        if (!d) d = crypto.randomUUID();

        var headers = { 'X-Device-Id': d, 'X-Requested-With': 'XMLHttpRequest' };
        var r = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: Object.assign({}, headers, { 'Content-Type': 'application/json' }),
          credentials: 'include',
        });
        if (!r.ok) throw new Error('Необходимо войти в аккаунт');
        var token = (await r.json()).accessToken;

        progressFill.style.width = '55%';
        status.textContent = 'Загрузка файла…';

        // Загрузка файла
        var blob = await new Promise(function (resolve) {
          cv.toBlob(resolve, 'image/jpeg', 0.85);
        });
        var fd = new FormData();
        fd.append('file', new File([blob], 'banner.jpg', { type: 'image/jpeg' }));

        var u = await fetch('/api/files/upload', {
          method: 'POST',
          headers: Object.assign({ 'Authorization': 'Bearer ' + token }, headers),
          body: fd,
          credentials: 'include',
        });
        if (!u.ok) throw new Error('Ошибка загрузки: ' + u.status);
        var ud = await u.json();

        progressFill.style.width = '85%';
        status.textContent = 'Установка баннера…';

        // Установка баннера
        await fetch('/api/users/me', {
          method: 'PUT',
          headers: Object.assign({ 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, headers),
          body: JSON.stringify({ bannerId: ud.id }),
          credentials: 'include',
        });

        progressFill.style.width = '100%';
        status.className = 'itd-m-status ok';
        status.textContent = '✅ Готово!';
        uploadBtn.style.display = 'none';
        closeBtn.textContent = 'Обновить страницу';
        closeBtn.onclick = function () { location.reload(); };

      } catch (e) {
        status.className = 'itd-m-status err';
        status.textContent = 'Ошибка: ' + e.message;
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Повторить';
        progressFill.style.width = '0';
        progress.style.display = 'none';
      }
    });
  }
})();
