'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const core = require('../tools/text-workshop/core.cjs');
const [qsp, baseline, modFile] = process.argv.slice(2);
if (!qsp) throw Error('Usage: node tests/test_salon_menu.cjs QSP [BASELINE MOD]');
const raw = fs.readFileSync(qsp), doc = core.parse(raw);
assert(core.serialize(doc).equals(raw), 'QSP roundtrip must be byte exact');
const body = name => core.shift(doc.lines[doc.locations.find(x => x.name === name).body], 5);
const city = body('interaction_city');
const checks = [];
function check(name, fn) { try { fn(); checks.push({name, ok:true}); } catch(e) { checks.push({name, ok:false, error:e.message}); } }
for (const [id, price] of [[102024,20], [102025,50]]) {
  const starts = [...city.matchAll(new RegExp('IF interaction_city = '+id+':', 'g'))];
  assert.equal(starts.length, 2, 'Both protagonist branches must exist');
  for (const [i, start] of starts.entries()) check('Salon '+price+' branch '+(i+1), () => {
    const block = city.slice(start.index, city.indexOf('\r\n\tEND', start.index));
    assert(block.includes("$interaction_type = 'service'"));
    // Start with a previous tattoo service, then evaluate the literal reset.
    let servicePicture = 'scene\\service\\service_tattoo_fiend';
    const assignments = [...block.matchAll(/\$service_picture\s*=\s*'([^']*)'/g)];
    for (const m of assignments) servicePicture = m[1];
    assert.equal(servicePicture, '', 'Previous service picture must not reach the shared background renderer');
    assert(block.includes('service_price = '+price));
    const splitSolo = price===20 && block.includes('salononeg01.png');
    const splitGroup = price===50 && block.includes('salongroup01.png');
    for (const n of [1,2]) {
      const file = splitSolo ? 'salononeg0'+n : splitGroup ? 'salongroup0'+n : 'VIP3';
      assert(block.includes("$special_image["+n+"] = 'scene\\VIP\\"+file+".png'"), 'Preserve the configured salon page layer');
    }
  });
}
check('Transparent menu container', () => {
  const style = /<style id="jo9_menu_layout_style">([^<]*)<\/style>/.exec(body('$menu'))?.[1];
  assert(style, 'Shared menu stylesheet must exist');
  assert(style.includes('#jo9_scene_menu>.menu,#main_screen.jo9_menu_city>.menu{background:transparent!important;}'), 'Only cutscene menu containers should lose their background');
  assert(!/(?:^|[;{])opacity\s*:/.test(style), 'Never fade child buttons');
  assert(body('shop_general').includes("func('$menu', 'layout_style')"));
});
if (baseline && modFile) check('Exact change scope', () => {
  const prevRaw = fs.readFileSync(baseline), prev = core.parse(prevRaw);
  assert(core.serialize(prev).equals(prevRaw));
  const expected = core.parse(prevRaw), mod = JSON.parse(fs.readFileSync(modFile,'utf8'));
  assert.equal(core.hash(prevRaw), mod.before_sha256);
  for (const e of mod.edits) {
    const l = expected.locations.find(x => x.name === e.location);
    assert.equal(e.field, 'body');
    const old = core.shift(expected.lines[l.body],5);
    assert.equal(old.split(e.old).length-1,e.count,'Exact edit occurrence count');
    expected.lines[l.body] = core.shift(old.split(e.old).join(e.new),-5);
  }
  assert(core.serialize(expected).equals(raw), 'No other location, action, dialogue, CSS geometry or game field may change');
  assert.equal(core.hash(raw),mod.after_sha256);
});
console.log(JSON.stringify({checks, sourceOnly:true},null,2));
if(checks.some(x=>!x.ok)) process.exitCode=1;
