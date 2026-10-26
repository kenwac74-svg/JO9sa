"""Pin user edits, package a new revision, synchronize QSP only, then clean scratch."""
from pathlib import Path
import datetime as dt
import hashlib, json, os, shutil, stat, sys, zipfile

REPO=Path('G:/somi/JO9sa')
REC=REPO/'records/dialogue-editor-sync-20261021'
TMP=Path('G:/Codex/tmp/dialogue-editor-sync-20261021')
OUT=Path('G:/somi/JO9_2.4_SecondPatch_20261021_Split')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
FULL=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game')
ORIGINAL=Path('G:/somi/JO9_2.4_Release_20261019_Final/verified/JO9_2.4_Full/game')
EXPECTED='c6701e3ab130b1a762d0b1a523d52cd53cee846f71c3d7899a4c369389aa853d'
sha_bytes=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
dump=lambda x:(json.dumps(x,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b)
    return h.hexdigest()
def write(p,obj):p.write_bytes(dump(obj))
def file_record(p):
    s=p.stat();return {'path':str(p),'bytes':s.st_size,'mtimeNs':s.st_mtime_ns,'sha256':sha(p)}
def inventory(root):
    result={}
    for base,dirs,files in os.walk(root,followlinks=False):
        for name in dirs+files:
            p=Path(base)/name
            if p.lstat().st_file_attributes&0x400:raise AssertionError('Reparse point in inventory')
        for name in files:
            p=Path(base)/name
            if p==root/'jack.qsp':continue
            s=p.stat();result[p.relative_to(root).as_posix()]=[s.st_size,s.st_mtime_ns]
    return result
def check_protected(state):
    assert inventory(FULL)==state['fullOtherFiles']
    for r in state['protected']:
        p=Path(r['path']);s=p.stat();assert [s.st_size,s.st_mtime_ns]==[r['bytes'],r['mtimeNs']],str(p)
        if p.suffix.lower()!='.zip':assert sha(p)==r['sha256'],str(p)
def assert_gate(report):
    assert report['verdict']=='PASS'
    checks={c['name']:c for c in report['checks']}
    assert all(c['status']=='PASS' for c in report['checks'] if c['required'])
    assert checks['inputs-readable']['detail']['candidate']==EXPECTED
    smoke=checks['installed-client-smoke']['detail'];assert smoke['passed']==smoke['expected']==9
    replay=checks['patch-replay-and-idempotence']['detail'];assert replay['byteExact'] and replay['idempotent']

def prepare():
    assert not TMP.exists() and not REC.exists()
    latest=load(OUT/'LATEST_SPLIT_BUILD.json');core=next(a for a in latest['artifacts'] if a['kind']=='core')
    assert Path(core['archive']).name.endswith('_r3.zip') and sha(Path(core['archive']))==core['sha256']
    work=WORK/'jack.qsp';full=FULL/'jack.qsp';assert sha(work)==EXPECTED
    with zipfile.ZipFile(core['archive']) as z:baseline=z.read('game/jack.qsp')
    assert sha_bytes(baseline)==latest['qspSHA256']
    r2=OUT/'JO9_2.4_SecondPatch_20261021_Core_Test_r2.zip'
    with zipfile.ZipFile(r2) as z:assert sha_bytes(z.read('game/jack.qsp'))==sha(full)
    for p in [TMP/'inputs',TMP/'candidate',TMP/'mods',REC]:p.mkdir(parents=True,exist_ok=False)
    (TMP/'inputs/baseline.qsp').write_bytes(baseline);(TMP/'candidate/jack.qsp').write_bytes(work.read_bytes())
    protected=[]
    for a in latest['artifacts']:
        p=Path(a['archive']);r=file_record(p);assert r['sha256']==a['sha256'];protected.append(r)
    for root in [WORK,FULL]:
        for p in [root/'config.xml',root/'css/base.css',root/'json/slaves/211.json',*sorted((root/'save').glob('*'))]:
            if p.is_file():protected.append(file_record(p))
    state={'status':'PINNED','latest':latest,'previousCore':core,'workBefore':file_record(work),'fullBefore':file_record(full),'protected':protected,'fullOtherFiles':inventory(FULL),'recovery':{'archive':str(r2),'archiveSHA256':sha(r2),'member':'game/jack.qsp','sha256':sha(full)}}
    write(REC/'PINNED_STATE.json',state)
    for p in Path(__file__).parent.iterdir():
        if p.suffix in ['.py','.cjs']:shutil.copyfile(p,REC/p.name)
    print(json.dumps({'status':'PINNED','workSHA256':EXPECTED,'baselineSHA256':sha_bytes(baseline),'fullSHA256':sha(full),'protectedFiles':len(protected),'fullOtherFiles':len(state['fullOtherFiles'])}))

def package():
    state=load(REC/'PINNED_STATE.json');build=load(REC/'BUILD_RESULT.json');check_protected(state)
    assert sha(WORK/'jack.qsp')==EXPECTED==build['after']
    prior=state['previousCore'];assert sha(Path(prior['archive']))==prior['sha256']
    with zipfile.ZipFile(prior['archive']) as z:members={n:z.read(n) for n in z.namelist()}
    old_hashes={n:sha_bytes(b) for n,b in members.items()};assert old_hashes['game/jack.qsp']==build['before']
    qsp=(TMP/'candidate/jack.qsp').read_bytes();assert sha_bytes(qsp)==EXPECTED;members['game/jack.qsp']=qsp
    mn=next(n for n in members if n.startswith('BUILD_MANIFEST_'));manifest=json.loads(members.pop(mn))
    manifest.update(revision='r4-user-dialogue-editor-sync',createdAt=dt.datetime.now(dt.timezone.utc).isoformat(),gamePayloadUnchanged=False,changedGameFiles=['game/jack.qsp'],userDialogueEdits=13)
    for r in manifest['runtimeFiles']:
        if r['path']=='game/jack.qsp':r.update(sha256=EXPECTED,bytes=len(qsp))
    members['BUILD_MANIFEST_CORE_r4.json']=dump(manifest)
    archive=OUT/'JO9_2.4_SecondPatch_20261021_Core_Test_r4.zip';assert not archive.exists()
    for n in list(members):
        if not(n.startswith('README_') or n=='CHANGELOG_KO.md'):continue
        text=members.pop(n).decode('utf-8-sig').replace('\r\n','\n')
        text=text.replace(Path(prior['archive']).name,archive.name).replace('2차 누적 본체 테스트 패치 r3','2차 누적 본체 테스트 패치 r4')
        text+='\n본체 r4: 대사 수정기에서 사용자가 저장한 최종 문구 13곳을 반영했습니다. 1차 누적 구성과 절세미인 표시명을 포함하며, CSS·JSON·이미지팩·삭제기는 r3와 동일합니다.\n'
        members[n.replace('_r3_','_r4_')]=text.replace('\n','\r\n').encode('utf-8-sig')
    unchanged=[n for n in old_hashes if n.startswith('game/') and n!='game/jack.qsp']+['Remove-Old-Dona-Json.ps1','Remove-Old-Dona-Json.cmd','dona-json-delete-allowlist.json','REMOVE_OLD_DONA_JSON_KO.txt']
    assert all(sha_bytes(members[n])==old_hashes[n] for n in unchanged)
    with zipfile.ZipFile(archive,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for n,b in members.items():z.writestr(n,b)
    with zipfile.ZipFile(archive) as z:
        assert len(z.namelist())==len({n.casefold() for n in z.namelist()})==len(members)
        assert z.testzip() is None
        for n,b in members.items():assert z.read(n)==b
    h=sha(archive);(OUT/(archive.name+'.sha256')).write_text(h+'  '+archive.name+'\n',encoding='ascii')
    game=TMP/'core-runtime/game';assert not game.exists();shutil.copytree(ORIGINAL/'json',game/'json');shutil.copyfile(ORIGINAL/'config.xml',game/'config.xml')
    for r in manifest['runtimeFiles']:
        p=game/r['path'][5:];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(members[r['path']])
    for d in load(REPO/'records/seed-namespace-fix-20261020/runtime-delta.json')['delete_runtime_files']:
        p=game/d['file'];assert sha(p)==d['only_if_sha256'];p.unlink()
    mirror=TMP/'package-mirror/jack.qsp';mirror.parent.mkdir();mirror.write_bytes(members['game/jack.qsp'])
    result={'status':'PACKAGED_QA_PENDING','core':{'kind':'core','archive':str(archive),'bytes':archive.stat().st_size,'sha256':h,'runtimeFiles':3,'counts':{'qsp':1,'css':1,'json':1}},'before':build['before'],'after':EXPECTED,'unchangedMembers':unchanged,'allZipCRCandSHA256':True,'FullUpdated':False,'commit':False,'push':False}
    write(REC/'PACKAGE_RESULT.json',result);print(json.dumps(result))

def install():
    state=load(REC/'PINNED_STATE.json');package=load(REC/'PACKAGE_RESULT.json')
    for n in ['release-validation.json','core-only-release-validation.json']:assert_gate(load(REC/n))
    review=load(REC/'independent-review.json');assert review['status']=='PASS' and review['candidateSHA256']==EXPECTED
    check_protected(state);assert sha(WORK/'jack.qsp')==EXPECTED;assert sha(FULL/'jack.qsp')==state['fullBefore']['sha256']
    assert sha(Path(package['core']['archive']))==package['core']['sha256']
    recovery=state['recovery'];assert sha(Path(recovery['archive']))==recovery['archiveSHA256']
    with zipfile.ZipFile(recovery['archive']) as z:assert sha_bytes(z.read(recovery['member']))==state['fullBefore']['sha256']
    target=FULL/'jack.qsp';assert not(target.lstat().st_file_attributes&0x400)
    staging=FULL/'jack.qsp.dialogue-sync-pending';assert not staging.exists()
    staging.write_bytes((TMP/'candidate/jack.qsp').read_bytes());assert sha(staging)==EXPECTED
    assert sha(target)==state['fullBefore']['sha256'];os.replace(staging,target)
    assert sha(target)==sha(WORK/'jack.qsp')==EXPECTED;check_protected(state)
    write(REC/'SYNC_RESULT.json',{'status':'QSP_SYNCED','WorkAlreadyApplied':True,'FullUpdated':True,'sha256':EXPECTED,'onlyChangedRuntime':'game/jack.qsp','fullOtherFilesPreserved':len(state['fullOtherFiles']),'protectedFilesPreserved':len(state['protected']),'recoveryVerified':True,'commit':False,'push':False})
    print(json.dumps(load(REC/'SYNC_RESULT.json')))

def finish():
    state=load(REC/'PINNED_STATE.json');package=load(REC/'PACKAGE_RESULT.json');finalqa=load(REC/'full-release-validation.json');assert_gate(finalqa)
    check_protected(state);assert sha(WORK/'jack.qsp')==sha(FULL/'jack.qsp')==EXPECTED
    with zipfile.ZipFile(package['core']['archive']) as z:assert sha_bytes(z.read('game/jack.qsp'))==EXPECTED
    latest=state['latest'];latest['artifacts']=[package['core'] if a['kind']=='core' else a for a in latest['artifacts']]
    latest.update(status='USER_TEST_READY',verifiedAt=dt.datetime.now(dt.timezone.utc).isoformat(),coreRevision='r4-user-dialogue-editor-sync',qspSHA256=EXPECTED,onlyChangedRuntime='game/jack.qsp',userDialogueEdits=13,editorJournalRecords=15,WorkQSPApplied=True,FullUpdated=True,gameFilesChanged=True,coreOnlyReleaseGate='PASS',fullReleaseGate='PASS',existingSaveUIAndFullVisualTestPending=True,commit=False,push=False)
    write(OUT/'LATEST_SPLIT_BUILD.json',latest)
    readme=(OUT/'README_KO.txt').read_text(encoding='utf-8-sig');assert Path(state['previousCore']['archive']).name in readme
    readme=readme.replace(Path(state['previousCore']['archive']).name,Path(package['core']['archive']).name)+'\n본체 r4: 대사 수정기의 최종 문구 13곳을 반영하고 WORK와 배포용 Full QSP를 동일하게 맞췄습니다. 두 이미지팩과 삭제기는 이전과 동일합니다.\n'
    (OUT/'README_KO.txt').write_text(readme,encoding='utf-8-sig')
    text='''## 사용자 대사 수정기 저장분 동기화 (USER_DIALOGUE_EDITOR_SYNC_20261021)

- 저장 이력 15건의 해시 연결을 검증. 서로 되돌린 2건을 제외한 최종 문구 13곳(#npc_base 12, interaction_city 1)을 원문 그대로 보존.
- WORK는 이미 저장 완료된 최신 QSP였으므로 다시 덮어쓰지 않음. 배포용 Full/game/jack.qsp만 동일 바이트로 반영.
- 1차 누적 구성 및 절세미인 표시명을 포함하는 Core_Test_r4.zip 생성. CSS·211.json·삭제기·인디/개인 이미지팩 불변. 이전 ZIP 보존.
- 구조/줄·주석 경계/정확 재생·재적용/등록 JSON/실제 엔진 9경로 및 코어 단독·Full 배포 QSP 대조 PASS. 세이브·설정·Full의 다른 파일 보존 확인.
- 새 상태 키·기능 변경·세이브 변환 없음. 실제 세이브 GUI 불러오기와 화면 문구는 별도 사용자 확인 대상. 커밋·푸시 보류 유지.

[결과](../records/dialogue-editor-sync-20261021/FINAL_RESULT.json), [사용자 수정 재현 기록](../mods/2026-10-21_user_dialogue_editor_sync.json).
'''
    for p in [REPO/'docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',REPO/'docs/SESSION_HANDOFF_INDEX.md',REPO/'docs/PACKAGING_POLICY_20261019.md']:
        raw=p.read_bytes();s=raw.decode('utf-8-sig');assert 'USER_DIALOGUE_EDITOR_SYNC_20261021' not in s
        p.write_text(s.rstrip()+'\n\n'+text,encoding='utf-8-sig' if raw.startswith(b'\xef\xbb\xbf') else 'utf-8')
    result={**package,**load(REC/'SYNC_RESULT.json'),'status':'WORK_FULL_AND_PATCH_UPDATED','officialGate':'PASS','coreOnlyGate':'PASS','fullMirrorGate':'PASS','enginePathsPerGate':9,'userDialogueEdits':13,'otherPacksUnchanged':True,'verifiedAt':latest['verifiedAt']}
    write(REC/'FINAL_RESULT.json',result)
    assert TMP.as_posix()=='G:/Codex/tmp/dialogue-editor-sync-20261021' and TMP.resolve()==TMP.absolute()
    assert TMP.parent.resolve()==Path('G:/Codex/tmp').resolve()
    size=0;count=0
    for base,dirs,files in os.walk(TMP,followlinks=False):
        for name in dirs+files:
            p=Path(base)/name;s=p.lstat();assert not stat.S_ISLNK(s.st_mode) and not(s.st_file_attributes&0x400)
            assert p.resolve().is_relative_to(TMP.resolve())
            if stat.S_ISREG(s.st_mode):count+=1;size+=s.st_size
    shutil.rmtree(TMP);assert not TMP.exists()
    write(REC/'cleanup.json',{'removed':str(TMP),'files':count,'bytes':size,'scopeVerified':True,'reparsePoints':0,'originalEditorBackupsPreserved':True})
    print(json.dumps({'status':result['status'],'core':package['core'],'sha256':EXPECTED,'userDialogueEdits':13,'enginePathsPerGate':9,'temporaryBytesFreed':size,'FullUpdated':True,'commit':False,'push':False}))

assert sys.argv[1] in ['prepare','package','install','finish']
globals()[sys.argv[1]]()
