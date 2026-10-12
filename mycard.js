/* Standalone My Card: reuse the existing wallet and browser storage. */
(function(){
  'use strict';
  const app = document.getElementById('main');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const track = (name, params) => { try { window.gtag('event', name, params || {}); } catch(e) {} };
  const head = (num, title, desc) => `<header class="page-head"><span class="num">${esc(num)}</span><h1 style="font-size:var(--t-h2);font-weight:800;line-height:1.3;margin:8px 0 10px">${esc(title)}</h1><p>${esc(desc)}</p></header>`;
  fetch('/data.json').then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }).then(data => {
    let state = {dest:'jp'};
    try { state = {...state, ...JSON.parse(localStorage.getItem('pp3') || '{}')}; } catch(e) {}
    window.PTX.init({app, state, esc, head, track,
      ICON:{ext:'<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2H10v5.5M10 2L3 9" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>'},
      flag:(tone,text) => `<span class="flag ${esc(tone)}">${esc(text)}</span>`, data:() => data});
    if(new URLSearchParams(location.search).get('edit') === '1') window.PTX.editWallet();
    else window.PTX.views.wallet();
    function reveal(){
      const targets = {checklists:'wprogress', documents:'wdocs', backup:'wbk'};
      const target = document.getElementById(targets[location.hash.slice(1)]);
      if(target){ if(target.tagName === 'DETAILS') target.open = true; target.scrollIntoView(); }
    }
    window.addEventListener('hashchange', reveal);
    reveal();
  }).catch(() => {
    app.insertAdjacentHTML('beforeend', '<div class="callout bad" role="alert"><strong>My Card를 불러오지 못했습니다.</strong>인터넷 연결을 확인하고 페이지를 새로고침해 주세요.</div>');
  });
})();
