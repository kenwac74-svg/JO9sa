'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const source='G:/somi/JO9sa/tools/text-workshop',seed='G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog',tmp='G:/Codex/tmp/new-image-path-20261108';
const home=fs.mkdtempSync(tmp+'/browser-'),game=home+'/game',catalog=home+'/catalog';
fs.mkdirSync(game+'/content/pic/ui',{recursive:true});fs.mkdirSync(game+'/content/pic/bg',{recursive:true});fs.mkdirSync(game+'/content/pic/ui overhaul',{recursive:true});fs.mkdirSync(catalog,{recursive:true});
const png=fs.readFileSync(process.cwd()+'/qm_v_clean.png');fs.writeFileSync(game+'/content/pic/ui/neutral.png',png);
fs.writeFileSync(catalog+'/catalog_merge_vs_original.html','var D='+JSON.stringify([['content\\pic\\ui\\neutral.png','a','etc',png.length,0,24,26,'']])+';\nvar MR="fixture";');
fs.writeFileSync(catalog+'/catalog_status.js','window.CATALOG_STATUS={"items":{}};');
const cat=require(source+'/catalog.cjs').create(catalog),pic=require(source+'/pic-local.cjs').create(game,catalog,cat);
const html='<!doctype html><meta charset="utf-8"><title>새 경로 저장 기능 검증 · 격리 자료</title><body style="background:#171a18;color:white;font:16px sans-serif"><h1>새 경로 저장 기능 검증 · 격리 자료</h1><p>중립 V 아이콘만 사용하며 실제 WORK 이미지와 연결되지 않습니다.</p><button id="open" onclick="JO9WS.open([{path:\'content/pic/ui/neutral.png\',file:\'neutral.png\',folder:\'ui\',width:24,height:26}])">이미지 교체 열기</button><div id="catalogPicStatus"></div><script>window.JO9_CATALOG_BRIDGE={url:location.origin+\'/\',token:\'fixture\'};window.MR=\'fixture\';</script><script src="/catalog_pic.js"></script><script src="/catalog_editor.js"></script>';
const json=(res,v,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(v));};
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://127.0.0.1');res.setHeader('Cache-Control','no-store');
 if(u.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(html);}
 if(u.pathname==='/catalog_editor.js'){res.setHeader('Content-Type','text/javascript');return res.end(fs.readFileSync(tmp+'/catalog_editor.js'));}
 if(u.pathname==='/catalog_pic.js'){res.setHeader('Content-Type','text/javascript');return res.end(fs.readFileSync(seed+'/catalog_local_pic.js','utf8')+'\n'+fs.readFileSync(seed+'/catalog_pic.js','utf8'));}
 if(u.pathname==='/api/catalog-asset'){const p=u.searchParams.get('p').replace(/^content[\\/]pic[\\/]/,'').replaceAll('\\','/'),v=pic.file(p);if(v.missing)return json(res,v,404);res.setHeader('Content-Type','image/png');return res.end(Buffer.from(v.data,'base64'));}
 if(u.pathname.startsWith('/api/catalog/pic/')){if(req.headers['x-jo9-token']!=='fixture')return json(res,{error:'token'},403);let body='';for await(const c of req)body+=c;const b=body?JSON.parse(body):{},action=u.pathname.split('/').pop();
  if(action==='index')return json(res,{index:pic.scan(u.searchParams.has('rescan'))});
  if(action==='entries')return json(res,pic.entries(b.path));if(action==='file')return json(res,pic.file(b.path));if(action==='apply')return json(res,pic.apply(b.jobs));if(action==='revisions')return json(res,pic.revisions(b.paths));if(action==='restore')return json(res,pic.restore(b.id));
 }
 if(u.pathname==='/api/context')return json(res,{status:'waiting',updated:''});res.writeHead(404);res.end();
 }catch(e){json(res,{error:e.message},400);}});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:'+server.address().port+'/',home})));
