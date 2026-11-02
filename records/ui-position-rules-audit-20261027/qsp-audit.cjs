'use strict';
const fs=require('node:fs'),path=require('node:path');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',out=process.argv[2]||repo+'/records/ui-position-rules-audit-20261027';
const c=require(repo+'/tools/text-workshop/core.cjs'),raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw);
function blank(s){return s.replace(/[^\r\n]/g,' ')}
function masked(b){let text=b.split('');for(const e of c.literals(b,true)){const a=e.start-1,z=e.end+1;for(let i=a;i<z&&i<text.length;i++)if(text[i]!=='\r'&&text[i]!=='\n')text[i]=' ';}return text.join('');}
function at(b,p){return b.slice(0,p).split('\r\n').length;}
function patches(lines,line){const stack=[];for(let i=0;i<line;i++){let m=lines[i].match(/JO9 MOD START\s+([^|]+?)(?:\s*\||$)/);if(m)stack.push(m[1].trim());m=lines[i].match(/JO9 MOD END\s+([^|]+?)(?:\s*\||$)/);if(m){const j=stack.lastIndexOf(m[1].trim());if(j>=0)stack.splice(j);}}return stack.slice(-4);}
const all=[],locs=[];
for(const l of d.locations){const body=c.shift(d.lines[l.body],5),mask=masked(body),lines=body.split('\r\n'),assignments=[],embedded=[];
 const re=/\b((?:MAINDESC|STATDESC|OBJECTS|MSG|INPUT)_[A-Z_]+)\s*=\s*([^\r\n&:]+)/gi;let m;
 while((m=re.exec(body))){if(/[^ ]/.test(mask.slice(m.index,m.index+m[1].length))){const line=at(body,m.index),rec={location:l.name,line,variable:m[1].toUpperCase(),value:m[2].trim(),code:lines[line-1].trim(),patches:patches(lines,line)};assignments.push(rec);all.push(rec);}else{const line=at(body,m.index);embedded.push({line,variable:m[1].toUpperCase(),value:m[2].trim().slice(0,180),classification:'quoted code or comment; not a direct assignment'});}}
 const calls=[];for(const m of body.matchAll(/\b(gs|gt|gosub|goto|func)\s*\(?\s*(['"])([^'"\r\n]+)\2/gi)){const isStatic=/\S/.test(mask.slice(m.index,m.index+m[1].length));calls.push({target:m[3],kind:m[1].toLowerCase(),line:at(body,m.index),static:isStatic});}
 locs.push({name:l.name,body,lines,assignments,embedded,calls});
}
const isCoordinate=a=>/^(?:(?:MAINDESC|STATDESC|OBJECTS|INPUT)_[XYWH]|MSG_(?:(?:TEXT|OK)_)?[XYWH])$/.test(a.variable);
const coordinates=all.filter(isCoordinate),helpers=locs.filter(x=>x.assignments.some(isCoordinate)),helperNames=new Set(helpers.map(x=>x.name)),callers=[];
for(const x of locs)for(const call of x.calls)if(helperNames.has(call.target))callers.push({location:x.name,...call});
const groups=new Map;for(const a of all){const key=a.variable+'='+a.value;let g=groups.get(key);if(!g)groups.set(key,g={variable:a.variable,value:a.value,locations:new Set,occurrences:[]});g.locations.add(a.location);g.occurrences.push({location:a.location,line:a.line});}
const repeated=[...groups.values()].filter(x=>x.locations.size>1).map(x=>({...x,locations:[...x.locations]})).sort((a,b)=>b.locations.length-a.locations.length);
const report={qspSha256:c.hash(raw),readOnly:true,totalLocations:d.locations.length,directUiAssignmentCount:all.length,directCoordinateAssignmentCount:coordinates.length,directCoordinateLocationCount:helpers.length,variables:[...new Set(coordinates.map(x=>x.variable))].sort(),locations:helpers.map(x=>({name:x.name,assignments:x.assignments,coordinateAssignments:x.assignments.filter(isCoordinate),layoutCalls:x.calls.filter(y=>helperNames.has(y.target)),quotedOrCommentMatches:x.embedded})),callers,identicalValueAcrossLocations:repeated};
report.layoutHelpers=['_layout','main_layout','stats_layout','demo_layout','раскладка_бой'].map(name=>{const x=locs.find(y=>y.name===name),calls=callers.filter(y=>y.target===name);return{name,coordinateAssignments:x.assignments.filter(isCoordinate),staticCallSites:calls.filter(y=>y.static).length,quotedCallSites:calls.filter(y=>!y.static).length,callers:calls,missingCoordinates:['MAINDESC_X','MAINDESC_Y','MAINDESC_W','MAINDESC_H','STATDESC_X','STATDESC_Y','STATDESC_W','STATDESC_H','OBJECTS_X','OBJECTS_Y','OBJECTS_W','OBJECTS_H','MSG_X','MSG_Y','MSG_TEXT_X','MSG_TEXT_Y','MSG_TEXT_W','MSG_TEXT_H','MSG_OK_X','MSG_OK_Y'].filter(v=>!x.assignments.some(y=>y.variable===v))}});
report.limits=['Direct assignments and literal named calls only; no complete QSP runtime control flow proof.','Quoted calls are inventoried separately and may be dormant callback text.','No direct INPUT coordinate assignment was found; engine/default behavior is outside this QSP audit.'];
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/qsp-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({qspSha256:report.qspSha256,totalLocations:d.locations.length,assignments:coordinates.length,assignmentLocations:helpers.map(x=>({name:x.name,count:x.assignments.filter(isCoordinate).length,values:x.assignments.filter(isCoordinate).map(a=>a.variable+'='+a.value)})),callerCount:callers.length,repeated:repeated.filter(isCoordinate).slice(0,10)},null,2));
