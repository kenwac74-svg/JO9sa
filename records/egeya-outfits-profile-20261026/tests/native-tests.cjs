'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',task='G:/Codex/tmp/egeya-outfits-20261026';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const candidate=task+'/candidate.qsp',out=task+'/native/run',record=repo+'/records/egeya-outfits-profile-20261026/evidence';
const q=s=>"'"+String(s).replace(/'/g,"''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n'),json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const raw=fs.readFileSync(candidate),source=c.parse(raw),save=game+'/save/JO9_TEST_20261023_01_HOME.sav',savedRaw=fs.readFileSync(save),prime=qa.primeState(sc.parse(savedRaw));
qa.inspectWorld(raw);assert.equal(c.hash(raw),'ed7f14b5a892f2dc695e8b90a29dfd1331c31536b604911fb2fddd9af8107648');
const template=game+'/json/slaves/2579_egeya.json',data=json(template),originalZip=game+'/content/modworkpic/egeya01/egeya.zip';
const protectedInputs=[candidate,save,originalZip,template].map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))}));
assert(!fs.existsSync(out),'Fresh isolated output required');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(record,{recursive:true});
fs.cpSync(game+'/json',out+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',out+'/config.xml');
for(const part of ['content','css','fonts'])fs.symlinkSync(game+'/'+part,out+'/'+part,'junction');
fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plans=[],coverage={acquisitionBranches:0,migrationCases:0,resolverCases:0,domModes:0,generationControls:0,entranceStates:0},extracted=[];
function get(d,n){const l=d.locations.find(x=>x.name===n);assert(l,n);return c.shift(d.lines[l.body],5);}
function set(d,n,t){const l=d.locations.find(x=>x.name===n);assert(l,n);d.lines[l.body]=c.shift(cr(t),-5);}
function add(d,n,t){assert(!d.locations.some(l=>l.name===n));d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift(n,-5),c.shift('',-5),c.shift(cr(t),-5),c.shift('0',-5));d.locations=c.parse(c.serialize(d)).locations;}
function check(expr,label){return 'qa_checks+=1\nif ('+expr+')=0: msg '+q('FAIL_EGEYA_'+label)+' & exit\n';}
const bootstrap=[];
for(const [k,v] of Object.entries(data))if(typeof v==='string')bootstrap.push('$'+k+'[2579]='+q(v));else if(typeof v==='number')bootstrap.push(k+'[2579]='+v);
for(const key of ['indpack_title','indpack_naked','indpack_maid','indpack_secr','indpack_dom'])for(const suffix of ['_horny','_rebel'])bootstrap.push('$'+key+suffix+'[2579]='+q(data[key+suffix]||''));
function setup(){return ['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''",'usehtml=1','sound_on=0','snk_room_target=0',"gs 'refresh_database'","$counter=''","$ongload=''","$onnewloc=''",'autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','settimer 0','is_home=1','city_district=-1','ui_style=2','cheat_h=0','cheat_j=0','cheat_k=0','cheat_l=0','creating_clone=0','get_girl=0',...bootstrap,'qa_checks=0'];}
function finish(d,name,code,checkpoint){const marker='JO9_QA_EGEYA_'+name.replace(/-/g,'_')+'_COMPLETE';set(d,'Start',setup().concat(code,'msg '+q(marker)).join('\n'));const bytes=c.serialize(d);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);plans.push({name,file,marker,checkpoint});}
function tagged(name,id){const b=get(source,name),re=new RegExp('(! JO9 MOD START '+id+'[^\\r]*\\r\\n[\\s\\S]*?! JO9 MOD END '+id+')');const m=b.match(re);assert(m,id);extracted.push({location:name,tag:id,sha256:c.hash(Buffer.from(m[1]))});return m[1];}
const city=get(source,'interaction_city');
const matches=[...city.matchAll(/^[ \t]*special_stock = 2579\r\n[\s\S]*?(?=^[ \t]*gt 'interaction_city')/gmi)];assert.equal(matches.length,2);
{
 const d=c.parse(raw),lines=[];
 for(let i=0;i<matches.length;i++){
  const fragment=matches[i][0];extracted.push({location:'interaction_city',fragment:'acquisition-'+i,sha256:c.hash(Buffer.from(fragment))});
  lines.push('sparks=123456','trophy_absolute=0','trophy_camira=0','trophy_corvus=0','trophy_serpis=0','trophy_taurus=0','trophy_vatican=0','slave_state=0','creating_clone=0',fragment,
   check("slave_type=2579 and $slave_name='에게야'",'ACQUIRE_NAME_'+i),check("slave['jo9_constitution']=1 and slave['jo9_combat_trait']=3",'ACQUIRE_TRAITS_'+i),check("slave['arena_level']=9 and slave_rate['fame']=160",'ACQUIRE_TITLE_FAME_'+i),check("sparks=123456 and trophy_absolute=0 and trophy_camira=0 and trophy_corvus=0 and trophy_serpis=0 and trophy_taurus=0 and trophy_vatican=0",'ACQUIRE_NO_EXTRA_REWARD_'+i),check("slave['courage']=1 and slave['courage_revealed']=2 and slave['scars']=1",'ACQUIRE_EXISTING_STATS_'+i));coverage.acquisitionBranches++;
 }
 finish(d,'acquisition',lines.join('\n'),'Both original acquisition setup fragments verbatim through pre-gt; fame160, rank9, courage/scars; no immediate reward/trophies.');
}
{
 const d=c.parse(raw),lines=['creating_clone=1','special_stock=2579',"gs 'generate_stock'",check("stock['jo9_constitution']=0 and stock['jo9_combat_trait']=0",'CLONE_GUARD'),'creating_clone=0','special_stock=2578',"gs 'generate_stock'",check("stock_type=2578 and stock['jo9_constitution']=0 and stock['jo9_combat_trait']=0",'OTHER_ID')];coverage.generationControls=2;finish(d,'generation-controls',lines.join('\n'),'Actual generate_stock: preset2579 clone receives no forced trait; other preset untouched.');
}
const migration=tagged('$ongload','EGEYA_DEFAULT_NAME_LOAD_20261026');
const roles=['slave','assistant','prisoner','cow','room1','room2','room3','room4','farmhand','harpy','pig',...Array.from({length:18},(_,i)=>'iced_'+(i+1))];assert.equal(roles.length,29);
{
 const d=c.parse(raw),lines=[check("arrsize('$all_slave_characters')=29",'ALL_29_ROLES')];add(d,'qa_egeya_name_migrate',migration);
 for(const old of ['Egeya','egeya','Egeaya','egeaya','Эгея']){
  for(const r of roles)lines.push(r+'_type=2579','$'+r+'_name='+q(old),r+"['jo9_constitution']=0",r+"['jo9_combat_trait']=0",r+"['arena_level']=0");
  lines.push("gs 'qa_egeya_name_migrate'");for(const r of roles){lines.push(check('$'+r+"_name='에게야' and "+r+"['jo9_constitution']=0 and "+r+"['jo9_combat_trait']=0 and "+r+"['arena_level']=0",'MIGRATE_'+r+'_'+coverage.migrationCases));coverage.migrationCases++;}
 }
 for(const phase of ['custom','other-id']){
  for(const r of roles)lines.push(r+'_type='+(phase==='custom'?2579:2578),'$'+r+'_name='+q(phase==='custom'?'내이름_'+r:'Egeya'),r+"['jo9_constitution']=-1",r+"['jo9_combat_trait']=2",r+"['arena_level']=3");
  lines.push("gs 'qa_egeya_name_migrate'");for(const r of roles){lines.push(check('$'+r+'_name='+q(phase==='custom'?'내이름_'+r:'Egeya')+' and '+r+"['jo9_constitution']=-1 and "+r+"['jo9_combat_trait']=2 and "+r+"['arena_level']=3",'PRESERVE_'+phase+'_'+r));coverage.migrationCases++;}
 }
 lines.push("savegame 'migration-pass.sav'");finish(d,'name-migration',lines.join('\n'),'Verbatim $ongload name-only block:5 defaults and custom/other-ID cases x29 roles; no trait/rank regrant.');
}
const modeKeys=[[0,'naked'],[2,'maid'],[3,'secr'],[1,'dom']];
function appearanceActor(mode,moral=4,arousal=0){return ["assistant_type=2579","assistant_state=CONST_INT['slave_exist']","$assistant_name='에게야'","assistant['age']=seed_age[2579]","assistant['jo9_constitution']=1","assistant['jo9_combat_trait']=3","assistant['arena_level']=9","assistant['moral']="+moral,"assistant['arousal']="+arousal,"assistant['image_mode']="+mode,"$assistant['cloth']='голая'","$assistant['fullimage']=$fullimage[2579]","$assistant['fullmade']=$fullmade[2579]","$assistant['fullsecretary']=$fullsecretary[2579]","$assistant['fullmistress']=$fullmistress[2579]",'assistant_stat_screen=0','nsfw=0',"$info_text='QA Egeya appearance'"];}
{
 const d=c.parse(raw),lines=[];
 for(const [mode,key]of modeKeys)for(const [moral,arousal]of [[4,0],[2,0],[4,4]]){
  const wanted='content/pic/'+data['indpack_'+key]+'.png';assert(data['indpack_'+key]);lines.push(...appearanceActor(mode,moral,arousal),"$qa_image=func('display_fullimage','assistant','center_image','psy')",check("instr($replace($qa_image,'\\','/'),"+q(wanted)+')>0','RESOLVER_'+mode+'_'+moral+'_'+arousal));coverage.resolverCases++;
 }
 lines.push(...appearanceActor(0),'*clr',"gs 'assistant_stat'",check("assistant_alt_appearance_count=3 and instr($maintxt,'chekbox_10r')>0 and instr($maintxt,'chekbox_11r')>0 and instr($maintxt,'chekbox_12r')>0 and instr($maintxt,'chekbox_13r')>0",'FOUR_APPEARANCE_MENU'),"savegame 'appearance-menu-pass.sav'");
 finish(d,'appearance-routing',lines.join('\n'),'Actual resolver4 modes x normal/rebel/horny; existing assistant menu four controls.');
}
{
 const d=c.parse(raw),entrance=get(source,'city_menu_form').match(/^[ \t]*IF egeya_lose = 0:\r\n[\s\S]*?^[ \t]*END/gmi);assert.equal(entrance.length,1);add(d,'qa_egeya_entrance',entrance[0]);extracted.push({location:'city_menu_form',fragment:'entrance',sha256:c.hash(Buffer.from(entrance[0]))});const lines=[check("$npc_name['egeya']='에게야'",'NPC_KOREAN')];
 for(const lose of [0,1]){lines.push('egeya_lose='+lose,"$text_display=''","gs 'qa_egeya_entrance'",check("instr($text_display,'캣파이트 클럽')>0",'ENTRANCE_CAPTION_'+lose),check("instr($text_display,'10201')"+(lose===0?'>0':'=0'),'ENTRANCE_ROUTE_'+lose),check('egeya_lose='+lose,'ENTRANCE_READ_ONLY_'+lose));coverage.entranceStates++;}
 finish(d,'npc-switch',lines.join('\n'),'Verbatim city entrance: enabled egeya_lose0, disabled1; no replacement; Korean NPC name.');
}
function nativeDom(){
 var tries=0;
 function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}
 function done(){var imgs=document.querySelectorAll('#center_image img'),target=null;for(var i=0;i<imgs.length;i++){if(imgs[i].getAttribute('src').replace(/\\/g,'/').indexOf(qaWanted)>=0)target=imgs[i]}if(!target||!target.complete||!target.naturalWidth){if(++tries<120)setTimeout(done,50);else emit(false,{error:'image-not-loaded',count:imgs.length});return}var r=target.getBoundingClientRect(),controls=[],all=true;for(i=10;i<=13;i++){var n=document.getElementById('chekbox_'+i+'r');controls.push(!!n);if(!n)all=false}var ok=target.naturalWidth===795&&target.naturalHeight===596&&Math.abs(r.width-795)<.1&&Math.abs(r.height-596)<.1&&all;emit(ok,{mode:qaMode,role:qaRole,source:target.getAttribute('src'),natural:[target.naturalWidth,target.naturalHeight],bounds:{left:r.left,top:r.top,width:r.width,height:r.height},controls:controls})}
 function emit(ok,metrics){var a=document.createElement('a');a.href="EXEC: $qa_egeya_metrics='"+JSON.stringify(metrics).replace(/'/g,"''")+"' & savegame '"+qaSave+"' & msg '"+(ok?qaMarker:'FAIL_EGEYA_DOM_'+qaRole)+"'";document.body.appendChild(a);click(a)}
 setTimeout(done,150)
}
const script=js=>'*p '+q('<script type="text/javascript">'+js.replace(/\r?\n/g,' ')+'</script>');
for(const [mode,key]of modeKeys){
 const d=c.parse(raw),name='outfit-'+key,marker='JO9_QA_EGEYA_'+name.replace(/-/g,'_')+'_COMPLETE',wanted='content/pic/'+data['indpack_'+key]+'.png';
 const driver='var qaWanted='+JSON.stringify(wanted)+',qaMode='+mode+',qaRole='+JSON.stringify(key)+',qaSave='+JSON.stringify(name+'-dom.sav')+',qaMarker='+JSON.stringify(marker)+';('+nativeDom.toString()+')();';
 set(d,'Start',setup().concat(appearanceActor(mode),'*clr',"gs 'assistant_stat'",script(driver)).join('\n'));const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);plans.push({name,file,marker,checkpoint:'Native QtWebKit actual '+key+' PNG natural/rendered795x596; four appearance controls.'});coverage.domModes++;
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plans,null,2)+'\n');
const prepared={candidate,sha256:c.hash(raw),save,saveHash:c.hash(savedRaw),coverage,extracted,bootstrap:'Exact current2579 JSON string/number values after state priming and refresh_database; absent mood variant arrays explicitly empty.',limits:['Diagnostic state priming is not GUI Save/Load or CRC compatibility proof.','Verbatim acquisition setup through pre-gt; subsequent reward event outside native fragment scope.','Actual Qt DOM image geometry and four controls; no screenshots/physical UI input.','Original catfight entrance fragment in isolation; no fight executed.']};
fs.writeFileSync(out+'/prepared.json',JSON.stringify(prepared,null,2)+'\n');fs.writeFileSync(record+'/native-prepared.json',JSON.stringify(prepared,null,2)+'\n');
if(!process.argv.includes('--run')){console.log(JSON.stringify({prepared:true,cases:plans.length,coverage,out}));process.exit(0);}
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:(plans.length*45+15)*1000,maxBuffer:8*1024*1024});
fs.writeFileSync(out+'/runner.log',(run.stdout||'')+'\n'+(run.stderr||''));const results=fs.existsSync(out+'/client-results.json')?json(out+'/client-results.json'):[];const metrics=[];
for(const p of plans)for(const suffix of ['-stderr.log','-stdout.log']){const from=out+'/'+p.name+suffix;if(fs.existsSync(from))fs.copyFileSync(from,record+'/'+p.name+suffix);}
for(const [mode,key]of modeKeys){const log=fs.readFileSync(out+'/outfit-'+key+'-stderr.log','utf8'),m=log.match(/\$qa_egeya_metrics='([^']+)' & savegame/);assert(m,'Missing native DOM metrics '+key);metrics.push({key,metrics:JSON.parse(decodeURIComponent(m[1]))});}
for(const p of protectedInputs)assert.equal(c.hash(fs.readFileSync(p.path)),p.sha256,'Protected input changed: '+p.path);
const report={status:run.status===0&&results.length===plans.length&&results.every(x=>x.pass)?'PASS':'FAIL',...prepared,results,metrics,protectedInputsUnchanged:true,runnerExit:run.status};fs.writeFileSync(record+'/native-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.status!=='PASS')process.exitCode=1;
