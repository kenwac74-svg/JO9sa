"""Read-only plan by default. --restore copies absent destinations only.
Never overwrite a current WORK/Full/source file; archived originals stay at K.
Run from this task archive root containing operations.jsonl.
"""
import argparse,hashlib,json,os,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--restore',action='store_true');p.add_argument('--filter',default='');a=p.parse_args()
root=Path(__file__).resolve().parent
rows=[json.loads(s) for s in (root/'operations.jsonl').read_text(encoding='utf-8').splitlines() if s.strip()]
verified={r['source']:r for r in rows if r['event']=='archive_verified'}
removed={r['source'] for r in rows if r['event']=='source_removed'}
for source in sorted(removed):
    row=verified[source];dst=Path(source);src=Path(row['destination'])
    if a.filter and a.filter.casefold() not in source.casefold():continue
    assert src.absolute().is_relative_to(root.absolute())
    assert any(dst.absolute().is_relative_to(Path(x).absolute()) for x in ['G:/somi','G:/Codex/tmp'])
    for f in [src,*src.parents,dst,*dst.parents]:
        if f.exists():assert not getattr(f.lstat(),'st_file_attributes',0)&0x400,f
    if dst.exists():print('KEEP_CURRENT '+str(dst));continue
    if not a.restore:print('WOULD_RESTORE '+str(dst));continue
    with src.open('rb') as stream:assert hashlib.file_digest(stream,'sha256').hexdigest()==row['sha256']
    dst.parent.mkdir(parents=True,exist_ok=True)
    with src.open('rb') as inp,dst.open('xb') as out:shutil.copyfileobj(inp,out,8*1024*1024)
    with dst.open('rb') as stream:assert hashlib.file_digest(stream,'sha256').hexdigest()==row['sha256']
    os.utime(dst,ns=(row['sourceMtimeNs'],row['sourceMtimeNs']))
    print('RESTORED '+str(dst))
for row in [r for r in rows if r['event']=='archive_directories']:
    srcroot=Path(row['destination']);dstroot=Path(row['source'])
    assert srcroot.absolute().is_relative_to(root.absolute()) and dstroot.absolute().is_relative_to(Path('G:/somi').absolute())
    for relative in row['directories']:
        target=dstroot/relative
        if a.filter and a.filter.casefold() not in str(target).casefold():continue
        if target.exists():continue
        for pth in [target,*target.parents]:
            if pth.exists():assert not getattr(pth.lstat(),'st_file_attributes',0)&0x400,pth
        if a.restore:target.mkdir(parents=True,exist_ok=True)
        else:print('WOULD_RESTORE_DIR '+str(target))
