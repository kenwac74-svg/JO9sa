'use strict';
const fs=require('fs'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(input),doc=core.parse(raw),hits=[];
for(const l of doc.locations){const body=core.shift(doc.lines[l.body],5),lines=body.split('\r\n');
 for(let i=0;i<lines.length;i++)if(/2\.4\.0|(?:\$?(?:game|build)_?version|\$version)\s*=/i.test(lines[i]))hits.push({location:l.name,line:i+1,text:lines[i].slice(0,480)});
}
fs.writeFileSync(__dirname+'/version-audit.json',JSON.stringify({input,sha256:core.hash(raw),hits},null,2));
console.log(JSON.stringify({sha256:core.hash(raw),hits}));
