'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const here=__dirname;fs.mkdirSync(here,{recursive:true});
const paths={current:'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',original:'G:/somi/JO9O/game/jack.qsp'};
const wanted=new Set(['302110','302111','302112','302113','302114','30212','30213','302141','302142']);
const worlds={};
for(const [label,p] of Object.entries(paths)){
 const before=core.hash(fs.readFileSync(p)),d=core.parse(fs.readFileSync(p)),writes=[],branches=[],resetCandidates=[],otherGold=[],keyDefinitions=[],resetCalls=[];
 for(const loc of d.locations){let actionID='';const lines=core.shift(d.lines[loc.body],5).split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
   const line=lines[i];if(line.trim().startsWith('!'))continue;
   const id=line.match(/^\s*(?:if|elseif)\s+interaction_city\s*=\s*(\d+)/i);if(id)actionID=id[1];
   const m=line.match(/(?:^|[:&])\s*(gold\s*(?:\+=|-=|=)\s*[^&\r\n]+)/i);
   if(m&&!/\$text/.test(line))writes.push({location:loc.name,line:i+1,actionID:loc.name==='interaction_city'?actionID:null,statement:m[1].trim()});
   if(loc.name==='interaction_city'&&wanted.has(actionID)&&! /\$text|\$special|\$option/.test(line)&&/gold|sparks|interaction_city|fruits_|a = RAND/i.test(line))branches.push({location:loc.name,line:i+1,actionID,text:line});
   if(/\bkillall\b|killvar[^\r\n]*['"]gold['"]|^\s*gold\s*=\s*0\b/i.test(line))resetCandidates.push({location:loc.name,line:i+1,text:line});
   if(/\bgold\b/i.test(line)&&loc.name!=='interaction_city'&&!loc.name.startsWith('#txt'))otherGold.push({location:loc.name,line:i+1,text:line});
   if(loc.name==='#event_base'&&line.includes("$event['Akabur_quest']"))keyDefinitions.push({location:loc.name,line:i+1,text:line});
   if(/(?:gs|gt|gosub|goto)\s*['"]start_refresh['"]/i.test(line))resetCalls.push({location:loc.name,line:i+1,text:line});
  }
 }
 a.equal(core.hash(fs.readFileSync(p)),before);
 worlds[label]={path:p,sha256:before,locations:d.locations.length,writes,branches,resetCandidates,otherGold,keyDefinitions,resetCalls};
}
const signature=w=>w.writes.map(x=>[x.actionID,x.statement.replace(/\s+/g,' ')]);
const result={readOnly:true,worlds,currency:{gold:'Agrabah gold coins',sparks:'general sparks'},orderedGoldWritesIdentical:JSON.stringify(signature(worlds.current))===JSON.stringify(signature(worlds.original)),goldWriteCounts:{current:worlds.current.writes.length,original:worlds.original.writes.length}};
fs.writeFileSync(path.join(here,'exchange-static-evidence.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({current:worlds.current.sha256,original:worlds.original.sha256,orderedGoldWritesIdentical:result.orderedGoldWritesIdentical,goldWriteCounts:result.goldWriteCounts,resetCandidates:worlds.current.resetCandidates},null,2));
console.log(JSON.stringify({currentBranches:worlds.current.branches},null,2));
console.log(JSON.stringify({currentResetCalls:worlds.current.resetCalls,currentQuestKey:worlds.current.keyDefinitions,originalQuestKey:worlds.original.keyDefinitions},null,2));
