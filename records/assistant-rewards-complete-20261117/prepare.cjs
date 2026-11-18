'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const H=__dirname,G='G:/somi/Jack O Nine Tails v2.4_work/game',raw=fs.readFileSync(G+'/jack.qsp'),d=c.parse(raw);
a.equal(d.hash,'68320a5de68072447df13eaf05e8203c8078629052a96d4901cfe8797cc3cb3c');
a(raw.equals(Buffer.from(d.lines.join('\r\n'),'utf16le')));
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),cr=s=>s.replace(/\r?\n/g,'\r\n');
const bridge=cr(`! JO9 MOD START ASSISTANT_REWARD_INPUTS_20261117
if $interaction_type = 'assistant_compliment':
 interaction_reward_level = 2
 interaction_reward_potence = praise_potence
 if func('jo9_traits', 'attention_has', 'assistant') = 0: interaction_reward_potence -= assistant_already_done_total[$str(interaction)] - assistant['age_count']/12
elseif $interaction_type = 'assistant_prise_date':
 interaction_reward_level = interaction - 5599
 interaction_reward_potence = praise_potence
elseif $interaction_type = 'assistant_prise_erotic':
 interaction_reward_level = iif(interaction = 5608, 3, 5)
 interaction_assistant['erotic_stimulation'] = erotic_stimulation
end
! JO9 MOD END ASSISTANT_REWARD_INPUTS_20261117

gt 'interaction_result'`);
const result=body('interaction_result');
const actor=s=>s.replace(/\bslave(?=\[|_rate\[|_already_done_today\[|_already_done_total\[)/g,'assistant').replaceAll('$slave_psy_status','$assistant_psy_status').replaceAll("'slave'","'assistant'");
// Reuse the numeric portions of the existing slave handlers, preserving their formulas.
let compliment=result.slice(result.indexOf("\tif slave_already_done_today[$str(interaction)] > 0:",result.indexOf("if $interaction_type = 'compliment':")),result.indexOf('! JO9 MOD START J9TP_PRAISE_ASSISTANT'));
compliment=compliment.split('\r\n').filter(l=>!l.includes('$text[')&&!l.includes('JO9 MOD START ATTENTION_PRAISE_ONCE')&&!l.includes('JO9 MOD END ATTENTION_PRAISE_ONCE')).join('\r\n');
a(compliment.endsWith('end\r\n\r\n'));
compliment=compliment.slice(0,-'end\r\n\r\n'.length);
let date=result.slice(result.indexOf("\tslave_rate['mood'] += interaction_reward_potence",result.indexOf("if $interaction_type = 'praise_date':")),result.indexOf('!interaction type - reward with a present'));
date=date.replace("\tsparks -= interaction_reward_cost\r\n",'').replaceAll('interaction_date_success','date_success');
a(date.endsWith('end\r\n\r\n'));date=date.slice(0,-'end\r\n\r\n'.length);
const finish=result.slice(result.indexOf("\tif $slave_psy_status = 'broken':",result.indexOf("if $interaction_type = 'praise_erotic':")),result.indexOf('!Interaction type - Compliment'));
a(finish.endsWith('end\r\n\r\n'));const rewardFinish=finish.slice(0,-'end\r\n\r\n'.length);
const effects=cr(`! JO9 MOD START ASSISTANT_REWARD_RESULTS_20261117
if $interaction_type = 'assistant_compliment':
 interaction_no_auto_energy_drop = 1
 if interaction_assistant['res'] >= 0:
${actor(compliment)} end
end

if $interaction_type = 'assistant_prise_date' and interaction_assistant['res'] >= 0:
${actor(date)} master_hygiene_rate += add_master_hygiene
 assistant_rate['hygiene'] += add_assistant_hygiene
 house_mess_rate += add_house_mess
end

if $interaction_type = 'assistant_prise_erotic':
 interaction_no_auto_energy_drop = 1
 if interaction_assistant['res'] >= 0:
  dynamic $master_energy_drop
  dynamic $replace($dyn_erotic_stimulation, 'dyn'+'slave', 'assistant')
  if interaction_assistant['final_stimulation'] > 0:
   interaction_reward_potence += interaction_reward_level
   if assistant['nymphomania'] >= -1: assistant['pos_gentle'] = max(assistant['pos_gentle'], interaction_reward_potence)
   assistant_rate['mood'] += interaction_reward_potence*2
   if assistant['virtue'] < interaction_reward_level: assistant_rate['spoil'] += interaction_reward_potence
   if assistant['virtue'] >= interaction_reward_level: assistant_rate['rational'] += min(interaction_reward_potence, assistant['intellect'])
   master_mood_rate += assistant['beauty']*3
  end
${actor(rewardFinish)}  master_hygiene_rate += add_master_hygiene
  assistant_rate['hygiene'] += add_assistant_hygiene
  house_mess_rate += add_house_mess
 end
end
! JO9 MOD END ASSISTANT_REWARD_RESULTS_20261117

! JO9 MOD START J9TP_PRAISE_ASSISTANT`);
const edits=[{location:'interaction',field:'body',old:"gt 'interaction_result'",new:bridge,count:1},{location:'interaction_result',field:'body',old:'! JO9 MOD START J9TP_PRAISE_ASSISTANT',new:effects,count:1}];
const lines=d.lines.slice(),inverse=d.lines.slice(),oldBodies={};for(const e of edits){const l=d.locations.find(l=>l.name===e.location),b=body(e.location);a.equal(b.split(e.old).length-1,1);oldBodies[e.location]=b;lines[l.body]=c.shift(b.replace(e.old,e.new),-5);inverse[l.body]=c.shift(c.shift(lines[l.body],5).replace(e.new,e.old),-5);fs.writeFileSync(H+'/before-'+e.location+'.txt.gz',zlib.gzipSync(Buffer.from(b,'utf8')));}
a(raw.equals(Buffer.from(inverse.join('\r\n'),'utf16le')));const output=Buffer.from(lines.join('\r\n'),'utf16le');a.equal(c.parse(output).locations.length,d.locations.length);
const mod={id:'2026-11-17_assistant_reward_results',status:'APPROVED',description:'Connect existing assistant reward definitions to the current reward/stimulation outcome handlers; preserve direct gains and costs, prevent passive reward AP double charging.',before_sha256:d.hash,after_sha256:c.hash(output),edits};
fs.writeFileSync(H+'/patch.json',JSON.stringify(mod,null,2)+'\n');
const proof={before:d.hash,after:mod.after_sha256,changedLocations:edits.map(e=>e.location),newPersistentFields:0,newLocations:0,sourceRoundtrip:true,inverseByteExact:true,otherFieldsByteExact:lines.every((l,i)=>edits.some(e=>d.locations.find(x=>x.name===e.location).body===i)||l===d.lines[i]),newLoneLF:edits.map(e=>({location:e.location,before:(oldBodies[e.location].match(/(?<!\r)\n/g)||[]).length,after:(c.shift(lines[d.locations.find(x=>x.name===e.location).body],5).match(/(?<!\r)\n/g)||[]).length}))};fs.writeFileSync(H+'/prepared.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));
