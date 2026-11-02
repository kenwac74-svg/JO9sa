from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
import json,hashlib,shutil
R=Path('G:/somi/JO9sa/records/mob-battle-assets-20261029');G=Path('G:/somi/Jack O Nine Tails v2.4_work/game');W=Path('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/mob-battle-assets-20261029');W.mkdir(parents=True,exist_ok=True)
j=json.loads((R/'generated-manifest.json').read_text(encoding='utf-8'));norm=json.loads(Path('G:/somi/JO9sa/records/mob-image-size-standard-20261029/installation.json').read_text(encoding='utf-8'));nm={x['path']:x for x in norm['files']};inv=json.loads(Path('G:/somi/JO9sa/records/mob-image-size-standard-20261029/inventory.json').read_text(encoding='utf-8'));old_index={x['path']:x for x in inv['files']};extra_backup=Path('G:/somi/JO9_work_backups/mob-battle-assets-20261029/original');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();rows=[]
for r in j['rows']:
 src=Path(r['generatedSource']);im=Image.open(src).convert('RGBA');alpha=im.getchannel('A').getextrema()
 if r['transparent']:assert alpha[0]<255,(r['key'],'generator did not preserve transparency')
 fit=ImageOps.contain(im,(795,596),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',(795,596),(0,0,0,0));offset=((795-fit.width)//2,(596-fit.height)//2);canvas.alpha_composite(fit,offset)
 if canvas.getchannel('A').getextrema()==(255,255):canvas=canvas.convert('RGB')
 target=W/'final'/r['target'];target.parent.mkdir(parents=True,exist_ok=True);canvas.save(target,'PNG',optimize=True)
 old=G/r['target'];current_sha=sha(old) if old.exists() else None
 if r['target'] in nm:assert current_sha==nm[r['target']]['after'],r['target']
 elif old.exists():
  assert r['target'] in old_index and current_sha==old_index[r['target']]['sha256'],('Concurrent/unexpected target',r['target'])
  bp=extra_backup/r['target'];bp.parent.mkdir(parents=True,exist_ok=True)
  with bp.open('xb') as o:o.write(old.read_bytes())
 else:assert not old.exists(),('Concurrent/unexpected target',r['target'])
 row={**r,'generatedSourceSHA256':sha(src),'generatedSize':list(im.size),'candidate':str(target),'dimensions':[795,596],'mode':canvas.mode,'alphaRange':list(canvas.convert('RGBA').getchannel('A').getextrema()),'beforeCurrent':current_sha,'before':nm.get(r['target'],{}).get('before',current_sha),'beforePath':nm.get(r['target'],{}).get('backup',str(extra_backup/r['target']) if old.exists() else None),'after':sha(target),'bytes':target.stat().st_size,'normalization':{'method':'contain/Lanczos/transparent pad','resized':list(fit.size),'offset':offset}};rows.append(row)
# User explicitly requested replacement/new scene production. Backups already hold the original six source cuts.
state={'status':'APPLYING','files':rows,'applied':[],'originalBackups':norm['backupRoot']};(R/'installation.json').write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
for r in rows:
 dst=G/r['target'];dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(Path(r['candidate']).read_bytes());assert sha(dst)==r['after'];state['applied'].append(r['target']);(R/'installation.json').write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
state['status']='INSTALLED';state['artFiles']=len(rows);state['groups']=8;state['background']='content/pic/bg/battle_mist_forest.png';state['qspInstalled']=False;(R/'installation.json').write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
# A compact independent inspection sheet, not a replacement game asset.
sheet=Image.new('RGB',(1000,5*210),'#b9ad97');d=ImageDraw.Draw(sheet)
for i,r in enumerate(rows):
 im=Image.open(r['candidate']).convert('RGBA');im.thumbnail((320,180),Image.Resampling.LANCZOS);x=i%3*333+(333-im.width)//2;y=i//3*210+24;sheet.paste(im,(x,y),im);d.text((i%3*333+7,i//3*210+5),r['key'],fill='black')
sheet.save(W/'all-assets-sheet.png');(R/'selected-final-files.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print({'installed':len(rows),'groups':8,'all':[795,596],'workspace':str(W)})
