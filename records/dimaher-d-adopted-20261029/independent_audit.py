"""Independent read-only WORK audit; only writes this local verification report."""
from pathlib import Path
from PIL import Image
import json, re, hashlib, gzip, datetime

HERE=Path(__file__).resolve().parent
REPO=Path('G:/somi/JO9sa')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
CAT=WORK/'modtools/catalog'
REC=REPO/'records/dimaher-d-adopted-20261029/installation.json'
r=json.loads(REC.read_text(encoding='utf8'))
def sha(b): return hashlib.sha256(b).hexdigest()
def norm(p): return p.replace('\\','/').lower()
checks=[]
def check(name,fn):
    try:
        detail=fn()
        checks.append({'name':name,'pass':True,'detail':detail})
    except Exception as ex:
        checks.append({'name':name,'pass':False,'error':str(ex)})
def need(v,msg='assertion failed'):
    if not v: raise AssertionError(msg)
def prior(index):
    b=r['metadataBackups'][index]
    raw=gzip.decompress(Path(b['backup']).read_bytes())
    need(sha(raw)==b['sha256'],'metadata backup digest mismatch')
    return raw
def parsehtml(raw):
    s=raw.decode('utf8')
    dr=re.search(r'var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR',s)
    mr=re.search(r'window.JO9_MOB_SETS=(.*?);</script>',s)
    return s,json.loads(dr[1]),json.loads(mr[1]),dr,mr
oldraw=prior(0)
newraw=(CAT/'catalog_merge_vs_original.html').read_bytes()
oh,od,om,odr,omr=parsehtml(oldraw)
nh,nd,nm,ndr,nmr=parsehtml(newraw)
files={norm(f['path']):f for f in r['files']}

def meta_backups():
    for i in range(len(r['metadataBackups'])): prior(i)
    return len(r['metadataBackups'])
check('metadata_backups_integrity',meta_backups)

def images():
    need(r['status']=='INSTALLED' and len(files)==2)
    for p,f in files.items():
        for root in (WORK,REPO/'resources/new'):
            need(sha((root/f['path']).read_bytes())==f['after'],str(root/f['path']))
        if f['before'] is not None:
            need(sha(Path(f['beforePath']).read_bytes())==f['before'],f['path']+' original backup')
        else:
            need(f.get('beforePath') is None, f['path']+' new file should not have original backup')
        if f['trackedBefore']:
            need(sha(Path(f['trackedBeforePath']).read_bytes())==f['trackedBefore'],f['path']+' tracked backup')
        need(sha(Path(f['source']).read_bytes())==f['after'],f['path']+' selected source')
        with Image.open(WORK/f['path']) as im:
            im.load(); need(im.format=='PNG' and im.size==(795,596),f['path']+' format/size')
            need(im.convert('RGBA').getchannel('A').getextrema()==(255,255),f['path']+' transparency')
    need(sum(f['before'] is None for f in files.values())==1,'one preexisting missing defeat file expected')
    return {'runtimeMirrorMatches':2,'existingOriginalBackups':1,'newFiles':1,'size':[795,596],'fullyDecoded':2,'allOpaque':True}
check('all_2_images_and_recovery',images)

def rows():
    need(len(od)==len(nd))
    count=0
    for a,b in zip(od,nd):
        p=norm(a[0])
        if p not in files: need(a==b,'unrelated row '+a[0]); continue
        count+=1;f=files[p]
        for ix in set(range(len(a)))-{3,5,6}: need(a[ix]==b[ix],'row nonimage field '+a[0])
        need(b[3]==f['bytes'] and b[5:7]==[795,596],a[0]+' row metadata')
    need(count==2)
    return {'targetRows':count,'unrelatedRowsPreserved':len(od)-count}
check('catalog_rows_and_ids',rows)

def slots():
    need(len(om['entries'])==len(nm['entries']))
    affected=0; portraits=0; mage=0
    allowed={'exists','width','height','bytes','sha256','workLabel','backgroundComposition','imageRedraw'}
    for a,b in zip(om['entries'],nm['entries']):
        need(a['key']==b['key'])
        for k in set(a)|set(b):
            if k not in ('standing','defeat'): need(a.get(k)==b.get(k),a['key']+' entry '+k)
        need(a['portrait']==b['portrait']);portraits+=1
        for kind in ('standing','defeat'):
            x,y=a.get(kind),b.get(kind)
            if not x: need(x==y);continue
            p=norm(x['path'])
            if 'mageEdit' in x:need(x['mageEdit']==y['mageEdit']);mage+=1
            if p not in files: need(x==y,a['key']+' unmodified '+kind); continue
            affected+=1;f=files[p]
            need(y.get('exists') is True and y['sha256']==f['after'] and y['bytes']==f['bytes'] and [y['width'],y['height']]==[795,596])
            for k in set(x)|set(y):
                if k not in allowed:need(x.get(k)==y.get(k),a['key']+' slot extra '+k)
            need(y['imageRedraw']['record']==r['id'])
    need(affected==2)
    need(sum(not e['defeat'].get('exists') for e in nm['entries'])==sum(not e['defeat'].get('exists') for e in om['entries'])-1, 'one missing defeat slot filled')
    return {'individualSlots':affected,'portraitMetadataPreserved':portraits,'mageEditSlotsCompared':mage}
check('individual_slots_and_Mage_prompts',slots)

