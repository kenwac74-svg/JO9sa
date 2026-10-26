'use strict';
// Preserve actual native save evidence as verified deltas against the installed test pack.
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');
const sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const crypto=require('node:crypto');
const root='G:/Codex/tmp/bankruptcy-ui-saves-20261025-r2';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const key=v=>v.slot+':'+v.name;
function restore(baseRaw,delta){
 assert.equal(digest(baseRaw),delta.baseSha256);
 const base=sc.parse(baseRaw),map=new Map(base.vars.map(v=>[key(v),v]));
 for(const v of delta.changed)map.set(key(v),v);
 const d={lines:delta.prefix,start:delta.prefix.length,vars:delta.order.map(k=>{assert(map.has(k));return map.get(k);})};
 const raw=sc.serialize(d);assert.equal(digest(raw),delta.targetSha256);return raw;
}
if(process.argv[2]==='--restore'){
 const delta=JSON.parse(z.gunzipSync(fs.readFileSync(process.argv[3])));
 const raw=restore(fs.readFileSync(process.argv[4]),delta);
 fs.writeFileSync(process.argv[5],raw,{flag:'wx'});console.log(JSON.stringify({restored:true,sha256:digest(raw)}));process.exit(0);
}
const data=[];
for(const [name,baseFile,targetFile,money]of [
 ['decor','05_single-settlement.sav','work-reference.sav',360],
 ['relocation','02_occupied-relocation.sav','move-check.sav',11306],
 ['contract','09_contract-return.sav','contract-check.sav',11104],
]){
 const baseRaw=fs.readFileSync(root+'/pack/'+baseFile),raw=fs.readFileSync(root+'/verify/'+targetFile);
 const base=sc.parse(baseRaw),d=sc.parse(raw),n=(name,k)=>+sc.value(d,name,k)[0];
 assert(sc.serialize(d).equals(raw));assert.equal(n('SPARKS'),money);assert.equal(n('JO9_LQ','active'),0);
 assert.equal(n('DAY'),+sc.value(base,'DAY')[0],'Settlement must not advance the day');
 const observed={money,day:n('DAY'),pending:n('JO9_LQ','active'),estate:sc.value(d,'ESTATE')[1]};
 if(name!=='decor'){
  assert.equal(observed.estate,'slum_house');
  for(const field of ['KULACONSTRUCT','ROOM4_STATE','ICED_1_STATE','BARN','LAB','DUNGEON','BOUDOIR','PEN','STASIS_TANK'])assert.equal(n(field),0,field);
  observed.facilitiesAndResidentsCleared=true;
 }
 if(name==='relocation'){
  assert.equal(n('JO9_LQ_FAILED_QUEST','black_arhangel'),1);assert.equal(n('NPC_PROGRESS','black_arhangel'),1);
  observed.actorQuestFailed=true;observed.actorQuestSucceeded=false;
 }
 if(name==='contract'){
  const q=d.vars.find(v=>v.name==='QUEST').values[10][1];
  assert.equal(n('CONTRACT','active'),0);assert.equal(n('ACTIVE',q),0);
  observed.contractClosed=true;observed.questActive=false;
 }
 const before=new Map(base.vars.map(v=>[key(v),v]));
 const delta={baseFile,baseSha256:digest(baseRaw),targetSha256:digest(raw),targetBytes:raw.length,prefix:d.lines.slice(0,d.start),order:d.vars.map(key),changed:d.vars.filter(v=>JSON.stringify(before.get(key(v)))!==JSON.stringify(v))};
 assert(restore(baseRaw,delta).equals(raw),'Delta must reconstruct exact native save');
 const deltaFile='native-'+name+'.json.gz',bytes=z.gzipSync(Buffer.from(JSON.stringify(delta)),{level:9});
 fs.writeFileSync(__dirname+'/'+deltaFile,bytes,{flag:'wx'});
 data.push({name,baseFile,deltaFile,compressedBytes:bytes.length,targetSha256:delta.targetSha256,observed,exactReconstruction:true});
}
fs.copyFileSync(root+'/inputs.json',__dirname+'/protected-inputs.json',fs.constants.COPYFILE_EXCL);
const report={status:'PASS',nativeSaves:data,strictLoad:{unmodifiedWork:true,ignoreCRC:false,files:['05_single-settlement.sav','07_slave-trait-ui.sav','08_assistant-trait-ui.sav','02_occupied-relocation.sav','09_contract-return.sav'],crcWarnings:0},visualChecks:[
 '07: profile loaded; continuous upper-left frame, compact groups, footer text and grade colors visible.',
 '07: footer opens two trait columns plus brown title column; healthy constitution click updates lower description without exact effect numbers.',
 '08: assistant heading opens same three-column view; versatile title click updates lower description without blocking popup.',
 '05: decor click returns to home with money360; 02: relocation click returns to slum with11306;09: failure-return relocation returns to slum with11104.',
],limits:['All nine were created through native Game Load and SAVEGAME and independently inspected. Final strict-load interactions covered five representative files, not all gameplay paths.','No game runtime or personal save was edited. UI07/08 are artificial display fixtures, not growth-balance fixtures.'],restore:'node native-evidence.cjs --restore delta.json.gz installed-base.sav unique-output.sav'};
fs.writeFileSync(__dirname+'/GUI_VERIFICATION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:report.status,deltas:data.map(r=>({name:r.name,bytes:r.compressedBytes,observed:r.observed}))}));
