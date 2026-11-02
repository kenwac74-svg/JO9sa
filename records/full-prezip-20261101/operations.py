"""Verified, reversible relocation and current-WORK distribution synchronization.
No image edits, path rewrites, compression, save edits, or git commands.
"""
import argparse, hashlib, json, os, shutil, stat, time
from pathlib import Path
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
WORK = Path('G:/somi/Jack O Nine Tails v2.4_work')
FULL = Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full')
TRASH = Path('K:/doing/JO9_trash/full-prezip-20261101')
START = time.monotonic()
LAST = 0

def load(name): return json.loads((HERE/name).read_text(encoding='utf-8-sig'))
def sha(p):
    with p.open('rb') as f: return hashlib.file_digest(f, 'sha256').hexdigest()
def inside(p, root):
    p, root = p.absolute(), root.absolute()
    assert p != root and p.is_relative_to(root), f'Out of scope: {p}'
    return p
def no_links(p):
    p = p.absolute()
    for part in [p, *p.parents]:
        if part.exists():
            s = part.lstat()
            assert not (getattr(s,'st_file_attributes',0) & 0x400), f'Reparse point: {part}'
    return p
def signature(p):
    s=p.stat(); return (s.st_size,s.st_mtime_ns)
def log(event, **values):
    global LAST
    row={'utc':datetime.now(timezone.utc).isoformat(),'event':event,**values}
    TRASH.mkdir(parents=True,exist_ok=True)
    with (TRASH/'operations.jsonl').open('a',encoding='utf-8') as f:
        f.write(json.dumps(row,ensure_ascii=False)+'\n'); f.flush(); os.fsync(f.fileno())
    with (HERE/'operations.jsonl').open('a',encoding='utf-8') as f:
        f.write(json.dumps(row,ensure_ascii=False)+'\n'); f.flush()
    if time.monotonic()-LAST>20 or event in ('sync_complete','archive_complete'):
        print(json.dumps(row,ensure_ascii=False),flush=True); LAST=time.monotonic()
def archive_file(source, relative, reason, expected=None):
    source=no_links(source); dest=no_links(inside(TRASH/relative,TRASH))
    assert source.is_file(),source
    before=signature(source)
    if expected: assert sha(source)==expected, f'Source changed: {source}'
    dest.parent.mkdir(parents=True,exist_ok=True)
    assert not dest.exists(), f'Refuse overwrite: {dest}'
    pending=dest.with_name(dest.name+'.jo9_partial')
    assert not pending.exists(),pending
    log('archive_planned',source=str(source),destination=str(dest),bytes=before[0],reason=reason)
    digest=hashlib.sha256()
    with source.open('rb') as src,pending.open('xb') as out:
        for block in iter(lambda:src.read(8*1024*1024),b''):
            out.write(block); digest.update(block)
        out.flush(); os.fsync(out.fileno())
    digest=digest.hexdigest()
    assert signature(source)==before,f'Source changed while copying: {source}'
    assert sha(pending)==digest,f'Archive readback mismatch: {dest}'
    if expected: assert digest==expected
    shutil.copystat(source,pending)
    pending.rename(dest)
    assert sha(source)==digest and signature(source)==before,f'Source changed before removal: {source}'
    log('archive_verified',source=str(source),destination=str(dest),bytes=before[0],sha256=digest,sourceMtimeNs=before[1],sourceMode=source.stat().st_mode)
    # Only this one verified source file is removed; no recursive deletion.
    if not source.stat().st_mode & stat.S_IWRITE: source.chmod(source.stat().st_mode|stat.S_IWRITE)
    source.unlink()
    log('source_removed',source=str(source),destination=str(dest),bytes=before[0],sha256=digest)
    return {'source':str(source),'destination':str(dest),'bytes':before[0],'sha256':digest}

def copy_current(source,dest,expected):
    no_links(source);no_links(dest);inside(source,WORK);inside(dest,FULL)
    assert sha(source)==expected, f'WORK changed: {source}'
    before=signature(source);dest.parent.mkdir(parents=True,exist_ok=True)
    assert not dest.exists(),f'Unarchived destination: {dest}'
    pending=dest.with_name(dest.name+'.jo9_partial');assert not pending.exists()
    shutil.copy2(source,pending)
    assert sha(pending)==expected and sha(source)==expected and signature(source)==before
    pending.rename(dest)
    log('runtime_installed',source=str(source),destination=str(dest),bytes=before[0],sha256=expected)

