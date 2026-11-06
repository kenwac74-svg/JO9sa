"""Build an immutable r4 and a QSP-only hotfix from r3; no game execution.

Run only after candidate.qsp has been approved and minimally checked. This script
does not install anything in WORK, Full, JO9O, or any save directory.
"""
from pathlib import Path, PurePosixPath
import copy
import hashlib
import json
import re
import zipfile

HERE = Path(__file__).resolve().parent
OLD = Path('G:/somi/JO9_2.4.1_Patch_20261105_r3')
OLD_ZIP = OLD / 'JO9_2.4.1_Patch_20261105_r3.zip'
DEST = Path('G:/somi/JO9_2.4.1_Patch_20261105_r4')
FULL_NAME = 'JO9_2.4.1_Patch_20261105_r4.zip'
HOTFIX_NAME = 'JO9_2.4.1_Donatien_Goals_Hotfix_20261105_r4.zip'
OLD_QSP_SHA = 'f9abbda0c5881886424709f68986398ff9527328213dfea4fc770eb4a02f2536'
RUNTIME_COUNT = 1966
QSP_NAME = 'game/jack.qsp'

KO_NOTE = (
    'r4 목표 목록 복귀 수정 — 2026-11-05\n'
    '후작 도나시앵 의뢰 상세에서 목표 목록으로 돌아가는 링크를 보완했습니다. '
    '거리에서 상세 화면을 닫았다 다시 열어도 목록으로 돌아갈 수 있게 했으며, '
    '이미 의뢰 설명이 저장된 기존 세이브에도 적용됩니다.\n'
    'r3 대비 게임 파일 변경은 game/jack.qsp 한 개이며 이미지·JSON은 같습니다. '
    'r4 추가분은 변경 위치·QSP 구조·해시·ZIP 구성을 간단히 확인합니다. '
    '전체 QA와 EXE 실행은 반복하지 않으며 실제 플레이는 사용자 확인 대기입니다. '
    '아래 기존 엔진 검사 기록은 r3까지의 내용입니다.\n'
)
EN_NOTE = (
    'r4 objectives return fix — November 5, 2026\n'
    "Added a return link from Marquis Donatien's request details to the objectives list. "
    'It also covers reopening the details while outside and existing saves that already store the request text.\n'
    'Compared with r3, game/jack.qsp is the only changed game file; images and JSON are unchanged. '
    'The r4 addition receives limited scope, QSP structure, hash, and ZIP checks. '
    'The full QA suite and game EXE are not rerun; user play-testing is pending. '
    'Earlier engine-check statements below describe validation through r3.\n'
)
TC_KO = f'''# r4 사용자 플레이 확인

대상: {FULL_NAME}
이미 r3를 적용했다면 {HOTFIX_NAME}의 game/jack.qsp만 덮어써도 됩니다.
일반 게임 EXE로 아래 두 가지만 확인해 주세요.

1. 거리에서 후작 도나시앵 의뢰를 수락한 상태로 주인공 → 목표 → 특별 고객 의뢰 상세를 엽니다. `뒤로`를 눌러 목표 목록으로 돌아가는지 확인합니다. 상세 화면을 닫았다 다시 연 뒤에도 같은 동작을 확인합니다.
2. 수정 전에 그 의뢰를 수락했던 기존 세이브를 집에서 불러옵니다. 주인공 → 목표 → 해당 의뢰 상세 → `뒤로`로 목표 목록에 돌아가는지 확인합니다. 의뢰를 다시 받을 필요는 없습니다.

현재 실제 EXE·기존 SAV의 화면/조작 확인은 사용자 확인 대기입니다. 전체 QA는 반복하지 않았습니다.
'''
HOTFIX_INSTALL = f'''잭 오 나인 테일즈 2.4.1 r4 — 후작 의뢰 목표 목록 복귀 수정

이 작은 ZIP은 2026-11-05 r3 추가 패치를 이미 적용한 게임용입니다.
r3를 아직 적용하지 않았다면 전체 {FULL_NAME}을 사용하세요.

1. 게임을 종료합니다.
2. 이 ZIP의 game 폴더를 기존 실행 파일 옆의 game 폴더와 합쳐 game/jack.qsp만 덮어씁니다.
3. 평소 게임 EXE로 실행합니다. 기존 세이브를 그대로 사용할 수 있습니다.

JSON·이미지·세이브 폴더를 삭제하거나 교체할 필요가 없습니다. 설치기 실행도 필요 없습니다.
거리 또는 집에서 주인공 → 목표 → 후작 의뢰 상세 → 뒤로가 목표 목록을 표시하는지 확인해 주세요.
'''


