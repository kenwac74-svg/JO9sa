"""Copy verified transparent standing art into the user-named reuse library.
No source files are moved, renamed, edited or deleted. No pixel processing.
"""
from pathlib import Path
from PIL import Image
import os,stat,json,hashlib,collections,csv,shutil,argparse,datetime
HERE=Path(__file__).resolve().parent
DEST=Path('G:/somi/JO9resource/mob_body')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def norm(p):return str(p).replace('\\','/').lower()
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def pixels(p):
    with Image.open(p) as im:
        im.load();rgba=im.convert('RGBA');return hashlib.sha256(str(im.size).encode()+b'|'+rgba.tobytes()).hexdigest()
def regular_directory(p):
    if p.exists():assert p.is_dir() and not (os.lstat(p).st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT),str(p)
def source_rank(r):
    p=norm(r['path'])
    if '/mob-backgrounds-adopted-20261029/original/' in p:return 0
    if 'current-work' in r['origins']:return 1
    if '/images/battle/' in p:return 2
    if '/pixel-preserved' in p or '.pixel-preserved.' in p:return 3
    if '/final/content/pic/' in p:return 4
    if '/jo9_work_backups/' in p:return 5
    if '/generated_images/' in p:return 6
    if 'original-game' in r['origins']:return 9
    return 7
inv=load(HERE/'inventory.json');assert not inv['errors'],inv['errors']
regular_directory(DEST);regular_directory(DEST.parent)
groups=collections.defaultdict(list)
for r in inv['records']:
    if r['included']:groups[r['pixelSha256']].append(r)
existing=[]
if DEST.exists():
    for folder,dirs,files in os.walk(DEST,followlinks=False):
        dirs[:]=[d for d in dirs if not (os.lstat(Path(folder)/d).st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT)]
        for f in files:
            p=Path(folder)/f
            if p.suffix.lower()=='.png':existing.append(dict(path=str(p),sha256=sha(p),pixelSha256=pixels(p)))
existing_pixel={r['pixelSha256']:r for r in existing};claimed={};entries=[]
for pixel,records in groups.items():
    records.sort(key=lambda r:(source_rank(r),len(r['path']),norm(r['path'])))
    chosen=records[0];runtime_paths=sorted({p for r in records for p in r['runtimePaths']},key=str.lower)
    assert runtime_paths,pixel
    canonical=runtime_paths[0];name=Path(canonical).name
    high=chosen['width']>795 or chosen['height']>596
    entries.append(dict(canonical=canonical,name=name,highResolution=high,pixelSha256=pixel,source=chosen['path'],sourceSha256=chosen['sha256'],width=chosen['width'],height=chosen['height'],alphaMin=chosen['alphaMin'],alphaMax=chosen['alphaMax'],bytes=chosen['bytes'],runtimePaths=runtime_paths,sources=records,sourceRank=source_rank(chosen)))
entries.sort(key=lambda e:(e['highResolution'],e['canonical'].lower(),e['sourceRank'],e['pixelSha256']))
for e in entries:
    if e['pixelSha256'] in existing_pixel:
        old=existing_pixel[e['pixelSha256']];dest=Path(old['path']);e.update(destination=str(dest),destinationRelative=dest.relative_to(DEST).as_posix(),existing=True,destinationSha256=old['sha256']);continue
    folder='high_resolution' if e['highResolution'] else ''
    primary=(Path(folder)/e['name']).as_posix();key=primary.lower()
    if key in claimed or (DEST/primary).exists():
        folder=(Path(folder)/'variants').as_posix() if folder else 'variants'
        relative=(Path(folder)/(Path(e['name']).stem+'__'+e['pixelSha256'][:16]+'.png')).as_posix()
    else:relative=primary
    target=DEST/relative;assert relative.lower() not in claimed
    if target.exists():
        assert sha(target)==e['sourceSha256'],'Existing archive conflict: '+str(target)
        already=True
    else:already=False
    claimed[relative.lower()]=e['pixelSha256']
    e.update(destination=str(target),destinationRelative=relative,existing=already,destinationSha256=e['sourceSha256'])
