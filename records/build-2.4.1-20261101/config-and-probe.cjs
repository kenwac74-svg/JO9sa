'use strict';
const fs=require('fs'),assert=require('assert/strict');
const R='G:/somi/JO9sa',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game',T='G:/Codex/tmp/build-2.4.1-20261101';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),p=JSON.parse(fs.readFileSync(__dirname+'/prepared.json'));
for(const x of p.configs){assert.equal(c.hash(fs.readFileSync(x.path)),x.beforeSha256);const candidate=T+'/'+(x.path.includes('v2.4_work')?'work':'full')+'-config.xml';assert.equal(c.hash(fs.readFileSync(candidate)),x.afterSha256);fs.copyFileSync(candidate,x.path);assert.equal(c.hash(fs.readFileSync(x.path)),x.afterSha256);}
const mod=R+'/mods/'+p.patch+'.json';assert(!fs.existsSync(mod));fs.copyFileSync(__dirname+'/patch.json',mod);
const dir=T+'/credits-probe';assert(!fs.existsSync(dir));fs.mkdirSync(dir);fs.copyFileSync(F+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const raw=fs.readFileSync(F+'/jack.qsp');assert.equal(c.hash(raw),p.after);const d=c.parse(raw),l=d.locations.find(x=>x.name==='Start');
const wanted=['잭오나 한글 2.4.1 입니다.','PSP_PSP : 인디패치 원작자','zonezizone</b> : 잭오나 플레이 실황','콤콤삼촌 : 허셀2이미지 제공','smsfbatalovehandle','SAnk'];
let code="killall\r\nsettimer 0\r\n$counter=''\r\n$ongload=''\r\n$onnewloc=''\r\nsound_on=0\r\nusehtml=1\r\n*clr\r\ngs 'credits'\r\n$qa_html=$maintxt\r\n";
for(let i=0;i<wanted.length;i++){const s=wanted[i].replaceAll("'","''");code+="if instr($qa_html,'"+s+"')=0: msg 'JO9_QA_BUILD241_MISSING_"+i+"' & exit\r\n";}
code+="if instr($qa_html,'2.4.0.0')>0: msg 'JO9_QA_BUILD241_OLD_VERSION' & exit\r\n";
for(const name of ['PSP_PSP','zonezizone','콤콤삼촌'])code+="if instr($mid($qa_html,instr($qa_html,'"+name+"')+1),'"+name+"')>0: msg 'JO9_QA_BUILD241_DUPLICATE' & exit\r\n";
const marker='JO9_QA_BUILD241_credits_COMPLETE';code+="msg '"+marker+"'\r\nexit";d.lines[l.body]=c.shift(code,-5);const fixture=c.serialize(d);qa.inspectWorld(fixture);fs.writeFileSync(dir+'/credits.qsp',fixture);
fs.writeFileSync(dir+'/plan.json',JSON.stringify([{name:'credits-render',file:dir+'/credits.qsp',marker,checkpoint:'Actual credits output:2.4.1, exact three thanks, no duplicate names, old credits retained'}],null,2));
console.log(JSON.stringify({configsApplied:2,patch:mod,probe:dir+'/plan.json',runtimeAssertions:10}));
