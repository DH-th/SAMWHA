/* B-4 Improvement 다국어 (TH / EN / KO) */
(function(){
  const KEY='impr_lang';
  const TR={
    TH:{
      home:'← หน้าหลัก', title:'กิจกรรมปรับปรุง', connecting:'กำลังเชื่อมต่อ', connected:'เชื่อมต่อแล้ว', disconnected:'ขาดการเชื่อมต่อ',
      newActivity:'+ กิจกรรมใหม่', activityTitle:'ชื่อกิจกรรม', category:'หมวดหมู่', description:'รายละเอียด', activityDate:'วันที่กิจกรรม (แผน)',
      beforePhotos:'รูปก่อนปรับปรุง (Before)', afterPhotos:'รูปหลังปรับปรุง (After)',
      dragDropHint:'แตะเพื่อเลือกรูป หรือ ลากมาวาง (สูงสุด 30 รูป)', photoCount:'รูป',
      save:'บันทึก', cancel:'ยกเลิก', submit:'บันทึกกิจกรรม', delete:'ลบ', edit:'แก้ไข', close:'ปิด',
      statusPlanned:'⏳ กำลังดำเนินการ', statusCompleted:'✅ เสร็จสมบูรณ์',
      filterAll:'ทั้งหมด', filterPlanned:'กำลังดำเนินการ', filterCompleted:'เสร็จแล้ว', filterFavorites:'⭐ รายการโปรด', toggleFavorite:'รายการโปรด',
      searchPlaceholder:'🔍 ค้นหาชื่อกิจกรรม...', noActivities:'ยังไม่มีกิจกรรมปรับปรุง',
      viewDetail:'ดูรายละเอียด', registerAfter:'📸 ลงทะเบียนรูป After',
      reportMode:'📄 โหมดรายงาน', printReport:'🖨️ พิมพ์รายงาน',
      confirmDelete:'ลบกิจกรรมนี้? (ตารางแผนที่เชื่อมโยงจะถูกลบด้วย)', toastSaved:'✓ บันทึกแล้ว', toastDeleted:'ลบแล้ว', toastUploading:'กำลังอัปโหลดรูป...',
      totalCount:'กิจกรรมทั้งหมด', inProgressCount:'กำลังดำเนินการ', completedCount:'เสร็จสมบูรณ์', thisMonthCount:'เดือนนี้',
      beforeLabel:'BEFORE', afterLabel:'AFTER', dragToCompare:'ลากเพื่อเปรียบเทียบ',
      requirePhotoBefore:'กรุณาอัปโหลดรูป Before อย่างน้อย 1 รูป', requireTitle:'กรุณากรอกชื่อกิจกรรม', requireDate:'กรุณาเลือกวันที่กิจกรรม',
      catSafety:'ความปลอดภัย', catQuality:'คุณภาพ', catProductivity:'ผลผลิต', cat5S:'5ส', catEquipment:'เครื่องจักร', catOther:'อื่นๆ',
      removePhoto:'ลบรูปนี้', maxPhotoMsg:'สูงสุด 30 รูปต่อชุด',
      createdOn:'สร้างเมื่อ', plannedDate:'วันแผน', completedDate:'วันเสร็จ', line:'ไลน์',
      noPhotos:'ยังไม่มีรูปภาพ', allCategories:'ทุกหมวดหมู่',
    /* Quick modal */
    qSubType:'ประเภท', qPosition:'กำหนดตำแหน่ง — แตะบนแผนผังเพื่อระบุจุด',
    qProblem:'มีปัญหาอะไร?', qPlaceholder:'เช่น: น้ำมันรั่วบนพื้น Line 3 ทางออก',
    qBeforePhoto:'รูปปัญหา (Before)', qSubmit:'ลงทะเบียน', qCancel:'ยกเลิก',
    /* Personnel */
    personnelTitle:'👤 จัดการรายชื่อผู้รับผิดชอบ', myDeviceUser:'📱 ผู้ใช้อุปกรณ์นี้ — ฉันคือใคร?',
    empNo:'รหัสพนักงาน', empName:'ชื่อ', addPerson:'เพิ่ม',
    ppEmpty:'ยังไม่มีรายชื่อ', ppNoSelect:'-- ไม่ระบุ --',
    ppHintSet:'✅ อุปกรณ์นี้ตั้งค่าเป็น "{name}" แล้ว — จะถูกบันทึกเป็นผู้รับผิดชอบอัตโนมัติ',
    ppHintUnset:'ยังไม่ได้ตั้งค่า กรุณาเลือกชื่อก่อนบันทึก After',
    ppDeviceSet:'ตั้งค่าผู้รับผิดชอบแล้ว', ppDeviceUnset:'ยกเลิกการตั้งค่าแล้ว',
    ppInputRequired:'กรุณากรอกรหัสพนักงานและชื่อ',
    ppDeleteConfirm:'ลบ "{name}" ออกจากรายชื่อ?',
    ppNoThisMonth:'ยังไม่มีบันทึกการดำเนินการเดือนนี้',
    /* Layout */
    layoutTitle:'🗺 จัดการแผนผังพื้นที่', layoutUpload:'🖼 อัปโหลด / เปลี่ยนรูปแผนผัง',
    layoutHint:'📐 ขนาดแนะนำ: <b>แนวนอน 1600 × 900 px (16:9)</b> — ขั้นต่ำ 1200 × 675 ขึ้นไป, JPG ≤ 1 MB<br>ถ้าใหญ่กว่า 1600 px เซิร์ฟเวอร์จะย่อให้อัตโนมัติ',
    layoutUploaded:'อัปโหลดแผนผังสำเร็จ', uploadFailed:'อัปโหลดล้มเหลว',
    layoutEmpty:'ยังไม่มีรูปแผนผัง<br>กรุณาอัปโหลดแผนผังพื้นที่ด้านบน',
    noLayoutImg:'ยังไม่มีรูปแผนผัง — กรุณาอัปโหลดที่ 🗺 ด้านบนก่อน',
    /* Points */
    pointsTitle:'🏆 อันดับการดำเนินการเดือนนี้',
    /* Header tooltips */
    ttRanking:'อันดับการดำเนินการ', ttPersonnel:'จัดการรายชื่อผู้รับผิดชอบ', ttLayout:'จัดการแผนผังพื้นที่',
    /* Dept subtitles */
    quickSub:'แก้ไขทันทีในพื้นที่', planSub:'กิจกรรมปรับปรุงประจำ',
    /* Fullscreen */
    fsBtn:'⛶ เต็มหน้าจอ',
    /* Urgency */
    urgDanger:'🔴 เร่งด่วน', urgCaution:'🟠 ระวัง', urgOk:'⏳ รอดำเนินการ',
    urgDangerDetail:'🔴 เร่งด่วน — ต้องแก้ไขทันที', urgCautionDetail:'🟠 ระวัง — ใกล้เกินกำหนด',
    /* Card / detail */
    posTag:'📍 ระบุตำแหน่ง', completedPrefix:'เสร็จ',
    createdLabel:'สร้าง:', completedLabel:'เสร็จ:', processorLabel:'ผู้รับผิดชอบ:',
    processorRecorded:'บันทึก <b style="color:var(--accent)">{name} ({empNo})</b> เป็นผู้รับผิดชอบ',
    processorNotSet:'⚠️ ยังไม่ได้ตั้งค่าผู้รับผิดชอบ กรุณา<a href="#" onclick="closeAfterModal();openPersonnelModal();return false" style="color:#DC2626;font-weight:900">ตั้งค่าก่อน</a>',
    processorRequired:'กรุณาตั้งค่าผู้รับผิดชอบก่อน',
    positionRequired:'กรุณาแตะบนแผนผังเพื่อระบุตำแหน่ง',
    /* Load more */
    loadMore:'ดูเพิ่มเติม', remaining:'รายการที่เหลือ',
    /* Confirm delete simple (Quick - no B-1 link) */
    confirmDeleteQuick:'ลบกิจกรรมนี้?',
    /* Time elapsed */
    hoursElapsed:'{h} ชม. {m} นาทีที่แล้ว', minsElapsed:'{m} นาทีที่แล้ว',
    },
    EN:{
      home:'← Home', title:'Improvement Activities', connecting:'Connecting', connected:'Connected', disconnected:'Disconnected',
      newActivity:'+ New Activity', activityTitle:'Activity Title', category:'Category', description:'Description', activityDate:'Planned Activity Date',
      beforePhotos:'Before Photos', afterPhotos:'After Photos',
      dragDropHint:'Tap to select or drag & drop photos (up to 30)', photoCount:'photos',
      save:'Save', cancel:'Cancel', submit:'Save Activity', delete:'Delete', edit:'Edit', close:'Close',
      statusPlanned:'⏳ In Progress', statusCompleted:'✅ Completed',
      filterAll:'All', filterPlanned:'In Progress', filterCompleted:'Completed', filterFavorites:'⭐ Favorites', toggleFavorite:'Favorite',
      searchPlaceholder:'🔍 Search activity title...', noActivities:'No improvement activities yet',
      viewDetail:'View Detail', registerAfter:'📸 Register After Photos',
      reportMode:'📄 Report Mode', printReport:'🖨️ Print Report',
      confirmDelete:'Delete this activity? (Linked schedule will also be removed)', toastSaved:'✓ Saved', toastDeleted:'Deleted', toastUploading:'Uploading photos...',
      totalCount:'Total Activities', inProgressCount:'In Progress', completedCount:'Completed', thisMonthCount:'This Month',
      beforeLabel:'BEFORE', afterLabel:'AFTER', dragToCompare:'Drag to compare',
      requirePhotoBefore:'Please upload at least 1 Before photo', requireTitle:'Please enter an activity title', requireDate:'Please select an activity date',
      catSafety:'Safety', catQuality:'Quality', catProductivity:'Productivity', cat5S:'5S', catEquipment:'Equipment', catOther:'Other',
      removePhoto:'Remove photo', maxPhotoMsg:'Up to 30 photos per set',
      createdOn:'Created', plannedDate:'Planned', completedDate:'Completed', line:'Line',
      noPhotos:'No photos yet', allCategories:'All Categories',
      qSubType:'Type', qPosition:'Set Position — tap on the map to mark a point',
      qProblem:'What is the problem?', qPlaceholder:'e.g. Oil spill on floor at Line 3 exit',
      qBeforePhoto:'Problem photo (Before)', qSubmit:'Register', qCancel:'Cancel',
      personnelTitle:'👤 Manage Personnel', myDeviceUser:'📱 This device user — Who am I?',
      empNo:'Emp No', empName:'Name', addPerson:'Add',
      ppEmpty:'No personnel registered', ppNoSelect:'-- Not selected --',
      ppHintSet:'✅ This device is set to \'{name}\'. Will be recorded automatically on After.',
      ppHintUnset:'Not set yet. Please select yourself before completing Quick/Plan.',
      ppDeviceSet:'Device user set', ppDeviceUnset:'Selection cleared',
      ppInputRequired:'Please enter employee number and name',
      ppDeleteConfirm:'Delete \'{name}\' from personnel?',
      ppNoThisMonth:'No completion records this month',
      layoutTitle:'🗺 Layout Management', layoutUpload:'🖼 Upload / Replace Layout Photo',
      layoutHint:'📐 Recommended size: <b>Landscape 1600 × 900 px (16:9)</b> — minimum 1200 × 675, JPG ≤ 1 MB<br>If larger than 1600 px, server will auto-resize.',
      layoutUploaded:'Layout photo uploaded', uploadFailed:'Upload failed',
      layoutEmpty:'No layout photo yet.<br>Please upload a site map using the button above.',
      noLayoutImg:'No layout photo — please register at 🗺 above first',
      pointsTitle:'🏆 Monthly Performance Ranking',
      ttRanking:'Monthly Ranking', ttPersonnel:'Manage Personnel', ttLayout:'Manage Site Layout',
      quickSub:'On-site Immediate Fix', planSub:'Scheduled Improvement',
      fsBtn:'⛶ Fullscreen',
      urgDanger:'🔴 Danger', urgCaution:'🟠 Caution', urgOk:'⏳ Pending',
      urgDangerDetail:'🔴 Danger — Immediate action required', urgCautionDetail:'🟠 Caution — Deadline approaching',
      posTag:'📍 Position set', completedPrefix:'Done',
      createdLabel:'Created:', completedLabel:'Completed:', processorLabel:'By:',
      processorRecorded:'Will be recorded as <b style="color:var(--accent)">{name} ({empNo})</b>.',
      processorNotSet:'⚠️ No device user set. <a href="#" onclick="closeAfterModal();openPersonnelModal();return false" style="color:#DC2626;font-weight:900">Set personnel first</a>.',
      processorRequired:'Please set your personnel identity first',
      positionRequired:'Tap on the layout map to set a position',
      loadMore:'Load more', remaining:' remaining',
      confirmDeleteQuick:'Delete this activity?',
      hoursElapsed:'{h}h {m}m elapsed', minsElapsed:'{m}m elapsed',
    },
    KO:{
      home:'← 홈', title:'개선활동', connecting:'연결 중', connected:'연결됨', disconnected:'연결 끊김',
      newActivity:'+ 새 활동 등록', activityTitle:'활동 타이틀', category:'분류', description:'설명', activityDate:'활동 날짜 (계획)',
      beforePhotos:'Before 사진', afterPhotos:'After 사진',
      dragDropHint:'눌러서 선택하거나 드래그해서 놓으세요 (최대 30장)', photoCount:'장',
      save:'저장', cancel:'취소', submit:'활동 등록', delete:'삭제', edit:'수정', close:'닫기',
      statusPlanned:'⏳ 진행중', statusCompleted:'✅ 완료',
      filterAll:'전체', filterPlanned:'진행중', filterCompleted:'완료', filterFavorites:'⭐ 즐겨찾기', toggleFavorite:'즐겨찾기',
      searchPlaceholder:'🔍 활동 제목 검색...', noActivities:'등록된 개선활동이 없습니다',
      viewDetail:'상세보기', registerAfter:'📸 After 사진 등록',
      reportMode:'📄 보고서 모드', printReport:'🖨️ 보고서 인쇄',
      confirmDelete:'이 활동을 삭제할까요? (연동된 B-1 일정도 함께 삭제됩니다)', toastSaved:'✓ 저장되었습니다', toastDeleted:'삭제되었습니다', toastUploading:'사진 업로드 중...',
      totalCount:'전체 활동', inProgressCount:'진행중', completedCount:'완료', thisMonthCount:'이번달',
      beforeLabel:'BEFORE', afterLabel:'AFTER', dragToCompare:'드래그하여 비교',
      requirePhotoBefore:'Before 사진을 1장 이상 등록해주세요', requireTitle:'활동 타이틀을 입력해주세요', requireDate:'활동 날짜를 선택해주세요',
      catSafety:'안전', catQuality:'품질', catProductivity:'생산성', cat5S:'5S', catEquipment:'설비', catOther:'기타',
      removePhoto:'사진 삭제', maxPhotoMsg:'세트당 최대 30장',
      createdOn:'등록일', plannedDate:'계획일', completedDate:'완료일', line:'라인',
      noPhotos:'등록된 사진이 없습니다', allCategories:'전체 분류',
      qSubType:'분류', qPosition:'위치 지정 — 레이아웃 사진 위를 눌러 포인트를 찍으세요',
      qProblem:'어떤 문제인가요?', qPlaceholder:'예: 3라인 출구 바닥에 기름 흘림',
      qBeforePhoto:'문제 사진 (Before)', qSubmit:'등록', qCancel:'취소',
      personnelTitle:'👤 처리자 명부 관리', myDeviceUser:'📱 이 기기의 사용자 — 나는 누구인가요?',
      empNo:'사번', empName:'이름', addPerson:'추가',
      ppEmpty:'등록된 처리자가 없습니다', ppNoSelect:'-- 선택 안 함 --',
      ppHintSet:'✅ 이 기기는 \'{name}\'님으로 지정되어 있습니다. After 등록 시 자동으로 처리자로 기록됩니다.',
      ppHintUnset:'아직 지정되지 않았습니다. Quick/Plan 완료 처리를 하려면 먼저 본인을 선택하세요.',
      ppDeviceSet:'이 기기의 처리자가 지정되었습니다', ppDeviceUnset:'지정이 해제되었습니다',
      ppInputRequired:'사번과 이름을 입력하세요',
      ppDeleteConfirm:'\'{name}\' 처리자를 삭제할까요?',
      ppNoThisMonth:'이달의 처리 기록이 없습니다',
      layoutTitle:'🗺 현장 레이아웃 관리', layoutUpload:'🖼 레이아웃 사진 업로드 / 교체',
      layoutHint:'📐 권장 사이즈: <b>가로형 1600 × 900 px (16:9)</b> — 최소 1200 × 675 이상, JPG 기준 1MB 이하.<br>1600px보다 크게 올려도 서버가 자동으로 1600px에 맞춰 줄여서 저장합니다.',
      layoutUploaded:'레이아웃 사진이 등록되었습니다', uploadFailed:'업로드 실패',
      layoutEmpty:'아직 레이아웃 사진이 없습니다.<br>위 버튼으로 현장 배치도 사진을 올려주세요.',
      noLayoutImg:'레이아웃 사진이 없습니다 — 상단 🗺에서 먼저 등록하세요',
      pointsTitle:'🏆 이달의 처리 순위',
      ttRanking:'이달의 처리 순위', ttPersonnel:'처리자 명부 관리', ttLayout:'현장 레이아웃 관리',
      quickSub:'현장 즉시개선', planSub:'정기 개선활동',
      fsBtn:'⛶ 전체화면',
      urgDanger:'🔴 경고', urgCaution:'🟠 주의', urgOk:'⏳ 대기중',
      urgDangerDetail:'🔴 경고 — 즉시 처리 필요', urgCautionDetail:'🟠 주의 — 곧 기한 초과',
      posTag:'📍 위치지정', completedPrefix:'완료',
      createdLabel:'등록:', completedLabel:'완료:', processorLabel:'처리자:',
      processorRecorded:'처리자로 <b style="color:var(--accent)">{name} ({empNo})</b>님이 기록됩니다.',
      processorNotSet:'⚠️ 이 기기의 처리자가 지정되지 않았습니다. <a href="#" onclick="closeAfterModal();openPersonnelModal();return false" style="color:#DC2626;font-weight:900">👤 처리자 관리에서 먼저 본인을 지정</a>하세요.',
      processorRequired:'처리자 관리에서 먼저 본인을 지정하세요',
      positionRequired:'레이아웃 사진을 눌러 위치를 지정하세요',
      loadMore:'더 보기', remaining:'개 남음',
      confirmDeleteQuick:'이 활동을 삭제할까요?',
      hoursElapsed:'{h}시간 {m}분 경과', minsElapsed:'{m}분 경과',
    }
  };
  window.LANG = window.LANG || localStorage.getItem(KEY) || 'TH';
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
    document.querySelectorAll('[data-i18n-title]').forEach(el=>{
      el.title=t(el.getAttribute('data-i18n-title'));
    });
    const badge=document.getElementById('lang-badge');
    if(badge) badge.textContent=window.LANG;
  };
  window.cycleLang = function(){
    setLang(window.LANG==='TH'?'KO':'TH');
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
