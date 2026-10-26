'use strict';
// Prepares seven real-link report probes in an isolated directory; does not run them.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const task=path.resolve('G:/Codex/tmp/menu-private-fixes-20261025'),game='G:/somi/Jack O Nine Tails v2.4_work/game';
const input=path.resolve(process.argv[2]||task+'/candidate.qsp'),out=path.resolve(process.argv[3]||task+'/native-private');
const relative=path.relative(task,out);assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative));assert(!fs.existsSync(out));qa.assertOutside(out,[game,'G:/somi/JO9O','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game']);
const raw=fs.readFileSync(input),fixture=game+'/save/27_private_reports.sav',fixtureRaw=fs.readFileSync(fixture),saved=sc.parse(fixtureRaw),prime=qa.primeState(saved);
const schema=saved.vars.find(v=>v.name==='SLAVE_VARS').values.map(v=>v[1]);
const q=s=>"'"+String(s).replaceAll("'","''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n');
const js=String.raw`(function(){
 var stage=<<qa_milk_stage>>,tries=0,bridge=__BRIDGE__,name='__NAME__',expected=__EXPECTED__,store=null,key='JO9_QA_MILK_'+name;
 function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}
 function exec(s){var a=document.createElement('a');a.href='EXEC:'+s;document.body.appendChild(a);click(a)}
 function fail(s){if(document.body.__qaMilkFailed)return;document.body.__qaMilkFailed=true;exec("msg 'FAIL_PRIVATE_"+name.replace(/-/g,'_')+"_"+s+"'")}
 function actual(a,prefix,suffix){if(!a||a.tagName!=='A'){fail('NOT_ANCHOR_STAGE_'+stage);return false}if(a.getAttribute('href')!=='api/closemsg')a.scrollIntoView(false);var r=(a.getElementsByTagName('img')[0]||a).getBoundingClientRect(),top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(r.width<=0||r.height<=0||!top||!a.contains(top)){fail('COVERED_STAGE_'+stage+'_'+[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height),top&&top.tagName,top&&top.id].join('_'));return false}if(prefix||suffix)a.setAttribute('href','EXEC:'+(prefix||'')+a.getAttribute('href').replace(/^exec:\s*/i,'')+(suffix||''));click(a);return true}
 function find(pattern){var all=document.querySelectorAll('a[href]');for(var i=0;i<all.length;i++)if(pattern.test(all[i].getAttribute('href')||''))return all[i];return null}
 function activeMessage(){var m=document.getElementById('__message__');if(!m)return null;var s=window.getComputedStyle(m);return s.display==='none'||s.visibility==='hidden'?null:m}
 try{store=window.sessionStorage;store.setItem(key+'_supported','1');if(store.getItem(key+'_supported')!=='1')throw new Error('no session storage')}catch(e){fail('SESSION_STORAGE');return}
 function tick(){
  if(document.body.__qaMilkFailed)return;
  if(++tries>160){fail('TIMEOUT');return}
  var message=activeMessage(),phase=store.getItem(key+'_phase')||'new';
  if(message){
   if(message.__qaMilkClosed){setTimeout(tick,40);return}
   var text=message.textContent||message.innerText||'',close=document.querySelector('a[href="api/closemsg"]');
   if(!new RegExp('\\(\\s*'+expected+'\\s*\\)').test(text)){fail('QUANTITY');return}
   var im=close&&close.getElementsByTagName('img')[0],r=im&&im.getBoundingClientRect(),top=r&&document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
   var observed={name:name,quantityText:text,quantityMatched:true,closeHref:close&&close.getAttribute('href'),closeRect:r?{x:r.left,y:r.top,w:r.width,h:r.height}:null,closeHit:!!(close&&top&&close.contains(top)),closed:true};
   store.setItem(key+'_metrics',JSON.stringify(observed));store.setItem(key+'_phase','closed');
   message.__qaMilkClosed=true;setTimeout(tick,60);actual(close,'');return;
  }
  if(document.body.__qaMilkAction)return;
  if(bridge&&phase==='new'){var first=find(/snk_room_bridge'\s*,\s*'enter'\s*,\s*1\s*,\s*111/);if(!first){setTimeout(tick,40);return}document.body.__qaMilkAction=true;store.setItem(key+'_phase','entered');actual(first,"qa_milk_stage=1 & savegame '"+name+"-initial.sav' & ");return}
  if(phase==='returning'){document.body.__qaMilkAction=true;exec("gs 'qa_milk_done'");return}
  if(phase==='closed'){
   var meta=store.getItem(key+'_metrics')||'{}',prefix="qa_milk_ui_closed=1 & $qa_milk_metrics='"+meta.replace(/'/g,"''")+"' & ";
   document.body.__qaMilkAction=true;
   if(bridge){var back=find(/^exec:\s*menu_form\s*=\s*0\s*&\s*gt\s*'menu_form'/i)||find(/snk_room_bridge'\s*,\s*'leave'\s*&\s*gt\s*\$snk_room_return/);if(!back){fail('NO_ORIGINAL_RETURN');return}store.setItem(key+'_phase','returning');actual(back,prefix+"savegame '"+name+"-after.sav' & qa_milk_stage=3 & ");return}
   exec(prefix+"gs 'qa_milk_done'");return;
  }
  if(phase==='opening'){setTimeout(tick,40);return}
  var target=find(/\$__ROLE___milk_quantity/);if(!target){setTimeout(tick,40);return}
  document.body.__qaMilkAction=true;store.setItem(key+'_phase','opening');setTimeout(tick,80);
  actual(target,"qa_milk_stage=2 & savegame '"+name+"-before.sav' & "," & qa_milk_continued=1");
 }
 setTimeout(tick,250);
}());`;
fs.mkdirSync(out,{recursive:true});for(const n of ['content','fonts'])fs.symlinkSync(game+'/'+n,out+'/'+n,'junction');fs.cpSync(game+'/css',out+'/css',{recursive:true});fs.cpSync(game+'/json',out+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plans=[];
for(const [name,role,quantity,bridge]of [['milk-slave','slave',80,false],['milk-assistant','assistant',80,false],['milk-room-one','room1',80,false],['milk-room-two','room2',81,false],['milk-room-three','room3',82,false],['milk-room-four','room4',83,false],['milk-room-bridge','slave',80,true]]){
 if(process.argv[4]&&process.argv[4]!==name)continue;
 const d=c.parse(raw),loc=n=>d.locations.find(l=>l.name===n),get=n=>c.shift(d.lines[loc(n).body],5),set=(n,s)=>{d.lines[loc(n).body]=c.shift(cr(s),-5);};
 const marker='JO9_QA_PRIVATE_'+name.replaceAll('-','_')+'_COMPLETE';
 let driver=js.replaceAll('__NAME__',name).replaceAll('__ROLE__',role).replaceAll('__EXPECTED__',String(quantity)).replaceAll('__BRIDGE__',bridge?'true':'false').replace(/\r?\n/g,' ');
 const script='\r\n*p '+q('<script type="text/javascript">'+driver+'</script>')+"\r\nsavegame '"+name+"-render.sav'\r\n";
 for(const n of ['main_screen','slave_private_room1','slave_private_room2','slave_private_room3','slave_private_room4','menu_form','snk_room_menu_screen'])set(n,get(n)+script);
 const destination=bridge?'slave_private_room1':role.startsWith('room')?'slave_private_'+role:'main_screen';
 const checks=["if qa_milk_continued ! 1 or qa_milk_ui_closed ! 1: msg 'FAIL_PRIVATE_CLOSE_CONTINUATION' & exit","if sparks ! qa_milk_money or day ! qa_milk_day or master_energy ! qa_milk_master_energy: msg 'FAIL_PRIVATE_GLOBAL_STATE' & exit",'if '+role+"['milk_summ'] ! "+quantity+": msg 'FAIL_PRIVATE_MILK_CONSUMED' & exit"];
 if(bridge)checks.push("if $curloc ! 'slave_private_room1' or snk_room_target ! 0 or snk_room_inventory ! 0 or snk_parked_slave_state ! 0: msg 'FAIL_PRIVATE_RETURN_OR_OWNER' & exit");
 checks.push("savegame '"+name+(bridge?'-returned':'-after')+".sav'",'msg '+q(marker));
 d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift('qa_milk_done',-5),c.shift('',-5),c.shift(checks.join('\r\n'),-5),c.shift('0',-5));
 const setup=['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''","gs 'refresh_database'","$counter=''","$ongload=''","$onnewloc=''",'sound_on=0','usehtml=1','ui_style=2','nsfw=1','autosave=0','autosave_day=0','autosave_decade=0','decadesave=0','settimer 0','is_home=1','city_district=-1','city_form=0','menu_form=0','exam_in_progress=0','end_of_the_day=0','snk_room_target=0','snk_room_inventory=0',"jo9_lq['active']=0","$place='study'","$info_text=''","$equip_choice=''",'qa_milk_stage=0'];
 if(/^room[234]$/.test(role)){
  for(const template of schema){const to=template.replaceAll('instance',role),from=template.replaceAll('instance','room1');setup.push('copyarr '+q(to)+', '+q(from));}
  setup.push('copyarr '+q('$'+role)+", '$room1'",role+"['id']=92000"+role.slice(-1));
 }
 const actor=bridge?'room1':role;setup.push(actor+"['age']=2",actor+"['lactation']=2",actor+"['milk_summ']="+quantity,'qa_milk_money=sparks','qa_milk_day=day','qa_milk_master_energy=master_energy',"gt '"+destination+"'");
 set('Start',setup.join('\r\n'));
 const bytes=c.serialize(d);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);
 plans.push({name,file,marker,role,quantity,bridge,checkpoint:bridge?'Actual room1 question anchor -> room subject bridge -> real report anchor -> native quantity message and real close -> original cancel -> room1 restored. Compare initial/returned and before/after complete role snapshots.':'Actual existing report anchor -> native quantity message -> real close; quantity and actor state preserved.',snapshots:bridge?[name+'-initial.sav',name+'-before.sav',name+'-after.sav',name+'-returned.sav']:[name+'-before.sav',name+'-after.sav']});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plans,null,2)+'\n');fs.writeFileSync(out+'/prepared.json',JSON.stringify({input,sourceHash:c.hash(raw),fixture,fixtureHash:c.hash(fixtureRaw),cases:plans,limits:['Only isolated diagnostic copies are written. The root runs the native engine and checks snapshots using private-edits.cjs.','No production/teaching action or menu135 is entered.','Room2..4 use complete adult room1-derived fixture state with distinguishable quantities.','PrimeState is diagnostic setup, not a native Save/Load compatibility claim.']},null,2)+'\n');console.log(JSON.stringify({preparedOnly:true,cases:plans.length,out,sourceHash:c.hash(raw)}));
