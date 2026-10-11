// 테스트 복사본의 조건과 실제 이벤트로 연결되는 시작 코드를 검증한다.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),s=require('./save-codec.cjs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const dir=process.argv[2],m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))),q=c.parse(fs.readFileSync('G:/somi/JO9/game/jack.qsp')),body=n=>c.shift(q.lines[q.locations.find(l=>l.name===n).body],5);
assert.equal(c.hash(fs.readFileSync(m.base)),m.baseHash,'Original save unchanged');
for(const r of m.reports){const raw=fs.readFileSync(path.join(dir,r.name+'.sav')),d=s.parse(raw),html=s.dec(d.lines[8]);assert.equal(c.hash(raw),r.sha256);assert(s.serialize(d).equals(raw));
 if(r.name.includes('CHRISTMAS')){
  const stage=Number(r.name.slice(-1)),key=s.value(d,'EVENT','спасение_рождества')[1];assert.equal(s.value(d,'ACTIVE',key)[0],String(stage));
  for(const k of ['XXXTalesforest_options','realtor_options'])assert(body('#options').includes('$'+k+'[1]'));
  assert(html.includes("copyarr '$display_options', '$XXXTalesforest_options'"));assert(html.includes('special_stock = 2613'));assert(html.includes('interaction_city = 10372'));assert(!html.includes('interaction_city = 10375'),'Must exercise actual delivery condition');
  assert.equal(s.value(d,'NPC_PROGRESS','shlyapkin')[0],'1');assert.equal(s.value(d,'NPC_PROGRESS','mrs_santa_claus')[0],'1');assert.equal(s.value(d,'NPC_PROGRESS','red_room')[0],'1');
 }else{
  assert.equal(s.value(d,'ESTATE')[1],'white_house');assert(Number(s.value(d,'ESTATE_COST_MAIN','white_house')[0])>0);assert.equal(s.value(d,'BRAND_REPUTATION')[0],'5');
  if(r.name.endsWith('BEFORE')){assert.equal(Number(s.value(d,'SPARKS')[0]),75*Number(s.value(d,'ESTATE_COST_MAIN','white_house')[0])+1);assert(html.includes('sparks = 75 * estate_cost_main[$estate] + 1'));assert(html.includes("gs '#estate_base'"));assert(html.includes('interaction_city = 1316'));assert(html.includes("copyarr '$display_options', '$realtor_options'"));}
  else{assert.equal(s.value(d,'SPARKS')[0],'1');assert(html.includes('owner = 1'));}
 }
 assert(html.includes("gs '#options'"));assert.equal(s.value(d,'ONGLOAD')[1],'');assert.equal(s.dec(d.lines[15]),'0');
}
console.log('PASS: four save roundtrips, original save hash, event stages, actual route/menu bindings, house cost/balances; gameplay pending.');
