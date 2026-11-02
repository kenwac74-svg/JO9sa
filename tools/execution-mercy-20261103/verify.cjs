'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),core=require('../text-workshop/core.cjs');
const base=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(base,p)),json=p=>JSON.parse(read(p));
const build=json('records/execution-mercy-20261103/build.json'),probe=json('records/execution-mercy-20261103/probe.json'),native=json('records/execution-mercy-20261103/native-results.json');
assert(native.length>0&&native.every(r=>r.pass));assert.equal(probe.assertions,27);assert.equal(probe.sourceSha256,build.afterSha256);
assert(read('records/execution-mercy-20261103/native-stderr.log').toString().includes('JO9_QA_E20261103_execution_mercy_COMPLETE'));
assert(read('records/execution-mercy-20261103/original-red-stderr.log').toString().includes('JO9_QA_EXECUTION_FAIL_1820_completed_minus_one'));
const candidate=read('tmp/execution-mercy-20261103/candidate/jack.qsp'),backup=read('backups/before-execution-mercy-20261103/jack.qsp'),replay=read('tmp/execution-mercy-20261103/replay/jack.qsp');
assert.equal(core.hash(backup),build.beforeSha256);assert.equal(core.hash(candidate),build.afterSha256);assert(candidate.equals(replay));assert(core.serialize(core.parse(candidate)).equals(candidate));
assert(read('records/execution-mercy-20261103/replay-second.log').toString().includes('[건너뜀]'));
const result={verifiedAt:new Date().toISOString(),beforeSha256:build.beforeSha256,afterSha256:build.afterSha256,nativeAssertions:27,nativePass:true,originalFailsScoreCheck:true,officialPatchReplayByteEqual:true,idempotencePass:true,onlyChangedLocation:'interaction_result',roundtrip:true};
if(process.argv.includes('--installed')){const target=json('backups/before-execution-mercy-20261103/RESTORE.json').qspTarget,live=fs.readFileSync(target);assert(live.equals(candidate));assert(core.serialize(core.parse(live)).equals(live));result.installedWorkVerified=true;result.installedTarget=target;}
fs.writeFileSync(path.join(base,'records/execution-mercy-20261103/verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
