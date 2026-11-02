'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw);
const at=n=>{const l=d.locations.find(x=>x.name===n);return c.shift(d.lines[l.body],5).split(/\r?\n/);};
const ranges={'#options':[[7080,7095]],interaction_city:[[26838,26922]],'#event_base':[[1,8]]};
const evidence=[];
for(const [name,rs]of Object.entries(ranges)){const lines=at(name);for(const [start,end]of rs)for(let i=start-1;i<end;i++)evidence.push({location:name,line:i+1,text:lines[i]});}
for(const l of d.locations)if(/event|ongload|Start|dynamic/i.test(l.name)){const lines=at(l.name);for(let i=0;i<lines.length;i++)if(/Akabur_quest/.test(lines[i])&&evidence.filter(x=>x.location===l.name).length<20)evidence.push({location:l.name,line:i+1,text:lines[i]});}
const save=game+'/save/JO9_GOLD_AP_CHECK_20261026.sav',sraw=fs.readFileSync(save),s=sc.parse(sraw);
const vals={};for(const n of ['gold','sparks','fruits_minibox','fruits_maxibox','day','$place','sp_txt','interaction_city','Jasmine_job','slave_type','assistant_type'])vals[n]=sc.value(s,n.replace(/^\$/,''));
const key=sc.value(s,'event','Akabur_quest');vals.eventKey=key;vals.questStage=sc.value(s,'active',key[1]);
const result={qspSha256:d.hash,save,saveSha256:c.hash(sraw),fixtureValues:vals,evidence};fs.writeFileSync(__dirname+'/initial-inspection.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({qspSha256:result.qspSha256,saveSha256:result.saveSha256,fixtureValues:vals,evidenceLines:evidence.length},null,2));
