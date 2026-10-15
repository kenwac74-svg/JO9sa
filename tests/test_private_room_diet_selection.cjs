const fs=require('fs'),assert=require('assert'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(process.argv[2]),d=c.parse(raw);assert(c.serialize(d).equals(raw));const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
for(let n=1;n<=4;n++){
 const b=body('slave_private_room'+n);assert(b.includes('JO9_PRIVATE_DIET_SELECTION_20261015'),'Diet needs an explicit room-scoped selection handler');
 assert(b.includes("if $snk_room_view = 'diet_set':"));assert(b.includes(`room${n}_ration = args[1]`));
 assert(b.includes(`if room${n}_ration ! args[1]: room${n}['special_diet_days'] = 0`),'Reselecting the same diet must preserve consecutive days');
 for(const value of [0,1,2])assert(b.includes(`gt ''slave_private_room${n}'', ''diet_set'', ${value}`));
 assert(b.includes('.jo9_diet_option{display:block;'));
 const overlay=b.slice(b.indexOf("if $snk_room_view = 'diet':",b.indexOf('snk_room_notice')),b.indexOf(`$snk_room_last_text[${n}]`));
 assert(!overlay.includes('스파크/일'));assert(overlay.includes('8$/일'));assert(overlay.includes('조절한 양에 좋은 재료와 간식을 더한다'));
}
const help=body('snk_room_diet_migrate');assert(help.includes('닷새')&&help.includes('열흘'));assert(!help.includes('기존 체형 관리 식단.'));assert(!help.includes('5일부터 특별대우 기분 효과'));
if(process.argv[3]){const prev=c.parse(fs.readFileSync(process.argv[3]));const edits=JSON.parse(fs.readFileSync(process.argv[4])).edits;let expected=[...prev.lines];for(const e of edits){const l=prev.locations.find(l=>l.name===e.location);let b=c.shift(expected[l.body],5);assert.equal(b.split(e.old).length-1,e.count);expected[l.body]=c.shift(b.split(e.old).join(e.new),-5)}assert.deepEqual(d.lines,expected);assert.equal(body('next_day'),c.shift(prev.lines[prev.locations.find(l=>l.name==='next_day').body],5));}
console.log('PASS: 4 room-scoped handlers, all 12 diet choices, full-row links, same-diet streak preservation, help refresh, unchanged daily food effects and exact patch scope');
