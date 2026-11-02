from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')
REPO = Path('G:/somi/JO9sa')
WORK = Path('G:/somi/Jack O Nine Tails v2.4_work')
FULL = Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full')
RECORD = REPO / 'records/release-source-sync-20261102'
RECORD.mkdir(parents=True, exist_ok=True)
expected_qsp = '6cc7066736cae7fc428d58f89fbf659f06ee6feae8c710d810ee67c99467d505'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


assert sha(WORK / 'game/jack.qsp') == expected_qsp
assert sha(FULL / 'game/jack.qsp') == expected_qsp
files = []
writes = []
unavailable = []


def mirror_file(source, destination, runtime_path):
    if not source.is_file():
        unavailable.append({'source': str(source), 'repositoryPath': destination.relative_to(REPO).as_posix()})
        return
    assert destination.resolve().is_relative_to(REPO.resolve())
    before = sha(destination) if destination.is_file() else None
    current = sha(source)
    if before != current:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        assert sha(destination) == current
        writes.append({'path': destination.relative_to(REPO).as_posix(), 'before': before, 'after': current})
    files.append({'runtimePath': runtime_path, 'repositoryPath': destination.relative_to(REPO).as_posix(),
                  'bytes': destination.stat().st_size, 'sha256': current})


mirror_file(WORK / 'game/jack.qsp', REPO / 'assets/runtime/2.4.1/jack.qsp', 'jack.qsp')
for folder, target, pattern in [
    ('css', 'assets/css-2.4', '*.css'),
    ('content/js', 'assets/content/js', '*.js'),
    ('json', 'assets/json', '*.json'),
]:
    for source in sorted((WORK / 'game' / folder).rglob(pattern)):
        rel = source.relative_to(WORK / 'game' / folder)
        mirror_file(source, REPO / target / rel, (Path(folder) / rel).as_posix())

# Only the repository's already-selected resource payloads; never import the whole game.
for source_copy in sorted((REPO / 'resources/new').rglob('*')):
    if source_copy.is_file():
        rel = source_copy.relative_to(REPO / 'resources/new')
        mirror_file(WORK / 'game' / rel, source_copy, rel.as_posix())
for source_copy in sorted((REPO / 'assets/content/pic').rglob('*')):
    if source_copy.is_file():
        rel = source_copy.relative_to(REPO / 'assets')
        mirror_file(WORK / 'game' / rel, source_copy, rel.as_posix())

# Completed 2.4.1 result scenes and event replacements referenced by release records.
for rel in [
    'content/pic/scene/catfdef1.png', 'content/pic/scene/catdef2.png',
    'content/pic/scene/others/erza_dead_after_1.png',
    'content/pic/scene/others/erza_dead_after_2.png',
    'content/pic/scene/isabella_meeting.png',
    'content/pic/bg/strazhnik.png',
]:
    src = WORK / 'game' / rel
    if src.is_file():
        mirror_file(src, REPO / 'resources/new' / rel, rel)

for name in ['JO9_2.4.1_업데이트안내.html', 'JO9_2.4.1_Update_Guide_EN.html']:
    mirror_file(WORK / name, REPO / 'docs/release/2026-11-01' / name, '../' + name)

unique = {row['repositoryPath']: row for row in files}
manifest = {'schema': 1, 'version': '2.4.1', 'snapshotDate': '2026-11-02',
            'source': str(WORK / 'game'), 'sourceQspSha256': expected_qsp,
            'qspSnapshot': 'assets/runtime/2.4.1/jack.qsp',
            'sourcePolicy': 'WORK source snapshots only; Full is not modified.',
            'resourcePolicy': 'Selected resources/new payloads plus complete external release inventory; no whole-game import.',
            'fullReleaseInventory': 'records/distribution-cleanup-20261102/BUILD_MANIFEST.json',
            'files': sorted(unique.values(), key=lambda row: row['repositoryPath']),
            'historicalRepositoryFilesMissingFromWork': unavailable}
(REPO / 'assets/runtime-source-2.4.1.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(RECORD / 'source-sync.json').write_text(json.dumps({'writes': writes, 'missing': unavailable, 'fileCount': len(unique)}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

attrs = REPO / '.gitattributes'
extra = '''\n# Exact 2.4.1 release source snapshots and standalone guides.\nassets/runtime/** -text\nassets/runtime-source-2.4.1.json -text\nassets/content/js/** -text\nassets/css-2.4/*.css -text\ndocs/release/2026-11-01/*.html -text\n'''
text = attrs.read_text(encoding='utf-8-sig')
if 'assets/runtime/** -text' not in text:
    attrs.write_text(text.rstrip() + '\n' + extra, encoding='utf-8')

(REPO / 'assets/runtime/2.4.1/README_KO.md').write_text('''# 2.4.1 배포 소스 스냅샷

- `jack.qsp`는 현재 WORK와 배포 완료본에 사용된 동일 바이트의 QSP다.
- SHA-256: `''' + expected_qsp + '''`
- 기존 `source/jack_2026-10-01.qsp`는 패치 전 비교 기준으로 보존한다.
- 최신 CSS·JSON·JS와 선별 이미지의 위치·해시는 `assets/runtime-source-2.4.1.json`에 기록한다.
- 과거 `mods/`는 변경 이력이며, 이 완성 QSP에 전부 다시 적용하면 안 된다.
- 전체 이미지팩과 게임 실행기는 Git 스냅샷이 아니다. 배포 파일 원장은 `records/distribution-cleanup-20261102/BUILD_MANIFEST.json`을 참고한다.
- 이번 동기화는 저장소로만 복사했다. WORK·배포 폴더·개인 세이브를 수정하지 않았다.
''', encoding='utf-8')

handoff = REPO / 'docs/SESSION_HANDOFF_INDEX.md'
text = handoff.read_text(encoding='utf-8-sig')
append = '''\n## 2026-11-02 — 2.4.1 배포 완료 내용 커밋·푸시

- 사용자는 미번역 과거 설명 보고 작업을 중단하고 2.4.1 배포까지의 변경을 커밋·푸시하도록 지시했다.
- 최신 실행 소스는 `assets/runtime/2.4.1/jack.qsp`, 파일별 원장은 `assets/runtime-source-2.4.1.json`이다.
- 최종 한영 안내서는 `docs/release/2026-11-01/`의 두 HTML이다.
- 배포/검사/이미지 교체 기록과 도구를 함께 보존하며, 개인 세이브·로컬 설정·재생성 진단 사본은 제외한다.
- 과거 설명 미번역 74 JSON·220 항목은 조사만 수행했고 번역·게임 반영은 하지 않았다. 해당 작업은 중단 상태다.
- WORK와 Kor_Full을 이 커밋 작업으로 변경하지 않는다. 전체 클라이언트/배포 ZIP은 Git에 넣지 않는다.
'''
if '2.4.1 배포 완료 내용 커밋·푸시' not in text:
    handoff.write_text(text.rstrip() + '\n' + append, encoding='utf-8')
assert sha(WORK / 'game/jack.qsp') == expected_qsp
assert sha(FULL / 'game/jack.qsp') == expected_qsp
print(json.dumps({'mirroredFiles': len(unique), 'changedRepositoryFiles': len(writes), 'missingHistoricalFiles': unavailable,
                  'qspSha256': expected_qsp}, ensure_ascii=False))
