'use strict';
const fs=require('fs'),cp=require('child_process'),path=require('path'),assert=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=__dirname,input='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(input),hash=c.hash(raw);assert.equal(hash,'dbe2948f7c827d8fc82ccd32b2c3453626d181a59eb744e015fa66a3846280ae');
const d=c.parse(raw),get=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5).replace(/\r\n/g,'\n');
let checks=0;const chk=(s,label)=>{checks++;return `if (${s}) = 0: msg 'FAIL_TRAIT_AUDIT_${label}' & exit\n`;};
let code="usehtml=1\n$onnewloc=''\n$counter=''\nCONST_INT['no_slave']=0\nslave_state=1\nassistant_state=1\n";
const obs=get('#static_base');const begin=obs.indexOf('$update_slave_features_list = {');const finish=obs.indexOf('\n$equip_set_manager = {',begin);assert(begin>0&&finish>begin);
code+=obs.slice(begin,finish)+"\n$vb_cycle_skill = {$result=$args[1]}\n";
code+="slave['ego']=3\nslave['temper']=3\nslave['pride']=3\nslave['nymphomania']=-1\nslave['perversion']=-1\nslave['jo9_focus']=-1\nslave['jo9_grudge']=1\nslave['jo9_ambition']=1\nslave['jo9_work_ethic']=-1\nslave['passion_comfort']=1\nspell_revelio=0\ndynamic $replace($update_slave_features_list,'dynslave','slave')\n";
code+=chk("instr($slave_features_list,'불감증')=0 and instr($slave_features_list,'순수한 영혼')=0 and instr($slave_features_list,'산만함')=0",'unknown_without_spell');
code+="spell_revelio=1\ndynamic $replace($update_slave_features_list,'dynslave','slave')\n";
code+=chk("instr($slave_features_list,'불감증')>0 and instr($slave_features_list,'순수한 영혼')>0",'old_visible_with_spell');
code+=chk("instr($slave_features_list,'산만함')=0 and instr($slave_features_list,'옹졸함')=0 and instr($slave_features_list,'야심가')=0",'new_hidden_with_spell');
code+=chk("instr($slave_features_list,'휴식 선호')>0",'merged_activity_visible_with_spell');
code+=chk("slave['jo9_focus']=-1 and slave['jo9_focus_known']=0",'revelation_does_not_remove_or_discover');
code+="qa_n=func('jo9_traits_personality','activity','slave','cook',0)\n"+chk("slave['jo9_focus_known']=0",'focus_first_activity');
code+="qa_n=func('jo9_traits_personality','activity','slave','cook',0)\n"+chk("slave['jo9_focus_known']=1 and slave['jo9_focus']=-1",'focus_second_activity_reveals_same_trait');
code+="dynamic $replace($update_slave_features_list,'dynslave','slave')\n"+chk("instr($slave_features_list,'산만함')>0",'focus_visible_after_natural_discovery');
for(const role of ['slave','assistant']){
 code+=`killvar '${role}'\n${role}_state=1\nchaotic_essence=1\n${role}['nymphomania']=-1\n${role}['perversion']=-1\nqa_count=func('jo9_chaotic','count','${role}')\nqa_used=func('jo9_chaotic','apply','${role}')\n`;
 code+=chk(`qa_count=0 and qa_used=0 and chaotic_essence=1 and ${role}['nymphomania']=-1 and ${role}['perversion']=-1`,role+'_situational_excluded');
 code+=`${role}['grace']=-1\nqa_count=func('jo9_chaotic','count','${role}')\nqa_used=func('jo9_chaotic','apply','${role}')\n`;
 code+=chk(`qa_count=1 and qa_used=1 and chaotic_essence=0 and ${role}['grace']=0`,role+'_old_negative_eligible');
 code+=`${role}['jo9_focus']=-1\nchaotic_essence=1\nqa_count=func('jo9_chaotic','count','${role}')\nqa_used=func('jo9_chaotic','apply','${role}')\n`;
 code+=chk(`qa_count=1 and qa_used=1 and chaotic_essence=0 and ${role}['jo9_focus']=0`,role+'_hidden_new_negative_eligible');
}
code+="msg 'JO9_QA_TRAITS_current_COMPLETE'\n";
const loc=d.locations.find(l=>l.name==='Start');d.lines[loc.body]=c.shift(code.replace(/\n/g,'\r\n'),-5);
const tmp=path.join(root,'native-fixture');fs.mkdirSync(tmp,{recursive:true});fs.writeFileSync(path.join(tmp,'current.qsp'),c.serialize(d));
fs.writeFileSync(path.join(tmp,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(path.join(tmp,'plan.json'),JSON.stringify([{name:'current',file:path.join(tmp,'current.qsp'),marker:'JO9_QA_TRAITS_current_COMPLETE',checkpoint:'Current helper and list natural-discovery/chaotic-pool fixtures'}]));
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine','G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe','-Plan',path.join(tmp,'plan.json'),'-TimeoutSeconds','15'],{encoding:'utf8',windowsHide:true,timeout:22000});
const results=fs.existsSync(path.join(tmp,'client-results.json'))?JSON.parse(fs.readFileSync(path.join(tmp,'client-results.json'),'utf8').replace(/^\uFEFF/,'')):[];
assert.equal(c.hash(fs.readFileSync(input)),hash);const report={hash,checks,engineExit:run.status,results,worldUnchanged:true,limits:['Synthetic isolated fixture using current compiled helpers/list; no user save loaded or mutated.','Long-term whole-game progression not reproduced.']};fs.writeFileSync(path.join(root,'native-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
assert.equal(path.resolve(tmp),path.join(path.resolve(root),'native-fixture'));
assert(!fs.lstatSync(tmp).isSymbolicLink());
const known=new Set(['current.qsp','FastQSP.ini','plan.json','current-stderr.log','current-stdout.log','client-results.json']);
if(fs.existsSync(path.join(tmp,'save'))){
 const saveDir=path.join(tmp,'save');assert(!fs.lstatSync(saveDir).isSymbolicLink());assert.equal(fs.readdirSync(saveDir).length,0,'Preserve nonempty diagnostic save directory');fs.rmdirSync(saveDir);
}
for(const name of fs.readdirSync(tmp)){assert(known.has(name),'Preserve unrecognized output: '+name);assert(fs.lstatSync(path.join(tmp,name)).isFile());}
fs.writeFileSync(path.join(root,'native-log.txt'),fs.readFileSync(path.join(tmp,'current-stderr.log')));
for(const name of fs.readdirSync(tmp))fs.unlinkSync(path.join(tmp,name));
fs.rmdirSync(tmp);