def sync():
    plan=load('sync-plan.json');assert sha(WORK/'game/jack.qsp')==plan['workQspHash']
    archived=[]
    for row in plan['incoming']:
        source=inside(WORK/row['path'],WORK);dest=inside(FULL/row['path'],FULL)
        assert sha(source)==row['sha256']
        if row['previous']:
            archived.append(archive_file(dest,'full-before/'+row['path'],'Superseded Full runtime; current WORK authoritative',row['previous']['sha256']))
        else: assert not dest.exists()
        copy_current(source,dest,row['sha256'])
    for row in plan['fullOnlyRuntime']:assert sha(FULL/row['path'])==row['sha256']
    for row in plan['approvedTestSaves']:assert sha(FULL/row['path'])==row['sha256']
    assert sha(FULL/'game/jack.qsp')==sha(WORK/'game/jack.qsp')==plan['workQspHash']
    result={'runtimeInstalled':len(plan['incoming']),'archivedBefore':archived,'compatibilityRetained':len(plan['fullOnlyRuntime']),'testSavesRetained':7,'qspSha256':plan['workQspHash']}
    (HERE/'sync-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    log('sync_complete',**result)

def docs():
    names=['README_KO.txt','CHANGELOG_KO.md','ARTWORK_PENDING_KO.md','PLAYTEST_KO.md','VALIDATION_KO.md']
    for name in names:
        source=HERE/name;dest=FULL/name
        assert source.is_file(),source
        if dest.exists() and sha(source)==sha(dest):continue
        if dest.exists():archive_file(dest,'full-before-docs/'+name,'Superseded release document')
        shutil.copy2(source,dest);assert sha(source)==sha(dest)
    # Internal question records belong in the build record, not in the player package.
    old=FULL/'FOLLOW_UP_KO.md'
    if old.exists():archive_file(old,'full-before-docs/FOLLOW_UP_KO.md','Internal follow-up retained externally; not a player document')
    log('documents_complete',files=names)

def encoding():
    workhash=load('hashes-work.json');oldrows={r['path']:r for r in workhash['files']};repairs=[]
    for number in range(3021,3027):
        relative=f'game/json/slaves/{number}.json'
        old=(WORK/relative).read_bytes(); assert sha(WORK/relative)==oldrows[relative]['sha256']
        assert set(b for b in old if b>=128)=={0x92},relative
        new=old.replace(b'\x92',b'\xe2\x80\x99')
        json.loads(new.decode('utf-8')); digest=hashlib.sha256(new).hexdigest()
        for root,category in [(WORK,'work-before-encoding'),(FULL,'full-before-encoding')]:
            target=no_links(inside(root/relative,root));assert target.read_bytes()==old
            pending=target.with_name(target.name+'.jo9_partial');assert not pending.exists()
            with pending.open('xb') as f:f.write(new);f.flush();os.fsync(f.fileno())
            assert sha(pending)==digest
            archive_file(target,category+'/'+relative,'Six prose-only legacy apostrophes encoded as invalid UTF8; preserve original bytes',oldrows[relative]['sha256'])
            pending.rename(target);assert sha(target)==digest
        repairs.append({'path':relative,'before':hashlib.sha256(old).hexdigest(),'after':digest,'occurrences':old.count(b'\x92'),'effect':'Only prose apostrophe encoding; no numbers, paths, IDs, or saves changed'})
        s=(WORK/relative).stat();oldrows[relative].update(bytes=s.st_size,mtime_ns=s.st_mtime_ns,sha256=digest)
    workhash['bytes']=sum(r['bytes'] for r in workhash['files'])
    (HERE/'hashes-work.json').write_text(json.dumps(workhash,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (HERE/'encoding-repair.json').write_text(json.dumps({'files':repairs,'qspUnchanged':sha(WORK/'game/jack.qsp')==load('sync-plan.json')['workQspHash']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    log('encoding_complete',files=6,bytesOnly='0x92 to UTF8 U+2019')

def manifest():
    runtime=load('runtime-verification.json');assert runtime['pass']
    expected={r['path'].casefold():r for r in runtime['files']}
    files=[];extras=[];directories=[]
    for current,subdirs,names in os.walk(FULL,followlinks=False):
        current=no_links(Path(current));directories.append(str(current.relative_to(FULL)))
        for sub in subdirs:no_links(current/sub)
        for name in names:
            file=no_links(current/name);relative=file.relative_to(FULL).as_posix()
            if relative=='BUILD_MANIFEST.json':continue
            row=expected.get(relative.casefold());s=file.stat()
            if row:
                assert s.st_size==row['bytes'];files.append(row)
            else:
                allowed=relative in ['FastQSP.ini','game/FastQSP.ini','게임 실행.cmd','README_KO.txt','CHANGELOG_KO.md','ARTWORK_PENDING_KO.md','PLAYTEST_KO.md','VALIDATION_KO.md'] or relative in [r['path'] for r in load('sync-plan.json')['approvedTestSaves']]
                assert allowed,f'Unreviewed Full file: {file}'
                extras.append({'path':relative,'bytes':s.st_size,'sha256':sha(file)})
    assert len(files)==runtime['runtimeFiles']
    assert len(extras)==15,(len(extras),extras)
    portable=b'[General]\r\nignoreCRC=true\r\nmutedState=false\r\n'
    assert (FULL/'FastQSP.ini').read_bytes()==portable and (FULL/'game/FastQSP.ini').read_bytes()==portable
    result={'schema':2,'preparedUtc':datetime.now(timezone.utc).isoformat(),'state':'PRE_ZIP_READY_FOR_MANUAL_PLAYTEST','zipCreated':False,'qspSha256':sha(FULL/'game/jack.qsp'),'runtimeFiles':len(files),'publicTestSaves':7,'fullOnlyCompatibilityFiles':9,'payloadFilesExcludingManifest':len(files)+len(extras),'payloadBytesExcludingManifest':sum(r['bytes'] for r in files+extras),'validation':{'mandatoryNativePaths':9,'historicalNativeCases':6,'historicalAssertions':301,'historicalStaticChecks':16,'jsonUtf8Files':1156,'javascriptSyntaxFiles':3,'launcherFromUnrelatedWorkingDirectory':True},'manifestHashScope':'This manifest excludes itself; whole-package manifest SHA is retained in the external delivery record.','pathPolicy':'No runtime path reorganization. Compatibility aliases preserved.','files':sorted(files+extras,key=lambda r:r['path'].casefold())}
    target=FULL/'BUILD_MANIFEST.json'
    if target.exists():archive_file(target,'full-before-docs/BUILD_MANIFEST.json','Superseded release content manifest')
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    shutil.copy2(target,HERE/'BUILD_MANIFEST.json')
    shutil.copy2(HERE/'restore_archive.py',TRASH/'restore_archive.py')
    log('manifest_complete',runtimeFiles=len(files),payloadFilesExcludingManifest=result['payloadFilesExcludingManifest'],payloadBytesExcludingManifest=result['payloadBytesExcludingManifest'],manifestSha256=sha(target))

def retire():
    entries=load('move-ready-top-level.json')['entries'];moved=[]
    for row in entries:
        root=no_links(Path(row['source']));inside(root,Path('G:/somi'))
        assert root.parent==Path('G:/somi') and row['reparse']==0
        assert root.name not in [WORK.name,FULL.name,'JO9O','JO9sa','JO9resource','IMGMG']
        files=[];dirs=[]
        for current,subdirs,names in os.walk(root,followlinks=False):
            current=no_links(Path(current));dirs.append(current)
            for sub in subdirs:no_links(current/sub)
            for name in names:files.append(no_links(current/name))
        assert len(files)==row['files'] and sum(x.stat().st_size for x in files)==row['bytes'],f'Inventory changed: {root}'
        archive_root=no_links(inside(TRASH/'retired-somi'/root.name,TRASH));assert not archive_root.exists()
        for directory in dirs:
            target=no_links(inside(archive_root/directory.relative_to(root),TRASH));target.mkdir(parents=True,exist_ok=True)
        log('archive_directories',source=str(root),destination=str(archive_root),directories=[str(d.relative_to(root)) for d in dirs])
        for file in files:
            moved.append(archive_file(file,'retired-somi/'+root.name+'/'+file.relative_to(root).as_posix(),row['reason']))
        for directory in sorted(dirs,key=lambda x:len(x.parts),reverse=True):
            inside(directory,Path('G:/somi'));directory.rmdir()
        log('retired_root_complete',source=str(root),files=len(files),bytes=row['bytes'])
    audit=load('loose-backup-audit.json');assert audit['summary']['archiveSafe']==85 and audit['summary']['hold']==0
    plan=load('sync-plan.json')
    for row in plan['workLooseBackupArchiveCandidates']:
        source=inside(WORK/row['path'],WORK)
        assert source.parent==WORK/'game' and source.name.startswith('jack.qsp.bak_')
        assert source.stat().st_size==row['bytes']
        moved.append(archive_file(source,'work-loose-backups/'+row['path'],row['reason']))
    result={'files':len(moved),'bytes':sum(x['bytes'] for x in moved),'entries':moved}
    (HERE/'archive-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (TRASH/'ARCHIVE_MANIFEST.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    log('archive_complete',files=result['files'],bytes=result['bytes'])

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('mode',choices=['sync','docs','retire','encoding','manifest']);a=p.parse_args()
    no_links(WORK);no_links(FULL);no_links(TRASH)
    {'sync':sync,'docs':docs,'retire':retire,'encoding':encoding,'manifest':manifest}[a.mode]()
