'use strict';
const fs=require('fs'),cp=require('child_process'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',O=__dirname;
const T=process.env.JO9_GUARDIAN_QA_ROOT||JSON.parse(fs.readFileSync(O+'/session.json')).tempRoot;a(T&&/^G:\/Codex\/tmp\/guardian-setting-panel-20261102-[\w-]+$/.test(T),'Use a new, task-specific QA root');
const D=T+'/native-reports';fs.mkdirSync(D,{recursive:true});
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sc=require(R+'/tools/qa/save-codec.cjs');
const q=s=>"'"+String(s).replaceAll("'","''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n');
const get=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(s),-5);
function add(d,n,s){d.lines.splice(-1,0,c.shift(n,-5),'',c.shift(cr(s),-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);d.locations=c.parse(c.serialize(d)).locations;}
function resources(dir){fs.mkdirSync(dir,{recursive:true});for(const n of ['json','fonts','css','content'])fs.symlinkSync(fs.realpathSync(W+'/'+n),dir+'/'+n,'junction');fs.copyFileSync(W+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');}
function run(phase,source,only){
 a(['red','green'].includes(phase));const raw=fs.readFileSync(source);qa.inspectWorld(raw);qa.assertOutside(T,[R,W]);
 const dir=T+'/'+phase+'-'+Date.now();resources(dir);
 const sourceSave=W+'/save/TC_09_PORTAL_GUARDIAN_EVENT.sav',sb=fs.readFileSync(sourceSave),prime=qa.primeState(sc.parse(sb));
 const d0=c.parse(raw),version=get(d0,'main_menu').match(/\$code_rev\s*=\s*'([^']+)'/)[1],fn=require('./native-dom.cjs'),copy=JSON.parse(fs.readFileSync(O+'/copy.json'));
 const html='<a id="qa_dom_callback" style="display:none" href="#"></a><script>('+fn.toString().replace(/\r?\n/g,' ')+')();</script>';
 const cases=['prep','resume','resume-skip','weapon','paladin','unrelated'].filter(x=>!only||only.split(',').includes(x)),reports=[];
 for(const name of cases){
  const d=c.parse(raw),marker='JO9_QA_GUARDIAN_'+name.replaceAll('-','_')+'_COMPLETE';
  const start="killall\n"+prime.code+"\ngs 'refresh_database'\n$game_ver="+q('잭 오 나인 테일 v'+version+' Kor Ver')+"\n$counter=''\n$ongload=''\n$onnewloc=''\nsettimer 0\nautosave=0\ndecadesave=0\nautosave_day=0\nautosave_decade=0\nsound_on=0\nusehtml=1\nnsfw=0\nsnk_room_target=0\njo9_lq['active']=0\nqa_stage=0\n$qa_case="+q(name)+"\n";
  set(d,'Start',start+(name==='paladin'?"interaction_city=62171 & gt 'interaction_city'":"interaction_city=62172 & gt 'interaction_city'"));
  set(d,'$city_random_event','! Unrelated city random encounters are isolated only in this diagnostic.');
  let hook="\nif interaction_city=6216 and sp_txt=6216 and get_weapon=0:\n";
  if(name==='weapon')hook+=" $qa_join=$strfind($text_display,'EXEC: ([^'']+)',1)\n if instr($qa_join,'начать_бой')=0: msg 'FAIL_GUARDIAN_JOIN_CALLBACK' & exit\n dynamic $qa_join\n";
  else if(name==='unrelated')hook+=" interaction_city=115\n gt 'interaction_city'\n";
  else if(name.startsWith('resume'))hook+=" if qa_stage=0:\n  qa_stage=1\n  $master_name='QA_KEEP_NAME'\n  slave['energy']=17\n  assistant['moral']=23\n  slave_inventory['maid_dress']=37\n  sparks=12345\n  бой_с_паладином=2\n  бой_со_стражником=0\n  active[$quest[17]]=2\n  npc_progress['pope']=2\n  fighting_expirience=67\n  won_slave_minimum_value=71\n  master_str_rate=89\n  master_domination_rate=83\n  fog_battle=97\n  $ongload='$ongload'\n"+(name==='resume-skip'?"  sp_txt=1\n  skip_to=6216\n":"")+"  *clr\n  *p '<div id=\"bg\"><img src=\"content/pic/bg/strazhnik.png\"></div><div id=\"side_panel_main\"></div><div id=\"side_panel_text\"></div>'\n  gs '$ongload'\n  exit\n end\n if qa_stage=1: qa_stage=2 & gs '$ongload' & exit\n *p "+q(html)+"\n";
  else if(name==='prep')hook+=' *p '+q(html)+'\n';
  hook+='end\n';
  if(name==='weapon')hook+="if interaction_city=901 and get_weapon=1:\n if instr($text_display,'오른손')=0 or $справа!'гладиус': msg 'FAIL_GUARDIAN_WEAPON_SELECTION' & exit\n *p "+q(html)+'\nend\n';
  if(name==='paladin')hook+="if interaction_city=6215 and sp_txt=6215: *p "+q(html)+'\n';
  if(name==='unrelated')hook+="if interaction_city=115: *p "+q(html)+'\n';
  set(d,'shop_general',get(d,'shop_general')+hook);
  add(d,'qa_finish',"savegame 'result.sav'\nmsg "+q(marker));const probe=c.serialize(d);qa.inspectWorld(probe);const file=dir+'/probe.qsp';fs.writeFileSync(file,probe);fs.writeFileSync(dir+'/plan.json',JSON.stringify([{name:'guardian-'+name,file,marker,checkpoint:'Original preparation/weapon/shop renderers and native Qt DOM'}]));
  if(fs.existsSync(dir+'/result.sav'))fs.unlinkSync(dir+'/result.sav');
  const exec=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/qa/run-client-smoke.ps1','-Engine',W+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:45000});
  fs.writeFileSync(D+'/'+phase+'-'+name+'-runner.log',(exec.stdout||'')+(exec.stderr||''));
  const client=JSON.parse(fs.readFileSync(dir+'/client-results.json','utf8').replace(/^\uFEFF/,'')),r={name,sourceSha256:c.hash(raw),client,processExit:exec.status,completed:exec.status===0&&client.every(x=>x.pass),checks:[]};
  if(fs.existsSync(dir+'/result.sav')){
   const s=sc.parse(fs.readFileSync(dir+'/result.sav')),v=(n,k)=>typeof k==='number'?(s.vars.find(x=>x.name===n.toUpperCase())?.values[k]||['0','']):sc.value(s,n,k),num=(n,k)=>+v(n,k)[0],str=(n,k)=>v(n,k)[1];
   r.dom=JSON.parse(decodeURIComponent(str('qa_dom')));r.html=sc.dec(s.lines[8]);
   r.state={place:str('place'),interactionCity:num('interaction_city'),spTxt:num('sp_txt'),getWeapon:num('get_weapon'),enemy:str('враг',1),masterName:str('master_name'),slaveEnergy:num('slave','energy'),assistantMoral:num('assistant','moral'),inventory:num('slave_inventory','maid_dress'),sparks:num('sparks'),paladin:num('бой_с_паладином'),guardian:num('бой_со_стражником'),quest17:num('active',str('quest',17)),pope:num('npc_progress','pope'),experience:num('fighting_expirience'),minimumReward:num('won_slave_minimum_value'),strRate:num('master_str_rate'),dominationRate:num('master_domination_rate'),fogBattle:num('fog_battle'),stage:num('qa_stage')};
   const check=(label,pass)=>r.checks.push({label,pass:!!pass});
   check('all-rendered-images-loaded',r.dom.missingImages.length===0);
   if(name==='prep'||name.startsWith('resume')){
    check('existing-guardian-bg-path-loaded',r.dom.images.some(x=>x.src==='content/pic/bg/strazhnik.png'&&x.naturalW>0&&x.naturalH>0));
    check('heading-title-role-location',r.dom.heading&&[copy.title,copy.role,copy.location].every(x=>r.dom.heading.text.includes(x)));
    check('three-setting-paragraphs',r.dom.panel&&copy.paragraphs.every(x=>r.dom.panel.text.includes(x)));
    check('lore-no-scroll-overflow',r.dom.panel&&r.dom.panel.box.scrollH<=r.dom.panel.box.h+1);
    check('heading-no-scroll-overflow',r.dom.heading&&r.dom.heading.box.scrollH<=r.dom.heading.box.h+1);
    check('original-guardian-preparation',r.state.place==='fogs_battle2'&&r.state.interactionCity===6216&&r.state.spTxt===6216&&r.state.getWeapon===0&&r.state.enemy==='strazhnik');
    if(name.startsWith('resume'))check('original-load-handler-twice-preserves-actors-items-money-progress-rewards',r.state.masterName==='QA_KEEP_NAME'&&r.state.slaveEnergy===17&&r.state.assistantMoral===23&&r.state.inventory===37&&r.state.sparks===12345&&r.state.paladin===2&&r.state.guardian===0&&r.state.quest17===2&&r.state.pope===2&&r.state.experience===67&&r.state.minimumReward===71&&r.state.strRate===89&&r.state.dominationRate===83&&r.state.fogBattle===97&&r.state.stage===2);
   }else{
    check('no-guardian-setting',!r.dom.allText.includes(copy.paragraphs[0]));
    if(name==='weapon')check('original-weapon-selection',r.state.interactionCity===901&&r.state.getWeapon===1&&r.state.enemy==='strazhnik');
    if(name==='paladin'){check('original-paladin-preparation',r.state.interactionCity===6215&&r.state.enemy==='vatican_paladin'&&r.dom.images.some(x=>x.src==='content/pic/bg/vatican_paladin.png'));check('paladin-setting-still-visible',r.dom.heading&&r.dom.heading.text.includes('바티칸 팔라딘')&&r.dom.panel&&r.dom.panel.text.includes('바티칸의 명을 받들어'));}
    if(name==='unrelated')check('ordinary-shop-gastronom',r.state.place==='gastronom'&&r.state.interactionCity===115&&r.dom.heading&&r.dom.heading.text.trim().length>0);
   }
  }
  r.failures=r.checks.filter(x=>!x.pass).length;r.pass=r.completed&&r.failures===0;
  fs.writeFileSync(D+'/'+phase+'-'+name+'-report.json',JSON.stringify(r,null,2)+'\n');if(r.html)fs.writeFileSync(D+'/'+phase+'-'+name+'.html',r.html);reports.push(r);console.log(JSON.stringify({phase,name,completed:r.completed,checks:r.checks.length,failures:r.failures,failed:r.checks.filter(x=>!x.pass).map(x=>x.label)}));
 }
 const report={phase,scope:'Portal Guardian right setting text only; original renderer, images, choices and game definitions retained',source,sourceSha256:c.hash(raw),sourceSave,sourceSaveSha256:c.hash(sb),sourceSaveUnchanged:c.hash(fs.readFileSync(sourceSave))===c.hash(sb),dir,actualEngine:W+'/engine/jack.exe',actualNativeSaveReload:false,actualSaveUiLoad:false,loadHandlerOnly:cases.some(x=>x.startsWith('resume')),cases:reports.length,completed:reports.every(x=>x.completed),checks:reports.reduce((n,x)=>n+x.checks.length,0),failures:reports.reduce((n,x)=>n+x.failures,0),results:reports.map(x=>({name:x.name,completed:x.completed,pass:x.pass,failures:x.failures}))};report.pass=report.completed&&report.failures===0;
 report.detailedReportsDir=D;fs.writeFileSync(D+'/'+phase+'-native-report.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync(O+'/'+phase+'-native-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.completed||phase==='green'&&!report.pass||phase==='red'&&report.failures===0)process.exitCode=1;
}
run(process.argv[2],process.argv[3],process.argv[4]);
