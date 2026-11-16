'use strict';
// Read-only audit of the live WORK game and the dated planning workbook.
// All output is written beside this script. No game, save, tool, or repo file is modified.
const fs=require('node:fs'),path=require('node:path');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs');
const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp');
const doc=core.parse(raw), bodies=new Map(doc.locations.map(l=>[l.name,core.shift(doc.lines[l.body],5)]));
const workbook=JSON.parse(fs.readFileSync(path.join(__dirname,'workbook-active.json'),'utf8'));
const patch=JSON.parse(fs.readFileSync(repo+'/mods/2026-11-12_zzzzzzzzzz_handoff_b_combined.json','utf8'));
const growth=bodies.get('jo9_origin_growth'),actual={};
for(const match of growth.matchAll(/if \$j9og_family='([^']+)':\r?\n([\s\S]*?)\r?\nend/g)) {
  const values={egoUp:0,egoDown:0,prideUp:0,prideDown:0,sensitivityUp:0};
  for(const m of match[2].matchAll(/\$j9og_key='(ego|pride|sensitivity)' and args\[3\]([<>])0: j9og_percent=(\d+)/g))
    values[m[1]+(m[2]==='>'?'Up':'Down')]=Number(m[3]);
  actual[match[1]]=values;
}
const mismatches=[],fields=['egoUp','egoDown','prideUp','prideDown','sensitivityUp'];
for(const row of workbook.rows) for(const field of fields) {
  const value=actual[row.id]?.[field]||0;
  if(value!==row[field]) mismatches.push({id:row.id,field,workbook:row[field],work:value});
}
const helpers=patch.add_locations.map(l=>({name:l.name,present:bodies.has(l.name),exactBody:bodies.get(l.name)===l.body,
  retainedBody:bodies.get(l.name)?.includes(l.body.trim())||false}));
const occBefore=patch.add_locations.find(x=>x.name==='jo9_occupation_init').body;
const occExpected=occBefore.replaceAll("if (stock['nymphomania'] = -1) = 0:","if stock['nymphomania'] >= 0:");
const bgBefore=patch.add_locations.find(x=>x.name==='jo9_background_b').body;
let princessOverrides=0;
const bgExpected=bgBefore.replace(/^( if \$args\[1\] = '[^']+' and \$args\[2\] = 'mprincess' and args\[3\] = \d+: \$result = )'[^']*' & exit/gm,(_,prefix)=>{princessOverrides++;return prefix+"'mprincess' & exit";});
const laterChanges={occupationOnlyTwoExclusionGuards:bodies.get('jo9_occupation_init')===occExpected,
 backgroundPreservedWithMarketPrefixAndPrincessOverrides:bodies.get('jo9_background_b').endsWith(bgExpected),princessOverrides};
const refs=[];
for(const [name,body]of bodies)body.split(/\r?\n/).forEach((line,i)=>{
  if(/(?:func|gs)\s*\(?\s*['"]jo9_origin_growth/.test(line))refs.push({location:name,line:i+1,text:line.trim().slice(0,240)});
});
const fragments=[];
function fragment(name,regex,before=1,after=2,max=20){
 const rows=(bodies.get(name)||'').split(/\r?\n/),matches=[];
 rows.forEach((line,i)=>{regex.lastIndex=0;if(regex.test(line))matches.push(i);});
 for(const i of matches.slice(0,max))fragments.push({location:name,line:i+1,lines:rows.slice(Math.max(0,i-before),i+after+1).map((s,j)=>`${Math.max(0,i-before)+j+1}: ${s.slice(0,700)}`)});
}
fragment('generate_stock',/B_BACKGROUND_SELECTION|B_BACKGROUND_INITIAL|ORIGIN_GROWTH_INIT|OCCUPATION_INIT_CALL|jo9_occupation_init|jo9_origin_growth|R05A_PRINCESS/,1,9);
fragment('generate_stock',/if \$stock_world = 'ancient_rome'|nation_index.*10/,2,8);
fragment('jo9_background_b',/if \$args\[0\] = '(select|worlds|families|occupations|pick)'/,0,25,5);
fragment('jo9_plain_voice',/\$args\[0\]='update'|j9pv_.*|jo9_plain_tone|mprincess/,1,3,24);
function range(name,start,end){const rows=(bodies.get(name)||'').split(/\r?\n/);fragments.push({location:name,line:start,lines:rows.slice(start-1,end).map((s,i)=>`${start+i}: ${s.slice(0,700)}`)});}
range('#dynamic',5223,5263);
range('#dynamic',5339,5371);
range('jo9_plain_voice',41,69);
range('next_day',4799,4816);
range('interaction',6087,6116);
range('interaction_result',1115,1150);
for(const [name,body]of bodies){
 if(/\$voice_profile\s*\[?/.test(body))fragment(name,/\$voice_profile\s*\[?/,1,9,3);
}
const out={workPath:'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',workHash:doc.hash,
 roundtrip:core.serialize(doc).equals(raw),workbookHash:workbook.sha256,coefficientComparison:{origins:workbook.rows.length,fields:fields.length,cells:workbook.rows.length*fields.length,mismatches},helpers,laterChanges,
 growthReferences:{locations:[...new Set(refs.map(x=>x.location))],physicalLines:refs.length},fragments};
fs.writeFileSync(path.join(__dirname,'audit-facts.json'),JSON.stringify(out,null,2));
fs.writeFileSync(path.join(__dirname,'source-evidence.txt'),fragments.map(x=>`\n[${x.location}:${x.line}]\n${x.lines.join('\n')}`).join('\n'));
console.log(JSON.stringify({...out,fragments:undefined},null,2));
