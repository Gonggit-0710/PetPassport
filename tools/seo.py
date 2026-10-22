"""Static discovery and truthful metadata; never read browser/user records."""
from pathlib import Path
import datetime
import hashlib
import html
import json
import re

ROOT=Path(__file__).resolve().parent.parent
SITE='https://pawtrip.us'

def ld(value):
    return '<script type="application/ld+json">'+json.dumps(value,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+'</script>'

def organization():
    return {'@type':'Organization','@id':SITE+'/#organization','name':'PawTrip','url':SITE+'/','logo':SITE+'/media/logo-light.svg'}

def breadcrumb(items):
    return {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':n,'name':name,'item':SITE+path} for n,(name,path) in enumerate(items,1)]}

def page_metadata(title,description,path,items):
    return ld({'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':SITE+path+'#page','url':SITE+path,'name':title,'description':description,'inLanguage':'ko','isPartOf':{'@id':SITE+'/#website'}},breadcrumb(items)]})

def breadcrumbs_html(items):
    links=[f'<a href="{html.escape(path,quote=True)}">{html.escape(name)}</a>' for name,path in items[:-1]]
    links.append('<span aria-current="page">'+html.escape(items[-1][0])+'</span>')
    return '<nav class="seo-breadcrumb" aria-label="현재 위치">'+' <span aria-hidden="true">›</span> '.join(links)+'</nav>'

def static_menu():
    groups=[('준비하기',[('항공편 선택','/#flights'),('일정 계산','/#plan'),('준비 루틴','/#prep'),('항체가 검사','/titer/'),('비용 계산','/cost/')]),('규정',[('국가별 규정','/countries/'),('항공사 비교','/airlines/'),('국내 이동','/domestic/'),('현지 이동','/local/'),('귀국 검역','/#return')])]
    out=''
    for name,items in groups:
        out+='<p class="rail-g">'+name+'</p><ol>'+''.join(f'<li><a class="rl" href="{path}"><span class="dot"></span>{label}</a></li>' for label,path in items)+'</ol>'
    return out+'<a class="pawlog-nav" href="/pawlog/"><b>PawLog<img class="pawlog-paw" src="/media/paw-coral.svg" alt="" aria-hidden="true" width="22" height="22"></b><span class="pawlog-description">공이와 함께, 여행도 일상도.</span></a>'

def discovery(data, blog_posts=None):
    groups=[('국가별 반려견 입국 준비',[(c['name'],f"/countries/{c['id']}/") for c in data['countries']]),('항공사별 반려동물 탑승 안내',[(a['name'],f"/airlines/{a['id']}/") for a in data['airlines']])]
    if blog_posts:
        groups.append(('공이의 여행·일상 이야기', [(p['title'], f'/pawlog/{p["slug"]}/') for p in blog_posts[:3]]))
    label = '여행 준비 안내와 공이의 이야기' if blog_posts else '목적지·항공사별 준비 안내'
    out=f'<details class="seo-discovery"><summary>{label}</summary>'
    for name,items in groups:
        out+='<p><strong>'+name+'</strong></p><div class="links">'+''.join(f'<a href="{path}">{html.escape(label)}</a>' for label,path in items)+'</div>'
    return out+'</details>'

def update_home(data, blog_posts=None):
    path=ROOT/'index.html'
    source=path.read_text(encoding='utf-8')
    schema=ld({'@context':'https://schema.org','@graph':[organization(),{'@type':'WebSite','@id':SITE+'/#website','name':'PawTrip','alternateName':'포트립','url':SITE+'/','inLanguage':'ko','publisher':{'@id':SITE+'/#organization'}}]})
    for name,content,anchor in [('metadata',schema,'</head>'),('discovery',discovery(data, blog_posts),'<footer class="foot">')]:
        block=f'<!-- seo:{name} -->{content}<!-- /seo:{name} -->'
        pattern=r'<!-- seo:'+name+r' -->.*?<!-- /seo:'+name+r' -->'
        if re.search(pattern,source,re.S):source=re.sub(pattern,lambda _:block,source,flags=re.S)
        else:source=source.replace(anchor,(block+'\n'+anchor) if name=='metadata' else (anchor+'\n'+block),1)
    source=re.sub(r'(<nav aria-label="메뉴" id="navRail">).*?(</nav>)',lambda m:m[1]+static_menu()+m[2],source,count=1,flags=re.S)
    # Render the same input layout as viewFlights, using only public build data.
    match=re.search(r"app.innerHTML = head\('준비하기 · 항공편 선택','(.*?)','(.*?)'\) \+ `(.*?)`;",source,re.S)
    if not match: raise ValueError('Flight view template not found')
    options=''.join(f'<option value="{html.escape(c["id"],quote=True)}"'+(' selected' if c['id']=='jp' else '')+f'>{html.escape(c["name"])}</option>' for c in data['countries'])
    form=match[3].replace('${opts}',options).replace('${esc(state.weight)}','6').replace("${esc(state.breed||'')}",'').replace("${state.brachy?'checked':''}",'')
    if '${' in form: raise ValueError('Unresolved initial flight template')
    initial=f'<header class="page-head"><span class="num">준비하기 · 항공편 선택</span><h2>{match[1]}</h2><p>{match[2]}</p></header>'+form
    source=re.sub(r'(<main id="app" tabindex="-1">).*?(</main>)',lambda m:m[1]+initial+m[2],source,count=1,flags=re.S)
    # Avoid a network wait before rendering saved selections and airline results.
    block='<script id="initial-rules" type="application/json">'+json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+'</script>'
    pattern=r'<script id="initial-rules" type="application/json">.*?</script>'
    if re.search(pattern,source,re.S): source=re.sub(pattern,lambda _:block,source,flags=re.S)
    else: source=source.replace('<script src="/trip-plan.js',block+'\n<script src="/trip-plan.js',1)
    path.write_text(source,encoding='utf-8')

def sitemap_dates(urls):
    path=ROOT/'seo-dates.json'
    records=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    today=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    result=[]
    for url,fallback in urls:
        file=ROOT/(url.lstrip('/')+'index.html' if url.endswith('/') else url.lstrip('/'))
        source=file.read_text(encoding='utf-8')
        # Ignore asset cache tokens and automatic build timestamps. Preserve verification dates elsewhere.
        semantic=''.join(re.findall(r'<title>.*?</title>|<meta name="description"[^>]*>|<script type="application/ld\+json">.*?</script>|<main\b.*?</main>|<section class="hero".*?</section>',source,re.S))
        semantic=re.sub(r'\?v=\d+','',semantic)
        fingerprint=hashlib.sha256(semantic.encode()).hexdigest()
        prior=records.get(url)
        managed=url=='/' or not url.startswith('/games/') and url!='/privacy.html'
        date=prior['date'] if prior and prior['hash']==fingerprint else (today if managed else fallback)
        records[url]={'hash':fingerprint,'date':date}
        result.append((url,date))
    path.write_text(json.dumps({url:records[url] for url,_ in urls},indent=2,ensure_ascii=False),encoding='utf-8')
    return result
