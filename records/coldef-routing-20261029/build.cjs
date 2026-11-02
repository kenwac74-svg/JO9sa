'use strict';
const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/coldef-routing-20261029',record=__dirname;
a(!fs.existsSync(root),'Temporary task directory already exists; inspect before reuse');
const raw=fs.readFileSync(game+'/jack.qsp'),doc=c.parse(raw);a(c.serialize(doc).equals(raw));
const location=doc.locations.find(l=>l.name==='interaction_city'),body=c.shift(doc.lines[location.body],5),edits=[];
for(const [id,file] of [[1291,'coldef1'],[1292,'coldef2'],[1293,'coldef3']]){
 const start=body.indexOf('if interaction_city = '+id+':');a(start>=0);
 const suffix="\tif g > 1: $bg_path += '_' + $str(g)";
 const stop=body.indexOf(suffix,start);a(stop>start);
 const end=body.indexOf('\r\n',stop);a(end>stop);
 const old=body.slice(start,end),oldRoute=old.indexOf("\t$bg_path = 'scene/kikudef'");a(oldRoute>=0);
 a.equal(old.slice(oldRoute).trim(),("\t$bg_path = 'scene/kikudef'\r\n\tg = rand(1, picMax['arena_end'])\r\n"+suffix).trim());
 const next=old.slice(0,oldRoute)+'\t! JO9 MOD START COLDEF_RESULT_PATHS_20261029\r\n\t$bg_path = \'scene/'+file+'\'\r\n\t! JO9 MOD END COLDEF_RESULT_PATHS_20261029';
 edits.push({location:location.name,field:'body',old,new:next,count:1});
}
let updated=body;for(const e of edits){a.equal(updated.split(e.old).length-1,1);updated=updated.replace(e.old,e.new);}
let undone=updated;for(const e of [...edits].reverse())undone=undone.replace(e.new,e.old);a.equal(undone,body);
doc.lines[location.body]=c.shift(updated,-5);const candidate=c.serialize(doc),checked=c.parse(candidate);a(c.serialize(checked).equals(candidate));
const oldDoc=c.parse(raw);a.equal(checked.locations.length,oldDoc.locations.length);for(let i=0;i<checked.lines.length;i++)if(i!==location.body)a.equal(checked.lines[i],oldDoc.lines[i]);
const patch={id:'2026-10-29_coldef_result_paths',description:'Colosseum owned-slave defeat art routing:1291 coldef1,1292 coldef2,1293 coldef3; exact single PNG paths; no outcome or save-state changes',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits};
fs.mkdirSync(root+'/mods',{recursive:true});fs.writeFileSync(root+'/baseline.qsp',raw);fs.writeFileSync(root+'/candidate.qsp',candidate);fs.writeFileSync(root+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2));fs.writeFileSync(record+'/patch.json',JSON.stringify(patch,null,2));
const code=['qa_checks=0',"picMax['arena_end']=99"];
for(const [index,e]of edits.entries()){
 const file='coldef'+(index+1),route=e.new.slice(e.new.indexOf('\t! JO9 MOD START'));
 code.push("$bg_path='QA_STALE'",'g=777',route,`if $bg_path ! 'scene/${file}': qa_checks=-100 & exit`,'if g ! 777: qa_checks=-200 & exit','qa_checks+=1');
}
fs.writeFileSync(root+'/native-assertions.qsp.txt',code.join('\r\n'));
const summary={before:patch.before_sha256,after:patch.after_sha256,locations:checked.locations.length,changedFields:1,edits:3,inverseRestoresByteExact:true,newLocations:0,newStoredVariables:0,imageFilesCreated:0,expectedImagePaths:[1,2,3].map(n=>'content/pic/scene/coldef'+n+'.png')};
fs.writeFileSync(record+'/candidate-verification.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));
