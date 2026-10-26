'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',c=require(repo+'/tools/text-workshop/core.cjs'),s=require(repo+'/tools/qa/save-codec.cjs');
const spec=JSON.parse(fs.readFileSync(here+'/spec.json')),requested=process.argv.slice(2),rows=[];
for(const a of spec.all){
 if(requested.length&&!requested.includes(a.id))continue;
 const file=spec.root+'/out/'+a.file;if(!fs.existsSync(file)){rows.push({index:a.index,id:a.id,exists:false});continue;}
 const raw=fs.readFileSync(file),d=s.parse(raw);assert(s.serialize(d).equals(raw),a.id+' byte roundtrip');
 assert.equal(s.dec(d.lines[10]),a.checkpoint,a.id+' checkpoint');
 assert.equal(s.value(d,'ONGLOAD')[1],'$ongload',a.id+' normal load');
 assert.equal(s.value(d,'ONOBJSEL')[1],'$objsel',a.id+' normal object handler');
 for(const n of ['COUNTER','ONNEWLOC','ONGSAVE'])assert.equal(s.value(d,n)[1],'',a.id+' callback '+n);
 for(const n of ['AUTOSAVE','AUTOSAVE_DAY','AUTOSAVE_DECADE','DECADESAVE'])assert.equal(s.value(d,n)[0],'0',a.id+' auto '+n);
 const death=d.vars.find(v=>v.name==='DEATH');assert(death.values[0][1].includes("gt 'exit'"),a.id+' full death macro');assert.equal(death.idx.find(x=>x[1]==='EGEYA')[0],1,a.id+' no named key at scalar zero');
 for(const name of ['ITEM_PRICE','ITEM_DESCRIPTION','ITEM_DEMO'])assert(!d.vars.find(v=>v.name===name).idx.some(x=>x[0]===0),a.id+' '+name+' default preserved');
 for(const v of d.vars){const keys=new Set();for(const [i,k]of v.idx){assert(i>=0&&i<v.values.length,a.id+' valid index '+v.name);assert(!keys.has(k));keys.add(k);}}
 const active=[];for(const role of ['SLAVE','ASSISTANT','PRISONER','COW',...Array.from({length:6},(_,i)=>'ROOM'+(i+1)),...Array.from({length:12},(_,i)=>'ICED_'+(i+1))])if(s.value(d,role+'_STATE')[0]!=='0'){assert.equal(s.value(d,role,'age')[0],'2',a.id+' adult '+role);active.push({role,type:s.value(d,role+'_TYPE')[0],id:s.value(d,role,'id')[0],name:s.value(d,role+'_NAME')[1]});}
 const text=[...d.lines.slice(0,d.start).map(s.dec),...d.vars.flatMap(v=>v.values.map(x=>x[1]))].join('\n');
 assert(!/\b(?:gs|gt|func)\s*\(?\s*['"](?:qa_emit|jo9sv_boot)/i.test(text),a.id+' no helper calls saved');
 assert(!/JO9_QA_|jo9sv_case|jo9sv_boot/i.test(text),a.id+' no automation in saved texts');
 assert.equal(s.value(d,'SNK_ROOM_TARGET')[0],'0',a.id+' no private bridge parked');
 if(a.id.startsWith('prod-size'))assert.equal(s.value(d,'TENTACLE_SIZE')[0],a.id.slice(-1));
 const diagnostic=d.vars.filter(v=>/^(?:QA_|JO9SV_)/.test(v.name));assert(diagnostic.every(v=>v.values.length===0),a.id+' nonempty diagnostic variables');
 rows.push({index:a.index,id:a.id,file:a.file,exists:true,pass:true,bytes:raw.length,sha256:c.hash(raw),location:s.dec(d.lines[10]),crc:s.dec(d.lines[2]),vars:d.vars.length,active,emptyDiagnosticVars:diagnostic.map(v=>v.name),completeScriptCache:true,normalCallbacks:true,automaticSaveOff:true,originalGuardCheckedByNativeFactory:true});
}
fs.writeFileSync(here+'/save-inspection.json',JSON.stringify(rows,null,2));console.log(JSON.stringify({found:rows.filter(r=>r.exists).length,missing:rows.filter(r=>!r.exists).map(r=>r.id),pass:rows.filter(r=>r.pass).length}));
