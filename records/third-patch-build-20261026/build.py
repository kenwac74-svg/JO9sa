"""Build only the approved three-pack JO9 release; never mutate WORK or Full."""
from collections import Counter
import datetime as dt
import gzip
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import zipfile

REPO=Path('G:/somi/JO9sa')
REC=REPO/'records/third-patch-build-20261026'
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
FULL=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game')
BASE=Path('G:/somi/JO9_2.4_Release_20261019_Final/verified/JO9_2.4_Full/game')
OUT=Path('G:/somi/JO9_2.4_ThirdPatch_20261026')
TMP=Path('G:/Codex/tmp/third-patch-build-20261026')
OLD=Path('G:/somi/JO9_2.4_SecondPatch_20261021_Split')
EXPECTED='f2433bf3bbb887f00a0a319130bf06cb0bfdaeaa091b113d831c701407f1b07a'
NAMES={'core':'JO9_2.4_ThirdPatch_20261026.zip','indie':'JO9_2.4_IndieResources_20261021.zip','personal':'JO9_2.4_SAnkResources_20261026.zip'}
CREATED=dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).isoformat()

def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def encoded(o):return (json.dumps(o,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(2**20),b''):h.update(b)
 return h.hexdigest()
def sha(b):return hashlib.sha256(b).hexdigest()
def save(p,o):
 p.parent.mkdir(parents=True,exist_ok=True)
 with p.open('xb') as f:f.write(encoded(o))
def safe(name):
 p=PurePosixPath(name)
 assert name==str(p) and not p.is_absolute() and '..' not in p.parts and '\\' not in name and ':' not in name,name
def cleanrow(row):
 p=row['path'];safe(p);assert p.startswith('game/');assert not any(s in p.lower().split('/') for s in ['save','modworkpic','modtools','.git','backup','records','tools'])
 return {'path':p,'bytes':row['bytes'],'sha256':row['sha256'],'kind':'image' if p.lower().endswith('.png') else 'runtime'}
def text(s):return s.replace('\n','\r\n').encode('utf-8-sig')

assert not OUT.exists() and not TMP.exists(),'Do not overwrite earlier artifacts'
assert digest(WORK/'jack.qsp')==EXPECTED
assert load(REC/'runtime-inventory.json')['workQspSha256']==EXPECTED
runtime=load(REC/'runtime-inventory.json');resources=load(REC/'resource-inventory.json')
supplement=load(REC/'supplemental-image-manifest.json')
core=[cleanrow(r) for r in runtime['coreRuntimeFiles']]
indie=[cleanrow(r) for r in resources['packs']['indie']['files']]
personal=[cleanrow(r) for r in resources['packs']['sank']['files']+resources['newPersonalImages']+resources['ledgerAdditionalPersonalImages']+runtime['personalResourceJsonFiles']]
assert (len(core),len(indie),len(personal))==(7,6830,146)
assert sum(r['kind']=='image' for r in personal)==145
groups={'core':core,'indie':indie,'personal':personal}
allrows=[r for rows in groups.values() for r in rows]
assert len({r['path'].lower() for r in allrows})==len(allrows)==6983
for row in core+personal:
 p=WORK/row['path'][5:];assert p.is_file() and p.stat().st_size==row['bytes'] and digest(p)==row['sha256'],p
assert all(r['status']=='unchanged' for r in resources['packs']['indie']['files'])
OUT.mkdir();TMP.mkdir();fsrecord={}
utility_source=REPO/'records/second-patch-split-20261021/utility'
utility={r['path']:(utility_source/r['path']).read_bytes() for r in runtime['carryForwardDonaUtility']}
for row in runtime['carryForwardDonaUtility']:assert sha(utility[row['path']])==row['sha256']
assert len(utility)==3
with zipfile.ZipFile(OLD/'JO9_2.4_SecondPatch_20261021.zip') as z:
 cleanup_manual=z.read('REMOVE_OLD_DONA_JSON_KO.txt')
player=(REPO/'docs/THIRD_PATCH_RELEASE_NOTES_20261026_KO.md').read_bytes()
headings=[s for s in player.decode('utf-8-sig').splitlines() if s.startswith('## ')]
assert headings==['## [신규 업데이트]','## [버그 수정]']
readme=f'''Jack-o-nine-tails 2.4 — 3차 누적 패치

이 패치는 2.4 본체에 적용합니다. 1차·2차 수정이 포함되어 있으므로 이전 패치를 차례로 다시 설치할 필요는 없습니다.

세 팩의 구성
1. {NAMES['core']}
   최신 게임 코드·화면 표시 파일과 기존 도나 JSON 정리 도구입니다. 이미지와 개인 세이브는 포함하지 않습니다.
2. {NAMES['indie']}
   기존 인디 이미지와 연결 JSON입니다. 2차 제공 파일과 바이트까지 동일합니다.
   이미 같은 인디팩을 설치했다면 다시 받거나 적용할 필요가 없습니다.
3. {NAMES['personal']}
   기존 개인 이미지와 이후 교체·추가한 이미지, 관련 인물 정의를 함께 제공합니다.
   이번 새 UI·복장 자료가 있으므로 최신 본체와 함께 적용해 주세요.

설치 순서
- 게임을 완전히 종료합니다.
- 처음 설치하거나 인디팩이 없다면 인디 리소스팩 → 개인 리소스팩 → 본체 순서로 압축을 풉니다.
- 이미 2차 세 팩을 설치했다면 새 개인 리소스팩 → 새 본체만 적용하면 됩니다.
- 각 ZIP 안의 game 폴더를 기존 설치의 game 폴더와 병합하고 같은 파일을 덮어씁니다.
- 기존 game 폴더 전체를 지우거나 새 빈 폴더로 교체하지 마세요. 세이브와 개인 설정은 그대로 둡니다.
- 기존 인디 자료를 사용하는 저장이 있다면 해당 이미지와 JSON을 제거하지 마세요.
- 인디팩 안의 예전 안내와 다를 경우 이번 README_3RD_KO.txt를 기준으로 적용합니다.

도나 구형 JSON 정리
- 본체 ZIP의 Remove-Old-Dona-Json.cmd, Remove-Old-Dona-Json.ps1, dona-json-delete-allowlist.json을
  game 폴더가 있는 설치 최상위에 함께 둡니다.
- 필요한 경우 사용자가 Remove-Old-Dona-Json.cmd를 직접 실행합니다.
- 정확한 구형 25개만 정리하는 기존 도구이며 정상 도나 등록은 유지합니다.
- 이전 패치에서 이미 정리했다면 다시 실행할 필요는 없습니다.
- 자세한 확인·수동 정리 방법은 REMOVE_OLD_DONA_JSON_KO.txt를 참고하세요.

변경 사항은 CHANGELOG_KO.md, 파일 무결성은 SHA256SUMS.txt를 참고하세요.
게임 설치기·자동 백업 프로그램·개인 세이브·별도 모딩 도구는 포함하지 않습니다.
'''
metadata={'README_3RD_KO.txt':text(readme),'CHANGELOG_KO.md':player}
manifests={}
for kind in ['core','personal']:
 rows=groups[kind]
 manifest={'schema':1,'id':'JO9_2.4_ThirdPatch_20261026','kind':kind,'createdAt':CREATED,'cumulativeWithFirstAndSecond':True,'runtimeCount':len(rows),'runtimeFiles':rows,'qspSha256':EXPECTED,'requires':'Original 2.4 game; apply current core and personal pack together. Reuse Indie pack if already installed.','containsPersonalSaves':False}
 entries={**metadata,'BUILD_MANIFEST_'+kind.upper()+'.json':encoded(manifest)}
 if kind=='core':entries.update(utility);entries['REMOVE_OLD_DONA_JSON_KO.txt']=cleanup_manual
 p=OUT/NAMES[kind]
 with zipfile.ZipFile(p,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
  for row in sorted(rows,key=lambda r:r['path'].lower()):
   source=WORK/row['path'][5:];z.write(source,row['path'])
  for name,b in entries.items():safe(name);z.writestr(name,b)
 manifests[kind]=manifest
 fsrecord[kind]={'archive':str(p),'bytes':p.stat().st_size,'sha256':digest(p),'runtimeCount':len(rows),'metadata':{n:{'bytes':len(b),'sha256':sha(b)} for n,b in entries.items()}}
 print('BUILT',kind,p.stat().st_size,flush=True)
indie_source=Path(resources['packs']['indie']['archive']);assert digest(indie_source)==resources['packs']['indie']['archiveSha256']
with indie_source.open('rb') as src,(OUT/NAMES['indie']).open('xb') as dst:shutil.copyfileobj(src,dst,2**20)
assert digest(OUT/NAMES['indie'])==resources['packs']['indie']['archiveSha256']
fsrecord['indie']={'archive':str(OUT/NAMES['indie']),'bytes':(OUT/NAMES['indie']).stat().st_size,'sha256':resources['packs']['indie']['archiveSha256'],'runtimeCount':len(indie),'reusedUnchangedFrom':str(indie_source)}
print('COPIED unchanged indie',flush=True)

# All members are streamed to EOF: zipfile checks CRC; our hashes verify payloads.
for kind in ['core','personal','indie']:
 rows=groups[kind];expected={r['path']:r for r in rows};p=Path(fsrecord[kind]['archive'])
 with zipfile.ZipFile(p) as z:
  names=z.namelist();assert len(names)==len(set(n.lower() for n in names));assert not any(i.is_dir() for i in z.infolist())
  for n in names:safe(n)
  assert {n for n in names if n.startswith('game/')}==set(expected)
  for n in names:
   h=hashlib.sha256();size=0
   with z.open(n) as f:
    for b in iter(lambda:f.read(2**20),b''):h.update(b);size+=len(b)
   if n in expected:assert (size,h.hexdigest())==(expected[n]['bytes'],expected[n]['sha256']),n
   elif kind!='indie':assert (size,h.hexdigest())==(fsrecord[kind]['metadata'][n]['bytes'],fsrecord[kind]['metadata'][n]['sha256']),n
  fsrecord[kind]['everyMemberCRCVerified']=True;fsrecord[kind]['everyRuntimeSHA256Verified']=True;fsrecord[kind]['allArchivePathsSafe']=True
 print('VERIFIED CRC + SHA',kind,len(rows),flush=True)

# Original2.4 + cumulative packs => complete current JSON, without touching any install.
stage=TMP/'verification/game';stage.mkdir(parents=True)
shutil.copytree(BASE/'json',stage/'json');shutil.copytree(BASE/'css',stage/'css');shutil.copyfile(WORK/'config.xml',stage/'config.xml')
if (BASE/'content/js').exists():shutil.copytree(BASE/'content/js',stage/'content/js')
deletes=load(REPO/'records/second-patch-zip-20261021/RUNTIME_FILE_LIST.json')['manualDelete'];assert len(deletes)==25
for row in deletes:
 target=stage/row['file'];assert target.resolve().is_relative_to(stage.resolve())
 if target.exists():assert digest(target)==row['only_if_sha256'];target.unlink()
for kind in ['indie','personal','core']:
 with zipfile.ZipFile(fsrecord[kind]['archive']) as z:
  for row in groups[kind]:
   if row['path'].endswith('.json') or kind=='core':
    target=stage/row['path'][5:];target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(row['path']))
jsonmap=lambda p:{f.relative_to(p).as_posix():digest(f) for f in p.rglob('*.json')}
assert jsonmap(stage/'json')==jsonmap(WORK/'json')
assert digest(stage/'jack.qsp')==EXPECTED
for name in ['fonts']:
 subprocess.run(['node','-e','require("fs").symlinkSync(process.argv[1],process.argv[2],"junction")',str(WORK/name),str(stage/name)],check=True)
for name in ['pic','snd']:
 (stage/'content').mkdir(exist_ok=True);subprocess.run(['node','-e','require("fs").symlinkSync(process.argv[1],process.argv[2],"junction")',str(WORK/'content'/name),str(stage/'content'/name)],check=True)
qa_inputs=TMP/'qa-inputs';qa_inputs.mkdir();(qa_inputs/'mods').mkdir()
last=REPO/'records/third-followups-20261026';baseline=gzip.decompress((last/'before.qsp.gz').read_bytes());patch=load(last/'patch.json')
assert sha(baseline)==patch['before_sha256'] and patch['after_sha256']==EXPECTED
(qa_inputs/'before.qsp').write_bytes(baseline);shutil.copyfile(last/'patch.json',qa_inputs/'mods'/(patch['id']+'.json'))
for n,b in metadata.items():(OUT/n).write_bytes(b)
checksums=''.join(fsrecord[k]['sha256']+'  '+NAMES[k]+'\r\n' for k in ['core','personal','indie']);(OUT/'SHA256SUMS.txt').write_text(checksums,encoding='ascii',newline='')
delivery={'schema':1,'status':'PACKAGED_AWAITING_ENGINE_AND_INDEPENDENT_REVIEW','createdAt':CREATED,'version':'2.4 third cumulative patch','runtimeCount':len(allrows),'artifacts':fsrecord,'packOrder':['indie','personal','core'],'existingIndieNeedsRedownload':False,'playerNotes':'CHANGELOG_KO.md','FullSynchronized':False,'gameFilesChanged':False,'commit':False,'push':False}
(OUT/'BUILD_MANIFEST.json').write_bytes(encoded(delivery));save(REC/'BUILD_RESULT.json',delivery);save(REC/'MANIFESTS.json',groups)
save(REC/'QA_PREP.json',{'gameDir':str(stage),'candidate':str(stage/'jack.qsp'),'mirror':str(WORK/'jack.qsp'),'baseline':str(qa_inputs/'before.qsp'),'modsDir':str(qa_inputs/'mods'),'cacheRevision':3,'combinedJsonMatchesWork':True,'packagedQspSha256':EXPECTED,'workAndFullUnchanged':True})
assert digest(WORK/'jack.qsp')==EXPECTED and digest(FULL/'jack.qsp')==runtime['fullQspSha256']
print(json.dumps({'status':delivery['status'],'output':str(OUT),'runtimeCount':len(allrows),'qaGame':str(stage)},ensure_ascii=False),flush=True)
