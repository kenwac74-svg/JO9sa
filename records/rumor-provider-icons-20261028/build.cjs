'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const baseline='f0911bef8f53ef1464edc3d107beccaca3af90c7f0368a4b7df92f7a6082e1b2';
const input=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(input),d=c.parse(raw);a.equal(d.hash,baseline);
const get=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),cr=s=>s.replace(/\r?\n/g,'\r\n'),edits=[];
function edit(location,old,now,id){old=cr(old);now=cr(now);const l=d.locations.find(x=>x.name===location),s=get(location);a.equal(s.split(old).length-1,1,id);d.lines[l.body]=c.shift(s.replace(old,()=>now),-5);edits.push({location,field:'body',old,new:now,count:1,patchId:id});}
const selection=`! JO9 MOD START RUMOR_PROVIDER_ICON_SELECT_20261028
local $jo9_rm_icon = $menu_item_services
if $jo9_rm_provider = 'barman': $jo9_rm_icon = $menu_item_preferencesbar
if $jo9_rm_provider = 'anes': $jo9_rm_icon = $menu_item_anes
! JO9 MOD END RUMOR_PROVIDER_ICON_SELECT_20261028`;
edit('jo9_buyer_rumors',"local $jo9_rm_provider = $args[1]","local $jo9_rm_provider = $args[1]\r\n"+selection,'RUMOR_PROVIDER_ICON_SELECT_20261028');
for(const [label,key] of [['구매자 소문을 듣는다','BUY'],['이전 소문','PREVIOUS'],['다음 소문','NEXT']]){
 const lines=get('jo9_buyer_rumors').split('\r\n').filter(s=>s.includes("func('$menu', 'exec', $menu_item_services,")&&s.includes(label));a.equal(lines.length,1,key);
 const old=lines[0],id='RUMOR_PROVIDER_ICON_'+key+'_20261028',now='! JO9 MOD START '+id+'\r\n'+old.replace('$menu_item_services','$jo9_rm_icon')+'\r\n! JO9 MOD END '+id;
 edit('jo9_buyer_rumors',old,now,id);
}
const redraw=`! JO9 MOD START RUMOR_PROVIDER_ICON_LOAD_20261028
! Repaint the saved result only; no consultation or new charge is made.
if $curloc = 'jo9_buyer_rumors' and ($jo9_rumor_provider = 'barman' or $jo9_rumor_provider = 'anes'): gt 'jo9_buyer_rumors', 'view', $jo9_rumor_provider
! JO9 MOD END RUMOR_PROVIDER_ICON_LOAD_20261028`;
edit('$ongload','! JO9 MOD END JULIA_MEETING_LOAD_REDRAW_20261028','! JO9 MOD END JULIA_MEETING_LOAD_REDRAW_20261028\r\n'+redraw,'RUMOR_PROVIDER_ICON_LOAD_20261028');
const bytes=c.serialize(d),after=c.hash(bytes),back=c.parse(bytes);a(c.serialize(back).equals(bytes));
for(const e of [...edits].reverse()){const l=back.locations.find(x=>x.name===e.location),s=c.shift(back.lines[l.body],5);a.equal(s.split(e.new).length-1,1);back.lines[l.body]=c.shift(s.replace(e.new,()=>e.old),-5);}
a(c.serialize(back).equals(raw));
const patch={id:'2026-10-28_rumor_provider_icons',description:'스컵스·바텐더·아네스별 기존 소문 메뉴 아이콘 연결. 구 결과화면은 추가 구매 없이 재표시.',before_sha256:baseline,after_sha256:after,edits};
fs.writeFileSync(path.join(__dirname,patch.id+'.json'),JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'load-redraw.qspsrc'),cr(redraw));
console.log(JSON.stringify({before:baseline,after,edits:edits.length,locations:[...new Set(edits.map(e=>e.location))],newLocations:0,newPersistentKeys:0,reverseExact:true}));
