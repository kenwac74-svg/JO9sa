'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),core=require('../text-workshop/core.cjs');
const {body:readBody,explanation}=require('./probe.cjs');
const mappings=[['대사+','아나볼릭'],['대사-','코르티코'],['지방+','메게이스'],['지방-','위고비'],['마리안나','마리아나'],['아나볼릭가','아나볼릭이']];
const page3='아나볼릭은 신진대사를 높여 살이 덜 찌고 빠지기 쉽게 해. 코르티코는 반대로 신진대사를 낮춰 살이 붙기 쉽게 하지. 둘은 매일 먹은 음식에 따라 몸무게가 변하는 경향을 바꾸는 약이야.<br><br>메게이스는 체지방을 늘리고, 위고비는 줄여서 체형을 직접 바꿔 줘. 네 가지 모두 $900에 3회분이야. 체질을 바꿀지, 당장 체형을 손볼지 생각해서 골라, <<$master_name>>.<!-- #nwtx -->';
const page4='그리고, 카오틱 에센스는 네 노예의 특성 중에 그다지 좋지 않은 것들을 무작위로 하나 없애줄 거야. 가격은 비싸지만 좋은 노예를 가지고 싶다면 꼭 필요한 약이지.<br><br>마음껏 골라, 쑥스러워하지 말고, <<$master_name>>!<!-- #nwtx -->';
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const norm=v=>mappings.reduce((s,[old,n])=>`replace(${s}, ${quote(old)}, ${quote(n)})`,v);
function build(raw){
 const d=core.parse(raw),original=core.parse(raw);assert(core.serialize(d).equals(raw));const counts=[];
 function set(name,text){d.lines[d.locations.find(x=>x.name===name).body]=core.shift(text,-5);}
 const body=name=>readBody(d,name);
 for(const loc of d.locations){let text=body(loc.name);for(const [old,n]of mappings){const count=text.split(old).length-1;if(count){text=text.replaceAll(old,n);counts.push({location:loc.name,old,new:n,count});}}set(loc.name,text);}
 for(const name of ['#npc_base','#npc_base_woman']){
  const before=body(name),re=/\$npc_name\['Marianna'\] = '[^']*'/g;assert.equal([...before.matchAll(re)].length,1);set(name,before.replace(re,"$npc_name['Marianna'] = '마리아나'"));
 }
 for(const id of [1991,19914]){
  const before=body('interaction_city'),old=explanation(before,id);let next=old;
  for(const [index,text]of [[3,page3],[4,page4]]){const re=new RegExp('(^[ \\t]*)\\$text\\['+index+'\\] = [^\\r\\n]*','m');assert(re.test(next));next=next.replace(re,(_,indent)=>indent+'$text['+index+'] = '+quote(text));}
  set('interaction_city',before.replace(old,next));
 }
 const lines=[
  '! JO9 MOD START MARIANNA_POTIONS_CACHE_20261103',
  '! Rename saved display text only. Never replay a purchase or change item variables.',
  'local $jo9_marianna_html = '+norm('$maintxt'),
  'local $jo9_marianna_old_page = '+norm('$text[txt]'),
  "local $jo9_marianna_old_name = $npc_name['Marianna']",
  "if $jo9_marianna_old_name ! '' and $jo9_marianna_old_name ! '마리아나': $jo9_marianna_html = replace($jo9_marianna_html, '>' + $jo9_marianna_old_name + '<', '>마리아나<')",
  'local jo9_potion_name_i',
 ];
 for(const array of ['$text','$sp_text','$display_options','$Marianna_talk','$pharmacy'])lines.push(`for jo9_potion_name_i = 0 to arrsize('${array}') - 1:`,' '+array+'[jo9_potion_name_i] = '+norm(array+'[jo9_potion_name_i]'),'end');
 for(const v of ["$npc_info['Marianna']","$place_info['pharmacy']",'$pharmacy_accept','$pharmacy_deny'])lines.push(v+' = '+norm(v));
 lines.push("$npc_name['Marianna'] = '마리아나'","if $place = 'pharmacy' and (interaction_city = 1991 or interaction_city = 19914) and txt_count = 4:",' $text[3] = '+quote(page3),' $text[4] = '+quote(page4)," if (txt = 3 or txt = 4) and $jo9_marianna_old_page ! '': $jo9_marianna_html = replace($jo9_marianna_html, $jo9_marianna_old_page, $text[txt])",'end',"if $jo9_marianna_html ! $maintxt: *clr & *p $jo9_marianna_html",'! JO9 MOD END MARIANNA_POTIONS_CACHE_20261103','');
 set('$ongload',lines.join('\r\n')+body('$ongload'));
 const candidate=core.serialize(d),parsed=core.parse(candidate);assert(core.serialize(parsed).equals(candidate));assert.equal(parsed.locations.length,original.locations.length);
 const edits=[];for(const loc of d.locations){const old=readBody(original,loc.name),text=body(loc.name);if(old!==text)edits.push({location:loc.name,field:'body',old,new:text,count:1});}
 const allowed=new Set(edits.map(e=>original.locations.find(l=>l.name===e.location).body));for(let i=0;i<original.lines.length;i++)if(!allowed.has(i))assert.equal(parsed.lines[i],original.lines[i],'Unrelated field '+i);
 // Potion use, numeric effects and purchases must not change. Only their displayed labels do.
 assert.equal(body('interaction'),readBody(original,'interaction'),'Potion effect logic');
 const pharmacyBefore=readBody(original,'pharmacy'),pharmacyAfter=body('pharmacy');assert.equal(mappings.reduce((s,[o,n])=>s.replaceAll(o,n),pharmacyBefore),pharmacyAfter,'Purchase mechanics');
 const patch={id:'2026-11-03_marianna_potion_names_dialogue',description:'Korean Marianna display name, four user-specified potion names, explanation pages3/4 and safe display-cache migration. No potion mechanics or purchases changed.',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits};
 return {raw:candidate,patch,page3,page4,report:{beforeSha256:patch.before_sha256,afterSha256:patch.after_sha256,locations:parsed.locations.length,changedLocations:edits.map(e=>e.location),labelChanges:counts,dialogueBranches:[1991,19914],pagesPerBranch:4,hiddenTag:'#nwtx',potionEffectLogicPreserved:true,purchaseLogicPreserved:true,roundtrip:true,unrelatedFieldsPreserved:true,internalMariannaIdPreserved:true}};
}
if(require.main===module){const [input,out]=process.argv.slice(2);assert(input&&out);const r=build(fs.readFileSync(input));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'jack.qsp'),r.raw);fs.writeFileSync(path.join(out,'patch.json'),JSON.stringify(r.patch,null,2));fs.writeFileSync(path.join(out,'build.json'),JSON.stringify(r.report,null,2));fs.writeFileSync(path.join(out,'dialogue.json'),JSON.stringify({page3:r.page3,page4:r.page4},null,2));console.log(JSON.stringify(r.report));}
module.exports={build};
