const fs=require('fs'),assert=require('node:assert/strict'),c=require('../tools/text-workshop/core.cjs');
assert(process.argv[2],'Pass the current game QSP path.');
const raw=fs.readFileSync(process.argv[2]),d=c.parse(raw);assert(c.serialize(d).equals(raw));
const bodies=Object.fromEntries(d.locations.map(l=>[l.name,c.shift(d.lines[l.body],5)]));
for(const [loc,before] of [['$ongload',"saved_game_loaded = 1"],['$addon',"msg '<br><center>게임이"]]){const b=bodies[loc],i=b.indexOf('JO9_MESSAGE_LAYOUT_REFRESH_20261015');assert(i>=0&&i<b.indexOf(before),`${loc}: message settings must refresh before load continuation/update notice`);const config=b.slice(i,b.indexOf('! JO9_MESSAGE_LAYOUT_REFRESH_END',i));assert(config.includes("$MSG_OK_IMAGE = 'content/pic/buttons/ok-icon.png'"));for(const row of ['MSG_OK_X = 250','MSG_OK_Y = 340','MSG_TEXT_X = 80','MSG_TEXT_Y = 40','MSG_TEXT_W = 370','MSG_TEXT_H = 400','MSG_X = 200'])assert(config.includes(row));assert(!config.includes('SNKmod'));}
console.log('PASS: canonical message button/geometry restored before load continuation and update popup; QSP roundtrip');
