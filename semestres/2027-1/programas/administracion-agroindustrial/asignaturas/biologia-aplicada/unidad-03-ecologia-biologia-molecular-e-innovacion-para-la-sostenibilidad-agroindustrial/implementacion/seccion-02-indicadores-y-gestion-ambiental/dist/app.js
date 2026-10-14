const data=window.OVA_CONTENT;
const $=selector=>document.querySelector(selector);
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
document.title=`Sección ${data.number} — ${data.title}`;
$('#section-title').textContent=data.title;
$('#section-number').textContent=`Sección ${data.number} · ${data.minutes} minutos`;
$('#section-summary').textContent=data.summary;
$('#section-objective').innerHTML=`<strong>Resultado esperado:</strong> ${esc(data.objective)}`;
$('#references-list').innerHTML=data.references.map(item=>`<li>${esc(item)}</li>`).join('');
const iconFor=index=>['icon-informacion.png','icon-recursos.png','icon-actividades.png','icon-interaccion.png','icon-experiencias.png'][index%5];
const screens=$('#screens');
const nav=$('#stage-nav');
function visualHtml(stage){
  if(!stage.visual?.items?.length)return '';
  return `<figure class="concept-visual" aria-label="${esc(stage.visual.label)}"><figcaption>${esc(stage.visual.label)}</figcaption><div>${stage.visual.items.map((item,index)=>`${index?'<b aria-hidden="true">→</b>':''}<span>${esc(item)}</span>`).join('')}</div></figure>`;
}
function activityHtml(activity,index){
  if(activity.type==='choice'||activity.type==='multi'){
    const type=activity.type==='choice'?'radio':'checkbox';
    const instruction=activity.type==='multi'?'<p class="instruction">Puede existir más de una respuesta correcta.</p>':'';
    return `<fieldset><legend>${esc(activity.question)}</legend>${instruction}${activity.options.map((option,optionIndex)=>`<label class="option"><input type="${type}" name="q-${index}" value="${optionIndex}"><span>${esc(option)}</span></label>`).join('')}</fieldset>`;
  }
  if(activity.type==='order'){
    const options=activity.items.map((item,itemIndex)=>`<option value="${itemIndex}">${esc(item)}</option>`).join('');
    return `<fieldset><legend>${esc(activity.question)}</legend><p class="instruction">Selecciona un elemento diferente en cada posición.</p><div class="order-grid">${activity.items.map((_,itemIndex)=>`<label><span>Posición ${itemIndex+1}</span><select><option value="">Seleccionar…</option>${options}</select></label>`).join('')}</div></fieldset>`;
  }
  const options=activity.pairs.map(pair=>`<option value="${esc(pair.value)}">${esc(pair.option)}</option>`).join('');
  return `<fieldset><legend>${esc(activity.question)}</legend><div class="relation-grid">${activity.pairs.map(pair=>`<label><span>${esc(pair.label)}</span><select><option value="">Seleccionar…</option>${options}</select></label>`).join('')}</div></fieldset>`;
}
data.stages.forEach((stage,index)=>{
  nav.insertAdjacentHTML('beforeend',`<button class="stage-button" type="button" data-go="${index}" aria-label="Ir a la etapa ${index+1}: ${esc(stage.eyebrow)}"><span>${index+1}</span><small>${esc(stage.eyebrow)}</small></button>`);
  screens.insertAdjacentHTML('beforeend',`<section class="screen" data-step="${index}" aria-labelledby="stage-${index}" ${index?'hidden':''}><header class="stage-header"><img class="stage-icon" src="assets/brand/${iconFor(index)}" alt=""><div><p class="eyebrow">${esc(stage.eyebrow)}</p><h2 id="stage-${index}">${esc(stage.title)}</h2></div></header><details class="reading" open><summary>Lectura de contexto</summary><p>${esc(stage.reading)}</p><aside><strong>Conexión agroindustrial:</strong> ${esc(stage.application)}</aside></details>${visualHtml(stage)}<form class="activity" data-index="${index}" data-type="${stage.activity.type}">${activityHtml(stage.activity,index)}<button class="button" type="submit">Validar actividad</button><p class="feedback" aria-live="polite"></p></form></section>`);
});
const stageButtons=[...document.querySelectorAll('.stage-button')];
const screenList=[...document.querySelectorAll('.screen')];
const total=screenList.length;
const storageKey=document.body.dataset.sectionId+'-completed-v2';
let current=0;
let completed=new Set();
try{completed=new Set(JSON.parse(localStorage.getItem(storageKey)||'[]').filter(value=>Number.isInteger(value)&&value>=0&&value<total));}catch{}
const isComplete=()=>completed.size===total&&screenList.every((_,index)=>completed.has(index));
function update(){
  const percentage=Math.round(completed.size/total*100);
  $('#progress-label').textContent=`${percentage} % · ${completed.size} de ${total} actividades`;
  $('#progress-fill').style.width=percentage+'%';
  $('.progress-track').setAttribute('aria-valuenow',percentage);
  stageButtons.forEach((button,index)=>button.classList.toggle('is-complete',completed.has(index)));
  $('#completion').hidden=!isComplete();
}
function show(index,focus=true){
  current=(index+total)%total;
  screenList.forEach((screen,screenIndex)=>screen.hidden=screenIndex!==current);
  stageButtons.forEach((button,buttonIndex)=>{button.classList.toggle('is-current',buttonIndex===current);button.setAttribute('aria-current',buttonIndex===current?'step':'false');});
  $('#position').textContent=`Etapa ${current+1} de ${total}`;
  if(focus)screenList[current].scrollIntoView({behavior:'smooth',block:'start'});
}
function actual(form,type){
  if(type==='choice'||type==='multi')return [...form.querySelectorAll('input:checked')].map(input=>Number(input.value)).sort((a,b)=>a-b);
  return [...form.querySelectorAll('select')].map(select=>type==='order'?(select.value===''?'':Number(select.value)):select.value);
}
stageButtons.forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.go))));
$('#previous').addEventListener('click',()=>show(current-1));
$('#next').addEventListener('click',()=>show(current+1));
document.querySelectorAll('.activity').forEach((form,index)=>form.addEventListener('submit',event=>{
  event.preventDefault();
  const activity=data.stages[index].activity;
  const answer=actual(form,activity.type);
  const feedback=form.querySelector('.feedback');
  if(!answer.length||answer.some(value=>value===''||Number.isNaN(value))){feedback.textContent='Completa todos los campos antes de validar.';feedback.className='feedback error';return;}
  if(JSON.stringify(answer)===JSON.stringify(activity.answer)){
    completed.add(index);localStorage.setItem(storageKey,JSON.stringify([...completed]));feedback.textContent='Correcto. '+activity.success;feedback.className='feedback success';update();
  }else{feedback.textContent='Aún no. Revisa la lectura y la conexión agroindustrial, ajusta tu respuesta e inténtalo nuevamente.';feedback.className='feedback error';}
}));
$('#restart').addEventListener('click',()=>{
  if(!confirm('¿Deseas borrar el avance validado y reiniciar esta sección?'))return;
  completed.clear();localStorage.removeItem(storageKey);document.querySelectorAll('.activity').forEach(form=>{form.reset();const feedback=form.querySelector('.feedback');feedback.textContent='';feedback.className='feedback';});update();show(0);
});
$('#download-badge').addEventListener('click',()=>{
  if(!isComplete())return;
  const name=esc($('#student-name').value.trim()||'Estudiante');
  const title=esc(data.title);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><rect width="1200" height="1200" rx="70" fill="#f6faf4"/><rect width="1200" height="250" fill="#173f32"/><circle cx="600" cy="500" r="245" fill="#d4af37" stroke="#8f6810" stroke-width="32"/><g opacity=".48" fill="none" stroke="#5d4105" stroke-width="14"><path d="M585 315c-70-45-135 8-120 75-70 28-70 115-12 145-18 75 65 125 120 75 45 60 145 25 140-55 70-25 70-120 5-145 10-70-75-110-125-60-5-15-5-20-8-35Z"/><path d="M590 315v300M470 390h80v60h40M450 500h100v55h40M710 390h-80v60h-40M750 500h-100v55h-60"/></g><text x="600" y="455" text-anchor="middle" font-family="Arial" font-weight="800" font-size="55">INSIGNIA</text><text x="600" y="580" text-anchor="middle" font-family="Arial" font-weight="900" font-size="120">100%</text><text x="600" y="650" text-anchor="middle" font-family="Arial" font-weight="800" font-size="30">CUMPLIMIENTO VALIDADO</text><text x="600" y="835" text-anchor="middle" font-family="Arial" font-weight="800" font-size="38">${title}</text><text x="600" y="925" text-anchor="middle" font-family="Arial" font-size="38">Otorgada a ${name}</text><text x="600" y="1000" text-anchor="middle" font-family="Arial" font-size="27">Universidad de Cartagena · Biología Aplicada</text></svg>`;
  const blob=new Blob([svg],{type:'image/svg+xml'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=document.body.dataset.sectionId+'-insignia.svg';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});
$('.catalog-link').addEventListener('click',event=>{if(event.currentTarget.id==='restart'||window.parent===window)return;event.preventDefault();window.parent.postMessage({type:'ova-back-catalog'},'*');});
update();show(0,false);