summary=dict(uniqueImages=len(entries),highResolution=sum(e['highResolution'] for e in entries),standardAndLegacy=sum(not e['highResolution'] for e in entries),uniqueRuntimeNames=len({p.lower() for e in entries for p in e['runtimePaths']}),sourcePaths=sum(len(e['sources']) for e in entries),existingImages=sum(e['existing'] for e in entries),newCopies=sum(not e['existing'] for e in entries),newBytes=sum(e['bytes'] for e in entries if not e['existing']))
earlier=load(HERE/'copy-plan.json') if (HERE/'copy-plan.json').exists() else None
initial_summary=(earlier.get('initialCollectionSummary',earlier['summary']) if earlier else summary)
plan=dict(schema='jo9-transparent-mob-body-archive-v1',date='2026-10-29',destination=str(DEST),method='byte-for-byte copies; deduplicate identical RGBA pixels at the same size; preserve distinct resolutions and visual versions',summary=summary,initialCollectionSummary=initial_summary,entries=entries,excludedScope=inv['scope'],missingSourceReferences=inv['missing'],protected=inv['protected'])
(HERE/'copy-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
args=argparse.ArgumentParser();args.add_argument('--apply',action='store_true');args=args.parse_args()
if not args.apply:print(json.dumps(dict(status='PREFLIGHT',**summary),ensure_ascii=False));raise SystemExit(0)
DEST.mkdir(parents=True,exist_ok=True);regular_directory(DEST)
manifest=DEST/'SOURCE_MANIFEST_20261029.json';csvpath=DEST/'SOURCE_INDEX_20261029.csv';readme=DEST/'README_MOB_BODY_KO.md'
for p in [manifest,csvpath,readme]:assert not p.exists(),'Archive report already exists; inspect before repeating: '+str(p)
for e in entries:
    source=Path(e['source']);target=Path(e['destination'])
    assert sha(source)==e['sourceSha256'],'Source changed since inventory: '+str(source)
    target.parent.mkdir(parents=True,exist_ok=True);regular_directory(target.parent)
    assert target.resolve().is_relative_to(DEST.resolve()),str(target)
    if not target.exists():
        with source.open('rb') as src,target.open('xb') as dst:shutil.copyfileobj(src,dst)
    assert sha(target)==e['destinationSha256'];assert pixels(target)==e['pixelSha256']
    with Image.open(target) as im:
        im.load();assert im.format=='PNG' and list(im.size)==[e['width'],e['height']]
        amin,amax=im.convert('RGBA').getchannel('A').getextrema();assert amin==e['alphaMin'] and amax==e['alphaMax']
# Verify every candidate source remains byte-identical, including alias copies.
for e in entries:
    for r in e['sources']:assert sha(r['path'])==r['sha256'],'Original changed: '+r['path']
drift=[dict(path=r['path'],before=r['sha256'],after=sha(r['path'])) for r in inv['protected'] if sha(r['path'])!=r['sha256']]
# This collector never writes to WORK. A live checklist can be edited concurrently;
# record and preserve those edits instead of rolling them back or suppressing them.
assert all(Path(r['path']).name in ['catalog_merge_vs_original.html','catalog_status.js'] for r in drift),drift
plan['status']='COPIED_AND_VERIFIED';plan['verifiedAtUtc']=datetime.datetime.now(datetime.timezone.utc).isoformat();plan['sourceImagesUnchanged']=True
plan['qspAndWorkIdsUnchanged']=True;plan['gameOrCatalogWritesByCollector']=False;plan['concurrentCatalogChangesPreserved']=drift
manifest.write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
with csvpath.open('w',encoding='utf-8-sig',newline='') as f:
    fields=['archiveFile','runtimePaths','width','height','highResolution','sha256','originalSource','allSourcePaths'];writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
    for e in entries:writer.writerow(dict(archiveFile=e['destinationRelative'],runtimePaths=' | '.join(e['runtimePaths']),width=e['width'],height=e['height'],highResolution=e['highResolution'],sha256=e['destinationSha256'],originalSource=e['source'],allSourcePaths=' | '.join(r['path'] for r in e['sources'])))
readme.write_text('''# 투명 배경 MOB 전투 전신 재활용 보관함

2026-10-29 사용자 요청으로 기존 투명 전신과 고해상도 원본을 모았습니다. 원본·WORK·복구 폴더의 파일을 이동하거나 삭제하지 않고 사본만 만들었습니다. 픽셀·해상도·투명도·PNG 형식을 그대로 보존합니다.

- 루트: 기존 전투 파일명으로 찾을 수 있는 게임 규격/기존 규격 전신.
- high_resolution: 게임 규격795×596보다 큰 원본 해상도 전신.
- variants 및 high_resolution/variants: 같은 이름의 다른 그림·규격·수정 버전. 해시 일부로 구분하며 기존 파일을 덮어쓰지 않습니다.
- SOURCE_INDEX_20261029.csv: 파일명, 해상도, 원래 게임 경로, 출처를 검색할 수 있는 목록.
- SOURCE_MANIFEST_20261029.json: 정확한 원본 경로·해시·알파 정보 및 동일 이미지의 모든 출처.

동일 규격·동일 RGBA 픽셀은 한 사본으로 모으고 출처만 합쳤습니다. 다른 해상도나 다른 그림은 별도 보존했습니다. 초상·패배 포즈·경주 전용 초상·이펙트·불투명 배경 장면은 이 전투 전신 모음의 대상이 아닙니다. 이미 배경이 그려진 원화는 투명화하거나 재편집하지 않았습니다. 원래 컷오프 구도와 투명 여백도 바꾸지 않았습니다.
''',encoding='utf-8')
(HERE/'archive-result.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(status=plan['status'],**summary,manifest=str(manifest)),ensure_ascii=False))
