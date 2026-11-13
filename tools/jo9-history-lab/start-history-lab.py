# 통합 캐릭터 편집기(외형·서사·대사·설정·통계)를 이 PC 안에서만 보이는 로컬 서버로 띄우고 브라우저로 여는 실행기
import socket
import threading
import webbrowser
from studio_server import make_server

PORT = 7689
URL = f'http://127.0.0.1:{PORT}/'


def already_running() -> bool:
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', PORT)) == 0


def main() -> None:
    if already_running():
        webbrowser.open(URL)
        print('이미 실행 중인 편집기를 열었습니다:', URL)
        return
    server = make_server(PORT)
    threading.Timer(0.5, lambda: webbrowser.open(URL)).start()
    print('편집기를 열었습니다:', URL)
    print('끝내려면 이 창을 닫거나 Ctrl+C를 누르세요.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
