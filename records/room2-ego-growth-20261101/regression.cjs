'use strict';
const fs=require('fs'),cp=require('child_process'),a=require('assert/strict'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/room2-ego-growth-20261101-native';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),B='G:/Codex/tmp/room2-ego-growth-20261101';
const cases=[
 {name:'room-two-only',states:[0,1,0,0],egos:[2,2,2,2]},
 {name:'room-one-and-two',states:[1,1,0,0],egos:[2,2,2,2]},
 {name:'room-two-threshold',states:[1,1,0,0],egos:[2,3,2,2]},
 {name:'empty-room-two',states:[0,0,0,0],egos:[2,2,2,2]},
 {name:'dead-room-two',states:[0,-1,0,0],egos:[2,2,2,2]},
 {name:'faint-room-two',states:[0,2,0,0],egos:[2,2,2,2]},
 {name:'all-rooms-grow',states:[1,1,1,1],egos:[2,2,2,2]},
 {name:'all-rooms-at-threshold',states:[1,1,1,1],egos:[3,3,3,3]}
];
fs.mkdirSync(T,{recursive:true});fs.copyFileSync(W+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');const plan=[],sources={};
for(const mode of ['red','green']){
 const raw=fs.readFileSync(B+'/'+(mode==='red'?'before':'candidate')+'.qsp'),d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),src=body('next_day');
 const start=src.indexOf("if room1_state = CONST_INT['slave_exist']:",src.indexOf('!개인실')),end=src.indexOf('!매춘 파트',start);a(start>=0&&end>start);const actual=src.slice(start,end).trimEnd();
 const staticBody=body('#static_base'),constants=['slave_dead','no_slave','slave_exist','slave_faint'].map(n=>{const m=staticBody.match(new RegExp("^CONST_INT\\['"+n+"'\\] = -?\\d+",'m'));a(m);return m[0];});
 const lines=['killall','usehtml=0',...constants];let assertions=0;
 for(const cfg of cases){for(let i=1;i<=4;i++)lines.push("killvar 'room"+i+"'","killvar 'room"+i+"_rate'",'room'+i+'_state='+cfg.states[i-1],"room"+i+"['ego']="+cfg.egos[i-1],"room"+i+"['half_action']=10","room"+i+"_rate['ego']="+(i*100));lines.push('master_supermacy=1',"gs 'qa_private_room_day'");for(let i=1;i<=4;i++){const expected=i*100+(cfg.states[i-1]===1&&cfg.egos[i-1]<3?1:0);lines.push(`if room${i}_rate['ego'] ! ${expected}: msg 'FAIL_ROOM2_EGO_${cfg.name}_${i}|actual=<<room${i}_rate["ego"]>>|expected=${expected}' & exit`);assertions++;}}
 const marker='JO9_QA_ROOM2EGO_'+mode+'_COMPLETE';lines.push("msg '"+marker+"'");
 const header=d.lines.slice(0,4);header[3]=c.shift('2',-5);const minimal={lines:[...header,c.shift('Start',-5),'',c.shift(lines.join('\r\n'),-5),c.shift('0',-5),c.shift('qa_private_room_day',-5),'',c.shift(actual,-5),c.shift('0',-5),'']};const bytes=c.serialize(minimal);qa.inspectWorld(bytes);fs.writeFileSync(T+'/'+mode+'.qsp',bytes);plan.push({name:mode,file:T+'/'+mode+'.qsp',marker,checkpoint:'Actual next_day private-room block; room independence, alive/absent/dead/faint, ego boundary and all rooms'});sources[mode]={qsp:c.hash(raw),roomBlockHash:c.hash(Buffer.from(actual,'utf8')),fixture:c.hash(bytes),assertions};
}
fs.writeFileSync(T+'/plan.json',JSON.stringify(plan,null,2));const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/qa/run-client-smoke.ps1','-Engine',W+'/engine/jack.exe','-Plan',T+'/plan.json','-TimeoutSeconds','20'],{encoding:'utf8',windowsHide:true,timeout:50000});fs.writeFileSync(T+'/runner.log',(run.stdout||'')+(run.stderr||''));const result=JSON.parse(fs.readFileSync(T+'/client-results.json','utf8').replace(/^\uFEFF/,'')),redLog=fs.readFileSync(T+'/red-stderr.log','utf8');
const redReproduced=result.find(x=>x.name==='red')?.pass===false&&redLog.includes('FAIL_ROOM2_EGO_room-two-only_1|actual=101|expected=100'),greenPass=result.find(x=>x.name==='green')?.pass===true,report={pass:redReproduced&&greenPass,redReproduced,greenPass,cases,greenAssertions:sources.green.assertions,sources,client:result,runnerExit:run.status,productionWrites:false,limits:['The actual complete four-room numeric block is copied unchanged into an isolated location, not the entire next_day.','The mandatory full-day flow is verified separately by the release smoke tests. No player save values are edited.']};
fs.writeFileSync(__dirname+'/regression-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,redReproduced,greenPass,greenAssertions:sources.green.assertions,client:result}));a(report.pass,'room2 regression');
