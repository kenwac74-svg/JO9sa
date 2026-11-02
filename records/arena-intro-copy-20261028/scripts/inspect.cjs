'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
for(const l of d.locations){const s=c.shift(d.lines[l.body],5);for(const line of s.split('\n'))if(line.includes("'#txt_man'")||line.includes("'refresh_database'")||line.includes('jo9_dialogue_revision'))console.log(l.name,line.slice(0,360));}
