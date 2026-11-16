'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(R+'/tools/text-workshop/core.cjs');
const T='G:/Codex/tmp/hard-visibility-20261115',D=R+'/records/hard-visibility-20261115';
const nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const raw=fs.readFileSync(process.argv[3]||W+'/jack.qsp'),doc=c.parse(raw);
const body=n=>c.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
const stage=process.argv[2]||'red',dir=T+'/'+stage;
assert(['red','green'].includes(stage));fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(D,{recursive:true});
let start="killall\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\nCONST_INT['no_slave']=0\nqa_checks=0\nqa_failed=0\n";
function check(expr,want,desc){start+=`qa_checks+=1\nif ${expr}!${typeof want==='string'?q(want):want}:\n qa_failed+=1\n $qa_errors[]=${q(desc||expr)}\nend\n`;}
const attrs=['beauty','exotic','fat','style','fame','mood','stamina','temper','intellect','sensitivity','pride','ego'];
const always=attrs.slice(0,6),middle=attrs.slice(6,9);
for(const role of ['slave','assistant','room1','room4','prisoner','cow','iced_1','stock','seed'])
 for(const mage of [0,1,2,3,4,5,6])for(const days of [0,9,10])for(const spell of [0,1]){
  start+=`difficulty_setting=2\nmaster_mage=${mage}\nspell_revelio=${spell}\n${role}['age_count']=200\n${role}['jo9_observation_days']=${days}\n`;
  for(const key of attrs){const expected=always.includes(key)||mage>=4||spell===1||(mage>=2&&middle.includes(key))||(!['stock','seed'].includes(role)&&days>=10);check(`func('jo9_attribute_visibility','visible',${q(role)},${q(key)})`,+expected,`${role}/${mage}/${days}/${spell}/${key}`);}
 }
