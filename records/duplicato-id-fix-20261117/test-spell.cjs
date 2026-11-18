'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');
console.log=()=>{}; // Vendor UI notifications are not test results.
const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),doc=core.parse(raw);
const baseline=process.argv.includes('--baseline');
const body=name=>core.shift(doc.lines[doc.locations.find(x=>x.name===name).body],5);
const patchFile=process.argv.find(x=>x.endsWith('.json'));
let bodies=new Map(['jo9_duplicato','jo9_duplicato_traits','jo9_activity_stage','$menu'].map(n=>[n,body(n)]));
if(!baseline){
 const patch=JSON.parse(fs.readFileSync(patchFile||path.join(__dirname,'candidate/patch.json'),'utf8'));
 if(patch.edits)for(const edit of patch.edits){
   const before=bodies.get(edit.location);assert(before!==undefined,'Unexpected candidate location');
   assert.equal(before.split(edit.old).length-1,edit.count);bodies.set(edit.location,before.replace(edit.old,()=>edit.new));
  }
 else for(const [name,text] of Object.entries(patch)){assert(['jo9_duplicato','jo9_duplicato_traits'].includes(name));bodies.set(name,text);}
}
bodies=new Map([['Start','exit'],...bodies,['choice_screen','exit'],['interaction_screen','exit'],['menu_form',"qa_return+=1\r\nif menu_form=62110: gs 'jo9_duplicato','choose'"]]);
const lines=['QSPGAME','','',core.shift(String(bodies.size),-5)];
for(const [name,text] of bodies)lines.push(core.shift(name,-5),'',core.shift(text,-5),core.shift('0',-5));
lines.push('');const fixture=Buffer.from(lines.join('\r\n'),'utf16le');
(async()=>{
 const api=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm');
 const errors=[],cases=[];api.on('error',e=>errors.push(e));api.on('msg',(_text,done)=>done());
 for(const name of ['main_changed','stats_changed','actions_changed','objects_changed','timer','refresh','show_window','panel_visibility','close_file'])api.on(name,()=>{});
 api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 const run=s=>{const at=errors.length;api.execCode(s.replace(/\r?\n/g,'\r\n'));assert.equal(errors.length,at,JSON.stringify(errors.slice(at)));};
 const num=(n,k)=>Number(k===undefined?api.readVariable(n):api.readVariableByKey(n,k));
 const str=n=>api.readVariable(n);
 const quote=s=>"'"+s.replaceAll("'","''")+"'";
 const evalstr=code=>{run('$qa_result='+code);return str('$qa_result');};
 const reason=()=>evalstr("$func('jo9_duplicato','reason')");
 const token=role=>evalstr("$func('jo9_duplicato','actor_token',"+quote(role)+")");
 function reset(extra=''){
  run(`killall
CONST_INT['slave_exist']=1
slave_state=1
assistant_state=1
slave_type=2583
assistant_type=1214
$slave['name']='Galateya'
$assistant['name']='Misty'
$slave['ava']='girls/face/galateya.png'
$assistant['ava']='girls/face/misty.png'
slave['0']=40
assistant['0']=40
master_mage=3
master_energy=3
slave['energy']=3
assistant['energy']=3
sparks=900
npc_progress['Priscilla_duplicato']=1
assistant['music_affinity']=1
assistant['music_affinity_revealed']=2
$menu_item_Revelio='<li><img src="content/pic/ui/legacy_overhaul/Revelio.png">'
$menu_item_Revelio_gray='<li><img src="content/pic/ui/legacy_overhaul/Revelio_gray.png">'
`+extra);
 }
 const snapshot=()=>({sparks:num('sparks'),master:num('master_energy'),slave:num('slave','energy'),assistant:num('assistant','energy'),target:num('slave','music_affinity'),source:num('assistant','music_affinity'),received:num('slave','jo9_duplicato_received'),used:num('already_done_today','jo9_duplicato')});
 function preview(){const target=token('slave'),donor=token('assistant');run("gt 'jo9_duplicato','preview','music_affinity',"+quote(target)+','+quote(donor));return str('$yes');}
 function check(name,fn){try{fn();cases.push({name,pass:true});}catch(e){cases.push({name,pass:false,error:e.message});}}
 check('active ID-zero Galateya and Misty eligible at intimacy40',()=>{reset();assert.equal(reason(),'');});
 check('optional zero ID with positive-ID donor eligible',()=>{reset("assistant['id']=202 & slave['202']=40");assert.equal(reason(),'');});
 check('positive IDs continue to work',()=>{reset("slave['id']=101 & assistant['id']=202 & slave['202']=40 & assistant['101']=40");assert.equal(reason(),'');});
 check('positive duplicate identity stays rejected',()=>{reset("slave['id']=101 & assistant['id']=101");assert.match(reason(),/서로 다른/);});
 check('missing actor stays rejected',()=>{reset('assistant_state=0');assert.match(reason(),/활동 가능한/);});
 check('ID-zero pair still requires intimacy40 each way',()=>{for(const role of ['slave','assistant']){reset(`${role}['0']=39`);assert.match(reason(),/친밀도/);}});
 check('ID-zero transfer charges exactly900 and each1AP; donor kept',()=>{reset();const yes=preview();assert(yes);run(yes);assert.deepEqual(snapshot(),{sparks:0,master:2,slave:2,assistant:2,target:1,source:1,received:1,used:1});const done=snapshot();run(yes);assert.deepEqual(snapshot(),done);});
 check('cancel preview leaves resources and talents intact',()=>{reset();const before=snapshot();preview();run('dynamic $no');assert.deepEqual(snapshot(),before);});
 check('changing zero-ID target type invalidates pending confirmation',()=>{reset();const yes=preview();assert(yes);run('slave_type=2584');const before=snapshot();run(yes);assert.deepEqual(snapshot(),before);});
 check('changing zero-ID donor name invalidates pending confirmation',()=>{reset();const yes=preview();assert(yes);run("$assistant['name']='Other donor'");const before=snapshot();run(yes);assert.deepEqual(snapshot(),before);});
 check('quoted character names survive generated menu and confirm',()=>{reset("$assistant['name']='Mi''sty'");run("gs 'jo9_duplicato','choose'");assert(str('$text_display').includes('Mi'));const yes=preview();assert(yes);run(yes);assert.equal(num('slave','music_affinity'),1);});
 check('dedicated icon headers work including disabled and legacy cache path',()=>{reset();run("gs 'jo9_duplicato','menu_item'");assert(str('$text_display').includes('Duplicato_Essentia.png'));reset('master_mage=2');run("gs 'jo9_duplicato','menu_item'");assert(str('$text_display').includes('Duplicato_Essentia_gray.png'));reset("$menu_item_Revelio='<li><img src=\"content/pic/ui overhaul/Revelio.png\">'");run("gs 'jo9_duplicato','menu_item'");assert(str('$text_display').includes('content/pic/ui/legacy_overhaul/Duplicato_Essentia.png'));});
 const proof={phase:baseline?'RED':'GREEN',sourceHash:doc.hash,sourceBodyHashes:Object.fromEntries(['jo9_duplicato','jo9_duplicato_traits','jo9_activity_stage','$menu'].map(n=>[n,core.hash(Buffer.from(body(n)))])),testedBodyHashes:Object.fromEntries(['jo9_duplicato','jo9_duplicato_traits'].map(n=>[n,core.hash(Buffer.from(bodies.get(n)))])),cases,passed:cases.filter(x=>x.pass).length,total:cases.length,errors};
 fs.writeFileSync(path.join(__dirname,baseline?'red.json':'green.json'),JSON.stringify(proof,null,2));
 process.stdout.write(JSON.stringify({phase:proof.phase,passed:proof.passed,total:cases.length,errors:errors.length,failed:cases.filter(x=>!x.pass)})+'\n');
 if(proof.passed!==proof.total||errors.length)process.exitCode=1;
})().catch(e=>{process.stderr.write(e.stack+'\n');process.exitCode=1;});
