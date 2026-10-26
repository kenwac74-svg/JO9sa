// 명기 방 역할 수정의 실제 QSP 코드를 격리된 FastQSP 진단으로 검증한다.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=path.resolve('G:/Codex/tmp/hover-meiki-fix-20261021/meiki'),work='G:/somi/Jack O Nine Tails v2.4_work/game';
const baselineHash='1e911ced3798826e8cd1f35ed1e4115e9fd6450a9fdecaeb231b5f6885c1abb4';
const roles=['slave','assistant','room1','room2','room3','room4'];
const q=s=>"'"+s.replaceAll("'","''")+"'";
const body=(d,n)=>{const l=d.locations.find(x=>x.name===n);if(!l)throw Error('Missing '+n);return core.shift(d.lines[l.body],5);};
function closure(text,name){const start=text.indexOf(name+' = {'),end=text.indexOf('\r\n}',start);assert(start>=0&&end>start,'Missing closure '+name);return text.slice(start,end+3);}
function seed(r,extra={}){const data={age:2,virginity:0,moral:5,sensitivity:0,pride:0,arousal:0,energy:4,qa_sentinel:91,...extra};return ['killvar '+q(r),r+'_state=1',...Object.entries(data).map(([k,v])=>r+'['+q(k)+']='+v)];}
function check(expr,label){return ['if '+expr+':','else',' msg '+q('JO9_QA_FAIL_'+label),' exit','end'];}
function callTransition(r){return 'dynamic $replace($vaginally_penetrated, '+q('dyn'+'slave')+', '+q(r)+')';}
function setup(d){
 const staticBody=body(d,'#static_base');
 const constants=staticBody.split('\r\n').filter(s=>/^CONST_INT\['(?:young_age|milf_age|loli_age|no_slave|slave_exist|slave_faint|slave_dead)'\] = /.test(s));
 assert.equal(constants.length,7);
 return ['killall','settimer 0','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','sound_on=0',"$onnewloc=''","$counter=''","$onactsel=''","$onobjsel=''","$onobjadd=''","$onobjdel=''","$usercom=''","$ongsave=''","$ongload=''","$onqsave=''",...constants,'is_perv=0','ejaculation_intensity=0',"$interaction_type='qa_transition'",closure(body(d,'#dynamic'),'$vaginally_penetrated')];
}
function minimal(d,start,includeBridge=false){
 const state=body(d,'jo9_meiki_state');assert.equal((state.match(/rand\(1, 100\)/g)||[]).length,6);
 const instrumented=state.replaceAll('rand(1, 100)',"func('qa_rng')");
 const locs=[['Start',start],['jo9_meiki_willing',body(d,'jo9_meiki_willing')],['jo9_meiki_checks',body(d,'jo9_meiki_checks')],['jo9_meiki_state',instrumented],['qa_rng','qa_rng_calls += 1\r\nresult=qa_rng_value']];
 if(includeBridge){locs.push(['snk_room_bridge',body(d,'snk_room_bridge')],['#var_base',''],['#txt_man',''],['#txt_2_man','']);}
 const lines=[...d.lines.slice(0,3),core.shift(String(locs.length),-5)];
 for(const [n,b]of locs)lines.push(core.shift(n,-5),core.shift('',-5),core.shift(b,-5),core.shift('0',-5));
 lines.push('');const raw=Buffer.from(lines.join('\r\n'),'utf16le');assert(core.serialize(core.parse(raw)).equals(raw));return raw;
}
function build(input,out,only){
 const raw=fs.readFileSync(input),d=core.parse(raw);assert(core.serialize(d).equals(raw));
 const dest=path.resolve(out);assert(dest.toLowerCase().startsWith((root+path.sep).toLowerCase()),'Only this task directory');fs.mkdirSync(dest,{recursive:true});
 const token=crypto.randomBytes(8).toString('hex').toUpperCase(),counts={},probes=[];
 function add(name,lines,includeBridge=false){if(only&&!only.includes(name))return;const marker='JO9_QA_'+token+'_'+name.replaceAll('-','_')+'_COMPLETE';const code=[...setup(d),...lines,'msg '+q(marker)].join('\r\n');const file=path.join(dest,name+'.qsp');fs.writeFileSync(file,minimal(d,code,includeBridge));probes.push({name,file,marker,checkpoint:'Real native QSP numeric assertions',assertionCount:lines.filter(s=>s.startsWith(" msg 'JO9_QA_FAIL_")).length});}
 const red=[];
 for(const r of roles.slice(2)){red.push(...seed(r),'qa_rng_value=1','qa_rng_calls=0',...check("func('jo9_meiki_willing', "+q(r)+', 0)=0','baseline_role_'+r),callTransition(r),...check(r+"['jo9_meiki_checked']=1 and "+r+"['jo9_meiki_known']=0 and "+r+"['virginity']=2 and qa_rng_calls=0",'baseline_consumed_'+r));}
 add('baseline-reproduction',red);counts.baselineReproduction=4;
 const eligibility=[];let ec=0;
 for(const r of roles)for(const actorState of [-1,0,1,2])for(const v of [0,1,2,3,4])for(const known of [0,1])for(const arg of [-1,0,1,2]){
  const expected=actorState===1&&(arg!==1||v===4||(known===1&&(v===2||v===3)))?1:0;
  eligibility.push(...seed(r,{virginity:v,jo9_meiki_known:known}),r+'_state='+actorState,"qa_actual=func('jo9_meiki_willing', "+q(r)+', '+arg+')',...check('qa_actual='+expected,'eligibility_'+ec+'_'+r),...check(r+"['virginity']="+v+' and '+r+"['jo9_meiki_known']="+known+' and '+r+"['jo9_meiki_checked']=0 and "+r+"['jo9_meiki_initialized']=0 and "+r+"['qa_sentinel']=91 and "+r+'_state='+actorState,'pure_'+ec));ec++;
 }
 add('role-eligibility',eligibility);counts.eligibilityCases=ec;
 const boundaries=[];let bc=0;
 for(const r of roles)for(let roll=1;roll<=6;roll++){
  const known=roll<=5?1:0,state=known?4:2;
  boundaries.push(...seed(r),'qa_rng_value='+roll,'qa_rng_calls=0',callTransition(r),...check(r+"['virginity']="+state+' and '+r+"['jo9_meiki_checked']=1 and "+r+"['jo9_meiki_known']="+known+' and qa_rng_calls=1','first_'+r+'_'+roll),'qa_rng_value=1',callTransition(r),...check('qa_rng_calls=1 and '+r+"['jo9_meiki_known']="+known+' and '+r+"['virginity']="+state,'repeat_'+r+'_'+roll));bc++;
 }
 add('first-transition-boundaries',boundaries);counts.boundaryCases=bc;
 const history=[];let hc=0;
 for(const r of roles){
  for(const [v,known,checked,init,expected]of [[2,0,0,0,2],[3,0,0,0,3],[4,0,0,0,4],[1,0,0,0,1],[0,0,1,1,0],[1,1,1,2,1]]){
   history.push(...seed(r,{virginity:v,jo9_meiki_known:known,jo9_meiki_checked:checked,jo9_meiki_initialized:init}),'qa_rng_calls=0','qa_rng_value=1',"gs 'jo9_meiki_state', "+q(r)+', 1',...check('qa_rng_calls=0 and '+r+"['virginity']="+expected,'history_'+hc));
   if(v===1||v===0){history.push(callTransition(r),...check('qa_rng_calls=0 and '+r+"['jo9_meiki_checked']=1 and "+r+"['jo9_meiki_known']="+known+' and '+r+"['virginity']="+(known?4:2),'restored_or_checked_'+hc));}
   else history.push(...check(r+"['jo9_meiki_checked']=1 and "+r+"['jo9_meiki_known']="+(v===4?1:known),'existing_'+hc));
   hc++;
  }
  for(const arg of [0,2]){
   history.push(...seed(r),'qa_rng_calls=0','qa_rng_value=1',"gs 'jo9_meiki_state', "+q(r)+', 0',r+"['virginity']=2","gs 'jo9_meiki_state', "+q(r)+', '+arg,...check('qa_rng_calls=0 and '+r+"['jo9_meiki_checked']=1 and "+r+"['jo9_meiki_known']=0",'arg_consumes_'+r+'_'+arg),"gs 'jo9_meiki_state', "+q(r)+', 1',...check('qa_rng_calls=0 and '+r+"['jo9_meiki_known']=0",'arg_no_retry_'+r+'_'+arg));hc++;
  }
 }
 add('history-and-arguments',history);counts.historyCases=hc;
 const route=[];let rc=0;
 for(const r of roles){
  for(const state of [-1,0,2]){route.push(...seed(r),r+'_state='+state,'qa_rng_calls=0','qa_rng_value=1',callTransition(r),...check('qa_rng_calls=0 and '+r+"['jo9_meiki_known']=0",'invalid_actor_'+r+'_'+(state+1)),...check(r+"['virginity']="+(state>0?2:0),'invalid_state_'+r+'_'+(state+1)));rc++;}
  for(const [kind,diligence,allow]of [['',1,false],['qa_daily',-4,true],['qa_daily',0,true],['qa_direct',1,true]]){
   route.push(...seed(r),'qa_rng_calls=0','qa_rng_value=5','$interaction_type='+q(kind),'interaction_'+r+"['diligence']="+diligence,callTransition(r),...check('qa_rng_calls='+(allow?1:0)+' and '+r+"['jo9_meiki_checked']=1 and "+r+"['jo9_meiki_known']="+(allow?1:0),'transition_arg_'+rc));rc++;
  }
 }
 route.push(...check("func('jo9_meiki_willing','unknown',0)=0",'unknown_role'));
 add('direct-daily-actor-gates',route);counts.routeCases=rc;
 const sb=body(d,'#static_base'),vars=sb.slice(sb.indexOf("killvar '$playable_vars'"),sb.indexOf('!swap two slave instances'));
 assert(vars.includes("copyarr '$slave_vars', '$playable_vars'"));
 const bridge=[vars,closure(sb,'$swap_slave_instances'),"$update_slave_features_list=''","$interaction_type='qa_bridge'"];
 for(const [i,r]of roles.slice(2).entries())for(const roll of [5,6]){
  const known=roll===5?1:0;
  bridge.push(...seed('slave',{virginity:3,qa_sentinel:77,jo9_meiki_initialized:1,jo9_meiki_prev:3,jo9_meiki_checked:1}),...seed(r,{qa_sentinel:100+i}),"slave_inventory['qa_keep']=77","slave_rate['qa_keep']=79",r+"_inventory['qa_keep']="+(100+i),r+"_rate['qa_keep']="+(110+i),'snk_room_target=0',"gs 'snk_room_bridge', 'enter', "+(i+1)+', 12',...check('snk_room_target='+(i+1)+' and slave[\'qa_sentinel\']='+(100+i)+' and '+r+"_state=0 and snk_parked_slave['qa_sentinel']=77 and slave_inventory['qa_keep']="+(100+i)+" and snk_parked_slave_inventory['qa_keep']=77",'bridge_enter_'+r+'_'+roll),...check("func('jo9_meiki_willing','slave',0)=1",'bridge_willing_'+r+'_'+roll),'qa_rng_value='+roll,'qa_rng_calls=0',callTransition('slave'),...check("slave['jo9_meiki_known']="+known+' and qa_rng_calls=1','bridge_first_'+r+'_'+roll),"gs 'snk_room_bridge','leave'",...check('snk_room_target=0 and slave[\'qa_sentinel\']=77 and slave[\'virginity\']=3 and slave[\'jo9_meiki_checked\']=1 and slave[\'jo9_meiki_known\']=0 and '+r+"['qa_sentinel']="+(100+i)+' and '+r+"['jo9_meiki_known']="+known+' and '+r+"['jo9_meiki_checked']=1 and snk_parked_slave['qa_sentinel']=0 and slave_inventory['qa_keep']=77 and slave_rate['qa_keep']=79 and "+r+"_inventory['qa_keep']="+(100+i)+' and '+r+"_rate['qa_keep']="+(110+i),'bridge_leave_'+r+'_'+roll),'qa_rng_value=1',callTransition(r),...check('qa_rng_calls=1 and '+r+"['jo9_meiki_known']="+known+' and '+r+"['jo9_meiki_checked']=1 and slave['qa_sentinel']=77",'bridge_then_direct_no_retry_'+r+'_'+roll),"gs 'snk_room_bridge','enter', "+(i+1)+', 12',...check("slave['jo9_meiki_known']="+known+" and slave['jo9_meiki_checked']=1",'bridge_reenter_'+r+'_'+roll),callTransition('slave'),...check('qa_rng_calls=1 and slave[\'jo9_meiki_known\']='+known,'bridge_repeat_no_retry_'+r+'_'+roll),"gs 'snk_room_bridge','leave'",...check('snk_room_target=0 and slave[\'qa_sentinel\']=77 and '+r+"['jo9_meiki_known']="+known+" and snk_parked_slave['qa_sentinel']=0",'bridge_repeat_leave_'+r+'_'+roll));
 }
 add('bridge-alias-preserved',bridge,true);counts.bridgeCases=8;
 fs.writeFileSync(path.join(dest,'plan.json'),JSON.stringify(probes,null,2));
 fs.writeFileSync(path.join(dest,'coverage.json'),JSON.stringify({input,inputSHA256:core.hash(raw),baselineHash,counts,intercept:{location:'jo9_meiki_state',old:'rand(1, 100)',new:"func('qa_rng')",count:6,comparisonUnchanged:'<= 5'},isolation:{minimalLocations:true,noAutosave:true,timer:0,callbacksCleared:true,bridgeTextRefreshStubs:['#var_base','#txt_man','#txt_2_man']},plan:probes.map(x=>x.name)},null,2));
 fs.writeFileSync(path.join(dest,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 fs.writeFileSync(path.join(dest,'config.xml'),'<game width="640" height="480" title="JO9 QA Numeric"/>\r\n');
 console.log(JSON.stringify({plan:path.join(dest,'plan.json'),counts,probes:probes.length}));
}
if(require.main===module){const [input,out,only]=process.argv.slice(2);if(!input||!out)throw Error('Usage: node native-tests.cjs input.qsp task-subdirectory [names comma separated]');build(input,out,only&&only.split(','));}
module.exports={build,body,baselineHash,roles};