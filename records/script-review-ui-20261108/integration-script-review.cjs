'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),a=require('node:assert/strict');
const root='G:/somi/JO9sa/tools/text-workshop',record='G:/somi/JO9sa/records/script-review-ui-20261108',base='G:/Codex/tmp/script-review-ui-20261108';
const core=require(root+'/core.cjs'),scenes=require(root+'/scenes.cjs');
async function run(){
 const game=base+'/qa-game',runtime=base+'/qa-runtime';for(const p of [game+'/content/pic',runtime,base+'/qa-catalog',base+'/qa-original'])fs.mkdirSync(p,{recursive:true});
 const original=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp');fs.writeFileSync(game+'/jack.qsp',original);
 const child=spawn(process.execPath,[root+'/server.cjs','--game-dir',game,'--runtime',runtime,'--catalog-dir',base+'/qa-catalog','--original-dir',base+'/qa-original','--port','0'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',b=>stderr+=b);
 try{
  const state=await new Promise((resolve,reject)=>{let s='';child.stdout.on('data',b=>{s+=b;for(const line of s.split('\n'))try{const o=JSON.parse(line);if(o.url)resolve(o);}catch{}});child.on('exit',code=>reject(Error('Server exited '+code+' '+stderr)));setTimeout(()=>reject(Error('Server timeout '+stderr)),12000).unref();});
  const html=await (await fetch(state.url)).text(),match=html.match(/const token='([a-f0-9]+)'/);a(match,'token marker');const token=match[1];
  const post=async(url,input,ok=true)=>{const r=await fetch(state.url.slice(0,-1)+url,{method:'POST',headers:{'X-JO9-Token':token,'Content-Type':'application/json'},body:JSON.stringify(input)}),data=await r.json();if(ok)a(r.ok,JSON.stringify(data));else a(!r.ok);return data;};
  const doc=core.parse(original),analysis=scenes.analyse('interaction_city',core.shift(doc.lines[doc.locations.find(l=>l.name==='interaction_city').body],5)),scene=analysis.scenes.find(s=>s.condition==='interaction_city = 1311');a(scene);
  const exported=await post('/api/script',{hash:doc.hash,location:'interaction_city',sceneId:scene.id,options:{maxDepth:0,maxScenes:1,variants:false,edition:'man'}});
  const text=fs.readFileSync(record+'/USER_REVISION_GLORIA.txt','utf8').replace('dc59990424962453',exported.exportId);
  const reviewed=await post('/api/script/preview',{text});a.equal(reviewed.count,14);a(reviewed.checks.variables);a.equal(reviewed.checks.normalizedMarkers,15);
  const applied=await post('/api/apply',{id:reviewed.id,approved:true}),candidate=fs.readFileSync(game+'/jack.qsp');a(!candidate.equals(original));a.equal(core.parse(candidate).locations.length,doc.locations.length);
  const meta=JSON.parse(fs.readFileSync(runtime+'/backups/'+applied.id+'.json'));a.equal(meta.mod.edits.length,1);a.equal(meta.count,14);
  await post('/api/restore',{id:applied.id});a(fs.readFileSync(game+'/jack.qsp').equals(original));
  const again=await post('/api/script/preview',{text});const changed=core.parse(original);changed.lines[doc.locations.find(l=>l.name==='interaction_city').desc]=core.shift('외부 변경',-5);fs.writeFileSync(game+'/jack.qsp',core.serialize(changed));
  const stale=await post('/api/apply',{id:again.id,approved:true},false);a.match(stale.error,/변경|바뀌/);
  const result={isolated:true,pages:reviewed.count,syntaxChecks:reviewed.checks,actualApply:true,backupAndMod:true,restoreExact:true,staleApplyRejected:true};fs.writeFileSync(record+'/integration.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{child.kill();await new Promise(resolve=>child.on('close',resolve));}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
