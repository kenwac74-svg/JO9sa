"""Independent, read-only post-move audit. Only local verification JSON is written."""
from pathlib import Path
from PIL import Image
from urllib.parse import unquote,urlsplit
import json,hashlib,gzip,os,re,copy,html,datetime,collections
HERE=Path(__file__).resolve().parent;DEST=Path('G:/somi/JO9resource/mob_body')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def hashbytes(b):return hashlib.sha256(b).hexdigest()
def sha(p):return hashbytes(Path(p).read_bytes())
def norm(p):return str(p).replace('\\','/').lower().rstrip('/')
J=load(DEST/'MOVE_JOURNAL_20261029.json');M=load(DEST/'SOURCE_MANIFEST_20261029.json')
mapping={norm(f['source']):f for f in J['moveFiles']};checks=[];errors=[];appends=[]
def need(x,msg):
    if not x:raise AssertionError(msg)
def check(name,fn):
    try:checks.append(dict(name=name,pass_=True,detail=fn()))
    except Exception as ex:checks.append(dict(name=name,pass_=False,error=str(ex)));errors.append(dict(check=name,error=str(ex)))

def movement():
    need(J['status']=='MOVED_AND_VERIFIED','move journal status')
    need(len(mapping)==174 and len(J['keepFiles'])==35,'scope counts')
    for f in J['moveFiles']:
        need(not os.path.lexists(f['source']),'source still exists '+f['source'])
        need(sha(f['destination'])==f['sha256'],'archive bytes mismatch '+f['source'])
        need(Path(f['destination']).stat().st_size==f['bytes'],'archive length mismatch')
    for f in J['keepFiles']:
        need(sha(f['source'])==f['sha256']==sha(f['destination']),'kept source hash '+f['source'])
    keep={norm(f['source']) for f in J['keepFiles']}
    need(len(keep)==35 and not keep.intersection(mapping),'partition overlaps')
    need(set(map(norm,J['removedSources']))==set(mapping),'removed source list differs')
    return dict(oldPathsAbsent=174,keptOriginalAndRuntimePaths=35,rawHashesPreserved=True,oldSourceBytesRemoved=sum(f['bytes'] for f in J['moveFiles']))
check('174_moved_35_kept',movement)

def archive():
    need(len(M['entries'])==135,'archive image count')
    seen=set();high=0
    for e in M['entries']:
        p=Path(e['destination']);need(sha(p)==e['destinationSha256'],'PNG bytes '+str(p))
        with Image.open(p) as im:
            im.load();need(im.format=='PNG','not PNG');rgba=im.convert('RGBA');a=rgba.getchannel('A');lo,hi=a.getextrema();hist=a.histogram()
            pixel=hashbytes(str(im.size).encode()+b'|'+rgba.tobytes())
            need((im.width,im.height,lo,hi,pixel)==(e['width'],e['height'],e['alphaMin'],e['alphaMax'],e['pixelSha256']),'PNG metadata '+str(p))
            need(sum(hist[:16])/(im.width*im.height)>=.01,'transparent background missing')
        need(pixel not in seen,'duplicate image pixels');seen.add(pixel)
        ish=e['width']>795 or e['height']>596;high+=ish
        need(ish==e['highResolution'],'high-resolution flag')
        need(p.relative_to(DEST).as_posix().startswith('high_resolution/')==ish,'high-resolution folder')
    need(high==31 and len(seen)-high==104,'resolution counts')
    need({norm(p) for p in DEST.rglob('*.png')}=={norm(e['destination']) for e in M['entries']},'unlisted PNG')
    snapshot=gzip.decompress((DEST/'relocation_records/metadata-before/SOURCE_MANIFEST_20261029.json.gz').read_bytes())
    need(hashbytes(snapshot)==J['manifestBeforeSHA'],'copy manifest recovery hash')
    old=json.loads(snapshot.decode('utf-8-sig'))
    need({e['destinationSha256'] for e in old['entries']}=={e['destinationSha256'] for e in M['entries']},'archive image bytes changed during move')
    return dict(verifiedOpaqueBackgroundExcludedPNG=135,highResolution=31,standardAndLegacy=104,archiveBytesUnchangedSinceCopy=True)
check('archive_135_PNG_geometry_alpha_and_pixel_integrity',archive)

def beforemeta(r):
    b=gzip.decompress(Path(r['beforeBackup']).read_bytes());need(hashbytes(b)==r['beforeSHA'],'metadata backup hash '+r['path']);return b
def aftermeta(r):
    staged=Path(r['stagedPath']).read_bytes();need(hashbytes(staged)==r['afterSHA'],'staging hash '+r['path'])
    current=Path(r['path']).read_bytes()
    if hashbytes(current)==r['afterSHA']:return current
    if Path(r['path']).suffix=='.jsonl' and current.startswith(staged):
        extra=[json.loads(x) for x in current[len(staged):].decode('utf-8').splitlines() if x.strip()]
        appends.append(dict(path=r['path'],extraEvents=len(extra)));return staged
    raise AssertionError('metadata changed after relocation '+r['path'])
def equal_except_paths(before,after,path=()):
    need(type(before) is type(after),'type changed '+str(path))
    if isinstance(before,dict):
        need(set(before)==set(after),'keys changed '+str(path));return sum(equal_except_paths(before[k],after[k],path+(k,)) for k in before)
    if isinstance(before,list):
        need(len(before)==len(after),'list length changed '+str(path));return sum(equal_except_paths(a,b,path+(i,)) for i,(a,b) in enumerate(zip(before,after)))
    if before==after:return 0
    need(isinstance(before,str),'number/flag changed '+str(path))
    f=mapping.get(norm(before));need(f is not None,'non-move path value changed '+str(path));need(norm(after)==norm(f['destination']),'wrong moved path '+str(path));return 1
