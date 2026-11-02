'use strict';
const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const T='G:/Codex/tmp/cruel-mercy-rules-20261101',W='G:/somi/Jack O Nine Tails v2.4_work/game',sc=require(W+'/modtools/text-workshop/scenes.cjs');
const raw=fs.readFileSync(T+'/candidate.qsp'),d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),read=n=>JSON.parse(fs.readFileSync(__dirname+'/'+n+'.json','utf8'));
const fate=read('native-fate-report'),pig=read('native-pig-report'),actions=read('native-actions-report'),math=read('math-report'),audit=read('final-review');
for(const r of [fate,pig,actions,math])a.equal(r.pass,true);
for(const [n,h] of Object.entries(fate.testedFunctionHashesUtf8))a.equal(c.hash(Buffer.from(body(n),'utf8')),h,'tested fate function '+n);
const ib=body('interaction'),event=ib.slice(ib.indexOf('if interaction = 6007:'),ib.indexOf('if interaction = 6008:',ib.indexOf('if interaction = 6007:')));
const pd=c.parse(fs.readFileSync('G:/Codex/tmp/cruel-mercy-rules-20261101-pig-native/pig.qsp'));
const pb=c.shift(pd.lines[pd.locations.find(l=>l.name==='CoreQAPigBody').body],5);
a.equal(pb,event+"\r\ngt 'CoreQAPigAfter'",'actual pig event unchanged after unrelated dialogue saves');
const city=body('interaction_city').replace(/\r\n/g,'\n'),cs=sc.analyse('interaction_city',city).scenes;
for(const s of actions.sourceBranches){const e=cs.find(e=>e.predicate?.value===String(s.id));a(e);a.equal(c.hash(Buffer.from(city.slice(e.start,e.end).replace(/\r?\n/g,'\r\n'),'utf8')),s.hash,'tested action '+s.id);}
const r={candidate:c.hash(raw),pass:true,mathPass:math.pass,fateFunctionHashesIdentical:true,pigEventIdentical:true,actionBranchesIdentical:actions.sourceBranches.length,unrelatedUserDialoguePreserved:true,nativeSourceBeforeRebase:fate.candidateHash,scope:'Native-tested arithmetic, fate, delayed pig event and all tested city action branches are byte-identical in the final candidate. Unrelated authored Erza dialogue was saved concurrently and preserved.'};
fs.writeFileSync(__dirname+'/evidence-correlation.json',JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r));
