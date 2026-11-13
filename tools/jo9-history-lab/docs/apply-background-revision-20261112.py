"""Apply the authored prose revision without changing links, IDs or numeric settings."""
import argparse
import copy
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--backup', required=True, type=Path)
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
revision = json.loads((root / 'docs/background-revision-20261112.json').read_text())
before = json.loads(args.backup.read_text())
after = copy.deepcopy(before)
texts = after['config']['backgroundSettings']['texts']
report = ['# JO9 배경 명칭·회상 대사 개정본', '',
          '기준: 사용자가 제공한 2026-11-12 01:46:18 전체 설정 백업.', '',
          '세계 대사 40개, 출신 57개, 직업 64개를 개정했다. 이름은 노예상이 소개할 때 쓰는 분류명이며, 본문은 관계가 형성된 뒤 캐릭터가 주인에게 과거를 설명하는 대사다.', '',
          '정치·종교·신분·범죄 경력은 유지하고 현재의 구호·호통·독백형 감탄을 회상형 설명으로 다듬었다. 문장마다 안개나 현재 신세를 반복하지 않는다. 서로 다른 출신·직업을 이어 읽을 수 있도록 불필요한 가족관계와 연령 전제를 줄였다.', '',
          '수치·스킬·특성·배수·범위·연결·배척·연령 조건·캐릭터·보관함은 수정하지 않았다. 기존에 캐릭터에게 불러온 메모도 보존했다. 새 대사를 현재 메모에 적용하려면 편집기에서 해당 배경을 다시 불러온다.', '',
          '설정 JSON의 대사와 편집기 기본 목록의 명칭을 함께 개정한다. 내부 ID는 유지하며, 개정 JSON은 최신 편집기에서 불러온다. 게임 본체와 세이브에는 미반영이다.', '',
          '여학생·무용가 등 현재 카탈로그에 아직 없는 신규 직업은 이번 161개 개정에 임의로 추가하지 않았다. 별도 기획을 유지한다.', '']
rows = []
for filename in ['backgrounds.json', 'background-drafts.json']:
    path = root / 'dist/data' / filename
    data = json.loads(path.read_text())
    original = copy.deepcopy(data)
    for record in data['records']:
        kind, key = record['kind'], record['id']
        label, value = revision[kind][key]
        prose = value[record['variant'] - 1] if kind == 'world' else value
        old_label = record['label']
        record['label'] = label
        record['text'] = '{이름}\n' + prose
        text_key = f"{key}:{record['variant']}" if kind == 'world' else key
        texts[kind][text_key] = record['text']
        rows.append((kind, text_key, old_label, label, prose))
    for old, new in zip(original['records'], data['records']):
        assert {k: v for k, v in old.items() if k not in ['text', 'label']} == {k: v for k, v in new.items() if k not in ['text', 'label']}
    assert {k: v for k, v in original.items() if k != 'records'} == {k: v for k, v in data.items() if k != 'records'}
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

assert len(rows) == 161
check = copy.deepcopy(after)
check['config']['backgroundSettings']['texts'] = copy.deepcopy(before['config']['backgroundSettings']['texts'])
assert check == before, 'only background dialogue overrides may change in the uploaded backup'
for kind, title in [('world', '세계'), ('family', '출신'), ('occupation', '직업')]:
    selected = [row for row in rows if row[0] == kind]
    report += [f'## {title} — {len(selected)}개', '', '| 내부 ID | 기존 명칭 | 개정 명칭 |', '|---|---|---|']
    seen = set()
    for _, key, old, label, _ in selected:
        base_key = key.split(':')[0]
        if base_key not in seen:
            report.append(f'| `{base_key}` | {old} | {label} |')
            seen.add(base_key)
    report.append('')
    for _, key, _, label, prose in selected:
        report += [f'### {label} · `{key}`', '', prose, '']
args.output.mkdir(parents=True, exist_ok=True)
backup_path = args.output / args.backup.name
backup_path.write_text(json.dumps(after, ensure_ascii=False, indent=2) + '\n')
(args.output / 'JO9_배경명칭_전체대사_개정본_20261112.md').write_text('\n'.join(report))
print(json.dumps({'records': len(rows), 'settingsTextCounts': {k: len(v) for k, v in texts.items()}, 'onlyBackupChange': 'config.backgroundSettings.texts', 'output': str(backup_path)}, ensure_ascii=False))
