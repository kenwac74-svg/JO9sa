'use strict';
// Read-only inputs. Writes only compact audit evidence beside this script.
const fs=require('node:fs'),path=require('node:path');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qsp='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(qsp),doc=core.parse(raw);
const keep=['refresh_database','#txt_woman','#txt_2_woman','jo9_save_maintenance','jo9_load_compat242'];
const refs=[];const locations=[];
for(const l of doc.locations){
 const body=core.shift(doc.lines[l.body],5),lines=body.split(/\r\n|\n/);
 if(keep.includes(l.name)){
  const assignments=[...body.matchAll(/^\s*(\$?[\w가-힣]+)\s*\[/gm)].map(m=>m[1]);
  const names=[...new Set(assignments)];
  locations.push({name:l.name,index:l.index,bodyBytes:Buffer.byteLength(body,'utf16le'),lines:lines.length,assignmentCount:assignments.length,assignedArrays:names});
 }
 for(let i=0;i<lines.length;i++){
  if(/#txt(?:_2)?_woman|refresh_database|\$ongload\s*=|\$ongsave\s*=|voice_fragment_revision\s*(?:=|!)|arrsize\('\$voice_fragment_ids'\)/i.test(lines[i]))refs.push({location:l.name,line:i+1,text:lines[i].slice(0,600)});
 }
}
const result={createdUtc:new Date().toISOString(),qsp,bytes:raw.length,sha256:doc.hash,locationCount:doc.locations.length,locations,references:refs};
fs.writeFileSync(path.join(__dirname,'current-source-evidence.json'),JSON.stringify(result,null,2),'utf8');
console.log(JSON.stringify({...result,references:refs.filter(r=>r.location!=='#txt_man')},null,2));
