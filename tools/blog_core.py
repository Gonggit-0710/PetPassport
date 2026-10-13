"""Build PawLog and validate the local editor's publishable content."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import datetime
import html
import json
import re
from seo import ld, breadcrumb, organization

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / 'blog-content'
POSTS = CONTENT / 'posts'
ALLOWED = {'p','br','h2','h3','strong','b','em','i','u','s','ul','ol','li','blockquote','figure','figcaption','img','a','table','thead','tbody','tr','th','td','hr','div'}
VOID = {'br','img','hr'}

def esc(value):
    return html.escape(str(value), quote=True)

class Cleaner(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.hidden = 0
    def handle_starttag(self, tag, attrs):
        if tag in {'script','style','iframe','object','svg'}:
            self.hidden += 1
            return
        if self.hidden or tag not in ALLOWED:
            return
        attrs = dict(attrs)
        clean = ''
        if tag == 'div' and attrs.get('class') in {'note-box','table-wrap'}:
            clean = f' class="{attrs["class"]}"'
        if tag == 'a':
            u = attrs.get('href','')
            if urlsplit(u).scheme in {'http','https','mailto'} or u.startswith('/pawlog/') or u.startswith('#'):
                clean = f' href="{esc(u)}" rel="noopener"'
        if tag == 'img':
            src = attrs.get('src','')
            if not re.fullmatch(r'/pawlog/media/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)', src):
                raise ValueError('사진은 업로드한 PawLog 파일만 사용할 수 있습니다.')
            if not (ROOT / src.lstrip('/')).is_file() and not (ROOT/'.blog-admin/uploads'/Path(src).name).is_file():
                raise ValueError('사진 파일을 찾을 수 없습니다.')
            clean = f' src="{esc(src)}" alt="{esc(attrs.get("alt",""))}" loading="lazy" decoding="async"'
        if tag in {'td','th'}:
            for key in ('colspan','rowspan'):
                if attrs.get(key,'').isdigit() and 1 <= int(attrs[key]) <= 20:
                    clean += f' {key}="{attrs[key]}"'
        self.out.append(f'<{tag}{clean}>')
    def handle_endtag(self, tag):
        if tag in {'script','style','iframe','object','svg'}:
            self.hidden = max(0, self.hidden - 1)
        elif not self.hidden and tag in ALLOWED and tag not in VOID:
            self.out.append(f'</{tag}>')
    def handle_data(self, data):
        if not self.hidden:
            self.out.append(esc(data))

def clean_html(value):
    parser = Cleaner()
    parser.feed(value)
    return ''.join(parser.out)

def plain(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]*>', ' ', value))).strip()

def validate(post):
    p = {key: str(post.get(key,'')) for key in ['slug','title','date','excerpt','cover','source','body']}
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', p['slug']) or len(p['slug']) > 80 or p['slug'] in {'media','admin','index'}:
        raise ValueError('주소는 영문 소문자·숫자·하이픈으로 입력해 주세요.')
    if not p['title'].strip() or len(p['title']) > 200:
        raise ValueError('제목을 입력해 주세요(200자 이하).')
    datetime.date.fromisoformat(p['date'])
    if len(p['body']) > 2_000_000 or not plain(p['body']):
        raise ValueError('본문을 입력해 주세요.')
    p['body'] = clean_html(p['body'])
    if p['cover']:
        clean_html(f'<img src="{esc(p["cover"])}">')
    if p['source'] and urlsplit(p['source']).scheme not in {'http','https'}:
        raise ValueError('원문 링크는 http 또는 https 주소여야 합니다.')
    return p

def posts():
    return sorted([validate(json.loads(p.read_text(encoding='utf-8'))) for p in POSTS.glob('*.json')], key=lambda p:(p['date'],p['slug']), reverse=True)

def shell(title, description, path, body, cover='',post=None):
    image = f'<meta property="og:image" content="https://pawtrip.us{esc(cover)}">' if cover else ''
    crumbs=[('PawTrip','/'),('PawLog','/pawlog/')]
    graph=[breadcrumb(crumbs+([(title,path)] if post else []))]
    if post:
        graph += [organization(),{'@type':'BlogPosting','headline':title,'description':description,'url':'https://pawtrip.us'+path,'mainEntityOfPage':'https://pawtrip.us'+path,'datePublished':post['date'],'image':['https://pawtrip.us'+cover] if cover else [],'inLanguage':'ko','author':{'@id':'https://pawtrip.us/#organization'},'publisher':{'@id':'https://pawtrip.us/#organization'}}]
    metadata=ld({'@context':'https://schema.org','@graph':graph})
    # Measure public PawLog pages only; omit query/hash and all private dog data.
    analytics_title = json.dumps('PawTrip · PawLog' + (' · ' + title if post else ''), ensure_ascii=False).replace('<', '\\u003c')
    analytics_path = json.dumps(path)
    analytics = f'''<script>
(function(){{
  if(!/(^|\\.)pawtrip\\.us$/.test(location.hostname)) return;
  var ID='G-6G8CX7W76G';
  window.dataLayer=window.dataLayer||[];window.gtag=function(){{dataLayer.push(arguments);}};
  var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.appendChild(s);
  gtag('js',new Date());gtag('config',ID,{{send_page_view:false}});
  gtag('event','page_view',{{page_title:{analytics_title},page_path:{analytics_path},page_location:location.origin+{analytics_path}}});
}})();
</script>'''
    return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} · PawLog</title><meta name="description" content="{esc(description)}"><link rel="canonical" href="https://pawtrip.us{path}">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="https://pawtrip.us{path}">{image}
<meta property="og:type" content="{'article' if post else 'website'}"><meta property="og:locale" content="ko_KR"><meta name="twitter:card" content="summary_large_image">{metadata}
<link rel="icon" href="/media/icon-192.png"><link rel="stylesheet" href="/pawlog/blog.css?v=4">{analytics}</head><body>
<a class="skip" href="#main">본문으로 건너뛰기</a><header><a class="brand" href="/" aria-label="PawTrip 홈"><img src="/media/logo-light.svg" alt="PawTrip"></a><nav aria-label="PawLog 메뉴"><a href="/pawlog/">PawLog</a><a href="/mydog/">My Dog</a></nav></header>
<main id="main">{body}</main><footer><a href="/">PawTrip 여행 준비</a><span>© PawTrip · PawLog</span></footer></body></html>'''

def build_blog():
    POSTS.mkdir(parents=True, exist_ok=True)
    items = posts()
    cards = []
    for p in items:
        path = '/pawlog/' + p['slug'] + '/'
        target = ROOT / path.lstrip('/')
        target.mkdir(exist_ok=True)
        source = ''  # Keep provenance in the content record, not the public header.
        body = f'<article><a class="back" href="/pawlog/">← PawLog 전체 이야기</a><p class="eyebrow">공이와 함께, 여행도 일상도.</p><h1>{esc(p["title"])}</h1><div class="meta"><time datetime="{p["date"]}">{p["date"]}</time>{source}</div><div class="story">{p["body"]}</div><aside class="next"><a href="/pawlog/">다른 이야기 읽기 →</a></aside></article>'
        (target / 'index.html').write_text(shell(p['title'],p['excerpt'],path,body,p['cover'],p),encoding='utf-8')
        cover = f'<img src="{esc(p["cover"])}" alt="{esc(p["title"])}" loading="lazy">' if p['cover'] else '<div class="empty-cover">🐾 PawLog</div>'
        cards.append(f'<a class="post-card" href="{path}">{cover}<div><time>{p["date"]}</time><h2>{esc(p["title"])}</h2><p>{esc(p["excerpt"])}</p><span>이야기 읽기 →</span></div></a>')
    body = '<section class="intro"><p class="eyebrow">PAWLOG</p><h1>공이와 함께,<br>여행도 일상도.</h1><p>여행에서 만난 뜻밖의 순간부터 소소한 일상까지.<br>공이와 함께한 여행과 일상의 순간을 기록합니다.</p></section><section class="post-grid" aria-label="PawLog 이야기">'+''.join(cards)+'</section>'
    (ROOT/'pawlog/index.html').write_text(shell('공이와 함께, 여행도 일상도.','여행과 일상 속 공이와 함께한 여행과 일상의 순간을 기록합니다.','/pawlog/',body),encoding='utf-8')
    # GitHub Pages has no server redirect rules: keep explicit legacy entry pages.
    for slug in [''] + [p['slug'] for p in items]:
        old = ROOT/'blog'/slug
        old.mkdir(parents=True,exist_ok=True)
        destination = '/pawlog/' + (slug+'/' if slug else '')
        redirect = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://pawtrip.us{destination}"><meta http-equiv="refresh" content="0;url={destination}"><title>PawLog로 이동</title></head><body><p><a href="{destination}">PawLog로 이동합니다.</a></p><script>location.replace({json.dumps(destination)}+location.search+location.hash);</script></body></html>'''
        (old/'index.html').write_text(redirect,encoding='utf-8')
    return items

if __name__ == '__main__':
    print('Built PawLog:', len(build_blog()), 'posts')
