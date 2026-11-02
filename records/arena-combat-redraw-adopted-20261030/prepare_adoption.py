from pathlib import Path
from PIL import Image
import json,hashlib

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO=Path('G:/somi/JO9sa')
REVIEW=ROOT/'output/arena-combat-redraw-20261030'
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
v=load(REVIEW/'review-manifest.json');files=[]
assert len(v['entries'])==43 and len(v['blocked'])==1
assert v['blocked'][0]['key']=='dimaher_e' and v['blocked'][0]['phase']=='defeat'
for x in v['entries']:
    p=x['runtimePath'];source=Path(x['gameReadyPath']);before=x['currentWorkSha256']
    assert (WORK/p).is_file() and sha(WORK/p)==before,'WORK drift '+p
    assert sha(source)==x['sha256'],'review source drift '+p
    with Image.open(source) as im:
        im.load();assert im.format=='PNG' and im.size==(795,596)
        assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
    files.append({'path':p,'source':str(source),'after':x['sha256'],'before':before,'phase':x['slot'],'key':x['key']})
assert len({x['path'].lower() for x in files})==43
assert sum(x['phase']=='standing' for x in files)==22
assert sum(x['phase']=='defeat' for x in files)==21
blocked=v['blocked'][0]['runtimePath'];assert blocked not in {x['path'] for x in files}
protected={str(WORK/'jack.qsp'):sha(WORK/'jack.qsp'),str(WORK/blocked):sha(WORK/blocked)}
for root in (WORK/'modtools/catalog',REPO/'tools/local-workspace/catalog-seed'):
    for name in ('catalog_work_ids.json',):protected[str(root/name)]=sha(root/name)
