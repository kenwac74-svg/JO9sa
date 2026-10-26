'use strict';
const fs=require('fs'), path=require('path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const out='G:/Codex/tmp/shop-text-quest-20261026/quest';
const source=c.parse(fs.readFileSync(input));
const get=n=>c.shift(source.lines[source.locations.find(l=>l.name===n).body],5);
function fixture(keep,replacements){
 let lines=source.lines.slice(0,4),n=0;
 for(let i=0;i<source.locations.length;i++){
  const l=source.locations[i];if(!keep.includes(l.name))continue;
  const chunk=source.lines.slice(l.body-2,i+1<source.locations.length?source.locations[i+1].body-2:source.lines.length-1);
  if(Object.hasOwn(replacements,l.name))chunk[2]=c.shift(replacements[l.name].replace(/\r?\n/g,'\r\n'),-5);
  lines.push(...chunk);n++;
 }
 lines[3]=c.shift(String(n),-5);lines.push('');
 const raw=Buffer.from(lines.join('\r\n'),'utf16le');c.parse(raw);return raw;
}
const q=s=>"'"+s.replaceAll("'","''")+"'";
const plan=[];
const lectureLines=get('interaction_result').split(/\r?\n/);
const lectureStart=lectureLines.findIndex(s=>/^IF \$interaction_type = 'lecture_slave':/.test(s));
const lectureEnd=lectureLines.findIndex((s,i)=>i>lectureStart&&/^!Reset interaction variables/.test(s));
if(lectureStart<0||lectureEnd<0)throw Error('Lecture block not found');
const lecture=lectureLines.slice(lectureStart,lectureEnd).join('\n');
let start="day=20\nmaster_tutor=1\nslave['intellect']=5\nslave['world_index']=4\nslave['obedience']=1\nqa_pass=1\n";
for(const theme of ['world','nation','family','work']){
 start+="$interaction_type='lecture_slave'\n$lecture_theme='tolerant_"+theme+"'\n"+
  "gs 'interaction_result'\nif slave['tolerant_"+theme+"']!2: qa_pass=0\n";
}
start+="slave['obedience']=-1\nslave['fear']=0\n$interaction_type='lecture_slave'\n$lecture_theme='tolerant_world'\ngs 'interaction_result'\nif slave['tolerant_world']!2: qa_pass=0\n";
start+="slave['obedience']=1\nmaster_tutor=0\nslave['intellect']=0\n$interaction_type='lecture_slave'\ngs 'interaction_result'\nif slave['tolerant_world']!2: qa_pass=0\n";
start+="slave['intellect']=5\nmaster_tutor=1\nslave['jo9_learning_trait']=1\n$interaction_type='lecture_slave'\ngs 'interaction_result'\nif slave['tolerant_world']!6: qa_pass=0\n";
start+="qa_average=(5+5+5+4)/4\nif qa_average!4: qa_pass=0\n";
const learningMarker='JO9_QA_QUEST20261026_lecture_growth_COMPLETE';
start+="if qa_pass=1:\n msg "+q(learningMarker)+"\nelse\n msg 'JO9_QA_ASSERTION_FAILED_LECTURE'\nend";
const learningRaw=fixture(['Start','interaction_result','jo9_traits','jo9_traits_personality','jo9_learning_xp'],{'Start':start,'interaction_result':lecture});
const learningFile=path.join(out,'lecture-growth.qsp');fs.writeFileSync(learningFile,learningRaw);
plan.push({name:'lecture-growth',file:learningFile,marker:learningMarker,checkpoint:'original lecture block: four fields, refusal, zero growth, genius multiplier, integer average'});
// Run the original menu definition callbacks through a collector. No scene text or visuals execute.
const menuMarker='JO9_QA_QUEST20261026_menu_gates_COMPLETE';
let menuStart="gs '#options'\n$event['Akabur_quest']='QA'\nactive['QA']=12\nnpc_progress['elsa']=3\nnpc_progress['jasmine']=2\nnpc_progress['Jafar']=1\nslave_type=2617\nqa_pass=1\n";
const menuCases=[
 {setup:'',callback:'Russiankvartal_forest',want:30041,not:[30045]},
 {setup:"npc_progress['jasmine']=3",callback:'Russiankvartal_forest',want:30045,not:[30041]},
 {setup:"active['QA']=13\nnpc_progress['Jafar']=2",callback:'Russiankvartal_forest',want:1200,not:[30041,30045]},
 {setup:"active['QA']=12\nnpc_progress['jasmine']=2\nnpc_progress['Jafar']=0\nslave_type=1",callback:'Russiankvartal_forest',want:30040,not:[30041,30045]},
 {setup:"active['QA']=12",callback:'Agraba_castle',want:30116,not:[]},
 {setup:"active['QA']=13",callback:'Agraba_castle',want:3000,not:[30116]}
];
for(const m of menuCases){
 menuStart+=m.setup+"\nkillvar 'qa_menu'\ndynamic $"+m.callback+"_options[1]\nif qa_menu["+m.want+"]!1: qa_pass=0\n";
 for(const id of m.not)menuStart+='if qa_menu['+id+']!0: qa_pass=0\n';
}
menuStart+="if qa_pass=1:\n msg "+q(menuMarker)+"\nelse\n msg 'JO9_QA_ASSERTION_FAILED_MENU'\nend";
const optionLines=get('#options').split(/\r?\n/);
const optionDefinitions=optionLines.slice(4720,4779).join('\n')+'\n'+optionLines.slice(7016,7033).join('\n');
if(!optionDefinitions.startsWith('$Russiankvartal_forest_options[1] = {')||!optionDefinitions.endsWith('}'))throw Error('Menu callback extraction changed');
const menuRaw=fixture(['Start','#options','$menu'],{'Start':menuStart,'#options':optionDefinitions,'$menu':"if $args[0]='interaction_city': qa_menu[args[2]]=1\nresult=0"});
const menuFile=path.join(out,'menu-gates.qsp');fs.writeFileSync(menuFile,menuRaw);
plan.push({name:'menu-gates',file:menuFile,marker:menuMarker,checkpoint:'six original menu callback stage/person gates'});
fs.writeFileSync(path.join(out,'aux-plan.json'),JSON.stringify(plan,null,2));
fs.writeFileSync(path.join(out,'aux-manifest.json'),JSON.stringify({input,sha256:source.hash,lectureRange:[lectureStart+1,lectureEnd],menuCases,plan:plan.map(p=>({...p,sha256:c.hash(fs.readFileSync(p.file))}))},null,2));
console.log(JSON.stringify({out,cases:plan.length}));
