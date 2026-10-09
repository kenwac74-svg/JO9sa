"""Sync JO9 management records without copying game images, QSP or API keys."""
import argparse,datetime,hashlib,json,pathlib,re,shutil,subprocess,time
P=pathlib.Path
FILES=['catalog_merge_vs_original.html','catalog_work_ids.json','catalog_status.js','image_work/progress.json','image_work/history.jsonl','image_work/bg_queue.json','image_work/personal-patch/events.jsonl','image_work/personal-patch/settings.json']
def read(p):return p.read_text(encoding='utf-8-sig')
def load(p):return json.loads(read(p))
def rows(s):return json.loads(re.search(r'var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR',s)[1])
def state(p):return json.loads(re.search(r'window\.CATALOG_STATUS\s*=\s*([\s\S]*);\s*$',read(p))[1])
def jsontext(v):return json.dumps(v,ensure_ascii=False,indent=2)+'\n'
def convert(v,pairs):
 if isinstance(v,str):
  for a,b in sorted(pairs,key=lambda x:len(x[0]),reverse=True):
   if a:v=v.replace(a,b)
  return v
 if isinstance(v,list):return [convert(x,pairs) for x in v]
 if isinstance(v,dict):return {k:convert(x,pairs) for k,x in v.items()}
 return v
def mappings(source,game,original,catalog):
 pairs=[('@GAME@',str(game)),('@ORIGINAL@',str(original)),('@CATALOG@',str(catalog))]
 prog=source/'image_work/progress.json'
 if prog.exists():
  v=load(prog);roots=v.get('roots',{})
  pairs += [(roots.get('game',''),str(game)),(roots.get('original',''),str(original)),(roots.get('merge',''),str(game))]
  old=v.get('catalog','');old=old.rsplit('\\',1)[0] if '\\' in old else old.rsplit('/',1)[0]
  pairs.append((old,str(catalog)))
 return pairs
class Writer:
 def __init__(self,catalog):
  self.backup=catalog/'image_work/status_backups'/('workspace_sync_'+datetime.datetime.now().strftime('%Y%m%d_%H%M%S_%f'));self.count=0
 def put(self,dest,data,rel):
  raw=data.encode('utf-8');dest.parent.mkdir(parents=True,exist_ok=True)
  if dest.exists() and dest.read_bytes()==raw:return
  if dest.exists():
   b=self.backup/rel;b.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dest,b)
  tmp=dest.with_name(dest.name+'.sync-tmp');tmp.write_bytes(raw);tmp.replace(dest);self.count+=1

