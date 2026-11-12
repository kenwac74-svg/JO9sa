# 통합 캐릭터 편집기(dist + 로컬 서버 + 이미지 도구 백엔드)를 한 파일에 담은 단독 실행기(.py)를 만드는 빌드 스크립트
# 사용: python3 build-standalone.py <출력 파일> [빌드 표시]
import base64
import io
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
DIST = HERE / 'dist'
IMAGE_TOOL = HERE.parent / 'character-image-adder'
BACKEND = ['add_character.py', 'align_core.py', 'tool_log.py']

TEMPLATE = '''# JO9 통합 캐릭터 편집기 단독 실행기: 편집기·로컬 서버·이미지 도구 백엔드를 이 파일 안에 담아 두고, 임시 폴더에 풀어 이 PC 안에서만 보이는 서버로 연다
# 실행: 파이썬 3.8 이상에서 이 파일을 더블클릭하거나 `python JO9_character_studio.py [--game 게임폴더]`
# 게임 파일 기능(외형·JSON·대사집·QSP)에는 Pillow가 필요하다(python -m pip install pillow). 없어도 시뮬레이터는 쓸 수 있다.
# 게임 폴더 설정은 이 파일 옆 studio.local.json 에 남는다.
import argparse, base64, io, os, socket, sys, tempfile, threading, webbrowser, zipfile
from pathlib import Path

BUILD = {build!r}
PAYLOAD = {payload!r}


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
    parser = argparse.ArgumentParser(description='JO9 통합 캐릭터 편집기')
    parser.add_argument('--game', help='게임 폴더(content/pic/girls/full 과 json/slaves 가 있는 game 폴더)')
    parser.add_argument('--repo', help='JO9sa repo 폴더(QSP 대사 mod를 repo mods/에 저장할 때)')
    args = parser.parse_args()
    root = Path(tempfile.mkdtemp(prefix='jo9-studio-'))
    zipfile.ZipFile(io.BytesIO(base64.b64decode(PAYLOAD))).extractall(root)
    (root / 'lab' / 'dist' / 'build.txt').write_text(BUILD, encoding='utf-8')
    here = Path(__file__).resolve().parent
    os.environ['JO9_STUDIO_SETTINGS'] = str(here / 'studio.local.json')
    os.environ['JO9_IMAGE_TOOL'] = str(root / 'character-image-adder')
    if args.game:
        os.environ['JO9_GAME_ROOT'] = args.game
    if args.repo:
        os.environ['JO9_REPO_ROOT'] = args.repo
    elif (here / 'local.config.json').exists() or (here.parent / 'mods').is_dir():
        os.environ['JO9_REPO_ROOT'] = str(here if (here / 'mods').is_dir() else here.parent)
    sys.path.insert(0, str(root / 'lab'))
    import studio_server
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
    server = studio_server.make_server(port)
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    print('JO9 통합 캐릭터 편집기', BUILD)
    if studio_server.BACKEND_ERROR:
        print('주의:', studio_server.BACKEND_ERROR)
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
                z.write(f, 'lab/dist/' + f.relative_to(DIST).as_posix())
        z.write(HERE / 'studio_server.py', 'lab/studio_server.py')
        for name in BACKEND:
            z.write(IMAGE_TOOL / name, 'character-image-adder/' + name)
    payload = base64.b64encode(buf.getvalue()).decode('ascii')
    Path(out).write_text(TEMPLATE.format(build=build, payload=payload), encoding='utf-8')
    print(out, len(payload) // 1024, 'KB')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else '')
