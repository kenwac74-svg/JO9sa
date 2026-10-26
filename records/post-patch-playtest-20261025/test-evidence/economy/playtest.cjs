'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const suite=process.argv[2]||'clinic';
const root='G:/Codex/tmp/jo9-post-patch-playtest-20261025/economy',rec=suite==='reported'?__dirname+'/reported':__dirname;
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const raw=fs.readFileSync(game+'/jack.qsp'),hash=c.hash(raw);
a.equal(hash,'a70bd177d8e7ade58243578b2f04745ff00cec3884d26d3b924dfffc8a8d007a');
const cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
const sourceSave=game+'/save/JO9_TEST_20261023_01_HOME.sav',prime=qa.primeState(sc.parse(fs.readFileSync(sourceSave))).code;
const out=root+'/'+suite;
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(rec+'/evidence',{recursive:true});
for(const rel of ['config.xml','css/base.css','fonts/경기천년제목 Medium.ttf','fonts/Sandoll 미생.ttf',...['forward_button','back_button','approve','deny'].map(x=>'content/pic/buttons/'+x+'.png'),'content/pic/msg_bg.png','content/pic/buttons/ok-icon.png']){
 fs.mkdirSync(path.dirname(out+'/'+rel),{recursive:true});fs.copyFileSync(game+'/'+rel,out+'/'+rel);
}
fs.cpSync(game+'/json',out+'/json',{recursive:true});
fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
if(suite==='reported'){
 fs.cpSync(game+'/css',out+'/css',{recursive:true});fs.cpSync(game+'/content/js',out+'/content/js',{recursive:true});
 for(const rel of ['content/pic/bg/page_blank_debug.png','content/pic/ui/jon-UIadds/milk_drop.png','content/pic/ui/milk_drop.png'])if(fs.existsSync(game+'/'+rel)){fs.mkdirSync(path.dirname(out+'/'+rel),{recursive:true});fs.copyFileSync(game+'/'+rel,out+'/'+rel);}
}
const base="usehtml=1\n"+prime+"\n$onnewloc='' & $counter=''\ngs 'refresh_database'\n$onnewloc='' & $counter=''\nsound_on=0 & nsfw=1 & snk_room_target=0\nautosave=0 & decadesave=0 & autosave_day=0 & autosave_decade=0\nslave_state=0 & assistant_state=0 & prisoner_state=0 & cow_state=0 & farmhand_state=0 & harpy_state=0 & pig_state=0\nroom1_state=0 & room2_state=0 & room3_state=0 & room4_state=0\nis_home=1 & city_form=0 & city_district=-1 & exam_in_progress=0 & get_weapon=0 & colosseum_fight=0\nday=102 & decadecount=2 & end_day_phase=0 & jo9_lq['active']=0\n$return_lock=''\nkillvar 'jo9_rumor_discount'\n";
function actor(role='slave',extra=''){
 let s="killvar '"+role+"'\nkillvar '"+role+"_rate'\n"+role+"_state=CONST_INT['slave_exist']\n"+role+"_type=2571\n$"+role+"_name='Adult QA "+role+"'\n$"+role+"_psy_status='docile'\n$"+role+"_psy_basic='docile'\n";
 const fields={id:910001,age:2,brand:2,stamina:3,energy:3,base_beauty:3,beauty:3,fat:2,sensitivity:3,temper:3,intellect:3,ego:3,pride:2,virginity:2,custom:30,moral:3,instinct:2,rational:2,obedience:50,health_issues_revealed:1,metabolism:2,calories:50,mood:3,hygiene:0,diet_portion:2,expression:3,pet:3,dressage:3,cowSK:3,nurse:3,service:3,cook:3,gladiatrix:3,alchemy:3,enchanter:3,art:3,music:3,calisthenics:3,secretary:3};
 for(const [k,v]of Object.entries(fields))s+=role+'['+q(k)+']='+v+'\n';
 return s+role+"_rate['beauty']=cont_atr_threshold[3]\n"+role+"_rate['stamina']=7\n"+extra;
}
function ui(kind,arg=''){
 let find=kind==='selector'?'a=document.querySelector('+JSON.stringify(arg)+');':kind==='forward'?'var imgs=document.getElementsByTagName("img");for(var i=0;i<imgs.length;i++){if(/forward_button[.]png/.test(imgs[i].getAttribute("src")||"")){a=imgs[i];while(a&&a.tagName.toLowerCase()!=="a")a=a.parentNode;if(a)break}}':'var as=document.getElementsByTagName("a");for(var i=0;i<as.length;i++){if((as[i].getAttribute("href")||"").indexOf('+JSON.stringify(arg)+')>=0){a=as[i];break}}';
 if(kind==='text')find='var as=document.getElementsByTagName("a");for(var i=0;i<as.length;i++){if((as[i].textContent||"").indexOf('+JSON.stringify(arg)+')>=0 && (as[i].getAttribute("href")||"").toLowerCase().indexOf("exec:")===0){a=as[i];break}}';
 const js='(function(){function click(a){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}function fail(s){var a=document.createElement("a");a.href="EXEC: msg \'FAIL_ECON_UI_"+s+"\'";document.body.appendChild(a);click(a)}var n=0,sent=false;function tick(){var m=document.getElementById("__message__");if(m){var z=document.querySelector(\'a[href="api/closemsg"]\');if(z){click(z);setTimeout(tick,50);return}if(++n<120){setTimeout(tick,30);return}fail("MSG_CLOSE");return}if(sent)return;var a;'+find+'if(!a){if(++n<120){setTimeout(tick,30);return}fail("MISSING_'+kind+'");return}a.scrollIntoView(false);var r=(a.querySelector("img")||a).getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(r.width<=0||r.height<=0||!a.contains(hit)){fail("COVERED_'+kind+'_"+[r.left,r.top,r.width,r.height,hit&&hit.tagName,hit&&hit.id].join("_"));return}sent=true;click(a)}setTimeout(tick,200)}());';
 return '*p '+q('<script type="text/javascript">'+js+'</script>')+'\n';
}
function malformedProbe(label,name,marker){
 const js='(function(){function click(a){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}var as=document.getElementsByTagName("a"),hit=null;for(var i=0;i<as.length;i++){if((as[i].textContent||"").indexOf('+JSON.stringify(label)+')>=0){hit=as[i];break}}if(!hit)return;var h=hit.getAttribute("href")||"";click(hit);setTimeout(function(){var z=document.createElement("a");z.href="EXEC: $qa_dom_href="+String.fromCharCode(39)+h.replace(/\\x27/g,String.fromCharCode(39,39))+String.fromCharCode(39)+" & if qa_rumor_consult=0 and qa_rumor_view=0 and sparks=20 and instr($qa_dom_href, "+String.fromCharCode(39)+"consult"+String.fromCharCode(39)+")=0: savegame "+String.fromCharCode(39)+name+"-complete.sav"+String.fromCharCode(39)+" & msg "+String.fromCharCode(39)+marker+String.fromCharCode(39);document.body.appendChild(z);click(z)},900)}());';
 return '*p '+q('<script type="text/javascript">'+js+'</script>')+'\n';
}
function reportedScript(mode,arg,name,marker){
 const stateKey=JSON.stringify('JO9_QA_'+name+'_'+Date.now()+'_'+Math.random().toString(16).slice(2));
 const helpers='function click(a){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}function qs(s){return String.fromCharCode(39)+String(s).replace(/[\\r\\n]/g," ").replace(/\\x27/g,String.fromCharCode(39,39))+String.fromCharCode(39)}function emit(v){var code="qa_probe_count+=1";for(var k in v){if(v.hasOwnProperty(k)){code+=" & "+(typeof v[k]==="number"?"":"$")+k+"="+(typeof v[k]==="number"?v[k]:qs(v[k]))}}code+=" & savegame "+qs('+JSON.stringify(name+'-complete.sav')+')+" & msg "+qs('+JSON.stringify(marker)+');var x=document.createElement("a");x.href="EXEC: "+code;document.body.appendChild(x);click(x)}function find(s){var aa=document.getElementsByTagName("a");for(var i=0;i<aa.length;i++)if((aa[i].getAttribute("href")||"").indexOf(s)>=0)return aa[i];return null}';
 let logic='';
 if(mode==='modal')logic='var m=document.getElementById("__message__"),panel=document.getElementById("title_scroll_debug");if(phase===1){if(m){if(++tries<80)setTimeout(tick,40);else{obs.qa_closed=0;obs.qa_driver_gap=1;emit(obs)}return}var target=find("$debug_psy_status_fuck"),r=target?target.getBoundingClientRect():null,hit=r?document.elementFromPoint(r.left+r.width/2,r.top+r.height/2):null;obs.qa_closed=1;obs.qa_summary_restored=panel&&target?1:0;obs.qa_summary_hit=target&&target.contains(hit)?1:0;emit(obs);return}if(m){var z=document.querySelector(\'a[href="api/closemsg"]\');if(!z){setTimeout(tick,40);return}var r=(z.querySelector("img")||z).getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2),ok=z.contains(hit)&&r.width>0&&r.height>0;obs={qa_problem:ok?0:1,qa_close_hit:ok?1:0,qa_hit_tag:hit?hit.tagName:"NONE",qa_hit_id:hit?hit.id:"NONE",qa_msg_z:window.getComputedStyle(m).zIndex,qa_msg_inline:m.getAttribute("style")||"",qa_close_rect:[r.left,r.top,r.width,r.height].join(",")};var links=document.querySelectorAll("link"),ls=[],ss=[],st=document.getElementsByTagName("style");for(var i=0;i<links.length;i++)ls.push(links[i].getAttribute("href")||"");for(var i=0;i<st.length;i++)if((st[i].textContent||"").indexOf("__message__")>=0)ss.push("INLINE_RULE_CONTEXT:"+st[i].textContent.slice(Math.max(0,st[i].textContent.indexOf("__message__")-220),st[i].textContent.indexOf("__message__")+500));for(var i=0;i<document.styleSheets.length;i++){try{var rules=document.styleSheets[i].cssRules||[];for(var j=0;j<rules.length;j++)if((rules[j].cssText||"").indexOf("__message__")>=0)ss.push((document.styleSheets[i].href||"STYLE")+":"+rules[j].cssText)}catch(e){ss.push("CSS_ACCESS:"+e)}}obs.qa_css_links=ls.join("|");obs.qa_message_rules=ss.join("|").slice(0,10000);if(ok){phase=1;click(z);setTimeout(tick,120)}else emit(obs);return}var target=panel?find("$debug_psy_status_fuck"):find('+JSON.stringify(arg)+');if(target){var r=(target.querySelector("img")||target).getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!target.contains(hit)){emit({qa_problem:0,qa_driver_gap:1,qa_target:'+JSON.stringify(arg)+'});return}click(target)}else setTimeout(tick,50);';
 if(mode==='milk')logic='var es=document.querySelectorAll("[href]"),el=null;for(var i=0;i<es.length;i++){if((es[i].getAttribute("href")||"").indexOf('+JSON.stringify(arg)+')>=0){el=es[i];break}}if(!el){setTimeout(tick,40);return}var m=document.getElementById("__message__");if(m){var z=document.querySelector(\'a[href="api/closemsg"]\'),r=z?(z.querySelector("img")||z).getBoundingClientRect():null,hit=r?document.elementFromPoint(r.left+r.width/2,r.top+r.height/2):null;emit({qa_problem:el.tagName==="A"?0:1,qa_milk_element:el.tagName,qa_quantity_message:1,qa_close_hit:z&&z.contains(hit)?1:0,qa_message_text:m.textContent});if(z&&z.contains(hit))click(z);return}var tag=el.tagName;click(el);if(tag!=="A")setTimeout(function(){emit({qa_problem:1,qa_milk_element:tag,qa_quantity_message:document.getElementById("__message__")?1:0,qa_milk_href:el.getAttribute("href")||""})},400);';
 if(mode==='modal')logic=logic.replace('phase=1;click(z);','phase=1;try{sessionStorage.setItem('+stateKey+',JSON.stringify(obs))}catch(e){}click(z);');
 const restore=mode==='modal'?'try{var previous=sessionStorage.getItem('+stateKey+');if(previous){obs=JSON.parse(previous);phase=1}}catch(e){}':'';
 return '*p '+q('<script type="text/javascript">(function(){'+helpers+'var phase=0,tries=0,obs={};'+restore+'function tick(){'+logic+'}setTimeout(tick,220)}());</script>')+'\n';
}
const plans=[],metadata={};
function test(name,setup,modify,detail){
 const d=c.parse(raw),locations=[];
 const loc=n=>{const l=d.locations.find(l=>l.name===n);a(l,n);return l;},body=n=>c.shift(d.lines[loc(n).body],5);
 const set=(n,b)=>{d.lines[loc(n).body]=c.shift(cr(b),-5);if(!locations.includes(n))locations.push(n);};
 const append=(n,b)=>set(n,body(n)+'\n'+b),prefix=(n,b)=>set(n,b+'\n'+body(n));
 const marker='JO9_QA_ECON_'+name.replaceAll('-','_')+'_COMPLETE';
 const check=(cond,label)=>"if ("+cond+")=0: msg 'FAIL_ECON_"+name+"_"+label+"' & exit\n";
 const finish=()=>"savegame '"+name+"-complete.sav'\nmsg '"+marker+"'\n";
 set('Start',base+setup);modify({d,body,set,append,prefix,marker,check,finish});
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);
 plans.push({name,file,marker,checkpoint:detail});metadata[name]={detail,instrumentedLocations:locations};
}
if(suite==='clinic'){
 for(const role of ['slave','assistant'])for(const mode of ['yes','no','stale']){
  const name='clinic-'+role+'-'+mode,page=role==='slave'?2:3;
  test(name,actor(role,role+"['jo9_constitution']=-1\n"+role+"['energy']=2\n")+"sparks=1800\n$place='hospital'\nis_home=0\ncopyarr '$display_options','$hospital_options'\nsp_txt="+page+"\nskip_to=0\nqa_shop=0 & qa_choice=0 & qa_duplicate=0\ngt 'shop_general'",function({append,prefix,check,finish}){
   prefix('shop_general','qa_shop+=1');prefix('choice_screen','qa_choice+=1');
   append('shop_general',"if qa_shop=1:\n"+check("sparks=1800 and "+role+"['jo9_constitution']=-1",'MENU')+ui('href','constitution_ask')+"else\n"+check('qa_choice=1 and sp_txt='+page+' and '+role+"['energy']=2 and "+role+"_rate['stamina']=7",'RETURN')+check('sparks='+(mode==='yes'?800:1800)+' and '+role+"['jo9_constitution']="+(mode==='yes'?1:-1)+' and '+role+"['jo9_constitution_treated']="+(mode==='yes'?1:0),'EFFECT')+"if qa_duplicate=0:\nqa_duplicate=1\ndynamic $qa_callback\nend\n"+finish()+"end");
   append('choice_screen',check("qa_choice=1 and sparks=1800 and "+role+"['jo9_constitution']=-1",'ASK_UNPAID')+'$qa_callback='+(mode==='no'?'$no':'$yes')+'\n'+(mode==='stale'?role+"['id']=910002\n":'')+"savegame '"+name+"-choice.sav'\n"+ui('selector',mode==='no'?'#deny a':'#approve a'));
  },'Actual hospital menu -> original constitution EXEC -> choice_screen -> native Y/X -> commit/finish -> original shop return -> replay saved callback.');
 }
}
if(suite==='dealers'){
 for(const vendor of ['farid','wong'])for(const difficulty of [1,0,2]){
  const name='dealer-'+vendor+'-'+['normal','easy','hard'][difficulty];
  test(name,actor()+"difficulty_setting="+difficulty+"\ngame_difficulty=2\nsparks=100\nbrand_reputation=5\nfarid_debt=0 & farid_potential_debt=0\nqa_arrival=0 & qa_choice=0\n$place='guild_hall'\nis_home=0\ntxt=1\n"+(vendor==='farid'?"gt 'slave_auction_sell'":"interaction_city=menu_subpurchaser\ngt 'interaction_city'"),function({append,prefix,check,finish}){
   const dest=vendor==='farid'?'city_menu_form':'guild';
   prefix(dest,'qa_arrival+=1\n'+check('slave_state=0 and sparks=100+qa_quote and qa_quote>0 and qa_arrival=1','PAY_CLEAR')+finish());
   let expectedQuote="qa_expected=max(30,slave_base_price*3/2,common_price[rating])\nif slave['obedience']<1: qa_expected=qa_expected*20/100\nqa_expected=qa_expected*"+(difficulty===1?90:75)+"/100\n";
   if(difficulty===2)expectedQuote=vendor==='farid'?"qa_expected=max(10,slaveprice/2)\n":"qa_expected=auction_price[rating]\n";
   if(vendor==='farid')append('slave_auction_sell',"if txt=4:\nqa_quote=sell_price\n"+expectedQuote+check('qa_quote=qa_expected','SPEC_PRICE')+"savegame '"+name+"-quote.sav'\nend\nif txt<5:\n"+ui('forward')+"else\n"+check('txt=5 and qa_quote=sell_price','QUOTE')+ui('href','slave_auction_sell_end')+"end");
   else {
    append('interaction_screen_city',"if interaction_city=menu_subpurchaser:\n"+ui('forward')+"end");
    prefix('choice_screen','qa_choice+=1');
    append('choice_screen',check('jo9_dealer_wong_quote>0 and sparks=100 and qa_choice=1','QUOTE')+"qa_quote=jo9_dealer_wong_quote\n"+expectedQuote+check('qa_quote=qa_expected','SPEC_PRICE')+"savegame '"+name+"-quote.sav'\n"+ui('selector','#approve a'));
   }
  },'Actual dealer displayed quote -> native forward/accept -> original payout and clearing -> original return. difficulty_setting drives payment; game_difficulty differs.');
 }
}
if(suite==='lowobed'){
 for(const vendor of ['farid','wong']){
  const name='dealer-lowobed-'+vendor;
  test(name,actor('slave',"slave['custom']=-20\nslave['moral']=0\n")+"difficulty_setting=1\nsparks=100\nbrand_reputation=5\nfarid_debt=0 & farid_potential_debt=0\nqa_arrival=0\n$place='guild_hall'\nis_home=0\ntxt=1\n"+(vendor==='farid'?"gt 'slave_auction_sell'":"interaction_city=menu_subpurchaser\ngt 'interaction_city'"),function({append,prefix,check,finish}){
   prefix(vendor==='farid'?'city_menu_form':'guild','qa_arrival+=1\n'+check('slave_state=0 and sparks=100+qa_quote and qa_quote>0 and qa_arrival=1','PAY_CLEAR')+finish());
   const price="qa_expected=max(30,slave_base_price*3/2,common_price[rating])*20/100\nqa_expected=qa_expected*90/100\n"+check("slave['obedience']<1 and qa_quote=qa_expected",'OBEDIENCE_20');
   if(vendor==='farid')append('slave_auction_sell',"if txt=4:\nqa_quote=sell_price\n"+price+"savegame '"+name+"-quote.sav'\nend\nif txt<5:\n"+ui('forward')+"else\n"+ui('href','slave_auction_sell_end')+"end");
   else {append('interaction_screen_city',ui('forward'));append('choice_screen',"qa_quote=jo9_dealer_wong_quote\n"+price+"savegame '"+name+"-quote.sav'\n"+ui('selector','#approve a'));}
  },'Actual low-obedience actor offer -> original native accept -> payment and clearing. Expected quote applies the20% obedience factor then easy90% to independent raw evaluator values.');
 }
}
if(suite==='versatile'){
 const name='versatile-fame-once';
 let setup=actor();
 for(const k of ['service','cook','secretary','expression','nurse','alchemy','enchanter','stamina','gladiatrix','calisthenics','music','art','pet','dressage','cowSK','petting','oral','penetration','orgy','roleplay','fetishism','xenophily','nipplefuck','lesbiansex'])setup+="slave['"+k+"']=4\n";
 setup+="slave['jo9_versatile']=0\nslave['jo9_versatile_manual_off']=0\nslave['fame']=0\nslave_rate['fame']=cont_atr_threshold[0]\nslave_rate['temp_fame']=0\nslave_rate['stamina']=0\nqa_main=0\nmenu_form=0\n$place='home'\ngt 'menu_form'";
 test(name,setup,function({prefix,append,check,finish}){
  prefix('main_screen','qa_main+=1');
  append('main_screen',check("slave['jo9_versatile']=1 and slave['fame']=1",'GRANT_AND_FAME')+"if qa_main=1:\nqa_fame_rate=slave_rate['fame']\ngt 'menu_form'\nelse\n"+check("qa_main=2 and slave_rate['fame']=qa_fame_rate",'NO_REPEAT_FAME')+finish()+"end");
 },'Actual menu/equipment/attribute refresh automatically awards eligible versatile and one fame grade; repeat original menu/main refresh preserves fame rate without a second award.');
}
if(suite==='rumors'){
 for(const provider of ['skups','barman','anes'])for(const fee of [10,5]){
  const name='rumor-'+provider+'-'+(fee===10?'base':'discount'),place={skups:'guild_hall',barman:'tavern',anes:'kafe'}[provider];
  const open=provider==='skups'?"interaction_city=95\ngt 'interaction_city'":provider==='anes'?"interaction_city=2991\ngt 'interaction_city'":"copyarr '$display_options','$tavern_options'\nsp_txt=2\ngt 'shop_general'";
  test(name,actor()+"sparks=20\nbrand_reputation=5\n$place='"+place+"'\nis_home=0\njo9_rumor_discount['"+provider+"']="+(fee===5?1:0)+"\nqa_rumor_consult=0 & qa_rumor_view=0\n"+open,function({prefix,append,check,finish}){
   append('shop_general',"if $place='"+place+"':\n"+check("func('jo9_buyer_rumors','fee','"+provider+"')="+fee,'FEE')+ui('href',"consult")+"end");
   prefix('jo9_buyer_rumors',"if $args[0]='consult': qa_rumor_consult+=1\nif $args[0]='view': qa_rumor_view+=1");
   append('jo9_buyer_rumors',"if $args[0]='view':\n"+check('sparks='+(20-fee)+" and qa_rumor_consult=1 and qa_rumor_view=1 and jo9_rumor_actor_count=1 and arrsize('$jo9_rumor_pages')>0 and jo9_rumor_pending=0",'PAID_RESULT')+check("slave['id']=910001 and slave_state=1 and slave['age']=2",'ACTOR_UNCHANGED')+finish()+"end");
  },'Actual provider interaction/menu -> original paid consult -> scan -> result view. Discount fixture tests fee behavior only; actual delivery gate remains separate.');
 }
}
if(suite==='rumors-dom'){
 for(const provider of ['skups','barman','anes']){
  const name='rumor-dom-'+provider,place={skups:'guild_hall',barman:'tavern',anes:'kafe'}[provider];
  const open=provider==='skups'?"interaction_city=95\ngt 'interaction_city'":provider==='anes'?"interaction_city=2991\ngt 'interaction_city'":"copyarr '$display_options','$tavern_options'\nsp_txt=2\ngt 'shop_general'";
  test(name,actor()+"sparks=20\nbrand_reputation=5\n$place='"+place+"'\nis_home=0\nqa_rumor_consult=0 & qa_rumor_view=0\n"+open,function({prefix,append,check,marker}){
   prefix('jo9_buyer_rumors',"if $args[0]='consult': qa_rumor_consult+=1\nif $args[0]='view': qa_rumor_view+=1");
   append('shop_general',check("instr($text_display,'구매자 소문')>0",'LABEL_PRESENT')+malformedProbe('구매자 소문',name,marker));
  },'Actual NPC menu -> original visible rumor anchor clicked -> DOM href captured -> unchanged money and zero consult/view entries checked after click. Expected defect reproduction, not a feature PASS.');
  metadata[name].expectedDefect='Single quoted href is truncated by single quotes in gt/provider arguments; original visible rumor link does not enter consultation.';
 }
}
if(suite==='essence'){
 for(const role of ['slave','assistant']){
  const name='essence-'+role;
  test(name,actor(role,role+"['grace']=-1\n"+role+"['jo9_versatile']=1\n"+role+"['jo9_peerless']=1\n"+role+"['pregnant']=3\n"+role+"['jo9_constitution_treated']=1\n")+"sparks=900\nchaotic_essence=0\n$estate='villa'\nestate_size[$estate]=100\n$place='pharmacy'\nis_home=0\nsp_txt=1\nqa_pharmacy=0 & qa_menu=0\ndynamic $get_lab_space\nqa_lab_before=lab_items\ngt 'pharmacy'",function({append,prefix,check,finish}){
   prefix('pharmacy','qa_pharmacy+=1');
   append('pharmacy',"if sp_txt=1:\n"+ui('href','sp_txt = 12')+"elseif sp_txt=12:\n"+ui('href','sp_txt = 125')+"elseif sp_txt=125:\n"+check('sparks=0 and chaotic_essence=1 and lab_items=qa_lab_before+1','PURCHASE_STOCK')+"is_home=1 & city_form=0 & $place='home'\nmenu_form="+(role==='slave'?'menu_potion_S':'menu_potion_S_assistant')+"\ngt 'menu_form'\nend");
   prefix('menu_form','qa_menu+=1');
   append('main_screen',"if qa_menu=1:\n"+check("chaotic_essence=1 and "+role+"['grace']=-1",'BEFORE_USE')+ui('href',"'jo9_chaotic'")+"else\n"+check("chaotic_essence=0 and "+role+"['grace']=0 and "+role+"['jo9_versatile']=1 and "+role+"['jo9_peerless']=1 and "+role+"['pregnant']=3 and "+role+"['jo9_constitution_treated']=1 and sparks=0",'ONE_REMOVAL_PROTECTED')+finish()+"end");
  },'Actual pharmacy -> medicine page -> original 900 purchase -> lab count -> original home medicine menu -> use -> original menu. Deterministic single negative; positive/title/status keys protected.');
 }
}
if(suite==='guards'){
 for(const mode of ['no-negative','absent','stockless']){
  const name='essence-guard-'+mode;
  test(name,actor('slave',"slave['grace']=-1\n")+"sparks=20\nchaotic_essence=1\nqa_menu=0\nmenu_form=menu_potion_S\n$place='home'\ngt 'menu_form'",function({prefix,append,check,finish}){
   prefix('menu_form','qa_menu+=1');
   const mutation=mode==='no-negative'?"slave['grace']=0":mode==='absent'?'slave_state=0':'chaotic_essence=0';
   append('main_screen',"if qa_menu=1:\n"+mutation+'\n'+ui('href',"'jo9_chaotic'")+"else\n"+check('sparks=20 and chaotic_essence='+(mode==='stockless'?0:1),'NO_CHARGE_OR_STOCK_USE')+check(mode==='absent'?'slave_state=0':"slave['grace']="+(mode==='no-negative'?0:-1),'ACTOR_UNCHANGED')+finish()+"end");
  },'Original medicine menu link becomes stale after target/trait/stock fixture changes; native original EXEC is clicked; actual helper notice and original returned menu assert no item or cash charge.');
 }
 {
  const name='essence-guard-money';
  test(name,"sparks=900\nchaotic_essence=0\n$place='pharmacy'\nis_home=0\nsp_txt=12\ngt 'pharmacy'",function({append,check,finish}){
   append('pharmacy',"if sp_txt=12:\nsparks=899\n"+ui('href','sp_txt = 125')+"elseif sp_txt=125:\n"+check('sparks=899 and chaotic_essence=0','EXACT_PRICE_GUARD')+finish()+"end");
  },'Original active 900 purchase menu rendered, money changes to899 before its original click; original purchase page refuses without debit or stock.');
 }
 for(const mode of ['money','already']){
  const name='clinic-guard-'+mode;
  test(name,actor('slave',"slave['jo9_constitution']="+(mode==='already'?1:0)+"\n")+"sparks="+(mode==='money'?999:1800)+"\n$place='hospital'\nis_home=0\ncopyarr '$display_options','$hospital_options'\nsp_txt=2\ngt 'shop_general'",function({append,check,finish}){
   append('shop_general',check("instr($text_display,'constitution_ask')=0 and sparks="+(mode==='money'?999:1800)+" and slave['jo9_constitution_treated']=0",'DISABLED_MENU_NO_CHARGE')+finish());
  },'Actual hospital page renders disabled constitution entry for money999 or existing health; no active purchase callback and no debit.');
 }
 for(const vendor of ['farid','wong']){
  const name='dealer-guard-'+vendor;
  test(name,actor()+"sparks=100\nbrand_reputation=5\nfarid_debt=0 & farid_potential_debt=0\ndifficulty_setting=1\n$place='guild_hall'\nis_home=0\nqa_arrival=0\n"+(vendor==='farid'?"txt=1\ngt 'slave_auction_sell'":"interaction_city=menu_subpurchaser\ngt 'interaction_city'"),function({prefix,append,check,finish}){
   prefix(vendor==='farid'?'city_menu_form':'guild','qa_arrival+=1\n'+check("sparks=100 and slave_state=1 and slave['id']=910001",'TRADE_REFUSED')+finish());
   if(vendor==='farid')append('slave_auction_sell',"if txt<5:\n"+ui('forward')+"else\nbrand_reputation=3\n"+ui('href','slave_auction_sell_end')+"end");
   else {append('interaction_screen_city',ui('forward'));append('choice_screen',"slave['brand']=0\n"+ui('selector','#approve a'));}
  },'Actual original offer accepted through native anchor after branded/reputation eligibility changes; original commit guard returns without payment or clearing actor.');
 }
}
if(suite==='training'){
 const specs=[{name:'healthy-exercise',skill:'stamina',label:'신체 단련술',health:1,genius:0,energy:3,stamina:3},{name:'genius-pet',skill:'pet',label:'애완녀 조련',health:0,genius:1,energy:3,stamina:3},{name:'genius-cook',skill:'cook',label:'요리 교육',health:0,genius:1,energy:3,stamina:3},{name:'muscular-overwork',skill:'pet',label:'애완녀 조련',health:0,genius:0,energy:0,stamina:5}];
 for(const p of specs){
  const name='training-'+p.name;
  test(name,actor('slave',"slave['stamina']="+p.stamina+"\nslave['energy']="+p.energy+"\nslave['jo9_constitution']="+p.health+"\nslave['jo9_learning_trait']="+p.genius+"\nslave_rate['stamina']=0\n")+"sparks=20000\nkitchen=1\ncooked_food=0\nmenu_form=menu_tutor\n$place='home'\nqa_menu=0 & qa_xp_calls=0 & qa_overwork_calls=0\ncheat_inf_en=0\ngt 'menu_form'",function({body,set,append,prefix,check,finish}){
   prefix('menu_form',"qa_menu+=1\nsavegame '"+name+"-menu-entry.sav'");
   prefix('main_screen',"savegame '"+name+"-main-entry.sav'");
   let dyn=body('#dynamic'),line=dyn.split('\r\n').find(x=>x.includes("dynslave_rate[$target_skill] += func('jo9_traits_personality'")&&x.includes("skill_rise * skill_adv_mul"));a(line);
   let expected=p.skill==='stamina'?'qa_input*3/2':p.genius&&p.skill==='pet'?'qa_input*3/4':p.genius?'qa_input*2':'qa_input';
   dyn=dyn.replace(line,"qa_input=skill_rise*skill_adv_mul & qa_xp_before=dynslave_rate[$target_skill]\n"+line+"\nqa_xp_calls+=1\nqa_gain=dynslave_rate[$target_skill]-qa_xp_before\n"+check('qa_gain='+expected,'XP_RATIO'));
   const over="slave_rate['stamina'] -= jo9_overwork_total / 2";a(dyn.includes(over));dyn=dyn.replace(over,"qa_overwork_calls+=1 & qa_over_before=slave_rate['stamina'] & qa_over_input=jo9_overwork_total\n"+over+"\nqa_over_loss=qa_over_before-slave_rate['stamina']\n"+check('qa_over_loss=qa_over_input/2','OVERWORK_HALF'));
   set('#dynamic',dyn);
   append('interaction_screen',ui('forward'));
   let arrival=check('qa_xp_calls=qa_menu-1','ONE_XP_PER_ACTION')+check("slave['energy']="+p.energy+"-(qa_menu-1)",'AP_SPENT');
   if(p.name==='muscular-overwork')arrival+=check("qa_overwork_calls=qa_menu-1 and slave['jo9_overwork_half']=1 and qa_over_loss=qa_menu-2 and slave_rate['stamina']=1",'HALF_CARRY');
   append('main_screen',"if qa_menu=1:\n"+ui('text',p.label)+"else\n"+arrival+(p.name==='muscular-overwork'?"if qa_menu=2:\nsavegame '"+name+"-first.sav'\n"+ui('text',p.label)+"else\n"+finish()+"end":finish())+"end");
  },'Original home tutor menu -> original coach lesson/result/main XP caller -> native forward pages -> original home menu. Numeric gain and consumed AP asserted around unchanged production call. Muscular case repeats two negative-AP actions.');
 }
}
if(suite==='overwork-entry'){
 for(const initial of [0,-1]){
  const name='overwork-entry-'+(initial===0?'half':'whole');
  test(name,actor('slave',"slave['stamina']=5\nslave['energy']="+initial+"\nslave_rate['stamina']=0\nslave['jo9_overwork_half']=0\n")+"sparks=20000\nqa_overwork_calls=0\n$place='home'\ninteraction=menu_Taming_tutor\ngt 'interaction'",function({body,set,prefix,append,check,finish}){
   let dyn=body('#dynamic'),line="slave_rate['stamina'] -= jo9_overwork_total / 2";a(dyn.includes(line));
   dyn=dyn.replace(line,'qa_overwork_calls+=1 & qa_over_input=jo9_overwork_total & qa_before_loss=slave_rate[\'stamina\']\n'+line+'\nqa_over_loss=qa_before_loss-slave_rate[\'stamina\']\n'+check('qa_over_loss=qa_over_input/2','HALF_PENALTY'));
   set('#dynamic',dyn);append('interaction_screen',ui('forward'));
   prefix('main_screen',check("qa_overwork_calls=1 and slave['energy']="+(initial-1)+" and qa_over_input="+(1-initial)+" and qa_over_loss="+Math.floor((1-initial)/2)+" and slave_rate['stamina']=qa_before_loss-qa_over_loss and slave['jo9_overwork_half']="+((1-initial)%2),'ACTUAL_ACTION_PENALTY')+finish());
  },'Adult muscular fixture starts at original coach interaction entry, then actual interaction_result/energy_drop and original native forward pages return to menu/main. Covers1 point overwork=>0 loss+half credit and2points=>1 loss. Initial tutor menu render from AP0 fixture is separately unresolved.');
 }
}
if(suite==='muscular-render'){
 const name='muscular-render-only';
 test(name,actor('slave',"slave['stamina']=5\nslave['energy']=0\nslave_rate['stamina']=0\n")+"sparks=20000\nkitchen=1 & cooked_food=0\nmenu_form=menu_tutor\n$place='home'\ngt 'menu_form'",function({append,finish}){
  append('main_screen',finish());
 },'Minimum numeric adult muscular/AP0 fixture -> unchanged tutor menu17 -> unchanged main_screen body. Only Start fixture and final snapshot/marker added; no helper instrumentation and no DOM driver. Isolates earlier full-action diagnostic gap.');
}
if(suite==='reported'){
 const stable="slave_state=1 & assistant_state=1\nqa_slave_id=slave['id'] & qa_assistant_id=assistant['id']\nqa_probe_count=0\n";
 for(const role of ['slave','assistant']){
  const name='reported-modal-'+role,debug=role==='slave'?'debug_info':'debug_info_assistant';
  test(name,stable+"$master_head_gear='raven_crown'\nmenu_form=0\ngt 'menu_form'",function({append,prefix,marker,check}){
   prefix(debug,'qa_debug_count+=1\n');
   const driver=reportedScript('modal',"gs '"+debug+"'",name,marker);
   append('main_screen',driver);append(debug,check("slave['id']=qa_slave_id and assistant['id']=qa_assistant_id",'ROLE_IDS_UNCHANGED')+driver);
  },'Unmodified HOME adult slave/assistant -> actual crown main-screen debug_info anchor -> actual mental-status MSG -> actual api/closemsg rectangle center hit test. No CSS or callback repair.');
  metadata[name].reportedIssue='CROWN_MENTAL_STATUS_MSG_LAYER';
 }
 for(const role of ['slave','assistant','room1']){
  const name='reported-milk-'+role;
  const setup=stable+(role==='room1'?"copyarr 'room1','slave'\ncopyarr '$room1','$slave'\ncopyarr 'room1_rate','slave_rate'\nroom1_state=1 & room1_type=slave_type & room1['id']=920001\n$room1_name='Adult QA room1'\n":'')+role+"['lactation']=2\n"+role+"['milk_summ']=80\n"+(role==='room1'?"gt 'slave_private_room1'":"menu_form=0\ngt 'menu_form'");
  test(name,setup,function({append,marker,check}){
   const loc=role==='room1'?'slave_private_room1':'main_screen';
   append(loc,check("slave['id']=qa_slave_id and assistant['id']=qa_assistant_id",'ROLE_IDS_UNCHANGED')+reportedScript('milk','$'+role+'_milk_quantity',name,marker));
  },'Actual role status output with lactation2/milk80 -> dispatch original milk element click -> observe native quantity MSG or absence. DOM tag and original href captured; assistant is the working reference.');
  metadata[name].reportedIssue='MILK_STATUS_ELEMENT';
 }
 {
  const name='reported-room135';
  test(name,stable+"copyarr 'room1','slave'\ncopyarr '$room1','$slave'\ncopyarr 'room1_rate','slave_rate'\nroom1_state=1 & room1_type=slave_type & room1['id']=920001\n$room1_name='Adult QA room1'\nqa_room=0 & qa_enter=0 & qa_leave=0 & qa_profile=0 & qa_menu135=0\ngt 'slave_private_room1'",function({append,prefix,check,finish}){
   prefix('slave_private_room1','qa_room+=1');prefix('slave_stat','qa_profile+=1');
   prefix('snk_room_bridge',"if $args[0]='enter': qa_enter+=1\nif $args[0]='leave': qa_leave+=1");
   prefix('menu_form',"if menu_form=135: qa_menu135+=1");
   append('slave_private_room1',"if qa_room=1:\n"+ui('selector','#slave_short_ava a')+"else\n"+check("qa_room=2 and qa_profile=1 and qa_menu135=1 and qa_enter=1 and qa_leave=1 and snk_room_target=0 and snk_room_inventory=0 and slave['id']=qa_slave_id and assistant['id']=qa_assistant_id and room1['id']=920001 and snk_parked_slave['id']=0",'FALLBACK_ROLES_RESTORED')+"qa_problem=1\n"+finish()+"end");
   append('slave_stat',check("snk_room_target=1 and slave['id']=920001 and snk_parked_slave['id']=qa_slave_id and assistant['id']=qa_assistant_id",'BRIDGE_ROLE_IDS')+ui('href','menu_form = 135'));
  },'Actual room1 portrait anchor -> original snk bridge swaps -> original slave_stat skill135 anchor -> original menu guard -> unexpected original room return. Original/room/assistant ownership and parked clearing asserted.');
  metadata[name].reportedIssue='ROOM_PROFILE_MENU135_FALLBACK';
 }
}
if(suite==='daily'){
 for(const mode of ['ap-map','nutrition','milk']){
  const name='daily-'+mode;let setup='';
  const roles=['slave','assistant','prisoner','cow','farmhand','room1'],caps=[0,2,3,4,5,5];
  if(mode==='ap-map')roles.forEach((r,i)=>setup+=actor(r,r+"['stamina']="+i+"\n"+r+"['energy']=0\n"+r+"['nurse']=0\n"+r+"_rate['stamina']=0\n"));
  if(mode==='nutrition')setup+=actor('slave',"slave['stamina']=1\nslave['energy']=1\nslave['jo9_constitution']=1\nslave['diet_supplements']=1\nslave['calories']=2\nslave['well_rested']=0\nslave_rate['stamina']=0\n");
  if(mode==='milk')for(const r of ['cow','prisoner'])setup+=actor(r,r+"['boobs']=6\n"+r+"['cowSK']=5\n"+r+"['impregnation']=10\n"+r+"['custom']=4\n"+r+"['lactation']=1\n"+r+"['milk_summ']=0\n"+r+"['cowSK_affinity']="+(r==='cow'?1:0)+"\n"+r+"_rate['stamina']=0\n");
  setup+="sparks=20000\nkitchen=1 & barn=1 & dungeon=1 & bath=0\nis_home=1 & city_form=0 & menu_form=0\nmaster_medic=0\nqa_next=0 & qa_reset=0 & qa_end=0 & qa_recovery=0 & qa_nat_count=0 & qa_nat_input=0 & qa_nat_output=0\n$place='home'\ngt 'next_day'";
  test(name,setup,function({body,set,append,prefix,check,finish}){
   prefix('next_day','qa_next+=1');prefix('$end_day_variable_reset','qa_reset+=1');prefix('end_day_screen','qa_end+=1');append('end_day_screen',ui('forward'));
   let nd=body('next_day');
   const recovery="dynamic $do_for_each_slave_in_list, '$next_day_energy_refresh', '$unfrozen_slave_characters'";a(nd.includes(recovery));
   let before='qa_recovery+=1\n',after='';
   if(mode==='ap-map')roles.forEach((r,i)=>{before+="qa_before_"+r+'='+r+"['energy']\n";after+=check(r+"['stamina']="+i+' and '+r+"['energy']-qa_before_"+r+'='+caps[i],'RECOVERY_'+r)+'qa_ap_'+r+'='+r+"['energy']-qa_before_"+r+'\n';});
   nd=nd.replace(recovery,before+recovery+'\n'+after);
   if(mode==='milk'){
    const milk="dynamic $do_for_each_slave_in_list, '$next_day_lactation_update', '$main_screen_slave_characters'";a(nd.includes(milk));
    nd=nd.replace(milk,milk+'\nqa_milk_base=prisoner[\'milk_gain\'] & qa_milk_bonus=cow[\'milk_gain\']\n'+check("qa_milk_base>0 and qa_milk_bonus=qa_milk_base*3/2",'MILK_150'));
   }
   set('next_day',nd);
   if(mode==='nutrition'){
    let tc=body('jo9_traits_combat'),from=tc.indexOf("if $args[0] = 'natural_stamina_xp':"),to=tc.indexOf("\nend",from);a(from>=0&&to>from);
    let block=tc.slice(from,to);
    block=block.replace(' result = args[2]'," qa_nat_count+=1 & qa_nat_input+=args[2]\n qa_nat_half=slave['jo9_constitution_half']\n result = args[2]");
    block=block.replace(' exit'," qa_nat_output+=result\n"+check("result=(args[2]*3+qa_nat_half)/2",'NATURAL_150')+" exit");
    set('jo9_traits_combat',tc.slice(0,from)+block+tc.slice(to));
   }
   append('main_screen',check('day=103 and qa_next=1 and qa_reset=1 and qa_recovery=1 and qa_end>0','FULL_DAY_ONCE')+(mode==='nutrition'?check('qa_nat_count=3 and qa_nat_input=5 and qa_nat_output=7','THREE_NATURAL_SOURCES'):'')+finish());
  },'Complete unchanged next_day -> actual native end-day forward objects -> reset -> original menu/main. Recovery/specific growth caller snapshots and assertions inserted around unchanged calls; no helper body extraction or destination substitution.');
 }
}
const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7);
if(only)for(let i=plans.length-1;i>=0;i--)if(!plans[i].name.includes(only))plans.splice(i,1);
fs.writeFileSync(out+'/plan.json',JSON.stringify(plans,null,2));
const ps=fs.readFileSync(repo+'/tools/qa/run-client-smoke.ps1','utf8').replace("if($probeLog -match 'showMessage\\(\\)')","if($probeLog -match 'showMessage\\(\\), str:\\s*\"FAIL_')").replace('^[a-z-]+$','^[a-z0-9-]+$').replace('_[a-z_]+_COMPLETE$','_[a-z0-9_]+_COMPLETE$');
fs.writeFileSync(out+'/runner.ps1',ps);
if(!process.argv.includes('--run')){console.log('Prepared '+plans.length+' '+suite+' scenarios');process.exit()}
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',out+'/runner.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','35'],{encoding:'utf8',windowsHide:true,timeout:Math.max(60000,plans.length*38000),maxBuffer:1000000});
const results=fs.existsSync(out+'/client-results.json')?JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,'')):[];
const cases=[];
for(const p of plans){
 const logp=out+'/'+p.name+'-stderr.log',log=fs.existsSync(logp)?new TextDecoder('euc-kr').decode(fs.readFileSync(logp)):'';
 if(fs.existsSync(logp))fs.copyFileSync(logp,rec+'/evidence/'+p.name+'.log');
 const stages={};
 for(const stage of ['choice','quote','complete']){
  const f=out+'/'+p.name+'-'+stage+'.sav';
  if(fs.existsSync(f)){const s=sc.parse(fs.readFileSync(f));stages[stage]=Object.fromEntries(s.vars.filter(v=>/^QA_|^(SPARKS|SLAVE_STATE|ASSISTANT_STATE|CHAOTIC_ESSENCE|LAB_ITEMS|SP_TXT|RATING|SLAVE_BASE_PRICE|SLAVEPRICE|DIFFICULTY_SETTING|JO9_DEALER|JO9_RUMOR)/.test(v.name)).map(v=>[v.name,v.values]));}
 }
 const result=results.find(x=>x.name===p.name),defectObserved=!!metadata[p.name].expectedDefect&&/Link clicked "exec:gt"/.test(log);
 const reportedProblem=!!metadata[p.name].reportedIssue&&Object.values(stages).some(s=>s.QA_PROBLEM?.[0]?.[0]==='1');
 const driverGap=Object.values(stages).some(s=>s.QA_DRIVER_GAP?.[0]?.[0]==='1');
 cases.push({id:p.name,status:driverGap?'GAP':reportedProblem&&result?.pass?'FAIL_REPRO':defectObserved?'FAIL':result?.pass?'PASS':'GAP',...metadata[p.name],defectObserved:reportedProblem||defectObserved,failure:(log.match(/FAIL_ECON_[^"\r\n]+/)||[])[0]||null,result,evidence:'evidence/'+p.name+'.log',snapshots:stages});
}
const report={suite,candidate:hash,sourceSaveHash:c.hash(fs.readFileSync(sourceSave)),status:cases.some(x=>x.status==='FAIL_REPRO')?'FAIL_REPRO':cases.every(x=>x.status==='PASS')?'PASS':'GAP',cases,limits:['Adult fixtures primed from isolated HOME save; source save untouched.','Installed FastQSP original EXEC anchors and forward objects synthetically clicked within WebKit; pointer hit tested.','Only Start is replaced. Other original locations, GT destinations and callbacks retained with added counters, assertions, snapshots and HTML driver only.','MSG is asynchronous; numeric state and returned location asserted, but completion marker alone does not prove every notice was physically closed.'],stdout:run.stdout,stderr:run.stderr,workUnchanged:c.hash(fs.readFileSync(game+'/jack.qsp'))===hash};
fs.writeFileSync(rec+'/'+suite+(only?'-'+only:'')+'-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({suite,status:report.status,cases:cases.map(x=>({id:x.id,status:x.status,failure:x.failure,reason:x.result?.reason})),workUnchanged:report.workUnchanged}));
