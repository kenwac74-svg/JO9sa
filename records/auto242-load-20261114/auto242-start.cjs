'use strict';
const fs=require('fs'),R='G:/somi/JO9sa',T='G:/Codex/tmp/auto242-load-20261114',c=require(R+'/tools/text-workshop/core.cjs');
const G=T+'/verified-extraction/JO9_2.4.2_Kor_Full/game',d=c.parse(fs.readFileSync(G+'/jack.qsp'));
for(const n of ['warning','main_menu']){const l=d.locations.find(x=>x.name===n);if(!l)throw Error(n);d.lines[l.body]=c.shift(c.shift(d.lines[l.body],5)+"\r\nmsg 'JO9_QA_AUTO242_EXTRACT_COMPLETE'",-5);}
fs.writeFileSync(G+'/auto242-start.qsp',c.serialize(d));
fs.writeFileSync(G+'/plan.json',JSON.stringify([{name:'original-start',file:G+'/auto242-start.qsp',marker:'JO9_QA_AUTO242_EXTRACT_COMPLETE',checkpoint:'Unchanged Start reaches original warning/main menu, with completion marker appended only in separate diagnostic copy.'}],null,2));
console.log(G);
