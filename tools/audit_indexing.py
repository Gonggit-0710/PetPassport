"""사이트맵 주소의 수집 가능성과 정적 내부 연결을 점검합니다."""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.canonical = []
        self.robots = []
        self.links = []
        self.title = ''
        self.in_title = False
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'link' and 'canonical' in attrs.get('rel', '').split():
            self.canonical.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('name', '').lower() in {'robots', 'googlebot'}:
            self.robots.append(attrs.get('content', '').lower())
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, value):
        if self.in_title:
            self.title += value


def audit(root=ROOT, base_url=None):
    def read(path):
        if base_url:
            request = Request(base_url.rstrip('/') + path,
                              headers={'User-Agent': 'PawTrip-site-review'})
            with urlopen(request, timeout=20) as response:
                return (response.read().decode('utf-8'), response.status,
                        response.url, response.headers.get('X-Robots-Tag', ''))
        file = root / (path.lstrip('/') + 'index.html' if path.endswith('/') else path.lstrip('/'))
        return file.read_text(encoding='utf-8'), 200, '', ''

    sitemap, _, _, _ = read('/sitemap.xml')
    urls = [node.text for node in ET.fromstring(sitemap).findall('.//{*}loc')]
    robots = RobotFileParser()
    robots.parse(read('/robots.txt')[0].splitlines())

    def inspect(url):
        path = urlsplit(url).path
        row = {'url': url, 'issues': []}
        try:
            source, status, final, header = read(path)
            page = Page(source)
            row.update(status=status, title=page.title.strip(), canonical=page.canonical,
                       links=page.links)
            if status != 200:
                row['issues'].append('정상 응답이 아닙니다')
            if base_url and final != base_url.rstrip('/') + path:
                row['issues'].append('다른 주소로 이동합니다')
            directives = ','.join(page.robots + [header.lower()]).replace(';', ',').split(',')
            if any(value.strip() in {'noindex', 'none', 'googlebot: noindex', 'googlebot: none'} for value in directives):
                row['issues'].append('검색 색인이 차단되어 있습니다')
            if not robots.can_fetch('Googlebot', url):
                row['issues'].append('검색 수집이 차단되어 있습니다')
            # 승인된 게임 방침에는 메타 태그를 임의로 추가하지 않습니다.
            if path != '/games/not-the-vacuum/privacy/' and page.canonical != [url]:
                row['issues'].append('대표 주소가 사이트맵 주소와 다릅니다')
            if not row['title']:
                row['issues'].append('페이지 제목이 없습니다')
        except Exception as error:
            row['issues'].append('페이지 확인 실패: ' + str(error))
        return row

    with ThreadPoolExecutor(max_workers=3) as pool:
        rows = list(pool.map(inspect, urls))
    incoming = {url: set() for url in urls}
    titles = Counter(row.get('title') for row in rows if row.get('title'))
    for row in rows:
        if titles[row.get('title')] > 1:
            row['issues'].append('다른 페이지와 제목이 같습니다')
        for ref in row.pop('links', []):
            target = urlsplit(urljoin(row['url'], ref))
            address = target._replace(query='', fragment='').geturl()
            if address in incoming and address != row['url']:
                incoming[address].add(row['url'])
    for row in rows:
        row['incoming_pages'] = sorted(incoming[row['url']])
    return {'scope': base_url or '로컬 파일', 'pages': rows,
            'issue_count': sum(len(row['issues']) for row in rows),
            'note': '이 검사는 검색 수집의 기술 조건을 점검하며 Google 색인 여부를 판정하지 않습니다.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', help='운영 또는 로컬 서버 주소, 생략하면 로컬 파일 검사')
    parser.add_argument('--output', type=Path, help='검사 결과를 저장할 파일')
    args = parser.parse_args()
    result = audit(base_url=args.base_url)
    if args.output:
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"검사 {len(result['pages'])}페이지 / 기술 문제 {result['issue_count']}건")
    for row in result['pages']:
        if row['issues']:
            print(row['url'], ' · '.join(row['issues']))
    raise SystemExit(bool(result['issue_count']))
