'use strict';
// Generic existing room/profile/menu navigation only. No teaching action is invoked.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const task='G:/Codex/tmp/menu-private-fixes-20261025',game='G:/somi/Jack O Nine Tails v2.4_work/game',out=path.resolve(process.argv[2]||task+'/native-menu135');
assert(!fs.existsSync(out));qa.assertOutside(out,[game,'G:/somi/JO9O']);
const requestedMenu=process.argv[3]==='baseline-134'?134:135,source=requestedMenu===134?'G:/somi/JO9_work_backups/menu-private-fixes-20261025/jack.qsp':task+'/candidate-final.qsp';
const raw=fs.readFileSync(source),d=c.parse(raw),fixturePath=game+'/save/27_private_reports.sav',seed=fs.readFileSync(fixturePath),prime=qa.primeState(sc.parse(seed));
const q=s=>"'"+String(s).replaceAll("'","''")+"'",get=(doc,n)=>c.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5),set=(n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s,-5)};
const start=['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''","gs 'refresh_database'","$counter=''","$ongload=''","$onnewloc=''",'sound_on=0','usehtml=1','ui_style=2','nsfw=1','autosave=0','autosave_day=0','autosave_decade=0','decadesave=0','settimer 0','is_home=1','city_district=-1','city_form=0','menu_form=0','exam_in_progress=0','end_of_the_day=0','snk_room_target=0','snk_room_inventory=0',"jo9_lq['active']=0","$place='study'","$info_text=''","$equip_choice=''",'qa_menu_stage=0',"room1['age']=2","room1['lactation']=2","room1['milk_summ']=80",'qa_milk_money=sparks','qa_milk_day=day','qa_milk_master_energy=master_energy',"gt 'slave_private_room1'"].join('\r\n');
// This is the exact original diagnostic setup, now regenerated from the preserved seed.
// No earlier diagnostic QSP is required after task cleanup.
const legacy=task+'/native-private-vfive/milk-room-bridge.qsp';
if(fs.existsSync(legacy)){const old=c.parse(fs.readFileSync(legacy));assert.equal(start,get(old,'Start').replace('qa_milk_stage=0','qa_menu_stage=0'),'Diagnostic Start changed during dependency removal');}
set('Start',start);
const js=String.raw`(function(){
 var stage=<<qa_menu_stage>>,epoch=(window.__qa135Epoch||0)+1,tries=0;window.__qa135Epoch=epoch;
 function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}
 function exec(s){var a=document.createElement('a');a.href='EXEC:'+s;document.body.appendChild(a);click(a)}
 function fail(s){exec("msg 'FAIL_PRIVATE_MENU135_"+s+"'")}
 function find(p){var a=document.querySelectorAll('a[href]');for(var i=0;i<a.length;i++)if(p.test(a[i].getAttribute('href')||''))return a[i];return null}
 function actual(a,prefix){if(!a){fail('NO_ANCHOR_STAGE_'+stage);return}var im=a.getElementsByTagName('img')[0],r=(im||a).getBoundingClientRect(),top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!r.width||!r.height||!top||!a.contains(top)){fail('COVERED_STAGE_'+stage);return}a.href='EXEC:'+prefix+a.getAttribute('href').replace(/^exec:\s*/i,'');click(a)}
 function tick(){if(epoch!==window.__qa135Epoch)return;if(++tries>140){fail('TIMEOUT_STAGE_'+stage);return}
  if(stage===0){var a=find(/snk_room_bridge'\s*,\s*'portrait'\s*,\s*1/);if(!a){setTimeout(tick,40);return}actual(a,"qa_menu_stage=1 & savegame 'menu135-initial.sav' & ");return}
  if(stage===1){var a=find(/menu_form\s*=\s*135\s*&/);if(!a){setTimeout(tick,40);return}actual(a,"qa_menu_stage=2 & savegame 'menu135-profile.sav' & ");return}
  if(stage===2){var a=find(/snk_room_bridge'\s*,\s*'portrait'\s*,\s*snk_room_target/);if(!a){setTimeout(tick,40);return}actual(a,"qa_menu_stage=3 & savegame 'menu135-entered.sav' & ");return}
  if(stage===3){var a=find(/snk_room_bridge'\s*,\s*'inventory_close'/);if(!a){setTimeout(tick,40);return}actual(a,"qa_menu_stage=4 & savegame 'menu135-before-close.sav' & ");return}
  if(stage===4){exec("gs 'qa_menu135_done'");return}
 }
 setTimeout(tick,250);
}());`.replace('menu_form\\s*=\\s*135\\s*&','menu_form\\s*=\\s*'+requestedMenu+'\\s*&').replace(/\r?\n/g,' ');
for(const n of ['slave_private_room1','slave_stat','main_screen','snk_room_menu_screen'])set(n,get(d,n)+'\r\n*p '+q('<script type="text/javascript">'+js+'</script>')+"\r\nsavegame 'menu135-render.sav'\r\n");
const check=["if $curloc ! 'slave_private_room1' or snk_room_target ! 0 or snk_room_inventory ! 0 or snk_parked_slave_state ! 0: msg 'FAIL_PRIVATE_MENU135_RETURN' & exit","if sparks ! qa_milk_money or day ! qa_milk_day or master_energy ! qa_milk_master_energy: msg 'FAIL_PRIVATE_MENU135_GLOBAL' & exit","savegame 'menu135-returned.sav'","msg 'JO9_QA_PRIVATE_menu_navigation_COMPLETE'"];
d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift('qa_menu135_done',-5),c.shift('',-5),c.shift(check.join('\r\n'),-5),c.shift('0',-5));
const b=c.serialize(d);qa.inspectWorld(b);fs.mkdirSync(out,{recursive:true});for(const n of ['content','fonts'])fs.symlinkSync(game+'/'+n,out+'/'+n,'junction');for(const n of ['css','json'])fs.cpSync(game+'/'+n,out+'/'+n,{recursive:true});for(const n of ['config.xml'])fs.copyFileSync(game+'/'+n,out+'/'+n);fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(out+'/menu-navigation.qsp',b);fs.writeFileSync(out+'/plan.json',JSON.stringify([{name:'menu-navigation',file:out+'/menu-navigation.qsp',marker:'JO9_QA_PRIVATE_menu_navigation_COMPLETE',checkpoint:'Original room portrait -> existing profile menu '+requestedMenu+' link -> existing room subject portrait -> original profile close -> original room. No teaching action executed.'}],null,2));fs.writeFileSync(out+'/prepared.json',JSON.stringify({source,sourceHash:c.hash(raw),requestedMenu,navigationOnly:true,originalCss:true,actions:0},null,2));console.log(JSON.stringify({out,sourceHash:c.hash(raw),requestedMenu}));
