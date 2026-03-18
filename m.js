/**
 * ITD Imager - Mobile Injector (m.js)
 * Full crop interface injected directly on itd.com
 * Uses CSS variables from the original ITD site for native look
 * @file m.js
 * @author nersuga
 */
(function(){
'use strict';
if(document.getElementById('itd-fab'))return;

var SIZES={banner:[1100,380],post:[800,500]};
var MIN_ZOOM=1,MAX_ZOOM=5,ZOOM_STEP=0.15;
var S={img:null,zoom:1,panX:0,panY:0,type:'banner',pinchDist:0};

function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function coverScale(){if(!S.img)return 1;var sz=SIZES[S.type];return Math.max(sz[0]/S.img.width,sz[1]/S.img.height);}
function maxPanX(){if(!S.img)return 0;var sz=SIZES[S.type],s=coverScale()*S.zoom;return Math.max(0,(S.img.width-sz[0]/s)/2);}
function maxPanY(){if(!S.img)return 0;var sz=SIZES[S.type],s=coverScale()*S.zoom;return Math.max(0,(S.img.height-sz[1]/s)/2);}
function setZoom(z){S.zoom=clamp(z,MIN_ZOOM,MAX_ZOOM);S.panX=clamp(S.panX,-maxPanX(),maxPanX());S.panY=clamp(S.panY,-maxPanY(),maxPanY());}

// === CSS (uses original ITD site CSS variables) ===
var st=document.createElement('style');
st.textContent=
'#itd-fab{position:fixed!important;bottom:24px!important;right:24px!important;width:56px!important;height:56px!important;border-radius:50%!important;border:none!important;outline:none!important;background:linear-gradient(135deg,var(--accent-primary,#0080FF),#AF52DE)!important;color:#fff!important;cursor:pointer!important;z-index:99999!important;box-shadow:0 4px 24px rgba(0,0,0,.5)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;margin:0!important;transition:transform .2s!important;touch-action:manipulation!important}'
+'#itd-fab svg{width:24px!important;height:24px!important}'
+'#itd-fab:active{transform:scale(.9)!important}'
+'#itd-ov{position:fixed!important;inset:0!important;background:rgba(0,0,0,.7)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;z-index:100000!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;padding:0!important;opacity:0;transition:opacity .25s}'
+'#itd-ov.on{opacity:1!important}'
+'#itd-md{background:var(--block-bg,#1a1a1c)!important;border-radius:20px 20px 0 0!important;padding:12px 16px 24px!important;width:100%!important;max-width:440px!important;color:var(--text-primary,#eee)!important;font-family:Inter,-apple-system,sans-serif!important;font-size:14px!important;transform:translateY(100%);transition:transform .35s cubic-bezier(.32,.72,0,1)}'
+'#itd-ov.on #itd-md{transform:translateY(0)!important}'
+'#itd-md *{box-sizing:border-box!important;margin:0!important;padding:0!important}'
+'#itd-md .hd{width:36px!important;height:4px!important;border-radius:2px!important;background:var(--border-color,rgba(255,255,255,.2))!important;margin:0 auto 14px!important}'
+'#itd-md .tt{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;font-size:17px!important;font-weight:700!important;margin:0 0 4px!important;color:var(--text-primary,#f5f5f5)!important}'
+'#itd-md .tt svg{width:36px!important;height:18px!important;flex-shrink:0!important}'
+'#itd-md .sb{text-align:center!important;font-size:12px!important;color:var(--text-secondary,rgba(255,255,255,.35))!important;margin:0 0 16px!important}'
+'#itd-md .rw{display:flex!important;gap:8px!important;margin:0 0 12px!important}'
+'#itd-md .sl{flex:1!important;padding:10px 12px!important;border-radius:10px!important;border:none!important;background:var(--bg-secondary,#2a2a2c)!important;color:var(--text-primary,#fff)!important;font-size:13px!important;font-family:inherit!important;appearance:none!important;-webkit-appearance:none!important;outline:none!important}'
+'#itd-md .dp{border:2px dashed var(--border-color,rgba(255,255,255,.12))!important;border-radius:14px!important;padding:24px 12px!important;text-align:center!important;cursor:pointer!important;background:transparent!important}'
+'#itd-md .dp:active{background:var(--bg-hover,rgba(255,255,255,.04))!important;border-color:var(--accent-primary,rgba(255,255,255,.25))!important}'
+'#itd-md .di{margin:0 0 6px!important;line-height:1!important;color:var(--text-tertiary,rgba(255,255,255,.3))!important}'
+'#itd-md .di svg{width:36px!important;height:36px!important}'
+'#itd-md .dtx{font-size:13px!important;font-weight:500!important;color:var(--text-primary,#e0e0e0)!important}'
+'#itd-md .dh{font-size:11px!important;color:var(--text-tertiary,rgba(255,255,255,.3))!important;margin:3px 0 0!important}'
+'#itd-md .crp{position:relative!important;width:100%!important;margin:10px 0 0!important;border-radius:12px!important;overflow:hidden!important;background:#000!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}'
+'#itd-md .crp canvas{display:block!important;width:100%!important;cursor:grab!important}'
+'#itd-md .crp canvas:active{cursor:grabbing!important}'
+'#itd-md .crp .ch{position:absolute!important;bottom:8px!important;left:50%!important;transform:translateX(-50%)!important;background:rgba(0,0,0,.7)!important;backdrop-filter:blur(8px)!important;color:#fff!important;font-size:11px!important;font-weight:500!important;padding:4px 12px!important;border-radius:20px!important;pointer-events:none!important;opacity:1!important;transition:opacity .5s!important;white-space:nowrap!important}'
+'#itd-md .crp .ch.fade{opacity:0!important}'
+'#itd-md .zm{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;margin:8px 0 0!important}'
+'#itd-md .zb{width:36px!important;height:36px!important;border-radius:50%!important;border:none!important;background:var(--bg-tertiary,#2a2a2c)!important;color:var(--text-secondary,#fff)!important;font-size:16px!important;font-weight:700!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;font-family:inherit!important;transition:all .15s!important}'
+'#itd-md .zb:active{background:var(--bg-hover,#3a3a3c)!important}'
+'#itd-md .zt{font-size:12px!important;color:var(--text-secondary,rgba(255,255,255,.5))!important;min-width:40px!important;text-align:center!important;font-variant-numeric:tabular-nums!important}'
+'#itd-md .st{margin:10px 0 0!important;font-size:12px!important;text-align:center!important;color:var(--text-secondary,rgba(255,255,255,.45))!important;line-height:1.4!important}'
+'#itd-md .st.ok{color:#22c55e!important;font-weight:600!important}'
+'#itd-md .st.er{color:#ef4444!important}'
+'#itd-md .pr{height:3px!important;background:var(--bg-tertiary,#2a2a2c)!important;border-radius:2px!important;margin:10px 0 0!important;overflow:hidden!important}'
+'#itd-md .pf{height:100%!important;background:linear-gradient(90deg,var(--accent-primary,#0080FF),#AF52DE)!important;border-radius:2px!important;transition:width .4s!important;width:0}'
+'#itd-md .bt{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:46px!important;border-radius:12px!important;border:none!important;outline:none!important;font-size:14px!important;font-weight:600!important;font-family:inherit!important;cursor:pointer!important;margin:8px 0 0!important;transition:transform .1s!important;touch-action:manipulation!important}'
+'#itd-md .bt:active{transform:scale(.97)!important}'
+'#itd-md .bt:disabled{opacity:.4!important;cursor:not-allowed!important}'
+'#itd-md .bp{background:var(--btn-primary-bg,#fff)!important;color:var(--btn-primary-text,#000)!important}'
+'#itd-md .bs{background:var(--bg-secondary,#2a2a2c)!important;color:var(--text-secondary,rgba(255,255,255,.7))!important}'
+'#itd-md .bg{background:#22c55e!important;color:#fff!important}';
document.head.appendChild(st);

// === SVG Logo ===
var SVG_LOGO='<svg xmlns="http://www.w3.org/2000/svg" width="36" height="18" fill="none"><path fill="currentColor" d="M12 3V0h12v3h-4v11h-4V3h-4Z"></path><path fill="currentColor" d="M12 3V0h12v3h-4v11h-4V3h-4ZM9 0 3 9V0H0v14h3l6-9v9h3V0H9Z"></path><path fill="currentColor" fill-rule="evenodd" d="M34 11h2v7h-3v-4h-9v4h-3v-7c3 0 3-4 3-11h10v11Zm-7-8v8h4V3h-4Z" clip-rule="evenodd"></path></svg>';

// === SVG Icons (from original ITD site) ===
var SVG_PALETTE='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="none"><path fill="currentColor" d="M10.004 1C14.92 1 18.976 4.61 19 8.955c0 2.747-2.255 5-5.002 5h-1.797a1.477 1.477 0 0 0-1.502 1.501c0 .426.134.753.395 1.013.231.26.393.618.393 1.011 0 .848-.65 1.52-1.483 1.52C5.052 19 1 14.95 1 10s4.052-9 9.004-9ZM5.25 9a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm9-2a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm-7-2a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm4-1a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z"></path></svg>';
var SVG_ATTACH='<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m17.867 9.208-7.659 7.659a5.003 5.003 0 1 1-7.075-7.075l7.659-7.659a3.335 3.335 0 1 1 4.716 4.717l-7.666 7.658a1.667 1.667 0 1 1-2.359-2.358l7.075-7.067"></path></svg>';
var SVG_CHECK='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 6 9 17l-5-5"></path></svg>';

// === FAB ===
var fab=document.createElement('button');
fab.id='itd-fab';
fab.innerHTML=SVG_PALETTE;
fab.addEventListener('click',openModal);
document.body.appendChild(fab);

// === MODAL ===
function openModal(){
if(document.getElementById('itd-ov'))return;
S.img=null;S.zoom=1;S.panX=0;S.panY=0;S.type='banner';S.pinchDist=0;

var o=document.createElement('div');
o.id='itd-ov';
o.innerHTML='<div id="itd-md">'
+'<div class="hd"></div>'
+'<div class="tt">'+SVG_LOGO+' Imager</div>'
+'<div class="sb">\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0431\u0430\u043D\u043D\u0435\u0440\u0430 \u043D\u0430 \u0418\u0422\u0414</div>'
+'<div class="rw">'
+'<select class="sl" id="itd-tp"><option value="banner">\u0411\u0430\u043D\u043D\u0435\u0440 1100\u00D7380</option><option value="post">\u041F\u043E\u0441\u0442 800\u00D7500</option></select>'
+'</div>'
+'<div class="dp" id="itd-dp"><div class="di">'+SVG_ATTACH+'</div><div class="dtx">\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0434\u043B\u044F \u0432\u044B\u0431\u043E\u0440\u0430 \u0444\u043E\u0442\u043E</div><div class="dh">PNG, JPG, WebP</div></div>'
+'<input type="file" id="itd-fi" accept="image/*" style="display:none!important">'
+'<div class="crp" id="itd-crp" style="display:none"><canvas id="itd-cv"></canvas><div class="ch" id="itd-ch">\u041F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u0439\u0442\u0435 \u00B7 \u0429\u0438\u043F\u043E\u043A \u0434\u043B\u044F \u0437\u0443\u043C\u0430</div></div>'
+'<div class="zm" id="itd-zm" style="display:none">'
+'<button class="zb" id="itd-zo">\u2212</button>'
+'<span class="zt" id="itd-zt">100%</span>'
+'<button class="zb" id="itd-zi">+</button>'
+'<button class="zb" id="itd-zr">\u21BA</button>'
+'</div>'
+'<div class="pr" id="itd-pr" style="display:none"><div class="pf" id="itd-pf"></div></div>'
+'<div class="st" id="itd-st" style="display:none"></div>'
+'<button class="bt bp" id="itd-up" style="display:none" disabled>\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C</button>'
+'<button class="bt bs" id="itd-cl">\u0417\u0430\u043A\u0440\u044B\u0442\u044C</button>'
+'</div>';

document.body.appendChild(o);
requestAnimationFrame(function(){o.classList.add('on');});

var dp=o.querySelector('#itd-dp'),fi=o.querySelector('#itd-fi');
var crp=o.querySelector('#itd-crp'),cv=o.querySelector('#itd-cv');
var hint=o.querySelector('#itd-ch');
var zm=o.querySelector('#itd-zm'),zt=o.querySelector('#itd-zt');
var stEl=o.querySelector('#itd-st'),pr=o.querySelector('#itd-pr'),pf=o.querySelector('#itd-pf');
var upBtn=o.querySelector('#itd-up'),clBtn=o.querySelector('#itd-cl');
var tp=o.querySelector('#itd-tp');

function close(){o.classList.remove('on');setTimeout(function(){o.remove();},300);}
o.addEventListener('click',function(e){if(e.target===o)close();});
clBtn.addEventListener('click',close);
dp.addEventListener('click',function(){fi.click();});

// Type change
tp.addEventListener('change',function(){S.type=tp.value;if(S.img){S.zoom=1;S.panX=0;S.panY=0;renderCrop();}});

// File select
fi.addEventListener('change',function(){
  var f=fi.files[0];if(!f)return;
  var img=new Image();
  img.onload=function(){
    S.img=img;S.zoom=1;S.panX=0;S.panY=0;
    dp.style.display='none';
    crp.style.display='';zm.style.display='';
    upBtn.style.display='';upBtn.disabled=false;
    stEl.style.display='none';
    if(hint)hint.classList.remove('fade');
    renderCrop();
  };
  img.src=URL.createObjectURL(f);
});

// === Crop render (1:1 with app.js logic) ===
var _rafCrop=0;
function renderCrop(){cancelAnimationFrame(_rafCrop);_rafCrop=requestAnimationFrame(_renderCrop);}

function _renderCrop(){
  var img=S.img;if(!img)return;
  var sz=SIZES[S.type],W=sz[0],H=sz[1];
  var dpr=window.devicePixelRatio||1;

  // Size canvas to container with DPR
  var containerW=crp.clientWidth||300;
  var displayH=(H/W)*containerW;
  cv.style.height=displayH+'px';
  cv.width=containerW*dpr;
  cv.height=displayH*dpr;

  var ctx=cv.getContext('2d');
  ctx.scale(dpr,dpr);

  // Background
  ctx.fillStyle='#000';ctx.fillRect(0,0,containerW,displayH);

  // Source rect with zoom and pan (same as app.js)
  var s=coverScale()*S.zoom;
  var srcW=W/s,srcH=H/s;
  var srcX=(img.width-srcW)/2-S.panX;
  var srcY=(img.height-srcH)/2-S.panY;

  ctx.drawImage(img,srcX,srcY,srcW,srcH,0,0,containerW,displayH);

  // Grid of thirds
  ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;
  for(var i=1;i<3;i++){
    var x=(containerW/3)*i;
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,displayH);ctx.stroke();
    var y=(displayH/3)*i;
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(containerW,y);ctx.stroke();
  }

  ctx.setTransform(1,0,0,1,0,0);
  zt.textContent=Math.round(S.zoom*100)+'%';
}

// === Pan helper (screen px → image px, same as app.js) ===
function pan(dxPx,dyPx){
  var sz=SIZES[S.type],W=sz[0];
  var containerW=crp.clientWidth||300;
  var scaleToCanvas=containerW/W;
  var imgScale=coverScale()*S.zoom;
  var dxImg=dxPx/(imgScale*scaleToCanvas);
  var dyImg=dyPx/(imgScale*scaleToCanvas);
  S.panX=clamp(S.panX+dxImg,-maxPanX(),maxPanX());
  S.panY=clamp(S.panY+dyImg,-maxPanY(),maxPanY());
  renderCrop();
}

// Zoom buttons
o.querySelector('#itd-zi').addEventListener('click',function(){setZoom(S.zoom*(1+ZOOM_STEP));renderCrop();});
o.querySelector('#itd-zo').addEventListener('click',function(){setZoom(S.zoom/(1+ZOOM_STEP));renderCrop();});
o.querySelector('#itd-zr').addEventListener('click',function(){S.zoom=1;S.panX=0;S.panY=0;renderCrop();});

// === Touch interactions ===
var hintHidden=false;
function hideHint(){if(!hintHidden&&hint){hint.classList.add('fade');hintHidden=true;}}

// Single touch drag
var touch0=null;
cv.addEventListener('touchstart',function(e){
  hideHint();
  if(e.touches.length===1){
    touch0={x:e.touches[0].clientX,y:e.touches[0].clientY};
    e.preventDefault();
  }
  if(e.touches.length===2){
    S.pinchDist=Math.hypot(
      e.touches[1].clientX-e.touches[0].clientX,
      e.touches[1].clientY-e.touches[0].clientY
    );
    e.preventDefault();
  }
},{passive:false});

cv.addEventListener('touchmove',function(e){
  // Pinch zoom
  if(e.touches.length===2){
    var dist=Math.hypot(
      e.touches[1].clientX-e.touches[0].clientX,
      e.touches[1].clientY-e.touches[0].clientY
    );
    if(S.pinchDist>0){
      setZoom(S.zoom*(dist/S.pinchDist));
      renderCrop();
    }
    S.pinchDist=dist;
    e.preventDefault();
    return;
  }
  // Single finger drag
  if(e.touches.length===1&&touch0){
    var t=e.touches[0];
    pan(t.clientX-touch0.x,t.clientY-touch0.y);
    touch0={x:t.clientX,y:t.clientY};
    e.preventDefault();
  }
},{passive:false});

cv.addEventListener('touchend',function(e){
  if(e.touches.length<2)S.pinchDist=0;
  if(e.touches.length===0)touch0=null;
});

// Mouse drag
var dragging=false,lastX=0,lastY=0;
cv.addEventListener('mousedown',function(e){hideHint();dragging=true;lastX=e.clientX;lastY=e.clientY;e.preventDefault();});
cv.addEventListener('mousemove',function(e){if(!dragging||!S.img)return;pan(e.clientX-lastX,e.clientY-lastY);lastX=e.clientX;lastY=e.clientY;});
cv.addEventListener('mouseup',function(){dragging=false;});
cv.addEventListener('mouseleave',function(){dragging=false;});

// Wheel zoom
cv.addEventListener('wheel',function(e){
  e.preventDefault();
  var delta=e.deltaY>0?1/(1+ZOOM_STEP):(1+ZOOM_STEP);
  setZoom(S.zoom*delta);
  renderCrop();
},{passive:false});

// === Upload ===
upBtn.addEventListener('click',async function(){
  if(!S.img)return;
  upBtn.disabled=true;upBtn.textContent='\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430\u2026';
  stEl.style.display='';stEl.className='st';
  stEl.textContent='\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430\u2026';
  pr.style.display='';pf.style.width='10%';

  try{
    var sz=SIZES[S.type],W=sz[0],H=sz[1];
    var out=document.createElement('canvas');out.width=W;out.height=H;
    var octx=out.getContext('2d');
    var img=S.img;

    // Use same source rect logic as renderCrop
    var s=coverScale()*S.zoom;
    var srcW=W/s,srcH=H/s;
    var srcX=(img.width-srcW)/2-S.panX;
    var srcY=(img.height-srcH)/2-S.panY;
    octx.drawImage(img,srcX,srcY,srcW,srcH,0,0,W,H);

    pf.style.width='30%';stEl.textContent='\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F\u2026';

    var d=localStorage.getItem('device-id');
    if(!d){for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.includes('device')){d=localStorage.getItem(k);break;}}}
    if(!d)d=crypto.randomUUID();
    var hd={'X-Device-Id':d,'X-Requested-With':'XMLHttpRequest'};

    var r=await fetch('/api/v1/auth/refresh',{method:'POST',headers:Object.assign({},hd,{'Content-Type':'application/json'}),credentials:'include'});
    if(!r.ok)throw new Error('\u0412\u043E\u0439\u0434\u0438\u0442\u0435 \u0432 \u0430\u043A\u043A\u0430\u0443\u043D\u0442');
    var token=(await r.json()).accessToken;

    pf.style.width='55%';stEl.textContent='\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026';

    var blob=await new Promise(function(res){out.toBlob(res,'image/jpeg',0.85);});
    var fd=new FormData();
    fd.append('file',new File([blob],'banner.jpg',{type:'image/jpeg'}));

    var u=await fetch('/api/files/upload',{method:'POST',headers:Object.assign({'Authorization':'Bearer '+token},hd),body:fd,credentials:'include'});
    if(!u.ok)throw new Error('\u041E\u0448\u0438\u0431\u043A\u0430: '+u.status);
    var ud=await u.json();

    pf.style.width='85%';stEl.textContent='\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430\u2026';

    await fetch('/api/users/me',{method:'PUT',headers:Object.assign({'Authorization':'Bearer '+token,'Content-Type':'application/json'},hd),body:JSON.stringify({bannerId:ud.id}),credentials:'include'});

    pf.style.width='100%';
    stEl.className='st ok';stEl.textContent='\u2705 \u0413\u043E\u0442\u043E\u0432\u043E!';
    upBtn.style.display='none';
    clBtn.textContent='\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C';clBtn.className='bt bg';
    clBtn.onclick=function(){location.reload();};
  }catch(e){
    stEl.className='st er';stEl.textContent='\u041E\u0448\u0438\u0431\u043A\u0430: '+e.message;
    upBtn.disabled=false;upBtn.textContent='\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C';
    pf.style.width='0';pr.style.display='none';
  }
});
}
})();
