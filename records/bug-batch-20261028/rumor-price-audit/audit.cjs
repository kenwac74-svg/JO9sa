'use strict';
// Read-only audit of the known WORK baseline. Writes only a small evidence JSON here.
const fs=require('node:fs'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(input),doc=c.parse(raw);
assert.equal(doc.hash,'dbe2948f7c827d8fc82ccd32b2c3453626d181a59eb744e015fa66a3846280ae');
const body=n=>{const l=doc.locations.find(l=>l.name===n);assert(l,n);return c.shift(doc.lines[l.body],5).split(/\r?\n/);};
const hits=(n,re)=>body(n).flatMap((text,i)=>re.test(text)?[{line:i+1,text:text.trim()}]:[]);
const old=JSON.parse(fs.readFileSync('G:/somi/JO9sa/records/buyer-rumors-20261024/roster.json','utf8'));
const rosterLines=body('jo9_rumor_roster'),roster=[];
rosterLines.forEach((s,i)=>{const m=s.match(/\$jo9_rumor_buyer\[\d+\] = '([^']+)'/);if(m)roster.push({id:m[1],mode:rosterLines[i+1].match(/= '([^']+)'/)?.[1],rosterLine:i+1});});
assert.equal(roster.length,98);assert.equal(new Set(roster.map(r=>r.id)).size,98);
const city=body('interaction_city');
for(const row of roster.filter(x=>x.mode!=='house')){
 const meta=old.buyers.find(x=>x.id===row.id);
 row.selector=({barman:'3223',madame_jofre:'2254',vampire_hunter:'10011',penelope:'39912'})[row.id]||meta?.canonicalRoute||meta?.source?.selector?.match(/interaction_city = (\d+)/i)?.[1];
 assert(row.selector,'No native source selector '+row.id);
 row.native=[];
 city.forEach((s,i)=>{
  if(!new RegExp('^\\s*if interaction_city = '+row.selector+':','i').test(s))return;
  const next=city.findIndex((s,j)=>j>i&&/^\s*if interaction_city = \d+:/i.test(s));
  row.native.push({start:i+1,mechanics:city.slice(i,next<0?city.length:next).flatMap((s,j)=>/\$interaction_type\s*=|gt ['"]slave_sell|\$npc_id =|noprice/.test(s)?[{line:i+j+1,text:s.trim()}]:[])});
 });
 assert(row.native.length);
 if(row.mode==='full')assert(row.native.every(n=>n.mechanics.some(m=>/gt ['"]slave_sell/.test(m.text))),'Full path changed '+row.id);
 if(row.mode==='simple')assert(row.native.every(n=>n.mechanics.some(m=>/sell_slave_simple/.test(m.text))),'Simple path changed '+row.id);
}
assert.deepEqual(roster.filter(r=>r.mode==='simple').map(r=>r.id).sort(),['doctor','jarik','realtor','sergant']);
const evidence={input,sha256:doc.hash,scope:'READ_ONLY_STATIC_NO_QUEST_OR_SALE_EXECUTION',rosterCounts:Object.fromEntries(['house','full','simple'].map(mode=>[mode,roster.filter(r=>r.mode===mode).length])),nonHouseNativeRoutes:roster.filter(r=>r.mode!=='house'),prices:{negotiatedDirect:hits('interaction_city',/sell_price = common_price\[demand_rating\[\$npc_id\]\] \+ virgin_price|sell_price = min\(sell_price, 8000\)/).filter(h=>h.line>=12631&&h.line<=12645),virgin:hits('slave_sell_chek',/virgin_price.*relative_rating|virgin_price \*= 2/),relative:hits('#static_base',/relative_rating = \(rating\/2\)/),simplePay:hits('interaction_result_city',/sparks \+= func\('jo9_traits_value', 'base_price'/).filter(h=>h.line<118),directFinal:hits('interaction_result_city',/sell_price = min\(sell_price, 8000\)|sparks \+= sell_price/),traitsBase:hits('jo9_traits_value',/jo9_trait_value_mode = 'base_price'|jo9_versatile.*result \+= result \/ 4/),dealer:hits('jo9_traits_value',/jo9_dealer_grade_price|jo9_dealer_value = max|obedience.*20 \/ 100|broken.*jo9_dealer_value|result = jo9_dealer_value \*|jo9_dealer_value = auction_price|result = min\(6000/),guildAccess:hits('guild',/slave_state.*brand.*> 0/).filter(h=>h.line<29),guildOffer:hits('interaction_city',/rating > 0 or difficulty_setting.*jo9_dealer_offer/),guildFinish:hits('jo9_traits_value',/slave\['brand'\] < 1|difficulty_setting = 2 and rating < 1|jo9_dealer_payment < 1/),priceTables:hits('#static_txt',/^common_price\[|^auction_price\[/)},warnings:['Roster full is a matcher mode. All20 full buyers currently route to slave_sell (negotiated direct option); none of the roster uses sell_slave_complex.','Only simple4 uses base_price(common_price[demand]); no virgin bonus or8000 cap exists on that native path. Do not add a cap only to rumor comparison.','Compare numerical guaranteed direct payouts per matched buyer, not only demand_rating.','Haggling911 and its theoretical maximum are a separate conditional outcome; no quest simulation or roll maximization was executed.','dealer_quote default slave semantics must remain compatible when adding optional actor role. Guild UI requires conscious exist state and brand>0. Hard difficulty additionally needs rating>0.']};
assert(fs.readFileSync(input).equals(raw));evidence.workUnchanged=true;
fs.writeFileSync(__dirname+'/evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({sha256:doc.hash,rosterCounts:evidence.rosterCounts,allFullRoutesVerified:true,workUnchanged:true}));
