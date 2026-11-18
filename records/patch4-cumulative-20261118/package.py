import base64,hashlib,html,json,re,shutil,zipfile
from collections import Counter
from pathlib import Path,PurePosixPath
from PIL import Image
D=Path(__file__).resolve().parent
R=Path('G:/somi/JO9sa')
W=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
OUT=Path('G:/somi/JO9_2.4.2_Patch4_20261118_Cumulative')
RECORD=R/'records/patch4-cumulative-20261118'
T=Path('G:/Codex/tmp/patch4-cumulative-20261118')
NAME=OUT.name+'.zip'
def load(p):return json.loads(p.read_text('utf-8-sig'))
def sha(b):return hashlib.sha256(b).hexdigest()
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def safe(n):return not PurePosixPath(n).is_absolute() and '..' not in PurePosixPath(n).parts and ':' not in n and '\\' not in n
inv=load(D/'inventory.json');scope=load(D/'qsp-scope.json');chars=load(D/'character-audit.json')
old=Path(inv['previousPatch']);assert digest(old)==inv['previousPatchSha256']
assert not OUT.exists() and not RECORD.exists(),'Preserve existing final outputs'
assert digest(W/'jack.qsp')==inv['workQspSha256']==scope['workSha256']
assert digest(R/'assets/runtime/2.4.1/jack.qsp')==inv['trackedQspSha256']==scope['trackedSha256']
runtime={r['path']:r for r in inv['runtimeFiles']};assert len(runtime)==len(inv['runtimeFiles'])
bases=[{r['path']:r for r in load(Path(p))['files']} for p in inv['baseManifests']]
bases.append({r['path']:r for r in load(R/'records/hotfix-cumulative-20261115/full-package-manifest.json')['files']})
for p in inv['mandatoryAliases']:assert all(p in b or p in runtime for b in bases),p
for ch in chars:
 for row in ch['checkedExplicitImageFiles']:
  p='game/content/pic/'+row['path'];assert all(p in b or p in runtime for b in bases),(ch['name'],p)
json_count=0;images=[]
for p,row in runtime.items():
 assert safe(p) and p.startswith('game/'),p
 src=W/p[5:];assert src.is_file() and not src.is_symlink() and not src.is_junction(),p
 assert src.stat().st_size==row['bytes'] and digest(src)==row['sha256'],p
 assert src.suffix.lower() not in {'.sav','.wav','.mp3','.ogg','.flac','.exe','.cmd','.ps1'},p
 assert not {'modtools','modworkpic','save','backups'} & {x.lower() for x in PurePosixPath(p).parts},p
 if src.suffix.lower()=='.json':load(src);json_count+=1
for row in inv['changedSincePatch3']+inv['addedSincePatch3']:
 if row['path'].lower().endswith('.png'):
  with Image.open(W/row['path'][5:]) as im:size=im.size;im.verify()
  images.append({'path':row['path'],'size':size})

def inline(s):
 parts=html.escape(s).split('**');return ''.join(('<strong>'+v+'</strong>') if i%2 else v for i,v in enumerate(parts))
def render(s):
 out=[];listing=False
 for line in s.splitlines():
  if listing and not line.startswith('- '):out.append('</ul>');listing=False
  if not line:continue
  if line.startswith('## '):out.append('<h2>'+inline(line[3:])+'</h2>')
  elif line.startswith('# '):out.append('<h1>'+inline(line[2:])+'</h1>')
  elif line.startswith('- '):
   if not listing:out.append('<ul>');listing=True
   out.append('<li>'+inline(line[2:])+'</li>')
  else:out.append('<p>'+inline(line)+'</p>')
 if listing:out.append('</ul>')
 return '\n'.join(out)
notes=(D/'PATCH_NOTES_KO.md').read_text('utf-8')
gallery='<section><h2>이번 캐릭터 리마스터</h2><div class="portraits">'
for ch in chars:
 ref=ch['imageReferences']['seed_ava_clear'].removeprefix('content/pic/')+'.png'
 raw=(W/'content/pic'/ref).read_bytes()
 gallery+='<figure><img width="151" height="150" alt="'+html.escape(ch['name'])+'" src="data:image/png;base64,'+base64.b64encode(raw).decode()+'"><figcaption>'+html.escape(ch['name'])+'</figcaption></figure>'
