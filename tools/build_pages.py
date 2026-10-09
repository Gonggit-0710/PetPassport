# -*- coding: utf-8 -*-
"""PawTrip 실제 주소 페이지 생성기
실행: python tools/build_pages.py  (저장소 루트에서)
- /domestic/ /titer/ /cost/ /changes/ /local/ 의 index.html 과 sitemap.xml 을 만듭니다.
- 규정 숫자를 바꿀 때는 이 파일의 PAGES 내용을 고친 뒤 다시 실행하세요.
- 확인일(VERIFIED)은 공식 페이지를 다시 확인한 날로 바꿉니다.
"""
import os, html, json, datetime, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERIFIED = '2026-10-08'
SITE = 'https://pawtrip.us'

def ext(url, title):
    return f'<a class="link" href="{html.escape(url)}" target="_blank" rel="noopener">{html.escape(title)} <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2H10v5.5M10 2L3 9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></a>'

def flag(tone, text):
    return f'<span class="flag {tone}">{html.escape(text)}</span>'

SHELL = '''<!doctype html>
<html lang="ko" data-ads="off">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · PawTrip</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="article">
<meta property="og:title" content="{title} · PawTrip">
<meta property="og:description" content="{desc}">
<meta property="og:locale" content="ko_KR">
<meta property="og:image" content="https://pawtrip.us/media/og.jpg?v=5">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FAFAFA">
<link rel="canonical" href="{url}">
<link rel="icon" href="/media/mark.svg?v=4" type="image/svg+xml">
<link rel="apple-touch-icon" href="/media/apple-touch-icon.png?v=4">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/base.css?v=1">
<link rel="stylesheet" href="/features.css?v=3">
<script>
(function(){{
  var ID='G-6G8CX7W76G', H=location.hostname;
  window.dataLayer=window.dataLayer||[]; window.gtag=function(){{dataLayer.push(arguments);}};
  if(!/(^|\\.)pawtrip\\.us$/.test(H)) return;
  var s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+ID; document.head.appendChild(s);
  gtag('js',new Date()); gtag('config',ID,{{send_page_view:false}});
}})();
</script>
<style>
.doc h2{{font-size:20px;font-weight:800;letter-spacing:-.02em;margin:40px 0 12px}}
.doc h3{{font-size:16px;font-weight:700;margin:24px 0 8px}}
.doc p{{margin:0 0 12px;max-width:46em}}
.doc .tablewrap{{margin:12px 0}}
.doc table.cmp td,.doc table.cmp th{{font-size:14px}}
.doc .src{{font-size:var(--t-small);margin-top:6px}}
.air-grid{{display:grid;gap:16px;margin:12px 0}}
@media (min-width:1100px){{.air-grid{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}
.air h3{{margin:0 0 12px;font-size:18px}}
.air-grid .panel + .panel{{margin-top:0}}
.air .kv{{grid-template-columns:44px minmax(0,1fr)}}
#cOut .fees{{width:100%}}
#cOut .fees th{{width:auto;text-align:left;font-weight:600}}
#cOut .fees .hint{{font-weight:400}}
#cOut .fees td{{white-space:nowrap;text-align:right;vertical-align:top}}
.toc{{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}}
.updated{{font-size:var(--t-small)}}
</style>
</head>
<body>
<a class="skip" href="#main">본문으로 건너뛰기</a>
<header class="topbar">
  <div class="topbar-row">
    <a class="logo" href="/" aria-label="PawTrip 홈"><picture><source srcset="/media/logo-dark.svg" media="(prefers-color-scheme: dark)"><img src="/media/logo-light.svg" alt="PawTrip" style="height:34px;width:auto"></picture></a>
    <span class="topbar-right"><span class="meta">확인일 <b>{verified}</b></span><a class="sos-btn" href="/#sos" aria-label="응급 SOS 카드 열기">SOS</a></span>
  </div>
  <nav class="tabs groups" id="navGroups" aria-label="메뉴 묶음"></nav>
  <nav class="tabs" id="navSub" aria-label="메뉴"></nav>
</header>
<div class="shell">
  <aside class="rail" aria-label="사이트 메뉴">
    <a class="logo" href="/"><picture><source srcset="/media/logo-dark.svg" media="(prefers-color-scheme: dark)"><img src="/media/logo-light.svg" alt="PawTrip" style="height:38px;width:auto"></picture></a>
    <nav aria-label="메뉴" id="navRail"></nav>
    <a class="sos-rail" href="/#sos"><span class="sos-btn" aria-hidden="true">SOS</span><span><b>응급 SOS 카드</b>현지 수의사에게 바로 보여주기</span></a>
    <div class="meta"><strong>대한민국 출발 기준</strong>이 페이지 확인일 {verified}<br>출발 전 공식 출처에서 다시 확인하세요.</div>
  </aside>
  <div class="content">
    <main id="main" class="doc" tabindex="-1">
      <header class="page-head"><span class="num">{group}</span><h1 style="font-size:var(--t-h2);font-weight:800;letter-spacing:-.03em;line-height:1.3;margin:8px 0 10px">{title}</h1><p>{lead}</p><p class="updated">공식 출처 확인일 {verified}</p></header>
{body}
    </main>
    <footer class="foot">
      <p>PawTrip은 공식 출처를 요약한 참고 자료입니다. 항공사·철도 운영사·각국 기관은 규정을 예고 없이 바꿉니다. 출발 전 각 항목의 출처 링크에서 최신 내용을 다시 확인하세요.</p>
      <p><a href="/#about">기준과 출처</a> · <a href="/changes/">규정 변경 이력</a> · <a href="/privacy.html"><strong>개인정보처리방침</strong></a> · 문의 <a href="mailto:help@pawtrip.us">help@pawtrip.us</a></p>
      <p>© PawTrip · pawtrip.us</p>
    </footer>
  </div>
</div>
<script src="/nav.js?v=2"></script>
<script src="/search.js?v=1"></script>
<script>
PTNav.render('{tab}');
try{{ gtag('event','page_view',{{page_path:location.pathname,page_title:document.title}}); }}catch(e){{}}
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('/sw.js').catch(function(){{}});
document.addEventListener('click',function(e){{var a=e.target.closest('a.link[target="_blank"]'); if(a) try{{gtag('event','source_click',{{link_url:a.href,item_id:'{tab}'}});}}catch(x){{}}}});
</script>
{extra}
</body>
</html>
'''

