import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import {spawn,execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const HERE=path.dirname(fileURLToPath(import.meta.url)),exec=promisify(execFile);
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
export function buildId(){return digest(Buffer.concat(['hub-server.mjs','hub-client.js','remake.mjs','worksheet.html'].map(n=>fs.readFileSync(path.join(HERE,n))))).slice(0,16);}
export function publicSettings(c){const targetId=String(c.target?.id??'');return {sourceFolder:c.sourceFolder||'',sourceId:String(c.sourceId??''),targetId,mageMention:c.target?.mageMention||'',model:c.openrouter?.model||'',configured:!!(c.sourceFolder&&targetId)};}
export async function mergeSettings(previous,values){
 const folder=String(values.sourceFolder||'').trim();
 if(!folder||!(await fsp.stat(folder)).isDirectory())throw Error('존재하는 원본 이미지 폴더를 선택하세요.');
 const valid=s=>s&&!/[<>:"/\\|?*\x00-\x1f]/.test(s)&&s!=='.'&&s!=='..'&&s.length<=100;
 const sourceId=String(values.sourceId||path.basename(folder)).trim(),targetId=String(values.targetId||'').trim();
 if(!valid(sourceId)||!valid(targetId))throw Error('원본·대상 식별자를 입력하세요. 파일명에 쓸 수 없는 문자와 경로 구분자는 사용할 수 없습니다.');
 return {...previous,sourceFolder:path.resolve(folder),sourceId,target:{...previous.target,id:targetId,mageMention:String(values.mageMention||'').trim()},openrouter:{...previous.openrouter,model:String(values.model||previous.openrouter?.model||'').trim()}};
}
async function reservePort(){const s=http.createServer();await new Promise((ok,no)=>{s.once('error',no);s.listen(0,'127.0.0.1',ok);});const p=s.address().port;await new Promise(ok=>s.close(ok));return p;}
const settingsMarkup=`<details id="remakeSettings" class="remake-settings"><summary>프로젝트 설정 <span id="remakeProjectLabel"></span></summary><form id="remakeSetup"><label class="remake-folder">원본 이미지 폴더<div class="remake-path"><input id="remakeFolder" required placeholder="이미지가 있는 폴더"><button type="button" id="remakePick">폴더 선택</button></div></label><div class="remake-fields"><label>원본 식별자<input id="remakeSource" placeholder="파일명 앞의 번호·이름"></label><label>대상 식별자<input id="remakeTarget" required placeholder="새 파일명 앞의 번호·이름"></label><label>Mage 캐릭터 핸들<input id="remakeMention" placeholder="@캐릭터"></label><label>해석 모델<input id="remakeModel" placeholder="OpenRouter 모델 ID"></label></div><div class="remake-actions"><button class="pri primary" id="remakeApply">설정 적용·작업표 열기</button><button type="button" id="remakeReload">작업표 다시 읽기</button><span id="remakeMessage" role="status"></span></div><p class="remake-hint">기존 해석 결과와 샘플 라이브러리를 불러옵니다. 원본 해석 명령과 API 설정은 <a href="/hub-readme" target="_blank" rel="noopener">원본 도구 사용법</a>에서 확인할 수 있습니다.</p></form></details>`;
const extraCss=`
.remake-settings{margin:0 0 12px;padding:12px 14px;background:var(--p,#1c1f22);color:var(--t,#e9e9e5);border:1px solid var(--l,#30353a);border-radius:9px;font:13px/1.6 system-ui,sans-serif}.remake-settings summary{cursor:pointer;font-weight:600}.remake-settings summary span{font-size:11px;color:#969c9f;font-weight:400;margin-left:10px}.remake-settings label{display:block;font-size:12px;color:#969c9f}.remake-settings input{display:block;width:100%;min-width:0;padding:8px 10px;box-sizing:border-box;background:#131517;color:#e9e9e5;border:1px solid #30353a;border-radius:6px;font:13px inherit}.remake-folder{margin-top:10px}.remake-path{display:flex;gap:8px}.remake-path input{flex:1}.remake-fields{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:10px 0}.remake-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.remake-hint{font-size:11px;color:#969c9f;margin:9px 0 0}.remake-empty{padding:30px 14px;font:13px system-ui;color:#969c9f}
html.jo9-embedded.jo9-tool-prompts{--p:#1c1f22;--p2:#22262a;--l:#30353a;--t:#e9e9e5;--m:#969c9f;--a:#dbb06e;--b:#9baed0;--r:#df9e91;--g:#96bea4;--in:#131517;--w:#df9e91}html.jo9-embedded.jo9-tool-prompts h1{display:none}html.jo9-embedded.jo9-tool-prompts header{padding:0 0 10px}html.jo9-embedded.jo9-tool-prompts main{padding:10px 0}html.jo9-embedded.jo9-tool-prompts button.on,html.jo9-embedded.jo9-tool-prompts button.pri{background:#dbb06e!important;color:#131517!important;border-color:#dbb06e!important}html.jo9-embedded.jo9-tool-prompts .c{background:#1c1f22;border-color:#30353a}
@media(max-width:850px){.remake-fields{grid-template-columns:1fr 1fr}}@media(max-width:500px){.remake-fields{grid-template-columns:1fr}}
`;

export async function startService(options={}){
 const configFile=path.resolve(options.configFile||path.join(HERE,'config.json')),runtime=path.resolve(options.runtime||path.join(HERE,'runtime')),readyFile=options.readyFile||path.join(runtime,'server.json');
 await fsp.mkdir(runtime,{recursive:true});
 if(!fs.existsSync(configFile)){
  const initial=JSON.parse(await fsp.readFile(path.join(HERE,'config.example.json'),'utf8'));
  initial.sourceFolder='';initial.sourceId='';initial.target={...initial.target,id:'',mageMention:'',tags:'',prose:'',trigger:'',referenceImage:''};
  await fsp.writeFile(configFile,JSON.stringify(initial,null,2)+'\n',{flag:'wx'});
 }
 const readConfig=async()=>JSON.parse((await fsp.readFile(configFile,'utf8')).replace(/^\uFEFF/,''));
 let worker=null,workerPort=null,workerPending=null,baseUrl='',closed=false;
 const writeReady=async()=>fsp.writeFile(readyFile,JSON.stringify({app:'jont-remake-hub',pid:process.pid,url:baseUrl,build:buildId(),configFile,nativePid:worker?.pid||null},null,2));
 async function stopWorker(){if(worker?.pid&&worker.exitCode===null&&worker.signalCode===null){const p=worker;const done=new Promise(ok=>p.once('exit',ok));p.kill();await done;}worker=null;workerPort=null;}
 async function startWorker(){
  if(worker&&worker.exitCode===null&&worker.signalCode===null&&workerPort)return;
  if(workerPending)return workerPending;
  workerPending=(async()=>{
   const c=await readConfig();if(!publicSettings(c).configured)throw Error('프로젝트 설정에서 원본 폴더와 대상 식별자를 지정하세요.');
   const port=await reservePort();
   const child=spawn(process.execPath,[path.join(HERE,'remake.mjs'),'serve','--config',configFile,'--port',String(port)],{cwd:HERE,windowsHide:true,stdio:['ignore','pipe','pipe']});
   let spawnError=null;child.once('error',e=>{spawnError=e;});
   child.stdout.pipe(fs.createWriteStream(path.join(runtime,'native.stdout.log'),{flags:'a'}));child.stderr.pipe(fs.createWriteStream(path.join(runtime,'native.stderr.log'),{flags:'a'}));
   worker=child;
   for(let i=0;i<80;i++){
    if(spawnError||child.exitCode!==null)break;
    try{const h=await fetch(`http://127.0.0.1:${port}/api/library`,{signal:AbortSignal.timeout(500)});if(h.ok){workerPort=port;await writeReady();return;}}catch{}
    await new Promise(ok=>setTimeout(ok,100));
   }
   await stopWorker();throw Error('작업표 서버를 열지 못했습니다. runtime/native.stderr.log를 확인하세요.');
  })().finally(()=>{workerPending=null;});return workerPending;
 }
 const readBody=async req=>{let data='',n=0;for await(const b of req){n+=b.length;if(n>1000000)throw Error('설정 요청이 너무 큽니다.');data+=b;}return JSON.parse(data||'{}');};
 const send=(res,code,value,type='application/json; charset=utf-8')=>{res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(type.startsWith('application/json')?JSON.stringify(value):value);};
 function decorate(html,configured){
  const head=`<link rel="stylesheet" href="/hub.css"><script>if(new URLSearchParams(location.search).get('workspace')==='1')document.documentElement.classList.add('jo9-embedded','jo9-tool-prompts');</script><script src="/hub-client.js" defer></script>`;
  html=html.replace(/<\/head>/i,head+'</head>');return html.replace(/<body[^>]*>/i,m=>m+settingsMarkup+(configured?'':'<p class="remake-empty">프로젝트를 선택하면 장면·샘플 작업표가 열립니다.</p>'));
 }
 const server=http.createServer(async(req,res)=>{
  try{
   if(req.headers.host!==new URL(baseUrl).host)return send(res,403,{error:'허용되지 않은 접속 주소입니다.'});
   if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!==baseUrl.slice(0,-1))return send(res,403,{error:'다른 사이트의 변경 요청은 받지 않습니다.'});
   const url=new URL(req.url,baseUrl);
   if(req.method==='GET'&&url.pathname==='/api/hub/status')return send(res,200,{app:'jont-remake-hub',pid:process.pid,build:buildId(),nativePid:worker?.pid||null});
   if(req.method==='GET'&&url.pathname==='/api/hub/settings')return send(res,200,publicSettings(await readConfig()));
   if(req.method==='POST'&&url.pathname==='/api/hub/settings'){
    const next=await mergeSettings(await readConfig(),await readBody(req));
    if(workerPending)await workerPending;
    await stopWorker();const temp=configFile+'.tmp';await fsp.writeFile(temp,JSON.stringify(next,null,2)+'\n');await fsp.rename(temp,configFile);
    await startWorker();return send(res,200,{ok:true,...publicSettings(next)});
   }
   if(req.method==='POST'&&url.pathname==='/api/hub/folder'){
    const {initial}=await readBody(req),picker=path.resolve(HERE,'../image-folder-review/folder_review/picker.py');
    const {stdout}=await exec('py',['-3','-X','utf8',picker,String(initial||'')],{windowsHide:true,maxBuffer:1000000});return send(res,200,JSON.parse(stdout.replace(/^\uFEFF/,'')));
   }
   if(req.method==='POST'&&url.pathname==='/api/hub/reload'){
    if(workerPending)await workerPending;await stopWorker();
    if(publicSettings(await readConfig()).configured)await startWorker();
    return send(res,200,{ok:true});
   }
   if(req.method==='GET'&&url.pathname==='/hub-client.js')return send(res,200,await fsp.readFile(path.join(HERE,'hub-client.js'),'utf8'),'text/javascript; charset=utf-8');
   if(req.method==='GET'&&url.pathname==='/hub.css'){
    const common=await fsp.readFile(path.resolve(HERE,'../modding-hub/embedded-tools.css'),'utf8');return send(res,200,common+extraCss,'text/css; charset=utf-8');
   }
   if(req.method==='GET'&&url.pathname==='/hub-readme')return send(res,200,await fsp.readFile(path.join(HERE,'README.md'),'utf8'),'text/plain; charset=utf-8');
   if(req.method==='GET'&&url.pathname==='/'){
    const c=await readConfig(),configured=publicSettings(c).configured;
    if(!configured)return send(res,200,decorate('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JoNT 장면 프롬프트</title></head><body></body></html>',false),'text/html; charset=utf-8');
    await startWorker();const upstream=await fetch(`http://127.0.0.1:${workerPort}/`);return send(res,upstream.status,decorate(await upstream.text(),true),'text/html; charset=utf-8');
   }
   if(url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/api/hub/')){
    await startWorker();const proxy=http.request({host:'127.0.0.1',port:workerPort,path:req.url,method:req.method,headers:{...req.headers,host:`127.0.0.1:${workerPort}`}},up=>{res.writeHead(up.statusCode,up.headers);up.pipe(res);});
    proxy.on('error',()=>{if(!res.headersSent)send(res,502,{error:'작업표 서버 연결을 확인하세요.'});else res.end();});req.pipe(proxy);return;
   }
   send(res,404,{error:'not found'});
  }catch(error){send(res,400,{error:error.message});}
 });
 const wanted=options.port??8790,ports=wanted===0?[0]:Array.from({length:20},(_,i)=>wanted+i);
 let port;
 for(const candidate of ports){try{await new Promise((ok,no)=>{const fail=e=>{server.removeListener('listening',ok);no(e);};server.once('error',fail);server.once('listening',()=>{server.removeListener('error',fail);ok();});server.listen(candidate,'127.0.0.1');});port=server.address().port;break;}catch(e){server.removeAllListeners('listening');if(!['EADDRINUSE','EACCES'].includes(e.code))throw e;}}
 if(!port)throw Error('장면 프롬프트 도구의 빈 포트를 찾지 못했습니다.');
 baseUrl=`http://127.0.0.1:${port}/`;await writeReady();
 async function close(){if(closed)return;closed=true;if(workerPending)await workerPending.catch(()=>{});await stopWorker();await new Promise(ok=>server.close(ok));try{await fsp.unlink(readyFile);}catch{}}
 return {server,url:baseUrl,configFile,readyFile,close};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),opt=(n,d)=>{const i=args.indexOf('--'+n);return i<0?d:args[i+1];};
 const service=await startService({port:Number(opt('port',8790)),configFile:opt('config',undefined),runtime:opt('runtime',undefined),readyFile:opt('ready',undefined)});
 process.on('SIGINT',()=>service.close().then(()=>process.exit()));process.on('SIGTERM',()=>service.close().then(()=>process.exit()));
 console.log(service.url);
}
