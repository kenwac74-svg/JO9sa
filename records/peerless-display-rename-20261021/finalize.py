"""Apply the approved display-only QSP after gates, then record and clean scratch."""
from pathlib import Path
import datetime as dt
import hashlib,json,subprocess,zipfile,shutil,stat,os
REPO=Path('G:/somi/JO9sa');REC=REPO/'records/peerless-display-rename-20261021'
TMP=Path('G:/Codex/tmp/peerless-display-rename-20261021')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
OUT=Path('G:/somi/JO9_2.4_SecondPatch_20261021_Split')
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
package=load(REC/'PACKAGE_RESULT.json');qa=load(REC/'release-validation.json');review=load(REC/'independent-review.json')
assert qa['verdict']=='PASS' and review['status']=='PASS'
assert sha(Path(package['core']['archive']))==package['core']['sha256']
assert all(c['status']=='PASS' for c in qa['checks'])
checks={c['name']:c for c in qa['checks']};assert checks['installed-client-smoke']['detail']['passed']==9
def check_protected():
    for r in package['protected']:
        p=Path(r['path']);s=p.stat();assert (s.st_size,s.st_mtime_ns)==(r['bytes'],r['mtimeNs']),str(p)
        if p.suffix.lower()!='.zip':assert sha(p)==r['sha256']
check_protected()
recovery=package['recovery'];assert sha(Path(recovery['archive']))==recovery['archiveSha256']
with zipfile.ZipFile(recovery['archive']) as z:assert hashlib.sha256(z.read(recovery['member'])).hexdigest()==package['before']
assert sha(WORK/'jack.qsp')==package['before']
backups=set(WORK.glob('jack.qsp.bak_*'))
cmd=['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',str(REPO/'tools/apply_mods.ps1'),'-Qsp',str(WORK/'jack.qsp'),'-ModsDir',str(TMP/'mods')]
run=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=120)
(REC/'apply.log').write_bytes(run.stdout);assert run.returncode==0,run.stdout.decode('utf-8',errors='replace')
assert sha(WORK/'jack.qsp')==package['after']
assert (WORK/'jack.qsp').read_bytes()==(TMP/'candidate/jack.qsp').read_bytes()
check_protected()
new_backups=set(WORK.glob('jack.qsp.bak_*'))-backups;assert len(new_backups)==1
backup=next(iter(new_backups));assert backup.parent==WORK and backup.resolve(strict=True)==backup.absolute()
assert not(backup.lstat().st_file_attributes&0x400) and sha(backup)==package['before']
backup_bytes=backup.stat().st_size;backup.unlink() # Exact recovery bytes remain in the pinned immutable r2 ZIP.
latest=load(OUT/'LATEST_SPLIT_BUILD.json')
latest['artifacts']=[package['core'] if a['kind']=='core' else a for a in latest['artifacts']]
latest.update(status='USER_TEST_READY',verifiedAt=dt.datetime.now(dt.timezone.utc).isoformat(),coreRevision='r3-peerless-display-name',
    onlyChangedRuntime='game/jack.qsp',qspSHA256=package['after'],allPayloadBytesMatchPreviouslyValidatedBuild=False,
    displayName='절세미인',saveKeysAndEffectsUnchanged=True,WorkQSPApplied=True,FullUpdated=False,commit=False,push=False)
