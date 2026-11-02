'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game',d=c.parse(fs.readFileSync(work+'/jack.qsp'));
const locs=d.locations.map(loc=>({name:loc.name,body:c.shift(d.lines[loc.body],5)}));
const terms=/stack_to_slave_nogt|상태가 예상과 다릅니다|buyer_rumor|구매자 소문|소문을 듣는다|소문 듣기|재매입/;
for(const l of locs){
 const lines=l.body.split(/\r?\n/),hits=[];
 for(let i=0;i<lines.length;i++)if(terms.test(lines[i]))hits.push({line:i+1,text:lines[i].slice(0,900)});
 if(hits.length)console.log(JSON.stringify({location:l.name,hits},null,2));
 if(/buyer|stack_to_slave|save.*stack|slave.*stack|_из_боя/.test(l.name))fs.writeFileSync(__dirname+'/'+l.name.replace(/[^a-z0-9_-]/gi,'_')+'.txt',l.body);
}
console.log('HASH',d.hash);
