'use strict';
const fs=require('fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',raw=fs.readFileSync(W+'/jack.qsp'),d=c.parse(raw),before=c.parse(raw);
const body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
a.equal(d.hash,JSON.parse(fs.readFileSync(__dirname+'/red-results.json','utf8')).beforeHash);
const pages=[
'프리실라는 책장을 넘기던 손을 멈추고 당신을 바라보았다.',
'[프리실라]<br>“돌아왔구나. 정말 그 문을 넘었어?”',
'[당신]<br>“넘었지. 그런데 문 너머에도 갈림길이 한둘이 아니더군. 어디로 갈지는 조금 더 생각해 보기로 했어.”',
'[프리실라]<br>“네 발로 돌아왔으니, 다시 떠날 수도 있겠네. …내가 사람 하나는 제대로 골랐어.”',
'[당신]<br>“그 얘기가 나와서 말인데, 네 책은 아직 여기 있잖아. 누구에게 가져다줘야 하는지도 제대로 듣지 못했고.”',
'프리실라는 펼쳐 놓았던 책을 천천히 덮었다.<br><br>[프리실라]<br>“문을 넘는 일과, 그 책을 받아야 할 사람에게 닿는 일은 다르지.”',
'[당신]<br>“또 막연한 말로 나를 부려먹으려는 건가?”',
'[프리실라]<br>“이번에는 부탁이야. 그 책이 사냥꾼의 손에서 끝나게 둘 수는 없어.”',
'[당신]<br>“그럼 다음에는 어디로 가야 하는지, 누구를 만나야 하는지부터 빠짐없이 설명해.”',
'[프리실라]<br>“알겠어. 다시 떠나기 전에는 나를 찾아와. 책과 함께 전해야 할 말이 있으니까.”',
'그녀는 다시 책 위에 손을 얹었다. 로마를 떠날 길은 열렸지만, 그녀와의 약속까지 끝난 것은 아니었다.',
'프리실라는 책을 옆으로 밀어 놓고 당신에게 손을 내밀었다.<br><br>[프리실라]<br>“돌아와 줬으니, 나도 약속 하나쯤은 먼저 지켜야겠네.”<br>[당신]<br>“이번에도 다른 일부터 시킬 생각은 아니겠지?”<br>[프리실라]<br>“오늘은 일 얘기 안 해. 이리 와.”',
'[프리실라]<br>“넌 정말… 내 예상대로만 움직여 주질 않는구나.”<br>[당신]<br>“돌아오지 않을 줄 알았나?”<br>[프리실라]<br>“…그랬으면 좀 심심했겠지.”',
'[당신]<br>“다음에는 날 시험할 생각 말고, 처음부터 솔직하게 말해.”<br>[프리실라]<br>“알겠어. 그러니 지금은… 조금만 더 여기 있어.”',
'얼마 뒤, 프리실라는 다시 익숙한 미소를 되찾았다.<br><br>[프리실라]<br>“다음에 찾아오면 책 이야기를 마저 하자.”<br>[당신]<br>“이번에는 설명부터 듣겠어.”<br>[프리실라]<br>“기억할게. 오늘 돌아와 준 것도.”'
];
fs.writeFileSync(__dirname+'/approved-pages.json',JSON.stringify(pages,null,2)+'\n');
const assets=[['witch.png','priscilla_post_portal_talk.png'],['witch5.png','priscilla_post_portal_reward_01.png'],['witch6.png','priscilla_post_portal_reward_02.png']].map(([old,name])=>{let source=W+'/content/pic/scene/Witch/'+old,b=fs.readFileSync(source);a.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');return{source,runtimePath:'content/pic/scene/Witch/'+name,repositoryPath:'assets/content/pic/scene/Witch/'+name,bytes:b.length,sha256:c.hash(b),width:b.readUInt32BE(16),height:b.readUInt32BE(20)};});
const portal="city_already_done_ever['6220'] > 0 and grand_final = 0";
const status=cr(`if ${portal}:
 if city_already_done_ever['6026'] > 0:
  $text[1] = '[프리실라]<br>책은 아직 내가 보관하고 있어. 다시 떠나기 전에는 나를 찾아와. 전해야 할 이야기가 남아 있으니까.'
 else
  $text[1] = '[프리실라]<br>돌아왔구나. 다시 말을 걸어 줘. 네가 넘었던 문과 이 책에 대해 할 이야기가 있어.'
 end
elseif witch_talk = 0:
 $text[1] = '[프리실라]<br>야만왕과의 일은 끝났어. 이제 길드에서 나를 만나. 약속한 보상과 앞으로 할 이야기가 있어.'
else
 $text[1] = '[프리실라]<br>이제 네가 찾는 포털로 향할 차례야. 그 문을 넘고 돌아오면 다시 이야기하자. 책은 그때까지 내가 보관하고 있을게.'
end`);
const anchor='IF interaction_city = 6031:';
const router=cr(`! JO9 MOD START PRISCILLA_POST_REBELLION_ROUTE_20261116
if revolution = 1 and interaction_city >= 6021 and interaction_city <= 6024:
 interaction_city = 6024
 if ${portal} and city_already_done_ever['6026'] = 0: interaction_city = 6026
end
! JO9 MOD END PRISCILLA_POST_REBELLION_ROUTE_20261116
`);
const city=body('interaction_city'),oldReminder=/IF interaction_city = 6024:[\s\S]*?\r\nEND/.exec(city)?.[0];a(oldReminder);
const remind=oldReminder.replace(/\r\nEND$/,cr(`
! JO9 MOD START PRISCILLA_POST_REBELLION_HINT_20261116
if revolution = 1:
${status}
end
! JO9 MOD END PRISCILLA_POST_REBELLION_HINT_20261116
END`));
const sceneAnchor='!Saving christmas quest. - RedGreen3';
let scene=cr(`! JO9 MOD START PRISCILLA_POST_PORTAL_SCENE_20261116
IF interaction_city = 6026:
 npc = 0
 $npc_id = ''
 $place = 'slum_house'
 $return_lock = 'shop_general'
 txt_count = 15
`);
for(let i=0;i<pages.length;i++)scene+=` $text[${i+1}] = ${q(pages[i])}\r\n $special_image[${i+1}] = 'scene\\Witch\\${i<13?'priscilla_post_portal_talk.png':i===13?'priscilla_post_portal_reward_01.png':'priscilla_post_portal_reward_02.png'}'\r\n`;
scene+=" witch_talk = 1\r\nEND\r\n! JO9 MOD END PRISCILLA_POST_PORTAL_SCENE_20261116\r\n";
const renderAnchor="gs '_layout'";
const cached=cr(`! JO9 MOD START PRISCILLA_CACHED_REMINDER_20261116
if revolution = 1 and interaction_city >= 6021 and interaction_city <= 6024:
 killvar '$text'
 killvar '$special_action'
 killvar '$special_image'
 killvar '$special_image_full'
 $picture_type = ''
 $bg_path = ''
 npc = 1
 $npc_id = 'witch'
 $place = 'slum_house'
 $return_lock = 'shop_general'
 txt = 1
 txt_count = 1
${status}
end
! JO9 MOD END PRISCILLA_CACHED_REMINDER_20261116
`);
const edits=[{location:'interaction_city',field:'body',old:anchor,new:router+anchor,count:1},{location:'interaction_city',field:'body',old:oldReminder,new:remind,count:1},{location:'interaction_city',field:'body',old:sceneAnchor,new:scene+sceneAnchor,count:1},{location:'interaction_screen_city',field:'body',old:renderAnchor,new:cached+renderAnchor,count:1}];
for(const e of edits){let l=d.locations.find(x=>x.name===e.location),s=body(e.location);a.equal(s.split(e.old).length-1,e.count);d.lines[l.body]=c.shift(s.replace(e.old,()=>e.new),-5);}
const output=c.serialize(d);a(c.serialize(c.parse(output)).equals(output));
fs.mkdirSync(__dirname+'/mod',{recursive:true});fs.writeFileSync(__dirname+'/mod/patch.json',JSON.stringify({id:'2026-11-16_priscilla_post_portal',status:'APPROVED',approval:'User approved manuscript, requested changed reward dialogue and independent copied image names; book delivery/final completion remain future work.',before_sha256:c.hash(raw),after_sha256:c.hash(output),edits},null,2)+'\n');
fs.writeFileSync(__dirname+'/assets.json',JSON.stringify(assets,null,2)+'\n');
const oldScene=s=>s.slice(s.indexOf('IF interaction_city = 6025:'),s.indexOf('!Saving christmas quest.',s.indexOf('IF interaction_city = 6025:')));
const newScene=body('interaction_city');a(oldScene(newScene).startsWith(oldScene(c.shift(before.lines[before.locations.find(x=>x.name==='interaction_city').body],5)).trimEnd()));
console.log(JSON.stringify({prepared:true,before:c.hash(raw),after:c.hash(output),pages:pages.length,images:assets.map(x=>x.runtimePath),newSavedFields:0}));
