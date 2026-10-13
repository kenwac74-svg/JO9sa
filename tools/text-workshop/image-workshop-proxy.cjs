'use strict';
// Same-origin iframe keeps the existing browser folder picker usable. Target is
// always this game's registered loopback image server, never a client URL.
const http=require('node:http');
const paths=new Set(['/','/api/context','/api/asset','/api/open-path','/api/status']);
function rewrite(html,token,origin){
 return html.replace(/(['"])\/api\/(context|asset|open-path|status)(\?[^'"\r\n]*)?\1/g,(all,q,name,query)=>q+'/workshop-image/api/'+name+'?workshop_token='+token+(query?'&'+query.slice(1):'')+q).replaceAll('http://127.0.0.1:3813',origin).replace("headers:{'Content-Type':'text/plain;charset=UTF-8'}","headers:{'Content-Type':'text/plain;charset=UTF-8','X-JO9-Token':"+JSON.stringify(token)+"}").replace(/<\/head>/i,'<script>window.JO9_CATALOG_BRIDGE='+JSON.stringify({url:origin+'/',token})+';</script></head>');
}
function request(registration,route){return new Promise((resolve,reject)=>{
 if(!registration||!/^http:\/\/127\.0\.0\.1:\d+\/$/.test(registration.url))return reject(Error('이미지 서버 연결을 기다립니다.'));
 const u=new URL(route,registration.url);if(u.origin!==new URL(registration.url).origin)return reject(Error('잘못된 이미지 경로입니다.'));
 const req=http.get(u,res=>{const chunks=[];let bytes=0;res.on('data',b=>{bytes+=b.length;if(bytes>64*1024*1024){res.destroy(Error('이미지 응답이 너무 큽니다.'));return;}chunks.push(b);});res.on('error',reject);res.on('end',()=>resolve({status:res.statusCode,type:res.headers['content-type']||'application/octet-stream',body:Buffer.concat(chunks)}));});req.setTimeout(5000,()=>req.destroy(Error('이미지 서버 응답을 기다리지 못했습니다.')));req.on('error',reject);
});}
async function serve(req,res,url,registration,token,origin){
 const route=url.pathname.slice('/workshop-image'.length);
 if(req.method!=='GET'||!paths.has(route)||url.searchParams.get('workshop_token')!==token||(req.headers.origin&&req.headers.origin!==origin)){res.writeHead(403);res.end();return;}
 try{
  const status=await request(registration,'/api/status');const ready=JSON.parse(status.body.toString('utf8'));if(!ready.alive||ready.pid!==registration.pid)throw Error('등록된 이미지 서버가 아닙니다.');
  const query=new URLSearchParams(url.searchParams);query.delete('workshop_token');const response=await request(registration,route+(query.size?'?'+query:''));let body=response.body;
  if(route==='/'&&response.status===200)body=Buffer.from(rewrite(body.toString('utf8'),token,origin));
  res.writeHead(response.status,{'Content-Type':response.type,'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; object-src 'none'; form-action 'self'"});res.end(body);
 }catch(e){res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end(e.message);}
}
module.exports={serve,rewrite};
