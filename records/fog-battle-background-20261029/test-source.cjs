'use strict';
const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',input=process.argv[2],basePath=process.argv[3]||game+'/jack.qsp',out=__dirname,expected='content/pic/bg/battle_mist_forest.png',names=['боевой_интерфейс','конец_боя'];
const raw=fs.readFileSync(input),baseRaw=fs.readFileSync(basePath),d=c.parse(raw),b=c.parse(baseRaw);let result;
try{
 a(c.serialize(d).equals(raw),'QSP roundtrip');a.equal(d.locations.length,b.locations.length);let changed=[];
 for(let i=0;i<d.lines.length;i++)if(d.lines[i]!==b.lines[i])changed.push(i);
 const wanted=[];const contexts=[];
 for(const name of names){const l=d.locations.find(x=>x.name===name),bl=b.locations.find(x=>x.name===name),body=c.shift(d.lines[l.body],5),old=c.shift(b.lines[bl.body],5);wanted.push(l.body);
  a(body.includes(expected),'fog background target missing in '+name);a.equal(body.split(expected).length-1,1);
  a(body.includes("if $place = 'edge_patrol':"),'fog guard preserved');
  for(const path of ['content/pic/ui/jo9_battle_test_v01/arena.png','content\\pic\\ui\\grimdark\\bg\\fight.png','content/pic/bg/fight.png'])a.equal(body.split(path).length,old.split(path).length,'unchanged alternate context '+path);
  let restored=body.replace(/! JO9 MOD START FOG_BATTLE_BACKGROUND_20261029\r\n/g,'').replace(/\r\n! JO9 MOD END FOG_BATTLE_BACKGROUND_20261029/g,'').split(expected).join('content/pic/bg/<<$bg["edge_patrol"]>>.png');a.equal(restored,old,'only fog image literal + provenance changed');
  contexts.push({location:name,onlyFogPathChanged:true,arenaAndEventPathsPreserved:true});
 }
 a.deepEqual(changed.sort((x,y)=>x-y),wanted.sort((x,y)=>x-y),'only two body fields changed');
 const bp=b.locations.find(x=>x.name==='#place_base'),dp=d.locations.find(x=>x.name==='#place_base');a.equal(d.lines[dp.body],b.lines[bp.body]);a(c.shift(d.lines[dp.body],5).includes("$bg['edge_patrol'] = 'edge_of_mists<<rand(1,2)>>'"),'exploration image routing preserved');
 result={pass:true,inputSha256:c.hash(raw),baselineSha256:c.hash(baseRaw),changedBodyFields:changed.length,contexts,explorationRoutingPreserved:true,newSavedVariables:0,newAsset:expected,assetExistsInWork:fs.existsSync(game+'/'+expected),limit:'Static source assertions; image must exist before installation. Official engine gate separate.'};
}catch(e){result={pass:false,error:e.message,inputSha256:c.hash(raw),baselineSha256:c.hash(baseRaw)};}
fs.writeFileSync(out+'/'+(process.argv[4]||'source-report')+'.json',JSON.stringify(result,null,2));console.log(result);if(!result.pass)process.exitCode=1;
