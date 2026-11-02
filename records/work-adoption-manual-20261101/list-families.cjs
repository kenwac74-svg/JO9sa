'use strict';
const fs=require('fs'),path=require('path'),W='G:/somi/Jack O Nine Tails v2.4_work/game/content/pic',families=new Map();
function scan(dir){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name),s=fs.lstatSync(p);if(s.isSymbolicLink())continue;if(s.isDirectory())scan(p);else if(/\.(?:png|jpe?g|gif|webp|bmp)$/i.test(name)){const base=p.replace(/ \([2-9][0-9]*\)(\.[^.]+)$/,'$1').toLowerCase();if(!families.has(base))families.set(base,[]);families.get(base).push(p);}}}
for(const folder of ['bg','characters','scene'])scan(W+'/'+folder);
console.log(JSON.stringify([...families].filter(([k,v])=>v.length>=3&&fs.existsSync(k)).map(([k,v])=>({base:path.relative(W,k).replaceAll('\\','/'),cuts:v.map(x=>path.basename(x))})),null,2));
