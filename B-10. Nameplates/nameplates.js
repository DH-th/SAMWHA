'use strict';
(()=>{
const API='https://server.samhwa.cloud/api/nameplates';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dateText=x=>x?x.replaceAll('-','.'): '—';
const logoUrl=()=>API+'/logos/'+encodeURIComponent(data.logo);
let batchRequest='',deleteContext=null;
let data={revision:0,logo:'',categories:[],equipment:[]}, selected=new Set(), online=false, editing=null,categoryId=null,formRevision=0,cleanRequest='',generation=0,printItems=[],printGeneration=0;
const activeId=()=>new URL(location.href).searchParams.get('id');
const current=()=>data.equipment.find(e=>e.id===activeId());
const lastClean=e=>e.cleanings.map(c=>c.date).sort().at(-1)||'';
function message(text,error=true){$('message').textContent=text;$('message').className=error?'':'success';}
async function api(path,options={}){
 const r=await fetch(API+path,{...options,cache:'no-store',signal:AbortSignal.timeout(60000)});
 let result;try{result=await r.json();}catch{throw Error(`Server error ${r.status}`);}
 if(!r.ok)throw Error(result.error||`Server error ${r.status}`);return result;
}
const json=body=>({method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
async function save(form,error,fn){const buttons=[...form.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);$(error).textContent='';try{await fn();}catch(e){$(error).textContent=e.message;}finally{buttons.forEach(b=>b.disabled=false);}}
function choices(id,value){$(id).innerHTML=data.categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');if(value)$(id).value=value;}
function selectedState(){ $('selected-count').textContent=`${selected.size} selected`;$('print-open').disabled=!online||!selected.size;$('delete-open').disabled=!online||!selected.size;const rows=visible();$('select-all').checked=!!rows.length&&rows.every(e=>selected.has(e.id));$('select-all').indeterminate=rows.some(e=>selected.has(e.id))&&!$('select-all').checked;}
function visible(){const q=$('search').value.trim().toLowerCase();return data.equipment.filter(e=>(!$('filter').value||e.categoryId===$('filter').value)&&(!q||e.code.toLowerCase().includes(q)));}
function renderCatalog(){
 const entries=visible();$('catalog').innerHTML=data.categories.filter(c=>!$('filter').value||c.id===$('filter').value).map(c=>{
 const items=entries.filter(e=>e.categoryId===c.id).sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));
 if(!items.length&&$('search').value)return '';
 const models=[...new Set(items.map(e=>e.model))];
 return `<section class="group"><div class="group-head"><h2>${esc(c.name)} <small>(${items.length})</small></h2><div><button data-add-category="${c.id}">+ Product</button> <button data-category="${c.id}">Edit</button> <button class="danger-button" data-delete-category="${c.id}">Delete</button></div></div>${models.map(model=>`<section class="product-group"><div class="product-head"><h3>${esc(model)}</h3><div class="product-actions"><button data-add-category="${c.id}" data-add-model="${esc(model)}">+ Add range</button><button class="primary" data-print-category="${c.id}" data-print-model="${esc(model)}">Print all</button><button class="danger-button" data-delete-category="${c.id}" data-delete-model="${esc(model)}">Delete</button></div></div>${items.filter(e=>e.model===model).map(e=>`<div class="equipment-row"><input type="checkbox" data-select="${e.id}" aria-label="Select ${esc(e.code)}" ${selected.has(e.id)?'checked':''}><button data-detail="${e.id}"><small>No. ${esc(e.number)}</small>${esc(e.code)}</button><div class="installed"><small>INSTALL DATE</small>${dateText(e.installed)}</div><div><small>LAST CLEANED</small>${dateText(lastClean(e))}</div><span class="tag">${e.size}</span></div>`).join('')}</section>`).join('')||'<div class="empty">No products</div>'}</section>`;

 }).join('')||'<div class="empty">No equipment</div>';selectedState();
}
function renderDetail(){
 const e=current();if(!e){$('detail').innerHTML='<div class="empty">Equipment not found</div>';$('history').innerHTML='';document.querySelectorAll('.detail-actions button').forEach(b=>b.disabled=true);return;}
 document.querySelectorAll('.detail-actions button').forEach(b=>b.disabled=!online);
 const category=data.categories.find(c=>c.id===e.categoryId)?.name||'';
 $('detail').innerHTML=`<article class="info"><span class="tag">${esc(category)} / ${esc(e.model)} / ${esc(e.number)}</span><h1>${esc(e.code)}</h1><div class="info-grid"><div><small>INSTALL DATE</small><strong>${dateText(e.installed)}</strong></div><div><small>LAST CLEANED</small><strong>${dateText(lastClean(e))}</strong></div><div><small>NAMEPLATE</small><strong>${e.size==='S'?'50 × 25':'80 × 40'} mm</strong></div></div></article>`;
 $('history').innerHTML=e.cleanings.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(c=>`<article class="history-row"><strong>${dateText(c.date)}</strong>${c.note?`<p>${esc(c.note)}</p>`:''}<small>Saved ${esc(c.savedAt.replace('T',' ').replace('+07:00',''))}</small></article>`).join('')||'<div class="empty">No cleaning records</div>';
}
function render(){
 const filter=$('filter').value;$('filter').innerHTML='<option value="">All</option>'+data.categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');$('filter').value=filter;
 $('catalog-view').hidden=!!activeId();$('detail-view').hidden=!activeId();
 ['logo-open','category-open','new-open'].forEach(id=>$(id).disabled=!online);renderCatalog();renderDetail();
}
async function load(){const gen=++generation;online=false;render();message('Loading…',false);try{const result=await api('/catalog');if(gen!==generation)return;data=result;online=true;selected=new Set([...selected].filter(id=>data.equipment.some(e=>e.id===id)));message('');render();}catch(e){if(gen!==generation)return;message(e.message);render();}}
function navigate(id){const u=new URL(location.href);if(id)u.searchParams.set('id',id);else u.searchParams.delete('id');history.pushState({},'',u);render();window.scrollTo(0,0);}
function equipmentOpen(item=null){if(!online)return;if(!data.categories.length){categoryOpen();return;}editing=item?.id||null;batchRequest=crypto.randomUUID();formRevision=data.revision;$('equipment-form').reset();choices('equipment-category',item?.categoryId||$('filter').value);$('equipment-model').value=item?.model||'';$('equipment-number').value=item?.number||'01';$('equipment-end').value=$('equipment-number').value;$('range-end-label').hidden=!!editing;$('range-arrow').hidden=!!editing;$('equipment-end').required=!editing;$('equipment-save-print').hidden=!!editing;$('equipment-title').textContent=editing?'Edit equipment':'Add equipment';$('equipment-installed').max=today();$('equipment-installed').value=item?.installed||today();$('equipment-size').value=item?.size||'S';$('equipment-error').textContent='';rangeSummary();$('equipment-dialog').showModal();}
function suggestNumber(){if(editing)return;const model=$('equipment-model').value.trim().toUpperCase();const numbers=data.equipment.filter(e=>e.model===model).map(e=>Number(e.number));$('equipment-number').value=String(Math.max(0,...numbers)+1).padStart(2,'0');$('equipment-end').value=$('equipment-number').value;rangeSummary();}
function addProduct(category,model=''){equipmentOpen();$('equipment-category').value=category;$('equipment-model').value=model;suggestNumber();}
$('equipment-model').addEventListener('change',suggestNumber);
function rangeSummary(){const a=Number($('equipment-number').value),b=Number($('equipment-end').value),model=$('equipment-model').value.trim().toUpperCase();$('range-summary').hidden=!!editing;$('range-summary').textContent=Number.isInteger(a)&&Number.isInteger(b)&&a>=1&&b>=a&&b<=9999&&b-a<300?`${model||'Product'}-${String(a).padStart(2,'0')} → ${model||'Product'}-${String(b).padStart(2,'0')} · ${b-a+1} units`:'Range · 1–9999 / Max 300 units';}
['equipment-number','equipment-end','equipment-model'].forEach(id=>$(id).addEventListener('input',rangeSummary));
function categoryOpen(id=null){if(!online)return;categoryId=id;formRevision=data.revision;$('category-name').value=data.categories.find(c=>c.id===id)?.name||'';$('category-error').textContent='';$('category-dialog').showModal();}
$('category-form').onsubmit=e=>{e.preventDefault();save(e.target,'category-error',async()=>{data=await api('/category',json({revision:formRevision,id:categoryId,name:$('category-name').value}));$('category-dialog').close();render();});};
$('equipment-form').onsubmit=e=>{e.preventDefault();const print=e.submitter?.id==='equipment-save-print';save(e.target,'equipment-error',async()=>{
 const body={revision:formRevision,id:editing,categoryId:$('equipment-category').value,model:$('equipment-model').value,number:$('equipment-number').value,installed:$('equipment-installed').value,size:$('equipment-size').value};
 const result=editing?await api('/equipment',json(body)):await api('/equipment/batch',json({...body,start:body.number,end:$('equipment-end').value,requestId:batchRequest}));
 const ids=result.createdIds||[];delete result.createdIds;data=result;if(!editing)selected=new Set(ids);$('equipment-dialog').close();render();
 if(print)printOpen(data.equipment.filter(item=>ids.includes(item.id)),body.size);
 else if(ids.length)message(`${ids.length} units added · Ready to print`,false);
 });};
function deleteOpen(categoryId=null,model=null){
 if(!online||(!categoryId&&!selected.size))return;
 const items=data.equipment.filter(item=>categoryId?item.categoryId===categoryId&&(!model||item.model===model):selected.has(item.id));
 deleteContext={revision:data.revision,ids:items.map(item=>item.id),requestId:crypto.randomUUID()};
 if(categoryId)Object.assign(deleteContext,{scope:model?'product':'category',categoryId,model});
 $('delete-title').textContent=model?'Delete product':categoryId?'Delete category':'Delete equipment';
 const category=data.categories.find(c=>c.id===categoryId);
 $('delete-target').textContent=category?category.name+(model?' / '+model:''):'';
 $('delete-form').reset();$('delete-error').textContent='';$('delete-count').textContent=`${items.length} units`;
 $('delete-list').innerHTML=items.map(item=>`<li>${esc(data.categories.find(c=>c.id===item.categoryId)?.name||'')} / <strong>${esc(item.code)}</strong></li>`).join('');
 $('delete-dialog').showModal();
}
$('delete-open').onclick=()=>deleteOpen();
$('delete-form').onsubmit=e=>{e.preventDefault();if(!deleteContext)return;save(e.target,'delete-error',async()=>{
 const count=deleteContext.ids.length,options=json(deleteContext);options.method='DELETE';options.headers['X-Nameplates-Password']=$('delete-password').value;
 data=await api('/equipment/batch',options);selected.clear();printItems=[];$('print-pages').innerHTML='';$('print-output').innerHTML='';
 $('delete-dialog').close();render();message(`${count} units deleted`,false);
});};
$('delete-dialog').addEventListener('close',()=>{$('delete-password').value='';deleteContext=null;});
$('logo-open').onclick=()=>{formRevision=data.revision;$('logo-form').reset();$('logo-error').textContent='';$('logo-preview').hidden=!data.logo;if(data.logo)$('logo-preview').src=logoUrl();$('logo-dialog').showModal();};
$('logo-form').onsubmit=e=>{e.preventDefault();save(e.target,'logo-error',async()=>{const file=$('logo-file').files[0];if(!file||file.size>8*1024*1024)throw Error('Logo · Max 8 MB');const body=new FormData();body.append('file',file);body.append('revision',formRevision);data=await api('/logo',{method:'POST',body});$('logo-dialog').close();render();});};
$('clean-open').onclick=()=>{const e=current();if(!online||!e)return;formRevision=data.revision;cleanRequest=crypto.randomUUID();$('clean-form').reset();$('clean-code').textContent=e.code;$('clean-date').value=today();$('clean-date').min=e.installed;$('clean-date').max=today();$('clean-error').textContent='';$('clean-dialog').showModal();};
$('clean-form').onsubmit=e=>{e.preventDefault();save(e.target,'clean-error',async()=>{const options=json({revision:formRevision,requestId:cleanRequest,date:$('clean-date').value,note:$('clean-note').value});options.method='POST';data=await api(`/equipment/${current().id}/cleaning`,options);$('clean-dialog').close();render();});};
function plate(item,size){return `<article class="plate ${size.toLowerCase()}"><div class="plate-top"><div class="plate-title"><div class="brand">${data.logo?`<img src="${logoUrl()}" alt="Logo">`:''}<span>SAMHWA INDUSTRIAL CO., LTD.</span></div><div class="equipment-code"><small>EQUIPMENT ID</small><strong>${esc(item.code)}</strong></div></div><img class="qr" src="${API}/qr/${item.id}" alt="QR"></div><div class="plate-bottom"><div><b>INSTALL DATE</b><span>${dateText(item.installed)}</span></div><div><b>LAST CLEANED</b><span class="clean-blank"></span></div></div></article>`;}
function preview(){const e=current();if(e)$('plate-preview').innerHTML=plate(e,$('preview-size').value);}
$('plate-open').onclick=()=>{if(!current())return;$('preview-size').value=current().size;preview();$('plate-dialog').showModal();};$('preview-size').onchange=preview;
async function imagesReady(root){await Promise.all([...root.querySelectorAll('img')].map(img=>new Promise((resolve,reject)=>{if(img.complete){img.naturalWidth?resolve():reject(Error('QR / logo unavailable · Check server'));return;}const timer=setTimeout(()=>reject(Error('Image loading timeout · Retry')),15000);img.onload=()=>{clearTimeout(timer);resolve();};img.onerror=()=>{clearTimeout(timer);reject(Error('QR / logo unavailable · Check server'));};})));}
async function printPreview(){const gen=++printGeneration;$('print-button').disabled=true;$('print-status').textContent='Loading…';$('print-pages').innerHTML='';$('print-output').innerHTML='';try{
 const copies=Number($('copies').value),size=$('print-size').value;if(!Number.isInteger(copies)||copies<1||copies>100||printItems.length*copies>300)throw Error('Copies 1–100 · Max 300 labels');
 const items=printItems.flatMap(e=>Array.from({length:copies},()=>e)),capacity=size==='S'?30:12;let html='';
 for(let i=0;i<items.length;i+=capacity)html+=`<section class="sheet ${size.toLowerCase()}">${items.slice(i,i+capacity).map(e=>plate(e,size)).join('')}</section>`;
 $('print-pages').innerHTML=html;await imagesReady($('print-pages'));if(gen!==printGeneration)return;$('print-status').textContent=`${items.length} labels · ${Math.ceil(items.length/capacity)} pages`;$('print-button').disabled=false;
 }catch(e){if(gen===printGeneration)$('print-status').textContent=e.message;}}
function printOpen(items,size){printItems=items.map(e=>structuredClone(e));$('copies').value=1;$('print-size').value=size||items[0]?.size||'S';$('print-dialog').showModal();printPreview();}
$('print-open').onclick=()=>printOpen(data.equipment.filter(e=>selected.has(e.id)));
$('print-one').onclick=()=>{const size=$('preview-size').value;$('plate-dialog').close();printOpen([current()],size);};
$('print-size').onchange=printPreview;$('copies').oninput=printPreview;
$('print-button').onclick=async()=>{if($('print-button').disabled)return;$('print-button').disabled=true;try{$('print-output').innerHTML=$('print-pages').innerHTML;await imagesReady($('print-output'));$('print-dialog').close();window.print();}catch(e){$('print-status').textContent=e.message;}finally{$('print-button').disabled=false;}};
document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;if(button.dataset.close)$(button.dataset.close).close();if(button.dataset.detail)navigate(button.dataset.detail);if(button.dataset.category)categoryOpen(button.dataset.category);if(button.dataset.deleteCategory)deleteOpen(button.dataset.deleteCategory,button.dataset.deleteModel||null);if(button.dataset.printCategory&&online)printOpen(data.equipment.filter(item=>item.categoryId===button.dataset.printCategory&&item.model===button.dataset.printModel));if(button.dataset.addCategory)addProduct(button.dataset.addCategory,button.dataset.addModel||'');});
$('catalog').addEventListener('change',e=>{if(!e.target.dataset.select)return;e.target.checked?selected.add(e.target.dataset.select):selected.delete(e.target.dataset.select);selectedState();});
$('select-all').onchange=e=>{visible().forEach(item=>e.target.checked?selected.add(item.id):selected.delete(item.id));renderCatalog();};
$('filter').onchange=renderCatalog;$('search').oninput=renderCatalog;$('refresh').onclick=load;$('new-open').onclick=()=>equipmentOpen();$('category-open').onclick=()=>categoryOpen();$('edit-open').onclick=()=>equipmentOpen(current());$('back').onclick=()=>navigate(null);window.addEventListener('popstate',render);
load();
})();
