'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(input),doc=core.parse(raw),expected='c149e6b5728b3ec5ae4f5e508fa60b446bdca84644f3df9b84d70636672b19df';
assert.equal(doc.hash,expected,'WORK baseline changed; re-audit before generating');
const nl=s=>s.replace(/\r?\n/g,'\r\n');
const get=name=>core.shift(doc.lines[doc.locations.find(x=>x.name===name).body],5);
const original=new Map(doc.locations.map(l=>[l.name,get(l.name)])),edits=[];
function change(location,oldText,newText,count=1){
 const l=doc.locations.find(x=>x.name===location),body=get(location),old=nl(oldText),next=nl(newText);
 assert.equal(body.split(old).length-1,count,`${location}: old anchor count`);
 assert.notEqual(old,next);
 edits.push({location,field:'body',old,new:next,count});
 doc.lines[l.body]=core.shift(body.split(old).join(next),-5);
}
const oldHelper=get('jo9_seed_role_images');
let alias=oldHelper.replace("if $args[0]='resolve':","if $args[0]='alias':");
const aliasHook=String.raw` $jo9_seed_role_wanted=$args[3]
! JO9 MOD START ISABELLA_SHARED_CACHE_BY_ID_20261105
 ! Only the known shared default is redirected; custom actor appearances remain direct candidates.
 if $args[2]='girls/full/isabella_black_long_milf':
  if jo9_seed_role_id=2323: $result='girls/full/2323/2323_full_title' & exit
  if jo9_seed_role_id=2571: $result='girls/full/isabella_black_long' & exit
 end
! JO9 MOD END ISABELLA_SHARED_CACHE_BY_ID_20261105`;
alias=alias.replace(" $jo9_seed_role_wanted=$args[3]",nl(aliasHook));
const prefix=nl(fs.readFileSync(path.join(__dirname,'lookup-prefix.qsrc'),'utf8').trimEnd())+'\r\n';
const helper=prefix+alias;
change('jo9_seed_role_images',oldHelper,helper);
fs.writeFileSync(path.join(__dirname,'helper-new.qsrc'),helper,'utf8');

// Preserve actor/outfit selection above this block and existing HTML/image-slot routing below it.
const full=get('display_fullimage');
const start=full.indexOf('! JO9 MOD START EGEYA_STALE_ROLE_IMAGES_20261022');
const end=full.indexOf('! JO9 MOD START J9M1255');
assert.ok(start>=0&&end>start);
change('display_fullimage',full.slice(start,end),String.raw`! JO9 MOD START GIRL_IMAGE_DUAL_REGISTRATION_20261105
local $jo9_full_old_key
$jo9_full_old_key='fullimage'
if $actor_name='assistant' and $assistant_img_key ! '': $jo9_full_old_key=$assistant_img_key
if $jo9_full_old_key='fullimage' and $patch_img_arr_name='indpack_maid': $jo9_full_old_key='fullmade'
if $jo9_full_old_key='fullimage' and $patch_img_arr_name='indpack_secr': $jo9_full_old_key='fullsecretary'
if $jo9_full_old_key='fullimage' and $patch_img_arr_name='indpack_dom': $jo9_full_old_key='fullmistress'
$patch_mood_suffix=''
if actor_arousal>3:
 $patch_mood_suffix='_horny'
elseif actor_moral<3:
 $patch_mood_suffix='_rebel'
end
$res_image_path=func('jo9_seed_role_images','select',actor_type,$def_image_path,$jo9_full_old_key,$patch_img_arr_name,$patch_mood_suffix,'pack')
! JO9 MOD END GIRL_IMAGE_DUAL_REGISTRATION_20261105

`);

