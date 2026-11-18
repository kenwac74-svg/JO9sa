'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const H=__dirname,R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',record=R+'/records/assistant-rest-fix-20261117';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p).toString('utf8').replace(/^\uFEFF/,'')),encode=x=>Buffer.from(JSON.stringify(x,null,2)+'\n');
const patch=json(H+'/patch.json'),prep=json(H+'/prepared.json'),wasm=json(H+'/candidate-verification.json'),native=json(H+'/native-verification.json'),recovery=json(H+'/recovery.json');
a.equal(wasm.status,'PASS');a.equal(wasm.passed,15);a.equal(native.status,'PASS');a.equal(native.passed,105);a.equal(native.candidateSha256,patch.after_sha256);a.equal(native.engine,'5.7.0');
a.equal(c.hash(read(recovery.archive)),recovery.archiveSha256);a.equal(recovery.qspSha256,patch.before_sha256);
const raw=read(G+'/jack.qsp');a.equal(c.hash(raw),patch.before_sha256,'WORK changed; preserve manual edits');a(read(R+'/assets/runtime/2.4.1/jack.qsp').equals(raw),'Tracked snapshot differs');
const d=c.parse(raw),lines=d.lines.slice();a(raw.equals(Buffer.from(lines.join('\r\n'),'utf16le')));
for(const e of patch.edits){a.equal(e.field,'body');const l=d.locations.find(l=>l.name===e.location),b=c.shift(lines[l.body],5);a.equal(b.split(e.old).length-1,e.count);lines[l.body]=c.shift(b.replace(e.old,e.new),-5);}
const output=Buffer.from(lines.join('\r\n'),'utf16le'),after=c.parse(output);a.equal(c.hash(output),patch.after_sha256);a(output.equals(Buffer.from(after.lines.join('\r\n'),'utf16le')));
const changed=[];for(let i=0;i<lines.length;i++)if(lines[i]!==d.lines[i])changed.push(i);a.deepEqual(changed,[d.locations.find(l=>l.name==='interaction_result').body]);
const inverse=after.lines.slice();for(const e of patch.edits.slice().reverse()){const l=after.locations.find(l=>l.name===e.location);inverse[l.body]=c.shift(c.shift(inverse[l.body],5).replace(e.new,e.old),-5);}a(raw.equals(Buffer.from(inverse.join('\r\n'),'utf16le')));
a(!fs.existsSync(record),'Preserve existing record');a(!fs.existsSync(R+'/mods/'+patch.id+'.json'),'Preserve existing mod');
const writes=[],add=(file,next)=>writes.push({file,before:fs.existsSync(file)?read(file):null,next});
add(G+'/jack.qsp',output);add(R+'/assets/runtime/2.4.1/jack.qsp',output);
for(const file of [R+'/assets/runtime-source-2.4.1.json',R+'/assets/runtime-manifests/2.4.2-work.json']){const meta=json(file);a.equal(meta.sourceQspSha256,patch.before_sha256);meta.sourceQspSha256=patch.after_sha256;if(meta.asOf)meta.asOf='2026-11-17';if(meta.snapshotDate)meta.snapshotDate='2026-11-17';meta.latestAssistantRestFix={date:'2026-11-17',record:'records/assistant-rest-fix-20261117/REPORT_KO.md',newSavedFields:0,nativeEngine:'5.7.0'};for(const row of meta.files||[])if(row.runtimePath==='jack.qsp'||row.path==='game/jack.qsp'){row.sha256=patch.after_sha256;row.bytes=output.length;}add(file,encode(meta));}
add(R+'/mods/'+patch.id+'.json',encode(patch));
for(const n of ['patch.json','prepared.json','before-interaction_result.txt','prepare.cjs','test.cjs','native-proof.cjs','native-stderr.log','native-verification.json','candidate-verification.json','work-verification.json','recovery.json','REPORT_KO.md','install.cjs'])add(record+'/'+n,read(H+'/'+n));
const hash=p=>fs.existsSync(p)?c.hash(read(p)):null,done=[],temps=[];
try{
 for(const w of writes)a.equal(hash(w.file),w.before?c.hash(w.before):null);
 for(const w of writes){fs.mkdirSync(path.dirname(w.file),{recursive:true});const tmp=w.file+'.assistant-rest-'+process.pid+'.tmp';temps.push(tmp);fs.writeFileSync(tmp,w.next,{flag:'wx'});a.equal(hash(w.file),w.before?c.hash(w.before):null);fs.renameSync(tmp,w.file);done.push(w);}
 a.equal(hash(G+'/jack.qsp'),patch.after_sha256);a(read(G+'/jack.qsp').equals(read(R+'/assets/runtime/2.4.1/jack.qsp')));
 const proof={...prep,installed:true,bytes:output.length,sourceSynced:true,native:{engine:'5.7.0',assertions:105,scenarios:11},wasm:{engine:'5.8.0',passed:15},newSavedFields:0,fullAndSavesNotWritten:true,existingReleaseZipNotWritten:true,recovery,changedFiles:writes.map(w=>w.file)};
 fs.writeFileSync(record+'/applied.json',encode(proof));fs.writeFileSync(H+'/applied.json',encode(proof));process.stdout.write(JSON.stringify({installed:true,before:patch.before_sha256,after:patch.after_sha256,changedLocations:['interaction_result'],newSavedFields:0,nativeChecks:105,wasmCases:15})+'\n');
}catch(e){for(const w of done.reverse())if(hash(w.file)===c.hash(w.next)){if(w.before===null)fs.unlinkSync(w.file);else fs.writeFileSync(w.file,w.before);}throw e;}
finally{for(const f of temps)if(fs.existsSync(f))fs.unlinkSync(f);}
