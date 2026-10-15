const fs=require('fs'),assert=require('assert'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(process.argv[2]),d=c.parse(raw);assert(c.serialize(d).equals(raw));const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
assert(!body('generate_stock').includes('stock["family_index"] = 54'),'New police-family characters must not have index 54');
for(const n of ['slave','assistant','prisoner','cow','room1','room2','room3','room4'])assert(body('$ongload').includes(`if ${n}['family_index'] = 54: ${n}['family_index'] = 4`));
const options=body('#options'),market=body('interaction_city');
for(let g=0;g<4;g++)for(let tier=0;tier<3;tier++){
 const id=6660+g*3+tier,cost=[1000,1250,1500][tier],start=market.indexOf(`IF interaction_city = ${id}:`),end=market.indexOf('\r\nEND',start),b=market.slice(start,end),gen=b.indexOf("gs 'generate_stock'");
 assert(b.indexOf(`if sparks < ${cost}:`)>=0&&b.indexOf(`if sparks < ${cost}:`)<gen,'Funds guard must precede generation '+id);
 assert(gen>=0&&b.indexOf("if slave_state ! CONST_INT['no_slave']:")>=0&&b.indexOf("if slave_state ! CONST_INT['no_slave']:")<gen);
 assert(b.includes(`sparks -= ${cost}`));
 for(const attr of ['beauty','exotic',...(tier===0?['intellect']:['blood_attitude'])])assert(b.indexOf(`seed_${attr}[${2586+g*3+tier}] = rand_roll`)<gen,'General preset override must precede generation');
}
for(const group of ['black_bazar_options','black_bazar_woman_options'])for(let page=7;page<=10;page++){
 const start=options.indexOf(`$${group}[${page}] = {`),end=options.indexOf('\r\n}',start),b=options.slice(start,end);
 assert(!b.includes('sparks >= 1:'));for(const cost of [1000,1250,1500])assert(b.includes(`sparks >= ${cost}:`));
}
const gen=body('generate_stock'),p=gen.slice(gen.indexOf("elseif $stock_occupation = 'barbarian_princess':"),gen.indexOf("elseif $stock_occupation = 'mprincess':"));
for(const stat of ['expression','calisthenics','gladiatrix'])assert(p.includes(`if stock['${stat}'] < 5: stock['${stat}'] += 1`));
assert(p.includes("stock['cook'] = 0")&&p.includes("stock['service'] = 0"));
if(process.argv[3]){const prev=c.parse(fs.readFileSync(process.argv[3]));for(const l of d.locations)if(!['generate_stock','$ongload','#options','interaction_city'].includes(l.name))assert.equal(d.lines[l.body],prev.lines[prev.locations.find(x=>x.name===l.name).body],l.name);}
console.log('PASS: 12 purchase guards and general seed order, 24 menu thresholds, police new/load fixes, nonsexual occupation bonus, unchanged unrelated locations');
