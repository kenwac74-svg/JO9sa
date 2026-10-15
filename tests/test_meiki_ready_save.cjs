const fs=require('fs'),assert=require('assert'),s=require('../tools/qa/save-codec.cjs'),c=require('../tools/text-workshop/core.cjs');
const input=process.argv[2],manifest=JSON.parse(fs.readFileSync(process.argv[3]));assert(input,'Pass save and manifest paths');
const raw=fs.readFileSync(input),d=s.parse(raw),base=s.parse(fs.readFileSync(manifest.base));
assert.equal(s.value(d,'ONGLOAD')[1],'$ongload','Use native load flow, not a blank callback plus launcher');
assert.deepEqual(d.lines.slice(0,d.start),base.lines.slice(0,base.start),'No injected startup screen, actions or EXEC payload');
assert.equal(s.value(d,'SLAVE','age')[0],'2');assert.equal(s.value(d,'SLAVE_NAME')[1],'이사벨라');assert.equal(s.value(d,'SLAVE_STATE')[0],'1');
for(const k of ['virginity','jo9_meiki_known','jo9_meiki_checked','jo9_meiki_initialized','sub_vaginal','sub_threesome','sub_dp','sub_tp','sub_gangbang','sub_bukkake'])assert.equal(s.value(d,'SLAVE',k)[0],'0',k);
assert.deepEqual(s.value(d,'ONNEWLOC'),s.value(base,'ONNEWLOC'));assert.equal(s.value(d,'SNK_ROOM_TARGET')[0],'0');
for(const name of ['AUTOSAVE_DAY','AUTOSAVE_DECADE'])assert.equal(s.value(d,name)[0],'0');
assert.equal(d.vars.length,base.vars.length);const changed=new Set(manifest.changes.map(v=>v.name));for(let i=0;i<base.vars.length;i++){assert.equal(d.vars[i].slot,base.vars[i].slot);assert.equal(d.vars[i].name,base.vars[i].name);if(!changed.has(base.vars[i].name))assert.deepEqual(d.vars[i],base.vars[i]);}
assert(c.serialize(d).equals(raw));assert.equal(c.hash(raw),manifest.sha256);assert.equal(c.hash(fs.readFileSync(manifest.base)),manifest.baseHash);
console.log('PASS ready save: undiscovered adult, normal native header/callbacks, no injected launcher, slot order and unrelated data preserved. Native loading pending.');
