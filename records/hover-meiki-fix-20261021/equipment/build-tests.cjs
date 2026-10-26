'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const world=process.argv[2],out=path.resolve(process.argv[3]);
assert(world&&out);fs.mkdirSync(out,{recursive:true});
const raw=fs.readFileSync(world),q=s=>"'"+s.replaceAll("'","''")+"'";
const literal=s=>s.split('<<').map(q).join(" + '<' + '<' + ");
const source='Live "quoted" & <b>bold</b><Br>next \' apostrophe; 3 < 5 > 2 <<6+7>>';
const want='Live &quot;quoted&quot; &amp; bold next &#39; apostrophe; 3 &lt; 5 &gt; 2 &lt;&lt;6+7&gt;&gt;';
const scenarios=[
 {name:'equip-master',marker:'JO9_QA_EQUIP_master_COMPLETE',code:[
  "if qa_after = 0:"," gs '#dynamic'",' $onnewloc = '+q(''),' комбез = 2',' $master_armor = '+q(''),
  ' $item_description["комбез"] = '+literal(source), ' qa_after = 1', ' dynamic $master_armor_list', 'else',
  ' if instr($equip_choice, '+q('class="tooltip-left" tooltip-data="'+want+'"')+') = 0: msg '+q('JO9_QA_EQUIP_master_MISSING_TOOLTIP')+' & exit',
  ' if instr($equip_choice, '+q('href = "EXEC: $new_item = \'комбез\' & slot = 1 & gt \'item_change\'"')+') = 0: msg '+q('JO9_QA_EQUIP_master_CHANGED_HREF')+' & exit',
  ' if instr($equip_choice, '+q('[2]</a><br>')+') = 0: msg '+q('JO9_QA_EQUIP_master_CHANGED_COUNT')+' & exit',
  ' msg '+q('JO9_QA_EQUIP_master_COMPLETE'),'end']},
 {name:'equip-common',marker:'JO9_QA_EQUIP_common_COMPLETE',code:[
  "gs '#dynamic'",' $onnewloc = '+q(''),'$equip_choice = '+q(''),'$slave_name = '+q('QA'),
  '$item_description["maid_dress"] = '+literal(source),
  'dynamic $replace($get_non_combat_equipment, '+q('dyn')+'+'+q('slave')+', '+q('slave')+'), '+q('maid_dress')+', 24, '+q('Forced label')+', 1, 2',
  'if instr($equip_choice, '+q('class="tooltip-left" tooltip-data="'+want+'"')+') = 0: msg '+q('JO9_QA_EQUIP_common_MISSING_TOOLTIP')+' & exit',
  'if instr($equip_choice, '+q('href = "EXEC: $new_item = \'maid_dress\' & slot = 24 & gt \'item_change\', 2">Forced label</a>')+') = 0: msg '+q('JO9_QA_EQUIP_common_CHANGED_HREF')+' & exit',
  'if instr($equip_choice, '+q('aurabound.png')+') > 0: msg '+q('JO9_QA_EQUIP_common_CHANGED_AURA_FLAG')+' & exit',
  '$equip_choice = '+q(''), '$item_name["maid_dress"] = '+q('Actual label'), 'slave_inventory["maid_dress"] = 1', 'inventory["maid_dress"] = 3',
  'dynamic $replace($get_non_combat_equipment, '+q('dyn')+'+'+q('slave')+', '+q('slave')+'), '+q('maid_dress')+', 24, '+q('')+', 0, 2',
  'if instr($equip_choice, '+q('>Actual label</a>')+') = 0 or instr($equip_choice, '+q('tooltip-right')+') = 0 or instr($equip_choice, '+q('(1/4)')+') = 0: msg '+q('JO9_QA_EQUIP_common_CHANGED_AURA_OR_LABEL')+' & exit',
  'if arrsize('+q('jo9_eq_text')+') ! 0 or arrsize('+q('jo9_eq_tag')+') ! 0: msg '+q('JO9_QA_EQUIP_common_SCRATCH_LEAK')+' & exit',
  '$equip_choice = '+q(''), 'dynamic $replace($get_non_combat_equipment, '+q('dyn')+'+'+q('slave')+', '+q('slave')+'), '+q('unknown-test-item')+', 24, '+q('Unknown label')+', 1',
  'if instr($equip_choice, '+q('tooltip-data=""')+') = 0 or instr($equip_choice, '+q('Unknown label')+') = 0: msg '+q('JO9_QA_EQUIP_common_CHANGED_EMPTY_DESCRIPTION')+' & exit',
  'msg '+q('JO9_QA_EQUIP_common_COMPLETE')]}
];
const baselineDoc=core.parse(raw),newloc=core.shift(baselineDoc.lines[baselineDoc.locations.find(l=>l.name==='$newloc').body],5);
const cacheAt=newloc.indexOf('if jo9_meiki_revision < '),cacheEnd=newloc.indexOf('\r\nend',cacheAt)+5,cacheBlock=newloc.slice(cacheAt,cacheEnd);
assert(cacheAt>=0&&cacheEnd>cacheAt);
scenarios.push({name:'equip-cache',marker:'JO9_QA_EQUIP_cache_COMPLETE',code:[
 "jo9_meiki_revision = 214348873", "$master_armor_list = 'stale'", "$get_non_combat_equipment = 'stale'", cacheBlock,
 "if jo9_meiki_revision ! 214348874: msg 'JO9_QA_EQUIP_cache_STALE_REVISION' & exit",
 "if $master_armor_list = 'stale' or $get_non_combat_equipment = 'stale': msg 'JO9_QA_EQUIP_cache_STALE_DEFINITIONS' & exit",
 "if $jo9_equipment_tooltip = '': msg 'JO9_QA_EQUIP_cache_MISSING_FORMATTER' & exit", "$master_armor_list = 'do-not-reset'", cacheBlock, "if $master_armor_list ! 'do-not-reset': msg 'JO9_QA_EQUIP_cache_REPEATED_REFRESH' & exit", "msg 'JO9_QA_EQUIP_cache_COMPLETE'"]});
