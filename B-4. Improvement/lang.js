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
