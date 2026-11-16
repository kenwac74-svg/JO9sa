import hashlib,json,os,shutil,zipfile,time,html
from pathlib import Path,PurePosixPath
R=Path('G:/somi/JO9sa');D=R/'records/hotfix-cumulative-20261115';T=Path('G:/Codex/tmp/hotfix-cumulative-20261115');S=Path('G:/somi/JO9_2.4.2_Hotfix_20261115_Cumulative');W=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
BASE=Path('G:/somi/JO9_2.4.2_Full_20261113/JO9_2.4.2_Kor_Full');OUT=Path('G:/somi/JO9_2.4.2_Release_20261115');FULL='JO9_2.4.2_Kor_Full';ROOT='JO9_2.4.2_Hotfix_20261115_Cumulative'
def load(p):return json.loads(p.read_text('utf-8-sig'))
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def safe(name):
 p=PurePosixPath(name);return not p.is_absolute() and '..' not in p.parts and '\\' not in name and ':' not in name
prep=load(D/'prepared.json');inv=load(D/'inventory.json');base=load(R/'records/auto242-load-20261114/final-package-manifest.json');gateRoot=Path(str(T)+'-gate')
gates=[(p,load(p)) for p in gateRoot.glob('run-*/report.json')];passed=[(p,j) for p,j in gates if j['verdict']=='PASS'];assert len(passed)==1,'Exactly one qualified shared game gate required';gatePath,gate=passed[0]
assert all(x['pass'] for x in load(T/'state-probe/client-results.json'))
assert digest(W/'jack.qsp')==prep['workQspSha256'];assert digest(S/'game/jack.qsp')==prep['distributionQspSha256']
# Minimal update: omit 23 unchanged aliases already present in both original full builds.
alias=set(inv['mandatoryAliasPaths']); original=[load(Path(p)) for p in inv['baseManifests']]
for rel in alias:
 row=next(r for r in prep['files'] if r['path']==rel)
 for m in original:assert next(r for r in m['files'] if r['path']==rel)['sha256']==row['sha256']
