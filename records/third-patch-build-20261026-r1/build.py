"""Build approved third-patch r1 packs; never mutate WORK, Full, or old releases.

Adapted from records/third-patch-build-20261026/build.py. Run only after the
approved follow-up QSP has been applied and its targeted checks have passed.
The separate release-check, independent review, image-history and finalization
steps remain mandatory before this revision can be declared ready.
"""
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import zipfile

REPO=Path('G:/somi/JO9sa')
OLDREC=REPO/'records/third-patch-build-20261026'
REC=REPO/'records/third-patch-build-20261026-r1'
FOLLOWUPS=REPO/'records/third-patch-approved-followups-20261026'
IMAGES=FOLLOWUPS/'images'
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
FULL=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game')
BASE=Path('G:/somi/JO9_2.4_Release_20261019_Final/verified/JO9_2.4_Full/game')
OLDOUT=Path('G:/somi/JO9_2.4_ThirdPatch_20261026')
OUT=Path('G:/somi/JO9_2.4_ThirdPatch_20261026_r1')
TMP=Path('G:/Codex/tmp/third-patch-build-20261026-r1')
NAMES={'core':'JO9_2.4_ThirdPatch_20261026_r1.zip',
       'indie':'JO9_2.4_IndieResources_20261021.zip',
       'personal':'JO9_2.4_SAnkResources_20261026_r1.zip'}
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
 p=row['path'];safe(p);assert p.startswith('game/')
 assert not any(s in p.lower().split('/') for s in ['save','modworkpic','modtools','.git','backup','records','tools'])
 return {'path':p,'bytes':row['bytes'],'sha256':row['sha256'],'kind':'image' if p.lower().endswith('.png') else 'runtime'}
def currentrow(path):
 safe(path);assert path.startswith('game/')
 source=WORK/path[5:];assert source.is_file(),source
 return cleanrow({'path':path,'bytes':source.stat().st_size,'sha256':digest(source)})
def text(s):return s.replace('\r\n','\n').replace('\n','\r\n').encode('utf-8-sig')


# All inputs below are read-only. Only fresh OUT, TMP, and REC entries are written.
assert OUT!=OLDOUT and REC!=OLDREC
assert not OUT.exists() and not TMP.exists(),'Do not overwrite earlier artifacts'
for name in ['BUILD_RESULT.json','MANIFESTS.json','QA_PREP.json','INPUT_PROVENANCE.json','R1_ADDITIONS.json','PROTECTED_INPUTS.json']:
 assert not (REC/name).exists(),'Do not overwrite a previous r1 build record: '+name
previous=load(OLDREC/'FINAL_RESULT.json');oldgroups=load(OLDREC/'MANIFESTS.json')
runtime=load(OLDREC/'runtime-inventory.json')
prepared=load(FOLLOWUPS/'prepared.json');patch=load(FOLLOWUPS/'patch.json')
image_result=load(IMAGES/'FINAL_RESULT.json');image_delta=load(IMAGES/'delta.json')
image_validation=load(IMAGES/'validation.json')
EXPECTED=prepared['after']
assert previous['status']=='READY_FOR_DISTRIBUTION' and previous['runtimeCount']==6983
assert (len(oldgroups['core']),len(oldgroups['indie']),len(oldgroups['personal']))==(7,6830,146)
assert prepared['before']==previous['qspSha256']==patch['before_sha256']
assert EXPECTED==patch['after_sha256'] and len(EXPECTED)==64
assert prepared['refusalBranches']==2 and prepared['highTierConditions']==6
assert prepared['newLocations']==prepared['newPersistentKeys']==prepared['saveStatWritesAdded']==0
assert prepared['costAndRandomBranchesUnchanged'] is True
assert digest(WORK/'jack.qsp')==EXPECTED,'Apply the verified approved QSP to WORK before building'
assert image_result['status']==image_validation['status']=='PASS'
assert image_result['jsonReplacements']==image_result['compatibilityPngCopies']==2
assert image_result['addedPngBytes']==image_delta['addedBytes']==192192
assert image_result['protectedFilesAndSavesUnchanged'] is True
assert image_delta['approved']=='JSON_CORRECTIONS_AND_EXACT_ASSET_ALIASES'
assert len(image_result['results'])==len(image_delta['changes'])==2
assert image_validation['results']==image_result['results']

