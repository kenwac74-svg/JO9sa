"""Run the existing studio's pywebview launcher with the sidebar server adapter."""
import argparse
import importlib.util
import json
import os
import sys
from pathlib import Path

from server import build_id, create_server


def main():
    p = argparse.ArgumentParser()
    for name in ('studio', 'repo', 'urls', 'ready'):
        p.add_argument('--' + name, required=True)
    args = p.parse_args()
    studio = Path(args.studio).resolve()
    # The source launcher owns port selection, WebView2 storage and window lifecycle.
    # Keep it unmodified so its normal standalone entry point continues to work.
    sys.path.insert(0, str(studio))
    spec = importlib.util.spec_from_file_location('jo9_source_app', studio / 'start-studio-app.py')
    source = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(source)
    try:
        import webview  # noqa: F401
    except ImportError:
        raise SystemExit('전용 창에는 pywebview가 필요합니다: py -3 -m pip install pywebview')
    ready_path = Path(args.ready)
    servers = []

    def factory(port):
        server = create_server(studio, args.repo, args.urls, port)
        servers.append(server)
        state = {'app': 'jo9-modding-hub-app', 'pid': os.getpid(),
                 'url': f'http://127.0.0.1:{server.server_address[1]}/',
                 'build': build_id(), 'studioRoot': str(studio)}
        ready_path.write_text(json.dumps(state, ensure_ascii=False, indent=2), 'utf-8')
        print(json.dumps(state, ensure_ascii=False), flush=True)
        return server

    source.make_server = factory
    source.BUILD_ID = '통합 모드 작업실 · ' + build_id()
    try:
        source.main()
    finally:
        for server in servers:
            server.server_close()
        try:
            state = json.loads(ready_path.read_text('utf-8'))
            if state.get('pid') == os.getpid():
                ready_path.unlink()
        except (OSError, ValueError):
            pass


if __name__ == '__main__':
    main()
