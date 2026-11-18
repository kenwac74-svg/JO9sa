'use strict';
const {fs,core,H,encode}=require('./common.cjs'),{fixture}=require('./fixture.cjs');
const f=fixture(),out='G:/Codex/tmp/humiliation-restore-20261117';
f.bodies.set('qa_finish',f.bodies.get('qa_finish')+"+';version='+$qspver");
fs.mkdirSync(out,{recursive:true});const bytes=encode(f.bodies);core.parse(bytes);
fs.writeFileSync(out+'/probe.qsp',bytes,{flag:'wx'});fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n',{flag:'wx'});
fs.writeFileSync(H+'/native-prepared.json',JSON.stringify({path:out+'/probe.qsp',sha256:core.hash(bytes),cases:f.cases,assertions:f.assertions,candidateSha256:f.candidateSha256},null,2)+'\n');console.log(JSON.stringify({path:out+'/probe.qsp',bytes:bytes.length,cases:f.cases,assertions:f.assertions}));
