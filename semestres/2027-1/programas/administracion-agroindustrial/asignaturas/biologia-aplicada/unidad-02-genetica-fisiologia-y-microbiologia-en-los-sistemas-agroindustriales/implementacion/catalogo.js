const viewer=document.querySelector('#section-viewer');
const frame=document.querySelector('#section-frame');
const viewerTitle=document.querySelector('#viewer-title');
const fullscreenButton=document.querySelector('#fullscreen-toggle');
const fullscreenLabel=document.querySelector('#fullscreen-label');
const fullscreenStatus=document.querySelector('#fullscreen-status');
const page=document.documentElement;
const enterFullscreen=page.requestFullscreen||page.webkitRequestFullscreen;
const exitFullscreen=document.exitFullscreen||document.webkitExitFullscreen;
const isFullscreen=()=>Boolean(document.fullscreenElement||document.webkitFullscreenElement);
function updateFullscreenControl(){
  const active=isFullscreen();
  fullscreenButton.setAttribute('aria-pressed',String(active));
  fullscreenLabel.textContent=active?'Salir de pantalla completa':'Pantalla completa';
}
async function toggleFullscreen(){
  try{
    if(isFullscreen())await exitFullscreen.call(document);
    else await enterFullscreen.call(page);
  }catch{fullscreenStatus.textContent='El navegador no permitió cambiar al modo de pantalla completa.';}
}
if(!enterFullscreen||!exitFullscreen)fullscreenButton.hidden=true;
else{
  fullscreenButton.addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',updateFullscreenControl);
  document.addEventListener('webkitfullscreenchange',updateFullscreenControl);
  updateFullscreenControl();
}
document.querySelectorAll('a.primary').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();
  viewerTitle.textContent=link.closest('article').querySelector('h2').textContent;
  frame.src=link.href;
  viewer.hidden=false;
  document.body.style.overflow='hidden';
}));
function closeViewer(){frame.src='about:blank';viewer.hidden=true;document.body.style.overflow='';}
document.querySelector('#viewer-back').addEventListener('click',closeViewer);
document.querySelector('#viewer-exit').addEventListener('click',async()=>{closeViewer();if(isFullscreen())await exitFullscreen.call(document);});
addEventListener('message',event=>{if(event.data&&event.data.type==='ova-back-catalog')closeViewer();});
