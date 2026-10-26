'use strict';
// Read-only currency audit: does not create a modified QSP or touch runtime files.
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),f=require('./currency.cjs');
const file='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const d=c.parse(fs.readFileSync(file));let checked=0,changed=0,editCount=0,failures=[];
const rows=[],remaining=[],skipped=[],counts={};
for(const loc of d.locations){
 const b=c.shift(d.lines[loc.body],5);
 for(const e of c.literals(b)){
  if(!/스파크|\$/u.test(e.text))continue;checked++;
  const s=f.scan(e.text),after=f.transform(e.text);
  if(f.transform(after)!==after)failures.push({location:loc.name,line:e.line,reason:'not idempotent'});
  if(s.skipped)skipped.push({location:loc.name,line:e.line,reason:s.skipped});
  if(s.changed){changed++;editCount+=s.changes.length;for(const m of s.changes)counts[m.kind]=(counts[m.kind]||0)+1;rows.push({location:loc.name,line:e.line,edits:s.changes});}
  for(const m of s.remainingAmountUnits)remaining.push({location:loc.name,line:e.line,left:m.left});
 }
}
const report={source:file,sourceHash:d.hash,readOnly:true,checked,changed,editCount,counts,failures,skipped,remaining,rows};
fs.writeFileSync(__dirname+'/currency-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sourceHash:d.hash,checked,changed,editCount,counts,failures:failures.length,skipped:skipped.length,remaining:remaining.length}));
