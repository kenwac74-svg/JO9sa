"""Final delivery verification, complete archive ledger and retained evidence.
Run after retire + owned diagnostic cleanup have completed.
"""
import hashlib,json,os,shutil,subprocess,time
from pathlib import Path
from datetime import datetime,timezone
from operations import HERE,WORK,FULL,TRASH,no_links,inside,sha
record=Path('G:/somi/JO9sa/records/full-prezip-20261101')
def load(n):return json.loads((HERE/n).read_text(encoding='utf-8-sig'))
assert load('archive-result.json')['files']==2095
assert load('diagnostic-cleanup.json')['junctionTargetsPreserved']
assert load('release-report.json')['verdict']=='PASS'
assert load('native-historical-report.json')['pass']
manifest=json.loads((FULL/'BUILD_MANIFEST.json').read_text(encoding='utf-8'))
expected={r['path']:r for r in manifest['files']}; seen=[];bad=[];start=time.monotonic()
for current,dirs,names in os.walk(FULL,followlinks=False):
    no_links(Path(current))
    for n in dirs:no_links(Path(current)/n)
    for name in names:
        p=no_links(Path(current)/name);rel=p.relative_to(FULL).as_posix()
        if rel=='BUILD_MANIFEST.json':continue
        assert rel in expected,f'Unexpected package file: {p}'
        row=expected[rel]
        if p.stat().st_size!=row['bytes'] or sha(p)!=row['sha256']:bad.append(rel)
        seen.append(rel)
        if len(seen)%10000==0:print(json.dumps({'finalPackageHashed':len(seen),'seconds':round(time.monotonic()-start,1)}),flush=True)
assert len(seen)==len(expected) and not bad
assert sha(FULL/'game/jack.qsp')==sha(WORK/'game/jack.qsp')==manifest['qspSha256']
source_changes=[]
for row in load('hashes-work.json')['files']:
    p=no_links(WORK/row['path']);s=p.stat()
    if s.st_size!=row['bytes'] or s.st_mtime_ns!=row['mtime_ns']:source_changes.append(row['path'])
assert not source_changes,source_changes
for row in load('move-ready-top-level.json')['entries']:assert not Path(row['source']).exists()
for row in load('sync-plan.json')['workLooseBackupArchiveCandidates']:assert not Path(row['source']).exists()
lines=[json.loads(s) for s in (TRASH/'operations.jsonl').read_text(encoding='utf-8').splitlines() if s.strip()]
removed=[r for r in lines if r['event']=='source_removed']
assert len({r['destination'].casefold() for r in removed})==len(removed)
verified={(r['source'],r['destination']):r for r in lines if r['event']=='archive_verified'}
entries=[]
for row in removed:
    key=(row['source'],row['destination']);assert key in verified
    prior=verified[key];dest=no_links(inside(Path(row['destination']),TRASH));s=dest.stat()
    assert s.st_size==row['bytes'] and prior['sha256']==row['sha256']
    entries.append({**row,'sourceMtimeNs':prior['sourceMtimeNs'],'destinationPresent':True,'copiedAndSha256ReadbackVerifiedBeforeSourceRemoval':True})
