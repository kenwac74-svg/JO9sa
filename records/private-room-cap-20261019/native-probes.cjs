'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const expected=[['kamira_house',1],['Otchuzhdenie_house',1],['serpis_house',2],['RedLight_house',2],['taurus_house',3],['korvus_house',3],['Centralkvartal_house',4],['white_house',4],['slum_house',0],['eastkvartal_house',0],['fogs_house',0],['',0]];
const prices=[5000,2000,5000,10000];
function body(doc,name){const l=doc.locations.find(x=>x.name===name);if(!l)throw Error('Missing '+name);return core.shift(doc.lines[l.body],5);}
function replace(doc,name,code){const l=doc.locations.find(x=>x.name===name);if(!l)throw Error('Missing '+name);doc.lines[l.body]=core.shift(code,-5);}
function assertion(expr,label){return ['if '+expr+':','else',' msg '+quote('JO9_QA_ASSERT_FAILED_'+label),' exit','end'];}
function purchaseBlocks(text){const start=text.indexOf('if interaction_city = 951011:');const end=text.indexOf('if interaction_city = 951536:',start);if(start<0||end<0)throw Error('Purchase boundaries missing');return text.slice(start,end);}
function portraitBlock(text){const start=text.indexOf('! JO9 MOD START J9M1299');const end=text.indexOf('! JO9 MOD END J9M1299',start);if(start<0||end<0)throw Error('Portrait boundaries missing');return text.slice(start,end);}
function navBlock(text){const found=text.match(/(?:! JO9 MOD START PRIVATE_ROOM_ACCESS[^\r]*\r\n)?\t?if \$estate (?:= 'white_house'|! '') and kulaconstruct >= 1:\r\n[\s\S]*?\tend\t*(?:\r\n! JO9 MOD END PRIVATE_ROOM_ACCESS)?/);if(!found)throw Error('Navigation boundary missing');return found[0];}
function build(raw){
 const base=core.parse(raw),token=crypto.randomBytes(10).toString('hex').toUpperCase();
 const init=['killall','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','sound_on=0',"gs '#static_base'","gs '#options'",'day=3','snk_room_target=0'];
 const menus=[];let menuCases=0;
 // Catches wrong residence tier, off-by-one cap, missing money boundary, and
 // stale shop closures. Expectations are literal requirements, not patch output.
 for(const [estate,cap] of expected)for(let count=0;count<=4;count++)for(const enough of [false,true]){
  const cash=count<4?prices[count]-(enough?0:1):20000;
  menus.push('$estate='+quote(estate),'kulaconstruct='+count,'sparks='+cash,"dynamic $KulaShop_options[7]");
  for(let stage=1;stage<=4;stage++){
   const allow=count<cap&&count===stage-1&&enough;
   const expr="instr($text_display, 'interaction_city="+(951010+stage)+"')"+(allow?'>0':'=0');
   menus.push(...assertion(expr,'menu_'+menuCases+'_'+stage));
  }
  menus.push(...assertion('kulaconstruct='+count+' and sparks='+cash,'menu_no_charge_'+menuCases));menuCases++;
 }
 const purchases=[];let purchaseCases=0;
 // Execute the candidate's actual four transaction blocks in isolation. These
 // checks catch forged/stale menu actions, stage skipping and duplicate charges.
 for(const [estate,cap] of expected)for(let stage=1;stage<=4;stage++)for(const enough of [false,true])for(const offset of [0,1]){
  const count=stage-1+offset,cash=prices[stage-1]-(enough?0:1),allow=stage<=cap&&enough&&offset===0;
  purchases.push('$estate='+quote(estate),'kulaconstruct='+count,'sparks='+cash,'interaction_city='+(951010+stage),"gs 'demo_estate'");
  purchases.push(...assertion('kulaconstruct='+(allow?stage:count)+' and sparks='+(allow?cash-prices[stage-1]:cash),'purchase_'+purchaseCases));purchaseCases++;
 }
 const access=[];let accessCases=0;
 for(const [estate] of expected)for(let count=0;count<=4;count++){
  access.push('$estate='+quote(estate),'kulaconstruct='+count,"$text_display=''","gs 'new_estate'");
  access.push(...assertion("instr($text_display, 'menu_form=30010')"+(estate&&count>0?'>0':'=0'),'navigation_'+accessCases));
  access.push('*clr',"gs 'demo_estate'");
  for(let room=1;room<=4;room++)access.push(...assertion("instr($maintxt, 'slave_private_room"+room+"')"+(estate&&count>=room?'>0':'=0'),'portrait_'+accessCases+'_'+room));
  access.push(...assertion('kulaconstruct='+count+" and room4_ration=2 and $room4_name='KEEP' and room4['qa_sentinel']=17",'preserved_'+accessCases));accessCases++;
 }
 const make=(name,lines,overrides)=>{
  const doc=core.parse(raw),marker='JO9_QA_'+token+'_'+name.replaceAll('-','_')+'_COMPLETE';
  for(const [name,code]of Object.entries(overrides||{}))replace(doc,name,code);
  replace(doc,'Start',[...init,...lines,'msg '+quote(marker)].join('\r\n'));
  const result=core.serialize(doc);qa.inspectWorld(result);return{name,marker,checkpoint:'Native requirement assertions',raw:result};
 };
 const oldDoc=core.parse(fs.readFileSync(path.join(__dirname,'before.qsp')));
 const oldOptions=body(oldDoc,'#options');
 const oldStart=oldOptions.indexOf('$KulaShop_options[7] = {'),oldEnd=oldOptions.indexOf('$KulaShop_options[8] = {',oldStart);
 if(oldStart<0||oldEnd<0)throw Error('Old closure missing');
 const oldAssignment=oldOptions.slice(oldStart,oldEnd).trimEnd().replace('$KulaShop_options[7]','$display_options[7]');
 const legacy=[oldAssignment,"$display_options[1]={qa_shop_first=81}","$place='kulashop'","$estate='kamira_house'",'kulaconstruct=0','sparks=5000',"gs '#options'","dynamic $display_options[7]",
 ...assertion("instr($text_display, 'interaction_city=951011')>0",'legacy_shop_construction'),
 'qa_shop_first=0',"dynamic $display_options[1]",...assertion('qa_shop_first=81','legacy_shop_other_page'),
 "$display_options[7]={qa_shop_other=93}","$place='shop_wpn'","gs '#options'",'qa_shop_other=0',"dynamic $display_options[7]",...assertion('qa_shop_other=93','unrelated_shop_preserved')];
 return{counts:{menuCases,purchaseCases,accessCases,legacyCacheCases:3},probes:[
  make('room-menu-boundaries',menus),
  make('room-purchase-guards',purchases,{'demo_estate':purchaseBlocks(body(base,'interaction_city'))}),
  make('room-existing-access',["room4_ration=2","$room4_name='KEEP'","room4['qa_sentinel']=17",...access],{'demo_estate':portraitBlock(body(base,'main_screen')),'new_estate':navBlock(body(base,'menu_form'))}),
  make('room-legacy-shop-cache',legacy)
 ]};
}
function prepare(input,out){
 const dest=path.resolve(out),allowed=path.resolve('G:/somi/JO9_work_backups');
 if(!dest.toLowerCase().startsWith((allowed+path.sep).toLowerCase())||fs.existsSync(dest))throw Error('New isolated backup directory required');
 fs.mkdirSync(dest,{recursive:true});
 const work='G:/somi/Jack O Nine Tails v2.4_work/game';
 fs.cpSync(path.join(work,'json'),path.join(dest,'json'),{recursive:true});
 fs.copyFileSync(path.join(work,'config.xml'),path.join(dest,'config.xml'));
 fs.writeFileSync(path.join(dest,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const raw=fs.readFileSync(input),built=build(raw);
 const plan=built.probes.map(p=>{const file=path.join(dest,p.name+'.qsp');fs.writeFileSync(file,p.raw);return{name:p.name,file,marker:p.marker,checkpoint:p.checkpoint};});
 fs.writeFileSync(path.join(dest,'plan.json'),JSON.stringify(plan,null,2));
 fs.writeFileSync(path.join(dest,'coverage.json'),JSON.stringify({input,sha256:core.hash(raw),...built.counts},null,2));
 console.log(JSON.stringify({out:dest,plan:path.join(dest,'plan.json'),...built.counts}));
}
if(require.main===module){const [input,out]=process.argv.slice(2);if(!input||!out)throw Error('Usage: native-probes.cjs input.qsp isolated-output-directory');prepare(input,out);}
module.exports={build,purchaseBlocks,portraitBlock,navBlock};
