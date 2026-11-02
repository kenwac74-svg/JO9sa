"""Read-only independent adoption audit. Writes only a local verification report.

Run after the installer reports completion; installation.json and its gzip
before-metadata are authoritative. WORK and portable seed have independent
baselines because unrelated var-D metadata drift predates this adoption.
"""
from pathlib import Path
from PIL import Image
import datetime, gzip, hashlib, json, re

HERE = Path(__file__).resolve().parent
REPO = Path('G:/somi/JO9sa')
WORK = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
CAT = WORK/'modtools/catalog'
SEED = REPO/'tools/local-workspace/catalog-seed'
RECORD = REPO/'records/arena-combat-redraw-adopted-20261030/installation.json'
REVIEW = HERE.parent/'arena-combat-redraw-20261030/review-manifest.json'
EXPECTED_ID = 'arena-combat-redraw-adopted-20261030'
EXPECTED_COUNT = 43

def sha(raw): return hashlib.sha256(raw).hexdigest()
def norm(p): return str(p).replace('\\', '/').lower()
def need(value, message='assertion failed'):
    if not value: raise AssertionError(message)
def parsehtml(raw):
    s=raw.decode('utf-8-sig')
    d=re.search(r'var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR',s)
    m=re.search(r'window.JO9_MOB_SETS=(.*?);</script>',s)
    need(d and m,'catalog data blocks missing')
    return s,json.loads(d[1]),json.loads(m[1])
def striphtml(s):
    s=re.sub(r'var D\s*=\s*\[[\s\S]*?\];(?=\s*\r?\nvar MR)','var D=@ROWS@;',s,count=1)
    return re.sub(r'window.JO9_MOB_SETS=.*?;</script>','window.JO9_MOB_SETS=@MOB@;</script>',s,count=1)
def statusparse(raw):
    return json.loads(re.search(r'window\.CATALOG_STATUS\s*=\s*([\s\S]*);\s*$',raw.decode('utf-8-sig'))[1])

