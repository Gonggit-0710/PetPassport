"""Searchable rules pages generated from the same data.json used by the app."""
import datetime
import html
import re


def esc(value):
    return html.escape(str(value if value is not None else ''), quote=True)


def verified(data, item=None):
    return (item or {}).get('verified') or data['meta']['verified']


def validate(data):
    datetime.date.fromisoformat(data['meta']['verified'])
    for kind in ('countries', 'airlines'):
        seen = set()
        for item in data[kind]:
            key = item['id']
            if not re.fullmatch(r'[a-z0-9-]+', key) or key in seen:
                raise ValueError(f'Invalid or duplicate {kind} ID: {key}')
            seen.add(key)
            if not item.get('name'):
                raise ValueError(f'Missing {kind} name: {key}')
            datetime.date.fromisoformat(verified(data, item))
            sources = item.get('sources', []) if kind == 'countries' else [item.get('source')] + ([item['source2']] if item.get('source2') else [])
            if not sources or any(not s or not s.get('url', '').startswith('https://') for s in sources):
                raise ValueError(f'Missing HTTPS source for {kind}: {key}')
            if kind == 'countries':
                if not item.get('requirements'):
                    raise ValueError(f'Missing requirements: {key}')
                if not isinstance(item.get('difficulty'), int) or not 1 <= item['difficulty'] <= 5:
                    raise ValueError(f'Invalid difficulty: {key}')
                if not isinstance(item.get('leadDays'), (int, float)) or item['leadDays'] < 0:
                    raise ValueError(f'Invalid lead days: {key}')
                if item.get('region') not in ('short', 'mid', 'long'):
                    raise ValueError(f'Invalid region: {key}')
            else:
                for section in ('cabin', 'checked'):
                    limit = item.get(section, {}).get('maxKg')
                    if limit is not None and (not isinstance(limit, (int, float)) or limit <= 0):
                        raise ValueError(f'Invalid weight limit: {key}/{section}')


def link(url, label, cls='link'):
    return f'<a class="{cls}" href="{esc(url)}">{esc(label)}</a>'


def sources_html(sources):
    return '<div class="links">' + ''.join(
        f'<a class="link" href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s.get("title", "공식 규정"))}</a>'
        for s in sources if s) + '</div>'


def bullets(items):
    return '<ul class="checks">' + ''.join(f'<li>{esc(x)}</li>' for x in items) + '</ul>'


def page(slug, tab, title, desc, lead, body, date, extra=''):
    if slug.startswith('airlines/'):
        body = compact_detail(body, tab)
    return dict(slug=slug, tab=tab, title=title, desc=desc, lead=lead,
                group='규정 · 국가별' if tab == 'countries' else '규정 · 항공사' if tab == 'airlines' else '내 반려견 · My Card',
                body=lambda: body, verified=date, extra=extra + DISCLOSURE_JS + (CHECKLIST_JS if tab == 'countries' else ''),
                page_class='rules-page', page_style='<link rel="stylesheet" href="/rules.css?v=3">', heading=title)


DISCLOSURE_JS = '''<script>
(function(){
  function reveal(){
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch(e) { return; }
    const target = document.getElementById(id);
    if(!target) return;
    let parent = target.closest('details');
    while(parent){ parent.open = true; parent = parent.parentElement.closest('details'); }
    target.scrollIntoView();
  }
  window.addEventListener('hashchange', reveal);
  if(location.hash) reveal();
})();
</script>'''


CHECKLIST_JS = '''<script>
(function(){
  const groups = [...document.querySelectorAll('[data-country-checklist]')];
  function restore(group){
    let done = [];
    try { const value = JSON.parse(localStorage.getItem('pp3c-' + group.dataset.countryChecklist) || '[]');
      if(Array.isArray(value)) done = value;
    } catch(e) {}
    group.querySelectorAll('input[data-rule-check]').forEach(box => {
      box.checked = done.includes(Number(box.dataset.ruleCheck));
    });
  }
  groups.forEach(group => {
    restore(group);
    group.addEventListener('change', event => {
      if(!event.target.matches('input[data-rule-check]')) return;
      const done = [...group.querySelectorAll('input[data-rule-check]:checked')].map(box => Number(box.dataset.ruleCheck));
      const status = group.parentElement.querySelector('[data-check-status]');
      try {
        localStorage.setItem('pp3c-' + group.dataset.countryChecklist, JSON.stringify(done));
        if(status) status.textContent = '저장됨 · My Card에서 이어서 관리할 수 있습니다.';
      } catch(e) {
        if(status) status.textContent = '체크 상태를 저장하지 못했어요. 브라우저 저장 공간을 확인하세요.';
      }
    });
  });
  window.addEventListener('storage', event => {
    groups.forEach(group => { if(event.key === null || event.key === 'pp3c-' + group.dataset.countryChecklist) restore(group); });
  });
})();
</script>'''

