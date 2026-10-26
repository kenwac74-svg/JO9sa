'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',root='G:/Codex/tmp/jo9-meiki-yield-20261023',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw);assert(c.serialize(d).equals(raw));
const id='2026-10-23_meiki_size_yield',base='semen_gain[max(0, tentacle_size - spawn_milked)]';
const prose='<<$slave_name>>는 양동이를 들고 안개 괴물 우리로 간다. 이전 경험 덕분에 그녀는 이성을 잃지 않고 능숙하게 괴물을 다룬다. 만족할 줄 모르는 미끈한 촉수 몇 개가 그녀의 모든 구멍을 파고든다. 그녀의 타고난 명기 때문에 괴물은 평소보다 많은 양의 정액을 그녀의 구멍에 쏟아내고 그녀는 그것을 양동이에 받아 낸다. 획득한 안개 괴물 정액: [실제 획득량] — 명기 효과 +[증가율]%';
const roles=['slave','assistant','room1','room2','room3','room4'],bodies=new Map(d.locations.map(l=>[l.name,c.shift(d.lines[l.body],5)])),original=new Map(bodies),edits=[];
const quant=r=>`${base} * iif(${r}['virginity'] = 4, 12 + tentacle_size, 10) / 10`,gain=r=>`jo9_tentacle_report['${r}_gain']`,bonus=r=>`jo9_tentacle_report['${r}_bonus']`;
function count(s,x){return s.split(x).length-1;}
function marker(s,label){return `! JO9 MOD START ${label} | ${id}\r\n${s}\r\n! JO9 MOD END ${label}`;}
function replace(loc,old,next,label){const s=bodies.get(loc);assert.equal(count(s,old),1,loc+' '+label+' unique');const wrapped=marker(next,label);bodies.set(loc,s.replace(old,wrapped));edits.push({location:loc,field:'body',old,new:wrapped,count:1});}
function exactLine(loc,predicate,label){const a=bodies.get(loc).split('\r\n'),idx=[];for(let i=0;i<a.length;i++)if(predicate(a[i],i,a))idx.push(i);assert.equal(idx.length,1,label);return {a,i:idx[0],line:a[idx[0]]};}
function replaceLine(loc,entry,next,label){const {a,i}=entry;let end=i+1,old=a.slice(i,end).join('\r\n');while(count(bodies.get(loc),old)!==1){assert(end<a.length);old=a.slice(i,++end).join('\r\n');}const expanded=[next,...a.slice(i+1,end)].join('\r\n');replace(loc,old,expanded,label);}
function editLiteralLine(line,text){const e=c.literals(line).filter(x=>c.isDialogue(x));assert.equal(e.length,1);c.validateMarkup(text);return line.slice(0,e[0].start)+text.replaceAll("'","''")+line.slice(e[0].end);}
function text(r,amount,pct){return prose.replace('<<$slave_name>>','<<$'+r+'_name>>').replace('[실제 획득량]','<<'+amount+'>>').replace('[증가율]','<<'+pct+'>>');}
function autoBlock(s,r){const a=s.split('\r\n'),start=a.findIndex(x=>x.trim()===`if ${r}_auto_tentacle = 3 - end_day_phase:`);assert(start>=0,r);let depth=0,end=-1;for(let i=start;i<a.length;i++){const x=a[i].trim();if(/^!/.test(x))continue;if(/^if\b.*:\s*$/.test(x))depth++;if(/^end\s*$/.test(x))depth--;if(depth===0){end=i+1;break;}}assert(end>start);return a.slice(start,end).join('\r\n');}
// Manual and training awards: unique context is expanded forward only; no other manual message changes.
for(const r of ['dynslave','assistant','slave']){
 const e=exactLine('interaction',(x,i,a)=>x.trim()===`spawn_semen += ${base}`&&a.slice(Math.max(0,i-7),i).join('\n').includes(`${r}['virginity'] = 4`),'manual grant '+r);
 replaceLine('interaction',e,e.line.replace(base,quant(r)),'MEIKI_MANUAL_GAIN_'+r.toUpperCase());
 const msg=exactLine('interaction',(x,i,a)=>x.includes('%명기착정성공')&&(r==='dynslave'?x.includes("dynslave['virginity']"):a.slice(Math.max(0,i-3),i).join('\n').includes(`${r}['virginity'] = 4`)),'manual text '+r);
 replaceLine('interaction',msg,editLiteralLine(msg.line,text(r,`${base} * (12 + tentacle_size) / 10`,'20 + tentacle_size * 10')),'MEIKI_MANUAL_TEXT_'+r.toUpperCase());
}
// Each daily grant snapshots only its actual produced amount and percent, before adding inventory once.
for(const r of roles){
 const e=exactLine('next_day',(x,i,a)=>x.trim()===`spawn_semen += ${base}`&&a.slice(Math.max(0,i-7),i).join('\n').includes(`${r}['virginity'] = 4`),'auto grant '+r),indent=e.line.match(/^\s*/)[0];
 const capture=[`${indent}${bonus(r)} = iif(${r}['virginity'] = 4, 20 + tentacle_size * 10, 0)`,`${indent}${gain(r)} = ${base} * (100 + ${bonus(r)}) / 100`,`${indent}spawn_semen += ${gain(r)}`].join('\r\n');
 replaceLine('next_day',e,capture,'MEIKI_AUTO_CAPTURE_'+r.toUpperCase());
 const old=autoBlock(bodies.get('end_day_screen'),r);let next=old;
 const gate=`if ${r}['sub_tentacles'] > tentacle_size or ${r}['virginity'] = 4:`;assert.equal(count(next,gate),1);
 const fall=marker([`\t\tif ${gain(r)} <= 0:`,`\t\t\t${gain(r)} = ${base}`,`\t\t\t${bonus(r)} = 0`,'\t\tend'].join('\r\n'),'MEIKI_REPORT_FALLBACK_'+r.toUpperCase());next=next.replace(gate,gate+'\r\n'+fall);
 const specialGate=`if ${r}['virginity'] = 4:`;assert.equal(count(next,specialGate),1);next=next.replace(specialGate,`if ${bonus(r)} > 0:`);
 const msg=next.split('\r\n').filter(x=>x.includes('%명기착정성공'));assert.equal(msg.length,1);next=next.replace(msg[0],editLiteralLine(msg[0],text(r,gain(r),bonus(r))));
 const normal=next.split('\r\n').filter(x=>x.includes('<<$'+r+'_name>>')&&x.includes('획득한 안개 괴물 정액:')&&x.includes(base));assert.equal(normal.length,1);const literal=c.literals(normal[0]).filter(x=>c.isDialogue(x))[0].text;next=next.replace(normal[0],editLiteralLine(normal[0],literal.replace('<<'+base+'>>','<<'+gain(r)+'>>')));
 assert.equal(count(next,'decade_semen += '+base),1);next=next.replace('decade_semen += '+base,'decade_semen += '+gain(r));
 replace('end_day_screen',old,next,'MEIKI_AUTO_REPORT_'+r.toUpperCase());
}
const reset=roles.map(r=>r+'_auto_tentacle=0').join('\r\n');assert(bodies.get('next_day').includes(reset));replace('next_day',reset,"killvar 'jo9_tentacle_report'\r\n"+reset,'MEIKI_AUTO_REPORT_RESET');
const first=bodies.get('init_game').split('\r\n')[0];assert(first.length>0);replace('init_game',first,"killvar 'jo9_tentacle_report'\r\n"+first,'MEIKI_REPORT_INIT_RESET');
for(const loc of d.locations)if(bodies.get(loc.name)!==original.get(loc.name))d.lines[loc.body]=c.shift(bodies.get(loc.name),-5);
const candidate=c.serialize(d);qa.inspectWorld(candidate);assert.equal(edits.length,20);
assert(!['interaction','end_day_screen'].some(n=>bodies.get(n).includes('%명기착정성공')));
for(const n of ['interaction','end_day_screen','next_day']){const old=original.get(n).split('\r\n'),after=bodies.get(n).split('\r\n');for(const re of [/^\s*if .*\['sub_tentacles'\] > tentacle_size or .*\['virginity'\] = 4:/,/spawn_milked\s*\+=/,/tentacle_hp\s*\+=/,/\$quest12/])assert.deepEqual(after.filter(x=>re.test(x)),old.filter(x=>re.test(x)),n+' protected mechanics '+re);}
const beforeSha=c.hash(raw),afterSha=c.hash(candidate),backup='G:/somi/JO9_work_backups/meiki_size_yield_20261023/before.qsp';fs.mkdirSync(path.dirname(backup),{recursive:true});if(fs.existsSync(backup))assert(fs.readFileSync(backup).equals(raw));else fs.writeFileSync(backup,raw,{flag:'wx'});
const patch={id,description:'명기 착정 크기별1.2~1.6배와 사용자 제공 성공문. 자동 실제 지급량/증가율을 당일 보고배열1개에 보관; 기존 성공·성장·소진·퀘스트·저장상한 유지.',target:'game\\jack.qsp',before_sha256:beforeSha,after_sha256:afterSha,edits};
fs.mkdirSync(root+'/patches',{recursive:true});fs.writeFileSync(root+'/patches/'+id+'.json',JSON.stringify(patch,null,2)+'\n');fs.writeFileSync(root+'/candidate.qsp',candidate);fs.copyFileSync(game+'/save/auto_day_end.sav',root+'/state.sav');
const tracked=[game+'/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'];for(const [dir,ext] of [['save','.sav'],['css','.css'],['json/slaves','.json']])for(const f of fs.readdirSync(game+'/'+dir))if(f.toLowerCase().endsWith(ext))tracked.push(game+'/'+dir+'/'+f);
fs.writeFileSync(root+'/preservation-before.json',JSON.stringify(tracked.map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))})),null,2));
fs.writeFileSync(root+'/prepared.json',JSON.stringify({id,before:beforeSha,after:afterSha,backup,edits:edits.length,changedLocations:[...bodies.keys()].filter(n=>bodies.get(n)!==original.get(n)),numericAwards:9,automaticStatistics:6,specialTexts:9,ordinaryQuantityInterpolations:6,reportArray:'jo9_tentacle_report',initialYields:[14,23,33,96,201],sourceProse:prose,legacy:'Missing report uses old base, bonus0, ordinary success text, no retroactive inventory award; original success gate retained.',savePreparation:'PAUSED_BY_USER'},null,2));
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),beforeSha);console.log(JSON.stringify({before:beforeSha,after:afterSha,edits:edits.length,candidate:root+'/candidate.qsp'}));
