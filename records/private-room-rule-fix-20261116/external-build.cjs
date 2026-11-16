'use strict';
const fs=require('fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input=process.env.JO9_EXTERNAL_BASELINE||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(input),d=c.parse(raw);
const before='a244ee964f0aaa1ffd6f0d0696242fa0b2bf6b46841cb3b8df2ca9e7747a416a';a.equal(c.hash(raw),before);
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),nl=s=>s.replace(/\r?\n/g,'\r\n');
const edits=[],patchId='PRIVATE_ROOM_EXTERNAL_RULES_20261116';
function edit(location,old,value){a(old.length>0);const b=body(location);a.equal(b.split(old).length,2,'unique '+location+' anchor');a(!/(?<!\r)\n|\r(?!\n)/.test(value),'new code CRLF');edits.push({location,field:'body',old,new:value,count:1,patchId});}
const blocked=['cooks_rule','cleans_rule','washes_master_rule','pet_rule','silence_rule','toilet_rule','urinal_rule','no_shit_rule','tentacle_rule'];
const clear=(keys,indent)=>keys.map(k=>`${indent}dynamic "room<<jo9_rd_n>>['${k}']=0"`).join('\r\n');
const setOld=nl(` if jo9_rd_d>=2 and jo9_rd_d<=4:
  dynamic "room<<jo9_rd_n>>['cooks_rule']=0"
  dynamic "room<<jo9_rd_n>>['cleans_rule']=0"
  dynamic "room<<jo9_rd_n>>['duty_rules']=0"
 end`);
edit('jo9_room_duty',setOld,nl(` ! JO9 MOD START ${patchId}_SET
 if jo9_rd_d>=2 and jo9_rd_d<=4:
${clear(blocked,'  ')}
  dynamic "room<<jo9_rd_n>>['duty_rules']=0"
 end
 ! JO9 MOD END ${patchId}_SET`));
// Keep the source indentation exactly; only inserted code is normalized.
const actualDaily=body('jo9_room_duty').split('\r\n').find((l,i,ls)=>l.includes('jo9_rd_d=dyneval(')&&ls[i+1]?.trim()==='if jo9_rd_d>0:');a(actualDaily);
const dailyAnchor=actualDaily+'\r\n  if jo9_rd_d>0:';
edit('jo9_room_duty',dailyAnchor,actualDaily+nl(`
  ! JO9 MOD START ${patchId}_DAILY
  if jo9_rd_d>=2 and jo9_rd_d<=4:
${clear(blocked,'   ')}
   dynamic "room<<jo9_rd_n>>['duty_rules']=0"
  end
  ! JO9 MOD END ${patchId}_DAILY
  if jo9_rd_d>0:`));
const stat=body('slave_stat');
edit('slave_stat','\tovernight_rules_count = 0',nl(`\tovernight_rules_count = 0
\t! JO9 MOD START ${patchId}_UI_STATE
\tlocal jo9_private_external=iif(snk_room_target>0 and slave['duty']>=2 and slave['duty']<=4,1,0)
\t! JO9 MOD END ${patchId}_UI_STATE`));
const ids={cooks_rule:'1r',cleans_rule:'2r',washes_master_rule:'3r',pet_rule:'6r',silence_rule:'7r',toilet_rule:'8r',urinal_rule:'9r',no_shit_rule:'10r',tentacle_rule:'11r'};
const household={cooks_rule:'1R',cleans_rule:'2R',washes_master_rule:'3R',tentacle_rule:'11R'};
for(const key of blocked){
 const id=ids[key];let old;
 if(household[key]){
  const first=`\t! JO9 MOD START MAID_DUTY_LOCK_${household[key]}`,s=stat.indexOf(first),z=stat.indexOf(`\t! JO9 MOD END MAID_DUTY_LOCK_${household[key]}`,s);a(s>=0&&z>s);
  const last=stat.indexOf('\r\n',z);old=stat.slice(s,last);
 }else{
  const s=stat.indexOf(`\tif slave["${key}"] = 1:`),z=stat.indexOf('\r\n\tend',s);a(s>=0&&z>s);old=stat.slice(s,z+'\r\n\tend'.length);
 }
 const value=nl(`\t! JO9 MOD START ${patchId}_UI_${id.toUpperCase()}
\tif jo9_private_external=1:
\t *p '<div id="chekbox_${id}"><a class="tooltip-left" tooltip-data="외근 지시를 받은 노예는 수행할 수 없습니다." aria-disabled="true"><img src="content/pic/ui/buttons/legacy/unactive_button.png"></a></div>'
\telse
`)+old+nl(`
\tend
\t! JO9 MOD END ${patchId}_UI_${id.toUpperCase()}`);
 edit('slave_stat',old,value);
}
const patched=c.parse(raw);for(const e of edits){const l=patched.locations.find(l=>l.name===e.location),b=c.shift(patched.lines[l.body],5);a.equal(b.split(e.old).length,2);patched.lines[l.body]=c.shift(b.replace(e.old,()=>e.new),-5);}
const after=c.hash(c.serialize(patched));
const output={schemaVersion:1,patchId,before_sha256:before,after_sha256:after,scope:{locations:['jo9_room_duty','slave_stat'],roles:['room1','room2','room3','room4'],externalDuties:[2,3,4],blockedRules:blocked,preservedRules:['blowjob_rule','humility_rule','no_orgasm_rule','masturbation_rule','v_balls_rule','force_rules'],tooltip:'외근 지시를 받은 노예는 수행할 수 없습니다.',notes:['Staged edits only; no production QSP or tracked source changes.','No assistant support, guilt helper changes, equipment removal or save schema changes.','Preserves existing nonexternal household notice and manual prerequisite branches.']},edits};
fs.writeFileSync(__dirname+'/external-edits.json',JSON.stringify(output,null,2));
fs.writeFileSync(__dirname+'/external-scope.json',JSON.stringify({patchId,beforeSha256:before,stagedAfterSha256:after,editCount:edits.length,locations:output.scope.locations,blockedRules:blocked.length,preservedRules:6,tooltip:output.scope.tooltip,productionUnchanged:c.hash(fs.readFileSync(input))===before},null,2));
console.log(JSON.stringify({editCount:edits.length,stagedAfterSha256:after,output:__dirname+'/external-edits.json'}));
