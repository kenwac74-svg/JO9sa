'use strict';
// Collect completed native results only; no engine relaunch or production writes.
const fs=require('node:fs'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',task='G:/Codex/tmp/egeya-outfits-20261026',out=task+'/native/run',record=repo+'/records/egeya-outfits-profile-20261026/evidence';
const c=require(repo+'/tools/text-workshop/core.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const prepared=json(out+'/prepared.json'),results=json(out+'/client-results.json'),manifest=json(task+'/assets-manifest.json'),metrics=[];
for(const key of ['naked','maid','secr','dom']){
 const log=fs.readFileSync(out+'/outfit-'+key+'-stderr.log','utf8'),m=log.match(/\$qa_egeya_metrics='([^']+)' & savegame/);
 assert(m,'Missing '+key+' native metrics');const value=JSON.parse(decodeURIComponent(m[1]));assert.deepEqual(value.natural,[795,596]);assert.equal(value.bounds.width,795);assert.equal(value.bounds.height,596);assert(value.controls.every(Boolean));metrics.push({key,metrics:value});
}
const protectedInputs=[
 {path:prepared.candidate,expected:prepared.sha256},
 {path:prepared.save,expected:prepared.saveHash},
 {path:manifest.source_zip,expected:manifest.source_zip_sha256_before}
].map(x=>({...x,actual:c.hash(fs.readFileSync(x.path))}));
for(const x of protectedInputs)assert.equal(x.actual,x.expected,x.path);
const current=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),candidate=c.parse(fs.readFileSync(prepared.candidate));
const get=(d,n)=>{const l=d.locations.find(x=>x.name===n);return c.shift(d.lines[l.body],5)};
const unchangedFunctionalLocations=['interaction_city','city_menu_form','#npc_base','display_fullimage','assistant_stat'].map(name=>({name,unchanged:get(current,name)===get(candidate,name),sha256:c.hash(Buffer.from(get(candidate,name)))}));
assert(unchangedFunctionalLocations.every(x=>x.unchanged));
const report={status:results.length===9&&results.every(x=>x.pass)&&metrics.length===4?'PASS':'FAIL',...prepared,results,metrics,protectedInputs,unchangedFunctionalLocations,metricsDecoder:'Native Qt EXEC log payload decoded with decodeURIComponent then JSON.parse. Diagnostic saves are not evidence: repeated callback during message redraw can interrupt a second diagnostic save.',runnerExit:0,limits:[...prepared.limits,'The current QSP bodies for original acquisition/reward events, entrance, NPC database, resolver and profile renderer are byte-identical to candidate bodies; only designated new profile/name blocks are changed.']};
fs.writeFileSync(record+'/native-results.json',JSON.stringify(report,null,2)+'\n');
fs.copyFileSync(out+'/client-results.json',record+'/native-client-results.json');
for(const file of fs.readdirSync(out).filter(n=>/-(?:stderr|stdout)\.log$/.test(n)||n==='runner.log'))fs.copyFileSync(out+'/'+file,record+'/'+file);
fs.mkdirSync(repo+'/records/egeya-outfits-profile-20261026/tests',{recursive:true});
for(const file of ['native-tests.cjs','collect-native-results.cjs'])fs.copyFileSync(task+'/native/'+file,repo+'/records/egeya-outfits-profile-20261026/tests/'+file);
console.log(JSON.stringify({status:report.status,sourceHash:report.sha256,results:results.map(x=>({name:x.name,pass:x.pass,durationMs:x.durationMs})),coverage:report.coverage,metrics:report.metrics,protectedInputsUnchanged:protectedInputs.length,originalLocationsUnchanged:unchangedFunctionalLocations.length,report:record+'/native-results.json'}));
assert.equal(report.status,'PASS');
