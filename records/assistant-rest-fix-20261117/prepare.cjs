'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(source),doc=c.parse(raw),loc=doc.locations.find(l=>l.name==='interaction_result'),oldBody=c.shift(doc.lines[loc.body],5);
assert(raw.equals(Buffer.from(doc.lines.join('\r\n'),'utf16le')));
const anchor='!interaction type - verbal punishment';assert.equal(oldBody.split(anchor).length-1,1);
const block=[
'! JO9 MOD START ASSISTANT_REST_EFFECTS_20261117',
"if $interaction_type = 'assistant_rest':",
' interaction_no_auto_energy_drop = 1',
" if interaction_assistant['res'] >= 0:",
'  dynamic $special_part',
"  assistant_rate['hygiene'] += add_assistant_hygiene",
"  if cheat_inf_en = 0: assistant['energy'] -= free_time",
' end',
' free_time = 0',
'end',
'! JO9 MOD END ASSISTANT_REST_EFFECTS_20261117',
'',anchor].join('\r\n');
const afterBody=oldBody.replace(anchor,block),lines=doc.lines.slice();lines[loc.body]=c.shift(afterBody,-5);const after=Buffer.from(lines.join('\r\n'),'utf16le'),check=c.parse(after);
assert.equal(check.locations.length,doc.locations.length);for(let i=0;i<lines.length;i++)if(i!==loc.body)assert.equal(lines[i],doc.lines[i]);
const inverse=check.lines.slice();inverse[loc.body]=c.shift(afterBody.replace(block,anchor),-5);assert(raw.equals(Buffer.from(inverse.join('\r\n'),'utf16le')));
const mod={id:'2026-11-17_assistant_rest_effects',status:'APPROVED',description:'Execute the existing assistant rest special effects once; use declared rest time and hygiene delta without double AP charging. Preserve growth formulas and existing infinite AP cheat.',before_sha256:doc.hash,after_sha256:c.hash(after),edits:[{location:'interaction_result',field:'body',old:anchor,new:block,count:1}]};
fs.writeFileSync(path.join(__dirname,'patch.json'),JSON.stringify(mod,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'before-interaction_result.txt'),oldBody,'utf8');
fs.writeFileSync(path.join(__dirname,'prepared.json'),JSON.stringify({before:doc.hash,after:mod.after_sha256,changedLocations:['interaction_result'],edits:1,newPersistentFields:0,newLocations:0,sourceRoundtrip:true,inverseByteExact:true,otherFieldsByteExact:true,oldLoneLF:(oldBody.match(/(?<!\r)\n/g)||[]).length,newLoneLF:(afterBody.match(/(?<!\r)\n/g)||[]).length},null,2)+'\n');
process.stdout.write(JSON.stringify({before:doc.hash,after:mod.after_sha256,changedLocations:['interaction_result'],addedLines:11,bytes:after.length})+'\n');
