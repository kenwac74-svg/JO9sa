'use strict';
// 검증용 복사본만 정리한다. 원본·개인 SAV·백업·D15 폴더는 다루지 않는다.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const tmp=path.resolve('G:/Codex/tmp/jo9-private-pregnancy-integration-20261028');
assert.equal(tmp,'G:\\Codex\\tmp\\jo9-private-pregnancy-integration-20261028');
assert.equal(fs.realpathSync(tmp),tmp);
assert(!fs.lstatSync(tmp).isSymbolicLink());
for(const [from,to] of [['main-stderr.log','native-stderr.log'],['main-stdout.log','native-stdout.log'],['qa-progress.sav','qa-progress.sav']]) {
 const a=fs.readFileSync(path.join(tmp,from)),b=fs.readFileSync(path.join(__dirname,to));
 assert(a.equals(b),'필수 실행 근거의 보존본 대조: '+from);
}
const known=new Set(['integration.qsp','FastQSP.ini','plan.json','client-results.json','main-stderr.log','main-stdout.log','qa-progress.sav','qa-summary.sav']);
const childNames=['unmodified-probe','unmodified-ten'];
const files=[];
for(const name of fs.readdirSync(tmp)) {
 const p=path.resolve(tmp,name);
 assert(p.startsWith(tmp+path.sep));
 if(childNames.includes(name)) {
  assert(fs.lstatSync(p).isDirectory()&&!fs.lstatSync(p).isSymbolicLink());
  const childKnown=new Set(['integration.qsp','FastQSP.ini','qa-progress.sav','qa-summary.sav']);
  for(const inner of fs.readdirSync(p)) {
   const absolute=path.resolve(p,inner);assert(absolute.startsWith(p+path.sep));
   if(inner==='save') {assert(!fs.lstatSync(absolute).isSymbolicLink());assert.equal(fs.readdirSync(absolute).length,0,'예상 밖 SAV 보존');continue;}
   assert(childKnown.has(inner),'예상 밖 자료는 보존: '+inner);
   assert(fs.lstatSync(absolute).isFile()&&!fs.lstatSync(absolute).isSymbolicLink());
   const b=fs.readFileSync(absolute);
   if(inner.endsWith('.sav')) {
    const suffix=inner==='qa-progress.sav'?'progress':'summary';
    assert(b.equals(fs.readFileSync(path.join(__dirname,name+'-'+suffix+'.sav'))),'합성 SAV 보존본이 바이트 동일해야 한다');
   }
   files.push({name:path.join(name,inner),bytes:b.length,sha256:core.hash(b)});
  }
  continue;
 }
 if(name==='save') {assert(!fs.lstatSync(p).isSymbolicLink());assert.equal(fs.readdirSync(p).length,0,'예상 밖 SAV 보존');continue;}
 assert(known.has(name),'예상 밖 자료는 보존: '+name);
 assert(fs.lstatSync(p).isFile()&&!fs.lstatSync(p).isSymbolicLink());
 const b=fs.readFileSync(p);files.push({name,bytes:b.length,sha256:core.hash(b)});
}
const report=JSON.parse(fs.readFileSync(path.join(__dirname,'native-results.json'),'utf8'));
assert(report.protected.every(x=>core.hash(fs.readFileSync(x.path))===x.sha256),'보호 원본은 동일해야 한다');
fs.writeFileSync(path.join(__dirname,'cleanup.json'),JSON.stringify({verifiedRoot:tmp,preservedSyntheticSaves:['initial-qa-progress.sav','second-qa-progress.sav','qa-progress.sav',...childNames.flatMap(n=>[n+'-progress.sav',n+'-summary.sav'])],preservationProof:'작업 tmp에서 제거한 SAV와 workspace 보존본은 바이트 완전 동일 대조. 서로 다른 workspace progress/summary 및 실패 SAV는 삭제0.',files},null,2)+'\n');
for(const f of files)fs.unlinkSync(path.join(tmp,f.name));
for(const name of childNames) {
 const p=path.join(tmp,name);if(fs.existsSync(path.join(p,'save')))fs.rmdirSync(path.join(p,'save'));fs.rmdirSync(p);
}
if(fs.existsSync(path.join(tmp,'save')))fs.rmdirSync(path.join(tmp,'save'));
fs.rmdirSync(tmp);
report.diagnosticsCleaned=true;
fs.writeFileSync(path.join(__dirname,'native-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cleaned:tmp,removedFiles:files.length,sourceAndUserSavesUntouched:true}));