# ------------------------------------------------------------------ 국내 이동
D_AIR = [
  # name, cabin, cabinSize, checked, fee, apply, notes, sources
  ('대한항공', '케이지 포함 7kg 이하', '32×45×19cm 이하 (소프트 높이 25cm, 눌러서 19cm)',
   '가능 · 케이지 포함 45kg 이하 (세 변 합 291cm·높이 84cm, 생후 16주 이상). B737·A321은 6~9월 위탁 제한',
   '32kg 이하 30,000원 · 33~45kg 60,000원 (편도)', '출발 24시간 전까지 사전 신청, 승인 후 결제',
   ['1인당 기내 1마리 + 위탁 2마리 (총 3마리)', '단두종(교배종 포함)은 위탁 불가', '국내선 필요 서류 없음'],
   [('https://www.koreanair.com/contents/plan-your-travel/special-assistance/travel-with-pets/guide','대한항공 반려동물 동반 안내')]),
  ('아시아나항공', '케이지 포함 7kg 이하', '32×45×21cm 이내 (소프트 높이 26cm, 눌러서 21cm)',
   '가능 · 케이지 포함 45kg 이하 (세 변 합 285cm·높이 84cm)',
   '32kg 이하 30,000원 · 32kg 초과~45kg 60,000원 (2022-05-01 발권분)', '출발 24시간 전(영업일 기준)까지 예약센터 1588-8000 확약',
   ['1인당 기내 1마리 또는 위탁 2마리', '단두종 위탁 중단 (2019-07-01부)', '김포·제주·광주·여수·대구·청주 공항 카운터에서 케이지 구매 가능 (아시아나 탑승 45,000원)'],
   [('https://flyasiana.com/C/KR/KO/contents/traveling-with-pets','아시아나항공 반려동물 동반')]),
  ('제주항공', '케이지 포함 9kg 이하', '세 변 합 100cm 이하, 가로 37cm·높이 23cm 이하 (소프트 높이 28cm)',
   '불가 (기내만)', '25,000원 (1인 1마리, 구간당)', '고객센터 1599-1500 또는 홈페이지·앱',
   ['성인 1명당 1마리, 항공기당 최대 6마리'],
   [('https://www.jejuair.net/ko/linkService/help/main.do','제주항공 반려동물 운송 서비스')]),
  ('진에어', '케이지 포함 9kg 이내 (B737·B777)', '세 변 합 115cm, 높이 20cm (소프트 26cm)',
   'B777 운항편만 · 케이지 포함 45kg 이내, 생후 16주 이상, 1인 2마리(항공기당 5마리)',
   '기내 20,000원 · 위탁 ~32kg 30,000원 / 33~45kg 60,000원', '공항 카운터 수속 (웹·모바일·키오스크 체크인 불가)',
   ['국내선 필요 서류: 반려동물 운송 서약서', '단두종 위탁 불가, 동물보호법상 맹견류 기내·위탁 불가'],
   [('https://www.jinair.com/addService/jinipet/statute?snsLang=ko_KR&ctrCd=KOR','진에어 JINI PET 기내/위탁 규정')]),
  ('트리니티항공 (구 티웨이)', '케이지 포함 9kg 이하', '세 변 합 115cm 이하, 하드 가로 37cm·높이 23cm (소프트 높이 26cm)',
   '불가 (기내만)', '30,000원 (공항 결제)', '온라인: 출발 1일 전까지 · 전화: 출발 2시간 30분 전까지 · 현장: 수속 마감 전까지',
   ['성인 1인 1마리, 국내선 한 편당 6마리, 비즈니스 존 반입 불가'],
   [('https://www.trinityairways.com/app/serviceInfo/contents/1070','트리니티항공 트리니티 펫')]),
  ('에어부산', '케이지 포함 9kg 이하', '세 변 합 115cm 미만, 가로 41·세로 21·높이 24cm 이내',
   '국내선만 가능 · 케이지 포함 32kg (세 변 합 246cm·높이 84cm). 위탁 요금은 공식 페이지에 없음',
   '기내 20,000원 (편도 구간당)', '홈페이지 예약 시 또는 나의 예약조회 → 부가서비스, 예약센터 1666-3060',
   ['1인당 1마리, 창가 좌석 배정'],
   [('https://m.airbusan.com/mc/common/service/customer/animal','에어부산 반려동물 동반 손님')]),
]
AIR_ID = {'대한항공':'ke','아시아나항공':'oz','제주항공':'7c','진에어':'lj','트리니티항공 (구 티웨이)':'tr','에어부산':'bx'}
D_PENDING = ['이스타항공', '에어로케이', '파라타항공', '에어서울']

