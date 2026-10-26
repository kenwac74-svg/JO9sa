'use strict';
const fs=require('node:fs'),path=require('node:path');const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');const root=__dirname,out=path.join(root,'edges');fs.mkdirSync(out,{recursive:true});
const baseline='G:/Codex/tmp/relation-speaker-flow-fix-20261021/inputs/baseline.qsp',candidate=path.join(root,'candidate.qsp');const q=s=>"'"+s.replaceAll("'","''")+"'";
const header=c.parse(fs.readFileSync(path.join(root,'green','header.qsp'))),start=header.locations.find(l=>l.name==='Start');const setup=c.shift(header.lines[start.body],5).split("\r\ngs 'origins_relations'")[0];
const fail=(cond,msg)=>'if '+cond+': msg '+q('JO9_QA_'+msg)+' & exit\r\n';
// Functional probes and observation exports use separate plans: export payloads intentionally extend completion markers.
const tests=[];
let names=setup+'\r\n';
for(const [speaker,target]of [["이사'벨라",'폴리'],['이사"벨라','폴:리'],['동명이인','동명이인'],['0','0'],['','']]){const prefix='['+speaker+']<br>&nbsp;';names+='$assistant_name='+q(speaker)+'\r\n$slave_name='+q(target)+"\r\ngs 'origins_relations'\r\n"+fail('instr($text[2],'+q(prefix)+') ! 1','NAME_HEADER_WRONG')+fail("arrsize('jo9_relation_native_first')>0",'TEMP_FLAG_REMAINED');}
tests.push({name:'names',code:names});
let fallback=setup+"\r\nkillvar 'voice_fragment_count'\r\ngs 'origins_relations'\r\n"+fail("instr($text[2],'[이사벨라]<br>&nbsp;폴리 ') ! 1",'RAW_SUBJECT_REMOVED')+fail("instr($text[2],'나한테는 너무 <font color=\"red\">원시적이다</font>.')=0",'RAW_ORIGINAL_CHANGED');
fallback+="voice_fragment_revision=0\r\ngs '#txt_man','jo9_voice_fragment_data'\r\nvoice_fragment_count['native_1117_world_prim_3_core_plain_2']=0\r\ngs 'origins_relations'\r\n"+fail("instr($text[2],'[이사벨라]<br>&nbsp;폴리 ') ! 1",'MIXED_SUBJECT_REMOVED')+fail("instr($text[2],'폴리:')>0",'MIXED_SUBJECT_COLON')+fail("instr($text[2],'그녀가 살던 곳의 문화는 제게 낯설어요.')=0",'MIXED_NATIVE_NOT_REACHED');
fallback+="copyarr 'slave1','assistant'\r\ncopyarr '$slave1','$assistant'\r\n$slave2['name']='폴리'\r\n$text[2]='폴리'\r\njo9_relation_active=1\r\n$qa_x=$dyneval($voice_native,'1117_feat_int_eq_3','원문','slave1',4)\r\n"+fail('jo9_relation_native_first ! 0','OTHER_PAGE_SET_FIRST_FLAG');
tests.push({name:'fallbacks',code:fallback});
let special=setup+"\r\nassistant['relative_id']=101\r\n$assistant['relative_relations']='친족 고유 원문: 폴리는 내 가족이에요.'\r\ngs 'origins_relations'\r\n"+fail("$text[2] ! '[이사벨라]<br>친족 고유 원문: 폴리는 내 가족이에요.'",'KINSHIP_PROSE_CHANGED');
special+="assistant['relative_id']=0\r\nassistant['id']=1926319775\r\nslave['id']=1395836363\r\ngs 'origins_relations'\r\n"+fail("instr($text[2],'[이사벨라]<br>센세잖아…') ! 1",'DEDICATED_PROSE_CHANGED');
special+="assistant['id']=102\r\nslave['id']=101\r\nslave['obedience']=-1\r\ngs 'origins_relations'\r\n"+fail("instr($text[2],'[이사벨라]') ! 1",'REFUSAL_SPEAKER_WRONG');
special+="slave['obedience']=1\r\nassistant['isolate']=1\r\ngs 'origins_relations'\r\n"+fail("instr($text[2],'[이사벨라]') ! 1",'ISOLATED_SPEAKER_WRONG');
tests.push({name:'special-paths',code:special});
const plan=[];
function fixture(raw,name,code,exporting=false){const d=c.parse(raw),l=d.locations.find(l=>l.name==='Start'),marker='JO9_QA_REL9_'+name.replaceAll('-','_')+'_COMPLETE';d.lines[l.body]=c.shift(code+'\r\nmsg '+q(marker)+(exporting?"+'JO9_PAGE_1|'+$text[1]+'JO9_PAGE_2|'+$text[2]+'JO9_PAGE_3|'+$text[3]+'JO9_PAGE_4|'+$text[4]+'JO9_PAGE_5|'+$text[5]+'JO9_PAGE_6|'+$text[6]+'JO9_EXPORT_END'":''),-5);const file=path.join(out,name+'.qsp');fs.writeFileSync(file,c.serialize(d));plan.push({name,file,marker,checkpoint:'Start'});}
const cand=fs.readFileSync(candidate);for(const t of tests)fixture(cand,t.name,t.code);
for(const [kind,p]of [['baseline',baseline],['candidate',candidate]])for(const scenario of ['normal','long']){const extra=scenario==='long'?"\r\nslave['intellect']=0\r\nslave['beauty']=5\r\nassistant['beauty']=1\r\nassistant['fat']=0\r\nslave['fat']=4\r\nassistant['height']=1\r\nslave['height']=4\r\nassistant['ego']=4\r\nslave['ego']=0":'';fixture(fs.readFileSync(p),kind+'-'+scenario,setup+extra+"\r\ngs 'origins_relations'",true);}
fs.copyFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/config.xml',path.join(out,'config.xml'));fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify(plan.filter(p=>!/^baseline-|^candidate-/.test(p.name)),null,2)+'\n');fs.writeFileSync(path.join(out,'export-plan.json'),JSON.stringify(plan.filter(p=>/^baseline-|^candidate-/.test(p.name)),null,2)+'\n');console.log(JSON.stringify(plan.map(p=>p.name)));
