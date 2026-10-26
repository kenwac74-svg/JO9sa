from pathlib import Path
import hashlib, json, zipfile

root = Path('G:/Codex/tmp/jo9-asset-runtime-20261024')
record = Path('G:/somi/JO9sa/records/asset-event-ui-20261024/runtime-test')
manifest = json.loads((record / 'fixture-corrections.json').read_text(encoding='utf-8'))
dest = record / 'ASSET_TEST_SAVES_07_10_CORRECTED.zip'
assert not dest.exists()
with zipfile.ZipFile(dest, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for item in manifest['files']:
        source = root / 'corrected' / item['name']
        assert hashlib.sha256(source.read_bytes()).hexdigest() == item['correctedSha256']
        archive.write(source, item['name'])
    archive.writestr('교정내용.txt', '자산 처분 검사용 7~10번 세이브입니다. 게임 코드 패치가 아닙니다.\n시험 세이브 생성 과정에서 누락된 종료 함수와 해당 배열 인덱스만 복원했습니다.\n기존 원본 세이브는 자동으로 변경하지 않습니다. 금액·인물·진행 상태·헤더·CRC는 보존했습니다.\n')
    archive.writestr('manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2))
with zipfile.ZipFile(dest) as archive:
    assert archive.testzip() is None
    for item in manifest['files']:
        assert hashlib.sha256(archive.read(item['name'])).hexdigest() == item['correctedSha256']
(record / 'scripts' / 'pack.py').write_bytes(Path(__file__).read_bytes())
print(json.dumps({'zip':str(dest),'files':len(manifest['files']),'bytes':dest.stat().st_size,'verified':True}))
