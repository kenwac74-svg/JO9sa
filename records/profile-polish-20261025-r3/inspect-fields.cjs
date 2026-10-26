'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
for(const n of ['refresh_database','$newloc','$ongload']){const l=d.locations.find(x=>x.name===n);console.log('LOCATION '+n+'\n'+c.shift(d.lines[l.body],5).slice(0,12500));}
