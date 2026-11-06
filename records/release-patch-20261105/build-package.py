"""Build and verify a manual overlay ZIP from the frozen release manifest."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import re
import shutil
import zipfile
from collections import Counter
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
REPO = Path('G:/somi/JO9sa')
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
STAGE = Path('G:/Codex/tmp/jo9-patch-20261105/stage')
EXTRACTED = Path('G:/Codex/tmp/jo9-patch-20261105/extracted-check')
DEST = Path('G:/somi/JO9_2.4.1_Patch_20261105')
ZIP_NAME = 'JO9_2.4.1_Patch_20261105_Manual.zip'
RECORD = REPO / 'records/release-patch-20261105'


def sha_file(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()


def load(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def save(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def safe_rel(p):
    parts = PurePosixPath(p).parts
    assert p and not p.startswith('/') and '\\' not in p and ':' not in p
    assert all(x not in ('', '.', '..') for x in parts)


def simulate_json_overlay(inventory, cleanup):
    baseline = load(REPO / 'records/distribution-cleanup-20261102/BUILD_MANIFEST.json')
    existing = {f['path']: f['sha256'] for f in baseline['files']
                if f['path'].startswith('game/json/') and f['path'].lower().endswith('.json')}
    for f in inventory['files']:
        if f['kind'] == 'json':
            existing[f['path']] = f['sha256']
    for old in cleanup['files']:
        assert existing[old['replacementPath']] == old['replacementSha256']
        assert existing[old['path']] == old['expectedReleasedSha256']
        del existing[old['path']]
    current = {'game/' + p.relative_to(GAME).as_posix(): sha_file(p)
               for p in (GAME / 'json').rglob('*.json') if p.is_file()}
    assert existing == current, 'Baseline + patch + exact old-name cleanup differs from WORK JSON'
    ids = [int(re.match(r'0*(\d+)', PurePosixPath(p).name).group(1))
           for p in existing if p.startswith('game/json/slaves/') and re.match(r'0*(\d+)', PurePosixPath(p).name)]
    duplicates = {str(k): v for k, v in Counter(ids).items() if v > 1}
    assert not duplicates
    return {'status': 'PASS', 'allJsonPaths': len(existing), 'retiredOldNames': len(cleanup['files']),
            'numericCharacterDefinitions': len(ids), 'duplicateIds': duplicates,
            'resultEqualsCurrentWorkJsonPathsAndHashes': True}


def installation_text(cleanup):
    ko_lines = ['잭 오 나인 테일즈 2.4.1 추가 패치 — 2026-11-05', '',
        '기존 2.4.1 전체 게임에 적용하는 설치기 없는 덮어쓰기 패치입니다.',
        '이 ZIP만으로 게임을 처음부터 실행하는 전체 클라이언트는 아닙니다.', '',
        '1. 게임을 완전히 종료합니다.',
        '2. 압축 안의 game 폴더를 기존 게임 실행 파일(Jack-o-nine-tails.exe) 옆의 game 폴더와 합쳐 동일 파일을 덮어씁니다.',
        '   기존 game 폴더를 통째로 삭제하지 마세요. 세이브와 사용자 설정은 이 패치에 포함되지 않습니다.',
        '3. 아래 새 이름의 파일이 같은 폴더에 들어온 것을 확인한 뒤, 정확히 지정한 옛 JSON 25개만 수동으로 정리합니다.',
        '   위치: 기존 게임 폴더/game/json/slaves/',
        '   왼쪽의 옛 이름만 지웁니다. 오른쪽의 새 이름이나 같은 번호로 시작하는 다른 파일은 지우지 마세요.',
        '   옛 이름이 없으면 해당 항목은 건너뜁니다. 직접 수정한 옛 JSON은 정리 전에 게임 밖에 보관하세요.', '']
    en_lines = ["Jack-O'-Nine-Tails Korean edition — 2.4.1 additional patch, 2026-11-05", '',
        'This is a manual overlay patch for an existing complete 2.4.1 installation.',
        'It does not contain the complete standalone game. English release notes do not turn the Korean game into an English localization.', '',
        '1. Close the game completely.',
        '2. Merge the game folder from this ZIP into the game folder beside your existing Jack-o-nine-tails.exe. Replace matching files.',
        '   Do not delete your entire game folder. Saved games and personal settings are not included in this patch.',
        '3. Confirm that the replacement files on the right are present in the same folder, then manually remove only the exact 25 old JSON filenames on the left.',
        '   Location: your installation/game/json/slaves/',
        '   Do not remove the replacement names or other files sharing the same numeric prefix.',
        '   Skip old names that are already absent. If you customized an old JSON, keep it outside the game before retiring it.', '']
    for f in cleanup['files']:
        pair = PurePosixPath(f['path']).name + '  ->  ' + PurePosixPath(f['replacementPath']).name
        ko_lines.append(pair)
        en_lines.append(pair)
    ko_lines += ['', '이 정리는 캐릭터 삭제가 아니라 같은 ID의 옛 파일명과 새 파일명이 함께 남는 것을 막는 절차입니다.',
        '4. 기존 게임 EXE로 실행해 저장을 불러옵니다. 별도 설치기나 CMD 실행은 필요하지 않습니다.', '',
        '주요 변경: RELEASE_NOTES_KO.html / English notes: RELEASE_NOTES_EN.html',
        'QSP·JSON·이미지 파일을 함께 적용하세요. QSP만 교체하면 이번 이미지 연결과 신규 등록이 누락됩니다.',
        '최종 QSP의 실제 엔진 주요9경로 및 패키지 파일 무결성을 자동 검사했습니다.',
        '모든 기존 저장·이벤트·실제 화면을 전부 확인한 것은 아닙니다. 이상이 있으면 발생 메뉴, 직전 행동, 저장 정보를 함께 제보해 주세요.']
    en_lines += ['', 'This retires duplicate old filenames for the same character IDs; it does not remove the characters.',
        '4. Launch the existing game EXE and load your save. No installer or CMD launcher is required.', '',
        'Release notes: RELEASE_NOTES_EN.html / Korean notes: RELEASE_NOTES_KO.html',
        'Apply the QSP, JSON and image files together. Updating only the QSP omits required image links and character definitions.',
        'The final QSP passed nine automated native-engine routes, and package file integrity was checked.',
        'Every existing save, event and visual state has not been manually played through. Report the menu, preceding action and save details if a problem occurs.']
    return '\n'.join(ko_lines) + '\n', '\n'.join(en_lines) + '\n'


def main():
    inventory = load(HERE / 'inventory/package-runtime.json')
    cleanup = load(HERE / 'inventory/cleanup-legacy-json.json')
    assert len(inventory['files']) == 942 and len(cleanup['files']) == 25
    qa = load(HERE / 'qa-game/release-report.json')
    staged_json = load(HERE / 'qa-game/stage-json-verification.json')
    assert qa['verdict'] == 'PASS'
    assert len(qa['client']['probes']) == 9 and all(p['pass'] for p in qa['client']['probes'])
    assert staged_json['stagedJsonExactWorkMatch'] and staged_json['stagedJsonFiles'] == 134
    overlay = simulate_json_overlay(inventory, cleanup)
    save(HERE / 'json-overlay-verification.json', overlay)
    for f in inventory['files']:
        safe_rel(f['path'])
        assert sha_file(STAGE / f['path']) == f['sha256']
        assert sha_file(GAME / f['runtimePath']) == f['sha256'], 'WORK changed: ' + f['path']
    ko, en = installation_text(cleanup)
    for name, text in [('INSTALL_KO.txt', ko), ('INSTALL_EN.txt', en)]:
        (STAGE / name).write_text(text, encoding='utf-8-sig')
    for lang in ['KO', 'EN']:
        f = HERE / f'notes/RELEASE_NOTES_{lang}.html'
        assert f.exists()
        text = f.read_text(encoding='utf-8')
        assert '<html' in text and 'data:image/' in text
        assert not re.search(r'(?:src|href)=["\']https?://', text, re.I)
        shutil.copyfile(f, STAGE / f.name)
    expected = {f['path']: f for f in inventory['files']}
    for n in ['INSTALL_KO.txt', 'INSTALL_EN.txt', 'RELEASE_NOTES_KO.html', 'RELEASE_NOTES_EN.html']:
        f = STAGE / n
        expected[n] = {'path': n, 'bytes': f.stat().st_size, 'sha256': sha_file(f), 'kind': 'documentation'}
    all_stage = {f.relative_to(STAGE).as_posix() for f in STAGE.rglob('*') if f.is_file()}
    assert all_stage == set(expected)
    assert not any(re.search(r'\.(?:sav|bak|ps1|cmd|bat|exe)$', p, re.I) for p in all_stage)
    assert not any('/modtools/' in p or '/__JO9_ImageBackups/' in p for p in all_stage)
    DEST.mkdir(parents=True, exist_ok=True)
    archive_path = DEST / ZIP_NAME
    assert not archive_path.exists(), 'Do not overwrite an existing release ZIP'
    with zipfile.ZipFile(archive_path, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as z:
        for rel in sorted(expected):
            z.write(STAGE / rel, rel)
    EXTRACTED.mkdir(parents=True, exist_ok=True)
    assert not any(EXTRACTED.iterdir()), 'Extraction check directory must be empty'
    checked = []
    with zipfile.ZipFile(archive_path) as z:
        names = z.namelist()
        assert len(names) == len(set(names)) == len(expected)
        assert set(names) == set(expected)
        for name in names:
            safe_rel(name)
            out = EXTRACTED / name
            out.parent.mkdir(parents=True, exist_ok=True)
            h = hashlib.sha256()
            count = 0
            with z.open(name) as src, out.open('xb') as target:
                for b in iter(lambda: src.read(1024 * 1024), b''):
                    h.update(b)
                    target.write(b)
                    count += len(b)
            assert count == expected[name]['bytes']
            assert h.hexdigest() == expected[name]['sha256']
            assert sha_file(out) == expected[name]['sha256']
            checked.append(name)
    copied_docs = []
    for n in ['RELEASE_NOTES_KO.html', 'RELEASE_NOTES_EN.html', 'INSTALL_KO.txt', 'INSTALL_EN.txt']:
        shutil.copyfile(STAGE / n, DEST / n)
        copied_docs.append(n)
    for n in ['FORUM_POST_KO.txt', 'FORUM_POST_EN.txt']:
        shutil.copyfile(HERE / 'notes' / n, DEST / n)
        copied_docs.append(n)
    qa_lines = ['일반 게임 EXE에서 확인할 항목 — 2.4.1 추가 패치 2026-11-05', '',
        '1. 기존 세이브 불러오기: 집·도시 이동과 창고4열, 연금실2열 표시.',
        '2. 행동력: 부상/추가 보너스 없는 지구력2 노예·조수에서 보통3칸→하드2칸. 보통 복귀 시 무료 충전되지 않는지.',
        '3. 판매: 하드6,000은세금300/실수령5,700,10,000은세금1,000/실수령9,000. 쉬움·보통은무과세. 위탁금 중복 공제 여부.',
        '4. 안내: S+ 부족 조건, 콜로세움 갑옷 조건, 세력 영향력 치트 진입·복귀.',
        '5. 그림: 펠리시티 기본/하녀/도미나/비서의 크기·머리높이, 루미너스 의복 영입, 이사벨라/2323 구분, 없는 복장 그림의 기본 전신 대체.', '',
        '위 항목은 화면·플레이 체감을 사람이 확인할 대상입니다. 자동검사 통과로 수동 확인 완료를 뜻하지 않습니다.']
    (DEST / 'PLAYTEST_KO.txt').write_text('\n'.join(qa_lines) + '\n', encoding='utf-8-sig')
    checksum = sha_file(archive_path)
    (DEST / 'SHA256SUMS.txt').write_text(checksum + '  ' + ZIP_NAME + '\n', encoding='ascii')
    result = {'status': 'PASS', 'createdUTC': datetime.now(timezone.utc).isoformat(),
        'archive': str(archive_path), 'archiveBytes': archive_path.stat().st_size, 'archiveSha256': checksum,
        'totalZipFiles': len(expected), 'runtimeFiles': 942, 'imagePaths': 807, 'jsonFiles': 134, 'qspFiles': 1,
        'documentationFilesInZip': 4, 'uncompressedBytes': sum(f['bytes'] for f in expected.values()),
        'allArchivePathsSafe': True, 'allEntryCrcAndSha256Verified': True, 'allExtractedHashesVerified': True,
        'extractedQspMatchesNativeValidatedStage': sha_file(EXTRACTED / 'game/jack.qsp'),
        'workSourcesStillMatchInventory': True, 'jsonOverlay': overlay, 'fullModified': False,
        'installationMode': 'manual overlay on existing 2.4.1; exact25 old JSON filenames manually retired after replacement',
        'manualGameVisualTests': 'pending user', 'externalDocuments': copied_docs + ['PLAYTEST_KO.txt', 'SHA256SUMS.txt']}
    save(HERE / 'package-result.json', result)
    save(HERE / 'package-files.json', {'files': [expected[p] for p in sorted(expected)]})
    for name in ['json-overlay-verification.json', 'package-result.json', 'package-files.json', 'build-package.py']:
        target = RECORD / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(HERE / name, target)
    for f in (HERE / 'notes').iterdir():
        if f.is_file():
            target = RECORD / 'notes' / f.name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(f, target)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
