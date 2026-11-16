import concurrent.futures, hashlib, json, os, shutil
from pathlib import Path

REPO = Path('G:/somi/JO9sa')
WORK = Path('G:/somi/Jack O Nine Tails v2.4_work')
OUT = Path('G:/somi/JO9_2.4.2_Full_20261113')
STAGE = OUT / 'JO9_2.4.2_Kor_Full'
RECORD = REPO / 'records/full242-packing-20261113'
manifest = json.loads((REPO/'assets/runtime-manifests/2.4.2-work.json').read_text('utf-8'))

def digest(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024), b''): h.update(b)
    return h.hexdigest()

if OUT.exists():
    if sorted(x.name for x in OUT.iterdir()) != [STAGE.name] or not STAGE.is_dir() or any(STAGE.iterdir()):
        raise RuntimeError('Release output is not the verified empty staging directory; preserving it')
assert digest(WORK/'game/jack.qsp') == manifest['sourceQspSha256']
OUT.mkdir(exist_ok=True); STAGE.mkdir(exist_ok=True)
rows = manifest['files']
for row in rows:
    p = row['path']; parts=Path(p).parts
    assert p.startswith('game/') and '..' not in parts
    assert not any(x.lower() in {'modtools','modworkpic','image_work','__jo9_imagebackups','save','.git','workshop'} for x in parts)
    assert Path(p).suffix.lower() not in {'.sav','.bak','.log','.zip','.pngbk'}
    src=WORK/p
    assert src.is_file() and not src.is_symlink(), p
    assert src.stat().st_size == row['bytes'], ('Source size changed',p)

def copy_row(row):
    src, dst=WORK/row['path'],STAGE/row['path']
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)
    assert digest(dst)==row['sha256'], ('Copied hash mismatch',row['path'])
    return row

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for i,row in enumerate(pool.map(copy_row,rows),1):
        if i%5000==0: print(f'Staged and SHA-verified {i}/{len(rows)}',flush=True)

shutil.copy2(WORK/'Jack-o-nine-tails.exe',STAGE/'Jack-o-nine-tails.exe')
assert digest(STAGE/'Jack-o-nine-tails.exe')==manifest['launcher']['sha256']
shutil.copytree(WORK/'LICENSES',STAGE/'LICENSES')
(STAGE/'FastQSP.ini').write_text('[General]\nignoreCRC=true\nmutedState=false\n',encoding='utf-8-sig')
(STAGE/'game/save').mkdir()
notes=REPO/'docs/release/2.4.2-player-20261113'
for p in ('RELEASE_NOTES_KO.html','UPDATE_GUIDE_KO.html'):
    shutil.copy2(notes/p,STAGE/p)
shutil.copytree(notes/'images',STAGE/'images')
(STAGE/'README_KO.txt').write_text('''Jack-o-nine-tails 2.4.2 한국어판 Full

새 빈 폴더에 압축을 풀고 Jack-o-nine-tails.exe로 실행합니다.
이전 패치를 순서대로 적용할 필요가 없는 전체 배포본입니다.
변경 사항은 RELEASE_NOTES_KO.html을 열어 확인하십시오.

2.4.1 저장 이어하기:
전투를 끝내고 일반 화면에서 저장한 파일을 사용하십시오.
JO9_Save_242.exe에서 원본 세이브를 선택해 검사한 뒤 새로운 파일로 변환합니다.
원본은 그대로 보존되며, 변환된 파일을 game/save에 두고 불러옵니다.
사용자 작명·육성·장비·진행을 유지하며 알려진 기본이름·경로만 갱신합니다.
전투 중 저장과 2.4.1 이외 형식은 지원하지 않습니다.

이 배포본에는 개인 세이브·모드 제작 도구·편집 백업을 넣지 않았습니다.
게임이 켜진 상태에서 파일을 덮어쓰지 마십시오.
''',encoding='utf-8-sig')
summary={'stage':str(STAGE),'runtimeQspSha256':manifest['sourceQspSha256'],'runtimeFiles':len(rows),'runtimeBytes':sum(x['bytes'] for x in rows),'runtimeCopiesAllHashVerified':True,'privateSavesIncluded':False,'modtoolsIncluded':False,'oldFullChanged':False,'migrationUtilityPending':True}
(RECORD/'stage-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
shutil.copy2(Path(__file__),RECORD/Path(__file__).name)
print(json.dumps(summary,ensure_ascii=False),flush=True)