def sync(source,catalog,game,original):
 aids=load(source/FILES[1]);bids=load(catalog/FILES[1]);conflicts=[p for p,v in aids['items'].items() if p in bids['items'] and bids['items'][p]!=v]
 if conflicts:raise ValueError('Conflicting stable work IDs: '+str(len(conflicts)))
 w=Writer(catalog);pairs=mappings(source,game,original,catalog)
 sh=read(source/FILES[0]);local=read(catalog/FILES[0]);sr=rows(sh);lr=rows(local);known={d[0] for d in sr};combined=sr+[d for d in lr if d[0] not in known]
 updated=re.sub(r'var D\s*=\s*\[[\s\S]*?\];(?=\s*\r?\nvar MR)',lambda _: 'var D='+json.dumps(combined,ensure_ascii=False,separators=(',',':'))+';',local,count=1)
 updated=re.sub(r'var MR=.*?;(?=\s*\n)',lambda _: 'var MR='+json.dumps(str(game),ensure_ascii=False)+', OR='+json.dumps(str(original),ensure_ascii=False)+';',updated,count=1)
 w.put(catalog/FILES[0],updated,FILES[0])
 a=load(source/FILES[1]);b=load(catalog/FILES[1]);conflicts=[p for p,v in a['items'].items() if p in b['items'] and b['items'][p]!=v]
 if conflicts:raise ValueError('Conflicting stable work IDs: '+str(len(conflicts)))
 b['items'].update(a['items']);b['counters']={k:max(a.get('counters',{}).get(k,0),b.get('counters',{}).get(k,0)) for k in set(a.get('counters',{}))|set(b.get('counters',{}))};w.put(catalog/FILES[1],jsontext(b),FILES[1])
 a=state(source/FILES[2]);b=state(catalog/FILES[2]);first,second=(b,a) if a.get('savedAt',0)>=b.get('savedAt',0) else (a,b);out={**first,**second};out['items']={**first['items'],**second['items']};out['savedAt']=max(int(time.time()*1000),int(a.get('savedAt',0)),int(b.get('savedAt',0)))
 w.put(catalog/FILES[2],'// Shared checklist state\nwindow.CATALOG_STATUS='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n',FILES[2])
 for rel in FILES[3:]:
  sp=source/rel;dp=catalog/rel
  if not sp.exists():continue
  if rel.endswith('.jsonl'):
   values=[];seen=set()
   for file in [dp,sp]:
    if file.exists():
     for line in read(file).splitlines():
      if not line.strip():continue
      raw=json.loads(line);key=json.dumps(raw,sort_keys=True,ensure_ascii=False);v=convert(raw,pairs)
      if key not in seen:seen.add(key);values.append(v)
   content=''.join(json.dumps(v,ensure_ascii=False)+'\n' for v in values)
  else:
   v=convert(load(sp),pairs)
   if rel.endswith('progress.json') and dp.exists():
    prior=load(dp);incoming={i['relative_path']:i for i in v['items']};incoming={**{i['relative_path']:i for i in prior['items']},**incoming};v['items']=list(incoming.values());v['roots']={'original':str(original),'merge':str(game),'game':str(game)}
   if rel.endswith('personal-patch/settings.json'):v.update(game=str(game),catalogRoot=str(catalog))
   content=jsontext(v)
  w.put(dp,content,rel)
 return {'rows':len(combined),'addedRows':len(known-{d[0] for d in lr}),'writes':w.count,'backup':str(w.backup)}

def export(catalog,seed,game,original):
 pairs=mappings(catalog,game,original,catalog)+[(str(game),'@GAME@'),(str(original),'@ORIGINAL@'),(str(catalog),'@CATALOG@')]
 # Export only portable replacement pairs, not the import pairs above.
 pairs=[(str(game),'@GAME@'),(str(original),'@ORIGINAL@'),(str(catalog),'@CATALOG@')]
 for rel in FILES:
  src=catalog/rel
  if not src.exists():continue
  dst=seed/rel;dst.parent.mkdir(parents=True,exist_ok=True)
  if rel.endswith('.html'):
   text=read(src);text=re.sub(r'var MR=.*?;(?=\s*\n)', 'var MR="@GAME@", OR="@ORIGINAL@";',text,count=1)
   # Visible PC paths are not execution authority; normalize them as well.
   text=convert(text,pairs)
  elif rel.endswith('.jsonl'):text=''.join(json.dumps(convert(json.loads(x),pairs),ensure_ascii=False)+'\n' for x in read(src).splitlines() if x.strip())
  elif rel.endswith('.js'):text='// Shared portable checklist state\nwindow.CATALOG_STATUS='+json.dumps(state(src),ensure_ascii=False,separators=(',',':'))+';\n'
  else:text=jsontext(convert(load(src),pairs))
  dst.write_text(text,encoding='utf-8')
 # Backward compatible seed for older launchers; newer launchers use nested records.
 if (seed/'image_work/progress.json').exists():shutil.copy2(seed/'image_work/progress.json',seed/'progress.json')

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--catalog',required=True);ap.add_argument('--game',required=True);ap.add_argument('--original',required=True);ap.add_argument('--source');ap.add_argument('--export-seed');args=ap.parse_args()
 catalog,game,original=map(P,[args.catalog,args.game,args.original])
 if game.resolve()==original.resolve():raise ValueError('Play and vanilla must be separate')
 before=hashlib.sha256((game/'jack.qsp').read_bytes()).hexdigest()
 result=sync(P(args.source),catalog,game,original) if args.source else {}
 if args.export_seed:export(catalog,P(args.export_seed),game,original)
 assert before==hashlib.sha256((game/'jack.qsp').read_bytes()).hexdigest()
 print(json.dumps({**result,'gameQspUnchanged':True,'imagesCopied':0},ensure_ascii=False))
if __name__=='__main__':main()
