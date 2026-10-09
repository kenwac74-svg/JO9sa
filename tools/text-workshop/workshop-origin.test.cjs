'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {create}=require('./workshop-origin.cjs');
function fixture(t){
 const parent=path.resolve(process.cwd(),'.tmp');fs.mkdirSync(parent,{recursive:true});
 const game=fs.mkdtempSync(path.join(parent,'workshop-origin-')),runtime=path.join(game,'modtools','runtime');fs.mkdirSync(runtime,{recursive:true});
 t.after(()=>{assert.equal(path.dirname(path.resolve(game)),parent);fs.rmSync(game,{recursive:true,force:true});});
 const register=(port,pid=process.pid)=>{fs.writeFileSync(path.join(runtime,'port.txt'),String(port));fs.writeFileSync(path.join(runtime,'server.pid'),String(pid));};
 return {game,runtime,register};
}
async function server(t,reply){
 let calls=0;const instance=http.createServer((req,res)=>{calls++;assert.equal(req.url,'/api/status');reply(req,res,instance.address().port);});
 await new Promise(resolve=>instance.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{instance.closeAllConnections();await new Promise(resolve=>instance.close(resolve));});
 return {port:instance.address().port,get calls(){return calls;}};
}
test('fixed port remains compatible; other hosts and unregistered ports never gain access',async t=>{
 const f=fixture(t),allow=create(f.game);
 assert.equal(await allow('http://127.0.0.1:5269'),true);
 for(const origin of [null,'null','https://127.0.0.1:5269','http://localhost:5269','http://127.0.0.2:5269','http://127.0.0.1:5269/','http://127.0.0.1:05269','http://127.0.0.1:12770','https://evil.example'])assert.equal(await allow(origin),false,origin);
});
test('registered live workshop is allowed, cached briefly, and rechecked after registration changes',async t=>{
 const f=fixture(t),s=await server(t,(req,res,port)=>res.end(JSON.stringify({alive:true,pid:process.pid,port})));f.register(s.port);
 const allow=create(f.game),origin='http://127.0.0.1:'+s.port;
 assert.equal(await allow(origin),true);assert.equal(await allow(origin),true);assert.equal(s.calls,1);
 f.register(s.port,process.pid+1);assert.equal(await allow(origin),false);assert.equal(s.calls,2);
 f.register(s.port);assert.equal(await allow(origin),true);assert.equal(s.calls,3);
 f.register(1);assert.equal(await allow(origin),false);assert.equal(s.calls,3);
});
test('runtime registration requires regular bounded numeric files and valid ranges',async t=>{
 const f=fixture(t),allow=create(f.game),origin='http://127.0.0.1:12770';
 for(const [port,pid] of [['12770x','42'],['0','42'],['65536','42'],['12770','0'],['12770','4294967296'],['12770','-1'],['12770','9'.repeat(65)]]){
  f.register(port,pid);assert.equal(await allow(origin),false);
 }
 f.register(12770);fs.rmSync(path.join(f.runtime,'port.txt'));fs.mkdirSync(path.join(f.runtime,'port.txt'));assert.equal(await allow(origin),false);
});
test('a positive health result expires in less than two seconds',async t=>{
 const f=fixture(t);let active=true;
 const s=await server(t,(req,res,port)=>res.end(JSON.stringify({alive:active,pid:process.pid,port})));f.register(s.port);
 const allow=create(f.game),origin='http://127.0.0.1:'+s.port;assert.equal(await allow(origin),true);active=false;
 await new Promise(resolve=>setTimeout(resolve,1600));assert.equal(await allow(origin),false);assert.equal(s.calls,2);
});
test('symlinked runtime directory is rejected',async t=>{
 const f=fixture(t),other=path.join(f.game,'other');fs.renameSync(f.runtime,other);
 try{fs.symlinkSync(other,f.runtime,process.platform==='win32'?'junction':'dir');}catch(e){if(e.code==='EPERM'||e.code==='EACCES'){t.skip('Directory symlinks are unavailable on this host');return;}throw e;}
 fs.writeFileSync(path.join(other,'port.txt'),'12770');fs.writeFileSync(path.join(other,'server.pid'),String(process.pid));
 assert.equal(await create(f.game)('http://127.0.0.1:12770'),false);
});
test('symlinked registration file is rejected',async t=>{
 const f=fixture(t);f.register(12770);const original=path.join(f.runtime,'port.txt'),other=path.join(f.game,'linked-port.txt');fs.renameSync(original,other);
 try{fs.symlinkSync(other,original,'file');}catch(e){if(e.code==='EPERM'||e.code==='EACCES'){t.skip('File symlinks are unavailable on this Windows host');return;}throw e;}
 assert.equal(await create(f.game)('http://127.0.0.1:12770'),false);
});
test('stale or incompatible service identities are rejected',async t=>{
 const f=fixture(t);let reply;
 const s=await server(t,(req,res,port)=>res.end(typeof reply==='function'?JSON.stringify(reply(port)):reply));
 for(const value of [port=>({alive:false,pid:process.pid,port}),port=>({alive:true,pid:process.pid+1,port}),port=>({alive:true,pid:process.pid,port:port+1}),port=>({alive:true,pid:String(process.pid),port}),'not json']){
  reply=value;f.register(s.port);assert.equal(await create(f.game)('http://127.0.0.1:'+s.port),false);
 }
});
test('redirects are not followed and oversized status bodies are rejected',async t=>{
 const f=fixture(t);let redirect=true;
 const s=await server(t,(req,res)=>{if(redirect){res.writeHead(302,{Location:'https://evil.example'});res.end();}else res.end(' '.repeat(5000));});f.register(s.port);
 assert.equal(await create(f.game)('http://127.0.0.1:'+s.port),false);redirect=false;
 assert.equal(await create(f.game)('http://127.0.0.1:'+s.port),false);
});
test('a registration changed during the status probe cannot authorize the old origin',async t=>{
 const f=fixture(t),s=await server(t,(req,res,port)=>{f.register(port,process.pid+1);res.end(JSON.stringify({alive:true,pid:process.pid,port}));});f.register(s.port);
 assert.equal(await create(f.game)('http://127.0.0.1:'+s.port),false);
});
test('unresponsive service times out within two seconds',async t=>{
 const f=fixture(t),s=await server(t,()=>{});f.register(s.port);const start=Date.now();
 assert.equal(await create(f.game)('http://127.0.0.1:'+s.port),false);assert.ok(Date.now()-start<2100);
});
