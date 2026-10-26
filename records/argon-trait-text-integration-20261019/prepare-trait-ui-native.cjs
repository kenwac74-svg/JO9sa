'use strict';
// Disposable native probes: test the real registry/list/describe and role-swap paths.
// No production world, saves, JSON, or release files are changed by this generator.
const fs=require('node:fs'),path=require('node:path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const opts={};for(let i=2;i<process.argv.length;i+=2)opts[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
const work='G:/somi/Jack O Nine Tails v2.4_work/game',input=opts.input||work+'/jack.qsp',out=opts.out;
if(!out||fs.existsSync(out))throw Error('Fresh --out required');
let raw=fs.readFileSync(input);const originalHash=c.hash(raw);
if(opts.transform==='traits'){
 const d=c.parse(raw),sources=new Map(d.locations.map(l=>[l.name,c.shift(d.lines[l.body],5)]));
 const changed=require('./trait-transform.cjs').transformLocations(sources);
 for(const l of d.locations)d.lines[l.body]=c.shift(changed.locations.get(l.name).replace(/\r?\n/g,'\r\n'),-5);
 raw=c.serialize(d);
}
const base=c.parse(raw);
const body=n=>c.shift(base.lines[base.locations.find(l=>l.name===n).body],5);
const mapping=JSON.parse(fs.readFileSync(path.join(__dirname,'trait-mapping.json'),'utf8')).traits;
if(!mapping||mapping.length!==7)throw Error('Expected seven source descriptions');
const ids=['oral_pref','gag_reflex','anal_pref','anal_averse','defiant','innate_mute','tongue_loss'];
const fields=['oral_affinity','jo9_gag_reflex','anal_affinity','anal_affinity','defiant','jo9_voice_trait','jo9_voice_trait'];
const values=[1,1,1,-1,1,1,2];
const uniqueFields=[...new Set(fields)];
const roles=['slave','assistant','room1','room2','room3','room4'];
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
const check=(expr,label)=>['if '+expr+':','else','$qa_errors+='+q(label+'|'),'end'];
const clear=r=>uniqueFields.map(k=>r+'['+q(k)+']=0');
const prime=qa.primeState(codec.parse(fs.readFileSync(work+'/save/spete_dialogue_test.sav')));
const setup=['killall',prime.code,"$onnewloc=''",'snk_room_target=0','sound_on=0','nsfw=0',"$qa_errors=''","$update_slave_features_list='QA_OLD_CACHE'","gs 'refresh_database'",...check("instr($update_slave_features_list,'QA_OLD_CACHE')=0",'cache_refreshed')];
for(const [i,r]of roles.entries())setup.push(r+"_state=CONST_INT['slave_exist']",'$'+r+'_name='+q('QA_NAME_'+r),r+"['ego']=5",r+"['temper']=5",r+"['pride']=5",...clear(r));
const tests=[];
const registry=[];
for(const r of roles){
 registry.push(r+"['jo9_ambition']=1",r+"['jo9_ambition_known']=1",r+"['jo9_constitution']=-1",'$qa_list=$func('+q('jo9_traits')+', '+q('list')+', '+q(r)+')',...check("instr($qa_list,'''ambitious''')>0 and instr($qa_list,'''frail''')>0",'old_registry_list_'+r));
 registry.push(r+"['jo9_ambition']=0",r+"['jo9_ambition_known']=0",r+"['jo9_constitution']=0");
 registry.push(...clear(r),'$qa_list=$func('+q('jo9_traits')+', '+q('list')+', '+q(r)+')');
 for(const id of ids)registry.push(...check('instr($qa_list,'+q("'"+id+"'")+')=0','zero_'+r+'_'+id));
 for(let i=0;i<ids.length;i++){
  registry.push(...clear(r),r+'['+q(fields[i])+']='+values[i],'$qa_list=$func('+q('jo9_traits')+', '+q('list')+', '+q(r)+')');
  registry.push(...check('instr($qa_list,'+q("'"+ids[i]+"'")+')>0','list_'+r+'_'+ids[i]));
  for(let j=0;j<ids.length;j++)if(j!==i)registry.push(...check('instr($qa_list,'+q("'"+ids[j]+"'")+')=0','exclusive_'+r+'_'+ids[i]+'_'+ids[j]));
  registry.push('dynamic $replace($update_slave_features_list, '+q('dyn'+'slave')+', '+q(r)+')',...check('instr($'+r+'_features_list,'+q("'"+ids[i]+"'")+')>0','shared_'+r+'_'+ids[i]));
  registry.push(...check('$'+r+'_name='+q('QA_NAME_'+r),'name_preserved_'+r+'_'+ids[i]));
 }
 registry.push(...clear(r));
}
tests.push({name:'registry-list',marker:'registry_list',code:registry,checkpoint:'All seven condition keys and exact EXEC ids through real list and shared feature list; six actors, zero states, and mutually exclusive values.'});
const desc=[];
for(let i=0;i<ids.length;i++)desc.push("$qa_captured='NO_DESCRIPTION'",'gs '+q('jo9_traits')+', '+q('describe')+', '+q(ids[i]),...check('$qa_captured='+q(mapping[i].argonDefinition.text),'describe_exact_'+ids[i]));
tests.push({name:'registry-describe',marker:'registry_describe',code:desc,intercept:true,checkpoint:'Real describe dispatch; only msg is intercepted in diagnostic QSP and captured output must byte-match the full supplied Argon string.'});
const edit=[];
for(const r of ['slave','assistant']){
 edit.push("$setting_display=''","$setting_display_r=''",'gs '+q('jo9_traits')+', '+q('editor')+', '+q(r),"$qa_editor=$replace($setting_display+$setting_display_r,' ','')");
 for(let i=0;i<ids.length;i++)edit.push(...check('instr($qa_editor,'+q("'"+r+"','"+fields[i]+"',"+values[i])+')>0','editor_link_'+r+'_'+ids[i]));
 for(let i=0;i<ids.length;i++){
  edit.push(...clear(r),'gs '+q('jo9_traits')+', '+q('edit')+', '+q(r)+', '+q(fields[i])+', '+values[i],...check(r+'['+q(fields[i])+']='+values[i],'edit_on_'+r+'_'+ids[i]));
  edit.push('gs '+q('jo9_traits')+', '+q('edit')+', '+q(r)+', '+q(fields[i])+', '+values[i],...check(r+'['+q(fields[i])+']=0','edit_off_'+r+'_'+ids[i]));
 }
 edit.push(...clear(r));
}
for(const r of roles.filter(r=>r.startsWith('room'))){
 edit.push(...clear(r),r+"['jo9_voice_trait']=2",r+"['anal_affinity']=-1",r+"['jo9_gag_reflex']=1",...clear('slave'),"slave['oral_affinity']=1",'gs '+q('snk_room_bridge')+', '+q('enter')+', '+Number(r.slice(-1))+', 1');
 edit.push(...check("slave['jo9_voice_trait']=2 and slave['anal_affinity']=-1 and slave['jo9_gag_reflex']=1",'bridge_fields_'+r));
 edit.push('dynamic $replace($update_slave_features_list, '+q('dyn'+'slave')+', '+q('slave')+')',...check("instr($slave_features_list,'''tongue_loss''')>0 and instr($slave_features_list,'''anal_averse''')>0 and instr($slave_features_list,'''gag_reflex''')>0",'bridge_list_'+r));
 edit.push(...check('$slave_name='+q('QA_NAME_'+r),'bridge_name_'+r),'gs '+q('snk_room_bridge')+', '+q('leave'));
 edit.push(...check("slave['oral_affinity']=1 and slave['jo9_voice_trait']=0",'main_restored_'+r),...check(r+"['jo9_voice_trait']=2 and "+r+"['anal_affinity']=-1",'room_restored_'+r),...check('$slave_name='+q('QA_NAME_slave')+' and $'+r+'_name='+q('QA_NAME_'+r),'names_restored_'+r));
 edit.push(...clear(r));
}
tests.push({name:'registry-edit-swap',marker:'registry_edit_swap',code:edit,checkpoint:'Existing editor toggle API and full private-room bridge enter/leave preserve fields and actual names with the shared slave display.'});
fs.mkdirSync(out,{recursive:true});fs.cpSync(work+'/json',out+'/json',{recursive:true});fs.copyFileSync(work+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plan=[];
for(const test of tests.filter(t=>!opts.only||opts.only.split(',').includes(t.name))){
 const d=c.parse(raw),set=(n,b)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(b,-5);};
 // Intercepting msg retains the original condition and literal expression in this diagnostic world.
 if(test.intercept)set('jo9_traits',body('jo9_traits').replace(/\bmsg\s+(?=')/g,'$qa_captured = '));
 const marker='JO9_QA_ARGONTRAITS_'+test.marker+'_COMPLETE';
 set('Start',[...setup,...test.code,"if $qa_errors!'': msg 'JO9_QA_ASSERTION_FAILED_' + $qa_errors","if $qa_errors='': msg "+q(marker)].join('\r\n'));
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=path.join(out,test.name+'.qsp');fs.writeFileSync(file,bytes);plan.push({name:test.name,file,marker,checkpoint:test.checkpoint});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2));
fs.writeFileSync(out+'/prepared.json',JSON.stringify({input,originalHash,inputHash:c.hash(raw),transformation:opts.transform||null,ids,fields,values,roles,probes:plan.length,limits:['Diagnostic msg interception proves actual describe dispatch/expression, not native popup visual layout.','Zero flags and editor/bridge serialization use original execution paths, but no save UI load or player navigation is simulated.','Does not verify gameplay XP, acceptance, or voice interaction blocking; these have separate probes.']},null,2));
console.log(JSON.stringify({out,inputHash:c.hash(raw),probes:plan.length}));
