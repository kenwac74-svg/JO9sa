'use strict';
const k=require('./root-kit.cjs'),z=require('zlib'),{fs,root,repo,game,qa}=k;
const r=repo+'/records/golden-collar-fix-20261025',dir=root+'/official-input';
fs.mkdirSync(dir+'/mods',{recursive:true});fs.writeFileSync(dir+'/before.qsp',z.gunzipSync(fs.readFileSync(r+'/before.qsp.gz')));
for(const n of ['2026-10-25_golden_collar_refusal_return.json','2026-10-25_golden_collar_scope_preserve.json'])fs.copyFileSync(r+'/'+n,dir+'/mods/'+n);
const result=qa.run({candidate:game+'/jack.qsp',baseline:dir+'/before.qsp','mods-dir':dir+'/mods',engine:game+'/engine/jack.exe','game-dir':game,'state-save':game+'/save/JO9_TEST_20261023_01_HOME.sav',out:root+'/official',profile:'release','cache-revision':'3','client-timeout-seconds':'25'});
console.log(JSON.stringify({verdict:result.report.verdict,output:result.report.output}));process.exitCode=result.exitCode;