def domestic_body():
    rows = ''.join(f'''<section class="panel air" id="air-{AIR_ID.get(n,'x')}"><h3>{html.escape(n)}</h3>
        <dl class="kv"><dt>기내</dt><dd>{html.escape(c)}<br><span class="hint">{html.escape(cs)}</span></dd><dt>위탁</dt><dd>{html.escape(ck)}</dd><dt>요금</dt><dd><b>{html.escape(fee)}</b></dd><dt>신청</dt><dd>{html.escape(ap)}</dd></dl>
        <ul class="dots" style="margin-top:10px">{''.join(f'<li>{html.escape(x)}</li>' for x in nt)}</ul><div class="links" style="margin-top:10px">{''.join(ext(u,t) for u,t in src)}</div></section>''' for n,c,cs,ck,fee,ap,nt,src in D_AIR)
    return f'''
      <nav class="toc" aria-label="이 페이지 목차"><a class="link" href="#air">국내선 항공</a><a class="link" href="#rail">KTX·SRT</a><a class="link" href="#etc">버스·여객선</a></nav>
      <div class="callout info"><strong>먼저 알아둘 것</strong>국내선은 대부분 <b>케이지 포함 7~9kg</b>까지만 기내에 함께 탈 수 있고, 확인한 6개 항공사 중 위탁(화물칸)을 받는 곳은 대한항공·아시아나·진에어(B777 운항편)·에어부산입니다. 모든 항공사가 <b>사전 신청·확약</b>을 요구하며, 확약 없이 공항에 가면 탑승할 수 없습니다.</div>
      <h2 id="air">국내선 항공사 (김포·제주 등)</h2>
      <div class="air-grid">{rows}</div>
      <p class="hint">요금은 각 항공사 공식 페이지 기준 반려동물 운송 요금이며 항공권·수하물 요금과 별개입니다. 무게는 모두 케이지를 포함한 총무게입니다.</p>
      <div class="callout"><strong>확인 대기</strong>{"·".join(D_PENDING)}은 공식 페이지 내용을 아직 직접 확인하지 못해 수치를 싣지 않았습니다. 예약 전 각 항공사에 확인하세요.</div>

      <h2 id="rail">KTX · SRT</h2>
      <div class="blocks two">
        <div class="block"><h4>SRT (에스알)</h4><ul class="checks">
          <li><span>길이 60cm 이내의 작은 반려동물(맹수·뱀 등 제외)을 이동장(45×30×25cm 정도)에 넣어야 합니다</span></li>
          <li><span>이동장과 동물을 합친 무게 10kg 이내</span></li>
          <li><span>역과 열차 안에서는 이동장에서 꺼내지 않고, 좌석에 앉아 발밑에 둡니다</span></li>
          <li><span>광견병 등 필요한 예방접종을 한 경우에만 탈 수 있습니다</span></li>
          <li><span>투견·맹금류·뱀 등은 함께 탈 수 없습니다</span></li></ul>
          <div class="links">{ext('https://etk.srail.kr/cms/archive.do?pageId=TK0402090000','SRT 반려동물 동반탑승 안내')}</div></div>
        <div class="block"><h4>KTX · 일반열차 (코레일)</h4><ul class="checks">
          <li><span>여객운송약관 휴대품 조항: 다른 승객에게 위해나 불편을 끼칠 염려가 없고 <b>필요한 예방접종을 한</b> 애완용 동물을 <b>전용가방 등에 넣은 경우</b> 휴대할 수 있습니다</span></li>
          <li><span>휴대품은 좌석이나 통로를 차지하지 않는 2개 이내입니다</span></li>
          <li><span>약관에 이동장 크기·무게 수치는 없습니다. 큰 이동장이면 코레일 고객센터(1544-7788)에 먼저 확인하세요</span></li></ul>
          <div class="links">{ext('https://www.letskorail.com','코레일 (약관: 한국철도공사 여객운송약관 휴대품 조항)')}</div></div>
      </div>
      <p class="hint">예방접종 증명서는 요구받을 수 있으니 사진이나 <a href="/#wallet">펫 카드의 서류 사본</a>으로 챙겨 두세요.</p>

      <h2 id="etc">고속버스 · 여객선</h2>
      <p>고속버스 회사와 제주행 여객선사는 회사마다 기준이 다르고, 아직 공식 운송약관 원문을 모두 확인하지 못했습니다. 확인을 마치면 이 페이지에 추가합니다. 그 전에는 예매 전 각 회사에 반려동물 동반 기준을 물어보세요.</p>
      <div class="links"><a class="link solid" href="/#prep">국내 나들이 짐 목록 보기</a><a class="link" href="/#trips">여행 기록에 제주 비행 남기기</a></div>'''

