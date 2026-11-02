import hashlib,json,os,shutil
from pathlib import Path
from datetime import datetime,timezone
P=Path(__file__).resolve().parent
W=Path('G:/somi/Jack O Nine Tails v2.4_work/game');F=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full')
R=Path('G:/somi/JO9sa/records/build-2.4.1-20261101');K=Path('K:/doing/JO9_trash/build-2.4.1-20261101')
T=Path('G:/Codex/tmp/build-2.4.1-20261101');GATE=next(Path('G:/Codex/tmp/build-241-release-verified-20261101').glob('run-*'))
def sha(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def no_links(p):
    for v in [p,*p.parents]:
        if v.exists():assert not getattr(v.lstat(),'st_file_attributes',0)&0x400,v
def archive(src,rel):
    assert src.is_relative_to(F) or src.is_relative_to(W),src
    dst=K/rel;no_links(src);no_links(dst);assert not dst.exists()
    dst.parent.mkdir(parents=True,exist_ok=True);h=sha(src);s=src.stat();shutil.copy2(src,dst)
    assert sha(dst)==sha(src)==h and src.stat().st_mtime_ns==s.st_mtime_ns
    entry={'source':str(src),'destination':str(dst),'bytes':s.st_size,'sha256':h}
    with (K/'moves.jsonl').open('a',encoding='utf-8') as stream:stream.write(json.dumps(entry,ensure_ascii=False)+'\n');stream.flush();os.fsync(stream.fileno())
    src.unlink();return entry
gate=json.loads((GATE/'report.json').read_text(encoding='utf-8'));assert gate['verdict']=='PASS'
native=json.loads((T/'credits-probe/client-results.json').read_text(encoding='utf-8-sig'));assert len(native)==1 and native[0]['pass']
prep=json.loads((P/'prepared.json').read_text(encoding='utf-8'));assert sha(W/'jack.qsp')==sha(F/'game/jack.qsp')==prep['after']
oldmanifest=json.loads((F/'BUILD_MANIFEST.json').read_text(encoding='utf-8'));assert oldmanifest['qspSha256']==prep['before']
moves=[];texts={}
readme=(F/'README_KO.txt').read_text(encoding='utf-8');assert readme.count('올걸팩 smsfbatalovehandle / 인디 이미지팩 PSP_PSP')==1
texts['README_KO.txt']=readme.replace('Jack O Nine Tails 2.4 한국어판','Jack O Nine Tails 2.4.1 한국어판',1).replace('올걸팩 smsfbatalovehandle / 인디 이미지팩 PSP_PSP','올걸팩 smsfbatalovehandle\nPSP_PSP : 인디패치 원작자\nzonezizone : 잭오나 플레이 실황\n콤콤삼촌 : 허셀2이미지 제공')
changelog=(F/'CHANGELOG_KO.md').read_text(encoding='utf-8');texts['CHANGELOG_KO.md']=changelog.replace('[신규 업데이트]\n','[신규 업데이트]\n\n- 게임 버전을 2.4.1로 갱신하고 제작진 감사 목록을 보완했습니다.\n',1)
playtest=(F/'PLAYTEST_KO.md').read_text(encoding='utf-8');texts['PLAYTEST_KO.md']=playtest.replace('새 게임의 첫 화면과 저장·불러오기 메뉴가 열리는지 확인합니다.','창 제목의 2.4.1 표기와 제작진 감사 목록의 세 항목을 확인하고, 새 게임의 첫 화면과 저장·불러오기 메뉴가 열리는지 확인합니다.',1)
texts['VALIDATION_KO.md']=f'''# 2.4.1 ZIP 압축 전 점검 결과

2026-11-01 최신 WORK와 배포본의 QSP는 SHA256 `{prep['after']}`로 일치합니다. ZIP은 만들지 않았습니다.

- 버전 표기와 창 제목을 2.4.1로 갱신하고 요청한 제작진 감사 항목 세 개를 추가했습니다. 게임의 수치·경로·인물 식별자·세이브 구조는 바꾸지 않았습니다.
- 현재 2.4.1 QSP의 구조·줄바꿈·인물 등록·실제 패치 재현과 재적용 검사를 통과했습니다. 동봉 엔진의 필수 실행 경로 아홉 개도 모두 통과했습니다.
- 실제 credits 로케이션을 실행해 2.4.1 표기, 요청한 세 줄, 기존 제작진 보존과 중복 없음 등 열 개 판정을 통과했습니다. 화면 배치의 육안 확인과는 구분합니다.
- 직전 통합 준비본에서 주요 과거 오류에 대한 격리 엔진 검사 여섯 개·301판정, 정적 점검 16항목, JSON 1,156개·JavaScript 세 개 검사를 수행했습니다. 이번에는 버전·감사 문구와 관련 배포 문서만 변경했습니다. 앞선 301판정을 이번에 다시 수행했다고 계산하지 않습니다.
- 기존의 게임 경로와 호환 파일, 공개 TC 세이브 일곱 개를 유지했습니다. 개인 저장과 제작 원화·도구·진단 사본을 추가 배포하지 않았습니다.

개인 세이브의 GUI 불러오기·저장된 스크립트 전체 복원, 모든 화면·퀘스트·무작위 결과를 전부 검사한 것은 아닙니다. PLAYTEST_KO.md에 수동 점검 순서를 남겼습니다. 워크숍·Show HTML, 마법낙인 재현, 검은 잔상과 장기 임신 제보 등 기존 보류사항은 해결 완료로 표시하지 않습니다.
'''
for name,text in texts.items():
    moves.append(archive(F/name,'full-before/'+name));(F/name).write_text(text,encoding='utf-8');(P/name).write_text(text,encoding='utf-8')
for parent,label in [(W,'work-auto-backup'),(F/'game','full-auto-backup')]:
    candidates=list(parent.glob('jack.qsp.bak_20261101_*'));assert len(candidates)==1,candidates
    assert sha(candidates[0])==prep['before'];moves.append(archive(candidates[0],label+'/'+candidates[0].name))
changed={'game/jack.qsp','game/config.xml',*texts.keys()};manifest=oldmanifest.copy();manifest['version']='2.4.1';manifest['buildNumber']='2.4.1';manifest['preparedUtc']=datetime.now(timezone.utc).isoformat();manifest['qspSha256']=prep['after'];manifest['thanks']=[{'name':'PSP_PSP','role':'인디패치 원작자'},{'name':'zonezizone','role':'잭오나 플레이 실황'},{'name':'콤콤삼촌','role':'허셀2이미지 제공'}]
manifest['validation']['priorBaselineQspSha256']=prep['before'];manifest['validation']['historicalChecksScope']='Previous pre-ZIP baseline; not rerun for this display-only build update.';manifest['validation']['creditsNativeAssertions']=10
for row in manifest['files']:
    p=F/row['path']
    if row['path'] in changed:row.update(bytes=p.stat().st_size,sha256=sha(p))
    assert p.is_file() and sha(p)==row['sha256'],row['path']
assert sha(W/'config.xml')==sha(F/'game/config.xml')==prep['configs'][0]['afterSha256']
actual={p.relative_to(F).as_posix() for p in F.rglob('*') if p.is_file()};expected={r['path'] for r in manifest['files']}|{'BUILD_MANIFEST.json'};assert actual==expected,(actual-expected,expected-actual)
manifest['payloadBytesExcludingManifest']=sum(r['bytes'] for r in manifest['files'])
moves.append(archive(F/'BUILD_MANIFEST.json','full-before/BUILD_MANIFEST.json'));dump(F/'BUILD_MANIFEST.json',manifest)
dump(P/'BUILD_MANIFEST.json',manifest);dump(K/'ARCHIVE_MANIFEST.json',{'files':moves})
for name in ['report.json','report.md','client-runner.log','patch-replay.log','patch-reapply.log']:shutil.copy2(GATE/name,P/('release-'+name))
shutil.copy2(T/'credits-probe/client-results.json',P/'credits-native-result.json')
delivery={'version':'2.4.1','full':str(F),'work':str(W),'qspSha256':prep['after'],'manifestSha256':sha(F/'BUILD_MANIFEST.json'),'filesIncludingManifest':len(manifest['files'])+1,'bytesIncludingManifest':manifest['payloadBytesExcludingManifest']+(F/'BUILD_MANIFEST.json').stat().st_size,'changedPayloadFiles':sorted(changed),'mandatoryNativePaths':9,'creditsNativeAssertions':10,'zipCreated':False,'runtimePathsReorganized':False,'saveSchemaChanged':False,'backup':prep['backup'],'archive':str(K)}
dump(P/'DELIVERY.json',delivery)
report=f'''# 2.4.1 빌드 번호·감사 목록 반영

WORK와 이번 Full 준비본을 함께 갱신했습니다. QSP SHA256: {prep['after']}.

- 게임 창 제목과 QSP 버전 표시 11곳을 2.4.1로 변경했습니다. 폴더 이름과 게임 리소스 경로는 유지했습니다.
- PSP_PSP : 인디패치 원작자 / zonezizone : 잭오나 플레이 실황 / 콤콤삼촌 : 허셀2이미지 제공을 감사 목록에 넣었습니다. 기존 원작자·한글판·smsfbatalovehandle·SAnk 문구는 보존했습니다.
- 게임 숫자·조건·인물 ID·저장 구조를 변경하지 않았고 init_game의 game_version=0도 유지했습니다. $code_rev는 기존 저장 불러오기 갱신 경로에서 새 표기를 사용합니다.
- 현재 빌드의 필수 엔진 아홉 경로, 패치 재현·재적용, 실제 크레딧 출력 열 개 판정을 통과했습니다. 전체 배포 파일을 갱신한 매니페스트와 다시 해시 대조했습니다.
- 최초 출고 진단은 이전 버전의 공개 TC 상태가 정상 업데이트 안내를 띄워 멈췄습니다. 실제 게임의 업데이트 안내는 수정하지 않았습니다. 공개 원본 SAV를 보존하고, 격리 사본의 $GAME_VER[0]만 현재 빌드로 맞춰 일상 실행 아홉 경로를 다시 검사했습니다. 이 결과를 실제 GUI 세이브 마이그레이션 검사로 표현하지 않습니다.
- README·릴리즈 노트·수동 점검·검사 결과·Full 매니페스트를 함께 갱신했습니다. 앞선 회귀 301판정은 이전 통합 준비본의 기록이며 이번에 재실행했다고 표시하지 않았습니다.
- ZIP·커밋·푸시는 하지 않았습니다. 자동 백업과 교체 전 문서는 K 보관 원장, 원본 QSP의 압축 백업은 {prep['backup']}에 있습니다.

화면 글자 배치와 모든 개인 세이브 불러오기는 별도 수동 확인 범위입니다. 기존 보류사항은 바꾸지 않았습니다.
'''
(P/'REPORT_KO.md').write_text(report,encoding='utf-8')
R.mkdir(parents=True,exist_ok=False)
for src in P.iterdir():
    if src.is_file():shutil.copy2(src,R/src.name)
print(json.dumps(delivery,ensure_ascii=True),flush=True)
