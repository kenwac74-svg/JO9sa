import gzip
import hashlib
import io
import json
import re
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

BASE = Path('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7')
WORK = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO = Path('G:/somi/JO9sa')
FULL = Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game')
RECORD = REPO / 'records/isabella-tavern-adoption-20261101'
BACKUP = Path('G:/somi/JO9_work_backups/isabella-tavern-adoption-20261101')
REL = 'content/pic/bg/isabella_meeting.png'
SOURCE = BASE / 'output/isabella-tavern-cutscene-20261031/isabella_tavern_review.png'
TARGET = WORK / REL
OLD = '95fac019cc48f9a04e7408a9d16276f37247ea48cd934536e40ba6f3c265f77a'
EXPECTED_SOURCE = '8e9977bfe221ad20316b660a6ded1809532d7622daaa56d7e5ded3391144cb32'
CATALOGS = [WORK / 'modtools/catalog/catalog_merge_vs_original.html', REPO / 'tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']
PATTERN = re.compile(r'(?:var|const|let) D\s*=\s*(\[.*?\]);(?:\r?\n|\s*(?:var|const|let) )', re.S)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def digest(p):
    return sha(p.read_bytes())

def rows(text):
    match = PATTERN.search(text)
    assert match
    return match, json.loads(match[1])

def js_check(text):
    scripts = re.findall(r'<script\b[^>]*>([\s\S]*?)</script>', text, re.I)
    code = "const vm=require('vm');const a=JSON.parse(require('fs').readFileSync(0,'utf8'));for(const s of a)if(s.trim())new vm.Script(s);console.log('PASS '+a.length);"
    result = subprocess.run(['node', '-e', code], input=json.dumps(scripts), text=True, capture_output=True)
    assert result.returncode == 0, result.stderr
    return result.stdout.strip()

assert not RECORD.exists(), 'Existing adoption record; inspect it before rerunning.'
assert not BACKUP.exists(), 'Existing recovery directory; do not overwrite.'
assert digest(TARGET) == OLD, 'WORK image changed since inspection.'
assert digest(SOURCE) == EXPECTED_SOURCE
protected = [WORK / 'jack.qsp', FULL / 'jack.qsp', FULL / REL, WORK / 'modtools/catalog/catalog_status.js', WORK / 'modtools/catalog/catalog_work_ids.json']
protected_before = {str(p): digest(p) for p in protected}
with Image.open(SOURCE) as im:
    im.load()
    assert im.size == (1448, 1086)
    # Both images have the same 4:3 composition; resize without cropping or redrawing.
    candidate = im.convert('RGB').resize((795, 596), Image.Resampling.LANCZOS)
    output = io.BytesIO()
    candidate.save(output, format='PNG', optimize=True)
    image_bytes = output.getvalue()
with Image.open(io.BytesIO(image_bytes)) as im:
    im.load()
    assert im.size == (795, 596) and im.mode == 'RGB'

edits = []
for p in CATALOGS:
    before = p.read_bytes()
    bom = before.startswith(b'\xef\xbb\xbf')
    text = before.decode('utf-8-sig')
    match, data = rows(text)
    found = [i for i, x in enumerate(data) if x[0].replace('\\', '/') == REL]
    assert len(found) == 1
    i = found[0]
    original = data[i].copy()
    assert original[1:] == ['o', 'orig', 793464, 793464, 795, 596, ''], original
    data[i][1:4] = ['r', 'etc', len(image_bytes)]
    updated = text[:match.start(1)] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + text[match.end(1):]
    check = js_check(updated)
    _, after_data = rows(updated)
    _, before_data = rows(text)
    assert len(data) == len(before_data)
    assert [j for j in range(len(data)) if before_data[j] != after_data[j]] == [i]
    encoded = (b'\xef\xbb\xbf' if bom else b'') + updated.encode('utf-8')
    edits.append({'path': p, 'before': before, 'after': encoded, 'rowBefore': original, 'rowAfter': data[i], 'scripts': check})

agent_path = REPO / 'AGENTS.md'
agent_before = agent_path.read_bytes()
clause = '\n27. 2026-11-01 사용자 확정: 시안이나 반영 대기 결과물을 제시한 뒤 사용자가 재작업·취소·보류 지시 없이 다음 작업 지시로 넘어가면 해당 결과물의 채택 승인으로 간주하고 기존 작업 범위에 반영한다. 명시적인 별도 승인 문구를 반복해서 요구하지 않는다. 재작업·취소·보류와 적용 대상의 개별 지시는 우선하며, 배포 폴더 동기화·배포물 제작·커밋·푸시의 별도 지시 기준은 유지한다.\n'
assert '2026-11-01 사용자 확정: 시안이나 반영 대기 결과물' not in agent_before.decode('utf-8-sig')
agent_after = agent_before + clause.encode('utf-8')

BACKUP.mkdir(parents=True)
RECORD.mkdir(parents=True)
(BACKUP / 'isabella_meeting.previous.png').write_bytes(TARGET.read_bytes())
for i, edit in enumerate(edits):
    with gzip.open(BACKUP / f'catalog-{i}.html.gz', 'wb') as stream:
        stream.write(edit['before'])