gallery+='</div><p>캐롤라인·잔나: 초상·전신·복장 및 연결 데이터 / 스네자나: 초상·기본 전신 이미지</p></section>'
content=render(notes);content=content.replace('<h2>1~3차 주요 수정도 포함</h2>',gallery+'<h2>1~3차 주요 수정도 포함</h2>')
page='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JO9 2.4.2 4차 누적 패치</title><style>body{max-width:920px;margin:32px auto;padding:0 24px 50px;background:#151b24;color:#e6eaf0;font:17px/1.8 system-ui,sans-serif}h1,h2{color:#e5c18c;line-height:1.4}h1{font-size:1.8rem}h2{margin-top:2rem;font-size:1.3rem;border-bottom:1px solid #465263;padding-bottom:.4em}li{margin:.65em 0}strong{color:#a6e2d1}a{color:#9bd5ff}.portraits{display:flex;gap:24px;flex-wrap:wrap}figure{margin:12px 0;text-align:center}figure img{display:block;object-fit:contain}figcaption{margin-top:6px}</style><body>'+content+'<footer><a href="RELEASE_NOTES_KO.html">2.4.2 풀버전 변경 안내</a></footer></body></html>'
readme='''JO9 2.4.2 긴급 4차 누적 패치 (2026-11-18)

1차(매력 수정 개정2 포함)부터 3차, 이번 수정까지 모두 포함합니다.
이 패치 하나만 설치하면 됩니다. 앞선 패치를 먼저 설치할 필요는 없습니다.
2.4.2 최초 풀버전·r2·2026-11-15 풀버전용입니다. 2.4.1에 직접 적용하지 마세요.

1. 게임을 완전히 종료합니다.
2. ZIP의 game 폴더를 실행 파일이 있는 설치 폴더에 합쳐 덮어씁니다.
   game/game으로 넣지 마세요.
3. 재실행한 뒤 기존 세이브를 불러옵니다.

저장 파일과 사용자 이미지팩을 삭제하지 마세요. 별도 세이브 호환기는 필요 없습니다.
음원·모딩툴·개인 세이브·설치기는 포함하지 않습니다.

이번 추가: 조수 보상·휴식 효과, 굴욕 조교 대사·조건 복원,
배경 분류 연결, 선택형 클린 세이브, 캐롤라인·잔나·스네자나 이미지 갱신.
클린 세이브는 설정 → 자동 저장 설정에서 선택할 수 있습니다.
첫 대화에는 캐시 재생성 대기가 생길 수 있으며 일반 저장은 캐시를 유지합니다.

유저용 상세 안내: PATCH_NOTES_KO.html
게시글용 텍스트: PATCH_NOTES_KO.md
2.4.2 전체 안내: RELEASE_NOTES_KO.html
'''
docs={'PATCH_NOTES_KO.md':notes.encode('utf-8'),'PATCH_NOTES_KO.html':page.encode('utf-8'),'README_KO.txt':readme.replace('\n','\r\n').encode('utf-8-sig')}
with zipfile.ZipFile(old) as z:
 prev=json.loads(z.read('PATCH_MANIFEST_SHA256.json'));previous={r['path']:r for r in prev['files']}
 old_runtime={p for p in previous if p.startswith('game/')}
 assert len(old_runtime)==809 and old_runtime<=runtime.keys()
 for p,row in previous.items():
  if p.startswith('game/') or p in docs:continue
  raw=z.read(p);assert sha(raw)==row['sha256'];docs[p]=raw