protected=load(FOLLOWUPS/'protected.json')
assert isinstance(protected,list) and len(protected)>=6
assert any(Path(r['file'])==FULL/'jack.qsp' for r in protected)
assert sum('/save/' in r['file'].replace('\\','/').lower() for r in protected)>=2
def verify_protected():
 for row in protected:assert digest(Path(row['file']))==row['sha256'],'Protected input changed: '+row['file']
 assert digest(FULL/'jack.qsp')==runtime['fullQspSha256']
verify_protected()

# Refresh all carried core/personal rows against WORK, accepting only this QSP delta.
core=[];personal=[]
for kind,rows in [('core',core),('personal',personal)]:
 for oldrow in oldgroups[kind]:
  row=currentrow(oldrow['path'])
  if row['path']=='game/jack.qsp':assert kind=='core' and row['sha256']==EXPECTED
  else:assert row==cleanrow(oldrow),'Unexpected carried runtime change: '+row['path']
  rows.append(row)
indie=[cleanrow(r) for r in oldgroups['indie']]
additions=[]
expected_json={'json/slaves/178.json','json/slaves/212.json'}
expected_alias={'content/pic/girls/face/00212_white_long_loli.png','content/pic/girls/full/cloth/178_purple_short_loli.png'}
assert {r['json'] for r in image_result['results']}==expected_json
assert {r['alias'] for r in image_result['results']}==expected_alias
for result in image_result['results']:
 delta=next(r for r in image_delta['changes'] if r['json']==result['json'])
 assert all(result[k]==v for k,v in delta.items())
 jsonrow=currentrow('game/'+result['json']);aliasrow=currentrow('game/'+result['alias'])
 assert (jsonrow['bytes'],jsonrow['sha256'])==(result['afterBytes'],result['afterSha256'])
 assert (aliasrow['bytes'],aliasrow['sha256'])==(result['aliasBytes'],result['aliasSha256'])
 assert (aliasrow['bytes'],aliasrow['sha256'])==(result['pngBytes'],result['pngSha256'])
 assert digest(WORK/result['canonical'])==aliasrow['sha256']
 assert load(WORK/result['json'])[result['key']]==result['value']
 assert result['correctedPathResolves'] and result['legacyPathResolves'] and result['aliasByteEquality']
 core.append(jsonrow);personal.append(aliasrow)
 additions.append({'json':jsonrow,'compatibilityPng':aliasrow,'canonical':'game/'+result['canonical'],
                   'sourceRecord':str(IMAGES/'FINAL_RESULT.json'),'newArtwork':False})
assert (len(core),len(indie),len(personal))==(9,6830,148)
assert sum(r['kind']=='image' for r in core)==0
assert sum(r['kind']=='image' for r in personal)==147
groups={'core':core,'indie':indie,'personal':personal}
allrows=[r for rows in groups.values() for r in rows]
assert len({r['path'].lower() for r in allrows})==len(allrows)==6987
assert sum(r['kind']=='image' for r in allrows)==6946
for row in core+personal:
 p=WORK/row['path'][5:]
 assert p.stat().st_size==row['bytes'] and digest(p)==row['sha256'],p

utility_source=REPO/'records/second-patch-split-20261021/utility'
utility={r['path']:(utility_source/r['path']).read_bytes() for r in runtime['carryForwardDonaUtility']}
for row in runtime['carryForwardDonaUtility']:assert sha(utility[row['path']])==row['sha256']
assert len(utility)==3
with zipfile.ZipFile(previous['artifacts']['core']['archive']) as z:
 cleanup_manual=z.read('REMOVE_OLD_DONA_JSON_KO.txt')
