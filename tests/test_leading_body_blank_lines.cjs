// 본문 출력 경계 정리 외에는 QSP 대사·상태·액션을 바꾸지 않았는지 검증한다.
const fs=require('fs'),assert=require('node:assert/strict'),path=require('path');
const c=require('../tools/text-workshop/core.cjs');
assert(process.argv[2]&&process.argv[3],'Pass patched QSP and its pre-patch backup.');
const mod=JSON.parse(fs.readFileSync(path.join(__dirname,'../mods/2026-10-15_trim_leading_body_blank_lines.json')));
const afterRaw=fs.readFileSync(process.argv[2]),beforeRaw=fs.readFileSync(process.argv[3]);
const after=c.parse(afterRaw),before=c.parse(beforeRaw);assert(c.serialize(after).equals(afterRaw));assert(c.serialize(before).equals(beforeRaw));
const index=new Map(after.locations.map(l=>[l.name,l]));assert.equal(index.size,after.locations.length);let changed=0;
for(const old of before.locations){
 const now=index.get(old.name);assert(now);assert.equal(after.lines[now.desc],before.lines[old.desc]);
 let expected=c.shift(before.lines[old.body],5);
 for(const edit of mod.edits.filter(e=>e.location===old.name)){
  assert.equal(expected.split(edit.old).length-1,edit.count);expected=expected.split(edit.old).join(edit.new);
 }
 assert.equal(c.shift(after.lines[now.body],5),expected,`Unexpected change: ${old.name}`);
 if(after.lines[now.body]!==before.lines[old.body])changed++;
 const acts=Number(c.shift(before.lines[old.body+1],5));
 assert.deepEqual(after.lines.slice(now.body+1,now.body+2+acts*3),before.lines.slice(old.body+1,old.body+2+acts*3));
}
assert.equal(changed,31);assert.equal(after.locations.length,before.locations.length+1);
const helper=index.get('$jo9_trim_text_start');assert(helper);assert.equal(c.shift(after.lines[helper.body],5),mod.add_locations[0].body);
let sites=0;for(const loc of after.locations){for(const entry of c.literals(c.shift(after.lines[loc.body],5))){if(/^<div\s+id\s*=\s*"(?:text|side_panel_text)"/.test(entry.text)&&entry.text!=='<div id = "text"></div>')assert(!entry.text.includes('<<'),'Narrative variable bypasses normalization: '+loc.name)}sites+=c.shift(after.lines[loc.body],5).split("func('$jo9_trim_text_start'").length-1}
assert.equal(sites,64);assert.equal(c.hash(afterRaw),mod.after_sha256);
console.log('PASS: 64 normalized render sites; full prose/state/actions preservation; 31 changed locations plus one helper; QSP roundtrip and declared hash');
