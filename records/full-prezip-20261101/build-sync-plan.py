import json,hashlib,re
from pathlib import Path
P=Path(__file__).resolve().parent
w=json.loads((P/'hashes-work.json').read_text(encoding='utf-8')); f=json.loads((P/'hashes-full.json').read_text(encoding='utf-8'))
assert not w['changedSinceInventory'] and not f['changedSinceInventory']
wk={x['path'].casefold():x for x in w['files']};fl={x['path'].casefold():x for x in f['files']}
assert len(wk)==len(w['files']) and len(fl)==len(f['files'])
incoming=[];identical=[];extras=[];conflicts=[]
for key,row in wk.items():
    old=fl.get(key)
    if old and row['sha256']==old['sha256']:identical.append(row['path']);continue
    incoming.append({'path':row['path'],'bytes':row['bytes'],'sha256':row['sha256'],'sourceMtimeNs':row['mtime_ns'],'previous':old})
    if old and old['mtime_ns']>row['mtime_ns']:conflicts.append({'path':row['path'],'workSha256':row['sha256'],'fullSha256':old['sha256'],'decision':'latest-WORK-authoritative; preserve existing Full bytes at K before replace'})
for key,row in fl.items():
    if key not in wk:extras.append({**row,'decision':'KEEP_FULL_COMPATIBILITY_PENDING_CURRENT_REFERENCE_PROOF'})
inv=json.loads((P/'inventory-full.json').read_text(encoding='utf-8'))
saves=[]
for row in inv['files']:
    if row['path'].startswith('game/save/'):
        assert Path(row['path']).name.startswith('TC_') and row['path'].endswith('.sav'),'unreviewed Full save'
        path=Path(f['root'])/row['path'];saves.append({**row,'sha256':hashlib.file_digest(path.open('rb'),'sha256').hexdigest(),'origin':'previous-approved-public-test-save'})
assert len(saves)==7
backups=[]
wi=json.loads((P/'inventory-work.json').read_text(encoding='utf-8'))
for row in wi['files']:
    if row['path'].startswith('game/') and '/' not in row['path'][5:] and re.match(r'^jack\.qsp\.bak_',Path(row['path']).name):
        backups.append({**row,'source':str(Path(w['root'])/row['path']),'reason':'retired point-in-time QSP backup, not launched; preserve complete bytes and restore map at K'})
plan={'source':w['root'],'destination':f['root'],'workQspHash':wk['game/jack.qsp']['sha256'],'incoming':incoming,'identicalCount':len(identical),'fullOnlyRuntime':extras,'newerFullConflicts':conflicts,'approvedTestSaves':saves,'workLooseBackupArchiveCandidates':backups,'summary':{'incomingFiles':len(incoming),'incomingBytes':sum(x['bytes'] for x in incoming),'oldFullBytesToArchive':sum(x['previous']['bytes'] for x in incoming if x['previous']),'fullOnlyRuntimeFiles':len(extras),'testSaves':len(saves),'looseBackups':len(backups),'looseBackupBytes':sum(x['bytes'] for x in backups)}}
(P/'sync-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'summary':plan['summary'],'newerFullConflicts':conflicts,'incomingByExtension':{ext:sum(1 for x in incoming if Path(x['path']).suffix.lower()==ext) for ext in sorted({Path(x['path']).suffix.lower() for x in incoming})}},ensure_ascii=False))
