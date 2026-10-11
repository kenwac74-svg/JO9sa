const fs=require('fs'),assert=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(process.argv[2]),d=c.parse(raw);assert(c.serialize(d).equals(raw));
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const s=body('interaction_city'),r=s.slice(s.indexOf('IF interaction_city = 120351:'),s.indexOf('IF interaction_city = 120352:'));
assert(!/\+ _\r\n\s*\r\n/.test(r),'Quest continuation must not terminate on an empty line');
assert(r.includes("$npc_id = 'leshiy'"),'Use registered NPC key, not translated display name');
assert(body('#npc_base').includes("$npc_name['leshiy'] = '레시'"));
assert(r.includes("copyarr '$text', '$Leshiy_pref'"));
for(let i=1;i<=6;i++)assert(body('#npc_base').includes(`$leshiy_pref[${i}] = `));
assert(r.includes('quest_description_mode = 0 & gt $curloc'));assert(r.includes("$return_lock  = 'shop_general'"));
assert(s.includes("npc_progress['Leshiy'] = 1 and slave['brand'] > 0 and slave['brand'] < 4: interaction_city = 120352"));
if(process.argv[3]){const prev=c.parse(fs.readFileSync(process.argv[3]));for(const l of d.locations){const old=c.shift(prev.lines[prev.locations.find(x=>x.name===l.name).body],5);if(l.name==='interaction_city'){const fixed=old.replace("$npc_id = '레시'","$npc_id = 'leshiy'").replace('+ _\r\n\r\n\t\'<br><a href = "EXEC: quest_description_mode', '+ _\r\n\t\'<br><a href = "EXEC: quest_description_mode');assert.equal(body(l.name),fixed);}else assert.equal(body(l.name),old);}}
console.log('PASS: Leshiy NPC key, quest continuation, six dialogue pages, return/sale routes, exact change scope; source test only.');
