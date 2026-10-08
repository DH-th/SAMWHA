'use strict';
(()=>{
  const API='https://server.samhwa.cloud/api/maintenance';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:2});
  const dateString=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDate=(day,n)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return dateString(d);};
  const workToday=()=>{const d=new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Bangkok'}));if(d.getHours()<8)d.setDate(d.getDate()-1);return dateString(d);};
  const stamp=s=>String(s||'').replace('T',' ').replace(/\+07:00$/,'');
  const shiftName=s=>s==='day'?'Day':'Night';
  const time=h=>`${String(h%24).padStart(2,'0')}:00`;
  const period=(shift,slot)=>{const h=(shift==='day'?8:20)+slot*2;return `${time(h)}–${time(h+2)}${h>=24?' (다음 날)':''}`;};
  const photoUrl=name=>`${API}/photos/${encodeURIComponent(name)}`;
  let settingsPassword='';
  let current=null,online=false,generation=0,config=null,editContext=null,editing=null,requestId=null,previewUrls=[];
  $('date').value=workToday();$('stats-month').value=workToday().slice(0,7);
  const bangkokHour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
  let mobileShift=bangkokHour>=20||bangkokHour<8?'night':'day';
  async function api(path,options={}){
    const res=await fetch(API+path,{...options,cache:'no-store',signal:options.signal||AbortSignal.timeout(30000)});
    let data;try{data=await res.json();}catch{throw new Error(`서버 응답 오류 (${res.status}). 서버 파일 반영과 실행 상태를 확인하세요.`);}
    if(!res.ok)throw new Error(data.error||(res.status===404?'Maintenance 서버 API가 없습니다. server.py와 maintenance.py를 반영하고 서버를 재시작하세요.':`서버 오류 ${res.status}`));
    return data;
  }
  const jsonOptions=body=>({method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  function showError(id,message){$(id).textContent=message;$(id).hidden=!message;}
  function modalOpen(){return [...document.querySelectorAll('dialog')].some(d=>d.open);}
  async function load(){
    const day=$('date').value,gen=++generation;
    online=false;$('refresh').disabled=true;$('connection').textContent='서버 조회 중…';render();
    if(!day){showError('error','조회 날짜를 선택하세요.');$('refresh').disabled=false;return;}
    try{
      const data=await api(`/day?date=${day}`);
      if(gen!==generation)return;
      if(!Array.isArray(data.activities)||!data.windows)throw new Error('서버 자료 형식을 확인하세요.');
      current=data;online=true;showError('error','');
      $('connection').textContent='';
      render();
    }catch(e){if(gen!==generation)return;showError('error',e.message);$('connection').textContent='조회 실패 · 표시된 이전 자료는 수정할 수 없습니다.';render();}
    finally{if(gen===generation)$('refresh').disabled=false;}
  }
  function render(){
    if(!current){$('rosters').innerHTML='';$('board').innerHTML='';$('mobile-board').innerHTML='';return;}
    const roster=current.roster;
    $('setup-notice').hidden=!!roster;
    $('rosters').innerHTML=['day','night'].map(shift=>{
      const team=roster?.[shift];
      return `<article class="roster ${shift}"><div class="roster-top"><div><span class="tag">${shiftName(shift)} · ${shift==='day'?'08:00–20:00':'20:00–다음 날 08:00'}</span><h2>${team?team.team+'조':'조 편성 필요'}</h2></div><button data-attendance="${shift}" ${!online||!roster?'disabled':''}>근태</button></div>${team?team.members.map(m=>{
        const a=current.attendance[shift]?.[m.id]||{};
        return `<div class="member"><div><strong>${esc(m.name)}</strong></div><div><span class="status ${a.status||''}">${a.status==='present'?'WORK ✓':a.status?'WORK —':'미확인'}</span><span class="status ${a.ot==='yes'?'ot':''}">${a.ot==='yes'?'OT ✓':'OT —'}</span>${a.note?`<small>${esc(a.note)}</small>`:''}</div></div>`;
      }).join(''):'<p>미설정</p>'}</article>`;
    }).join('');
    $('board').innerHTML=['day','night'].map(shift=>`<tr><th>${shiftName(shift)}<br>${roster?roster[shift].team+'조':''}<p>${roster?roster[shift].members.map(m=>esc(m.name)).join('<br>'):''}</p></th>${Array.from({length:6},(_,slot)=>`<td>${slotButton(shift,slot)}</td>`).join('')}</tr>`).join('');
    renderMobile();
  }
  function slotButton(shift,slot){
    const entries=current.activities.filter(a=>a.shift===shift&&a.slot===slot),photos=entries.reduce((n,a)=>n+a.photos.length,0);
    return `<button class="slot ${entries.length?'filled':''} ${slot>=4?'ot-slot':''}" data-slot="${slot}" data-shift="${shift}" ${!online||!current.roster?'disabled':''}><span class="period">${period(shift,slot)}</span>${slot>=4?`<span class="ot-label">${slot===4?'OT 1h':'OT'}</span>`:''}<span class="slot-text">${entries.length?esc(entries.map(a=>a.description).join(' / ')):'＋ 등록'}</span><span class="slot-meta">${entries.length?`${entries.length}건 · 사진 ${photos}장`:''}</span></button>`;
  }
  function renderMobile(){
    ['day','night'].forEach(s=>{$('pick-'+s).setAttribute('aria-pressed',String(s===mobileShift));document.querySelector('.roster.'+s)?.classList.toggle('mobile-selected',s===mobileShift);});
    $('mobile-board').innerHTML=current?Array.from({length:6},(_,i)=>slotButton(mobileShift,i)).join(''):'';
  }
  async function settingsOpen(){
    showError('settings-error','');$('settings-save').disabled=true;$('settings').showModal();
    try{
      config=await api('/config',{headers:{'X-Maintenance-Password':settingsPassword}});const last=config.versions.at(-1),today=workToday();
      $('anchor').value=last?.anchor||today;
      ['a1','a2','b1','b2'].forEach((id,i)=>$(id).value=last?.teams[i<2?'A':'B'][i%2].name||'');
      $('settings-history').innerHTML=config.versions.slice().reverse().map(v=>`<div class="history-entry">A조 주간 기준 ${esc(v.anchor)}<br>A조 ${v.teams.A.map(m=>esc(m.name)).join(' / ')}<br>B조 ${v.teams.B.map(m=>esc(m.name)).join(' / ')}</div>`).join('')||'<p>저장된 편성이 없습니다.</p>';
      $('settings-save').disabled=false;
    }catch(e){showError('settings-error',e.message);}
  }
  $('settings-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!config)return;$('settings-save').disabled=true;showError('settings-error','');
    try{const options=jsonOptions({revision:config.revision,effectiveFrom:config.versions.length?[workToday(),config.versions.at(-1).effectiveFrom].sort().at(-1):$('anchor').value,anchor:$('anchor').value,teams:{A:[$('a1').value,$('a2').value],B:[$('b1').value,$('b2').value]}});options.headers['X-Maintenance-Password']=settingsPassword;await api('/config',options);$('settings').close();invalidateStats();await load();}
    catch(err){showError('settings-error',err.message);}finally{$('settings-save').disabled=false;}
  });
  function attendanceOpen(shift){
    if(!online||!current?.roster)return;
    editContext={date:current.date,shift,revision:current.revision,rosterRevision:current.roster.configRevision};
    $('attendance-title').textContent=`${current.date} · ${shiftName(shift)} 근태`;
    $('attendance-fields').innerHTML=current.roster[shift].members.map(m=>{
      const a=current.attendance[shift]?.[m.id]||{};
      return `<fieldset data-member="${m.id}"><legend>${esc(m.name)}</legend><div class="att-fields"><label class="check-label"><input type="checkbox" data-field="work" ${a.status==='present'?'checked':''}>WORK</label><label class="check-label"><input type="checkbox" data-field="ot" ${a.ot==='yes'?'checked':''}>OT</label><label class="wide">Remark<input data-field="note" value="${esc(a.note||'')}" maxlength="300"></label></div></fieldset>`;
    }).join('');showError('attendance-error','');$('attendance').showModal();
  }
  $('attendance-form').addEventListener('submit',async e=>{
    e.preventDefault();$('attendance-save').disabled=true;showError('attendance-error','');
    const records=[...$('attendance-fields').querySelectorAll('fieldset')].map(f=>({memberId:f.dataset.member,status:f.querySelector('[data-field=work]').checked?'present':'absent',ot:f.querySelector('[data-field=ot]').checked?'yes':'no',note:f.querySelector('[data-field=note]').value}));
    try{await api('/attendance',jsonOptions({...editContext,records}));$('attendance').close();invalidateStats();await load();}
    catch(err){showError('attendance-error',err.message);}finally{$('attendance-save').disabled=false;}
  });
  function photoMarkup(photos){return photos.map(name=>`<a href="${photoUrl(name)}" target="_blank" rel="noopener"><img src="${photoUrl(name)}" alt="활동 사진" loading="lazy"></a>`).join('');}
  function showActivities(){
    const entries=current.activities.filter(a=>a.shift===editContext.shift&&a.slot===editContext.slot);
    const names=Object.fromEntries(current.roster[editContext.shift].members.map(m=>[m.id,m.name]));
    $('activity-list').innerHTML=entries.map(a=>`<article class="activity-item"><div class="roster-top"><strong>${esc(a.location||'활동 기록')}</strong><button type="button" data-edit="${a.id}">수정</button></div><p>${a.members.map(id=>esc(names[id]||id)).join(' · ')}</p><p class="description">${esc(a.description)}</p>${a.consumables.length?`<ul>${a.consumables.map(c=>`<li>${esc(c.name)} · ${fmt(c.qty)} ${esc(c.unit)}</li>`).join('')}</ul>`:''}<div class="photo-grid">${photoMarkup(a.photos)}</div><p class="stamp">등록 ${esc(stamp(a.createdAt))}${a.updatedAt!==a.createdAt?' · 수정 '+esc(stamp(a.updatedAt)):''}</p></article>`).join('')||'';
  }
  function resetActivity(activity=null){
    editing=activity;requestId=crypto.randomUUID();$('activity-form').reset();clearPreviews();showError('activity-error','');
    $('activity-mode').textContent=activity?'활동 수정':'새 활동 등록';
    $('description').value=activity?.description||'';
    $('existing-photos').innerHTML=(activity?.photos||[]).map(name=>`<label><img src="${photoUrl(name)}" alt="기존 사진"><span><input type="checkbox" data-keep-photo="${name}" checked>사진 유지</span></label>`).join('');
  }
  function activityOpen(shift,slot){
    if(!online||!current?.roster)return;
    editContext={date:current.date,shift,slot,revision:current.revision,rosterRevision:current.roster.configRevision};
    $('activity-title').textContent=`${shiftName(shift)} · ${period(shift,slot)}`;
    $('activity-context').textContent=`${current.date} · ${current.roster[shift].team}조`;showActivities();resetActivity();$('activity').showModal();
  }
  function clearPreviews(){previewUrls.forEach(URL.revokeObjectURL);previewUrls=[];$('photo-preview').innerHTML='';}
  $('photos').addEventListener('change',()=>{
    clearPreviews();const files=[...$('photos').files];
    if(files.length>8||files.some(f=>f.size>8*1024*1024)){showError('activity-error','사진은 최대 8장, 한 장 8MB 이하로 선택하세요.');$('photos').value='';return;}
    $('photo-preview').innerHTML=files.map(file=>{const url=URL.createObjectURL(file);previewUrls.push(url);return `<img src="${url}" alt="새 사진 미리보기">`;}).join('');showError('activity-error','');
  });
  $('activity-form').addEventListener('submit',async e=>{
    e.preventDefault();const members=editing?.members||current.roster[editContext.shift].members.map(m=>m.id);
    const keepPhotos=[...$('existing-photos').querySelectorAll('input:checked')].map(el=>el.dataset.keepPhoto);
    if(keepPhotos.length+$('photos').files.length>8){showError('activity-error','기존 사진과 새 사진 합계는 8장 이내입니다.');return;}
    const body={...editContext,id:editing?.id,requestId,members,location:editing?.location||'',description:$('description').value,consumables:editing?.consumables||[],keepPhotos};
    const form=new FormData();form.append('data',JSON.stringify(body));[...$('photos').files].forEach(file=>form.append('photos',file));
    $('activity-save').disabled=true;showError('activity-error','');
    try{await api('/activity',{method:'POST',body:form,signal:AbortSignal.timeout(90000)});$('activity').close();clearPreviews();invalidateStats();await load();}
    catch(err){showError('activity-error',err.message+' 저장 응답이 끊겼다면 입력을 바꾸기 전에 다시 저장해 확인하세요.');}
    finally{$('activity-save').disabled=false;}
  });
  let statsGeneration=0;
  function invalidateStats(){loadStats();}

  async function loadStats(){
    const gen=++statsGeneration;$('stats-load').disabled=true;showError('stats-error','');
    try{
      const month=$('stats-month').value;
      if(!/^\d{4}-\d{2}$/.test(month))throw new Error('조회 월을 선택하세요.');
      const [year,m]=month.split('-').map(Number);
      const last=new Date(Date.UTC(year,m,0)).getUTCDate();
      const data=await api(`/stats?start=${month}-01&end=${month}-${String(last).padStart(2,'0')}`);if(gen!==statsGeneration)return;
      $('stats').innerHTML=`<div class="metrics"><div class="metric"><span>기록일</span><strong>${data.totals.savedDays} / ${data.days}</strong></div><div class="metric"><span>활동 기록</span><strong>${fmt(data.totals.activities)}건</strong></div><div class="metric"><span>등록 구간</span><strong>${fmt(data.totals.filledSlots)}칸</strong></div><div class="metric"><span>사진</span><strong>${fmt(data.totals.photos)}장</strong></div></div><div class="stats-grid"><div><h3>근태 · 활동</h3><div class="scroll"><table><thead><tr><th>담당자</th><th>WORK</th><th>OT</th><th>활동</th><th>미확인</th></tr></thead><tbody>${data.people.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.present}</td><td>${p.otYes}</td><td>${p.activities}</td><td>${p.unknown}</td></tr>`).join('')||'<tr><td colspan="5">기록 없음</td></tr>'}</tbody></table></div></div><details class="legacy-consumables" ${data.consumables.length?'':'hidden'}><summary>소모품 이력</summary><div class="scroll"><table class="consumption"><thead><tr><th>소모품</th><th>수량</th><th>단위</th></tr></thead><tbody>${data.consumables.map(c=>`<tr><td>${esc(c.name)}</td><td>${fmt(c.qty)}</td><td>${esc(c.unit)}</td></tr>`).join('')||'<tr><td colspan="3">소모품 기록 없음</td></tr>'}</tbody></table></div></details></div><h3 class="section-head">날짜별 기록</h3><div class="daily">${data.daily.map(d=>`<button class="day-link ${d.saved?'':'no-data'}" data-day="${d.date}"><span>${d.date.slice(5)}</span><strong>${d.saved?d.activities+'건':'미등록'}</strong></button>`).join('')}</div>`;
      $('stats').querySelectorAll('table').forEach(table=>{
        const labels=[...table.querySelectorAll('thead th')].map(th=>th.textContent);
        table.querySelectorAll('tbody tr').forEach(row=>[...row.children].forEach((cell,i)=>{cell.dataset.label=cell.colSpan>1?'':labels[i]||'';}));
      });
    }catch(e){if(gen===statsGeneration){showError('stats-error',e.message);$('stats').innerHTML='<p class="empty">통계를 조회하지 못했습니다.</p>';}}
    finally{if(gen===statsGeneration)$('stats-load').disabled=false;}
  }
  document.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    if(button.dataset.close)$(button.dataset.close).close();
    if(button.dataset.pickShift){mobileShift=button.dataset.pickShift;renderMobile();}
    if(button.dataset.attendance)attendanceOpen(button.dataset.attendance);
    if(button.dataset.slot!==undefined)activityOpen(button.dataset.shift,Number(button.dataset.slot));
    if(button.dataset.edit){resetActivity(current.activities.find(a=>a.id===button.dataset.edit));$('activity-mode').scrollIntoView({block:'start',behavior:'smooth'});}
    if(button.dataset.day){$('date').value=button.dataset.day;load();window.scrollTo({top:0,behavior:'smooth'});}
  });
  $('attendance-fields').addEventListener('change',e=>{const f=e.target.closest('fieldset');if(!f)return;if(e.target.dataset.field==='work'&&!e.target.checked)f.querySelector('[data-field=ot]').checked=false;if(e.target.dataset.field==='ot'&&e.target.checked)f.querySelector('[data-field=work]').checked=true;});
  $('activity').addEventListener('close',clearPreviews);
  $('activity-new').addEventListener('click',()=>resetActivity());
  $('settings-open').addEventListener('click',()=>{$('settings-password').value='';showError('password-error','');$('password-dialog').showModal();});
  $('password-form').addEventListener('submit',async e=>{e.preventDefault();const password=$('settings-password').value;$('password-submit').disabled=true;try{await api('/config',{headers:{'X-Maintenance-Password':password}});settingsPassword=password;$('password-dialog').close();await settingsOpen();}catch(err){showError('password-error',err.message);}finally{$('password-submit').disabled=false;}});
  $('settings').addEventListener('close',()=>{settingsPassword='';config=null;});
  $('date').addEventListener('change',load);$('refresh').addEventListener('click',load);
  $('previous').addEventListener('click',()=>{if($('date').value){$('date').value=addDate($('date').value,-1);load();}});
  $('next').addEventListener('click',()=>{if($('date').value){$('date').value=addDate($('date').value,1);load();}});
  $('today').addEventListener('click',()=>{$('date').value=workToday();load();});$('stats-load').addEventListener('click',loadStats);
  $('stats-month').addEventListener('change',loadStats);
  function moveMonth(offset){const value=$('stats-month').value;if(!value)return;const [year,month]=value.split('-').map(Number);const d=new Date(Date.UTC(year,month-1+offset,1));$('stats-month').value=`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;loadStats();}
  $('month-previous').addEventListener('click',()=>moveMonth(-1));$('month-next').addEventListener('click',()=>moveMonth(1));
  setInterval(()=>{if(!document.hidden&&!modalOpen()&&!$('refresh').disabled)load();},60000);
  load();loadStats();
})();