runtime=[r for r in prep['files'] if r['path'] not in alias];assert len(runtime)==742
notes='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JO9 2.4.2 수정분 패치 — 2026-11-15</title><style>body{max-width:900px;margin:40px auto;padding:0 24px;background:#151b24;color:#e6eaf0;font:17px/1.8 sans-serif}h1,h2{color:#e5c18c}li{margin:.5em 0}strong{color:#a6e2d1}a{color:#9bd5ff}.box{padding:16px 22px;border:1px solid #68768b;border-radius:10px}</style><h1>JO9 2.4.2 수정분 패치</h1><p>2026-11-15 · 기존 2.4.2 풀버전용</p><div class="box"><strong>이 패치 하나만 덮어쓰면 됩니다.</strong><br>기존 2.4.2 풀버전 최초본과 r2를 모두 지원하며, 앞선 긴급패치 수정도 포함합니다. 2.4.1에서 바로 적용하는 패치는 아닙니다.</div><h2>적용 방법</h2><ol><li>게임을 완전히 종료합니다.</li><li>압축 안의 game 폴더를 Jack-o-nine-tails.exe가 있는 설치 폴더에 합치고 같은 파일을 덮어씁니다. game 안에 game을 한 겹 더 넣지 마세요.</li><li>게임을 다시 실행하고 기존 세이브를 불러옵니다. 저장 파일과 사용자 지정 이미지는 삭제하지 마세요.</li></ol><p>2.4.1의 전투 밖 일반 화면 세이브는 게임에서 불러올 때 지원 범위의 데이터가 자동 갱신됩니다. 별도 호환기를 미리 실행할 필요는 없습니다.</p><h2>개인실·화면·소리</h2><ul><li>개인실 업무명을 간결하게 표시하고, 소모량·필요 능력·장비·불가 사유는 툴팁에서 확인할 수 있게 했습니다. 업무와 긴 설명이 패널을 벗어나는 문제를 수정했습니다.</li><li>안개 탐색 업무에서 등뒤에 장착한 무기도 판정에 포함합니다. 기존 장비 등급과 업무 조건은 유지합니다.</li><li>기존 세이브의 안개 전투 배경음 경로와 음량 처리를 보정합니다.</li><li>춘향 포트레이트 3종의 테두리와 아프리카계 이미지·복장 연결을 반영했습니다.</li></ul><h2>인물·하드모드</h2><ul><li>폴더에 있었지만 등록 번호가 겹쳐 등장하지 않던 모브 외형 728종을 별도 등록했습니다. 기존 보유 인물을 교체하지 않고, 앞으로 생성되는 후보가 늘어납니다.</li><li>경매 진행자의 이름과 소개를 파리드로 복원했습니다.</li><li>하드모드에서 장비를 포함한 마법력이 A 이상이거나 전체 공개 마법 효과가 있으면 속성을 즉시 볼 수 있습니다. B·C는 감수성·태도·자아만, D·F는 기존 6항목을 지연 공개합니다.</li><li>지연 공개는 노예·조수·개인실에서 누적 10일입니다. 감옥·크라이오·외양간에서는 멈춥니다. 기존에 보유하던 인물은 공개 상태로 유지합니다.</li><li>암시장의 아프리카·유럽·아시아·슬라브 계열은 지정 이미지를 유지하면서 이름·출신·직업과 승인된 일부 속성·특성을 다시 뽑습니다. 기술·성애기술의 레벨과 경험치, 세련됨·인지도·기분은 별도 추첨하지 않습니다. 기존 게임 보정은 유지합니다.</li></ul><h2>정산·진행 수정</h2><ul><li>계란과 우유를 함께 정산할 때 문자열 처리 오류로 정산이 중단되던 문제를 수정했습니다.</li><li>외양간의 닭 복귀 표기를 다른 항목과 같은 ‘닭 ⇒ 노예’로 통일했습니다.</li><li>죄수 처형에도 잔혹함·자비(CM) 감소가 적용됩니다. 취소하거나 빈 대상을 처리하면 차감하지 않습니다.</li><li>정신상태별 조교 후보의 중복 조건을 수정했습니다. <strong>2.2 대사 복원은 이번 배포에서 제외</strong>하고 기존 2.4 문구를 사용합니다.</li></ul><p>새 풀버전은 검증된 이전 풀버전에 이 수정분을 합친 구성입니다. 풀버전을 새로 받는 경우 수정분을 다시 설치할 필요가 없습니다.</p><p><a href="RELEASE_NOTES_KO.html">2.4.2 전체 변경 안내</a></p></html>'''
(S/'PATCH_NOTES_KO.html').write_text(notes,'utf-8')
readme='''JO9 2.4.2 — 2026-11-15 수정분 / 새 풀버전 공통 안내

기존 2.4.2를 사용 중이면 UpdateOnly ZIP 하나만 적용하면 됩니다.
앞선 긴급패치 수정도 모두 포함하며, 기존 2.4.2 최초 풀버전과 r2를 지원합니다.
2.4.1에서 이 패치만 바로 적용하지 마세요. 먼저 2.4.2 풀버전이 필요합니다.

[기존 설치에 수정분 적용]
게임 종료 → ZIP의 game 폴더를 Jack-o-nine-tails.exe 옆에 합치기 → 같은 파일 덮어쓰기 → 재실행.
game 폴더 안에 다시 game을 만들지 마세요. 기존 폴더를 통째로 지우지 마세요.
저장 파일과 사용자 설정·그림을 삭제하지 않습니다.

[새 풀버전 설치]
새 빈 폴더에 Full ZIP을 풀고 Jack-o-nine-tails.exe로 실행합니다.
이번 수정분이 이미 포함되어 있으므로 패치를 다시 적용할 필요가 없습니다.

[이전 세이브]
2.4.1의 전투 밖 일반 화면에서 저장한 세이브를 game/save에 복사한 뒤 게임에서 불러옵니다.
지원되는 이름·이미지·음원 등 보정은 불러올 때 자동 적용되며 별도 호환기는 필요 없습니다.

수정 상세: PATCH_NOTES_KO.html
2.4.2 전체 안내: RELEASE_NOTES_KO.html
2.2 대사 복원은 제외했습니다. 기존 2.4 문구와 승인된 분기 수정을 사용합니다.
설치기·모드 제작 도구·개인 세이브는 포함하지 않습니다.
'''
(S/'README_KO.txt').write_text(readme,'utf-8-sig')
for name in ['UPDATE_GUIDE_KO.html','SAVE_COMPATIBILITY_KO.txt']:shutil.copy2(BASE/name,S/name)
source=Path('G:/somi/JO9_2.4.2_Full_20261113/JO9_2.4.2_RELEASE_NOTES_KO.html');fullnotes=source.read_text('utf-8-sig');assert 'data:image/' in fullnotes
import re
banner='<aside style="padding:18px;margin:16px;border:1px solid #b29465;border-radius:10px"><strong>2026-11-15 수정분 반영</strong><p>개인실·하드모드 공개 규칙·모브 외형 추가·암시장·정산 수정 등이 포함되었습니다. 2.2 대사 복원은 제외했습니다.</p><a href="PATCH_NOTES_KO.html">이번 수정 내용과 설치 안내</a></aside>'
fullnotes,n=re.subn(r'(<body\b[^>]*>)',lambda m:m[0]+banner,fullnotes,count=1,flags=re.I);assert n==1
(S/'RELEASE_NOTES_KO.html').write_text(fullnotes,'utf-8')
aux=['README_KO.txt','PATCH_NOTES_KO.html','RELEASE_NOTES_KO.html','UPDATE_GUIDE_KO.html','SAVE_COMPATIBILITY_KO.txt']
patchrows=runtime+[{'path':n,'bytes':(S/n).stat().st_size,'sha256':digest(S/n)} for n in aux]
patchmanifest={'version':'2.4.2','kind':'update-only since 2.4.2 Full; includes earlier 2.4.2 hotfixes','date':'2026-11-15','baseVersions':['2.4.2 Full initial','2.4.2 Full r2'],'workQspSha256':prep['workQspSha256'],'distributionQspSha256':prep['distributionQspSha256'],'restored22TextExcluded':12,'files':patchrows,'manifestExcludesItself':True}
(S/'PATCH_MANIFEST_SHA256.json').write_text(json.dumps(patchmanifest,ensure_ascii=False,indent=2)+'\n','utf-8')
patchrows.append({'path':'PATCH_MANIFEST_SHA256.json','bytes':(S/'PATCH_MANIFEST_SHA256.json').stat().st_size,'sha256':digest(S/'PATCH_MANIFEST_SHA256.json')})
assert not OUT.exists(),'Preserve previous outputs';OUT.mkdir()
delta=OUT/'JO9_2.4.2_UpdateOnly_20261115.zip';full=OUT/'JO9_2.4.2_Kor_Full_20261115.zip'
def write_file(z,p,name,expected):
 assert safe(name) and not p.is_symlink() and not p.is_junction(),name
 assert p.stat().st_size==expected['bytes'],name
 h=hashlib.sha256()
 with p.open('rb') as src,z.open(name,'w',force_zip64=True) as dst:
  for b in iter(lambda:src.read(1024*1024),b''):h.update(b);dst.write(b)
 assert h.hexdigest()==expected['sha256'],'Source changed: '+name
