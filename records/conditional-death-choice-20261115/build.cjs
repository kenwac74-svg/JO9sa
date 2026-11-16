'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root='G:/somi/JO9sa',c=require(root+'/tools/text-workshop/core.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',before=fs.readFileSync(work),doc=c.parse(before);
const loc=doc.locations.find(x=>x.name==='jo9_slave_death'),old=c.shift(doc.lines[loc.body],5);
const cond='(2 * jo9_cruel_mercy + jo9_cruel_mercy_half) <= -20 and master_fetish >= 4';
const label='#노예살자2-2';
const original=old.split('\r\n').find(line=>line.includes("$jo9_sd_l2='<a href=\"EXEC: jo9_sd_choice = 2 & gt $curloc\""));a(original);
const variant=[original,'  ! JO9 MOD START DEATH_CHOICE_22_MENU_20261115','  if '+cond+':',"   $jo9_sd_l2='<a href=\"EXEC: jo9_sd_choice = 22 & gt $curloc\">#노예살자2-2</a>'",'  end','  ! JO9 MOD END DEATH_CHOICE_22_MENU_20261115'].join('\r\n');
const guard=["  jo9_sd_c=jo9_sd_choice",'  ! JO9 MOD START DEATH_CHOICE_22_GUARD_20261115','  if jo9_sd_c=22 and ((2 * jo9_cruel_mercy + jo9_cruel_mercy_half) > -20 or master_fetish < 4):','   jo9_sd_choice=0',"   gs 'jo9_slave_death','step'",'   exit','  end','  ! JO9 MOD END DEATH_CHOICE_22_GUARD_20261115'].join('\r\n');
const result=["  elseif jo9_sd_c=22:",'   ! JO9 MOD START DEATH_CHOICE_22_RESULT_20261115','   ! Editable result placeholder; no dedicated money, CM or item effect is defined yet.',"   $bg_path='scene\\others\\suicide_after_2'","   $text='#노예살자2-2'",'   ! JO9 MOD END DEATH_CHOICE_22_RESULT_20261115','  else',"   dynamic $replace($dyn_meat_evaluation, 'dyn'+'slave', 'slave')"].join('\r\n');
function once(body,from,to){a.equal(body.split(from).length,2,from);return body.replace(from,to);}
let next=once(old,original,variant);
next=once(next,' jo9_sd_c=jo9_sd_choice',guard);
next=once(next," else\r\n  dynamic $replace($dyn_meat_evaluation, 'dyn'+'slave', 'slave')",result);
next=once(next,'! State: jo9_sd_active (1 while the choice is open), jo9_sd_choice (0 none, 1..3), $jo9_sd_text (event text), $jo9_sd_bg (event picture).','! State: jo9_sd_active (1 while the choice is open), jo9_sd_choice (0 none, 1..3, 22 conditional option 2), $jo9_sd_text (event text), $jo9_sd_bg (event picture).');
const changed={...doc,lines:doc.lines.slice()};changed.lines[loc.body]=c.shift(next,-5);const candidate=c.serialize(changed),candidateDoc=c.parse(candidate);a(c.serialize(candidateDoc).equals(candidate));
const syntax=require(root+'/tools/text-workshop/check-image-cycle-syntax.cjs');a.equal(syntax.checkSyntax(next,{normalizeEol:true}).errors.length,0);
const mod={id:'2026-11-15_death_choice_22_placeholder',status:'APPROVED',description:'CM≤−10 및 주인공 이상성욕 A 이상일 때 2번 대체 선택지와 독립 결과 편집 자리',before_sha256:doc.hash,after_sha256:c.hash(candidate),edits:[{location:loc.name,field:'body',old,new:next,count:1}]};
fs.writeFileSync(path.join(__dirname,'candidate.qsp'),candidate);fs.writeFileSync(path.join(__dirname,'patch.json'),JSON.stringify(mod,null,2));
const neutral2=old.match(/\$jo9_sd_l2='[^\r\n]+/)[0];
function native(body,kind){
 let start="killall\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\nqa_checks=0\nqa_failed=0\n";
 function check(expr){start+='qa_checks+=1\nif ('+expr+')=0: qa_failed+=1\n';}
 for(const hero of [1,101])for(const total of [-21,-20,-19])for(const skill of [3,4,5]){
  const cm=Math.trunc(total/2),half=total-cm*2,want=total<=-20&&skill>=4;
  start+=`hero_choice=${hero}\njo9_cruel_mercy=${cm}\njo9_cruel_mercy_half=${half}\nmaster_fetish=${skill}\njo9_sd_active=1\njo9_sd_choice=0\nsparks=50\n$jo9_sd_text='수정 전 안내'\n$jo9_sd_bg='bg/empty'\ngs 'jo9_slave_death','step'\n`;
  check(`(instr($text,'#노예살자2-2')>0)=${want?1:0}`);
  check(`(instr($text,'장비를 모두 벗기고')>0)=${want?0:1}`);
  check("instr($text,'1. 노예를 양지바른')>0 and instr($text,'3. 도축장으로')>0");
 }
 start+="$clear_slave_instance={qa_cleared+=1 & killvar 'slave_inventory'}\nqa_cleared=0\nqa_cm_delta=0\njo9_sd_active=1\njo9_sd_choice=22\nslave_suicide=1\njo9_cruel_mercy=-10\njo9_cruel_mercy_half=0\nmaster_fetish=4\nsparks=50\nslave_inventory['maid_dress']=2\ngs 'jo9_slave_death','resolve'\n";
 check("$text='#노예살자2-2'");check('sparks=50 and qa_cm_delta=0');check("slave_inventory['maid_dress']=2");check('qa_cleared=1 and jo9_sd_active=0 and jo9_sd_choice=0 and slave_suicide=0');
 start+="qa_cleared=0\njo9_sd_active=1\njo9_sd_choice=22\njo9_cruel_mercy=-9\njo9_cruel_mercy_half=-1\nmaster_fetish=5\ngs 'jo9_slave_death','resolve'\n";
 check('qa_cleared=0 and jo9_sd_active=1 and jo9_sd_choice=0');check("instr($text,'#노예살자2-2')=0");
 start+="jo9_sd_choice=22\njo9_cruel_mercy=-10\njo9_cruel_mercy_half=0\nmaster_fetish=3\ngs 'jo9_slave_death','resolve'\n";
 check('qa_cleared=0 and jo9_sd_active=1 and jo9_sd_choice=0');
 start+="jo9_sd_choice=2\nqa_cm_delta=0\ngs 'jo9_slave_death','resolve'\n";check('qa_cm_delta=-1 and qa_cleared=1');
 start+="savegame 'qa-"+kind+".sav'\nif qa_failed>0: msg 'FAIL conditional choice '+str(qa_failed) & exit\nmsg 'JO9_QA_DEATHCHOICE_"+kind+"_COMPLETE'\nexit\n";
 const bodies={Start:start,jo9_slave_death:body,jo9_cruel_mercy_apply:'qa_cm_delta+=args[0]'},lines=['QSPGAME','','',c.shift('3',-5)];for(const[n,b]of Object.entries(bodies))lines.push(c.shift(n,-5),'',c.shift(b.replace(/\r?\n/g,'\r\n'),-5),c.shift('0',-5));lines.push('');return Buffer.from(lines.join('\r\n'),'utf16le');
}
const temp='G:/Codex/tmp/conditional-death-choice-20261115';fs.mkdirSync(temp,{recursive:true});
for(const[k,b]of [['red',old],['green',next]]){fs.writeFileSync(temp+'/'+k+'.qsp',native(b,k));fs.writeFileSync(temp+'/'+k+'-plan.json',JSON.stringify([{name:k,file:temp+'/'+k+'.qsp',checkpoint:k,marker:'JO9_QA_DEATHCHOICE_'+k+'_COMPLETE'}]));}
console.log(JSON.stringify({before:doc.hash,after:mod.after_sha256,condition:cond,nativeChecks:62,fixtureDir:temp,sourceImagePreserved:next.includes("$bg_path = 'scene/slaughter_result'")}));
module.exports={mod,candidate,old,next};
