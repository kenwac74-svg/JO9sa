"""Read-only, independent check of the six approved catfight image adoptions.

Reads runtime and repository files. Writes only independent-verification.json
beside this script. No installer helpers are imported or executed.
"""
import datetime, gzip, hashlib, json, re, subprocess
from pathlib import Path
from PIL import Image

HERE=Path(__file__).resolve().parent
REPO=Path('G:/somi/JO9sa')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
CAT=WORK/'modtools/catalog'
SEED=REPO/'tools/local-workspace/catalog-seed'
ID='catfight-combat-adopted-20261030'
RECORD=REPO/'records'/ID/'installation.json'
REVIEW=HERE.parent/'catfight-combat-redraw-20261030/review-manifest.json'
CONCURRENT_ID='2026-10-29T19-37-09-375Z_32e2ffc0'
CONCURRENT_PATH='content/pic/mob/defeated/gladiator_champion_sepris.png'
CONCURRENT_HASH='8097f6f78f46eb356bd849a2d9227f00e3730ef8b5aeb5b0f7bd6eee4f6cceb2'

def sha(b): return hashlib.sha256(b).hexdigest()
def norm(p): return str(p).replace('\\','/').lower()
def need(c,m):
    if not c: raise AssertionError(m)
def readj(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def parsehtml(b):
    s=b.decode('utf-8-sig')
    d=re.search(r'var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR',s)
    m=re.search(r'window.JO9_MOB_SETS=(.*?);</script>',s)
    need(d is not None and m is not None,'catalog data blocks absent')
    return s,json.loads(d[1]),json.loads(m[1])
def striphtml(s):
    s=re.sub(r'(var D\s*=\s*)(\[[\s\S]*?\]);(\s*\r?\nvar MR)',r'\1__DATA__;\3',s)
    return re.sub(r'window.JO9_MOB_SETS=.*?;</script>','window.JO9_MOB_SETS=__DATA__;</script>',s)
def statusparse(b):
    return json.loads(re.search(r'window.CATALOG_STATUS=(.*);',b.decode('utf-8-sig'))[1])

def main():
    previous=HERE/'independent-verification.json'
    preliminary=HERE/'preliminary-independent-verification.json'
    if previous.exists() and not preliminary.exists():
        previous_data=readj(previous)
        if previous_data.get('pass') is False: preliminary.write_bytes(previous.read_bytes())
    r=readj(RECORD); manifest=readj(HERE/'manifest.json'); review=readj(REVIEW)
    files={norm(x['path']):x for x in r['files']}
    selected={norm(x['runtimePath']):x for x in review['entries']}
    backups={norm(x['path']):x for x in r['metadataBackups']}
    def prior(p):
        x=backups[norm(p)]; b=gzip.decompress(Path(x['backup']).read_bytes())
        need(sha(b)==x['sha256'],'backup integrity: '+str(p)); return b
    def appended(p):
        a=prior(p);b=p.read_bytes();need(b.startswith(a),'ledger prefix '+str(p))
        return [json.loads(s) for s in b[len(a):].decode('utf-8-sig').splitlines() if s.strip()]
    concurrent_evidence={}
    def verify_concurrent():
        history=appended(CAT/'image_work/history.jsonl');personal=appended(CAT/'image_work/personal-patch/events.jsonl')
        hs=[x for x in history if x.get('id')==CONCURRENT_ID];ps=[x for x in personal if x.get('id')==CONCURRENT_ID]
        need(len(hs)==len(ps)==1,'exact concurrent event pair')
        h,p=hs[0],ps[0]
        need(h.get('event')=='localhost_image_replace' and h.get('status')=='applied' and h.get('operation')==p.get('operation')=='replace','concurrent local replacement provenance')
        need(h['created']==p['created'] and h['created']>r['created'],'concurrent event time after adoption')
        need(len(h['files'])==len(p['files'])==1,'concurrent target count')
        for event in (h,p):
            f=event['files'][0];need('content/pic/'+norm(f['path'])==CONCURRENT_PATH and f.get('before') is None and f['after']==CONCURRENT_HASH,'concurrent event path/hash')
        target=WORK/CONCURRENT_PATH;b=target.read_bytes()
        need(sha(b)==CONCURRENT_HASH and len(b)==779112,'concurrent live PNG differs from evidence')
        with Image.open(target) as im:need(im.size==(795,596),'concurrent PNG size')
        concurrent_evidence.update({'id':CONCURRENT_ID,'path':CONCURRENT_PATH,'sha256':CONCURRENT_HASH,'bytes':779112,'source':'localhost_image_replace','created':h['created'],'adoptionCreated':r['created'],'historyEvent':h,'personalPatchEvent':p,'treatment':'Preserve independent local-tool change; permit only its exact WORK D byte-size and status change. Not an adoption target.'})
        return {k:v for k,v in concurrent_evidence.items() if k not in ('historyEvent','personalPatchEvent')}
    checks=[]
    def check(name,fn):
        try: checks.append({'name':name,'pass':True,'detail':fn()})
        except Exception as e: checks.append({'name':name,'pass':False,'detail':type(e).__name__+': '+str(e)})
    def installation():
        need(r['id']==ID and r['status']=='INSTALLED','installation incomplete')
        need(len(files)==6 and set(files)==set(selected),'six exact selected target paths')
        need(r['files']==manifest['files'],'installation differs from reviewed adoption manifest')
        need(len(backups)==10,'expected ten metadata gzip backups')
        for p in backups: prior(p)
        need(sum(x['before'] is None for x in files.values())==1,'expected exactly one newly created PNG')
        need(r['summary']['missingDefeatBefore']==12 and r['summary']['missingDefeatAfter']==11,'missing defeat summary')
        return {'files':6,'replacements':5,'new':1,'metadataBackups':10}
    check('installation_manifest_and_gzip_backups',installation)
    check('explicit_concurrent_local_tool_change_evidence',verify_concurrent)
    def images():
        old=0
        for p,f in files.items():
            s=selected[p]
            need(f['after']==s['sha256'] and f['before']==s.get('currentWorkSha256'),'review image provenance '+p)
            need(sha(Path(f['source']).read_bytes())==f['after'],'review source hash '+p)
            for target in (WORK/f['path'],REPO/'resources/new'/f['path']):
                b=target.read_bytes(); need(sha(b)==f['after'] and len(b)==f['bytes'],'PNG hash/size '+str(target))
                with Image.open(target) as im:
                    need(im.format=='PNG' and im.size==(795,596),'PNG dimensions '+str(target))
                    need(im.convert('RGBA').getchannel('A').getextrema()==(255,255),'transparent pixels '+str(target))
            if f['before'] is None: need(f['beforePath'] is None,'new PNG has fabricated original')
            else:
                need(sha(Path(f['beforePath']).read_bytes())==f['before'],'archived runtime original '+p); old+=1
            if f.get('trackedBefore'):
                need(sha(Path(f['trackedBeforePath']).read_bytes())==f['trackedBefore'],'archived tracked original '+p)
        receipt=readj(HERE/'runtime-original-swap.json')
        need(receipt['status']=='SWAPPED','first runtime original swap incomplete')
        return {'runtimePNGs':6,'trackedPNGs':6,'opaque795x596':12,'archivedRuntimeOriginals':old}
    check('runtime_tracked_PNGs_and_original_recovery',images)

    oldhtml,oldrows,oldmob=parsehtml(prior(CAT/'catalog_merge_vs_original.html'))
    newhtml,newrows,newmob=parsehtml((CAT/'catalog_merge_vs_original.html').read_bytes())
    osh,osr,osm=parsehtml(prior(SEED/'catalog_merge_vs_original.html'))
    nsh,nsr,nsm=parsehtml((SEED/'catalog_merge_vs_original.html').read_bytes())
    def rows(a,b,label):
        need(len(a)==len(b)==31592,label+' row count changed'); count=0
        for x,y in zip(a,b):
            p=norm(x[0]); need(x[0]==y[0],label+' row order/path')
            if p not in files:
                if label=='WORK' and p==CONCURRENT_PATH and concurrent_evidence:
                    want=x.copy();want[3]=779112
                    need(x[3]==0 and want==y,label+' concurrent row differs beyond documented size')
                else:need(x==y,label+' unrelated row '+p)
                continue
            f=files[p]; count+=1
            need(y[3]==f['bytes'] and y[5:7]==[795,596],label+' target row dimensions/bytes '+p)
            need(len(x)==len(y),label+' row arity')
            for j in range(len(x)):
                if j not in (3,5,6): need(x[j]==y[j],label+' unapproved row field '+str(j))
        need(count==6,label+' target rows not six'); return {'rows':len(b),'targets':count,'unrelatedPreservedExceptDocumentedLocalChange':True,'documentedConcurrentChange':CONCURRENT_ID if label=='WORK' else None}
    check('WORK_catalog_rows_and_placeholder_preservation',lambda:rows(oldrows,newrows,'WORK'))
    check('seed_catalog_rows_and_placeholder_preservation',lambda:rows(osr,nsr,'seed'))
    def slots(a,b,label):
        need(len(a['entries'])==len(b['entries'])==78,label+' entries')
        for k in set(a)|set(b):
            if k not in ('entries','summary','workUpdate'): need(a.get(k)==b.get(k),label+' global '+k)
        for k in set(a['summary'])|set(b['summary']):
            want=a['summary'].get(k)-1 if k=='missingDefeat' else a['summary'].get(k)
            need(b['summary'].get(k)==want,label+' summary '+k)
        need(a['summary']['missingDefeat']==12 and b['summary']['missingDefeat']==11,label+' missing 12→11')
        au=a.get('workUpdate',{});bu=b.get('workUpdate',{})
        for k in set(au)|set(bu):
            if k!='lastImageRedraw':need(au.get(k)==bu.get(k),label+' workUpdate '+k)
        need(bu.get('lastImageRedraw')==dict(date='2026-10-30',files=6,entrySlots=6,groupSlots=0,size=[795,596],record=ID),label+' redraw provenance')
        allowed={'exists','width','height','bytes','sha256','workLabel','backgroundComposition','imageRedraw'}
        n=0; portraits=0; mage=0
        for x,y in zip(a['entries'],b['entries']):
            for k in set(x)|set(y):
                if k not in ('standing','defeat'):need(x.get(k)==y.get(k),label+' entry field '+x['key']+' '+k)
            portraits+=1
            for phase in ('standing','defeat'):
                s=x.get(phase,{});t=y.get(phase,{})
                need(s.get('mageEdit')==t.get('mageEdit'),label+' Mage prompt '+x['key']+' '+phase);mage+=1
                p=norm(s.get('path',''))
                if p not in files:need(s==t,label+' unrelated slot '+x['key']+' '+phase);continue
                n+=1;f=files[p]
                need(t.get('exists') is True and t.get('sha256')==f['after'] and t.get('bytes')==f['bytes'] and [t.get('width'),t.get('height')]==[795,596],label+' target slot '+p)
                for k in set(s)|set(t):
                    if k not in allowed:need(s.get(k)==t.get(k),label+' other slot field '+k)
                need(t.get('imageRedraw',{}).get('record')==ID,label+' image provenance '+p)
        need(n==6,label+' target slots');return {'slots':6,'portraitEntriesPreserved':portraits,'MageSlotsPreserved':mage,'missingDefeat':[12,11],'groupsPreserved':a.get('groups')==b.get('groups')}
    check('WORK_slots_Mage_portraits_groups_and_missing_summary',lambda:slots(oldmob,newmob,'WORK'))
    check('seed_slots_Mage_portraits_groups_and_missing_summary',lambda:slots(osm,nsm,'seed'))
    def statuses():
        for root,label in ((CAT,'WORK'),(SEED,'seed')):
            a=statusparse(prior(root/'catalog_status.js'));b=statusparse((root/'catalog_status.js').read_bytes())
            for k in set(a)|set(b):
                if k not in ('savedAt','items'):need(a.get(k)==b.get(k),label+' status global '+k)
            need(b.get('savedAt',0)>a.get('savedAt',0),label+' savedAt')
            aa={norm(k):(k,v) for k,v in a['items'].items()};bb={norm(k):(k,v) for k,v in b['items'].items()}
            for p,(key,v) in aa.items():
                if p not in files:
                    if label=='WORK' and p==CONCURRENT_PATH and concurrent_evidence:need(v==['todo'] and bb.get(p)==(key,['done']),label+' concurrent status differs from documented replacement')
                    else:need(bb.get(p)==(key,v),label+' unrelated flags '+p)
                else:need(p in bb and bb[p][0]==key and set(bb[p][1])==(set(v)-{'todo','wip'})|{'done'},label+' target flags '+p)
            for p,(key,v) in bb.items():
                if p not in aa:need(p in files and set(v)=={'done'},label+' unexpected added status '+p)
            need(all(p in bb and 'done' in bb[p][1] and not {'todo','wip'}&set(bb[p][1]) for p in files),label+' done flags')
        need(prior(CAT/'catalog_work_ids.json')==(CAT/'catalog_work_ids.json').read_bytes(),'WORK IDs changed')
        return {'doneTargetsPerCatalog':6,'customFlagsAndAutoDonePreserved':True,'WORKIDsByteIdentical':True}
    check('status_flags_and_existing_IDs',statuses)
    def wrappers():
        need(striphtml(oldhtml)==striphtml(newhtml),'WORK wrapper changed')
        need(striphtml(osh)==striphtml(nsh),'seed wrapper changed')
        return 'Each wrapper preserved against its own gzip baseline'
    check('catalog_UI_code_preserved',wrappers)
    def portraits():
        seen={s['path']:s['sha256'] for e in oldmob['entries'] for s in [e.get('portrait',{})] if s.get('exists') and s.get('sha256')}
        for p,h in seen.items():need(sha((WORK/p).read_bytes())==h,'portrait changed '+p)
        return {'uniquePortraitPNGsUnchanged':len(seen)}
    check('portrait_PNG_hashes',portraits)
    def canonical():
        cp=REPO/'tools/mob-image-sets/background-contexts.json';a=json.loads(prior(cp));b=readj(cp)
        for k in set(a)|set(b):
            if k!='lastImageAdoption':need(a.get(k)==b.get(k),'context field '+k)
        need(b.get('lastImageAdoption')==dict(date='2026-10-30',record=ID,files=6,standingAndDefeatOnly=True,qspChanged=False),'context provenance')
        p=REPO/'docs/MOB_BACKGROUND_CONTEXTS_KO.md';a=prior(p);b=p.read_bytes()
        need(b.startswith(a) and ID.encode() in b[len(a):],'document must be append-only with provenance')
        return {'contextOnlyAdoptionChanged':True,'documentAppendOnly':True}
    check('canonical_context_and_document_append',canonical)
    def events():
        for p in (CAT/'image_work/history.jsonl',CAT/'image_work/personal-patch/events.jsonl'):
            new=appended(p)
            need(len(new)==2 and {x['id'] for x in new}=={ID,CONCURRENT_ID} and concurrent_evidence,'one adoption event plus documented independent local event '+str(p))
            ours=[x for x in new if x['id']==ID];need(len(ours)==1,'exactly one adoption event')
            fs=ours[0]['files'];need(len(fs)==6,'six files in adoption event')
            eventpaths={}
            for x in fs:
                path=norm(x['path']);path='content/pic/'+path if path.startswith('mob/') else path
                eventpaths[path]=x
            need(set(eventpaths)==set(files),'event target paths')
            for path,x in eventpaths.items():
                need(x.get('after')==files[path]['after'] and x.get('before')==files[path]['before'],'event hashes '+path)
        return {'ledgers':2,'adoptionEventsPerLedger':1,'filesPerAdoptionEvent':6,'separateLocalEventPerLedger':1,'documentedConcurrentChange':CONCURRENT_ID,'oldPrefixPreserved':True}
    check('history_and_personal_patch_events',events)
    def plan():
        p=REPO/'records/full-client-preparation-20261029/full-client-input-plan.json';a=json.loads(prior(p));b=readj(p)
        for k in set(a)|set(b):
            if k not in ('files','summary'):need(a.get(k)==b.get(k),'plan global '+k)
        aa={norm(x['path']):x for x in a['files']};bb={norm(x['path']):x for x in b['files']}
        extra=set(bb)-set(aa);need(extra=={'game/content/pic/mob/defeated/gladiatrix1.png'},'one added plan path')
        need(set(aa)<=set(bb),'plan paths removed')
        need([x['path'] for x in b['files'] if norm(x['path']) in aa]==[x['path'] for x in a['files']],'existing order changed')
        count=0;delta=0
        for path,x in aa.items():
            y=bb[path];f=files.get(path.removeprefix('game/'))
            if not f:need(x==y,'unrelated plan row '+path);continue
            count+=1;need(x['sha256']==f['before'],'plan before hash '+path)
            need(y['sha256']==f['after'] and y['bytes']==f['bytes'],'plan after '+path)
            for k in set(x)|set(y):
                if k not in ('bytes','sha256'):need(x.get(k)==y.get(k),'plan target field '+k)
            delta+=y['bytes']-x['bytes']
        need(count==5,'plan existing target count')
        x=bb[next(iter(extra))];f=files['content/pic/mob/defeated/gladiatrix1.png']
        need(x=={'path':'game/'+f['path'],'bytes':f['bytes'],'sha256':f['after']},'new plan row')
        delta+=x['bytes']
        need(len(a['files'])==42882 and len(b['files'])==42883,'plan count')
        for k in set(a['summary'])|set(b['summary']):
            if k not in ('includedFiles','includedBytes'):need(a['summary'].get(k)==b['summary'].get(k),'plan summary field '+k)
        need(b['summary']['includedFiles']==len(b['files']) and b['summary']['includedBytes']==sum(x['bytes'] for x in b['files'])==a['summary']['includedBytes']+delta,'plan totals')
        return {'existingTargets':5,'addedTargets':1,'includedFiles':[42882,42883],'includedBytesDelta':delta,'allOtherRowsPreserved':True}
    check('full_client_plan_five_updates_one_addition_and_totals',plan)
    def protected():
        for p,h in r['protectedHashes'].items():need(sha(Path(p).read_bytes())==h,'protected hash '+p)
        need(r['qspBefore']==r['qspAfter']==sha((WORK/'jack.qsp').read_bytes()),'QSP hash changed')
        need(all(r.get(k) is False for k in ('saveWrites','fullSynced','releaseZipChanged','commitPush')),'scope boundaries')
        return {'protectedPaths':len(r['protectedHashes']),'QSPUnchanged':True,'saveWrites':False,'distributionSync':False}
    check('protected_hashes_QSP_and_scope_boundaries',protected)
    def qsp_routes():
        js="const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));const l=d.locations.find(x=>x.name==='jo9_battle_fate');console.log(JSON.stringify(c.shift(d.lines[l.body],5)));"
        p=subprocess.run(['node','-e',js],capture_output=True,check=True,encoding='utf-8');s=json.loads(p.stdout)
        need("$args[0] = 'sprite'" in s and 'if args[2] = 1:' in s,'sprite/defeat route absent')
        result=[]
        for key in ('gladiatrix1','gladiatrix2','gladiatrix3'):
            line=next((x for x in s.splitlines() if 'content/pic/mob/'+key+'.png' in x and 'content/pic/mob/defeated/'+key+'.png' in x),None)
            need(line is not None,'defeat mapping '+key);result.append(key)
        return {'existingStandingToDefeatRoutes':result,'QSPModified':False,'runtimePlaytest':False}
    check('existing_QSP_defeat_image_route_static_check',qsp_routes)
    report={'pass':all(x['pass'] for x in checks),'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'record':str(RECORD),'checks':checks,'concurrentChangeEvidence':concurrent_evidence,'preliminaryFailedAuditPreserved':str(preliminary) if preliminary.exists() else None,'limits':['Independent read-only filesystem and metadata audit; no actual in-game battle playtest.','Only local verification reports were written.','Save file non-mutation is supported by unchanged QSP and installer no-save-write scope; no entire save-folder snapshot was taken.','An independently evidenced local-tool replacement of the sepris defeat PNG occurred after this installation and is preserved, not counted among the six approved catfight targets.']}
    (HERE/'independent-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'pass':report['pass'],'checks':len(checks),'failed':[x for x in checks if not x['pass']]},ensure_ascii=False))

if __name__=='__main__': main()