# ------------------------------------------------------------------ 항체가 검사
def titer_body():
    return f'''
      <div class="callout info"><strong>왜 중요한가</strong>일본·EU(프랑스·독일)·영국·싱가포르·호주는 광견병 항체가(중화항체) 검사 결과를 요구하고, 나라에 따라 채혈 뒤 정해진 기간을 기다려야 입국할 수 있습니다. 중국은 결과가 없으면 30일 격리 대상이 됩니다. 그래서 항체가 검사 날짜가 전체 준비 일정을 결정합니다. 한국으로 돌아올 때도 도착 전 24개월 이내 채혈한 0.5 IU/ml 이상 결과가 필요합니다(광견병 비발생 지역에서 오는 경우 제외).</div>
      <h2 id="how">국내에서 검사하는 방법</h2>
      <ol class="timeline">
        <li><b>1</b><span>동물병원에서 마이크로칩 번호를 확인하고 채혈합니다. 개는 개체 사진도 찍습니다.</span></li>
        <li><b>2</b><span>동물병원 수의사가 <b>광견병 항체검사 신청 시스템</b>에 회원가입 후 신청합니다 (보호자가 직접 신청하는 구조가 아님).</span></li>
        <li><b>3</b><span>혈청 1mL 이상을 냉장 상태로 보내고, 신청서 동봉 또는 튜브에 마이크로칩 번호를 표시합니다.</span></li>
        <li><b>4</b><span>처리 기간은 <b>접수일로부터 15일</b> (주말·공휴일 제외)입니다.</span></li>
      </ol>
      <p class="hint">마이크로칩 번호와 채혈일은 나중에 고치기 어렵습니다. 신청 전에 동물등록증·접종증명서와 한 글자씩 대조하세요.</p>
      <h2 id="jp">일본행: 국내 검사기관 지정</h2>
      <ul class="checks">
        <li><span>일본 농림수산성이 <b>농림축산검역본부 서울지역본부(전염병검사과)</b>를 광견병 항체가 검사기관으로 지정했습니다 (2025년 8월 21일부터 적용).</span></li>
        <li><span>정부 발표 기준으로, 해외 검사기관에 보낼 때 약 30만 원·약 4주가 걸리던 것이 검역본부 검사로 <b>약 11만 원·약 2주</b>로 줄어들 것으로 기대된다고 밝혔습니다. 실제 청구액은 신청 시스템에서 확인하세요.</span></li>
        <li><span>문의: 신청 시스템 Q&amp;A 게시판 또는 02-2650-0657</span></li>
      </ul>
      <div class="callout"><strong>다른 나라는 각국 인정 기관인지 확인</strong>EU·영국·호주 등은 각자 인정하는 검사기관 목록이 있습니다. 위 지정은 일본 기준이므로, 다른 목적지는 국가별 규정과 담당 동물병원에서 인정 기관인지 먼저 확인하세요.</div>
      <div class="links">
        {ext('https://kvma.or.kr/kvma_info?num=1457&tbl=0','대한수의사회 · 일본 지정 검사기관 안내 (2025-09-02)')}
        {ext('https://eiec.kdi.re.kr/policy/materialView.do?num=270032','농림축산식품부 발표 요약 (KDI 경제정보센터, 2025-08-21)')}
        {ext('https://www.gov.kr/portal/service/serviceInfo/PTR000051622','정부24 · 광견병 항체 검사 신청 시스템')}
      </div>
      <h2 id="wait">나라별 대기 기간</h2>
      <p>채혈 후 기다려야 하는 기간과 가장 빠른 출국일은 <a href="/#plan">일정 계산</a>에 채혈일을 넣으면 바로 나옵니다. 나라별 원문 요건은 <a href="/#countries">국가별 규정</a>에서 확인하세요.</p>'''

