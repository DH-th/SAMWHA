'use strict';
(() => {
  const API = 'https://server.samhwa.cloud/api/production/productivity';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmt = (value, decimals = 1) => value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('ko-KR', {maximumFractionDigits:decimals});
  const dateText = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const timeText = value => value ? String(value).replace('T', ' ').replace(/\.\d+/, '') : '수집시각 없음';
  let snapshot = null, available = false, loading = false, requestId = 0;
  let controller = null;
  const now = new Date();
  $('start').value = $('end').value = dateText(now);

  async function json(url, options = {}) {
    const res = await fetch(url, {...options, cache:'no-store'});
    let body;
    try { body = await res.json(); } catch { throw new Error(`서버 응답을 읽지 못했습니다 (HTTP ${res.status}).`); }
    if (!res.ok) throw new Error(body.error || (res.status === 404 ? '생산성 API가 없습니다. server.py와 productivity.py를 서버에 반영해야 합니다.' : `서버 오류 (HTTP ${res.status})`));
    return body;
  }

  function options(id, values, label) {
    const old = $(id).value;
    const unique = [...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    $(id).innerHTML = `<option value="">${label}</option>` + unique.map(v=>`<option value="${escape(v)}">${escape(v)}</option>`).join('');
    if (unique.includes(old)) $(id).value = old;
  }

  function selected() {
    return (snapshot?.groups || []).filter(g => (!$('line').value || g.line === $('line').value)
      && (!$('plant').value || g.plantName === $('plant').value)
      && (!$('model').value || g.modelName === $('model').value));
  }

  async function load() {
    const id = ++requestId;
    controller?.abort();
    const start = $('start').value, end = $('end').value;
    const count = (Date.parse(end)-Date.parse(start))/86400000+1;
    if (!start || !end || !Number.isFinite(count) || count < 1 || count > 31) {
      $('error').textContent = '시작일과 종료일을 확인하세요. 한 번에 최대 31일까지 조회할 수 있습니다.';
      $('error').hidden = false;
      available = false;
      loading = false;
      $('refresh').disabled = false;
      render();
      return;
    }
    controller = new AbortController();
    const currentController = controller;
    const timeout = setTimeout(()=>currentController.abort(), 20000);
    loading = true;
    $('refresh').disabled = true;
    $('connection').textContent = '서버 조회 중…';
    try {
      const data = await json(`${API}?start=${start}&end=${end}`, {signal:controller.signal});
      if (id !== requestId) return;
      if (!Array.isArray(data.groups) || !Array.isArray(data.sources) || !data.master) throw new Error('서버 자료 형식을 확인하세요.');
      snapshot = data;
      available = true;
      $('error').hidden = true;
      $('connection').textContent = `조회 완료 ${timeText(data.generatedAt)} · ${data.start} ~ ${data.end}`;
      options('line', data.groups.map(g=>g.line), '전체 라인');
      options('plant', data.groups.map(g=>g.plantName), '전체 Plant');
      options('model', data.groups.map(g=>g.modelName), '전체 모델');
      render();
    } catch (err) {
      if (id !== requestId) return;
      available = false;
      $('connection').textContent = '조회 실패 · 통신/서버 상태 확인';
      $('error').textContent = `${err.name === 'AbortError' ? '조회 시간이 초과되었습니다.' : err.message}${snapshot ? ' 마지막 성공 자료를 표시합니다. 최신 계산 결과는 다시 조회해 주세요.' : ' 생산수량을 0으로 처리하지 않습니다.'}`;
      $('error').hidden = false;
      render();
    } finally {
      clearTimeout(timeout);
      if (id === requestId) {loading = false; $('refresh').disabled = false;}
    }
  }

  function lineHours(groups) {
    const intervals = new Set();
    groups.forEach(g=>(g.estimate?.intervals||[]).forEach(i=>intervals.add(JSON.stringify([g.line,i.start,i.end]))));
    return intervals.size / 3;
  }

  function render() {
    $('export').disabled = !snapshot || !available;
    if (!snapshot) return;
    const groups = selected();
    const sum = key => groups.reduce((n,g)=>n+(g[key] ?? 0),0);
    const valid = groups.filter(g=>g.status === '계산 가능');
    const complete = groups.length > 0 && valid.length === groups.length && snapshot.sources.every(s=>s.state === 'ok') && snapshot.issues.every(i=>i.informational);
    const hours = lineHours(groups);
    $('total').textContent = groups.length || (snapshot.sources.every(s=>s.state==='ok') && snapshot.issues.every(i=>i.informational)) ? fmt(sum('qty'),0) : '—';
    $('uph').textContent = complete ? `${fmt(sum('qty')/hours)} /H` : '계산 대기';
    $('hours').textContent = `${fmt(hours,2)} H · 자동 추정 ${valid.length} / ${groups.length}행`;
    $('target').textContent = complete ? fmt(sum('target')) : '—';
    $('rate').textContent = complete ? `${fmt(sum('qty')/sum('target')*100)}%` : '—';
    $('coverage').textContent = complete ? '수량 합계 기준 · 퍼센트 단순 평균 제외' : '모든 행의 시간·CAPA·수집 상태 확인 필요';
    const lines = new Map();
    groups.forEach(g=>{if(!lines.has(g.line))lines.set(g.line,[]);lines.get(g.line).push(g);});
    $('line-summary').innerHTML = [...lines].sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true})).map(([line,items])=>{
      const ready = items.every(g=>g.status==='계산 가능') && snapshot.sources.every(s=>s.state==='ok') && snapshot.issues.every(i=>i.informational);
      const qty=items.reduce((n,g)=>n+g.qty,0), hours=lineHours(items), target=items.reduce((n,g)=>n+(g.target||0),0);
      return `<tr><td><button data-line="${escape(line)}">${escape(line)}</button></td><td class="num">${fmt(qty,0)}</td><td class="num">${fmt(hours,2)}</td><td class="num">${ready?fmt(qty/hours):'—'}</td><td class="num">${ready?fmt(target):'—'}</td><td class="num good">${ready?fmt(qty/target*100)+'%':'—'}</td><td>${ready?'계산 가능':'자료 확인 필요'} · ${items.length}개 행</td></tr>`;
    }).join('') || '<tr><td colspan="7" class="empty">반영할 라인 실적이 없습니다.</td></tr>';
    $('excluded-summary').textContent = `조회 기간 전체에서 10개 미만 업로드 ${fmt(snapshot.excluded?.count||0,0)}건 · ${fmt(snapshot.excluded?.qty||0,0)}개 제외 (수량·시간 모두 미반영)`;
    $('rows').innerHTML = groups.length ? groups.map(g=>{
      const saved = g.comparison;
      const estimate = g.estimate || {intervals:[],issues:[]};
      const changed = saved && saved.capa !== g.capa;
      return `<tr><td>${escape(g.prodDate)}</td><td>${escape(g.line)}</td>
      <td>${escape(g.modelName || '모델 미확인')}<small>${escape(g.plantName || 'Plant 미매칭')}</small></td>
      <td class="num">${fmt(g.qty,0)}</td><td class="num">${fmt(g.capa)}${changed?`<small>저장 기준 ${fmt(saved.capa)}</small>`:''}</td>
      <td>${estimate.start?escape(estimate.start.slice(11)):'—'}<small>${estimate.start?escape(estimate.start.slice(0,10)):''}</small></td>
      <td>${estimate.end?escape(estimate.end.slice(11)):'—'}<small>${estimate.end?escape(estimate.end.slice(0,10)):''}</small></td>
      <td class="num">${saved?fmt(saved.hours,2):'—'}<small>${saved?'라인 20분 내 배분':'자동 배분 불가'}</small>${estimate.intervals.length?`<details><summary>${estimate.intervals.length}개 구간</summary>${estimate.intervals.map(i=>`<small>${escape(i.start.slice(11))}~${escape(i.end.slice(11))} · ${fmt(i.qty,0)}개 · 배분 ${fmt(i.minutes,2)}분</small>`).join('')}</details>`:''}</td><td class="num">${fmt(g.uph)}</td><td class="num">${fmt(g.target)}</td>
      <td class="num ${g.rate!=null?'good':''}">${g.rate==null?'—':`${fmt(g.rate)}%`}</td>
      <td><span class="pill ${g.status==='계산 가능'?'good':''}">${escape(g.status)}</span>${g.issues.length?`<small class="warning">${escape(g.issues.join(' · '))}</small>`:''}${g.warnings?.length?`<small class="warning">${escape(g.warnings.join(' · '))}</small>`:''}<small>${escape(timeText(g.lastCollectedAt))}</small></td>
      <td><div class="row-actions"><button data-history="${g.key}">이력</button></div></td></tr>`;
    }).join('') : '<tr><td colspan="13" class="empty">선택 조건에 표시할 S2 실적이 없습니다. 아래 수집 상태를 확인하세요.</td></tr>';
    const slots = {};
    groups.forEach(g=>Object.entries(g.slots).forEach(([s,q])=>slots[s]=(slots[s]||0)+q));
    const maximum = Math.max(1,...Object.values(slots));
    const slotOrder = [...Object.keys(slots)].sort((a,b)=>((parseInt(a)+16)%24)-((parseInt(b)+16)%24));
    $('trend').innerHTML = slotOrder.length ? slotOrder.map(s=>`<div class="bar-row"><span>${escape(s)}</span><div class="bar-track"><div class="bar-fill" style="width:${slots[s]/maximum*100}%"></div></div><strong>${fmt(slots[s],0)}</strong></div>`).join('') : '<p class="empty">시간대별 실적 없음</p>';
    const state = {ok:'파일 확인',missing:'파일 없음 · 수집 여부 확인',error:'파일 읽기 오류'};
    const unresolved = groups.filter(g=>g.issues.length);
    $('quality').innerHTML = `<p>${escape(snapshot.quantityBasis)}</p><ul>${snapshot.sources.map(s=>`<li class="${s.state==='ok'?'':'warning'}">${s.date} · ${state[s.state]}${s.rawCount===0&&s.state==='ok'?' (기록 0건 · 무가동/수집 상태 확인)':''}</li>`).join('')}</ul>
      <p>마지막 기록이 오래되어도 무가동과 통신 중단을 자동 구분할 수 없습니다. 생산 중 갱신이 멈추면 수집 PC를 확인하세요.</p>
      ${unresolved.length?`<h3>CAPA·모델·원천 확인: ${unresolved.length}개 행</h3>`:''}
      ${snapshot.issues.length?`<h3>원천 기록 검증</h3><p>문제 기록을 제외한 수량을 표시합니다. 원천 자료 확인 전 전체 실적으로 확정하지 마세요.</p><ul>${snapshot.issues.map(i=>`<li>${escape(i.date)} · ${escape(i.message)}${i.id?` (${escape(i.id)})`:''}</li>`).join('')}</ul>`:''}`;
    $('master-meta').textContent = `${snapshot.master.source} · 기준 버전 ${snapshot.master.version.slice(0,12)} · ${snapshot.master.rows.length}개 모델${snapshot.master.modifiedAt?' · '+timeText(snapshot.master.modifiedAt):''}`;
    const masterRows = snapshot.master.rows.slice().sort((a,b)=>Number(!!b.issues.length)-Number(!!a.issues.length) || a.row-b.row);
    $('master-rows').innerHTML = masterRows.length ? masterRows.map(m=>`<tr><td>${m.row}</td><td>${escape(m.plantName)}</td><td>${escape(m.modelName)}</td><td class="num">${fmt(m.capa)}</td><td class="${m.issues.length?'warning':'good'}">${escape(m.issues.join(' · ') || '확인')}</td></tr>`).join('') : '<tr><td colspan="5" class="empty">서버 Excel 기준정보를 확인할 수 없습니다.</td></tr>';
    if (snapshot.master.issues.length) $('master-meta').textContent += ' · '+snapshot.master.issues.join(' · ');
  }

  async function history(key) {
    $('history-body').textContent = '이력을 조회합니다…';
    $('history').showModal();
    try {
      const data = await json(`${API}/history?key=${encodeURIComponent(key)}`, {signal:AbortSignal.timeout(20000)});
      $('history-body').innerHTML = data.entries.slice().reverse().map((h,i)=>`<article><strong>${data.entries.length-i}차 · ${h.mode==='auto'?'라인 20분 기준 자동 추정':'과거 수동 이력 · 계산 미적용'} · ${escape(timeText(h.savedAt))}</strong><br>${escape(h.operator)} · ${fmt(h.hours,2)} H · S2 ${fmt(h.qty,0)}개 · CAPA ${fmt(h.capa)}/H${h.start?`<br>${escape(timeText(h.start))} ~ ${escape(timeText(h.end))}`:''}<br>기준 버전 ${escape(h.capaVersion.slice(0,12))}<p class="history-note">${escape(h.note)}</p></article>`).join('') || '저장 이력이 없습니다.';
    } catch(err) { $('history-body').textContent = err.message; }
  }

  $('master-refresh').addEventListener('click', load);

  $('export').addEventListener('click', ()=>{
    if (!snapshot || !available) return;
    const rows = [['생산일','라인','Plant','모델','S2 수량','현재 CAPA/H','적용 CAPA/H','생산 H','추정 시작','추정 종료','20분 구간 수','시간 기준','UPH','기준수량','잠정 CAPA 달성률(%)','상태','CAPA 버전','조회시각']];
    selected().forEach(g=>rows.push([g.prodDate,g.line,g.plantName,g.modelName,g.qty,g.capa,g.comparison?.capa,g.comparison?.hours,g.estimate?.start,g.estimate?.end,g.estimate?.intervals.length,g.comparison?'라인 20분 기준 자동 추정':'미확인',g.uph,g.target,g.rate,g.status,g.comparison?.capaVersion,snapshot.generatedAt]));
    const cell = value => {let s=String(value??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const blob = new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download=`productivity_${snapshot.start}_${snapshot.end}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  document.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    if(button.dataset.close)$(button.dataset.close).close();
    if(button.dataset.history)history(button.dataset.history);
    if(button.dataset.line){$('line').value=button.dataset.line;render();}
  });
  ['line','plant','model'].forEach(id=>$(id).addEventListener('change',render));
  ['start','end'].forEach(id=>$(id).addEventListener('change',()=>{++requestId;controller?.abort();loading=false;$('refresh').disabled=false;available=false;render();$('connection').textContent='조회 기간이 변경되었습니다. 조회 버튼을 누르세요.';}));
  $('all-lines').addEventListener('click',()=>{$('line').value='';render();});
  $('refresh').addEventListener('click',load);
  setInterval(()=>{if(!loading && !$('history').open && !document.hidden && (!snapshot || ($('start').value===snapshot.start && $('end').value===snapshot.end)))load();},30000);
  load();
})();
