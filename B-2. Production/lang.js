/* B-2 Production — i18n (TH / EN / KO)  default: TH */
(function(){
const TR = {
TH:{
  home:'← หน้าหลัก', today:'วันนี้',
  connecting:'กำลังเชื่อมต่อ', connected:'เชื่อมต่อแล้ว', disconnected:'ขาดการเชื่อมต่อ',
  cancel:'ยกเลิก', save:'บันทึก', add:'เพิ่ม', delete:'ลบ', edit:'แก้ไข',
  close:'ปิด', back:'‹ ย้อนกลับ', noRecords:'ไม่มีข้อมูล', total:'รวม',
  dayShift:'☀ กะกลางวัน', nightShift:'🌙 กะกลางคืน',
  dayShiftLabel:'กะกลางวัน ☀', nightShiftLabel:'กะกลางคืน 🌙',
  // table
  productionTitle:'Production',
  calendarTitle:'เปิดปฏิทิน', auto:'อัตโนมัติ',
  qrBtn:'🖨️ QR', excelBtn:'📥 Excel', statsBtn:'📊 สถิติ', adminBtn:'⚙ จัดการ',
  totalProd:'ยอดผลิตรวม', s1Total:'S1 รวม', s2Total:'S2 รวม', avgPerH:'Avg/h',
  colLine:'ไลน์', colModel:'โมเดล', colDailyTotal:'รวมวันนี้', colAvg:'Avg/h',
  slideAfternoon:'→ เลื่อนดูช่วงบ่าย', slideMorning:'← เลื่อนดูช่วงเช้า',
  excelPreview:'ตัวอย่าง Excel', allLines:'ทุกไลน์', download:'⬇ ดาวน์โหลด',
  noRecordsTable:'ไม่มีข้อมูล', subtotal:'รวม',
  domDays:['อา','จ','อ','พ','พฤ','ศ','ส'],
  months:['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],
  // input
  selectModel:'เลือกโมเดล →', todayRecords:'บันทึกวันนี้',
  noTodayRecords:'ยังไม่มีข้อมูลวันนี้',
  register:'บันทึก', update:'บันทึกการแก้ไข', editing:'กำลังแก้ไข', clear:'ล้าง',
  registerConfirm:'ยืนยันการบันทึก', updateConfirm:'ยืนยันการแก้ไข',
  confirmSlotHint:'ตรวจสอบช่วงเวลาแล้วกดบันทึก',
  lineProcess:'ไลน์ / กระบวนการ', timeSlot:'ช่วงเวลา', shift:'กะ',
  model:'โมเดล', qty:'จำนวน', remark:'หมายเหตุ', remarkPlaceholder:'หมายเหตุ (ไม่จำเป็น)',
  selectPlant:'เลือกแผนก', modelSelect:'เลือกโมเดล',
  searchAllModels:'ค้นหาโมเดลทั้งหมด...',
  noPlants:'ไม่มีแผนกที่ลงทะเบียน', noModels:'ไม่มีโมเดลที่ลงทะเบียน',
  noSearchResults:'ไม่พบผลการค้นหา',
  directInput:'✏️ กรอกตรง', directInputTitle:'กรอกโมเดลโดยตรง',
  directModelPlaceholder:'ชื่อโมเดล (ครั้งเดียว)...', directConfirm:'ยืนยัน',
  favorites:'⭐ รายการโปรด', allModels:'โมเดลทั้งหมด', modelsCount:'โมเดล',
  serverDisconnected:'เซิร์ฟเวอร์ขาดการเชื่อมต่อ — กำลังเชื่อมต่อใหม่...',
  toastAdded:'✓ บันทึกแล้ว', toastUpdated:'✓ แก้ไขแล้ว',
  alertDisconnected:'เซิร์ฟเวอร์ขาดการเชื่อมต่อ',
  editBtn:'แก้ไข',
  // stats
  statsTitle:'สถิติการผลิต', backToProd:'← การผลิต',
  daily:'รายวัน', weekly:'รายสัปดาห์', monthly:'รายเดือน',
  viewAll:'ภาพรวม (L.1–L.7)', viewByLine:'แยกตามไลน์', viewByProduct:'แยกตามโมเดล',
  top5most:'โมเดลยอดนิยม TOP 5', top5least:'โมเดลน้อยสุด TOP 5',
  loading:'กำลังโหลด...', totalSum:'ยอดรวมทั้งหมด',
  // admin
  adminTitle:'จัดการ Production', backToDash:'← แดชบอร์ด',
  tabPlant:'🏭 แผนก / โมเดล', tabLines:'⚙️ ไลน์ / กระบวนการ', tabQR:'📱 QR Code',
  lineList:'รายการไลน์', linesAddHint:'ระบุกระบวนการโดยคั่นด้วยจุลภาค เช่น S1, S2 หรือ S1, T/U, FT',
  tblDisplayTitle:'📊 ไลน์ในตารางผลิต (10 แถว)', tblSave:'💾 บันทึก',
  tblHint:'แถว 1–8: หลัก  |  แถว 9–10: พิเศษ',
  tblMainGroup:'แถว 1–8  (หลัก)', tblExtraGroup:'แถว 9–10  (พิเศษ)',
  tblSaveToast:'✅ บันทึกแล้ว — รีเฟรชตารางผลิต',
  serverFile:'ไฟล์บนเซิร์ฟเวอร์',
  autoSync:'เมื่อเพิ่ม·แก้ไข·ลบจากเว็บ ไฟล์นี้จะ <b>ซิงค์อัตโนมัติ</b>',
  excelEditNote:'แก้ไขผ่าน Excel โดยตรง แล้วรีสตาร์ทเซิร์ฟเวอร์เพื่ออัปเดต',
  colPlantName:'A — ชื่อแผนก', colModelName:'B — ชื่อโมเดล', colCapa:'C — CAPA (จำนวน/ชม.)',
  excelNote:'※ กรอกเฉพาะคอลัมน์ A·B·C เมื่ออัปโหลดจะรวมกับข้อมูลเดิม',
  uploadMerge:'กรอก A·B·C แล้วอัปโหลด ระบบจะรวมข้อมูลอัตโนมัติ',
  addPlant:'เพิ่มแผนก', plantNamePlaceholder:'ชื่อแผนก',
  modelsCountLabel:'โมเดล', moveUp:'ขึ้น', moveDown:'ลง', rename:'เปลี่ยนชื่อ',
  modelNamePlaceholder:'ชื่อโมเดล', capaPlaceholder:'CAPA/ชม.',
  confirmDeletePlant:'ต้องการลบแผนกและโมเดลทั้งหมดหรือไม่?',
  confirmDeleteModel:'ต้องการลบโมเดลนี้หรือไม่?',
  selectLine:'เลือกไลน์', process:'กระบวนการ',
  qrHint:'เลือกไลน์เพื่อสร้าง QR Code',
  openInput:'🔗 เปิดหน้าบันทึก', downloadPNG:'⬇ ดาวน์โหลด PNG',
  shareToLine:'แชร์ไป Line',
  toastDownloading:'กำลังดาวน์โหลด plants.xlsx',
  toastUploaded:'✓ อัปโหลดสำเร็จ', toastUploadFail:'อัปโหลดล้มเหลว',
  // lines
  linesTitle:'ตั้งค่าไลน์', lineSubtitle:'จัดการลำดับ ชื่อ และกระบวนการ',
  saveHint:'กดปุ่ม <b>บันทึก</b> หลังแก้ไขเพื่อให้มีผล',
  restoreDefaults:'คืนค่าเริ่มต้น', addLine:'+ เพิ่มไลน์', saveBtn:'💾 บันทึก',
  addNewLine:'เพิ่มไลน์ใหม่', lineName:'ชื่อไลน์', lineNamePlaceholder:'เช่น L.10',
  group:'กลุ่ม', groupPlaceholder:'เช่น Main Line', processLabel:'กระบวนการ',
  noLinesInGroup:'ไม่มีไลน์ในกลุ่มนี้', groupLabel:'กลุ่ม:',
  confirmDeleteLine:'ต้องการลบไลน์ "{name}" หรือไม่?',
  confirmRestore:'คืนค่าตั้งค่าไลน์เริ่มต้นหรือไม่?',
  toastLineAdded:'เพิ่มไลน์แล้ว — กดบันทึกเพื่อให้มีผล',
  toastSaved:'✓ บันทึกแล้ว', toastRestored:'คืนค่าเริ่มต้นแล้ว',
  alertLineName:'กรุณาใส่ชื่อไลน์', alertLineProcess:'กรุณาเลือก S1 หรือ S2 อย่างน้อยหนึ่งอย่าง',
},
EN:{
  home:'← Home', today:'Today',
  connecting:'Connecting', connected:'Connected', disconnected:'Disconnected',
  cancel:'Cancel', save:'Save', add:'Add', delete:'Delete', edit:'Edit',
  close:'Close', back:'‹ Back', noRecords:'No records', total:'Total',
  dayShift:'☀ Day Shift', nightShift:'🌙 Night Shift',
  dayShiftLabel:'Day Shift ☀', nightShiftLabel:'Night Shift 🌙',
  productionTitle:'Production',
  calendarTitle:'Open calendar', auto:'Auto',
  qrBtn:'🖨️ QR', excelBtn:'📥 Excel', statsBtn:'📊 Stats', adminBtn:'⚙ Admin',
  totalProd:'Total Prod', s1Total:'S1 Total', s2Total:'S2 Total', avgPerH:'Avg/h',
  colLine:'Line', colModel:'Model', colDailyTotal:'Daily Total', colAvg:'Avg/h',
  slideAfternoon:'→ Slide for afternoon', slideMorning:'← Slide for morning',
  excelPreview:'Excel Preview', allLines:'All Lines', download:'⬇ Download',
  noRecordsTable:'No records', subtotal:'Sub',
  domDays:['Su','Mo','Tu','We','Th','Fr','Sa'],
  months:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  selectModel:'Select model →', todayRecords:"Today's Records",
  noTodayRecords:'No records today',
  register:'Submit', update:'Update', editing:'Editing', clear:'Clear',
  registerConfirm:'Confirm Submit', updateConfirm:'Confirm Update',
  confirmSlotHint:'Check time slot and submit',
  lineProcess:'Line / Process', timeSlot:'Time Slot', shift:'Shift',
  model:'Model', qty:'Qty', remark:'Remark', remarkPlaceholder:'Remark (optional)',
  selectPlant:'Select Plant', modelSelect:'Select Model',
  searchAllModels:'Search all models...',
  noPlants:'No plants registered', noModels:'No models registered',
  noSearchResults:'No results found',
  directInput:'✏️ Direct Input', directInputTitle:'Enter Model Directly',
  directModelPlaceholder:'Model name (one-time)...', directConfirm:'Confirm',
  favorites:'⭐ Favorites', allModels:'All Models', modelsCount:'models',
  serverDisconnected:'Server disconnected — Reconnecting...',
  toastAdded:'✓ Submitted', toastUpdated:'✓ Updated',
  alertDisconnected:'Server connection lost',
  editBtn:'Edit',
  statsTitle:'Production Stats', backToProd:'← Production',
  daily:'Daily', weekly:'Weekly', monthly:'Monthly',
  viewAll:'Overall (L.1–L.7)', viewByLine:'By Line', viewByProduct:'By Model',
  top5most:'Top 5 Models', top5least:'Bottom 5 Models',
  loading:'Loading...', totalSum:'Grand Total',
  adminTitle:'Production Admin', backToDash:'← Dashboard',
  tabPlant:'🏭 Plant / Model', tabLines:'⚙️ Lines / Process', tabQR:'📱 QR Code',
  lineList:'Line List', linesAddHint:'Separate processes with commas, e.g. S1, S2 or S1, T/U, FT',
  tblDisplayTitle:'📊 Lines in Table (10 rows)', tblSave:'💾 Save',
  tblHint:'Rows 1–8: Main  |  Rows 9–10: Extra',
  tblMainGroup:'Rows 1–8  (Main)', tblExtraGroup:'Rows 9–10  (Extra)',
  tblSaveToast:'✅ Saved — refresh production table',
  serverFile:'Server File',
  autoSync:'Adding/editing/deleting from web <b>auto-syncs</b> this file.',
  excelEditNote:'Edit directly in Excel then restart server to apply.',
  colPlantName:'A — Plant Name', colModelName:'B — Model Name', colCapa:'C — CAPA (qty/h)',
  excelNote:'※ Fill columns A·B·C only. Upload merges with existing data.',
  uploadMerge:'Fill A·B·C then upload — auto-merged.',
  addPlant:'Add Plant', plantNamePlaceholder:'Plant name',
  modelsCountLabel:'models', moveUp:'Up', moveDown:'Down', rename:'Rename',
  modelNamePlaceholder:'Model name', capaPlaceholder:'CAPA/h',
  confirmDeletePlant:'Delete this plant and all its models?',
  confirmDeleteModel:'Delete this model?',
  selectLine:'Select Line', process:'Process',
  qrHint:'Select a line to generate QR Code',
  openInput:'🔗 Open Input', downloadPNG:'⬇ Download PNG',
  shareToLine:'Share to Line',
  toastDownloading:'Downloading plants.xlsx',
  toastUploaded:'✓ Upload complete', toastUploadFail:'Upload failed',
  linesTitle:'Line Settings', lineSubtitle:'Manage order, name & process',
  saveHint:'Click <b>Save</b> after changes to apply.',
  restoreDefaults:'Restore Defaults', addLine:'+ Add Line', saveBtn:'💾 Save',
  addNewLine:'Add New Line', lineName:'Line Name', lineNamePlaceholder:'e.g. L.10',
  group:'Group', groupPlaceholder:'e.g. Main Line', processLabel:'Process',
  noLinesInGroup:'No lines in this group', groupLabel:'Group:',
  confirmDeleteLine:'Delete line "{name}"?',
  confirmRestore:'Restore default line configuration?',
  toastLineAdded:'Line added — click Save to apply',
  toastSaved:'✓ Saved', toastRestored:'Restored to defaults',
  alertLineName:'Please enter a line name.',
  alertLineProcess:'Please select at least S1 or S2.',
},
KO:{
  home:'← 홈', today:'오늘',
  connecting:'연결중', connected:'연결됨', disconnected:'연결 끊김',
  cancel:'취소', save:'저장', add:'추가', delete:'삭제', edit:'수정',
  close:'닫기', back:'‹ 뒤로', noRecords:'기록 없음', total:'합계',
  dayShift:'☀ 주간', nightShift:'🌙 야간',
  dayShiftLabel:'주간 ☀', nightShiftLabel:'야간 🌙',
  productionTitle:'Production',
  calendarTitle:'달력 열기', auto:'자동',
  qrBtn:'🖨️ QR', excelBtn:'📥 Excel', statsBtn:'📊 통계', adminBtn:'⚙ 관리',
  totalProd:'총 생산', s1Total:'S1 합계', s2Total:'S2 합계', avgPerH:'Avg/h',
  colLine:'라인', colModel:'모델', colDailyTotal:'일일 합계', colAvg:'Avg/h',
  slideAfternoon:'→ 슬라이드하여 오후 시간대 보기', slideMorning:'← 슬라이드하여 오전 시간대 보기',
  excelPreview:'Excel 미리보기', allLines:'전체 라인', download:'⬇ 다운로드',
  noRecordsTable:'기록이 없습니다.', subtotal:'소계',
  domDays:['일','월','화','수','목','금','토'],
  months:['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  selectModel:'모델을 선택하세요 →', todayRecords:'오늘 기록',
  noTodayRecords:'오늘 등록된 기록이 없습니다',
  register:'등록하기', update:'수정하기', editing:'수정 중', clear:'초기화',
  registerConfirm:'등록 확인', updateConfirm:'수정 확인',
  confirmSlotHint:'시간대를 확인하고 등록하세요.',
  lineProcess:'라인 / 공정', timeSlot:'시간대', shift:'교대',
  model:'모델', qty:'수량', remark:'Remark', remarkPlaceholder:'비고 (선택)',
  selectPlant:'Plant 선택', modelSelect:'모델 선택',
  searchAllModels:'전체 모델 검색...',
  noPlants:'등록된 Plant가 없습니다.', noModels:'등록된 모델이 없습니다.',
  noSearchResults:'검색 결과가 없습니다.',
  directInput:'✏️ 직접 입력', directInputTitle:'모델 직접 입력',
  directModelPlaceholder:'모델명 (1회성)...', directConfirm:'확인',
  favorites:'⭐ 즐겨찾기', allModels:'전체 모델', modelsCount:'개 모델',
  serverDisconnected:'서버 연결 끊김 — 재연결 중...',
  toastAdded:'✓ 등록 완료', toastUpdated:'✓ 수정 완료',
  alertDisconnected:'서버 연결이 끊겼습니다.',
  editBtn:'수정',
  statsTitle:'생산 통계', backToProd:'← 생산 현황',
  daily:'일간', weekly:'주간', monthly:'월간',
  viewAll:'전체 (L.1–L.7)', viewByLine:'라인별', viewByProduct:'제품별',
  top5most:'최다 모델 TOP 5', top5least:'최소 모델 TOP 5',
  loading:'로딩 중...', totalSum:'합계',
  adminTitle:'Production 관리', backToDash:'← 대시보드',
  tabPlant:'🏭 Plant / 모델', tabLines:'⚙️ 라인 / 공정', tabQR:'📱 QR 코드',
  lineList:'라인 목록', linesAddHint:'공정을 쉼표로 구분하세요. 예: S1, S2 또는 S1, T/U, FT',
  tblDisplayTitle:'📊 생산표 라인 (10행)', tblSave:'💾 저장',
  tblHint:'1–8행: 메인  |  9–10행: 별도',
  tblMainGroup:'1–8행  (메인)', tblExtraGroup:'9–10행  (별도)',
  tblSaveToast:'✅ 저장 완료 — 생산표 새로고침 필요',
  serverFile:'서버 저장 파일',
  autoSync:'웹에서 추가·수정·삭제하면 이 파일이 <b>자동으로 동기화</b>됩니다.',
  excelEditNote:'엑셀로 직접 편집 후 서버 재시작 시 반영됩니다.',
  colPlantName:'A — Plant 명', colModelName:'B — 모델 명', colCapa:'C — CAPA (수량/h)',
  excelNote:'※ A·B·C 열만 작성하면 됩니다. 업로드 시 기존 Plant/모델과 병합됩니다.',
  uploadMerge:'A·B·C열만 작성 후 업로드하면 자동 병합됩니다.',
  addPlant:'Plant 추가', plantNamePlaceholder:'Plant 이름',
  modelsCountLabel:'개 모델', moveUp:'위로', moveDown:'아래로', rename:'이름 변경',
  modelNamePlaceholder:'모델명', capaPlaceholder:'CAPA/h',
  confirmDeletePlant:'이 Plant와 모델을 모두 삭제하시겠습니까?',
  confirmDeleteModel:'모델을 삭제하시겠습니까?',
  selectLine:'라인 선택', process:'공정',
  qrHint:'라인을 선택하면 QR 코드가 생성됩니다.',
  openInput:'🔗 입력창 열기', downloadPNG:'⬇ PNG 다운로드',
  shareToLine:'Line으로 공유',
  toastDownloading:'plants.xlsx 다운로드 시작',
  toastUploaded:'✓ 업로드 완료', toastUploadFail:'업로드 실패',
  linesTitle:'라인 설정', lineSubtitle:'순서·이름·공정 관리',
  saveHint:'변경 후 <b>저장</b>을 눌러야 반영됩니다.',
  restoreDefaults:'기본값 복원', addLine:'+ 라인 추가', saveBtn:'💾 저장',
  addNewLine:'새 라인 추가', lineName:'라인 이름', lineNamePlaceholder:'예: L.10',
  group:'그룹', groupPlaceholder:'예: 메인 라인', processLabel:'공정',
  noLinesInGroup:'이 그룹에 라인이 없습니다.', groupLabel:'그룹:',
  confirmDeleteLine:'"{name}" 라인을 삭제하시겠습니까?',
  confirmRestore:'기본 라인 설정으로 복원하시겠습니까?',
  toastLineAdded:'라인 추가됨 — 저장 버튼을 눌러 반영하세요.',
  toastSaved:'✓ 저장 완료', toastRestored:'기본값으로 복원되었습니다.',
  alertLineName:'라인 이름을 입력하세요.',
  alertLineProcess:'S1 또는 S2 중 하나 이상 선택하세요.',
}
};

const KEY = 'prod_lang';
window.LANG = localStorage.getItem(KEY) || 'TH';

window.t = function(k){ return (TR[window.LANG]||TR.TH)[k] || (TR.KO[k]||k); };

window.setLang = function(l){
  window.LANG = l;
  localStorage.setItem(KEY, l);
  document.documentElement.lang = l==='TH'?'th':l==='EN'?'en':'ko';
  applyLang();
  if(typeof window.onLangChange==='function') window.onLangChange();
};

window.applyLang = function(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k = el.getAttribute('data-i18n');
    const v = t(k);
    if(el.tagName==='INPUT'||el.tagName==='TEXTAREA') el.placeholder=v;
    else if(el.hasAttribute('data-i18n-html')) el.innerHTML=v;
    else el.textContent=v;
  });
  // update dropdown active states
  document.querySelectorAll('.ldrop-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.lang===window.LANG);
  });
  // update lang badge if present
  const badge=document.getElementById('lang-badge');
  if(badge) badge.textContent=window.LANG;
};

/* ── lang cycle (click to rotate TH → EN → KO → TH) ── */
window.cycleLang = function(){
  const order = ['TH','EN','KO'];
  const next = order[(order.indexOf(window.LANG)+1) % order.length];
  setLang(next);
  // briefly flash the title badge so user sees the change
  const badge = document.getElementById('lang-badge');
  if(badge){ badge.classList.add('pop'); setTimeout(()=>badge.classList.remove('pop'),300); }
};

(function(){
  const CSS=`
#lang-badge{
  display:inline-block;margin-left:5px;padding:1px 6px;
  border-radius:6px;font-size:10px;font-weight:800;vertical-align:middle;
  background:var(--accent,#0D9488);color:#fff;letter-spacing:.03em;
  transition:transform .15s;
}
#lang-badge.pop{transform:scale(1.35);}
`;
  const style=document.createElement('style');style.textContent=CSS;
  document.head.appendChild(style);

  // inject badge into the clickable title after DOM ready
  document.addEventListener('DOMContentLoaded',()=>{
    const trigger=document.querySelector('[data-lang-trigger]');
    if(!trigger) return;
    const badge=document.createElement('span');
    badge.id='lang-badge';
    badge.textContent=window.LANG;
    trigger.appendChild(badge);
  });
})();

document.addEventListener('DOMContentLoaded', ()=>applyLang());
})();
