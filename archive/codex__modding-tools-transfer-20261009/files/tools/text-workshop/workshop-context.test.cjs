'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),crypto=require('crypto');
const modulePath='./workshop-context.cjs';
const {create,forCandidate}=require(modulePath);
const entry={text:'[상인]<br>이 거래 조건은 이전과 같습니다.',dialogue:true,location:'event',fieldIndex:2,start:0,line:1,hash:'qsp'};
const navigator={context:e=>({selection:e,scene:{id:'event-1',title:'상점'},images:[]})};
function fixture(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-workshop-test-')),runtime=path.join(dir,'modtools','runtime');fs.mkdirSync(runtime,{recursive:true});return {dir,runtime,api:create(dir)};}
const html='<div id="text">[상인]<br>이 거래 조건은 이전과 같습니다.</div><img src="content/pic/characters/Sulta (2).png">';
function save(f,sha=crypto.createHash('sha256').update(html).digest('hex')){fs.writeFileSync(path.join(f.runtime,'show-html.html'),html);fs.writeFileSync(path.join(f.runtime,'context.json'),JSON.stringify({status:'ok',updated:'test',showHtmlSha256:sha}));}
test('old or concurrently written SHOW HTML cannot select a stale event',()=>{const f=fixture();try{save(f,'mismatch');assert.equal(f.api.state({hash:'qsp'},[entry],navigator).status,'snapshot_required');save(f);assert.equal(f.api.state({hash:'qsp'},[entry],navigator).status,'ok');}finally{fs.rmSync(f.dir,{recursive:true});}});
test('same verified snapshot supplies actual numbered image, and stale selection is rejected',()=>{const f=fixture();try{save(f);const s=f.api.state({hash:'qsp'},[entry],navigator),c=s.candidates[0];const input={...c,liveSnapshotId:s.id};const result=forCandidate(s,input,{images:[{path:'characters/wrong.png'}]});assert.equal(result.images[0].path,'characters/Sulta (2).png');assert.throws(()=>forCandidate(s,{...input,liveSnapshotId:'old'},{}));assert.throws(()=>forCandidate(s,{...input,selection:{...c.selection,start:99}},{}));}finally{fs.rmSync(f.dir,{recursive:true});}});
test('port registration is restricted to a registered loopback server',()=>{const f=fixture();try{fs.writeFileSync(path.join(f.runtime,'port.txt'),'5270');fs.writeFileSync(path.join(f.runtime,'server.pid'),'123');assert.equal(f.api.registration().url,'http://127.0.0.1:5270/');fs.writeFileSync(path.join(f.runtime,'port.txt'),'https://outside.example');assert.equal(f.api.registration(),null);}finally{fs.rmSync(f.dir,{recursive:true});}});
