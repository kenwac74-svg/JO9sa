'use strict';
// A failing assertion against the observed original native renderer is the RED baseline.
const fs=require('fs'),a=require('assert/strict');
const r=JSON.parse(fs.readFileSync(__dirname+'/../wong-guild-event-audit-20261030/native/results.json'));
const current=require('G:/somi/JO9sa/tools/text-workshop/core.cjs').hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
a.equal(current,r.before.qsp,'Baseline changed; rerun native reproduction first');
const baseline=r.results.find(x=>x.name==='baseline').observed;
a.equal(baseline.LINE1,'1','Original native screen must show the visit introduction');
a.equal(baseline.LINE2,'1','Original native screen must show the illness complaint');
