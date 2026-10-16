'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const core=require('../text-workshop/core.cjs');
const registry=require(process.env.REGISTRY_TEST_MODULE||'./registry.cjs');
const {makeFixture}=require('./test-fixture.cjs');
function body(bytes,name){let d=core.parse(bytes),l=d.locations.find(l=>l.name===name);return core.shift(d.lines[l.body],5);}
function fixture(){
 const d=core.parse(makeFixture());
 for(const[name,s]of [['slave_auction_sell',"sell_price = func('jo9_traits_value', 'market', 'slave', sell_price)"],['$guild_auction',"bank_size = func('jo9_traits_value', 'auction', 'slave', bank_size)"]]){const l=d.locations.find(l=>l.name===name);d.lines[l.body]=core.shift(s,-5);}
 const helper="if $jo9_trait_value_mode = 'market': result *= 10\nif $jo9_trait_value_mode = 'auction': result *= 2\nif slave['jo9_peerless'] = 1: result += result / 2";
 d.lines.splice(d.lines.length-1,0,core.shift('jo9_traits_value',-5),'',core.shift(helper,-5),core.shift('0',-5));d.lines[3]=core.shift(String(d.locations.length+1),-5);return core.serialize(d);
}
test('both sale bindings follow the shared helper and edit only its registered literals',()=>{
 const raw=fixture(),v=registry.inspect(raw);assert.equal(v.fields.find(f=>f.id==='sale.market.multiplier').value,10);assert.equal(v.fields.find(f=>f.id==='sale.auction.multiplier').value,2);
 assert.deepEqual(registry.prepare(raw,[],v.hash).raw,raw);
 const prepared=registry.prepare(raw,[{id:'sale.market.multiplier',value:12},{id:'sale.auction.multiplier',value:3}],v.hash);
 assert.equal(body(prepared.raw,'jo9_traits_value'),body(raw,'jo9_traits_value').replace('result *= 10','result *= 12').replace('result *= 2','result *= 3'));
 assert.equal(prepared.patch.edits.length,1);assert.equal(prepared.patch.edits[0].location,'jo9_traits_value');
 const d=core.parse(prepared.raw),e=prepared.patch.edits[0],l=d.locations.find(l=>l.name===e.location);d.lines[l.body]=core.shift(body(prepared.raw,l.name).replace(e.new,e.old),-5);assert.deepEqual(core.serialize(d),raw);
});
test('shared helper with missing or duplicate actual caller cannot appear editable',()=>{
 for(const replacement of ['',"sell_price = func('jo9_traits_value', 'market', 'slave', sell_price)\nsell_price = func('jo9_traits_value', 'market', 'slave', sell_price)"]){let d=core.parse(fixture()),l=d.locations.find(l=>l.name==='slave_auction_sell');d.lines[l.body]=core.shift(replacement,-5);assert.throws(()=>registry.inspect(core.serialize(d)),/공유 호출/);}
});
test('old source format remains editable with its original values',()=>{let v=registry.inspect(makeFixture());assert.equal(v.fields.find(f=>f.id==='sale.market.multiplier').value,10);assert.equal(v.fields.find(f=>f.id==='sale.auction.multiplier').value,2);});
test('full integrated candidate still supports no-op and reversible registered edits',()=>{
 if(!process.env.TRAITS_QSP)return;
 const raw=fs.readFileSync(process.env.TRAITS_QSP),v=registry.inspect(raw);assert.deepEqual(registry.prepare(raw,[],v.hash).raw,raw);
 const p=registry.prepare(raw,[{id:'sale.market.multiplier',value:11},{id:'training.xp',value:7}],v.hash);
 assert.equal(registry.inspect(p.raw).fields.find(f=>f.id==='training.xp').value,7);
 let d=core.parse(p.raw);for(const e of p.patch.edits.slice().reverse()){const l=d.locations.find(l=>l.name===e.location);d.lines[l.body]=core.shift(core.shift(d.lines[l.body],5).replace(e.new,e.old),-5);}assert.deepEqual(core.serialize(d),raw);
});
