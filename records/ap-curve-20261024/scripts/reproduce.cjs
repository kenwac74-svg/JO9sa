'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),z=require('node:zlib'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-ap-curve-20261024',rec=repo+'/records/ap-curve-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const beforeHash='05257a003f3984f8a8ceeca534b7a459ae0e501ecf3d9bff983519a251f03a44',caps=[0,2,3,4,5,5],roles=['slave','assistant','room1','room2','room3','room4','prisoner','cow','farmhand'];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),cr=s=>s.replace(/\r?\n/g,'\r\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(s),-5);
const phase=process.argv[2];
function protect(){return [game+'/jack.qsp',game+'/css/base.css',game+'/FastQSP.ini',game+'/../FastQSP.ini','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).map(n=>game+'/save/'+n)].map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))}));}
function run(d,dir,name,code){fs.mkdirSync(dir,{recursive:true});set(d,'Start',code);const raw=c.serialize(d);qa.inspectWorld(raw);fs.writeFileSync(dir+'/'+name+'.qsp',raw);write(dir+'/plan.json',[{name,file:dir+'/'+name+'.qsp',marker:'JO9_QA_AP_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint:'Actual production dynamic energy functions; controlled grade and state inputs'}]);
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:60000});
 const results=read(dir+'/client-results.json'),log=new TextDecoder('euc-kr').decode(fs.readFileSync(dir+'/'+name+'-stderr.log'));return{exit:r.status,results,failure:(log.match(/FAIL_AP_[^"\r\n]+/)||[])[0],log:dir+'/'+name+'-stderr.log'};
}
function extract(d,n,start,end){const s=body(d,n),from=s.indexOf(start);a(from>=0,start);const to=s.indexOf(end,from);a(to>from,end);return s.slice(from,to);}
if(phase==='prepare'){
 a(!fs.existsSync(root));a(!fs.existsSync(rec));fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.mkdirSync(rec+'/scripts',{recursive:true});fs.mkdirSync(rec+'/evidence');
 const raw=fs.readFileSync(game+'/jack.qsp');a.equal(c.hash(raw),beforeHash);qa.inspectWorld(raw);a.deepEqual(c.serialize(c.parse(raw)),raw);fs.writeFileSync(root+'/inputs/before.qsp',raw);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(raw,{level:9}));a.deepEqual(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz')),raw);write(rec+'/inputs.json',protect());fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');
 write(rec+'/approved-scope.json',{baseAP:caps,grades:['죽어감','쇠약함','평범함','건강함','강인함','근육질'],roles,scope:['base cap','normal overnight recovery','new-character initialization','acquisition cap only','UI current cap'],preserve:['current energy and half-action totals on load','wounds and medical fallback','master AP','negative AP cost and exertion','bonus carryover and rest growth','physical stamina and food formula'],pendingSeparateApproval:['muscular overwork relief rate','intelligence discounts','medical constitution growth','economy'],next:'Report this stage and wait for user approval'});
 fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-24-ap-curve.md',`# 체력별 기본 행동력 개편 계획\r\n\r\n**Goal:** stamina0..5를AP0/2/3/4/5/5로연결한다.\r\n**Architecture:** 기존동적상한함수의지역파생값과회복/생성/UI식만변경.새함수/영구키/기존세이브리필없음.\r\n**Spec:** 사용자확정표와2026-10-24진행승인, records/ap-curve-20261024/approved-scope.json.\r\n**Review Focus:**0AP재충전금지,반칸총량,9역할,부상/간호회복,모든생성/영입한도,UI9곳,캐시전이,기존캣파이트보존.\r\n\r\n- [ ] 실제엔진기존쇠약상한RED확인.\r\n- [ ] 선언형패치와집중경계GREEN.\r\n- [ ] 구조/줄/주석경계/정확재생/재적용/공식9경로검사.\r\n- [ ] 독립검토후최신WORK해시확인및적용.\r\n- [ ] 세이브보존/설명서/작업묶음/임시자료정리.\r\n- [ ] 결과보고후다음단계승인대기.커밋·푸시없음.\r\n`);console.log(JSON.stringify({prepared:true,before:beforeHash,protected:read(rec+'/inputs.json').length}));
}else if(phase==='red'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp'));const code="usehtml=1\ngs 'refresh_database'\nCONST_INT['slave_exist']=1\nslave_state=1\nslave['stamina']=1\nslave['energy']=2\nslave['half_action']=0\nslave_already_done_today['exertion']=0\ndynamic $replace($update_slave_energy_stars,'dynslave','slave')\nif slave['energy'] ! 2: msg 'FAIL_AP_weak_cap_observed_<<slave[''energy'']>>' & exit\nmsg 'JO9_QA_AP_missing_COMPLETE'";
 const r=run(d,root+'/red','missing',code);fs.copyFileSync(r.log,rec+'/evidence/red.log');write(rec+'/red-results.json',{status:'EXPECTED_FAILURE',...r});a(r.failure&&r.failure.includes('observed_1'));console.log(JSON.stringify(r));
}else if(phase==='build'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp')),edits=[];
 const cap=role=>`iif(${role}['stamina'] > 0, min(5, ${role}['stamina'] + 1), 0)`;
 function edit(location,old,newText,count,id){old=cr(old);newText=cr(newText);const t=body(d,location);a.equal(t.split(old).length-1,count,id);set(d,location,t.split(old).join(newText));edits.push({location,field:'body',old,new:newText,count,patchId:id});}
 const s=body(d,'#static_base'),first=s.indexOf('\t\t! if energy exceeds cap'),last=s.indexOf("\t\tdynslave['energy'] = max(-5, min(dynslave['stamina'], dynslave['energy']))",first),old=s.slice(first,last)+"\t\tdynslave['energy'] = max(-5, min(dynslave['stamina'], dynslave['energy']))";
 a(first>0&&last>first);const replacement=old.replaceAll("dynslave['stamina']",'jo9_base_ap_cap');
 edit('#static_base',old,`\t\t! JO9 MOD START AP_CURVE_CAP | 2026-10-24_ap_curve
\t\tlocal jo9_base_ap_cap = ${cap('dynslave')}
${replacement}
\t\t! JO9 MOD END AP_CURVE_CAP`,1,'AP_CURVE_CAP');
 edit('next_day',"\t\ta = dynslave['stamina'] - dynslave['wounds']",`\t\t! JO9 MOD START AP_CURVE_RECOVERY | 2026-10-24_ap_curve
\t\ta = ${cap('dynslave')} - dynslave['wounds']
\t\t! JO9 MOD END AP_CURVE_RECOVERY`,1,'AP_CURVE_RECOVERY');
 for(const [location,role,oldAssign]of [['generate_stock','stock',"stock['energy'] = stock['stamina']"],['generate_clone','stock',"stock['energy'] = stock['stamina']"],['get_demo_slave','slave','slave["energy"] = slave["metabolism"]'],['get_special_slave','slave','slave["energy"] = slave["metabolism"]']]){
  const id='AP_CURVE_INIT_'+location.toUpperCase();edit(location,oldAssign,`! JO9 MOD START ${id} | 2026-10-24_ap_curve\n${role}['energy'] = ${cap(role)}\n! JO9 MOD END ${id}`,1,id);
 }
 edit('stock_to_slave_nogt',"if stock['energy'] > stock['stamina']: stock['energy'] = stock['stamina']",`! JO9 MOD START AP_CURVE_ACQUIRE_CAP | 2026-10-24_ap_curve
local jo9_acquire_ap_cap = ${cap('stock')}
if stock['energy'] > jo9_acquire_ap_cap: stock['energy'] = jo9_acquire_ap_cap
! JO9 MOD END AP_CURVE_ACQUIRE_CAP`,1,'AP_CURVE_ACQUIRE_CAP');
 edit('end_day_screen',"\tslave['energy'] = slave['stamina']",`\t! JO9 MOD START AP_CURVE_EXAM | 2026-10-24_ap_curve
\tslave['energy'] = ${cap('slave')}
\t! JO9 MOD END AP_CURVE_EXAM`,1,'AP_CURVE_EXAM');
 for(const [location,actors]of [['main_screen',['slave','assistant']],['city_screen',['slave','assistant']],['slave_private_room1',['room1']],['slave_private_room2',['room2']],['slave_private_room3',['room3']],['slave_private_room4',['room4']],['snk_room_menu_screen',['slave']]])for(const role of actors){
  const id='AP_CURVE_UI_'+location.toUpperCase()+'_'+role.toUpperCase();edit(location,`jo9_ap_cap = max(0, min(5, ${role}['stamina']))`,`! JO9 MOD START ${id} | 2026-10-24_ap_curve\njo9_ap_cap = ${cap(role)}\n! JO9 MOD END ${id}`,1,id);
 }
 const raw=c.serialize(d);qa.inspectWorld(raw);a.equal(c.parse(raw).locations.length,267);const p={id:'2026-10-24_ap_curve',description:'체력0..5 기본AP0/2/3/4/5/5. 상한/일일회복/신규생성/영입상한/UI통일. 기존잔량·보너스·주인·과로·신체성장/경제불변.',before_sha256:beforeHash,after_sha256:c.hash(raw),edits};
 fs.writeFileSync(root+'/inputs/candidate.qsp',raw);write(root+'/patches/2026-10-24_ap_curve.json',p);write(rec+'/patch.json',p);fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({candidate:p.after_sha256,edits:edits.length,locations:[...new Set(edits.map(x=>x.location))],newLocations:0,newPersistentKeys:0}));
}else if(phase==='restore-fixtures'){
 a(!fs.existsSync(root));const p=read(rec+'/patch.json'),raw=z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'));a.equal(c.hash(raw),p.before_sha256);fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.writeFileSync(root+'/inputs/before.qsp',raw);const d=c.parse(raw);for(const e of p.edits){const t=body(d,e.location);a.equal(t.split(e.old).length-1,e.count);set(d,e.location,t.split(e.old).join(e.new));}const candidate=c.serialize(d);a.equal(c.hash(candidate),p.after_sha256);fs.writeFileSync(root+'/inputs/candidate.qsp',candidate);write(root+'/patches/2026-10-24_ap_curve.json',p);console.log('Restored isolated inputs; WORK unchanged.');
}else if(phase==='install'){
 const p=read(rec+'/patch.json');a.equal(read(rec+'/green-results.json').status,'PASS');a.equal(read(rec+'/extended-results.json').status,'PASS');const release='G:/Codex/tmp/jo9-ap-curve-release-20261024',runs=fs.readdirSync(release).filter(n=>n.startsWith('run-'));a.equal(runs.length,1);const gate=read(release+'/'+runs[0]+'/report.json');a.equal(gate.verdict,'PASS');a(gate.client.probes.length===9&&gate.client.probes.every(x=>x.pass));
 for(const x of read(rec+'/inputs.json'))a.equal(c.hash(fs.readFileSync(x.path)),x.sha256,'Preinstall protected '+x.path);const oldNames=new Set(fs.readdirSync(game));
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/patches'],{encoding:'utf8',windowsHide:true,timeout:90000});fs.writeFileSync(rec+'/install.log',r.stdout+'\n'+r.stderr);a.equal(r.status,0);a.deepEqual(fs.readFileSync(game+'/jack.qsp'),fs.readFileSync(root+'/inputs/candidate.qsp'));a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);
 fs.copyFileSync(rec+'/patch.json',repo+'/mods/2026-10-24_ap_curve.json');fs.copyFileSync(release+'/'+runs[0]+'/report.json',rec+'/release-validation.json');write(rec+'/install-backups.json',fs.readdirSync(game).filter(n=>!oldNames.has(n)&&n.startsWith('jack.qsp')).map(n=>game+'/'+n));
 const xs=read(rec+'/inputs.json').map(x=>({...x,expected:x.path===game+'/jack.qsp'?p.after_sha256:x.sha256,after:c.hash(fs.readFileSync(x.path))}));for(const x of xs)a.equal(x.after,x.expected);write(rec+'/preservation.json',{status:'PASS',files:xs.length,unchanged:xs.length-1,userSavesUnchanged:76,onlyChanged:game+'/jack.qsp',results:xs});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({installed:true,sha256:p.after_sha256,preservedOtherFiles:81,userSavesUnchanged:76}));
}else if(phase==='extended'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),oldDoc=c.parse(fs.readFileSync(root+'/inputs/before.qsp'));
 let code="usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\nCONST_INT['slave_exist']=1\ncheat_inf_en=0\njo9_qa_want[0]=0\njo9_qa_want[1]=2\njo9_qa_want[2]=3\njo9_qa_want[3]=4\njo9_qa_want[4]=5\njo9_qa_want[5]=5\n",cases=0,checks=0;
 const check=(condition,label)=>{checks++;code+=`if (${condition}) = 0: msg 'FAIL_AP_${label}' & exit\n`;};
 for(const ctor of ['generate_stock','get_demo_slave','get_special_slave'])for(let s=0;s<6;s++){
  cases++;code+=`killvar 'stock'\nkillvar 'stock_rate'\nkillvar 'slave'\nkillvar 'slave_rate'\nstock_type=2571\nslave_type=2571\nspecial_stock=2571\nseed_age[2571]=2\nseed_stamina[2571]=${s}\nseed_metabolism[2571]=1\nseed_beauty[2571]=3\ngs '${ctor}'\n`;
  const role=ctor==='generate_stock'?'stock':'slave';check(`${role}['stamina'] >= 0 and ${role}['stamina'] <= 5`,'ctor_'+ctor+'_'+s+'_grade_range');check(`${role}['energy'] = jo9_qa_want[${role}['stamina']]`,'ctor_'+ctor+'_'+s+'_ap');
 }
 cases++;code+="special_stock=2571\ngs 'generate_clone'\n";check("stock['stamina'] = 4 and stock['energy'] = 5",'clone_fixed_grade');
 for(let s=0;s<6;s++)for(const energy of [-2,0,1,caps[s]+2]){
  cases++;code+=`killvar 'stock'\nkillvar 'stock_rate'\nkillvar 'slave'\nkillvar 'slave_rate'\nstock_state=1\nstock['age']=2\nstock['stamina']=${s}\nstock['energy']=${energy}\nstock['half_action']=-1\nstock['well_rested']=2\nstock['brand']=2\ngs 'stock_to_slave_nogt'\n`;
  check(`slave['energy'] = ${Math.min(energy,caps[s])}`,'acquire_'+s+'_'+energy+'_cap_only');check("slave['half_action'] = -1 and slave['well_rested'] = 2",'acquire_'+s+'_'+energy+'_bonus');
 }
 const oldDef=extract(oldDoc,'#static_base','$update_slave_energy_stars = {','$recalc_slave_mood = {');
 for(const role of roles)for(const energy of [0,2]){
  cases++;code+=oldDef+`\n${role}_state=1\n${role}['stamina']=1\n${role}['energy']=${energy}\n${role}['half_action']=0\n${role}_already_done_today['exertion']=0\ngs '$addon','update','full'\ndynamic $replace($update_slave_energy_stars,'dynslave','${role}')\n`;
  check(`${role}['energy'] = ${energy} and ${role}['half_action'] = 0`,'legacy_cache_'+role+'_'+energy);
 }
 for(const role of roles){
  cases++;code+=`${role}_state=1\n${role}['stamina']=1\n${role}['energy']=2\n${role}['half_action']=0\n${role}_rate['stamina']=0\n${role}['calories']=10\neasy_for_${role}=0\ndynamic $replace($dynamic_energy_drop,'dynslave','${role}')\n`;
  check(`${role}['energy'] = 1 and ${role}['half_action'] = 0`,'consume_'+role+'_one');
  code+=`easy_for_${role}=1\ndynamic $replace($dynamic_energy_drop,'dynslave','${role}')\n`;
  check(`2*${role}['energy']-${role}['half_action'] = 1`,'consume_'+role+'_half');check(`${role}_rate['stamina'] = 0 and ${role}['calories'] = 8`,'consume_'+role+'_cost');
 }
 const ui=[];for(const n of ['main_screen','city_screen','slave_private_room1','slave_private_room2','slave_private_room3','slave_private_room4','snk_room_menu_screen']){
  const lines=body(d,n).split('\r\n');for(let i=0;i<lines.length;i++)if(/^jo9_ap_units = 2 \* /.test(lines[i])){const role=(lines[i].match(/2 \* (\w+)\[/)||[])[1];if(!roles.includes(role))continue;let end=i;while(end<lines.length&&!/^\s*\*p /.test(lines[end]))end++;ui.push({role,code:lines.slice(i,end).join('\n')});}
 }
 for(let i=0;i<ui.length;i++)for(let s=0;s<6;s++)for(const half of [1,-1]){
  cases++;const x=ui[i];code+=`${x.role}['stamina']=${s}\n${x.role}['energy']=${caps[s]}\n${x.role}['half_action']=${half}\n${x.role}['neg_exhausted']=0\n${x.role}['well_rested']=0\n`+x.code+'\n';const label='ui_half_'+i+'_'+s+'_'+half;
  check(`jo9_ap_cap = ${caps[s]} and jo9_ap_units = ${2*caps[s]-half}`,label+'_units');check(`${x.role}['energy'] = ${caps[s]} and ${x.role}['half_action'] = ${half}`,label+'_no_refill');
  if(half<0)check("jo9_ap_extra = 1 and instr($jo9_ap_extra_tip,'0.5') > 0",label+'_extra_half');else check(`instr($jo9_ap_cells,'${s===0?'jo9_ap_red_half':'jo9_ap_green_half'}') > 0`,label+'_cell_half');
 }
 code+=extract(d,'next_day','$next_day_energy_refresh = {',"dynamic $do_for_each_slave_in_list, '$next_day_energy_refresh'")+"\n";
 for(const provider of ['assistant','farmhand']){
  cases++;code+=`cow_state=1\ncow['stamina']=1\ncow['energy']=0\ncow['wounds']=3\nmaster_medic=0\nassistant_state=1\nfarmhand_state=1\nassistant['nurse']=0\nfarmhand['nurse']=0\n${provider}['nurse']=4\ndynamic $replace($next_day_energy_refresh,'dynslave','cow')\n`;check("cow['energy'] = 1",'nursing_'+provider);
 }
 code+="msg 'JO9_QA_AP_extended_COMPLETE'\n";const r=run(d,root+'/extended','extended',code);fs.copyFileSync(r.log,rec+'/evidence/extended.log');write(rec+'/extended-results.json',{status:r.results.every(x=>x.pass)?'PASS':'FAIL',cases,assertions:checks,instrumentation:'Only Start replaced. All four constructors, acquisition/swap, old cache definition followed by existing addon full update, consumption and UI calculation blocks executed.',...r});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({cases,assertions:checks,...r}));a(r.results.every(x=>x.pass));
}else if(phase==='green'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp'));let code="usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\nCONST_INT['slave_exist']=1\ncheat_inf_en=0\n",cases=0,checks=0;
 const check=(condition,label)=>{checks++;code+=`if (${condition}) = 0: msg 'FAIL_AP_${label}' & exit\n`;};
 function reset(role,level,energy,half){cases++;code+=`killvar '${role}'\nkillvar '${role}_rate'\nkillvar '${role}_already_done_today'\n${role}_state=1\n${role}['stamina']=${level}\n${role}['energy']=${energy}\n${role}['half_action']=${half}\n${role}['well_rested']=2\n${role}['calories']=10\n${role}_already_done_today['exertion']=0\n`;}
 function norm(role){code+=`dynamic $replace($update_slave_energy_stars,'dynslave','${role}')\n`;}
 const samples=(s,cap)=>[
  ['full',cap,0,cap,0],['zero',0,0,0,0],['old',s,0,s,0],['fatigue',-3,0,-3,0],
  ['bonus',0,-2,cap>0?1:0,cap>0?0:-2],['bonus-half',0,-3,cap>0?1:0,cap>0?-1:-3],
  ['overshoot',cap+1,1,cap,0],['pending',cap,3,cap-1,1],['extra',cap,-4,cap,-4]
 ];
 for(const role of roles)for(let s=0;s<6;s++)for(const [name,en,h,wantE,wantH]of samples(s,caps[s])){
  const label=role+'_'+s+'_'+name;reset(role,s,en,h);norm(role);check(`${role}['energy'] = ${wantE} and ${role}['half_action'] = ${wantH}`,label+'_pair');
  check(`${role}['well_rested'] = 2`,label+'_rest');check(`${role}['stamina'] = ${s}`,label+'_grade');check(`${role}['calories'] = ${name==='pending'?9:10}`,label+'_cost');
  norm(role);norm(role);check(`${role}['energy'] = ${wantE} and ${role}['half_action'] = ${wantH}`,label+'_repeat');
 }
 code+=extract(d,'next_day','$next_day_energy_refresh = {',"dynamic $do_for_each_slave_in_list, '$next_day_energy_refresh'")+"\n";
 for(const role of roles)for(let s=0;s<6;s++)for(const [name,wounds,start,medic,wantDelta]of [
  ['clean',0,0,0,caps[s]],['wounded',1,0,0,caps[s]-1],['fatigued',0,-3,0,caps[s]],['medic',3,0,4,Math.max(1,caps[s]-3)],['severe',5,-2,0,caps[s]-5]
 ]){
  const label='recovery_'+role+'_'+s+'_'+name;reset(role,s,start,0);code+=`master_medic=${medic}\nassistant['nurse']=0\nfarmhand['nurse']=0\n${role}['wounds']=${wounds}\ndynamic $replace($next_day_energy_refresh,'dynslave','${role}')\n`;
  check(`${role}['energy'] = ${start+wantDelta}`,label+'_raw');norm(role);check(`${role}['energy'] = ${Math.max(-5,Math.min(caps[s],start+wantDelta))}`,label+'_cap');check(`${role}['half_action'] = 0 and ${role}['well_rested'] = 2`,label+'_state');
 }
 const ui=[];
 for(const n of ['main_screen','city_screen','slave_private_room1','slave_private_room2','slave_private_room3','slave_private_room4','snk_room_menu_screen']){
  const s=body(d,n).split('\r\n');for(let i=0;i<s.length;i++)if(/^jo9_ap_units = 2 \* /.test(s[i])){
   const role=(s[i].match(/2 \* (\w+)\[/)||[])[1];if(!roles.includes(role))continue;let end=i;while(end<s.length&&!/^\s*\*p /.test(s[end]))end++;ui.push({location:n,role,code:s.slice(i,end).join('\n')});
  }
 }
 a.equal(ui.length,9);
 for(let i=0;i<ui.length;i++)for(let s=0;s<6;s++){
  const x=ui[i],label='ui_'+i+'_'+s;reset(x.role,s,caps[s],0);code+=`${x.role}['neg_exhausted']=0\n`+x.code+'\n';check('jo9_ap_cap = '+caps[s],label+'_cap');
  check(`(len($jo9_ap_cells)-len(replace($jo9_ap_cells,'jo9_ap_locked','')))/13 = ${5-caps[s]}`,label+'_locked');
  check(`instr($jo9_ap_tip,'현재 한도 ${caps[s]} / 기본 상한 5') > 0`,label+'_tip');
 }
 // Repeated definition refresh may replace caches but must never fill used AP.
 for(const role of roles){reset(role,1,0,0);code+="gs 'refresh_database'\ngs 'refresh_database'\n";norm(role);check(`${role}['energy'] = 0 and ${role}['half_action'] = 0`,'refresh_zero_'+role);}
 code+="msg 'JO9_QA_AP_boundaries_COMPLETE'\n";
 const r=run(d,root+'/green','boundaries',code);fs.copyFileSync(r.log,rec+'/evidence/green.log');write(rec+'/green-results.json',{status:r.results.every(x=>x.pass)?'PASS':'FAIL',cases,assertions:checks,uiBlocks:ui.length,instrumentation:'Start only; exact candidate dynamic functions, extracted complete next-day recovery definition, and nine exact UI calculation blocks. Real refresh_database used; no state primer.',...r});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({cases,assertions:checks,...r}));a(r.results.every(x=>x.pass));
}
