const fs=require('fs'),assert=require('node:assert/strict'),path=require('path');
const c=require('../tools/text-workshop/core.cjs');
assert(process.argv[2]&&process.argv[3],'Pass patched QSP and original backup');
const mod=JSON.parse(fs.readFileSync(path.join(__dirname,'../mods/2026-10-15_trim_leading_body_blank_lines.json')));
const inline=JSON.parse(fs.readFileSync(path.join(__dirname,'../mods/2026-10-15_z_inline_text_prefix.json')));
const allEdits=[...mod.edits,...inline.edits];
assert(!mod.add_locations,'Do not introduce runtime helper');
for(const e of mod.edits){const a=c.literals(e.old).at(-1).text,b=c.literals(e.new).at(-1).text;assert.equal(a.replace(/^(?:[\s\u00a0]|<br\s*\/?>|&nbsp;)+/i,''),b,'Only prefix whitespace/BR may change')}
const raw=fs.readFileSync(process.argv[2]),original=fs.readFileSync(process.argv[3]);
const after=c.parse(raw),before=c.parse(original);assert(c.serialize(after).equals(raw));assert.equal(after.locations.length,before.locations.length);
const index=new Map(after.locations.map(l=>[l.name,l]));assert(!index.has('$jo9_trim_text_start'));let changed=0;
for(const l of before.locations){const n=index.get(l.name);assert(n);let expected=c.shift(before.lines[l.body],5);for(const e of allEdits.filter(e=>e.location===l.name)){assert.equal(expected.split(e.old).length-1,e.count);expected=expected.split(e.old).join(e.new)}assert.equal(c.shift(after.lines[n.body],5),expected);assert.equal(after.lines[n.desc],before.lines[l.desc]);const acts=Number(c.shift(before.lines[l.body+1],5));assert.deepEqual(after.lines.slice(n.body+1,n.body+2+acts*3),before.lines.slice(l.body+1,l.body+2+acts*3));if(after.lines[n.body]!==before.lines[l.body])changed++}
assert.equal(changed,new Set(allEdits.map(e=>e.location)).size);assert.equal(c.hash(raw),inline.after_sha256);console.log('PASS: Literal and cached prefixes normalized; all renderers, control flow, actions and prose retained; no helper or added locations; QSP roundtrip');
