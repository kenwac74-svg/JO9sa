'use strict';
const fs=require('fs'),path=require('path'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const H=__dirname,R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',B='G:/Codex/tmp/duplicato-native-cost300-20261117',record=R+'/records/duplicato-native-cost300-20261117';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),enc=d=>Buffer.from(JSON.stringify(d,null,2)+'\n'),p=json(H+'/prepared.json'),patch=json(H+'/combined-patch.json'),output=fs.readFileSync(H+'/candidate.qsp'),before=fs.readFileSync(G+'/jack.qsp');
a.equal(c.hash(before),p.before,'Current WORK changed');a.equal(c.hash(output),p.after);a(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp').equals(before),'Source differs; preserve and review before sync');
const writes=[];function add(file,next){writes.push({file,before:fs.existsSync(file)?fs.readFileSync(file):null,next});}
add(G+'/jack.qsp',output);add(R+'/assets/runtime/2.4.1/jack.qsp',output);
for(const file of [R+'/assets/runtime-source-2.4.1.json',R+'/assets/runtime-manifests/2.4.2-work.json']){const meta=json(file);meta.sourceQspSha256=p.after;meta.latestDuplicatoNativeFix={date:'2026-11-17',record:'records/duplicato-native-cost300-20261117/REPORT_KO.md',sparks:300,native:'5.7.0',newSavedFields:0};for(const row of meta.files||[])if(row.runtimePath==='jack.qsp'||row.path==='game/jack.qsp'){row.sha256=p.after;row.bytes=output.length;}add(file,enc(meta));}
add(R+'/mods/'+patch.id+'.json',enc(patch));
const fixRoot=path.join(H,'../duplicato-570-list-fix-20261117');for(const name of ['manifest.json','verification.json','native-proof.cjs','test-candidate.cjs'])add(record+'/'+name,fs.readFileSync(path.join(fixRoot,name)));
for(const name of ['prepare-combined.cjs','install-combined.cjs','prepared.json'])add(record+'/'+name,fs.readFileSync(H+'/'+name));
add(record+'/native-stderr.log',fs.readFileSync(path.join(fixRoot,'native-proof/final-stderr.log')));
fs.mkdirSync(B,{recursive:true});const backup=B+'/before.qsp';if(fs.existsSync(backup))a.equal(c.hash(fs.readFileSync(backup)),p.before);else fs.writeFileSync(backup,before,{flag:'wx'});
const hash=file=>fs.existsSync(file)?c.hash(fs.readFileSync(file)):null,done=[],temps=[];
try{
 for(const w of writes)a.equal(hash(w.file),w.before?c.hash(w.before):null,'Destination changed: '+w.file);
 for(const w of writes){fs.mkdirSync(path.dirname(w.file),{recursive:true});const tmp=w.file+'.duplicato-final-'+process.pid+'.tmp';temps.push(tmp);fs.writeFileSync(tmp,w.next,{flag:'wx'});a.equal(hash(w.file),w.before?c.hash(w.before):null);fs.renameSync(tmp,w.file);done.push(w);}
 a.equal(hash(G+'/jack.qsp'),p.after);a(fs.readFileSync(G+'/jack.qsp').equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));
 const result={...p,installed:true,backup,sourceSynced:true,fullAndSavesUntouched:true,files:writes.map(w=>w.file)};fs.writeFileSync(record+'/applied.json',enc(result));fs.writeFileSync(H+'/applied.json',enc(result));process.stdout.write(JSON.stringify({installed:true,hash:p.after,nativeChecks:p.nativeChecks,sparks:300})+'\n');
}catch(e){for(const w of done.reverse())if(hash(w.file)===c.hash(w.next)){if(w.before===null)fs.unlinkSync(w.file);else fs.writeFileSync(w.file,w.before);}throw e;}
finally{for(const tmp of temps)if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
