import os,json,hashlib,time,shutil
from pathlib import Path
W=Path('G:/somi/Jack O Nine Tails v2.4_work');F=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full');R=Path('G:/somi/JO9sa/records/final-prezip-20261102');A=Path('K:/doing/JO9_trash/final-prezip-20261102/documents')
def sha(p):
 with p.open('rb') as s:return hashlib.file_digest(s,'sha256').hexdigest()
def put(p,s):
 if p.exists():
  b=A/p.parent.name/p.name;b.parent.mkdir(parents=True,exist_ok=True)
  if not b.exists():shutil.copy2(p,b)
 p.write_text(s,encoding='utf8')
sync=json.loads((R/'sync-result.json').read_text(encoding='utf8'));release=json.loads((R/'release-report.json').read_text(encoding='utf8'));exe=json.loads((R/'direct-exe.json').read_text(encoding='utf-8-sig'))
assert release['verdict']=='PASS' and len(release['client']['probes'])==9 and exe['pass']
assert sha(W/'game/jack.qsp')==sha(F/'game/jack.qsp')==sync['qspSha256']
validation=f'''# 2.4.1 最終 배포 점검

2026-11-02 최신 WORK 반영 완료. ZIP은 생성하지 않았습니다.

- WORK/Full QSP SHA-256 일치: {sync['qspSha256']}
- 최신 런타임과 HTML {sync['runtimeFiles']:,}개 전체 해시 대조 완료, 기존 호환 파일 9개 유지.
- 최종 실제 배포 엔진 9경로 PASS. QSP 구조·줄/주석 경계·정확 패치 재생·재적용과 인물 JSON 등록 검사 PASS.
- 루트 Jack-o-nine-tails.exe 직접 실행으로 2.4.1 게임 창의 응답을 확인했습니다. CMD 실행은 필수가 아닙니다.
- 한·영 HTML은 각 10개 축소 이미지를 포함한 오프라인 단독 문서입니다.
- 공개 테스트 세이브 TC_01~10 포함. 개인 세이브·개발 도구·원화·백업은 포함하지 않았습니다.

실제 GUI 저장 불러오기·모든 퀘스트 완주·전체 이미지의 육안 품질까지 자동 검증한 것은 아닙니다. PLAYTEST_KO.md의 짧은 확인 경로를 이용하세요.
'''.replace('最終','최종')
put(F/'VALIDATION_KO.md',validation)
new='''[신규 업데이트]
- 공개 경매 지급 상한을 쉬움·보통에서는 해제하고, 하드코어의 공제 내역을 결과 화면에 안내합니다.
- 튜토리얼을 최신 공통 UI로 갱신하고, 가디언·팔라딘 소개 및 최신 이미지를 반영했습니다.

[버그 수정]
- 콜로세움 챔피언 결과에서도 상금 증액과 결과·상금 안내 통합이 적용되도록 수정했습니다.
- 챔피언 후속 장면과 일부 이미지 연결 누락을 보완했습니다.

'''
for root in (W,F):
 p=root/'CHANGELOG_KO.md';old=p.read_text(encoding='utf8')
 if '공개 경매 지급 상한을 쉬움·보통에서는 해제' not in old:put(p,new+old)
runtime=json.loads((R/'runtime-manifest.json').read_text(encoding='utf8'))['files']
for name in ('JO9_2.4.1_업데이트안내.html','JO9_2.4.1_Update_Guide_EN.html'):
 runtime[name]={'sha256':sha(F/name),'bytes':(F/name).stat().st_size,'mtime_ns':(W/name).stat().st_mtime_ns}
for rel,row in runtime.items():
 st=(W/rel).stat();assert(st.st_size,st.st_mtime_ns)==(row['bytes'],row['mtime_ns']),'WORK edited during release: '+rel
 assert (F/rel).stat().st_size==row['bytes']
