'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');
console.log=()=>{};
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'installed.json'),'utf8')),raw=fs.readFileSync(manifest.output),save=codec.parse(raw);assert.equal(core.hash(raw),manifest.sha256);
 const qsp=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),doc=core.parse(qsp),body=name=>core.shift(doc.lines[doc.locations.find(l=>l.name===name).body],5);
 const bodies=new Map([['Start','exit'],...['jo9_duplicato','jo9_duplicato_traits','jo9_activity_stage','$menu'].map(n=>[n,body(n)]),['choice_screen','exit'],['interaction_screen','exit'],['menu_form',"exit"]]);
 const lines=['QSPGAME','','',core.shift(String(bodies.size),-5)];for(const [name,b]of bodies)lines.push(core.shift(name,-5),'',core.shift(b,-5),core.shift('0',-5));lines.push('');
 const fixture=Buffer.from(lines.join('\r\n'),'utf16le'),api=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm'),errors=[];
 api.on('error',e=>errors.push(e));api.on('msg',(_text,done)=>done());for(const n of ['main_changed','stats_changed','actions_changed','objects_changed','timer','refresh','show_window','panel_visibility','close_file'])api.on(n,()=>{});
 api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 const run=code=>{api.execCode(code.replace(/\r?\n/g,'\r\n'));assert.equal(errors.length,0,JSON.stringify(errors));},quote=x=>"'"+String(x).replaceAll("'","''")+"'";
 const value=(n,k)=>+codec.value(save,n,k)[0],num=(n,k)=>Number(k===undefined?api.readVariable(n):api.readVariableByKey(n,k));
 for(const n of ['slave_state','assistant_state','slave_type','assistant_type','master_mage','master_energy','master_half_action','sparks','cheat_inf_en'])run(n+'='+value(n));
 for(const n of ['CONST_INT','SLAVE','ASSISTANT','NPC_PROGRESS','ALREADY_DONE_TODAY']){
  const v=save.vars.find(v=>v.name===n);assert(v);const keys=new Map(v.idx.map(([i,k])=>[i,k]));
  for(let i=0;i<v.values.length;i++){const key=keys.has(i)?quote(keys.get(i)):i;run(n+'['+key+']='+Number(v.values[i][0]||0));}
 }
 for(const role of ['slave','assistant'])for(const key of ['name','ava'])run('$'+role+'['+quote(key)+']='+quote(codec.value(save,role,key)[1]));
 run("$qa_reason=$func('jo9_duplicato','reason')");assert.equal(api.readVariable('$qa_reason'),'','Ready save must pass actual spell gate');
 run("gs 'jo9_duplicato','choose'");
 const text=api.readVariable('$text_display');assert(text.includes('예민한 미각'),'Source talent must appear in actual picker');
 run("$qa_target=$func('jo9_duplicato','actor_token','slave')\n$qa_donor=$func('jo9_duplicato','actor_token','assistant')");
 run("gt 'jo9_duplicato','preview','cook_affinity',$qa_target,$qa_donor");const confirmation=api.readVariable('$yes');assert(confirmation);
 const before={sparks:num('sparks'),master:num('master_energy'),slave:num('slave','energy'),assistant:num('assistant','energy')};run(confirmation);
 assert.equal(num('slave','cook_affinity'),1);assert.equal(num('slave','cook_affinity_revealed'),2);assert.equal(num('assistant','cook_affinity'),1);assert.equal(num('slave','jo9_duplicato_received'),1);assert.equal(num('already_done_today','jo9_duplicato'),1);assert.equal(num('sparks'),before.sparks-300);
 assert.equal(num('master_energy'),before.master-1);assert.equal(num('slave','energy'),before.slave-1);assert.equal(num('assistant','energy'),before.assistant-1);
 assert.equal(core.hash(fs.readFileSync(manifest.output)),manifest.sha256,'Engine test must not consume the delivered save');
 const result={pass:true,qspHash:doc.hash,saveHash:manifest.sha256,checks:['actual eligibility gate','discovered talent displayed','transfer preserves donor and marks target','300 sparks and 1 AP each charged','delivered save remains unused'],engineErrors:errors,limits:['Actual native EXE load and UI are not run; saved data and current spell handlers checked in isolation. Native spell-handler verification is recorded separately.']};
 fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(result,null,2));process.stdout.write(JSON.stringify(result)+'\n');
})().catch(e=>{process.stderr.write(e.stack+'\n');process.exitCode=1;});
