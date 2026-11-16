const fs=require('fs'),R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',c=require(R+'/tools/text-workshop/core.cjs'),raw=fs.readFileSync(G+'/jack.qsp'),d=c.parse(raw);
const body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
if(process.argv[2]==='hits'){
 const hits=[];for(const l of d.locations){const lines=body(l.name).split('\r\n');for(let i=0;i<lines.length;i++)if(/jo9_focus|jo9_work_ethic|activity_sign/.test(lines[i]))hits.push({location:l.name,line:i+1,code:lines[i]});}
 console.log('hash',c.hash(raw),'hits',hits.length);const groups={};for(const x of hits)groups[x.location]=(groups[x.location]||0)+1;console.log(groups);
 for(const x of hits)console.log(x.location+':'+x.line+' '+x.code.slice(0,450));
}
if(process.argv[2]==='range')console.log(body(process.argv[3]).split('\r\n').slice(+process.argv[4]-1,+process.argv[5]).map((s,i)=>(+process.argv[4]+i)+': '+s).join('\n'));
if(process.argv[2]==='find'){const hits=[];for(const l of d.locations){const lines=body(l.name).split('\r\n');for(let i=0;i<lines.length;i++)if(lines[i].includes(process.argv[3]))hits.push({location:l.name,line:i+1,code:lines[i].slice(0,450)});}console.log(hits.slice(0,150));console.log('total',hits.length);}
if(process.argv[2]==='data'){
 for(const base of [R+'/tools/game-reference',G+'/modtools/game-reference']){
 const p=base+'/traits.json';if(!fs.existsSync(p))continue;const x=JSON.parse(fs.readFileSync(p,'utf8'));console.log(base,'hash',x.hash);for(const row of x.rows.filter(x=>['끈기','산만함','워커홀릭','무기력함'].includes(x.name)))console.log(JSON.stringify(row));
 }
 const out=[];for(const f of fs.readdirSync(G+'/json/slaves').filter(f=>f.endsWith('.json'))){const j=JSON.parse(fs.readFileSync(G+'/json/slaves/'+f,'utf8').replace(/^\uFEFF/,''));const keys=Object.fromEntries(Object.entries(j).filter(([k])=>/jo9_focus|jo9_work_ethic|passion_comfort|activity_sign/.test(k)));if(Object.keys(keys).length)out.push({file:f,...keys});}console.log('json inputs',out);
}
if(process.argv[2]==='modes'){
 for(const name of ['jo9_traits','#dynamic','generate_stock']){const lines=body(name).split('\r\n');console.log(name);for(let i=0;i<lines.length;i++)if((name==='jo9_traits'&&/^(if|elseif) \$args\[0\]/.test(lines[i]))||(name!=='jo9_traits'&&(/jo9_traits.*(rest|reward|generate)|reward.*jo9_traits/.test(lines[i]))))console.log((i+1)+': '+lines[i]);}
 const p=R+'/tools/game-reference/jo9-reference.html',w=G+'/modtools/game-reference/jo9-reference.html';console.log('HTML repo-WORK equal',fs.readFileSync(p).equals(fs.readFileSync(w)));
}
if(process.argv[2]==='fixture'){
 const path=require('path'),T='G:/Codex/tmp/trait-stage-audit-20261112';fs.mkdirSync(T,{recursive:true});
 const q=s=>"'"+s.replaceAll("'","''")+"'",nl=s=>s.replace(/\r?\n/g,'\r\n');let checks=0;
 let start="killall\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\nqa_failed=0\nqa_checks=0\nday=100\n";
 const check=(condition)=>{start+='qa_checks+=1\nif '+condition+': qa_failed+=1\n';checks++;};
 const rows=[];
 const variants=[['none',0,0,100,100,0],['focus',1,0,110,100,2],['distracted',-1,0,90,90,0],['work',0,1,100,100,2],['passive',0,-1,100,100,-2],['focuswork',1,1,110,100,4],['focuspassive',1,-1,110,100,0]];
 for(const[name,focus,work,xp,perf,mood]of variants){
  start+=`killvar 'slave'\nkillvar 'slave_rate'\nslave['jo9_focus']=${focus}\nslave['jo9_work_ethic']=${work}\nslave['passion_comfort']=${-work}\ngs 'jo9_traits_personality','activity','slave','work:service',0\ngs 'jo9_traits_personality','activity','slave','work:service',0\nqa_xp=func('jo9_traits_personality','xp','slave','service',100)\nqa_perf=func('jo9_traits_personality','performance','slave','',100)\nqa_mood=slave_rate['mood']\n$qa_rows[${q(name)}]=str(qa_xp)+','+str(qa_perf)+','+str(qa_mood)\n`;
  check(`qa_xp!${xp} or qa_perf!${perf} or qa_mood!${mood}`);rows.push({name,focus,work,xp,performance:perf,mood});
 }
 for(const focus of [-1,1])for(const work of [-1,1]){
  start+=`killvar 'slave'\nslave['jo9_focus']=${focus}\nqa_grant=func('jo9_traits','activity_set','slave',${work})\n`;
  check(`qa_grant!1 or slave['jo9_focus']!${focus} or slave['jo9_work_ethic']!${work}`);
  start+=`qa_allow=func('jo9_traits','allow','slave','jo9_focus',${-focus})\n`;check('qa_allow!1');
 }
 start+="killvar 'slave'\nkillvar 'slave_rate'\nslave['jo9_work_ethic']=1\nslave['passion_comfort']=-1\ngs 'jo9_traits_personality','activity','slave','work:service',0\ngs 'jo9_traits_personality','activity','slave','education:cook',0\n";check("slave_rate['mood']!2");
 start+="day+=1\nslave_rate['mood']=0\ngs 'jo9_traits_personality','activity','slave','work:service',0\n";check("slave['jo9_activity_count']!1 or slave_rate['mood']!0");
 start+="killvar 'slave'\nkillvar 'slave_rate'\nslave['jo9_focus']=1\ngs 'jo9_traits_personality','activity','slave','work:rule',1\ngs 'jo9_traits_personality','activity','slave','work:rule',1\nqa_xp=func('jo9_traits_personality','xp','slave','service',100)\n";check("qa_xp!100 or slave_rate['mood']!0");
 const massage=body('interaction').split('\r\n').slice(6331,6333).join('\r\n');
 const rest=body('interaction_result').split('\r\n').slice(1364,1374).join('\r\n');
 for(const work of [-1,1]){
  start+=`killvar 'slave'\nslave['jo9_work_ethic']=${work}\nslave['passion_comfort']=${-work}\ninteraction_reward_potence=100\n${massage}\n`;check('interaction_reward_potence!'+(work===1?50:200));
  start+="$slave_psy_status='docile'\ninteraction_reward_potence=100\n"+rest+'\n';check('interaction_reward_potence!'+(work===1?50:200));
 }
 start+="savegame 'qa.sav'\nif qa_failed>0: msg 'FAIL trait stage audit '+str(qa_failed) & exit\nmsg 'JO9_QA_TRAITSTAGE_audit_COMPLETE'\nexit";
 const locs=[['Start',start],['jo9_traits',body('jo9_traits')],['jo9_traits_personality',body('jo9_traits_personality')]],lines=['QSPGAME','','',c.shift(String(locs.length),-5)];for(const[n,s]of locs)lines.push(c.shift(n,-5),'',c.shift(nl(s),-5),c.shift('0',-5));lines.push('');const out=c.serialize({lines});require(R+'/tools/qa/release-check.cjs').inspectWorld(out);fs.writeFileSync(T+'/audit.qsp',out);fs.copyFileSync(G+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(T+'/plan.json',JSON.stringify([{name:'audit',file:T+'/audit.qsp',marker:'JO9_QA_TRAITSTAGE_audit_COMPLETE',checkpoint:'Read-only audit of actual two-axis effects, grants, day reset, fixed work exclusion and rest/massage scaling'}],null,2));fs.writeFileSync(T+'/expected.json',JSON.stringify({hash:c.hash(raw),checks,rows},null,2));console.log('Fixture',checks,'assertions');
}
if(process.argv[2]==='collect'){
 const a=require('assert/strict'),sv=require(R+'/tools/qa/save-codec.cjs'),T='G:/Codex/tmp/trait-stage-audit-20261112',D=R+'/records/trait-stage-audit-20261112';fs.mkdirSync(D,{recursive:true});
 const x=JSON.parse(fs.readFileSync(T+'/expected.json','utf8')),run=JSON.parse(fs.readFileSync(T+'/client-results.json','utf8')),save=sv.parse(fs.readFileSync(T+'/qa.sav'));a(run.every(x=>x.pass));a.equal(+sv.value(save,'qa_failed')[0],0);a.equal(+sv.value(save,'qa_checks')[0],x.checks);a.equal(c.hash(raw),x.hash);a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),x.hash);
 for(const row of x.rows){row.measured=sv.value(save,'qa_rows',row.name)[1];a.equal(row.measured,[row.xp,row.performance,row.mood].join(','));}
 const input='C:/Users/User/AppData/Local/Temp/JO9_특성배척_버그기록_20261111.md';x.planFile=input;x.planHash=c.hash(fs.readFileSync(input));x.method='Actual current jo9_traits + jo9_traits_personality in isolated native FastQSP; real rest/massage scaling snippets; no production edits';
 fs.copyFileSync(input,D+'/APPROVED_PLAN_KO.md');fs.writeFileSync(D+'/verification.json',JSON.stringify(x,null,2)+'\n');for(const name of fs.readdirSync(T))if(name.endsWith('.log')||name==='client-results.json')fs.copyFileSync(T+'/'+name,D+'/'+name);fs.copyFileSync('./trait-stage-audit.cjs',D+'/trait-stage-audit.cjs');console.log(JSON.stringify(x));
}
if(process.argv[2]==='close'){
 const a=require('assert/strict'),D=R+'/records/trait-stage-audit-20261112',v=JSON.parse(fs.readFileSync(D+'/verification.json','utf8'));a.equal(c.hash(raw),v.hash);a(fs.readFileSync('./TRAIT_STAGE_REPORT_KO.md').equals(fs.readFileSync(D+'/REPORT_KO.md')));
 const s={hash:v.hash,locations:Object.fromEntries(['jo9_traits','jo9_traits_personality'].map(n=>[n,body(n)])),massage:body('interaction').split('\r\n').slice(6331,6333).join('\r\n'),rest:body('interaction_result').split('\r\n').slice(1364,1374).join('\r\n'),weaver:body('generate_stock').split('\r\n').slice(910,914).join('\r\n')};fs.writeFileSync(D+'/source-evidence.json',JSON.stringify(s,null,2)+'\n');
 const index=R+'/docs/SESSION_HANDOFF_INDEX.md',old=fs.readFileSync(index,'utf8');fs.writeFileSync(index,'## 2026-11-12 Codex: 活動·集中特性 단계형 개편 미반영 확인\n\n[승인안 대비 반영/잔여/미정 보고](../records/trait-stage-audit-20261112/REPORT_KO.md). 최신 승인 기획 원문을 함께 보존했다. WORK479fe110은 여전히 집중/활동 두 축. 기존 하위 경험치/성과·반복기분과 활동횟수/보상배율은 있으나 네 특성 단일 보유·상위 대체·하위효과 포함·직조공20%·편집기/JSON/표의 단계형 정리는 미반영. 실제 엔진22단언으로 현재 구식 동작을 확인했으며 새 기획 구현 완료/승인안 검사 통과가 아니다. 기존 충돌/저장 이관/신규 분포는 미정, 자동승급은 범위 밖. 게임/JSON/개인SAV/Full/음원/커밋푸시 변경없음.\n\n'.replace('活動·集中特性','활동·집중 특성')+old);fs.copyFileSync('./trait-stage-audit.cjs',D+'/trait-stage-audit.cjs');console.log('Report/source evidence recorded; WORK unchanged '+v.hash);
}
