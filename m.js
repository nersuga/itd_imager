/**
 * ITD Imager - Mobile Injector (m.js)
 * @file m.js
 * @author nersuga
 */
(function () {
  'use strict';
  if (document.getElementById('itd-imager-fab')) return;

  var SIZES = { banner: [1100, 380], post: [800, 500] };

  var css = document.createElement('style');
  css.textContent = [
    '#itd-imager-fab{position:fixed!important;bottom:24px!important;right:24px!important;width:56px!important;height:56px!important;border-radius:50%!important;border:none!important;outline:none!important;background:linear-gradient(135deg,#0080FF,#AF52DE)!important;color:#fff!important;font-size:24px!important;cursor:pointer!important;z-index:99999!important;box-shadow:0 4px 24px rgba(0,0,0,.5)!important;transition:transform .2s ease!important;touch-action:manipulation;line-height:1!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;margin:0!important}',
    '#itd-imager-fab:active{transform:scale(.92)!important}',
    '#itd-overlay{position:fixed!important;inset:0!important;background:rgba(0,0,0,.6)!important;backdrop-filter:blur(6px)!important;-webkit-backdrop-filter:blur(6px)!important;z-index:100000!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;padding:0!important;margin:0!important;opacity:0;transition:opacity .25s ease}',
    '#itd-overlay.show{opacity:1!important}',
    '#itd-modal{background:#1c1c1e!important;border-radius:20px 20px 0 0!important;padding:12px 20px 28px!important;width:100%!important;max-width:420px!important;color:#f5f5f5!important;font-family:Inter,-apple-system,sans-serif!important;font-size:14px!important;line-height:1.5!important;transform:translateY(100%);transition:transform .35s cubic-bezier(.32,.72,0,1);border:none!important;margin:0!important}',
    '#itd-overlay.show #itd-modal{transform:translateY(0)!important}',
    '#itd-modal *,#itd-modal *::before,#itd-modal *::after{box-sizing:border-box!important;-webkit-font-smoothing:antialiased!important;text-decoration:none!important}',
    '#itd-modal .itd-h{width:36px!important;height:4px!important;border-radius:2px!important;background:rgba(255,255,255,.2)!important;margin:0 auto 16px!important;border:none!important;padding:0!important}',
    '#itd-modal .itd-t{text-align:center!important;font-size:17px!important;font-weight:700!important;margin:0 0 4px!important;padding:0!important;color:#f5f5f5!important}',
    '#itd-modal .itd-s{text-align:center!important;font-size:13px!important;color:rgba(255,255,255,.4)!important;margin:0 0 20px!important;padding:0!important}',
    '#itd-modal .itd-f{margin:0 0 14px!important;padding:0!important}',
    '#itd-modal .itd-l{font-size:11px!important;font-weight:600!important;color:rgba(255,255,255,.45)!important;text-transform:uppercase!important;letter-spacing:.6px!important;margin:0 0 6px!important;padding:0!important;display:block!important}',
    '#itd-modal .itd-sel{width:100%!important;padding:12px 36px 12px 14px!important;border-radius:12px!important;border:none!important;background:#2c2c2e!important;color:#fff!important;font-size:14px!important;font-family:inherit!important;appearance:none!important;-webkit-appearance:none!important;outline:none!important;cursor:pointer!important;margin:0!important;height:auto!important;line-height:1.4!important}',
    '#itd-modal .itd-drop{border:2px dashed rgba(255,255,255,.12)!important;border-radius:16px!important;padding:28px 16px!important;text-align:center!important;cursor:pointer!important;transition:all .2s!important;background:transparent!important;margin:0!important}',
    '#itd-modal .itd-drop:active{background:rgba(255,255,255,.06)!important;border-color:rgba(255,255,255,.25)!important}',
    '#itd-modal .itd-di{font-size:32px!important;margin:0 0 8px!important;padding:0!important;line-height:1!important}',
    '#itd-modal .itd-dt{font-size:14px!important;font-weight:500!important;color:#f5f5f5!important;margin:0!important}',
    '#itd-modal .itd-dh{font-size:12px!important;color:rgba(255,255,255,.3)!important;margin:4px 0 0!important}',
    '#itd-modal .itd-pv{margin:12px 0 0!important;border-radius:12px!important;overflow:hidden!important;background:#000!important}',
    '#itd-modal .itd-pv img{width:100%!important;height:auto!important;display:block!important;border:none!important;margin:0!important;padding:0!important}',
    '#itd-modal .itd-st{margin:14px 0 0!important;font-size:13px!important;text-align:center!important;color:rgba(255,255,255,.5)!important;line-height:1.4!important;padding:0!important}',
    '#itd-modal .itd-st.ok{color:#22c55e!important;font-weight:600!important}',
    '#itd-modal .itd-st.err{color:#ef4444!important}',
    '#itd-modal .itd-btn{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:50px!important;padding:0 24px!important;border-radius:14px!important;border:none!important;outline:none!important;font-size:15px!important;font-weight:600!important;font-family:inherit!important;cursor:pointer!important;touch-action:manipulation!important;transition:opacity .15s ease,transform .1s ease!important;margin:10px 0 0!important;line-height:1!important}',
    '#itd-modal .itd-btn:active{transform:scale(.97)!important}',
    '#itd-modal .itd-btn:disabled{opacity:.4!important;cursor:not-allowed!important;transform:none!important}',
    '#itd-modal .itd-bp{background:#fff!important;color:#000!important}',
    '#itd-modal .itd-bs{background:#2c2c2e!important;color:rgba(255,255,255,.8)!important}',
    '#itd-modal .itd-bg{background:#22c55e!important;color:#fff!important}',
    '#itd-modal .itd-pr{height:3px!important;background:#2c2c2e!important;border-radius:2px!important;margin:14px 0 0!important;overflow:hidden!important;padding:0!important}',
    '#itd-modal .itd-pf{height:100%!important;border-radius:2px!important;background:linear-gradient(90deg,#0080FF,#AF52DE)!important;transition:width .4s ease!important;width:0}',
  ].join('\n');
  document.head.appendChild(css);

  var fab = document.createElement('button');
  fab.id = 'itd-imager-fab';
  fab.textContent = '\uD83C\uDFA8';
  fab.title = 'ITD Imager';
  fab.addEventListener('click', openModal);
  document.body.appendChild(fab);

  function openModal() {
    if (document.getElementById('itd-overlay')) return;
    var o = document.createElement('div');
    o.id = 'itd-overlay';
    o.innerHTML = '<div id="itd-modal">'
      + '<div class="itd-h"></div>'
      + '<div class="itd-t">\uD83C\uDFA8 ITD Imager</div>'
      + '<div class="itd-s">\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0431\u0430\u043D\u043D\u0435\u0440\u0430 \u043D\u0430 \u0418\u0422\u0414</div>'
      + '<div class="itd-f"><span class="itd-l">\u0422\u0438\u043F</span>'
      + '<select class="itd-sel" id="itd-type">'
      + '<option value="banner">\u0411\u0430\u043D\u043D\u0435\u0440 1100\u00D7380</option>'
      + '<option value="post">\u041F\u043E\u0441\u0442 800\u00D7500</option>'
      + '</select></div>'
      + '<div class="itd-drop" id="itd-drop">'
      + '<div class="itd-di">\uD83D\uDCF7</div>'
      + '<div class="itd-dt">\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0434\u043B\u044F \u0432\u044B\u0431\u043E\u0440\u0430 \u0444\u043E\u0442\u043E</div>'
      + '<div class="itd-dh">PNG, JPG, WebP</div>'
      + '</div>'
      + '<input type="file" id="itd-file" accept="image/*" style="display:none">'
      + '<div class="itd-pv" id="itd-pv" style="display:none"></div>'
      + '<div class="itd-pr" id="itd-pr" style="display:none"><div class="itd-pf" id="itd-pf"></div></div>'
      + '<div class="itd-st" id="itd-st" style="display:none"></div>'
      + '<button class="itd-btn itd-bp" id="itd-up" style="display:none" disabled>\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C</button>'
      + '<button class="itd-btn itd-bs" id="itd-cl">\u0417\u0430\u043A\u0440\u044B\u0442\u044C</button>'
      + '</div>';

    document.body.appendChild(o);
    requestAnimationFrame(function () { o.classList.add('show'); });

    var drop = o.querySelector('#itd-drop');
    var fi = o.querySelector('#itd-file');
    var pv = o.querySelector('#itd-pv');
    var st = o.querySelector('#itd-st');
    var ubtn = o.querySelector('#itd-up');
    var cbtn = o.querySelector('#itd-cl');
    var pr = o.querySelector('#itd-pr');
    var pf = o.querySelector('#itd-pf');
    var ts = o.querySelector('#itd-type');
    var sf = null;

    function close() {
      o.classList.remove('show');
      setTimeout(function () { o.remove(); }, 300);
    }

    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    cbtn.addEventListener('click', close);
    drop.addEventListener('click', function () { fi.click(); });

    fi.addEventListener('change', function () {
      var f = fi.files[0];
      if (!f) return;
      sf = f;
      var r = new FileReader();
      r.onload = function (e) {
        pv.innerHTML = '<img src="' + e.target.result + '">';
        pv.style.display = '';
        drop.style.display = 'none';
        ubtn.style.display = '';
        ubtn.disabled = false;
        st.style.display = 'none';
      };
      r.readAsDataURL(f);
    });

    ubtn.addEventListener('click', async function () {
      if (!sf) return;
      ubtn.disabled = true;
      ubtn.textContent = '\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430\u2026';
      st.style.display = '';
      st.className = 'itd-st';
      st.textContent = '\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F\u2026';
      pr.style.display = '';
      pf.style.width = '15%';

      try {
        var tp = ts.value;
        var W = SIZES[tp][0], H = SIZES[tp][1];

        var img = new Image();
        img.src = URL.createObjectURL(sf);
        await new Promise(function (r) { img.onload = r; });

        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        var ctx = cv.getContext('2d');
        var s = Math.max(W / img.width, H / img.height);
        var sw = W / s, sh = H / s;
        ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, W, H);

        pf.style.width = '35%';
        st.textContent = '\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F\u2026';

        var d = localStorage.getItem('device-id');
        if (!d) {
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.includes('device')) { d = localStorage.getItem(k); break; }
          }
        }
        if (!d) d = crypto.randomUUID();

        var hd = { 'X-Device-Id': d, 'X-Requested-With': 'XMLHttpRequest' };
        var rr = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: Object.assign({}, hd, { 'Content-Type': 'application/json' }),
          credentials: 'include'
        });
        if (!rr.ok) throw new Error('\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0432\u043E\u0439\u0442\u0438 \u0432 \u0430\u043A\u043A\u0430\u0443\u043D\u0442');
        var token = (await rr.json()).accessToken;

        pf.style.width = '55%';
        st.textContent = '\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0444\u0430\u0439\u043B\u0430\u2026';

        var blob = await new Promise(function (res) { cv.toBlob(res, 'image/jpeg', 0.85); });
        var fd = new FormData();
        fd.append('file', new File([blob], 'banner.jpg', { type: 'image/jpeg' }));

        var u = await fetch('/api/files/upload', {
          method: 'POST',
          headers: Object.assign({ 'Authorization': 'Bearer ' + token }, hd),
          body: fd, credentials: 'include'
        });
        if (!u.ok) throw new Error('\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438: ' + u.status);
        var ud = await u.json();

        pf.style.width = '85%';
        st.textContent = '\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u0431\u0430\u043D\u043D\u0435\u0440\u0430\u2026';

        await fetch('/api/users/me', {
          method: 'PUT',
          headers: Object.assign({ 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, hd),
          body: JSON.stringify({ bannerId: ud.id }),
          credentials: 'include'
        });

        pf.style.width = '100%';
        st.className = 'itd-st ok';
        st.textContent = '\u2705 \u0413\u043E\u0442\u043E\u0432\u043E!';
        ubtn.style.display = 'none';
        cbtn.textContent = '\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443';
        cbtn.className = 'itd-btn itd-bg';
        cbtn.onclick = function () { location.reload(); };

      } catch (e) {
        st.className = 'itd-st err';
        st.textContent = '\u041E\u0448\u0438\u0431\u043A\u0430: ' + e.message;
        ubtn.disabled = false;
        ubtn.textContent = '\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C';
        pf.style.width = '0';
        pr.style.display = 'none';
      }
    });
  }
})();
