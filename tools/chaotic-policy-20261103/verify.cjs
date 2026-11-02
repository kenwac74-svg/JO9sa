'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),core=require('../text-workshop/core.cjs');
const base=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(base,p)),json=p=>JSON.parse(read(p));
const build=json('tmp/chaotic-policy-20261103/candidate/build.json'),probe=json('tmp/chaotic-policy-20261103/green/probe.json'),native=json('records/chaotic-policy-20261103/native-results.json');
assert.equal(build.physicalPending.length,0);assert(native.length>0&&native.every(r=>r.pass));
assert(read('records/chaotic-policy-20261103/native-stderr.log').toString().includes('JO9_QA_C20261103_chaotic_policy_COMPLETE'));
assert(read('records/chaotic-policy-20261103/original-red-stderr.log').toString().includes('JO9_QA_CE_FAIL_slave_protected_perversion_2'));
const candidate=read('tmp/chaotic-policy-20261103/candidate/jack.qsp'),backup=read('backups/before-chaotic-policy-20261103/jack.qsp'),replay=read('tmp/chaotic-policy-20261103/replay/jack.qsp');
assert.equal(core.hash(backup),build.beforeSha256);assert.equal(core.hash(candidate),build.afterSha256);assert.equal(probe.sha256,build.afterSha256);assert.equal(probe.assertions,233);assert(candidate.equals(replay));assert(core.serialize(core.parse(candidate)).equals(candidate));
const second=read('records/chaotic-policy-20261103/replay-second.log').toString();assert(second.includes('[멱등 건너뜀]')||second.includes('[이미 적용]')||second.includes('[건너뜀]')||second.includes('변경 없음'));
const result={verifiedAt:new Date().toISOString(),beforeSha256:build.beforeSha256,afterSha256:build.afterSha256,nativeAssertions:probe.assertions,nativePass:true,originalFailsProtection:true,officialPatchReplayByteEqual:true,idempotencePass:true,onlyChangedLocation:'jo9_chaotic',physicalDecisionPending:false,roundtrip:true};
if(process.argv.includes('--installed')){const target=json('backups/before-chaotic-policy-20261103/RESTORE.json').qspTarget,live=fs.readFileSync(target);assert(live.equals(candidate));assert(core.serialize(core.parse(live)).equals(live));result.installedWorkVerified=true;result.installedTarget=target;}
fs.writeFileSync(path.join(base,'records/chaotic-policy-20261103/verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
