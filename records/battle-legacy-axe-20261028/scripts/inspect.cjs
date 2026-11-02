'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game',d=c.parse(fs.readFileSync(work+'/jack.qsp'));
console.log('CURRENT',d.hash);
for(const n of ['боевой_интерфейс','боевое_меню','$gladiator_fight_start']){const l=d.locations.find(x=>x.name===n),s=c.shift(d.lines[l.body],5);fs.writeFileSync(__dirname+'/'+n+'.txt',s);console.log(n,s.split('\n').filter(x=>/arena_mode|combatant|axe|fight_options|fight_subtions|гладиатор|гладиат|gladiat|боевое_меню/.test(x)).join('\n'));}
for(const l of d.locations){const s=c.shift(d.lines[l.body],5);for(const line of s.split('\n'))if(/green|axe|axe\.png|axe_used/.test(line)&&/pic|ui/.test(line))console.log('REF',l.name,line.slice(0,350));}
