'use strict';
const fs=require('node:fs'),path=require('node:path'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const opts={};for(let i=2;i<process.argv.length;i+=2)opts[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
const work='G:/somi/Jack O Nine Tails v2.4_work/game',input=opts.input||work+'/jack.qsp',out=opts.out;
if(!out||fs.existsSync(out))throw Error('Fresh --out required');
let raw=fs.readFileSync(input);if(opts.transformed==='yes'){const d=c.parse(raw);for(const n of require('./text-transform.cjs').locations){const l=d.locations.find(l=>l.name===n),r=require('./text-transform.cjs').transform(n,c.shift(d.lines[l.body],5));d.lines[l.body]=c.shift(r.body,-5);}raw=c.serialize(d);}
const base=c.parse(raw),prime=qa.primeState(codec.parse(fs.readFileSync(work+'/save/spete_dialogue_test.sav')));
const q=s=>"'"+s.replaceAll("'","''")+"'",assert=(expr,id)=>['if '+expr+':','else',"$qa_errors += "+q(id+'|'),'end'];
const inventory=require('./menu-inventory.json').rows,translation=require('./text-transform.cjs');
const groups=['$jeweler_a_options[2]','$jeweler_a_options[3]',...Array.from({length:5},(_,i)=>'$boutic_a_options['+(i+1)+']')];
const source=fs.readFileSync(__dirname+'/current/#options.txt','utf8').split(/\r?\n/),names=[];
for(let i=0;i<source.length;i++){const m=source[i].match(/^(\$(?:jeweler|boutic)_a_options\[\d+\]) =/);if(m)names.push({name:m[1],line:i+1});}
const changed=translation.transform('#options',fs.readFileSync(__dirname+'/current/#options.txt','utf8')).edits;
const plan=[];fs.mkdirSync(out,{recursive:true});fs.cpSync(work+'/json',out+'/json',{recursive:true});fs.copyFileSync(work+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
for(const gray of [false,true]){
 const d=c.parse(raw),checks=[],name=gray?'menu-gray':'menu-active',marker='JO9_QA_ARGONMENU_'+(gray?'gray':'active')+'_COMPLETE';
 const setup=['killall',prime.code,"$onnewloc=''",'snk_room_target=0',"gs 'refresh_database'","$qa_errors=''",'money=91234',"slave['energy']=5","assistant['energy']=5"];
 if(gray){const keys=[...new Set([...source.slice(7258).join('\n').matchAll(/assistant_inventory\['([^']+)'\]/g)].map(m=>m[1]))];for(const k of keys)setup.push('assistant_inventory['+q(k)+']=100');}
 else setup.push("killvar 'assistant_inventory'",...['ring_left','ring_right','earrings','nipplerings','clitring','collar','head','navel','tongue','headband','body','hands','feet'].map(k=>'$assistant['+q(k)+']='+q('')));
 for(const group of groups){
  checks.push("$text_display=''",'dynamic '+group);
  const range=names.findIndex(g=>g.name===group),start=names[range].line,end=names[range+1]?.line||source.length+1;
  const labels=[...new Set(changed.filter((e,i)=>inventory[i].line>=start&&inventory[i].line<end).map(e=>e.newText))];
  for(const label of labels)checks.push(...assert('instr($text_display,'+q(label)+')>0',group+'_'+label));
  for(const r of inventory.filter(r=>r.line>=start&&r.line<end))checks.push(...assert('instr($text_display,'+q(r.old)+')=0','cyrillic_'+r.line));
 }
 checks.push(...assert('money=91234',name+'_money'),...assert("slave['energy']=5 and assistant['energy']=5",name+'_energy'));
 const loc=d.locations.find(l=>l.name==='Start');d.lines[loc.body]=c.shift([...setup,...checks,"if $qa_errors!'': msg 'JO9_QA_ASSERTION_FAILED_'+$qa_errors","if $qa_errors='': msg "+q(marker)].join('\r\n'),-5);
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=path.join(out,name+'.qsp');fs.writeFileSync(file,bytes);plan.push({name,file,marker,checkpoint:'Seven actual assistant shop menu arrays; Korean names, active/gray branches, unchanged money and energy.'});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2));fs.writeFileSync(out+'/prepared.json',JSON.stringify({input,hash:c.hash(raw),groups,occurrences:103,limits:['Actual menu generation only; purchases not executed because IDs and conditionals are unchanged.','Diagnostic copies; production and save untouched.']},null,2));console.log(JSON.stringify({out,probes:plan.length}));