# ------------------------------------------------------------------ 현지 이동
def local_body():
    return f'''
      <nav class="toc" aria-label="이 페이지 목차"><a class="link" href="#jp">일본</a><a class="link" href="#us">미국</a></nav>
      <h2 id="jp">일본: 철도</h2>
      <div class="blocks two">
        <div class="block"><h4>JR (신칸센 포함)</h4><ul class="checks">
          <li><span>개·고양이 등 작은 동물은 <b>세 변 합 120cm 이내</b> 전용 용기에 넣어야 합니다</span></li>
          <li><span>용기와 동물을 합친 무게 <b>10kg 이내</b></span></li>
          <li><span>수하물 요금 <b>1개 290엔</b> (1회 승차마다)</span></li>
          <li><span>다른 승객에게 위해나 불편을 줄 우려가 없어야 하며, 맹수·뱀류는 불가</span></li></ul>
          <div class="links">{ext('https://railway.jr-central.co.jp/ticket-rule/cjr-regulation/_pdf/000044999.pdf','JR도카이 여객영업규칙 제309조')}{ext('https://media.jreast.co.jp/articles/408','JR동일본 안내 (2026-09)')}</div></div>
        <div class="block"><h4>도에이 지하철 (도쿄도 교통국)</h4><ul class="checks">
          <li><span>작은 동물은 다른 승객에게 불편을 주지 않도록 <b>완전한 케이스에 넣어</b> 수하물로 가지고 탈 수 있습니다</span></li>
          <li><span>혼잡 상황에 따라 거절될 수 있습니다</span></li>
          <li><span>공식 페이지에 동물 전용 요금이나 크기 수치는 없습니다</span></li></ul>
          <div class="links">{ext('https://www.kotsu.metro.tokyo.jp/subway/kanren/riyo.html','도에이 지하철 이용 안내')}</div></div>
      </div>
      <p class="hint">도쿄메트로·사철은 회사마다 규칙이 다릅니다. 확인한 노선만 싣고 있습니다.</p>
      <h2 id="us">미국: 기차 · 국립공원</h2>
      <div class="blocks two">
        <div class="block"><h4>Amtrak (암트랙)</h4><ul class="checks">
          <li><span>반려동물과 이동장을 합친 무게 <b>20파운드(약 9kg) 이하</b></span></li>
          <li><span>이동장 최대 <b>19×14×10.5인치</b> (약 48×36×27cm)</span></li>
          <li><span>대부분 노선에서 <b>7시간 이내</b> 여정만 가능, 구간마다 요금 부과 (노선별 상이, 예약 시 표시)</span></li>
          <li><span>예약 필수, 승객 1인당 1마리, 이동장 1개에 1마리</span></li>
          <li><span>Coach·Acela 비즈니스석만 가능 (Acela 1등석·침대칸·식당칸 불가), Auto Train 불가</span></li></ul>
          <div class="links">{ext('https://www.amtrak.com/pets','Amtrak Pets on Trains')}</div></div>
        <div class="block"><h4>국립공원 (NPS)</h4><ul class="checks">
          <li><span>반려동물은 항상 케이지에 넣거나 <b>6피트(약 1.8m) 이하</b> 리드줄로 묶어야 합니다 (연방규정 36 CFR 2.15)</span></li>
          <li><span>공공건물, 대중교통 차량, 지정 수영 해변, 공원장이 지정한 구역에는 데려갈 수 없습니다</span></li>
          <li><span>개발 지역, 여러 탐방로·캠핑장, 일부 숙소에서 반려동물을 받습니다. 공원마다 규칙이 다르니 방문할 공원 페이지를 확인하세요</span></li></ul>
          <div class="links">{ext('https://www.ecfr.gov/current/title-36/chapter-I/part-2/section-2.15','36 CFR 2.15 원문')}{ext('https://www.nps.gov/subjects/pets/index.htm','NPS 반려동물 안내')}</div></div>
      </div>'''

