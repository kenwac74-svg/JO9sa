"""Finish the user-approved move after verified copies already exist.
Only exact-hash working originals are removed. Live game and JO9O are protected.
Metadata paths are relocated without changing event IDs, numerical values or hashes.
"""
from pathlib import Path
import os,stat,json,hashlib,gzip,csv,argparse,datetime
HERE=Path(__file__).resolve().parent;PROJECT=HERE.parents[1]
DEST=Path('G:/somi/JO9resource/mob_body');REPO=Path('G:/somi/JO9sa')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game');ORIGINAL=Path('G:/somi/JO9O')
SOURCE_MANIFEST=DEST/'SOURCE_MANIFEST_20261029.json';JOURNAL=DEST/'MOVE_JOURNAL_20261029.json'
ALLOWED=[Path('G:/somi/JO9_work_backups'),PROJECT/'output',Path('C:/Users/User/.codex/generated_images')]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def norm(p):return str(p).replace('\\','/').lower().rstrip('/')
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def under(p,root):return norm(p)==norm(root) or norm(p).startswith(norm(root)+'/')
def atomic(p,b):
    p=Path(p);t=p.with_name(p.name+'.mob-body-relocation-tmp')
    with t.open('xb') as f:f.write(b)
    os.replace(t,p)
def safe_source(p):
    p=Path(p);assert p.is_absolute() and p.suffix.lower()=='.png' and p.is_file(),str(p)
    assert any(under(p.resolve(),r.resolve()) for r in ALLOWED),str(p)
    assert not under(p,WORK) and not under(p,ORIGINAL) and not under(p,PROJECT/'sources'),str(p)
    assert not (os.lstat(p).st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT),str(p)
    assert norm(p.resolve())==norm(p),str(p)
    return p
args=argparse.ArgumentParser();args.add_argument('action',choices=['plan','apply','verify']);args=args.parse_args()
if args.action=='verify':
    j=load(JOURNAL);assert j['status']=='MOVED_AND_VERIFIED'
    for f in j['moveFiles']:
        assert not Path(f['source']).exists(),f['source'];assert sha(f['destination'])==f['sha256']
    for f in j['keepFiles']:assert sha(f['source'])==f['sha256']
    for f in j['metadataChanges']:assert sha(f['path'])==f['afterSHA']
    m=load(SOURCE_MANIFEST)
    for e in m['entries']:assert sha(e['destination'])==e['destinationSha256']
    assert sha(WORK/'jack.qsp')==j['protectedQsp'];assert sha(WORK/'modtools/catalog/catalog_work_ids.json')==j['protectedWorkIds']
    print(json.dumps(dict(pass_=True,movedPaths=len(j['moveFiles']),keptProtectedPaths=len(j['keepFiles']),archivePNGs=len(m['entries']),metadataFiles=len(j['metadataChanges']),removedSourceBytes=sum(f['bytes'] for f in j['moveFiles']))));raise SystemExit(0)
assert not JOURNAL.exists(),'Move journal already exists; inspect/verify it instead of repeating'
m=load(SOURCE_MANIFEST);assert m['status']=='COPIED_AND_VERIFIED'
move=[];keep=[];mapping={}
for e in m['entries']:
    assert sha(e['destination'])==e['destinationSha256']
    for r in e['sources']:
        assert sha(r['path'])==r['sha256']==e['destinationSha256']
        f=dict(source=r['path'],destination=e['destination'],sha256=r['sha256'],bytes=r['bytes'])
        if under(r['path'],ORIGINAL):f['reason']='KEEP: protected original game';keep.append(f)
        elif under(r['path'],WORK):f['reason']='KEEP: current runtime image';keep.append(f)
        else:
            safe_source(r['path']);f['reason']='MOVE_READY: working/generated/external recovery art; exact archived bytes verified; consuming paths migrated';move.append(f);mapping[norm(r['path'])]=f