def main():
    need(RECORD.exists(),'installer completion record does not exist; wait for root completion signal')
    r=json.loads(RECORD.read_text(encoding='utf-8-sig'))
    review=json.loads(REVIEW.read_text(encoding='utf-8-sig'))
    entries=review['entries']
    selected={norm(e['runtimePath']):e for e in entries}
    files={norm(f['path']):f for f in r['files']}
    backups={norm(x['path']):x for x in r['metadataBackups']}
    checks=[]
    def check(name,fn):
        try: checks.append({'name':name,'pass':True,'detail':fn()})
        except Exception as ex: checks.append({'name':name,'pass':False,'error':str(ex)})
    def prior(path):
        b=backups[norm(path)]
        raw=gzip.decompress(Path(b['backup']).read_bytes())
        need(sha(raw)==b['sha256'],'metadata backup digest mismatch: '+str(path))
        return raw
    oldraw=prior(CAT/'catalog_merge_vs_original.html')
    oldhtml,oldd,oldmob=parsehtml(oldraw)
    newhtml,newd,newmob=parsehtml((CAT/'catalog_merge_vs_original.html').read_bytes())
    oldseedhtml,oldseedd,oldseedmob=parsehtml(prior(SEED/'catalog_merge_vs_original.html'))
    newseedhtml,newseedd,newseedmob=parsehtml((SEED/'catalog_merge_vs_original.html').read_bytes())
    def integrity():
        need(r['id']==EXPECTED_ID and r['status']=='INSTALLED')
        need(len(entries)==len(selected)==len(files)==EXPECTED_COUNT,'43 unique target files required')
        need(set(selected)==set(files),'installer/review target list mismatch')
        for b in r['metadataBackups']: prior(b['path'])
        return {'targets':43,'gzipBackupsChecked':len(backups)}
    check('installation_record_and_metadata_integrity',integrity)
    def images():
        existing=0
        for p,f in files.items():
            e=selected[p];need(f['after']==e['sha256'],'selected review differs: '+p)
            need(sha(Path(e['gameReadyPath']).read_bytes())==f['after'],'review source: '+p)
            for root in (WORK,REPO/'resources/new'):
                fn=root/f['path'];need(sha(fn.read_bytes())==f['after'],str(fn))
                with Image.open(fn) as im:
                    im.load();need(im.format=='PNG' and im.size==(795,596),str(fn)+' size/format')
                    need(im.convert('RGBA').getchannel('A').getextrema()==(255,255),str(fn)+' transparency')
            if f.get('before'):
                need(sha(Path(f['beforePath']).read_bytes())==f['before'],p+' original recovery')
                existing+=1
            if f.get('trackedBefore'):
                need(sha(Path(f['trackedBeforePath']).read_bytes())==f['trackedBefore'],p+' tracked recovery')
        return {'workImages':43,'resourceMirrors':43,'size':[795,596],'allOpaque':True,'originalRecoveries':existing}
    check('all_43_selected_images_mirrors_and_recovery',images)
    def rowcheck(a,b,label):
        need(len(a)==len(b),label+' row count changed')
        n=0
        for old,new in zip(a,b):
            p=norm(old[0]);need(norm(new[0])==p,label+' row order/path changed')
            if p not in files:need(old==new,label+' unrelated row '+old[0]);continue
            n+=1;f=files[p]
            need(len(old)==len(new),label+' target row schema changed')
            for ix in set(range(len(old)))-{3,5,6}:need(old[ix]==new[ix],label+' target nonimage field '+old[0])
            need(new[3]==f['bytes'] and new[5:7]==[795,596],label+' target metadata '+old[0])
        need(n==43,label+' expected43 target rows, got'+str(n))
        return {'targetRows':n,'unrelatedRowsPreserved':len(a)-n}
    check('WORK_catalog_rows_and_stable_fields',lambda:rowcheck(oldd,newd,'WORK'))
    check('seed_rows_preserve_own_preexisting_drift',lambda:rowcheck(oldseedd,newseedd,'seed'))
    allowed={'exists','width','height','bytes','sha256','workLabel','backgroundComposition','imageRedraw'}
    def slotcheck(before,after,label):
        need(len(before['entries'])==len(after['entries']),label+' entry count')
        need(before.get('groups')==after.get('groups'),label+' group slots changed')
        for k in set(before)|set(after):
            if k not in ('entries','workUpdate'):need(before.get(k)==after.get(k),label+' MOB global '+k)
        oldupdate=before.get('workUpdate',{});newupdate=after.get('workUpdate',{})
        for k in set(oldupdate)|set(newupdate):
            if k!='lastImageRedraw':need(oldupdate.get(k)==newupdate.get(k),label+' unapproved workUpdate '+k)
        redraw=newupdate.get('lastImageRedraw',{})
        need(redraw=={'date':'2026-10-30','files':43,'entrySlots':43,'groupSlots':0,'size':[795,596],'record':r['id']},label+' workUpdate provenance')
        n=0;portraits=0;mage=0
        for a,b in zip(before['entries'],after['entries']):
            need(a['key']==b['key'],label+' key order')
            for k in set(a)|set(b):
                if k not in ('standing','defeat'):need(a.get(k)==b.get(k),label+' entry '+a['key']+' '+k)
            need(a['portrait']==b['portrait'],label+' portrait metadata '+a['key']);portraits+=1
            for kind in ('standing','defeat'):
                x,y=a.get(kind),b.get(kind)
                if not x:need(x==y,label+' slot schema');continue
                p=norm(x['path'])
                need(x.get('mageEdit')==y.get('mageEdit'),label+' Mage prompt '+a['key']+' '+kind)
                if 'mageEdit' in x:mage+=1
                if p not in files:need(x==y,label+' unrelated '+a['key']+' '+kind);continue
                n+=1;f=files[p]
                need(y.get('exists') is True and y.get('sha256')==f['after'] and y.get('bytes')==f['bytes'] and [y.get('width'),y.get('height')]==[795,596],label+' target slot '+a['key']+' '+kind)
                for k in set(x)|set(y):
                    if k not in allowed:need(x.get(k)==y.get(k),label+' unapproved slot field '+a['key']+' '+kind+' '+k)
                need(y.get('imageRedraw',{}).get('record')==r['id'],label+' redraw provenance')
        need(n==43,label+' target slot count'+str(n))
        return {'targetSlots':n,'portraitsPreserved':portraits,'MageSlotsCompared':mage}
    check('WORK_slots_portraits_Mage_and_unrelated_metadata',lambda:slotcheck(oldmob,newmob,'WORK'))
    check('seed_slots_portraits_Mage_and_unrelated_metadata',lambda:slotcheck(oldseedmob,newseedmob,'seed'))
    def statuses():
        results=[]
        for root,label in ((CAT,'WORK'),(SEED,'seed')):
            a=statusparse(prior(root/'catalog_status.js'));b=statusparse((root/'catalog_status.js').read_bytes())
            for k in set(a)|set(b):
                if k not in ('savedAt','items'):need(a.get(k)==b.get(k),label+' status global '+k)
            oldby={norm(k):(k,v) for k,v in a['items'].items()};newby={norm(k):(k,v) for k,v in b['items'].items()}
            for p,(oldkey,flags) in oldby.items():
                if p not in files:need(newby.get(p)==(oldkey,flags),label+' unrelated status '+p)
                else:need(p in newby and set(newby[p][1])==(set(flags)-{'todo','wip'})|{'done'},label+' target flags '+p)
            for p,(key,flags) in newby.items():
                if p not in oldby:need(p in files and set(flags)=={'done'},label+' unexpected new flags '+p)
            need(all(p in newby and 'done' in newby[p][1] and 'todo' not in newby[p][1] and 'wip' not in newby[p][1] for p in files),label+'43target statuses')
            results.append({'catalog':label,'doneTargets':43,'otherFlagsPreserved':True,'autoDonePreserved':a.get('autoDone')==b.get('autoDone')})
        need(prior(CAT/'catalog_work_ids.json')==(CAT/'catalog_work_ids.json').read_bytes(),'WORK work IDs changed')
        protected_ids={norm(k):v for k,v in r['protectedHashes'].items()}
        need(sha((SEED/'catalog_work_ids.json').read_bytes())==protected_ids[norm(SEED/'catalog_work_ids.json')],'seed IDs changed against own protected baseline')
        return results
    check('status_flags_and_work_IDs',statuses)
    def htmlwrappers():
        need(striphtml(oldhtml)==striphtml(newhtml),'WORK HTML code changed')
        need(striphtml(oldseedhtml)==striphtml(newseedhtml),'seed HTML code changed')
        return 'Each catalog wrapper unchanged against its own gzip baseline'
    check('catalog_and_seed_UI_code_preserved',htmlwrappers)
    def portraitfiles():
        seen={}
        for e in oldmob['entries']:
            s=e.get('portrait',{})
            if s.get('exists') and s.get('sha256'):seen[s['path']]=s['sha256']
        for p,h in seen.items():need(sha((WORK/p).read_bytes())==h,'portrait PNG changed: '+p)
        return {'portraitPNGsUnchanged':len(seen)}
    check('portrait_PNG_file_hashes',portraitfiles)
    def blocked():
        b=review['blocked'];need(len(b)==1 and b[0]['key']=='dimaher_e' and b[0].get('slot',b[0].get('phase'))=='defeat','blocked item changed')
        p=norm(b[0]['runtimePath']);need(p not in files,'blocked target adopted')
        olde=next(e for e in oldmob['entries'] if e['key']=='dimaher_e');newe=next(e for e in newmob['entries'] if e['key']=='dimaher_e')
        need(olde['defeat']==newe['defeat'],'blocked slot changed')
        h=sha((WORK/b[0]['runtimePath']).read_bytes());need(h==olde['defeat']['sha256'],'blocked PNG changed')
        return {'path':b[0]['runtimePath'],'sha256':h,'adopted':False}
    check('blocked_dimaher_e_defeat_preserved',blocked)
    def canonical():
        group=REPO/'tools/mob-image-sets/group-sets.json';need(prior(group)==group.read_bytes(),'canonical group metadata changed')
        context=REPO/'tools/mob-image-sets/background-contexts.json';a=json.loads(prior(context));b=json.loads(context.read_bytes())
        for k in set(a)|set(b):
            if k!='lastImageAdoption':need(a.get(k)==b.get(k),'canonical context field '+k)
        last=b.get('lastImageAdoption');need(last is not None and r['id'] in json.dumps(last,ensure_ascii=False),'canonical adoption provenance missing')
        doc=REPO/'docs/MOB_BACKGROUND_CONTEXTS_KO.md';old=prior(doc);new=doc.read_bytes();need(new.startswith(old),'context document was rewritten');need(r['id'] in new[len(old):].decode('utf-8-sig'),'context document provenance missing')
        return {'groupsByteIdentical':True,'contextOnlyLastAdoptionChanged':True,'docAppendOnly':True}
    check('canonical_contexts_and_provenance_document',canonical)
    def events():
        result=[]
        for path in (CAT/'image_work/history.jsonl',CAT/'image_work/personal-patch/events.jsonl'):
            old=prior(path);new=path.read_bytes();need(new.startswith(old),'ledger prefix changed: '+str(path))
            appended=[json.loads(s) for s in new[len(old):].decode('utf-8-sig').splitlines() if s.strip()]
            need(len(appended)==1 and appended[0]['id']==r['id'],'expected one adoption event: '+str(path))
            ef=appended[0]['files'];need(len(ef)==43,'event file count: '+str(path))
            def eventpath(x):
                p=norm(x.get('path',x.get('runtimePath',''))) if isinstance(x,dict) else norm(x)
                p=p.removeprefix('game/')
                return 'content/pic/'+p if p.startswith('mob/') else p
            paths={eventpath(x) for x in ef}
            need(paths==set(files),'event targets: '+str(path))
            for x in ef:
                if isinstance(x,dict):
                    target=files[eventpath(x)];after=x.get('after',x.get('sha256'))
                    if after is not None:need(after==target['after'],'event after hash')
            result.append({'ledger':str(path),'newEvents':1,'files':43,'oldPrefixPreserved':True})
        return result
    check('exact_43_file_history_and_personal_patch_event',events)
    def plan():
        path=REPO/'records/full-client-preparation-20261029/full-client-input-plan.json';a=json.loads(prior(path));b=json.loads(path.read_bytes())
        need(b['status']=='BUILD_INPUT_PLAN_NOT_RELEASE_ZIP','release plan status')
        for k in set(a)|set(b):
            if k not in ('files','summary'):need(a.get(k)==b.get(k),'plan global or other list '+k)
        need(len(a['files'])==len(b['files']),'plan file count')
        n=0;delta=0
        for x,y in zip(a['files'],b['files']):
            p=norm(x['path']);need(y['path']==x['path'],'plan file order/path')
            target=files.get(p.removeprefix('game/'))
            if target is None:need(x==y,'unrelated plan file '+p);continue
            n+=1;need(y['sha256']==target['after'] and y['bytes']==target['bytes'],'target plan hash/size '+p)
            for k in set(x)|set(y):
                if k not in ('bytes','sha256'):need(x.get(k)==y.get(k),'target extra plan field '+k)
            delta+=y['bytes']-x['bytes']
        need(n==43,'plan target count')
        for k in set(a['summary'])|set(b['summary']):
            if k!='includedBytes':need(a['summary'].get(k)==b['summary'].get(k),'plan summary '+k)
        need(b['summary']['includedBytes']==a['summary']['includedBytes']+delta,'plan includedBytes total')
        return {'targetFiles':43,'allOtherFilesListsPreserved':True,'includedBytesDelta':delta}
    check('full_client_input_plan_only_43_files_and_byte_total',plan)
    def qsp():
        h=sha((WORK/'jack.qsp').read_bytes());need(h==r['qspBefore']==r['qspAfter'],'QSP changed')
        need(r.get('saveWrites') in (False,0,None,[]),'save writes reported')
        return {'sha256':h,'changed':False,'saveWrites':r.get('saveWrites')}
    check('QSP_and_saves_preserved',qsp)
    def protected():
        values=r.get('protectedHashes',[])
        if isinstance(values,dict):values=[{'path':k,'sha256':v} if isinstance(v,str) else dict(path=k,**v) for k,v in values.items()]
        for x in values:
            p=x.get('path');h=x.get('sha256',x.get('before'))
            if p and h:need(sha(Path(p).read_bytes())==h,'protected file changed: '+p)
        return {'protectedPaths':len(values)}
    check('installer_protected_hashes',protected)
    report={'pass':all(c['pass'] for c in checks),'record':str(RECORD),'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':checks,'limits':['Independent filesystem/metadata audit; no actual in-game battle playtest.','Auditor modified no runtime, repo, catalog, ledger, image or save file; only this local report was written.']}
    (HERE/'independent-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'pass':report['pass'],'checks':len(checks),'failed':[c for c in checks if not c['pass']]},ensure_ascii=False))

if __name__=='__main__':main()
