const fs=require('fs'),assert=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(process.argv[2]),d=c.parse(raw);assert(c.serialize(d).equals(raw));
const body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
const s=body(d,'interior_change'),rule=s.match(/<style id="jo9_clean_style">([^']+)/)[1];
assert(rule.includes('#approve,#deny{visibility:hidden!important;pointer-events:none!important}'),'Approval and refusal must both hide and stop accepting clicks');
assert(!rule.includes('#jo9_image_cycle'));assert(!rule.includes('#jo9_cutscene_view'));
assert(s.includes("$replace($maintxt, $jo9_clean_overlay, '')"),'Restore removes overlay');
const choice=body(d,'choice_screen');assert(choice.includes('id = "approve"'));assert(choice.includes('id = "deny"'));assert(choice.includes('EXEC: dynamic $yes'));assert(choice.includes('EXEC: dynamic $no'));
if(process.argv[3]){const prev=c.parse(fs.readFileSync(process.argv[3]));for(const l of d.locations){let expected=body(prev,l.name);if(l.name==='interior_change')expected=expected.replace('#snk_room_menu{visibility:hidden','#snk_room_menu,#approve,#deny{visibility:hidden');assert.equal(body(d,l.name),expected,l.name);}}
console.log('PASS: hide/restore selector contract, toggle visibility, unchanged callbacks and exact QSP scope. Source verification only.');