with gzip.open(BACKUP / 'AGENTS.md.gz', 'wb') as stream:
    stream.write(agent_before)
assert digest(BACKUP / 'isabella_meeting.previous.png') == OLD

assert digest(TARGET) == OLD
TARGET.write_bytes(image_bytes)
for edit in edits:
    assert digest(edit['path']) == sha(edit['before']), f'Concurrent catalog edit: {edit["path"]}'
    edit['path'].write_bytes(edit['after'])
assert digest(agent_path) == sha(agent_before)
agent_path.write_bytes(agent_after)
assert {str(p): digest(p) for p in protected} == protected_before
assert digest(SOURCE) == EXPECTED_SOURCE
assert digest(TARGET) == sha(image_bytes)
for edit in edits:
    assert edit['path'].read_bytes() == edit['after']
    js_check(edit['path'].read_text(encoding='utf-8-sig'))

http = {}
try:
    config = (WORK / 'modtools/catalog/catalog_workshop_config.js').read_text(encoding='utf-8-sig')
    token_match = re.search(r'"token"\s*:\s*"([^"]+)"', config)
    assert token_match, 'Token format not recognized'
    query = urllib.parse.urlencode({'t': token_match[1], 'original': '0', 'p': REL})
    with urllib.request.urlopen('http://127.0.0.1:3813/api/catalog-asset?' + query, timeout=20) as response:
        served = response.read()
        http = {'status': response.status, 'bytes': len(served), 'sha256': sha(served)}
    assert served == image_bytes
    with urllib.request.urlopen('http://127.0.0.1:3813/catalog?v=isabella_tavern_20261101', timeout=20) as response:
        _, served_rows = rows(response.read().decode('utf-8-sig'))
        assert [r for r in served_rows if r[0].replace('\\', '/') == REL] == [edits[0]['rowAfter']]
        http['catalogStatus'] = response.status
        http['catalogRowMatchesWork'] = True
except Exception as exc:
    http['error'] = str(exc)

record = {'id': 'ISABELLA_TAVERN_ADOPTION_20261101', 'source': str(SOURCE), 'sourceSha256': EXPECTED_SOURCE, 'target': str(TARGET), 'before': {'sha256': OLD, 'bytes': 793464}, 'after': {'sha256': sha(image_bytes), 'bytes': len(image_bytes), 'width': 795, 'height': 596, 'mode': 'RGB'}, 'resize': 'Pillow LANCZOS; no crop; no generated edits', 'backup': str(BACKUP), 'runtime': {'location': 'interaction_city', 'event': 610, 'place': 'isabella_meeting', 'background': REL}, 'catalogs': [{'path': str(e['path']), 'beforeSha256': sha(e['before']), 'afterSha256': sha(e['after']), 'rowBefore': e['rowBefore'], 'rowAfter': e['rowAfter'], 'inlineJavaScript': e['scripts']} for e in edits], 'protectedUnchanged': protected_before, 'http': http, 'gameplay': 'Not replayed; same runtime path, no QSP/save changes.'}
(RECORD / 'asset-change.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(RECORD / 'apply.py').write_bytes(Path(__file__).read_bytes())
report = '# 이사벨라 술집 컷신 반영\n\n사용자가 2026-11-01 정한 승인 기준에 따라 10월 31일 제작 후 시안으로 남아 있던 술집 컷신을 채택했다. 재작업·취소·보류 없이 다음 지시가 이어지면 결과물 채택 승인으로 간주하는 기준을 저장소 AGENTS.md 27번에 기록했다.\n\n실제 interaction_city 이벤트 610의 isabella_meeting 배경 경로인 content/pic/bg/isabella_meeting.png 한 개를 795×596 불투명 PNG로 교체했다. 생성 원본은 그대로 보존하고 확대·축소 외에 다시 그리거나 구도를 자르지 않았다. WORK·seed 이미지 목록은 bg-0609 한 행만 갱신했고 기존 ID와 체크 상태를 보존했다.\n\n원인: 이전 작업은 review-only 저장으로 끝났으며 별도의 영입 거래 화면 캐릭터만 교체되어 있었다. 이번에 술집의 실제 배경 파일을 반영했다. characters의 같은 이름 옛 그림은 이번 호출 경로가 아니므로 변경하지 않았다.\n\n검증: PNG 해독·크기·불투명 형식, 설치 후 해시, 두 목록에서 한 행만 변경, 인라인 JavaScript 문법을 확인했다. QSP·세이브 형식은 변경하지 않았고 배포본의 QSP와 해당 그림도 보호 해시가 동일했다. 실제 게임 내 페이지 재생은 하지 않았다. HTTP 결과와 이전/최종 해시 및 복구 경로는 asset-change.json에 기록했다.\n'
(RECORD / 'REPORT_KO.md').write_text(report, encoding='utf-8')
print(json.dumps({'status': 'APPLIED', 'target': str(TARGET), 'after': record['after'], 'catalogs': len(edits), 'http': http, 'protectedFilesUnchanged': len(protected), 'record': str(RECORD)}, ensure_ascii=False))