def sha(data):
    return hashlib.sha256(data).hexdigest()


def file_sha(path):
    with path.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def utf8_bom(value):
    return b'\xef\xbb\xbf' + value.encode('utf-8')


def write_new(path, data):
    with path.open('xb') as handle:
        handle.write(data)


def parse_qsp(raw):
    lines = raw.decode('utf-16le').split('\r\n')
    assert lines[0] == 'QSPGAME', 'Unexpected QSP header'
    decode = lambda text: ''.join(chr((ord(c) + 5) & 0xffff) for c in text)
    count, at, result = int(decode(lines[3])), 4, []
    for _ in range(count):
        name, description, body = [decode(lines[at + i]) for i in range(3)]
        action_count = int(decode(lines[at + 3]))
        actions = [tuple(decode(lines[at + 4 + j * 3 + i]) for i in range(3))
                   for j in range(action_count)]
        result.append((name, description, body, actions))
        at += 4 + action_count * 3
    assert at == len(lines) - 1 and lines[at] == '', 'Unexpected QSP structure'
    assert len({entry[0] for entry in result}) == count, 'Duplicate QSP locations'
    return result


def validate_names(names):
    assert len(names) == len(set(names)), 'Duplicate ZIP entries'
    for name in names:
        path = PurePosixPath(name)
        assert not path.is_absolute() and '\\' not in name and ':' not in name
        assert '..' not in path.parts and not name.endswith('/'), name


def html_note(raw, text):
    # Add the current-revision notice before inherited validation statements.
    import html
    value = raw.decode('utf-8')
    assert value.count('<main>') == 1
    paragraphs = text.strip().split('\n')
    section = '<section><h2>' + html.escape(paragraphs[0]) + '</h2>'
    section += ''.join('<p>' + html.escape(p) + '</p>' for p in paragraphs[1:])
    section += '</section>\n'
    return value.replace('<main>', '<main>\n' + section, 1).encode('utf-8')


