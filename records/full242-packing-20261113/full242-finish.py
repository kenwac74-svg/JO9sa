import pathlib,json,shutil,hashlib,gzip,os
R=pathlib.Path('G:/somi/JO9sa');D=R/'records/full242-packing-20261113';T=pathlib.Path('G:/Codex/tmp/full242-packing-20261113');GATE=pathlib.Path('G:/Codex/tmp/full242-release-gate-20261113');OUT=pathlib.Path('G:/somi/JO9_2.4.2_Full_20261113');S=OUT/'JO9_2.4.2_Kor_Full';A=OUT/'announcement-assets';C=pathlib.Path.cwd()
def read(p):return json.loads(p.read_text('utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n','utf-8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
arc=read(D/'archive-verification.json');manifest=read(D/'final-package-manifest.json');assert arc['verdict']=='PASS' and arc['allEntryCRC'] and arc['completeExtractionHashes']
assert sha(S/'game/jack.qsp')==manifest['qspSha256']==sha(pathlib.Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'))
extracted=T/'verified-extraction/JO9_2.4.2_Kor_Full/game';startup=read(extracted/'client-results.json');assert startup[0]['pass'];write(D/'extracted-start-verification.json',{'pass':True,'entry':'Unchanged Start reaches original first-run warning; completion appended only to warning/main_menu in separate diagnostic QSP.','initialTimeoutReason':'Main-menu-only completion could not be reached before normal first-run warning. No application error observed.','engine':'Extracted engine/jack.exe','sourceQspUnmodified':True,'result':startup})
for name in ['client-results.json','patch-replay.log','patch-reapply.log','client-runner.log']:
 p=GATE/'run-TCBn7C'/('client' if name=='client-results.json' else '')/name
 if p.exists():shutil.copy2(p,D/('final-gate-'+name))
for run in ['run-55lpO9','run-X22RZV']:
 p=GATE/run/'report.json'
 if p.exists():shutil.copy2(p,D/(run+'-report.json'))
for name in ['01_character_remaster.png','02_save_compatibility.png','03_saved_draft.png','saved-draft-verification.json']:shutil.copy2(C/'announcement-shots'/name,A/name)
draft=read(A/'saved-draft-verification.json');assert draft['dohna'] and draft['hassa'] and draft['placeholders'] and draft['reloadConfirmed'];write(D/'announcement-verification.json',draft)
for p in C.glob('full242*'):
 if p.is_file() and p.suffix in {'.py','.cjs'}:shutil.copy2(p,D/p.name)
notes={
 'R07':('완료·화면 전수 제외','최종 런타임 원장과 배포 사본 일치. 마지막6초상은 사용자 지시로 복사만 수행, 별도 이미지 재검사 생략.'),
 'R08':('보존 완료','옛 자원 주소와 호환 파일 유지. 별도 퇴역·정리 미실행.'),
 'R10':('완료','실행기·엔진·DLL·폰트·라이선스와2.4.2창제목·README·호환안내 동봉. 재추출 엔진 초기 실행 확인.'),
 'R12':('기록 대조 완료','기존 계보 감사와 최종 수정 패치의 재생·멱등·9엔진 경로 확인. 모든 동작 분기 전수 검사와 구분.'),
 'R13':('범위 동결 완료','현재 승인 WORK 전체 런타임을 동결. 기획 보류를 재개하지 않았고 도구·개인자료는 배포 제외.'),
 'R14':('동봉 완료·청감 전수 제외','현재 게임 음원은 Full에 포함. 음원 Git추적·업로드와 자원 정리·이동 없음. 전체 청감·루프 전수 검사는 별도.'),
 'R15':('범위 확인·한계 기록','실제 구세이브 UI복원과 호환 도구 화면 확인. 요청6초상 재검사 생략. 모든 컷신·화면을 전수 확인한 것은 아님.'),
 'R16':('완료','43,288파일+빈save폴더1개. 전 파일 명세·해시와 단일 ZIP64 동결.'),
 'R17':('지정 회귀 완료','기능별 기존 검사 기록 유지. 최종 시루 활성/비활성/타상품 경로와 실제 엔진9경로 및 호환 도구17회귀 통과. 모든 게임 분기 전수 아님.'),
 'R18':('완료','사용자 확정2.4.1 일반 화면 저장 지원. 동일ID/옛기본이름·기본이미지 및 허용 자원 주소만 변환, 사용자 작명·숫자·육성·진행·CRC 보존.'),
 'R19':('완료','독립 EXE·17검사·실제 약50MB SAV왕복/14참조변환·반복0개/바이트일치·실제 Load→새이름저장→재Load 확인. 원본 보존.'),
 'R20':('완료','최종 QSP62a5f282… 공식 출고PASS. 구조/CRLF/JSON/재생·멱등·원본보존/9실행경로·배포사본 대조.'),
 'R21':('완료','새 이름 Full/ZIP생성. 기존 Kor_Full·원본·개인세이브 보존. 재추출 새경로 엔진 초기실행 통과.'),
 'R22':('완료','ZIP전항목 CRC·전체 재추출 파일 SHA-256 통과. 위험경로0·중복0·개인SAV0·모드툴0.'),
 'R23':('완료','유저용8대분류43항목·초상53카드와 힌트식 설명. 개발원장 별도 보존. 도나23설정·하사보상 명시. 캐릭터리마스터/3인 이미지 미변경 안내.'),
 'R24':('준비·임시저장 완료','배포파일 전달 준비 및 소미소프트 공지 초안 임시저장·재로드 보존 확인. 다운로드/릴리즈노트/이미지 첨부 자리표시. 공개·업로드는 사용자 작업.')}
p=R/'records/release-prep-20261113/checklist.json';j=read(p);j.update(asOf='2026-11-14',sourceQspSha256=manifest['qspSha256'],phase='package-verified-draft-saved',activeItem=None,packaged=True,migrationImplemented=True,published=False,waitingForUser=False,currentDiscussion=None)
for item in j['items']:
 if item['id'] in notes:item.update(status=notes[item['id']][0],result=notes[item['id']][1],notes=notes[item['id']][1],checkedAt='2026-11-14',report='records/full242-packing-20261113/PACKING_REPORT_KO.md')
j['history'].append({'date':'2026-11-14','item':'R07-R24/Q06','decision':'사용자2.4.2 Full포장·2.4.1일반저장 지원 및 자율마무리·공지임시저장','result':'ZIP전수검증PASS·공식9경로PASS·실제세이브UI로드저장재로드·공지초안저장','next':'사용자 파일/릴리즈노트 업로드 및 공개'});write(p,j)
p=R/'records/release-night-preflight-20261113/approval-queue.json';q=read(p)
for item in q['queue']:
 if item['id']=='Q06':item.update(status='완료',decision='2.4.1 일반 화면 저장 지원',result='도구 구현·실제UI불러오기/새이름저장/재불러오기 완료',report='records/full242-packing-20261113/save-compat-verification.json')
q['next']=None;q['sourceQspSha256']=manifest['qspSha256'];write(p,q)
p=R/'docs/release-prep/2026-11-13/RELEASE_NOTES_CHECKLIST_KO.md';md=p.read_text('utf-8');lines=md.splitlines()
for i,line in enumerate(lines):
 if line.startswith('| ['):
  parts=line.split('|');key=next((k for k in notes if (' '+k+' ') in parts[1]),None)
  if key:parts[1]=' [x] '+key+' ';parts[2]=' '+notes[key][0]+' ';parts[-2]=' '+notes[key][1]+' ';lines[i]='|'.join(parts)
md='\n'.join(lines)+'\n';p.write_text('''## 2026-11-14 최종 포장·공지 준비 결과

2.4.2 Full 생성 완료. 43,288파일, 약16.1GB ZIP64의 전항목CRC·전체재추출SHA가 통과했고, 최종 엔진9경로와 재추출 초기실행을 확인했다. Q06은2.4.1 일반화면 저장 지원으로 확정·구현했으며 실제UI 로드/새이름저장/재로드까지 확인했다. 개인SAV·모드툴은 미동봉, 음원은 게임용으로만 동봉했다. 공개 업로드·커밋·푸시·옛Kor_Full 수정은 하지 않았다.

[최종 포장 기록](../../../records/full242-packing-20261113/PACKING_REPORT_KO.md) · [유저용 릴리즈노트](../../release/2.4.2-player-20261113/RELEASE_NOTES_KO.html). 아래의 초기 초안과 수치는 당시 이력이다. 현재 판정은 이 문단과 갱신된 체크 행을 우선한다.

'''+md,'utf-8')
plan=R/'docs/superpowers/plans/2026-11-13-full242-packing.md';plan.write_text(plan.read_text('utf-8').replace('- [ ]','- [x]')+'\nCompleted2026-11-14. Tests and one scoped review passed; branch kept as-is, no commit/push/upload. User-specified draft saved, uploads left as placeholders.\n','utf-8')
report=f'''# JO9 2.4.2 Full 최종 포장

2026-11-14. 사용자 승인으로 새 배포 폴더와 ZIP을 만들고 소미소프트 공지 초안을 임시저장했다.

- ZIP: {arc['archive']}
- 크기: {arc['archiveBytes']:,} bytes. 게임/안내/호환 도구43,288파일과 빈game/save폴더1개.
- SHA-256: {arc['sha256']}
- 최종QSP: {manifest['qspSha256']}
- 유저 노트: docs/release/2.4.2-player-20261113. 8대분류43항목·초상53카드. 개발 상세는 docs/release/2026-11-13에 분리.
- 마지막 반영: 춘향 재개장 소문, 시루 구매 초상, 도나23설정·하사보상 안내, 사용자 교체6초상(이미지 재검사 생략).

공식 출고9경로·패치재생/멱등·구조/CRLF/등록부·배포QSP대조PASS. ZIP모든항목CRC·전체재추출SHA·안전경로·중복검사PASS. 재추출 엔진의 원래Start→첫경고화면 초기실행PASS(별도 진단 사본에 완료표시만 추가). 최초메인메뉴전용 표식은 정상첫경고이동으로 도달하지 않아 실패기록을 남기고 도착점을 수정해 검사했다.

세이브는2.4.1 전투밖 일반화면 저장 지원. 도구17검사, 실제약50MB파일의 원시왕복일치·14자원참조변환·숫자/인덱스/CRC/원본보존, 독립EXE 반복0개/바이트일치, 실제Game>Load→새이름저장→재Load를 확인했다. 기존 버전호환 옵션을 사용했으며 옛CRC 엄격검사 통과를 주장하지 않는다. GUI진단은Start만 바꾼 사본이고 다른 로케이션은 최종본과 같았다. 모든세이브·퀘스트·화면을 전수검사한 것은 아니다.

독립 검토1회에서 CLI --report의 경로충돌 덮어쓰기를 찾아 사전경로검사·배타적생성으로 수정했다. 실패재현 후17검사와 최종EXE재검사PASS. 추가 중대발견0.

공지 초안: {draft['url']}
임시저장 성공표시와 새로고침 후3316자본문/11소제목/도나·하사·첨부자리표시 보존 확인. 게시/파일업로드/릴리즈노트업로드는 하지 않았다. announcement-assets에 포트레이트 모음·호환도구 스크린샷·저장화면·오프라인 미리보기를 준비했다.

기존Kor_Full·원본·개인세이브를 덮지 않았다. 음원은 게임에 동봉했고 Git업로드/커밋/푸시는 하지 않았다. 옛자원 경로도 유지했다. 일반창/컷신 전체전수·청감전수와 재발대기중 화면잔상은 완료로 바꾸지 않았다. 현재젖소녀F인 다재다능 보유는 영구칭호 유지가 가능하며, 사진만으로 신규오부여 이력을 단정하지 않았다.
'''
(D/'PACKING_REPORT_KO.md').write_text(report,'utf-8');(OUT/'PACKING_REPORT_KO.md').write_text(report,'utf-8')
index=R/'docs/SESSION_HANDOFF_INDEX.md';index.write_text('''## 2026-11-14 2.4.2 Full 포장 완료·공지 임시저장

[최종 기록](../records/full242-packing-20261113/PACKING_REPORT_KO.md) · [유저용 노트](release/2.4.2-player-20261113/RELEASE_NOTES_KO.html). 43,288파일/약16.1GB, ZIP전항목CRC·재추출SHA·공식9경로·재추출초기실행PASS. 세이브도구17검사와2.4.1일반화면SAV 실제UI로드/새저장/재로드 확인. 공지 초안 저장·새로고침 보존. 업로드·공개는 사용자. 커밋푸시/옛Full변경/음원Git업로드 없음. 최신QSP62a5f282… .

'''+index.read_text('utf-8'),'utf-8')
print(json.dumps({'package':'PASS','files':arc['fileCount'],'draftSaved':True,'uploadPerformed':False,'report':str(D/'PACKING_REPORT_KO.md')},ensure_ascii=False))

# Remove only this run's reproducible diagnostics after retaining source and compact records.
removed=[]
for name in ['content','json','css','fonts']:
 p=T/'load-probe'/name
 if p.is_junction():
  if p.resolve()!=(S/'game'/name).resolve():raise RuntimeError('Unexpected junction target '+str(p))
  os.rmdir(p);assert (S/'game'/name).is_dir();removed.append(str(p))
def clear_owned(root):
 if root.resolve()!=root or not root.resolve().is_relative_to(pathlib.Path('G:/Codex/tmp').resolve()):raise RuntimeError('Unsafe cleanup root')
 stack=[root]
 while stack:
  for p in stack.pop().iterdir():
   if p.is_symlink() or p.is_junction():raise RuntimeError('Unexpected link retained '+str(p))
   if p.is_dir():stack.append(p)
 shutil.rmtree(root);removed.append(str(root))
for root in [T,GATE]:
 if root.exists():clear_owned(root)
backup=pathlib.Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp.bak_20261114_000835')
if backup.exists() and backup.read_bytes()==gzip.decompress((D/'jack.before-shiru-icon.qsp.gz').read_bytes()):backup.unlink();removed.append(str(backup))
for p in C.glob('full242*'):
 if p.is_file() and p.suffix in {'.py','.cjs'} and (D/p.name).exists():p.unlink()
for name in ['save242.py','test_save242.py','save242-rules.json']:
 p=C/name
 if p.exists() and p.read_bytes()==(R/'tools/save-compatibility242'/name).read_bytes():p.unlink()
shots=C/'announcement-shots'
if shots.is_dir() and {p.name for p in shots.iterdir()}=={'01_character_remaster.png','02_save_compatibility.png','03_saved_draft.png','saved-draft-verification.json'}:shutil.rmtree(shots)
cache=C/'__pycache__'
if cache.exists():
 for p in cache.glob('save242.cpython-*.pyc'):p.unlink()
 if not list(cache.iterdir()):cache.rmdir()
write(D/'cleanup.json',{'removed':removed,'oldFullPreserved':True,'personalSavesPreserved':True,'finalStageAndZipPreserved':True,'announcementAssetsPreserved':True,'unknownLinksFollowed':False});print('Owned temporary diagnostics cleaned',flush=True)
