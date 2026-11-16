'use strict';const fs=require('fs'),R='G:/somi/JO9sa',T='G:/Codex/tmp/room-duty-fixes-20261114',D=R+'/records/room-duty-fixes-20261114',c=require(R+'/tools/text-workshop/core.cjs');fs.mkdirSync(D,{recursive:true});let raw=fs.readFileSync(T+'/baseline.qsp'),d=c.parse(raw),edits=[];function edit(n,old,v){let l=d.locations.find(x=>x.name===n),b=c.shift(d.lines[l.body],5);if(b.split(old).length!==2)throw Error('count '+n+' '+old.slice(0,60));d.lines[l.body]=c.shift(b.replace(old,v),-5);edits.push({location:n,field:'body',old,new:v,count:1,patchId:'ROOM_DUTY_GEAR_TOOLTIP_BGM_20261114'});}let rb=c.shift(d.lines[d.locations.find(x=>x.name==='jo9_room_duty').body],5),styleLine=rb.split('\r\n').find(x=>x.includes('<style id="jo9_duty_style">'));edit('jo9_room_duty',' for jo9_rd_i=0 to 1 step 1:\r\n  $jo9_rd_h=\'right_wpn\'\r\n  if jo9_rd_i=1: $jo9_rd_h=\'left_wpn\'',' ! JO9 MOD START ROOM_DUTY_GEAR_TOOLTIP_BGM_20261114\r\n for jo9_rd_i=0 to 2 step 1:\r\n  $jo9_rd_h=\'right_wpn\'\r\n  if jo9_rd_i=1: $jo9_rd_h=\'left_wpn\'\r\n  if jo9_rd_i=2: $jo9_rd_h=\'back_wpn\'\r\n ! JO9 MOD END ROOM_DUTY_GEAR_TOOLTIP_BGM_20261114');edit('jo9_room_duty',styleLine,' ! Duty layout and tooltip bounds are defined in css/base.css (ROOM_DUTY_GEAR_TOOLTIP_BGM_20261114).');edit('jo9_room_duty',"   $jo9_rd_h=func('jo9_room_duty','help',jo9_rd_d)","   $jo9_rd_h=replace(replace(func('jo9_room_duty','help',jo9_rd_d),'. ','.&#10;'),'<br>','&#10;')");edit('jo9_room_duty',"    $jo9_rd_h += '<br>현재 불가 사유: '","    $jo9_rd_h += '&#10;현재 불가 사유: '");for(let tag of ['<span class="jo9_duty_tag">진행 중</span>','', '<span class="jo9_duty_tag"><<$jo9_rd_g>></span>'])edit('jo9_room_duty',(tag?'':'unsel_button.png">')+'<<$jo9_rd_t>>'+tag+'</a>',(tag?'':'unsel_button.png">')+'<span class="jo9_duty_label"><<$jo9_rd_t>></span>'+tag+'</a>');let old=fs.readFileSync(T+'/audio-line.txt','utf8');edit('#options',old,old.replace("fight_master.mp3',1 & play","fight_master.mp3',0 & play").replace(', sound_volume,',', music_volume,'));let helper=`! JO9 MOD START ROOM_DUTY_GEAR_TOOLTIP_BGM_20261114
if $args[0]='fog_cache':
 local $jo9_fog_code, $jo9_fog_path
 $jo9_fog_code=$args[1]
 local jo9_fog_slash
 $jo9_fog_code=replace($jo9_fog_code,'fight_master.wav','fight_master.mp3')
 for jo9_fog_slash=0 to 1:
  $jo9_fog_path='content/snd/fight_master.mp3'
  if jo9_fog_slash=1: $jo9_fog_path='content\\snd\\fight_master.mp3'
  $jo9_fog_code=replace($jo9_fog_code,"play '"+$jo9_fog_path+"', sound_volume","play '"+$jo9_fog_path+"', music_volume")
  $jo9_fog_code=replace($jo9_fog_code,"play '"+$jo9_fog_path+"',sound_volume","play '"+$jo9_fog_path+"',music_volume")
  $jo9_fog_code=replace($jo9_fog_code,"event','"+$jo9_fog_path+"',1","event','"+$jo9_fog_path+"',0")
 end
 $result=$jo9_fog_code
 exit
end
! JO9 MOD END ROOM_DUTY_GEAR_TOOLTIP_BGM_20261114
`;edit('jo9_audio_formats',"local jo9_audio_i",helper.replace(/\n/g,'\r\n')+'local jo9_audio_i');let cache=`! JO9 MOD START ROOM_DUTY_GEAR_TOOLTIP_BGM_20261114
$fogs_options[2]=func('jo9_audio_formats','fog_cache',$fogs_options[2])
for jo9_audio_i=0 to arrsize('$display_options')-1:
 $display_options[jo9_audio_i]=func('jo9_audio_formats','fog_cache',$display_options[jo9_audio_i])
end
if $toplay='jo9_direct_event' and lcase(replace($func('jo9_audio_formats','path',$music_now),'\\','/'))='content/snd/fight_master.mp3': jo9_bgm_event_sound=0
! JO9 MOD END ROOM_DUTY_GEAR_TOOLTIP_BGM_20261114
`;edit('jo9_audio_formats',"$jo9_audio_old=$music_now",cache.replace(/\n/g,'\r\n')+'$jo9_audio_old=$music_now');let out=c.serialize(d);fs.mkdirSync(T+'/mods',{recursive:true});fs.writeFileSync(T+'/mods/20261114_room_duty_gear_tooltip_bgm.json',JSON.stringify({id:'ROOM_DUTY_GEAR_TOOLTIP_BGM_20261114',status:'APPROVED',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits},null,2));fs.writeFileSync(T+'/candidate.qsp',out);
let css=fs.readFileSync(T+'/base-before.css','utf8'),newcss=`/* JO9 MOD START ROOM_DUTY_GEAR_TOOLTIP_BGM_20261114 */
#jo9_duty_panel{position:absolute;left:0;top:0;width:426px;height:242px;box-sizing:border-box;padding:14px 18px 8px 20px;font-family:"경기천년제목 Medium";color:#211a11}
#jo9_duty_panel .jo9_duty_title{font-size:22px;line-height:30px;margin-bottom:6px}
#jo9_duty_panel .jo9_duty_row{display:block;position:relative;height:30px;line-height:30px;padding-left:36px;font-size:16px;color:#211a11;text-decoration:none;white-space:nowrap}
#jo9_duty_panel .jo9_duty_label{display:block;padding-right:52px;white-space:nowrap}
#jo9_duty_panel .jo9_duty_row img{position:absolute;left:4px;top:3px;width:24px;height:24px}
#jo9_duty_panel a.jo9_duty_row:hover{color:#70430c;background:rgba(245,218,158,.25)}
#jo9_duty_panel .jo9_duty_on{color:#70430c}
#jo9_duty_panel .jo9_duty_off{opacity:.55}
#jo9_duty_panel .jo9_duty_tag{position:absolute;right:0;top:0;width:48px;font-size:12px;text-align:right;color:#6b5a3e}
#jo9_duty_panel .jo9_duty_mode{font-size:15px;color:#6b5a3e;padding-left:8px;height:26px;line-height:26px}
#jo9_duty_panel a.jo9_duty_mode:hover{color:#70430c}
#jo9_duty_panel .jo9_duty_empty{font-size:18px;margin:10px 0}
#snk_private_room #jo9_duty_panel [tooltip-data]:after{position:fixed!important;left:330px!important;right:auto!important;top:120px!important;bottom:auto!important;width:460px!important;min-width:0!important;max-width:460px!important;max-height:620px!important;box-sizing:border-box;padding:12px 16px;overflow-y:auto;white-space:pre-line!important;word-wrap:break-word;text-align:left;font:16px/23px 'Malgun Gothic','맑은 고딕',sans-serif!important}
/* JO9 MOD END ROOM_DUTY_GEAR_TOOLTIP_BGM_20261114 */
`.replace(/\n/g,'\r\n');let anchor='/* Fixed game-canvas navigation, independent of menu row count and nesting. */';if(css.split(anchor).length!==2)throw Error('css anchor');css=css.replace(anchor,newcss+anchor);fs.writeFileSync(T+'/base-after.css',css);fs.copyFileSync(__filename,D+'/build.cjs');console.log({hash:c.hash(out),edits:edits.length,cssBytes:Buffer.byteLength(css)});
