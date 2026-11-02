'use strict';
const fs=require('fs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const m=JSON.parse(fs.readFileSync(__dirname+'/snapshot.json','utf8'));
const options={profile:'release',candidate:m.candidate,baseline:m.baseline,'mods-dir':m.modsDir,engine:'G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe','game-dir':'G:/somi/Jack O Nine Tails v2.4_work/game','state-save':m.publicFixture.diagnostic,'cache-revision':String(m.cacheRevision),'client-timeout-seconds':'30',out:m.tempRoot+'-official'};
fs.writeFileSync(__dirname+'/official-arguments.json',JSON.stringify(options,null,2)+'\n');const r=qa.run(options);for(const ext of ['json','md'])fs.copyFileSync(r.report.output+'/report.'+ext,__dirname+'/official-report.'+ext);process.exitCode=r.exitCode;
