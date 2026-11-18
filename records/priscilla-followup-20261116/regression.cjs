'use strict';
const fs=require('fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');console.log=()=>{};
async function main(){
 const input=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',phase=process.argv[3]||'red',raw=fs.readFileSync(input),d=c.parse(raw);
 const body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
 if(process.argv.includes('--candidate'))for(const e of JSON.parse(fs.readFileSync(__dirname+'/mod/patch.json','utf8')).edits){let l=d.locations.find(x=>x.name===e.location),s=body(e.location);a.equal(s.split(e.old).length-1,e.count);d.lines[l.body]=c.shift(s.split(e.old).join(e.new),-5);}
 const city=body('interaction_city'),lo=city.indexOf('! JO9 MOD START WITCH_COVEN_ENTRY_20261111'),hi=city.indexOf('!Saving christmas quest.',lo);a(lo>=0&&hi>lo);const section=city.slice(lo,hi);
 const entries=[['Start','exit'],['shop_general','qa_shop+=1'],['city_menu_form','qa_return+=1'],['_layout','exit'],['jo9_reference_panel',"$result=''"],['interior_change',"$result=$args[1]"],['interaction_result_city',body('interaction_result_city')],['interaction_screen_city',body('interaction_screen_city')]];
 const fields=['QSPGAME','Priscilla follow-up regression','',c.shift(String(entries.length),-5)];for(const[n,s]of entries)fields.push(c.shift(n,-5),'',c.shift(s,-5),c.shift('0',-5));fields.push('');const fixture=Buffer.from(fields.join('\r\n'),'utf16le');
 const api=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm'),errors=[];let html='';
 api.on('error',e=>errors.push(e));api.on('main_changed',s=>html=s);
 for(const ev of ['timer','stats_changed','actions_changed','objects_changed','refresh','show_window','panel_visibility','close_file'])api.on(ev,()=>{});
 api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 const cases=[],newPages=fs.existsSync(__dirname+'/approved-pages.json')?JSON.parse(fs.readFileSync(__dirname+'/approved-pages.json','utf8')):[];
 const seed=(o={})=>`killall\r\n*clr\r\nkillobj\r\n$onnewloc=''\r\n$ongload=''\r\n$counter=''\r\nrevolution=${o.rev??1}\r\nwitch_text=${o.met??2}\r\nwitch_talk=${o.reward??1}\r\ngrand_final=${o.final??0}\r\n$quest[14]='qa14'\r\n$quest[15]='qa15'\r\nactive['qa14']=${o.q14??2}\r\nactive['qa15']=2\r\ncity_already_done_ever['6220']=${o.portal??0}\r\ncity_already_done_ever['6026']=${o.seen??0}\r\nnoble_status=1\r\nnpc_progress['Venera']=2\r\nnpc_progress['Pelageya']=2\r\n$npc_image['witch']='witch'\r\n$master_name='QA_MASTER'\r\n$interaction_type='basic'\r\nsparks=12345\r\ninventory['qa_book_sentinel']=7\r\nmaster_energy=3\r\ninteraction_city=${o.id??6021}\r\n`;
 const casesData=[
  {name:'revolt-reward-pending',reward:0,expected:6024,key:'길드'},
  {name:'revolt-portal-pending',expected:6024,key:'포털'},
  {name:'old-direct-reminder',id:6024,expected:6024,key:'포털'},
  {name:'old-direct-emperor',id:6023,expected:6024,key:'포털'},
  {name:'first-meeting-after-revolt',met:0,expected:6024,key:'포털'},
  {name:'portal-scene-not-finished',portal:1,final:1,expected:6024,key:'포털'},
  {name:'post-portal',portal:1,expected:6026,newScene:true},
  {name:'post-portal-reward-unclaimed',portal:1,reward:0,expected:6026,newScene:true},
  {name:'post-portal-revisit',portal:1,seen:1,expected:6024,key:'책'},
  {name:'pre-revolt-king-task',rev:0,expected:6024,legacy:true},
  {name:'pre-revolt-emperor-task',rev:0,q14:1,expected:6023,legacy:true},
 ];
 for(const o of casesData){html='';api.execCode(seed(o)+section+"\r\ngt 'interaction_result_city'");a.equal(errors.length,0,JSON.stringify(errors));const route=api.readVariable('interaction_city'),text=api.readVariable('$text',1);
  let ok=route===o.expected;
  if(o.key)ok&&=text.includes(o.key)&&!text.includes('바바리안');
  if(o.newScene){ok&&=api.readVariable('txt_count')===15&&api.readVariable('witch_talk')===1&&api.readVariableByKey('city_already_done_ever','6026')===1;
   if(newPages.length)for(let i=0;i<15;i++)ok&&=api.readVariable('$text',i+1)===newPages[i];
   for(let i=12;i<=15;i++)ok&&=api.readVariable('$text',i).length>0;
   ok&&=html.includes('priscilla_post_portal_talk.png')&&api.readVariable('$special_image',14)==='scene\\Witch\\priscilla_post_portal_reward_01.png'&&api.readVariable('$special_image',15)==='scene\\Witch\\priscilla_post_portal_reward_02.png';
   if(phase!=='red')for(const page of [12,13,14,15]){api.execCode(`*clr\r\ntxt=${page}\r\ngt 'interaction_screen_city'`);a.equal(errors.length,0,JSON.stringify(errors));const image=page<14?'priscilla_post_portal_talk.png':page===14?'priscilla_post_portal_reward_01.png':'priscilla_post_portal_reward_02.png';ok&&=html.includes(image)&&api.readVariable('txt')===page&&api.readVariableByKey('city_already_done_ever','6026')===1;}
  }
  ok&&=api.readVariable('sparks')===12345&&api.readVariableByKey('inventory','qa_book_sentinel')===7&&api.readVariableByKey('active','qa15')===2&&api.readVariable('master_energy')===3;
  cases.push({name:o.name,ok,route,expected:o.expected,pages:api.readVariable('txt_count'),preserved:{sparks:api.readVariable('sparks'),bookSentinel:api.readVariableByKey('inventory','qa_book_sentinel'),quest15:api.readVariableByKey('active','qa15'),energy:api.readVariable('master_energy')}});
 }
 for(const id of [6022,6023,6024]){api.execCode(seed({id})+"npc=1\r\n$npc_id='witch'\r\n$place='slum_house'\r\ntxt=1\r\ntxt_count=22\r\n$text[1]='QA_OLD_BARBARIAN_REMINDER'\r\n$text[2]='QA_STALE_PAGE'\r\n$special_image[1]='scene\\Witch\\witch.png'\r\ngt 'interaction_screen_city'");a.equal(errors.length,0,JSON.stringify(errors));cases.push({name:'saved-screen-'+id,ok:!html.includes('QA_OLD_BARBARIAN_REMINDER')&&api.readVariable('txt_count')===1&&api.readVariableByKey('city_already_done_ever','6026')===0&&api.readVariable('sparks')===12345});}
 api.execCode(seed({id:6024,portal:1})+"txt=1\r\n$text[1]='QA_OLD_REMINDER'\r\ngt 'interaction_screen_city'");a.equal(errors.length,0,JSON.stringify(errors));cases.push({name:'saved-screen-post-portal',ok:html.includes('돌아왔구나')&&!html.includes('QA_OLD_REMINDER')&&api.readVariableByKey('city_already_done_ever','6026')===0});
 api.execCode(seed({id:6025,reward:0})+section+"\r\ngt 'interaction_result_city'");a.equal(errors.length,0,JSON.stringify(errors));cases.push({name:'original-guild-reward',ok:api.readVariable('interaction_city')===6025&&api.readVariable('txt_count')===22&&api.readVariable('witch_talk')===1&&api.readVariable('$special_image',21)==='scene\\Witch\\witch5.png'&&api.readVariableByKey('city_already_done_ever','6026')===0});
 const failures=cases.filter(x=>!x.ok),result={phase,beforeHash:c.hash(raw),candidateHash:c.hash(c.serialize(d)),total:cases.length,passed:cases.length-failures.length,failures,cases,scope:'Actual quest routing/result/renderer; layout/interior presentation stubbed; no player save or native window'};
 fs.writeFileSync(__dirname+'/'+phase+'-results.json',JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({phase,total:cases.length,passed:result.passed,failures})+'\n');if(phase==='red')a(failures.length>0);else a.equal(failures.length,0);
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
