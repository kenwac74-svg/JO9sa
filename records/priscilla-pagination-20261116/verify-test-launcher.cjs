'use strict';
const fs=require('fs'),a=require('node:assert/strict'),save=require('G:/somi/JO9sa/tools/qa/save-codec.cjs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');
console.log=()=>{};
async function main(){
 const manifest=JSON.parse(fs.readFileSync(__dirname+'/test-save.json','utf8')),raw=fs.readFileSync(manifest.file);a.equal(c.hash(raw),manifest.sha256);
 const html=save.dec(save.parse(raw).lines[8]);
 const codes=[...html.matchAll(/href="EXEC: ([^"]+)"/g)].map(m=>m[1].replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));a.equal(codes.length,5,'Original guild reward must also have a direct test entry');
 const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));a.equal(d.hash,manifest.qspHash);const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
 const city=body('interaction_city'),lo=city.indexOf('! JO9 MOD START WITCH_COVEN_ENTRY_20261111'),hi=city.indexOf('!Saving christmas quest.',lo);a(lo>=0&&hi>lo);
 const entries=[['Start','exit'],['#options','exit'],['interaction_city',city.slice(lo,hi)+"\r\ngt 'interaction_result_city'"],['shop_general','exit'],['city_menu_form','exit'],['_layout','*clr'],['$objsel',body('$objsel')],['jo9_reference_panel',"$result=''"],['interior_change',"$result=$args[1]"],['interaction_result_city',body('interaction_result_city')],['interaction_screen_city',body('interaction_screen_city')]];
 const fields=['QSPGAME','Priscilla test launcher','',c.shift(String(entries.length),-5)];for(const[n,s]of entries)fields.push(c.shift(n,-5),'',c.shift(s,-5),c.shift('0',-5));fields.push('');const fixture=Buffer.from(fields.join('\r\n'),'utf16le');
 const api=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm'),errors=[],results=[];let rendered='';api.on('error',e=>errors.push(e));api.on('main_changed',s=>rendered=s);
 for(const ev of ['timer','stats_changed','actions_changed','objects_changed','refresh','show_window','panel_visibility','close_file'])api.on(ev,()=>{});
 api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 for(let i=0;i<codes.length;i++){
  a.equal(codes[i],manifest.stages[i].code);rendered='';api.execCode("killall\r\n*clr\r\n$quest[14]='qa14'\r\n$quest[15]='qa15'\r\n$onnewloc=''\r\n$onobjsel='$objsel'\r\n$counter=''\r\n$npc_image['witch']='witch'\r\n$master_name='QA_MASTER'\r\n$interaction_type='basic'\r\nnoble_status=1\r\nnpc_progress['Venera']=2\r\nnpc_progress['Pelageya']=2\r\ntxt=4\r\ntxt_is_set_from_save=1\r\n"+codes[i]);
  a.equal(errors.length,0,JSON.stringify(errors));a.equal(api.readVariable('interaction_city'),manifest.stages[i].expected);a.equal(api.readVariable('txt'),1);a(rendered.length>0);const result={stage:i+1,route:api.readVariable('interaction_city'),firstPage:api.readVariable('txt'),rendered:true};
  if(i===2||i===4){const total=i===2?manifest.stages[i].expectedPages:22,late=i===2?manifest.stages[i].rewardStartPage:21,second=i===2?manifest.stages[i].rewardSecondPage:22,expected=i===2?'priscilla_post_portal_reward_':'witch';result.pagesVisited=[];for(let page=1;page<=total;page++){a.equal(api.readVariable('txt'),page);a.equal(api.readVariable('txt_count'),total);if(page>=late)a(rendered.includes(expected+(i===2?(page<second?'01':'02'):(page<second?'5':'6'))+'.png'));result.pagesVisited.push(page);if(page<total){api.selectObject(1);a.equal(errors.length,0,JSON.stringify(errors));}}result.rewardImagesRendered=true;}
  results.push(result);
 }
 const out={saveHash:manifest.sha256,actualSavedHtmlLinks:codes.length,engine:'QSP WASM 5.8',cases:results,limitations:'Helper stubs only; actual object-selection page handler exercised. Native save loading and screen appearance left for user review.'};fs.writeFileSync(__dirname+'/test-save-verification.json',JSON.stringify(out,null,2)+'\n');process.stdout.write(JSON.stringify({links:codes.length,passed:results.length,routes:results.map(x=>x.route),pageNavigation:results.filter(x=>x.pagesVisited).map(x=>({route:x.route,pages:x.pagesVisited.length,images:x.rewardImagesRendered}))})+'\n');
}
main().catch(e=>{process.stderr.write(e.stack+'\n');process.exitCode=1;});