with zipfile.ZipFile(delta,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for row in patchrows:write_file(z,S/row['path'],row['path'],row)
print('Update-only ZIP written',flush=True)
combined={r['path']:dict(r) for r in base['files'] if r['path']!='PACKAGE_MANIFEST_SHA256.json'};combined.update({r['path']:dict(r) for r in patchrows})
fullmanifest={'version':'2.4.2','date':'2026-11-15','construction':'verified 2.4.2 r2 Full + byte-identical UpdateOnly files','qspSha256':prep['distributionQspSha256'],'files':sorted(combined.values(),key=lambda r:r['path']),'manifestExcludesItself':True,'gameValidationReused':str(gatePath)}
mf=T/'PACKAGE_MANIFEST_SHA256.json';mf.write_text(json.dumps(fullmanifest,ensure_ascii=False,indent=2)+'\n','utf-8');combined['PACKAGE_MANIFEST_SHA256.json']={'path':'PACKAGE_MANIFEST_SHA256.json','bytes':mf.stat().st_size,'sha256':digest(mf)}
overlay={r['path'] for r in patchrows};start=time.time()
with zipfile.ZipFile(full,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
 z.writestr(FULL+'/game/save/',b'')
 for i,(rel,row) in enumerate(sorted(combined.items()),1):
  p=mf if rel=='PACKAGE_MANIFEST_SHA256.json' else S/rel if rel in overlay else BASE/rel
  write_file(z,p,FULL+'/'+rel,row)
  if i%5000==0:print(f'Full written and source-hash checked {i}/{len(combined)} ({time.time()-start:.0f}s)',flush=True)
print('Full ZIP written; checking both archives once',flush=True)
def verify(zpath,rows,prefix=''):
 expected={prefix+r['path']:r for r in rows};seen=set();verified=0
 with zipfile.ZipFile(zpath) as z:
  for info in z.infolist():
   assert safe(info.filename),info.filename;key=info.filename.casefold();assert key not in seen;seen.add(key)
   if info.is_dir():assert info.filename==FULL+'/game/save/';continue
   assert info.filename in expected,info.filename;row=expected.pop(info.filename);assert info.file_size==row['bytes'];h=hashlib.sha256()
   with z.open(info) as f:
    for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
   assert h.hexdigest()==row['sha256'],info.filename;verified+=1
   if verified%10000==0:print(f'Archive verified {verified}: {zpath.name}',flush=True)
  assert not expected
 return {'path':str(zpath),'bytes':zpath.stat().st_size,'sha256':digest(zpath),'files':verified,'allEntryCRC':True,'allEntrySHA256':True,'safePaths':True,'caseInsensitiveDuplicatePaths':0}
pd=verify(delta,patchrows);pf=verify(full,list(combined.values()),FULL+'/')
assert all(combined[r['path']]['sha256']==r['sha256'] for r in patchrows)
assert all(combined[p]['sha256']==next(r['sha256'] for r in prep['files'] if r['path']==p) for p in inv['mandatoryAliasPaths'])
for name,j in [('update-only-manifest.json',patchmanifest),('full-package-manifest.json',fullmanifest)]: (D/name).write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n','utf-8')
assert digest(W/'jack.qsp')==prep['workQspSha256'];proof=load(D/'qa-save-proof.json');assert digest(Path(proof['source']))==proof['sourceSha256']
for row in inv['selectedFiles']:
 if row['path'] in prep['excludedLocalFiles']:continue
 assert digest(W/row['path'][5:])==row['sha256'],'WORK changed after freeze: '+row['path']
result={'date':'2026-11-15','full':pf,'updateOnly':pd,'gameGate':'PASS','gameGateRun':str(gatePath),'gameTestsRepeatedForPackaging':False,'sharedQspSha256':prep['distributionQspSha256'],'sameOverlayInFullAndPatch':True,'updateOnlyRuntimeFiles':len(runtime),'unchangedAliasesFromBase':23,'22RestoredTextAssignmentsExcluded':12,'psyStateFixRetained':True,'workQspUnchanged':True,'sourceSaveUnchanged':True,'oldFullUnchanged':True,'uploaded':False,'committed':False}
for j in [pd,pf]:Path(j['path']+'.sha256').write_text(j['sha256']+'  '+Path(j['path']).name+'\n','ascii')
(OUT/'PACKAGE_RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8');(D/'package-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')
shutil.copy2(S/'PATCH_NOTES_KO.html',OUT/'PATCH_NOTES_KO.html');shutil.copy2(S/'README_KO.txt',OUT/'README_KO.txt')
print(json.dumps(result,ensure_ascii=False),flush=True)