for(const diff of [0,1]){start+=`difficulty_setting=${diff}\nmaster_mage=0\nspell_revelio=0\nslave['jo9_observation_days']=0\n`;for(const key of attrs)check(`func('jo9_attribute_visibility','visible','slave',${q(key)})`,1,'normal/easy '+key);}
// Legacy occupants of every container retain complete visibility; stock is not owned.
const owned=['slave','assistant','prisoner','cow','room1','room2','room3','room4','farmhand','harpy','pig',...Array.from({length:18},(_,i)=>'iced_'+(i+1)),'snk_parked_slave'];
start+="jo9_observation_revision=0\nstock_state=1\nstock['jo9_observation_days']=0\n";
for(const role of owned)start+=`${role}_state=1\n${role}['jo9_observation_days']=0\n`;
start+="gs 'jo9_attribute_visibility','legacy'\n";
for(const role of owned)check(`${role}['jo9_observation_days']`,10,'legacy '+role);
check('jo9_observation_revision',1);check("stock['jo9_observation_days']",0,'unowned legacy excluded');
start+="room4['jo9_observation_days']=0\ngs 'jo9_attribute_visibility','legacy'\n";check("room4['jo9_observation_days']",0,'reload does not unlock new acquisition');
start+="jo9_observation_revision=0\ngs 'jo9_attribute_visibility','newgame'\n";check('jo9_observation_revision',1,'new game skips legacy grant');check("room4['jo9_observation_days']",0);
// Exercise the real per-person day callback, including age_count preservation.
const nb=body('next_day'),match=nb.match(/\$next_day_age_count_update = \{([\s\S]*?)\r\n\}/);assert(match,'day callback');
const callback=match[1];
for(const role of owned){start+=`${role}_state=1\n${role}['age_count']=200\n${role}['jo9_observation_days']=0\n`;
 start+='dynamic '+q(callback.replaceAll('dynslave',role))+'\n';
 check(`${role}['age_count']`,201,'age_count preserved '+role);
 check(`${role}['jo9_observation_days']`,['slave','assistant','room1','room2','room3','room4'].includes(role)?1:0,'eligible days '+role);
}
start+="slave_state=0\nslave['jo9_observation_days']=0\ngs 'jo9_attribute_visibility','tick','slave'\n";check("slave['jo9_observation_days']",0,'empty slot');
start+="slave_state=1\nslave['jo9_observation_days']=9\ngs 'jo9_attribute_visibility','tick','slave'\ngs 'jo9_attribute_visibility','tick','slave'\n";check("slave['jo9_observation_days']",10,'counter saturates');
start+="slave['jo9_observation_days']=4\ncopyarr 'prisoner','slave'\nprisoner_state=1\ngs 'jo9_attribute_visibility','tick','prisoner'\n";check("prisoner['jo9_observation_days']",4,'prison pause');
start+="copyarr 'room1','prisoner'\nroom1_state=1\ngs 'jo9_attribute_visibility','tick','room1'\n";check("room1['jo9_observation_days']",5,'return resumes');
// Evaluate existing real UI interpolation and tooltip expressions at tier boundaries.
const render=read(R+'/records/hard-attribute-visibility-20261112/plan.json').render;
for(const row of render){const role=row.role==='dynslave'?'room2':row.role,expr=row.expression.replaceAll('dynslave','room2');
 start+=`difficulty_setting=2\nmaster_mage=0\nspell_revelio=0\n${role}['jo9_observation_days']=0\n`;
 if(row.seed)start+=`seed_${row.key}[7000]=5\nslave_type=7000\ns_type=7000\n`;else start+=`${role}['${row.key}']=5\n`;
 start+=`$${row.key}[5]='VALUE_SECRET_5'\n$tooltip_text='SECRET_NUMBER_99'\n$qa_render='<div><<${expr}>></div>'\n`;
 check("instr($qa_render,'미확인')>0 and instr($qa_render,'VALUE_SECRET_5')=0",1,'masked '+row.location+'/'+row.key);
 start+=`master_mage=4\n$qa_render='<div><<${expr}>></div>'\n`;check("instr($qa_render,'VALUE_SECRET_5')>0",1,'A renders '+row.location+'/'+row.key);
 start+=`master_mage=2\n$qa_render='<div><<${expr}>></div>'\n`;check("instr($qa_render,'VALUE_SECRET_5')>0",+middle.includes(row.key),'C renders '+row.location+'/'+row.key);
 if(row.tooltip){start+=`master_mage=0\n$qa_render='<div title="<<func("jo9_attribute_visibility","tooltip","${role}","${row.key}",$tooltip_text)>>"></div>'\n`;check("instr($qa_render,'SECRET_NUMBER_99')",0,'tooltip leak '+row.location+'/'+row.key);}
}
start+="slave['stamina']=4\nslave['sensitivity']=3\nslave['age_count']=199\nslave['jo9_observation_days']=0\nmaster_mage=0\nspell_revelio=0\n$qa_unused=func('jo9_attribute_visibility','text','slave','sensitivity','KEEP')\n";
check("slave['stamina']",4);check("slave['sensitivity']",3);check("slave['age_count']",199);
start+="room1['jo9_observation_days']=7\nprisoner['jo9_observation_days']=4\n";
start+=`savegame 'qa.sav'\nif qa_failed>0: msg 'FAIL hardvis '+str(qa_failed)+' '+$qa_errors[0] & exit\nmsg 'JO9_QA_HARDVIS_${stage}_COMPLETE'\nexit`;
const locs=[['Start',start],['jo9_attribute_visibility',body('jo9_attribute_visibility')]];
const lines=['QSPGAME','','',c.shift(String(locs.length),-5)];for(const[n,b]of locs)lines.push(c.shift(n,-5),'',c.shift(nl(b),-5),c.shift('0',-5));lines.push('');
fs.copyFileSync(W+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(dir+'/test.qsp',c.serialize({lines}));
const plan=[{name:'hard-visibility',file:dir+'/test.qsp',marker:`JO9_QA_HARDVIS_${stage}_COMPLETE`,checkpoint:'Magic tiers, eligible residence days, legacy retention, fresh acquisitions, real UI and tooltip expressions'}];
fs.writeFileSync(dir+'/plan.json',JSON.stringify(plan,null,2));
fs.writeFileSync(D+'/'+stage+'-fixture.json',JSON.stringify({sourceHash:c.hash(raw),assertions:(start.match(/qa_checks\+=1/g)||[]).length,fixtureHash:c.hash(fs.readFileSync(dir+'/test.qsp')),planPath:dir+'/plan.json'},null,2));
console.log(JSON.stringify({stage,assertions:(start.match(/qa_checks\+=1/g)||[]).length,plan:dir+'/plan.json'}));
