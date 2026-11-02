"""Independent, read-only audit of nine approved quest combat image adoptions.

Do not run until the parent signals that installation is complete. This script
never imports the installer. It writes only the local verification report.
Unrelated concurrent changes fail strict preservation checks; they are not
implicitly allowed or repaired.
"""
from pathlib import Path
from PIL import Image
import datetime,gzip,hashlib,json,re,subprocess

HERE=Path(__file__).resolve().parent
REPO=Path('G:/somi/JO9sa')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
CAT=WORK/'modtools/catalog'
SEED=REPO/'tools/local-workspace/catalog-seed'
ID='quest-combat-adopted-20261030'
RECORD=REPO/'records'/ID/'installation.json'
REVIEW=HERE.parent/'quest-combat-redraw-20261030/review-manifest.json'
INVENTORY=HERE.parent/'quest-combat-redraw-20261030/inventory.json'
HELD='content/pic/mob/defeated/egeya.png'

def sha(b):return hashlib.sha256(b).hexdigest()
def norm(p):return str(p).replace('\\','/').lower()
def jread(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def need(c,m):
    if not c:raise AssertionError(m)
def htmlparts(b):
    s=b.decode('utf-8-sig');d=re.search(r'var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR',s);m=re.search(r'window.JO9_MOB_SETS=(.*?);</script>',s)
    need(d is not None and m is not None,'catalog data blocks absent');return s,json.loads(d[1]),json.loads(m[1])
def wrapper(s):
    s=re.sub(r'(var D\s*=\s*)(\[[\s\S]*?\]);(\s*\r?\nvar MR)',r'\1__DATA__;\3',s)
    return re.sub(r'window.JO9_MOB_SETS=.*?;</script>','window.JO9_MOB_SETS=__DATA__;</script>',s)
def status(b):return json.loads(re.search(r'window.CATALOG_STATUS=(.*);',b.decode('utf-8-sig'))[1])

def main():
    r=jread(RECORD);v=jread(HERE/'manifest.json');review=jread(REVIEW);inventory=jread(INVENTORY)
    files={norm(x['path']):x for x in r['files']};selected={norm(x['runtimePath']):x for x in review['entries']}
    backups={norm(x['path']):x for x in r['metadataBackups']};checks=[]
    def prior(p):
        x=backups[norm(p)];b=gzip.decompress(Path(x['backup']).read_bytes());need(sha(b)==x['sha256'],'gzip baseline hash '+str(p));return b
    def appended(p):
        a=prior(p);b=p.read_bytes();need(b.startswith(a),'ledger prefix modified '+str(p));return [json.loads(x) for x in b[len(a):].decode('utf-8-sig').splitlines() if x.strip()]
    def check(name,fn):
        try:checks.append({'name':name,'pass':True,'detail':fn()})
        except Exception as e:checks.append({'name':name,'pass':False,'detail':type(e).__name__+': '+str(e)})
    def installation():
        need(r['id']==ID and r['status']=='INSTALLED','installation not finished')
        need(len(files)==9 and set(files)==set(selected),'nine exact approved targets')
        need(HELD not in files,'held Egeya defeat adopted')
        need(r['files']==v['files'],'installation differs from prepared manifest')
        need(len(backups)==10,'expected ten metadata gzip backups')
        for p in backups:prior(p)
        need(all(x.get('before') for x in files.values()),'all nine images must replace existing files')
        need(r['summary']['missingDefeatBefore']==r['summary']['missingDefeatAfter'],'missing defeat count must not change')
        return {'targets':9,'existingReplacements':9,'newRuntimeFiles':0,'metadataBackups':10}
    check('installation_manifest_and_backup_integrity',installation)
    def images():
        for p,f in files.items():
            s=selected[p];need(f['after']==s['sha256'] and f['before']==s['currentWorkSha256'],'review provenance '+p)
            need(sha(Path(f['source']).read_bytes())==f['after'],'review source changed '+p)
            for target in (WORK/f['path'],REPO/'resources/new'/f['path']):
                b=target.read_bytes();need(sha(b)==f['after'] and len(b)==f['bytes'],'after hash/bytes '+str(target))
                with Image.open(target) as im:
                    need(im.format=='PNG' and im.size==(795,596),'PNG geometry '+str(target));need(im.convert('RGBA').getchannel('A').getextrema()==(255,255),'transparency '+str(target))
            need(sha(Path(f['beforePath']).read_bytes())==f['before'],'runtime original recovery '+p)
            if f.get('trackedBefore'):need(sha(Path(f['trackedBeforePath']).read_bytes())==f['trackedBefore'],'tracked original recovery '+p)
        receipt=jread(HERE/'runtime-original-swap.json');need(receipt.get('status')=='SWAPPED' and len(receipt.get('files',[]))==9,'runtime original move receipt')
        swaps={norm(x['path']):x for x in receipt['files']};need(set(swaps)==set(files),'swap receipt targets')
        for p,f in files.items():
            x=swaps[p];need(x.get('before')==f['before'] and x.get('after')==f['after'] and norm(x.get('archive',''))==norm(f['beforePath']),'swap receipt evidence '+p)
        return {'WORKPNGs':9,'trackedPNGs':9,'opaque795x596':18,'archivedRuntimeOriginals':9}
    check('PNG_files_and_original_recovery_hashes',images)
    oldhtml,oldrows,oldmob=htmlparts(prior(CAT/'catalog_merge_vs_original.html'))
    newhtml,newrows,newmob=htmlparts((CAT/'catalog_merge_vs_original.html').read_bytes())
    oldsh,oldsr,oldsm=htmlparts(prior(SEED/'catalog_merge_vs_original.html'))
    newsh,newsr,newsm=htmlparts((SEED/'catalog_merge_vs_original.html').read_bytes())
    def rows(a,b,label):
        need(len(a)==len(b),label+' row count changed');n=0
        for x,y in zip(a,b):
            p=norm(x[0]);need(x[0]==y[0],label+' order/path changed')
            if p not in files:need(x==y,label+' unrelated row '+p);continue
            n+=1;f=files[p];need(len(x)==len(y),label+' row arity')
            need(y[3]==f['bytes'] and y[5:7]==[795,596],label+' target bytes/size '+p)
            for i in range(len(x)):
                if i not in (3,5,6):need(x[i]==y[i],label+' other target field '+str(i))
        need(n==9,label+' nine target rows');return {'totalRows':len(b),'targets':n,'unrelatedRowsPreserved':True}
    check('WORK_D_rows',lambda:rows(oldrows,newrows,'WORK'))
    check('seed_D_rows',lambda:rows(oldsr,newsr,'seed'))
    def slots(a,b,label):
        need(len(a['entries'])==len(b['entries']),label+' entry count')
        for k in set(a)|set(b):
            if k not in ('entries','workUpdate'):need(a.get(k)==b.get(k),label+' global '+k)
        au=a.get('workUpdate',{});bu=b.get('workUpdate',{})
        for k in set(au)|set(bu):
            if k!='lastImageRedraw':need(au.get(k)==bu.get(k),label+' workUpdate '+k)
        need(bu.get('lastImageRedraw')==dict(date='2026-10-30',files=9,entrySlots=9,groupSlots=0,size=[795,596],record=ID),label+' redraw provenance')
        allowed={'exists','width','height','bytes','sha256','workLabel','backgroundComposition','imageRedraw'};n=0;mage=0
        for x,y in zip(a['entries'],b['entries']):
            for k in set(x)|set(y):
                if k not in ('standing','defeat'):need(x.get(k)==y.get(k),label+' entry field '+x['key']+' '+k)
            for phase in ('standing','defeat'):
                s=x.get(phase,{});t=y.get(phase,{});p=norm(s.get('path',''))
                need(s.get('mageEdit')==t.get('mageEdit'),label+' Mage '+x['key']+' '+phase);mage+=1
                if p not in files:need(s==t,label+' unrelated slot '+x['key']+' '+phase);continue
                n+=1;f=files[p]
                need(t.get('exists') is True and t.get('sha256')==f['after'] and t.get('bytes')==f['bytes'] and [t.get('width'),t.get('height')]==[795,596],label+' target slot '+p)
                for k in set(s)|set(t):
                    if k not in allowed:need(s.get(k)==t.get(k),label+' target extra '+p+' '+k)
                need(t.get('imageRedraw',{}).get('record')==ID,label+' slot provenance '+p)
        need(n==9,label+' nine slots')
        return {'targets':9,'portraitEntriesPreserved':len(a['entries']),'MageSlotsPreserved':mage,'missingDefeatUnchanged':b['summary'].get('missingDefeat'),'groupsPreserved':True}
    check('WORK_MOB_slots_portraits_Mage_groups_and_summary',lambda:slots(oldmob,newmob,'WORK'))
    check('seed_MOB_slots_portraits_Mage_groups_and_summary',lambda:slots(oldsm,newsm,'seed'))
    def flags():
        for root,label in ((CAT,'WORK'),(SEED,'seed')):
            a=status(prior(root/'catalog_status.js'));b=status((root/'catalog_status.js').read_bytes())
            for k in set(a)|set(b):
                if k not in ('savedAt','items'):need(a.get(k)==b.get(k),label+' status global '+k)
            need(b.get('savedAt',0)>a.get('savedAt',0),label+' savedAt')
            aa={norm(k):(k,v) for k,v in a['items'].items()};bb={norm(k):(k,v) for k,v in b['items'].items()}
            for p,(key,value) in aa.items():
                if p not in files:need(bb.get(p)==(key,value),label+' unrelated status '+p)
                else:need(p in bb and bb[p][0]==key and set(bb[p][1])==(set(value)-{'todo','wip'})|{'done'},label+' target status '+p)
            for p,(key,value) in bb.items():
                if p not in aa:need(p in files and set(value)=={'done'},label+' unexpected status '+p)
            need(all(p in bb and 'done' in bb[p][1] and not {'todo','wip'}&set(bb[p][1]) for p in files),label+' target completion')
        need(prior(CAT/'catalog_work_ids.json')==(CAT/'catalog_work_ids.json').read_bytes(),'WORK IDs changed')
        return {'doneTargetsPerCatalog':9,'unrelatedFlagsAndAutoDonePreserved':True,'existingIDFilePreserved':True}
    check('status_flags_and_existing_IDs',flags)
    def held():
        blocked=review.get('blocked',[]);need(len(blocked)==1 and norm(blocked[0]['runtimePath'])==HELD,'held list changed')
        olde=next(x for x in oldmob['entries'] if x['key']=='egeya');newe=next(x for x in newmob['entries'] if x['key']=='egeya')
        need(olde['defeat']==newe['defeat'],'held WORK slot altered')
        for a,b,label in ((oldmob,newmob,'WORK'),(oldsm,newsm,'seed')):
            need(next(x for x in a['entries'] if x['key']=='egeya')['defeat']==next(x for x in b['entries'] if x['key']=='egeya')['defeat'],label+' held slot')
        for root,label in ((CAT,'WORK'),(SEED,'seed')):
            a=status(prior(root/'catalog_status.js'));b=status((root/'catalog_status.js').read_bytes())
            aa={norm(k):v for k,v in a['items'].items()};bb={norm(k):v for k,v in b['items'].items()};need(aa.get(HELD)==bb.get(HELD),label+' held status')
        expected=next(e for e in inventory['entries'] if e['key']=='egeya')['slots']['defeat'];before=expected.get('actualSha256',expected['sha256'])
        need(sha((WORK/HELD).read_bytes())==before,'held Egeya defeat PNG changed')
        return {'path':HELD,'sha256':before,'PNGAndMetadataPreserved':True,'adopted':False}
    check('blocked_Egeya_defeat_explicitly_preserved',held)
    def wrappers():
        need(wrapper(oldhtml)==wrapper(newhtml),'WORK HTML wrapper altered');need(wrapper(oldsh)==wrapper(newsh),'seed HTML wrapper altered');return 'Each catalog wrapper preserved against its own gzip baseline'
    check('catalog_UI_code_preserved',wrappers)
    def portraits():
        seen={x['path']:x['sha256'] for e in oldmob['entries'] for x in [e.get('portrait',{})] if x.get('exists') and x.get('sha256')}
        for p,h in seen.items():need(sha((WORK/p).read_bytes())==h,'portrait PNG changed '+p)
        return {'uniquePortraitPNGsUnchanged':len(seen)}
    check('portrait_PNG_hashes',portraits)
    def canonical():
        p=REPO/'tools/mob-image-sets/background-contexts.json';a=json.loads(prior(p));b=jread(p)
        for k in set(a)|set(b):
            if k!='lastImageAdoption':need(a.get(k)==b.get(k),'canonical context '+k)
        last=b.get('lastImageAdoption');need(last and last.get('record')==ID and last.get('files')==9 and last.get('qspChanged') is False,'context adoption provenance')
        p=REPO/'docs/MOB_BACKGROUND_CONTEXTS_KO.md';a=prior(p);b=p.read_bytes();need(b.startswith(a) and ID.encode() in b[len(a):],'context doc must append provenance')
        return {'contextsOnlyLastAdoptionChanged':True,'docAppendOnly':True}
    check('canonical_context_and_append_only_document',canonical)
    def events():
        for p in (CAT/'image_work/history.jsonl',CAT/'image_work/personal-patch/events.jsonl'):
            new=appended(p);need(len(new)==1 and new[0]['id']==ID,'exactly one adoption event '+str(p));event=new[0]
            need(len(event['files'])==9,'nine event files '+str(p));ef={}
            for f in event['files']:
                q=norm(f['path']);q='content/pic/'+q if q.startswith('mob/') else q;ef[q]=f
            need(set(ef)==set(files),'event target set '+str(p))
            for q,f in ef.items():need(f.get('after')==files[q]['after'] and f.get('before')==files[q]['before'],'event before/after hashes '+q)
        return {'ledgers':2,'eventsPerLedger':1,'filesPerEvent':9,'oldPrefixPreserved':True}
    check('history_and_personal_patch_exact_nine_file_events',events)
    def plan():
        p=REPO/'records/full-client-preparation-20261029/full-client-input-plan.json';a=json.loads(prior(p));b=jread(p)
        for k in set(a)|set(b):
            if k not in ('files','summary'):need(a.get(k)==b.get(k),'plan global '+k)
        need(len(a['files'])==len(b['files']),'plan file count changed');n=0;delta=0
        for x,y in zip(a['files'],b['files']):
            need(x['path']==y['path'],'plan row order/path changed');p=norm(x['path']).removeprefix('game/');f=files.get(p)
            if f is None:need(x==y,'unrelated plan row '+p);continue
            n+=1;need(x['sha256']==f['before'],'plan before hash '+p);need(y['sha256']==f['after'] and y['bytes']==f['bytes'],'plan target hash/size '+p)
            for k in set(x)|set(y):
                if k not in ('bytes','sha256'):need(x.get(k)==y.get(k),'plan extra field '+k)
            delta+=y['bytes']-x['bytes']
        need(n==9,'nine existing plan targets')
        for k in set(a['summary'])|set(b['summary']):
            if k!='includedBytes':need(a['summary'].get(k)==b['summary'].get(k),'plan summary '+k)
        need(b['summary']['includedFiles']==len(b['files']) and b['summary']['includedBytes']==sum(x['bytes'] for x in b['files'])==a['summary']['includedBytes']+delta,'plan totals')
        return {'existingTargets':9,'newFiles':0,'fileCountUnchanged':len(b['files']),'includedBytesDelta':delta,'allOtherRowsAndMetadataPreserved':True}
    check('full_client_plan_nine_updates_only',plan)
    def protected():
        for p,h in r['protectedHashes'].items():need(sha(Path(p).read_bytes())==h,'protected file '+p)
        need(r['qspBefore']==r['qspAfter']==sha((WORK/'jack.qsp').read_bytes()),'QSP hash changed')
        need(all(r.get(k) is False for k in ('saveWrites','fullSynced','releaseZipChanged','commitPush')),'scope boundary')
        return {'protectedPaths':len(r['protectedHashes']),'QSPUnchanged':True,'saveWrites':False,'distributionSync':False}
    check('protected_hashes_QSP_and_scope_boundaries',protected)
    def qsp_routes():
        js="const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));const body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);console.log(JSON.stringify({sprite:body('jo9_battle_fate'),enemy:body('#противники')}));"
        proc=subprocess.run(['node','-e',js],capture_output=True,check=True,encoding='utf-8');q=json.loads(proc.stdout);s=q['sprite']
        need("$args[0] = 'sprite'" in s and 'if args[2] = 1:' in s,'sprite/defeat gate absent');result=[]
        for key in ('egeya','vatican_paladin','strazhnik','grinch','erza'):
            stand='grinch_full' if key=='grinch' else key
            line=next((x for x in s.splitlines() if 'content/pic/mob/'+stand+'.png' in x and 'content/pic/mob/defeated/'+key+'.png' in x),None)
            if key=='grinch':
                # This enemy uses the existing explicit enemy-key branch rather
                # than the filename replacement used by the other four keys.
                declaration="$силуэт_моба['grinch'] = \"content/pic/mob/grinch_full.png\""
                branch="if $враг[jo9_bv_slot] = 'grinch': $jo9_bv_image = 'content/pic/mob/defeated/grinch.png'"
                need(declaration in q['enemy'] and branch in s and 'local $jo9_bv_image = $силуэт_моба[$враг[jo9_bv_slot]]' in s,'Grinch standing lookup and explicit defeat branch')
                result.append({'key':key,'route':'enemy-key-defeat-branch','standing':'content/pic/mob/grinch_full.png','defeat':'content/pic/mob/defeated/grinch.png'})
            else:
                need(line is not None,'existing standing→defeat route '+key);result.append({'key':key,'route':'existing-standing-path-replacement'})
        return {'existingQuestImageRoutes':result,'QSPChanged':False,'actualGameplay':False}
    check('existing_QSP_standing_defeat_path_routes',qsp_routes)
    report={'pass':all(x['pass'] for x in checks),'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'record':str(RECORD),'checks':checks,'strictPreservation':True,'limits':['Independent read-only image/file/metadata audit; no actual in-game battle playback.','Only this local verification report was written.','No complete save-folder before snapshot; unchanged QSP and installer no-save-write scope are verified.','No unrelated concurrent change is automatically exempted.']}
    out=HERE/'independent-verification.json'
    if out.exists() and jread(out).get('pass') is False and not (HERE/'preliminary-independent-verification.json').exists():(HERE/'preliminary-independent-verification.json').write_bytes(out.read_bytes())
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'pass':report['pass'],'checks':len(checks),'failed':[x for x in checks if not x['pass']]},ensure_ascii=False))

if __name__=='__main__':main()
