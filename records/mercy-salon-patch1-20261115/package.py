import hashlib, json, re, zipfile
from pathlib import Path, PurePosixPath

R = Path('G:/somi/JO9sa')
D = R / 'records/mercy-salon-patch1-20261115'
T = Path('G:/Codex/tmp/mercy-salon-patch1-20261115')
OLD = Path('G:/somi/JO9_2.4.2_Release_20261115/JO9_2.4.2_UpdateOnly_20261115.zip')
OUT = Path('G:/somi/JO9_2.4.2_Patch1_20261115_r2')

def sha(data): return hashlib.sha256(data).hexdigest()
def load(p): return json.loads(p.read_text('utf-8-sig'))
def safe(n):
    p = PurePosixPath(n)
    return not p.is_absolute() and '..' not in p.parts and ':' not in n and '\\' not in n

proof = load(D / 'installed.json')
assert proof['targetedNativePass'] and proof['distributionTextExclusionUnchanged']
new_qsp = (T / 'distribution-after.qsp').read_bytes()
assert sha(new_qsp) == proof['afterDistribution']
old_bytes = OLD.read_bytes()
old_sha = sha(old_bytes)
assert old_sha == '410bf6c1f58453da5cd8ff1caa4401683f33b4389a5b456bbce6052d45e92ce1'
assert not OUT.exists(), 'Preserve prior output; choose another revision instead of overwriting.'
OUT.mkdir()
archive = OUT / 'JO9_2.4.2_Patch1_20261115_r2.zip'
new_readme = '''JO9 2.4.2 1차 패치 · 개정 2 (2026-11-15)

기존 2.4.2 풀버전용 1차 수정 패치입니다.
기존 1차 패치의 구성에 매력 계산 수정을 반영했습니다.
이번에는 패치 ZIP만 제공합니다. 풀버전 파일은 다시 만들지 않았습니다.

게임을 종료하고 ZIP의 game 폴더를 기존 설치 폴더에 합쳐 같은 파일을 덮어쓰세요.
game 안에 game을 한 겹 더 만들지 마세요. 기존 폴더·저장 파일은 삭제하지 마세요.
재실행 후 기존 세이브를 불러오면 수정된 매력이 적용됩니다. 새 게임·별도 호환기는 필요 없습니다.
2.4.1에 이 패치만 직접 적용하지 마세요. 2.4.2 본편이 필요합니다.

[추가 수정]
미용실 종합관리·머리 손질·단장, 의상·청결·활력·힘·기분이 매력에 다시 반영됩니다.
자비로운 평판은 기존 보정에 추가로 작용하고, 평판이 낮아지면 추가 보정도 감소합니다.

게임에서 확인: 미용실 관리 전후의 매력과 상태를 비교해 주세요.
등급이 이미 최고라면 관리 후 등급이 더 오르지는 않습니다.
상세: PATCH_NOTES_KO.html / 전체 2.4.2 안내: RELEASE_NOTES_KO.html
'''
rows = []
with zipfile.ZipFile(OLD) as source:
    old_manifest = json.loads(source.read('PATCH_MANIFEST_SHA256.json'))
    expected = {r['path']: r for r in old_manifest['files']}
    notes = source.read('PATCH_NOTES_KO.html').decode('utf-8-sig')
    notes = notes.replace('<title>JO9 2.4.2 수정분 패치 — 2026-11-15</title>', '<title>JO9 2.4.2 1차 패치 · 개정 2</title>')
    notes = notes.replace('<h1>JO9 2.4.2 수정분 패치</h1>', '<h1>JO9 2.4.2 1차 패치 · 개정 2</h1>')
    notes = notes.replace('앞선 긴급패치 수정도 포함합니다.', '1차 패치의 기존 구성과 아래 매력 수정을 함께 적용합니다.')
    needle = '<h2>개인실·화면·소리</h2>'
    assert needle in notes
    add = '<h2>추가 수정 · 미용실과 매력</h2><ul><li>종합관리·머리 손질·단장을 받아도 매력이 오르지 않던 문제를 수정했습니다.</li><li>의상·청결·활력·힘·기분에 따른 기존 매력 보정을 복원했습니다. 자비로운 평판은 추가 보정으로 적용됩니다.</li><li>기존 세이브를 다시 불러오면 반영됩니다. 이미 최고 등급이면 관리 후 등급이 더 오르지 않을 수 있습니다.</li></ul>'
    notes = notes.replace(needle, add + needle, 1)
    notes = re.sub(r'<p>새 풀버전은 검증된 이전 풀버전에.*?</p>', '<p>이번 개정본은 기존 2.4.2에 적용하는 1차 패치 ZIP입니다.</p>', notes, count=1)
    fullnotes = source.read('RELEASE_NOTES_KO.html').decode('utf-8-sig')
    old_text = '자비로운 평판이 주인공의 매력에 반영됩니다. 좋은 평판을 쌓으면 인상이 달라지지만, 다시 잃으면 그만큼 내려갈 수 있습니다.'
    assert old_text in fullnotes
    fullnotes = fullnotes.replace(old_text, '의상과 청결, 미용실 관리가 주인공의 인상에 영향을 줍니다. 여기에 자비로운 평판의 보정이 더해집니다. 좋은 평판을 쌓으면 인상이 좋아지고, 평판을 잃으면 그 추가 보정도 줄어듭니다.', 1)
    replacements = {'game/jack.qsp': new_qsp, 'README_KO.txt': new_readme.encode('utf-8-sig'), 'PATCH_NOTES_KO.html': notes.encode('utf-8'), 'RELEASE_NOTES_KO.html': fullnotes.encode('utf-8')}
    unchanged = 0
    with zipfile.ZipFile(archive, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as dest:
        for info in source.infolist():
            n = info.filename
            assert safe(n) and not info.is_dir(), n
            if n == 'PATCH_MANIFEST_SHA256.json': continue
            raw = source.read(info)  # CRC verified while reading the existing verified payload.
            assert n in expected and sha(raw) == expected[n]['sha256'], n
            if n not in replacements: unchanged += 1
            raw = replacements.get(n, raw)
            rows.append({'path': n, 'bytes': len(raw), 'sha256': sha(raw)})
            dest.writestr(n, raw)
        assert len(rows) == len(expected)
        assert not any(r['path'].lower().endswith(('.wav', '.mp3', '.ogg', '.sav')) for r in rows)
        manifest = dict(old_manifest)
        manifest.update(kind='2.4.2 Patch1 standalone revision 2', revision=2, workQspSha256=proof['afterWork'], distributionQspSha256=proof['afterDistribution'], sourcePatchSha256=old_sha, files=rows, fullRebuilt=False, targetedNativeAssertions=99, targetedNativePass=True)
        manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
        dest.writestr('PATCH_MANIFEST_SHA256.json', manifest_bytes)
        rows_with_manifest = rows + [{'path': 'PATCH_MANIFEST_SHA256.json', 'bytes': len(manifest_bytes), 'sha256': sha(manifest_bytes)}]
    (OUT / 'README_KO.txt').write_bytes(replacements['README_KO.txt'])
    (OUT / 'PATCH_NOTES_KO.html').write_bytes(replacements['PATCH_NOTES_KO.html'])

expected_final = {r['path']: r for r in rows_with_manifest}
seen = set()
with zipfile.ZipFile(archive) as z:
    for info in z.infolist():
        assert safe(info.filename) and info.filename.casefold() not in seen
        seen.add(info.filename.casefold())
        row = expected_final.pop(info.filename)
        raw = z.read(info)
        assert len(raw) == row['bytes'] and sha(raw) == row['sha256'], info.filename
    assert not expected_final
assert sha(OLD.read_bytes()) == old_sha
assert sha((Path('G:/somi/Jack O Nine Tails v2.4_work/game') / 'jack.qsp').read_bytes()) == proof['afterWork']
result = {'path': str(archive), 'bytes': archive.stat().st_size, 'sha256': sha(archive.read_bytes()), 'files': len(rows_with_manifest), 'runtimeFiles': len([r for r in rows if r['path'].startswith('game/')]), 'unchangedEntriesFromPatch1': unchanged, 'changedPayloadEntries': sorted(replacements), 'allEntryCRCAndSHA256': True, 'safePaths': True, 'oldPatchUnchanged': True, 'fullRebuilt': False, 'distributionQspSha256': proof['afterDistribution'], 'targetedNativeAssertions': 99, 'targetedNativePass': True, 'fullGameTestsRepeated': False, 'uploaded': False, 'committed': False}
(OUT / (archive.name + '.sha256')).write_text(result['sha256'] + '  ' + archive.name + '\n', 'ascii')
(OUT / 'PACKAGE_RESULT.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', 'utf-8')
(D / 'package-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', 'utf-8')
(D / 'package-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', 'utf-8')
print(json.dumps(result, ensure_ascii=False))