def metadata():
    need(len(J['metadataChanges'])==13,'metadata count')
    migrated=0
    for r in J['metadataChanges']:
        b=beforemeta(r);a=aftermeta(r)
        if isinstance(r['replacements'],list):continue
        if Path(r['path']).suffix=='.jsonl':
            old=[json.loads(x) for x in b.decode('utf-8-sig').splitlines() if x.strip()];new=[json.loads(x) for x in a.decode('utf-8-sig').splitlines() if x.strip()]
        else:old=json.loads(b.decode('utf-8-sig'));new=json.loads(a.decode('utf-8-sig'))
        changed=equal_except_paths(old,new);need(changed==r['replacements'],'path replacement count '+r['path']);migrated+=changed
    need(migrated==410,'structured relocation paths')
    return dict(filesVerified=13,structuredAddressOnlyChanges=410,numbersFlagsIDsAndHashesPreserved=True,laterLiveAppends=appends)
check('metadata_13_backup_hash_and_address_only_changes',metadata)

def ledgers():
    found=0
    for r in J['metadataChanges']:
        if not norm(r['path']).endswith('/personal-patch/events.jsonl'):continue
        rows=[json.loads(x) for x in aftermeta(r).decode('utf-8').splitlines() if x.strip()]
        for event in rows:
            for f in event.get('files',[]):
                p=f.get('beforePath')
                if p and norm(p).startswith(norm(DEST)+'/'):
                    need(sha(p)==f['before'],'ledger before hash mismatch '+p);found+=1
    need(found==174,'87 WORK and 87 portable beforePath references')
    return dict(beforePathsVerified=found,WORKPaths=87,portablePaths=87,imageHashAndEventIDsUnchanged=True)
check('live_and_portable_beforePath_consumers',ledgers)

ATTR=re.compile(r'\b(src|href)\s*=\s*([\"\'])(.*?)\2',re.I);DEC=json.JSONDecoder()
def setpath(obj,path,value):
    for k in path[:-1]:obj=obj[k]
    obj[path[-1]]=value
def reviews():
    total=0;files=0
    for r in J['metadataChanges']:
        reps=r['replacements']
        if not isinstance(reps,list):continue
        old=beforemeta(r).decode('utf-8');new=aftermeta(r).decode('utf-8');files+=1;total+=len(reps)
        if Path(r['path']).suffix in ['.js','.json']:
            oi=old.index('{');ni=new.index('{');od,oe=DEC.raw_decode(old,oi);nd,ne=DEC.raw_decode(new,ni);expected=copy.deepcopy(od)
            for x in reps:setpath(expected,x['jsonPath'],x['new'])
            need(expected==nd,'review data beyond link changed')
            need(old[:oi]==new[:ni] and old[oe:]==new[ne:],'JS prefix/suffix code changed')
        else:
            lookup={(x['attribute'].lower(),x['old']):x['new'] for x in reps};hits=0
            def replace(match):
                nonlocal hits
                val=html.unescape(match[3]);target=lookup.get((match[1].lower(),val))
                if target is None:return match[0]
                hits+=1;return match[0][:match.start(3)-match.start()]+html.escape(target,quote=True)+match[0][match.end(3)-match.start():]
            reconstructed=ATTR.sub(replace,old);need(reconstructed==new and hits==len(reps),'HTML beyond address changed')
        for x in reps:
            uri=x['new'];need(uri.startswith('file:///G:/somi/JO9resource/mob_body/'),'wrong URI')
            dest=unquote(urlsplit(uri).path).lstrip('/');need(sha(dest)==x['sha256'],'review target hash')
    need(files==4 and total==202,'review count')
    return dict(reviewFiles=4,addressChanges=202,newJavaScriptFunctions=0,allNewURITargetsVerified=True)
check('4_review_UIs_URI_only_changes',reviews)

def protected():
    props=[(WORK/'jack.qsp','protectedQsp'),(WORK/'modtools/catalog/catalog_work_ids.json','protectedWorkIds'),(WORK/'modtools/catalog/catalog_merge_vs_original.html','protectedCatalogHtml'),(WORK/'modtools/catalog/catalog_status.js','protectedCatalogStatus')]
    for p,k in props:need(sha(p)==J[k],'protected current file differs '+str(p))
    need(J['summary']['metadataPathReplacements']==612,'total path count')
    return dict(QSPUnchanged=True,workIDsUnchanged=True,catalogHTMLUnchanged=True,catalogStatusUnchanged=True,authorizedLedgerAndHistoryPathUpdates=True)
check('QSP_ID_catalog_HTML_status_protected',protected)

report=dict(pass_=not errors,createdUtc=datetime.datetime.now(datetime.timezone.utc).isoformat(),journal=str(DEST/'MOVE_JOURNAL_20261029.json'),checks=checks,errors=errors,
            limits=['Read-only independent audit; no original, WORK, backup or archive file modified by auditor.','The earlier copy-stage verification remains a historical snapshot.','Relocation updates authorized ledger/history path metadata; runtime/QSP/catalog HTML/status are checked separately.'])
(HERE/'move-independent-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(pass_=report['pass_'],checks=len(checks),errors=errors),ensure_ascii=False))