COUNTRY_FILTER_JS = '''<script>
(function(){
  const list = document.getElementById('list');
  const cards = [...list.querySelectorAll('[data-country-row]')];
  let region = 'all', sort = 'default';
  function refresh(){
    document.querySelectorAll('[data-region]').forEach(b => b.setAttribute('aria-pressed', b.dataset.region === region));
    document.querySelectorAll('[data-sort]').forEach(b => b.setAttribute('aria-pressed', b.dataset.sort === sort));
    const sorted = [...cards];
    if(sort === 'easy') sorted.sort((a,b)=>Number(a.dataset.difficulty)-Number(b.dataset.difficulty)||Number(a.dataset.lead)-Number(b.dataset.lead));
    if(sort === 'hard') sorted.sort((a,b)=>Number(b.dataset.difficulty)-Number(a.dataset.difficulty));
    if(sort === 'lead') sorted.sort((a,b)=>Number(a.dataset.lead)-Number(b.dataset.lead));
    sorted.forEach(card => { card.hidden = region !== 'all' && card.dataset.region !== region; list.appendChild(card); });
  }
  document.querySelectorAll('[data-region],[data-sort]').forEach(b => b.addEventListener('click',()=>{
    if(b.dataset.region) region = b.dataset.region; else sort = b.dataset.sort;
    refresh();
  }));
})();
</script>'''


def compact_detail(body, tab):
    """Keep every rule in HTML; use the original app's panels and disclosure layout."""
    parts = re.split(r'(<h2[^>]*>.*?</h2>)', body, flags=re.S)
    intro = parts[0]
    sections = [(parts[i], parts[i+1]) for i in range(1, len(parts), 2)]
    visible = 1 if tab == 'countries' else 2
    panels = ''.join('<section class="panel">' + heading + content + '</section>'
                     for heading, content in sections[:visible])
    folded = ''.join('<details class="rule-fold"><summary>' + heading + '</summary><div class="rule-fold-body">' + content + '</div></details>'
                     for heading, content in sections[visible:])
    if tab == 'countries':
        # Keep useful actions visible rather than hiding them in the timeline disclosure.
        actions = re.search(r'<div class="links">.*?</div>', sections[1][1], re.S)
        if actions:
            intro += actions.group(0)
        return intro + '<div class="dgrid">' + panels + '<section class="panel rule-side">' + folded + '</section></div>'
    return intro + '<div class="dgrid">' + panels + '</div><section class="panel rule-side">' + folded + '</section>'


