'use strict';
const fs=require('fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
a.equal(d.hash,JSON.parse(fs.readFileSync(__dirname+'/red-results.json','utf8')).sourceHash);
const city=body('interaction_city');const matches=[...city.matchAll(/^([ \t]*)npc_progress\['Amarida'\] = 1\r\n[\s\S]*?copyarr '\$text', '\$Amarida_pref'/gm)];
a.equal(matches.length,2);a.equal(matches[0][0],matches[1][0]);
const old=matches[0][0],message="[아마리다]<br>이 의뢰는 이미 완료되었습니다.";
const replacement="! JO9 MOD START AMARIDA_COMPLETED_OFFER_20261116\r\nif npc_progress['Amarida'] < 2:\r\n"+old+"\r\nelse\r\n txt_count = 1\r\n $text[1] = '"+message+"'\r\nend\r\n! JO9 MOD END AMARIDA_COMPLETED_OFFER_20261116";
const anchor='if sp_txt_is_set_from_save = 0: sp_txt = 1';
const guard=`
! JO9 MOD START AMARIDA_CACHED_DELIVERY_GUARD_20261116
if $npc_id = 'Amarida' and npc_progress['Amarida'] >= 2 and $interaction_type = 'sell_slave_complex':
 $interaction_type = 'basic'
 npc = 1
 $place = 'fashion_house'
 $return_lock = 'shop_general'
 $picture_type = ''
 $bg_path = ''
 killvar '$text'
 killvar '$special_image'
 killvar '$special_image_full'
 killvar '$special_action'
 txt = 1
 txt_count = 1
 $text[1] = '${message}'
end
! JO9 MOD END AMARIDA_CACHED_DELIVERY_GUARD_20261116`.replace(/\n/g,'\r\n');
const edits=[{location:'interaction_city',field:'body',old,new:replacement,count:2,patchId:'AMARIDA_COMPLETED_OFFER_20261116'},{location:'interaction_result_city',field:'body',old:anchor,new:anchor+'\r\n'+guard,count:1,patchId:'AMARIDA_CACHED_DELIVERY_GUARD_20261116'}];
for(const e of edits){let l=d.locations.find(l=>l.name===e.location),s=body(e.location);a.equal(s.split(e.old).length-1,e.count);d.lines[l.body]=c.shift(s.split(e.old).join(e.new),-5);}
const after=c.serialize(d);a(c.serialize(c.parse(after)).equals(after));
fs.mkdirSync(__dirname+'/mod',{recursive:true});fs.writeFileSync(__dirname+'/mod/patch.json',JSON.stringify({id:'2026-11-16_amarida_completed_guard',status:'APPROVED',approval:'User: fix Amarida bug; defer Priscilla story branch for discussion.',before_sha256:c.hash(raw),after_sha256:c.hash(after),edits},null,2)+'\n');
console.log(JSON.stringify({prepared:true,before:c.hash(raw),after:c.hash(after),locations:d.locations.length,editedLocations:edits.map(e=>e.location),newSavedFields:0}));
