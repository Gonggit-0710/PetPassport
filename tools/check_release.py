"""Check the static Pages artifact before upload; never inspect private inputs."""
import json
import hashlib
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent


class References(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.refs = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ('href', 'src') and value:
                self.refs.append(value)


def check():
    site = ROOT / '_site'
    if not site.is_dir():
        raise ValueError('Run tools/prepare_site.py first')
    files = sorted(p for p in site.rglob('*') if p.is_file())
    for file in files:
        relative = file.relative_to(site)
        if any(part in {'wallet-service', 'node_modules', 'tools', 'docs', '.git', 'certificates', '.blog-admin', 'blog-content'} for part in relative.parts):
            raise ValueError(f'Non-public directory: {relative}')
        if file.suffix.lower() in {'.pem', '.key', '.p12', '.pfx', '.pkpass'} or file.name.startswith('.env'):
            raise ValueError(f'Non-public file: {relative}')
        if file.is_symlink() or not file.resolve().is_relative_to(site.resolve()):
            raise ValueError(f'Unexpected file link: {relative}')
        if file.suffix != '.html':
            continue
        for ref in References(file.read_text(encoding='utf-8')).refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc or not url.path:
                continue
            target = site / unquote(url.path.lstrip('/')) if url.path.startswith('/') else file.parent / unquote(url.path)
            if url.path.endswith('/'):
                target /= 'index.html'
            if not target.resolve().is_relative_to(site.resolve()) or not target.is_file():
                raise ValueError(f'{relative}: missing public reference {ref}')
    for name in ('medical-card.js', 'wallet-config.js', 'mycard.js', 'features.js', 'features.css', 'privacy.html', 'sw.js', 'mydog/index.html', 'games/index.html', 'games/not-the-vacuum/index.html', 'games/not-the-vacuum/privacy/index.html', 'app-ads.txt'):
        if not (site / name).is_file():
            raise ValueError(f'Missing release file: {name}')
    if (site / 'app-ads.txt').read_bytes() != b'google.com, pub-6262324542700705, DIRECT, f08c47fec0942fa0\n':
        raise ValueError('Unexpected app-ads.txt content or encoding')
    game_assets = json.loads((ROOT/'tools/game-assets.json').read_text(encoding='utf-8'))
    for asset in [game_assets['icon']] + game_assets['screenshots']:
        raw = (site/asset['path'].lstrip('/')).read_bytes()
        if len(raw)!=asset['bytes'] or hashlib.sha256(raw).hexdigest()!=asset['sha256']:
            raise ValueError(f'Game asset differs from approved source: {asset["path"]}')
    for name in ['games/index.html','games/not-the-vacuum/index.html']:
        source = (site/name).read_text(encoding='utf-8')
        if any(stale in source for stale in ['app-icon.png','원할 때만','only when']):
            raise ValueError(f'Stale game icon or advertising copy: {name}')
    if not (site/'pawlog/index.html').is_file() or (site/'tools/blog-admin.html').exists():
        raise ValueError('PawLog must be public and its editor must stay local')
    legacy=(site/'mycard/index.html').read_text(encoding='utf-8')
    if 'noindex,follow' not in legacy or 'https://pawtrip.us/mydog/' not in legacy:
        raise ValueError('Legacy My Card route must redirect to My Dog')
    policies = json.loads((ROOT / 'tools/game-policies.json').read_text(encoding='utf-8'))
    for record in policies['policies']:
        path = site / record['path']
        if not path.is_file():
            raise ValueError(f'Missing game policy: {record["path"]}')
        raw = path.read_bytes().replace(b'\r\n', b'\n')
        if hashlib.sha256(raw).hexdigest() != record['sha256_lf']:
            raise ValueError(f'Game policy differs from approved release: {record["path"]}')
        policy = raw.decode('utf-8')
        if 'id="ko"' not in policy or 'id="en"' not in policy or '<script' in policy.lower():
            raise ValueError('Game policies must retain both anchors and have no scripts')
    current = (site / 'games/not-the-vacuum/privacy/index.html').read_text(encoding='utf-8')
    archived = (site / 'games/not-the-vacuum/privacy/2026-10-12/index.html').read_text(encoding='utf-8')
    if current.count('href="./2026-10-12/"') != 2 or archived.count('href="../"') != 2:
        raise ValueError('Both languages must link between current and archived game policies')
    if "endpoint:''" not in (site / 'wallet-config.js').read_text(encoding='utf-8'):
        raise ValueError('This release keeps Apple Wallet disabled until real-device verification')
    if (site / 'CNAME').read_text(encoding='utf-8').strip() != 'pawtrip.us':
        raise ValueError('Unexpected custom domain')
    if json.loads((site / 'data.json').read_text(encoding='utf-8')) != json.loads((ROOT / 'data.json').read_text(encoding='utf-8')):
        raise ValueError('Rules do not match source data')
    print(f'Release check passed: {len(files)} public files; references valid; Wallet disabled; server excluded')


if __name__ == '__main__':
    check()
