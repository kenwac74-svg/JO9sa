'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const rec='G:/somi/JO9sa/records/canvas-layer-alignment-20261027',tmp='G:/Codex/tmp/canvas-layer-alignment-20261027',j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const before=j(rec+'/before.json'),native=j(tmp+'/candidate-menu-hit/native-alignment-results.json');
function href(file){const d=c.parse(fs.readFileSync(file)),loc=d.locations.find(x=>x.name==='exit'),b=c.shift(d.lines[loc.body],5),links=[...b.matchAll(/href="([^"]*main_menu[^"]*)"/g)].map(m=>m[1]);a.equal(links.length,1);return links[0];}
const original=href(before.backup+'/jack.qsp'),candidate=href(tmp+'/candidate/jack.qsp');a.equal(candidate,original);
a.equal(native.diagnosticOnlyIntegratedOverride,false);a(native.client.every(x=>x.pass));
const cases=[];for(const m of native.measurements){const s=m.metrics.snapshots.at(-1),link=m.metrics.menuLink;a.equal(s.viewport.w,1280);a.equal(s.viewport.h,800);a.equal(link.hit,true);a.equal(link.hrefValid,true);a.equal(link.href,candidate.replace(/''/g,"'"));const cfg=fs.readFileSync(tmp+'/candidate-menu-hit/'+m.name+'/config.xml');a.equal(cfg[0],255);a.equal(cfg[1],254);cases.push({name:m.name,viewport:s.viewport,link,configEncoding:'UTF-16LE with FF FE BOM'});}
const report={verdict:'PASS',cases,inputHashes:native.inputHashes,sourceCallbackUnchanged:true,sourceCallback:original,productExitModeUnchanged:true,physicalHitTest:true,mainMenuTargetExecuted:false,limits:['The test verifies the original EXEC href and the native clickable link center; it does not enter main_menu or verify that destination gameplay.'],inputsUnchanged:native.inputsUnchanged};
fs.writeFileSync(rec+'/native-menu-hit-results.json',JSON.stringify(report,null,2)+'\n');fs.copyFileSync(__filename,rec+'/scripts/summarize-menu-hit.cjs');console.log(JSON.stringify(report));
