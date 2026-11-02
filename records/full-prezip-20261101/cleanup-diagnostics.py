"""Clean only exact owned diagnostic roots; never traverse JSON junctions.
Large QSP/SAV are moved to K, evidence is retained here, cloned JSON removed
only after matching current Full. No personal save paths are included.
"""
import hashlib,json,os,shutil
from pathlib import Path
from operations import archive_file,no_links,inside,sha,log,HERE,FULL,WORK,TRASH
roots=[Path('G:/Codex/tmp')/name for name in [
 'full-prezip-20261101-historical-a11ecde6',
 'full-prezip-20261101-release',
 'full-prezip-20261101-release-inputs',
 'full-prezip-20261101-launcher',
 'full-prezip-20261101-encoding-native',
]]
evidence=HERE/'diagnostic-evidence';moves=[];removed=[];links=[]
allowed={'.qsp','.sav','.json','.md','.log','.xml','.ini','.txt','.ps1','.cjs','.py','.sh'}
for root in roots:
    if not root.exists():continue
    no_links(root);inside(root,Path('G:/Codex/tmp'))
    files=[];dirs=[]
    for current,subdirs,names in os.walk(root,followlinks=False):
        current=Path(current);dirs.append(current)
        for sub in list(subdirs):
            link=current/sub
            if getattr(link.lstat(),'st_file_attributes',0)&0x400:
                assert link.resolve() in [(FULL/'game/json').resolve(),(WORK/'game/json').resolve()],link
                links.append(link);subdirs.remove(sub)
        files += [current/name for name in names]
    for file in files:
        no_links(file);relative=file.relative_to(root);assert file.suffix.lower() in allowed or '.qsp.bak_' in file.name,file
        size=file.stat().st_size
        if file.suffix.lower() in {'.qsp','.sav'} or '.qsp.bak_' in file.name:
            moves.append(archive_file(file,'diagnostics-temp/'+root.name+'/'+relative.as_posix(),'Completed reproducible test copy or synthetic result SAV; original sources and core evidence retained'))
        elif 'json' in relative.parts[:-1]:
            k=relative.parts.index('json');original=FULL/'game/json'/Path(*relative.parts[k+1:])
            assert original.is_file(),file
            # Gate copied JSON before the targeted apostrophe correction; originals
            # of exactly six such files are already SHA-verified at K.
            expected=original
            if sha(file)!=sha(expected):
                old=TRASH/'full-before-encoding/game/json'/Path(*relative.parts[k+1:])
                assert old.is_file() and sha(file)==sha(old),file
            file.unlink();removed.append({'path':str(file),'bytes':size,'reason':'hash-verified cloned JSON'})
        else:
            target=evidence/root.name/relative;target.parent.mkdir(parents=True,exist_ok=True)
            assert not target.exists();shutil.copy2(file,target);assert sha(file)==sha(target)
            file.unlink();removed.append({'path':str(file),'bytes':size,'reason':'evidence copied to workspace'})
    for link in [x for x in links if x.is_relative_to(root)]:
        assert getattr(link.lstat(),'st_file_attributes',0)&0x400
        os.rmdir(link)  # junction entry only, not its target
    for directory in sorted(dirs,key=lambda p:len(p.parts),reverse=True):
        inside(directory,Path('G:/Codex/tmp'));directory.rmdir()
report={'archivedFiles':len(moves),'archivedBytes':sum(x['bytes'] for x in moves),'removedReproducibleFiles':len(removed),'removedReproducibleBytes':sum(x['bytes'] for x in removed),'junctionEntriesRemoved':len(links),'junctionTargetsPreserved':True,'roots':[str(x) for x in roots],'details':removed}
(HERE/'diagnostic-cleanup.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
log('diagnostics_cleanup_complete',**{k:v for k,v in report.items() if k!='details'})
print(json.dumps({k:v for k,v in report.items() if k!='details'}),flush=True)
