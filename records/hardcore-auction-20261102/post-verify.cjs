'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const out=__dirname,impl=out+'/implementation',result=JSON.parse(fs.readFileSync(out+'/FINAL_RESULT.json','utf8'));
const baseline=z.gunzipSync(fs.readFileSync(impl+'/baseline.qsp.gz')),installed=fs.readFileSync(W+'/jack.qsp');
assert.equal(c.hash(baseline),result.before);assert.equal(c.hash(installed),result.after);assert(z.gunzipSync(fs.readFileSync(impl+'/candidate.qsp.gz')).equals(installed));
assert.equal(c.hash(fs.readFileSync(F+'/jack.qsp')),result.fullSha256);assert.equal(c.hash(fs.readFileSync('G:/somi/JO9O/game/jack.qsp')),result.originalSha256);
let replay=c.parse(baseline);for(const name of ['00_credits_crlf.json','01_hardcore_auction.json']){const patch=JSON.parse(fs.readFileSync(impl+'/'+name,'utf8'));assert.equal(c.hash(c.serialize(replay)),patch.before_sha256);for(const e of patch.edits){const l=replay.locations.find(x=>x.name===e.location),body=c.shift(replay.lines[l[e.field]],5);assert.equal(body.split(e.old).length,2);replay.lines[l[e.field]]=c.shift(body.replace(e.old,e.new),-5);}assert.equal(c.hash(c.serialize(replay)),patch.after_sha256);}
assert(c.serialize(replay).equals(installed));const a=c.parse(baseline),b=c.parse(installed);const body=(w,n)=>c.shift(w.lines[w.locations.find(x=>x.name===n).body],5);
assert.equal(body(a,'credits').replace(/(?<!\r)\n/g,'\r\n'),body(b,'credits'));
assert(!body(b,'$guild_auction').includes('bank_size = min(6000, bank_size)'));
assert.equal((body(b,'interaction_city').match(/if difficulty_setting = 2 and sparks_get > 6000:/g)||[]).length,2);
assert(!body(b,'interaction_screen_city').includes('공개경매의 최종 지급액은 최대 $6,000이다.'));
assert(body(b,'interaction_screen_city').includes('개인 거래의 최종 지급액은 최대 $8,000이다.'));
assert.equal(body(a,'jo9_traits_value'),body(b,'jo9_traits_value'));assert.equal(body(a,'jo9_liquidation'),body(b,'jo9_liquidation'));
const removedBackups=[];for(const name of result.createdBackupFiles){assert(/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(name));const p=path.resolve(W,name),root=path.resolve(W);assert.equal(path.dirname(p).toLowerCase(),root.toLowerCase());assert(!fs.lstatSync(p).isSymbolicLink());assert.equal(c.hash(fs.readFileSync(p)),result.before);const bytes=fs.statSync(p).size;fs.unlinkSync(p);removedBackups.push({path:p,bytes,sha256:result.before,recovery:impl+'/baseline.qsp.gz'});}
const report={status:'PASS',verifiedAt:new Date().toISOString(),installedSha256:c.hash(installed),structure:qa.inspectWorld(installed),exactReplay:true,creditsCharactersPreserved:true,nonAuctionLimitsPreserved:true,manualBodiesPreserved:true,fullUnchanged:true,originalUnchanged:true,removedBackups};
fs.writeFileSync(out+'/post-install-verification.json',JSON.stringify(report,null,2)+'\n');fs.copyFileSync(out+'/post-install-verification.json',R+'/records/hardcore-auction-20261102/post-install-verification.json');
for(const name of ['REPORT_KO.md','final-verification.json','cleanup.cjs','summarize.cjs'])if(fs.existsSync(impl+'/'+name))fs.copyFileSync(impl+'/'+name,R+'/records/hardcore-auction-20261102/'+name);
fs.copyFileSync(__filename,R+'/records/hardcore-auction-20261102/post-verify.cjs');
console.log(JSON.stringify({status:report.status,sha256:report.installedSha256,locations:report.structure.locations,removedBackupBytes:removedBackups.reduce((n,x)=>n+x.bytes,0)}));
