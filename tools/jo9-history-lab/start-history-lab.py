# 통합 캐릭터 편집기(외형·서사·대사·설정·통계)를 이 PC 안에서만 보이는 로컬 서버로 띄우고 브라우저로 여는 실행기
# 같은 포트에 다른 버전(예전) 편집기가 떠 있으면 그것을 열지 않고 빈 포트에 이 버전을 띄운다
import socket
import threading
import urllib.request
import webbrowser
from studio_server import make_server, BUILD_ID

PORTS = range(7689, 7710)


def running_build(port):
    """그 포트에 떠 있는 편집기의 빌드 표시. 아무것도 없으면 None, 응답이 없거나 예전 편집기면 ''."""
    with socket.socket() as s:
        s.settimeout(0.5)
        if s.connect_ex(('127.0.0.1', port)) != 0:
            return None
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/build.txt', timeout=1) as r:
            return r.read().decode('utf-8', 'replace').strip() if r.status == 200 else ''
    except Exception:  # noqa: BLE001 - 예전 편집기는 build.txt가 없다
        return ''


def main() -> None:
    for port in PORTS:
        got = running_build(port)
        url = f'http://127.0.0.1:{port}/'
        if got == BUILD_ID:
            webbrowser.open(url)
            print('이미 실행 중인 같은 버전 편집기를 열었습니다:', url)
            return
        if got is None:
            break
        print(f'포트 {port}에는 다른 버전 편집기(또는 다른 프로그램)가 떠 있어 건너뜁니다. 예전 편집기 창은 닫아도 됩니다.')
    else:
        raise SystemExit('7689~7709 포트가 모두 사용 중입니다. 예전 편집기 창을 닫고 다시 실행하세요.')
    server = make_server(port)
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    print('편집기를 열었습니다:', url, '· 버전', BUILD_ID)
    print('끝내려면 이 창을 닫거나 Ctrl+C를 누르세요.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
