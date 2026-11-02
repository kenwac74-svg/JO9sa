'use strict';
const h=require('./harness.cjs'),{fs,assert,c,sc,rec,tmp,write,quote,get,candidate,run,actor,init,roleView}=h,p=candidate(),d=p.d;
const sb=get(d,'#static_base'),a=sb.indexOf('$update_slave_features_list = {'),b=sb.indexOf('\n$equip_set_manager = {',a);assert(a>0&&b>a);
const item=get(d,'#item_base'),ia=item.indexOf('$item_property["obereg"] = {'),ib=item.indexOf('\n!OTHER ITEMS',ia);assert(ia>0&&ib>ia);
let checks=0;const check=(v,n)=>{checks++;return `if (${v})=0: msg 'FAIL_REVELIO_INTEGRATION_${n}' & exit\n`;};
const snap=n=>`savegame '${n}.sav'\n`;
let code=init(d)+sb.slice(a,b)+"\n$vb_cycle_skill={$result=$args[1]}\n";
for(const role of ['slave','assistant','room1','stock'])code+=actor(role)+`${role}['jo9_grudge_known']=0\n${role}['jo9_ambition']=1\n${role}['jo9_ambition_known']=0\ngs 'jo9_traits','repair','${role}'\n`;
code+="spell_revelio=1\n"+snap('integration-before');
for(const role of ['slave','assistant','room1','stock']){
 code+=`dynamic $replace($update_slave_features_list,'dynslave','${role}')\n`;
 code+=check(`instr($${role}_features_list,'산만함')>0 and instr($${role}_features_list,'옹졸함')>0 and instr($${role}_features_list,'야심가')>0`,'builder_'+role);
}
code+="gs '$stock_traits'\n"+check("instr($stock_features_list,'산만함')>0 and instr($stock_features_list,'야심가')>0",'stock_builder');
for(const role of ['slave','assistant']){
 code+=`*clr\ngs 'jo9_traits_view','sidebar','${role}',$${role}_features_list\n`;
 code+=check(`instr($maintxt,'jo9_tv_source')>0 and instr($maintxt,'산만함')>0 and instr($maintxt,'[산만함]')>0 and instr($maintxt,'describe&#39;, &#39;distracted')>0`,'sidebar_'+role);
 code+="gs 'jo9_traits_view','open'\n"+check(`instr($maintxt,'data-role="${role}" data-open="1"')>0`,'expanded_'+role);
 code+="gs 'jo9_traits_view','close'\n"+check(`instr($maintxt,'data-role="${role}" data-open="0"')>0`,'close_'+role);
}
code+=snap('integration-after');
// Original item bodies and original cast/reset/reapply statements are executed, without event navigation.
code+="killvar 'slave'\nslave['jo9_focus']=-1\nslave['jo9_focus_known']=0\nspell_revelio=0\nobereg_on=0\nitem_supermacy_bonus=7\n"+item.slice(ia,ib)+"\ndynamic $item_property['obereg']\n$qa_on=$func('jo9_traits','list','slave')\n";
code+=check("spell_revelio=1 and obereg_on=1 and item_supermacy_bonus=9 and instr($qa_on,'산만함')>0 and slave['jo9_focus_known']=0",'equip');
const reset=get(d,'next_day').split('\n').find(x=>x.trim()==='spell_revelio = 0'),reapply=get(d,'$newloc').split('\n').find(x=>x.trim()==='if obereg_on = 1: spell_revelio = 1');assert(reset&&reapply);
code+=reset+'\n'+check('spell_revelio=0','day_reset')+reapply+'\n'+check('spell_revelio=1','item_reapply');
code+="dynamic $item_property_off['obereg']\n$qa_off=$func('jo9_traits','list','slave')\n"+check("spell_revelio=0 and obereg_on=0 and item_supermacy_bonus=7 and instr($qa_off,'산만함')=0 and slave['jo9_focus']=-1 and slave['jo9_focus_known']=0",'unequip');
const inter=get(d,'interaction'),ca=inter.indexOf('IF interaction = 81:'),cb=inter.indexOf('\n!Vulnus sanare',ca);assert(ca>0&&cb>ca);
code+="interaction=81\nsparks=100\nmaster_mage=3\nmaster_mage_rate=0\n"+inter.slice(ca,cb)+'\n$qa_cast=$func(\'jo9_traits\',\'list\',\'slave\')\n'+check("spell_revelio=1 and sparks=60 and master_mage_rate=3 and instr($qa_cast,'산만함')>0 and slave['jo9_focus_known']=0",'cast');
code+="slave['jo9_focus_known']=1\n"+reset+"\n$qa_discovered=$func('jo9_traits','list','slave')\n"+check("instr($qa_discovered,'산만함')>0 and slave['jo9_focus_known']=1",'natural_known_survives_reset');
const r=run(d,'green-integration',code);let comparisons=[];
if(r.engineExit===0){const before=sc.parse(fs.readFileSync(tmp+'/integration-before.sav')),after=sc.parse(fs.readFileSync(tmp+'/integration-after.sav'));for(const role of ['slave','assistant','room1','stock']){const old=roleView(before,role),now=roleView(after,role);assert.equal(Object.keys(old).length,23);assert.equal(Object.values(old).filter(Boolean).length,23);assert.deepEqual(now,old,role+' canonical person changed');comparisons.push({role,groups:23,nonempty:23,equal:true});}}
write(rec+'/integration-results.json',{baseline:h.baseline,candidate:p.patch.after_sha256,checks,engineExit:r.engineExit,results:r.results,canonicalComparisons:comparisons,limits:['Actual builders, sidebar and item/cast bodies; event navigation, visual CSS rendering and personal save reload are outside this fixture.','Original repair runs once before canonical snapshots; no conflicting trait combinations are seeded.']});assert.equal(r.engineExit,0);console.log(JSON.stringify({checks,engineExit:r.engineExit,canonicalComparisons:comparisons}));
