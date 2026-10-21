'use strict';
(()=>{
const API='https://server.samhwa.cloud/api/nameplates';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dateText=x=>x?x.replaceAll('-','.'): '—';
function equipmentCode(model,number){const name=model.normalize('NFC').trim().replace(/\s+/g,' ').toUpperCase()||'MODEL',serial=String(number??'').trim();return name+(serial?'-'+String(Number(serial)||serial).padStart(2,'0'):'');}
const LOGO='assets/samhwa-mark.png';
let labelSize='S';
function selectLabelSize(size){
 labelSize=size==='M'?'M':'S';
 ['rows-preview-size','equipment-preview-size','preview-size','settings-preview-size','print-size'].forEach(id=>$(id).value=labelSize);
}
const expandedCategories=new Set();
let lineContext=null, settingsDraft=null, settingsRevision=0, settingsSlots=[];
const defaultSlots=()=>[{fieldId:'installed',label:'Install date',mode:'installed',value:''},{fieldId:'cleaned',label:'Last cleaned',mode:'blank',value:''}];
const fieldType=f=>f?.valueType||(f?.id==='installed'||f?.fieldId==='installed'||/date|cleaned|날짜|일자/i.test(f?.label||'')?'date':'text');
const fieldLibrary=()=>data.plateFields||[{id:'installed',label:'Install date'},{id:'cleaned',label:'Last cleaned'}];
let batchRequest='',deleteContext=null,productEditor=null;
let data={revision:0,logo:'',categories:[],equipment:[]}, selected=new Set(), online=false, editing=null,categoryId=null,formRevision=0,cleanRequest='',generation=0,printItems=[],printGeneration=0;
const activeId=()=>new URL(location.href).searchParams.get('id');
const current=()=>data.equipment.find(e=>e.id===activeId());
const isMobileDevice=()=>!!navigator.userAgentData?.mobile||/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const scanToken=()=>new URL(location.href).searchParams.get('scan')||'';
function canRecordCleaning(e){const token=scanToken().split('.');return isMobileDevice()&&token.length===3&&token[0]===e.id&&Number(token[1])*1000>Date.now();}

const lastClean=e=>e.cleanings.map(c=>c.date).sort().at(-1)||'';
function cleaningState(e,asOf=today()){
 const interval=Number(e.cleaningIntervalDays)||0;
 if(!interval)return {key:'off',due:'',days:null,label:'Cycle not set'};
 const base=lastClean(e)||e.installed,dueDate=new Date(base+'T00:00:00Z');
 dueDate.setUTCDate(dueDate.getUTCDate()+interval);
 const due=dueDate.toISOString().slice(0,10),days=Math.round((dueDate-new Date(asOf+'T00:00:00Z'))/86400000);
 return {due,days,key:days<0?'overdue':days===0?'today':days<=7?'soon':'scheduled',label:days<0?`${-days}d overdue`:days===0?'Due today':days<=7?`Due in ${days}d`:`In ${days}d`};
}
function cleaningBadge(e){const s=cleaningState(e);return `<span class="cycle-badge ${s.key}">${esc(s.label)}</span>`;}
function cleaningHistory(e){return e.cleanings.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(c=>`<article class="history-row"><strong>${dateText(c.date)}</strong>${c.note?`<p>${esc(c.note)}</p>`:''}<small>Saved ${esc(c.savedAt.replace('T',' ').replace('+07:00',''))}</small></article>`).join('')||'<p class="empty">No cleaning records</p>';}
function cleaningEntry(e){return canRecordCleaning(e)?`<form class="inline-clean-form" data-clean-form="${e.id}" data-revision="${data.revision}" data-request="${crypto.randomUUID()}"><h4>Record cleaning</h4><label>Date<input name="date" type="date" min="${esc(e.installed)}" max="${today()}" value="${today()}" required></label><label>Notes<textarea name="note" maxlength="300" rows="3" placeholder="Work performed / findings"></textarea></label><p class="error" role="alert"></p><button class="primary" type="submit" ${online?'':'disabled'}>Save cleaning</button></form>`:'';}
function inlineEquipment(e){return `<section class="equipment-inline compact-history" id="equipment-panel-${e.id}" aria-label="${esc(e.code)} cleaning history"><h4>Cleaning history <span>${e.cleanings.length}</span></h4><div class="inline-history">${cleaningHistory(e)}</div></section>`;}

function renderCleaningSummary(){
 const counts={all:data.equipment.length,overdue:0,today:0,soon:0,scheduled:0,off:0};
 data.equipment.forEach(e=>counts[cleaningState(e).key]++);
 $('cleaning-summary').innerHTML=[['all','All equipment'],['overdue','Overdue'],['today','Due today'],['soon','Within 7 days'],['off','Cycle not set']].map(([key,label])=>`<button type="button" data-cycle-filter="${key}" class="cycle-card ${key}" aria-pressed="${$('cleaning-filter').value===key}"><span>${label}</span><strong>${counts[key]}</strong></button>`).join('');
}
function message(text,error=true){$('message').textContent=text;$('message').className=error?'':'success';}
async function api(path,options={}){
 const r=await fetch(API+path,{...options,cache:'no-store',signal:AbortSignal.timeout(60000)});
 let result;try{result=await r.json();}catch{throw Error(`Server error ${r.status}`);}
 if(!r.ok)throw Error(result.error||result.detail||`Server error ${r.status}`);return result;
}
const json=body=>({method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
async function save(form,error,fn){const buttons=[...form.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);$(error).textContent='';try{await fn();}catch(e){$(error).textContent=e.message;}finally{buttons.forEach(b=>b.disabled=false);}}
function choices(id,value){$(id).innerHTML=data.categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');if(value)$(id).value=value;}
function selectedState(){ $('selected-count').textContent=`${selected.size} selected`;$('print-open').disabled=!online||!!productEditor||!selected.size;$('delete-open').disabled=!online||!!productEditor||!selected.size;$('line-open').disabled=!online||!!productEditor||!selected.size;$('rows-edit').disabled=!online||!!productEditor||!selected.size;const rows=visible();$('select-all').checked=!!rows.length&&rows.every(e=>selected.has(e.id));$('select-all').indeterminate=rows.some(e=>selected.has(e.id))&&!$('select-all').checked;}
function visible(){const q=$('search').value.trim().toLowerCase(),cycle=$('cleaning-filter').value;return data.equipment.filter(e=>(!$('filter').value||e.categoryId===$('filter').value)&&(!$('line-filter').value||($('line-filter').value==='__none__'?!e.line:e.line===$('line-filter').value))&&(cycle==='all'||cleaningState(e).key===cycle)&&(!q||e.code.toLowerCase().includes(q)));}
function productEditorMatches(categoryId,model){return !productEditor?.isNew&&productEditor?.categoryId===categoryId&&productEditor?.model===model;}
function productGroup(category,model,items){
 const all=data.equipment.filter(e=>e.categoryId===category.id&&e.model===model),cycle=(data.productCycles||[]).find(p=>p.categoryId===category.id&&p.model===model),editingProduct=productEditorMatches(category.id,model);
 return `<section class="product-group"><div class="product-head"><div class="product-heading"><h3>${esc(model)}</h3><span>${editingProduct?productEditor.rows.length:all.length} units · ${editingProduct?'Product settings':cycle?.needsReview?'Review cleaning cycle':cycle?.cleaningIntervalDays?'Cleaning every '+cycle.cleaningIntervalDays+' days':'Cycle not set'}</span></div><div class="product-actions"><button type="button" class="${editingProduct?'':'primary'}" data-product-edit="${category.id}" data-product-model="${esc(model)}" ${productEditor&&!editingProduct?'disabled':''}>${editingProduct?'Settings open':'Settings'}</button><button type="button" data-print-category="${category.id}" data-print-model="${esc(model)}" ${productEditor?'disabled':''}>Print all</button><details class="product-more"><summary aria-label="More actions for ${esc(model)}">⋯</summary><button type="button" class="danger-button" data-delete-category="${category.id}" data-delete-model="${esc(model)}" ${productEditor?'disabled':''}>Delete Product</button></details></div></div>${editingProduct?productEditorHtml():items.map(e=>`<div class="equipment-row"><input type="checkbox" data-select="${e.id}" aria-label="Select ${esc(e.code)}" ${selected.has(e.id)?'checked':''}><button data-detail="${e.id}" aria-expanded="${activeId()===e.id}" aria-controls="equipment-panel-${e.id}">${esc(e.code)} <span class="row-chevron" aria-hidden="true">${activeId()===e.id?'⌃':'⌄'}</span></button><div class="equipment-line"><small>LINE</small>${esc(e.line||'-')}</div><div class="installed"><small>INSTALL DATE</small>${dateText(e.installed)}</div><div><small>LAST CLEANED</small>${dateText(lastClean(e))}</div><div class="cleaning-next"><small>NEXT CLEANING</small><span>${dateText(cleaningState(e).due)}</span>${cleaningBadge(e)}</div></div>${activeId()===e.id?inlineEquipment(e):''}`).join('')}</section>`;
}
function renderCatalog(){
 document.body.classList.toggle('product-editing',!!productEditor);
 const entries=visible();$('catalog').innerHTML=productEditor?.isNew?`<section class="product-group new-product-group"><div class="product-head"><h3>Add Product</h3></div>${productEditorHtml()}</section>`:data.categories.filter(c=>!$('filter').value||c.id===$('filter').value).map(c=>{
 const items=entries.filter(e=>e.categoryId===c.id).sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));
 if(!items.length&&($('search').value||$('line-filter').value||$('cleaning-filter').value!=='all')&&productEditor?.categoryId!==c.id)return '';
 const models=[...new Set(items.map(e=>e.model))];if(productEditor?.categoryId===c.id&&!models.includes(productEditor.model))models.push(productEditor.model);
 return `<details class="group" data-group="${c.id}" ${expandedCategories.has(c.id)?'open':''}><summary><span class="category-label">${esc(c.name)}</span><span class="category-count">${productEditor?.categoryId===c.id?productEditor.rows.length+' units in Product':items.length+' units'}</span><span class="category-chevron" aria-hidden="true">⌄</span></summary><div class="group-head"><div><button data-add-category="${c.id}" ${productEditor?'disabled':''}>+ Product</button><details class="product-more"><summary aria-label="Category actions for ${esc(c.name)}">⋯</summary><button data-category="${c.id}" ${productEditor?'disabled':''}>Rename category</button><button class="danger-button" data-delete-category="${c.id}" ${productEditor?'disabled':''}>Delete category</button></details></div></div>${models.map(model=>productGroup(c,model,items.filter(e=>e.model===model))).join('')||'<div class="empty">No products</div>'}</details>`;
 }).join('')||'<div class="empty">No equipment</div>';selectedState();['new-open','settings-open','category-open','refresh'].forEach(id=>$(id).disabled=!!productEditor||!online);['filter','line-filter','cleaning-filter','search','select-all'].forEach(id=>$(id).disabled=!!productEditor);document.querySelectorAll('[data-cycle-filter]').forEach(button=>button.disabled=!!productEditor);
}

function renderDetail(){
 const e=current();if(!e){$('detail').innerHTML='<div class="empty">Equipment not found</div>';$('history').innerHTML='';document.querySelectorAll('.detail-actions button').forEach(b=>b.disabled=true);return;}
 document.querySelectorAll('.detail-actions button').forEach(b=>b.disabled=!online);
 const category=data.categories.find(c=>c.id===e.categoryId)?.name||'';
 $('detail').innerHTML=`<article class="info"><span class="tag">${esc(category)} / ${esc(e.model)} / ${esc(e.number)}</span><h1>${esc(e.code)}</h1><div class="info-grid"><div><small>LINE</small><strong>${esc(e.line||'-')}</strong></div><div><small>INSTALL DATE</small><strong>${dateText(e.installed)}</strong></div><div><small>LAST CLEANED</small><strong>${dateText(lastClean(e))}</strong></div></div></article>`;
 $('history').innerHTML=e.cleanings.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(c=>`<article class="history-row"><strong>${dateText(c.date)}</strong>${c.note?`<p>${esc(c.note)}</p>`:''}<small>Saved ${esc(c.savedAt.replace('T',' ').replace('+07:00',''))}</small></article>`).join('')||'<div class="empty">No cleaning records</div>';
}

function mobileData(result){return {revision:result.revision,logo:result.logo||'',equipment:result.item?[result.item]:[],categories:[],productCycles:[]};}
function renderMobileCleaning(){
 document.body.classList.add('mobile-cleaning');
 document.querySelector('header nav').hidden=true;
 document.querySelector('header h1').textContent='Cleaning';
 document.querySelector('header a').removeAttribute('href');
 $('catalog-view').hidden=true;$('detail-view').hidden=true;$('mobile-cleaning-view').hidden=false;
 $('catalog').innerHTML='';
 const item=current();
 $('mobile-cleaning-view').innerHTML=item?`<section class="mobile-equipment-title"><small>EQUIPMENT CLEANING</small><h2>${esc(item.code)}</h2></section><section class="mobile-entry-panel">${canRecordCleaning(item)?cleaningEntry(item):'<p class="mobile-session-note">Scan this equipment QR again to register cleaning.</p>'}</section><section class="mobile-history-panel"><h2>Cleaning history <span>${item.cleanings.length}</span></h2><div class="inline-history">${cleaningHistory(item)}</div></section>`:'<section class="mobile-entry-panel"><h2>Scan equipment QR</h2><p>Open the QR on your equipment to register cleaning and view its history.</p></section>';
}
function render(){
 if(isMobileDevice()){renderMobileCleaning();return;}
 $('mobile-cleaning-view').hidden=true;
 const filter=$('filter').value;$('filter').innerHTML='<option value="">All</option>'+data.categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');$('filter').value=filter;
 const line=$('line-filter').value,lines=data.lines||[...new Set(data.equipment.map(e=>e.line).filter(Boolean))];
 $('line-filter').innerHTML='<option value="">All lines</option><option value="__none__">-</option>'+lines.map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join('');$('line-filter').value=line;
 ['equipment-line','assign-line'].forEach(id=>{$(id).innerHTML='<option value="">-</option>'+lines.map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join('');});
 $('catalog-view').hidden=false;$('detail-view').hidden=true;
 const focused=current();if(focused)expandedCategories.add(focused.categoryId);
 ['category-open','new-open','settings-open'].forEach(id=>$(id).disabled=!online);renderCleaningSummary();renderCatalog();
}
async function load(){const gen=++generation;online=false;render();message('Loading…',false);try{if(isMobileDevice()&&(!activeId()||!scanToken())){message('Scan the QR on your equipment.',false);render();return;}const result=await (isMobileDevice()?api(`/equipment/${encodeURIComponent(activeId())}`,{headers:{'X-Nameplates-Scan':scanToken()}}):api('/catalog'));if(gen!==generation)return;data=isMobileDevice()?mobileData(result):result;online=true;selected=new Set([...selected].filter(id=>data.equipment.some(e=>e.id===id)));message('');render();}catch(e){if(gen!==generation)return;message(e.message);render();}}
function navigate(id){const u=new URL(location.href);if(id)u.searchParams.set('id',id);else u.searchParams.delete('id');history.pushState({},'',u);render();}
function equipmentOpen(item=null){if(item)sheetOpen([item]);else addProduct($('filter').value);}
function suggestNumber(){if(editing)return;const model=$('equipment-model').value.trim().toUpperCase();const numbers=data.equipment.filter(e=>e.model===model).map(e=>Number(e.number));$('equipment-number').value=String(Math.max(0,...numbers)+1).padStart(2,'0');$('equipment-end').value=$('equipment-number').value;rangeSummary();}
function addProduct(category,model=''){
 if(!online||isMobileDevice()||productEditor)return;
 category=category||data.categories[0]?.id||'';
 productEditor={isNew:true,categoryId:category,model,rows:[freshRow(category,model)],interval:0,revision:data.revision,requestId:crypto.randomUUID(),previewIndex:0,previewOpen:false,common:{line:'__keep__',installed:'',field1:'__keep__',field2:'__keep__'}};
 message('');renderCatalog();document.querySelector('[data-product-name]')?.focus();
}
$('equipment-model').addEventListener('change',suggestNumber);
function rangeSummary(){const a=Number($('equipment-number').value),b=Number($('equipment-end').value),model=$('equipment-model').value.trim().toUpperCase();$('range-summary').hidden=!!editing;$('range-summary').textContent=Number.isInteger(a)&&Number.isInteger(b)&&a>=1&&b>=a&&b<=9999&&b-a<300?`${model||'Product'}-${String(a).padStart(2,'0')} → ${model||'Product'}-${String(b).padStart(2,'0')} · ${b-a+1} units`:'Range · 1–9999 / Max 300 units';}
['equipment-number','equipment-end','equipment-model'].forEach(id=>$(id).addEventListener('input',rangeSummary));
function renderCategories(){
 formRevision=data.revision;
 if(categoryId&&!data.categories.some(c=>c.id===categoryId)){categoryId=null;$('category-name').value='';}
 $('category-save').textContent=categoryId?'Save name':'+ Add';$('category-cancel-edit').hidden=!categoryId;
 $('category-list').innerHTML=data.categories.map((c,i)=>`<div class="list-row category-list-row"><span>${esc(c.name)}</span><div class="category-list-actions"><button type="button" data-category-move="${c.id}" data-direction="-1" aria-label="Move ${esc(c.name)} up" ${i===0?'disabled':''}>↑</button><button type="button" data-category-move="${c.id}" data-direction="1" aria-label="Move ${esc(c.name)} down" ${i===data.categories.length-1?'disabled':''}>↓</button><button type="button" data-category="${c.id}">Edit</button><button type="button" class="danger-button" data-delete-category="${c.id}">Delete</button></div></div>`).join('')||'<p class="empty">No categories</p>';
}
function categoryOpen(id=null){if(!online)return;categoryId=id;$('category-name').value=data.categories.find(c=>c.id===id)?.name||'';$('category-error').textContent='';renderCategories();if(!$('category-dialog').open)$('category-dialog').showModal();}
$('category-cancel-edit').onclick=()=>categoryOpen();
$('category-form').onsubmit=async e=>{e.preventDefault();await save(e.target,'category-error',async()=>{data=await api('/category',json({revision:formRevision,id:categoryId,name:$('category-name').value}));categoryId=null;$('category-name').value='';render();});renderCategories();};
$('category-list').onclick=async e=>{
 const button=e.target.closest('[data-category-move]');if(!button)return;
 const ids=data.categories.map(c=>c.id),i=ids.indexOf(button.dataset.categoryMove),j=i+Number(button.dataset.direction);
 if(i<0||j<0||j>=ids.length)return;
 [ids[i],ids[j]]=[ids[j],ids[i]];
 await save($('category-form'),'category-error',async()=>{data=await api('/category/order',json({revision:formRevision,ids}));render();});renderCategories();
};
$('equipment-form').onsubmit=e=>{e.preventDefault();const print=e.submitter?.id==='equipment-save-print';save(e.target,'equipment-error',async()=>{
 const body={revision:formRevision,id:editing,categoryId:$('equipment-category').value,model:$('equipment-model').value,number:$('equipment-number').value,installed:$('equipment-installed').value,size:$('equipment-size').value,line:$('equipment-line').value,plateSlots:readSlots()};
 const result=editing?await api('/equipment',json(body)):await api('/equipment/batch',json({...body,start:body.number,end:$('equipment-end').value,requestId:batchRequest}));
 const ids=result.createdIds||[];delete result.createdIds;data=result;if(!editing)selected=new Set(ids);$('equipment-dialog').close();render();
 if(print)printOpen(data.equipment.filter(item=>ids.includes(item.id)));
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
 $('delete-dialog').close();render();if($('category-dialog').open)renderCategories();message(`${count} units deleted`,false);
});};
$('delete-dialog').addEventListener('close',()=>{$('delete-password').value='';deleteContext=null;});
$('line-open').onclick=()=>{if(!online||!!productEditor||!selected.size)return;lineContext={revision:data.revision,ids:[...selected],requestId:crypto.randomUUID()};$('line-count').textContent=`${selected.size} selected`;$('assign-line').value='';$('line-error').textContent='';$('line-dialog').showModal();};
$('line-form').onsubmit=e=>{e.preventDefault();save(e.target,'line-error',async()=>{data=await api('/equipment/line',json({...lineContext,line:$('assign-line').value}));$('line-dialog').close();render();});};
$('clean-open').onclick=()=>{const e=current();if(!online||!e||!canRecordCleaning(e))return;formRevision=data.revision;cleanRequest=crypto.randomUUID();$('clean-form').reset();$('clean-code').textContent=e.code;$('clean-date').value=today();$('clean-date').min=e.installed;$('clean-date').max=today();$('clean-error').textContent='';$('clean-dialog').showModal();};
$('clean-form').onsubmit=e=>{e.preventDefault();save(e.target,'clean-error',async()=>{const options=json({revision:formRevision,requestId:cleanRequest,date:$('clean-date').value,note:$('clean-note').value});options.method='POST';options.headers['X-Nameplates-Scan']=scanToken();data=await api(`/equipment/${current().id}/cleaning`,options);$('clean-dialog').close();render();});};
function readSlots(){return [...$('slot-rows').children].map(row=>({fieldId:row.querySelector('[data-slot-field]').value,mode:row.querySelector('[data-slot-mode]').value,value:row.querySelector('[data-slot-value]').value,label:row.querySelector('[data-slot-field]').selectedOptions[0]?.textContent||''}));}
function slotEditor(slots){
 $('slot-count').value=slots.length;
 $('slot-rows').innerHTML=slots.map((slot,i)=>{
 const fields=[...fieldLibrary()];if(!fields.some(f=>f.id===slot.fieldId))fields.push({id:slot.fieldId,label:slot.label});
 return `<div class="slot-row"><label>${i+1} · Field<select data-slot-field>${fields.map(f=>`<option value="${esc(f.id)}" ${f.id===slot.fieldId?'selected':''}>${esc(f.label)}</option>`).join('')}</select></label><label>Value<select data-slot-mode><option value="blank" ${slot.mode==='blank'?'selected':''}>Blank</option><option value="fixed" ${slot.mode==='fixed'?'selected':''}>Fixed</option><option value="installed" ${slot.mode==='installed'?'selected':''}>Install date</option></select></label><label ${slot.mode==='fixed'?'':'hidden'}>Text / Date<input data-slot-value maxlength="24" value="${esc(slot.value)}" ${slot.mode==='fixed'?'required':''}></label></div>`;
 }).join('');
 equipmentPreview();
}
$('slot-count').onchange=()=>{const slots=readSlots();if($('slot-count').value==='1')slots.length=1;else if(slots.length===1){const f=fieldLibrary().find(f=>f.id!==slots[0].fieldId)||fieldLibrary()[0];slots.push({fieldId:f.id,label:f.label,mode:'blank',value:''});}slotEditor(slots);};
$('slot-rows').onchange=e=>{if(e.target.matches('[data-slot-mode]')){const input=e.target.closest('.slot-row').querySelector('[data-slot-value]');input.parentElement.hidden=e.target.value!=='fixed';input.required=e.target.value==='fixed';}};
function renderSettings(){
 settingsSlots=settingsSlots.filter(s=>settingsDraft.plateFields.some(f=>f.id===s.fieldId));
 if(!settingsSlots.length&&settingsDraft.plateFields.length){const f=settingsDraft.plateFields[0];settingsSlots=[{fieldId:f.id,label:f.label,mode:'blank',value:''}];}

 for(const [kind,items] of [['lines',settingsDraft.lines],['fields',settingsDraft.plateFields]]){
  $('settings-'+kind).innerHTML=items.map((v,i)=>`<div class="list-row">${kind==='lines'?`<span>${esc(v)}</span>`:`<button type="button" class="field-choice" data-preview-field="${esc(v.id)}" aria-pressed="${settingsSlots.some(f=>f.fieldId===v.id)}">${esc(v.label)}</button>`}<button type="button" data-list="${kind}" data-index="${i}" data-move="-1" aria-label="Move up" ${i===0?'disabled':''}>↑</button><button type="button" data-list="${kind}" data-index="${i}" data-move="1" aria-label="Move down" ${i===items.length-1?'disabled':''}>↓</button><button type="button" data-list="${kind}" data-index="${i}" data-remove="1">Delete</button></div>`).join('');
 }
 settingsPreviewControls();settingsPreview();
}
$('settings-open').onclick=()=>{if(!online)return;settingsRevision=data.revision;settingsDraft={lines:[...(data.lines||[...new Set(data.equipment.map(e=>e.line).filter(Boolean))])],plateFields:structuredClone(fieldLibrary())};settingsSlots=settingsDraft.plateFields.slice(0,2).map(f=>({fieldId:f.id,label:f.label,valueType:fieldType(f),mode:f.id==='installed'?'installed':'blank',value:''}));selectLabelSize(labelSize);$('settings-error').textContent='';$('new-line').value='';$('new-field').value='';renderSettings();$('settings-dialog').showModal();};
$('settings-dialog').addEventListener('click',e=>{
 const choice=e.target.closest('[data-preview-field]');if(choice){const id=choice.dataset.previewField,index=settingsSlots.findIndex(f=>f.fieldId===id);if(index>=0){if(settingsSlots.length>1)settingsSlots.splice(index,1);}else{const f=settingsDraft.plateFields.find(f=>f.id===id);if(settingsSlots.length===2)settingsSlots.pop();settingsSlots.push({fieldId:f.id,label:f.label,mode:'blank',value:''});}renderSettings();return;}
 const b=e.target.closest('[data-list]');if(!b)return;
 const list=b.dataset.list==='lines'?settingsDraft.lines:settingsDraft.plateFields,i=Number(b.dataset.index);
 if(b.dataset.remove){
  if(b.dataset.list==='lines'){const count=data.equipment.filter(e=>e.line===list[i]).length;if(!confirm(`Delete ${list[i]}? ${count} units → -`))return;}
  else {if(list.length===1){$('settings-error').textContent='At least one field';return;}if(!confirm('Remove field from list? Existing nameplates stay unchanged.'))return;}
  list.splice(i,1);
 }else{const j=i+Number(b.dataset.move);[list[i],list[j]]=[list[j],list[i]];}
 renderSettings();
});
$('add-line').onclick=()=>{let value=$('new-line').value.trim().toUpperCase();const m=value.match(/^(?:L(?:INE)?[ .-]*)?(\d+)$/);if(m)value='L.'+Number(m[1]);if(!value||settingsDraft.lines.includes(value)){ $('settings-error').textContent='New line required';return;}settingsDraft.lines.push(value);$('new-line').value='';$('settings-error').textContent='';renderSettings();};
$('add-field').onclick=()=>{const label=$('new-field').value.trim();if(!label||settingsDraft.plateFields.some(f=>f.label.toLowerCase()===label.toLowerCase())){$('settings-error').textContent='New field required';return;}settingsDraft.plateFields.push({id:crypto.randomUUID(),label,valueType:$('new-field-type').value});$('new-field').value='';$('settings-error').textContent='';renderSettings();};
$('settings-form').onsubmit=e=>{e.preventDefault();save(e.target,'settings-error',async()=>{data=await api('/settings',json({revision:settingsRevision,...settingsDraft}));$('settings-dialog').close();render();});};
function plate(item,size){const category=data.categories.find(c=>c.id===item.categoryId)?.name||'';return `<article class="plate ${size.toLowerCase()}"><div class="plate-brand"><img src="${LOGO}" alt="SAMHWA"><div><strong>SAMHWA</strong><small>INDUSTRIAL CO., LTD.</small></div><span>ASSET<br>CONTROL</span></div><div class="plate-main"><div class="asset-info"><div class="asset-category">${esc(category)}</div><strong class="asset-code ${item.code.length>14?'long-code':''}">${esc(item.code)}</strong></div><div class="asset-qr">${item.id?`<img src="${API}/qr/${item.id}" alt="QR">`:'<div class="qr-placeholder">QR<br><small>After save</small></div>'}<span>SCAN / SERVICE</span></div></div><div class="plate-dates" style="grid-template-columns:repeat(${(item.plateSlots||defaultSlots()).length},minmax(0,1fr))">${(item.plateSlots||defaultSlots()).map(f=>`<div><small>${esc(f.label)}</small>${f.mode==='blank'?'<span class="clean-blank"></span>':`<strong class="${(f.value||'').length>12?'long-value':''}">${esc(f.mode==='installed'?dateText(item.installed):(fieldType(f)==='date'?dateText(f.value):f.value))}</strong>`}</div>`).join('')}</div></article>`;}

function equipmentPreview(){
 const number=$('equipment-number').value.trim(), model=$('equipment-model').value.trim().toUpperCase()||'MODEL';
 const item={id:editing,categoryId:$('equipment-category').value,code:equipmentCode(model,number),installed:$('equipment-installed').value,plateSlots:readSlots()};
 $('equipment-live-preview').innerHTML=plate(item,labelSize);
}
['input','change'].forEach(event=>$('equipment-form').addEventListener(event,e=>{if(e.target.matches('input,select'))equipmentPreview();}));
function settingsPreview(){
 $('settings-live-preview').innerHTML=plate({id:null,categoryId:current()?.categoryId||data.categories[0]?.id,code:current()?.code||'U202-01',installed:current()?.installed||today(),plateSlots:settingsSlots},$('settings-preview-size').value);
}
function settingsPreviewControls(){
 $('settings-preview-values').innerHTML=settingsSlots.map((s,i)=>{const def=settingsDraft.plateFields.find(f=>f.id===s.fieldId)||s,kind=fieldType(def);s.valueType=kind;return `<div class="sample-slot"><label>${esc(s.label)}<select data-sample-mode="${i}"><option value="blank" ${s.mode==='blank'?'selected':''}>Blank</option><option value="fixed" ${s.mode==='fixed'?'selected':''}>${kind==='date'?'Date':'Text'}</option>${s.fieldId==='installed'?`<option value="installed" ${s.mode==='installed'?'selected':''}>Install date</option>`:''}</select></label><label ${s.mode==='fixed'?'':'hidden'}>${esc(s.label)}<input type="${kind}" data-sample-value="${i}" value="${esc(kind==='date'?s.value.replaceAll('.','-'):s.value)}" maxlength="24"></label></div>`;}).join('');
}
$('settings-preview-size').onchange=()=>{selectLabelSize($('settings-preview-size').value);settingsPreview();};
$('settings-preview-values').addEventListener('change',e=>{if(e.target.hasAttribute('data-sample-mode')){settingsSlots[Number(e.target.dataset.sampleMode)].mode=e.target.value;settingsPreviewControls();settingsPreview();}});
$('settings-preview-values').addEventListener('input',e=>{if(e.target.hasAttribute('data-sample-value')){settingsSlots[Number(e.target.dataset.sampleValue)].value=e.target.value;settingsPreview();}});
function preview(){const e=current();if(e)$('plate-preview').innerHTML=plate(e,$('preview-size').value);}
$('plate-open').onclick=()=>{if(!current())return;selectLabelSize(labelSize);preview();$('plate-dialog').showModal();};$('preview-size').onchange=()=>{selectLabelSize($('preview-size').value);preview();};
async function imagesReady(root){await Promise.all([...root.querySelectorAll('img')].map(img=>new Promise((resolve,reject)=>{if(img.complete){img.naturalWidth?resolve():reject(Error('QR / logo unavailable · Check server'));return;}const timer=setTimeout(()=>reject(Error('Image loading timeout · Retry')),15000);img.onload=()=>{clearTimeout(timer);resolve();};img.onerror=()=>{clearTimeout(timer);reject(Error('QR / logo unavailable · Check server'));};})));}
async function printPreview(){const gen=++printGeneration;$('print-button').disabled=true;$('print-status').textContent='Loading…';$('print-pages').innerHTML='';$('print-output').innerHTML='';try{
 const copies=Number($('copies').value),size=$('print-size').value;if(!['S','M'].includes(size))throw Error('Select label size · S or M');if(!Number.isInteger(copies)||copies<1||copies>100||printItems.length*copies>300)throw Error('Copies 1–100 · Max 300 labels');
 const items=printItems.flatMap(e=>Array.from({length:copies},()=>e));let html='',pages=0;
 const capacity=size==='S'?30:12;
 for(let i=0;i<items.length;i+=capacity){html+=`<section class="sheet ${size.toLowerCase()}">${items.slice(i,i+capacity).map(e=>plate(e,size)).join('')}</section>`;pages++;}
 $('print-pages').innerHTML=html;await imagesReady($('print-pages'));if(gen!==printGeneration)return;$('print-status').textContent=`${items.length} labels · ${pages} pages`;$('print-button').disabled=false;
 }catch(e){if(gen===printGeneration)$('print-status').textContent=e.message;}}
function printOpen(items,size=labelSize){printItems=items.map(e=>structuredClone(e));$('copies').value=1;selectLabelSize(size);$('print-dialog').showModal();printPreview();}
$('print-open').onclick=()=>printOpen(data.equipment.filter(e=>selected.has(e.id)));
$('print-one').onclick=()=>{const size=$('preview-size').value;$('plate-dialog').close();printOpen([current()],size);};
$('print-size').onchange=()=>{selectLabelSize($('print-size').value);printPreview();};$('copies').oninput=printPreview;
$('print-button').onclick=async()=>{if($('print-button').disabled)return;$('print-button').disabled=true;try{$('print-output').innerHTML=$('print-pages').innerHTML;await imagesReady($('print-output'));$('print-dialog').close();window.print();}catch(e){$('print-status').textContent=e.message;}finally{$('print-button').disabled=false;}};
document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;if(button.dataset.close)$(button.dataset.close).close();if(button.dataset.detail)navigate(activeId()===button.dataset.detail?null:button.dataset.detail);if(button.dataset.inlineEdit)equipmentOpen(data.equipment.find(item=>item.id===button.dataset.inlineEdit));if(button.dataset.inlinePlate){selectLabelSize(labelSize);const item=data.equipment.find(item=>item.id===button.dataset.inlinePlate);$('plate-preview').innerHTML=plate(item,labelSize);$('plate-dialog').showModal();}if(button.dataset.category)categoryOpen(button.dataset.category);if(button.dataset.deleteCategory)deleteOpen(button.dataset.deleteCategory,button.dataset.deleteModel||null);if(button.dataset.printCategory&&online)printOpen(visible().filter(item=>item.categoryId===button.dataset.printCategory&&item.model===button.dataset.printModel));if(button.dataset.addCategory)addProduct(button.dataset.addCategory,button.dataset.addModel||'');});
$('catalog').addEventListener('change',e=>{if(!e.target.dataset.select)return;e.target.checked?selected.add(e.target.dataset.select):selected.delete(e.target.dataset.select);selectedState();});
$('select-all').onchange=e=>{visible().forEach(item=>e.target.checked?selected.add(item.id):selected.delete(item.id));renderCatalog();};
$('catalog').addEventListener('toggle',e=>{if(e.target.matches('details[data-group]')&&e.target.isConnected){e.target.open?expandedCategories.add(e.target.dataset.group):expandedCategories.delete(e.target.dataset.group);}},true);
function filterChanged(){expandedCategories.clear();if($('line-filter').value||$('search').value||$('filter').value||$('cleaning-filter').value!=='all')visible().forEach(item=>expandedCategories.add(item.categoryId));renderCatalog();}
$('cleaning-filter').onchange=()=>{renderCleaningSummary();filterChanged();};$('cleaning-summary').onclick=e=>{const button=e.target.closest('[data-cycle-filter]');if(button){$('cleaning-filter').value=button.dataset.cycleFilter;renderCleaningSummary();filterChanged();}};$('line-filter').onchange=filterChanged;$('filter').onchange=filterChanged;$('search').oninput=filterChanged;$('refresh').onclick=load;$('new-open').onclick=()=>equipmentOpen();$('category-open').onclick=()=>categoryOpen();$('edit-open').onclick=()=>equipmentOpen(current());$('back').onclick=()=>navigate(null);window.addEventListener('popstate',render);
let sheetRows=[],sheetActive=0,sheetRevision=0,sheetRequest='';
function freshRow(category,model){
 const rows=[...data.equipment,...sheetRows],numbers=rows.filter(e=>e.model.toUpperCase()===(model||'').toUpperCase()).map(e=>Number(e.number)||0);
 return {id:null,categoryId:category||data.categories[0]?.id||'',model:model||'',number:String(Math.max(0,...numbers)+1).padStart(2,'0'),line:'',installed:today(),size:'S',cleaningIntervalDays:0,plateSlots:fieldLibrary().slice(0,2).map(f=>({fieldId:f.id,label:f.label,valueType:fieldType(f),mode:f.id==='installed'?'installed':'blank',value:''}))};
}
function sheetOpen(items=null,category='',model=''){
 if(!online)return;if(!data.categories.length){categoryOpen();return;}
 sheetRows=items?structuredClone(items):[];
 if(!items)sheetRows.push(freshRow(category||$('filter').value,model));
 selectLabelSize(labelSize);
 sheetRows.forEach(r=>{r.plateSlots=r.plateSlots||defaultSlots();r.plateSlots.forEach(f=>f.valueType=fieldType(fieldLibrary().find(d=>d.id===f.fieldId)||f));});sheetActive=0;sheetRevision=data.revision;sheetRequest=crypto.randomUUID();
 $('rows-error').textContent='';$('row-products').innerHTML=[...new Set(data.equipment.map(e=>e.model))].map(m=>`<option value="${esc(m)}"></option>`).join('');
 sheetRender();$('rows-dialog').showModal();
}
const rowOption=(value,label,chosen)=>`<option value="${esc(value)}" ${value===chosen?'selected':''}>${esc(label)}</option>`;
function sheetFieldCell(row,index){
 const slot=row.plateSlots[index],fields=[...fieldLibrary()];
 if(slot&&!fields.some(f=>f.id===slot.fieldId))fields.push({id:slot.fieldId,label:slot.label,valueType:slot.valueType});
 return `<td class="field-value-cell"><select data-slot="${index}" data-key="fieldId" aria-label="Field ${index+1}">${index?rowOption('','None',slot?.fieldId||''):''}${fields.map(f=>rowOption(f.id,f.label,slot?.fieldId)).join('')}</select></td>`;
}
function sheetRowHtml(row,i){return `<tr data-row="${i}" class="${i===sheetActive?'active':''}"><td><button type="button" data-pick="${i}" aria-label="Preview row ${i+1}">${i+1}</button></td><td><select data-key="categoryId" aria-label="Category" required>${data.categories.map(c=>rowOption(c.id,c.name,row.categoryId)).join('')}</select></td><td><input data-key="model" aria-label="Product" list="row-products" value="${esc(row.model)}" maxlength="60" required></td><td><input data-key="number" aria-label="Number" value="${esc(row.number)}" pattern="[0-9]{1,4}" maxlength="4" inputmode="numeric" placeholder="Optional" title="Leave blank for no number"></td><td><select data-key="line" aria-label="Line">${rowOption('','-',row.line)}${(data.lines||[]).map(l=>rowOption(l,l,row.line)).join('')}</select></td><td><input data-key="installed" aria-label="Install date" type="date" max="${today()}" value="${esc(row.installed)}" required></td>${sheetFieldCell(row,0)}${sheetFieldCell(row,1)}<td><button type="button" data-drop="${i}" aria-label="Remove row ${i+1}" title="Remove row" ${sheetRows.length===1?'disabled':''}>×</button></td></tr>`;}
function sheetRender(){
 $('entry-rows').innerHTML=sheetRows.map(sheetRowHtml).join('');$('rows-count').textContent=`${sheetRows.length} rows`;$('row-add').disabled=sheetRows.length>=300;sheetPreview();
}
function sheetPreview(){
 const r=sheetRows[sheetActive];if(!r)return;
 const code=equipmentCode(r.model,r.number);
 $('rows-preview').innerHTML=plate({...r,code},labelSize);
 $('rows-info').innerHTML=`<small>ROW ${sheetActive+1} / ${sheetRows.length}</small><strong>${esc(code)}</strong><span>${esc(data.categories.find(c=>c.id===r.categoryId)?.name||'')} · Line ${esc(r.line||'-')}</span><span>${labelSize==='M'?'80 × 40':'50 × 25'} mm · ${esc(dateText(r.installed))}</span>`;
 $('entry-rows').querySelectorAll('tr').forEach((tr,i)=>tr.classList.toggle('active',i===sheetActive));
}
$('rows-preview-size').onchange=()=>{selectLabelSize($('rows-preview-size').value);sheetPreview();};
$('equipment-preview-size').onchange=()=>{selectLabelSize($('equipment-preview-size').value);equipmentPreview();};
$('row-add').onclick=()=>{const r=sheetRows[sheetActive];sheetRows.push(freshRow(r.categoryId,r.model));sheetActive=sheetRows.length-1;sheetRender();const tr=$('entry-rows').lastElementChild;tr.querySelector('[data-key="model"]').focus();};
$('entry-rows').addEventListener('focusin',e=>{const tr=e.target.closest('[data-row]');if(tr){sheetActive=Number(tr.dataset.row);sheetPreview();}});
$('entry-rows').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-pick')){sheetActive=Number(b.dataset.pick);sheetPreview();}if(b.hasAttribute('data-drop')){sheetRows.splice(Number(b.dataset.drop),1);sheetActive=Math.min(sheetActive,sheetRows.length-1);sheetRender();}});
function sheetInput(e){
 const el=e.target,tr=el.closest('[data-row]');if(!tr||!el.dataset.key)return;
 sheetActive=Number(tr.dataset.row);const row=sheetRows[sheetActive],key=el.dataset.key;
 if(el.hasAttribute('data-slot')){
  const index=Number(el.dataset.slot);
  if(key==='fieldId'){
   if(!el.value)row.plateSlots.splice(index,1);
   else{const def=fieldLibrary().find(f=>f.id===el.value)||row.plateSlots[index];if(row.plateSlots.some((f,i)=>i!==index&&f.fieldId===el.value)){el.value=row.plateSlots[index]?.fieldId||'';$('rows-error').textContent='Select different fields';return;}if(row.plateSlots[index]?.fieldId!==el.value)row.plateSlots[index]={fieldId:el.value,label:def.label,valueType:fieldType(def),mode:el.value==='installed'?'installed':'blank',value:''};}
  }else if(row.plateSlots[index])row.plateSlots[index][key]=el.value;
  if(key==='mode'||key==='fieldId'){
   tr.outerHTML=sheetRowHtml(row,sheetActive);
   $('entry-rows').children[sheetActive].querySelector(`[data-slot="${index}"][data-key="${key}"]`).focus();
  }
 }else {row[key]=el.value;if(key==='installed')tr.querySelectorAll('[data-key="value"][readonly]').forEach(input=>input.value=el.value);}
 sheetPreview();
}
$('entry-rows').addEventListener('input',e=>{if(e.target.tagName==='INPUT')sheetInput(e);});
$('entry-rows').addEventListener('change',e=>{if(e.target.tagName==='SELECT')sheetInput(e);});
$('rows-edit').onclick=()=>sheetOpen(data.equipment.filter(e=>selected.has(e.id)));
$('rows-form').onsubmit=e=>{e.preventDefault();const print=e.submitter?.id==='rows-print';save(e.target,'rows-error',async()=>{
 const rows=sheetRows.map(r=>({id:r.id||null,categoryId:r.categoryId,model:r.model,number:r.number,line:r.line,installed:r.installed,size:r.size,plateSlots:r.plateSlots}));
 const result=await api('/equipment/rows',json({revision:sheetRevision,requestId:sheetRequest,rows}));
 const ids=result.savedIds;delete result.savedIds;data=result;selected=new Set(ids);$('rows-dialog').close();render();
 if(print)printOpen(data.equipment.filter(r=>ids.includes(r.id)));else message(`${ids.length} units saved`,false);
 });};

document.addEventListener('submit',async event=>{
 const form=event.target,isProductCycle=form.hasAttribute('data-product-cycle'),cleanId=form.dataset.cleanForm;
 if(!isProductCycle&&!cleanId)return;event.preventDefault();
 const button=form.querySelector('button[type=submit]'),error=form.querySelector('.error');
 if(button.disabled)return;button.disabled=true;error.textContent='';
 try{
  const body={revision:Number(form.dataset.revision)};
  let result;
  if(isProductCycle){if(isMobileDevice())throw Error('Product settings are available on PC only.');Object.assign(body,{categoryId:form.dataset.categoryId,model:form.dataset.model,cleaningIntervalDays:Number(form.elements.interval.value)});result=await api('/product/cycle',json(body));}
  else{const item=data.equipment.find(e=>e.id===cleanId);if(!item||!canRecordCleaning(item))throw Error('Scan the QR with your mobile device again.');Object.assign(body,{date:form.elements.date.value,note:form.elements.note.value,requestId:form.dataset.request});const options=json(body);options.method='POST';options.headers['X-Nameplates-Scan']=scanToken();result=await api(`/equipment/${cleanId}/cleaning`,options);}
  data=isMobileDevice()?mobileData(result):result;render();message(isProductCycle?'Product cycle saved for all units':'Cleaning recorded · Next cleaning updated',false);
 }catch(err){error.textContent=err.message;button.disabled=false;}
});

function openProductEditor(categoryId,model){
 if(!online||isMobileDevice()||productEditor)return;
 const rows=data.equipment.filter(e=>e.categoryId===categoryId&&e.model===model).sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));
 if(!rows.length)return;
 const cycle=(data.productCycles||[]).find(p=>p.categoryId===categoryId&&p.model===model);
 productEditor={categoryId,model,rows:structuredClone(rows),interval:cycle?.cleaningIntervalDays||0,revision:data.revision,requestId:crypto.randomUUID(),previewIndex:0,previewOpen:false,common:{line:'__keep__',installed:'',field1:'__keep__',field2:'__keep__'}};
 expandedCategories.add(categoryId);message('');renderCatalog();
}
function productEditorRow(row,index){return `<tr data-product-row="${index}"><td><button type="button" data-product-preview="${index}" class="product-code-button">${esc(equipmentCode(row.model,row.number))}</button></td><td><input data-key="number" aria-label="Number" value="${esc(row.number)}" pattern="[0-9]{1,4}" maxlength="4" inputmode="numeric" placeholder="Optional"></td><td><select data-key="line" aria-label="Line">${rowOption('','-',row.line)}${(data.lines||[]).map(v=>rowOption(v,v,row.line)).join('')}</select></td><td><input data-key="installed" aria-label="Install date" type="date" max="${today()}" value="${esc(row.installed)}" required></td>${sheetFieldCell(row,0)}${sheetFieldCell(row,1)}<td>${row.id?'':`<button type="button" data-product-drop="${index}" ${productEditor.rows.length===1?'disabled':''} aria-label="Remove new row ${index+1}">×</button>`}</td></tr>`;}
function productEditorHtml(){
 const draft=productEditor,fields=fieldLibrary(),cycle=(data.productCycles||[]).find(p=>p.categoryId===draft.categoryId&&p.model===draft.model),preview=draft.rows[draft.previewIndex]||draft.rows[0];
 return `<form class="product-settings-form" data-product-settings="1">${draft.isNew?`<div class="product-identity"><label>Category<select data-product-category required><option value="">Select category</option>${data.categories.map(c=>rowOption(c.id,c.name,draft.categoryId)).join('')}</select></label><label>Product name<input data-product-name value="${esc(draft.model)}" maxlength="60" placeholder="Enter Product name" required></label></div>${!data.categories.length?'<p>Create a category in Settings before saving a Product.</p>':''}`:''}<div class="product-settings-top"><label>Cleaning cycle (days)<input type="number" name="interval" data-product-interval min="0" max="3650" step="1" value="${draft.interval}" list="cleaning-cycle-options" required></label><span>All ${draft.rows.length} units · 0 = off${cycle?.needsReview?' · Review previous cycles':''}</span></div><details class="product-common"><summary>Apply the same setting to all rows</summary><div class="product-common-controls"><label>Line<select data-common="line">${rowOption('__keep__','Keep current',draft.common.line)}${rowOption('','-',draft.common.line)}${(data.lines||[]).map(v=>rowOption(v,v,draft.common.line)).join('')}</select></label><label>Install date<input type="date" data-common="installed" max="${today()}" value="${esc(draft.common.installed)}"></label><label>Field 1<select data-common="field1">${rowOption('__keep__','Keep current',draft.common.field1)}${fields.map(f=>rowOption(f.id,f.label,draft.common.field1)).join('')}</select></label><label>Field 2<select data-common="field2">${rowOption('__keep__','Keep current',draft.common.field2)}${rowOption('','None',draft.common.field2)}${fields.map(f=>rowOption(f.id,f.label,draft.common.field2)).join('')}</select></label><button type="button" data-product-apply>Apply to all</button></div></details><div class="product-table-scroll"><table class="entry-table product-settings-table"><thead><tr><th>Equipment / preview</th><th>No.</th><th>Line</th><th>Install date</th><th>Field 1</th><th>Field 2</th><th></th></tr></thead><tbody>${draft.rows.map(productEditorRow).join('')}</tbody></table></div><div class="product-table-actions"><button type="button" data-product-add ${draft.rows.length>=300?'disabled':''}>＋ Add row</button><span>${draft.rows.length} rows · Complete Product list</span></div><details class="product-preview-options" ${draft.previewOpen?'open':''}><summary>Label preview · S / M</summary><div class="product-preview-content"><label>Preview size<select data-product-preview-size>${rowOption('S','S · 50 × 25 mm',labelSize)}${rowOption('M','M · 80 × 40 mm',labelSize)}</select></label><div class="product-preview">${plate({...preview,code:equipmentCode(preview.model,preview.number)},labelSize)}</div></div></details><p class="error product-settings-error" role="alert"></p><div class="product-settings-actions"><button type="button" data-product-cancel>Cancel</button><button type="submit" name="action" value="print">Save &amp; Print</button><button type="submit" name="action" value="save" class="primary">Save all</button></div></form>`;
}
function productSlot(row,index,fieldId){
 if(!fieldId){row.plateSlots.splice(index,1);return;}
 if(row.plateSlots[index]?.fieldId===fieldId)return;
 const definition=fieldLibrary().find(f=>f.id===fieldId);
 if(!definition)throw Error('Field removed · Reload');
 row.plateSlots[index]={fieldId,label:definition.label,valueType:fieldType(definition),mode:fieldId==='installed'?'installed':'blank',value:''};
}
function productPreviewUpdate(){
 const row=productEditor?.rows[productEditor.previewIndex];
 const el=document.querySelector('.product-settings-form .product-preview');
 if(row&&el)el.innerHTML=plate({...row,code:equipmentCode(row.model,row.number)},labelSize);
}
function productEditorInput(event){
 const el=event.target,form=el.closest('.product-settings-form');if(!form||!productEditor)return;
 const error=form.querySelector('.product-settings-error');error.textContent='';
 if(el.hasAttribute('data-product-name')){
  productEditor.model=el.value.normalize('NFC').trim().replace(/\s+/g,' ').toUpperCase();
  productEditor.rows.forEach((row,i)=>{row.model=productEditor.model;form.querySelector(`[data-product-row="${i}"] .product-code-button`).textContent=equipmentCode(row.model,row.number);});
  productPreviewUpdate();return;
 }
 if(el.hasAttribute('data-product-category')){productEditor.categoryId=el.value;productEditor.rows.forEach(row=>row.categoryId=el.value);return;}
 if(el.hasAttribute('data-common')){productEditor.common[el.dataset.common]=el.value;return;}
 if(el.hasAttribute('data-product-interval')){productEditor.interval=Number(el.value);return;}
 if(el.hasAttribute('data-product-preview-size')){selectLabelSize(el.value);productPreviewUpdate();return;}
 const tr=el.closest('[data-product-row]');if(!tr||!el.dataset.key)return;
 const index=Number(tr.dataset.productRow),row=productEditor.rows[index];productEditor.previewIndex=index;
 if(el.hasAttribute('data-slot')){
  const slot=Number(el.dataset.slot);
  if(el.value&&row.plateSlots.some((f,i)=>i!==slot&&f.fieldId===el.value)){el.value=row.plateSlots[slot]?.fieldId||'';error.textContent='Select different fields';return;}
  productSlot(row,slot,el.value);
 }else row[el.dataset.key]=el.value;
 tr.querySelector('.product-code-button').textContent=equipmentCode(row.model,row.number);productPreviewUpdate();
}
['settings-open','category-open'].forEach(id=>$(id).addEventListener('click',()=>{document.querySelector('.workspace-menu').open=false;}));
$('catalog').addEventListener('input',e=>{if(e.target.tagName==='INPUT')productEditorInput(e);});
$('catalog').addEventListener('change',e=>{if(e.target.tagName==='SELECT')productEditorInput(e);});
$('catalog').addEventListener('toggle',e=>{if(e.target.matches('.product-preview-options')&&e.target.isConnected&&productEditor)productEditor.previewOpen=e.target.open;},true);
$('catalog').addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.hasAttribute('data-product-edit')){openProductEditor(button.dataset.productEdit,button.dataset.productModel);return;}
 if(!productEditor)return;
 if(button.hasAttribute('data-product-cancel')){productEditor=null;renderCatalog();return;}
 if(button.hasAttribute('data-product-preview')){productEditor.previewIndex=Number(button.dataset.productPreview);productEditor.previewOpen=true;const details=button.closest('form').querySelector('.product-preview-options');details.open=true;productPreviewUpdate();return;}
 if(button.hasAttribute('data-product-drop')){if(productEditor.rows.length<=1)return;productEditor.rows.splice(Number(button.dataset.productDrop),1);productEditor.previewIndex=Math.min(productEditor.previewIndex,productEditor.rows.length-1);renderCatalog();return;}
 if(button.hasAttribute('data-product-add')){
  if(productEditor.rows.length>=300)return;
  const row=freshRow(productEditor.categoryId,productEditor.model),last=productEditor.rows.at(-1);
  row.number=String(Math.max(0,...data.equipment.filter(e=>e.model===productEditor.model).map(e=>Number(e.number)||0),...productEditor.rows.map(e=>Number(e.number)||0))+1).padStart(2,'0');
  row.line=last.line;row.plateSlots=structuredClone(last.plateSlots);productEditor.rows.push(row);renderCatalog();return;
 }
 if(button.hasAttribute('data-product-apply')){
  const form=button.closest('form'),common=productEditor.common;
  try{
   const rows=structuredClone(productEditor.rows);
   for(const row of rows){
    if(common.line!=='__keep__')row.line=common.line;if(common.installed)row.installed=common.installed;
    if(common.field1!=='__keep__')productSlot(row,0,common.field1);
    if(common.field2!=='__keep__')productSlot(row,1,common.field2);
    if(new Set(row.plateSlots.map(f=>f.fieldId)).size!==row.plateSlots.length)throw Error('Select different fields');
   }
   productEditor.rows=rows;renderCatalog();
  }catch(err){form.querySelector('.product-settings-error').textContent=err.message;}
 }
});
document.addEventListener('submit',async event=>{
 const form=event.target;if(!form.matches('.product-settings-form')||!productEditor)return;event.preventDefault();
 const buttons=[...form.querySelectorAll('button')],controls=[...form.querySelectorAll('input,select')],error=form.querySelector('.product-settings-error'),draft=productEditor,print=event.submitter?.value==='print';
 if(buttons.some(b=>b.dataset.saving==='1'))return;
 const submit=event.submitter||form.querySelector('button[type=submit]');submit.dataset.saving='1';buttons.forEach(b=>b.disabled=true);controls.forEach(el=>el.disabled=true);error.textContent='';
 try{
  const rows=draft.rows.map(row=>({id:row.id||null,number:row.number,line:row.line,installed:row.installed,size:row.size||'S',plateSlots:row.plateSlots}));
  const result=await api('/product/settings',json({revision:draft.revision,requestId:draft.requestId,create:!!draft.isNew,categoryId:draft.categoryId,model:draft.model,cleaningIntervalDays:draft.interval,rows}));
  const ids=result.savedIds;delete result.savedIds;data=result;if(draft.isNew){expandedCategories.add(draft.categoryId);$('filter').value='';$('line-filter').value='';$('cleaning-filter').value='all';$('search').value='';}productEditor=null;render();message(`${ids.length} units · Product settings saved`,false);
  if(print)printOpen(data.equipment.filter(e=>ids.includes(e.id)));
 }catch(err){error.textContent=err.message;buttons.forEach(b=>b.disabled=false);controls.forEach(el=>el.disabled=false);delete submit.dataset.saving;}
});

load().then(()=>{const item=current();if(item&&!isMobileDevice())document.getElementById('equipment-panel-'+item.id)?.scrollIntoView({block:'center'});});
})();
