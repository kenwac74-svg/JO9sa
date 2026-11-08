'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const temp='G:/Codex/tmp/goal-summary-20261108',id='2026-11-08_uncolored_goal_summaries';
const summaries={
  9224:'주안수가 맡긴 노예를 괴물 같은 모습으로 바꾸고, 천사의 목소리를 갖추게 하라.',
  301160:'자스민을 연회에서 로라를 보좌할 수 있도록 준비시켜라. 구강 기술과 연기력·지적 능력, 인내심과 동성 취향을 길러 임무에 집중하게 하고, 자신의 흥분을 억제할 수 있게 해야 한다.',
  15311:'아레나 챔피언 노예를 중앙집회장의 아라무스 경에게 데려가라. 보상은 황소 반지다.',
  15321:'콜로세움 경주에서 우승한 노예를 중앙집회장의 부셴에게 데려가라. 보상은 그가 만드는 특별한 목걸이다.',
  15331:'인간 노예의 성적 기술 전반을 완벽하게 훈련해 중앙집회장의 가르시드에게 데려가라. 외모와 다른 기술은 상관없다. 보상은 마법 장신구다.',
  15341:'살아 있고 건강하며 완전히 성장한 안개 괴물을 발리오스에게 넘겨라. 덜 자랐거나 수명이 다한 괴물은 받지 않는다. 보상은 큰까마귀 관이다.',
  15351:'빈민가 밀수꾼에게서 펠리시티를 구해 120일 안에 S+ 첩이자 경주 그랜드 챔피언으로 길러 데려가라.<br>완전한 복종, 임신, 높은 성욕, 색정광·노출증·변태·양성애 및 길드 성적 기술 숙련이 필요하다.<br>지정 식단과 매일의 시중·훈련, 포이즌의 모든 신체 개조와 보 아저씨의 모든 문신, 지정 장신구 착용도 요구한다.<br>보상은 미스릴 갑옷이다.',
  15361:'투기장과 경주 모두에서 활약할 수 있는 아름다운 노예를 그라쿠스에게 데려가라. 아레나 챔피언의 실력과 경주 우승 능력을 함께 원한다. 보상은 힘을 높이고 질병과 저주를 막아 주는 마법 부적이다.',
  1541:'베네라의 아름다움을 해치지 않고 반항심을 꺾어, 가이우스에게 복종하는 상태로 데려가라. 보상은 그의 아내 펠라게야다.',
  1551:'가이우스에 대한 복수를 도울 수 있도록 펠라게야를 바르바르 왕에게 빌려주고, 대가문들이 습격에 대비하지 못하도록 협조를 얻어라. 펠라게야는 외모와 성적 기술을 갖춰야 한다. 성공하면 펠라게야를 돌려받고 그 자매도 보상으로 받는다.',
  79101:'극장의 인형들이 지키는 다른 세계로 통하는 포털의 열쇠 조각 두 개를 가져와라. 인형술사는 그 대가로 다른 세계로 가는 길을 알려 주겠다고 약속했다.'
};
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
function apply(raw,mod){const d=core.parse(raw);for(const e of mod.edits){let l=d.locations.find(x=>x.name===e.location),b=core.shift(d.lines[l.body],5);assert.equal(b.split(e.old).length-1,1);d.lines[l.body]=core.shift(b.replace(e.old,e.new),-5);}return core.serialize(d);}
function fixture(raw){
 const d=core.parse(raw),start=d.locations.find(x=>x.name==='Start');
 const s=["$onnewloc='' & $counter='' & $onobjsel='' & $ongload=''",'snk_room_target=0',"$jo9_goal_offer_brief[0]='OUTER_SCOPE'","npc_progress['Tsyuansu']=1 & npc_progress['Jafar']=1 & npc_progress['Yagishna']=1","$event['Akabur_quest']='qa-jafar' & active['qa-jafar']=12"];
 for(let q of [6,7,8,9,12,13,14,15,16,17])s.push(`$quest[${q}]='qa-${q}' & active['qa-${q}']=1`);
 for(const[scene,text]of Object.entries(summaries)){
  s.push(`$qa_goal=$func('slave_sell_chek','special_goal_detail',${scene})`,
   `if instr($qa_goal,'${text}')=0 or instr($qa_goal,'뒤로')=0: msg 'JO9_QA_GOAL_FAIL_${scene}' & exit`,
   "if $jo9_goal_offer_brief[0] ! 'OUTER_SCOPE': msg 'JO9_QA_GOAL_SCOPE_FAIL' & exit");
 }
 s.push("$Yagishna_quest[1]='[야기슈나]<br>조건 <font color=\"#008080\"><b>요리</b></font>'",
  "$qa_goal=$func('slave_sell_chek','special_goal_detail',9051)",
  "if instr($qa_goal,'<font color=\"#008080\"><b>요리</b></font>')=0: msg 'JO9_QA_COLOR_CHANGED' & exit",
  "npc_progress['Tsyuansu']=0", "$qa_goal=$func('slave_sell_chek','special_goal_detail',9224)",
  "if $qa_goal ! '': msg 'JO9_QA_GOAL_STATUS_CHANGED' & exit",
  "msg 'JO9_QA_GOALBRIEF_goal_briefs_COMPLETE'");
 d.lines[start.body]=core.shift(s.join('\r\n'),-5);let out=core.serialize(d);qa.inspectWorld(out);return out;
}
if(process.argv[2]==='prepare'){
 const inv=read(path.join(__dirname,'inventory.json')),raw=fs.readFileSync(game+'/jack.qsp'),d=core.parse(raw);assert.equal(d.hash,inv.qspHash);assert(core.serialize(d).equals(raw));
 const selected=inv.rows.filter(x=>!x.colored);assert.deepEqual(selected.map(x=>x.scene).sort((a,b)=>a-b),Object.keys(summaries).map(Number).sort((a,b)=>a-b));assert(selected.every(x=>x.hasText&&x.coloredWoman!==true));
 const l=d.locations.find(x=>x.name==='slave_sell_chek'),b=core.shift(d.lines[l.body],5);
 const mod={id,status:'APPROVED',description:'조건의 색 강조가 있는 의뢰 대사는 유지하고, 색 강조가 없는 11개 의뢰만 NPC의 요구와 보상으로 요약한다. 실제 NPC 대사·진행 조건·목록·저장 형식·CSS는 유지한다.',before_sha256:d.hash,after_sha256:'',edits:[]};
 const decl='  local $jo9_goal_offer_source, $jo9_goal_offer_title';
 mod.edits.push({location:'slave_sell_chek',field:'body',old:decl,new:'! JO9 MOD START GOAL_BRIEF_LOCAL_20261108\r\n'+decl+', $jo9_goal_offer_brief\r\n! JO9 MOD END GOAL_BRIEF_LOCAL_20261108',count:1,patchId:'GOAL_BRIEF_LOCAL_20261108'});
 for(const r of selected){let old=b.split('\r\n').find(t=>t.includes(`if jo9_goal_read_scene = ${r.scene}: $jo9_goal_offer_source`));assert(old);const patchId='GOAL_BRIEF_'+r.scene+'_20261108';let replacement=old.replace(`'${r.source}'`,"'$jo9_goal_offer_brief'")+` & $jo9_goal_offer_brief[0] = '${summaries[r.scene]}'`;mod.edits.push({location:'slave_sell_chek',field:'body',old,new:`! JO9 MOD START ${patchId}\r\n${replacement}\r\n! JO9 MOD END ${patchId}`,count:1,patchId});}
 const candidate=apply(raw,mod);qa.inspectWorld(candidate);mod.after_sha256=core.hash(candidate);
 const cd=core.parse(candidate);for(const loc of d.locations)if(loc.name!=='slave_sell_chek')assert.equal(cd.lines[loc.body],d.lines[loc.body]);
 fs.mkdirSync(temp,{recursive:false});fs.mkdirSync(temp+'/mods');fs.writeFileSync(temp+'/mods/'+id+'.json',JSON.stringify(mod,null,2)+'\n');
 fs.writeFileSync(temp+'/goal-briefs.qsp',fixture(candidate));fs.writeFileSync(temp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.copyFileSync(game+'/config.xml',temp+'/config.xml');
 fs.writeFileSync(temp+'/plan.json',JSON.stringify([{name:'goal-briefs',checkpoint:'11 summaries, colored text, scope, inactive quest',file:temp+'/goal-briefs.qsp',marker:'JO9_QA_GOALBRIEF_goal_briefs_COMPLETE'}],null,2));
 fs.writeFileSync(path.join(__dirname,'change.json'),JSON.stringify({mod,temp,selected:selected.map(r=>({scene:r.scene,title:r.title,source:r.source,summary:summaries[r.scene]})),coloredPreserved:85,structure:true,otherLocationsUnchanged:true},null,2));
 console.log(JSON.stringify({prepared:true,before:d.hash,after:mod.after_sha256,summaries:selected.length,coloredPreserved:85,temp}));
}else if(process.argv[2]==='install-source'){
 const m=read(path.join(__dirname,'change.json')),results=read(temp+'/client-results.json');assert.equal(results.length,1);assert(results[0].pass);assert.equal(core.hash(fs.readFileSync(game+'/jack.qsp')),m.mod.before_sha256);
 const target=repo+'/mods/'+id+'.json';assert(!fs.existsSync(target));fs.copyFileSync(temp+'/mods/'+id+'.json',target);console.log('Source installed after targeted engine verification.');
}else if(process.argv[2]==='finish'){
 const m=read(path.join(__dirname,'change.json')),raw=fs.readFileSync(game+'/jack.qsp');assert.equal(core.hash(raw),m.mod.after_sha256);qa.inspectWorld(raw);
 const engine=read(temp+'/client-results.json');assert(engine[0].pass);assert.equal(core.hash(fs.readFileSync(repo+'/mods/'+id+'.json')),core.hash(fs.readFileSync(temp+'/mods/'+id+'.json')));
 const verification={before:m.mod.before_sha256,after:m.mod.after_sha256,summaries:11,coloredPreserved:85,engine,structure:true,otherLocationsUnchanged:true,visualChecked:false};fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(verification,null,2));
 fs.copyFileSync(temp+'/goal-briefs-stderr.log',path.join(__dirname,'engine.log'));
 const record=repo+'/records/goal-summary-20261108';fs.mkdirSync(record,{recursive:false});for(const f of ['change.json','verification.json'])fs.copyFileSync(path.join(__dirname,f),record+'/'+f);
 const actual=fs.readdirSync(temp).sort(),expected=['FastQSP.ini','client-results.json','config.xml','goal-briefs-stderr.log','goal-briefs-stdout.log','goal-briefs.qsp','mods','plan.json'].sort();assert.deepEqual(actual,expected);
 assert.equal(fs.realpathSync(temp).replaceAll('\\','/'),temp);assert(!fs.lstatSync(temp).isSymbolicLink());assert.deepEqual(fs.readdirSync(temp+'/mods'),[id+'.json']);
 for(const f of actual.filter(f=>f!=='mods')){assert(fs.lstatSync(temp+'/'+f).isFile());fs.unlinkSync(temp+'/'+f);}fs.unlinkSync(temp+'/mods/'+id+'.json');fs.rmdirSync(temp+'/mods');fs.rmdirSync(temp);console.log(JSON.stringify({...verification,tempCleaned:true}));
}else throw Error('prepare|install-source|finish');
