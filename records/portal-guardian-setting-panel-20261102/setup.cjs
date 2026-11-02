'use strict';
const fs=require('fs'),zlib=require('zlib'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const O=__dirname,W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/guardian-setting-panel-20261102-'+Date.now(),expected='377bdeb56f83b0d8487fed722d12b34beb768566bc7fe0696425316d7427fa4a';
const raw=fs.readFileSync(W+'/jack.qsp');a.equal(c.hash(raw),expected,'WORK changed; read and preserve manual edits');qa.inspectWorld(raw);a(c.serialize(c.parse(raw)).equals(raw));a(!fs.existsSync(T));fs.mkdirSync(T,{recursive:true});fs.writeFileSync(T+'/before.qsp',raw);const gz=zlib.gzipSync(raw);a(zlib.gunzipSync(gz).equals(raw));fs.writeFileSync(O+'/before.qsp.gz',gz);
const paths=[W+'/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/JO9O/game/jack.qsp',W+'/css/base.css',W+'/save/TC_09_PORTAL_GUARDIAN_EVENT.sav',W+'/save/TC_10_VATICAN_PALADIN_EVENT.sav'];
const protectedInputs=paths.map(file=>({file,sha256:c.hash(fs.readFileSync(file)),bytes:fs.statSync(file).size}));
const session={tempRoot:T,baseline:T+'/before.qsp',baselineSha256:expected,backup:O+'/before.qsp.gz',protectedInputs};fs.writeFileSync(O+'/session.json',JSON.stringify(session,null,2)+'\n');console.log(JSON.stringify(session));
