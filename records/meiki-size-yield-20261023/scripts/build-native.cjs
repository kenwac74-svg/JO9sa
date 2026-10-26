'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs');
const input=path.resolve(process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp');
const out=path.resolve(process.argv[3]||path.join(__dirname,'run-'+Date.now()));
assert(!fs.existsSync(out),'Use a fresh probe output directory');
const raw=fs.readFileSync(input),doc=core.parse(raw),sourceHash=doc.hash,roles=['slave','assistant','room1','room2','room3','room4'];
const body=name=>{const l=doc.locations.find(l=>l.name===name);assert(l,'Missing '+name);return core.shift(doc.lines[l.body],5);};
const lines=name=>body(name).split(/\r?\n/);
const norm=a=>a.join('\r\n');
function block(a,start){assert(start>=0,'Block start missing');let depth=0;for(let i=start;i<a.length;i++){const t=a[i].trim();if(/^if\b/i.test(t)&&/:\s*(?:!.*)?$/.test(t))depth++;else if(/^end\s*(?:!.*)?$/i.test(t)){depth--;if(depth===0)return a.slice(start,i+1);}}throw Error('Unclosed block at '+start);}
function success(location,role){const a=lines(location),re=new RegExp('^\\s*if '+role+"\\['sub_tentacles'\\] > tentacle_size or "+role+"\\['virginity'\\] = 4:");const at=a.findIndex(x=>re.test(x));return {location,role,line:at+1,code:norm(block(a,at))};}
function report(role){const a=lines('end_day_screen'),at=a.findIndex(x=>new RegExp('^\\s*if '+role+'_auto_tentacle = 3 - end_day_phase:').test(x));return {location:'end_day_screen',role,line:at+1,code:norm(block(a,at))};}
const extracted={auto:roles.map(role=>success('next_day',role)),manual:['dynslave','assistant','slave'].map(role=>success('interaction',role)),reports:roles.map(report)};
const base=[12,18,24,64,126],normal=[[12,12,12,12,12,12,12],[18,12,12,12,12,12,12],[24,18,12,12,12,12,12],[64,24,18,12,12,12,12],[126,64,24,18,12,12,12]],meiki=[[14,14,14,14,14,14,14],[23,15,15,15,15,15,15],[33,25,16,16,16,16,16],[96,36,27,18,18,18,18],[201,102,38,28,19,19,19]];
const setup=["settimer 0","$counter=''","$ongload=''","$onnewloc=''","$ongsave=''",'autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','sound_on=0','assistant_quiet_rule=1','end_day_phase=1','felicity=0',...base.map((x,i)=>'semen_gain['+i+']='+x)];
for(let z=0;z<5;z++)for(let m=0;m<7;m++){setup.push('qa_normal['+(z*7+m)+']='+normal[z][m]);setup.push('qa_meiki['+(z*7+m)+']='+meiki[z][m]);}
const q=t=>"'"+String(t).replaceAll("'","''")+"'";
function ck(condition,label){return 'if ('+condition+') = 0: msg '+q('JO9_QA_FAIL_'+label)+' & exit';}
function state(role){return ["killvar '$text'",...roles.concat('dynslave').map(r=>r+"['virginity']=iif(qa_state=4,0,4)"),...roles.concat('dynslave').map(r=>'$'+r+"_name="+q('QA_'+r)),...roles.concat('dynslave').map(r=>r+"['sub_tentacles']=6"),role+"['virginity']=qa_state",'tentacle_size=qa_size','spawn_milked=qa_milked','spawn_semen=101','decade_semen=201','tentacle_hp=0','qa_expected=iif(qa_state=4,qa_meiki[qa_size*7+qa_milked],qa_normal[qa_size*7+qa_milked])'].join('\r\n');}
const expectedPath=path.join(__dirname,'..','prepared.json');
const expectedMeta=fs.existsSync(expectedPath)?JSON.parse(fs.readFileSync(expectedPath,'utf8')):null;
if(expectedMeta && body('next_day').includes('jo9_tentacle_report'))assert.equal(expectedMeta.after,sourceHash,'Candidate differs from prepared expected prose source');
function expectedSpecial(role,amount,pct){assert(expectedMeta?.sourceProse,'Independent approved prose required');return expectedMeta.sourceProse.replace('<<$slave_name>>','QA_'+role).replace('[실제 획득량]',String(amount)).replace('[증가율]',String(pct));}
function textLiterals(code){return core.literals(code).filter(e=>{const prefix=code.slice(code.lastIndexOf('\n',e.start-1)+1,e.start);return /\$text(?:\[1\])?\s*=\s*['"]$/.test(prefix);}).map(e=>e.text);}
function expectedOrdinary(role,code,amount){const arr=textLiterals(code),raw=arr.find(x=>x.includes('이전 경험 덕분에')&&!x.includes('명기 효과'));assert(raw,'Ordinary literal missing '+role);return raw.replaceAll('<<$'+role+'_name>>','QA_'+role).replace(/<<jo9_tentacle_report\['[^']+_gain'\]>>/g,String(amount));}
setup.push(...[20,30,40,50,60].map((x,i)=>'qa_pct['+i+']='+x));
const fragments=[];
function add(name,code){fragments.push({name,code});return "gs '"+name+"'";}
let numeric=setup.join('\r\n')+'\r\n';let cases=0;
for(const row of extracted.auto){const call=add('qa_auto_'+row.role,row.code);numeric+='for qa_size=0 to 4:\r\n for qa_milked=0 to 6:\r\n  for qa_state=0 to 4:\r\n'+state(row.role)+'\r\n'+call+'\r\n'+ck('spawn_semen=101+qa_expected','auto_'+row.role+'_gain')+'\r\n'+ck('spawn_milked=qa_milked','auto_'+row.role+'_capture_does_not_advance')+'\r\n  end\r\n end\r\nend\r\n';cases+=175;}
for(const row of extracted.manual){const call=add('qa_manual_'+row.role,row.code);numeric+='for qa_size=0 to 4:\r\n for qa_milked=0 to 6:\r\n  for qa_state=0 to 4:\r\n'+state(row.role)+'\r\n'+call+'\r\n'+ck('spawn_semen=101+qa_expected','manual_'+row.role+'_gain')+'\r\n  end\r\n end\r\nend\r\n';cases+=175;}
numeric+="msg 'JO9_QA_MEIKI_yield_matrix_COMPLETE'";
// Candidate report tests are emitted once snapshot schema appears; baseline still runs real old grants to RED.
let delayed=setup.join('\r\n')+'\r\n',delayedCases=0;
const hasSnapshot=body('next_day').includes('jo9_tentacle_report');
if(hasSnapshot){for(const row of extracted.auto){const role=row.role,reportRow=extracted.reports.find(r=>r.role===role),callAuto="gs 'qa_auto_"+role+"'",callReport=add('qa_report_'+role,reportRow.code);
 for(const [size,milked,reportedSize,reportedMilked,amount,pct]of [[0,0,4,0,14,20],[4,0,0,6,201,60],[2,1,3,6,25,40]]){
  delayed+='qa_size='+size+'\r\nqa_milked='+milked+'\r\nqa_state=4\r\n'+state(role)+'\r\n'+callAuto+'\r\n'+ck('spawn_semen='+String(101+amount),'delayed_'+role+'_capture_'+size)+'\r\n'+ck("jo9_tentacle_report['"+role+"_gain']="+amount+" and jo9_tentacle_report['"+role+"_bonus']="+pct,'delayed_'+role+'_snapshot_'+size)+'\r\ntentacle_size='+reportedSize+'\r\nspawn_milked='+reportedMilked+'\r\n'+role+'_auto_tentacle=2\r\n'+callReport+'\r\n'+ck('spawn_semen='+String(101+amount),'delayed_'+role+'_no_topup_'+size)+'\r\n'+ck('decade_semen='+String(201+amount),'delayed_'+role+'_tally_'+size)+'\r\n$qa_expected_text='+q(expectedSpecial(role,amount,pct))+'\r\n'+ck('$text=$qa_expected_text','delayed_'+role+'_exact_text_'+size)+'\r\n'+ck("instr($text,'<'+'<')=0",'delayed_'+role+'_no_unresolved_'+size)+'\r\n'+callReport+'\r\n'+ck('spawn_semen='+String(101+amount)+' and decade_semen='+String(201+amount),'delayed_'+role+'_no_double_'+size)+'\r\n';delayedCases++;
 }
 delayed+="killvar 'jo9_tentacle_report'\r\nqa_size=2\r\nqa_milked=1\r\nqa_state=4\r\n"+state(role)+'\r\n'+role+'_auto_tentacle=2\r\n'+callReport+'\r\n'+ck('spawn_semen=101','legacy_'+role+'_no_topup')+'\r\n'+ck('decade_semen=219','legacy_'+role+'_oldbase_18')+'\r\n'+ck("jo9_tentacle_report['"+role+"_bonus']=0",'legacy_'+role+'_bonus_zero')+'\r\n$qa_expected_text='+q(expectedOrdinary(role,reportRow.code,18))+'\r\n'+ck('$text=$qa_expected_text','legacy_'+role+'_exact_ordinary')+'\r\n'+callReport+'\r\n'+ck('spawn_semen=101 and decade_semen=219','legacy_'+role+'_no_double')+'\r\n';delayedCases++;
 }
 // Execute the actual cached lesson success block using the production dynslave replacement mechanism.
 const cached=extracted.manual.find(r=>r.role==='dynslave').code;
 for(const role of ['slave','assistant']){const call=add('qa_cached_'+role,"local $qa_cached={\r\n"+cached+"\r\n}\r\ndynamic $replace($qa_cached, 'dyn'+'slave', '"+role+"')");delayed+='qa_size=4\r\nqa_milked=0\r\nqa_state=4\r\n'+state(role)+'\r\n'+call+'\r\n'+ck('spawn_semen=302','cached_'+role+'_gain')+'\r\n$qa_expected_text='+q(expectedSpecial(role,201,60))+'\r\n'+ck('$text[1]=$qa_expected_text','cached_'+role+'_exact_text')+'\r\n';delayedCases++;}
 // Manual special strings use direct expressions. Check their independently approved prose at each size.
 for(const row of extracted.manual){const role=row.role;delayed+='for qa_size=0 to 4:\r\n qa_milked=0\r\n qa_state=4\r\n'+state(role)+"\r\ngs 'qa_manual_"+role+"'\r\n$qa_expected_text="+q(expectedSpecial(role,'<<qa_expected>>','<<qa_pct[qa_size]>>'))+'\r\n'+ck('$text[1]=$qa_expected_text','manual_'+role+'_exact_text')+'\r\nend\r\n';delayedCases+=5;}
 // The production reset statements remove stale per-day gains in both existing entry points.
 for(const location of ['next_day','init_game']){const a=lines(location),reset=a.filter(x=>x.trim()==="killvar 'jo9_tentacle_report'");assert.equal(reset.length,1,'Exactly one reset in '+location);const call=add('qa_reset_'+location,norm(reset));delayed+="jo9_tentacle_report['slave_gain']=999\r\n"+call+'\r\n'+ck("arrsize('jo9_tentacle_report')=0",'reset_'+location)+'\r\n';delayedCases++;}
 const cap=lines('$newloc').filter(x=>x.trim()==='if spawn_semen > estate_size[$estate]: spawn_semen = estate_size[$estate]');assert.equal(cap.length,1,'Original storage cap statement');const capCall=add('qa_cap',norm(cap));delayed+="$estate='qa'\r\nestate_size['qa']=50\r\nspawn_semen=99999\r\n"+capCall+'\r\n'+ck('spawn_semen=50','cap_upper')+'\r\nspawn_semen=49\r\n'+capCall+'\r\n'+ck('spawn_semen=49','cap_below')+'\r\n';delayedCases+=2;
 delayed+="msg 'JO9_QA_MEIKI_delayed_report_COMPLETE'";
}
fs.mkdirSync(out,{recursive:true});fs.copyFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/config.xml',path.join(out,'config.xml'));fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
function world(name,start){const locs=[{name:'Start',code:start},...fragments,{name:'display_pic',code:"$result=''"}];const a=['QSPGAME','','',core.shift(String(locs.length),-5)];for(const l of locs)a.push(core.shift(l.name,-5),'',core.shift(l.code,-5),core.shift('0',-5));a.push('');const bytes=Buffer.from(a.join('\r\n'),'utf16le');assert(core.serialize(core.parse(bytes)).equals(bytes));const file=path.join(out,name+'.qsp');fs.writeFileSync(file,bytes);return file;}
const probes=[{name:'yield-matrix',code:numeric,marker:'JO9_QA_MEIKI_yield_matrix_COMPLETE',checkpoint:'Actual nine production award blocks; 1575 fixed-table native cases'}];if(hasSnapshot)probes.push({name:'delayed-report',code:delayed,marker:'JO9_QA_MEIKI_delayed_report_COMPLETE',checkpoint:'Actual auto capture/report; stage reset, legacy fallback, no topup/double tally'});
const plan=probes.map(p=>({name:p.name,file:world(p.name,p.code),marker:p.marker,checkpoint:p.checkpoint}));fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify(plan,null,2));fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({input,sourceHash,hasSnapshot,matrixCases:cases,delayedCases,extracted,expectedTables:{normal,meiki},limits:['Executes extracted actual production grant/report blocks, not full household scheduling, refusal flow or gameplay.','Minimal diagnostic display_pic returns empty. No savegame files are read or written.']},null,2));assert.equal(core.hash(fs.readFileSync(input)),sourceHash);console.log(JSON.stringify({plan:path.join(out,'plan.json'),sourceHash,hasSnapshot,matrixCases:cases,delayedCases}));
