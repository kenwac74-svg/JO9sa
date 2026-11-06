"""Install the approved batch after isolated native validation, preserving WORK edits."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess
from datetime import datetime,timezone

HERE=Path(__file__).resolve().parent
GAME=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO=Path('G:/somi/JO9sa')
BACK=Path('G:/Codex/tmp/jo9-work-batch-20261105-recovery')
def sha(b): return hashlib.sha256(b).hexdigest()
def write(p,b):
    p.parent.mkdir(parents=True,exist_ok=True)
    stage=p.with_name(p.name+'.batch-20261105.tmp')
    assert not stage.exists(),stage
    stage.write_bytes(b);os.replace(stage,p)
    assert p.read_bytes()==b
def main():
    spec=json.loads((HERE/'integration.json').read_text(encoding='utf8'))
    qsp=GAME/'jack.qsp';tracked=REPO/'assets/runtime/2.4.1/jack.qsp'
    candidate=(HERE/'candidate.qsp').read_bytes()
    assert sha(qsp.read_bytes())==spec['baseline'],'WORK changed; regenerate and revalidate'
    assert sha(candidate)==spec['candidate']
    validation=max(Path('G:/Codex/tmp/jo9-work-batch-20261105-validation').glob('run-*/report.json'),key=lambda p:p.stat().st_mtime_ns)
    gate=json.loads(validation.read_text(encoding='utf8'))
    assert gate['verdict']=='PASS',gate['verdict']
    pic=GAME/'content/pic/girls/full'
    new=pic/'isabella_black_long.png';shared=pic/'isabella_black_long_milf.png';old=pic/'2323/2323_full_title.png'
    assert sha(new.read_bytes())=='d9c5b201f9ec1d7f14f7c2dad99f055e8b8605b1638171e14b9c81876cc882b9'
    assert shared.read_bytes()==old.read_bytes(),'Old appearance recovery address changed'
    j=GAME/'json/slaves/2323.json';jraw=j.read_bytes();obj=json.loads(jraw.decode('utf-8-sig'))
    assert obj['fullimage']=='girls/full/isabella_black_long_milf'
    jnew=jraw.replace(b'"fullimage": "girls/full/isabella_black_long_milf"',b'"fullimage": "girls/full/2323/2323_full_title"')
    assert jnew!=jraw
    final=json.loads(jnew.decode('utf-8-sig'));oldobj=dict(obj);oldobj['fullimage']=final['fullimage'];assert oldobj==final
    fixed2571=GAME/'json/slaves/2571_isabella.json';j2571=sha(fixed2571.read_bytes())
    BACK.mkdir(parents=True,exist_ok=True)
    for name,p in [('work-before.qsp',qsp),('tracked-before.qsp',tracked),('2323-before.json',j),('2323-tracked-before.json',REPO/'assets/json/slaves/2323.json')]:
        dest=BACK/name
        assert not dest.exists(),dest
        dest.write_bytes(p.read_bytes())
    catalogstatus=GAME/'modtools/catalog/catalog_status.js';statussha=sha(catalogstatus.read_bytes())
    before_backups=set(GAME.glob('jack.qsp.bak_*'))
    cmd=['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',str(REPO/'tools/apply_mods.ps1'),'-Qsp',str(qsp),'-ModsDir',str(HERE/'mods')]
    run=subprocess.run(cmd,capture_output=True,encoding='utf8',errors='replace')
    (HERE/'apply-mods.log').write_text(run.stdout+run.stderr,encoding='utf8')
    if run.returncode: raise RuntimeError('apply_mods failed; inspect apply-mods.log')
    assert sha(qsp.read_bytes())==spec['candidate']
    write(j,jnew)
    write(REPO/'assets/json/slaves/2323.json',jnew)
    write(shared,new.read_bytes())
    write(tracked,candidate)
    assert sha(fixed2571.read_bytes())==j2571
    assert sha(catalogstatus.read_bytes())==statussha
    asset={
      'id':'ISABELLA_DEFAULT_ALIAS_AND_RANDOM_2323_20261105',
      'eventId':2571,'eventJsonUnchangedSha256':j2571,
      'source':'content/pic/girls/full/isabella_black_long.png',
      'target':'content/pic/girls/full/isabella_black_long_milf.png',
      'sourceSha256':sha(new.read_bytes()),'targetSha256':sha(shared.read_bytes()),
      'intent':'KEEP latest event appearance at the legacy fullimage address without changing2571 JSON',
      'random2323':{'json':'json/slaves/2323.json','fullimage':final['fullimage'],'pngSha256':sha(old.read_bytes()),'preservedPreviousSharedImage':True},
      'oldSaveRule':'Known old shared path is read through ID2323/2571 mapping; actor caches are not migrated',
      'duplicatePolicy':'Intentional compatibility alias; preserve both latest addresses. Old art already has a distinct2323 address.'}
    write(REPO/'assets/resource-role-copies/2026-11-05_isabella_default.json',(json.dumps(asset,ensure_ascii=False,indent=2)+'\n').encode())
    for patch in (HERE/'mods').glob('*.json'): write(REPO/'mods'/patch.name,patch.read_bytes())
    runtime=REPO/'assets/runtime-source-2.4.1.json';data=json.loads(runtime.read_text(encoding='utf8'))
    data['snapshotDate']='2026-11-05';data['sourceQspSha256']=spec['candidate'];data['latestWorkBatch']='records/work-pending-batch-20261105/REPORT_KO.md'
    for f in data.get('files',[]):
        if f.get('runtimePath')=='json/slaves/2323.json': f.update(bytes=len(jnew),sha256=sha(jnew))
    write(runtime,(json.dumps(data,ensure_ascii=False,indent=2)+'\n').encode())
    for p in set(GAME.glob('jack.qsp.bak_*'))-before_backups:
        assert p.parent.resolve()==GAME.resolve() and sha(p.read_bytes())==spec['baseline']
        assert (BACK/'work-before.qsp').read_bytes()==p.read_bytes()
        p.unlink() # Identical backup already verified in the external recovery directory.
    report={**spec,'installedAt':datetime.now(timezone.utc).isoformat(),'workWritten':True,'trackedQspEqual':tracked.read_bytes()==qsp.read_bytes(),
      'qspSha256':sha(qsp.read_bytes()),'imageAlias':asset,'2323JsonSha256':sha(jnew),'2571JsonPreserved':True,
      'catalogStatusPreserved':True,'validationReport':str(validation),'recoveryDirectory':str(BACK),'fullTouched':False,'committed':False,'pushed':False}
    (HERE/'installed.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'workApplied':True,'qspSha256':report['qspSha256'],'trackedQspEqual':report['trackedQspEqual'],'fullTouched':False},indent=2))
if __name__=='__main__': main()
