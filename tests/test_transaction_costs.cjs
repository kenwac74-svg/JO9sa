'use strict';
// Source-contract and arithmetic boundary tests; not a QSP runtime/play test.
const fs=require('fs'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(process.argv[2]),d=core.parse(raw);
assert(core.serialize(d).equals(raw));
const body=n=>core.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
const route=(loc,id)=>{const s=body(loc),r=new RegExp('^if '+loc+' = '+id+':','im'),m=r.exec(s);assert(m,`${loc}:${id}`);const end=/\r?\n(?:if|IF) interaction(?:_city)? = /.exec(s.slice(m.index+m[0].length));return s.slice(m.index,end?m.index+m[0].length+end.index:s.length);};
let checks=0;
for(const [id,cost] of [[853,12],[5543,4],[5602,2],[5603,4],[5604,8],[5606,2],[5607,5]]){
 const r=route('interaction',id);
 const m=r.match(/^if interaction = \d+:\r?\n\s*jo9_event_cost = (\d+)\r?\n\s*if sparks < jo9_event_cost: msg '[^']+' & gt 'menu_form'\r?\n\s*sparks -= jo9_event_cost/im);
 assert(m,`Missing guarded direct payment before effects: ${id}`);assert.equal(+m[1],cost);
 assert.equal((r.match(/sparks\s*-=/g)||[]).length,1,`Exactly one payment site ${id}`);
 for(const cash of [0,cost-1,cost,cost+1,cost*2]){const admitted=cash>=+m[1],after=admitted?cash-+m[1]:cash;assert.equal(admitted,cash>=cost);assert.equal(after,cash>=cost?cash-cost:cash);assert(after>=0);checks+=3;}
 checks+=3;
}
for(const [id,cost] of [[11521,30],[11522,30],[11523,30],[11524,30],[11531,10],[11532,10],[11533,10]]){
 const r=route('interaction_city',id);
 const guard=r.match(/if sparks < (\d+): msg '[^']+' & skip_to = [23] & gt 'shop_general'/);
 assert(guard,`Missing food execution check ${id}`);assert.equal(+guard[1],cost);
 const debit=r.indexOf(`sparks -= ${cost}`);assert(debit>r.indexOf(guard[0]));
 assert(r.indexOf('dynamic $get_fridge_space')<debit);
 assert(r.indexOf('if kitchen < 1 or fridge_space < 5:')<debit);
 for(const cash of [cost-1,cost,cost+1])for(const space of [4,5])for(const kitchen of [0,1]){
  const ok=cash>=+guard[1]&&space>=5&&kitchen>=1;
  assert.equal(ok,cash>=cost&&space>=5&&kitchen>=1);assert((ok?cash-cost:cash)>=0);checks+=2;
 }
 checks+=5;
}
// Confirmation transactions must check funds before any interior/stat mutation.
for(const loc of ['interaction_city']){
 const s=body(loc),starts=[...s.matchAll(/^if interaction_city = (134\d+|3326|33261):/gm)];let interiors=0;
 for(const m of starts){const r=route(loc,+m[1]);if(!r.includes('$yes = {')||!r.match(/sparks -= \d+/))continue;
  const price=+r.match(/sparks -= (\d+)/)[1];if(price===0)continue;
  const first=r.split('$yes = {')[1].trimStart().split(/\r?\n/)[0];
  assert(first.startsWith(`if sparks < ${price}: msg `),`Confirm guard first ${m[1]}`);
  if(m[1].startsWith('134'))interiors++;checks++;
 }
 assert.equal(interiors,62);checks++;
}
assert(!/if sparks >= (10|20|5) and fridge_space >= 5 and kitchen > 0:/.test(body('#options').split('$gastronom_options[2] = {')[1].split('$gastronom_options[3]')[0]));
assert(body('#options').includes("if sparks >= 25 and slave['fertility'] = 0"));
assert(body('#options').includes("if sparks >= 25 and assistant['fertility'] = 0"));
const cage=body('menu_form').split('IF assistant["energy"] >= 2 and sparks >= 5:')[1];assert(cage.split('END')[0].includes('ELSEIF sparks < 5:'));
if(process.argv[3]){
 const baseline=core.parse(fs.readFileSync(process.argv[3]));
 const old=n=>core.shift(baseline.lines[baseline.locations.find(x=>x.name===n).body],5);
 // Remove only the new payment prefix and restore two dormant debits.
 let restored=body('interaction').replace(/ jo9_event_cost = \d+\r\n if sparks < jo9_event_cost: msg '[^']+' & gt 'menu_form'\r\n sparks -= jo9_event_cost\r\n/g,'');
 for(const [id,cost] of [[5606,2],[5607,5]]){
  const before=old('interaction'),m=new RegExp('IF interaction = '+id+':').exec(before),tail=before.slice(m.index),end=/\r\n(?:IF|if) interaction = /.exec(tail.slice(1)),r=tail.slice(0,end?end.index+1:tail.length);
  const noDebit=r.replace(`    sparks -= ${cost}\r\n`,'');assert(restored.includes(noDebit));restored=restored.replace(noDebit,r);
 }
 assert.equal(restored,old('interaction'),'All event rewards/types/meal flags preserved');checks++;
 for(const l of d.locations){if(['interaction','interaction_city','#options','menu_form'].includes(l.name))continue;assert.equal(body(l.name),old(l.name),`Unexpected location change ${l.name}`);checks++;}
 // Unchanged menu captions and action routes, except explicit price failure messages/guards.
 for(const loc of ['#options','menu_form']){
  const calls=s=>s.split(/\r?\n/).filter(x=>/func\('\$menu'/i.test(x)).map(x=>x.slice(x.toLowerCase().indexOf("func('$menu'")));
  const x=calls(old(loc)),y=calls(body(loc));assert.equal(x.length,y.length);
  for(let i=0;i<x.length;i++){
   let expected=x[i];if(expected.includes('산란화 (25$)'))expected=expected.replace('iif(sparks < 50','iif(sparks < 25');
   if(/Fresh_eggs_gray|Fresh_milk_gray|Double_cream_gray|Mature_cheese_gray/.test(expected))expected=expected.replace("'음식을 보관할 자리가 없다'","iif(sparks < 30, '돈이 부족합니다. (30$ 필요)', '음식을 보관할 자리가 없다')");
   if(/Fresh_vegetables_gray|Cereals_flour_gray|Herbs_spices_gray/.test(expected))expected=expected.replace('구매할 수 없다','돈이 부족합니다. (10$ 필요)');
   assert.equal(y[i],expected,`Menu action/caption preservation ${loc}:${i}`);checks++;
  }
 }
}
console.log(`PASS ${checks+4} source/boundary checks (not gameplay)`);
