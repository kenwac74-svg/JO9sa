'use strict';
const fs=require('fs'),a=require('assert/strict'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/reward22-resume-20261116';
const c=require(R+'/tools/text-workshop/core.cjs'),mode=process.argv[2];a(['red','green'].includes(mode));
let raw=fs.readFileSync(mode==='green'&&fs.existsSync(T+'/candidate.qsp')?T+'/candidate.qsp':W+'/jack.qsp');
const savedPatch=__dirname+'/patch.json';
if(mode==='red'&&fs.existsSync(savedPatch)){
 const p=JSON.parse(fs.readFileSync(savedPatch,'utf8'));
 if(c.hash(raw)===p.after_sha256){const old=c.parse(raw);for(const e of [...p.edits].reverse()){const l=old.locations.find(l=>l.name===e.location),b=c.shift(old.lines[l.body],5);a.equal(b.split(e.new).length,2);old.lines[l.body]=c.shift(b.replace(e.new,()=>e.old),-5);}raw=c.serialize(old);a.equal(c.hash(raw),p.before_sha256);}
}
const d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const j=JSON.parse(fs.readFileSync(R+'/records/trait-dialogue-comparison-20261114/comparison.json','utf8'));
const proposal=JSON.parse(fs.readFileSync(R+'/records/reward22-restoration-proposal-20261114/COMPLETE_PROPOSED_PATCH.json','utf8'));
let varbody=body('#var_base'),s=varbody.indexOf('if hero_choice < 100:\r\n',varbody.indexOf('! Personal Erotic Reward')),z=varbody.indexOf('\r\nelse\r\n',s),cluster=varbody.slice(s,z)+'\r\nend\r\n';a(s>0&&z>s);
const dy=body('#dynamic'),es=dy.indexOf('$master_energy_drop = {'),energy=dy.slice(es,dy.indexOf('\r\n}',es)+3);
const q=x=>"'"+x.replaceAll("'","''")+"'",check=(expression,label)=>`qa_checks+=1\r\nif ${expression}: msg 'FAIL_${label}' & exit\r\n`;
const prefix="killall\r\n$onnewloc=''\r\n$ongload=''\r\n$counter=''\r\nsettimer 0\r\nqa_checks=0\r\n";
const init=`CONST_INT['young_age']=2\r\nCONST_INT['milf_age']=3\r\nCONST_INT['slave_exist']=1\r\nhero_choice=0\r\ndog=1\r\nprisoner_state=1\r\nassistant_state=1\r\nmaster_excitement=0\r\n$moan[2]='qa_sound'\r\n$moan[3]='qa_sound'\r\n`;
const pairs={nymphomania:1,nymphomania_revealed:2,sub_gangbang:5,sub_bj:5,sub_dp:5,sub_fisting:5,sub_zoosex:5,sub_horse:5,masochism:2,masochism_revealed:2,sub_mazo:5,compassion:-1,compassion_revealed:2,exhibitionism:2,exhibitionism_revealed:2,roleplay:5,masturbation_rule:0,perversion:2,perversion_revealed:2,sub_kopro:5,homosexualism:2,homosexualism_revealed:2,abuse_attitude:2,abuse_attitude_revealed:2,vermin_attitude:2,vermin_attitude_revealed:2,deprivation_attitude:2,deprivation_attitude_revealed:2,sub_humiliation:5,instinct:5,moral:5,pride:0};
const setups=Object.entries(pairs).map(([k,v])=>`slave[${q(k)}]=${v}\r\n`).join('');
let selection=prefix+init+setups;
const fields=['ero_rwd1_txt','ero_rwd2_txt','ero_rwdG_txt','ero_rwdB_txt','ero_rwd_img','ero_rwd_img_loc','ero_rwd_snd','ero_rwd_interaction_flags'];
for(const age of [2,3]){
 selection+=`killvar '$ero_rwd1_txt'\r\nslave['age']=${age}\r\nassistant['age']=${age}\r\nprisoner['age']=${age}\r\nslave['ero_rwd_cnt']=1\r\n`+cluster;
 selection+=check("slave['ero_rwd_cnt'] ! 19",'COUNT_'+age);
 for(let i=0;i<18;i++)for(const field of fields){
   const f=j.rewards[i].old.history[field][0];let v=f.text;
   if(field==='ero_rwd_img_loc')v=({clamps:'girls/torture_scenes/torture_instruments/',verminpit:'girls/torture_scenes/torture_units_application/'})[j.rewards[i].old.fields.ero_rwd_img.text]||v;
   selection+=`$qa_expected = ${f.kind==='literal'?q(v):v}\r\n`+check(`$${field}[${i+1}] ! $qa_expected`,'FIELD_'+age+'_'+(i+1)+'_'+field);
 }
}
let costs=prefix+init+setups+energy+"\r\nslave['age']=2\r\nassistant['age']=2\r\nprisoner['age']=2\r\nslave['ero_rwd_cnt']=1\r\n"+cluster;
for(let i=1;i<=18;i++)for(const ring of [0,1])for(const trained of [0,1]){
 const easy=[3,4,15].includes(i)?0:i===7||i===16?trained:1;
 costs+=`master_energy=5\r\nmaster_half_action=0\r\nmaster_str_rate=0\r\ncheat_inf_en=0\r\nobereg_on=0\r\nbull_ring_on=${ring}\r\nmaster_flagelation=${trained}\r\nmaster_bondage=${trained?3:0}\r\n`;
 for(let repeat=0;repeat<2;repeat++)costs+=`easy_for_master=0\r\ndynamic $ero_rwd_interaction_flags[${i}]\r\n`+check(`easy_for_master ! ${easy}`,'DISCOUNT_'+i+'_'+ring+'_'+trained+'_'+repeat)+"dynamic $master_energy_drop\r\n";
 costs+=check(`master_energy ! ${5-(2-ring-easy)}`,'COST_'+i+'_'+ring+'_'+trained)+check('master_half_action ! 0','CARRY_'+i+'_'+ring+'_'+trained);
}
let guard=prefix+init;
const actualGuards=cluster.split('\r\n').filter(l=>/^\s*if \(slave\['age'\]=/.test(l)).map(l=>l.trim().replace(/^if /,'').replace(/:$/,''));
if(mode==='green')a.equal(actualGuards.length,18);
const guardMain=actualGuards[0],guardPrisoner=actualGuards[7],guardAssistant=actualGuards[12];
if(mode==='green'){
for(const sa of [2,3,99])for(const pa of [2,3,99])for(const aa of [2,3,99]){
 guard+=`slave['age']=${sa}\r\nprisoner['age']=${pa}\r\nassistant['age']=${aa}\r\nqa_main=0\r\nqa_prisoner=0\r\nqa_assistant=0\r\nif ${guardMain}:qa_main=1\r\nif ${guardPrisoner}:qa_prisoner=1\r\nif ${guardAssistant}:qa_assistant=1\r\n`;
 guard+=check(`qa_main ! ${sa!==99?1:0}`,'GUARD_MAIN')+check(`qa_prisoner ! ${sa!==99&&pa!==99?1:0}`,'GUARD_PRISONER')+check(`qa_assistant ! ${sa!==99&&aa!==99?1:0}`,'GUARD_ASSISTANT');
}
}
const ib=body('interaction'),gs=ib.indexOf(mode==='red'?proposal.edits[1].old:proposal.edits[1].new),ge=ib.indexOf('\r\n\t$play_sound[2]',gs),route=ib.slice(gs,ge);a(gs>=0&&ge>gs);
let routes=prefix+init;
for(const [index,selected,arrayImage,hero,expected] of [[1,'lesbo','other',0,'slave, assistant'],[2,'bj','lesbo',0,'slave'],[3,'lesbo','other',100,'slave']]){
 routes+=`slave['age']=2\r\nassistant['age']=3\r\nhero_choice=${hero}\r\n$erotic_rwd_img=${q(selected)}\r\n$ero_rwd_img[0]=${q(arrayImage)}\r\n$erotic_rwd_img_loc='girls/sex_scenes/'\r\n$qa_actors=''\r\n`+route+'\r\n'+check(`$qa_actors ! ${q(expected)}`,'ROUTE_'+index);
}
fs.mkdirSync(T,{recursive:true});fs.copyFileSync(W+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
let plan=[];
for(const [caseName,code] of Object.entries({selection,costs,guards:guard,routes})){
 if(mode==='red'&&!['selection','costs','routes'].includes(caseName))continue;
 const name=mode+'-'+caseName,marker='JO9_QA_REWARDRESTORE_'+name.replaceAll('-','_')+'_COMPLETE';
 const locs=caseName==='routes'?[['display_pic',"$qa_actors=$args[0]\r\n$qa_image=$args[1]\r\n$result='qa_image'\r\n"]]:[];
 const lines=['QSPGAME','reward restoration','',c.shift(String(1+locs.length),-5),c.shift('Start',-5),'',c.shift(code+`msg '${marker}'`,-5),c.shift('0',-5)];
 for(const [n,b]of locs)lines.push(c.shift(n,-5),'',c.shift(b,-5),c.shift('0',-5));lines.push('');
 const b=Buffer.from(lines.join('\r\n'),'utf16le');c.parse(b);fs.writeFileSync(T+'/'+name+'.qsp',b);
 plan.push({name,file:T+'/'+name+'.qsp',marker,checkpoint:caseName});
}
fs.writeFileSync(T+'/'+mode+'-plan.json',JSON.stringify(plan,null,2));
console.log(JSON.stringify({mode,fixtures:plan.length,fields:288,costScenarios:72,guardCases:27,routes:3,productionUnchanged:c.hash(raw)}));
