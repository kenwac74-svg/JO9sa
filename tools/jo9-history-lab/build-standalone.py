# dist 폴더 전체를 한 파일에 담은 단독 실행기(.py)를 만드는 빌드 스크립트
# 사용: python3 build-standalone.py <출력 파일>
import base64
import io
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
DIST = HERE / 'dist'

TEMPLATE = '''# JO9 통계 편집기 단독 실행기: 편집기 파일을 이 파일 안에 담아 두고, 임시 폴더에 풀어 이 PC 안에서만 보이는 로컬 서버로 연다
# 실행: 파이썬 3.8 이상에서 이 파일을 더블클릭하거나 `python JO9_history_lab.py`
# 예전 실행기가 켜져 있어도 이 파일의 편집기를 빈 포트에 따로 띄우고, 브라우저 캐시를 쓰지 않게 한다.
import base64, functools, http.server, io, socket, tempfile, threading, webbrowser, zipfile
from pathlib import Path

BUILD = {build!r}
PAYLOAD = {payload!r}


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def log_message(self, *args):
        pass


def running_build(port):
    # 그 포트에 떠 있는 편집기의 빌드 표시(build.txt)를 읽는다. 편집기가 아니거나 예전 실행기면 None
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=0.5) as s:
            s.sendall(b'GET /build.txt HTTP/1.0\\r\\nHost: 127.0.0.1\\r\\n\\r\\n')
            data = b''
            while chunk := s.recv(4096):
                data += chunk
        head, _, body = data.partition(b'\\r\\n\\r\\n')
        return body.decode('utf-8').strip() if b' 200 ' in head.split(b'\\r\\n')[0] else None
    except OSError:
        return None


def in_use(port):
    with socket.socket() as s:
        return s.connect_ex(('127.0.0.1', port)) == 0


def free_port(start=7690, end=7790):
    for port in range(start, end):
        with socket.socket() as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    raise SystemExit('빈 포트를 찾지 못했습니다.')


def main():
    root = Path(tempfile.mkdtemp(prefix='jo9-history-lab-'))
    zipfile.ZipFile(io.BytesIO(base64.b64decode(PAYLOAD))).extractall(root)
    (root / 'build.txt').write_text(BUILD, encoding='utf-8')
    # 기본 포트 7689를 쓴다(브라우저 저장값이 포트별로 따로라서). 이미 같은 빌드가 떠 있으면 그 창을 연다.
    port = 7689
    if in_use(port):
        if running_build(port) == BUILD:
            webbrowser.open(f'http://127.0.0.1:{{port}}/')
            print('이미 실행 중인 같은 버전의 편집기를 열었습니다.')
            return
        port = free_port()
        print('주의: 예전 실행기 창이 아직 켜져 있습니다. 새 편집기를 다른 포트에 띄웁니다.')
        print('예전 창을 닫고 이 파일을 다시 실행하면 기본 포트에서 열리고, 그동안 이 브라우저에 저장한 값도 그대로 보입니다.')
    url = f'http://127.0.0.1:{{port}}/?v={{BUILD.split()[0] if BUILD else port}}'
    handler = functools.partial(NoCacheHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), handler)
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    print('JO9 통계 편집기', BUILD)
    print('편집기를 열었습니다:', url)
    print('끝내려면 이 창을 닫거나 Ctrl+C를 누르세요.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
'''


def main(out: str, build: str) -> None:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in sorted(DIST.rglob('*')):
            if f.is_file():
                z.write(f, f.relative_to(DIST).as_posix())
    payload = base64.b64encode(buf.getvalue()).decode('ascii')
    Path(out).write_text(TEMPLATE.format(build=build, payload=payload), encoding='utf-8')
    print(out, len(payload) // 1024, 'KB')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else '')
