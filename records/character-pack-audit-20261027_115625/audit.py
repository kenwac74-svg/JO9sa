import collections, concurrent.futures, csv, hashlib, importlib.util, json, os, re, sys, time
from datetime import datetime
from pathlib import Path
from PIL import Image

PACK=Path('G:/somi/잭오나v2.4 캐릭터 정리')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO=Path('G:/somi/JO9sa')
OUT=REPO/'records'/('character-pack-audit-'+datetime.now().strftime('%Y%m%d_%H%M%S'))
OUT.mkdir(parents=True,exist_ok=False)
IMG=PACK/'game/content/pic/girls'; WIN=WORK/'content/pic/girls'
EXT={'.png','.jpg','.jpeg','.gif','.webp','.bmp'}
def write(name,value): (OUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()
def inventory(root):
    result={};links=[]
    for folder,dirs,names in os.walk(root,followlinks=False):
        dirs[:]=[d for d in dirs if not (Path(folder)/d).is_symlink()]
        for name in names:
            p=Path(folder)/name
            if p.is_symlink(): links.append(str(p));continue
            if p.suffix.lower() not in EXT:continue
            rel=p.relative_to(root).as_posix();st=p.stat()
            result[rel.lower()]={'path':rel,'bytes':st.st_size,'mtime_ns':st.st_mtime_ns,'file':p}
    return result,links
def hashes(items):
    def calc(pair):
        k,v=pair;v['sha256']=digest(v['file']);return k
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(calc,items.items()))
def public(v):return {k:x for k,x in v.items() if k!='file'}
def pix(p):
    with Image.open(p) as im:
        im.load(); size=im.size;rgba=im.convert('RGBA')
        return size,hashlib.sha256(rgba.tobytes()).hexdigest()
def png_info(p):
    try:
        with Image.open(p) as im: return {'size':list(im.size),'mode':im.mode}
    except Exception as e:return {'error':str(e)}

pa,plinks=inventory(IMG);wa,wlinks=inventory(WIN)
print('Inventory: pack=%d, work=%d'%(len(pa),len(wa)),flush=True)
hashes(pa)
sizes={v['bytes'] for v in pa.values()}
wh={k:v for k,v in wa.items() if v['bytes'] in sizes or k in pa}
hashes(wh)
print('Hashes complete: work candidates=%d'%len(wh),flush=True)
work_by_hash=collections.defaultdict(list);pack_by_hash=collections.defaultdict(list)
for k,v in wh.items():work_by_hash[v['sha256']].append(v['path'])
for k,v in pa.items():pack_by_hash[v['sha256']].append(v['path'])
rows=[]
for k,v in pa.items():
    row=public(v);other=wa.get(k)
    if other:
        row['status']='identical' if v['sha256']==other['sha256'] else 'different'
        row['workBytes']=other['bytes'];row['workSha256']=other['sha256'];row['workPath']=other['path']
    else:
        row['status']='new';row['workBytes']=0
        row['sameContentElsewhere']=work_by_hash.get(v['sha256'],[])
    rows.append(row)
conflicts=[r for r in rows if r['status']=='different']
def compare_pixels(row):
    try:
        a,ha=pix(IMG/row['path']);b,hb=pix(WIN/row['workPath'])
        row['packDimensions']=list(a);row['workDimensions']=list(b)
        row['pixelStatus']='same_pixels' if a==b and ha==hb else 'changed_pixels'
    except Exception as e:row['pixelStatus']='read_error';row['readError']=str(e)
    return row
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(compare_pixels,conflicts))
counts=collections.Counter(r['status'] for r in rows)
print('Image classifications: '+json.dumps(counts),flush=True)
json_errors=[]
def load_json(p):
    raw=p.read_bytes()
    for enc in ('utf-8-sig','utf-16','cp1251','cp949'):
        try:return json.loads(raw.decode(enc)),enc
        except (UnicodeError,json.JSONDecodeError):pass
    raise ValueError('No supported JSON encoding')
def json_inventory(root):
    values={}
    for p in root.rglob('*.json'):
        rel=p.relative_to(root).as_posix()
        try:
            data,enc=load_json(p);values[rel.lower()]={'path':rel,'sha256':digest(p),'data':data,'encoding':enc}
        except Exception as e:json_errors.append({'path':str(p),'error':str(e)})
    return values
pj=json_inventory(PACK/'json/slaves');wj=json_inventory(WORK/'json/slaves')
def is_image_key(k):return k.startswith('indpack_') or k in ('fullimage','fullmade','fullmistress','fullsecretary','seed_ava','seed_ava_gray','seed_ava_clear')
jrows=[];references=[];ids=collections.defaultdict(list)
for name,v in wj.items():
    match=re.match(r'^(\d+)',Path(name).stem)
    if match:ids[int(match[1])].append(v['path'])
