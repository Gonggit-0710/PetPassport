"""Ensure Google receives real content and valid metadata without executing JS."""
import json
import re
import subprocess
import sys
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from tempfile import TemporaryDirectory
from urllib.parse import urljoin, urlsplit
from audit_indexing import audit

ROOT=Path(__file__).resolve().parent.parent

class Metadata(HTMLParser):
    def __init__(self,text):
        super().__init__();self.meta={};self.canonical=[];self.h1=0;self.links=[];self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='meta':self.meta[a.get('name') or a.get('property')]=a.get('content','')
        if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a['href'])
        if tag=='h1':self.h1+=1
        if tag=='a':self.links.append(a.get('href',''))

class SEOTest(unittest.TestCase):
    def test_indexable_pages_have_unique_titles_and_canonical(self):
        urls=[n.text for n in ET.parse(ROOT/'sitemap.xml').findall('.//{*}loc')]
        titles=[]
        for url in urls:
            # The approved game policy is copied verbatim and outside this SEO edit.
            if url.endswith('/games/not-the-vacuum/privacy/'):continue
            path=url.removeprefix('https://pawtrip.us/')
            file=ROOT/(path+'index.html' if url.endswith('/') else path)
            text=file.read_text(encoding='utf-8');p=Metadata(text)
            self.assertEqual(p.canonical,[url],url)
            self.assertTrue(p.meta.get('description'),url)
            self.assertNotIn('noindex',p.meta.get('robots',''),url)
            title=re.search(r'<title>(.*?)</title>',text,re.S).group(1)
            self.assertNotIn(title,titles,url);titles.append(title)
            if '/games/' not in url and not url.endswith('privacy.html'):
                self.assertEqual(p.h1,1,url)
                schemas=re.findall(r'<script type="application/ld\+json">(.*?)</script>',text,re.S)
                self.assertTrue(schemas,url)
                for schema in schemas:self.assertEqual(json.loads(schema)['@context'],'https://schema.org')
    def test_static_discovery_and_old_routes(self):
        p=Metadata((ROOT/'index.html').read_text(encoding='utf-8'))
        for path in ['/countries/jp/','/countries/us/','/airlines/','/pawlog/']:self.assertIn(path,p.links)
        for file in (ROOT/'blog').rglob('index.html'):
            text=file.read_text(encoding='utf-8');self.assertIn('noindex,follow',text);self.assertIn('https://pawtrip.us/pawlog/',text)
        self.assertIn('noindex',(ROOT/'404.html').read_text(encoding='utf-8'))
    def test_blog_schema_matches_the_visible_source(self):
        for f in (ROOT/'blog-content/posts').glob('*.json'):
            post=json.loads(f.read_text(encoding='utf-8'));text=(ROOT/'pawlog'/post['slug']/'index.html').read_text(encoding='utf-8')
            graph=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',text,re.S).group(1))['@graph']
            article=next(x for x in graph if x['@type']=='BlogPosting')
            self.assertEqual(article['headline'],post['title']);self.assertEqual(article['datePublished'],post['date']);self.assertEqual(article['image'],['https://pawtrip.us'+post['cover']])
            self.assertNotIn('aggregateRating',article)
    def test_build_does_not_fake_new_modification_dates(self):
        before=(ROOT/'seo-dates.json').read_bytes()
        subprocess.run([sys.executable,str(ROOT/'tools/build_pages.py')],cwd=ROOT,check=True,capture_output=True)
        self.assertEqual((ROOT/'seo-dates.json').read_bytes(),before)

    def test_travel_sitemap_is_reachable_without_javascript(self):
        report = audit()
        self.assertEqual(report['issue_count'], 0, report)
        travel = {row['url'] for row in report['pages'] if '/games/' not in row['url']}
        visited, pending = set(), ['https://pawtrip.us/']
        while pending:
            url = pending.pop()
            if url in visited:
                continue
            visited.add(url)
            path = urlsplit(url).path
            file = ROOT / (path.lstrip('/')+'index.html' if path.endswith('/') else path.lstrip('/'))
            for ref in Metadata(file.read_text(encoding='utf-8')).links:
                target = urlsplit(urljoin(url, ref))._replace(query='', fragment='').geturl()
                if target in travel and target not in visited:
                    pending.append(target)
        self.assertEqual(travel - visited, set())

    def test_audit_detects_blocked_and_miscanonicalized_pages(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'sitemap.xml').write_text('<urlset><url><loc>https://pawtrip.us/</loc></url></urlset>', encoding='utf-8')
            (root/'robots.txt').write_text('User-agent: *\nDisallow: /\n', encoding='utf-8')
            (root/'index.html').write_text('<title>검사</title><meta name="robots" content="noindex"><link rel="canonical" href="https://pawtrip.us/other/">', encoding='utf-8')
            self.assertEqual(audit(root)['issue_count'], 3)

    def test_blog_navigation_preserves_imported_story_and_dates(self):
        from blog_core import posts
        for post in posts():
            source = (ROOT/'pawlog'/post['slug']/'index.html').read_text(encoding='utf-8')
            self.assertIn('<div class="story">'+post['body']+'</div>', source)
            self.assertIn('<time datetime="'+post['date']+'">', source)
            navigation = re.search(r'<nav class="story-navigation"[^>]*>(.*?)</nav>', source, re.S).group(1)
            self.assertTrue(Metadata(navigation).links)
            for ref in Metadata(navigation).links:
                self.assertNotEqual(ref, '/pawlog/'+post['slug']+'/')
                self.assertTrue((ROOT/ref.lstrip('/')/'index.html').is_file())

if __name__=='__main__':unittest.main()
