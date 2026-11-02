'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),assert=require('assert/strict');
const R='G:/somi/JO9sa',F='G:/somi/Jack O Nine Tails v2.4_work/game',c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sc=require(R+'/tools/qa/save-codec.cjs');
const record=__dirname,T='G:/Codex/tmp/hardcore-auction-20261102-'+Date.now();
assert(!fs.existsSync(T));qa.assertOutside(T,[R,F]);fs.mkdirSync(T,{recursive:true});fs.mkdirSync(T+'/inputs');fs.mkdirSync(T+'/mods');
const raw=fs.readFileSync(F+'/jack.qsp'),d=c.parse(raw);assert(c.serialize(d).equals(raw));assert.equal(d.locations.length,277);
fs.writeFileSync(T+'/inputs/baseline.qsp',raw);fs.writeFileSync(record+'/baseline.qsp.gz',zlib.gzipSync(raw,{level:9}));
const prior=zlib.gunzipSync(fs.readFileSync(path.resolve(record,'../../final-prezip-241-20261102/qsp/work-before-credits-crlf.qsp.gz'))),pd=c.parse(prior);
const fieldDiff=[];for(let i=0;i<d.locations.length;i++){const a=pd.locations[i],b=d.locations[i];assert.equal(a.name,b.name);for(let j=a.body-2;j<(i+1<d.locations.length?d.locations[i+1].body-2:d.lines.length-1);j++)if(pd.lines[j]!==d.lines[j])fieldDiff.push({location:b.name,field:j===b.body?'body':j===b.body-1?'desc':'other',lineIndex:j});}
const credits=JSON.parse(fs.readFileSync(path.resolve(record,'../../final-prezip-241-20261102/qsp/credits-crlf-mod.json'),'utf8'));
const creditBody=c.shift(d.lines[d.locations.find(l=>l.name==='credits').body],5);assert.equal(creditBody.split(credits.edits[0].old).length-1,1);assert.equal((creditBody.match(/(?<!\r)\n/g)||[]).length,1);
const fixturePath='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_01_HOME_TRAITS.sav',publicBytes=fs.readFileSync(fixturePath),saved=sc.parse(publicBytes),gameVer=saved.vars.find(v=>v.name==='GAME_VER');assert(gameVer);
const version=c.shift(d.lines[d.locations.find(l=>l.name==='main_menu').body],5).match(/\$code_rev\s*=\s*'([^']+)'/)[1],previousTitle=gameVer.values[0][1];gameVer.values[0][1]='잭 오 나인 테일 v'+version+' Kor Ver';fs.writeFileSync(T+'/inputs/public-current.sav',sc.serialize(saved));
const snapshot={createdAt:new Date().toISOString(),tempRoot:T,record,workPath:F+'/jack.qsp',baseline:T+'/inputs/baseline.qsp',candidate:T+'/candidate.qsp',modsDir:T+'/mods',sourceSha256:c.hash(raw),sourceBytes:raw.length,locations:d.locations.length,roundtrip:true,priorSourceSha256:c.hash(prior),manualChangesSincePrior:fieldDiff,creditsLoneLf:1,creditEdit:credits.edits[0],publicFixture:{source:fixturePath,sourceSha256:c.hash(publicBytes),diagnostic:T+'/inputs/public-current.sav',diagnosticSha256:c.hash(fs.readFileSync(T+'/inputs/public-current.sav')),onlyChangedVariable:'GAME_VER',previousTitle,currentTitle:gameVer.values[0][1]},version,cacheRevision:3,productionWritten:false};
fs.writeFileSync(record+'/snapshot.json',JSON.stringify(snapshot,null,2)+'\n');console.log(JSON.stringify(snapshot,null,2));
