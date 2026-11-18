'use strict';
const fs=require('fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');console.log=()=>{};
const file=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',phase=process.argv[3]||'green';
async function main(){
 const raw=fs.readFileSync(file),d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
 if(process.argv.includes('--candidate'))for(const e of JSON.parse(fs.readFileSync(__dirname+'/mod/patch.json','utf8')).edits){let l=d.locations.find(l=>l.name===e.location),s=body(e.location);a.equal(s.split(e.old).length-1,e.count);d.lines[l.body]=c.shift(s.split(e.old).join(e.new),-5);}
 const city=body('interaction_city'),headers=[...city.matchAll(/^[ \t]*if[ \t]+interaction_city[ \t]*=[ \t]*(\d+)[^\n]*/gim)];
 const groups=[[],[]];let seen=0;for(let i=0;i<headers.length;i++)if(['102031','102032','102033'].includes(headers[i][1])){groups[Math.floor(seen/3)].push(city.slice(headers[i].index,headers[i+1]?.index));seen++;}a.equal(seen,6);
 const entries=[['Start','exit'],['interaction_screen_city','exit'],['slave_sell_chek','buyer_interested=1'],['jo9_traits_value',"if $args[0]='sale_pay':sparks+=args[1] & qa_payments+=1 & $result=''\r\nif $args[0]='reward':result=args[2]" ]];
 const fields=['QSPGAME','Amarida regression','',c.shift(String(entries.length),-5)];for(const[n,b]of entries)fields.push(c.shift(n,-5),'',c.shift(b,-5),c.shift('0',-5));fields.push('');const fixture=Buffer.from(fields.join('\r\n'),'utf16le');
 const api=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm'),errors=[];
 api.on('error',e=>errors.push(e));for(const ev of ['timer','main_changed','stats_changed','actions_changed','objects_changed','refresh','show_window','panel_visibility','close_file'])api.on(ev,()=>{});
 api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 const cases=[];
 const seed=(hero,progress,npc='Amarida')=>`killall\r\nhero_choice=${hero}\r\nnpc_progress['${npc}']=${progress}\r\n$npc_id='${npc}'\r\nCONST_INT['slave_exist']=1\r\nslave_state=1\r\nslave['brand']=1\r\nsparks=100\r\n$clear_slave_instance={qa_consumed+=1 & slave_state=0}\r\n$rise_faction_fame={qa_fame+=1}\r\ndemand_rating['${npc}']=8\r\ncommon_price[8]=1000\r\n$npc_alignment['${npc}']='eastkvartal'\r\n$buy_quote['${npc}']='QA_COMPLETE'\r\n$Amarida_pref[1]='QA_OFFER'\r\n`;
 for(let gender=0;gender<2;gender++){
  const hero=gender?101:1,route=groups[gender].join('\r\n');
  for(const id of [102031,102032]){api.execCode(seed(hero,2)+`interaction_city=${id}\r\n`+route);cases.push({name:`${hero}:completed-${id}`,ok:api.readVariable('npc_progress','Amarida')===2&&api.readVariable('$text',1)!=='QA_OFFER'});}
  api.execCode(seed(hero,0)+'interaction_city=102031\r\n'+route);cases.push({name:`${hero}:first-offer`,ok:api.readVariable('npc_progress','Amarida')===1&&api.readVariable('$text',1)==='QA_OFFER'});
  api.execCode(seed(hero,1)+'interaction_city=102031\r\n'+route);cases.push({name:`${hero}:active-route`,ok:api.readVariable('interaction_city')===102033});
  for(const progress of [1,2]){api.execCode(seed(hero,progress)+"$interaction_type='sell_slave_complex'\r\n"+body('interaction_result_city'));const paid=api.readVariable('qa_payments'),consumed=api.readVariable('qa_consumed');cases.push({name:`${hero}:delivery-${progress}`,ok:paid===(progress===1?1:0)&&consumed===(progress===1?1:0)&&api.readVariable('npc_progress','Amarida')===2,paid,consumed});}
  api.execCode(seed(hero,1,'OtherBuyer')+"$interaction_type='sell_slave_complex'\r\n"+body('interaction_result_city'));cases.push({name:`${hero}:other-buyer`,ok:api.readVariable('qa_payments')===1&&api.readVariable('qa_consumed')===1});
 }
 a.equal(errors.length,0,JSON.stringify(errors));const failures=cases.filter(x=>!x.ok);const result={phase,sourceHash:d.hash,total:cases.length,passed:cases.length-failures.length,failures,cases,scope:'Original routing and result handler executed; eligibility/payment dependencies are controlled test doubles; no personal save or GUI'};
 fs.writeFileSync(__dirname+'/'+phase+'-results.json',JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({phase,total:cases.length,passed:result.passed,failures})+'\n');
 if(phase==='red')a(failures.length>=6,'Expected completed-offer reset and cached-delivery failures');else a.equal(failures.length,0);
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
