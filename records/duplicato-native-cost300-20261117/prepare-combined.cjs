'use strict';
const fs=require('fs'),path=require('path'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const H=__dirname,fixRoot=path.join(H,'../duplicato-570-list-fix-20261117'),game='G:/somi/Jack O Nine Tails v2.4_work/game';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),fix=json(path.join(fixRoot,'2026-11-17_duplicato_qsp57_token_scan.json')),manual=json(path.join(H,'manual/manual-patch.json')),manifest=json(path.join(fixRoot,'manifest.json')),proof=json(path.join(fixRoot,'verification.json'));
a.equal(proof.native.status,'PASS');a.equal(proof.native.checks,21);a.equal(proof.native.failed,0);a.equal(proof.passed,proof.total);
const raw=fs.readFileSync(game+'/jack.qsp'),doc=c.parse(raw),before=c.hash(raw);a.equal(before,manifest.beforeSha256,'WORK changed; rebase from current saved content');a(c.serialize(doc).equals(raw));
const patch={id:'2026-11-17_duplicato_native_list_and_cost300',description:'Fix QSP5.7 numeric/string return initialization and cross-version talent token scanning; reduce sparks only to300 and update spell manual price. Friendship40 and AP/daily/recipient rules unchanged.',status:'APPROVED',before_sha256:before,edits:[...fix.edits,...manual.edits]};
for(const e of patch.edits){const l=doc.locations.find(l=>l.name===e.location);a(l&&e.field==='body');const body=c.shift(doc.lines[l.body],5);a.equal(body.split(e.old).length-1,e.count);doc.lines[l.body]=c.shift(body.replace(e.old,()=>e.new),-5);}
const output=c.serialize(doc);patch.after_sha256=c.hash(output);a(c.serialize(c.parse(output)).equals(output));
for(const row of manifest.fieldHashes){const loc=doc.locations.find(l=>l.name===row.location);a.equal(c.hash(Buffer.from(c.shift(doc.lines[loc.body],5))),row.after,'Helper differs from exact native-tested candidate');}
const prior=c.parse(raw),changed=[];for(const loc of doc.locations){const old=prior.locations.find(l=>l.name===loc.name);a.equal(doc.lines[loc.desc],prior.lines[old.desc]);if(doc.lines[loc.body]!==prior.lines[old.body])changed.push(loc.name);}
a.deepEqual(changed.sort(),['interaction','jo9_duplicato','jo9_duplicato_traits']);
const inverse=c.parse(output);for(const e of patch.edits.slice().reverse()){const l=inverse.locations.find(l=>l.name===e.location),body=c.shift(inverse.lines[l.body],5);a.equal(body.split(e.new).length-1,e.count);inverse.lines[l.body]=c.shift(body.replace(e.new,()=>e.old),-5);}a(c.serialize(inverse).equals(raw));
fs.writeFileSync(path.join(H,'candidate.qsp'),output);fs.writeFileSync(path.join(H,'combined-patch.json'),JSON.stringify(patch,null,2)+'\n');
const prepared={before,after:patch.after_sha256,bytes:output.length,changedLocations:changed,nativeChecks:proof.native.checks,wasmChecks:proof.passed,helperBodiesEqualTested:true,inverse:true,roundtrip:true,newPersistentFields:0};fs.writeFileSync(path.join(H,'prepared.json'),JSON.stringify(prepared,null,2));process.stdout.write(JSON.stringify(prepared)+'\n');