allowed=set(runtime)|{x['path'] for x in sync['fullOnlyKept']};files=[];unexpected=[]
for d,ds,ns in os.walk(F,followlinks=False):
 for n in ds:
  assert not((Path(d)/n).lstat().st_file_attributes&0x400),'External junction in distribution'
 for n in ns:
  p=Path(d)/n;rel=p.relative_to(F).as_posix()
  if rel=='BUILD_MANIFEST.json':continue
  assert not(p.lstat().st_file_attributes&0x400)
  if rel in runtime:h=runtime[rel]['sha256']
  else:
   h=sha(p)
   if rel not in allowed and '/' in rel and not(rel.startswith('game/save/TC_') and rel.endswith('.sav')) and rel not in ('game/FastQSP.ini','game/engine/FastQSP.ini'):unexpected.append(rel)
  files.append({'path':rel,'bytes':p.stat().st_size,'sha256':h})
assert not unexpected,unexpected
saves=[x for x in files if x['path'].startswith('game/save/')];assert len(saves)==10
manifest={'schema':3,'preparedUtc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'version':'2.4.1','state':'READY_TO_ZIP','zipCreated':False,'qspSha256':sync['qspSha256'],'workAuthoritative':True,'runtimeFiles':len(runtime),'publicTestSaves':len(saves),'fullOnlyCompatibilityFiles':9,'payloadFilesExcludingManifest':len(files),'payloadBytesExcludingManifest':sum(x['bytes'] for x in files),'validation':{'verdict':'PASS','nativePaths':9,'normalExe':True,'guiVisualPlaytest':'user confirmation; see PLAYTEST_KO.md'},'files':files}
put(F/'BUILD_MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
(R/'FINAL_RESULT.json').write_text(json.dumps({k:v for k,v in manifest.items() if k!='files'}|{'destination':str(F),'changedRuntimeFiles':len(sync['changed']),'previousBytesArchivedAt':str(A.parent),'workQspMatchesFull':True},ensure_ascii=False,indent=2),encoding='utf8')
report=f'''# 2.4.1 압축 직전 최종 결과

{F} — READY_TO_ZIP. 최신 WORK 변경 48개와 한·영 HTML·README·수동 테스트 안내를 반영했다. 경로 재배치나 ZIP 생성은 하지 않았다.

QSP: {sync['qspSha256']} (WORK/Full 일치).
런타임/HTML {len(runtime):,}개 해시 대조, 호환 9개 유지, 공개 SAV 10개. 총 {len(files):,}파일 + BUILD_MANIFEST.json, {sum(x['bytes'] for x in files):,}바이트(매니페스트 제외).

실제 배포 엔진 공식9경로·구조/경계·패치 재생 PASS. 루트 일반 EXE→동봉 엔진→2.4.1 창 응답 확인. 최초 EXE 점검은 부모 런처의 창만 확인하는 검사기 오류였으며 실제 게임 자식 프로세스를 확인해 정정했다. 생산 파일 오류가 아니므로 실행 파일을 수정하지 않았다.

원화·개인 SAV·도구·백업 제외. 기존 Full 변경 전 파일은 {A.parent}에 보존했다. 경로 정리는 수행하지 않았다. 실제 GUI 저장파일 불러오기·그림 육안 품질·모든 이벤트 완주는 사용자의 PLAYTEST_KO.md 확인 범위다. 커밋·푸시·ZIP 생성 없음.
'''
(R/'REPORT_KO.md').write_text(report,encoding='utf8')
h=Path('G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md')
with h.open('a',encoding='utf8') as f:f.write('\n## 2026-11-02 최종 배포 동기화 완료\n\n사용자의 압축 직전 준비 재개 지시로 WORK 최신48개 변경과 문서를 Kor_Full에 반영했다. [최종 결과](../records/final-prezip-20261102/REPORT_KO.md). QSP6cc70667… 양쪽 일치, 배포 엔진9경로·일반 EXE 실행 PASS. Full 상태 READY_TO_ZIP, 공개 TC10개, 한영 HTML 각10이미지. ZIP·커밋·푸시 없음. 이후 일반 작업은 별도 지시 없는 Full 자동 동기화 금지 원칙 유지.\n')
print(json.dumps({k:v for k,v in manifest.items() if k not in ('files','validation')},ensure_ascii=False))
