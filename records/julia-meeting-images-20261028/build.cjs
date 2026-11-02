'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(input),d=c.parse(raw),baseline='3fbdb2cca0e3eb2d4a70c2f9b442f2fb39bb756f1aefe6217cf8c10668f1106c';a.equal(d.hash,baseline);
const get=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),cr=s=>s.replace(/\r?\n/g,'\r\n'),edits=[];
function edit(location,old,now,key){old=cr(old);now=cr(now);const l=d.locations.find(x=>x.name===location),s=get(location);a.equal(s.split(old).length-1,1,key);d.lines[l.body]=c.shift(s.replace(old,()=>now),-5);edits.push({location,field:'body',old,new:now,count:1,patchId:key});}
const scene=get('interaction_city').slice(get('interaction_city').indexOf('if interaction_city = 163:'),get('interaction_city').indexOf('!Arena',get('interaction_city').indexOf('if interaction_city = 163:')));
for(const [page,oldNpc,newNpc] of [[3,'alyce','julia'],[15,'kuma','julia'],[16,'alyce','johanna'],[17,'kuma','johanna'],[18,'alyce','julia']]){
 const start=scene.indexOf(`\t$special_action[${page}] = {`),end=scene.indexOf('\r\n\t}',start);a(start>=0&&end>start);
 const old=scene.slice(start,end+'\r\n\t}'.length),find=`$npc_id = '${oldNpc}'`;a.equal(old.split(find).length-1,1);
 const id='JULIA_MEETING_NPC_'+page+'_20261028',now='! JO9 MOD START '+id+'\r\n'+old.replace(find,()=>`$npc_id = '${newNpc}'`)+'\r\n! JO9 MOD END '+id;
 edit('interaction_city',old,now,id);
}
const repair=`! JO9 MOD START JULIA_MEETING_SAVED_ACTIONS_20261028
if interaction_city = 163:
 $special_action[3] = replace($special_action[3], "$npc_id = 'alyce'", "$npc_id = 'julia'")
 $special_action[15] = replace($special_action[15], "$npc_id = 'kuma'", "$npc_id = 'julia'")
 $special_action[16] = replace($special_action[16], "$npc_id = 'alyce'", "$npc_id = 'johanna'")
 $special_action[17] = replace($special_action[17], "$npc_id = 'kuma'", "$npc_id = 'johanna'")
 $special_action[18] = replace($special_action[18], "$npc_id = 'alyce'", "$npc_id = 'julia'")
 if $npc_id = 'alyce' or $npc_id = 'kuma':
  if (txt >= 3 and txt <= 15) or txt = 18: $npc_id = 'julia'
  if txt = 16 or txt = 17: $npc_id = 'johanna'
 end
end
! JO9 MOD END JULIA_MEETING_SAVED_ACTIONS_20261028`;
edit('interaction_screen_city',"gs '_layout'\r\nif $special_action[txt] ! '':", "gs '_layout'\r\n"+repair+"\r\nif $special_action[txt] ! '':",'JULIA_MEETING_SAVED_ACTIONS_20261028');
const load=`! JO9 MOD START JULIA_MEETING_LOAD_REDRAW_20261028
! Redraw only the obsolete saved NPC page; never regenerate the event actor.
if $curloc = 'interaction_screen_city' and interaction_city = 163 and txt >= 3 and txt <= 18 and ($npc_id = 'alyce' or $npc_id = 'kuma'): gt 'interaction_screen_city'
! JO9 MOD END JULIA_MEETING_LOAD_REDRAW_20261028`;
edit('$ongload','! JO9 MOD END PROFILE_POLISH_20261025_R3\r\n! JO9 MOD END UI_RESOURCE_PATHS_20261027','! JO9 MOD END PROFILE_POLISH_20261025_R3\r\n! JO9 MOD END UI_RESOURCE_PATHS_20261027\r\n'+load,'JULIA_MEETING_LOAD_REDRAW_20261028');
const out=c.serialize(d),after=c.hash(out);a.equal(c.parse(out).locations.length,d.locations.length);a(c.serialize(c.parse(out)).equals(out));
const reverse=c.parse(out);
for(const e of [...edits].reverse()){const l=reverse.locations.find(x=>x.name===e.location),s=c.shift(reverse.lines[l.body],5);a.equal(s.split(e.new).length-1,1);reverse.lines[l.body]=c.shift(s.replace(e.new,()=>e.old),-5);}
a(c.serialize(reverse).equals(raw));
const patch={id:'2026-10-28_julia_meeting_npc_images',description:'줄리아 재회 장면의 NPC 참조5곳 교정과 기존 중간저장 표시 복구. 이벤트 인물 재생성 없이 renderer만 갱신.',before_sha256:baseline,after_sha256:after,edits};
fs.writeFileSync(path.join(__dirname,patch.id+'.json'),JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'saved-actions.qspsrc'),cr(repair));fs.writeFileSync(path.join(__dirname,'load-redraw.qspsrc'),cr(load));
console.log(JSON.stringify({before:baseline,after,edits:edits.length,changedLocations:[...new Set(edits.map(e=>e.location))],newLocations:0,newPersistentKeys:0,reverseExact:true}));