for name,v in pj.items():
    old=wj.get(name);d=v['data'];jrow={'path':v['path'],'packSha256':v['sha256']}
    if old is None:jrow['status']='new';jrow['changedFields']=list(d)
    else:
        jrow['workSha256']=old['sha256']
        keys=set(d)|set(old['data']);changed=[k for k in sorted(keys) if d.get(k)!=old['data'].get(k) or (k in d)!=(k in old['data'])]
        jrow['changedFields']=changed
        jrow['status']='identical' if not changed else ('image_only' if all(is_image_key(k) for k in changed) else 'non_image_changes')
        if changed:jrow['changes']={k:{'work':old['data'].get(k),'pack':d.get(k),'removedByPack':k not in d} for k in changed}
    match=re.match(r'^(\d+)',Path(name).stem)
    jrow['id']=int(match[1]) if match else None
    jrow['otherWorkDefinitionsForId']=[x for x in ids.get(jrow['id'],[]) if x.lower()!=name]
    jrows.append(jrow)
    for key,value in d.items():
        if not is_image_key(key) or key=='indpack_info' or not isinstance(value,str) or not value:continue
        norm=value.replace('\\','/').lstrip('/');norm=norm[12:] if norm.lower().startswith('content/pic/') else norm
        if not norm.lower().startswith('girls/'):continue
        rel=norm[6:]
        candidates=[rel] if Path(rel).suffix.lower() in EXT else [rel+e for e in ('.png','.jpg','.jpeg','.gif','.webp','.bmp')]
        pk=next((x.lower() for x in candidates if x.lower() in pa),None)
        wk=next((x.lower() for x in candidates if x.lower() in wa),None)
        references.append({'json':v['path'],'field':key,'reference':value,'path':pa[pk]['path'] if pk else wa[wk]['path'] if wk else candidates[0],'availableInPack':bool(pk),'availableInWork':bool(wk),'availableAfterOverlay':bool(pk or wk)})
write('images.json',rows);write('json-comparison.json',jrows);write('image-references.json',references)
dups=[{'sha256':h,'paths':paths,'copies':len(paths),'bytesEach':pa[paths[0].lower()]['bytes']} for h,paths in pack_by_hash.items() if len(paths)>1]
write('internal-duplicates.json',dups)
byid=collections.defaultdict(lambda:collections.Counter())
for r in rows:
    parts=Path(r['path']).parts
    identifier=parts[1] if len(parts)>2 else re.match(r'^(\d+)',parts[-1]).group(1) if re.match(r'^(\d+)',parts[-1]) else '[other]'
    byid[identifier][r['status']]+=1
    byid[identifier]['bytes']+=r['bytes']
write('by-character.json',byid)
summary={'packRoot':str(PACK),'workRoot':str(WORK),'output':str(OUT),
    'packImageFiles':len(pa),'packImageBytes':sum(v['bytes'] for v in pa.values()),'workImageFiles':len(wa),
    'images':{status:{'files':counts[status],'packBytes':sum(r['bytes'] for r in rows if r['status']==status),'workBytes':sum(r.get('workBytes',0) for r in rows if r['status']==status)} for status in ('identical','different','new')},
    'differentPixels':dict(collections.Counter(r['pixelStatus'] for r in conflicts)),
    'newButSameContentElsewhere':sum(r['status']=='new' and bool(r.get('sameContentElsewhere')) for r in rows),
    'internalDuplicateGroups':len(dups),'internalExtraCopies':sum(len(x['paths'])-1 for x in dups),'internalExtraBytes':sum((len(x['paths'])-1)*x['bytesEach'] for x in dups),
    'packCharacterFolders':len({Path(v['path']).parts[1] for v in pa.values() if len(Path(v['path']).parts)>2}),
    'jsonFiles':len(pj),'jsonStatuses':dict(collections.Counter(r['status'] for r in jrows)),
    'duplicateCharacterIds':[{ 'json':r['path'],'id':r['id'],'otherDefinitions':r['otherWorkDefinitionsForId']} for r in jrows if r['otherWorkDefinitionsForId']],
    'referenceChecks':len(references),'missingAfterOverlay':[r for r in references if not r['availableAfterOverlay']],
    'jsonErrors':json_errors,'symlinksSkipped':plinks+wlinks,'qspSha256':digest(WORK/'jack.qsp'),'gameModified':False}
write('summary.json',summary)
write('input-snapshot.json',{'packImages':[public(v) for v in pa.values()],'workComparedImages':[public(v) for v in wh.values()],'packJson':[{k:v for k,v in x.items() if k!='data'} for x in pj.values()],'workJson':[{k:v for k,v in x.items() if k!='data'} for x in wj.values()]})
spec=importlib.util.spec_from_file_location('qsp_dump',REPO/'tools/qsp_dump.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
locations=mod.read_locations((WORK/'jack.qsp').read_bytes())
relevant=[]
for loc in locations:
    lines=loc['body'].splitlines(); hits=[i for i,line in enumerate(lines) if any(k in line for k in ('indpack_','fullmade','fullsecretary','fullmistress'))]
    if hits:
        selected=set()
        for i in hits:selected.update(range(max(0,i-2),min(len(lines),i+3)))
        relevant.append({'location':loc['name'],'lines':[{'line':i+1,'code':lines[i]} for i in sorted(selected)]})
write('qsp-image-binding-evidence.json',{'locations':len(locations),'bindings':relevant})
import shutil
shutil.copy2(Path(__file__),OUT/'audit.py')
print(json.dumps({k:v for k,v in summary.items() if k!='missingAfterOverlay'} | {'missingReferenceCount':len(summary['missingAfterOverlay'])},ensure_ascii=True),flush=True)
