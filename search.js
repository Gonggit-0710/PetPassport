/* PawTrip 사이트 검색
   - 국가·항공사·귀국 검역: data.json을 그대로 읽어 색인 (규정을 고치면 검색도 자동 반영)
   - 국내 이동·항체가 검사 등 실제 주소 페이지: search-index.json (tools/build_pages.py가 생성)
   - 앱 기능(준비 루틴·펫 카드·SOS 등): 아래 APP 목록
   - 모두 브라우저 안에서 찾음. 검색어는 GA 'search' 이벤트로만 전송(개인정보처리방침 1항) */
(function(){
  'use strict';
  const APP = [
    {t:'항공편 선택', u:'/#flights', g:'준비하기', x:'목적지와 무게로 기내 위탁 가능한 항공사 찾기 단두종 확인 요금 연락처'},
    {t:'일정 계산', u:'/#plan', g:'준비하기', x:'출국일 역산 준비 일정 가장 빠른 출국일 항체가 채혈일 마이크로칩 접종 타임라인'},
    {t:'켄넬 적응 훈련', u:'/#prep', g:'준비하기 · 준비 루틴', x:'켄넬 크레이트 이동장 친해지기 밥 먹기 문 닫기 머무는 시간 늘리기 이동 연습 출국 8주 전 시작 낑낑 AKC SPCA 오늘 연습 기록'},
    {t:'비행 당일 준비', u:'/#prep', g:'준비하기 · 준비 루틴', x:'식사 비행 2시간 전 물 산책 진정제 안정제 수면제 흡수 패드 담요 IATA AVMA 아시아나'},
    {t:'짐 싸기 리스트', u:'/#prep', g:'준비하기 · 준비 루틴', x:'짐 패킹 체크리스트 해외여행 국내 나들이 캠핑 서류 원본 사본 케이지 패드 사료 간식 목줄 하네스 인식표 배변봉투 2m'},
    {t:'펫 카드', u:'/#wallet', g:'내 반려견', x:'마이크로칩 번호 광견병 접종일 유효기간 항체가 결과 지병 알레르기 복용 약 보호자 연락처 사진 오프라인'},
    {t:'SOS 카드 (응급)', u:'/#sos', g:'내 반려견', x:'응급 아플 때 동물병원 수의사 영어 일본어 중국어 번역 현지 병원 찾기 지도'},
    {t:'서류 사본 보관', u:'/#wallet', g:'내 반려견 · 펫 카드', x:'서류 사진 PDF 접종증명서 항체가 결과서 건강증명서 검역증명서 수입허가 동물등록증'},
    {t:'백업·복원', u:'/#wallet', g:'내 반려견 · 펫 카드', x:'기기 변경 핸드폰 바꿀 때 백업 파일 내려받기 복원'},
    {t:'여행 기록 · 결산 카드', u:'/#trips', g:'내 반려견', x:'비행 기록 거리 km 스탬프 인스타그램 스토리 결산 카드 공항 제주 국내'},
    {t:'단두종 항공 규정 (견종 확인)', u:'/#airlines', g:'규정 · 항공사', x:'단두종 퍼그 시추 불독 프렌치불독 페키니즈 치와와 보스턴테리어 위탁 불가 기내만 가능 견종 이름으로 확인'},
    {t:'항공사 비교', u:'/#airlines', g:'규정', x:'항공사 기내 위탁 한도 단두종 목록 요금 비교 표 견종 확인'},
    {t:'기준과 출처', u:'/#about', g:'기준과 출처', x:'정리 기준 공식 출처 확인일 앱 설치 홈 화면 추가 오프라인'},
    {t:'개인정보처리방침', u:'/privacy.html', g:'기준과 출처', x:'개인정보 쿠키 구글 애널리틱스 기기에만 저장 문의'}
  ];
  const EN = {jp:'japan',us:'usa america united states',ca:'canada',fr:'france',de:'germany',gb:'uk united kingdom england britain',cn:'china',sg:'singapore',au:'australia',th:'thailand',vn:'vietnam',ph:'philippines'};
  // 같은 뜻으로 함께 찾을 말 (한쪽만 써도 찾아짐)
  const SYN = [
    ['개','강아지','반려견','반려동물','댕댕이','dog'],['비행기','항공','항공편','비행','항공기','flight'],
    ['케이지','켄넬','이동장','캐리어','가방','크레이트','운송용기'],['기내','객실','cabin'],['위탁','화물칸','수하물','화물'],
    ['항체','항체가','중화항체','titer'],['검역','검역증명서','검역소'],['광견병','rabies'],['마이크로칩','칩','microchip'],
    ['단두종','퍼그','시추','불독','불도그','페키니즈'],['요금','비용','가격','수수료','운임','얼마','돈'],
    ['제주','제주도','jeju'],['기차','ktx','srt','철도','열차','신칸센','jr','amtrak','암트랙'],['지하철','전철','메트로','subway'],
    ['서류','증명서','서약서'],['무게','kg','킬로','몸무게'],['응급','sos','아플','아파','병원','수의사','동물병원'],
    ['귀국','재입국','돌아올'],['격리','계류'],['짐','패킹','준비물','체크리스트']
  ];
  const norm = s => String(s||'').toLowerCase().replace(/[\s·・,.()\[\]/:;'"“”‘’!?~\-–]+/g, '');
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const alts = term => { const n = norm(term); const g = SYN.find(list => list.some(w => norm(w)===n)); return g ? [...new Set([n, ...g.map(norm)])] : [n]; };

  let DOCS = null, loading = null;
  function fromData(d){
    const out = [];
    (d.countries||[]).forEach(c => out.push({t:c.name+' 입국 규정', u:'/#'+c.id, g:'규정 · 국가별', k:(EN[c.id]||'')+' '+c.code,
      x:[c.status, c.summary, ...(c.requirements||[]), c.quarantine, c.leadNote, c.airlineNote, c.returnNote, ...(c.timeline||[]).map(s=>s.t)].filter(Boolean).join(' ')}));
    (d.airlines||[]).forEach(a => { const f = a.fees||{};
      out.push({t:a.name+' 반려동물 규정', u:'/#airlines', g:'규정 · 항공사', k:a.id,
        x:['기내', a.cabin && a.cabin.maxKg && a.cabin.maxKg+'kg', a.cabin && a.cabin.size, '위탁', a.checked && (a.checked.allowed ? (a.checked.maxKg+'kg '+(a.checked.size||'')) : '위탁 불가'),
           f.short, f.mid, f.long, f.heavy, a.howTo, a.booking, a.banner, ...(a.notes||[]), (a.brachyList||[]).join(' '), ...(a.contact||[]).map(p=>p.label+' '+p.tel)].filter(Boolean).join(' ')}); });
    if(d.returnToKorea) out.push({t:d.returnToKorea.title||'귀국 검역', u:'/#return', g:'규정', k:'귀국 검역 재입국 한국 입국', x:[...(d.returnToKorea.points||[]), d.returnToKorea.tip, ...(d.quarantineOffices||[]).map(o=>o.name+' '+o.tel+' '+o.hours)].join(' ')});
    return out;
  }
  function load(){
    if(DOCS) return Promise.resolve(DOCS);
    if(loading) return loading;
    loading = Promise.all([
      fetch('/data.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetch('/search-index.json').then(r => r.ok ? r.json() : []).catch(() => [])
    ]).then(([d, pages]) => {
      DOCS = [...fromData(d), ...pages, ...APP].map(x => ({...x, nt:norm(x.t), nk:norm((x.k||'')+' '+(x.g||'')), nx:norm(x.x)}));
      return DOCS;
    });
    return loading;
  }
  function search(q){
    const terms = q.trim().split(/\s+/).filter(Boolean).map(alts);
    if(!terms.length) return [];
    const res = [];
    for(const doc of DOCS){
      let score = 0, ok = true;
      for(const as of terms){
        let s = 0;
        as.forEach((a, k) => { if(!a) return;
          const w = k === 0 ? 1 : 0.25;   // 입력한 말 그대로가 비슷한 말보다 앞에
          let v = 0;
          if(doc.nt.includes(a)) v = doc.nt.startsWith(a) ? 14 : 10;
          else if(doc.nk.includes(a)) v = 6;
          else if(doc.nx.includes(a)) v = 4 + Math.min(3, doc.nx.split(a).length - 2);
          s = Math.max(s, v * w); });
        if(!s){ ok = false; break; } score += s;
      }
      if(ok) res.push({doc, score});
    }
    return res.sort((a,b) => b.score - a.score).slice(0, 20).map(r => r.doc);
  }
  // 원문에서 검색어가 처음 나온 곳 주변을 잘라 보여줌
  function snippet(text, q){
    const words = q.trim().split(/\s+/).flatMap(alts).filter(w => w.length);
    const lower = text.toLowerCase();
    let at = -1;
    for(const w of words){ const i = lower.replace(/\s/g,'').indexOf(w); if(i >= 0){ // 공백 제거 위치를 원문 위치로 환산
      let cnt = 0, j = 0; for(; j < text.length && cnt < i; j++) if(!/\s/.test(text[j])) cnt++; at = j; break; } }
    const start = Math.max(0, at - 30), s = (start>0?'…':'') + text.slice(start, start + 110) + (text.length > start + 110 ? '…' : '');
    let h = esc(s);
    q.trim().split(/\s+/).filter(w => w.length >= 1).forEach(w => { const re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'); h = h.replace(re, '<mark>$1</mark>'); });
    return h;
  }

  /* ---------- 화면 ---------- */
  const ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13 13l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const QUICK = ['일본 입국','제주 국내선','항체가 검사','단두종','KTX','비용','SOS'];
  let dlg, input, list, status, lastFocus, sel = -1, tTrack;
  function build(){
    dlg = document.createElement('div');
    dlg.className = 'srch'; dlg.hidden = true; dlg.setAttribute('role','dialog'); dlg.setAttribute('aria-modal','true'); dlg.setAttribute('aria-label','사이트 검색');
    dlg.innerHTML = `<div class="srch-box">
      <div class="srch-bar">${ICON}<label class="sr-only" for="srchQ">PawTrip에서 검색</label>
        <input id="srchQ" type="search" placeholder="나라, 항공사, 국내선, 서류… (예: 일본 항체)" autocomplete="off" enterkeyhint="search" role="combobox" aria-expanded="true" aria-controls="srchList" aria-autocomplete="list">
        <button type="button" class="srch-x" aria-label="검색 닫기">닫기</button></div>
      <p class="srch-status" id="srchStatus" aria-live="polite"></p>
      <ul class="srch-list" id="srchList" role="listbox" aria-label="검색 결과"></ul></div>`;
    document.body.appendChild(dlg);
    input = dlg.querySelector('#srchQ'); list = dlg.querySelector('#srchList'); status = dlg.querySelector('#srchStatus');
    dlg.addEventListener('click', e => { if(e.target === dlg || e.target.closest('.srch-x')) close();
      const q = e.target.closest('[data-q]'); if(q){ input.value = q.dataset.q; run(); input.focus(); }
      const a = e.target.closest('.srch-list a'); if(a){ try{ gtag('event','search_result_click',{link_url:a.getAttribute('href')}); }catch(x){} close(true); } });
    input.addEventListener('input', run);
    dlg.addEventListener('keydown', e => {
      const items = [...list.querySelectorAll('a')];
      if(e.key === 'Escape'){ e.preventDefault(); close(); }
      else if(e.key === 'ArrowDown' && items.length){ e.preventDefault(); sel = Math.min(items.length-1, sel+1); mark(items); }
      else if(e.key === 'ArrowUp' && items.length){ e.preventDefault(); sel = Math.max(0, sel-1); mark(items); }
      else if(e.key === 'Enter' && e.target === input && items.length){ e.preventDefault(); (items[sel] || items[0]).click(); }
      else if(e.key === 'Tab'){ const f = [...dlg.querySelectorAll('input,button,a')]; const i = f.indexOf(document.activeElement);
        if(e.shiftKey && i <= 0){ e.preventDefault(); f[f.length-1].focus(); } else if(!e.shiftKey && i === f.length-1){ e.preventDefault(); f[0].focus(); } }
    });
  }
  function mark(items){ items.forEach((a,i) => a.setAttribute('aria-selected', i===sel)); if(items[sel]) items[sel].scrollIntoView({block:'nearest'}); }
  function quick(){ list.innerHTML = `<li class="srch-quick"><span>자주 찾는 말</span>${QUICK.map(q => `<button type="button" class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</li>`; status.textContent = ''; }
  function run(){
    const q = input.value; sel = -1;
    if(!q.trim()){ quick(); return; }
    if(!DOCS){ status.textContent = '검색 준비 중…'; load().then(run); return; }
    const r = search(q);
    status.textContent = r.length ? `${r.length}개 찾음` : '';
    list.innerHTML = r.length ? r.map((d,i) => `<li><a href="${esc(d.u)}" role="option" aria-selected="false" id="srch-${i}"><span class="srch-g">${esc(d.g||'')}</span><b>${esc(d.t)}</b><span class="srch-s">${snippet(d.x||'', q)}</span></a></li>`).join('')
      : `<li class="srch-empty"><b>'${esc(q)}'에 맞는 내용이 없어요</b><span>다른 말로 찾아보거나, 나라 이름·항공사 이름으로 찾아보세요. 필요한 정보가 없으면 <a href="mailto:help@pawtrip.us">help@pawtrip.us</a>로 알려 주세요.</span></li>`;
    clearTimeout(tTrack); tTrack = setTimeout(() => { try{ gtag('event','search',{search_term:q.trim().slice(0,60), result_count:r.length}); }catch(e){} }, 1500);
  }
  function open(){
    if(!dlg) build();
    lastFocus = document.activeElement; dlg.hidden = false; document.documentElement.classList.add('srch-open');
    input.focus(); input.select(); if(!input.value) quick(); load();
  }
  function close(navigating){
    if(!dlg || dlg.hidden) return;
    dlg.hidden = true; document.documentElement.classList.remove('srch-open');
    if(!navigating && lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function mount(){
    const tb = document.querySelector('.topbar-right');
    if(tb && !tb.querySelector('.srch-btn')) tb.insertAdjacentHTML('afterbegin', `<button type="button" class="srch-btn" aria-label="사이트 검색 (단축키 /)" title="검색">${ICON}</button>`);
    const rail = document.querySelector('.rail');
    if(rail && !rail.querySelector('.srch-rail')){ const nav = rail.querySelector('nav'); nav && nav.insertAdjacentHTML('beforebegin', `<button type="button" class="srch-rail">${ICON}<span>검색</span><kbd>/</kbd></button>`); }
  }
  document.addEventListener('click', e => { if(e.target.closest('.srch-btn,.srch-rail')) open(); });
  document.addEventListener('keydown', e => {
    if(e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable){ e.preventDefault(); open(); }
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  window.PTSearch = { open, close, search: q => load().then(() => search(q)) };
})();