def main():
    assert DEST.resolve() == (Path('G:/somi') / DEST.name).resolve()
    assert not DEST.exists(), 'r4 destination already exists; release outputs are immutable'
    assert not (HERE / 'r4-package.json').exists(), 'Local r4 report already exists'
    candidate = (HERE / 'candidate.qsp').read_bytes()
    candidate_hash = sha(candidate)
    assert candidate_hash != OLD_QSP_SHA, 'Candidate has no change'
    old_zip_hash = file_sha(OLD_ZIP)
    with zipfile.ZipFile(OLD_ZIP) as old:
        old_names = old.namelist()
        validate_names(old_names)
        assert len(old_names) == 1973
        runtime_names = [n for n in old_names if n.startswith('game/')]
        assert len(runtime_names) == RUNTIME_COUNT
        old_qsp = old.read(QSP_NAME)
        assert sha(old_qsp) == OLD_QSP_SHA, 'r3 QSP differs from approved starting point'
        before, after = parse_qsp(old_qsp), parse_qsp(candidate)
        assert [v[0] for v in before] == [v[0] for v in after]
        changed = [(a, b) for a, b in zip(before, after) if a != b]
        assert len(changed) == 1 and changed[0][0][0] == '$quest_list'
        assert changed[0][0][:2] == changed[0][1][:2]
        assert changed[0][0][3] == changed[0][1][3], 'Only $quest_list body may change'

        old_manifest = json.loads(old.read('PATCH_MANIFEST.json'))
        assert old_manifest['patchRevision'] == '2026-11-05-r3'
        assert len(old_manifest['files']) == RUNTIME_COUNT
        assert {f['path'] for f in old_manifest['files']} == set(runtime_names)
        manifest = copy.deepcopy(old_manifest)
        manifest['patchRevision'] = '2026-11-05-r4'
        qsp_entry = [f for f in manifest['files'] if f['path'] == QSP_NAME]
        assert len(qsp_entry) == 1 and qsp_entry[0]['sha256'] == OLD_QSP_SHA
        qsp_entry[0].update(bytes=len(candidate), sha256=candidate_hash)
        manifest_bytes = json_bytes(manifest)
        old_pin = sha(old.read('PATCH_MANIFEST.json'))
        new_pin = sha(manifest_bytes)
        helper = old.read('INSTALL_HELPER.ps1')
        pin_pattern = rb"(\$ExpectedManifestSha256\s*=\s*')([0-9a-f]{64})(')"
        pin_match = re.search(pin_pattern, helper)
        assert pin_match and pin_match.group(2).decode('ascii') == old_pin
        new_helper, pin_count = re.subn(
            pin_pattern, lambda m: m.group(1) + new_pin.encode('ascii') + m.group(3), helper)
        assert pin_count == 1
        assert new_helper.replace(new_pin.encode('ascii'), old_pin.encode('ascii'), 1) == helper

        extras = {QSP_NAME: candidate, 'PATCH_MANIFEST.json': manifest_bytes,
                  'INSTALL_HELPER.ps1': new_helper}
        for language, note in [('KO', KO_NOTE), ('EN', EN_NOTE)]:
            install_name = f'INSTALL_{language}.txt'
            install_text = old.read(install_name).decode('utf-8-sig')
            # English r3's inherited first line still says r2.
            install_text, replacements = re.subn(r'\br[23]\b', 'r4', install_text, count=1)
            assert replacements == 1
            extras[install_name] = utf8_bom(install_text)
            release_name = f'RELEASE_NOTES_{language}.html'
            extras[release_name] = html_note(old.read(release_name), note)

        # All input checks precede the first write. Refuse to reuse any output.
        DEST.mkdir(parents=False, exist_ok=False)
        archive = DEST / FULL_NAME
        with zipfile.ZipFile(archive, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as out:
            for info in old.infolist():
                data = extras[info.filename] if info.filename in extras else old.read(info)
                out.writestr(copy.copy(info), data, compress_type=info.compress_type, compresslevel=6)
        with zipfile.ZipFile(archive) as new:
            validate_names(new.namelist())
            assert new.namelist() == old_names
            unchanged_names = [n for n in old_names if n not in extras]
            for name in unchanged_names:
                a, b = old.getinfo(name), new.getinfo(name)
                assert (a.CRC, a.file_size) == (b.CRC, b.file_size), name
            for name, expected in extras.items():
                assert new.read(name) == expected, name
            runtime_changed = [n for n in runtime_names if
                               (old.getinfo(n).CRC, old.getinfo(n).file_size) !=
                               (new.getinfo(n).CRC, new.getinfo(n).file_size)]
            assert runtime_changed == [QSP_NAME]
            assert new.read('INSTALL.cmd') == old.read('INSTALL.cmd')

    hotfix = DEST / HOTFIX_NAME
    hotfix_install_bytes = utf8_bom(HOTFIX_INSTALL)
    with zipfile.ZipFile(hotfix, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as out:
        out.writestr(QSP_NAME, candidate)
        out.writestr('INSTALL_KO.txt', hotfix_install_bytes)
    with zipfile.ZipFile(hotfix) as check:
        assert check.namelist() == [QSP_NAME, 'INSTALL_KO.txt']
        assert sha(check.read(QSP_NAME)) == candidate_hash
        assert check.read('INSTALL_KO.txt') == hotfix_install_bytes

    for name in ['INSTALL_KO.txt', 'INSTALL_EN.txt', 'RELEASE_NOTES_KO.html', 'RELEASE_NOTES_EN.html']:
        write_new(DEST / name, extras[name])
    for language, note in [('KO', KO_NOTE), ('EN', EN_NOTE)]:
        name = f'FORUM_POST_{language}.txt'
        inherited = (OLD / name).read_text(encoding='utf-8-sig')
        write_new(DEST / name, utf8_bom(note + '\n' + inherited))
    for name in ['PLAYTEST_TC_KO.md', 'PLAYTEST_TC_KO.txt']:
        write_new(DEST / name, utf8_bom(TC_KO))
    write_new(DEST / 'HOTFIX_INSTALL_KO.txt', hotfix_install_bytes)
    full_hash, hotfix_hash = file_sha(archive), file_sha(hotfix)
    assert file_sha(OLD_ZIP) == old_zip_hash, 'Original r3 ZIP changed during packaging'
    checksums = f'{full_hash}  {FULL_NAME}\n{hotfix_hash}  {HOTFIX_NAME}\n'
    write_new(DEST / 'SHA256SUMS.txt', checksums.encode('ascii'))
    result = {
        'status': 'PASS_LIMITED_PACKAGE_CHECKS',
        'archive': str(archive), 'archiveBytes': archive.stat().st_size, 'archiveSHA256': full_hash,
        'hotfix': str(hotfix), 'hotfixBytes': hotfix.stat().st_size, 'hotfixSHA256': hotfix_hash,
        'runtimeFiles': RUNTIME_COUNT, 'fullZipEntries': len(old_names), 'hotfixZipEntries': 2,
        'runtimeChangedPaths': runtime_changed, 'qspSHA256': candidate_hash,
        'qspChangedLocation': '$quest_list', 'qspChangedField': 'body',
        'unchangedEntriesCrcAndSizeVerified': len(unchanged_names),
        'unchangedRuntimeFilesCrcAndSizeVerified': RUNTIME_COUNT - 1,
        'manifestSHA256': new_pin, 'installerHelperOnlyManifestPinChanged': True,
        'oldZipSHA256': old_zip_hash, 'oldZipPreserved': True,
        'fullQARepeated': False, 'gameEXEExecutions': 0, 'existingSaveEdits': 0,
        'manualPlayTests': 'pending user; two checks in PLAYTEST_TC_KO.txt',
    }
    write_new(DEST / 'PACKAGE_CHECK_R4.json', json_bytes(result))
    write_new(HERE / 'r4-package.json', json_bytes(result))
    qa_text = (
        '# r4 간단 확인 결과\n\n'
        f'게임 파일 {RUNTIME_COUNT:,}개 중 변경은 game/jack.qsp 한 개입니다. '
        'QSP는 $quest_list 본문 한 곳만 변경됐고 파일 구조를 확인했습니다. '
        '기존 ZIP과 같은 엔트리 구성을 유지했으며 나머지 파일의 CRC·크기를 대조했습니다. '
        '새 QSP와 변경된 패키지 메타데이터의 해시·바이트를 확인했습니다.\n\n'
        'INSTALL.cmd는 그대로이며 INSTALL_HELPER.ps1은 매니페스트 고정 해시만 바꿨습니다. '
        'r3 ZIP을 보존했습니다. WORK·Full·원본·세이브는 이 포장 스크립트가 수정하지 않습니다.\n\n'
        '전체 QA·설치기 회귀 검사·EXE 실행은 반복하지 않았습니다. '
        '기존 세이브와 실제 화면/조작은 사용자가 PLAYTEST_TC_KO.txt의 두 항목을 확인합니다.\n'
    )
    write_new(DEST / 'QA_RESULT_KO.md', utf8_bom(qa_text))
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
