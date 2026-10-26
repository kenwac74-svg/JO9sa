'use strict';
// Disposable one-location worlds for installed-engine syntax semantics only.
const fs=require('node:fs'),path=require('node:path');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input='G:/Codex/tmp/jo9-full-audit-20261023/snapshot/jack.qsp';
const output=process.argv[2];if(!output)throw Error('Explicit temporary output required');
const d=core.parse(fs.readFileSync(input)),header=d.lines.slice(0,4);header[3]=core.shift('1',-5);
const cases=process.argv.includes('--followup')?[
 ['extra-bracket-effect',"$quest[16]='QA_QUEST'\r\nactive[$quest[16]]] = 1\r\nif active['QA_QUEST'] ! 1: msg 'QA_ASSERTION_FAILED'"],
 ['orphan-else-closed','a=1\r\nelse\r\na=2\r\nend'],
 ['duplicate-label-second',"mode=2\r\nif mode=1:\r\na=1\r\njump 'same'\r\n:same\r\na=11\r\nend\r\nif mode=2:\r\na=2\r\njump 'same'\r\n:same\r\na=22\r\nend"],
 ['missing-picture-selector',"gs 'picture_selector_doublehousework'"],
]:[
 ['extra-bracket-exact',"$quest[16]='QA_QUEST'\r\nactive[$quest[16]]] = 1"],
 ['bracket-control',"$quest[16]='QA_QUEST'\r\nactive[$quest[16]] = 1\r\nif active['QA_QUEST'] ! 1: msg 'QA_ASSERTION_FAILED'"],
 ['top-level-end','a=1\r\nend\r\na=2\r\nif a ! 2: msg \'QA_ASSERTION_FAILED\''],
 ['orphan-else','a=1\r\nelse\r\na=2\r\nif a ! 2: msg \'QA_ASSERTION_FAILED\''],
 ['duplicate-else-true','if 1:\r\na=1\r\nelse\r\na=2\r\nelse\r\na=3\r\nend'],
 ['duplicate-else-false','if 0:\r\na=1\r\nelse\r\na=2\r\nelse\r\na=3\r\nend'],
 ['missing-location-control',"gs 'QA_MISSING_LOCATION_EXACT'"],
];
fs.mkdirSync(output,{recursive:true});const plan=[];
for(const [name,code]of cases){const marker='JO9_QA_STATIC_'+name.replaceAll('-','_')+'_COMPLETE';if(!/^JO9_QA_[A-Z0-9]+_[a-z_]+_COMPLETE$/.test(marker)||!/^[a-z-]+$/.test(name))throw Error('Invalid native-runner fixture identifiers');const body=code+"\r\nmsg '"+marker+"'";const raw=Buffer.from([...header,core.shift('Start',-5),'',core.shift(body,-5),core.shift('0',-5),''].join('\r\n'),'utf16le');core.parse(raw);const file=path.join(output,name+'.qsp');fs.writeFileSync(file,raw);plan.push({name,file,marker,checkpoint:'Start',probePurpose:'Exact isolated syntax semantics; no product world or saves mutated'});}
fs.writeFileSync(path.join(output,'probe-plan.json'),JSON.stringify(plan,null,2)+'\n');console.log(JSON.stringify({inputHash:core.hash(fs.readFileSync(input)),output,probes:plan.length,plan:path.join(output,'probe-plan.json')},null,2));
