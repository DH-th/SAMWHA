'use strict';
(() => {
  const API = 'https://server.samhwa.cloud/api/production/manpower';
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n).toLocaleString('ko-KR');
  const kindName = k => k === 'direct' ? '직접' : k === 'indirect' ? '간접' : '미지정';
  const dateTime = v => new Date(v).toLocaleString('ko-KR', {timeZone:'Asia/Bangkok'});
  const date = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Bangkok', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
  $('start').value = $('end').value = date;
  const fields = [ ['startRow','시작 행','8'], ['dateColumn','날짜 열','A'], ['department','부서 열','C'], ['shiftColumn','교대 열','D'], ['labelColumn','항목 열','E'], ['total','Total 열','F'], ['present','출근 열','G'], ['absent','미출근 열','H'] ];
  $('column-fields').innerHTML = fields.map(([id,label,value]) => `<label>${label}<input id="col-${id}" value="${value}" ${id==='startRow' ? 'type="number" min="1" max="20000"' : 'maxlength="2"'}></label>`).join('');
  $('line-names').innerHTML = Array.from({length:20}, (_,i)=>`<option value="L.${i+1}">`).join('');
  let days = [], available = false, upload = null, savedConfig = null, mappings = {}, items = {}, discovered = null;
  let preview = null, version = 0, selectedDate = '', loading = false, loadId = 0, saving = false;
  function error(message) { $('error').textContent = message || ''; $('error').hidden = !message; }
  async function api(path='', options={}) {
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 30000);
    try {
      const response = await fetch(API + path, {...options, signal:controller.signal, cache:'no-store'});
      let body;
      try { body = await response.json(); } catch { throw new Error(`서버 응답을 확인하세요 (HTTP ${response.status}).`); }
      if (!response.ok) throw new Error(body.error || body.detail || `서버 오류 (HTTP ${response.status})`);
      return body;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('서버 응답 시간이 초과되었습니다. 다시 시도하세요.');
      throw e;
    } finally { clearTimeout(timeout); }
  }
  const post = (path, body, method='POST') => api(path, {method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
  async function action(button, task) {
    button.disabled = true; error('');
    try { await task(); } catch(e) { error(String(e.message)); }
    finally { button.disabled = false; }
  }
  function invalidate() {
    version++; preview = null; $('save').disabled = true;
    if (!$('preview-result').hidden) $('preview-message').textContent = '설정이 변경되었습니다. 집계 미리보기를 다시 실행하세요.';
    $('save-status').textContent = '';
  }
  function config() {
    const c = {mode:'summary', sheet:$('sheet').value, sourceDate:$('source-date').value, shiftFilter:$('import-shift').value,
      mappings:structuredClone(mappings), items:structuredClone(items)};
    for (const [id] of fields) c[id] = id === 'startRow' ? Number($('col-'+id).value) : $('col-'+id).value.trim().toUpperCase();
    c.reasonColumns = $('reason-columns').value.split('\n').filter(s=>s.trim()).map(s=> {
      const pos = s.lastIndexOf('=');
      if (pos < 1) throw new Error('결근 사유는 한 줄에 이름=열 형식으로 입력하세요.');
      return {name:s.slice(0,pos).trim(), column:s.slice(pos+1).trim().toUpperCase()};
    });
    return c;
  }
  function applySaved(c) {
    mappings = structuredClone(c?.mappings || {}); items = structuredClone(c?.items || {});
    if (!c) return;
    for (const [id,,defaultValue] of fields) $('col-'+id).value = c[id] ?? defaultValue;
    if (c.reasonColumns) $('reason-columns').value = c.reasonColumns.map(r=>`${r.name}=${r.column}`).join('\n');
  }
  function sheetChanged() {
    const s = upload.sheets.find(s=>s.name === $('sheet').value);
    $('source-date').innerHTML = s.dates.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('');
    if (s.dates.includes(date)) $('source-date').value = date;
    else if (s.dates.length) $('source-date').value = s.dates.at(-1);
    $('source-sample').innerHTML = s.sample.map((row,i)=>`<tr><th>${i+1}</th>${row.slice(0,18).map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('');
    invalidate();
  }
  async function discover() {
    invalidate();
    const mine = version;
    const c = config(); c.mappings = {};
    const result = await post('/preview', {importId:upload.importId, config:c});
    if (mine !== version) return;
    discovered = result;
    $('department-checks').innerHTML = Object.keys(result.departments).map((dept,i)=> {
      mappings[dept] ||= {include:false};
      return `<label><input type="checkbox" data-dept="${i}" ${mappings[dept].include?'checked':''}>${esc(dept)} <span class="subtle">${result.departments[dept]}</span></label>`;
    }).join('') || '<p class="empty">이 날짜의 부서가 없습니다. 날짜와 열 설정을 확인하세요.</p>';
    renderMappings();
  }
  function renderMappings() {
    if (!discovered) return;
    $('mapping-rows').innerHTML = discovered.items.map((item,i)=> {
      items[item.key] ||= {kind:'', line:''};
      const m = items[item.key];
      if (!mappings[item.department]?.include) return '';
      return `<tr><td>${esc(item.department)}</td><td>${esc(item.label || '(항목명 없음)')}</td><td><select data-kind="${i}" aria-label="${esc(item.label)} 인원 구분"><option value="">구분 선택</option><option value="direct" ${m.kind==='direct'?'selected':''}>직접 인원</option><option value="indirect" ${m.kind==='indirect'?'selected':''}>간접 인원</option></select></td><td><input data-line="${i}" list="line-names" maxlength="120" value="${esc(m.line)}" placeholder="예: L.1 (나중에 입력 가능)" aria-label="${esc(item.label)} 생산성 라인"></td></tr>`;
    }).join('') || '<tr><td colspan="4" class="empty">반영할 부서를 먼저 선택하세요.</td></tr>';
  }
  $('open-upload').onclick = () => { $('upload-panel').hidden = false; $('upload-panel').scrollIntoView({behavior:'smooth',block:'start'}); };
  $('close-upload').onclick = () => { $('upload-panel').hidden = true; };
  $('read-file').onclick = () => action($('read-file'), async()=> {
    const file = $('file').files[0];
    if (!file) throw new Error('출결 Excel 파일을 선택하세요.');
    if (file.size > 10*1024*1024) throw new Error('파일은 최대 10MB입니다.');
    invalidate(); upload = null; discovered = null; $('import-workspace').hidden = true; $('preview-result').hidden = true;
    $('file-status').textContent = 'Excel 읽는 중…';
    try {
      upload = await api('/upload', {method:'POST',headers:{'Content-Type':'application/octet-stream','X-Filename':encodeURIComponent(file.name)},body:file});
      applySaved(savedConfig);
      $('sheet').innerHTML = upload.sheets.map(s=>`<option value="${esc(s.name)}">${esc(s.name)} (${s.rowCount}행)</option>`).join('');
      if (upload.sheets.some(s=>s.name===savedConfig?.sheet)) $('sheet').value = savedConfig.sheet;
      $('import-shift').value = 'ALL'; sheetChanged();
      $('file-status').textContent = upload.filename;
      $('import-workspace').hidden = false;
      await discover();
    } catch(e) { $('file-status').textContent = '파일 읽기 실패 · 다시 시도하세요.'; throw e; }
  });
  $('sheet').onchange = () => action($('preview'), async()=>{sheetChanged(); await discover();});
  $('source-date').onchange = $('import-shift').onchange = () => action($('preview'), discover);
  $('apply-columns').onclick = () => action($('apply-columns'), discover);
  $('column-fields').oninput = $('reason-columns').oninput = invalidate;
  $('department-checks').onchange = e => {
    const i = e.target.dataset.dept;
    if (i === undefined) return;
    mappings[Object.keys(discovered.departments)[Number(i)]].include = e.target.checked;
    invalidate(); renderMappings();
  };
  function selectAll(include) { if (!discovered) return; for (const dept of Object.keys(discovered.departments)) mappings[dept].include = include; $('department-checks').querySelectorAll('input').forEach(e=>e.checked=include); invalidate(); renderMappings(); }
  $('select-all').onclick = ()=>selectAll(true); $('select-none').onclick = ()=>selectAll(false);
  function batch(kind) { if (!discovered) return; for (const item of discovered.items) if (mappings[item.department]?.include) items[item.key].kind = kind; invalidate(); renderMappings(); }
  $('batch-direct').onclick = ()=>batch('direct'); $('batch-indirect').onclick = ()=>batch('indirect');
  $('mapping-rows').onchange = e => { if (e.target.dataset.kind !== undefined) { items[discovered.items[Number(e.target.dataset.kind)].key].kind = e.target.value; invalidate(); } };
  $('mapping-rows').oninput = e => { if (e.target.dataset.line !== undefined) { items[discovered.items[Number(e.target.dataset.line)].key].line = e.target.value.trim(); invalidate(); } };
  $('preview').onclick = () => action($('preview'), async()=> {
    invalidate(); const mine = version, c = config();
    const result = await post('/preview', {importId:upload.importId, config:c});
    if (mine !== version) return;
    preview = {report:result, config:c};
    $('preview-result').hidden = false;
    const t = result.totals;
    $('preview-message').textContent = `${c.sourceDate} · ${result.groups.length}개 항목 · Total ${fmt(t.total)} / 출근 ${fmt(t.present)} / 미출근 ${fmt(t.absent)} / 미확인 ${fmt(t.pending)}명. 오류 ${result.errorCount}건 · 빈 행·미선택·합계 등 ${result.ignoredRows}행 제외.`;
    $('preview-errors').innerHTML = result.errors.map(e=>`<p>${e.row}행 · ${esc(e.department)}: ${esc(e.error)}</p>`).join('');
    $('preview-rows').innerHTML = result.groups.map(g=>`<tr><td>${esc(g.department)} / ${esc(g.label)}</td><td>${esc(g.shift)}</td><td>${kindName(g.kind)}</td>${['total','present','absent','pending'].map(k=>`<td class="num">${fmt(g[k])}</td>`).join('')}</tr>`).join('') || '<tr><td colspan="7" class="empty">선택된 자료가 없습니다.</td></tr>';
    $('save-date').textContent = `저장 날짜: ${c.sourceDate}`;
    $('save').disabled = result.errorCount > 0 || !result.groups.length;
  });
  $('save-settings').onclick = () => action($('save-settings'), async()=> {
    const c = config();
    await post('/settings', {importId:upload.importId, config:c}, 'PUT'); savedConfig = c;
    $('settings-status').textContent = '기본값 저장 완료 · 다음 업로드부터 적용';
  });
  $('save').onclick = async()=> {
    if (!preview || $('save').disabled || saving) return;
    saving = true;
    const mine = version, ready = structuredClone(preview), importId = upload.importId;
    $('save').disabled = true; error('');
    try {
      const target = ready.config.sourceDate;
      const current = await api(`?start=${target}&end=${target}`);
      if (mine !== version) throw new Error('설정이 변경되었습니다. 미리보기를 다시 실행하세요.');
      const revision = current.days[0]?.revision || 0;
      if (revision && !window.confirm(`${target} 자료(v${revision})가 있습니다. 현재 미리보기 자료로 교체할까요? 이전 버전은 보존됩니다. 이번 업로드에 선택하지 않은 부서·교대는 새 버전에서 제외됩니다.`)) return;
      $('save-status').textContent = '서버 저장 중…';
      const result = await post('/save', {importId,date:target,config:ready.config,expectedRevision:revision});
      $('save-status').textContent = `${target} · v${result.revision} 저장 완료`;
      $('start').value = $('end').value = target;
      await load();
    } catch(e) { error(e.message); $('save-status').textContent = '저장하지 못했습니다. 다시 확인하세요.'; }
    finally { saving = false; $('save').disabled = !preview || preview.report.errorCount > 0 || !preview.report.groups.length; }
  };
  function sum(groups) {
    const t = {total:0,present:0,absent:0,pending:0,direct:0,indirect:0,directPresent:0,indirectPresent:0,reasons:{}};
    for (const g of groups) { for (const k of ['total','present','absent','pending']) t[k] += g[k]; t[g.kind] += g.total; t[g.kind+'Present'] += g.present; for (const [r,n] of Object.entries(g.reasons)) t.reasons[r] = (t.reasons[r] || 0)+n; }
    return t;
  }
  function filtered(g) { return (!$('department-filter').value || g.department===$('department-filter').value) && (!$('kind-filter').value || g.kind===$('kind-filter').value) && (!$('shift-filter').value || g.shift===$('shift-filter').value); }
  const rate = t => t.present+t.absent ? (100*t.present/(t.present+t.absent)).toFixed(1)+'%' : '—';
  const empty = (cols,message) => `<tr><td colspan="${cols}" class="empty">${message}</td></tr>`;
  function render() {
    const records = days.map(d=>({...d,groups:d.groups.filter(filtered)}));
    const groups = records.flatMap(d=>d.groups), t = sum(groups);
    const hasData = available && groups.length > 0;
    for (const k of ['total','present','absent','pending','direct','indirect']) $(k).textContent = hasData ? fmt(t[k]) : '—';
    $('total-note').textContent = hasData ? `${records.filter(d=>d.groups.length).length}일 · ${records.length>1?'기간 합계 (명·일)':'명'}` : '선택 조건의 저장 자료가 없습니다';
    $('rate').textContent = hasData ? `출근율 ${rate(t)} · 출결 확인 ${fmt(t.present+t.absent)}명` : '확인 인원 기준 출근율';
    for (const kind of ['direct','indirect']) $(kind+'-present').textContent = hasData ? `출근 ${fmt(t[kind+'Present'])}` : '';
    $('unmapped').textContent = hasData ? `라인 매칭 대기 ${groups.filter(g=>!g.line).length}개 항목` : '라인 매칭 대기 —';
    $('export').disabled = !hasData;
    const message = !available ? '서버 자료를 조회하지 못했습니다.' : '선택 조건의 저장 자료가 없습니다. Excel을 업로드해 주세요.';
    const byDepartment = new Map();
    for (const g of groups) { if (!byDepartment.has(g.department)) byDepartment.set(g.department,[]); byDepartment.get(g.department).push(g); }
    $('department-rows').innerHTML = hasData ? [...byDepartment].sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true})).map(([name, values])=> {
      const s = sum(values);
      return `<tr><td>${esc(name)}</td>${['total','direct','indirect','present','absent','pending'].map(k=>`<td class="num">${fmt(s[k])}</td>`).join('')}<td class="num">${rate(s)}</td></tr>`;
    }).join('') : empty(8,message);
    $('daily-rows').innerHTML = hasData ? records.filter(d=>d.groups.length).map(d=> {
      const s=sum(d.groups);
      return `<tr><td><button class="text-button" data-date="${esc(d.date)}">${esc(d.date)}</button></td>${['total','direct','indirect','present','absent','pending'].map(k=>`<td class="num">${fmt(s[k])}</td>`).join('')}<td class="num">${rate(s)}</td><td><button class="text-button" data-history="${esc(d.date)}">v${d.revision} 이력</button><small>${esc(dateTime(d.savedAt))}</small></td></tr>`;
    }).join('') : empty(9,message);
    const max = Math.max(1,...records.map(d=>sum(d.groups).total));
    $('daily-chart').innerHTML = hasData ? records.filter(d=>d.groups.length).slice().reverse().map(d=> {
      const s=sum(d.groups);
      return `<div class="chart-row"><span>${esc(d.date.slice(5))}</span><div class="stack" style="width:${100*s.total/max}%" role="img" aria-label="${esc(d.date)} 출근 ${s.present}, 미출근 ${s.absent}, 미확인 ${s.pending}">${['present','absent','pending'].map(k=>`<div class="segment ${k}" style="width:${s.total?100*s[k]/s.total:0}%" title="${k==='present'?'출근':k==='absent'?'미출근':'미확인'} ${s[k]}명"></div>`).join('')}</div><strong>${fmt(s.total)}</strong></div>`;
    }).join('') : `<p class="empty">${message}</p>`;
    const reasons=Object.entries(t.reasons).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
    const maxReason=Math.max(1,...reasons.map(([,n])=>n));
    $('reason-chart').innerHTML = reasons.length ? reasons.map(([r,n])=>`<div class="chart-row reason"><span>${esc(r)}</span><div class="reason-bar" style="width:${100*n/maxReason}%"></div><strong>${fmt(n)}</strong></div>`).join('') : `<p class="empty">${hasData?'미출근 사유가 없습니다.':message}</p>`;
    renderDetails(records,message);
  }
  function renderDetails(records,message) {
    $('detail-date').textContent = selectedDate || '전체 날짜';
    const list = records.filter(d=>!selectedDate || d.date===selectedDate).flatMap(d=>d.groups.map(g=>({...g,date:d.date})));
    $('detail-rows').innerHTML = list.length ? list.map(g=>`<tr><td>${esc(g.date)}</td><td>${esc(g.department)}</td><td>${esc(g.label)}</td><td>${g.line?esc(g.line):'<span class="subtle">매칭 대기</span>'}</td><td>${esc(g.shift)}</td><td>${kindName(g.kind)}</td>${['total','present','absent','pending'].map(k=>`<td class="num">${fmt(g[k])}</td>`).join('')}<td class="reason-text">${Object.entries(g.reasons).filter(([,n])=>n>0).map(([r,n])=>`${esc(r)} ${fmt(n)}`).join(' · ') || '—'}</td></tr>`).join('') : empty(11,message);
  }
  async function load() {
    const mine = ++loadId; loading=true; available=false; $('refresh').disabled=true; $('export').disabled=true;
    $('connection').textContent='서버 조회 중…'; error('');
    try {
      if (!$('start').value || !$('end').value) throw new Error('시작일과 종료일을 선택하세요.');
      const result = await api(`?start=${encodeURIComponent($('start').value)}&end=${encodeURIComponent($('end').value)}`);
      if (mine !== loadId) return;
      days=result.days; available=true; selectedDate='';
      const old=$('department-filter').value;
      const departments=[...new Set(days.flatMap(d=>d.groups.map(g=>g.department)))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      $('department-filter').innerHTML='<option value="">전체 부서</option>'+departments.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('');
      if (departments.includes(old)) $('department-filter').value=old;
      $('connection').textContent=`서버 연결됨 · ${days.length}일 저장 자료 · ${dateTime(new Date().toISOString())}`;
    } catch(e) {
      if (mine !== loadId) return;
      days=[]; error(e.message); $('connection').textContent='서버 조회 실패 · 다시 조회하세요';
    } finally { if (mine===loadId) { loading=false; $('refresh').disabled=false; render(); } }
  }
  $('refresh').onclick=load;
  for (const id of ['department-filter','kind-filter','shift-filter']) $(id).onchange=render;
  for (const id of ['start','end']) $(id).onchange=()=>{loadId++; loading=false; $('refresh').disabled=false; available=false; days=[]; $('connection').textContent='조회 기간이 변경되었습니다. 조회를 눌러주세요.'; render();};
  $('all-dates').onclick=()=>{selectedDate='';render();};
  $('daily-rows').onclick=async e=> {
    const btn=e.target.closest('button'); if (!btn) return;
    if (btn.dataset.date) { selectedDate=btn.dataset.date; render(); $('detail-rows').closest('section').scrollIntoView({behavior:'smooth'}); }
    if (btn.dataset.history) await action(btn,async()=> {
      const result=await api('/history?date='+encodeURIComponent(btn.dataset.history));
      $('history-content').innerHTML=result.days.map(d=>`<article class="history-entry"><strong>${esc(d.date)} · v${d.revision}</strong><p>${esc(dateTime(d.savedAt))} · ${esc(d.filename)}</p><p>Total ${fmt(d.totals.total)} / 출근 ${fmt(d.totals.present)} / 미출근 ${fmt(d.totals.absent)} / 미확인 ${fmt(d.totals.pending)}</p></article>`).join('');
      $('history').showModal();
    });
  };
  $('close-history').onclick=()=>$('history').close();
  $('export').onclick=()=> {
    if (!available || loading) return;
    const rows=[['날짜','부서','원본 항목','생산성 라인','교대','구분','Total','출근','미출근','미확인','미출근 사유','원본 파일','저장 버전']];
    for (const d of days) for (const g of d.groups.filter(filtered)) rows.push([d.date,g.department,g.label,g.line,g.shift,kindName(g.kind),g.total,g.present,g.absent,g.pending,Object.entries(g.reasons).filter(([,n])=>n).map(([r,n])=>`${r}: ${n}`).join(' / '),d.filename,d.revision]);
    const safe=v=>{let s=String(v??'');if (/^[=+@\-\t\r]/.test(s)) s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'), url=URL.createObjectURL(blob);a.href=url;a.download=`manpower_${$('start').value}_${$('end').value}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  Promise.allSettled([api('/settings').then(r=>{savedConfig=r.config;}).catch(e=>{error('기본 설정 조회 실패: '+e.message);}),load()]);
})();
