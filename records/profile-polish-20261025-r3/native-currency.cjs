'use strict';
// Prepare disposable native-engine currency probes. This script does not run them.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',task=path.resolve('G:/Codex/tmp/profile-polish-20261025-r3');
const input=task+'/candidate.qsp',out=path.resolve(process.argv[2]||task+'/native-currency');
const rel=path.relative(task,out);assert(rel&&!rel.startsWith('..')&&!path.isAbsolute(rel));assert(!fs.existsSync(out));
qa.assertOutside(out,[game,'G:/somi/JO9O','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game']);
const raw=fs.readFileSync(input),source=c.parse(raw);assert.equal(source.hash,'38aaaaa5e7c424ec0f9b0b22f125bc2ca4966392ea42f982750375c4d982c0ed');qa.inspectWorld(raw);
const save=game+'/save/JO9_MANUAL_20261025/01_검사완료재확인/20_traits_overflow_merge.sav',saveRaw=fs.readFileSync(save),prime=qa.primeState(sc.parse(saveRaw));
const q=s=>"'"+String(s).replaceAll("'","''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n');
const script=s=>'*p '+q('<script type="text/javascript">'+s.replace(/\r?\n/g,' ')+'</script>');
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
function set(d,n,s){d.lines[d.locations.find(l=>l.name===n).body]=c.shift(cr(s),-5);}
function setup(){return ['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''",'usehtml=1','nsfw=1','sound_on=0','settimer 0','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','snk_room_target=0','is_home=1','city_district=-1','ui_style=2',"gs 'refresh_database'","gs '#static_base'"];}
function driver(name,body){const marker='JO9_QA_CURRENCY_'+name.replaceAll('-','_')+'_COMPLETE';return String.raw`(function(){function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}function emit(ok,m){var a=document.createElement('a');a.href=ok?"EXEC: $qa_currency_metrics='"+JSON.stringify(m).replace(/'/g,"''")+"' & savegame '`+name+String.raw`.sav' & msg '`+marker+String.raw`'":"EXEC: msg 'FAIL_CURRENCY_`+name+String.raw`'";document.body.appendChild(a);click(a)}function text(id){var n=document.getElementById(id);return n?(n.textContent||n.innerText).replace(/\s+/g,' ').trim():''}setTimeout(function(){`+body+String.raw`},250)}());`;}
const plans=[];
function finish(d,name,checkpoint){const bytes=c.serialize(d);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);plans.push({name,file,marker:'JO9_QA_CURRENCY_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint});}
fs.mkdirSync(out,{recursive:true});
for(const name of ['content','css','fonts'])fs.symlinkSync(game+'/'+name,out+'/'+name,'junction');
fs.cpSync(game+'/json',out+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
{
 const d=c.parse(raw),name='rumor-fees',lines=setup().concat([
  'sparks=20000',"gs 'jo9_buyer_rumors','refreshmenus'","jo9_rumor_discount['skups']=0",'qa_fee10=func(\'jo9_buyer_rumors\',\'fee\',\'skups\')',"$text_display=''","dynamic $expert_options[1]","$qa_regular=$text_display",
  "gs 'jo9_buyer_rumors','discount','skups'",'qa_fee5=func(\'jo9_buyer_rumors\',\'fee\',\'skups\')',"$text_display=''","dynamic $expert_options[1]","$qa_discount=$text_display",
  "if sparks ! 20000 or qa_fee10 ! 10 or qa_fee5 ! 5: msg 'FAIL_CURRENCY_FEE_OR_FUNDS' & exit",
  "gs '_layout'","*p '<div id=\"qa_currency_regular\"><<$qa_regular>></div><div id=\"qa_currency_discount\"><<$qa_discount>></div>'",
  script(driver(name,"var a=text('qa_currency_regular'),b=text('qa_currency_discount');emit(a.indexOf('구매자 소문을 듣는다 ($10)')>=0&&b.indexOf('구매자 소문을 듣는다 ($5)')>=0&&a.indexOf('10스파크')<0&&b.indexOf('5스파크')<0,{regular:a,discount:b,fee10:10,fee5:5,fundsUnchanged:20000})"))
 ]);set(d,'Start',lines.join('\r\n'));finish(d,name,'Actual refreshed expert menu and fee functions render $10 and discounted $5; funds stay20000 because menu construction does not purchase.');
}
{
 const d=c.parse(raw),name='range-price';
 const entry=c.literals(get(d,'menu_form')).find(e=>e.text==='가정교사 ($<<coach_price[0]>>-<<coach_price[5]>>)');assert(entry,'Production range literal');
 const lines=setup().concat(['coach_price[0]=20','coach_price[5]=90',"gs '_layout'",'*p '+q('<div id="qa_currency_range">'+entry.text+'</div>'),
  script(driver(name,"var a=text('qa_currency_range');emit(a==='가정교사 ($20-90)',{range:a,minimum:20,maximum:90})"))]);
 set(d,'Start',lines.join('\r\n'));finish(d,name,'Production range literal evaluated by native QSP; interpolation and bounds stay20/90.');
}
{
 const d=c.parse(raw),name='liquidation-money';
 const js=driver(name,"var a=text('side_panel_text');emit(a.indexOf('밀린 비용 $100')>=0&&a.indexOf('가진 돈 $0')>=0&&a.indexOf('부족한 돈 $100')>=0&&a.indexOf('스파크')<0,{sidebar:a,bill:100,money:0,missing:100})");
 set(d,'jo9_liquidation',get(d,'jo9_liquidation')+'\r\n'+script(js));
 set(d,'Start',setup().concat(["$estate='white_house'",'sparks=0','final_payment=100',"jo9_lq['active']=0","gs 'jo9_liquidation','begin'","gs 'jo9_liquidation','view'"]).join('\r\n'));
 finish(d,name,'Actual liquidation view renders bill/money/shortage as $100/$0/$100; no disposal or settlement performed.');
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plans,null,2)+'\n');
fs.writeFileSync(out+'/prepared.json',JSON.stringify({sourceHash:source.hash,source:input,cases:plans,save,saveHash:c.hash(saveRaw),preparedOnly:true,limits:['Diagnostic copies only; no runtime files or existing saves modified.','Native engine must execute plan.json separately. DOM assertions read the real QtWebKit output.','Primed state is for rendering probes, not proof of final Save/Load compatibility.']},null,2)+'\n');
console.log(JSON.stringify({out,cases:plans.length,sourceHash:source.hash,preparedOnly:true}));