partials=[str(p) for p in TRASH.rglob('*.jo9_partial')];assert not partials,partials
summary={'scope':'ALL logged task archival relocations; includes retired packages, old WORK backups, overwritten Full/doc/encoding originals and owned diagnostic copies.','files':len(entries),'bytes':sum(r['bytes'] for r in entries),'allDestinationsPresent':True,'sha256ReadbackVerifiedBeforeEveryRemoval':True,'partialFiles':0,'entries':entries}
(TRASH/'ARCHIVE_MANIFEST.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(HERE/'complete-archive-manifest.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
shutil.copy2(HERE/'restore_archive.py',TRASH/'restore_archive.py')
dry=subprocess.run(['py','-3',str(TRASH/'restore_archive.py')],capture_output=True,text=True,encoding='utf-8',env={**os.environ,'PYTHONIOENCODING':'utf-8'})
assert dry.returncode==0,dry.stderr
restorable={'dryRunExit':dry.returncode,'wouldRestoreFiles':sum(s.startswith('WOULD_RESTORE ') for s in dry.stdout.splitlines()),'keepCurrentFiles':sum(s.startswith('KEEP_CURRENT ') for s in dry.stdout.splitlines()),'wouldRestoreDirectories':sum(s.startswith('WOULD_RESTORE_DIR ') for s in dry.stdout.splitlines()),'productionRestoresExecuted':False,'overwriteCurrentFiles':False}
(HERE/'restore-dry-run.json').write_text(json.dumps(restorable,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
final={'preparedUtc':datetime.now(timezone.utc).isoformat(),'state':'PRE_ZIP_READY_FOR_MANUAL_PLAYTEST','zipCreated':False,'full':str(FULL),'qspSha256':manifest['qspSha256'],'manifestSha256':sha(FULL/'BUILD_MANIFEST.json'),'fullPayloadFilesExcludingManifest':len(seen),'fullTotalFiles':len(seen)+1,'fullTotalBytes':sum(r['bytes'] for r in expected.values())+(FULL/'BUILD_MANIFEST.json').stat().st_size,'finalFullHashMismatches':bad,'workSnapshotChanges':source_changes,'runtimePathReorganization':False,'retiredArchiveFiles':2095,'retiredArchiveBytes':load('archive-result.json')['bytes'],'allArchivedFiles':summary['files'],'allArchivedBytes':summary['bytes'],'knownNativeLoaderFollowup':'Six corrected templates native loader initialization UNPROVEN; not included in native PASS counts.','initialGFreeBytes':78088122368,'initialKFreeBytes':3147525189632}
(HERE/'final-content-verification.json').write_text(json.dumps(final,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Retain the compact reports, complete usage proof, checksums and reproduction
# scripts. These are evidence, not duplicated game assets or diagnostic binaries.
record.mkdir(parents=True,exist_ok=False);no_links(record)
for src in HERE.rglob('*'):
    if not src.is_file() or '__pycache__' in src.parts:continue
    assert src.suffix.lower() not in {'.qsp','.sav','.png','.zip','.7z','.rar'},src
    target=inside(record/src.relative_to(HERE),record);target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,target);assert sha(src)==sha(target)
free_g=shutil.disk_usage('G:/').free;free_k=shutil.disk_usage('K:/').free
final.update(finalGFreeBytes=free_g,finalKFreeBytes=free_k,measuredGFreeIncreaseBytes=free_g-final['initialGFreeBytes'],record=str(record),trash=str(TRASH),recordBytes=sum(p.stat().st_size for p in record.rglob('*') if p.is_file()))
(HERE/'DELIVERY.json').write_text(json.dumps(final,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
shutil.copy2(HERE/'DELIVERY.json',record/'DELIVERY.json');shutil.copy2(HERE/'DELIVERY.json',TRASH/'DELIVERY.json')
report=(HERE/'REPORT_KO.md').read_text(encoding='utf-8')
report=report.replace('자동 출고 검사와 집중 회귀는 통과했다. 불필요한 과거 배포물·백업의 외부 이동은 **아직 진행 중**이므로, 실제 이동 완료 수와 확보 공간은 아래 PENDING으로 남긴다.','자동 출고 검사와 집중 회귀를 통과했고, 계획한 외부 보관 이동과 이번 진단 사본 정리까지 완료했다. 최종 파일 재해시와 복구 원장 검사도 통과했다.')
report=report.replace('## 공간 정리 — 완료 수치 대기','## 공간 정리 — 완료')
report=report.replace('| 과거 배포·작업 루트 외부 보관 | 9루트 / 31,380,114,653바이트 | **PENDING** |','| 과거 배포·작업 루트 외부 보관 | 9루트 / 31,380,114,653바이트 | 완료 |')
report=report.replace('| 중복·퇴역 백업 외부 보관 | 85파일 / 2,567,972,178바이트 | **PENDING** |','| 퇴역 백업 외부 보관 | 85파일 / 2,567,972,178바이트 | 완료 |')
report=report.replace('| 실제 이동한 파일·바이트·검증 결과 | 완료 후 이동 기록으로 확정 | **PENDING** |',f"| 전체 보관 이동(교체 전본·진단 사본 포함) | 원장 전체 집계 | {summary['files']:,}파일 / {summary['bytes']:,}바이트; 매번 SHA256 검증 |")
report=report.replace('| G 드라이브 실제 확보 공간 | 이동 전후 실측으로 확정 | **PENDING** |',f"| G 드라이브 실제 확보 공간 | 이동 전후 실측 | +{final['measuredGFreeIncreaseBytes']:,}바이트; 여유 {free_g:,}바이트 |")
report+='\n최종 전체 파일·공간 수치는 DELIVERY.json, 전체 복구 원장은 K:/doing/JO9_trash/full-prezip-20261101/ARCHIVE_MANIFEST.json에 기록했다. 동일 위치의 restore_archive.py는 기본값이 계획 확인이며, 현재 파일을 덮어쓰지 않는다. 이번 진단의 재생성 가능한 JSON 복제본과 junction 항목만 정리했고 실제 WORK/Full JSON 대상은 보존했다. 검사 사본 QSP·합성 SAV는 K로 보관했다. ZIP·커밋·푸시는 수행하지 않았다.\n'
assert 'PENDING' not in report
for p in [HERE/'REPORT_KO.md',record/'REPORT_KO.md',TRASH/'REPORT_KO.md']:p.write_text(report,encoding='utf-8')
plan=(HERE/'PLAN.md').read_text(encoding='utf-8').replace('- [ ]','- [x]')
for p in [HERE/'PLAN.md',record/'PLAN.md']:p.write_text(plan,encoding='utf-8')
print(json.dumps(final,ensure_ascii=True),flush=True)
