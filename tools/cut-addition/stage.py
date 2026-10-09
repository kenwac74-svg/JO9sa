from pathlib import Path
import shutil
here=Path(__file__).resolve().parent
shutil.copy2(here.parent/'check-image-cycle-syntax.cjs',here/'check-image-cycle-syntax.cjs')
project=Path('C:/Users/Ken Choung/Documents/Codex/2026-10-06/task/JO9sa')
source=project/'tools/text-workshop'
for name in ['core.cjs','apply_mods.ps1']:
 shutil.copy2(source/name if name=='core.cjs' else project/'tools'/name,here/name)
s=(source/'server.cjs').read_text(encoding='utf-8')
s=s.replace("const localPic=require('./pic-local.cjs').create(game,catalogRoot,catalog);", "const localPic=require('./pic-local.cjs').create(game,catalogRoot,catalog);\nconst imageCuts=require('./image-cuts.cjs').create(game,catalogRoot,catalog,runtime);\nconst cutToken=crypto.randomBytes(24).toString('hex');")
s=s.replace("<script src=\"catalog_grok.js\"></script></body>","<script src=\"catalog_grok.js\"></script><script src=\"catalog_cuts.js\"></script></body>")
s=s.replace("const catalogFiles=['catalog_status.js'", "const catalogFiles=['catalog_cuts.js','catalog_status.js'")
anchor="    if(req.headers['x-jo9-token']!==token) {"
routes='''    // A scoped workshop token grants only cut info/add; it never grants dialogue editing.
    if(url.pathname.startsWith('/api/catalog/cuts/')){
      const origin=req.headers.origin,workshop=origin==='http://127.0.0.1:5269';
      if(workshop){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
      if(req.method==='OPTIONS'&&workshop){res.setHeader('Access-Control-Allow-Methods','GET, POST');res.setHeader('Access-Control-Allow-Headers','Content-Type, X-JO9-Cut-Token');res.writeHead(204);res.end();return;}
      const action=url.pathname.slice('/api/catalog/cuts/'.length);
      if(req.method==='GET'&&action==='session'&&workshop){json(res,200,{token:cutToken});return;}
      const authorized=(req.headers['x-jo9-token']===token&&(!origin||origin==='http://'+host||origin==='null'))||(workshop&&req.headers['x-jo9-cut-token']===cutToken);
      if(!authorized){json(res,403,{error:'편집실을 다시 열어 주세요.'});return;}
      if(req.method!=='POST'||!['info','add'].includes(action)){json(res,400,{error:'잘못된 추가 컷 요청입니다.'});return;}
      const input=await body(req,85000000),result=action==='info'?imageCuts.info(input.base):imageCuts.add(input);
      if(action==='add'){localPic.scan(true);cache=null;preview=null;}
      json(res,200,result);return;
    }

'''
assert anchor in s
s=s.replace(anchor,routes+anchor,1)
(here/'server.cjs').write_text(s,encoding='utf-8')
game=Path('C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game')
html=(game/'modtools/place/JO9_Place_Workshop.html').read_text(encoding='utf-8-sig')
assert 'catalog_cuts.js' not in html
html=html.replace('</html>','<script src="http://127.0.0.1:3813/catalog_cuts.js"></script></html>')
(here/'JO9_Place_Workshop.html').write_text(html,encoding='utf-8')
print('Staged server, shared cut UI, workshop HTML and patch runner')