(OUT/'LATEST_SPLIT_BUILD.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
old_core=Path(recovery['archive']).name;new_core=Path(package['core']['archive']).name
readme=(OUT/'README_KO.txt').read_text(encoding='utf-8-sig');assert old_core in readme
readme=readme.replace(old_core,new_core)+'\n본체 r3에서는 QSP 표시명 경국지색을 절세미인으로 통일했습니다. 인디/개인이미지팩과 CSS/JSON/삭제기는 동일합니다.\n'
(OUT/'README_KO.txt').write_text(readme,encoding='utf-8-sig')
result={**package,'status':'WORK_APPLIED_USER_TEST_READY','verifiedAt':latest['verifiedAt'],'WorkQSPApplied':True,
    'displayReplacements':4,'changedLocations':['menu_form','jo9_traits'],'saveKeysAndEffectsUnchanged':True,
    'officialGate':'PASS','installedEnginePaths':9,'exactReplayAndIdempotence':True,'FullUpdated':False,
    'recoveryVerified':True,'redundantApplierBackupRemoved':str(backup),'redundantBackupBytesFreed':backup_bytes}
(REC/'FINAL_RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
marker='PEERLESS_DISPLAY_NAME_20261021'
body='''## 특성 표시명 통일 ('''+marker+''')

사용자 지시: QSP만 수정하여 경국지색을 절세미인으로 변경한다.

- Work/game/jack.qsp의 menu_form 1곳·jo9_traits 3곳, 총4표시만수정. 기존능력치계산표시2곳은이미절세미인이라보존.
- 내부키jo9_peerless/분기peerless/효과수치/배열/저장자료/캐시버전유지. 새함수·영구키·세이브변환0.
- 이전QSP `'''+package['before']+'''` → 현재 `'''+package['after']+'''`.
- 새본체 `'''+Path(package['core']['archive']).as_posix()+'''`, SHA256 `'''+package['core']['sha256']+'''`. 런타임변경은jack.qsp하나. CSS/211.json/정리유틸/인디JSON·이미지팩/개인이미지팩불변. 최신활성목록/README만새본체로연결.
- 구조/줄경계·정확재생/멱등성·인물등록·ZIPmirror·실제엔진9경로PASS후기존적용기로Work반영·바이트일치확인. 원본은r2본체ZIP의동일jack.qsp로복구가능하게해시검증. 새로생긴중복49MB백업은이검증후정리.
- 실제화면/GUI세이브전체복원은사용자확인대상. 배포FullQSP·세이브·다른팩·커밋푸시는변경하지않음.

[결과](../records/peerless-display-rename-20261021/FINAL_RESULT.json), [문법/엔진검사](../records/peerless-display-rename-20261021/release-validation.json), [독립검수](../records/peerless-display-rename-20261021/independent-review.json), [재현패치](../mods/2026-10-21_peerless_display_name.json).
'''
for p in [REPO/'docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',REPO/'docs/SESSION_HANDOFF_INDEX.md',REPO/'docs/PACKAGING_POLICY_20261019.md']:
    raw=p.read_bytes();text=raw.decode('utf-8-sig');assert marker not in text
    p.write_text(text.rstrip()+'\n\n'+body,encoding='utf-8-sig' if raw.startswith(b'\xef\xbb\xbf') else 'utf-8')
assert TMP.as_posix()=='G:/Codex/tmp/peerless-display-rename-20261021' and TMP.resolve(strict=True)==TMP.absolute()
assert TMP.parent.resolve(strict=True)==Path('G:/Codex/tmp').resolve(strict=True)
assert {p.name for p in TMP.iterdir()}<={'inputs','candidate','mods','core-runtime','release-qa'}
count=0;size=0
for root,dirs,names in os.walk(TMP,followlinks=False):
    for n in dirs+names:
        p=Path(root)/n;s=p.lstat();assert not stat.S_ISLNK(s.st_mode) and not(getattr(s,'st_file_attributes',0)&0x400)
        assert p.resolve(strict=True).is_relative_to(TMP.resolve(strict=True))
        if stat.S_ISREG(s.st_mode):count+=1;size+=s.st_size
shutil.rmtree(TMP);assert not TMP.exists()
(REC/'cleanup.json').write_text(json.dumps({'removed':str(TMP),'files':count,'bytes':size,'reparsePoints':0,'scopeVerified':True,'applierBackupBytesFreed':backup_bytes,'recoveryZIPVerifiedAndRetained':recovery},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':result['status'],'displayReplacements':4,'onlyChangedRuntime':'game/jack.qsp','WorkApplied':True,'FullUpdated':False,'core':package['core'],'enginePaths':9,'temporaryBytesFreed':size+backup_bytes}))
