# 통계 편집기(초기값 시뮬레이터)를 이 PC 안에서만 보이는 로컬 서버로 띄우고 브라우저로 여는 실행기
import functools
import http.server
import socket
import threading
import webbrowser
from pathlib import Path

PORT = 7689
DIST = Path(__file__).resolve().parent / 'dist'
URL = f'http://127.0.0.1:{PORT}/'


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    # 편집기를 고친 뒤에도 브라우저가 예전 파일을 쓰지 않게 한다
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()


def already_running() -> bool:
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', PORT)) == 0


def main() -> None:
    if already_running():
        webbrowser.open(URL)
        print('이미 실행 중인 편집기를 열었습니다:', URL)
        return
    handler = functools.partial(NoCacheHandler, directory=str(DIST))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler)
    threading.Timer(0.5, lambda: webbrowser.open(URL)).start()
    print('편집기를 열었습니다:', URL)
    print('끝내려면 이 창을 닫거나 Ctrl+C를 누르세요.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
