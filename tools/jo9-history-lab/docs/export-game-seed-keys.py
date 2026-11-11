# 게임 qsp의 get_stock_seed가 실제로 읽는 캐릭터 JSON seed_ 키 목록을 뽑아 편집기 데이터로 저장한다
import hashlib, json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tools'))
from qsp_dump import read_locations  # noqa: E402


def main(qsp_path: str, out_path: str) -> None:
    raw = Path(qsp_path).read_bytes()
    locs = {l['name']: l['body'] for l in read_locations(raw)}
    body = locs['get_stock_seed']
    keys = sorted(set(re.findall(r'\bseed_([A-Za-z0-9_]+)\[', body)))
    out = {
        'source': 'get_stock_seed',
        'qsp': qsp_path.replace('\\', '/'),
        'qspSha256': hashlib.sha256(raw).hexdigest(),
        'note': '게임이 캐릭터 JSON에서 읽어 인물 값으로 옮기는 seed_ 키. 여기에 없는 키는 JSON에 써도 게임 인물 값에 반영되지 않는다.',
        'keys': keys,
    }
    Path(out_path).write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(len(keys), 'keys')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
