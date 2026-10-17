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
const BLOOM={C2:'Comprender',C3:'Aplicar',C4:'Analizar',C5:'Evaluar'};
function bloomFor(activity,index){
  if(activity.bloom&&BLOOM[activity.bloom])return {level:activity.bloom,label:BLOOM[activity.bloom]};
  const question=activity.question.toLowerCase();
  if(activity.type==='match')return {level:'C2',label:'Comprender'};
  if(activity.type==='order')return index>=7?{level:'C4',label:'Analizar'}:{level:'C3',label:'Aplicar'};
  if(activity.type==='multi')return index>=6||/evidenc|criter|decisiones|precauciones|evaluación/.test(question)?{level:'C4',label:'Analizar'}:{level:'C3',label:'Aplicar'};
  if(/más sól|mejor|más coherente|prudente|conviene|responsable|insuficiente|criterio debe|propuesta|decisión|priorizar|alternativa|uso correcto|indicador está mejor|participación aporta más|qué acción es correcta|cuál afirmación es prudente/.test(question))return {level:'C5',label:'Evaluar'};
  if(index>=4||/caso|lotes|muestra|patrón|inferencia|diagnóstico|comparación/.test(question))return {level:'C4',label:'Analizar'};
  return {level:'C2',label:'Comprender'};
}
function hashSeed(text){
  let hash=2166136261;
  for(const character of text){hash^=character.charCodeAt(0);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
function shuffle(items,salt){
  const result=[...items];
  let state=hashSeed(salt);
  for(let index=result.length-1;index>0;index--){
    state^=state<<13;state^=state>>>17;state^=state<<5;state>>>=0;
    const target=state%(index+1);
    [result[index],result[target]]=[result[target],result[index]];
  }
  if(result.length>1&&result.every((item,index)=>item===items[index]))result.push(result.shift());
  return result;
}
function visualHtml(stage){
  if(!stage.visual?.items?.length)return '';
  return `<figure class="concept-visual" aria-label="${esc(stage.visual.label)}"><figcaption>${esc(stage.visual.label)}</figcaption><div>${stage.visual.items.map((item,index)=>`${index?'<b aria-hidden="true">→</b>':''}<span>${esc(item)}</span>`).join('')}</div></figure>`;
}
function activityHtml(activity,index){
  if(activity.type==='choice'||activity.type==='multi'){
    const type=activity.type==='choice'?'radio':'checkbox';
    const instruction=activity.type==='multi'?'<p class="instruction">Puede existir más de una respuesta correcta.</p>':'';
    const displayOptions=shuffle(activity.options.map((option,optionIndex)=>({option,optionIndex})),`${data.slug}:${index}:options`);
    if(activity.type==='choice'){
      const targetPosition=(Number(data.number)+index+(hashSeed(data.slug)%displayOptions.length))%displayOptions.length;
      const currentPosition=displayOptions.findIndex(item=>item.optionIndex===activity.answer[0]);
      [displayOptions[targetPosition],displayOptions[currentPosition]]=[displayOptions[currentPosition],displayOptions[targetPosition]];
    }
    return `<fieldset><legend>${esc(activity.question)}</legend>${instruction}${displayOptions.map(({option,optionIndex})=>`<label class="option"><input type="${type}" name="q-${index}" value="${optionIndex}"><span>${esc(option)}</span></label>`).join('')}</fieldset>`;
  }
  if(activity.type==='order'){
    const options=shuffle(activity.items.map((item,itemIndex)=>({item,itemIndex})),`${data.slug}:${index}:order`).map(({item,itemIndex})=>`<option value="${itemIndex}">${esc(item)}</option>`).join('');
    return `<fieldset><legend>${esc(activity.question)}</legend><p class="instruction">Selecciona un elemento diferente en cada posición.</p><div class="order-grid">${activity.items.map((_,itemIndex)=>`<label><span>Posición ${itemIndex+1}</span><select><option value="">Seleccionar…</option>${options}</select></label>`).join('')}</div></fieldset>`;
  }
  const options=shuffle(activity.pairs,`${data.slug}:${index}:match`).map(pair=>`<option value="${esc(pair.value)}">${esc(pair.option)}</option>`).join('');
  return `<fieldset><legend>${esc(activity.question)}</legend><div class="relation-grid">${activity.pairs.map(pair=>`<label><span>${esc(pair.label)}</span><select><option value="">Seleccionar…</option>${options}</select></label>`).join('')}</div></fieldset>`;
}
data.stages.forEach((stage,index)=>{
  const bloom=bloomFor(stage.activity,index);
  nav.insertAdjacentHTML('beforeend',`<button class="stage-button" type="button" data-go="${index}" aria-label="Ir a la etapa ${index+1}: ${esc(stage.eyebrow)}"><span>${index+1}</span><small>${esc(stage.eyebrow)}</small></button>`);
  screens.insertAdjacentHTML('beforeend',`<section class="screen" data-step="${index}" aria-labelledby="stage-${index}" ${index?'hidden':''}><header class="stage-header"><img class="stage-icon" src="assets/brand/${iconFor(index)}" alt=""><div><p class="eyebrow">${esc(stage.eyebrow)}</p><h2 id="stage-${index}">${esc(stage.title)}</h2><p class="bloom-tag">Nivel cognitivo ${bloom.level} · ${bloom.label}</p></div></header><details class="reading" open><summary>Lectura de contexto</summary>${stage.reading.split('\n\n').map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}<aside><strong>Conexión profesional:</strong> ${esc(stage.application)}</aside></details>${visualHtml(stage)}<form class="activity" data-index="${index}" data-type="${stage.activity.type}" data-bloom="${bloom.level}">${activityHtml(stage.activity,index)}<button class="button" type="submit">Validar actividad</button><p class="feedback" aria-live="polite"></p></form></section>`);
});
const stageButtons=[...document.querySelectorAll('.stage-button')];
const screenList=[...document.querySelectorAll('.screen')];
const total=screenList.length;
const storageKey=document.body.dataset.sectionId+'-completed-v2';
let current=0;
let completed=new Set();
try{completed=new Set(JSON.parse(localStorage.getItem(storageKey)||'[]').filter(value=>Number.isInteger(value)&&value>=0&&value<total));}catch{}
function update(){
  const percentage=Math.round(completed.size/total*100);
  $('#progress-label').textContent=`${percentage} % · ${completed.size} de ${total} actividades`;
  $('#progress-fill').style.width=percentage+'%';
  $('.progress-track').setAttribute('aria-valuenow',percentage);
  stageButtons.forEach((button,index)=>button.classList.toggle('is-complete',completed.has(index)));
  window.parent.postMessage({type:'ova-progress',sectionId:document.body.dataset.sectionId,completed:completed.size,total},'*');
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
    completed.add(index);try{localStorage.setItem(storageKey,JSON.stringify([...completed]));}catch{}feedback.textContent='Correcto. '+activity.success;feedback.className='feedback success';update();
  }else{feedback.textContent='Aún no. Revisa la lectura y la conexión profesional, ajusta tu respuesta e inténtalo nuevamente.';feedback.className='feedback error';}
}));
$('#restart').addEventListener('click',()=>{
  if(!confirm('¿Deseas borrar el avance validado y reiniciar esta sección?'))return;
  completed.clear();try{localStorage.removeItem(storageKey);}catch{}document.querySelectorAll('.activity').forEach(form=>{form.reset();const feedback=form.querySelector('.feedback');feedback.textContent='';feedback.className='feedback';});update();show(0);
});
$('.catalog-link').addEventListener('click',event=>{if(event.currentTarget.id==='restart'||window.parent===window)return;event.preventDefault();window.parent.postMessage({type:'ova-back-catalog'},'*');});
update();show(0,false);
