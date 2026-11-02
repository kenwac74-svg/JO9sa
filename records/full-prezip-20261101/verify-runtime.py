import hashlib,json,os,time
from pathlib import Path
P=Path(__file__).resolve().parent
w=json.loads((P/'hashes-work.json').read_text(encoding='utf-8'))
plan=json.loads((P/'sync-plan.json').read_text(encoding='utf-8'))
W=Path(w['root']); F=Path(plan['destination'])
expected={x['path'].casefold():x for x in w['files']}
workkeys=set(expected); incomingkeys={x['path'].casefold() for x in plan['incoming']}
for x in plan['fullOnlyRuntime']:assert x['path'].casefold() not in expected;expected[x['path'].casefold()]=x
observed=[];bad=[];changed=[];start=time.monotonic()
for key,row in sorted(expected.items()):
    f=F/row['path'];s=f.stat()
    assert not getattr(f.lstat(),'st_file_attributes',0)&0x400
    with f.open('rb') as stream:digest=hashlib.file_digest(stream,'sha256').hexdigest()
    if digest!=row['sha256'] or s.st_size!=row['bytes']:bad.append(row['path'])
    if key in incomingkeys:pass
    elif key in workkeys:
        src=(W/row['path']).stat()
        if src.st_size!=row['bytes'] or src.st_mtime_ns!=row['mtime_ns']:changed.append(row['path'])
    observed.append({'path':row['path'],'bytes':s.st_size,'sha256':digest})
    if len(observed)%5000==0:print(json.dumps({'verified':len(observed),'seconds':round(time.monotonic()-start,1)}),flush=True)
for row in plan['incoming']:
    with (W/row['path']).open('rb') as stream:assert hashlib.file_digest(stream,'sha256').hexdigest()==row['sha256']
for row in plan['approvedTestSaves']:
    with (F/row['path']).open('rb') as stream:assert hashlib.file_digest(stream,'sha256').hexdigest()==row['sha256']
result={'pass':not bad and not changed,'runtimeFiles':len(observed),'runtimeBytes':sum(x['bytes'] for x in observed),'mismatches':bad,'sourceChanged':changed,'publicSaves':7,'fullOnlyCompatibility':len(plan['fullOnlyRuntime']),'files':observed,'seconds':round(time.monotonic()-start,1)}
(P/'runtime-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='files'}),flush=True)
assert result['pass']
