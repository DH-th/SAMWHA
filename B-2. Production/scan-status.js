'use strict';
// Read-only: use the original server API, never alter minute records.
(() => {
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dialog=document.createElement('dialog');
 dialog.style.cssText='width:min(1000px,95vw);max-height:85vh;padding:22px;border:1px solid #ccd5df;border-radius:16px;background:#fff;color:#172b40';
 dialog.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px"><h2 style="margin:0">Line Status</h2><div><button data-refresh>Refresh</button> <button data-close>Close</button></div></div><p data-info>조회 중…</p><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;white-space:nowrap"><thead><tr><th>Line</th><th>Status</th><th>최근 서버 저장 시각</th><th>최근 업로드 수량</th><th>Code</th></tr></thead><tbody></tbody></table></div><p style="font-size:12px;color:#607080">오늘·어제 생산일 · 15초 자동 갱신 · 새 수신 확인은 직전 조회 이후 기록 증가 기준입니다. 기록만으로 무생산과 연결 끊김을 구분할 수 없습니다.</p>';
 document.body.append(dialog);
 const style=document.createElement('style');style.textContent='dialog::backdrop{background:#10203088}dialog[data-scan] td,dialog[data-scan] th{padding:12px 10px;text-align:left;border-bottom:1px solid #e6ebf0}dialog[data-scan] th{font-size:12px;color:#64748b}';document.head.append(style);dialog.dataset.scan='';
 let timer=null,busy=false,controller=null,previous=new Map();
 const day=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 const stamp=r=>r.createdAt||r.serverCreatedAt||`${r.prodDate||''} ${r.time||''}`;
 async function refresh(){
  if(busy)return;busy=true;controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const now=new Date(),dates=[day(now),day(new Date(now.getTime()-86400000))];
   const responses=await Promise.all(dates.map(async date=>{
    const response=await fetch(`https://server.samhwa.cloud/api/production/scan-test?date=${date}`,{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const body=await response.json();if(!Array.isArray(body.records))throw new Error('기록 응답 확인 필요');return body.records;
   }));
   const rows=new Map();for(const r of responses.flat()){if(!rows.has(r.line))rows.set(r.line,[]);rows.get(r.line).push(r);}
   const names=[...new Set([...(typeof LINES!=='undefined'?LINES:[]),...rows.keys()])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
   const next=new Map();
   dialog.querySelector('tbody').innerHTML=names.map(line=>{
    const records=rows.get(line)||[];records.sort((a,b)=>stamp(a).localeCompare(stamp(b)));
    const last=records.at(-1),latest=last?stamp(last):'',batch=records.filter(r=>stamp(r)===latest);
    const ids=new Set(records.map(r=>r.id||JSON.stringify(r))),old=previous.get(line);
    const added=old&&[...ids].some(id=>!old.has(id));next.set(line,ids);
    const label=added?'새 수신 확인':last?'수신 기록 있음':'기록 없음',color=added?'#087b60':'#64748b';
    return `<tr><td><strong>${esc(line)}</strong></td><td style="color:${color};font-weight:700">${label}</td><td>${last?esc(latest.replace('T',' ')):'—'}</td><td>${last?batch.reduce((s,r)=>s+(Number(r.qty)||0),0).toLocaleString()+' PCS':'—'}</td><td>${esc([...new Set(batch.map(r=>r.modelCode||r.modelName))].join(', '))||'—'}</td></tr>`;
   }).join('');
   previous=next;
   dialog.querySelector('[data-info]').textContent=`서버 조회 정상 · ${dates[1]} ~ ${dates[0]} 생산일 · 원본 1분 기록 기준`;
  }catch(e){dialog.querySelector('[data-info]').textContent=`상태 조회 실패 · ${e.name==='AbortError'?'응답 시간 초과':e.message}`;dialog.querySelector('tbody').innerHTML='';}
  finally{clearTimeout(timeout);busy=false;controller=null;}
 }
 document.getElementById('scan-status-open').onclick=()=>{previous=new Map();dialog.showModal();refresh();clearInterval(timer);timer=setInterval(refresh,15000);};
 dialog.querySelector('[data-refresh]').onclick=refresh;
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{clearInterval(timer);controller?.abort();});
})();
