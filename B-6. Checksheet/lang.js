/* B-6 Checksheet 다국어 (TH / EN / KO) — B-2 패턴과 동일 */
(function(){
  const KEY='cs_lang';
  const TR={
    TH:{
      home:'← หน้าหลัก', title:'เช็คชีท', connecting:'กำลังเชื่อมต่อ', connected:'เชื่อมต่อแล้ว', disconnected:'ขาดการเชื่อมต่อ',
      today:'วันนี้', selectLine:'เลือกไลน์', selectSheet:'เลือกเช็คชีท',
      done:'เสร็จ', pending:'ค้าง', notApplicable:'-', ng:'NG',
      summary:'สรุป', totalSheets:'เช็คชีททั้งหมด', completed:'เสร็จแล้ว', remain:'คงเหลือ', ngCount:'พบ NG',
      statusBoard:'สถานะตามไลน์', line:'ไลน์', result:'ผล', checkedBy:'ผู้ตรวจ', remark:'หมายเหตุ',
      ok:'OK', na:'N/A', save:'บันทึก', submit:'ส่งบันทึก', cancel:'ยกเลิก', edit:'แก้ไข', del:'ลบ',
      item:'รายการตรวจ', value:'ค่า', spec:'สเปค', enterName:'ชื่อผู้ตรวจ', remarkOpt:'หมายเหตุ (ไม่บังคับ)',
      alreadyDone:'ตรวจแล้ววันนี้ — แตะเพื่อแก้ไข', noSheets:'ไม่มีเช็คชีทสำหรับไลน์นี้', noRecords:'ไม่มีข้อมูล',
      saved:'✓ บันทึกแล้ว', deleted:'ลบแล้ว', confirmDel:'ลบรายการนี้?', fillAll:'กรุณาตรวจให้ครบทุกรายการ',
      day:'กลางวัน', night:'กลางคืน', shift:'กะ', detail:'รายละเอียด', viewRecord:'ดูบันทึก',
      adminBtn:'⚙ ตั้งค่า', inputBtn:'✏️ บันทึกการตรวจ', dashBtn:'📊 สถานะ',
      tmplMgmt:'จัดการเช็คชีท', addSheet:'เพิ่มเช็คชีท', sheetCode:'รหัส', sheetName:'ชื่อเช็คชีท',
      applyLines:'ไลน์ที่ใช้ (คั่นด้วย ,)', items:'รายการตรวจ', addItem:'เพิ่มรายการ',
      typeCheck:'O/X', typeNumber:'ตัวเลข', unit:'หน่วย', saveSheet:'💾 บันทึกเช็คชีท', delSheet:'ลบเช็คชีท',
      progress:'ความคืบหน้า'
    },
    EN:{
      home:'← Home', title:'Checksheet', connecting:'Connecting', connected:'Connected', disconnected:'Disconnected',
      today:'Today', selectLine:'Select Line', selectSheet:'Select Checksheet',
      done:'Done', pending:'Pending', notApplicable:'-', ng:'NG',
      summary:'Summary', totalSheets:'Total Sheets', completed:'Completed', remain:'Remaining', ngCount:'NG Found',
      statusBoard:'Status by Line', line:'Line', result:'Result', checkedBy:'Checked by', remark:'Remark',
      ok:'OK', na:'N/A', save:'Save', submit:'Submit', cancel:'Cancel', edit:'Edit', del:'Delete',
      item:'Check Item', value:'Value', spec:'Spec', enterName:'Inspector name', remarkOpt:'Remark (optional)',
      alreadyDone:'Checked today — tap to edit', noSheets:'No checksheets for this line', noRecords:'No records',
      saved:'✓ Saved', deleted:'Deleted', confirmDel:'Delete this record?', fillAll:'Please check all items',
      day:'Day', night:'Night', shift:'Shift', detail:'Detail', viewRecord:'View record',
      adminBtn:'⚙ Setup', inputBtn:'✏️ Inspect', dashBtn:'📊 Status',
      tmplMgmt:'Manage Checksheets', addSheet:'Add Checksheet', sheetCode:'Code', sheetName:'Sheet name',
      applyLines:'Lines (comma separated)', items:'Check items', addItem:'Add item',
      typeCheck:'O/X', typeNumber:'Number', unit:'Unit', saveSheet:'💾 Save Sheet', delSheet:'Delete Sheet',
      progress:'Progress'
    },
    KO:{
      home:'← 홈', title:'체크시트', connecting:'연결 중', connected:'연결됨', disconnected:'연결 끊김',
      today:'오늘', selectLine:'라인 선택', selectSheet:'체크시트 선택',
      done:'완료', pending:'미완료', notApplicable:'-', ng:'NG',
      summary:'요약', totalSheets:'전체 점검표', completed:'완료', remain:'미완료', ngCount:'NG 발생',
      statusBoard:'라인별 현황', line:'라인', result:'결과', checkedBy:'점검자', remark:'비고',
      ok:'OK', na:'해당없음', save:'저장', submit:'제출', cancel:'취소', edit:'수정', del:'삭제',
      item:'점검 항목', value:'값', spec:'기준', enterName:'점검자 이름', remarkOpt:'비고 (선택)',
      alreadyDone:'오늘 점검 완료 — 눌러서 수정', noSheets:'이 라인의 체크시트가 없습니다', noRecords:'기록 없음',
      saved:'✓ 저장됨', deleted:'삭제됨', confirmDel:'이 기록을 삭제할까요?', fillAll:'모든 항목을 점검해주세요',
      day:'주간', night:'야간', shift:'교대', detail:'상세', viewRecord:'기록 보기',
      adminBtn:'⚙ 설정', inputBtn:'✏️ 점검 입력', dashBtn:'📊 현황',
      tmplMgmt:'체크시트 관리', addSheet:'체크시트 추가', sheetCode:'코드', sheetName:'체크시트 이름',
      applyLines:'적용 라인 (쉼표 구분)', items:'점검 항목', addItem:'항목 추가',
      typeCheck:'O/X', typeNumber:'숫자', unit:'단위', saveSheet:'💾 체크시트 저장', delSheet:'체크시트 삭제',
      progress:'진행률'
    }
  };
  window.LANG = window.LANG || localStorage.getItem(KEY) || 'KO';
  window.t = function(k){ return (TR[window.LANG]||TR.KO)[k] || (TR.KO[k]||k); };
  window.setLang = function(l){
    window.LANG=l; localStorage.setItem(KEY,l);
    document.documentElement.lang = l==='TH'?'th':l==='EN'?'en':'ko';
    applyLang();
    if(typeof window.onLangChange==='function') window.onLangChange();
  };
  window.applyLang = function(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k=el.getAttribute('data-i18n'); const v=t(k);
      if(el.tagName==='INPUT'||el.tagName==='TEXTAREA') el.placeholder=v;
      else el.textContent=v;
    });
    const badge=document.getElementById('lang-badge');
    if(badge) badge.textContent=window.LANG;
  };
  window.cycleLang = function(){
    const order=['TH','EN','KO'];
    setLang(order[(order.indexOf(window.LANG)+1)%order.length]);
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const trig=document.querySelector('[data-lang-trigger]');
    if(trig && !document.getElementById('lang-badge')){
      const b=document.createElement('span');
      b.id='lang-badge'; b.textContent=window.LANG;
      b.style.cssText='margin-left:6px;font-size:11px;font-weight:800;background:rgba(0,0,0,.08);padding:2px 7px;border-radius:6px;';
      trig.appendChild(b);
    }
    applyLang();
  });
})();