scenarios.push({name:'equip-current',marker:'JO9_QA_EQUIP_current_COMPLETE',code:[
 "gs '#dynamic'", "gs '#static_base'", "gs '#item_base'", "gs '#боевые_предметы'",
 "$qa_description = $dyneval($jo9_equipment_tooltip, 'комбез')",
 "if instr($qa_description, '방어: 참격/관통/둔기/추위/번개/불+1, 회피+3') = 0: msg 'JO9_QA_EQUIP_current_STALE_COMBAT_DESCRIPTION' & exit",
 "if instr($item_description['комбез'], '<br>') = 0 or instr($qa_description, '<br>') > 0: msg 'JO9_QA_EQUIP_current_MUTATED_SOURCE_OR_TAGS' & exit",
 "$equip_choice = ''", "dynamic $replace($get_non_combat_equipment, 'dyn'+'slave', 'slave'), 'maid_dress', 24, '', 1",
 "if instr($equip_choice, '잡일과 청소 교육효율 Up, 세련됨 +1') = 0: msg 'JO9_QA_EQUIP_current_STALE_CLOTHING_DESCRIPTION' & exit",
 "msg 'JO9_QA_EQUIP_current_COMPLETE'"
]});
const plan=[];
for(const test of scenarios){const d=core.parse(raw),start=d.locations.find(l=>l.name==='Start');d.lines[start.body]=core.shift(test.code.join('\r\n'),-5);const file=path.join(out,test.name+'.qsp');fs.writeFileSync(file,core.serialize(d));plan.push({name:test.name,marker:test.marker,checkpoint:'Start assertions',file});}
fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify(plan,null,2));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({input:world,sha256:core.hash(raw),scenarios:scenarios.map(x=>({name:x.name,assertions:x.code.filter(y=>y.includes('if instr'))})),purpose:'Native regression: removed tooltip attributes fail; current descriptions must be rendered as safe plain attribute text while href, item count, force label, quantity and aura suppression remain intact.'},null,2));
console.log('Prepared '+plan.length+' real FastQSP behavior regressions; '+core.hash(raw));