def groups():
    og=json.loads(prior(3));ng=json.loads((REPO/'tools/mob-image-sets/group-sets.json').read_text(encoding='utf8'))
    need(len(om['groups'])==len(nm['groups'])==len(og)==len(ng))
    n=0
    for a,b,c,d in zip(om['groups'],nm['groups'],og,ng):
        need(a['key']==b['key']==c['key']==d['key'])
        p=norm(a['defeat']['path'])
        for k in set(a)|set(b):
            if k!='defeat': need(a.get(k)==b.get(k),'group entry '+k)
        for k in set(c)|set(d):
            if k!='defeat': need(c.get(k)==d.get(k),'canonical group entry '+k)
        need(a['defeat'].get('mageEdit')==b['defeat'].get('mageEdit'))
        if p not in files: need(a==b and c==d); continue
        n+=1;f=files[p]
        for s in (b['defeat'],d['defeat']):
            need(s['sha256']==f['after'] and s['bytes']==f['bytes'] and [s['width'],s['height']]==[795,596])
    need(n==0)
    return {'groupSlotsAndCanonicalMetadata':n,'nonTargetGroupPreserved':8}
check('all_groups_preserved',groups)

def status():
    parse=lambda b:json.loads(re.search(r'window\.CATALOG_STATUS\s*=\s*([\s\S]*);\s*$',b.decode('utf8'))[1])
    a=parse(prior(1));b=parse((CAT/'catalog_status.js').read_bytes())
    need(a.get('autoDone')==b.get('autoDone'))
    for k in set(a)|set(b):
        if k not in ('savedAt','items'):need(a.get(k)==b.get(k),'status '+k)
    for p,flags in a['items'].items():
        if norm(p) not in files:need(b['items'].get(p)==flags,'unrelated flags '+p)
        else:need(set(b['items'][p])==(set(flags)-{'todo','wip'})|{'done'},'target extra flag '+p)
    for p,flags in b['items'].items():
        if p not in a['items']:need(norm(p) in files and set(flags)=={'done'},'new unrelated flag')
    need(prior(2)==(CAT/'catalog_work_ids.json').read_bytes(),'stable IDs changed')
    return {'autoDonePreserved':True,'unrelatedFlagsPreserved':True,'customTargetFlagsPreserved':True,'stableIDsByteIdentical':True}
check('status_flags_autoDone_stableIDs',status)

def portraits():
    paths={s['portrait']['path']:s['portrait']['sha256'] for s in om['entries'] if s.get('portrait',{}).get('exists')}
    for p,h in paths.items():need(sha((WORK/p).read_bytes())==h,'portrait hash '+p)
    return {'uniquePortraitPNGsMatchedPreAdoptionSlotHashes':len(paths)}
check('portrait_file_hashes',portraits)

def htmlcode():
    def strip(s):
        s=re.sub(r'var D\s*=\s*\[[\s\S]*?\];(?=\s*\r?\nvar MR)','var D=@ROWS@;',s,count=1)
        return re.sub(r'window.JO9_MOB_SETS=.*?;</script>','window.JO9_MOB_SETS=@MOB@;</script>',s,count=1)
    need(strip(oh)==strip(nh),'HTML/UI code outside data changed')
    return 'byte-equivalent HTML code after replacing two data blocks'
check('catalog_UI_code_preserved',htmlcode)

def qsp():
    h=sha((WORK/'jack.qsp').read_bytes())
    need(h==r['qspBefore']==r['qspAfter'])
    return {'sha256':h,'changed':False,'saveWrites':r['saveWrites']}
check('QSP_unchanged',qsp)

def events():
    for ix,path in ((6,CAT/'image_work/history.jsonl'),(7,CAT/'image_work/personal-patch/events.jsonl')):
        before=prior(ix).decode('utf8');after=path.read_text(encoding='utf8')
        need(after.startswith(before),'existing history overwritten')
        append=[json.loads(x) for x in after[len(before):].splitlines() if x.strip()]
        need(len(append)==1 and append[0]['id']==r['id'])
        need(len(append[0]['files'])==2)
    return 'one 2-file event appended to each existing ledger; previous data preserved'
check('patch_ledger_and_history',events)

def seed():
    p=REPO/'tools/local-workspace/catalog-seed'
    _,sd,sm,_,_=parsehtml((p/'catalog_merge_vs_original.html').read_bytes())
    need(sd==nd and sm==nm,'seed data mismatch')
    need(json.loads((p/'catalog_work_ids.json').read_text(encoding='utf8'))==json.loads((CAT/'catalog_work_ids.json').read_text(encoding='utf8')))
    return 'portable seed rows, MOB slots and stable work IDs match'
check('portable_seed',seed)

def plan():
    v=json.loads((REPO/'records/full-client-preparation-20261029/full-client-input-plan.json').read_text(encoding='utf8'))
    index={norm(x['path']):x for x in v['files']}
    need(v['status']=='BUILD_INPUT_PLAN_NOT_RELEASE_ZIP' and v['qspSha256']==r['qspBefore'])
    for p,f in files.items():need(index['game/'+p]['sha256']==f['after'] and index['game/'+p]['bytes']==f['bytes'],p)
    return '2 current hashes in refreshed runtime input plan; no ZIP assertion made'
check('full_client_input_plan',plan)

out={'pass':all(c['pass'] for c in checks),'record':str(REC),'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':checks,'limits':['Read-only filesystem and metadata audit, not an actual game battle playtest.','No image/UI/QSP/save changes performed by the auditor.']}
(HERE/'independent-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'pass':out['pass'],'checks':len(checks),'failed':[c for c in checks if not c['pass']]},ensure_ascii=False))
