'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const R='G:/somi/JO9sa',REC=R+'/records/arena-mercy-loss-rule-20261031',c=require(R+'/tools/text-workshop/core.cjs');
const hash=f=>c.hash(fs.readFileSync(f));
const artifacts=['probe.cjs','red-report.json','green-probe.cjs','green-report.json','green-single-report.json','green-initial-harness-error.json','independent-native-summary.json'];
for(const n of artifacts)a.equal(hash(path.join(__dirname,n)),hash(path.join(REC,n)),'Canonical record differs: '+n);
const green=JSON.parse(fs.readFileSync(REC+'/green-report.json','utf8'));
a.equal(green.pass,true);a.equal(green.results.length,32);a.equal(green.nativeProcesses,3);
const protectedFiles=['G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/JO9_work_backups/arena-mercy-loss-rule-20261031/before.qsp'].map(p=>({path:p,sha256:hash(p)}));
const roots=['G:/Codex/tmp/arena-mercy-loss-rule-20261031-native','G:/Codex/tmp/arena-mercy-loss-rule-20261031-green-native'].map(p=>path.resolve(p));
const allowedLinks=['content','css','fonts','json'].map(n=>fs.realpathSync('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/'+n));
const stats={created:new Date().toISOString(),nativeValidation:{greenCases:32,greenEngineBatches:3,batches:[{name:'arena-matrix',cases:11},{name:'catfight-matrix',cases:11},{name:'exception-regressions',cases:10}],redCases:3,greenSingleCases:3},roots:[],files:0,bytes:0,links:0,directories:0,canonicalRecordArtifactsVerified:artifacts.length,productionOriginalsAndSavesTouched:false,externalJunctionTargetsTraversed:false};
for(const root of roots){
 a.equal(path.dirname(root),path.resolve('G:/Codex/tmp'));a.equal(fs.realpathSync(root),root);a(!fs.lstatSync(root).isSymbolicLink());
 const row={resolvedRoot:root,files:0,bytes:0,links:0,directories:0};
 function remove(p){p=path.resolve(p);a(p===root||p.startsWith(root+path.sep));const st=fs.lstatSync(p);
  if(st.isSymbolicLink()){a(allowedLinks.includes(fs.realpathSync(p)));try{fs.unlinkSync(p);}catch(e){if(!['EPERM','EISDIR'].includes(e.code))throw e;fs.rmdirSync(p);}row.links++;return;}
  if(st.isDirectory()){for(const n of fs.readdirSync(p))remove(path.join(p,n));fs.rmdirSync(p);row.directories++;return;}
  a(!/\.(?:sav|qspgame)$/i.test(p),'Save file must be preserved: '+p);row.files++;row.bytes+=st.size;fs.unlinkSync(p);
 }
 remove(root);a(!fs.existsSync(root));row.rootRemoved=true;stats.roots.push(row);for(const n of ['files','bytes','links','directories'])stats[n]+=row[n];
}
for(const p of protectedFiles)a.equal(hash(p.path),p.sha256,p.path);
stats.productionQspAndBackupHashesPreserved=protectedFiles;
for(const n of allowedLinks)a(fs.existsSync(n));
fs.copyFileSync(__filename,REC+'/child-native-cleanup.cjs');
fs.writeFileSync(REC+'/native-cleanup.json',JSON.stringify(stats,null,2)+'\n');console.log(JSON.stringify(stats));
