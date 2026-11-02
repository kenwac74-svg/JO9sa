'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),core=require('../text-workshop/core.cjs');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
function body(doc,name){return core.shift(doc.lines[doc.locations.find(x=>x.name===name).body],5);}
function explanation(text,id){const start=text.indexOf('IF interaction_city = '+id+':\r\n');assert(start>=0);const end=text.indexOf('\r\nIF interaction_city = ',start+5);assert(end>start);return text.slice(start,end);}
function diagnostic(raw){
 const d=core.parse(raw),city=body(d,'interaction_city'),load=body(d,'$ongload');
 const cache=load.match(/! JO9 MOD START MARIANNA_POTIONS_CACHE_20261103\r\n([\s\S]*?)! JO9 MOD END MARIANNA_POTIONS_CACHE_20261103/);
 for(const [name,text]of [['_layout','! isolated layout'],['interior_change','$result=$args[1]']])d.lines[d.locations.find(x=>x.name===name).body]=core.shift(text,-5);
 const code=['DEBUG=1','autosave=0','decadesave=0','sound_on=0','snk_room_target=0',"$master_name='테스트'",'sparks=10000','chaotic_essence=7','метаболизм_плюс=1','метаболизм_минус=2','жир_плюс=3','жир_минус=4','qa_copy_checks=0'];let count=0;
 function check(cond,label){count++;code.push('if '+cond+':',' qa_copy_checks+=1','else',' msg '+quote('JO9_QA_COPY_FAIL_'+label),' exit','end');}
 for(const id of [1991,19914]){code.push('interaction_city='+id,"gs 'qa_marianna_"+id+"'");check('txt_count=4','pages_'+id);for(const name of ['아나볼릭','코르티코','메게이스','위고비'])check('instr($text[3],'+quote(name)+')>0','explain_'+id+'_'+name);check("instr($text[3],'#nwtx')>0 and instr($text[4],'#nwtx')>0",'tags_'+id);check("instr($text[4],'카오틱 에센스')>0 and instr($text[4],'카오틱 에센스')<instr($text[4],'마음껏 골라')",'chaotic_before_close_'+id);}
 code.push("$place='pharmacy'",'sp_txt=12','txt=1','*clr',"gs 'pharmacy'",'$qa_menu=$maintxt');for(const name of ['아나볼릭','코르티코','메게이스','위고비'])check('instr($qa_menu,'+quote(name+' ($900)')+')>0','shop_'+name);check('sparks=10000','browse_no_purchase');
 code.push("$npc_name['Marianna']='Маrianna'","$display_options[0]='대사+ 대사- 지방+ 지방-'","$place='pharmacy'",'interaction_city=1991','txt=3','txt_count=4',"$text[3]='OLD_EXPLANATION'",'*clr',"*p '<div id=\"side_panel_main\">Маrianna</div><div id=\"text\">OLD_EXPLANATION</div>'","gs 'qa_marianna_cache'");
 check("$npc_name['Marianna']='마리아나'",'cached_npc_name');check("$display_options[0]='아나볼릭 코르티코 메게이스 위고비'",'cached_menu_names');check("instr($maintxt,'OLD_EXPLANATION')=0 and instr($maintxt,'아나볼릭')>0",'loaded_page_repaint');
 check("instr($maintxt,'>마리아나<')>0 and instr($maintxt,'Маrianna')=0",'loaded_title_repaint');
 code.push('interaction_city=0','sp_txt=125','*clr',"*p '<div>대사+</div>'","gs 'qa_marianna_cache'");check('sparks=10000 and chaotic_essence=7 and метаболизм_плюс=1 and метаболизм_минус=2 and жир_плюс=3 and жир_минус=4','load_no_transaction_replay');
 check('qa_copy_checks='+count,'check_count');const marker='JO9_QA_P20261103_marianna_copy_COMPLETE';code.push('msg '+quote(marker));d.lines[d.locations.find(x=>x.name==='Start').body]=core.shift(code.join('\r\n'),-5);
 const additions=[['qa_marianna_1991',explanation(city,1991)],['qa_marianna_19914',explanation(city,19914)],['qa_marianna_cache',cache?cache[1]:'! no legacy text migration']];for(const [name,text]of additions)d.lines.splice(d.lines.length-1,0,...[name,'',text,'0'].map(x=>core.shift(x,-5)));d.lines[3]=core.shift(String(d.locations.length+additions.length),-5);
 return {raw:core.serialize(d),marker,assertions:count};
}
if(require.main===module){const [file,out]=process.argv.slice(2);assert(file&&out);const r=diagnostic(fs.readFileSync(file));fs.mkdirSync(out,{recursive:true});const target=path.resolve(out,'marianna-copy.qsp');fs.writeFileSync(target,r.raw);fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify([{name:'marianna-copy',marker:r.marker,checkpoint:'actual-dialogue-pharmacy-and-load-cache',file:target}],null,2));fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify({source:path.resolve(file),sha256:core.hash(fs.readFileSync(file)),assertions:r.assertions},null,2));console.log(JSON.stringify({target,assertions:r.assertions}));}
module.exports={body,explanation,diagnostic};
