'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const hits=[];for(const l of d.locations){let a=c.shift(d.lines[l.body],5).split('\n');for(let i=0;i<a.length;i++)if(/grand_final/.test(a[i]))hits.push({location:l.name,line:i+1,context:a.slice(Math.max(0,i-5),i+13).map(s=>s.slice(0,350))});}
fs.writeFileSync(__dirname+'/grand-final.json',JSON.stringify(hits,null,2));console.log(JSON.stringify(hits,null,2));
const ending=d.locations.find(x=>x.name==='epic_win_marsjinn');console.log('ENDING\n'+c.shift(d.lines[ending.body],5).slice(0,11000));
