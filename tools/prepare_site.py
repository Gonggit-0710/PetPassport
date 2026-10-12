"""Stage only public website files for the Pages artifact (no tools or Git data)."""
from pathlib import Path
import shutil
import json
from rule_pages import pages

ROOT = Path(__file__).resolve().parent.parent
FILES = ['.nojekyll', 'CNAME', 'index.html', 'privacy.html', 'base.css',
         'features.css', 'rules.css', 'features.js', 'medical-card.js', 'wallet-config.js', 'mycard.js', 'nav.js', 'search.js', 'search-index.json',
         'data.json', 'airports.json', 'sitemap.xml', 'robots.txt', 'sw.js',
         'manifest.webmanifest']
DIRS = ['media', 'domestic', 'titer', 'cost', 'local', 'changes']


def stage():
    dest = ROOT / '_site'
    # Clean only this fixed build-output directory, never a caller-supplied path.
    if dest.exists():
        if dest.is_symlink() or dest.resolve().parent != ROOT or dest.resolve().name != '_site':
            raise ValueError('_site must be a local directory inside the repository')
        shutil.rmtree(dest)
    dest.mkdir()
    for name in FILES:
        shutil.copy2(ROOT / name, dest / name)
    for name in DIRS:
        shutil.copytree(ROOT / name, dest / name)
    # Only current data IDs are published: retired rules cannot leak into the artifact.
    data = json.loads((ROOT / 'data.json').read_text(encoding='utf-8'))
    for p in pages(data):
        target = dest / p['slug']
        target.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / p['slug'] / 'index.html', target / 'index.html')
    print('Prepared public site in _site')


if __name__ == '__main__':
    stage()