# ------------------------------------------------------------------ 변경 이력
CHANGES = [
  ('2026-10-08', ['국내 이동 페이지 추가: 대한항공·아시아나·제주항공·진에어·트리니티항공·에어부산 국내선 규정, SRT·코레일 휴대 기준',
                  '항체가 검사 안내 추가: 검역본부 서울지역본부 일본 지정 검사기관, 처리 15일',
                  '비용 계산 추가: 출국 검역 수수료 1만 원(신청건당) 반영',
                  '현지 이동 추가: 일본 JR·도에이 지하철, 미국 Amtrak·국립공원']),
  ('2026-10-07', ['진에어 공식 규정 반영(확인 대기 해제)', '트리니티항공 반려동물 운송 불가 노선 추가']),
  ('2026-10-03', ['태국: 정부 원문 기준으로 교체 (허가 7~60일 전 신청·유효 60일, 광견병 12주·21일, 1마리당 500바트, 최소 준비 28일)',
                  '베트남: 고시 01/2026 제14조 기준 (1인 2마리, 공항 현장 신고, 법령상 대기 기간 없음)',
                  '캐나다 연령 기준(8개월)·RNATT 정정, 호주 CIV 백신 추가, 필리핀 허가 60일·3마리',
                  'EU 근거 규정 2026/705 반영, 제주항공 85,000원 구간(러시아·몽골), 트리니티 금지 견종·마리 수, 아시아나 유선 번호']),
  ('2026-09-29', ['PawTrip 공개 (12개국 입국 규정, 6개 국적 항공사)']),
]
def changes_body():
    items = ''.join(f'<li><b>{d}</b><span><ul class="dots">{"".join(f"<li>{html.escape(x)}</li>" for x in xs)}</ul></span></li>' for d, xs in CHANGES)
    return f'''
      <p>규정 수치를 바꾸거나 바로잡을 때마다 날짜와 내용을 기록합니다. 각 항목의 근거는 해당 페이지의 공식 출처 링크에 있습니다.</p>
      <ol class="timeline" style="margin-top:20px">{items}</ol>
      <div class="links" style="margin-top:20px"><a class="link solid" href="/#countries">국가별 규정</a><a class="link" href="/#airlines">항공사 비교</a><a class="link" href="/domestic/">국내 이동</a></div>'''

# ------------------------------------------------------------------ 비용 계산
def cost_body():
    return '''
      <div class="callout info"><strong>계산 기준</strong>공식 요금표가 있는 항목만 자동으로 더합니다. 동물병원 비용처럼 병원마다 다른 항목은 직접 넣어 주세요. 항공 요금은 <b>한국 출발 편도</b> 기준이며, 귀국편 요금과 목적지 정부의 귀국 증명서 비용은 출발국 요금표가 달라 포함하지 않았습니다.</div>
      <div class="plan-grid" style="margin-top:20px">
        <form class="panel form" id="cform" autocomplete="off">
          <div class="field"><label for="cDest">목적지</label><select id="cDest"></select></div>
          <div class="field"><label for="cWt">반려견 + 케이지 무게 (kg)</label><input type="number" id="cWt" min="0.5" max="45" step="0.1" value="6" inputmode="decimal"></div>
          <div class="field"><label for="cN">마리 수</label><input type="number" id="cN" min="1" max="3" step="1" value="1" inputmode="numeric"></div>
          <label class="check"><input type="checkbox" id="cBrachy"><span>단두종 또는 단두종 교배종</span></label>
          <label class="check"><input type="checkbox" id="cTiter"><span>항체가 검사를 아직 안 받음 (필요한 나라면 검사비 포함)</span></label>
          <fieldset style="margin-top:8px"><legend>동물병원 비용 (직접 입력, 원)</legend>
            <div class="form-grid two">
              <div class="field"><label for="vChip">마이크로칩</label><input type="number" id="vChip" min="0" step="1000" value="0" inputmode="numeric"></div>
              <div class="field"><label for="vVac">광견병 등 접종</label><input type="number" id="vVac" min="0" step="1000" value="0" inputmode="numeric"></div>
              <div class="field"><label for="vCert">건강증명서·진료</label><input type="number" id="vCert" min="0" step="1000" value="0" inputmode="numeric"></div>
              <div class="field"><label for="vBlood">채혈·검체 발송</label><input type="number" id="vBlood" min="0" step="1000" value="0" inputmode="numeric"></div>
            </div></fieldset>
        </form>
        <section class="panel" id="cOut" aria-live="polite"><p class="hint">요금표를 불러오는 중…</p></section>
      </div>'''

