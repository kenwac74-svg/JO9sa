from pathlib import Path
import ast, gzip, hashlib, json, shutil, subprocess

REPO = Path('G:/somi/JO9sa')
HUB = REPO / 'tools/modding-hub'
SOURCE = Path('G:/somi/Jack O Nine Tails v2.4_work/노예 상태 수치 공식표.html')
RECORD = REPO / 'records/status-formulas-db-20261118'
ASSET = 'data/slave-status-formulas.html'


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def replace_once(text, old, new):
    assert text.count(old) == 1, old
    return text.replace(old, new, 1)


originals = {name: (HUB / name).read_bytes() for name in (
    'server.py', 'integration.mjs', 'Start-Modding-Hub.ps1', 'README_KO.md')}
updated = {}
for name in ('server.py', 'Start-Modding-Hub.ps1'):
    raw = originals[name]
    text = raw.decode('utf-8-sig')
    text = replace_once(text, "'helper-dashboard.css',", "'helper-dashboard.css','" + ASSET + "',")
    if name == 'server.py':
        text = replace_once(text, "'helperDashboard':'/workspace/helper/'", "'helperDashboard':'/workspace/helper/','statusFormulas':'/workspace/status-formulas/'")
        text = replace_once(text, "   if route in ('/workspace/helper/', '/workspace/helper/index.html'):",
            "   if route in ('/workspace/status-formulas/', '/workspace/status-formulas/index.html'):\r\n"
            "    return self.blob((HERE/'" + ASSET + "').read_bytes(),'text/html; charset=utf-8')\r\n"
            "   if route in ('/workspace/helper/', '/workspace/helper/index.html'):")
        ast.parse(text)
    updated[name] = (b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'') + text.encode('utf-8')

text = originals['integration.mjs'].decode('utf-8')
text = replace_once(text, "['helperDashboard','웹 대시보드']]);", "['helperDashboard','웹 대시보드'],['statusFormulas','노예 상태 수치 공식표']]);")
updated['integration.mjs'] = text.encode('utf-8')
updated['README_KO.md'] = originals['README_KO.md'] + (
    '\r\n## 게임 DB · 노예 상태 수치 공식표\r\n\r\n'
    '게임 DB의 **노예 상태 수치 공식표**에서 제공된 HTML의 관계도·수치 공식·계산기를 연다. '
    '원본은 WORK 상위 폴더의 `노예 상태 수치 공식표.html`이며, 내용 수정 없이 '
    '`data/slave-status-formulas.html`에 보존하여 작업실에서 제공한다. '
    '원문 설명과 수식의 현재 QSP 일치 여부를 새로 검증한 것은 아니다. '
    '게임이나 세이브에 값을 반영하지 않는다.\r\n'
).encode('utf-8')
source_raw = SOURCE.read_bytes()
assert not (HUB / ASSET).exists(), 'Existing asset preserved; review first'
assert not RECORD.exists(), 'Existing record preserved; review first'
RECORD.mkdir(parents=True)
for name, raw in originals.items():
    (RECORD / (name + '.before.gz')).write_bytes(gzip.compress(raw, mtime=0))
for name, raw in updated.items():
    assert (HUB / name).read_bytes() == originals[name], 'Source changed during preparation'
    (HUB / name).write_bytes(raw)
(HUB / ASSET).parent.mkdir(parents=True, exist_ok=True)
(HUB / ASSET).write_bytes(source_raw)
assert sha(SOURCE.read_bytes()) == sha((HUB / ASSET).read_bytes())
manifest = {'date': '2026-11-18', 'source': str(SOURCE), 'sourceSha256': sha(source_raw),
    'unchangedHtml': True, 'files': [
        {'path': str(HUB / name), 'beforeSha256': sha(originals[name]), 'sha256': sha(raw)}
        for name, raw in updated.items()
    ] + [{'path': str(HUB / ASSET), 'sha256': sha(source_raw)}],
    'gameOrSavesModified': False, 'commitOrPush': False}
(RECORD / 'applied.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
shutil.copyfile(__file__, RECORD / 'apply.py')
report = '''# ゲーム DB: ノ예 상태 수치 공식표 — 2026-11-18

사용자 제공 HTML을 통합 모딩툴의 게임 DB 하위 버튼으로 추가했다. 원본의 수식·설명·관계도·계산기·글꼴·색상·레이아웃·스크립트는 수정하지 않았다.

경로: 게임 DB → 노예 상태 수치 공식표. 제공 주소는 `/workspace/status-formulas/`이며 별도 창 열기도 기존 동작을 사용한다. 원문은 WORK 상위 HTML이고, Git으로 유지할 수 있도록 모딩툴의 `data/slave-status-formulas.html`에 동일한 바이트를 복사했다. 원본 파일은 유지한다. 이후 원본만 고치면 도구 사본은 자동 갱신되지 않으므로 사본도 함께 갱신해야 한다.

`integration.mjs`가 탭을 생성하고 `server.py`가 설정 URL과 HTML을 제공한다. Python·PowerShell 버전 계산 목록에 HTML을 함께 포함했다. 이 연결은 게임 QSP나 세이브 수치에 쓰지 않으며, 원문의 수식이 현재 WORK와 일치하는지 새로 조사한 작업도 아니다. 제거 시 탭·설정·서버 경로·두 버전 목록과 해당 HTML을 함께 제거한다.

최소 복구본과 적용 해시는 이 폴더에 보관한다. 커밋·푸시는 하지 않았다.
'''.replace('ゲーム DB', '게임 DB').replace('ノ예', '노예')
(RECORD / 'REPORT_KO.md').write_text(report, encoding='utf-8')
subprocess.run(['node', '--check', str(HUB / 'integration.mjs')], check=True)
print(json.dumps({'status': 'installed', 'sourceBytes': len(source_raw), 'htmlSha256': sha(source_raw), 'record': str(RECORD)}, ensure_ascii=False))
