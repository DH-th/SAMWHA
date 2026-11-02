/* Display runs only: original production records and totals remain unchanged. */
function productionRuns(records){
 const streams=new Map(),out=[];
 const stamp=r=>{if(/^\d{2}:\d{2}$/.test(r.time||'')&&r.prodDate){let d=new Date(r.prodDate+'T00:00:00Z');if(r.shift==='night'&&Number(r.time.slice(0,2))<12)d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10)+'T'+r.time+':00';}return r.serverCreatedAt||r.createdAt||'';};
 records.forEach(r=>{const k=JSON.stringify([r.line,r.process]);if(!streams.has(k))streams.set(k,[]);streams.get(k).push({...r,stamp:stamp(r)});});
 for(const list of streams.values()){
  const batches=new Map();list.sort((a,b)=>a.stamp.localeCompare(b.stamp)).forEach(r=>{if(!batches.has(r.stamp))batches.set(r.stamp,[]);batches.get(r.stamp).push(r);});
  const active=new Map(),code=r=>String(r.modelCode||r.modelName||'').trim();
  for(const [time,items] of batches){
   const codes=new Set(items.map(code));
   for(const [key,row] of active)if(!codes.has(key)){row.end=time;out.push(row);active.delete(key);}
   for(const r of items){const key=code(r);if(!active.has(key))active.set(key,{...r,start:time,end:time,qty:0,slots:[],hourlyQty:{}});const row=active.get(key),qty=Number(r.qty)||0,hour=JSON.stringify([r.shift,r.slot]);row.end=time;row.qty+=qty;row.hourlyQty[hour]=(row.hourlyQty[hour]||0)+qty;if(!row.slots.includes(r.slot))row.slots.push(r.slot);}
  }out.push(...active.values());
 }return out.sort((a,b)=>a.start.localeCompare(b.start));
}