def country_card(data, c, opened=False, suffix=''):
    """Match the existing country card, including its three intuitive metrics."""
    key, name = c['id'], c['name']
    level = c['difficulty']
    meter = f'<span class="meter{" hard" if level >= 4 else ""}" role="img" aria-label="검역 난이도 5단계 중 {level}">' + ''.join(
        f'<i class="{"on" if i <= level else ""}"></i>' for i in range(1, 6)) + '</span>'
    days = '즉시' if c['leadDays'] <= 1 else f'{esc(c["leadDays"])}<small>일</small>'
    distance = {'short': '단거리', 'mid': '중거리', 'long': '장거리'}[c['region']]
    arrow = '<span class="chev" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
    body = f'<details class="card rule-country"{" open" if opened else ""}><summary class="card-head">'
    body += f'<span class="badge">{esc(c["code"])}</span><span class="card-title"><h3>{esc(name)}</h3><span class="sub">{esc(c.get("status"))}</span></span>' + arrow
    body += f'<p class="card-summary">{esc(c.get("summary"))}</p><dl class="stats">'
    for label, value in [('최소 준비', days), ('난이도', meter), ('거리', esc(distance))]:
        body += f'<div class="stat"><dt>{label}</dt><dd>{value}</dd></div>'
    body += '</dl></summary><div class="rule-country-body">'
    checks = f'<ul class="rule-checks" data-country-checklist="{esc(key)}">' + ''.join(
        f'<li><label><input type="checkbox" data-rule-check="{i}"><span>{esc(requirement)}</span></label></li>'
        for i, requirement in enumerate(c['requirements'])) + '</ul>'
    body += f'<section class="block"><h2 id="requirements{suffix}">입국 요건</h2>' + checks
    body += '<p class="hint rule-check-hint">준비를 마친 항목을 체크하세요. <a href="/mycard/">My Card에서 일괄 관리</a> · 이 브라우저에 자동 저장됩니다.</p><p class="hint" data-check-status role="status"></p></section>'
    timeline = '<ol class="timeline">' + ''.join(
        f'<li><b>{"D-day" if t["d"] == 0 else "D" + ("+" if t["d"] > 0 else "") + str(t["d"])}</b><span>{esc(t["t"])}</span></li>'
        for t in c.get('timeline', [])) + '</ol>'
    body += f'<div class="blocks two"><section class="block"><h2 id="timeline{suffix}">준비 타임라인</h2>' + timeline + '</section>'
    body += f'<section class="block"><h2 id="quarantine{suffix}">도착 후 검역</h2><p>{esc(c.get("quarantine"))}</p>'
    if c.get('airlineNote'):
        body += f'<p><b>항공편</b> {esc(c["airlineNote"])}</p>'
    body += f'<p id="return{suffix}"><b>귀국 시</b> {esc(c.get("returnNote"))}</p></section></div>'
    body += f'<div class="links" id="sources{suffix}">' + link(f'/countries/{key}/#requirements', '체크리스트로 보기', 'link solid') + link(f'/?dest={key}#plan', '이 나라로 일정 계산')
    body += ''.join(f'<a class="link" href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s.get("title", "공식 규정"))} ↗</a>' for s in c['sources']) + '</div>'
    if c.get('sourceType') == 'secondary':
        body += '<p class="note">정부 원문 대신 2차 자료로 정리한 항목입니다. 출국 전에 관할 기관의 원문을 확인하세요.</p>'
    return body + '</div></details>'


def country_page(data, c):
    key, name = c['id'], c['name']
    body = link('/countries/', '← 국가별 규정 목록', 'back')
    body += '<div class="list still rule-country-list">' + country_card(data, c, opened=True) + '</div>'
    result = page(f'countries/{key}', 'countries', f'{name} 강아지 입국 규정과 해외여행 준비',
                f'한국 출발 반려견의 {name} 입국 요건, 준비 타임라인, 도착 검역과 한국 귀국 준비를 출처와 함께 안내합니다.',
                '입국 요건과 준비 일정을 확인하고, 체크리스트와 일정 계산으로 이어서 준비하세요.', body, verified(data, c))
    result['heading'] = name + ' 입국 규정'
    return result


def transport(section, allowed=None):
    if allowed is False:
        return '<p>위탁(화물칸) 운송을 하지 않습니다.</p>'
    if allowed is None and not section.get('maxKg'):
        return '<p>공식 규정 확인이 필요합니다.</p>'
    rows = [('무게', f'반려견과 케이지 합계 {section["maxKg"]}kg 이하' if section.get('maxKg') else '확인 필요'),
            ('케이지 크기', section.get('size', '확인 필요')),
            ('나이', section.get('minAge', '확인 필요'))]
    out = '<dl class="kv">' + ''.join(f'<dt>{esc(k)}</dt><dd>{esc(v)}</dd>' for k, v in rows) + '</dl>'
    for key in ('note', 'flightNote'):
        if section.get(key):
            out += f'<p class="note">{esc(section[key])}</p>'
    return out