// Either registration enables an outfit, even when its files are missing.
for(const [oldKey,packKey]of [['fullmade','indpack_maid'],['fullsecretary','indpack_secr'],['fullmistress','indpack_dom']]){
 change('assistant_stat',`$${oldKey}[assistant_type] ! ''`,`func('jo9_seed_role_images','registered',assistant_type,'${oldKey}','${packKey}') ! 0`,2);
 const old=`$assistant[''fullimage''] = $${oldKey}[assistant_type]`;
 const next=`$assistant[''fullimage''] = func(''jo9_seed_role_images'',''select'',assistant_type,$${oldKey}[assistant_type],''${oldKey}'',''${packKey}'','''',''pack'')`;
 change('assistant_stat',old,next);
}
change('assistant_stat',"$assistant[''fullimage''] = $fullimage[assistant_type]","$assistant[''fullimage''] = func(''jo9_seed_role_images'',''select'',assistant_type,$fullimage[assistant_type],''fullimage'',''indpack_title'','''',''pack'')");
change('menu_form',"! JO9 MOD START ROOM_IMAGE_LINK_1 | 2026-10-19_room_appearance_routing\n\tif nsfw = 0 and $assistant['fullimage'] ! '': $text_display += func('display_fullimage', 'assistant', 'center_image_home')","! JO9 MOD START ROOM_IMAGE_LINK_1 | 2026-10-19_room_appearance_routing\n\tif nsfw = 0: $text_display += func('display_fullimage', 'assistant', 'center_image_home')");
change('$addon_custom_data',String.raw`$iif($indpack_title[args[1]] ! "", $indpack_title[args[1]], $fullimage[args[1]])`,String.raw`func("jo9_seed_role_images","select",args[1],$fullimage[args[1]],"fullimage","indpack_title","","pack")`);
change('black_market_interface',String.raw`$iif($indpack_title[s_type] ! "", $indpack_title[s_type], $fullimage[s_type])`,String.raw`func("jo9_seed_role_images","select",s_type,$fullimage[s_type],"fullimage","indpack_title","","pack")`);
change('stasis_cell',String.raw`$iif($indpack_title[dynslave_type] ! "", $indpack_title[dynslave_type], func("jo9_seed_role_images", "resolve", dynslave_type, $dynslave["fullimage"], "fullimage"))`,String.raw`func("jo9_seed_role_images","select",dynslave_type,$dynslave["fullimage"],"fullimage","indpack_title","","pack")`);
const plastic=get('plastics'),pa=plastic.indexOf("if $special_image[txt] ! '':"),pb=plastic.indexOf('! JO9 MOD START J9M1383');
assert.ok(pa>=0&&pb>pa);
change('plastics',plastic.slice(pa,pb),String.raw`! JO9 MOD START GIRL_IMAGE_DUAL_REGISTRATION_20261105
$special_image_out=func('jo9_seed_role_images','select',txt,$special_image[txt],'fullimage','indpack_naked','','pack')
if $special_image_out ! '':
! JO9 MOD END GIRL_IMAGE_DUAL_REGISTRATION_20261105
`);
change('interaction',"$special_image[1] = $fullimage[slave_type]","$special_image[1] = func('jo9_seed_role_images','select',slave_type,$fullimage[slave_type],'fullimage','indpack_title','','legacy')");

const after=core.serialize(doc);assert.ok(core.serialize(core.parse(after)).equals(after),'candidate QSP roundtrip');
// Reverse every edit in reverse order and compare original bytes, not only decoded text.
for(const e of edits.toReversed()){
 const l=doc.locations.find(x=>x.name===e.location),body=get(e.location);
 assert.equal(body.split(e.new).length-1,e.count,`${e.location}: reverse count`);
 doc.lines[l.body]=core.shift(body.split(e.new).join(e.old),-5);
}
assert.ok(core.serialize(doc).equals(raw),'reverse patch original-byte proof');
const audit=require('../../girls-checklist-20261104/dual-registration/audit.json');
const unchanged=doc.locations.filter(l=>!edits.some(e=>e.location===l.name)).length;
const report={baseline:doc.hash,after:core.hash(after),locations:doc.locations.length,changedLocations:[...new Set(edits.map(e=>e.location))],editCount:edits.length,unchangedLocations:unchanged,roundtrip:true,reverseByteIdentical:true,existingResolverCalls:audit.resolverCallers.filter(x=>x.code.includes('resolve')).length,preservedNonRenderingClasses:[...new Set(audit.callsites.filter(x=>!['definition_preview','home_render_presence_gate','common_action_full_image_resolution','common_full_image_resolution','event_or_result_cached_image_resolution','assistant_role_menu_gate','assistant_role_click_cache_or_gate','direct_event_seed_image','appearance_change_preview','direct_definition_preview','existing_alias_resolver'].includes(x.semanticClass)).map(x=>x.semanticClass))],workWritten:false};
fs.writeFileSync(path.join(__dirname,'mods.json'),JSON.stringify(edits,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
