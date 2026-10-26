import argparse
from pathlib import Path

from .server import serve

parser = argparse.ArgumentParser(description='이미지 폴더 비교·선택 로컬 서버')
parser.add_argument('--host', default='127.0.0.1')
parser.add_argument('--port', type=int, default=11332)
parser.add_argument('--data-dir', type=Path, default=Path('G:/somi/IMGMG/folder-review'))
args = parser.parse_args()
serve(args.host, args.port, args.data_dir)
