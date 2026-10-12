"""Check the static Pages artifact before upload; never inspect private inputs."""
import json
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
        if any(part in {'wallet-service', 'node_modules', 'tools', 'docs', '.git', 'certificates'} for part in relative.parts):
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
    for name in ('medical-card.js', 'wallet-config.js', 'mycard.js', 'features.js', 'features.css', 'privacy.html', 'sw.js', 'mycard/index.html'):
        if not (site / name).is_file():
            raise ValueError(f'Missing release file: {name}')
    if "endpoint:''" not in (site / 'wallet-config.js').read_text(encoding='utf-8'):
        raise ValueError('This release keeps Apple Wallet disabled until real-device verification')
    if (site / 'CNAME').read_text(encoding='utf-8').strip() != 'pawtrip.us':
        raise ValueError('Unexpected custom domain')
    if json.loads((site / 'data.json').read_text(encoding='utf-8')) != json.loads((ROOT / 'data.json').read_text(encoding='utf-8')):
        raise ValueError('Rules do not match source data')
    print(f'Release check passed: {len(files)} public files; references valid; Wallet disabled; server excluded')


if __name__ == '__main__':
    check()
