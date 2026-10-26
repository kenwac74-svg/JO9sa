'use strict';
const fs=require('node:fs'),path=require('node:path');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const input=process.argv[2],phase=process.argv[3]||'red';
if(!input||!['red','green'].includes(phase))throw Error('usage: node probe.cjs qsp red|green');
const root=__dirname,out=path.join(root,phase);fs.mkdirSync(out,{recursive:true});
const raw=fs.readFileSync(input),doc=core.parse(raw);
const body=n=>core.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
const setup=["gs '#dynamic'","gs '#txt_man','jo9_voice_fragment_data'","gs '#static_txt'","CONST_INT['young_age']=1","CONST_INT['adult_age']=2","acc_rel['good1']=4","acc_rel['good2']=8","acc_rel['good3']=12","acc_rel['bad1']=-4","acc_rel['bad2']=-8","acc_rel['bad3']=-12","$slave_name='폴리'","$assistant_name='이사벨라'","$slave_occupation='noblewoman'","$assistant_occupation='noblewoman'","$slave_psy_status='neutral'","$assistant_psy_status='neutral'","slave['id']=101","assistant['id']=102","slave['age']=1","assistant['age']=2","slave['obedience']=1","slave['intellect']=2","assistant['intellect']=4","slave['world_index']=3","assistant['world_index']=1","slave['nation_index']=2","assistant['nation_index']=1","slave['family_index']=0","assistant['family_index']=0","slave['temper']=3","assistant['temper']=3","slave['sensitivity']=3","assistant['sensitivity']=3","slave['ego']=2","assistant['ego']=2","slave['pride']=2","assistant['pride']=2","assistant['101']=7","slave['102']=7","sa_rel=2","interaction=1118","day=1","jo9_vn_defer_history=1"].join('\r\n');
const scripts=[];
// Catches the actual origins/native composition labelling the target as speaker.
scripts.push({name:'header',code:setup+"\r\ngs 'origins_relations'\r\nif instr($text[2],'[이사벨라]') ! 1: msg 'JO9_QA_EXPECTED_SPEAKER_HEADER '+$text[2] & exit\r\nif instr($text[2],'폴리:')>0: msg 'JO9_QA_TARGET_COLON_REMAINED' & exit\r\nif instr($text[4],'[이사벨라]') ! 1: msg 'JO9_QA_FEATURE_HEADER_MISSING' & exit\r\nif instr($text[5],'[이사벨라]')<1 or instr($text[5],'[이사벨라]')=1: msg 'JO9_QA_SUMMARY_NARRATOR_HEADER_WRONG' & exit\r\nif instr($text[6],'[이사벨라]')<1 or instr($text[6],'[이사벨라]')=1: msg 'JO9_QA_FOLLOWUP_NARRATOR_HEADER_WRONG' & exit"});
// Catches absence of the discourse transition; calls the real relation helper.
scripts.push({name:'empathy',code:"gs '#dynamic'\r\njo9_relation_active=1\r\njo9_vf_tone=2\r\n$qa_line=$dyneval($voice_relation_line,'1117_world_prim_3','그녀는 교양이라고는 하나도 모르는 야만인 같아요.',2)\r\n$qa_line=$dyneval($voice_relation_line,'1117_nation_neq_3','그녀가 살던 곳의 문화는 제게 낯설어요.',2)\r\n$qa_line=$dyneval($voice_relation_line,'1117_personal_goodtol_3','슬픈 일이에요, 이렇게 어린 여자애가 이런 세상에 오다니요. 무슨 죄를 지었다고 이런 일을 당해야 하죠?',2)\r\nif instr($qa_line,'그래도 ') ! 1: msg 'JO9_QA_EXPECTED_EMPATHY_BRIDGE '+$qa_line & exit"});
if(phase==='green'){
 const pairs=JSON.parse(fs.readFileSync(path.join(root,'bridge-manifest.json'),'utf8'));
 let check="gs '#dynamic'\r\n";
 for(const p of pairs){
  const call=(left,right,lt,rt,page)=>'$dyneval($voice_relation_continue,'+[p.left_group,p.right_group,left,right].map(quote).join(',')+','+rt+','+lt+','+page+')';
  check+='$qa_got='+call(p.left,p.expected_right,p.tone,p.tone,2)+'\r\nif $qa_got ! '+quote(p.right)+": msg 'JO9_QA_PAIR_MISMATCH' & exit\r\n";
  for(const [left,right,lt,rt,page]of [[p.left+' 수동수정',p.expected_right,p.tone,p.tone,2],[p.left,p.expected_right+' 수동수정',p.tone,p.tone,2],[p.left,p.expected_right,p.tone,p.tone===3?1:p.tone+1,2],[p.left,p.expected_right,p.tone,p.tone,4]]){
   check+='$qa_got='+call(left,right,lt,rt,page)+'\r\nif $qa_got ! '+quote(right)+": msg 'JO9_QA_UNMATCHED_PAIR_CHANGED' & exit\r\n";
  }
 }
 check+="jo9_relation_active=1\r\njo9_vf_tone=2\r\n$qa_x=$dyneval($voice_relation_line,'1117_nation_neq_3','그녀가 살던 곳의 문화는 제게 낯설어요.',2)\r\n$qa_x=$dyneval($voice_relation_line,'1117_personal_goodtol_3','그래도 이미 수동으로 이은 문장입니다.',2)\r\nif $qa_x ! '그래도 이미 수동으로 이은 문장입니다.': msg 'JO9_QA_EXISTING_CONNECTOR_CHANGED' & exit\r\n$qa_x=$dyneval($voice_relation_line,'1117_nation_neq_3','그녀가 살던 곳의 문화는 제게 낯설어요.',2)\r\n$qa_x=$dyneval($voice_relation_line,'1117_family_unknown','가족에 관한 별개 문장입니다.',2)\r\n$qa_x=$dyneval($voice_relation_line,'1117_personal_goodtol_3','슬픈 일이에요, 이렇게 어린 여자애가 이런 세상에 오다니요. 무슨 죄를 지었다고 이런 일을 당해야 하죠?',2)\r\nif instr($qa_x,'그래도 ')=1: msg 'JO9_QA_UNREVIEWED_FAMILY_BRIDGED' & exit";
 scripts.push({name:'pair-table',code:check});
}
const plan=[];
for(const t of scripts){const d=core.parse(raw),loc=d.locations.find(l=>l.name==='Start');const marker='JO9_QA_REL9_'+t.name.replaceAll('-','_')+'_COMPLETE';d.lines[loc.body]=core.shift(t.code+'\r\nmsg '+quote(marker),-5);const file=path.join(out,t.name+'.qsp');fs.writeFileSync(file,core.serialize(d));plan.push({name:t.name,file,marker,checkpoint:'Start'});}
fs.copyFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/config.xml',path.join(out,'config.xml'));
fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify({phase,sha256:core.hash(raw),probes:plan.map(p=>p.name)}));
