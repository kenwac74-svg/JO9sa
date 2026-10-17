'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {createStore,atomicWrite,failure}=require('./store.cjs');
const {readIcon}=require('./assets.cjs');
const MAX_BODY=256*1024;
function createServer({targets,runtime}){
  const store=createStore({targets,runtime}),token=crypto.randomBytes(24).toString('hex');
  function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
  async function body(req){if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw failure('JSON 요청만 지원합니다.',415);const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>MAX_BODY)throw failure('요청이 너무 큽니다.',413);chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw failure('JSON 형식이 올바르지 않습니다.');}}
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    try{
      const port=server.address()?.port,allowed=['127.0.0.1:'+port,'localhost:'+port];
      if(!allowed.includes(req.headers.host))throw failure('허용되지 않은 Host입니다.',403);
      if(req.headers.origin&&!allowed.some(h=>req.headers.origin==='http://'+h))throw failure('허용되지 않은 Origin입니다.',403);
      const url=new URL(req.url,'http://127.0.0.1:'+port);
      if(req.method==='GET'&&url.pathname==='/'){const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8').replaceAll('__JO9_TOKEN__',token);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(html);}
      const staticFiles={'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
      if(req.method==='GET'&&staticFiles[url.pathname]){const[file,type]=staticFiles[url.pathname];res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,file)));}
      if(!url.pathname.startsWith('/api/'))throw failure('화면을 찾을 수 없습니다.',404);
      if(req.headers['x-jo9-token']!==token)throw failure('세션이 만료되었습니다. 편집기를 새로고침해 주세요.',403);
      if(req.method==='GET'&&url.pathname==='/api/state')return json(res,200,store.snapshot(url.searchParams.get('target')||targets[0].id));
      if(req.method==='GET'&&url.pathname==='/api/project')return json(res,200,store.loadProject());
      if(req.method==='GET'&&url.pathname==='/api/export'){res.setHeader('Content-Disposition','attachment; filename="jo9-state-patch.json"');return json(res,200,store.exportPatch(url.searchParams.get('id')));}
      if(req.method==='GET'&&url.pathname==='/api/icon'){
        const target=targets.find(t=>t.id===url.searchParams.get('target'));if(!target)throw failure('등록되지 않은 대상입니다.');
        const icon=readIcon(target,url.searchParams.get('path')||'');
        res.writeHead(200,{'Content-Type':icon.type,'Cache-Control':'no-store'});return res.end(icon.raw);
      }
      const posts={'/api/preview':store.preview,'/api/cache-preview':input=>store.preview({...input,refreshCache:true}),'/api/apply':store.apply,'/api/restore':store.restore,'/api/project':store.saveProject};
      if(req.method==='POST'&&posts[url.pathname])return json(res,200,posts[url.pathname](await body(req)));
      throw failure('요청을 찾을 수 없습니다.',404);
    }catch(error){if(!res.headersSent)json(res,error.status||(/충돌|변경|hash/i.test(error.message)?409:400),{error:error.message});else res.end();}
  });
  return{server,token};
}
function arg(name){const at=process.argv.indexOf(name);return at<0?undefined:process.argv[at+1];}
// JO9 MOD START [state-editor-portable-launch-20261018]
function defaultTargets(){
  const configPath=path.resolve(__dirname,'../../local.config.json');
  if(fs.existsSync(configPath)){
    const config=JSON.parse(fs.readFileSync(configPath,'utf8').replace(/^\uFEFF/,'')),work=path.resolve(config.GameQsp);
    return[{id:'work',label:'플레이',path:work},{id:'full',label:'배포',path:path.resolve(path.dirname(config.GameRoot),'Jack O Nine Tails v2.4 Kor_Full','game','jack.qsp')}];
  }
  const qsp=path.resolve(__dirname,'../../jack.qsp');
  if(!fs.existsSync(qsp)||!fs.statSync(qsp).isFile())throw failure('local.config.json 또는 이 게임의 jack.qsp가 필요합니다. --targets로 대상 JSON을 지정하세요.');
  return[{id:'work',label:'현재 게임',path:qsp}];
}
// JO9 MOD END [state-editor-portable-launch-20261018]
if(require.main===module){
  const configPath=arg('--targets'),parsed=configPath?JSON.parse(fs.readFileSync(path.resolve(configPath),'utf8')):null,targets=parsed?(Array.isArray(parsed)?parsed:parsed.targets):defaultTargets();
  const runtime=path.resolve(arg('--runtime')||path.join(__dirname,'runtime')),port=Number(arg('--port')||0);
  if(!Number.isInteger(port)||port<0||port>65535)throw failure('포트 설정이 올바르지 않습니다.');
  const{server}=createServer({targets,runtime});server.listen(port,'127.0.0.1',()=>{const state={pid:process.pid,url:'http://127.0.0.1:'+server.address().port+'/',targets:targets.map(t=>({id:t.id,label:t.label,path:t.path})),startedAt:new Date().toISOString()};atomicWrite(path.join(runtime,'server.json'),JSON.stringify(state,null,2)+'\n');process.stdout.write('JO9 State Editor '+state.url+'\n');});
}
module.exports={createServer};
