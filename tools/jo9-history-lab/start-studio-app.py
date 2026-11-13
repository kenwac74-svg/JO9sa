# 통합 캐릭터 편집기를 브라우저 대신 전용 앱 창(pywebview)으로 여는 실행기: 내부 서버는 빈 포트에 숨겨 띄우고 창을 닫으면 함께 끈다
# 필요: python -m pip install pywebview (윈도우는 내장 Edge WebView2를 씀). 없으면 브라우저로 여는 start-history-lab.py 방식으로 대신 연다.
import socket
import sys
import threading
from pathlib import Path

from studio_server import make_server, BUILD_ID

HERE = Path(__file__).resolve().parent


APP_PORTS = range(7719, 7730)


def free_port():
    """앱 전용 고정 포트(7719)를 먼저 쓴다. 편집기 설정(브라우저 저장소)은 주소(포트)별로 남기 때문이다. 쓰이고 있으면 다음 번호."""
    for port in APP_PORTS:
        with socket.socket() as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    raise SystemExit('7719~7729 포트가 모두 사용 중입니다. 열려 있는 편집기 창을 닫고 다시 실행하세요.')


def main() -> None:
    try:
        import webview
    except ImportError:
        print('pywebview가 없어 브라우저로 엽니다. 앱 창으로 쓰려면: python -m pip install pywebview')
        import runpy
        runpy.run_path(str(HERE / 'start-history-lab.py'), run_name='__main__')
        return
    port = free_port()
    if port != APP_PORTS[0]:
        print(f'7719 포트가 사용 중이라 {port}로 엽니다. 이 경우 편집기 설정(산식 계수 등)이 7719 때와 따로 저장됩니다.')
    server = make_server(port)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    # 엑셀·JSON 내려받기를 허용하고, 블로그 등 바깥 링크는 기본 브라우저로 연다
    webview.settings['ALLOW_DOWNLOADS'] = True
    webview.settings['OPEN_EXTERNAL_LINKS_IN_BROWSER'] = True
    webview.create_window(f'JO9 통합 캐릭터 편집기 · {BUILD_ID}', f'http://127.0.0.1:{port}/', width=1500, height=950, min_size=(1000, 650))
    # 편집기 설정(산식 계수 등 브라우저 저장소)은 창을 닫아도 남도록 이 폴더에 둔다
    storage = HERE / '.app-data'
    storage.mkdir(exist_ok=True)
    try:
        webview.start(private_mode=False, storage_path=str(storage))
    finally:
        server.shutdown()


if __name__ == '__main__':
    sys.exit(main())
