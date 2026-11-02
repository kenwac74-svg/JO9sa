import hashlib, json, shutil, sys
from datetime import datetime
from pathlib import Path
from PIL import Image

repo = Path('G:/somi/JO9sa')
game = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
record = repo / 'records' / ('character-1450-to-1447-' + stamp)
backup = Path('G:/somi/JO9_work_backups') / ('character_1450_to_1447_' + stamp)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
load = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
src = game / 'json/slaves/1450.json'
dst = game / 'json/slaves/1447.json'
index = game / 'json/slave_index.json'
new = load(src)
idx = load(index)
assert idx['young_last'] == 1450
assert new['fullimage'] == 'girls/full/1450_black_long_young'
mapping = {}
for key in ('fullimage', 'seed_ava', 'seed_ava_gray', 'seed_ava_clear'):
    old_value = new[key]
    new[key] = old_value.replace('1450_', '1447_')
    prefix = '' if old_value.startswith('content/') else 'content/pic/'
    mapping[prefix + old_value + '.png'] = prefix + new[key] + '.png'
for old, target in mapping.items():
    p, q = game / old, game / target
    assert p.is_file()
    assert not q.exists(), str(q)
    with Image.open(p) as im:
        im.verify()
protected = {str(p): sha(p) for p in game.glob('*.sav')}
protected[str(game / 'jack.qsp')] = sha(game / 'jack.qsp')
full_qsp = Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp')
protected[str(full_qsp)] = sha(full_qsp)
old_json = {p.relative_to(game).as_posix(): sha(p) for p in (game / 'json').rglob('*.json')}
record.mkdir(parents=True)
backup.mkdir(parents=True)
before = []
for p in (src, dst, index):
    rel = p.relative_to(game)
    q = backup / rel
    q.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, q)
    assert sha(p) == sha(q)
    before.append({'path': rel.as_posix(), 'sha256': sha(p)})
writes = []
for old, target in mapping.items():
    p = game / target
    p.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(game / old, p)
    assert sha(p) == sha(game / old)
    source = repo / 'resources/new' / target
    source.parent.mkdir(parents=True, exist_ok=True)
    assert not source.exists() or sha(source) == sha(p)
    shutil.copy2(p, source)
    writes.append({'path':target, 'source':source.relative_to(repo).as_posix(), 'sha256':sha(p)})
dst.write_text(json.dumps(new, ensure_ascii=False, indent=4) + '\n', encoding='utf-8')
index_bytes = index.read_bytes()
assert index_bytes.count(b'"young_last": 1450') == 1
index.write_bytes(index_bytes.replace(b'"young_last": 1450', b'"young_last": 1449'))
for p in (dst,index):
    source = repo / 'assets' / p.relative_to(game)
    source.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, source)
    writes.append({'path':p.relative_to(game).as_posix(), 'source':source.relative_to(repo).as_posix(), 'sha256':sha(p)})
assert src.resolve().is_relative_to(game.resolve()) and sha(src) == sha(backup / src.relative_to(game))
src.unlink()
assert load(dst) == new and load(index)['young_last'] == 1449
assert all(sha(Path(p)) == h for p,h in protected.items())
changed = {'json/slaves/1447.json','json/slaves/1450.json','json/slave_index.json'}
assert all(sha(game / p) == h for p,h in old_json.items() if p not in changed)
for key in ('fullimage','seed_ava','seed_ava_gray','seed_ava_clear'):
    value = new[key]
    rel = ('' if value.startswith('content/') else 'content/pic/') + value + '.png'
    assert (game / rel).is_file()
load(dst)
load(index)
result = {'status':'PASS','backup':str(backup),'before':before,'writes':writes,
          'retired':['json/slaves/1450.json'], 'preservedCompatibilityImages':list(mapping),
          'jsonFilesValidated':2,
          'protectedFilesUnchanged':len(protected), 'qspChanged':False,'savesChanged':False,
          'nativeGameplayTested':False}
(record / 'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copy2(Path(__file__),record / 'apply-and-verify.py')
manual = '''# 1450 → 1447 번호 변경

사용자 지시로 1450 외형 세트와 설정을 1447에 적용했다. 전신 1장과 얼굴 3장의 새 경로는 1447_black_long_young 계열이다. 1447은 기존 일반 생성 범위에 포함되며 young_last는 1450에서 1449로 복원했다. 별도 1450 JSON은 백업 후 제거했다.

1450 이미지와 기존 1447 금발 이미지는 과거 세이브의 저장 경로 보호를 위해 WORK에 유지했다. 기존 세이브의 인물 타입·외형 캐시를 자동 이관하지 않는다. 새로 생성된 1447부터 변경된 정의를 읽는다. QSP·세이브·Kor_Full은 변경하지 않았다. 게임 재시작 후 새 1447로 외형을 확인할 수 있다.

변경 JSON 구문, 새 이미지 4장의 PNG 검사와 원본 해시 일치, 정의의 이미지 참조, 나머지 JSON 보존과 보호 파일 해시를 확인한다. 실제 게임 플레이는 검사하지 않는다. 상세 경로와 복구용 백업은 result.json에 있다. 이 기록은 이전 인계서의 1447 새 세트 준비 대기 상태를 대체한다.
'''
(record / 'MANUAL_KO.md').write_text(manual,encoding='utf-8')
handoff = repo / 'docs/SESSION_HANDOFF_INDEX.md'
with handoff.open('a',encoding='utf-8') as f:
    f.write('\n\n## 2026-10-27: 1450 외형을 1447로 변경\n\n' +
            '[적용 결과](../records/' + record.name + '/MANUAL_KO.md). WORK와 추적 소스에 적용. QSP·세이브·Kor_Full 무변경. 이전 1447 새 세트 준비 대기 상태를 대체한다.\n')
print(json.dumps({'status':'PASS','record':str(record),'backup':str(backup),
                  'writes':len(writes),'jsonFilesValidated':result['jsonFilesValidated'],
                  'protectedFilesUnchanged':len(protected)}, ensure_ascii=False))
