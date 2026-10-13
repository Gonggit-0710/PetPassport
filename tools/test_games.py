"""Release contract for independent game URLs and the approved policy."""
import hashlib
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
POLICY_SHA = '080d7671e73da38d5813c6b1e20c1c782a99556e5d39aec88e369fe33b327d5c'


class GamesTest(unittest.TestCase):
    def test_final_policy_is_unchanged_and_both_languages_remain(self):
        policy = ROOT / 'games/not-the-vacuum/privacy/index.html'
        self.assertEqual(hashlib.sha256(policy.read_bytes().replace(b'\r\n', b'\n')).hexdigest(), POLICY_SHA)
        text = policy.read_text(encoding='utf-8')
        self.assertIn('<section id="ko" lang="ko">', text)
        self.assertIn('<section id="en" lang="en">', text)
        self.assertNotIn('<script', text.lower())

    def test_game_pages_are_independent_and_use_supplied_art(self):
        for name in ['games/index.html', 'games/not-the-vacuum/index.html']:
            source = (ROOT / name).read_text(encoding='utf-8')
            self.assertNotIn('<script', source.lower())
            self.assertIn('mailto:help@pawtrip.us', source)
            for dog in ['bori', 'tory', 'gureum']:
                self.assertIn(f'/games/assets/{dog}.png', source)
            self.assertIn('Coming soon', source)
        intro = (ROOT / 'games/not-the-vacuum/index.html').read_text(encoding='utf-8')
        self.assertIn('로그인 없이 바로 시작. 광고는 원할 때만 골라 보는 보상형 광고예요.', intro)
        self.assertIn('No login. Ads play only when you choose to watch one for a reward.', intro)
        self.assertIn('/privacy/#ko', intro)
        self.assertIn('/privacy/#en', intro)

    def test_root_ad_seller_file_and_sitemap(self):
        self.assertEqual((ROOT / 'app-ads.txt').read_bytes(), b'google.com, pub-6262324542700705, DIRECT, f08c47fec0942fa0\n')
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        urls = [entry.text for entry in ET.parse(ROOT / 'sitemap.xml').findall('s:url/s:loc', ns)]
        for path in ['/games/', '/games/not-the-vacuum/', '/games/not-the-vacuum/privacy/']:
            self.assertIn('https://pawtrip.us' + path, urls)
        self.assertNotIn('Disallow: /games', (ROOT / 'robots.txt').read_text(encoding='utf-8'))


if __name__ == '__main__':
    unittest.main()
