"""Regression checks for crawlable output and the monthly data update contract."""
import copy
import html
import json
from html.parser import HTMLParser
from pathlib import Path
import subprocess
import tempfile
import unittest
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

from rule_pages import pages, validate

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'data.json').read_text(encoding='utf-8'))


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.links, self.ids, self.h1, self.canonical, self.scripts = [], set(), 0, [], []
        self.inline = None
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'h1':
            self.h1 += 1
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs['href'])
        if tag == 'script' and not attrs.get('src') and attrs.get('type', '') in ('', 'text/javascript'):
            self.inline = ''

    def handle_data(self, text):
        if self.inline is not None:
            self.inline += text

    def handle_endtag(self, tag):
        if tag == 'script' and self.inline is not None:
            self.scripts.append(self.inline)
            self.inline = None


class RulePagesTest(unittest.TestCase):
    def test_data_updates_change_static_rules_and_verified_date(self):
        data = copy.deepcopy(DATA)
        data['meta']['verified'] = '2026-11-01'
        data['countries'][0]['requirements'][0] = 'Monthly updated requirement <safe>'
        data['countries'][0].update(leadDays=123, difficulty=2, region='mid')
        data['airlines'][0]['cabin']['maxKg'] = 8.5
        generated = {p['slug']: p for p in pages(data)}
        country = generated['countries/' + data['countries'][0]['id']]
        airline = generated['airlines/' + data['airlines'][0]['id']]
        self.assertIn('Monthly updated requirement &lt;safe&gt;', country['body']())
        self.assertIn('123<small>일</small>', country['body']())
        self.assertIn('검역 난이도 5단계 중 2', country['body']())
        self.assertIn('중거리', country['body']())
        self.assertIn('8.5kg', airline['body']())
        self.assertEqual(country['verified'], '2026-11-01')
        self.assertEqual(airline['verified'], '2026-11-01')
        data['countries'][0]['verified'] = '2026-10-20'
        self.assertEqual(pages(data)[0]['verified'], '2026-10-20')

    def test_invalid_ids_and_sources_fail_before_build(self):
        for mutate in (lambda d: d['countries'][0].update(id='../unsafe'),
                       lambda d: d['countries'][1].update(id=d['countries'][0]['id']),
                       lambda d: d['airlines'][0]['source'].update(url='javascript:alert(1)')):
            data = copy.deepcopy(DATA)
            mutate(data)
            with self.assertRaises(ValueError):
                validate(data)

    def test_all_new_pages_have_static_content_and_real_internal_links(self):
        generated = pages(DATA)
        self.assertEqual(len(generated), len(DATA['countries']) + len(DATA['airlines']) + 3)
        for p in generated:
            file = ROOT / p['slug'] / 'index.html'
            source = file.read_text(encoding='utf-8')
            doc = Document(source)
            self.assertEqual(doc.h1, 1, p['slug'])
            self.assertEqual(doc.canonical, ['https://pawtrip.us/' + p['slug'] + '/'])
            self.assertIn(html.escape(p['title']), source)
            self.assertIn(p['body'](), source)
            for href in doc.links:
                url = urlsplit(href)
                if url.scheme or url.netloc or not url.path:
                    continue
                target = ROOT / unquote(url.path.lstrip('/'))
                if url.path.endswith('/'):
                    target /= 'index.html'
                self.assertTrue(target.is_file(), f'{p["slug"]}: broken link {href}')

    def test_sitemap_contains_every_new_page(self):
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        sitemap = ET.parse(ROOT / 'sitemap.xml')
        urls = [x.text for x in sitemap.findall('s:url/s:loc', ns)]
        self.assertEqual(len(urls), len(set(urls)))
        for p in pages(DATA):
            self.assertIn('https://pawtrip.us/' + p['slug'] + '/', urls)

    def test_javascript_syntax(self):
        scripts = []
        for file in [ROOT / 'index.html'] + [ROOT / p['slug'] / 'index.html' for p in pages(DATA)]:
            scripts.extend(Document(file.read_text(encoding='utf-8')).scripts)
        with tempfile.TemporaryDirectory() as temp:
            for i, script in enumerate(scripts):
                path = Path(temp) / f'script-{i}.js'
                path.write_text(script, encoding='utf-8')
                subprocess.run(['node', '--check', str(path)], check=True, capture_output=True)
        for name in ('nav.js', 'search.js', 'features.js', 'sw.js'):
            subprocess.run(['node', '--check', str(ROOT / name)], check=True, capture_output=True)


if __name__ == '__main__':
    unittest.main()
