"""Start or reuse this tool's server; never interact with game processes."""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
import webbrowser
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlsplit

from . import __version__

_children = []


@contextmanager
def process_lock(path: Path, wait=0):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('a+b') as stream:
        stream.seek(0, 2)
        if stream.tell() == 0:
            stream.write(b'0'); stream.flush()
        deadline = time.monotonic() + wait
        while True:
            try:
                stream.seek(0)
                if os.name == 'nt':
                    import msvcrt
                    msvcrt.locking(stream.fileno(), msvcrt.LK_NBLCK, 1)
                else:
                    import fcntl
                    fcntl.flock(stream.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except OSError:
                if time.monotonic() >= deadline:
                    raise RuntimeError('같은 저장 폴더의 서버가 이미 실행 중입니다.')
                time.sleep(.1)
        try:
            yield
        finally:
            stream.seek(0)
            if os.name == 'nt':
                import msvcrt
                msvcrt.locking(stream.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl
                fcntl.flock(stream.fileno(), fcntl.LOCK_UN)


def _identity(data_dir, expected_pid=None):
    try:
        info = json.loads((data_dir / 'server.json').read_text(encoding='utf-8'))
        parsed = urlsplit(info['url'])
        if parsed.scheme != 'http' or parsed.hostname != '127.0.0.1' or not parsed.port or parsed.username:
            return None
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(info['url'] + 'api/status', timeout=1) as response:
            actual = json.load(response)
        if (actual.get('app') == 'image-folder-review' and actual.get('version') == __version__
                and Path(actual['data_dir']).resolve() == data_dir
                and actual['pid'] == info['pid'] and (expected_pid is None or expected_pid == actual['pid'])):
            actual.pop('token', None)
            return actual
    except (OSError, ValueError, KeyError):
        pass
    return None


def ensure_server(data_dir: Path, port: int = 11332, timeout: float = 25) -> dict:
    data_dir = Path(data_dir).resolve()
    data_dir.mkdir(parents=True, exist_ok=True)
    with process_lock(data_dir / 'launch.lock', wait=15):
        current = _identity(data_dir)
        if current:
            return current
        source = Path(__file__).resolve().parent.parent
        with (data_dir / 'server.stdout.log').open('ab') as out, (data_dir / 'server.stderr.log').open('ab') as err:
            child = subprocess.Popen([sys.executable, '-X', 'utf8', '-m', 'folder_review', '--port', str(port), '--data-dir', str(data_dir)],
                                     cwd=source, stdin=subprocess.DEVNULL, stdout=out, stderr=err,
                                     creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        _children.append(child)
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            current = _identity(data_dir, expected_pid=child.pid)
            if current:
                return current
            if child.poll() is not None:
                log = (data_dir / 'server.stderr.log').read_text(encoding='utf-8', errors='replace')[-1800:]
                raise RuntimeError('서버를 시작하지 못했습니다. ' + log)
            time.sleep(.15)
        # Terminate only the child created by this call when startup never succeeds.
        child.terminate(); child.wait(timeout=5)
        raise TimeoutError('서버 시작 시간이 초과되었습니다. server.stderr.log를 확인해 주세요.')


def main():
    parser = argparse.ArgumentParser(description='이미지 폴더 비교 도구 실행')
    parser.add_argument('--data-dir', type=Path, default=Path('G:/somi/IMGMG/folder-review'))
    parser.add_argument('--port', type=int, default=11332)
    parser.add_argument('--no-open', action='store_true')
    args = parser.parse_args()
    info = ensure_server(args.data_dir, args.port)
    print(json.dumps(info, ensure_ascii=False), flush=True)
    if not args.no_open:
        webbrowser.open(info['url'])


if __name__ == '__main__':
    main()