manifest={'id':'arena-combat-redraw-adopted-20261030','approval':'work 적용하고 리스트 갱신','date':'2026-10-30','files':files,'subjects':22,'qspBefore':sha(WORK/'jack.qsp'),'sourceDrift':[],'blockedRetained':{'key':'dimaher_e','path':blocked,'sha256':sha(WORK/blocked)},'protectedHashes':protected,'reviewManifest':str(REVIEW/'review-manifest.json')}
(HERE/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')

src=(ROOT/'output/dimaher-d-adopted-20261029/adopt_work.cjs').read_text(encoding='utf8')
src=src.replace('DIMAHER_D_ADOPTION_20261029','ARENA_COMBAT_REDRAW_ADOPTION_20261030').replace('dimaher-d-adopted-20261029','arena-combat-redraw-adopted-20261030')
src=src.replace("'2026-10-29'","'2026-10-30'")
for old,new in [('files.length,2','files.length,43'),('affected.size,2','affected.size,43'),('entrySlots,2','entrySlots,43'),('files:2','files:43'),('oldRows.length-2','oldRows.length-43')]:
    assert old in src,old;src=src.replace(old,new)
src=src.replace("const originals=new Map([hp,sp,ip,gp,cp,docp].map(p=>[p,read(p)]));", """const seed=repo+'/tools/local-workspace/catalog-seed',seedHp=seed+'/catalog_merge_vs_original.html',seedSp=seed+'/catalog_status.js',planp=repo+'/records/full-client-preparation-20261029/full-client-input-plan.json';
const originals=new Map([hp,sp,ip,gp,cp,docp,seedHp,seedSp,planp].map(p=>[p,read(p)]));
for(const [p,h] of Object.entries(v.protectedHashes))a.equal(sha(p),h,'Protected input changed: '+p);
""")
src=src.replace("const extra=[cat+'/image_work/history.jsonl',cat+'/image_work/personal-patch/events.jsonl',repo+'/records/full-client-preparation-20261029/full-client-input-plan.json'];", "const extra=[cat+'/image_work/history.jsonl',cat+'/image_work/personal-patch/events.jsonl'];")
start=src.index('m.summary={...m.summary,missingStanding:')
end=src.index('\n',start)
src=src[:start]+src[end:]
needle="html=html.replace(dm[1],()=>JSON.stringify(rows)).replace(mm[0],()=> 'window.JO9_MOB_SETS='+JSON.stringify(m).replaceAll('<','\\\\u003c')+';</script>');"
assert needle in src
src=src.replace(needle,needle+"""
// Keep the portable seed's own unrelated rows and wrapper; it already differs from WORK.
const seedOld=originals.get(seedHp).toString('utf8'),seedDm=seedOld.match(/var D\\s*=\\s*(\\[[\\s\\S]*?\\]);\\s*\\r?\\nvar MR/),seedMm=seedOld.match(/window.JO9_MOB_SETS=(.*?);<\\/script>/);a(seedDm&&seedMm);
const seedOldRows=JSON.parse(seedDm[1]),seedRows=clone(seedOldRows),seedOldM=JSON.parse(seedMm[1]),seedM=clone(seedOldM),seedOldState=ct.parseStatus(originals.get(seedSp).toString('utf8')),seedState=clone(seedOldState);
let seedRowCount=0,seedSlotCount=0;
for(const row of seedRows){const f=affected.get(row[0].replaceAll('\\\\','/').toLowerCase());if(!f)continue;row[3]=f.bytes;row[5]=795;row[6]=596;seedRowCount++;const flags=new Set(seedState.items[row[0]]||[]);flags.delete('todo');flags.delete('wip');flags.add('done');seedState.items[row[0]]=[...flags];}
for(const e of seedM.entries)for(const kind of ['standing','defeat'])if(refresh(e[kind]))seedSlotCount++;
for(const g of seedM.groups)refresh(g.defeat);
a.equal(seedRowCount,43);a.equal(seedSlotCount,43);a.deepEqual(seedState.autoDone,seedOldState.autoDone);
seedM.workUpdate={...seedM.workUpdate,lastImageRedraw:clone(m.workUpdate.lastImageRedraw)};
const seedHtml=seedOld.replace(seedDm[1],()=>JSON.stringify(seedRows)).replace(seedMm[0],()=> 'window.JO9_MOB_SETS='+JSON.stringify(seedM).replaceAll('<','\\\\u003c')+';</script>');
const planOld=JSON.parse(originals.get(planp)),plan=clone(planOld);a.equal(plan.status,'BUILD_INPUT_PLAN_NOT_RELEASE_ZIP');a.equal(plan.qspSha256,qspBefore);
let planCount=0;
for(const row of plan.files){const f=affected.get(row.path.replace(/^game\\//,'').toLowerCase());if(!f)continue;row.bytes=f.bytes;row.sha256=f.after;planCount++;}a.equal(planCount,43);
plan.summary.includedBytes=plan.files.reduce((n,f)=>n+f.bytes,0);a.equal(plan.summary.includedFiles,plan.files.length);
""")
src=src.replace("saveWrites:false,fullSynced:false,releaseZipChanged:false,commitPush:false", "saveWrites:false,fullSynced:false,releaseZipChanged:false,commitPush:false,blockedRetained:v.blockedRetained,protectedHashes:v.protectedHashes")
src=src.replace("const summary={files:43,", "const summary={files:43,subjects:22,standing:22,defeat:21,")
needle="a(read(ip).equals(originals.get(ip)));a.equal(sha(game+'/jack.qsp'),qspBefore);"
assert needle in src
src=src.replace(needle,"""a(read(seedHp).equals(originals.get(seedHp)),'Concurrent seed HTML edit');a(read(seedSp).equals(originals.get(seedSp)),'Concurrent seed status edit');a(read(planp).equals(originals.get(planp)),'Concurrent input plan edit');
ct.atomic(seedHp,seedHtml);seedState.savedAt=Math.max(Date.now(),Number(seedOldState.savedAt||0)+1);ct.atomic(seedSp,'window.CATALOG_STATUS='+JSON.stringify(seedState)+';\\n');ct.atomic(planp,JSON.stringify(plan,null,2)+'\\n');
for(const [p,h] of Object.entries(v.protectedHashes))a.equal(sha(p),h,'Protected file changed: '+p);
"""+needle)
src=src.replace('승인된 쌍수 투사D(dimaher_d)의 전투·패배2장을', '승인된 아레나22종 전투22장·패배21장(43 PNG)을')
src=src.replace('PNG2개 및 체크리스트2슬롯만 갱신했다.', 'PNG43개 및 체크리스트43슬롯을 갱신했다. 쌍수 투사E 패배컷은 보류 상태로 기존 PNG를 유지했다.')
(HERE/'adopt_work.cjs').write_text(src,encoding='utf8')
print(json.dumps({'status':'PREPARED','files':len(files),'subjects':22,'standing':22,'defeat':21,'sourceDrift':[]},ensure_ascii=False))
