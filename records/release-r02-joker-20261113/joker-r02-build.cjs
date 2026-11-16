'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');const {R,G,D,T,c,qa,rd,wr,nl,body,put}=require('./joker-r02-task.cjs');
const red=rd(D+'/native-red-report.json');a.equal(red.passed,false);a.equal(red.observations[0].failed,2);a(red.observations[0].failures.includes('menu_link_1_3000_0'));
const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a(raw.equals(fs.readFileSync(G+'/jack.qsp')));const d=c.parse(raw),edits=[],id='2026-11-13_r02_joker_purchase_guard';
const replace=(location,old,next)=>{const s=body(d,location);a.equal(s.split(old).length-1,1,location);put(d,location,s.replace(old,()=>next));edits.push({location,field:'body',old,new:next,count:1,patchId:'R02_JOKER_PURCHASE_20261113'});};
replace('#options',nl("\t\tif jokr = 0:\n\t\tif sparks < 3000:"),nl("\t\tif joker = 0:\n\t\tif sparks < 3000:"));
const cache=nl(`! JO9 MOD START R02_JOKER_MENU_CACHE_20261113
if $args[0] = 'jo9_joker_menu_cache':
 $KulaShop_options[2] = replace($KulaShop_options[2], 'if jokr = 0:', 'if joker = 0:')
 local jo9_joker_cache_i
 for jo9_joker_cache_i = 0 to arrsize('$display_options') - 1:
  if instr($display_options[jo9_joker_cache_i], 'menu_BuyJoker') > 0:
   $display_options[jo9_joker_cache_i] = replace($display_options[jo9_joker_cache_i], 'if jokr = 0:', 'if joker = 0:')
  end
 end
 exit
end
! JO9 MOD END R02_JOKER_MENU_CACHE_20261113
`);
replace('#options',body(d,'#options').split('\r\n')[0]+'\r\n',cache+body(d,'#options').split('\r\n')[0]+'\r\n');
const guard=nl(`! JO9 MOD START R02_JOKER_STALE_PURCHASE_GUARD_20261113
! A saved link must obey the same conditions as the current purchase menu.
if interaction_city = 6244 and (joker ! 0 or sparks < 3000 or slave_state ! CONST_INT['no_slave']):
 gs '#options', 'jo9_joker_menu_cache'
 if instr($display_options[2], 'menu_BuyJoker') = 0: $display_options[2] = $KulaShop_options[2]
 npc = 1
 $npc_id = 'kula'
 $place = 'kulashop'
 $return_lock = 'shop_general'
 sp_txt = 2
 skip_to = 0
 gt 'shop_general'
end
! JO9 MOD END R02_JOKER_STALE_PURCHASE_GUARD_20261113
`);
replace('interaction_city',body(d,'interaction_city').split('\r\n')[0]+'\r\n',guard+body(d,'interaction_city').split('\r\n')[0]+'\r\n');
const load=nl(`! JO9 MOD START R02_JOKER_SAVED_MENU_20261113
gs '#options', 'jo9_joker_menu_cache'
! JO9 MOD END R02_JOKER_SAVED_MENU_20261113
`);
replace('$ongload',body(d,'$ongload').split('\r\n')[0]+'\r\n',load+body(d,'$ongload').split('\r\n')[0]+'\r\n');
const redraw=nl(`
! JO9 MOD START R02_JOKER_LOAD_REDRAW_20261113
! Redraw the saved menu only; never invoke interaction_city or regenerate an actor.
if $curloc = 'shop_general' and $place = 'kulashop' and (sp_txt = 2 or skip_to = 2) and instr($display_options[2], 'menu_BuyJoker') > 0: gt 'shop_general'
! JO9 MOD END R02_JOKER_LOAD_REDRAW_20261113
`);
const oldLoad=body(d,'$ongload');replace('$ongload',oldLoad,oldLoad+redraw);
const candidate=c.serialize(d);qa.inspectWorld(candidate);a(c.serialize(c.parse(candidate)).equals(candidate));const beforeDoc=c.parse(raw),changed=d.locations.filter(l=>body(d,l.name)!==body(beforeDoc,l.name)).map(l=>l.name);a.deepEqual(changed.slice().sort(),['#options','interaction_city','$ongload'].sort());
const buy=x=>x.slice(x.indexOf('if interaction_city = 6244:',x.indexOf('! JO9 MOD END R02_JOKER_STALE_PURCHASE_GUARD_20261113')+1),x.indexOf('if interaction_city = 6245:'));
// The original transaction, seed, price and swap remain byte-identical.
const oldCity=body(beforeDoc,'interaction_city'),newCity=body(d,'interaction_city');a.equal(buy(newCity),oldCity.slice(oldCity.indexOf('if interaction_city = 6244:'),oldCity.indexOf('if interaction_city = 6245:')));
const mod={id,status:'APPROVED',description:'R02 사용자 승인: 조커 실제구매기록 joker로 검사 통일,옛 메뉴 조건만 갱신,저장된 구매 링크의 재결제/인물덮어쓰기 차단. 가격/프리셋/진행 보존.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits};
wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',candidate);fs.writeFileSync(T+'/replay.qsp',raw);wr(D+'/plan.json',{id,before:mod.before_sha256,after:mod.after_sha256,edits:edits.length,changedLocations:changed,modFile:T+'/mods/'+id+'.json',transactionPreserved:true});console.log(JSON.stringify({candidate:mod.after_sha256,edits:edits.length,changed}));
