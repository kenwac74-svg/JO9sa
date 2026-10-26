"""Whitelist-only manual overlay ZIP. Does not write either installed game."""
import argparse
import collections
import datetime as dt
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import zipfile

WORK = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
FULL = Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game')
REPO = Path('G:/somi/JO9sa')
BASE = Path('G:/somi/JO9_2.4_Release_20261019_Final/verified/JO9_2.4_Full')
RECORD = REPO / 'records/second-patch-zip-20261021'
SCRATCH = Path('G:/Codex/tmp/second-patch-zip-20261021')
OUT = Path('G:/somi/JO9_2.4_SecondPatch_20261021_Test')
ARCHIVE = OUT / 'JO9_2.4_SecondPatch_20261021_Cumulative_Test.zip'
QSP = '404b57f83893e6fc06ff69260b654de770de09a75c3709570c0eaa2d23411365'
CSS = '4b34d5f30002b01ea161535891131465b986dd3454428634141ad45fd9e60276'
BASE_MANIFEST = '0f0b66a9e2d9f90ba8bc348921884e2f6761822b766596a256277c1fe4959737'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda: f.read(2**20), b''):
            h.update(b)
    return h.hexdigest()


def load(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x', encoding='utf-8', newline='\n') as f:
        json.dump(value, f, ensure_ascii=False, indent=2)
        f.write('\n')


def safe_relative(value):
    p = PurePosixPath(value)
    assert not p.is_absolute() and '..' not in p.parts and '\\' not in value
    assert ':' not in value and value == str(p)
    return value


def no_reparse(path):
    resolved = path.resolve(strict=True)
    assert resolved == path.absolute(), f'Unexpected redirected path: {path}'
    for p in [path, *path.parents]:
        s = p.lstat()
        assert not stat.S_ISLNK(s.st_mode)
        assert not (getattr(s, 'st_file_attributes', 0) & 0x400), f'Reparse: {p}'


def protect():
    paths = [WORK/'jack.qsp', WORK/'css/base.css', FULL/'jack.qsp', FULL/'css/base.css',
             FULL/'config.xml', BASE/'BUILD_MANIFEST.json']
    paths += sorted((FULL/'save').glob('*.sav'))
    paths += sorted((WORK/'save').glob('*.sav'))
    return {str(p): digest(p) for p in paths if p.is_file()}


def build():
    assert not ARCHIVE.exists(), 'Do not overwrite an existing archive'
    RECORD.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    SCRATCH.mkdir(parents=True, exist_ok=True)
    no_reparse(WORK)
    no_reparse(OUT)
    before = protect()
    assert digest(WORK/'jack.qsp') == QSP
    assert digest(WORK/'css/base.css') == CSS
    assert digest(BASE/'BUILD_MANIFEST.json') == BASE_MANIFEST
    baseline = load(BASE/'BUILD_MANIFEST.json')
    bmap = {x['path'][5:]: x for x in baseline['files'] if x['path'].startswith('game/')}
    images = load(REPO/'records/image-history-refresh-20261021/PATCH_IMAGE_MANIFEST.json')
    deletes = load(REPO/'records/seed-namespace-fix-20261020/runtime-delta.json')['delete_runtime_files']
    assert len(deletes) == 25
    rows = []
    for r in images['files']:
        rel = safe_relative(r['path'])
        assert rel.startswith('content/pic/')
        assert bmap.get(rel, {}).get('sha256') != r['sha256']
        rows.append({'path': 'game/'+rel, 'bytes': r['bytes'], 'sha256': r['sha256'],
                     'kind': 'image', 'source': r['source'], 'imageClass': r['class']})
    assert len(rows) == 6917
    for top in ['json', 'css']:
        for p in sorted((WORK/top).rglob('*')):
            if not p.is_file() or p.suffix.lower() != ('.json' if top == 'json' else '.css'):
                continue
            rel = safe_relative(p.relative_to(WORK).as_posix())
            h = digest(p)
            if bmap.get(rel, {}).get('sha256') != h:
                if top == 'json':
                    load(p)
                rows.append({'path': 'game/'+rel, 'bytes': p.stat().st_size, 'sha256': h, 'kind': top})
    rows.append({'path': 'game/jack.qsp', 'bytes': (WORK/'jack.qsp').stat().st_size,
                 'sha256': QSP, 'kind': 'qsp'})
    assert collections.Counter(r['kind'] for r in rows) == {'image':6917, 'json':32, 'css':1, 'qsp':1}
    assert len({r['path'].casefold() for r in rows}) == len(rows)
    expected_missing = {d['file'] for d in deletes}
    actual_missing = {rel for rel in bmap if rel.startswith('json/') and not (WORK/rel).is_file()}
    assert actual_missing == expected_missing
    for d in deletes:
        assert not (WORK/d['file']).exists()
        assert bmap[d['file']]['sha256'] == d['only_if_sha256']
        assert digest(WORK/d['keep']) == d['keep_sha256']
    # This is a dependency-complete delta against published 2.4, not Work mirroring.
    for rel, r in bmap.items():
        if rel.startswith(('engine/', 'fonts/')) or rel in ['config.xml','icon.ico'] or (rel.startswith('content/') and not rel.startswith('content/pic/')):
            assert digest(WORK/rel) == r['sha256'], 'Unaccounted runtime change: '+rel

    delete_text = '2.4 알파 2차 누적 테스트 패치 - 수동 제거 목록\r\n\r\n'
    delete_text += 'ZIP 덮어쓰기만으로 아래 옛 도나 JSON은 없어지지 않습니다.\r\n'
    delete_text += '기존 게임의 아래 25개 파일만 제거하세요. 이미 없으면 건너뛰세요.\r\n'
    delete_text += '번호가 비슷한 원작 JSON이나 정상 8877~8901 파일은 지우지 마세요.\r\n'
    delete_text += '다른 모드가 같은 이름의 파일 내용을 바꾼 경우 함께 동봉한 해시 명세와 대조 후 판단하세요.\r\n\r\n'
    for d in deletes:
        delete_text += '삭제: game/'+d['file']+'\r\n유지: game/'+d['keep']+'\r\n\r\n'
    readme = '''잭오나 2.4 알파 2차 누적 패치 - 사용자 테스트용 (2026-10-21)

대상: 2.4 한국어판. 1차 패치/r2/r3의 수정도 포함하므로 이 ZIP 하나만 적용합니다.
설치기 없는 덮어쓰기 ZIP이며, 기본 게임 전체가 들어 있는 풀팩은 아닙니다.

적용 순서
1. 게임을 완전히 종료합니다.
2. ZIP 안의 game 폴더를 기존 게임 실행파일 옆의 game 폴더와 합칩니다.
   같은 이름의 파일은 덮어씁니다. 기존 game 폴더를 통째로 지우지 마세요.
   game/game처럼 한 단계 더 들어가지 않도록 확인하세요.
3. REMOVE_OLD_DONA_JSON_KO.txt에 적힌 옛 도나 JSON 25개만 직접 제거합니다.
   이미 없으면 건너뜁니다. 정상 8877~8901 및 원작 퀘스트 JSON은 보존합니다.
   이 단계가 없으면 에게야 보상 등 인물 충돌이 남습니다.
4. 게임을 새로 실행한 뒤 기존 세이브를 불러와 확인합니다.

포함
- 최신 QSP, CSS, 인디 외형/장면 의존 JSON 및 211.json 문법 수리.
- 2.4 이후 이미지 변경 6,917개 경로(개인 작업118 + 인디 통합6,799).
  그림 파일 경로 수이며 새 그림 종수나 오늘 작업량이 아닙니다.
- 구 이사벨라 일반 랜덤 인물 보존 및 새 이사벨라 외형/개인실 연결의 누적 수정.

세이브, 개인 설정, 편집 도구, 설치기/자동 정리 스크립트는 넣지 않았습니다.
개인 세이브와 기존 파일 중 변경 대상 외 파일은 그대로 유지합니다.
2.4에 이미 배포된 동일 이미지는 제외했습니다. 보류 중인 새 기획은 추가하지 않았습니다.

테스트할 부분
- 기존 세이브 로드, 노예/조수 포트레이트 교육(전투/마법 포함), 개인실 가정교사.
- 에게야 보상 인물과 도나 구매 인물의 이름/외형. 이미 잘못 받은 개체는 자동 교체하지 않습니다.
- 이사벨라의 개인실 외형과 인물 평가 대사의 화자/문장 연결.
- 장비 설명 마우스 오버, 신규 특성 편집 링크 색상, 임신 상태 아이콘.
- 개인실 증축 상한/공용업무 인계와 B컷 전환.

자동 검사는 대표 경로의 문법/실제 엔진 실행을 확인합니다.
모든 분기, 실제 세이브 선택 UI, 전체 화면 배치와 밸런스까지 보증하는 것은 아닙니다.

제작/출처: 2.4 한국어판 SAnk. 인디 리소스 PSP_PSP 및 기존 원작/팩 기여자.
원본 게임의 크레딧은 그대로 유지합니다. 상세 변경은 CHANGELOG_KO.md를 참고하세요.
'''
    changelog = '''# 2.4 알파 2차 누적 테스트 패치

- 에게야 보상 등 원작/도나 인물 번호 충돌 정리, 211.json 문법 오류 수정.
- 인물 설명의 조건 분기/빈 첫 목록, 개인실 2·3 표시와 일부 NPC 서식 수정.
- 장비 목록 설명 툴팁 복구, 개인실 직접 경로의 기존 최초 판정 연결 수리.
- 인물 평가 화자와 대상 구분, 상반된 평가가 자연스럽게 이어지도록 문장 연결 개선.
- 아르곤 원고에서 일반 대사·NPC·도시 설명을 선별 개선. 수치·조건은 유지.
- 신규 특성 편집기 링크 가독성 개선.
- PSP_PSP 인디 리소스 업데이트: 이사벨라 등 외형 교체와 관련 JSON, 장면 추가.
  구 이사벨라 그림은 일반 랜덤 인물로 보존. 개인 작업 이미지와 B컷 포함.

1차 누적 패치 수정도 포함합니다: 개인실 증축/외형/가정교사 배치,
공용업무 인계, 포트레이트 교육 빈 화면·대상·복귀, 임신 상태 표시,
승인된 대사·특성/전투 관련 수정 등. 1차/r2/r3를 별도로 설치할 필요는 없습니다.

이번 테스트 ZIP에는 세이브·개인 설정·독립 편집 도구와 미승인 보류 기획이 없습니다.
옛 도나 JSON25개 수동 제거가 필요합니다. 정확한 목록을 함께 제공합니다.
'''
    manifest = {'schema':1, 'id':'JO9_2.4_SecondPatch_20261021_Cumulative_Test',
                'status':'USER_TEST_CANDIDATE', 'generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
                'baseVersion':'2.4 Korean original published Full', 'includesFirstPatchRevisions':True,
                'counts':dict(collections.Counter(r['kind'] for r in rows)),
                'baseManifestSha256':BASE_MANIFEST, 'qspSha256':QSP, 'cssSha256':CSS,
                'files':sorted(rows, key=lambda r:r['path']),
                'manualDelete':deletes, 'savesIncluded':False, 'installerIncluded':False,
                'toolsIncluded':False, 'FullSynchronized':False}
    extras = {
        'README_KO.txt':readme.replace('\n','\r\n').encode('utf-8-sig'),
        'CHANGELOG_KO.md':changelog.replace('\n','\r\n').encode('utf-8-sig'),
        'REMOVE_OLD_DONA_JSON_KO.txt':delete_text.encode('utf-8-sig'),
        'BUILD_MANIFEST.json':(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf-8')}
    source_stats = {}
    with zipfile.ZipFile(ARCHIVE,'x',allowZip64=True) as z:
        for name,data in extras.items():
            z.writestr(name,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=6)
        for i,r in enumerate(rows):
            p = WORK/r['path'][5:]
            no_reparse(p)
            s = p.stat()
            assert s.st_size == r['bytes'], 'Stale size: '+r['path']
            info = zipfile.ZipInfo.from_file(p,r['path'])
            info.compress_type = zipfile.ZIP_STORED if r['kind']=='image' else zipfile.ZIP_DEFLATED
            info._compresslevel = 1
            h = hashlib.sha256()
            with p.open('rb') as f,z.open(info,'w',force_zip64=True) as target:
                for b in iter(lambda:f.read(2**20),b''):
                    h.update(b);target.write(b)
            after = p.stat()
            assert (s.st_size,s.st_mtime_ns)==(after.st_size,after.st_mtime_ns), 'Concurrent source change: '+r['path']
            assert h.hexdigest()==r['sha256'], 'Stale source hash: '+r['path']
            source_stats[r['path']] = [after.st_size,after.st_mtime_ns]
            if (i+1)%1000==0:
                print(json.dumps({'phase':'zip','filesWritten':i+1,'total':len(rows)}),flush=True)
    # Extract and hash every entry, exercising decompression + CRC verification.
    extract = SCRATCH/'verification'
    assert not extract.exists(), 'Do not overwrite an old extraction'
    extract.mkdir()
    expected = {r['path']:r for r in rows}
    expected.update({n:{'sha256':sha(d),'bytes':len(d)} for n,d in extras.items()})
    with zipfile.ZipFile(ARCHIVE) as z:
        names = z.namelist()
        assert len(names)==len(set(n.casefold() for n in names))==len(expected)
        assert set(names)==set(expected)
        for i,name in enumerate(names):
            safe_relative(name)
            target = extract/name
            target.parent.mkdir(parents=True,exist_ok=True)
            h=hashlib.sha256();size=0
            with z.open(name) as source,target.open('xb') as f:
                for b in iter(lambda:source.read(2**20),b''):
                    h.update(b);size+=len(b);f.write(b)
            assert size==expected[name]['bytes'] and h.hexdigest()==expected[name]['sha256'],name
            if (i+1)%1000==0:
                print(json.dumps({'phase':'extract-and-verify','filesVerified':i+1,'total':len(names)}),flush=True)
    for rel,(size,mtime) in source_stats.items():
        s=(WORK/rel[5:]).stat()
        assert (s.st_size,s.st_mtime_ns)==(size,mtime),'Work changed after packing: '+rel
    # Simulate baseline + overlay + precise removals for the JSON registry only.
    overlay = SCRATCH/'overlay-runtime/game'
    assert not overlay.exists()
    shutil.copytree(BASE/'game/json',overlay/'json')
    for r in rows:
        if r['kind']=='json':
            dest=overlay/r['path'][5:]
            dest.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(extract/r['path'],dest)
    for d in deletes:
        p=overlay/d['file'];assert digest(p)==d['only_if_sha256'];p.unlink()
        assert digest(overlay/d['keep'])==d['keep_sha256']
    a={p.relative_to(overlay/'json').as_posix():digest(p) for p in (overlay/'json').rglob('*.json')}
    b={p.relative_to(WORK/'json').as_posix():digest(p) for p in (WORK/'json').rglob('*.json')}
    assert a==b,'Baseline + JSON overlay + removals differs from Work'
    assert before==protect(),'Protected game or save changed during build'
    archive_hash=digest(ARCHIVE)
    (OUT/(ARCHIVE.name+'.sha256')).write_text(archive_hash+'  '+ARCHIVE.name+'\n',encoding='ascii')
    for name,data in extras.items():
        (OUT/name).write_bytes(data)
    write_json(RECORD/'BUILD_RESULT.json',{
        'status':'ARCHIVE_INTEGRITY_PASS_RELEASE_QA_PENDING','archive':str(ARCHIVE),'bytes':ARCHIVE.stat().st_size,
        'sha256':archive_hash,'files':len(expected),'runtimeFiles':len(rows),'counts':manifest['counts'],
        'imagesUncompressedBytes':sum(r['bytes'] for r in rows if r['kind']=='image'),
        'zipCRCAndExtractedSHA256':True,'allSourceHashesMatched':True,'allSourceStatsUnchangedAfterZIP':True,
        'jsonOverlayMatchesCurrentWork':True,'jsonOverlayFiles':len(a),'exactManualRemovals':25,
        'protectedHashes':before,'FullUpdated':False,'commit':False,'push':False})
    write_json(RECORD/'RUNTIME_FILE_LIST.json',manifest)
    print(json.dumps({'phase':'COMPLETE','archive':str(ARCHIVE),'bytes':ARCHIVE.stat().st_size,
                      'sha256':archive_hash,'runtimeFiles':len(rows),'mirror':str(extract/'game/jack.qsp')}),flush=True)


if __name__=='__main__':
    build()
