'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const root=__dirname,work='G:/somi/Jack O Nine Tails v2.4_work/game',source=process.argv[2]||work+'/jack.qsp';
const raw=fs.readFileSync(source),sha=core.hash(raw),d=core.parse(raw),meta=JSON.parse(fs.readFileSync(root+'/comparison.json','utf8'));
assert.equal(sha,meta.sourceSha256,'Supply the pinned pre-fix QSP as first argument.');assert(core.serialize(d).equals(raw));
const q=s=>"'"+s.replaceAll("'","''")+"'",body=n=>core.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
const dynamic=body('#dynamic'),original=body('#txt_man'),edit=JSON.parse(fs.readFileSync(root+'/edits.json','utf8'))[0];
function closure(name){const a=dynamic.indexOf(name+' = {'),z=dynamic.indexOf('\r\n}',a);assert(a>=0&&z>a);return dynamic.slice(a,z+3);}
const picker=closure('$voice_pick_fragment'),relation=closure('$voice_relation_line');
const ca=relation.indexOf(" if instr($jo9_vrl_body,"),cz=relation.indexOf(" if $jo9_vrl_group=",ca);assert(ca>0&&cz>ca);const relationCueBlock=relation.slice(ca,cz);
const cueAssertion='$qa_strip_cue = {\r\n $jo9_vrl_body=$trim($args[0])\r\n $jo9_vrl_cue=\x27\x27\r\n'+relationCueBlock+' $result=$jo9_vrl_body\r\n}';
const group='native_1117_acc_itog_good3_3_core';
const indices=original.split('\r\n').filter(l=>l.startsWith("voice_fragment_count['"+group+'_')||l.startsWith("$voice_fragment_item['"+group+'_'));
assert.equal(indices.filter(l=>l.startsWith('voice_fragment_count[')).length,27);assert.equal(indices.filter(l=>l.startsWith('$voice_fragment_item[')).length,81);
function minimal(code){const lines=[...d.lines.slice(0,3),core.shift('1',-5),core.shift('Start',-5),'',core.shift(code,-5),core.shift('0',-5),''];const buf=Buffer.from(lines.join('\r\n'),'utf16le');qa.inspectWorld(buf);return buf;}
function check(expr,label){return `if ${expr}:\r\nelse\r\n msg ${q('JO9_QA_FAIL_'+label)}\r\n exit\r\nend`;}
const planByMode={},coverage={source,sourceSha256:sha,pickerSha256:crypto.createHash('sha256').update(picker).digest('hex'),relationCueBlockSha256:crypto.createHash('sha256').update(relationCueBlock).digest('hex'),candidateTextEntries:9,groupIndexCounts:27,groupIndexItems:81,typesExercised:['plain'],tonesExercised:[1,2,3],callsPerTone:3,fixtureLocations:['Start'],formattingStubs:[],description:'Exact production picker, exact production relation cue-removal block, exact nine assignments and metadata, exact all-group index lines. History last2/last1 advances from actual picker signature. No game-world, JSON, saves, or production modifications.'};
for(const mode of ['baseline','candidate']){
 const dir=path.join(root,'native-'+mode);fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(work+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');const plan=[];
 for(const [tone,word]of [[1,'one'],[2,'two'],[3,'three']]){
  const name='tone-'+word,marker='JO9_QA_PICKER'+mode.toUpperCase()+'_'+name.replaceAll('-','_')+'_COMPLETE';
  const lines=['killall','settimer 0','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','sound_on=0',"$onnewloc=''","$counter=''","$onactsel=''","$onobjsel=''","$onobjadd=''","$onobjdel=''","$usercom=''","$ongsave=''","$ongload=''","$onqsave=''",picker,cueAssertion,mode==='baseline'?edit.old:edit.new,...indices,"$jo9_vf_type='plain'",'jo9_vf_tone='+tone,"$jo9_vf_mode='neutral'",'jo9_vn_depth_positive=2','jo9_vn_depth_vulnerable=2','jo9_vn_depth_hostile=2','jo9_vn_fear=0','jo9_vn_mood=0','jo9_vf_reward_total=0',"$jo9_vf_last1=''","$jo9_vf_last2=''"];
  for(let i=1;i<=3;i++)lines.push("$jo9_vf_signature=''",`$qa_text[${i}]=$dyneval($voice_pick_fragment,${q(group)},'',2,'native',0)`,`$qa_id[${i}]=$jo9_vf_signature`,`$qa_core[${i}]=$dyneval($qa_strip_cue,$qa_text[${i}])`,check(`$qa_text[${i}] ! '' and $qa_id[${i}] ! ''`,'empty_'+word+'_'+i),"$jo9_vf_last2=$jo9_vf_last1","$jo9_vf_last1=$jo9_vf_signature");
  lines.push(check("$qa_id[1] ! $qa_id[2] and $qa_id[1] ! $qa_id[3] and $qa_id[2] ! $qa_id[3]",'id_rotation_'+word),check("$qa_core[1] ! $qa_core[2] and $qa_core[1] ! $qa_core[3] and $qa_core[2] ! $qa_core[3]",'core_distinct_after_three_distinct_ids_'+word),'msg '+q(marker));
  const file=path.join(dir,name+'.qsp');fs.writeFileSync(file,minimal(lines.join('\r\n')));plan.push({name,file,marker,checkpoint:'Actual picker + exact relation cue removal, three rotating IDs, distinct spoken cores; '+mode+' tone '+tone});
 }
 fs.writeFileSync(dir+'/plan.json',JSON.stringify(plan,null,2)+'\n');planByMode[mode]=dir+'/plan.json';
}
fs.writeFileSync(root+'/native-picker-coverage.json',JSON.stringify({...coverage,planByMode},null,2)+'\n');console.log(JSON.stringify({...coverage,planByMode},null,2));
