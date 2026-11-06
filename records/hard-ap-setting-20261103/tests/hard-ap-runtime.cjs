'use strict';
// Executes source expressions and dynamic functions extracted from the supplied QSP.
// The only synthetic game code is fixture setup and assertions. Production inputs are read-only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const defaults={vendor:'G:/Codex/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/fog-relay-startup-fix-20261017/legacy-engine-probe/package'};
const args=process.argv.slice(2),opts={};for(let i=0;i<args.length;i+=2){if(!args[i].startsWith('--')||args[i+1]===undefined)throw Error('Expected --option value');opts[args[i].slice(2)]=args[i+1];}
if(!opts.qsp||!opts.report)throw Error('--qsp and --report required');
const vendor=opts.vendor||defaults.vendor,{initQspEngine}=require(vendor+'/dist/node/wasm-engine.cjs');
const raw=fs.readFileSync(opts.qsp),doc=core.parse(raw),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const body=name=>{const l=doc.locations.find(l=>l.name===name);if(!l)throw Error('Missing location '+name);return core.shift(doc.lines[l.body],5);};
function definition(location,name){const s=body(location),start=s.indexOf(name+' = {'),tail=s.slice(start),m=tail.match(/\r\n[ \t]*\}/);if(start<0||!m)throw Error('Missing complete definition '+name);return tail.slice(0,m.index+m[0].length);}
function parens(s,at){let depth=0,quote='';for(let i=at;i<s.length;i++){const x=s[i];if(quote){if(x===quote){if(s[i+1]===quote)i++;else quote='';}continue;}if(x==="'"||x==='"'){quote=x;continue;}if(x==='(')depth++;else if(x===')'&&!--depth)return i+1;}throw Error('Unclosed expression');}
const expressions=[];
for(const loc of doc.locations){const s=body(loc.name),re=/\biif\(([A-Za-z_]\w*)\['stamina'\] > 0, min\(5, /g;let m;while((m=re.exec(s))){const end=parens(s,m.index+3),expression=s.slice(m.index,end);if(!expression.includes("['stamina'] + "))continue;expressions.push({location:loc.name,line:s.slice(0,m.index).split('\r\n').length,actor:m[1],expression});re.lastIndex=end;}}
if(expressions.length!==17)throw Error('Expected all 17 AP expressions, found '+expressions.length);
const fullEnergyDefinition=definition('#static_base','$update_slave_energy_stars');
const capEnd=fullEnergyDefinition.indexOf('! JO9 MOD END AP_CURVE_CAP');
if(capEnd<0)throw Error('Missing AP_CURVE_CAP boundary');
// Native FastQSP renderer uses FOR, unsupported by this legacy WASM build.
// Keep the real function prefix and state gate through the exact cap block.
const normalizationDefinition=fullEnergyDefinition.slice(0,capEnd+'! JO9 MOD END AP_CURVE_CAP'.length)+'\r\n\tend\r\n}';
const masterDefinition=definition('$calculate_attributes','$update_master_energy_stars');
const masterClamp="master_energy = max(-5, min(5, master_energy))",masterClampAt=masterDefinition.indexOf(masterClamp);
if(masterClampAt<0)throw Error('Missing master cap');
const masterNormalizationDefinition=masterDefinition.slice(0,masterClampAt+masterClamp.length)+'\r\n}';
const definitions=[normalizationDefinition,masterNormalizationDefinition,definition('#dynamic','$dynamic_energy_drop'),definition('#static_base','$do_for_each_slave_in_list'),definition('next_day','$next_day_energy_refresh')].join('\r\n');
const carryLine=body('next_day').split('\r\n').find(x=>x.includes("dynslave['half_action'] = max(dynslave['stamina'] * -2, dynslave['half_action'])"));
if(!carryLine)throw Error('Missing existing overnight half-action carry cap');
const fixture=Buffer.from(['QSPGAME','','',core.shift('1',-5),core.shift('Start',-5),'','',core.shift('0',-5),''].join('\r\n'),'utf16le');
const quote=s=>"'"+s.replaceAll("'","''")+"'",report={createdAt:new Date().toISOString(),input:path.resolve(opts.qsp),inputSha256:sha(raw),enginePackage:vendor,engineWasmSha256:sha(fs.readFileSync(vendor+'/dist/qsp-engine.wasm')),expressions:expressions.map(({location,line,actor})=>({location,line,actor})),groups:{},failures:[],limits:[
 'Actual QSP 5.8.0 WASM engine execution of extracted candidate functions and expressions; no JavaScript implementation of AP logic.',
 'Synthetic actor setup; does not load a personal SAV, run the whole next_day lifecycle, create/acquire actual actors, or verify GUI appearance.',
 'Energy normalization uses the exact source prefix through AP_CURVE_CAP with its real state gate; the FastQSP FOR-based renderer is excluded from WASM execution.',
 'Creation/acquisition/tutorial/UI paths are covered by executing their actual 17 AP expressions; surrounding lifecycle behavior is not executed.',
 'No changes to WORK, Full, tracked source, or save files.'
]};
let total=0;
function check(group,name,actual,expected){total++;const g=report.groups[group]||(report.groups[group]={passed:0,failed:0});if(JSON.stringify(actual)===JSON.stringify(expected))g.passed++;else{g.failed++;report.failures.push({group,name,actual,expected});}}
(async()=>{
 const api=await initQspEngine(vendor+'/dist/qsp-engine.wasm'),errors=[];api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1);});
 api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 function run(s){const at=errors.length;api.execCode(s.replace(/\r\n|\r|\n/g,'\r\n'));if(errors.length!==at)throw Error('QSP execution error '+JSON.stringify(errors.slice(at))+'\n'+s.slice(0,700));}
 function num(s){run('qa_number='+s);return Number(api.readVariable('qa_number'));}
 function str(s){run('$qa_string='+s);return api.readVariable('$qa_string');}
 run(definitions);run("CONST_INT['no_slave']=0\nCONST_INT['slave_exist']=1\nCONST_INT['slave_faint']=2\ncheat_inf_en=0\nmaster_energy=4\nmaster_half_action=1");
 const curve=[[0,2,3,4,5,5],[0,2,3,4,5,5],[0,1,2,3,4,5]];
 // Every actual AP expression is evaluated; game_difficulty is independently varied.
 for(const item of expressions)for(let d=0;d<3;d++)for(let s=0;s<=5;s++)for(const creation of [0,2]){
  run(`difficulty_setting=${d}\ngame_difficulty=${creation}\n${item.actor}['stamina']=${s}`);
  check('all-17-expressions',`${item.location}:${item.line} D${d} S${s} G${creation}`,num(item.expression),curve[d][s]);
 }
 function setup(role,s,e,h,d=2,state=1){run(`killvar '${role}'\nkillvar '${role}_rate'\nkillvar '${role}_already_done_today'\n${role}_state=${state}\n${role}['stamina']=${s}\n${role}['energy']=${e}\n${role}['half_action']=${h}\n${role}_already_done_today['exertion']=-1\ndifficulty_setting=${d}\ngame_difficulty=0\neasy_for_${role}=0\nassistant_state=${role==='assistant'?state:0}\nfarmhand_state=${role==='farmhand'?state:0}\nmaster_medic=0`);}
 function dynamicFor(name,role){run('dynamic $replace('+name+", 'dynslave', "+quote(role)+')');}
 function state(role){return[num(`${role}['energy']`),num(`${role}['half_action']`)];}
 const roles=['slave','assistant','room1','room2','room3','room4','farmhand','iced_2'];
 for(const role of roles)for(let d=0;d<3;d++)for(let s=0;s<=5;s++){
  setup(role,s,10,0,d);dynamicFor('$update_slave_energy_stars',role);
  check('normalization-curve',`${role} D${d} S${s}`,state(role),[curve[d][s],0]);
 }
 // Explicit expected state pairs establish preservation of spent and bonus halves.
 const halfCases=[
  ['spent-half',2,1,[2,1]],['bonus-half-at-cap',2,-1,[2,-1]],
  ['bonus-three-halves',1,-3,[2,-1]],['bonus-three-halves-from-zero',0,-3,[1,-1]],
  ['excess-refills-half',3,1,[2,0]],['negative-with-half',-2,1,[-2,1]],
  ['energy-floor',-7,0,[-5,0]],['spent-three-halves',2,3,[1,1]],['spent-four-halves',2,4,[0,0]],
  ['bonus-retained-at-cap',2,-3,[2,-3]],['unspent-base',1,0,[1,0]]
 ];
 for(const [name,e,h,want]of halfCases){setup('slave',2,e,h);dynamicFor('$update_slave_energy_stars','slave');check('half-action-and-floor',name,state('slave'),want);}
 // Absent/dead actors are not normalized; fainted actors are.
 for(const [st,want]of [[-1,[7,-3]],[0,[7,-3]],[2,[2,-3]]]){setup('slave',2,7,-3,2,st);dynamicFor('$update_slave_energy_stars','slave');check('state-gates','normalization state '+st,state('slave'),want);}
 // Difficulty switching changes cap, does not refill energy upon returning to easy/normal.
 for(const from of [0,1])for(const back of [0,1]){setup('slave',2,3,0,from);dynamicFor('$update_slave_energy_stars','slave');run('difficulty_setting=2');dynamicFor('$update_slave_energy_stars','slave');check('setting-switch',`${from}->hard`,state('slave'),[2,0]);run('difficulty_setting='+back);dynamicFor('$update_slave_energy_stars','slave');check('setting-switch',`hard->${back}`,state('slave'),[2,0]);}
 function recovery(role,s,w,e,d,support={}){setup(role,s,e,0,d,support.state===undefined?1:support.state);run(`${role}['wounds']=${w}\nassistant_state=${support.assistant===undefined?0:1}\nassistant['nurse']=${support.assistant||0}\nfarmhand_state=${support.farmhand===undefined?0:1}\nfarmhand['nurse']=${support.farmhand||0}\nmaster_medic=${support.master||0}\nkillvar '$livestock_slave_characters'`);if(support.livestock)run('$livestock_slave_characters[0]='+quote(role));dynamicFor('$next_day_energy_refresh',role);return num(`${role}['energy']`);}
 for(let d=0;d<3;d++)for(let s=0;s<=5;s++){check('daily-curve',`D${d} S${s} negative carry`,recovery('slave',s,0,-2,d),-2+curve[d][s]);}
 const recoveryCases=[
  ['no-wound',2,0,-2,{},0],['equal-stamina-wound',2,2,0,{},0],['greater-wound-negative',2,3,0,{},-1],
  ['medical-equal-no-floor',2,3,0,{master:3},-1],['medical-higher-floor',2,3,0,{master:4},1],
  ['assistant-equal-no-floor',2,3,0,{assistant:3},-1],['assistant-higher-floor',2,3,0,{assistant:4},1],
  ['farmhand-equal-livestock',2,3,0,{farmhand:3,livestock:true},-1],['farmhand-higher-livestock',2,3,0,{farmhand:4,livestock:true},1],
  ['farmhand-higher-not-livestock',2,3,0,{farmhand:4},-1],['stamina-zero-no-support',0,0,-2,{},-2],
  ['stamina-zero-medical',0,0,-2,{master:1},-1],['fainted-included',2,0,-2,{state:2},0],
  ['absent-skipped',2,0,-2,{state:0},-2],['dead-skipped',2,0,-2,{state:-1},-2],
  ['negative-energy-additive',2,0,-4,{},-2]
 ];
 for(const [name,s,w,e,support,want]of recoveryCases)check('daily-wound-medical',name,recovery('slave',s,w,e,2,support),want);
 // Execute the real unfrozen list dispatcher, preserving frozen actors until included.
 run("killvar '$unfrozen_slave_characters'\n$unfrozen_slave_characters[0]='slave'\n$unfrozen_slave_characters[1]='room1'\n$unfrozen_slave_characters[2]='assistant'");
 for(const role of ['slave','room1','assistant','iced_2']){setup(role,2,-2,0,2,role==='room1'?2:1);run(`${role}['wounds']=0`);}
 run("assistant_state=1\nassistant['nurse']=0\ndynamic $do_for_each_slave_in_list, '$next_day_energy_refresh', '$unfrozen_slave_characters'");
 check('unfrozen-dispatch','active+fainted+assistant+excluded frozen',['slave','room1','assistant','iced_2'].map(r=>num(r+"['energy']")),[0,0,0,-2]);
 run("$unfrozen_slave_characters[3]='iced_2'\ndynamic $do_for_each_slave_in_list, '$next_day_energy_refresh', '$unfrozen_slave_characters'");
 check('unfrozen-dispatch','newly thawed actor included',num("iced_2['energy']"),0);
 // Existing overnight bonus cap is source-executed, not changed to the new AP cap.
 for(const [s,h,want]of [[0,-3,0],[1,-3,-2],[2,-7,-4],[5,-11,-10],[2,-3,-3],[2,1,1]]){setup('slave',s,0,h);run(carryLine.replaceAll('dynslave','slave'));check('overnight-bonus-cap',`S${s} H${h}`,num("slave['half_action']"),want);}
 check('master-unchanged','master AP sentinel',[num('master_energy'),num('master_half_action')],[4,1]);
 for(let d=0;d<3;d++)for(const [e,h,want]of [[10,1,[5,0]],[4,-3,[5,-1]],[-8,0,[-5,0]]]){run(`difficulty_setting=${d}\nmaster_energy=${e}\nmaster_half_action=${h}\ndynamic $update_master_energy_stars`);check('master-real-normalization',`D${d} E${e} H${h}`,[num('master_energy'),num('master_half_action')],want);}
 report.engineVersion=api.version();report.passed=total-report.failures.length;report.failed=report.failures.length;report.total=total;report.inputUnchanged=sha(fs.readFileSync(opts.qsp))===report.inputSha256;if(!report.inputUnchanged)throw Error('Read-only input changed during test');report.verdict=report.failed?'FAIL':'PASS';fs.writeFileSync(opts.report,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({verdict:report.verdict,total,passed:report.passed,failed:report.failed,engine:report.engineVersion,sha256:report.inputSha256,groups:report.groups}));process.exitCode=report.failed?1:0;
})().catch(e=>{console.error(e.stack||e);process.exitCode=2;});
