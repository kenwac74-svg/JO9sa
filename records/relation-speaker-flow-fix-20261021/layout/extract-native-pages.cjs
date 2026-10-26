'use strict';
const fs=require('node:fs'),path=require('node:path');
const root='G:/Codex/tmp/relation-speaker-flow-fix-20261021';
const cases=[];
for(const scenario of ['normal','long']){
 const pages={};
 for(const version of ['baseline','candidate']){
  const name=version+'-'+scenario;
  const file=path.join(root,'component','edges',name+'-stderr.log');
  const log=new TextDecoder('euc-kr').decode(fs.readFileSync(file));
  const begin='JO9_QA_REL9_'+name.replaceAll('-','_')+'_COMPLETE';
  if(!log.includes(begin)||!log.includes('JO9_EXPORT_END'))throw Error('Incomplete export '+name);
  const payload=log.slice(log.indexOf(begin)+begin.length,log.indexOf('JO9_EXPORT_END'));
  const split=payload.split(/JO9_PAGE_([1-6])\|/);
  pages[version]={};
  for(let i=1;i<split.length;i+=2)pages[version][Number(split[i])]=split[i+1];
  if(Object.keys(pages[version]).length!==6)throw Error('Expected six pages '+name);
 }
 for(let p=1;p<=6;p++)cases.push({id:scenario+'.p'+p,page:p,description:'Native origins_relations '+scenario+' scenario; independent native runs may choose different wording/cues',baseline:pages.baseline[p],candidate:pages.candidate[p]});
}
const fixtures={source:'Actual native FastQSP single-message page exports; baseline SHA 498e7fcaa2c116e382ab73ffe38549762297cce945247c2b8ad27509ba874fe0; candidate SHA c6ba9600e78f38ae1adeb9cf5c09a53115254ec40f666e48b53b912ab3e0195e',cases};
fs.writeFileSync(path.join(__dirname,'native-pages.json'),JSON.stringify(fixtures,null,2)+'\n','utf8');
console.log(JSON.stringify({cases:cases.length,pages:cases.map(c=>({id:c.id,baseline:c.baseline.length,candidate:c.candidate.length}))}));