COST_JS = r'''<script>
(function(){
  var won = function(n){ return n.toLocaleString('ko-KR') + '원'; };
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  var TITER = ['jp','fr','de','gb','sg','au','cn'], CARGO = ['gb','au'];
  var FEE_EXPORT = 10000, FEE_TITER = 110000;
  var D = null, $ = function(id){ return document.getElementById(id); };
  function airOption(a, c, w, brachy){
    if(a.status === 'pending') return null;
    var lim = (a.routeLimits||{})[c.id]; if(lim && lim.all) return null;
    if(CARGO.indexOf(c.id) >= 0) return null;
    var f = a.fees||{}, n = a.feeNum||{};
    if(f.longOnly && c.region === 'long' && f.longOnly.indexOf(c.id) < 0) return null;
    var cabin = a.cabin.maxKg != null && w <= a.cabin.maxKg;
    var checked = a.checked.allowed === true && w <= a.checked.maxKg && !(brachy && a.brachyChecked === false);
    if(cabin && n[c.region] != null) return {name:a.name, how:'기내', fee:n[c.region]};
    if(checked){ var v = (a.feeNumChecked && a.feeNumChecked[c.region] != null) ? a.feeNumChecked[c.region] : n[c.region];
      if(v == null) return null;
      if(w > 32) return {name:a.name, how:'위탁 · 33kg 이상 요금은 항공사 요금표 확인', fee:null};
      return {name:a.name, how:'위탁', fee:v}; }
    return null;
  }
  function calc(){
    var c = D.countries.filter(function(x){ return x.id === $('cDest').value; })[0]; if(!c) return;
    var w = parseFloat($('cWt').value)||0, k = Math.max(1, Math.min(3, parseInt($('cN').value,10)||1)), brachy = $('cBrachy').checked;
    var opts = D.airlines.map(function(a){ return airOption(a, c, w, brachy); }).filter(Boolean).sort(function(x,y){ return (x.fee==null?1e12:x.fee) - (y.fee==null?1e12:y.fee); });
    var lines = [], foreign = [];
    var best = opts.filter(function(o){ return o.fee != null; })[0];
    if(CARGO.indexOf(c.id) >= 0) lines.push(['항공 운송', null, esc(c.name)+'은(는) 화물 운송만 가능해 운송대행사 견적이 필요합니다']);
    else if(best) lines.push(['항공 운송 (가장 저렴한 '+esc(best.name)+' '+esc(best.how)+')', best.fee*k, '편도 · '+k+'마리']);
    else lines.push(['항공 운송', null, '이 무게·조건으로 요금표가 있는 국적 항공사가 없습니다']);
    lines.push(['출국 검역증명서 수수료', FEE_EXPORT*k, '개·고양이 신청건당 1만 원, 마리마다 신청한다고 가정']);
    if(TITER.indexOf(c.id) >= 0 && $('cTiter').checked) lines.push(['광견병 항체가 검사 (검역본부)', FEE_TITER*k, '정부 발표 예상 금액, 실제 청구액은 신청 시스템 확인']);
    if(c.id === 'th') foreign.push('태국 도착 시 승인서·수입허가서 1마리당 500바트 × '+k);
    if(c.id === 'sg' || c.id === 'au') foreign.push(esc(c.name)+' 도착 후 격리 시설 비용 별도 (공식 요금 확인 후 추가 예정)');
    var vet = ['vChip','vVac','vCert','vBlood'].reduce(function(s,id){ return s + (parseInt($(id).value,10)||0); }, 0);
    if(vet) lines.push(['동물병원 비용 (직접 입력)', vet, '']);
    var total = lines.reduce(function(s,l){ return s + (l[1]||0); }, 0);
    $('cOut').innerHTML = '<div class="verdict"><div><div class="lbl">'+esc(c.name)+' · 확인된 비용 합계</div><div class="big">'+won(total)+'</div><div class="sub">한국 출발 편도 기준, 귀국 비용 제외</div></div></div>'
      + '<table class="fees" style="margin-top:12px"><tbody>' + lines.map(function(l){ return '<tr><th>'+l[0]+(l[2]?'<br><span class="hint">'+l[2]+'</span>':'')+'</th><td>'+(l[1]!=null?won(l[1]):'—')+'</td></tr>'; }).join('') + '</tbody></table>'
      + (foreign.length ? '<h3 class="sec-h">원화로 더하지 않은 비용</h3><ul class="dots">'+foreign.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>' : '')
      + (opts.filter(function(o){return o!==best;}).length ? '<h3 class="sec-h">다른 항공사</h3><ul class="dots">'+opts.filter(function(o){return o!==best;}).map(function(o){ return '<li>'+esc(o.name)+' '+esc(o.how)+(o.fee!=null?' · '+won(o.fee*k):'')+'</li>'; }).join('')+'</ul>' : '')
      + '<p class="hint" style="margin-top:12px">항공 요금: 각 항공사 공식 요금표 (확인일 '+esc(D.meta.verified)+'), 검역 수수료: 가축전염병 예방법 시행규칙 별표 19 (찾기쉬운 생활법령, 2026-09-15 기준). 단두종·노선 제한은 <a href="/#flights">항공편 선택</a>에서 자세히 확인하세요.</p>';
    try{ gtag('event','cost_calculate',{destination:c.id, pets:k}); }catch(e){}
  }
  fetch('/data.json').then(function(r){ return r.json(); }).then(function(d){
    D = d; $('cDest').innerHTML = d.countries.map(function(c){ return '<option value="'+c.id+'">'+esc(c.name)+'</option>'; }).join('');
    try{ var st = JSON.parse(localStorage.getItem('pp3')||'{}'); if(st.dest) $('cDest').value = st.dest; if(st.weight) $('cWt').value = st.weight; if(st.brachy) $('cBrachy').checked = true; }catch(e){}
    $('cform').addEventListener('input', calc); $('cform').addEventListener('submit', function(e){ e.preventDefault(); }); calc();
  }).catch(function(){ $('cOut').innerHTML = '<div class="callout bad"><strong>요금표를 불러오지 못했어요</strong>인터넷 연결 후 새로고침해 주세요.</div>'; });
})();
</script>'''

