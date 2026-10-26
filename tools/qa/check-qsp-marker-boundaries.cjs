'use strict';
const fs=require('node:fs'),core=require('../text-workshop/core.cjs');
// A valid CRLF container can still have a missing newline beside a provenance comment.
// Known START IDs distinguish e.g. END FOO + IF from a legitimate longer marker ID.
function inspectMarkerBoundaries(raw){
 const d=core.parse(raw),scripts=[],known=new Set();
 for(const l of d.locations){
  scripts.push({location:l.name,field:'body',text:core.shift(d.lines[l.body],5)});
  const at=l.body-2,n=Number(core.shift(d.lines[at+3],5));
  for(let i=0;i<n;i++)scripts.push({location:l.name,field:'action:'+i,text:core.shift(d.lines[at+6+i*3],5)});
 }
 // Reuse the QSP lexer so marker examples inside strings and existing comments
 // cannot become executable-boundary errors; &! and : ! are valid comments.
 for(const s of scripts){
  s.ranges=core.literals(s.text,true);
  for(const m of s.text.matchAll(/^[\t ]*! JO9 MOD START ([A-Za-z0-9_]+)/gm)){
   const at=m.index+m[0].indexOf('!'),r=s.ranges.find(r=>at>=r.start-1&&at<=r.end);
   if(!r||(r.comment&&at===r.start-1))known.add(m[1]);
  }
 }
 const longest=[...known].sort((a,b)=>b.length-a.length),issues=[];
 for(const s of scripts){const lines=s.text.split('\r\n');let offset=0;for(let i=0;i<lines.length;i++){
  for(const m of lines[i].matchAll(/! JO9 MOD START ([A-Za-z0-9_]+)/g)){
   const at=offset+m.index;
   if(!s.ranges.some(r=>at>=r.start-1&&at<=r.end))issues.push({location:s.location,field:s.field,line:i+1,marker:m[1],prefix:lines[i].slice(0,m.index),kind:'joinedMarkerStart'});
  }
  const m=lines[i].match(/^[\t ]*! JO9 MOD END (.*)$/),lineOffset=offset;offset+=lines[i].length+2;if(!m)continue;
  const at=lineOffset+lines[i].indexOf('!'),r=s.ranges.find(r=>at>=r.start-1&&at<=r.end);
  if(r&&(!r.comment||at!==r.start-1))continue;
  const token=m[1].match(/^[A-Za-z0-9_]+/)?.[0];
  const id=known.has(token)?token:longest.find(id=>m[1].startsWith(id));if(!id)continue;
  const suffix=m[1].slice(id.length);
  if(suffix.trim()&&!suffix.trimStart().startsWith('|'))issues.push({location:s.location,field:s.field,line:i+1,marker:id,suffix,kind:'joinedMarkerBoundary'});
 }}
 return{sha256:core.hash(raw),issues};
}
if(require.main===module){if(!process.argv[2]){console.error('QSP path required');process.exitCode=2;}else{const r=inspectMarkerBoundaries(fs.readFileSync(process.argv[2]));console.log(JSON.stringify(r,null,2));if(r.issues.length)process.exitCode=1;}}
module.exports={inspectMarkerBoundaries};
