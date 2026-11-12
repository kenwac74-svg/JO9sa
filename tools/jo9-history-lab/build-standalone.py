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
import base64, functools, http.server, io, socket, tempfile, threading, webbrowser, zipfile
from pathlib import Path

BUILD = {build!r}
PORT = 7689
URL = f'http://127.0.0.1:{{PORT}}/'
PAYLOAD = {payload!r}


def already_running():
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', PORT)) == 0


def main():
    if already_running():
        webbrowser.open(URL)
        print('이미 실행 중인 편집기를 열었습니다:', URL)
        print('새 버전을 보려면 먼저 열려 있는 실행기 창을 닫고 다시 실행하세요.')
        return
    root = Path(tempfile.mkdtemp(prefix='jo9-history-lab-'))
    zipfile.ZipFile(io.BytesIO(base64.b64decode(PAYLOAD))).extractall(root)
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler)
    threading.Timer(0.5, lambda: webbrowser.open(URL)).start()
    print('JO9 통계 편집기', BUILD)
    print('편집기를 열었습니다:', URL)
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