assert len(move)==174 and len(keep)==35,(len(move),len(keep))
staging=HERE/'move-metadata-staging';staging.mkdir(exist_ok=True);changes=[]
keys={'beforePath','trackedBeforePath','original_path','source','generatedSource','candidate','workspacePath','generatedPath','generatedOriginalPath','absolutePath','highResolution'}
def convert(v):
    changed=0
    if isinstance(v,list):
        out=[]
        for x in v:y,n=convert(x);out.append(y);changed+=n
        return out,changed
    if isinstance(v,dict):
        out={}
        for k,x in v.items():
            if k in keys and isinstance(x,str) and norm(x) in mapping:
                f=mapping[norm(x)]
                if k=='beforePath' and v.get('before'):assert v['before']==f['sha256'],x
                out[k]=str(Path(f['destination']));changed+=1
            else:y,n=convert(x);out[k]=y;changed+=n
        return out,changed
    return v,0
def stage(p,is_jsonl=False):
    b=p.read_bytes();text=b.decode('utf-8-sig')
    if is_jsonl:
        old=[json.loads(x) for x in text.splitlines() if x.strip()];new,n=convert(old)
        out=''.join(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n' for x in new)
    else:
        old=json.loads(text);new,n=convert(old);out=json.dumps(new,ensure_ascii=False,indent=2)+'\n'
    if not n:return
    target=staging/(str(len(changes)+1)+'-'+p.name);target.write_text(out,encoding='utf-8')
    changes.append(dict(path=str(p),beforeSHA=hashlib.sha256(b).hexdigest(),afterSHA=sha(target),stagedPath=str(target),replacements=n))
for base in [WORK/'modtools/catalog',REPO/'tools/local-workspace/catalog-seed']:
    for rel in ['image_work/personal-patch/events.jsonl','image_work/history.jsonl']:
        p=base/rel
        if p.exists():stage(p,True)
for p in (REPO/'records').glob('*/installation.json'):stage(p)
reviewplan=HERE/'review-link-changes.json';assert reviewplan.exists(),'Review link staging not ready'
for f in load(reviewplan):
    p=Path(f['path']);assert under(p,PROJECT/'output') and p.suffix in ['.html','.js','.json']
    assert sha(p)==f['beforeSHA'] and sha(f['stagedPath'])==f['afterSHA'];changes.append(f)
assert len({norm(f['path']) for f in changes})==len(changes)
replacement_count=lambda f:len(f['replacements']) if isinstance(f['replacements'],list) else f['replacements']
plan=dict(schema='jo9-mob-body-move-v1',approval='복사 말고 이동이니까 이동하고 나서 중복된건 삭제해.',destination=str(DEST),moveFiles=move,keepFiles=keep,metadataChanges=changes,protectedQsp=sha(WORK/'jack.qsp'),protectedWorkIds=sha(WORK/'modtools/catalog/catalog_work_ids.json'),protectedCatalogHtml=sha(WORK/'modtools/catalog/catalog_merge_vs_original.html'),protectedCatalogStatus=sha(WORK/'modtools/catalog/catalog_status.js'),summary=dict(movePaths=len(move),keepPaths=len(keep),metadataFiles=len(changes),metadataPathReplacements=sum(replacement_count(f) for f in changes),removedSourceBytes=sum(f['bytes'] for f in move)),manifestBeforeSHA=sha(SOURCE_MANIFEST))
(HERE/'move-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
if args.action=='plan':print(json.dumps(dict(status='MOVE_PREFLIGHT_PASS',**plan['summary'])));raise SystemExit(0)
for f in changes:assert sha(f['path'])==f['beforeSHA'] and sha(f['stagedPath'])==f['afterSHA']
for f in move:assert sha(safe_source(f['source']))==f['sha256']==sha(f['destination'])
records=DEST/'relocation_records';records.mkdir(exist_ok=True)
assert not (os.lstat(records).st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT)
backup=records/'metadata-before';backup.mkdir(exist_ok=True)
for i,f in enumerate(changes):
    b=Path(f['path']).read_bytes();assert hashlib.sha256(b).hexdigest()==f['beforeSHA']
    out=backup/(f'{i:02d}-'+Path(f['path']).name+'.gz');out.write_bytes(gzip.compress(b,compresslevel=9));f['beforeBackup']=str(out)
for name in ['SOURCE_MANIFEST_20261029.json','SOURCE_INDEX_20261029.csv','README_MOB_BODY_KO.md']:
    p=DEST/name;(backup/(name+'.gz')).write_bytes(gzip.compress(p.read_bytes(),compresslevel=9))
plan.update(status='PREPARED',metadataApplied=[],removedSources=[]);atomic(JOURNAL,json.dumps(plan,ensure_ascii=False,indent=2).encode())
def save():atomic(JOURNAL,json.dumps(plan,ensure_ascii=False,indent=2).encode())
for f in changes:
    assert sha(f['path'])==f['beforeSHA'],'Concurrent metadata edit: '+f['path']
    atomic(f['path'],Path(f['stagedPath']).read_bytes());assert sha(f['path'])==f['afterSHA']
    plan['metadataApplied'].append(f['path']);save()
plan['status']='REMOVING_VERIFIED_DUPLICATE_SOURCES';save()
for f in move:
    p=safe_source(f['source']);assert sha(p)==f['sha256']==sha(f['destination'])
    p.unlink();assert not p.exists();plan['removedSources'].append(f['source']);save()
for e in m['entries']:
    e['originalSource']=e['source'];e['source']=e['destination']
    for r in e['sources']:
        old=r['path'];r['originalPath']=old
        if norm(old) in mapping:r['path']=e['destination'];r['relocationStatus']='MOVED_TO_ARCHIVE'
        else:r['relocationStatus']='KEEP_ORIGINAL_GAME_OR_RUNTIME'
m.update(status='MOVED_AND_VERIFIED',moveJournal=str(JOURNAL),moveSummary=plan['summary'],originalFilesRetainedOnlyForGameAndOriginal=len(keep))
atomic(SOURCE_MANIFEST,json.dumps(m,ensure_ascii=False,indent=2).encode())
csvp=DEST/'SOURCE_INDEX_20261029.csv'
with csvp.open('r',encoding='utf-8-sig',newline='') as f:reader=csv.DictReader(f);fields=reader.fieldnames;rows=list(reader)
fields=fields+['currentSource','movedOriginalPaths','keptProtectedPaths']
for row,e in zip(rows,m['entries']):
    assert row['archiveFile']==e['destinationRelative']
    row.update(currentSource=e['destination'],movedOriginalPaths=sum(r['relocationStatus']=='MOVED_TO_ARCHIVE' for r in e['sources']),keptProtectedPaths=sum(r['relocationStatus']!='MOVED_TO_ARCHIVE' for r in e['sources']))
with csvp.open('w',encoding='utf-8-sig',newline='') as f:writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(rows)
readme=DEST/'README_MOB_BODY_KO.md';t=readme.read_text(encoding='utf-8')
t=t.replace('원본·WORK·복구 폴더의 파일을 이동하거나 삭제하지 않고 사본만 만들었습니다.','사용자 정정에 따라 작업·복구·생성 폴더의 원본174개 경로는 실제 이동 처리하고 중복 사본을 제거했습니다. 순정 원본33개와 현재 게임에서 쓰는 WORK2개는 유지했습니다.')
t+='\n\n이동 정산은 MOVE_JOURNAL_20261029.json에 있습니다. 현재 개인패치 비교용 beforePath, 관련 installation의 복구 경로와 기존 검토 페이지 링크를 새 위치로 맞췄습니다. 이벤트 ID와 이미지 해시는 변경하지 않았습니다. 원래 경로로 되돌려야 할 때는 journal의 destination에서 source로 해당 SHA256 파일을 복사하고, metadata-before의 이전 메타데이터는 이후 변경이 없는지 확인한 뒤 참고합니다. 복구를 실행하지 않았습니다.\n'
atomic(readme,t.encode())
assert sha(WORK/'jack.qsp')==plan['protectedQsp'];assert sha(WORK/'modtools/catalog/catalog_work_ids.json')==plan['protectedWorkIds']
assert sha(WORK/'modtools/catalog/catalog_merge_vs_original.html')==plan['protectedCatalogHtml']
assert sha(WORK/'modtools/catalog/catalog_status.js')==plan['protectedCatalogStatus']
for f in keep:assert sha(f['source'])==f['sha256']
plan.update(status='MOVED_AND_VERIFIED',finishedUtc=datetime.datetime.now(datetime.timezone.utc).isoformat());save()
(HERE/'move-result.json').write_text(json.dumps(dict(status=plan['status'],**plan['summary'],journal=str(JOURNAL)),ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(status=plan['status'],**plan['summary'],journal=str(JOURNAL)),ensure_ascii=False))
