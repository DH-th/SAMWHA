'use strict';
(()=>{
  const API='https://server.samhwa.cloud/api/maintenance';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>Number(v||0).toLocaleString('en-US',{maximumFractionDigits:2});
  const dateString=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDate=(day,n)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return dateString(d);};
  const workToday=()=>{const d=new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Bangkok'}));if(d.getHours()<8)d.setDate(d.getDate()-1);return dateString(d);};
  const stamp=s=>String(s||'').replace('T',' ').replace(/\+07:00$/,'');
  const shiftName=s=>s==='day'?'Day':'Night';
  const time=h=>`${String(h%24).padStart(2,'0')}:00`;
  const period=(shift,slot)=>{const h=(shift==='day'?8:20)+slot*2;return `${time(h)}–${time(h+2)}${h>=24?' (+1)':''}`;};
  const photoUrl=name=>`${API}/photos/${encodeURIComponent(name)}`;
  let settingsPassword='',deleteId=null;
  let current=null,online=false,generation=0,config=null,editContext=null,editing=null,requestId=null,previewUrls=[];
  $('date').value=workToday();$('stats-month').value=workToday().slice(0,7);
  const bangkokHour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
  let mobileShift=bangkokHour>=20||bangkokHour<8?'night':'day';
  async function api(path,options={}){
    const res=await fetch(API+path,{...options,cache:'no-store',signal:options.signal||AbortSignal.timeout(30000)});
    let data;try{data=await res.json();}catch{throw new Error(`Server error (${res.status})`);}
    if(!res.ok)throw new Error(serverError(data.error)||(res.status===404?'Server update required':`Server error ${res.status}`));
    return data;
  }
  function serverError(message){
    if(!message)return '';
    if(!/[가-힣]/.test(message))return message;
    if(/비밀번호/.test(message))return 'Invalid password';
    if(/다른 사용자|변경되었습니다/.test(message))return 'Updated elsewhere · Reload';
    if(/Pillow/.test(message))return 'Photo service unavailable';
    if(/8MB/.test(message))return 'Max 8 MB per photo';
    if(/사진|이미지/.test(message))return 'Invalid photo · JPG, PNG, WEBP';
    if(/저장소|권한/.test(message))return 'Storage unavailable';
    if(/이름|담당자/.test(message))return 'Check names';
    if(/조 편성/.test(message))return 'Team setup required';
    if(/적용일/.test(message))return 'Invalid start date';
    if(/날짜|시각/.test(message))return 'Invalid date';
    if(/설명/.test(message))return 'Notes required';
    return 'Invalid entry · Check fields';
  }
  const jsonOptions=body=>({method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  function showError(id,message){$(id).textContent=message;$(id).hidden=!message;}
  function modalOpen(){return [...document.querySelectorAll('dialog')].some(d=>d.open);}
  async function load(){
    const day=$('date').value,gen=++generation;
    online=false;$('refresh').disabled=true;$('connection').textContent='Loading…';render();
    if(!day){showError('error','Date required');$('refresh').disabled=false;return;}
    try{
      const data=await api(`/day?date=${day}`);
      if(gen!==generation)return;
      if(!Array.isArray(data.activities)||!data.windows)throw new Error('Invalid server data');
      current=data;online=true;showError('error','');
      $('connection').textContent='';
      render();
    }catch(e){if(gen!==generation)return;showError('error',e.message);$('connection').textContent='Offline · Read only';render();}
    finally{if(gen===generation)$('refresh').disabled=false;}
  }
  function render(){
    if(!current){$('rosters').innerHTML='';$('board').innerHTML='';$('mobile-board').innerHTML='';return;}
    const roster=current.roster;
    $('setup-notice').hidden=!!roster;
    $('rosters').innerHTML=['day','night'].map(shift=>{
      const team=roster?.[shift];
      return `<article class="roster ${shift}"><div class="roster-top"><div><span class="tag">${shiftName(shift)} · ${shift==='day'?'08:00–20:00':'20:00–08:00 (+1)'}</span><h2>${team?'Team '+team.team:'No team'}</h2></div><button data-attendance="${shift}" ${!online||!roster?'disabled':''}>Attendance</button></div>${team?team.members.map(m=>{
        const a=current.attendance[shift]?.[m.id]||{};
        return `<div class="member"><div><strong>${esc(m.name)}</strong></div><div><span class="status ${a.status||''}">${a.status==='present'?'WORK ✓':a.status?'WORK —':'Pending'}</span><span class="status ${a.ot==='yes'?'ot':''}">${a.ot==='yes'?'OT ✓':'OT —'}</span><small class="member-remark" title="${esc(a.note||'')}">${esc(a.note||'')}</small></div></div>`;
      }).join(''):'<p>No team</p>'}</article>`;
    }).join('');
    $('board').innerHTML=['day','night'].map(shift=>`<tr><th>${shiftName(shift)}<br>${roster?'Team '+roster[shift].team:''}</th>${Array.from({length:6},(_,slot)=>`<td>${slotButton(shift,slot)}</td>`).join('')}</tr>`).join('');
    renderMobile();
  }
  function slotButton(shift,slot){
    const entries=current.activities.filter(a=>a.shift===shift&&a.slot===slot),photos=entries.reduce((n,a)=>n+a.photos.length,0);
    return `<button class="slot ${entries.length?'filled':''} ${slot>=4?'ot-slot':''}" aria-label="${shiftName(shift)} ${period(shift,slot)}" data-slot="${slot}" data-shift="${shift}" ${!online||!current.roster?'disabled':''}><span class="period">${period(shift,slot)}</span>${slot>=4?`<span class="ot-label">OT</span>`:''}<span class="slot-text">${entries.length?esc(entries.map(a=>a.description).join(' / ')):''}</span><span class="slot-meta">${entries.length?`${entries.length} · Photos ${photos}`:''}</span></button>`;
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
      $('settings-history').innerHTML=config.versions.slice().reverse().map(v=>`<div class="history-entry">A · Day Start ${esc(v.anchor)}<br>A · ${v.teams.A.map(m=>esc(m.name)).join(' / ')}<br>B · ${v.teams.B.map(m=>esc(m.name)).join(' / ')}</div>`).join('')||'<p>No teams</p>';
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
    $('attendance-title').textContent=`${current.date} · ${shiftName(shift)} Attendance`;
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
  function photoMarkup(photos){return photos.map(name=>`<button type="button" class="photo-thumb" data-photo="${photoUrl(name)}" aria-label="Enlarge photo"><img src="${photoUrl(name)}" alt="Photo" loading="lazy"></button>`).join('');}
  function showActivities(){
    const entries=current.activities.filter(a=>a.shift===editContext.shift&&a.slot===editContext.slot);
    $('activity-list').innerHTML=entries.map(a=>`<article class="activity-item"><div class="roster-top"><strong>${esc(a.location||'Activity')}</strong><div class="record-actions"><button type="button" data-edit="${a.id}">Edit</button><button type="button" class="delete-button" data-delete="${a.id}">Delete</button></div></div><p class="description">${esc(a.description)}</p>${a.consumables.length?`<ul>${a.consumables.map(c=>`<li>${esc(c.name)} · ${fmt(c.qty)} ${esc(c.unit)}</li>`).join('')}</ul>`:''}<div class="photo-grid">${photoMarkup(a.photos)}</div><p class="stamp">Saved ${esc(stamp(a.createdAt))}${a.updatedAt!==a.createdAt?' · Edited '+esc(stamp(a.updatedAt)):''}</p></article>`).join('')||'';
  }
  function resetActivity(activity=null){
    editing=activity;requestId=crypto.randomUUID();$('activity-form').reset();clearPreviews();showError('activity-error','');
    $('activity-mode').textContent=activity?'Edit':'New';
    $('description').value=activity?.description||'';
    $('existing-photos').innerHTML=(activity?.photos||[]).map(name=>`<div><button type="button" class="photo-thumb" data-photo="${photoUrl(name)}" aria-label="Enlarge photo"><img src="${photoUrl(name)}" alt="Photo"></button><label><span><input type="checkbox" data-keep-photo="${name}" checked>Keep</span></label></div>`).join('');
  }
  function activityOpen(shift,slot){
    if(!online||!current?.roster)return;
    editContext={date:current.date,shift,slot,revision:current.revision,rosterRevision:current.roster.configRevision};
    $('activity-title').textContent=`${shiftName(shift)} · ${period(shift,slot)}`;
    $('activity-context').textContent=`${current.date} · Team ${current.roster[shift].team}`;showActivities();resetActivity();$('activity').showModal();
  }
  function clearPreviews(){$('photos-count').textContent='No photos';previewUrls.forEach(URL.revokeObjectURL);previewUrls=[];$('photo-preview').innerHTML='';}
  $('photos').addEventListener('change',()=>{
    clearPreviews();const files=[...$('photos').files];
    if(files.length>8||files.some(f=>f.size>40*1024*1024)){showError('activity-error','Max 8 photos · 40 MB each');$('photos').value='';return;}
    $('photos-count').textContent=files.length?`${files.length} selected`:'No photos';
    $('photo-preview').innerHTML=files.map(file=>{const url=URL.createObjectURL(file);previewUrls.push(url);return `<button type="button" class="photo-thumb" data-photo="${url}" aria-label="Enlarge preview"><img src="${url}" alt="Preview"></button>`;}).join('');showError('activity-error','');
  });
  async function preparePhoto(file){
    // Resize decodable phone photos before upload; HEIC falls back to server decoding.
    const url=URL.createObjectURL(file),img=new Image();
    try{
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
      const scale=Math.min(1,2400/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));
      canvas.width=canvas.height=1;
      if(blob)return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
      return file;
    }catch{return file;}finally{URL.revokeObjectURL(url);}
  }
  $('activity-form').addEventListener('submit',async e=>{
    e.preventDefault();const members=editing?.members||current.roster[editContext.shift].members.map(m=>m.id);
    const keepPhotos=[...$('existing-photos').querySelectorAll('input:checked')].map(el=>el.dataset.keepPhoto);
    if(keepPhotos.length+$('photos').files.length>8){showError('activity-error','Max 8 photos');return;}
    const body={...editContext,id:editing?.id,requestId,members,location:editing?.location||'',description:$('description').value,consumables:editing?.consumables||[],keepPhotos};
    const files=[...$('photos').files];
    $('activity-save').disabled=true;showError('activity-error','');
    try{const form=new FormData();form.append('data',JSON.stringify(body));for(const file of files)form.append('photos',await preparePhoto(file));await api('/activity',{method:'POST',body:form,signal:AbortSignal.timeout(90000)});$('activity').close();clearPreviews();invalidateStats();await load();}
    catch(err){showError('activity-error',err.message);}
    finally{$('activity-save').disabled=false;}
  });
  let statsGeneration=0;
  function invalidateStats(){++statsGeneration;if($('stats-dialog').open)loadStats();}

  async function loadStats(){
    const gen=++statsGeneration;$('stats-load').disabled=true;showError('stats-error','');
    try{
      const month=$('stats-month').value;
      if(!/^\d{4}-\d{2}$/.test(month))throw new Error('Month required');
      const [year,m]=month.split('-').map(Number);
      const last=new Date(Date.UTC(year,m,0)).getUTCDate();
      const data=await api(`/stats?start=${month}-01&end=${month}-${String(last).padStart(2,'0')}`);if(gen!==statsGeneration)return;
      if(data.people.some(p=>!Number.isFinite(p.missing)))throw new Error('Server update required');
      $('stats').innerHTML=`<div class="attendance-table"><table><thead><tr><th>Employee</th><th>WORK</th><th>OT</th><th>Missing</th></tr></thead><tbody>${data.people.map(p=>`<tr><td>${esc(p.name)}</td><td><span class="stat-work">${fmt(p.present)}</span></td><td>${fmt(p.otYes)}</td><td><span class="${p.missing?'stat-missing':'stat-zero'}">${fmt(p.missing)}</span></td></tr>`).join('')||'<tr><td colspan="4">No records</td></tr>'}</tbody></table></div>`;

    }catch(e){if(gen===statsGeneration){showError('stats-error',e.message);$('stats').innerHTML='<p class="empty">Stats unavailable</p>';}}
    finally{if(gen===statsGeneration)$('stats-load').disabled=false;}
  }
  document.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    if(button.dataset.photo){$('photo-large').src=button.dataset.photo;$('photo-viewer').showModal();}
    if(button.dataset.close)$(button.dataset.close).close();
    if(button.dataset.pickShift){mobileShift=button.dataset.pickShift;renderMobile();}
    if(button.dataset.attendance)attendanceOpen(button.dataset.attendance);
    if(button.dataset.slot!==undefined)activityOpen(button.dataset.shift,Number(button.dataset.slot));
    if(button.dataset.delete){deleteId=button.dataset.delete;$('delete-password').value='';$('delete-summary').textContent=current.activities.find(a=>a.id===deleteId)?.description||'';showError('delete-error','');$('delete-dialog').showModal();}
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
  $('stats-open').addEventListener('click',()=>{$('stats-dialog').showModal();loadStats();});
  $('delete-form').addEventListener('submit',async e=>{
    e.preventDefault();$('delete-save').disabled=true;showError('delete-error','');
    try{const options=jsonOptions({...editContext,id:deleteId});options.method='DELETE';options.headers['X-Maintenance-Password']=$('delete-password').value;await api('/activity',options);$('delete-dialog').close();$('activity').close();clearPreviews();invalidateStats();await load();}
    catch(err){showError('delete-error',err.message);}finally{$('delete-save').disabled=false;}
  });
  $('delete-dialog').addEventListener('close',()=>{$('delete-password').value='';deleteId=null;});
  $('photo-viewer').addEventListener('close',()=>{$('photo-large').removeAttribute('src');$('photo-stage').classList.remove('zoomed');$('photo-zoom').textContent='Zoom +';});
  $('photo-zoom').addEventListener('click',()=>{const zoom=$('photo-stage').classList.toggle('zoomed');$('photo-zoom').textContent=zoom?'Zoom −':'Zoom +';});
  $('photos-select').addEventListener('click',()=>$('photos').click());
  load();
})();
