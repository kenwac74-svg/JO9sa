// 식당 두 경로의 식사 기록과 하루 종료 영양 판정을 검사한다. 실제 플레이 검증은 별도다.
'use strict';
const fs=require('fs'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const file=process.argv[2]||'G:/somi/JO9/game/jack.qsp';
const raw=fs.readFileSync(file),d=core.parse(raw);
assert(core.serialize(d).equals(raw),'QSP round trip');
const body=name=>{const l=d.locations.find(x=>x.name===name);assert(l,name);return core.shift(d.lines[l.body],5);};
function route(id){const s=body('interaction'),start=s.indexOf('IF interaction = '+id+':');assert(start>=0);const match=/\r\n(?:IF|if) interaction = /g;match.lastIndex=start+1;const end=match.exec(s);return s.slice(start,end?end.index:s.length);}
let checks=0;
for(const id of [853,5604]) {
 const t=route(id);assert(t.includes("$place = 'restaurant'"));
 if(id===853) {
  const direct=t.split('$special_part = {')[0];
  assert(/^\s*ate_already\s*=\s*5\b/m.test(direct),'Group meal must be recorded in executed event body, not an unhandled legacy result callback');
  assert(direct.includes("master_moodlet['pos_self_food']"),'Group food moodlet must also execute in the event body');checks+=2;
 }
 const m=t.match(/^\s*ate_already\s*=\s*(\d+)\s*(?:&!.*)?$/m);
 assert(m,`Restaurant ${id} must mark the player as having eaten`);
 const eaten=Number(m[1]);assert.equal(eaten,5);checks++;
 assert(t.includes("master_moodlet['pos_self_food']"),`Restaurant ${id} must use the actual moodlet array`);
 assert(!t.includes("master_mood['pos_self_food']"));checks++;
 // These are the actual next_day guard expressions, not an invented nutrition rule.
 const n=body('next_day');
 const hunger=n.match(/elseif ate_already < master_str and master_str > \(cooked_food \+ max\(0, assistant\['nurse'\] - 3\)\):/);
 const skip=n.match(/elseif ate_already >= max\(1, master_str\):/);
 assert(hunger&&skip,'Unexpected next_day nutrition logic: review test before proceeding');
 for(let strength=0;strength<=5;strength++) {
  assert(!(eaten<strength && strength>(-1+Math.max(0,0-3))),`Restaurant ${id} must prevent no-food strength loss at ${strength}`);
  assert(eaten>=Math.max(1,strength),`Restaurant ${id} must suppress unnecessary home dinner at ${strength}`);
  checks+=2;
 }
 assert(!/master_str_rate\s*\+=/.test(t),'No imported strength growth bonus');checks++;
}
console.log(`PASS ${checks} checks: restaurant meal records, correct moodlet array, nutrition guard boundary cases; source-level verification only.`);
