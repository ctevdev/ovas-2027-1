const viewer=document.querySelector('#section-viewer');
const frame=document.querySelector('#section-frame');
const viewerTitle=document.querySelector('#viewer-title');
const fullscreenButton=document.querySelector('#fullscreen-toggle');
const fullscreenLabel=document.querySelector('#fullscreen-label');
const fullscreenStatus=document.querySelector('#fullscreen-status');
const sectionLinks=[...document.querySelectorAll('a.primary[data-section-id]')];
const sectionProgress=new Map();
const activitiesPerSection=8;
const totalActivities=sectionLinks.length*activitiesPerSection;
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

function readSectionProgress(sectionId){
  try{
    const values=JSON.parse(localStorage.getItem(sectionId+'-completed-v2')||'[]');
    return new Set(values.filter(value=>Number.isInteger(value)&&value>=0&&value<activitiesPerSection)).size;
  }catch{return 0;}
}
sectionLinks.forEach(link=>sectionProgress.set(link.dataset.sectionId,readSectionProgress(link.dataset.sectionId)));
function isUnitComplete(){return sectionLinks.length===6&&[...sectionProgress.values()].every(value=>value===activitiesPerSection);}
function updateUnitProgress(){
  const completed=[...sectionProgress.values()].reduce((sum,value)=>sum+value,0);
  const percentage=totalActivities?Math.round(completed/totalActivities*100):0;
  document.querySelector('#unit-progress-label').textContent=`${percentage} % · ${completed} de ${totalActivities} actividades`;
  document.querySelector('#unit-progress-fill').style.width=percentage+'%';
  document.querySelector('#unit-progress-track').setAttribute('aria-valuenow',percentage);
  sectionLinks.forEach(link=>{
    const count=sectionProgress.get(link.dataset.sectionId)||0;
    const card=link.closest('.section-card');
    card.classList.toggle('is-complete',count===activitiesPerSection);
    card.querySelector('.section-progress').textContent=`${count} de ${activitiesPerSection} actividades correctas`;
  });
  document.querySelector('#unit-completion').hidden=!isUnitComplete();
}

sectionLinks.forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();
  viewerTitle.textContent=link.closest('article').querySelector('h2').textContent;
  frame.src=link.href;
  viewer.hidden=false;
  document.body.style.overflow='hidden';
}));
function closeViewer(){frame.src='about:blank';viewer.hidden=true;document.body.style.overflow='';}
document.querySelector('#viewer-back').addEventListener('click',closeViewer);
document.querySelector('#viewer-exit').addEventListener('click',async()=>{closeViewer();if(isFullscreen())await exitFullscreen.call(document);});
addEventListener('message',event=>{
  if(event.source!==frame.contentWindow)return;
  if(event.data&&event.data.type==='ova-back-catalog'){closeViewer();return;}
  if(!event.data||event.data.type!=='ova-progress')return;
  if(!sectionProgress.has(event.data.sectionId))return;
  const completed=Math.max(0,Math.min(activitiesPerSection,Number(event.data.completed)||0));
  sectionProgress.set(event.data.sectionId,completed);
  updateUnitProgress();
});

function escapeXml(value){return String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[character]));}
function wrapTitle(value,maxLength=42){
  const words=value.split(/\s+/);const lines=[''];
  words.forEach(word=>{const last=lines.length-1;if((lines[last]+' '+word).trim().length>maxLength&&lines.length<3)lines.push(word);else lines[last]=(lines[last]+' '+word).trim();});
  return lines;
}
document.querySelector('#download-unit-badge').addEventListener('click',()=>{
  if(!isUnitComplete())return;
  const student=escapeXml(document.querySelector('#unit-student-name').value.trim()||'Estudiante');
  const unitTitle=document.querySelector('.hero h1').textContent.trim();
  const titleLines=wrapTitle(unitTitle).map((line,index)=>`<text x="600" y="${790+index*48}" text-anchor="middle" font-family="Arial" font-weight="800" font-size="31">${escapeXml(line)}</text>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><rect width="1200" height="1200" rx="70" fill="#f6faf4"/><rect width="1200" height="245" fill="#173f32"/><text x="600" y="105" text-anchor="middle" font-family="Arial" font-weight="900" font-size="38" fill="#fff">ADMINISTRACIÓN AGROINDUSTRIAL</text><text x="600" y="165" text-anchor="middle" font-family="Arial" font-size="30" fill="#d8e8bf">BIOLOGÍA APLICADA</text><circle cx="600" cy="480" r="235" fill="#d4af37" stroke="#8f6810" stroke-width="32"/><g opacity=".48" fill="none" stroke="#5d4105" stroke-width="14"><path d="M585 300c-70-45-135 8-120 75-70 28-70 115-12 145-18 75 65 125 120 75 45 60 145 25 140-55 70-25 70-120 5-145 10-70-75-110-125-60-5-15-5-20-8-35Z"/><path d="M590 300v300M470 375h80v60h40M450 485h100v55h40M710 375h-80v60h-40M750 485h-100v55h-60"/></g><text x="600" y="430" text-anchor="middle" font-family="Arial" font-weight="800" font-size="52">INSIGNIA DE UNIDAD</text><text x="600" y="560" text-anchor="middle" font-family="Arial" font-weight="900" font-size="118">100%</text><text x="600" y="630" text-anchor="middle" font-family="Arial" font-weight="800" font-size="28">48 ACTIVIDADES VALIDADAS</text>${titleLines}<text x="600" y="1000" text-anchor="middle" font-family="Arial" font-size="38">Otorgada a ${student}</text><text x="600" y="1070" text-anchor="middle" font-family="Arial" font-size="26">Universidad de Cartagena · CTEV</text></svg>`;
  const blob=new Blob([svg],{type:'image/svg+xml'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=document.body.dataset.unitId+'-insignia-100.svg';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});

updateUnitProgress();
