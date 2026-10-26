'use strict';
// Prepare actual-anchor navigation probes in disposable QSPs; does not execute them.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',task=path.resolve('G:/Codex/tmp/menu-private-fixes-20261025');
const input=path.resolve(process.argv[2]||task+'/candidate.qsp'),out=path.resolve(process.argv[3]||task+'/native-rumor');
const rel=path.relative(task,out);assert(rel&&!rel.startsWith('..')&&!path.isAbsolute(rel));assert(!fs.existsSync(out));qa.assertOutside(out,[game,'G:/somi/JO9O','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game']);
const raw=fs.readFileSync(input),source=c.parse(raw);qa.inspectWorld(raw);
const baseSave=game+'/save/JO9_MANUAL_20261025/01_검사완료재확인/20_traits_overflow_merge.sav',savedRaw=fs.readFileSync(baseSave),prime=qa.primeState(sc.parse(savedRaw));
const q=s=>"'"+String(s).replaceAll("'","''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n');
const script=s=>'*p '+q('<script type="text/javascript">'+s.replace(/\r?\n/g,' ')+'</script>');
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const set=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(cr(s),-5);};
const plan=[];
fs.mkdirSync(out,{recursive:true});for(const n of ['content','css','fonts'])fs.symlinkSync(game+'/'+n,out+'/'+n,'junction');fs.cpSync(game+'/json',out+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const driver=String.raw`(function(){
 function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}
 function bridge(code){var a=document.createElement('a');a.href='EXEC:'+code;document.body.appendChild(a);click(a)}
 function fail(reason){bridge("msg 'FAIL_RUMOR_"+reason+"'")}
 function find(text){var a=document.querySelectorAll('a');for(var i=0;i<a.length;i++)if((a[i].textContent||a[i].innerText).indexOf(text)>=0)return a[i];return null}
 function actual(a,next,remember){
  if(!a){fail('MISSING_ANCHOR');return}
  a.scrollIntoView(false);var r=a.getBoundingClientRect(),top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  if(r.width<=0||r.height<=0||!top||!a.contains(top)){fail('OCCLUDED');return}
  var old=a.getAttribute('href').replace(/^exec:\s*/i,'');
  if(old.indexOf("gt 'jo9_buyer_rumors'")<0){fail('TRUNCATED_HREF');return}
  var prefix='qa_rumor_stage='+next+' & qa_rumor_clicks+=1 & ';
  if(remember)prefix="$qa_rumor_original='"+old.replace(/'/g,"''")+"' & "+prefix;
  a.setAttribute('href','EXEC:'+prefix+old);click(a);
 }
 setTimeout(function(){
  var stage=<<qa_rumor_stage>>;
  if(stage===0){
   var a=find('구매자 소문을 듣는다'),quit=find('대화 종료')||find('대화를 끝낸다')||find('카페를 떠난다');
   if(!a||!quit){fail('MENU');return}
   var list=a.parentElement.parentElement,links=list.querySelectorAll('a'),ai=-1,qi=-1;
   for(var i=0;i<links.length;i++){if(links[i]===a)ai=i;if(links[i]===quit)qi=i}
   if(ai<0||qi!==ai+1||a.textContent.indexOf('($<<qa_rumor_fee>>)')<0){fail('ORDER_OR_PRICE');return}
   actual(a,1,true);return;
  }
  if(stage===1){
   var side=document.getElementById('side_panel_text'),text=document.getElementById('text');
   if(!side||side.textContent.indexOf('구매자 소문')<0||!text||text.textContent.length<5){fail('NO_RESULT');return}
   actual(find('다음 소문'),2,false);return;
  }
  if(stage===2){actual(find('대화로 돌아간다'),3,false);return}
  if(stage===3){bridge("qa_rumor_stage=4 & qa_rumor_clicks+=1 & dynamic $qa_rumor_original");return}
  if(stage===4){bridge("gs 'qa_rumor_done'");return}
 },250);
}());`;
for(const [provider,discount,poor]of [['skups',0,0],['barman',0,0],['anes',0,0],['skups',1,0],['skups',0,1]]){
 const d=c.parse(raw),name=provider+'-'+(poor?'insufficient':discount?'discount':'regular'),marker='JO9_QA_RUMOR_'+name.replaceAll('-','_')+'_COMPLETE',fee=discount?5:10,money=poor?fee-1:100;
 const done=[
  "if sparks ! qa_rumor_initial-qa_rumor_fee or qa_rumor_clicks ! 4 or jo9_rumor_actor_count < 2: msg 'FAIL_RUMOR_CHARGE_OR_FLOW' & exit",
  provider==='anes'?"if $place ! 'kafe' or sp_txt ! 1 or $display_options[1] ! $kafe_options[1]: msg 'FAIL_RUMOR_BACK_TARGET' & exit":"if $npc_id ! $qa_rumor_expected_npc: msg 'FAIL_RUMOR_BACK_TARGET' & exit",
  "$qa_rumor_metrics='real menu -> paid result -> next page -> NPC back -> stale consult rejected'",
  "savegame '"+name+".sav'",'msg '+q(marker)
 ].join('\r\n');
 // Diagnostic helper only, added without touching the production file.
 const locName='qa_rumor_done';d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift(locName,-5),c.shift('',-5),c.shift(done,-5),c.shift('0',-5));d.locations.push({name:locName});
 for(const n of ['interaction_screen_city','shop_general'])set(d,n,get(d,n)+'\r\n'+script(driver));
 const body=get(d,'jo9_buyer_rumors');
 const poorOld="  msg $jo9_rumor_notice\r\n  gt 'jo9_buyer_rumors', 'back', $jo9_rm_provider";
 assert.equal(body.split(poorOld).length-1,1);
 const poorHook=["  if qa_rumor_insufficient = 1:","   if sparks ! qa_rumor_initial or jo9_rumor_pending ! 0 or $jo9_rumor_notice ! '소문값을 치를 스파크가 부족하다.': msg 'FAIL_RUMOR_POOR_STATE' & exit",'   $qa_rumor_metrics=$jo9_rumor_notice',"   savegame '"+name+".sav'",'   msg '+q(marker),'   exit','  end',poorOld].join('\r\n');
 set(d,'jo9_buyer_rumors',body.replace(poorOld,()=>poorHook)+'\r\n'+[
  "if qa_rumor_stage = 1 or qa_rumor_stage = 2:"," if sparks ! qa_rumor_initial-qa_rumor_fee or jo9_rumor_pending ! 0 or jo9_rumor_actor_count < 2: msg 'FAIL_RUMOR_RESULT_STATE' & exit",'end',script(driver)
 ].join('\r\n'));
 const setup=['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''",'usehtml=1','nsfw=1','sound_on=0','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','snk_room_target=0',"gs 'refresh_database'","$counter=''","$ongload=''","$onnewloc=''",'settimer 0','colosseum_fight=0','skip_to=0','is_home=0',"gs 'jo9_buyer_rumors','refreshmenus'",'qa_rumor_stage=0','qa_rumor_clicks=0','qa_rumor_initial='+money,'qa_rumor_fee='+fee,'qa_rumor_insufficient='+poor,'sparks='+money,"jo9_rumor_discount['"+provider+"']="+discount,"$qa_rumor_expected_npc='"+({skups:'master_skups',barman:'barman',anes:'anes'})[provider]+"'"];
 if(provider==='skups')setup.push('sp_txt=1','interaction_city=95',"gt 'interaction_city'");
 if(provider==='barman')setup.push("copyarr '$display_options','$tavern_options'",'sp_txt=2',"$place='tavern'","gt 'shop_general'");
 if(provider==='anes')setup.push('sp_txt=1','interaction_city=2991',"gt 'interaction_city'");
 set(d,'Start',setup.join('\r\n'));
 const bytes=c.serialize(d);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);
 plan.push({name,file,marker,checkpoint:poor?'Real original menu click reaches original insufficient-funds branch; expected modal captured before display, money unchanged and one-use token consumed.':'Real original menu anchor -> result, one charge -> actual next anchor -> actual back anchor -> stale original command rejected, no second charge.'});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2)+'\n');fs.writeFileSync(out+'/prepared.json',JSON.stringify({source:input,sourceHash:source.hash,baseSave,baseSaveHash:c.hash(savedRaw),preparedOnly:true,cases:plan,limits:['Actual anchor hrefs are prepended only with diagnostic stage counters/storage; the original production command runs unchanged.','The insufficient-funds case captures the original notice and state before its blocking modal, so native dialog dismissal is not tested.','The stale original command is invoked again through a diagnostic EXEC bridge after returning to the NPC.','No price, roster, matching, actor attributes or production save is changed. Fixture contains two existing adult actors for pagination.']},null,2)+'\n');
console.log(JSON.stringify({out,sourceHash:source.hash,cases:plan.length,preparedOnly:true}));