def airline_page(data, a):
    key, name = a['id'], a['name']
    body = link('/airlines/', '← 항공사 비교 목록', 'back')
    if a.get('banner'):
        body += f'<div class="callout info"><strong>참고</strong>{esc(a["banner"])}</div>'
    if a.get('status') != 'verified':
        body += '<p class="note">일부 항목은 확인 대기 중입니다. 예약 전 공식 안내를 확인하세요.</p>'
    body += '<h2 id="cabin">기내 동반 규정</h2>' + transport(a.get('cabin', {}))
    body += '<h2 id="checked">위탁 수하물 규정</h2>' + transport(a.get('checked', {}), a.get('checked', {}).get('allowed'))
    body += '<h2 id="fees">반려동물 운송 요금</h2>'
    fees = a.get('fees', {})
    body += f'<p class="hint">{esc(fees.get("basis", "예약 전 항공사에 요금을 확인하세요."))}</p>'
    body += '<div class="tablewrap"><table class="cmp"><thead><tr><th scope="col">구분</th><th scope="col">요금</th></tr></thead><tbody>'
    for field, label in [('short', '단거리'), ('mid', '중거리'), ('long', '장거리'), ('heavy', '대형견')]:
        if fees.get(field):
            body += f'<tr><th scope="row">{label}</th><td>{esc(fees[field])}</td></tr>'
    body += '</tbody></table></div>'
    if a.get('regions'):
        body += f'<p>{esc(a["regions"])}</p>'
    body += '<h2 id="booking">신청 방법과 기한</h2>'
    body += ''.join(f'<p>{esc(a[f])}</p>' for f in ('howTo', 'booking') if a.get(f))
    body += '<h2 id="restrictions">단두종·노선 제한과 주의사항</h2>'
    if a.get('brachyChecked') is False:
        body += '<p>단두종 위탁 운송이 제한됩니다.</p>'
    body += bullets(a.get('notes', []))
    if a.get('brachyList'):
        body += '<h3>항공사가 안내하는 단두종 목록</h3><p>' + esc(' · '.join(a['brachyList'])) + '</p>'
    names = {c['id']: c['name'] for c in data['countries']}
    if a.get('routeLimits'):
        body += '<h3>목적지별 제한</h3>' + bullets([f'{names.get(k, k)}: {v["text"]}' for k, v in a['routeLimits'].items()])
    body += '<h2 id="contact">항공사 연락처</h2><dl class="kv">'
    for contact in a.get('contact', []):
        body += f'<dt>{esc(contact["label"])}</dt><dd><a class="tel" href="tel:{esc(contact["tel"])}">{esc(contact["tel"])}</a>'
        if contact.get('alt'):
            body += f' / {esc(contact["alt"])}'
        if contact.get('hours'):
            body += f'<br>{esc(contact["hours"])}'
        body += '</dd>'
    body += '</dl><h2 id="sources">공식 출처</h2>' + sources_html([a.get('source'), a.get('source2')])
    body += '<div class="links">' + link('/#flights', '우리 개 조건으로 항공편 찾기') + link('/countries/', '목적지 입국 규정') + link('/sos/', '다국어 진료용 카드 준비') + '</div>'
    result = page(f'airlines/{key}', 'airlines', f'{name} 강아지 기내 동반·위탁 규정과 요금',
                f'{name}의 반려견 기내·위탁 무게, 케이지 크기, 요금, 신청 기한과 연락처를 공식 출처 기준으로 안내합니다.',
                '몸무게는 반려견과 케이지를 합한 무게입니다. 실제 노선·기종·잔여 운송 가능 수는 예약 전에 확인하세요.',
                body, verified(data, a))
    result['heading'] = name
    return result


