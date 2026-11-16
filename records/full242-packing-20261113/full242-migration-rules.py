import hashlib,json,pathlib,re
R=pathlib.Path('G:/somi/JO9sa');W=pathlib.Path('G:/somi/Jack O Nine Tails v2.4_work/game');T=pathlib.Path('G:/Codex/tmp/full242-packing-20261113');D=R/'records/full242-packing-20261113'
def read(p):return json.loads(p.read_text('utf-8-sig'))
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
paths={};skipped=[]
def add(old,new,evidence):
 if old.lower()==new.lower():return
 if not (W/new).is_file():skipped.append({'old':old,'new':new,'reason':'target missing'});return
 key=old.replace('\\','/').lower()
 if key in paths and paths[key]['new'].lower()!=new.lower():raise RuntimeError('Conflicting approved mapping '+old)
 paths[key]={'old':old,'new':new,'evidence':evidence}
for x in read(R/'records/ui-live-consolidation-20261027/canonical-link-journal.json')['rows']:
 add(x['old'],x['canonical'],'UI canonical-link-journal')
for x in read(R/'records/audio-format-normalize-20261108/converted.json')['files']:
 add('content/snd/'+x['oldName'],'content/snd/'+x['name'],'approved audio conversion')
for x in read(R/'assets/runtime-manifests/2.4.2-work.json')['requiredLegacyRetention']:
 old=x['runtimePath']
 if old.startswith('content/pic/girls/') and '/face/' not in old:
  tail=old.removeprefix('content/pic/girls/');new='content/pic/girls/face/'+tail.removeprefix('face')
  add(old,new,'known misplaced old portrait address')
 elif old=='json/slaves/2339.json':add(old,'json/slaves/2339_yagisuna.json','approved same-ID filename rename')
old_by_id={};current_by_id={}
for directory,target in [(T/'old-json',old_by_id),(W/'json/slaves',current_by_id)]:
 for p in directory.glob('*.json'):
  m=re.match(r'(\d+)',p.name)
  if not m:continue
  target.setdefault(str(int(m[1])),[]).append((p.name,read(p)))
actors={};name_changes=[]
field_keys={'fullimage':'FULLIMAGE','seed_ava':'AVA','seed_ava_gray':'AVA_GRAY','seed_ava_clear':'AVA_CLEAR'}
for ident,files in current_by_id.items():
 if len(files)!=1:raise RuntimeError('Duplicate current character ID '+ident)
 name,cur=files[0];previous=old_by_id.get(ident,[])
 if not previous:continue
 new_name=cur.get('seed_name','');old_names=sorted({o.get('seed_name','') for _,o in previous if o.get('seed_name') and o.get('seed_name')!=new_name}) if new_name else []
 fields={}
 for json_key,sav_key in field_keys.items():
  new=cur.get(json_key)
  if not isinstance(new,str) or not new:continue
  old_values=sorted({o.get(json_key,'') for _,o in previous if isinstance(o.get(json_key),str) and o.get(json_key) and o.get(json_key)!=new})
  if old_values:fields[sav_key]=[{'old':o,'new':new} for o in old_values]
 if old_names or fields:
  actors[ident]={'old_names':old_names,'new_name':new_name,'fields':fields}
  if old_names:name_changes.append({'id':int(ident),'old':old_names,'new':new_name})
rules={'schema':1,'version':'2.4.2','supported_source':'2.4.1 non-combat saves / QSPSAVEDGAME5.7.0','qsp_sha256':digest(W/'jack.qsp'),'paths':list(paths.values()),'actors':actors,'preserve':['numeric values','slots','array keys','custom names','training','relationships','inventory','quest progress','CRC'],'legacyAddressesRetained':True}
for p in [pathlib.Path('save242-rules.json'),D/'save242-rules.json']:
 p.write_text(json.dumps(rules,ensure_ascii=False,indent=2)+'\n','utf-8')
(D/'migration-map-summary.json').write_text(json.dumps({'globalPaths':len(paths),'actorRules':len(actors),'defaultNameChanges':name_changes,'missingTargetsNotMapped':skipped,'base':'released update3-r2 git1c3f76ddcf5c8da0a92cea1908ef3cdb1627af4f','noLegacyFilesDeleted':True},ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'paths':len(paths),'actors':len(actors),'nameChanges':len(name_changes),'skippedMissingTargets':len(skipped)},ensure_ascii=False))
