'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const core=require('./text-workshop/core.cjs'),scenes=require('./text-workshop/scenes.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'tmp/dialogue-pages-real-test'),game=path.join(dir,'game'),runtime=path.join(dir,'runtime'),tool=path.join(dir,'tools');
for(const p of [game,runtime,tool,path.join(game,'content/pic')])fs.mkdirSync(p,{recursive:true});
const original=fs.readFileSync('C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game/jack.qsp'),before=core.hash(original);fs.writeFileSync(path.join(game,'jack.qsp'),original);
const canonical='C:/Users/Ken Choung/Documents/Codex/2026-10-06/task/JO9sa/tools/text-workshop';
for(const name of fs.readdirSync(canonical))if(/\.(?:cjs|html|js|json)$/.test(name))fs.copyFileSync(path.join(canonical,name),path.join(tool,name));
for(const name of ['addition.cjs','addition-pages.cjs','server.cjs','index.html'])fs.copyFileSync(path.join(__dirname,'text-workshop',name),path.join(tool,name));
const child=spawn(process.execPath,[path.join(tool,'server.cjs'),'--game-dir',game,'--runtime',runtime,'--catalog-dir',path.join(dir,'catalog'),'--port','3832'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
let out='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>out+=b);
async function start(){for(let i=0;i<80;i++){if(out.includes('"url"'))return;if(child.exitCode!==null)throw Error(out);await new Promise(r=>setTimeout(r,100));}throw Error('시험 서버 시작 실패: '+out);}
function route(doc){const loc=doc.locations.find(x=>x.name==='interaction_city'),body=core.shift(doc.lines[loc.body],5),a=scenes.analyse(loc.name,body),r=a.scenes.find(x=>x.condition==='interaction_city = 100181');assert(r);return body.slice(r.start,r.end);}
let savedReport;
(async()=>{
 await start();const base='http://127.0.0.1:3832',html=await(await fetch(base)).text(),token=html.match(/const token='([^']+)'/)[1];
 async function api(url,data){const r=await fetch(base+url,{method:data?'POST':'GET',headers:{'X-JO9-Token':token,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});const j=await r.json();assert(r.ok,JSON.stringify(j));return j;}
 const search=await api('/api/search?q='+encodeURIComponent('여자들은 성실하게'));
 const selected=search.results.find(x=>x.location==='interaction_city');assert(selected);assert.equal(search.hash,before);
 const p=await api('/api/preview',{operation:'add',additionMode:'page',selection:selected,addition:'중간 페이지 기능 검증용 대사'});
 assert.equal(p.page,3);assert(p.adjustments.some(x=>x.includes('실행 처리')));assert(p.adjustments.some(x=>x.includes('전체 페이지 수')));
 const applied=await api('/api/apply',{id:p.id,approved:true});assert(applied.selection);assert.equal(applied.selection.text,selected.text);
 const after=core.parse(fs.readFileSync(path.join(game,'jack.qsp'))),newRoute=route(after),oldRoute=route(core.parse(original));
 assert(newRoute.includes('txt_count = 4'));assert(newRoute.includes('$special_action[4]'));assert(!newRoute.includes('$special_action[3]'));
 assert(newRoute.includes('$special_image[3] = $special_image[2]'));assert(newRoute.includes('$special_image_full[3] = $special_image_full[2]'));
 assert(newRoute.includes('$text[3] = "중간 페이지 기능 검증용 대사"'));assert(newRoute.includes('$text[4] = "  너는 다음 날'));
 assert.equal(newRoute.split('master_vampire = 1').length,oldRoute.split('master_vampire = 1').length);assert(newRoute.includes("$return_lock  = 'next_day'"));
 const originalDoc=core.parse(original);after.lines.forEach((s,i)=>{if(i!==selected.fieldIndex)assert.equal(s,originalDoc.lines[i]);});
 const mod=await api('/api/export?id='+applied.id);assert.equal(originalDoc.lines.length,after.lines.length);assert.equal(mod.edits.length,1);
 const loc=originalDoc.locations.find(x=>x.name==='interaction_city'),oldField=core.shift(originalDoc.lines[loc.body],5);assert.equal(oldField.replace(mod.edits[0].old,mod.edits[0].new),core.shift(after.lines[loc.body],5));
 await api('/api/restore',{id:applied.id});assert(fs.readFileSync(path.join(game,'jack.qsp')).equals(original));
 assert.equal(core.hash(fs.readFileSync('C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game/jack.qsp')),before);
 savedReport={passed:true,gameQspUntouched:before,insertedPage:p.page,adjustments:p.adjustments,checks:['real event 100181 insert','native page count 3 to 4','home action 3 to 4','image inheritance','effects not duplicated','all other QSP fields unchanged','export reconstructs exact edit','exact-byte restore']};
 fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(savedReport,null,2));console.log(JSON.stringify(savedReport,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(()=>child.kill());
