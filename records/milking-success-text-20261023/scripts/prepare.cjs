'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',root='G:/Codex/tmp/jo9-milking-text-20261023',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(game+'/jack.qsp'),doc=c.parse(raw);assert(c.serialize(doc).equals(raw));
const id='2026-10-23_milking_success_text_unify';
const literal='<<$slave_name>>는 양동이를 들고 안개 괴물 우리로 간다. 이전 경험 덕분에 그녀는 이성을 잃지 않고 능숙하게 괴물을 다룬다. 만족할 줄 모르는 미끈한 촉수 몇 개가 그녀의 모든 구멍을 파고들고, 얼마의 시간이 지난 후 그녀는 괴물의 촉수가 자신의 구멍에 쏟아낸 정액을 양동이에 받아 낸다. 획득한 안개 괴물 정액: <<semen_gain[max(0, tentacle_size - spawn_milked)]>>';
const edits=[],details=[];
function skeleton(s){let out='',at=0;for(const e of c.literals(s)){out+=s.slice(at,e.start);at=e.end;}return out+s.slice(at);}
for(const location of ['end_day_screen','interaction']){
 const l=doc.locations.find(x=>x.name===location),old=c.shift(doc.lines[l.body],5);let next=old;
 for(const role of location==='end_day_screen'?['slave','assistant','room1','room2','room3','room4']:['assistant','slave']){
  const matches=old.split('\r\n').filter(line=>line.includes('<<$'+role+'_name>>')&&/\$text(?:\[1\])?\s*=/.test(line)&&/획득한.*정액:|산란액 획득량/.test(line));
  assert.equal(matches.length,1,location+' '+role+' exact success assignment');
  const before=matches[0],e=c.literals(before).filter(x=>c.isDialogue(x));assert.equal(e.length,1);
  const text=literal.replace('<<$slave_name>>','<<$'+role+'_name>>');c.validateMarkup(text);
  const statement=before.slice(0,e[0].start)+text.replaceAll("'","''")+before.slice(e[0].end);
  assert.equal(skeleton(statement),skeleton(before),'Only visible literal changes');
  assert.deepEqual(c.protectedParts(text).filter(x=>x.startsWith('<<')),c.protectedParts(e[0].text).filter(x=>x.startsWith('<<')),'Name and yield expressions preserved');
  const mark='MILKING_SUCCESS_TEXT_'+location.toUpperCase()+'_'+role.toUpperCase();
  const after='! JO9 MOD START '+mark+' | '+id+'\r\n'+statement+'\r\n! JO9 MOD END '+mark;
  assert.equal(next.split(before).length-1,1);next=next.replace(before,after);
  edits.push({location,field:'body',old:before,new:after,count:1});details.push({location,role,statement,text});
 }
 // Comments are the only executable-skeleton additions.
 const strip=s=>s.split('\r\n').filter(x=>!x.startsWith('! JO9 MOD START MILKING_SUCCESS_TEXT_')&&!x.startsWith('! JO9 MOD END MILKING_SUCCESS_TEXT_')).join('\r\n');
 assert.equal(skeleton(strip(next)),skeleton(old));doc.lines[l.body]=c.shift(next,-5);
}
assert.equal(edits.length,8);const candidate=c.serialize(doc);qa.inspectWorld(candidate);
const backup='G:/somi/JO9_work_backups/milking_success_text_20261023/before.qsp';fs.mkdirSync(path.dirname(backup),{recursive:true});
if(fs.existsSync(backup))assert(fs.readFileSync(backup).equals(raw),'Existing backup differs');else fs.writeFileSync(backup,raw,{flag:'wx'});
const patch={id,description:'사용자 제공 일반 착정 성공 문구를 수동2·자동6 경로에 통일. 인물 이름·성공 판정·획득 계산·명기 전용 문구 보존.',target:'game\\jack.qsp',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits};
fs.mkdirSync(root+'/patches',{recursive:true});fs.writeFileSync(root+'/patches/'+id+'.json',JSON.stringify(patch,null,2)+'\n');fs.writeFileSync(root+'/candidate.qsp',candidate);
fs.copyFileSync(game+'/save/auto_day_end.sav',root+'/state.sav');
const tracked=[game+'/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'];
for(const f of fs.readdirSync(game+'/save'))if(f.toLowerCase().endsWith('.sav'))tracked.push(game+'/save/'+f);
fs.writeFileSync(root+'/preservation-before.json',JSON.stringify(tracked.map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))})),null,2));
const specialBefore=(c.shift(c.parse(raw).lines[c.parse(raw).locations.find(x=>x.name==='interaction').body],5).match(/%명기착정성공/g)||[]).length;
fs.writeFileSync(root+'/prepared.json',JSON.stringify({id,before:c.hash(raw),after:c.hash(candidate),backup,edits:details.map(({text,...x})=>x),limits:['Only8 ordinary success strings; lesson narrative, failure text and special marker unchanged.','No save generation; user paused test-save task.'],specialBefore},null,2));
// Engine probe evaluates the exact production assignment for each actor and output array form.
const native=root+'/native';fs.mkdirSync(native,{recursive:true});const steps=['killall','settimer 0','tentacle_size=0','spawn_milked=0','semen_gain[0]=7'];
for(const x of details){steps.push('$'+x.role+"_name='QA_ACTOR'",x.statement);const expr=x.location==='interaction'?'$text[1]':'$text';steps.push(`if instr(${expr},'QA_ACTOR') ! 1 or instr(${expr},'이성을 잃지 않고 능숙하게 괴물을 다룬다.') = 0 or instr(${expr},'획득한 안개 괴물 정액: 7') = 0: msg 'JO9_QA_ASSERT_MILKING_INTERPOLATION' & exit`);}
const marker='JO9_QA_MILKING_literals_COMPLETE';steps.push("msg '"+marker+"'");const head=c.parse(raw).lines.slice(0,4);head[3]=c.shift('1',-5);const lines=[...head,c.shift('Start',-5),'',c.shift(steps.join('\r\n'),-5),c.shift('0',-5),''];const probe=Buffer.from(lines.join('\r\n'),'utf16le');qa.inspectWorld(probe);fs.writeFileSync(native+'/literals.qsp',probe);fs.writeFileSync(native+'/plan.json',JSON.stringify([{name:'literals',file:native+'/literals.qsp',marker,checkpoint:'Eight exact production success assignments; interpolation and role-name checks'}],null,2));
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),patch.before_sha256);console.log(JSON.stringify({before:patch.before_sha256,after:patch.after_sha256,edits:edits.length,backup,candidate:root+'/candidate.qsp'}));
