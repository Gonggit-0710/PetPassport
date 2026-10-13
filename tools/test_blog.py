"""PawLog publishing contract: unsafe HTML, paths and public/private separation."""
import json
import unittest
from blog_core import ROOT, posts, validate, clean_html

class BlogTest(unittest.TestCase):
    def test_imported_articles_and_photos_are_local(self):
        manifest = json.loads((ROOT/'blog-content/import-manifest.json').read_text(encoding='utf-8'))
        self.assertEqual(len(manifest),3)
        for record in manifest:
            p=json.loads((ROOT/'blog-content/posts'/(record['slug']+'.json')).read_text(encoding='utf-8'))
            self.assertEqual(p['source'],record['source'])
            for photo in record['photos']:
                self.assertIn(photo['file'],p['body'])
                self.assertTrue((ROOT/photo['file'].lstrip('/')).is_file())
            self.assertNotIn('pstatic.net',p['body'])
    def test_untrusted_content_cannot_publish_scripts_or_remote_images(self):
        result=clean_html('<p onclick="alert(1)">safe</p><script>secret</script><a href="javascript:alert(1)">link</a><iframe src="https://example.com"></iframe>')
        self.assertNotIn('onclick',result)
        self.assertNotIn('script',result)
        self.assertNotIn('secret',result)
        self.assertNotIn('javascript',result)
        with self.assertRaises(ValueError): clean_html('<img src="https://example.com/tracker.png">')
        with self.assertRaises(ValueError): clean_html('<img src="/pawlog/media/../../data.json">')
    def test_post_path_validation(self):
        p=posts()[0].copy()
        for slug in ['../privacy','admin','media','index','My Story']:
            p['slug']=slug
            with self.assertRaises(ValueError): validate(p)

if __name__=='__main__': unittest.main()
