'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const file=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const d=c.parse(fs.readFileSync(file)),bad=[];
for(const l of d.locations)for(const field of ['body','desc']){
 const s=c.shift(d.lines[l[field]],5),re=/content[\\/]+pic[\\/]+ui[\\/]+frames[\\/]+legacy[\\/]+bg[\\/]+/gi;
 const hits=[...s.matchAll(re)];if(hits.length)bad.push({location:l.name,field,count:hits.length});
}
console.log(JSON.stringify({file,invalidDirectoryReferences:bad.reduce((n,x)=>n+x.count,0),locations:bad}));
assert.equal(bad.length,0,'Scene-directory prefix must not be rewritten as the stem of the bg.png UI file');