assert sha(cleanup_manual)==previous['artifacts']['core']['metadata']['REMOVE_OLD_DONA_JSON_KO.txt']['sha256']
player=(REPO/'docs/THIRD_PATCH_RELEASE_NOTES_20261026_KO.md').read_bytes()
headings=[s for s in player.decode('utf-8-sig').splitlines() if s.startswith('## ')]
assert headings==['## [신규 업데이트]','## [버그 수정]']
assert '\ufffd' not in player.decode('utf-8-sig')
readme=f'''Jack-o-nine-tails 2.4 — 3차 누적 패치 r1

이 패치는 2.4 본체에 적용합니다. 1차·2차·기존 3차 수정이 포함되어 있으므로 이전 패치를 차례로 다시 설치할 필요는 없습니다.

세 팩의 구성
1. {NAMES['core']}
   최신 게임 코드·화면 표시 파일, 이미지 참조를 교정한 인물 정의와 기존 도나 JSON 정리 도구입니다.
   이미지와 개인 세이브는 포함하지 않습니다.
2. {NAMES['indie']}
   기존 인디 이미지와 연결 JSON입니다. 2차·기존 3차 제공 파일과 바이트까지 동일합니다.
   이미 같은 인디팩을 설치했다면 다시 받거나 적용할 필요가 없습니다.
3. {NAMES['personal']}
   기존 개인 이미지와 이후 교체·추가한 이미지, 관련 인물 정의를 함께 제공합니다.
   이번에는 기존 저장에 남은 두 이미지 주소도 표시할 수 있도록 호환 이미지 두 파일을 추가했습니다.
   새 본체와 이번 개인 리소스팩을 함께 적용해 주세요.

설치 순서
- 게임을 완전히 종료합니다.
- 처음 설치하거나 인디팩이 없다면 인디 리소스팩 → 개인 리소스팩 r1 → 본체 r1 순서로 압축을 풉니다.
- 이미 2차 또는 기존 3차 세 팩을 설치했다면 새 개인 리소스팩 r1 → 새 본체 r1만 적용하면 됩니다.
- 각 ZIP 안의 game 폴더를 기존 설치의 game 폴더와 병합하고 같은 파일을 덮어씁니다.
- 기존 game 폴더 전체를 지우거나 새 빈 폴더로 교체하지 마세요. 세이브와 개인 설정은 그대로 둡니다.
- 기존 인디 자료를 사용하는 저장이 있다면 해당 이미지와 JSON을 제거하지 마세요.
- 인디팩이나 이전 패치 안의 안내와 다를 경우 이번 README_3RD_KO.txt를 기준으로 적용합니다.

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

# No old release or source record is opened for writing.
OUT.mkdir();TMP.mkdir();fsrecord={}
for kind in ['core','personal']:
 rows=groups[kind]
 manifest={'schema':1,'id':'JO9_2.4_ThirdPatch_20261026_r1','kind':kind,'createdAt':CREATED,
           'cumulativeWithFirstAndSecond':True,'revisionOf':'JO9_2.4_ThirdPatch_20261026',
           'runtimeCount':len(rows),'runtimeFiles':rows,'qspSha256':EXPECTED,
           'requires':'Original 2.4 game; apply r1 core and r1 personal pack together. Reuse unchanged Indie pack if already installed.',
           'containsPersonalSaves':False}
 entries={**metadata,'BUILD_MANIFEST_'+kind.upper()+'.json':encoded(manifest)}
 if kind=='core':entries.update(utility);entries['REMOVE_OLD_DONA_JSON_KO.txt']=cleanup_manual
 p=OUT/NAMES[kind]
 with zipfile.ZipFile(p,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
  for row in sorted(rows,key=lambda r:r['path'].lower()):z.write(WORK/row['path'][5:],row['path'])
  for name,b in entries.items():safe(name);z.writestr(name,b)
 fsrecord[kind]={'archive':str(p),'bytes':p.stat().st_size,'sha256':digest(p),'runtimeCount':len(rows),
                 'metadata':{n:{'bytes':len(b),'sha256':sha(b)} for n,b in entries.items()}}
 print('BUILT',kind,p.stat().st_size,flush=True)
indie_original=previous['artifacts']['indie'];indie_source=Path(indie_original['archive'])
assert indie_source.parent==OLDOUT and indie_source.name==NAMES['indie']
assert indie_source.stat().st_size==indie_original['bytes'] and digest(indie_source)==indie_original['sha256']
with indie_source.open('rb') as src,(OUT/NAMES['indie']).open('xb') as dst:shutil.copyfileobj(src,dst,2**20)
assert digest(OUT/NAMES['indie'])==indie_original['sha256']
fsrecord['indie']={'archive':str(OUT/NAMES['indie']),'bytes':(OUT/NAMES['indie']).stat().st_size,
                   'sha256':indie_original['sha256'],'runtimeCount':len(indie),'reusedUnchangedFrom':str(indie_source)}
print('COPIED unchanged indie',flush=True)

# Stream every member to EOF: zipfile verifies CRC and we verify runtime SHA256.
for kind in ['core','personal','indie']:
 rows=groups[kind];expected={r['path']:r for r in rows};p=Path(fsrecord[kind]['archive'])
 with zipfile.ZipFile(p) as z:
  names=z.namelist();assert len(names)==len(set(n.lower() for n in names))
  assert not any(i.is_dir() or ((i.external_attr>>16)&0o170000)==0o120000 for i in z.infolist())
  for n in names:safe(n)
  assert {n for n in names if n.startswith('game/')}==set(expected)
  for n in names:
   h=hashlib.sha256();size=0
   with z.open(n) as f:
    for b in iter(lambda:f.read(2**20),b''):h.update(b);size+=len(b)
   if n in expected:assert (size,h.hexdigest())==(expected[n]['bytes'],expected[n]['sha256']),n
   elif kind!='indie':assert (size,h.hexdigest())==(fsrecord[kind]['metadata'][n]['bytes'],fsrecord[kind]['metadata'][n]['sha256']),n
  fsrecord[kind]['everyMemberCRCVerified']=True
  fsrecord[kind]['everyRuntimeSHA256Verified']=True
  fsrecord[kind]['allArchivePathsSafe']=True
 print('VERIFIED CRC + SHA',kind,len(rows),flush=True)

# Assemble original2.4 plus cumulative packs in an isolated diagnostic directory.
stage=TMP/'verification/game';stage.mkdir(parents=True)
shutil.copytree(BASE/'json',stage/'json');shutil.copytree(BASE/'css',stage/'css')
shutil.copyfile(WORK/'config.xml',stage/'config.xml')
if (BASE/'content/js').exists():shutil.copytree(BASE/'content/js',stage/'content/js')
deletes=load(REPO/'records/second-patch-zip-20261021/RUNTIME_FILE_LIST.json')['manualDelete']
assert len(deletes)==25
for row in deletes:
 target=stage/row['file'];assert target.resolve().is_relative_to(stage.resolve())
 if target.exists():assert digest(target)==row['only_if_sha256'];target.unlink()
for kind in ['indie','personal','core']:
 with zipfile.ZipFile(fsrecord[kind]['archive']) as z:
  for row in groups[kind]:
   if row['path'].endswith('.json') or kind=='core':
    target=stage/row['path'][5:];target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(z.read(row['path']))
jsonmap=lambda p:{f.relative_to(p).as_posix():digest(f) for f in p.rglob('*.json')}
assert jsonmap(stage/'json')==jsonmap(WORK/'json')
assert digest(stage/'jack.qsp')==EXPECTED
for name in ['fonts']:
 subprocess.run(['node','-e','require("fs").symlinkSync(process.argv[1],process.argv[2],"junction")',str(WORK/name),str(stage/name)],check=True)
for name in ['pic','snd']:
 (stage/'content').mkdir(exist_ok=True)
 subprocess.run(['node','-e','require("fs").symlinkSync(process.argv[1],process.argv[2],"junction")',str(WORK/'content'/name),str(stage/'content'/name)],check=True)
qa_inputs=TMP/'qa-inputs';qa_inputs.mkdir();(qa_inputs/'mods').mkdir()
baseline=gzip.decompress((FOLLOWUPS/'before.qsp.gz').read_bytes())
assert sha(baseline)==patch['before_sha256'] and patch['after_sha256']==EXPECTED
(qa_inputs/'before.qsp').write_bytes(baseline)
shutil.copyfile(FOLLOWUPS/'patch.json',qa_inputs/'mods'/(patch['id']+'.json'))
assert len(list((qa_inputs/'mods').glob('*.json')))==1
for n,b in metadata.items():
 with (OUT/n).open('xb') as f:f.write(b)
checksums=''.join(fsrecord[k]['sha256']+'  '+NAMES[k]+'\r\n' for k in ['core','personal','indie'])
with (OUT/'SHA256SUMS.txt').open('x',encoding='ascii',newline='') as f:f.write(checksums)
verify_protected()
assert digest(WORK/'jack.qsp')==EXPECTED
for row in core+personal:
 p=WORK/row['path'][5:];assert p.stat().st_size==row['bytes'] and digest(p)==row['sha256'],p

delivery={'schema':1,'status':'PACKAGED_AWAITING_ENGINE_AND_INDEPENDENT_REVIEW','createdAt':CREATED,
          'version':'2.4 third cumulative patch r1','revisionOf':str(OLDOUT),'qspSha256':EXPECTED,
          'runtimeCount':len(allrows),'personalImages':147,'indieImages':6799,
          'compatibilityAliasImages':2,'artifacts':fsrecord,'packOrder':['indie','personal','core'],
          'existingIndieNeedsRedownload':False,'playerNotes':'CHANGELOG_KO.md',
          'FullSynchronized':False,'gameFilesChanged':False,'personalSavesUnchanged':True,
          'commit':False,'push':False}
provenance_paths=[OLDREC/'build.py',OLDREC/'FINAL_RESULT.json',OLDREC/'MANIFESTS.json',
                  OLDREC/'runtime-inventory.json',FOLLOWUPS/'prepared.json',FOLLOWUPS/'patch.json',
                  IMAGES/'FINAL_RESULT.json',IMAGES/'delta.json',IMAGES/'validation.json',
                  REPO/'docs/THIRD_PATCH_RELEASE_NOTES_20261026_KO.md']
provenance={'createdAt':CREATED,'builder':{'path':str(Path(__file__).resolve()),'sha256':digest(Path(__file__))},
            'inputs':[{'path':str(p),'sha256':digest(p)} for p in provenance_paths],
            'previousRecordAndReleasePreserved':True,'changesSincePriorRuntime':['jack.qsp','json/slaves/178.json','json/slaves/212.json']+[r['alias'] for r in image_result['results']]}
save(OUT/'BUILD_MANIFEST.json',delivery);save(REC/'BUILD_RESULT.json',delivery)
save(REC/'MANIFESTS.json',groups);save(REC/'INPUT_PROVENANCE.json',provenance)
save(REC/'R1_ADDITIONS.json',{'schema':1,'imageResult':str(IMAGES/'FINAL_RESULT.json'),'additions':additions,
                            'compatibilityPngCopies':2,'addedPngBytes':192192,'newArtwork':False})
save(REC/'PROTECTED_INPUTS.json',{'verifiedBeforeAndAfter':True,'files':protected,'fullQspSha256':runtime['fullQspSha256']})
save(REC/'QA_PREP.json',{'gameDir':str(stage),'candidate':str(stage/'jack.qsp'),'mirror':str(WORK/'jack.qsp'),
                        'baseline':str(qa_inputs/'before.qsp'),'modsDir':str(qa_inputs/'mods'),'cacheRevision':3,
                        'combinedJsonMatchesWork':True,'packagedQspSha256':EXPECTED,'workAndFullUnchanged':True,
                        'protectedFilesAndSavesUnchanged':True,'requiredEngineVerdict':'PASS'})
print(json.dumps({'status':delivery['status'],'output':str(OUT),'runtimeCount':len(allrows),'qaGame':str(stage)},ensure_ascii=False),flush=True)
