'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=__dirname;
for(const [version,p] of [['work','G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'],['original','G:/somi/JO9O/game/jack.qsp']]){
 const d=c.parse(fs.readFileSync(p));const evidence=[];
 for(const l of d.locations){const a=c.shift(d.lines[l.body],5).split(/\r?\n/);for(let i=0;i<a.length;i++){
  const s=a[i];if(s.trim().startsWith('!'))continue;
  if((/\bgold\b|Fruits_minibox|Fruits_maxibox/i.test(s)&&s.length<300)|| /과일.*\$menu|\$menu.*과일/.test(s))evidence.push({loc:l.name,line:i+1,text:s});
 }}
 fs.writeFileSync(root+'/fruit-code-'+version+'.json',JSON.stringify({hash:d.hash,evidence},null,2));
 if(version==='work')console.log(evidence.map(x=>JSON.stringify(x)).join('\n'));
}
