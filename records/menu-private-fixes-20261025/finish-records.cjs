'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const record='G:/somi/JO9sa/records/menu-private-fixes-20261025';
assert.equal(path.resolve(fs.realpathSync(record)).toLowerCase(),path.resolve(record).toLowerCase());
assert.equal(JSON.parse(fs.readFileSync(record+'/FINAL_RESULT.json','utf8')).status,'APPLIED_AND_VERIFIED');
const copied=[];
for(const n of ['native-menu135.cjs','menu-start-parity.json','PRIVATE_NOTES_KO.md','REVIEW_KO.md']){const raw=fs.readFileSync(__dirname+'/'+n);fs.writeFileSync(record+'/'+n,raw);assert(fs.readFileSync(record+'/'+n).equals(raw));copied.push(n);}
const duplicate='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp.bak_20261025_235701',canonical='G:/somi/JO9_work_backups/menu-private-fixes-20261025/jack.qsp';
assert(!fs.lstatSync(duplicate).isSymbolicLink());assert.equal(c.hash(fs.readFileSync(canonical)),'38aaaaa5e7c424ec0f9b0b22f125bc2ca4966392ea42f982750375c4d982c0ed');assert(fs.readFileSync(duplicate).equals(fs.readFileSync(canonical)));fs.unlinkSync(duplicate);
fs.copyFileSync(__filename,record+'/finish-records.cjs');
console.log(JSON.stringify({copied,removedOwnRedundantBackup:duplicate,preservedCanonicalBackup:canonical}));
