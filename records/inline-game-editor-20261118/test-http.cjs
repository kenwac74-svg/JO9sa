'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
async function main(){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-inline-game-')),game=path.join(tmp,'game'),runtime=path.join(tmp,'runtime');fs.mkdirSync(game);
 const body="if event=1:\r\n$text[1]='본문입니다.'\r\n$text[1]+='<br><a href=\"EXEC:event=2 & gt ''event''\">선택입니다</a>'\r\nend",before=core.serialize({lines:['QSPGAME','','',core.shift('1',-5),core.shift('event',-5),'',core.shift(body,-5),core.shift('0',-5),'']}),file=path.join(game,'jack.qsp');fs.writeFileSync(file,before);
 const child=spawn(process.execPath,['G:/somi/JO9sa/tools/text-workshop/server.cjs','--game-dir',game,'--runtime',runtime,'--catalog-dir',path.join(tmp,'catalog'),'--original-dir',path.join(tmp,'original'),'--port','0'],{stdio:['ignore','pipe','pipe']});let error='';child.stderr.on('data',s=>error+=s);
 try{
  const state=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error(error||'fixture startup timeout')),15000);child.once('exit',()=>{clearTimeout(timer);reject(Error(error||'fixture exited'));});child.stdout.on('data',s=>{out+=s;if(out.includes('\n')){clearTimeout(timer);resolve(JSON.parse(out.trim()));}});});
  const html=await(await fetch(state.url)).text(),token=html.match(/const token='([a-f0-9]+)'/)[1],api=async(route,data)=>{const res=await fetch(state.url+route,{method:data?'POST':'GET',headers:{'X-JO9-Token':token,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return{status:res.status,value:await res.json()};};
  const search=await api('api/search?q='+encodeURIComponent('본문')),selection=search.value.results[0],opts=await api('api/choice-format/options',{selection}),choice=opts.value.choices[0].selection;
  const preview=await api('api/preview',{operation:'inline-page',selection,changes:[{selection,text:'<b>새 본문</b>'},{selection:choice,text:choice.text.replace('선택입니다','<font color="#008000">새 선택</font>')}]});assert.equal(preview.status,200);
  assert.equal((await api('api/apply',{id:preview.value.id,approved:false})).status,400);assert.ok(fs.readFileSync(file).equals(before));
  const applied=await api('api/apply',{id:preview.value.id,approved:true});assert.equal(applied.status,200);assert.equal(applied.value.selection.text,'<b>새 본문</b>');const after=core.parse(fs.readFileSync(file));assert.equal(applied.value.selection.hash,after.hash);assert.ok(core.shift(after.lines[6],5).includes('event=2'));
  const restored=await api('api/restore',{id:applied.value.id});assert.equal(restored.status,200);assert.ok(fs.readFileSync(file).equals(before));
  console.log('PASS isolated HTTP preview, approval, combined apply, updated selection and exact restore');
 }finally{if(child.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}const resolved=fs.realpathSync(tmp),base=fs.realpathSync(os.tmpdir());if(!resolved.startsWith(base+path.sep))throw Error('Unsafe fixture cleanup');fs.rmSync(resolved,{recursive:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
