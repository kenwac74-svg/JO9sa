'use strict';
const fs=require('node:fs'),core=require('../text-workshop/core.cjs');
// A valid CRLF container can still have a missing newline after a provenance comment.
// Known START IDs distinguish e.g. END FOO + IF from a legitimate longer marker ID.
function inspectMarkerBoundaries(raw){
 const d=core.parse(raw),scripts=[],known=new Set();
 for(const l of d.locations){
  scripts.push({location:l.name,field:'body',text:core.shift(d.lines[l.body],5)});
  const at=l.body-2,n=Number(core.shift(d.lines[at+3],5));
  for(let i=0;i<n;i++)scripts.push({location:l.name,field:'action:'+i,text:core.shift(d.lines[at+6+i*3],5)});
 }
 for(const s of scripts)for(const m of s.text.matchAll(/^[\t ]*! JO9 MOD START ([A-Za-z0-9_]+)/gm))known.add(m[1]);
 const longest=[...known].sort((a,b)=>b.length-a.length),issues=[];
 for(const s of scripts){const lines=s.text.split('\r\n');for(let i=0;i<lines.length;i++){
  const m=lines[i].match(/^[\t ]*! JO9 MOD END (.*)$/);if(!m)continue;
  const token=m[1].match(/^[A-Za-z0-9_]+/)?.[0];
  const id=known.has(token)?token:longest.find(id=>m[1].startsWith(id));if(!id)continue;
  const suffix=m[1].slice(id.length);
  if(suffix.trim()&&!suffix.trimStart().startsWith('|'))issues.push({location:s.location,field:s.field,line:i+1,marker:id,suffix,kind:'joinedMarkerBoundary'});
 }}
 return{sha256:core.hash(raw),issues};
}
if(require.main===module){if(!process.argv[2]){console.error('QSP path required');process.exitCode=2;}else{const r=inspectMarkerBoundaries(fs.readFileSync(process.argv[2]));console.log(JSON.stringify(r,null,2));if(r.issues.length)process.exitCode=1;}}
module.exports={inspectMarkerBoundaries};
