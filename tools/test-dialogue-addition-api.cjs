'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),core=require('./text-workshop/core.cjs');
(async()=>{
 const base='http://127.0.0.1:3831',html=await(await fetch(base)).text(),token=html.match(/const token='([^']+)'/)[1];
 async function api(route,data){const r=await fetch(base+route,{method:data?'POST':'GET',headers:{'X-JO9-Token':token,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});const j=await r.json();assert(r.ok,JSON.stringify(j));return j;}
 const history=await api('/api/history'),last=history.find(x=>x.status==='applied');assert(last);
 const mod=await api('/api/export?id='+last.id);assert(JSON.stringify(mod).includes('새로 추가한 대사입니다.'));
 const restored=await api('/api/restore',{id:last.id});
 let search=await api('/api/search?q='+encodeURIComponent('첫 대사'));
 assert.equal(search.hash,last.before);assert.equal((await api('/api/search?q='+encodeURIComponent('새로 추가한 대사입니다.'))).total,0);
 for(const mode of ['page','paragraph']){
  const preview=await api('/api/preview',{operation:'add',additionMode:mode,selection:search.results[0],addition:'API 추가 시험'});
  await api('/api/apply',{id:preview.id,approved:true});
  assert.equal((await api('/api/search?q='+encodeURIComponent('API 추가 시험'))).total,1);
  const h=await api('/api/history');await api('/api/restore',{id:h.find(x=>x.status==='applied').id});
  search=await api('/api/search?q='+encodeURIComponent('첫 대사'));assert.equal(search.hash,last.before);
 }
 console.log('PASS: native page and paragraph API apply, backup, export, exact-byte restore');
})().catch(e=>{console.error(e);process.exitCode=1;});
