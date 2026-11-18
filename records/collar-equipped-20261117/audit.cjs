'use strict';
const fs=require('node:fs'),path=require('node:path'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const target='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(target),doc=core.parse(raw),sources=doc.locations.map(loc=>({name:loc.name,body:core.shift(doc.lines[loc.body],5)}));
const out={target,hash:core.hash(raw),locations:doc.locations.length,collarInventoryChecks:[],wornReferences:[],honorRuleReferences:[]};
for(const loc of sources){const rows=loc.body.split(/\r?\n/);for(const [i,line]of rows.entries()){
 if(/inventory\[['"]shock_collar['"]\]/i.test(line))out.collarInventoryChecks.push({location:loc.name,line:i+1,code:line.replace(/\{[\s\S]*$/,'{ [omitted]')});
 if(/\[['"]collar['"]\]/i.test(line)&&(/\b(?:if|elseif)\b|\[['"]collar['"]\]\s*(?:=|\+=|-='?)/.test(line)))out.wornReferences.push({location:loc.name,line:i+1,code:line.length<220?line:'[long line omitted]'});
 if(/humility_rule|honor_rule/i.test(line))out.honorRuleReferences.push({location:loc.name,line:i+1,code:/^\s*(?:if|elseif|end|else)\b/.test(line)&&line.length<220?line:'[expression or description omitted]'});
}}
fs.writeFileSync(path.join(__dirname,'source-index.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify({hash:out.hash,locations:out.locations,inventoryCount:out.collarInventoryChecks.length,wornCount:out.wornReferences.length,honorCount:out.honorRuleReferences.length},null,2));
for(const row of out.collarInventoryChecks)if(/next_day|private_room|equipment|collar/i.test(row.location))console.log(JSON.stringify(row));
for(const row of out.wornReferences)if(/equipment|collar|private_room/i.test(row.location))console.log(JSON.stringify(row));
for(const row of out.honorRuleReferences)if(/next_day|private_room/i.test(row.location))console.log(JSON.stringify(row));