records=['assistant-rest-fix-20261117','humiliation-full-restore-20261117','assistant-rewards-complete-20261117','character-background-20261118','optional-clean-save-20261118']
rows=[{'path':n,'bytes':len(b),'sha256':sha(b)} for n,b in sorted(docs.items())]+list(runtime.values())
manifest={'version':'2.4.2','kind':'Patch4 cumulative including Patch1 revision2, Patch2 and Patch3','date':'2026-11-18','baseVersions':prev['baseVersions'],'firstPatchSha256':prev['firstPatchSha256'],'previousPatchSha256':inv['previousPatchSha256'],'workQspSha256':inv['workQspSha256'],'distributionQspSha256':inv['workQspSha256'],'trackedQspSha256':inv['trackedQspSha256'],'workBytesPreserved':True,'latestManualDialoguePreserved':True,'previousRequiredGamePaths':len(old_runtime),'previousRequiredGamePathsPreserved':True,'compatibilityAliasesPreservedInSupportedBases':inv['mandatoryAliases'],'gameValidationReused':True,'validationRecords':prev['validationRecords']+records,'fullGameTestsRepeated':False,'excluded':['audio assets','modding tools','personal saves','backups','deferred work'],'files':rows,'manifestExcludesItself':True}
mb=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
assert T.resolve()==Path('G:/Codex/tmp/patch4-cumulative-20261118')
T.mkdir(parents=True,exist_ok=True);assert not T.is_symlink() and not T.is_junction()
stage=T/(NAME+'.partial');assert not stage.exists()
with zipfile.ZipFile(stage,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for n,b in sorted(docs.items()):z.writestr(n,b)
 for n,row in sorted(runtime.items()):
  raw=(W/n[5:]).read_bytes();assert sha(raw)==row['sha256'];z.writestr(n,raw)
 z.writestr('PATCH_MANIFEST_SHA256.json',mb)
expected={r['path']:r for r in rows};expected['PATCH_MANIFEST_SHA256.json']={'bytes':len(mb),'sha256':sha(mb)};seen=set()
with zipfile.ZipFile(stage) as z:
 for info in z.infolist():
  n=info.filename;assert safe(n) and n.casefold() not in seen;seen.add(n.casefold())
  raw=z.read(info);row=expected.pop(n);assert len(raw)==row['bytes'] and sha(raw)==row['sha256'],n
 assert not expected
for n,row in runtime.items():assert digest(W/n[5:])==row['sha256'],n
assert digest(old)==inv['previousPatchSha256']
assert digest(R/'assets/runtime/2.4.1/jack.qsp')==inv['trackedQspSha256']
OUT.mkdir();archive=OUT/NAME;shutil.move(str(stage),str(archive))
result={'path':str(archive),'bytes':archive.stat().st_size,'sha256':digest(archive),'entries':len(rows)+1,'runtimeFiles':len(runtime),'runtimeTypes':dict(Counter(PurePosixPath(p).suffix for p in runtime)),'priorPatchRuntimeFiles':809,'priorPatchPathsPreserved':True,'addedSincePatch3':len(inv['addedSincePatch3']),'replacedSincePatch3':len(inv['changedSincePatch3']),'allEntriesCRCAndSHA256':True,'caseInsensitiveDuplicatePaths':0,'jsonFilesParsed':json_count,'newOrChangedPNGsVerified':len(images),'charactersChecked':[ch['name'] for ch in chars],'workQspSha256':inv['workQspSha256'],'distributionMatchesWork':True,'manualWorkSourceDifferencePreserved':True,'workUnchanged':True,'trackedSourceUnchanged':True,'previousZipUnchanged':True,'FullNotWritten':True,'gameTestsRepeatedForPackaging':False,'uploaded':False,'committed':False}
report=f'''# 2.4.2 4차 누적 패치 포장 기록

사용자 지시: 오늘 수정 모음의 차수를 4차로 정정. 변경된 노예 캐릭터도 확인.
배포물: {archive}
크기: {result['bytes']} bytes
SHA256: {result['sha256']}

1~3차 필수 게임 파일809개를 모두 유지하고 최신 WORK로 갱신했다.
게임 파일{len(runtime)}개: 기존 경로 변경{len(inv['changedSincePatch3'])}개, 추가22개.
추가22경로는 이미지20개와 캐롤라인·잔나 JSON2개다.
스네자나 JSON은 원본 설정을 유지하고 초상3종·기본 전신만 이미지 변경이다.
캐롤라인·잔나·스네자나의 초상·전신·기본 옷·하녀·비서·도미나 모든 명시 이미지27참조를 확인했다.
각 참조는 지원 본편 또는 이번 누적 패치에 존재한다. PNG 구조·크기만 확인했으며 게임 내 화면 품질은 미검증이다.

조수 휴식·보상 결과, 굴욕 조교 원문·역할·조건, 배경 분류 연결, 선택형 클린 저장을 포함했다.
기존 수정의 기능 검사 기록을 재사용했다. 전체9경로·개인 SAV·플레이·청음은 반복하지 않았다.
클린 저장의 실제 파일선택 GUI 및 로딩시간은 기존 기록처럼 미검증이며 네이티브39조건과 배경71조건 등은 관련 코드 검사다.
현재 WORK와 추적 소스 차이는 interaction_city 선택지 서식 수동 편집 한 곳(qsp-scope.json)이다.
WORK를 추적 소스로 되돌리지 않았고 사용자 편집 그대로 포장했다.

인벤토리 메타데이터{inv['metadataPathsChecked']}경로, 후보 해시{inv['filesHashed']}개.
완성 ZIP 모든 항목 CRC/SHA256·중복0·경로 안전·누적 합집합·WORK 바이트 일치 확인.
JSON{json_count}개 파싱, 신규/변경PNG{len(images)}개 구조 확인. 기존 호환23경로 지원본편/패치에서 유지.
여주 전용 게임 데이터는 삭제하지 않았다. 안개·동부 부동산32문구와 보류 기획은 신규 포함하지 않았다.
음원·모딩툴·개인 저장·백업·설치기는 제외했다.
WORK·추적 소스·Full·개인SAV·기존ZIP 수정0. 업로드·커밋·푸시0.
임시 포장ZIP은 최종 경로로 이동해 중복본이 없다. 재현 스크립트·원장·보고서만 남겼다.
'''
RECORD.mkdir()
for folder in [OUT,RECORD]:
 for n in ['PATCH_NOTES_KO.md','PATCH_NOTES_KO.html','README_KO.txt']:(folder/n).write_bytes(docs[n])
 (folder/'package-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')
 (folder/'REPORT_KO.md').write_text(report,'utf-8')
for n in ['prepare.py','inventory.py','inventory.json','package.py','character-audit.py','character-audit.json','qsp-scope.cjs','qsp-scope.json']:shutil.copy2(D/n,RECORD/n)
(RECORD/'package-manifest.json').write_bytes(mb)
(RECORD/'image-integrity.json').write_text(json.dumps(images,ensure_ascii=False,indent=2),'utf-8')
(OUT/(NAME+'.sha256')).write_text(result['sha256']+'  '+NAME+'\n','ascii')
if not any(T.iterdir()):T.rmdir()
print(json.dumps(result,ensure_ascii=False,indent=2))
