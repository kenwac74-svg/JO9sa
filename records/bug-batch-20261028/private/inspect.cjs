'use strict';
// Read-only QSP inspection. No files outside this audit directory are written.
const fs=require('node:fs');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qsp=process.env.JO9_AUDIT_QSP||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const doc=core.parse(fs.readFileSync(qsp));
const [name,start='1',end='99999']=process.argv.slice(2);
const loc=doc.locations.find(l=>l.name===name);
if(!loc) throw Error('Unknown location: '+name);
console.log(JSON.stringify({qsp,hash:doc.hash,location:loc.name,locationIndex:loc.index}));
for(const [i,line] of core.shift(doc.lines[loc.body],5).split(/\r?\n/).entries()){
  if(i+1<Number(start)||i+1>Number(end))continue;
  // Suppress rendered prose. Inspection concerns mechanical code only.
  let s=line;
  if(/^\s*(?:\*p[l]?|\*nl|p[l]?|nl)\s+["']/i.test(s)&&!/(?:EXEC:|dynamic |gs |gt )/.test(s))s='[display statement omitted]';
  if(/^\s*\$[\w]+(?:\[[^\]]+\])?\s*=\s*['"].*[가-힣]/.test(s)&&!/[=<>\[\]]/.test(s.slice(s.indexOf('=')+1).replace(/<<.*?>>/g,'')))s='[prose assignment omitted]';
  console.log((i+1)+': '+s);
}
