from pathlib import Path
from PIL import Image
import json,re,hashlib,collections,datetime
G=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
R=Path('G:/somi/JO9sa/records/mob-image-size-standard-20261029')
htmlp=G/'modtools/catalog/catalog_merge_vs_original.html';raw=htmlp.read_bytes();html=raw.decode('utf-8-sig')
m=re.search(r'window\.JO9_MOB_SETS=(.*?);</script>',html);assert m
manifest=json.loads(m.group(1));groups=json.loads(Path('G:/somi/JO9sa/tools/mob-image-sets/group-sets.json').read_text(encoding='utf-8-sig'))
index={}
def add(path,role,key,name,slot):
 p=path.replace('\\','/');f=p.lower()
 if f not in index:index[f]={'path':p,'roles':[],'users':[],'manifestDimensions':[]}
 x=index[f]
 if role not in x['roles']:x['roles'].append(role)
 x['users'].append({'key':key,'name':name,'role':role})
 if slot.get('width') and [slot['width'],slot.get('height')] not in x['manifestDimensions']:x['manifestDimensions'].append([slot['width'],slot.get('height')])
for e in manifest['entries']:
 for role in ['portrait','standing','defeat']:
  slot=e.get(role)
  if slot and slot.get('path'):add(slot['path'],role,e['key'],e['name'],slot)
for e in groups:
 slot=e.get('defeat') or {'path':e['path']}
 add(slot['path'],'group_defeat',e['key'],e['name'],slot)
for x in index.values():
 p=G/x['path'];x['exists']=p.is_file();x['sensitiveNameReview']=[]
 n=x['path'].lower()
 if 'gladiator_prisoner' in n:x['sensitiveNameReview'].append('prisoner/youth-associated game role; inspect actual artwork before editing or using as generation reference')
 if any(t in n for t in ['glad_naked','gladiator_dimaha','glad_mistress','glad_shinobi','glad_amason','glad_armored']):x['sensitiveNameReview'].append('gladiator artwork may contain nudity; filename alone does not establish age or content')
 if not p.is_file():x['kind']='missing';continue
 b=p.read_bytes();x['bytes']=len(b);x['sha256']=hashlib.sha256(b).hexdigest()
 with Image.open(p) as im:
  x['format']=im.format;x['mode']=im.mode;x['width']=im.width;x['height']=im.height;x['frames']=getattr(im,'n_frames',1);x['isAnimated']=bool(getattr(im,'is_animated',False))
  if 'A' in im.getbands():
   a=im.getchannel('A');x['alphaRange']=list(a.getextrema());bb=a.getbbox();x['alphaNonzeroBounds']=list(bb) if bb else None;hist=a.histogram();total=im.width*im.height;x['fullyTransparentFraction']=hist[0]/total;x['fullyOpaqueFraction']=hist[255]/total
  else:x['alphaRange']=[255,255];x['alphaNonzeroBounds']=[0,0,im.width,im.height];x['fullyTransparentFraction']=0;x['fullyOpaqueFraction']=1
  visual={'standing','defeat','group_defeat'}.intersection(x['roles']);portrait='portrait' in x['roles']
  x['kind']='portrait' if not visual else 'portrait_fallback_or_conflict' if (portrait or im.size==(150,150)) else 'battle_artwork'
  x['targetDimensions']=[795,596] if visual and x['kind']=='battle_artwork' else [150,150] if portrait and not visual else None
  x['needsResize']=x['targetDimensions'] is not None and list(im.size)!=x['targetDimensions']
  if visual and x['kind']=='battle_artwork':
   factor=min(795/im.width,596/im.height);rw=max(1,round(im.width*factor));rh=max(1,round(im.height*factor));x['containPlan']={'scale':factor,'resized':[rw,rh],'offset':[(795-rw)//2,(596-rh)//2],'padding':[795-rw,596-rh]}
rows=sorted(index.values(),key=lambda x:x['path'].lower())
visuals=[x for x in rows if any(r in x['roles'] for r in ['standing','defeat','group_defeat'])]
existing=[x for x in visuals if x['exists']]
counts=collections.Counter((x.get('width'),x.get('height')) for x in existing)
summary={'manifestEntries':len(manifest['entries']),'groups':len(groups),'uniqueAllSlots':len(rows),'uniqueBattleSlots':len(visuals),'existingBattleFiles':len(existing),'missingBattleFiles':len(visuals)-len(existing),'battleArtFiles':sum(x.get('kind')=='battle_artwork' for x in existing),'portraitFallbackOrConflictFiles':sum(x.get('kind')=='portrait_fallback_or_conflict' for x in existing),'already795x596':sum(x.get('width')==795 and x.get('height')==596 for x in existing),'needsResize':sum(x.get('needsResize',False) for x in existing),'animated':sum(x.get('isAnimated',False) for x in existing),'existingBattleDimensions':[{'width':k[0],'height':k[1],'files':v} for k,v in counts.items()]}
result={'status':'READ_ONLY_INVENTORY','createdKST':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat(),'game':str(G),'manifestSource':str(htmlp),'manifestHtmlSha256':hashlib.sha256(raw).hexdigest(),'qspSha256':hashlib.sha256((G/'jack.qsp').read_bytes()).hexdigest(),'targetBattleSize':[795,596],'portraitSize':[150,150],'summary':summary,'missing':[{'path':x['path'],'roles':x['roles'],'users':x['users']} for x in visuals if not x['exists']],'conflicts':[x for x in rows if 'portrait' in x['roles'] and any(r in x['roles'] for r in ['standing','defeat','group_defeat'])],'portraitFallbacks':[x for x in existing if x.get('kind')=='portrait_fallback_or_conflict'],'files':rows,'limits':['Metadata inspection only; no images, QSP or catalog edited.','Sensitive-name flags are review prompts, not conclusions about image content or character ages.','No hidden/non-manifest MOB art inferred as runtime battle slots.','Runtime aliases and dimensions supplied by cached manifest may be stale; actual files are authoritative.']}
(R/'inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False));print('CONFLICTS',[(x['path'],x['roles']) for x in result['conflicts']]);print('FALLBACKS',[(x['path'],x.get('width'),x.get('height'),x['roles']) for x in result['portraitFallbacks']]);print('MISSING',[(x['path'],x['roles']) for x in result['missing']])
