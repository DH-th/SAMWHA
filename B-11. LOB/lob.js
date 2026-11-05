'use strict';
(() => {
 const $=id=>document.getElementById(id),API='https://server.samhwa.cloud/api/lob';
 const simulationMode=document.body.dataset.mode==='simulation';
 let simulationSources={};
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=(n,d=1)=>Number.isFinite(n)?n.toLocaleString('ko-KR',{maximumFractionDigits:d}):'—';
 let state={revision:0,models:{},lines:{}},catalog=[],line='L.1',loaded=false,dirty=false,saving=false,options=[],proposal=null,simulation=null;
 let simulationTimer=null,libraryKey=null,savedModels={};
 const currentKey=()=>simulationMode?state.lines[line]:libraryKey;
 const current=()=>state.models[currentKey()];
 const error=message=>{$('error').textContent=message||'';$('error').hidden=!message;};
 async function api(path='',init={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{const r=await fetch(API+path,{...init,cache:'no-store',signal:controller.signal});const b=await r.json();if(!r.ok)throw new Error(b.error||`HTTP ${r.status}`);return b;}
  catch(e){if(e.name==='AbortError')throw new Error('서버 응답 시간 초과');throw e;}finally{clearTimeout(timer);}
 }
 function allModels(){
  if(simulationMode)return Object.entries(savedModels).map(([key,m])=>({...m,key}));
  const map=new Map(catalog.map(m=>[m.key,m]));
  for(const [key,m] of Object.entries(state.models))if(!map.has(key))map.set(key,{key,plant:m.plant,model:m.model,referenceCapa:null,warning:'직접 등록 모델'});
  return [...map.values()];
 }
 function changed(){dirty=true;simulation=null;$('dirty').textContent=simulationMode?'Simulation · 임시 변경':'저장 전 변경사항';$('save').disabled=!loaded||saving;renderResults();renderFloor();renderSavedModels();}
 function fresh(meta){return {plant:meta.plant,model:meta.model,s1:[0,0,0],s1Array:1,s2:['TouchUp','ICT','FPT','FT','Coating&Silicon'].map(name=>({name,count:1,seconds:0,array:1})),minutes:480,target:0};}
 function renderSavedModels(){
  const open=new Set([...$('saved-models').querySelectorAll('details[open]')].map(d=>d.dataset.plant));
  const q=$('saved-search').value.trim().toLowerCase(),groups=new Map();
  for(const key of Object.keys(savedModels)){
   const m=state.models[key];if(!m||!`${m.plant} ${m.model}`.toLowerCase().includes(q))continue;
   if(!groups.has(m.plant))groups.set(m.plant,[]);groups.get(m.plant).push({key,m});
  }
  $('saved-count').textContent=`${Object.keys(savedModels).length} Models`;
  $('saved-models').innerHTML=[...groups].sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true})).map(([plant,items])=>`<details data-plant="${esc(plant)}" ${q||open.has(plant)||items.some(x=>x.key===libraryKey)?'open':''}><summary>${esc(plant)} <span>${items.length}</span></summary><div class="saved-grid">${items.sort((a,b)=>a.m.model.localeCompare(b.m.model,undefined,{numeric:true})).map(({key,m})=>`<button data-saved-model="${esc(key)}" aria-pressed="${libraryKey===key}" class="saved-model ${libraryKey===key?'active':''}"><strong>${esc(m.model)}</strong><small>S1 ${fmt(LobCalc.sectionCapacity(m,'S1'))} / H · S2 ${fmt(LobCalc.sectionCapacity(m,'S2'))} / H</small>${JSON.stringify(m)!==JSON.stringify(savedModels[key])?'<em>수정 중</em>':''}</button>`).join('')}</div></details>`).join('')||`<p class="muted">${q?'검색 결과가 없습니다.':'Save한 모델이 Plant별로 표시됩니다.'}</p>`;
 }
 function renderFloor(){
  $('floor').innerHTML=Array.from({length:10},(_,n)=>10-n).map(n=>{
   const name=`L.${n}`,m=state.models[state.lines[name]],result=m?LobCalc.calculate(m):null;
   let flow='<span class="flow-empty">+ Model<br>↑</span>';
   if(m){
    const s1=m.s1.map((seconds,i)=>`<div class="flow-station ${result?.valid&&result.stages[i].bottleneck?'bn':''}" title="Insert ${i+1} · ${fmt(seconds)}s"><i class="person"></i><span>I${i+1}</span><small>${fmt(seconds)}s</small></div>`).join('');
    const s2=m.s2.map((p,i)=>`<div class="flow-station ${result?.valid&&result.stages[m.s1.length+i].bottleneck?'bn':''}" style="flex:${Math.max(1,p.count)}" title="${esc(p.name)} · ${p.count}개 · ${fmt(p.seconds)}초 · Array ${p.array??1}"><span>${esc(p.name)}</span><small>×${p.count}</small></div>`).join('');
    flow=`<div class="flow-section s1" style="flex:${m.s1.length}" aria-label="S1 Insert">${s1}<b class="flow-label">S1</b></div>${m.s2.length?`<div class="flow-section s2" style="flex:${m.s2.reduce((s,p)=>s+Math.max(1,p.count),0)}" aria-label="S2 공정">${s2}<b class="flow-label">S2</b></div>`:''}`;
   }
   return `<button class="line-card ${name===line?'selected':''} ${m?'assigned':'unassigned'}" data-line="${name}" aria-pressed="${name===line}"><span class="line-label">${name}<small>${name===line?'●':'↑'}</small></span><span class="line-model">${m?`<b>${esc(m.model)}</b>`:'—'}</span><div class="flow">${flow}</div><span class="line-uph">${result?.valid?fmt(result.uph):'—'} <small>/ H</small></span></button>`;
  }).join('');
 }
 function renderModelOptions(selected=''){
  const q=$('model-search').value.trim().replace(/(?<=\d)[a-z]$/i,'').toLowerCase();
  $('model').innerHTML='<option value="">Model 선택</option>'+allModels().filter(m=>m.plant===$('plant').value&&(!q||m.model.toLowerCase().includes(q)||m.key===selected)).sort((a,b)=>a.model.localeCompare(b.model,undefined,{numeric:true})).map(m=>`<option value="${m.key}">${esc(m.model)}</option>`).join('');
  $('model').value=selected;
 }
 function selectLine(name){line=name;libraryKey=null;simulation=null;error('');renderEditor();renderFloor();renderSavedModels();}
 function renderEditor(){
  const m=current(),key=simulationMode?simulationSources[line]:currentKey();$('line-title').textContent=simulationMode?line:'Model';$('unassign').hidden=!simulationMode;
  const plants=[...new Set(allModels().map(m=>m.plant))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  $('plant').innerHTML='<option value="">Plant 선택</option>'+plants.map(p=>`<option>${esc(p)}</option>`).join('');
  $('plant').value=m?.plant||'';$('model-search').value='';renderModelOptions(key||'');
  $('plant').disabled=$('model').disabled=!loaded;
  if($('add-model'))$('add-model').disabled=!loaded||!$('plant').value;
  for(const id of ['target','minutes','unassign'])$(id).disabled=!m;
  $('setup').hidden=!m;$('empty').hidden=!!m;
  $('target').value=m?.target||0;$('minutes').value=m?.minutes||480;
  const meta=allModels().find(x=>x.key===key),refs=meta?.referenceCapas||[];$('reference').textContent=refs.length>1?`${fmt(refs[0])}–${fmt(refs.at(-1))} / H`:meta?.referenceCapa?`${fmt(meta.referenceCapa)} / H`:'—';
  $('reference').title=meta?.variants?.join(', ')||'';
  $('shared').textContent=m?`${m.plant} / ${m.model} · ${simulationMode?'시뮬레이션 전용 · 원본 변경 없음':'모델별 공정 데이터'}${meta?.warning?' '+meta.warning:''}`:'';
  if(m){$('s1-count').value=m.s1.length;$('s1-array').value=m.s1Array??1;renderS1();renderStages();}renderResults();
 }
 function renderS1(){const m=current();$('s1-workers').innerHTML=m.s1.map((v,i)=>`<label class="worker-entry"><span>Insert ${i+1}<i class="person"></i></span><input aria-label="Insert ${i+1} 시간" data-worker="${i}" type="number" min="0" max="86400" step="0.1" value="${v||''}" placeholder="s"></label>`).join('');}
 function renderStages(){
  $('stages').innerHTML=current().s2.map((p,i)=>`<tr data-index="${i}"><td><input data-field="name" value="${esc(p.name)}" list="process-names" aria-label="공정명"></td><td><input type="number" data-field="count" aria-label="${esc(p.name)} 개수" min="1" max="60" step="1" value="${p.count}"></td><td><input type="number" data-field="seconds" aria-label="${esc(p.name)} 시간" min="0" max="86400" step="0.1" value="${p.seconds||''}" placeholder="초"></td><td><input type="number" data-field="array" aria-label="${esc(p.name)} PCB Array" min="1" max="64" step="1" list="array-values" value="${p.array??1}"></td><td class="stage-actions"><button data-move="-1" title="이전 공정" ${i===0?'disabled':''}>↑</button><button data-move="1" title="다음 공정" ${i===current().s2.length-1?'disabled':''}>↓</button><button data-remove title="공정 삭제">×</button></td></tr>`).join('');
 }
 function renderResults(){
  clearTimeout(simulationTimer);simulation=null;
  const m=current(),r=m?LobCalc.calculate(m):null,ok=r?.valid;
  $('uph').textContent=ok?fmt(r.uph):'—';$('lob').textContent=ok?fmt(r.lob)+'%':'—';$('workers').textContent=m?`${m.s1.length} / ${m.s2.reduce((s,p)=>s+p.count,0)}`:'—';
  $('bottleneck').textContent=ok?r.bottlenecks.join(' / '):'—';$('cycle').textContent=ok?`${fmt(r.cycle)} s / PCB`:'Cycle time';
  $('section-capa').textContent=ok?`S1 ${fmt(r.s1Capa)} / S2 ${r.s2Capa===null?'미사용':fmt(r.s2Capa)}`:'S1 / S2';
  if(!m)return;
  for(const section of ['S1','S2']){
   $(section.toLowerCase()+'-capa').textContent=fmt(LobCalc.sectionCapacity(m,section));
   $(section.toLowerCase()+'-qty').textContent=simulation?.sections?.[section]?fmt(simulation.sections[section].produced,0):'—';
  }
  $('s1-total').textContent=`총 삽입 ${fmt(m.s1.reduce((s,x)=>s+x,0))}초 / ${m.s1Array??1}개 묶음 · ${m.s1.length}명`;
  if(!ok){$('chart').innerHTML=`<p class="muted">${r.issues.map(esc).join('<br>')}</p>`;$('recommendations').innerHTML='<p class="muted">시간·CAPA 입력 후 비교안을 확인하세요.</p>';}
  else{
   const max=Math.max(r.cycle,r.targetCycle||0)*1.12;
   $('chart').innerHTML=(r.targetCycle?`<p class="caption">목표 ${fmt(m.target)} / H · 점선 ${fmt(r.targetCycle)}s</p>`:'')+r.stages.map(p=>`<div class="bar-row"><span class="bar-label">${esc(p.name)}<small>${p.section} · ${fmt(p.capa)} / H</small></span><div class="bar-track"><div class="bar ${p.section.toLowerCase()} ${p.bottleneck?'bn':''}" style="width:${100*p.cycle/max}%"></div>${r.targetCycle?`<i class="target-mark" style="left:${100*r.targetCycle/max}%"></i>`:''}</div><span class="bar-value">${fmt(p.cycle)}s</span></div>`).join('');
   options=LobCalc.recommendations(m).filter(o=>o.after.uph>r.uph+1e-7).slice(0,3);
   const targetNote=m.target&&r.uph<m.target?`<p class="muted">목표까지 ${fmt(m.target-r.uph)} / H 부족 · 병목 공정을 먼저 검토하세요.</p>`:'';
   $('recommendations').innerHTML=targetNote+(options.length?options.map((o,i)=>`<div class="option"><button data-option="${i}">비교</button><h3>${esc(o.title)}</h3><p>${esc(o.note)}</p><strong>${fmt(r.uph)} → ${fmt(o.after.uph)} / H</strong></div>`).join(''):'<p class="muted">현재 S1 작업이 균등합니다. 목표 UPH와 각 공정의 실측 시간을 비교하세요.</p>');
  }
  $('simulation').innerHTML=`<p class="muted">${ok?'자동 계산 중…':'시간·개수·Array를 입력하면 자동 계산됩니다.'}</p>`;
  if(ok&&simulationMode)simulationTimer=setTimeout(()=>{if(current())runSimulation();},180);
 }
 function showProposal(candidate,title,note){
  const before=LobCalc.calculate(current()),after=LobCalc.calculate(candidate);if(!before.valid||!after.valid){error('모든 공정의 시간·CAPA를 먼저 입력하세요.');return;}
  proposal={candidate,key:currentKey()};$('proposal-title').textContent=title;$('proposal-note').textContent=note;
  $('proposal-metrics').innerHTML=`<div>${fmt(before.uph)} → ${fmt(after.uph)}<small>Line CAPA / H</small></div><div>${fmt(before.lob)} → ${fmt(after.lob)}%<small>LOB</small></div><div>${before.positions} → ${after.positions}<small>작업 위치</small></div>`;$('proposal').showModal();
 }
 async function load(){
  if(dirty&&!confirm('저장하지 않은 변경을 버리고 서버 자료를 불러올까요?'))return;
  $('reload').disabled=true;$('save').disabled=true;error('');
  try{
   const [s,c]=await Promise.all([api(),api('/catalog').catch(e=>({models:[],warning:e.message}))]);state=s;savedModels=structuredClone(s.models);if(!state.models[libraryKey])libraryKey=null;catalog=c.models;loaded=true;dirty=false;simulation=null;
   if(simulationMode){
    simulationSources={...s.lines};state={...s,models:{},lines:{}};
    for(const [name,key] of Object.entries(s.lines))if(savedModels[key]){const id=`sim:${name}`;state.models[id]=structuredClone(savedModels[key]);state.lines[name]=id;}
   }
   $('dirty').textContent='';$('status').textContent=simulationMode?`Simulation · 저장 모델 ${Object.keys(savedModels).length}개 · 원본 변경 없음`:`서버 연결 · ${catalog.length}개 모델 · 저장 v${state.revision}`;renderEditor();renderFloor();renderSavedModels();
   const notices=[...(state.migrationNotes||[]),...(c.warning?[`Excel 목록 조회 실패 · 저장 모델은 사용 가능합니다. ${c.warning}`]:[])];if(notices.length)error(notices.join('\n'));
   requestAnimationFrame(()=>{const scroller=document.querySelector('.floor-scroll');scroller.scrollLeft=scroller.scrollWidth;});
  }catch(e){error(e.message);$('status').textContent='서버 연결 실패 · lob.py 및 서버 연결 확인';}
  finally{$('reload').disabled=false;$('save').disabled=!loaded||!dirty;}
 }
 $('floor').onclick=e=>{const b=e.target.closest('[data-line]');if(b&&!saving)selectLine(b.dataset.line);};
 $('saved-search').oninput=renderSavedModels;
 $('saved-models').onclick=e=>{const b=e.target.closest('[data-saved-model]');if(!b||saving)return;libraryKey=b.dataset.savedModel;error('');renderEditor();renderSavedModels();document.querySelector('.workspace').scrollIntoView({behavior:'smooth',block:'start'});};
 $('plant').onchange=()=>{renderModelOptions();if($('add-model'))$('add-model').disabled=!loaded||!$('plant').value;};$('model-search').oninput=()=>renderModelOptions((simulationMode?simulationSources[line]:currentKey())||'');
 if($('add-model')){
  $('add-model').onclick=()=>{
   if(!loaded||saving||!$('plant').value)return;
   $('new-model-plant').value=$('plant').value;$('new-model-name').value='';$('new-model-error').textContent='';
   $('new-model-dialog').showModal();$('new-model-name').focus();
  };
  $('new-model-close').onclick=()=>$('new-model-dialog').close();
  $('new-model-form').onsubmit=async e=>{
   e.preventDefault();if(saving||$('new-model-submit').disabled)return;
   const plant=$('new-model-plant').value,model=$('new-model-name').value.trim().replace(/(?<=\d)[A-Za-z]$/,'');
   if(!model){$('new-model-error').textContent='모델명을 입력하세요.';return;}
   if(!allModels().some(m=>m.plant===plant)){$('new-model-error').textContent='기존 Plant를 선택하세요.';return;}
   $('new-model-submit').disabled=true;
   try{
    const existing=allModels().find(m=>m.plant===plant&&m.model===model);
    // Match Python json.dumps([plant, model], ensure_ascii=False), including its separator space.
    const digest=existing?null:await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`[${JSON.stringify(plant)}, ${JSON.stringify(model)}]`));
    const key=existing?.key||[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,24);
    const isNew=!state.models[key];
    if(isNew)state.models[key]=fresh({plant,model});
    libraryKey=key;$('new-model-dialog').close();error('');renderEditor();
    if(isNew)changed();else renderSavedModels();
    $('status').textContent=`${plant} / ${model} · ${isNew?'공정 입력 후 Save':'기존 모델 열기'}`;
   }catch(e){$('new-model-error').textContent=`모델 추가 실패 · ${e.message}`;}
   finally{$('new-model-submit').disabled=false;}
  };
 }
 $('model').onchange=()=>{
  const meta=allModels().find(m=>m.key===$('model').value);if(!meta)return;
  if(simulationMode){const key=`sim:${line}`;state.models[key]=structuredClone(savedModels[meta.key]);state.lines[line]=key;simulationSources[line]=meta.key;}
  else{state.models[meta.key]||=fresh(meta);libraryKey=meta.key;}
  renderEditor();changed();
 };
 $('unassign').onclick=()=>{state.lines[line]=null;delete simulationSources[line];renderEditor();changed();};
 for(const id of ['minutes','target'])$(id).oninput=()=>{const m=current();if(!m)return;m[id]=Number($(id).value);changed();};
 $('s1-count').oninput=()=>{
  const m=current(),n=Number($('s1-count').value);if(!Number.isInteger(n)||n<1||n>60){clearTimeout(simulationTimer);simulation=null;for(const s of ['s1','s2'])$(s+'-qty').textContent='—';$('simulation').innerHTML='<p class="muted">S1 인원을 1~60명으로 입력하세요.</p>';return;}
  if(n===m.s1.length){renderResults();return;}
  // Removed operators' work is retained at the last remaining station.
  if(n<m.s1.length){const removed=m.s1.slice(n).reduce((s,x)=>s+x,0);m.s1=m.s1.slice(0,n);m.s1[n-1]+=removed;}
  else while(m.s1.length<n)m.s1.push(0);
  renderS1();changed();
 };
 $('s1-count').onchange=()=>{const n=Number($('s1-count').value);if(!Number.isInteger(n)||n<1||n>60){$('s1-count').value=current().s1.length;renderResults();}};
 $('s1-workers').oninput=e=>{if(e.target.dataset.worker!==undefined){current().s1[Number(e.target.dataset.worker)]=Number(e.target.value);changed();}};
 $('s1-array').oninput=()=>{current().s1Array=Number($('s1-array').value);changed();};
 $('balance').onclick=()=>{
  const m=current(),candidate=structuredClone(m),sum=m.s1.reduce((s,x)=>s+x,0);
  if(!sum){error('삽입 시간을 먼저 입력하세요.');return;}
  candidate.s1=candidate.s1.map(()=>sum/candidate.s1.length);
  // S1 headcount changes can temporarily contain zero-time operators.
  const before=LobCalc.calculate(m),after=LobCalc.calculate(candidate);
  if(!before.valid&&after.valid){proposal={candidate,key:currentKey()};$('proposal-title').textContent='S1 균등 배분';$('proposal-note').textContent=`총 ${fmt(sum)}초를 ${m.s1.length}명에게 1인 ${fmt(sum/m.s1.length)}초로 배분합니다.`;$('proposal-metrics').innerHTML=`<div>${fmt(after.uph)} / H<small>배분 후 Line CAPA</small></div>`;$('proposal').showModal();return;}
  showProposal(candidate,'S1 균등 배분',`총 ${fmt(sum)}초의 삽입 작업을 유지합니다. 실제 작업 분할 가능 여부를 확인하세요.`);
 };
 $('add-stage').onclick=()=>{if(current().s2.length>=40)return;current().s2.push({name:'Process',count:1,seconds:0,array:1});renderStages();changed();};
 $('stages').oninput=e=>{
  const field=e.target.dataset.field;if(!field)return;const tr=e.target.closest('tr'),p=current().s2[Number(tr.dataset.index)];
  if(field==='name')p.name=e.target.value;
  else p[field]=Number(e.target.value);
  changed();
 };
 $('stages').onclick=e=>{const button=e.target.closest('button');if(!button)return;const i=Number(button.closest('tr').dataset.index),list=current().s2;if(button.hasAttribute('data-remove'))list.splice(i,1);else{const j=i+Number(button.dataset.move);if(j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];}renderStages();changed();};
 $('recommendations').onclick=e=>{const button=e.target.closest('[data-option]');if(button){const o=options[Number(button.dataset.option)];showProposal(o.candidate,o.title,o.note);}};
 $('proposal-close').onclick=()=>$('proposal').close();$('proposal-apply').onclick=()=>{if(!proposal)return;state.models[proposal.key]=proposal.candidate;$('proposal').close();proposal=null;renderEditor();changed();};
 function runSimulation(){
  simulation=LobCalc.simulate(current());if(!simulation.valid){error(simulation.issues.join('\n'));return;}
  const r=simulation,max=Math.max(1,...r.hourly);
  for(const section of ['S1','S2'])$(section.toLowerCase()+'-qty').textContent=r.sections[section]?fmt(r.sections[section].produced,0):'—';
  $('simulation').innerHTML=`<div class="section-output">${['S1','S2'].map(s=>`<div><span>${s} 완료</span><strong>${r.sections[s]?fmt(r.sections[s].produced,0):'—'} <small>PCS</small></strong></div>`).join('')}</div><p class="muted">${fmt(r.minutes)}분 · S2는 S1에서 나온 PCB를 받아 처리${r.limited?' · 계산 상한 도달 (부분 결과)':''}</p><p class="muted">첫 최종 완료 ${fmt(r.lead)}초 · 정상상태 ${fmt(r.uph)}/H</p><div class="hours">${r.hourly.map((q,i)=>`<div class="hour" title="${i*60}~${Math.min((i+1)*60,r.minutes)}분: ${q}개"><b>${fmt(q,0)}</b><i style="height:${Math.max(1,65*q/max)}px"></i><span>${i+1}H</span></div>`).join('')}</div>`;
 }
 async function saveSettings(){
  if(simulationMode||!loaded||saving)return null;saving=true;$('save').disabled=true;$('excel').disabled=true;$('reload').disabled=true;error('');
  const snapshot=structuredClone(state),snapshotText=JSON.stringify(snapshot);
  try{const saved=await api('',{method:'PUT',headers:{'Content-Type':'application/json'},body:snapshotText});
   if(JSON.stringify(state)===snapshotText){state=saved;dirty=false;$('dirty').textContent='';}else{state.revision=saved.revision;state.savedAt=saved.savedAt;}
   savedModels=structuredClone(saved.models);renderSavedModels();
   $('status').textContent=`서버 · Excel 저장 완료 · v${saved.revision}`;
   return saved;
  }catch(e){error(e.message);return null;}finally{saving=false;$('save').disabled=!dirty;$('excel').disabled=false;$('reload').disabled=false;}
 }
 $('save').onclick=saveSettings;
 if($('open-simulation'))$('open-simulation').onclick=async()=>{
  if(!loaded||saving)return;
  const win=window.open('about:blank','_blank');if(!win){error('시뮬레이션 창을 열 수 없습니다. 팝업 허용 후 다시 시도하세요.');return;}
  if(dirty&&!await saveSettings()){win.close();return;}
  win.opener=null;win.location.href=new URL('simulation.html',location.href).href;
 };
 $('excel').onclick=async()=>{
  if(!loaded||saving)return;
  if(!Object.keys(state.models).length){error('모델을 선택하고 설정을 입력하세요.');return;}
  const saved=dirty?await saveSettings():state;if(!saved)return;
  $('excel').disabled=true;error('');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
  try{
   const r=await fetch(`${API}/export?revision=${saved.revision}`,{cache:'no-store',signal:controller.signal});
   if(!r.ok){const b=await r.json();throw new Error(b.error||`HTTP ${r.status}`);}
   const url=URL.createObjectURL(await r.blob()),a=document.createElement('a');
   a.href=url;a.download=`SAMHWA_LOB_v${saved.revision}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   $('status').textContent=`Excel 다운로드 · v${saved.revision}${dirty?' · 추가 변경은 Save 필요':''}`;
  }catch(e){error(e.name==='AbortError'?'Excel 다운로드 시간 초과':e.message);}
  finally{clearTimeout(timer);$('excel').disabled=false;}
 };
 $('backup').onclick=()=>{if(!loaded)return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.href=url;a.download='samhwa-lob.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('reload').onclick=load;window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 renderFloor();load();
})();
