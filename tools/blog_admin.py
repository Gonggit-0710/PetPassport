"""Loopback-only PawLog editor. Run: python tools/blog_admin.py"""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
import base64
import hashlib
import json
import mimetypes
import os
import re
import secrets
import shutil
import subprocess
import sys
import threading
import uuid
from blog_core import ROOT, POSTS, validate, posts, clean_html

STATE = ROOT / '.blog-admin'
TOKEN = secrets.token_urlsafe(32)
LOCK = threading.Lock()
PORT = 8767

def atomic(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
    os.replace(temporary,path)

class Handler(BaseHTTPRequestHandler):
    def trusted(self):
        return self.headers.get('Host') in {f'127.0.0.1:{PORT}',f'localhost:{PORT}'}
    def respond(self, value, status=200, mime='application/json; charset=utf-8'):
        data = json.dumps(value,ensure_ascii=False).encode() if mime.startswith('application/json') else value
        self.send_response(status)
        self.send_header('Content-Type',mime)
        self.send_header('Content-Length',str(len(data)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('X-Frame-Options','SAMEORIGIN')
        self.end_headers()
        self.wfile.write(data)
    def do_GET(self):
        if not self.trusted():
            return self.respond({'error':'잘못된 관리자 주소입니다.'},403)
        path = urlsplit(self.path).path
        if path in {'/','/admin/'}:
            page = (ROOT/'tools/blog-admin.html').read_text(encoding='utf-8').replace('__TOKEN__',TOKEN)
            return self.respond(page.encode(),mime='text/html; charset=utf-8')
        if path == '/api/posts':
            published = posts()
            for p in published:
                p['_version'] = hashlib.sha256((POSTS/(p['slug']+'.json')).read_bytes()).hexdigest()
            return self.respond({'posts':published,'drafts':[json.loads(f.read_text(encoding='utf-8')) for f in (STATE/'drafts').glob('*.json')]})
        public_media = {'/media/icon-192.png', '/media/logo-light.svg'}
        if path.startswith('/blog/') or path in public_media:
            target = (ROOT/path.lstrip('/')).resolve()
            allowed = (ROOT/'blog').resolve()
            if not target.is_relative_to(allowed) and path not in public_media:
                return self.respond({'error':'찾을 수 없습니다.'},404)
            if target.is_dir(): target /= 'index.html'
            if not target.is_file() and re.fullmatch(r'/blog/media/[a-f0-9]{32}\.(jpg|png|webp)',path):
                target = STATE/'uploads'/Path(path).name
            if target.is_file():
                return self.respond(target.read_bytes(),mime=(mimetypes.guess_type(target)[0] or 'application/octet-stream')+('; charset=utf-8' if target.suffix in {'.html','.css'} else ''))
        return self.respond({'error':'찾을 수 없습니다.'},404)
    def do_POST(self):
        origin = self.headers.get('Origin','')
        if not self.trusted() or origin not in {f'http://127.0.0.1:{PORT}',f'http://localhost:{PORT}'} or not secrets.compare_digest(self.headers.get('X-PawLog-Token',''),TOKEN):
            return self.respond({'error':'관리자 화면에서 다시 시도해 주세요.'},403)
        try:
            length = int(self.headers.get('Content-Length','0'))
            if length <= 0 or length > 16_000_000: raise ValueError('사진은 10MB 이하로 선택해 주세요.')
            data = json.loads(self.rfile.read(length))
            path = urlsplit(self.path).path
            with LOCK:
                if path == '/api/upload':
                    raw = base64.b64decode(data['data'],validate=True)
                    if not raw or len(raw)>10_000_000: raise ValueError('사진은 10MB 이하로 선택해 주세요.')
                    ext = 'png' if raw.startswith(b'\x89PNG\r\n\x1a\n') else 'jpg' if raw.startswith(b'\xff\xd8\xff') else 'webp' if raw[:4]==b'RIFF' and raw[8:12]==b'WEBP' else None
                    if not ext: raise ValueError('JPG·PNG·WebP 사진을 선택해 주세요.')
                    name = uuid.uuid4().hex+'.'+ext
                    target = STATE/'uploads'/name
                    target.parent.mkdir(parents=True,exist_ok=True)
                    target.write_bytes(raw)
                    return self.respond({'url':'/blog/media/'+name})
                if path == '/api/draft':
                    draft_id = data.get('draftId') or uuid.uuid4().hex
                    if not re.fullmatch('[a-f0-9]{32}',draft_id): raise ValueError('초안 번호 오류')
                    data['draftId'] = draft_id
                    data['post']['body'] = clean_html(data['post'].get('body',''))
                    atomic(STATE/'drafts'/(draft_id+'.json'),data)
                    return self.respond({'draftId':draft_id})
                if path == '/api/publish':
                    p = data['post']
                    original = data.get('original','')
                    if original and original != p.get('slug'): raise ValueError('기존 글의 주소는 바꿀 수 없습니다.')
                    # Validate first; only publish photos belonging to a valid article.
                    urls = re.findall(r'/blog/media/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)',p.get('body','')+' '+p.get('cover',''))
                    p = validate(p)
                    target = POSTS/(p['slug']+'.json')
                    if target.exists():
                        if original != p['slug']: raise ValueError('이미 사용 중인 글 주소입니다. 다른 주소를 입력해 주세요.')
                        version = hashlib.sha256(target.read_bytes()).hexdigest()
                        if data.get('version') != version: raise ValueError('다른 화면에서 글이 바뀌었습니다. 목록을 새로고침한 뒤 다시 열어 주세요.')
                    elif original: raise ValueError('수정할 글을 찾을 수 없습니다.')
                    for u in urls:
                        image = ROOT/u.lstrip('/')
                        upload = STATE/'uploads'/Path(u).name
                        if not image.is_file() and upload.is_file():
                            image.parent.mkdir(parents=True,exist_ok=True)
                            shutil.copy2(upload,image)
                    prior = target.read_bytes() if target.exists() else None
                    atomic(target,p)
                    result = subprocess.run([sys.executable,str(ROOT/'tools/build_pages.py')],cwd=ROOT,capture_output=True,text=True,encoding='utf-8')
                    if result.returncode:
                        if prior is None: target.unlink()
                        else: target.write_bytes(prior)
                        subprocess.run([sys.executable,str(ROOT/'tools/build_pages.py')],cwd=ROOT,capture_output=True)
                        raise ValueError('페이지 생성에 실패했습니다. 기존 글은 복원했습니다.')
                    draft = data.get('draftId','')
                    if re.fullmatch('[a-f0-9]{32}',draft): (STATE/'drafts'/(draft+'.json')).unlink(missing_ok=True)
                    return self.respond({'url':'/blog/'+p['slug']+'/','version':hashlib.sha256(target.read_bytes()).hexdigest(),'message':'홈페이지 파일에 게시했습니다. GitHub Desktop에서 변경 내용을 커밋하고 Push origin을 누르면 운영에 반영됩니다.'})
                return self.respond({'error':'지원하지 않는 작업입니다.'},404)
        except (ValueError,KeyError,TypeError) as e:
            self.respond({'error':str(e)},400)
        except Exception:
            self.respond({'error':'저장에 실패했습니다. 관리자 실행 창을 확인해 주세요.'},500)
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=8767)
    parser.add_argument('--open',action='store_true',help='Open the editor in your browser')
    options=parser.parse_args()
    PORT=options.port
    try:
        server=ThreadingHTTPServer(('127.0.0.1',PORT),Handler)
    except OSError:
        print(f'관리 화면이 이미 실행 중이거나 포트가 사용 중입니다: http://127.0.0.1:{PORT}/admin/',flush=True)
        if options.open:
            import webbrowser
            webbrowser.open(f'http://127.0.0.1:{PORT}/admin/')
        sys.exit(1)
    print(f'PawLog 관리 화면: http://127.0.0.1:{PORT}/admin/',flush=True)
    if options.open:
        import webbrowser
        webbrowser.open(f'http://127.0.0.1:{PORT}/admin/')
    server.serve_forever()
