'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',O=__dirname,T=process.env.JO9_PALADIN_QA_ROOT||'G:/Codex/tmp/vatican-paladin-scene-fix-20261102-native';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sc=require(R+'/tools/qa/save-codec.cjs');
const q=s=>"'"+String(s).replaceAll("'","''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n');
const get=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(s),-5);
function add(d,n,s){d.lines.splice(-1,0,c.shift(n,-5),'',c.shift(cr(s),-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);d.locations=c.parse(c.serialize(d)).locations;}
function resources(dir,phase){
 fs.mkdirSync(dir,{recursive:true});for(const n of ['json','fonts','css','content'])fs.symlinkSync(fs.realpathSync(W+'/'+n),dir+'/'+n,'junction');
 fs.copyFileSync(W+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
}
function run(phase,source,only){
 a(['red','green'].includes(phase));const raw=fs.readFileSync(source);qa.inspectWorld(raw);qa.assertOutside(T,[R,W]);
 const dir=T+'/'+phase+'-'+Date.now();resources(dir,phase);const sourceSave=W+'/save/TC_10_VATICAN_PALADIN_EVENT.sav',sb=fs.readFileSync(sourceSave),prime=qa.primeState(sc.parse(sb));
 const d0=c.parse(raw),version=get(d0,'main_menu').match(/\$code_rev\s*=\s*'([^']+)'/)[1],fn=require('./native-dom.cjs');
 const html='<a id="qa_dom_callback" style="display:none" href="#"></a><script>('+fn.toString().replace(/\r?\n/g,' ')+')();</script>';
 const cases=['prep','weapon','resume','unrelated','guardian'].filter(x=>!only||only.split(',').includes(x)),reports=[];
 for(const name of cases){
  const d=c.parse(raw),marker='JO9_QA_PALADIN_'+name.replaceAll('-','_')+'_COMPLETE',prep="interaction_city=62171 & gt 'interaction_city'";
  const start="killall\n"+prime.code+"\ngs 'refresh_database'\n$game_ver="+q('잭 오 나인 테일 v'+version+' Kor Ver')+"\n$counter=''\n$ongload=''\n$onnewloc=''\nsettimer 0\nautosave=0\ndecadesave=0\nautosave_day=0\nautosave_decade=0\nsound_on=0\nusehtml=1\nnsfw=0\nsnk_room_target=0\njo9_lq['active']=0\nqa_stage=0\n$qa_case="+q(name)+"\nqa_checks=0\nqa_failures=0\n$qa_failed=''\n";
  set(d,'Start',start+(name==='guardian'?"interaction_city=62172 & gt 'interaction_city'":prep));
  set(d,'$city_random_event','! Unrelated city random encounters are isolated only in this diagnostic.');
  let hook="\nif interaction_city=6215 and sp_txt=6215 and get_weapon=0:\n";
  if(['weapon','combat','defeat'].includes(name))hook+=" $qa_join=$strfind($text_display,'EXEC: ([^'']+)',1)\n if instr($qa_join,'начать_бой')=0: msg 'FAIL_PALADIN_JOIN_CALLBACK' & exit\n dynamic $qa_join\n";
  else if(name==='leave')hook+=" local $qa_leave=$strfind($text_display,'EXEC: (city_form[^'']+)',1)\n if instr($qa_leave,'120')=0: msg 'FAIL_PALADIN_LEAVE_CALLBACK' & exit\n dynamic $qa_leave\n";
  else if(name==='unrelated')hook+=" interaction_city=115\n gt 'interaction_city'\n";
  else if(name==='resume')hook+=" if qa_stage=0:\n  qa_stage=1\n  $master_name='QA_KEEP_NAME'\n  slave['energy']=17\n  assistant['moral']=23\n  slave_inventory['maid_dress']=37\n  sparks=12345\n  бой_с_паладином=1\n  fighting_expirience=67\n  master_str_rate=89\n  fog_battle=97\n  $ongload='$ongload'\n  *clr\n  *p '<div id=\"bg\"><img src=\"content/pic/bg/vatican_paladin.png\"></div><div id=\"side_panel_main\"></div><div id=\"side_panel_text\"></div>'\n  gs '$ongload'\n  exit\n end\n if qa_stage=1: qa_stage=2 & gs '$ongload' & exit\n *p "+q(html)+"\n";
  else hook+=' *p '+q(html)+'\n';
  hook+='end\n';
  if(['weapon','combat','defeat'].includes(name))hook+="if interaction_city=901 and get_weapon=1:\n if instr($text_display,'오른손')=0 or $справа!'гладиус': msg 'FAIL_PALADIN_WEAPON_SELECTION' & exit\n"+(name==='weapon'?' *p '+q(html)+'\n':" local $qa_go=$strfind($text_display,'EXEC: (nogoto[^'']+)',1)\n if instr($qa_go,'начать_бой')=0: msg 'FAIL_PALADIN_COMBAT_CALLBACK' & exit\n dynamic $qa_go\n")+'end\n';
  if(name==='guardian')hook+="if interaction_city=6216: *p "+q(html)+'\n';
  if(name==='unrelated')hook+="if interaction_city=115: *p "+q(html)+'\n';
  set(d,'shop_general',get(d,'shop_general')+hook);
  if(name==='leave')set(d,'city_screen',get(d,'city_screen')+'\n*p '+q(html));
  if(['combat','defeat'].includes(name))set(d,'боевой_интерфейс',get(d,'боевой_интерфейс')+(name==='defeat'?"\n*clr\n$qa_defeat=func('jo9_battle_fate','sprite',1,1)\n*p '<div id=\"qa_defeat\"><img src=\"<<$qa_defeat>>\"></div>'":"")+'\n*p '+q(html));
  add(d,'qa_finish',"savegame 'result.sav'\nmsg "+q(marker));const probe=c.serialize(d);qa.inspectWorld(probe);const file=dir+'/probe.qsp';fs.writeFileSync(file,probe);fs.writeFileSync(dir+'/plan.json',JSON.stringify([{name:'paladin-'+name,file,marker,checkpoint:'Original preparation/weapon/combat renderer and native Qt DOM'}]));
  if(fs.existsSync(dir+'/result.sav'))fs.unlinkSync(dir+'/result.sav');const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/qa/run-client-smoke.ps1','-Engine',W+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:45000});
  fs.writeFileSync(O+'/'+phase+'-'+name+'-runner.log',(run.stdout||'')+(run.stderr||''));const client=JSON.parse(fs.readFileSync(dir+'/client-results.json','utf8').replace(/^\uFEFF/,'')),r={name,client,processExit:run.status,completed:run.status===0&&client.every(x=>x.pass),checks:[]};
  if(fs.existsSync(dir+'/result.sav')){const s=sc.parse(fs.readFileSync(dir+'/result.sav')),v=(n,k)=>typeof k==='number'?(s.vars.find(x=>x.name===n.toUpperCase())?.values[k]||['0','']):sc.value(s,n,k),num=(n,k)=>+v(n,k)[0],str=(n,k)=>v(n,k)[1];r.dom=JSON.parse(decodeURIComponent(str('qa_dom')));r.html=sc.dec(s.lines[8]);r.state={place:str('place'),interactionCity:num('interaction_city'),spTxt:num('sp_txt'),getWeapon:num('get_weapon'),enemy:str('враг',1),masterName:str('master_name'),slaveEnergy:num('slave','energy'),assistantMoral:num('assistant','moral'),inventory:num('slave_inventory','maid_dress'),sparks:num('sparks'),paladin:num('бой_с_паладином'),experience:num('fighting_expirience'),strRate:num('master_str_rate'),fogBattle:num('fog_battle'),weapon:str('оружие'),enemyCount:num('количество_врагов'),defeat:str('qa_defeat'),stage:num('qa_stage')};
   const check=(label,pass)=>r.checks.push({label,pass:!!pass});
   check('all-rendered-images-loaded',r.dom.missingImages.length===0);
   const intro=r.dom.images.find(x=>x.src==='content/pic/mob/vatican_paladin_intro.png');
   if(name==='prep'||name==='resume'){const existing=r.dom.images.find(x=>x.src==='content/pic/bg/vatican_paladin.png');check('existing-bg-path-and-size-preserved',existing&&existing.naturalW===795&&existing.naturalH===596&&Math.abs(existing.box.w-795)<1&&Math.abs(existing.box.h-596)<1&&!intro);check('heading-title-role-affiliation',r.dom.heading&&['바티칸 팔라딘','교황청 직속 관문 수호자','바티칸'].every(x=>r.dom.heading.text.includes(x)));check('three-lore-paragraphs',r.dom.panel&&['바티칸의 명을','성유물로 강화한','팔라딘이 수호하는'].every(x=>r.dom.panel.text.includes(x)));check('lore-no-scroll-overflow',r.dom.panel&&r.dom.panel.box.scrollH<=r.dom.panel.box.h+1);check('heading-no-scroll-overflow',r.dom.heading&&r.dom.heading.box.scrollH<=r.dom.heading.box.h+1);check('prep-actor-and-quest',r.state.interactionCity===6215&&r.state.getWeapon===0&&r.state.enemy==='vatican_paladin');if(name==='resume')check('original-load-handler-twice-actor-reward-progress-preserved',r.state.masterName==='QA_KEEP_NAME'&&r.state.slaveEnergy===17&&r.state.assistantMoral===23&&r.state.inventory===37&&r.state.sparks===12345&&r.state.paladin===1&&r.state.experience===67&&r.state.strRate===89&&r.state.fogBattle===97&&r.state.stage===2);}
   else if(name==='weapon'){check('original-weapon-selection',r.state.interactionCity===901&&r.state.getWeapon===1);check('no-prep-image-or-lore',!intro&&!r.dom.allText.includes('바티칸의 명을'));}
   else if(name==='combat'){const im=r.dom.images.find(x=>x.src==='content/pic/mob/vatican_paladin.png');check('original-combat-image-loaded',im&&im.naturalW>0&&im.naturalH>0);check('original-combat-entry',r.state.getWeapon===2&&r.state.enemy==='vatican_paladin'&&r.state.enemyCount===1);check('no-prep-lore',!r.dom.allText.includes('바티칸의 명을'));}
   else if(name==='defeat'){const im=r.dom.images.find(x=>x.src==='content/pic/mob/defeated/vatican_paladin.png');check('existing-defeat-resolver-loaded',im&&im.naturalW===795&&im.naturalH===596&&r.state.defeat==='content/pic/mob/defeated/vatican_paladin.png');}
   else {check('no-paladin-intro-or-lore',!intro&&!r.dom.allText.includes('바티칸의 명을'));if(name==='guardian')check('original-guardian-prep',r.state.interactionCity===6216&&r.state.enemy==='strazhnik'&&r.dom.images.some(x=>x.src==='content/pic/bg/strazhnik.png'));if(name==='leave')check('actual-leave-to-city',r.state.place==='fogs_district');if(name==='unrelated')check('unrelated-shop',r.state.place==='gastronom');}
  }
  r.failures=r.checks.filter(x=>!x.pass).length;r.pass=r.completed&&r.failures===0;fs.writeFileSync(O+'/'+phase+'-'+name+'-report.json',JSON.stringify(r,null,2)+'\n');if(r.html)fs.writeFileSync(O+'/'+phase+'-'+name+'.html',r.html);reports.push(r);console.log(JSON.stringify({phase,name,completed:r.completed,checks:r.checks.length,failures:r.failures,failed:r.checks.filter(x=>!x.pass).map(x=>x.label)}));
 }
 const report={phase,scope:'Right setting text only; existing image paths and resources preserved',source,sourceSha256:c.hash(raw),sourceSave,sourceSaveSha256:c.hash(sb),sourceSaveUnchanged:c.hash(fs.readFileSync(sourceSave))===c.hash(sb),dir,actualEngine:W+'/engine/jack.exe',actualNativeSaveReload:false,loadHandlerOnly:cases.includes('resume'),cases:reports.length,completed:reports.every(x=>x.completed),checks:reports.reduce((n,x)=>n+x.checks.length,0),failures:reports.reduce((n,x)=>n+x.failures,0),results:reports.map(x=>({name:x.name,completed:x.completed,pass:x.pass,failures:x.failures}))};report.pass=report.completed&&report.failures===0;fs.writeFileSync(O+'/'+phase+'-native-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.completed||phase==='green'&&!report.pass||phase==='red'&&report.failures===0)process.exitCode=1;
}
run(process.argv[2],process.argv[3],process.argv[4]);
