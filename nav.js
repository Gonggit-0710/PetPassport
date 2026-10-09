/* PawTrip 공통 메뉴: 앱(index.html)과 실제 주소 페이지(/domestic/ 등)가 함께 씀
   모바일: 위 줄 = 묶음 3개, 아래 줄 = 고른 묶음의 메뉴 / 데스크톱: 왼쪽에 묶음별 목록 */
(function(){
  'use strict';
  const NAV = [
    {id:'prepare', name:'준비하기', items:[
      ['flights','항공편 선택','/#flights'],
      ['plan','일정 계산','/#plan'],
      ['prep','준비 루틴','/#prep'],
      ['titer','항체가 검사','/titer/'],
      ['cost','비용 계산','/cost/']
    ]},
    {id:'rules', name:'규정', items:[
      ['countries','국가별 규정','/#countries'],
      ['airlines','항공사 비교','/#airlines'],
      ['domestic','국내 이동','/domestic/'],
      ['local','현지 이동','/local/'],
      ['return','귀국 검역','/#return']
    ]},
    {id:'mypet', name:'내 반려견', items:[
      ['wallet','펫 카드','/#wallet'],
      ['sos','SOS 카드','/#sos', true],   // true: 데스크톱 목록에서는 숨김(아래 SOS 상자로 대신)
      ['trips','여행 기록','/#trips']
    ]}
  ];
  const EXTRA = [['about','기준과 출처','/#about'],['changes','변경 이력','/changes/']];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const groupOf = tab => NAV.find(g => g.items.some(i => i[0]===tab));
  let shownGroup = null;

  function link(i, active, cls){
    return `<a href="${i[2]}" data-tab="${i[0]}"${cls?` class="${cls}"`:''} aria-current="${i[0]===active?'page':'false'}">${cls==='rl'?'<span class="dot"></span>':''}${esc(i[1])}</a>`;
  }
  function render(active){
    const g = groupOf(active) || (shownGroup && NAV.find(x=>x.id===shownGroup)) || NAV[0];
    shownGroup = g.id;
    const gEl = document.getElementById('navGroups'), sEl = document.getElementById('navSub'), rEl = document.getElementById('navRail');
    if(gEl) gEl.innerHTML = NAV.map(x => `<button type="button" data-group="${x.id}" aria-pressed="${x.id===g.id}">${esc(x.name)}</button>`).join('');
    if(sEl){ sEl.innerHTML = g.items.map(i => link(i, active)).join('');
      const act = sEl.querySelector('[aria-current="page"]'); if(act) sEl.scrollTo({left: act.offsetLeft - (sEl.clientWidth - act.offsetWidth)/2}); }
    if(rEl) rEl.innerHTML = NAV.map(x => `<p class="rail-g">${esc(x.name)}</p><ol>${x.items.filter(i=>!i[3]).map(i => `<li>${link(i, active, 'rl')}</li>`).join('')}</ol>`).join('')
      + `<p class="rail-x">${EXTRA.map(i => `<a href="${i[2]}" aria-current="${i[0]===active?'page':'false'}">${esc(i[1])}</a>`).join(' · ')}</p>`;
    document.querySelectorAll('.sos-btn[href],.sos-rail').forEach(a => a.setAttribute('aria-current', active==='sos'?'page':'false'));
  }
  // 묶음 버튼: 아래 줄만 바꿔 보여줌 (페이지 이동 없음)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-group]'); if(!b) return;
    shownGroup = b.dataset.group; const cur = document.querySelector('#navSub [aria-current="page"]');
    const g = NAV.find(x=>x.id===shownGroup);
    document.querySelectorAll('#navGroups [data-group]').forEach(x => x.setAttribute('aria-pressed', x===b));
    document.getElementById('navSub').innerHTML = g.items.map(i => link(i, cur ? cur.dataset.tab : '')).join('');
  });
  // 같은 문서 안 이동: '/#plan' 링크는 해시만 바꿔 앱 라우터가 처리
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="/#"]'); if(!a) return;
    if(location.pathname === '/' || location.pathname.endsWith('/index.html')){ e.preventDefault(); location.hash = a.getAttribute('href').slice(2); }
  });
  window.PTNav = { render, NAV, groupOf };
})();
