'use strict';
// 승인된 설명서 메뉴와 본문만 현재 WORK 및 추적 QSP에 적용한다.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const H=__dirname,R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',B='G:/Codex/tmp/duplicato-manual-20261117',record=R+'/records/duplicato-manual-20261117';
const read=file=>fs.readFileSync(file),json=file=>JSON.parse(read(file).toString('utf8').replace(/^\uFEFF/,'')),encode=data=>Buffer.from(JSON.stringify(data,null,2)+'\n');
const p=json(H+'/prepared.json'),green=json(H+'/green.json'),patchFile=H+'/mods/2026-11-17_duplicato_spell_manual.json',patch=json(patchFile),output=read(H+'/candidate.qsp'),before=read(G+'/jack.qsp'),sourceBefore=read(R+'/assets/runtime/2.4.1/jack.qsp');
const previousApplication=fs.existsSync(H+'/applied.json')?json(H+'/applied.json'):null;
assert(c.hash(before)===p.before||previousApplication&&c.hash(before)===previousApplication.after,'WORK changed; regenerate from the latest saved file');assert.equal(c.hash(output),p.after);assert.equal(green.sha256,p.after);assert.equal(green.passed,green.total);assert.equal(green.errors.length,0);
const work=c.parse(before),source=c.parse(sourceBefore),sourceChanges=[];
for(const old of source.locations){const latest=work.locations.find(loc=>loc.name===old.name);assert(latest);assert.equal(source.lines[old.desc],work.lines[latest.desc]);if(source.lines[old.body]!==work.lines[latest.body])sourceChanges.push({location:old.name,oldEncodedBody:source.lines[old.body]});}
assert(sourceChanges.every(change=>change.location==='interaction_city'),'Unexpected source changes require review');
const original=c.hash(before)===p.before?before:read(B+'/before.qsp');assert.equal(c.hash(original),p.before);
const replay=c.parse(original);for(const edit of patch.edits){const loc=replay.locations.find(loc=>loc.name===edit.location),text=c.shift(replay.lines[loc.body],5);assert.equal(text.split(edit.old).length-1,1);replay.lines[loc.body]=c.shift(text.replace(edit.old,()=>edit.new),-5);}assert(c.serialize(replay).equals(output));
assert(fs.existsSync(G+'/'+p.icon),'Manual icon is missing');
const writes=[];function add(file,next){writes.push({file:path.resolve(file),before:fs.existsSync(file)?read(file):null,next});}
add(G+'/jack.qsp',output);add(R+'/assets/runtime/2.4.1/jack.qsp',output);
for(const file of [R+'/assets/runtime-source-2.4.1.json',R+'/assets/runtime-manifests/2.4.2-work.json']){const meta=json(file);meta.sourceQspSha256=p.after;meta.latestDuplicatoManual={date:'2026-11-17',record:'records/duplicato-manual-20261117/REPORT_KO.md',interaction:62111,cachedBookRefresh:true,newSavedFields:0};for(const row of meta.files||[])if(row.runtimePath==='jack.qsp'||row.path==='game/jack.qsp'){row.sha256=p.after;row.bytes=output.length;}add(file,encode(meta));}
add(R+'/mods/'+path.basename(patchFile),read(patchFile));for(const name of ['prepare.cjs','test-manual.cjs','install.cjs','prepared.json','red.json','green.json','REPORT_KO.md'])add(record+'/'+name,read(H+'/'+name));
fs.mkdirSync(B,{recursive:true});if(fs.existsSync(B+'/before.qsp'))assert.equal(c.hash(read(B+'/before.qsp')),p.before);else fs.writeFileSync(B+'/before.qsp',original,{flag:'wx'});if(!fs.existsSync(B+'/source-before-delta.json'))fs.writeFileSync(B+'/source-before-delta.json',encode({before:c.hash(sourceBefore),base:p.before,locations:sourceChanges}),{flag:'wx'});
const installed=[],temps=[],current=file=>fs.existsSync(file)?c.hash(read(file)):null;
try{for(const item of writes)assert.equal(current(item.file),item.before?c.hash(item.before):null,'Destination changed: '+item.file);
 for(const item of writes){fs.mkdirSync(path.dirname(item.file),{recursive:true});const temp=item.file+'.duplicato-manual-'+process.pid+'.tmp';assert(!fs.existsSync(temp));temps.push(temp);fs.writeFileSync(temp,item.next,{flag:'wx'});assert.equal(current(item.file),item.before?c.hash(item.before):null,'Destination changed during installation');installed.push(item);fs.renameSync(temp,item.file);}
 assert.equal(c.hash(read(G+'/jack.qsp')),p.after);assert(read(G+'/jack.qsp').equals(read(R+'/assets/runtime/2.4.1/jack.qsp')));
 const proof={...p,installed:true,sourceBefore:c.hash(sourceBefore),preservedManualLocations:sourceChanges.map(change=>change.location),declarativeReplay:true,engineChecks:green.total,backup:B+'/before.qsp',fullAndSavesUnchanged:true,files:writes.map(item=>path.relative(R,item.file).replaceAll('\\','/'))};fs.writeFileSync(H+'/applied.json',encode(proof));fs.writeFileSync(record+'/applied.json',encode(proof));process.stdout.write(JSON.stringify({installed:true,hash:p.after,engineChecks:green.total,entry:62111,backup:proof.backup})+'\n');
}catch(error){const conflicts=[];for(const item of installed.reverse()){if(current(item.file)!==c.hash(item.next)){conflicts.push(item.file);continue;}if(item.before===null)fs.unlinkSync(item.file);else fs.writeFileSync(item.file,item.before);}if(conflicts.length)error.message+='; preserved concurrent edits: '+conflicts.join(', ');throw error;}
finally{for(const temp of temps)if(fs.existsSync(temp))fs.unlinkSync(temp);}
