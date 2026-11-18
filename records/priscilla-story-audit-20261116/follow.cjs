'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const hits=[];for(const l of d.locations){let a=c.shift(d.lines[l.body],5).split('\n');for(let i=0;i<a.length;i++)if(/portal|vatican|witch_book|pope|papa|교황|붉은 책|빨간 책|포털/i.test(a[i]))hits.push({location:l.name,line:i+1,text:a[i].slice(0,310)});}
fs.writeFileSync(__dirname+'/follow.json',JSON.stringify(hits,null,2));
console.log('LOCATIONS',JSON.stringify(d.locations.filter(l=>/portal|vatican|end_game|ending/i.test(l.name)).map(l=>l.name)));
console.log('QUESTS',JSON.stringify(hits.filter(x=>x.location==='#quest_base').map(x=>({...x,text:x.text.slice(0,180)}))));
console.log('CODE',JSON.stringify(hits.filter(x=>['#options','city_menu_form','guild','interaction_city'].includes(x.location)&&!/^\s*\$(?:text|.*pref|.*description|.*info)/i.test(x.text)).slice(0,60)));
