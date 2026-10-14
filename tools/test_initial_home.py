"""Initial homepage remains usable before the public rules request completes."""
import copy
import json
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import patch
import seo

ROOT = Path(__file__).resolve().parent.parent

class InitialHomeTests(unittest.TestCase):
    def test_initial_rules_follow_build_data_and_escape_html(self):
        data = json.loads((ROOT / 'data.json').read_text(encoding='utf-8'))
        data = copy.deepcopy(data)
        data['countries'][0]['name'] = '</script><script>alert(1)</script>'
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'index.html'
            path.write_text((ROOT / 'index.html').read_text(encoding='utf-8'), encoding='utf-8')
            with patch.object(seo, 'ROOT', Path(folder)):
                seo.update_home(data)
            source = path.read_text(encoding='utf-8')
        payload = re.search(r'<script id="initial-rules" type="application/json">(.*?)</script>', source, re.S)[1]
        self.assertEqual(json.loads(payload), data)
        self.assertNotIn('<script>', payload)
        main = re.search(r'<main id="app".*?</main>', source, re.S)[0]
        self.assertIn('id="fform"', main)
        self.assertIn('id="fdest"', main)
        self.assertNotIn('<script>', main)
        self.assertIn('&lt;/script&gt;', main)

if __name__ == '__main__':
    unittest.main()
