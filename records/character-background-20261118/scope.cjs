'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const H=__dirname,T='G:/Codex/tmp/character-background-20261118';
const mod=JSON.parse(fs.readFileSync(H+'/patch.json','utf8'));
const before=zlib.gunzipSync(fs.readFileSync(H+'/before.qsp.gz')),after=fs.readFileSync(T+'/candidate.qsp');
assert.equal(c.hash(before),mod.before_sha256);assert.equal(c.hash(after),mod.after_sha256);
const bd=c.parse(before),ad=c.parse(after),get=(d,l,k)=>c.shift(d.lines[l[k]],5);
const changed=new Set(mod.edits.map(e=>e.location));
assert.equal(ad.locations.length,bd.locations.length+1);
for(const b of bd.locations){const a=ad.locations.find(l=>l.name===b.name);assert(a);assert.equal(get(bd,b,'desc'),get(ad,a,'desc'));const n=Number(c.shift(bd.lines[b.body+1],5));assert.deepEqual(bd.lines.slice(b.body+1,b.body+2+n*3),ad.lines.slice(a.body+1,a.body+2+n*3));if(!changed.has(b.name))assert.equal(get(bd,b,'body'),get(ad,a,'body'));}
const reverse=ad.lines.slice(),added=ad.locations.at(-1);assert.equal(added.name,mod.add_locations[0].name);reverse.splice(added.body-2,4);reverse[3]=c.shift(String(bd.locations.length),-5);
for(const edit of mod.edits.slice().reverse()){const l=ad.locations.find(l=>l.name===edit.location),text=c.shift(reverse[l.body],5);assert.equal(text.split(edit.new).length-1,1);reverse[l.body]=c.shift(text.replace(edit.new,edit.old),-5);}
assert(before.equals(Buffer.from(reverse.join('\r\n'),'utf16le')));
// Official patch replay uses only changed original locations, retaining their exact bytes.
// Unchanged user-authored locations contain existing line endings outside this patch.
const scoped=d=>{const fields=d.lines.slice(0,3);fields.push(c.shift(String(d.locations.filter(l=>changed.has(l.name)||l.name===added.name).length),-5));for(const l of d.locations.filter(l=>changed.has(l.name)||l.name===added.name)){assert.equal(Number(c.shift(d.lines[l.body+1],5)),0);fields.push(...d.lines.slice(l.body-2,l.body+2));}fields.push('');return Buffer.from(fields.join('\r\n'),'utf16le');};
fs.mkdirSync(T+'/mods',{recursive:true});fs.writeFileSync(T+'/mods/patch.json',JSON.stringify(mod,null,2));fs.writeFileSync(T+'/replay.qsp',scoped(bd));fs.writeFileSync(T+'/expected-replay.qsp',scoped(ad));
const report={before:mod.before_sha256,after:mod.after_sha256,originalLocations:bd.locations.length,unchangedBodies:bd.locations.length-changed.size,changedBodies:[...changed],newLocations:[added.name],allOriginalDescriptionsAndActionsUnchanged:true,exactInverse:true};
fs.writeFileSync(H+'/scope-proof.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
