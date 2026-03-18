/**
 * ITD Imager - Mobile Injector (m.js)
 * Full crop interface injected directly on itd.com
 * @file m.js
 * @author nersuga
 */
(function(){
'use strict';
if(document.getElementById('itd-fab'))return;

var SIZES={banner:[1100,380],post:[800,500]};
var state={img:null,zoom:1,panX:0,panY:0,dragging:false,lastX:0,lastY:0,type:'banner'};

// === CSS ===
var st=document.createElement('style');
st.textContent='#itd-fab{position:fixed!important;bottom:24px!important;right:24px!important;width:56px!important;height:56px!important;border-radius:50%!important;border:none!important;outline:none!important;background:linear-gradient(135deg,#0080FF,#AF52DE)!important;color:#fff!important;font-size:24px!important;cursor:pointer!important;z-index:99999!important;box-shadow:0 4px 24px rgba(0,0,0,.5)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;margin:0!important;transition:transform .2s!important;touch-action:manipulation!important}'
+'#itd-fab:active{transform:scale(.9)!important}'
+'#itd-ov{position:fixed!important;inset:0!important;background:rgba(0,0,0,.7)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;z-index:100000!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;padding:0!important;opacity:0;transition:opacity .25s}'
+'#itd-ov.on{opacity:1!important}'
+'#itd-md{background:#1a1a1c!important;border-radius:20px 20px 0 0!important;padding:12px 16px 24px!important;width:100%!important;max-width:440px!important;color:#eee!important;font-family:Inter,-apple-system,sans-serif!important;font-size:14px!important;transform:translateY(100%);transition:transform .35s cubic-bezier(.32,.72,0,1)}'
+'#itd-ov.on #itd-md{transform:translateY(0)!important}'
+'#itd-md *{box-sizing:border-box!important;margin:0!important;padding:0!important}'
+'#itd-md .hd{width:36px!important;height:4px!important;border-radius:2px!important;background:rgba(255,255,255,.2)!important;margin:0 auto 14px!important}'
+'#itd-md .tt{text-align:center!important;font-size:17px!important;font-weight:700!important;margin:0 0 4px!important;color:#f5f5f5!important}'
+'#itd-md .sb{text-align:center!important;font-size:12px!important;color:rgba(255,255,255,.35)!important;margin:0 0 16px!important}'
+'#itd-md .rw{display:flex!important;gap:8px!important;margin:0 0 12px!important}'
+'#itd-md .sl{flex:1!important;padding:10px 12px!important;border-radius:10px!important;border:none!important;background:#2a2a2c!important;color:#fff!important;font-size:13px!important;font-family:inherit!important;appearance:none!important;-webkit-appearance:none!important;outline:none!important}'
+'#itd-md .dp{border:2px dashed rgba(255,255,255,.12)!important;border-radius:14px!important;padding:24px 12px!important;text-align:center!important;cursor:pointer!important;background:transparent!important}'
+'#itd-md .dp:active{background:rgba(255,255,255,.04)!important;border-color:rgba(255,255,255,.25)!important}'
+'#itd-md .di{font-size:28px!important;margin:0 0 6px!important;line-height:1!important}'
+'#itd-md .dtx{font-size:13px!important;font-weight:500!important;color:#e0e0e0!important}'
+'#itd-md .dh{font-size:11px!important;color:rgba(255,255,255,.3)!important;margin:3px 0 0!important}'
+'#itd-md .crp{position:relative!important;width:100%!important;margin:10px 0 0!important;border-radius:12px!important;overflow:hidden!important;background:#000!important;touch-action:none!important}'
+'#itd-md .crp canvas{display:block!important;width:100%!important;height:auto!important}'
+'#itd-md .zm{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;margin:8px 0 0!important}'
+'#itd-md .zb{width:36px!important;height:36px!important;border-radius:10px!important;border:none!important;background:#2a2a2c!important;color:#fff!important;font-size:16px!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;font-family:inherit!important}'
+'#itd-md .zb:active{background:#3a3a3c!important}'
+'#itd-md .zt{font-size:12px!important;color:rgba(255,255,255,.5)!important;min-width:40px!important;text-align:center!important}'
+'#itd-md .st{margin:10px 0 0!important;font-size:12px!important;text-align:center!important;color:rgba(255,255,255,.45)!important;line-height:1.4!important}'
+'#itd-md .st.ok{color:#22c55e!important;font-weight:600!important}'
+'#itd-md .st.er{color:#ef4444!important}'
+'#itd-md .pr{height:3px!important;background:#2a2a2c!important;border-radius:2px!important;margin:10px 0 0!important;overflow:hidden!important}'
+'#itd-md .pf{height:100%!important;background:linear-gradient(90deg,#0080FF,#AF52DE)!important;border-radius:2px!important;transition:width .4s!important;width:0}'
+'#itd-md .bt{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:46px!important;border-radius:12px!important;border:none!important;outline:none!important;font-size:14px!important;font-weight:600!important;font-family:inherit!important;cursor:pointer!important;margin:8px 0 0!important;transition:transform .1s!important}'
+'#itd-md .bt:active{transform:scale(.97)!important}'
+'#itd-md .bt:disabled{opacity:.4!important;cursor:not-allowed!important}'
+'#itd-md .bp{background:#fff!important;color:#000!important}'
+'#itd-md .bs{background:#2a2a2c!important;color:rgba(255,255,255,.7)!important}'
+'#itd-md .bg{background:#22c55e!important;color:#fff!important}';
document.head.appendChild(st);

// === FAB ===
var fab=document.createElement('button');
fab.id='itd-fab';
fab.textContent='\uD83C\uDFA8';
fab.addEventListener('click',openModal);
document.body.appendChild(fab);

// === MODAL ===
function openModal(){
if(document.getElementById('itd-ov'))return;
state.img=null;state.zoom=1;state.panX=0;state.panY=0;state.type='banner';

var o=document.createElement('div');
o.id='itd-ov';
o.innerHTML='<div id="itd-md">'
+'<div class="hd"></div>'
+'<div class="tt">\uD83C\uDFA8 ITD Imager</div>'
+'<div class="sb">\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0431\u0430\u043D\u043D\u0435\u0440\u0430 \u043D\u0430 \u0418\u0422\u0414</div>'
+'<div class="rw">'
+'<select class="sl" id="itd-tp"><option value="banner">\u0411\u0430\u043D\u043D\u0435\u0440 1100\u00D7380</option><option value="post">\u041F\u043E\u0441\u0442 800\u00D7500</option></select>'
+'</div>'
+'<div class="dp" id="itd-dp"><div class="di">\uD83D\uDCF7</div><div class="dtx">\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0434\u043B\u044F \u0432\u044B\u0431\u043E\u0440\u0430 \u0444\u043E\u0442\u043E</div><div class="dh">PNG, JPG, WebP</div></div>'
+'<input type="file" id="itd-fi" accept="image/*" style="display:none!important">'
+'<div class="crp" id="itd-crp" style="display:none"><canvas id="itd-cv"></canvas></div>'
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
var zm=o.querySelector('#itd-zm'),zt=o.querySelector('#itd-zt');
var stEl=o.querySelector('#itd-st'),pr=o.querySelector('#itd-pr'),pf=o.querySelector('#itd-pf');
var upBtn=o.querySelector('#itd-up'),clBtn=o.querySelector('#itd-cl');
var tp=o.querySelector('#itd-tp');

function close(){o.classList.remove('on');setTimeout(function(){o.remove();},300);}
o.addEventListener('click',function(e){if(e.target===o)close();});
clBtn.addEventListener('click',close);
dp.addEventListener('click',function(){fi.click();});

// Type change
tp.addEventListener('change',function(){state.type=tp.value;if(state.img)renderCrop();});

// File select
fi.addEventListener('change',function(){
  var f=fi.files[0];if(!f)return;
  var img=new Image();
  img.onload=function(){
    state.img=img;state.zoom=1;state.panX=0;state.panY=0;
    dp.style.display='none';
    crp.style.display='';zm.style.display='';
    upBtn.style.display='';upBtn.disabled=false;
    stEl.style.display='none';
    renderCrop();
  };
  img.src=URL.createObjectURL(f);
});

// Render crop preview
function renderCrop(){
  var sz=SIZES[state.type],W=sz[0],H=sz[1];
  var aspect=W/H;
  var cw=crp.offsetWidth||300;
  var ch=Math.round(cw/aspect);
  cv.width=cw;cv.height=ch;
  cv.style.height=ch+'px';
  var ctx=cv.getContext('2d');
  ctx.fillStyle='#111';ctx.fillRect(0,0,cw,ch);
  if(!state.img)return;
  var img=state.img,z=state.zoom;
  var scale=Math.max(cw/img.width,ch/img.height)*z;
  var dw=img.width*scale,dh=img.height*scale;
  var dx=(cw-dw)/2+state.panX;
  var dy=(ch-dh)/2+state.panY;
  ctx.drawImage(img,dx,dy,dw,dh);
  // Frame border
  ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=1;
  ctx.strokeRect(0,0,cw,ch);
  zt.textContent=Math.round(z*100)+'%';
}

// Zoom
o.querySelector('#itd-zi').addEventListener('click',function(){state.zoom=Math.min(state.zoom*1.25,5);renderCrop();});
o.querySelector('#itd-zo').addEventListener('click',function(){state.zoom=Math.max(state.zoom/1.25,.5);renderCrop();});
o.querySelector('#itd-zr').addEventListener('click',function(){state.zoom=1;state.panX=0;state.panY=0;renderCrop();});

// Pan (touch + mouse)
var touch0=null;
cv.addEventListener('mousedown',function(e){state.dragging=true;state.lastX=e.clientX;state.lastY=e.clientY;e.preventDefault();});
cv.addEventListener('mousemove',function(e){if(!state.dragging)return;state.panX+=e.clientX-state.lastX;state.panY+=e.clientY-state.lastY;state.lastX=e.clientX;state.lastY=e.clientY;renderCrop();});
cv.addEventListener('mouseup',function(){state.dragging=false;});
cv.addEventListener('mouseleave',function(){state.dragging=false;});

cv.addEventListener('touchstart',function(e){
  if(e.touches.length===1){touch0={x:e.touches[0].clientX,y:e.touches[0].clientY};e.preventDefault();}
},{passive:false});
cv.addEventListener('touchmove',function(e){
  if(e.touches.length===1&&touch0){
    var t=e.touches[0];
    state.panX+=t.clientX-touch0.x;state.panY+=t.clientY-touch0.y;
    touch0={x:t.clientX,y:t.clientY};renderCrop();e.preventDefault();
  }
},{passive:false});
cv.addEventListener('touchend',function(){touch0=null;});

// Wheel zoom
cv.addEventListener('wheel',function(e){
  e.preventDefault();
  var d=e.deltaY>0?0.9:1.1;
  state.zoom=Math.max(.5,Math.min(5,state.zoom*d));
  renderCrop();
},{passive:false});

// Upload
upBtn.addEventListener('click',async function(){
  if(!state.img)return;
  upBtn.disabled=true;upBtn.textContent='\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430\u2026';
  stEl.style.display='';stEl.className='st';
  stEl.textContent='\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430\u2026';
  pr.style.display='';pf.style.width='10%';

  try{
    var sz=SIZES[state.type],W=sz[0],H=sz[1];
    var out=document.createElement('canvas');out.width=W;out.height=H;
    var octx=out.getContext('2d');
    var img=state.img,z=state.zoom;
    var scale=Math.max(W/img.width,H/img.height)*z;
    var dw=img.width*scale,dh=img.height*scale;
    var dx=(W-dw)/2+state.panX*(W/(cv.width||300));
    var dy=(H-dh)/2+state.panY*(H/(cv.height||150));
    octx.drawImage(img,dx,dy,dw,dh);

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
