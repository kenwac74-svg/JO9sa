'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
for(const loc of d.locations){
 const b=c.shift(d.lines[loc.body],5),rows=b.split('\r\n'),hits=[];
 for(let i=0;i<rows.length;i++){
  const line=rows[i];if(!/semen_gain|spawn_milked|tentacle_size|jo9.*milk/.test(line))continue;
  if(/^\s*(?:\*p|\*pl|\*nl|msg|!|\$.*(?:text|message|description|body))/i.test(line))continue;
  if(/\$slave_name|\$assistant_name|\$cow_name/.test(line))continue;
  hits.push({line:i+1,code:line.slice(0,320)});
 }
 if(hits.length)console.log(JSON.stringify({location:loc.name,hits}));
}
