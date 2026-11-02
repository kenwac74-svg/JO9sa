import gzip,hashlib,json,os,shutil
from pathlib import Path
P=Path(__file__).resolve().parent
R=Path('G:/somi/JO9sa/records/build-2.4.1-20261101')
K=Path('K:/doing/JO9_trash/build-2.4.1-20261101/diagnostics')
F=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game')
roots=[Path('G:/Codex/tmp')/n for n in ['build-2.4.1-20261101','build-241-release-20261101','build-241-release-verified-20261101']]
assert (R/'DELIVERY.json').is_file(),'Finish verification must complete first'
def sha(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
rows=[];removed=0;freed=0
for root in roots:
    assert root.parent==Path('G:/Codex/tmp') and not root.is_symlink()
    dirs=[];files=[]
    for current,sub,names in os.walk(root,followlinks=False):
        current=Path(current);assert not getattr(current.lstat(),'st_file_attributes',0)&0x400;dirs.append(current)
        for n in sub:assert not getattr((current/n).lstat(),'st_file_attributes',0)&0x400
        files.extend(current/n for n in names)
    for p in files:
        assert p.absolute().is_relative_to(root.absolute())
        rel=p.relative_to(root);size=p.stat().st_size
        if p.suffix.lower() in {'.qsp','.sav'} or '.qsp.bak_' in p.name:
            dst=K/root.name/rel;dst=dst.with_name(dst.name+'.gz');dst.parent.mkdir(parents=True,exist_ok=True);assert not dst.exists()
            raw=p.read_bytes();h=hashlib.sha256(raw).hexdigest();packed=gzip.compress(raw,compresslevel=1);dst.write_bytes(packed)
            assert hashlib.sha256(gzip.decompress(dst.read_bytes())).hexdigest()==sha(p)==h
            row={'source':str(p),'archive':str(dst),'codec':'gzip','rawSha256':h,'rawBytes':size,'storedBytes':len(packed)};rows.append(row)
            with (K.parent/'diagnostic-moves.jsonl').open('a',encoding='utf-8') as out:out.write(json.dumps(row,ensure_ascii=False)+'\n');out.flush();os.fsync(out.fileno())
            p.unlink()
        elif 'json' in rel.parts[:-1]:
            at=rel.parts.index('json');original=F/'json'/Path(*rel.parts[at+1:]);assert original.is_file() and sha(original)==sha(p),p
            p.unlink();removed+=1
        else:
            assert p.suffix.lower() in {'.json','.xml','.ini','.log','.md','.txt'},p
            dst=P/'diagnostic-evidence'/root.name/rel;dst.parent.mkdir(parents=True,exist_ok=True);assert not dst.exists();shutil.copy2(p,dst);assert sha(dst)==sha(p)
            p.unlink();removed+=1
        freed+=size
    for d in sorted(dirs,key=lambda x:len(x.parts),reverse=True):assert d.is_relative_to(Path('G:/Codex/tmp'));d.rmdir()
report={'archivedDiagnosticFiles':len(rows),'archivedRawBytes':sum(r['rawBytes'] for r in rows),'archiveStoredBytes':sum(r['storedBytes'] for r in rows),'removedVerifiedClonesOrRetainedEvidenceFiles':removed,'temporaryBytesCleared':freed,'originalPublicSavesChanged':False,'rootsRemoved':[str(x) for x in roots]}
(P/'cleanup-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for src in [P/'cleanup.py',P/'cleanup-report.json']:
    shutil.copy2(src,R/src.name)
shutil.copytree(P/'diagnostic-evidence',R/'diagnostic-evidence',dirs_exist_ok=True)
print(json.dumps(report),flush=True)
