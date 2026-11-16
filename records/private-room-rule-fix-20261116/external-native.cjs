'use strict';
const fs=require('fs'),a=require('node:assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/private-rule-external-20261116';
const c=require(R+'/tools/text-workshop/core.cjs'),mode=process.argv[2];a(['red','green'].includes(mode));
let raw=fs.readFileSync(process.env.JO9_EXTERNAL_BASELINE||W+'/jack.qsp');
if(fs.existsSync(__dirname+'/patch.json')){const p=JSON.parse(fs.readFileSync(__dirname+'/patch.json','utf8'));if(c.hash(raw)===p.after_sha256){const old=c.parse(raw);for(const e of [...p.edits].reverse()){const l=old.locations.find(l=>l.name===e.location),b=c.shift(old.lines[l.body],5);a.equal(b.split(e.new).length,2);old.lines[l.body]=c.shift(b.replace(e.new,()=>e.old),-5);}raw=c.serialize(old);}}
const d=c.parse(raw);a.equal(c.hash(raw),'a244ee964f0aaa1ffd6f0d0696242fa0b2bf6b46841cb3b8df2ca9e7747a416a');
const bodies=new Map(d.locations.map(l=>[l.name,c.shift(d.lines[l.body],5)]));
if(mode==='green')for(const e of JSON.parse(fs.readFileSync(__dirname+'/external-edits.json','utf8')).edits){const b=bodies.get(e.location);a.equal(b.split(e.old).length,2,e.location+' edit anchor');bodies.set(e.location,b.replace(e.old,()=>e.new));}
const blocked={cooks_rule:'1r',cleans_rule:'2r',washes_master_rule:'3r',pet_rule:'6r',silence_rule:'7r',toilet_rule:'8r',urinal_rule:'9r',no_shit_rule:'10r',tentacle_rule:'11r'};
const allowed={blowjob_rule:'4r',humility_rule:'5r',no_orgasm_rule:'9_5r',masturbation_rule:'12r',v_balls_rule:'13r',force_rules:'14r'};
const q=s=>"'"+s.replaceAll("'","''")+"'",nl=s=>s.replace(/\r?\n/g,'\r\n');
const check=(expr,label)=>`qa_checks+=1\r\nif ${expr}: msg 'FAIL_${label}' & exit\r\n`;
const prefix="killall\r\n$onnewloc=''\r\n$ongload=''\r\n$counter=''\r\nsettimer 0\r\nqa_checks=0\r\nCONST_INT['slave_exist']=1\r\nCONST_INT['no_slave']=0\r\nCONST_INT['loli_age']=1\r\nkitchen=1\r\nbath=1\r\npet_tentacle=1\r\ninventory['vaginal_balls']=1\r\n";
function roomInit(n){return nl(`room${n}_state=1
room${n}['stamina']=4
room${n}['gladiatrix']=4
room${n}['service']=4
room${n}['cook']=4
room${n}['secretary']=4
room${n}['alchemy']=4
room${n}['petting']=4
room${n}['oral']=4
room${n}['penetration']=4
room${n}['virginity']=2
room${n}['age']=2
room${n}['energy']=5
room${n}['wounds']=0
$room${n}['armor']='кольчуга'
$room${n}['right_wpn']='гладиус'
$room${n}['left_wpn']='безоружный'
$room${n}['back_wpn']=''
`);}
function flags(n,value){return [...Object.keys(blocked),...Object.keys(allowed)].map(k=>`room${n}[${q(k)}]=${value}\r\n`).join('');}
let set=prefix,daily=prefix;for(let n=1;n<=4;n++){set+=roomInit(n);daily+=roomInit(n);}
let setCases=0,dailyCases=0,uiCases=0;
for(let n=1;n<=4;n++)for(let duty=0;duty<=4;duty++)for(const repeat of [0,1]){
 set+=flags(n,1)+`room${n}['duty']=${repeat?duty:0}\r\nroom${n}['duty_rules']=1\r\ngs 'jo9_room_duty','set',${n},${duty}\r\n`;
 for(const k of Object.keys(blocked)){const expected=duty>=2?0:1;set+=check(`room${n}[${q(k)}] ! ${expected}`,'SET_'+n+'_'+duty+'_'+repeat+'_'+k);}
 for(const k of Object.keys(allowed))set+=check(`room${n}[${q(k)}] ! 1`,'SET_ALLOWED_'+n+'_'+duty+'_'+repeat+'_'+k);
 set+=check(`$room${n}['armor'] ! 'кольчуга' or $room${n}['right_wpn'] ! 'гладиус'`,'SET_EQUIP_'+n+'_'+duty+'_'+repeat);setCases++;
}
for(let n=1;n<=4;n++)for(let duty=0;duty<=4;duty++){
 daily+=flags(n,1)+`room${n}['duty']=${duty}\r\nroom${n}['duty_rules']=1\r\ngs 'jo9_room_duty','daily'\r\n`;
 for(const k of Object.keys(blocked))daily+=check(`room${n}[${q(k)}] ! ${duty>=2?0:1}`,'DAILY_'+n+'_'+duty+'_'+k);
 for(const k of Object.keys(allowed))daily+=check(`room${n}[${q(k)}] ! 1`,'DAILY_ALLOWED_'+n+'_'+duty+'_'+k);
 daily+=check(`$room${n}['armor'] ! 'кольчуга' or $room${n}['right_wpn'] ! 'гладиус'`,'DAILY_EQUIP_'+n+'_'+duty);dailyCases++;
 // Keep other rooms neutral to isolate each duty, including the single-chores rule.
 daily+=`room${n}['duty']=0\r\n`;
}
let stat=bodies.get('slave_stat'),s=stat.indexOf('\tovernight_rules_count = 0'),z=stat.indexOf('\t! display rules heading',s);a(s>=0&&z>s);
let render=stat.slice(s,z).split('\r\n').map(l=>{
 const m=l.match(/\*p ('<div id="chekbox_([^" ]+)"[\s\S]*)/);
 return m?l.slice(0,m.index)+`$qa_cell[${q(m[2])}] = `+m[1]:l;
}).join('\r\n');
let ui=prefix;
for(let role=0;role<=4;role++)for(let duty=0;duty<=4;duty++)for(const selected of [0,1]){
 ui+=`snk_room_target=${role}\r\nslave['duty']=${duty}\r\nslave['nymphomania']=0\r\nslave['virginity']=2\r\nqa_notice=0\r\nkillvar '$qa_cell'\r\n`;
 for(const k of [...Object.keys(blocked),...Object.keys(allowed)])ui+=`slave[${q(k)}]=${selected}\r\n`;
 ui+=render+'\r\n';
 for(const [k,id]of Object.entries(blocked)){
   const external=role>0&&duty>=2;
   if(external)ui+=check(`instr($qa_cell[${q(id)}], 'EXEC:') > 0 or instr($qa_cell[${q(id)}], ${q('외근 지시를 받은 노예는 수행할 수 없습니다.')}) = 0 or instr($qa_cell[${q(id)}], 'unactive_button.png') = 0`,'UI_BLOCK_'+role+'_'+duty+'_'+selected+'_'+k);
   else ui+=check(`instr($qa_cell[${q(id)}], ${q("EXEC: slave['"+k+"'] = "+(selected?0:1))}) = 0`,'UI_KEEP_'+role+'_'+duty+'_'+selected+'_'+k);
 }
 for(const [k,id]of Object.entries(allowed))ui+=check(`instr($qa_cell[${q(id)}], ${q("EXEC: slave['"+k+"'] = "+(selected?0:1))}) = 0 or instr($qa_cell[${q(id)}], ${q('외근 지시를 받은 노예는 수행할 수 없습니다.')}) > 0`,'UI_ALLOWED_'+role+'_'+duty+'_'+selected+'_'+k);
 uiCases++;
}
// Retain existing household notices and facility prerequisites outside external-duty mode.
for(const external of [0,1]){
 ui+=`snk_room_target=1\r\nslave['duty']=${external?2:0}\r\nqa_notice=1\r\nkitchen=0\r\nbath=0\r\npet_tentacle=0\r\n`+render+'\r\n';
 for(const id of ['1r','2r','3r','11r'])ui+=check(`instr($qa_cell[${q(id)}], ${q(external?'외근 지시를 받은 노예는 수행할 수 없습니다.':'qa-household-notice')}) = 0`,'UI_NOTICE_'+external+'_'+id);
}
ui+=`qa_notice=0\r\nsnk_room_target=0\r\n`+render+'\r\n';
for(const id of ['1r','3r','11r'])ui+=check(`instr($qa_cell[${q(id)}], 'EXEC: dynamic $msg') = 0`,'UI_FACILITY_'+id);
const notice="if qa_notice=1: $result='qa-household-notice'\r\n";
fs.mkdirSync(T,{recursive:true});fs.copyFileSync(W+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plan=[];for(const [kind,code]of Object.entries({set,daily,ui})){
 const name=mode+'-'+kind,marker='JO9_QA_PRIVATEEXTERNAL_'+name.replaceAll('-','_')+'_COMPLETE';
 const locs=kind==='ui'?[['jo9_household_worker',notice]]:[['jo9_room_duty',bodies.get('jo9_room_duty')]];
 const lines=['QSPGAME','private external rules','',c.shift(String(locs.length+1),-5),c.shift('Start',-5),'',c.shift(code+`msg '${marker}'`,-5),c.shift('0',-5)];
 for(const [n,b]of locs)lines.push(c.shift(n,-5),'',c.shift(b,-5),c.shift('0',-5));lines.push('');
 const output=Buffer.from(lines.join('\r\n'),'utf16le');c.parse(output);fs.writeFileSync(T+'/'+name+'.qsp',output);plan.push({name,file:T+'/'+name+'.qsp',marker,checkpoint:kind});
}
fs.writeFileSync(T+'/'+mode+'-plan.json',JSON.stringify(plan,null,2));
fs.writeFileSync(__dirname+'/external-'+mode+'-fixture-metrics.json',JSON.stringify({mode,sourceSha256:c.hash(raw),setCases,dailyCases,uiCases,checks:{set:(set.match(/qa_checks\+=1/g)||[]).length,daily:(daily.match(/qa_checks\+=1/g)||[]).length,ui:(ui.match(/qa_checks\+=1/g)||[]).length},fixtureCount:plan.length,modeFile:T+'/'+mode+'-plan.json'},null,2));
console.log(JSON.stringify({mode,setCases,dailyCases,uiCases,fixtures:plan.length}));