PAGES = [
  dict(slug='domestic', tab='domestic', group='규정 · 국내 이동', title='반려견과 국내 이동: 제주 국내선·KTX·SRT',
       desc='김포-제주 등 국내선 항공사별 반려동물 기내·위탁 무게, 케이지 크기, 요금과 KTX·SRT 반려견 동반 기준을 공식 출처로 정리했습니다.',
       lead='국내선 항공사 6곳과 SRT·코레일의 반려동물 동반 기준을 공식 페이지와 운송약관 기준으로 정리했습니다.', body=domestic_body),
  dict(slug='titer', tab='titer', group='준비하기 · 항체가 검사', title='광견병 항체가 검사: 국내 검사 방법과 기간',
       desc='일본·EU·영국행에 필요한 광견병 항체가 검사를 국내에서 받는 방법, 처리 기간(15일), 일본 지정 검사기관(농림축산검역본부)을 정리했습니다.',
       lead='해외 입국 일정을 결정하는 항체가 검사를 언제, 어디서, 어떻게 받는지 정리했습니다.', body=titer_body),
  dict(slug='cost', tab='cost', group='준비하기 · 비용 계산', title='반려견 해외여행 비용 계산',
       desc='목적지와 무게를 넣으면 국적 항공사 반려동물 운송료, 출국 검역 수수료, 항체가 검사비를 공식 요금표 기준으로 더해 보여줍니다.',
       lead='공식 요금이 있는 항목은 자동으로, 병원마다 다른 비용은 직접 넣어 합계를 냅니다.', body=cost_body, extra=COST_JS),
  dict(slug='local', tab='local', group='규정 · 현지 이동', title='도착 후 현지 이동: 일본 JR·지하철, 미국 Amtrak·국립공원',
       desc='일본 JR·신칸센·도에이 지하철과 미국 Amtrak, 국립공원의 반려견 동반 규칙(크기·무게·요금·리드줄)을 공식 규정으로 정리했습니다.',
       lead='목적지에 도착한 뒤 기차·지하철·공원에서 지켜야 할 규칙입니다. 운영 기관이 직접 공개한 규칙만 실었습니다.', body=local_body),
  dict(slug='changes', tab='changes', group='기준과 출처', title='규정 변경 이력',
       desc='PawTrip이 반영한 국가별 입국 규정·항공사 규정 변경 내역을 날짜별로 기록합니다.',
       lead='무엇이, 언제, 어떤 근거로 바뀌었는지 기록합니다.', body=changes_body),
]

def text_of(h):
    h = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', h, flags=re.S)
    h = re.sub(r'<[^>]+>', ' ', h)
    return re.sub(r'\s+', ' ', html.unescape(h)).strip()

def sections(p, body):
    # 페이지를 검색 단위로 나눔: h2 구간마다 1개, 국내선 항공사 카드는 항공사마다 1개
    out = []
    base = f"/{p['slug']}/"
    for m in re.finditer(r'<section class="panel air" id="([^"]+)"><h3>(.*?)</h3>(.*?)</section>', body, re.S):
        out.append({'t': f"{text_of(m.group(2))} 국내선 반려동물", 'u': base + '#' + m.group(1), 'g': p['group'], 'x': text_of(m.group(3))})
    body2 = re.sub(r'<section class="panel air".*?</section>', ' ', body, flags=re.S)
    parts = re.split(r'(<h2[^>]*>.*?</h2>)', body2, flags=re.S)
    out.append({'t': p['title'], 'u': base, 'g': p['group'], 'x': p['desc'] + ' ' + text_of(parts[0])})
    for i in range(1, len(parts), 2):
        m = re.match(r'<h2(?: id="([^"]+)")?[^>]*>(.*?)</h2>', parts[i], re.S)
        out.append({'t': text_of(m.group(2)), 'u': base + ('#' + m.group(1) if m.group(1) else ''), 'g': p['group'], 'x': text_of(parts[i+1] if i+1 < len(parts) else '')})
    return out

def build():
    index = []
    for p in PAGES:
        url = f"{SITE}/{p['slug']}/"
        out = SHELL.format(title=html.escape(p['title']), desc=html.escape(p['desc']), url=url, verified=VERIFIED,
                           group=html.escape(p['group']), lead=html.escape(p['lead']), body=p['body'](), tab=p['tab'], extra=p.get('extra',''))
        d = os.path.join(ROOT, p['slug']); os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8', newline='\n') as f: f.write(out)
        index += sections(p, p['body']())
    with open(os.path.join(ROOT, 'search-index.json'), 'w', encoding='utf-8', newline='\n') as f: json.dump(index, f, ensure_ascii=False, separators=(',', ':'))
    urls = [('/', VERIFIED)] + [(f"/{p['slug']}/", VERIFIED) for p in PAGES] + [('/privacy.html', '2026-10-08')]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{SITE}{u}</loc><lastmod>{d}</lastmod></url>\n' for u, d in urls) + '</urlset>\n'
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f: f.write(sm)
    print('built', [p['slug'] for p in PAGES], 'search entries', len(index))

if __name__ == '__main__':
    build()
