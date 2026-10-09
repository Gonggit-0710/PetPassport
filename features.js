/* PawTrip 부가 기능 (2026-10-08)
   0. 규정 변경 알림: 카카오톡 채널 (KAKAO_CHANNEL_ID를 넣어야 버튼이 보임)
   1. 내 반려견: 펫 카드 · 다국어 SOS 카드 · 서류 사본 · 백업
   2. 준비 루틴: 켄넬 적응 훈련 · 비행 당일 · 짐 싸기 리스트
   3. 여행 기록: 비행 구간 기록 · 대권 거리 · 결산 카드 이미지
   - 모든 입력은 이 기기(localStorage · IndexedDB)에만 저장. 서버 전송 없음
   - GA 이벤트에는 입력값(이름·번호·연락처·병력)을 절대 넣지 않음 */
(function(){
'use strict';

/* ============ 설정 ============ */
// 카카오톡 채널 개설 후 채널 홈 주소(pf.kakao.com/_xxxx)의 "_xxxx" 부분을 넣으세요. 비어 있으면 알림 버튼이 숨겨집니다.
const KAKAO_CHANNEL_ID = '';

const PTX = window.PTX = { views:{} };
let PT = null; // index.html이 init에서 넘겨줌

/* ============ 공통 ============ */
const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const todayIso = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const SVG = {
  paw:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 13.2c-2.6 0-5.2 2.6-5.2 5 0 1.4 1.1 2.1 2.3 2.1 1.2 0 1.9-.6 2.9-.6s1.7.6 2.9.6c1.2 0 2.3-.7 2.3-2.1 0-2.4-2.6-5-5.2-5zM6.3 12.6c1.2-.3 1.7-1.8 1.3-3.2-.4-1.4-1.7-2.3-2.8-2s-1.7 1.8-1.3 3.2c.4 1.4 1.6 2.3 2.8 2zM9.6 8.6c1.3-.2 2-1.7 1.8-3.3C11.2 3.7 10 2.6 8.8 2.8 7.5 3 6.7 4.5 7 6.1c.2 1.6 1.4 2.7 2.6 2.5zM17.7 12.6c1.2.3 2.4-.6 2.8-2s-.2-2.9-1.3-3.2c-1.2-.3-2.4.6-2.8 2s.1 2.9 1.3 3.2zM14.4 8.6c1.3.2 2.4-.9 2.6-2.5.3-1.6-.5-3.1-1.8-3.3-1.2-.2-2.4.9-2.6 2.5-.2 1.6.5 3.1 1.8 3.3z"/></svg>',
  del:'<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>'
};
const fmtDot = s => s ? s.replace(/-/g,'.') : '';
function addMonthsIso(s, n){ if(!s) return ''; const [y,m,d]=s.split('-').map(Number); const x=new Date(y,m-1,d); const day=x.getDate(); x.setMonth(x.getMonth()+n); if(x.getDate()<day) x.setDate(0); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); }
function daysUntil(s){ if(!s) return null; const [y,m,d]=s.split('-').map(Number); const t=new Date(); t.setHours(0,0,0,0); return Math.round((new Date(y,m-1,d)-t)/86400000); }
function validity(until, label){
  const n = daysUntil(until); if(n==null) return '';
  if(n<0) return PT.flag('bad', label+' 만료');
  if(n<=30) return PT.flag('warn', n+'일 뒤 만료');
  return PT.flag('ok', label+' 유효');
}
function persistOnce(){ try{ if(navigator.storage && navigator.storage.persist && !LS.get('pt-persist',false)){ navigator.storage.persist().then(ok=>LS.set('pt-persist', !!ok)); } }catch(e){} }

/* ============ IndexedDB (사진·서류 사본) ============ */
const DB = {
  _db:null,
  open(){ if(this._db) return Promise.resolve(this._db);
    return new Promise((res, rej)=>{ if(!('indexedDB' in window)) return rej(new Error('no-idb'));
      const r = indexedDB.open('pawtrip', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('files', {keyPath:'id'}); };
      r.onsuccess = () => { this._db = r.result; res(r.result); };
      r.onerror = () => rej(r.error); }); },
  async tx(mode, fn){ const db = await this.open(); return new Promise((res, rej)=>{ const t = db.transaction('files', mode); const s = t.objectStore('files'); const out = fn(s); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); },
  put(v){ return this.tx('readwrite', s => s.put(v)); },
  del(id){ return this.tx('readwrite', s => s.delete(id)); },
  all(){ return this.tx('readonly', s => s.getAll()); },
  get(id){ return this.tx('readonly', s => s.get(id)); },
  clear(){ return this.tx('readwrite', s => s.clear()); }
};
function shrinkImage(file, maxSide, quality){
  return new Promise((res)=>{
    if(!/^image\//.test(file.type) || file.type==='image/svg+xml'){ res(file); return; }
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { const s = Math.min(1, maxSide/Math.max(img.width, img.height));
      if(s===1 && file.size < 1.5e6){ URL.revokeObjectURL(url); res(file); return; }
      const c = document.createElement('canvas'); c.width = Math.round(img.width*s); c.height = Math.round(img.height*s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob(b => res(b || file), 'image/jpeg', quality); };
    img.onerror = () => { URL.revokeObjectURL(url); res(file); };
    img.src = url;
  });
}
const blobToDataUrl = b => new Promise((res, rej)=>{ const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
const dataUrlToBlob = async u => (await fetch(u)).blob();

/* ============ 0. 규정 변경 알림 (카카오톡 채널) ============ */
const channelUrl = () => KAKAO_CHANNEL_ID ? 'https://pf.kakao.com/' + encodeURIComponent(KAKAO_CHANNEL_ID) + '/friend' : '';
PTX.alertBox = function(context, text){
  const url = channelUrl(); if(!url) return '';
  return `<div class="alert-box"><p><strong>규정이 바뀌면 카카오톡으로 알려드려요</strong>${PT.esc(text || '검역·항공사 규정이 바뀌면 PawTrip 카카오톡 채널로 소식을 보내드립니다. 채널 추가만 하면 되고, 사이트에 따로 가입하지 않아도 됩니다.')}</p>
    <a class="btn btn-kakao btn-sm" href="${url}" target="_blank" rel="noopener" data-alert="${PT.esc(context)}">카카오톡 채널 추가</a></div>`;
};
PTX.hasAlerts = () => !!KAKAO_CHANNEL_ID;
document.addEventListener('click', e => { const a = e.target.closest('[data-alert]'); if(a && PT) PT.track('alert_subscribe_click', {context: a.dataset.alert}); });

/* ============ 1. 내 반려견: 데이터 ============ */
// 선택형 항목: 번역은 고정 문구만. 보호자가 직접 쓴 내용은 원문 그대로 표시(기계 번역 안 함)
const CONDITIONS = [
  {id:'heart',   ko:'심장병',              en:'Heart disease',                          ja:'心臓病',                     zh:'心脏病'},
  {id:'seizure', ko:'뇌전증(발작)',        en:'Epilepsy (seizures)',                    ja:'てんかん（発作）',           zh:'癫痫（抽搐发作）'},
  {id:'diabetes',ko:'당뇨병',              en:'Diabetes mellitus',                      ja:'糖尿病',                     zh:'糖尿病'},
  {id:'kidney',  ko:'신장병',              en:'Kidney disease',                         ja:'腎臓病',                     zh:'肾脏病'},
  {id:'thyroid', ko:'갑상선기능저하증',    en:'Hypothyroidism',                         ja:'甲状腺機能低下症',           zh:'甲状腺功能减退症'},
  {id:'cushing', ko:'쿠싱증후군',          en:'Cushing’s disease (hyperadrenocorticism)', ja:'クッシング症候群（副腎皮質機能亢進症）', zh:'库欣综合征（肾上腺皮质功能亢进）'},
  {id:'trachea', ko:'기관 허탈',           en:'Tracheal collapse',                      ja:'気管虚脱',                   zh:'气管塌陷'},
  {id:'patella', ko:'슬개골 탈구',         en:'Patellar luxation',                      ja:'膝蓋骨脱臼',                 zh:'髌骨脱位'},
  {id:'atopy',   ko:'아토피 피부염',       en:'Atopic dermatitis',                      ja:'アトピー性皮膚炎',           zh:'特应性皮炎'},
  {id:'pancrea', ko:'췌장염 병력',         en:'History of pancreatitis',                ja:'膵炎の既往歴',               zh:'胰腺炎病史'},
  {id:'brachy',  ko:'단두종(호흡 주의)',   en:'Brachycephalic breed (airway risk)',     ja:'短頭種（呼吸に注意）',       zh:'短头犬种（注意呼吸）'},
  {id:'anesth',  ko:'마취 부작용 이력',    en:'Previous adverse reaction to anesthesia',ja:'麻酔の副作用歴あり',         zh:'曾有麻醉不良反应'}
];
const ALLERGIES = [
  {id:'chicken', ko:'닭고기',   en:'Chicken', ja:'鶏肉',   zh:'鸡肉'},
  {id:'beef',    ko:'소고기',   en:'Beef',    ja:'牛肉',   zh:'牛肉'},
  {id:'dairy',   ko:'유제품',   en:'Dairy',   ja:'乳製品', zh:'乳制品'},
  {id:'wheat',   ko:'밀',       en:'Wheat',   ja:'小麦',   zh:'小麦'},
  {id:'soy',     ko:'콩',       en:'Soy',     ja:'大豆',   zh:'大豆'},
  {id:'fish',    ko:'생선',     en:'Fish',    ja:'魚',     zh:'鱼'},
  {id:'vaccine', ko:'백신 부작용 이력', en:'Previous vaccine reaction', ja:'ワクチン副反応歴あり', zh:'曾有疫苗不良反应'}
];
const L = {
  ko:{name:'한국어', title:'반려견 의료 정보 카드', lead:'이 개는 수의사의 진료가 필요합니다.', phr:'현지 언어를 잘 못합니다. 손으로 가리키거나 글로 써 주세요.',
      dog:'이름', breed:'견종', sex:'성별', male:'수컷', female:'암컷', neut:'중성화 완료', dob:'생년월일', weight:'체중', chip:'마이크로칩 번호',
      rabies:'광견병 접종일', until:'유효기간', titer:'광견병 항체가 검사', cond:'지병', allergy:'알레르기', meds:'복용 중인 약', none:'알려진 것 없음',
      owner:'보호자', tel:'전화', emer:'비상 연락처', vet:'한국 주치 동물병원', note:'보호자 메모', orig:'보호자가 쓴 원문'},
  en:{name:'English', title:'Pet Medical Information', lead:'This dog needs veterinary care.', phr:'I don’t speak the local language well. Please point or write it down.',
      dog:'Name', breed:'Breed', sex:'Sex', male:'Male', female:'Female', neut:'Spayed / neutered', dob:'Date of birth', weight:'Weight', chip:'Microchip no.',
      rabies:'Rabies vaccination', until:'Valid until', titer:'Rabies antibody test', cond:'Medical conditions', allergy:'Allergies', meds:'Current medications', none:'None known',
      owner:'Owner', tel:'Phone', emer:'Emergency contact', vet:'Regular vet (Korea)', note:'Owner’s note', orig:'written by owner, original language'},
  ja:{name:'日本語', title:'ペット医療情報カード', lead:'この犬は獣医師の診察が必要です。', phr:'日本語がうまく話せません。指で示すか、書いてください。',
      dog:'名前', breed:'犬種', sex:'性別', male:'オス', female:'メス', neut:'避妊・去勢済み', dob:'生年月日', weight:'体重', chip:'マイクロチップ番号',
      rabies:'狂犬病ワクチン接種日', until:'有効期限', titer:'狂犬病抗体検査', cond:'持病', allergy:'アレルギー', meds:'服用中の薬', none:'特になし',
      owner:'飼い主', tel:'電話', emer:'緊急連絡先', vet:'かかりつけ動物病院（韓国）', note:'飼い主のメモ', orig:'飼い主の記入（原文）'},
  zh:{name:'中文', title:'宠物医疗信息卡', lead:'这只狗需要兽医诊治。', phr:'我不太会说中文。请用手指给我看或写下来。',
      dog:'名字', breed:'品种', sex:'性别', male:'公', female:'母', neut:'已绝育', dob:'出生日期', weight:'体重', chip:'芯片号',
      rabies:'狂犬病疫苗接种日期', until:'有效期至', titer:'狂犬病抗体检测', cond:'既往病史', allergy:'过敏', meds:'正在服用的药物', none:'无已知',
      owner:'主人', tel:'电话', emer:'紧急联系人', vet:'常去的宠物医院（韩国）', note:'主人备注', orig:'主人填写（原文）'}
};
// 현지 동물병원 검색어 (구글 지도 검색 링크용). 중국 본토는 구글 지도가 막혀 있어 현지 지도 앱 안내
// place: 도시를 안 넣었을 때 붙이는 나라 이름 (검색 지역을 그 나라로 고정), ex: 도시 입력 예시
const VET_SEARCH = {
  jp:{q:'動物病院 夜間救急', lang:'ja', place:'日本', ex:'東京, 大阪, Fukuoka'}, cn:{q:'24小时宠物医院', lang:'zh', cnMaps:true},
  us:{q:'24 hour emergency vet', lang:'en', place:'USA', ex:'San Francisco, Los Angeles'}, ca:{q:'24 hour emergency vet', lang:'en', place:'Canada', ex:'Vancouver, Toronto'},
  gb:{q:'24 hour emergency vet', lang:'en', place:'United Kingdom', ex:'London'}, au:{q:'24 hour emergency vet', lang:'en', place:'Australia', ex:'Sydney, Melbourne'},
  sg:{q:'24 hour emergency vet', lang:'en', place:'Singapore', ex:'Orchard'}, ph:{q:'24 hour emergency vet', lang:'en', place:'Philippines', ex:'Manila, Cebu'},
  fr:{q:'urgences vétérinaires', lang:'fr', place:'France', ex:'Paris'}, de:{q:'Tierarzt Notdienst', lang:'de', place:'Deutschland', ex:'Berlin, Frankfurt'},
  th:{q:'โรงพยาบาลสัตว์ 24 ชั่วโมง', lang:'th', place:'Thailand', ex:'Bangkok'}, vn:{q:'bệnh viện thú y 24h', lang:'vi', place:'Việt Nam', ex:'Hà Nội, Đà Nẵng'}
};
const VET_CITIES = {
  jp:[['도쿄','東京'],['오사카','大阪'],['후쿠오카','福岡'],['삿포로','札幌'],['오키나와(나하)','那覇'],['교토','京都'],['나고야','名古屋'],['요코하마','横浜'],['고베','神戸']],
  us:[['로스앤젤레스','Los Angeles'],['샌프란시스코','San Francisco'],['뉴욕','New York'],['시애틀','Seattle'],['하와이(호놀룰루)','Honolulu'],['라스베이거스','Las Vegas'],['샌디에이고','San Diego'],['시카고','Chicago'],['보스턴','Boston'],['워싱턴 D.C.','Washington DC'],['애틀랜타','Atlanta'],['댈러스','Dallas'],['휴스턴','Houston'],['마이애미','Miami'],['포틀랜드','Portland']],
  ca:[['밴쿠버','Vancouver'],['토론토','Toronto'],['몬트리올','Montreal'],['캘거리','Calgary'],['빅토리아','Victoria BC']],
  gb:[['런던','London'],['맨체스터','Manchester'],['에든버러','Edinburgh']],
  au:[['시드니','Sydney'],['멜버른','Melbourne'],['브리즈번','Brisbane'],['골드코스트','Gold Coast'],['퍼스','Perth']],
  sg:[['싱가포르','Singapore']],
  ph:[['마닐라','Manila'],['세부','Cebu'],['마카티','Makati'],['보라카이','Boracay']],
  fr:[['파리','Paris'],['니스','Nice'],['리옹','Lyon'],['마르세유','Marseille']],
  de:[['베를린','Berlin'],['프랑크푸르트','Frankfurt'],['뮌헨','München'],['함부르크','Hamburg']],
  th:[['방콕','Bangkok'],['치앙마이','Chiang Mai'],['푸껫','Phuket'],['파타야','Pattaya']],
  vn:[['하노이','Hà Nội'],['호찌민','Hồ Chí Minh'],['다낭','Đà Nẵng'],['나트랑','Nha Trang'],['푸꾸옥','Phú Quốc']]
};
const DOC_TYPES = ['광견병 접종증명서','항체가 검사 결과서','건강증명서(영문)','동물검역증명서(한국 발급)','목적지 수입허가·사전신고','동물등록증','기타'];

const W = () => LS.get('pt-wallet', {});
const saveW = w => { const ok = LS.set('pt-wallet', w); persistOnce(); return ok; };
const walletFilled = w => !!(w.name || w.chip || w.rabiesDate);
PTX.wallet = W;

/* ============ 1. 내 반려견: 화면 ============ */
let wTab = 'card';
let photoUrl = null;
async function loadPhoto(){
  if(photoUrl){ URL.revokeObjectURL(photoUrl); photoUrl = null; }
  try{ const p = await DB.get('photo'); if(p && p.blob) photoUrl = URL.createObjectURL(p.blob); }catch(e){}
  return photoUrl;
}
PTX.views.wallet = function(){
  const app = PT.app; if(wTab==='sos') wTab = 'card';
  const tabs = [['card','펫 카드'],['edit','정보 입력'],['sos','SOS 카드'],['docs','서류 사본'],['backup','백업·복원']];
  app.innerHTML = PT.head('내 반려견 · 펫 카드','공항·호텔·동물병원에서 바로 꺼내는 카드',
      '마이크로칩 번호, 접종·항체가 날짜, 지병과 알레르기를 한 화면에 모았습니다. 홈 화면에 설치해 두면 인터넷이 없어도 열립니다.') + `
    <div class="callout bad" style="margin-bottom:16px"><strong>원본 서류를 대신하지 않습니다</strong>공항 검역과 항공사 카운터는 수의사가 서명한 원본 증명서와 검역증명서를 확인합니다. 이 카드는 빠른 확인용 요약이니 원본은 반드시 챙기세요.</div>
    <div class="chips" role="tablist" aria-label="내 반려견 메뉴" style="margin-bottom:20px">${tabs.map(([k,t])=>`<button class="chip" type="button" role="tab" data-wtab="${k}" aria-selected="${wTab===k}" aria-pressed="${wTab===k}">${t}</button>`).join('')}</div>
    <div id="wbody"></div>
    <p class="hint" style="margin-top:16px">입력한 정보와 사진은 이 기기 브라우저에만 저장되고 PawTrip으로 전송되지 않습니다. 기기를 바꾸거나 사이트 데이터를 지우면 사라지니 <b>백업·복원</b>에서 파일로 보관하세요.</p>`;
  $$('[data-wtab]', app).forEach(b => b.addEventListener('click', () => { if(b.dataset.wtab==='sos'){ location.hash = 'sos'; return; } wTab = b.dataset.wtab; PTX.views.wallet(); }));
  ({card:renderCard, edit:renderEdit, sos:renderSos, docs:renderDocs, backup:renderBackup})[wTab]($('#wbody'));
};

PTX.views.sos = function(){
  const app = PT.app; const w = W();
  app.innerHTML = PT.head('내 반려견 · SOS','응급 SOS 카드','반려견이 아플 때 현지 동물병원에서 이 화면을 그대로 보여주세요. 인터넷이 없어도 열립니다.') + `
    ${walletFilled(w) ? '' : '<div class="callout bad" style="margin-bottom:16px"><strong>아직 카드가 비어 있어요</strong>여행 전에 이름·마이크로칩 번호·지병·알레르기를 미리 넣어 두세요. <a href="#wallet" id="sosFill">반려견 정보 입력하기</a></div>'}
    <div id="wbody"></div>
    <div class="links"><a class="link" href="#wallet" id="sosEdit">카드 내용 고치기</a></div>`;
  ['sosFill','sosEdit'].forEach(id => { const a = document.getElementById(id); if(a) a.addEventListener('click', () => { wTab = 'edit'; }); });
  renderSos(document.getElementById('wbody'));
  PT.track('sos_open', {source:'page'});
};

async function renderCard(el){
  const w = W();
  if(!walletFilled(w)){
    el.innerHTML = `<div class="panel empty"><div class="pet-photo" style="margin:0 auto 14px">${SVG.paw}</div><h3>아직 등록한 반려견이 없어요</h3><p>이름과 마이크로칩 번호, 광견병 접종일만 넣어도 공항에서 바로 꺼내 볼 수 있어요.</p><button class="btn btn-primary" type="button" id="goEdit">반려견 정보 입력</button></div>`;
    $('#goEdit').addEventListener('click', () => { wTab='edit'; PTX.views.wallet(); });
    return;
  }
  const ph = await loadPhoto();
  const titerUntil = w.titerDate ? addMonthsIso(w.titerDate, 24) : '';
  const cond = CONDITIONS.filter(c => (w.cond||[]).includes(c.id)).map(c=>c.ko);
  const alg = ALLERGIES.filter(c => (w.alg||[]).includes(c.id)).map(c=>c.ko);
  const sex = w.sex==='m'?'수컷':w.sex==='f'?'암컷':'';
  el.innerHTML = `
    <section class="panel">
      <div class="pet-card">
        <div class="pet-photo">${ph?`<img src="${ph}" alt="${PT.esc(w.name||'반려견')} 사진">`:SVG.paw}</div>
        <div><h3 class="pet-name">${PT.esc(w.name||'이름 미입력')}</h3>
          <p class="pet-sub">${[w.breed, sex + (w.neut?' · 중성화':''), w.dob?fmtDot(w.dob)+' 생':'', w.weight?w.weight+'kg':''].filter(Boolean).map(PT.esc).join(' · ')}</p></div>
      </div>
      <h4 class="sec-h">마이크로칩 번호</h4>
      <div class="chipno">${w.chip?PT.esc(w.chip):'<span class="hint">미입력</span>'}</div>
      ${w.chip && !/^\d{15}$/.test(w.chip.replace(/\s/g,''))?`<p class="hint">${PT.flag('warn','15자리 숫자가 아님')} 국제 표준(ISO 11784/11785) 칩 번호는 15자리 숫자입니다. 동물등록증과 다시 대조하세요.</p>`:''}
      <h4 class="sec-h">광견병</h4>
      <dl class="wallet-kv">
        <dt>접종일</dt><dd>${w.rabiesDate?fmtDot(w.rabiesDate):'—'}</dd>
        <dt>유효기간</dt><dd>${w.rabiesUntil?fmtDot(w.rabiesUntil)+' '+validity(w.rabiesUntil,'접종'):'— <span class="hint">증명서에 적힌 날짜를 입력하세요</span>'}</dd>
        <dt>항체가 검사</dt><dd>${w.titerDate?`채혈 ${fmtDot(w.titerDate)}${w.titerResult?' · '+PT.esc(w.titerResult)+' IU/ml':''}${w.titerLab?' · '+PT.esc(w.titerLab):''}`:'—'}</dd>
        ${titerUntil?`<dt>귀국 검역 기준</dt><dd>${fmtDot(titerUntil)}까지 ${validity(titerUntil,'채혈 24개월')}<br><span class="hint">한국 재입국은 도착 전 24개월 이내 채혈한 결과(0.5 IU/ml 이상)가 필요합니다. 목적지 기준은 국가별 규정에서 확인하세요.</span></dd>`:''}
      </dl>
      <h4 class="sec-h">건강</h4>
      <dl class="wallet-kv">
        <dt>지병</dt><dd>${cond.length?PT.esc(cond.join(', ')):(w.condNote?'':(w.condNone?'없음':'<span class="hint">미입력</span>'))}${w.condNote?`${cond.length?'<br>':''}${PT.esc(w.condNote)}`:''}</dd>
        <dt>알레르기</dt><dd>${alg.length?PT.esc(alg.join(', ')):(w.algNote?'':(w.algNone?'없음':'<span class="hint">미입력</span>'))}${w.algNote?`${alg.length?'<br>':''}${PT.esc(w.algNote)}`:''}</dd>
        <dt>복용 약</dt><dd>${w.meds?PT.esc(w.meds):(w.medsNone?'없음':'<span class="hint">미입력</span>')}</dd>
      </dl>
      <h4 class="sec-h">연락처</h4>
      <dl class="wallet-kv">
        <dt>보호자</dt><dd>${PT.esc(w.owner||'—')}${w.ownerTel?` · <a class="tel" href="tel:${PT.esc(w.ownerTel)}">${PT.esc(w.ownerTel)}</a>`:''}</dd>
        ${w.emer?`<dt>비상 연락처</dt><dd>${PT.esc(w.emer)}</dd>`:''}
        ${w.vet?`<dt>주치 동물병원</dt><dd>${PT.esc(w.vet)}${w.vetTel?` · <a class="tel" href="tel:${PT.esc(w.vetTel)}">${PT.esc(w.vetTel)}</a>`:''}</dd>`:''}
      </dl>
      <div class="row-btns"><button class="btn btn-sm" type="button" data-go="edit">정보 고치기</button><button class="btn btn-sm" type="button" data-go="sos">SOS 카드 열기</button><button class="btn btn-sm" type="button" data-go="docs">서류 사본 보기</button></div>
    </section>`;
  $$('[data-go]', el).forEach(b => b.addEventListener('click', () => { if(b.dataset.go==='sos'){ location.hash = 'sos'; return; } wTab = b.dataset.go; PTX.views.wallet(); }));
}

function renderEdit(el){
  const w = W();
  const inp = (id, label, type='text', extra='') => `<div class="field"><label for="w-${id}">${label}</label><input type="${type}" id="w-${id}" data-k="${id}" value="${PT.esc(w[id]||'')}" ${extra}></div>`;
  const opts = (list, key) => `<div class="opt-grid">${list.map(o=>`<label class="check"><input type="checkbox" data-arr="${key}" value="${o.id}" ${(w[key]||[]).includes(o.id)?'checked':''}><span>${o.ko}</span></label>`).join('')}</div>`;
  el.innerHTML = `
    <form class="panel stack-16" id="wform" autocomplete="off">
      <fieldset><legend>기본 정보</legend><div class="form-grid two">
        ${inp('name','이름')}${inp('breed','견종')}
        <div class="field"><label for="w-sex">성별</label><select id="w-sex" data-k="sex"><option value="">선택</option><option value="m" ${w.sex==='m'?'selected':''}>수컷</option><option value="f" ${w.sex==='f'?'selected':''}>암컷</option></select></div>
        ${inp('dob','생년월일','date')}${inp('weight','체중 (kg)','number','min="0.1" max="100" step="0.1" inputmode="decimal"')}
        <label class="check" style="align-self:end;padding-bottom:12px"><input type="checkbox" data-k="neut" ${w.neut?'checked':''}><span>중성화 완료</span></label>
        <div class="field full"><p class="hint" style="margin:0">지병·알레르기·약은 비워 두면 SOS 카드에 '미입력'으로 표시됩니다. '없음'은 직접 확인하고 체크했을 때만 표시됩니다.</p></div>
        <div class="field full"><label for="w-photo">사진</label><input type="file" id="w-photo" accept="image/*"><p class="hint">사진은 작게 줄여 이 기기에만 저장합니다.</p></div>
      </div></fieldset>
      <fieldset><legend>마이크로칩 · 광견병</legend><div class="form-grid two">
        <div class="field full"><label for="w-chip">마이크로칩 번호</label><input type="text" id="w-chip" data-k="chip" value="${PT.esc(w.chip||'')}" inputmode="numeric" placeholder="예: 410 000000000000"><p class="hint">동물등록증·접종증명서에 적힌 번호와 한 글자씩 대조하세요. 서류마다 번호가 다르면 입국이 거부될 수 있습니다.</p></div>
        ${inp('rabiesDate','최근 광견병 접종일','date')}${inp('rabiesUntil','접종 유효기간 (증명서 기재)','date')}
        ${inp('titerDate','항체가 검사 채혈일','date')}${inp('titerResult','항체가 결과 (IU/ml)','text','inputmode="decimal" placeholder="예: 2.5"')}
        <div class="field full"><label for="w-titerLab">검사기관</label><input type="text" id="w-titerLab" data-k="titerLab" value="${PT.esc(w.titerLab||'')}" placeholder="예: 농림축산검역본부"></div>
      </div></fieldset>
      <fieldset><legend>지병</legend><label class="check" style="margin-bottom:10px"><input type="checkbox" data-k="condNone" ${w.condNone?'checked':''}><span><b>알려진 지병 없음</b> (확인했을 때만 체크)</span></label>${opts(CONDITIONS,'cond')}
        <div class="field" style="margin-top:12px"><label for="w-condNote">기타 지병 (직접 입력)</label><input type="text" id="w-condNote" data-k="condNote" value="${PT.esc(w.condNote||'')}"><p class="hint">직접 쓴 내용은 SOS 카드에 번역 없이 원문 그대로 보입니다. 영어로 쓰면 해외에서 더 잘 통합니다.</p></div></fieldset>
      <fieldset><legend>알레르기</legend><label class="check" style="margin-bottom:10px"><input type="checkbox" data-k="algNone" ${w.algNone?'checked':''}><span><b>알려진 알레르기 없음</b> (확인했을 때만 체크)</span></label>${opts(ALLERGIES,'alg')}
        <div class="field" style="margin-top:12px"><label for="w-algNote">기타 알레르기 (약물 포함)</label><input type="text" id="w-algNote" data-k="algNote" value="${PT.esc(w.algNote||'')}"></div></fieldset>
      <fieldset><legend>복용 중인 약</legend>
        <label class="check" style="margin-bottom:10px"><input type="checkbox" data-k="medsNone" ${w.medsNone?'checked':''}><span><b>복용 중인 약 없음</b> (확인했을 때만 체크)</span></label>
        <div class="field"><label for="w-meds">약 이름 · 용량 · 횟수</label><textarea id="w-meds" data-k="meds" placeholder="예: Pimobendan 1.25mg, twice a day">${PT.esc(w.meds||'')}</textarea><p class="hint">상품명보다 <b>성분명(영문)</b>으로 쓰세요. 나라마다 상품명이 달라 현지 수의사가 못 알아볼 수 있습니다. 처방전이나 약 봉투의 성분명을 그대로 옮기는 것이 가장 정확합니다.</p></div></fieldset>
      <fieldset><legend>연락처</legend><div class="form-grid two">
        ${inp('owner','보호자 이름')}${inp('ownerTel','보호자 전화 (국가번호 포함)','tel','placeholder="+82 10-0000-0000"')}
        <div class="field full"><label for="w-emer">여행지 비상 연락처 (숙소 등)</label><input type="text" id="w-emer" data-k="emer" value="${PT.esc(w.emer||'')}"></div>
        ${inp('vet','한국 주치 동물병원')}${inp('vetTel','동물병원 전화','tel','placeholder="+82 2-000-0000"')}
      </div></fieldset>
      <p class="save-state" id="wsaved" aria-live="polite"></p>
    </form>`;
  const form = $('#wform'); const st = $('#wsaved');
  const commit = () => { const v = W();
    $$('[data-k]', form).forEach(i => { v[i.dataset.k] = i.type==='checkbox' ? i.checked : i.value.trim(); });
    ['cond','alg'].forEach(k => { v[k] = $$(`[data-arr="${k}"]:checked`, form).map(x=>x.value); });
    const ok = saveW(v); st.textContent = ok ? '저장됨 · 이 기기에만 보관' : '저장하지 못했어요. 브라우저 저장 공간을 확인하세요.';
    if(!commit.sent){ commit.sent = true; PT.track('wallet_save', {}); } };
  form.addEventListener('input', e => { if(e.target.type!=='file') commit(); });
  form.addEventListener('change', e => { if(e.target.type==='checkbox') commit(); });
  form.addEventListener('submit', e => e.preventDefault());
  $('#w-photo').addEventListener('change', async e => { const f = e.target.files[0]; if(!f) return;
    try{ const b = await shrinkImage(f, 600, .85); await DB.put({id:'photo', kind:'photo', title:'사진', type:b.type, blob:b, added:Date.now()}); persistOnce(); st.textContent='사진 저장됨'; }
    catch(err){ st.textContent='사진을 저장하지 못했어요. 이 브라우저에서 저장소를 쓸 수 없는 상태일 수 있어요.'; } });
}

function renderSos(el){
  const w = W();
  const def = LS.get('pt-sos-lang', 'en');
  const destId = (PT.state && PT.state.dest) || 'jp';
  const countries = PT.data().countries;
  el.innerHTML = `
    <div class="chips" role="group" aria-label="카드 언어">${['en','ja','zh','ko'].map(k=>`<button class="chip" type="button" data-lang="${k}" aria-pressed="${def===k}">${L[k].name}</button>`).join('')}</div>
    <div id="sosCard"></div>
    <div class="row-btns"><button class="btn btn-sm" type="button" id="sosFull">전체 화면으로 보여주기</button></div>
    <section class="panel" style="margin-top:20px">
      <h3 class="sec-h" style="margin-top:0">현지 동물병원 찾기</h3>
      <div class="field" style="max-width:360px"><label for="vetC">지금 있는 나라</label><select id="vetC">${countries.map(c=>`<option value="${c.id}" ${c.id===destId?'selected':''}>${PT.esc(c.name)}</option>`).join('')}</select></div>
      <div class="field" style="max-width:360px;margin-top:12px"><label for="vetCity">도시·지역 (선택)</label><input type="search" id="vetCity" list="vetCityList" autocomplete="off" placeholder="눌러서 고르거나 직접 입력"><datalist id="vetCityList"></datalist><p class="hint" id="vetEx"></p><div class="chips" id="vetChips" style="margin-top:4px"></div></div>
      <div id="vetOut" style="margin-top:12px"></div>
      <p class="hint" style="margin-top:12px">병원 목록은 PawTrip이 검증해 올린 것이 아니라 지도 검색 결과입니다. 진료 시간과 응급 진료 가능 여부는 전화로 먼저 확인하세요. '내 위치 주변'을 누르면 위치가 구글 지도로만 전달되고 PawTrip에는 저장되지 않습니다.</p>
    </section>
    <p class="hint" style="margin-top:12px">카드의 고정 문구와 선택형 항목만 번역했습니다. 직접 입력한 메모·약 이름은 잘못 번역될 위험이 있어 원문 그대로 보여줍니다.</p>`;
  const draw = lang => {
    const t = L[lang]; const pick = (list, ids) => list.filter(o => (ids||[]).includes(o.id)).map(o => `${PT.esc(o[lang])}${lang!=='ko'?`<span class="ko">${PT.esc(o.ko)}</span>`:''}`);
    const cond = pick(CONDITIONS, w.cond), alg = pick(ALLERGIES, w.alg);
    const orig = s => s ? `<div class="orig">${PT.esc(s)} <span class="ko">(${t.orig})</span></div>` : '';
    const sex = w.sex==='m'?t.male:w.sex==='f'?t.female:'';
    $('#sosCard').innerHTML = `<article class="sos" id="sosArt" lang="${lang==='zh'?'zh-CN':lang}">
      <h3>${t.title}</h3><p class="lead">${t.lead}</p>${lang!=='ko'?`<p class="phr">${t.phr}</p>`:'<p class="phr"></p>'}
      <dl>
        <dt>${t.dog}</dt><dd>${PT.esc(w.name||'—')}</dd>
        <dt>${t.breed}</dt><dd>${PT.esc(w.breed||'—')}</dd>
        <dt>${t.sex}</dt><dd>${[sex, w.neut?t.neut:''].filter(Boolean).join(' · ')||'—'}</dd>
        <dt>${t.dob}</dt><dd>${w.dob||'—'}</dd>
        <dt>${t.weight}</dt><dd>${w.weight?PT.esc(w.weight)+' kg':'—'}</dd>
        <dt>${t.chip}</dt><dd class="nw">${PT.esc(w.chip||'—')}</dd>
        <dt>${t.rabies}</dt><dd>${w.rabiesDate||'—'}${w.rabiesUntil?` (${t.until} ${w.rabiesUntil})`:''}</dd>
        ${w.titerDate?`<dt>${t.titer}</dt><dd>${w.titerDate}${w.titerResult?' · '+PT.esc(w.titerResult)+' IU/ml':''}</dd>`:''}
        <dt>${t.cond}</dt><dd>${cond.length?cond.join('<br>'):(w.condNote?'':(w.condNone?t.none:'—'))}${orig(w.condNote)}</dd>
        <dt>${t.allergy}</dt><dd>${alg.length?alg.join('<br>'):(w.algNote?'':(w.algNone?t.none:'—'))}${orig(w.algNote)}</dd>
        <dt>${t.meds}</dt><dd>${w.meds?orig(w.meds):(w.medsNone?t.none:'—')}</dd>
        <dt>${t.owner}</dt><dd>${PT.esc(w.owner||'—')}${w.ownerTel?`<br>${t.tel} ${PT.esc(w.ownerTel)}`:''}</dd>
        ${w.emer?`<dt>${t.emer}</dt><dd>${orig(w.emer)}</dd>`:''}
        ${w.vet?`<dt>${t.vet}</dt><dd>${PT.esc(w.vet)}${w.vetTel?`<br>${PT.esc(w.vetTel)}`:''}</dd>`:''}
      </dl></article>`;
  };
  // 검색 지역을 꼭 함께 넘김: 검색어만 넘기면 구글이 '접속 위치'(예: 한국) 주변에서 찾아 버림
  const vet = () => { const id = $('#vetC').value; const v = VET_SEARCH[id]; const out = $('#vetOut'); if(!v){ out.innerHTML=''; return; }
    const cities = VET_CITIES[id] || [];
    if($('#vetCityList').dataset.c !== id){ // 나라가 바뀔 때만 목록·버튼 다시 그림
      $('#vetCityList').dataset.c = id;
      $('#vetCityList').innerHTML = cities.map(([ko, local]) => `<option value="${PT.esc(ko)}">${PT.esc(local)}</option>`).join('');
      $('#vetChips').innerHTML = cities.slice(0, 5).map(([ko]) => `<button type="button" class="chip" data-city="${PT.esc(ko)}">${PT.esc(ko)}</button>`).join('');
    }
    const typed = $('#vetCity').value.trim();
    const hit = cities.find(([ko, local]) => ko === typed || local.toLowerCase() === typed.toLowerCase());
    const city = hit ? hit[1] : typed;  // 목록에서 고르면 현지 이름으로 검색, 직접 쓴 말은 그대로
    $$('#vetChips [data-city]').forEach(b => b.setAttribute('aria-pressed', !!hit && b.dataset.city === hit[0]));
    $('#vetEx').textContent = '목록에 없는 도시는 영어나 현지어로 직접 입력하세요 · 비우면 ' + PT.data().countries.find(c=>c.id===id).name + ' 전체에서 찾습니다';
    $('#vetCity').closest('.field').hidden = !!v.cnMaps;
    const q = v.q + ' ' + (city || v.place || '');
    const url = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q.trim());
    out.innerHTML = `<p style="margin:0 0 10px">현지 검색어: <b lang="${v.lang}">${PT.esc(v.q)}</b></p>` + (v.cnMaps
      ? `<div class="callout">중국 본토에서는 구글 지도를 쓸 수 없습니다. 가오더지도(高德地图)나 바이두지도(百度地图) 앱에서 위 검색어로 찾으세요.</div>`
      : `<div class="row-btns" style="margin-top:0"><button class="btn btn-primary btn-sm" type="button" id="vetNear">내 위치 주변에서 찾기</button>
          <a class="btn btn-sm" href="${url}" target="_blank" rel="noopener" id="vetPlace">${PT.esc((hit && hit[0]) || typed || PT.data().countries.find(c=>c.id===id).name)}에서 찾기 ${PT.ICON.ext}</a></div>
         <p class="save-state" id="vetSt" aria-live="polite"></p>`);
    const near = $('#vetNear'); if(!near) return;
    $('#vetPlace').addEventListener('click', () => PT.track('vet_search', {mode: city ? 'city' : 'country', country:id}));
    // 위치를 먼저 받고 → 지도 열기 링크를 보여줌 (빈 탭을 미리 열면 크롬 위치 허용 창이 가려져 about:blank만 남음)
    near.addEventListener('click', () => {
      const st = $('#vetSt');
      if(!navigator.geolocation){ st.textContent = '이 브라우저는 위치 확인을 지원하지 않아요. 도시 이름을 넣고 오른쪽 버튼을 눌러 주세요.'; return; }
      near.disabled = true; st.textContent = '현재 위치를 확인하는 중… 브라우저가 위치 권한을 물으면 허용을 눌러 주세요.';
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude.toFixed(5), lng = pos.coords.longitude.toFixed(5);
        const u = 'https://www.google.com/maps/search/' + encodeURIComponent(v.q) + '/@' + lat + ',' + lng + ',14z';
        near.disabled = false;
        st.innerHTML = `위치를 확인했어요. <a class="btn btn-primary btn-sm" href="${u}" target="_blank" rel="noopener" id="vetGo" style="margin-left:6px">내 위치 주변 지도 열기 ${PT.ICON.ext}</a>`;
        const go = $('#vetGo'); go.focus(); go.addEventListener('click', () => PT.track('vet_search', {mode:'near', country:id}));
      }, err => {
        near.disabled = false;
        st.textContent = err && err.code === 1
          ? '위치 권한이 꺼져 있어요. 주소창 왼쪽 아이콘에서 위치를 허용하거나, 도시 이름을 넣고 오른쪽 버튼을 눌러 주세요.'
          : '위치를 확인하지 못했어요(신호 없음 또는 시간 초과). 도시 이름을 넣고 오른쪽 버튼을 눌러 주세요.';
      }, {enableHighAccuracy:false, timeout:15000, maximumAge:300000});
    }); };
  draw(def); vet();
  $$('[data-lang]', el).forEach(b => b.addEventListener('click', () => { $$('[data-lang]', el).forEach(x=>x.setAttribute('aria-pressed', x===b)); LS.set('pt-sos-lang', b.dataset.lang); draw(b.dataset.lang); PT.track('sos_lang', {lang:b.dataset.lang}); }));
  $('#vetC').addEventListener('change', () => { $('#vetCity').value = ''; vet(); }); $('#vetCity').addEventListener('input', vet);
  $('#vetChips').addEventListener('click', e => { const b = e.target.closest('[data-city]'); if(!b) return; $('#vetCity').value = b.dataset.city; vet(); });
  $('#sosFull').addEventListener('click', () => { const a = $('#sosArt'); if(a && a.requestFullscreen) a.requestFullscreen().catch(()=>{}); else if(a) a.scrollIntoView({behavior:'smooth'}); PT.track('sos_open', {}); });
}

async function renderDocs(el){
  el.innerHTML = `
    <section class="panel">
      <h3 class="sec-h" style="margin-top:0">서류 사진·PDF 보관</h3>
      <p class="hint" style="margin:0 0 14px">국제항공운송협회(IATA)는 서류 사본을 따로 보관하라고 안내합니다. 원본을 잃어버렸을 때 재발급 문의나 호텔·애견 시설 확인용으로 쓰세요.</p>
      <div class="form-grid two">
        <div class="field"><label for="docType">서류 종류</label><select id="docType">${DOC_TYPES.map(t=>`<option>${t}</option>`).join('')}</select></div>
        <div class="field"><label for="docFile">파일 (사진 또는 PDF)</label><input type="file" id="docFile" accept="image/*,application/pdf"></div>
      </div>
      <p class="save-state" id="docSt" aria-live="polite"></p>
      <ul class="doc-list" id="docList"></ul>
      <div class="links" style="margin-top:14px"><a class="link" href="https://www.iata.org/contentassets/7712323d40264a11a71c8c8863d4c8f3/guidance_for_passengers_traveling_with_their_dog_or_cat_in_the_cabin_final.pdf" target="_blank" rel="noopener">IATA 기내 반려동물 동반 안내 ${PT.ICON.ext}</a></div>
    </section>
    <div class="viewer" id="viewer" hidden role="dialog" aria-modal="true" aria-label="서류 보기"><div class="viewer-bar"><b id="vTitle"></b><button class="btn btn-sm" type="button" id="vClose">닫기</button></div><div class="viewer-body" id="vBody"></div></div>`;
  const st = $('#docSt');
  const urls = [];
  const list = async () => {
    let docs = [];
    try{ docs = (await DB.all()).filter(d => d.kind==='doc').sort((a,b)=>b.added-a.added); }
    catch(e){ st.textContent = '이 브라우저에서는 서류를 저장할 수 없어요(비공개 모드 등).'; return; }
    urls.splice(0).forEach(u => URL.revokeObjectURL(u));
    $('#docList').innerHTML = docs.length ? docs.map(d => { const isImg = /^image\//.test(d.type); const u = URL.createObjectURL(d.blob); urls.push(u);
      return `<li><span class="doc-thumb">${isImg?`<img class="doc-thumb" src="${u}" alt="">`:'PDF'}</span><span class="doc-meta"><b>${PT.esc(d.title)}</b><span>${new Date(d.added).toLocaleDateString('ko-KR')} 저장 · ${Math.round(d.blob.size/1024)}KB</span></span>
        <button class="btn btn-sm" type="button" data-open="${d.id}" data-url="${u}" data-img="${isImg?1:0}">보기</button>
        <button class="icon-btn" type="button" data-del="${d.id}" aria-label="${PT.esc(d.title)} 삭제" title="삭제">${SVG.del}</button></li>`; }).join('')
      : '<li style="justify-content:center"><span class="hint">아직 보관한 서류가 없어요.</span></li>';
  };
  await list();
  $('#docFile').addEventListener('change', async e => { const f = e.target.files[0]; if(!f) return;
    if(f.size > 15e6){ st.textContent = '15MB보다 큰 파일은 보관할 수 없어요. 사진으로 찍어 올려 주세요.'; return; }
    st.textContent = '저장 중…';
    try{ const b = await shrinkImage(f, 2000, .85); const t = $('#docType').value;
      await DB.put({id:uid(), kind:'doc', title:t, type:b.type||f.type, name:f.name, blob:b, added:Date.now()}); persistOnce();
      st.textContent = t + ' 저장됨'; e.target.value=''; PT.track('doc_add', {doc_type:t}); await list(); }
    catch(err){ st.textContent = '저장하지 못했어요. 저장 공간이 부족하거나 비공개 모드일 수 있어요.'; } });
  el.addEventListener('click', async e => {
    const o = e.target.closest('[data-open]');
    if(o){ if(o.dataset.img==='1'){ $('#vTitle').textContent = o.closest('li').querySelector('b').textContent; $('#vBody').innerHTML = `<img src="${o.dataset.url}" alt="">`; $('#viewer').hidden = false; $('#vClose').focus(); }
      else window.open(o.dataset.url, '_blank'); return; }
    const d = e.target.closest('[data-del]');
    if(d){ const name = d.closest('li').querySelector('b').textContent;
      if(confirm(`'${name}' 사본을 이 기기에서 삭제할까요? 되돌릴 수 없습니다.`)){ await DB.del(d.dataset.del); st.textContent = name+' 삭제됨'; await list(); } }
  });
  const close = () => { $('#viewer').hidden = true; };
  $('#vClose').addEventListener('click', close);
  $('#viewer').addEventListener('keydown', e => { if(e.key==='Escape') close(); });
}

function renderBackup(el){
  el.innerHTML = `
    <section class="panel">
      <h3 class="sec-h" style="margin-top:0">파일로 백업하기</h3>
      <p style="margin:0 0 12px">반려견 정보, 사진·서류 사본, 준비 루틴 기록, 짐 목록, 여행 기록을 파일 하나로 내려받습니다. 파일에는 마이크로칩 번호와 연락처가 들어 있으니 안전한 곳에 보관하세요.</p>
      <button class="btn btn-primary btn-sm" type="button" id="bkOut">백업 파일 내려받기</button>
      <h3 class="sec-h">백업 파일로 되돌리기</h3>
      <p style="margin:0 0 12px">새 기기에서 백업 파일을 고르면 지금 이 기기의 내 반려견·준비 루틴·여행 기록이 파일 내용으로 바뀝니다.</p>
      <div class="field" style="max-width:420px"><label for="bkIn">백업 파일 (.json)</label><input type="file" id="bkIn" accept="application/json,.json"></div>
      <p class="save-state" id="bkSt" aria-live="polite"></p>
    </section>`;
  const st = $('#bkSt');
  $('#bkOut').addEventListener('click', async () => {
    st.textContent = '백업 파일을 만드는 중…';
    let files = [];
    try{ files = await Promise.all((await DB.all()).map(async f => ({id:f.id, kind:f.kind, title:f.title, type:f.type, name:f.name, added:f.added, data: await blobToDataUrl(f.blob)}))); }catch(e){}
    const pack = {app:'pawtrip', v:1, exported:new Date().toISOString(), wallet:W(), train:LS.get('pt-train',null), pack:LS.get('pt-pack',null), trips:LS.get('pt-trips',[]), files};
    const blob = new Blob([JSON.stringify(pack)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pawtrip-backup-' + todayIso() + '.json';
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    st.textContent = '백업 파일을 내려받았어요. 사진·서류 ' + files.length + '개 포함.'; PT.track('backup_export', {files: files.length});
  });
  $('#bkIn').addEventListener('change', async e => { const f = e.target.files[0]; if(!f) return;
    let pack; try{ pack = JSON.parse(await f.text()); }catch(err){ st.textContent = 'JSON 파일을 읽지 못했어요. PawTrip에서 받은 백업 파일인지 확인하세요.'; return; }
    if(!pack || pack.app!=='pawtrip'){ st.textContent = 'PawTrip 백업 파일이 아니에요.'; return; }
    if(!confirm('이 기기의 내 반려견 정보·서류 사본·준비 루틴·여행 기록을 백업 파일 내용으로 바꿀까요?')) { e.target.value=''; return; }
    saveW(pack.wallet||{}); if(pack.train) LS.set('pt-train', pack.train); if(pack.pack) LS.set('pt-pack', pack.pack); LS.set('pt-trips', Array.isArray(pack.trips)?pack.trips:[]);
    let n = 0;
    try{ await DB.clear(); for(const x of (pack.files||[])){ const b = await dataUrlToBlob(x.data); await DB.put({id:x.id, kind:x.kind, title:x.title, type:x.type, name:x.name, added:x.added, blob:b}); n++; } }catch(err){}
    st.textContent = '복원했어요. 사진·서류 ' + n + '개.'; PT.track('backup_import', {files:n}); e.target.value='';
  });
}

/* ============ 2. 준비 루틴: 켄넬 훈련 · 비행 당일 · 짐 싸기 ============ */
// 훈련 단계: AKC(2026-04-24) · SPCA New Zealand 크레이트 훈련 가이드 요약. 고정 일정은 출처가 없으므로 단계형으로만 제공
const TRAIN = [
  {t:'켄넬과 친해지기', d:'문을 열어 고정한 켄넬 입구와 안쪽에 간식을 놓아, 스스로 들어가게 합니다. 억지로 밀어 넣지 않습니다.'},
  {t:'켄넬 안에서 밥 먹기', d:'밥그릇을 입구에서 시작해 끼니마다 조금씩 안쪽으로 옮깁니다. 편하게 서서 먹으면 먹는 동안 문을 닫아 봅니다.'},
  {t:'문 닫기 연습', d:'문을 몇 센티만 움직였다 다시 엽니다. 문이 닫히는 것을 반길 때까지 잠그지 않습니다. 잠금장치 소리도 간식과 짝지어 익숙하게 합니다.'},
  {t:'머무는 시간 늘리기', d:'몇 초에서 시작해 천천히 늘립니다. 보호자가 옆에 앉아 있다가 잠깐 다른 방에 다녀오는 식으로, 짧은 연습과 긴 연습을 섞습니다. 약 30분을 조용히 있으면 다음 단계로.'},
  {t:'들고 이동해 보기', d:'켄넬째 들고 집 안·차 안에서 짧게 이동해 봅니다. 기내 동반이면 좌석 아래 공간처럼 좁고 낮은 곳에 두는 연습도 해 봅니다.', own:true}
];
const TRAIN_SRC = [
  {t:'AKC 크레이트 훈련 단계별 가이드', u:'https://www.akc.org/expert-advice/training/crate-training-step-by-step/'},
  {t:'SPCA New Zealand 크레이트 훈련', u:'https://www.spca.nz/advice-and-welfare/article/how-to-crate-train-your-dog'},
  {t:'AVMA 반려동물과 여행', u:'https://www.avma.org/resources/pet-owners/petcare/traveling-your-pet-faq'},
  {t:'IATA 기내 동반 승객 안내 (PDF)', u:'https://www.iata.org/contentassets/7712323d40264a11a71c8c8863d4c8f3/guidance_for_passengers_traveling_with_their_dog_or_cat_in_the_cabin_final.pdf'}
];
PTX.TRAIN_START = -56; // PawTrip 권장: 출국 8주 전 시작 (훈련 기간은 하루~수개월로 개체차가 큼 - AKC)
const SRC = {
  iata:{t:'IATA', u:'https://www.iata.org/contentassets/7712323d40264a11a71c8c8863d4c8f3/guidance_for_passengers_traveling_with_their_dog_or_cat_in_the_cabin_final.pdf'},
  iatack:{t:'IATA', u:'https://www.iata.org/contentassets/d7c512eb9a704ba2a8056e3186a31921/lar_en_excess_baggage_live_animal_acceptance_checklist.pdf'},
  oz:{t:'아시아나', u:'https://flyasiana.com/C/KR/KO/contents/traveling-with-pets'},
  law:{t:'동물보호법', u:'https://mediahub.seoul.go.kr/archives/2007982'},
  ret:{t:'귀국 검역', u:'#return'},
  air:{t:'항공사 비교', u:'#airlines'}
};
const PACK_TPL = {
  abroad:{name:'해외여행', items:[
    ['서류','목적지 입국 서류 원본 (국가별 체크리스트)','dest'],
    ['서류','동물검역증명서 원본 (출국 공항 검역본부 발급)','ret'],
    ['서류','광견병 접종증명서 · 항체가 검사 결과서 원본',''],
    ['서류','서류 사본 (사진·인쇄)','iata'],
    ['서류','항공사 반려동물 예약 확인 내역','air'],
    ['이동','항공사 규격에 맞는 케이지','air'],
    ['이동','케이지 바닥 흡수 패드·담요','iata'],
    ['이동','급수 용기 (위탁 수하물이면 케이지에 부착)','iatack'],
    ['이동','목줄·하네스, 인식표',''],
    ['이동','배변봉투',''],
    ['먹이','평소 먹던 사료 (여행 일수만큼, 양은 직접 고쳐 쓰세요)',''],
    ['먹이','간식 · 휴대용 물병과 그릇',''],
    ['건강','평소 복용약 (성분명이 적힌 처방전·약 봉투와 함께)',''],
    ['건강','간단한 구급용품',''],
    ['기타','익숙한 냄새가 밴 담요·장난감','']
  ]},
  local:{name:'국내 나들이·캠핑', items:[
    ['필수','목줄·가슴줄 (2m 이내)','law'],
    ['필수','인식표 (이름·연락처·동물등록번호)','law'],
    ['필수','배변봉투 (배설물 수거)','law'],
    ['먹이','사료·간식',''],
    ['먹이','물병·그릇',''],
    ['건강','평소 복용약',''],
    ['건강','진드기 예방·간단한 구급용품',''],
    ['기타','담요·방석',''],
    ['기타','좋아하는 장난감','']
  ]}
};
const packState = () => {
  const p = LS.get('pt-pack', null);
  if(p && p.lists) return p;
  const lists = {}; Object.entries(PACK_TPL).forEach(([k,v]) => { lists[k] = v.items.map(([g,t,s]) => ({id:uid(), g, t, s, on:false})); });
  return {tpl:'abroad', lists};
};
const trainState = () => LS.get('pt-train', {done:[], log:[]});

PTX.views.prep = function(){
  const app = PT.app;
  const tr = trainState(); const ps = packState();
  const c = PT.data().countries.find(x=>x.id===PT.state.dest);
  const dep = PT.state.dep;
  let startTxt = '';
  if(dep){ const [y,m,d] = dep.split('-').map(Number); const s = new Date(y,m-1,d+PTX.TRAIN_START); const n = Math.round((s - new Date(new Date().setHours(0,0,0,0)))/86400000);
    startTxt = `${c?PT.esc(c.name)+' · ':''}출국 ${fmtDot(dep)} 기준, 늦어도 <b>${s.getFullYear()}.${String(s.getMonth()+1).padStart(2,'0')}.${String(s.getDate()).padStart(2,'0')}</b>${n>0?` (${n}일 뒤)`:n===0?' (오늘)':` (${-n}일 지남)`}에는 시작하세요.`; }
  // 최근 14일 연습 기록
  const days = []; for(let i=13;i>=0;i--){ const d = new Date(); d.setDate(d.getDate()-i); const iso = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); days.push({iso, on: tr.log.includes(iso), n:d.getDate()}); }
  const practicedToday = tr.log.includes(todayIso());
  const list = ps.lists[ps.tpl] || [];
  const doneN = list.filter(i=>i.on).length;
  const groups = [...new Set(list.map(i=>i.g))];
  const srcLink = s => { if(!s) return ''; if(s==='dest') return c?`<a class="src" href="#${c.id}">${PT.esc(c.name)} 체크리스트</a>`:''; const x = SRC[s]; return x?`<a class="src" href="${x.u}" ${x.u.startsWith('#')?'':'target="_blank" rel="noopener"'}>${x.t}</a>`:''; };
  app.innerHTML = PT.head('준비하기 · 준비 루틴','켄넬 적응부터 짐 싸기까지','큰 여행 전 매일 조금씩 하는 켄넬 연습과, 한 번 만들어 두고 계속 다시 쓰는 짐 목록입니다.') + `
    <div class="dgrid">
      <section class="panel">
        <h3 class="sec-h" style="margin-top:0">켄넬 적응 훈련</h3>
        <p style="margin:0 0 6px">국제항공운송협회(IATA)와 미국수의사회(AVMA)는 여행에 쓸 켄넬에 <b>미리, 충분히</b> 익숙해지게 하라고 안내합니다. 걸리는 기간은 하루에서 몇 달까지 개마다 다릅니다(AKC).</p>
        <p class="hint" style="margin:0 0 14px">${dep?startTxt:'일정 계산에서 출국일을 넣으면 시작 권장일이 나옵니다.'} 시작 시점(출국 8주 전)은 위 출처의 "충분히 미리"를 바탕으로 PawTrip이 정한 권장값입니다.</p>
        <div class="row-btns" style="margin:0 0 6px"><button class="btn ${practicedToday?'':'btn-primary'} btn-sm" type="button" id="trToday" aria-pressed="${practicedToday}">${practicedToday?'오늘 연습 기록됨 ✓':'오늘 연습했어요'}</button></div>
        <ul class="days" aria-label="최근 14일 연습 기록">${days.map(d=>`<li class="${d.on?'on':''}" title="${d.iso}${d.on?' 연습함':''}">${d.n}</li>`).join('')}</ul>
        <p class="hint" style="margin:6px 0 16px">최근 14일 중 ${days.filter(d=>d.on).length}일 연습 · 전체 ${tr.log.length}일</p>
        <ol class="steps">${TRAIN.map((s,i)=>`<li class="${tr.done.includes(i)?'done':''}"><h4>${s.t}</h4><p>${s.d}</p>${s.own?'<p class="hint">이 단계는 출처 가이드에 없는 PawTrip 제안입니다.</p>':''}<label class="check"><input type="checkbox" data-step="${i}" ${tr.done.includes(i)?'checked':''}><span>이 단계 익숙해짐</span></label></li>`).join('')}</ol>
        <div class="callout" style="margin-top:14px"><strong>속도를 늦춰야 할 때</strong>낑낑거리면 너무 빨리 진행한 것입니다. 조용해진 몇 초 뒤에 문을 열어 주세요. 계속 울거나 공황 상태처럼 보이면 훈련을 멈추고 수의사나 행동 전문가와 상담하세요. 켄넬을 벌 주는 장소로 쓰지 마세요.</div>
        <div class="links">${TRAIN_SRC.map(s=>`<a class="link" href="${s.u}" target="_blank" rel="noopener">${s.t} ${PT.ICON.ext}</a>`).join('')}</div>
      </section>
      <section class="panel">
        <h3 class="sec-h" style="margin-top:0">비행 당일</h3>
        <ul class="checks">
          <li><span>가벼운 식사는 <b>비행 최소 2시간 전</b>, 켄넬에 넣기 직전에 물 조금과 산책 (IATA)</span></li>
          <li>먹이와 물을 언제 줄지는 수의사와 먼저 상의하세요 (AVMA)</li>
          <li>진정제·안정제는 권장하지 않습니다. 심장·호흡 문제 위험이 커지고 대부분 항공사가 허용하지 않습니다 (AVMA, IATA)</li>
          <li>아시아나항공은 안정제·수면제를 투여한 반려동물을 운송하지 않습니다</li>
          <li>케이지는 새지 않아야 하고 바닥에 흡수 패드·담요를 깔아야 합니다 (IATA, 아시아나)</li>
        </ul>
        <div class="links"><a class="link" href="${SRC.iata.u}" target="_blank" rel="noopener">IATA 안내 ${PT.ICON.ext}</a><a class="link" href="https://www.avma.org/resources/pet-owners/petcare/traveling-your-pet-faq" target="_blank" rel="noopener">AVMA 안내 ${PT.ICON.ext}</a><a class="link" href="${SRC.oz.u}" target="_blank" rel="noopener">아시아나 반려동물 동반 ${PT.ICON.ext}</a></div>

        <h3 class="sec-h">짐 싸기 리스트</h3>
        <div class="chips" role="group" aria-label="목록 종류">${Object.entries(PACK_TPL).map(([k,v])=>`<button class="chip" type="button" data-tpl="${k}" aria-pressed="${ps.tpl===k}">${v.name}</button>`).join('')}</div>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="${doneN}" aria-label="챙긴 짐"><i style="width:${list.length?Math.round(doneN/list.length*100):0}%"></i></div>
        <p class="hint" style="margin:0">${list.length}개 중 ${doneN}개 챙김 · 체크 상태와 목록은 이 기기에 저장되어 다음 여행에도 그대로 다시 쓸 수 있어요.</p>
        ${groups.map(g=>`<p class="pack-group">${PT.esc(g)}</p><ul class="pack">${list.filter(i=>i.g===g).map(i=>`<li><label><input type="checkbox" data-item="${i.id}" ${i.on?'checked':''}><span>${PT.esc(i.t)}</span></label>${srcLink(i.s)}<button class="icon-btn" type="button" data-rm="${i.id}" aria-label="${PT.esc(i.t)} 목록에서 빼기" title="목록에서 빼기">${SVG.del}</button></li>`).join('')}</ul>`).join('')}
        <form class="add-row" id="addItem"><label class="sr-only" for="newItem">추가할 짐</label><input type="text" id="newItem" placeholder="우리 개만의 짐 추가 (예: 최애 삑삑이 공)"><button class="btn btn-sm" type="submit">추가</button></form>
        <div class="row-btns"><button class="btn btn-sm" type="button" id="packReset">체크만 모두 지우기</button><button class="btn btn-sm btn-danger" type="button" id="packTpl">기본 목록으로 되돌리기</button></div>
      </section>
    </div>
    ${PTX.alertBox('prep')}`;
  const saveP = () => LS.set('pt-pack', ps); const saveT = () => LS.set('pt-train', tr);
  $('#trToday').addEventListener('click', () => { const t = todayIso(); if(tr.log.includes(t)) tr.log = tr.log.filter(x=>x!==t); else { tr.log.push(t); PT.track('training_log', {days: tr.log.length}); } saveT(); persistOnce(); PTX.views.prep(); });
  $$('[data-step]', app).forEach(cb => cb.addEventListener('change', () => { const i = +cb.dataset.step; tr.done = cb.checked ? [...new Set([...tr.done, i])] : tr.done.filter(x=>x!==i); saveT(); cb.closest('li').classList.toggle('done', cb.checked); if(cb.checked) PT.track('training_step', {step:i+1}); }));
  $$('[data-tpl]', app).forEach(b => b.addEventListener('click', () => { ps.tpl = b.dataset.tpl; saveP(); PTX.views.prep(); }));
  $$('[data-item]', app).forEach(cb => cb.addEventListener('change', () => { const it = list.find(x=>x.id===cb.dataset.item); if(it){ it.on = cb.checked; saveP(); persistOnce(); const n = list.filter(x=>x.on).length; $('.progress i', app).style.width = Math.round(n/list.length*100)+'%'; } }));
  $$('[data-rm]', app).forEach(b => b.addEventListener('click', () => { ps.lists[ps.tpl] = list.filter(x=>x.id!==b.dataset.rm); saveP(); PTX.views.prep(); }));
  $('#addItem').addEventListener('submit', e => { e.preventDefault(); const v = $('#newItem').value.trim(); if(!v) return; list.push({id:uid(), g:'내가 추가한 짐', t:v, s:'', on:false}); ps.lists[ps.tpl] = list; saveP(); PT.track('packing_add', {}); PTX.views.prep(); setTimeout(()=>{ const n=$('#newItem'); if(n) n.focus(); }, 0); });
  $('#packReset').addEventListener('click', () => { list.forEach(i=>i.on=false); saveP(); PTX.views.prep(); });
  $('#packTpl').addEventListener('click', () => { if(!confirm(`'${PACK_TPL[ps.tpl].name}' 목록을 기본 목록으로 되돌릴까요? 직접 추가한 짐이 사라집니다.`)) return; ps.lists[ps.tpl] = PACK_TPL[ps.tpl].items.map(([g,t,s]) => ({id:uid(), g, t, s, on:false})); saveP(); PTX.views.prep(); });
};

/* ============ 3. 여행 기록 · 결산 카드 ============ */
// 공항 좌표: OurAirports (퍼블릭 도메인) · 정기편 있는 대형·중형 공항만 추려 airports.json에 저장
const CNAME = {KR:'한국',JP:'일본',US:'미국',CA:'캐나다',FR:'프랑스',DE:'독일',GB:'영국',CN:'중국',SG:'싱가포르',AU:'호주',TH:'태국',VN:'베트남',PH:'필리핀',GU:'괌',MP:'사이판',TW:'대만',HK:'홍콩',MO:'마카오'};
let AIRPORTS = null;
const loadAirports = () => AIRPORTS ? Promise.resolve(AIRPORTS) : fetch('/airports.json').then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }).then(a => (AIRPORTS = a));
const apt = code => AIRPORTS && AIRPORTS.find(a => a[0]===code);
function gc(a, b){ // 대권 거리(km), 지구 평균 반지름 6371km
  const R = 6371, toR = x => x*Math.PI/180;
  const dLat = toR(b[4]-a[4]), dLon = toR(b[5]-a[5]);
  const h = Math.sin(dLat/2)**2 + Math.cos(toR(a[4]))*Math.cos(toR(b[4]))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.min(1, Math.sqrt(h)));
}
const EARTH = 40075; // 적도 둘레 km
let tripYear = 'all';
// 국내 공항 → 지역 이름 (김포·인천은 같은 수도권으로 묶음)
const KR_REGION = {GMP:'서울', ICN:'서울', CJU:'제주', PUS:'부산', CJJ:'청주', TAE:'대구', KWJ:'광주', MWX:'무안', RSU:'여수', USN:'울산', KPO:'포항', HIN:'사천', KUV:'군산', WJU:'원주', YNY:'양양'};
const KR_CODE = {'제주':'JEJU','부산':'BUSAN','청주':'CJJ','대구':'DAEGU','광주':'KWJ','무안':'MWX','여수':'YEOSU','울산':'ULSAN','포항':'KPO','사천':'HIN','군산':'KUV','원주':'WJU','양양':'YNY','서울':'SEOUL'};
function tripStats(trips){
  const legs = trips.map(t => { const a = apt(t.from), b = apt(t.to); return {...t, a, b, km: a&&b ? gc(a,b) : 0}; });
  const km = legs.reduce((s,l)=>s+l.km, 0);
  const countries = [...new Set(legs.flatMap(l => [l.b&&l.b[3], l.a&&l.a[3]]).filter(c => c && c!=='KR'))];
  // 국내 여행지: 국내 도착지 중 '집'(가장 먼저 기록한 구간의 출발 지역)이 아닌 곳
  const first = [...legs].sort((x,y)=>(x.date||'9999').localeCompare(y.date||'9999') || (x.seq||0)-(y.seq||0))[0];
  const home = first && first.a && first.a[3]==='KR' ? (KR_REGION[first.from]||first.from) : '서울';
  const domestic = [...new Set(legs.filter(l => l.b && l.b[3]==='KR').map(l => KR_REGION[l.to]||l.to).filter(r => r!==home))];
  const airports = new Set(legs.flatMap(l=>[l.from,l.to]));
  return {legs, km, countries, domestic, airports: airports.size};
}
const stampList = s => [...s.countries.map(c => ({code:c, name:CNAME[c]||''})), ...s.domestic.map(r => ({code:KR_CODE[r]||r, name:r, dom:true}))];
PTX.views.trips = async function(){
  const app = PT.app;
  app.innerHTML = PT.head('내 반려견 · 여행 기록','우리 개가 함께 날아간 길','비행 구간을 기록하면 함께 이동한 거리와 다녀온 나라가 쌓이고, 인스타그램 스토리 크기의 결산 카드를 만들 수 있어요.') + '<p class="hint">공항 목록을 불러오는 중…</p>';
  try{ await loadAirports(); }catch(e){ app.insertAdjacentHTML('beforeend', '<div class="callout bad"><strong>공항 목록을 불러오지 못했어요</strong>인터넷 연결 후 다시 열어 주세요.</div>'); return; }
  const all = LS.get('pt-trips', []).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const years = [...new Set(all.map(t=>(t.date||'').slice(0,4)).filter(Boolean))].sort().reverse();
  if(tripYear!=='all' && !years.includes(tripYear)) tripYear = 'all';
  const trips = tripYear==='all' ? all : all.filter(t => (t.date||'').startsWith(tripYear));
  const s = tripStats(trips);
  const opt = AIRPORTS.map(a => `<option value="${a[0]} · ${PT.esc(CNAME[a[3]]||a[3])} ${PT.esc(a[2]||'')} · ${PT.esc(a[1])}"></option>`).join('');
  const w = W();
  app.innerHTML = PT.head('내 반려견 · 여행 기록','우리 개가 함께 날아간 길','비행 구간을 기록하면 함께 이동한 거리와 다녀온 나라가 쌓이고, 인스타그램 스토리 크기의 결산 카드를 만들 수 있어요.') + `
    <div class="dgrid">
      <section class="panel">
        <h3 class="sec-h" style="margin-top:0">비행 구간 추가</h3>
        <form class="form-grid" id="legForm" autocomplete="off">
          <div class="field"><label for="lgDate">날짜 (모르면 비워 두기)</label><input type="date" id="lgDate" value="${todayIso()}"><p class="hint">날짜가 없는 구간은 '전체' 결산에만 들어가고 연도별 결산에서는 빠집니다.</p></div>
          <div class="field"><label for="lgFrom">출발 공항</label><input type="search" id="lgFrom" list="aptList" placeholder="ICN 또는 인천" value="ICN · 한국 Seoul · Incheon International Airport" required></div>
          <div class="field"><label for="lgTo">도착 공항</label><input type="search" id="lgTo" list="aptList" placeholder="NRT, 도쿄, Narita…" required><p class="hint">공항 코드 세 글자나 도시 영문 이름으로 찾을 수 있어요.</p></div>
          <label class="check"><input type="checkbox" id="lgBack"><span>같은 노선으로 돌아오는 편도 함께 추가</span></label>
          <div class="field" id="backWrap" hidden><label for="lgBackDate">돌아온 날짜</label><input type="date" id="lgBackDate"></div>
          <div class="field" style="max-width:220px"><label for="lgTimes">같은 여정을 몇 번 다녀왔나요</label><input type="number" id="lgTimes" min="1" max="50" step="1" value="1" inputmode="numeric"><p class="hint">예: 김포↔제주 왕복 10번이면 왕복 체크 + 10</p></div>
          <datalist id="aptList">${opt}</datalist>
          <p class="save-state" id="lgSt" aria-live="polite"></p>
          <div><button class="btn btn-primary btn-sm" type="submit">구간 추가</button></div>
        </form>
      </section>
      <section class="panel">
        ${years.length>1?`<div class="chips" role="group" aria-label="연도">${['all',...years].map(y=>`<button class="chip" type="button" data-year="${y}" aria-pressed="${tripYear===y}">${y==='all'?'전체':y+'년'}</button>`).join('')}</div>`:''}
        <div class="stats-row">
          <div class="stat-tile"><b>${Math.round(s.km).toLocaleString('ko-KR')}</b><span>km 함께 이동</span></div>
          <div class="stat-tile"><b>${s.legs.length}</b><span>번 비행</span></div>
          <div class="stat-tile"><b>${s.countries.length}</b><span>개 나라 (해외)</span></div>
          <div class="stat-tile"><b>${s.domestic.length}</b><span>곳 (국내)</span></div>
        </div>
        <p class="hint" style="margin:8px 0 0">지구 둘레 기준 ${(s.km/EARTH).toFixed(2)}바퀴</p>
        ${stampList(s).length?`<div class="stamps" aria-label="다녀온 곳">${stampList(s).map(x=>`<span class="stamp"><span><b${x.dom&&x.code.length>3?' style="font-size:12px"':''}>${PT.esc(x.code)}</b>${PT.esc(x.name)}</span></span>`).join('')}</div>`:''}
        <h3 class="sec-h">기록한 구간</h3>
        <ul class="legs">${s.legs.length ? s.legs.map(l=>`<li><span class="hint">${l.date?fmtDot(l.date):'날짜 없음'}</span><span><span class="route">${PT.esc(l.from)} → ${PT.esc(l.to)}</span><br><span class="km">${l.a&&l.b?PT.esc((l.a[2]||l.a[1]))+' → '+PT.esc((l.b[2]||l.b[1]))+' · '+Math.round(l.km).toLocaleString('ko-KR')+'km':'공항 정보 없음'}</span></span><button class="icon-btn" type="button" data-rmleg="${l.id}" aria-label="${PT.esc(l.from)}→${PT.esc(l.to)} 구간 삭제" title="삭제">${SVG.del}</button></li>`).join('') : '<li style="display:block"><span class="hint">아직 기록한 비행이 없어요. 첫 비행을 추가해 보세요.</span></li>'}</ul>
        <h3 class="sec-h">결산 카드</h3>
        <div class="form-grid two">
          <div class="field"><label for="rcName">반려견 이름</label><input type="text" id="rcName" value="${PT.esc(w.name||'')}" placeholder="내 반려견에서 불러옴"></div>
          <div class="field"><label for="rcTitle">카드 제목</label><input type="text" id="rcTitle" value="${tripYear==='all'?'함께한 여행 결산':tripYear+' 여행 결산'}"></div>
        </div>
        <div class="row-btns"><button class="btn btn-primary btn-sm" type="button" id="rcMake" ${s.legs.length?'':'disabled'}>결산 카드 만들기</button></div>
        <div class="recap-preview" id="rcOut"></div>
        <p class="hint" style="margin-top:12px">거리는 두 공항 사이의 대권 거리(지구 표면 최단 거리)로, 실제 비행 경로보다 조금 짧게 나옵니다. 공항 좌표: <a href="https://ourairports.com/data/" target="_blank" rel="noopener">OurAirports</a> (퍼블릭 도메인). 사진은 내 반려견에 저장한 사진을 씁니다.</p>
      </section>
    </div>`;
  const code = v => { const m = (v||'').trim().toUpperCase().match(/^([A-Z]{3})\b/); if(m && apt(m[1])) return m[1];
    const q = (v||'').trim().toLowerCase(); if(!q) return null; const hit = AIRPORTS.find(a => (a[2]||'').toLowerCase()===q || a[1].toLowerCase().includes(q)); return hit ? hit[0] : null; };
  $('#lgBack').addEventListener('change', e => { $('#backWrap').hidden = !e.target.checked; });
  $('#legForm').addEventListener('submit', e => { e.preventDefault();
    const f = code($('#lgFrom').value), t = code($('#lgTo').value), d = $('#lgDate').value, st = $('#lgSt');
    if(!f || !t){ st.textContent = '공항을 목록에서 골라 주세요. 공항 코드(예: NRT)로 찾으면 정확합니다.'; return; }
    if(f===t){ st.textContent = '출발과 도착 공항이 같아요.'; return; }
    const times = Math.max(1, Math.min(50, parseInt($('#lgTimes').value,10) || 1));
    const list = LS.get('pt-trips', []); let seq = list.reduce((m,x)=>Math.max(m, x.seq||0), 0);
    for(let k=0;k<times;k++){ list.push({id:uid(), seq:++seq, date:d, from:f, to:t});
      if($('#lgBack').checked) list.push({id:uid(), seq:++seq, date:$('#lgBackDate').value || d, from:t, to:f}); }
    LS.set('pt-trips', list); persistOnce(); PT.track('trip_add', {legs: list.length}); PTX.views.trips(); });
  $$('[data-rmleg]', app).forEach(b => b.addEventListener('click', () => { if(!confirm('이 구간 기록을 삭제할까요?')) return; LS.set('pt-trips', LS.get('pt-trips', []).filter(x=>x.id!==b.dataset.rmleg)); PTX.views.trips(); }));
  $$('[data-year]', app).forEach(b => b.addEventListener('click', () => { tripYear = b.dataset.year; PTX.views.trips(); }));
  $('#rcMake').addEventListener('click', async () => {
    const out = $('#rcOut'); out.innerHTML = '<p class="hint">카드를 그리는 중…</p>';
    try{ const blob = await drawRecap(s, $('#rcName').value.trim(), $('#rcTitle').value.trim());
      const url = URL.createObjectURL(blob); const file = new File([blob], 'pawtrip-recap.png', {type:'image/png'});
      out.innerHTML = `<img src="${url}" alt="여행 결산 카드 미리보기"><div class="row-btns"><a class="btn btn-sm" href="${url}" download="pawtrip-recap-${todayIso()}.png" id="rcDl">이미지 저장</a>${navigator.canShare && navigator.canShare({files:[file]})?'<button class="btn btn-primary btn-sm" type="button" id="rcShare">공유하기</button>':''}</div>`;
      PT.track('recap_create', {legs: s.legs.length, countries: s.countries.length});
      $('#rcDl').addEventListener('click', () => PT.track('recap_save', {}));
      const sh = $('#rcShare'); if(sh) sh.addEventListener('click', () => { navigator.share({files:[file], title:'PawTrip 여행 결산', text:'pawtrip.us'}).then(()=>PT.track('recap_share', {})).catch(()=>{}); });
    }catch(err){ out.innerHTML = '<div class="callout bad">카드를 만들지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.</div>'; }
  });
};

async function drawRecap(s, name, title){
  const W_ = 1080, H = 1920; const cv = document.createElement('canvas'); cv.width = W_; cv.height = H; const g = cv.getContext('2d');
  try{ await document.fonts.ready; }catch(e){}
  const F = '"Pretendard Variable",Pretendard,"Apple SD Gothic Neo","Noto Sans KR",sans-serif';
  const NAVY = '#1D3557', CORAL = '#E63946', CREAM = '#F5F5F0', INK = '#222326';
  g.fillStyle = CREAM; g.fillRect(0,0,W_,H);
  // 상단 띠
  g.fillStyle = NAVY; g.fillRect(0,0,W_,14);
  // 로고
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  try{ const logo = await loadImg('/media/logo-light.svg'); const lw = 360, lh = lw*logo.height/logo.width || 90; g.drawImage(logo, (W_-lw)/2, 110, lw, lh); }catch(e){
    g.fillStyle = NAVY; g.font = `800 64px ${F}`; g.textAlign='center'; g.fillText('PawTrip', W_/2, 180); }
  g.textAlign = 'center';
  // 사진
  let photo = null; try{ const p = await DB.get('photo'); if(p && p.blob) photo = await loadImg(URL.createObjectURL(p.blob)); }catch(e){}
  const cx = W_/2, cy = 470, r = 170;
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI*2); g.closePath(); g.fillStyle = '#EDEBE3'; g.fill(); g.clip();
  if(photo){ const sc = Math.max(2*r/photo.width, 2*r/photo.height); const pw = photo.width*sc, ph = photo.height*sc; g.drawImage(photo, cx-pw/2, cy-ph/2, pw, ph); }
  else { g.fillStyle = CORAL; g.font = `700 150px ${F}`; g.textBaseline='middle'; g.fillText('🐾', cx, cy+8); g.textBaseline='alphabetic'; }
  g.restore();
  g.lineWidth = 8; g.strokeStyle = CORAL; g.setLineDash([18,12]); g.beginPath(); g.arc(cx, cy, r+18, 0, Math.PI*2); g.stroke(); g.setLineDash([]);
  // 제목
  g.fillStyle = INK; g.font = `800 72px ${F}`; g.fillText(name || '우리 강아지', cx, 760);
  g.font = `600 40px ${F}`; g.fillStyle = NAVY; g.fillText(title || '함께한 여행 결산', cx, 830);
  // 큰 숫자
  g.fillStyle = CORAL; g.font = `800 170px ${F}`; g.fillText(Math.round(s.km).toLocaleString('ko-KR'), cx, 1040);
  g.fillStyle = INK; g.font = `700 46px ${F}`; g.fillText('km 함께 날았어요', cx, 1110);
  g.font = `500 34px ${F}`; g.fillStyle = '#5A5B60'; g.fillText(`지구 ${(s.km/EARTH).toFixed(2)}바퀴 · 비행 ${s.legs.length}번 · 해외 ${s.countries.length}곳 · 국내 ${s.domestic.length}곳`, cx, 1175);
  // 스탬프
  const all = stampList(s); const cs = all.slice(0, 8); const per = Math.min(4, cs.length) || 1; const sr = 92, gap = 40;
  cs.forEach((c, i) => { const row = Math.floor(i/4), col = i%4; const n = Math.min(4, cs.length - row*4);
    const x = cx - (n*(2*sr) + (n-1)*gap)/2 + sr + col*(2*sr+gap), y = 1370 + row*(2*sr+50);
    const col1 = i%2 ? NAVY : CORAL;
    g.save(); g.translate(x, y); g.rotate((i%2? 6 : -7)*Math.PI/180);
    g.lineWidth = 6; g.strokeStyle = col1; g.setLineDash([14,9]); g.beginPath(); g.arc(0,0,sr,0,Math.PI*2); g.stroke(); g.setLineDash([]);
    g.lineWidth = 3; g.beginPath(); g.arc(0,0,sr-16,0,Math.PI*2); g.stroke();
    g.fillStyle = col1; g.font = `800 ${c.code.length>3?34:46}px ${F}`; g.fillText(c.code, 0, 4); g.font = `700 26px ${F}`; g.fillText(c.name, 0, 42);
    g.restore(); });
  if(all.length > 8){ g.fillStyle = NAVY; g.font = `600 30px ${F}`; g.fillText(`외 ${all.length-8}곳`, cx, 1370 + 2*(2*sr+50) - 40); }
  // 하단
  g.fillStyle = NAVY; g.fillRect(0, H-150, W_, 150);
  g.fillStyle = '#FFFFFF'; g.font = `700 40px ${F}`; g.fillText('pawtrip.us', cx, H-82);
  g.font = `500 24px ${F}`; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText('반려견 해외여행 준비 · 거리는 공항 간 대권 거리 기준', cx, H-40);
  return new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('toBlob')), 'image/png'));
}

/* ============ 연결 ============ */
PTX.init = function(api){ PT = api;
  const foot = document.getElementById('alertRow');
  if(foot && channelUrl()){ foot.innerHTML = PTX.alertBox('footer'); foot.hidden = false; }
};
})();