def pages(data):
    validate(data)
    out = [country_page(data, c) for c in data['countries']]
    out += [airline_page(data, a) for a in data['airlines']]
    countries = '<div class="chips" role="group" aria-label="지역">' + ''.join(
        f'<button class="chip" type="button" data-region="{value}" aria-pressed="{str(value=="all").lower()}">{label}</button>'
        for value,label in [('all','전체 지역'),('short','단거리'),('mid','중거리'),('long','장거리')]) + '</div>'
    countries += '<div class="chips" role="group" aria-label="정렬">' + ''.join(
        f'<button class="chip" type="button" data-sort="{value}" aria-pressed="{str(value=="default").lower()}">{label}</button>'
        for value,label in [('default','기본 순서'),('easy','쉬운 순'),('hard','어려운 순'),('lead','준비 기간 짧은 순')]) + '</div>'
    countries += '<div class="list still rule-country-list" id="list">'
    for c in data['countries']:
        countries += f'<div data-country-row="{esc(c["id"])}" data-region="{esc(c["region"])}" data-difficulty="{c["difficulty"]}" data-lead="{c["leadDays"]}">'
        countries += country_card(data, c, suffix='-' + c['id'])
        countries += '<div class="rule-permalink">' + link('/countries/' + c['id'] + '/', c['name'] + ' 상세 페이지') + f'<span>확인일 {esc(verified(data, c))}</span></div>'
        countries += '</div>'
    countries += '</div><div class="links">' + link('/#plan', '출국 일정 계산') + link('/airlines/', '항공사 규정 비교') + '</div>'
    out.append(page('countries', 'countries', '강아지 해외여행 국가별 입국 규정',
                    '한국 출발 반려견의 국가별 입국 검역 요건, 준비 일정, 도착 후 검역과 귀국 준비를 비교하세요.',
                    '목적지별 상세 페이지에서 입국 요건과 준비 타임라인, 출처를 확인하세요.', countries, verified(data), extra=COUNTRY_FILTER_JS))
    airlines = '<h2 id="list">항공사별 반려동물 규정</h2><div class="air-grid">'
    for a in data['airlines']:
        cabin = a.get('cabin', {}).get('maxKg')
        checked = a.get('checked', {})
        checked_text = f'케이지 포함 {checked["maxKg"]}kg 이하' if checked.get('allowed') is True and checked.get('maxKg') else '운송 안 함' if checked.get('allowed') is False else '확인 필요'
        airlines += f'<section class="panel"><h3>{link("/airlines/" + a["id"] + "/", a["name"])}</h3><dl class="kv"><dt>기내</dt><dd>{esc(str(cabin) + "kg 이하 (케이지 포함)" if cabin else "확인 필요")}</dd><dt>위탁</dt><dd>{esc(checked_text)}</dd></dl><p class="hint">확인일 {esc(verified(data, a))}</p></section>'
    airlines += '</div><div class="links">' + link('/#flights', '목적지·무게별 항공편 찾기') + link('/#airlines', '견종별 단두종 확인·상세 비교') + link('/countries/', '국가별 입국 규정') + '</div>'
    out.append(page('airlines', 'airlines', '강아지 기내 동반 항공사 비교와 운송 규정',
                    '국적 항공사 반려견 기내 동반·위탁 무게, 케이지 규격, 요금과 신청 방법을 항공사별로 확인하세요.',
                    '무게 한도만으로 탑승이 보장되지는 않습니다. 상세 규정과 노선·기종 제한을 함께 확인하세요.', airlines, verified(data)))
    sos = '''<div class="links"><a class="btn btn-primary" href="/mycard/">My Card 열기</a><a class="btn" href="/#sos">다국어 진료용 카드 열기</a></div>
<h2 id="languages">영어·일본어·중국어·한국어 다국어 진료용 카드</h2>
<p>해외 동물병원에서 이름, 체중, 마이크로칩 번호, 지병, 알레르기, 복용약과 보호자 연락처를 한 화면으로 보여줄 수 있습니다.</p>
<p>고정 문구와 선택형 항목을 번역합니다. 직접 입력한 메모와 약 이름은 원문 그대로 표시합니다.</p>
<h2 id="prepare">여행 전에 준비하는 순서</h2>
<ol><li><a href="/mycard/">펫 카드</a>에 반려견 정보를 입력합니다. 확인되지 않은 항목은 미입력으로 남겨 둡니다.</li>
<li>My Card에서 예시를 확인하고 간단 정보를 입력한 뒤 목적지에 맞는 언어를 고릅니다.</li>
<li>완성된 진료용 카드를 PNG 이미지로 내려받거나 인쇄·PDF로 저장합니다.</li>
<li>같은 기기에서 오프라인으로 열리는지 출발 전에 확인합니다.</li></ol>
<h2 id="vet">현지 동물병원 찾기</h2><p>다국어 진료용 카드 화면에서 나라와 도시를 선택해 현지 검색어로 지도 검색을 열 수 있습니다. 병원 운영 시간과 응급 진료 가능 여부는 전화로 확인하세요.</p>
<h2 id="storage">저장과 전달</h2><p>My Card에서 언어별 진료용 카드 이미지를 내려받아 휴대폰에 보관하고 동행자에게 전달할 수 있습니다. 지원되는 기기에서는 공유·저장을 이용하세요. 카드에는 연락처와 건강 정보가 포함되므로 전달 전에 확인하세요.</p><p>입력 정보는 이 기기의 브라우저에 저장됩니다. 다른 기기에서 링크를 열면 내 정보는 나타나지 않습니다. 브라우저 데이터를 삭제하거나 기기를 바꾸기 전 펫 카드의 백업 기능을 이용하세요.</p>
<p>이 카드는 진료 시 보호자 정보를 전달하기 위한 참고 자료이며 공식 검역증명서나 처방전을 대신하지 않습니다.</p>'''
    out.append(page('sos', 'sos', 'My Card · 반려견 여행 준비와 다국어 진료용 카드',
                    '영어·일본어·중국어·한국어 반려견 다국어 진료용 카드로 지병·알레르기·복용약·연락처를 현지 수의사에게 보여주세요.',
                    '여행 전에 정보를 입력하고, 반려견이 아플 때 현지 동물병원에서 카드 화면을 보여주세요.', sos, verified(data)))
    mycard = '''<section class="mycard-privacy" aria-label="내 정보 보관 안내"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg><div><h2>입력한 정보는 이 기기에 보관돼요</h2><p>반려견 정보·사진·서류는 지금 사용하는 브라우저에 저장돼요. 카드 작성만으로 PawTrip에 전송되거나 다른 사용자에게 공개되지 않아요.</p><p class="mycard-privacy-detail">직접 카드를 공유하거나 Apple Wallet 발급에 동의할 때만, 전달할 정보를 외부로 보내요. <a href="/privacy.html#s3">자세히 보기</a></p></div></section>
<h2 id="medical">휴대폰에 보관하는 다국어 진료용 카드</h2>
<p>예시 카드 보기, 간단 정보 입력, 언어별 미리보기와 PNG 이미지 내려받기를 지원합니다. 영어·일본어·중국어·한국어로 현지 동물병원에서 보여줄 카드를 만들고 인쇄·PDF로 보관하세요. 공유 기능은 지원되는 기기에서 제공됩니다.</p>
<h2 id="checklists">국가별 준비 체크리스트 관리</h2>
<p>국가별 입국 요건을 체크하면 My Card에서 완료 개수와 준비 진행 상황을 확인하고 이어서 수정할 수 있습니다.</p>
<p><a href="/countries/">국가별 입국 규정과 체크리스트 보기</a></p>
<h2 id="documents">반려견 정보와 서류 보관</h2>
<p>반려견 정보, 접종 기록, 검역 서류의 사진·PDF 사본을 한곳에서 관리합니다. 원본 서류는 별도로 챙겨 주세요.</p>
<h2 id="backup">자동 저장과 백업</h2>
<p>정보는 이 브라우저에만 저장됩니다. 기기를 바꾸기 전 백업 파일을 내려받으세요. 다른 기기와 자동 동기화되지는 않습니다.</p>
<noscript><p>체크 기록과 반려견 정보를 관리하려면 JavaScript를 활성화해 주세요.</p></noscript>'''
    out.append(dict(slug='mycard', tab='wallet', title='My Card · 반려견 여행 준비 체크리스트와 서류 관리',
                    heading='My Card', desc='반려견 다국어 진료용 카드를 만들고 PNG 이미지·인쇄·PDF로 보관하세요. 국가별 입국 준비 체크리스트, 반려견 정보와 검역 서류 관리, 자동 저장과 백업을 지원합니다.',
                    lead='국가별 준비사항과 반려견 정보, 서류를 한곳에서 관리하세요.', group='내 반려견 · My Card',
                    body=lambda: mycard, verified=verified(data),
                    extra='<script src="/features.js?v=10"></script><script src="/wallet-config.js?v=1"></script><script src="/medical-card.js?v=2"></script><script src="/mycard.js?v=2"></script>'))
    return out
