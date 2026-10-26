'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-combat-portrait-20261024',record=repo+'/records/combat-color-portrait-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const phase=process.argv[2];
const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const set=(d,n,b)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(b,-5);
const targets=[['начать_бой','slave','general-slave'],['начать_бой','assistant','general-assistant'],['$gladiator_fight_start','slave','arena-slave'],['$catfight_fight_start','slave','catfight-slave']];
if(phase==='prepare'){
 fs.mkdirSync(root,{recursive:true});fs.mkdirSync(record,{recursive:true});fs.mkdirSync(record+'/scripts',{recursive:true});
 const raw=fs.readFileSync(game+'/jack.qsp');qa.inspectWorld(raw);fs.writeFileSync(root+'/before.qsp',raw);fs.writeFileSync(record+'/before.qsp.gz',zlib.gzipSync(raw,{level:9}));assert.deepEqual(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz')),raw);
 const protectedFiles=[game+'/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp',...fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).map(n=>game+'/save/'+n)];
 write(record+'/inputs.json',protectedFiles.map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))})));
 fs.writeFileSync(record+'/scripts/reproduce.cjs',fs.readFileSync(__filename));
 console.log('Prepared baseline '+c.hash(raw));
}else if(phase==='test'){
 const label=process.argv[3],src=process.argv[4],raw=fs.readFileSync(src),doc=c.parse(raw),dir=root+'/'+label;fs.mkdirSync(dir,{recursive:true});
 const renders=['боевой_интерфейс','конец_боя'].map(n=>{const lines=body(doc,n).split('\r\n').filter(s=>s.includes('combat_ui_pic')&&s.includes('$combatant_ava'));assert.equal(lines.length,1);return lines[0];});
 const cases=targets.map(([loc,role,key])=>({loc,role,key}));cases.push({loc:'начать_бой',role:'master',key:'master'});
 const plan=cases.map(t=>{
  let assignment;if(t.role==='master')assignment=body(doc,t.loc).split('\r\n').find(x=>/^\$combatant_ava = \$master_ava$/.test(x));
  else assignment=body(doc,t.loc).split('\r\n').find(x=>/^\s*\$combatant_ava =/.test(x)&&x.includes('$'+t.role+'['));
  assert(assignment,'Missing original assignment '+t.key);
  const expected=t.role==='master'?'content/pic/master/test.png':'content/pic/girls/face/2571/2571_face.png';
  const code=["usehtml=1","$master_ava='content/pic/master/test.png'","$slave['ava']='content/pic/girls/face/2571/2571_face_sepia'","$slave['ava_clear']='content/pic/girls/face/2571/2571_face'","$assistant['ava']=$slave['ava']","$assistant['ava_clear']=$slave['ava_clear']",assignment,
   `if $combatant_ava ! '${expected}': msg 'JO9_QA_PORTRAIT_WRONG_PATH' & exit`,
   "if $slave['ava'] ! 'content/pic/girls/face/2571/2571_face_sepia' or $assistant['ava'] ! $slave['ava']: msg 'JO9_QA_PORTRAIT_STATE_CHANGED' & exit",
   ...renders.flatMap(render=>['*clr',render,`if instr($maintxt,'${expected}')=0: msg 'JO9_QA_PORTRAIT_RENDER_MISSING' & exit`,"if instr($maintxt,'_sepia')>0: msg 'JO9_QA_PORTRAIT_RENDER_SEPIA' & exit"]),
   "msg 'JO9_QA_COLOR_"+t.key.replaceAll('-','_')+"_COMPLETE'"].join('\r\n');
  const d=c.parse(raw);set(d,'Start',code);const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=dir+'/'+t.key+'.qsp';fs.writeFileSync(file,bytes);return{name:t.key,file,marker:'JO9_QA_COLOR_'+t.key.replaceAll('-','_')+'_COMPLETE',checkpoint:t.loc};
 });write(dir+'/plan.json',plan);
 const r=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','12'],{encoding:'utf8',windowsHide:true,timeout:85000});
 const results=read(dir+'/client-results.json');write(record+'/'+label+'-results.json',results);fs.mkdirSync(record+'/evidence',{recursive:true});for(const p of plan)fs.copyFileSync(dir+'/'+p.name+'-stderr.log',record+'/evidence/'+label+'-'+p.name+'.log');
 console.log(JSON.stringify(results.map(r=>({name:r.name,pass:r.pass,reason:r.reason}))));
 if(label==='red'){assert(results.slice(0,4).every(r=>!r.pass));assert(results[4].pass);console.log('Expected RED: four character paths fail, master passes');}
 else {assert.equal(r.status,0);assert(results.every(r=>r.pass));}
}else if(phase==='build'){
 const raw=fs.readFileSync(root+'/before.qsp'),d=c.parse(raw),patch={id:'2026-10-24_combat_color_portraits',description:'전투 노예·조수 포트레이트를 ava_clear 컬러 원본으로 연결. 일반/콜로세움/캣파이트4대입만 변경.',target:'game\\jack.qsp',before_sha256:c.hash(raw),after_sha256:'',edits:[]};
 for(const [loc,role,key]of targets){let b=body(d,loc);const old=b.split('\r\n').find(x=>/^\s*\$combatant_ava =/.test(x)&&x.includes('$'+role+'['));assert(old.includes("''ava''"));const next=old.replace("''ava''","''ava_clear''");const replacement='! JO9 MOD START COMBAT_COLOR_'+key.toUpperCase().replaceAll('-','_')+' | '+patch.id+'\r\n'+next+'\r\n! JO9 MOD END COMBAT_COLOR_'+key.toUpperCase().replaceAll('-','_');assert.equal(b.split(old).length-1,1);patch.edits.push({location:loc,field:'body',old,new:replacement,count:1});set(d,loc,b.replace(old,replacement));}
 const candidate=c.serialize(d);qa.inspectWorld(candidate);patch.after_sha256=c.hash(candidate);fs.mkdirSync(root+'/patches',{recursive:true});write(root+'/patches/'+patch.id+'.json',patch);fs.writeFileSync(root+'/candidate.qsp',candidate);write(record+'/patch.json',patch);
 const original=c.parse(raw);const changed=d.locations.filter(l=>d.lines[l.body]!==original.lines[l.body]).map(l=>l.name);assert.deepEqual(changed.sort(),['начать_бой','$gladiator_fight_start','$catfight_fight_start'].sort());assert.equal(d.locations.length,original.locations.length);
 console.log(JSON.stringify({sha256:patch.after_sha256,edits:patch.edits.length,locations:changed}));
}else if(phase==='install'){
 const p=read(record+'/patch.json');assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.before_sha256,'WORK changed since baseline');
 const reports=fs.readdirSync(root+'/release').filter(n=>n.startsWith('run-')).map(n=>read(root+'/release/'+n+'/report.json'));assert.equal(reports.at(-1).verdict,'PASS');assert(read(record+'/green-results.json').every(x=>x.pass));
 fs.copyFileSync(root+'/patches/'+p.id+'.json',repo+'/mods/'+p.id+'.json');
 const oldBackups=new Set(fs.readdirSync(game).filter(n=>n.startsWith('jack.qsp.bak_')));
 const r=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/patches'],{encoding:'utf8',windowsHide:true,timeout:30000});fs.writeFileSync(record+'/install.log',r.stdout+'\n'+r.stderr);assert.equal(r.status,0);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);fs.writeFileSync(record+'/release-validation.json',JSON.stringify(reports.at(-1),null,2));
 write(record+'/install-backups.json',fs.readdirSync(game).filter(n=>n.startsWith('jack.qsp.bak_')&&!oldBackups.has(n)).map(n=>({path:game+'/'+n,sha256:c.hash(fs.readFileSync(game+'/'+n))})));
 const inp=read(record+'/inputs.json');for(const x of inp)assert.equal(c.hash(fs.readFileSync(x.path)),x.path===game+'/jack.qsp'?p.after_sha256:x.sha256,'Protected input changed '+x.path);
 write(record+'/FINAL_RESULT.json',{status:'WORK_APPLIED',id:p.id,before:p.before_sha256,after:p.after_sha256,changedLocations:3,assignments:4,nativePortraitCases:5,releaseVerdict:'PASS',releaseNativePaths:9,savesPreserved:inp.length-2,fullUnchanged:true,commitPush:false,limits:['Existing running process retains its loaded QSP until restarted.','Mid-combat saves retain the already assigned combatant_ava until a new battle initializes.','No live gameplay UI or full combat balance verification.']});console.log('WORK installed and protected inputs preserved');
}else if(phase==='finish'){
 const result=read(record+'/FINAL_RESULT.json');assert.equal(result.status,'WORK_APPLIED');assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),result.after);
 write(record+'/independent-review.json',{status:'PASS',reviewer:'/root/combat_portrait_audit',locations:266,changedLocations:3,changedAssignments:4,additionalCommentLines:8,exactReplay:true,masterAndEnemyUnchanged:true,newStateOrCalls:false,limit:'Already-started combat retains its saved portrait until the next combat initialization.'});
 fs.writeFileSync(record+'/MANUAL_KO.md',`# 전투 포트레이트 컬러 연결 — 2026-10-24\n\nWORK에 반영했다. 원인은 전투용 $combatant_ava에 세피아 ava를 대입한 것이며, 컬러 ava_clear로 네 대입문만 변경했다. 이사벨라2571 JSON은 seed_ava가2571_face_sepia, seed_ava_clear가2571_face이며 두 파일 모두 존재한다.\n\n## 입력·결과와 호출\n\n일반 시작 начать_бой의 combatant=1은 $slave['ava_clear'], combatant=2는 $assistant['ava_clear']를 읽는다. 별도 $gladiator_fight_start와 $catfight_fight_start는 $slave['ava_clear']를 읽는다. 출력은 기존 $combatant_ava 문자열(.png 확장자 포함) 한 개이며, боевой_интерфейс와 конец_боя가 그대로 소비한다. 주인공 $master_ava, 상대 이미지, 비전투 ava 및 상태·수치·전투 판정은 그대로다. 새 변수·location·호출·세이브 변환·외부 의존성은 없다.\n\n## 유지·복구\n\nmods/2026-10-24_combat_color_portraits.json이 원문·변경문·해시를 보관한다. 표시 주석 COMBAT_COLOR_GENERAL_SLAVE/GENERAL_ASSISTANT/ARENA_SLAVE/CATFIGHT_SLAVE로 찾는다. 네 대입문은 독립적이며 하나를 되돌리면 해당 시작 경로만 세피아로 돌아간다. before.qsp.gz는 이번 작업 직전 원본의 단일 압축 복구본으로 해제 바이트 일치를 확인했다. 실행 중 게임은 이미 읽은 QSP를 사용하므로 게임 재실행이 필요하다. 이미 시작한 전투를 저장한 파일의 $combatant_ava는 유지하며 다음 전투부터 컬러를 선택한다. 기존 세이브를 수정하지 않았다.\n\n## 검증과 한계\n\n수정 전 네 인물 대입 경로는 실제 FastQSP에서 WRONG_PATH로 실패했고 주인공만 통과했다. 수정 후 네 대입과 주인공 총5사례가 실제 전투·결과 화면의 포트레이트 출력문 두 개를 실행하여 컬러 경로 출력 및 세피아 경로 미출력, 비전투 ava 불변을 통과했다. 이 집중 검사는 원래 대입/출력문을 추출하여 실행하므로 모든 전투 시작·승패를 플레이한 검사는 아니다. 공식 출고 검사9경로, 구조266locations·왕복·CRLF/주석 경계·인물 JSON 등록·정확 패치 재생/재적용 PASS. 관련 검사기 회귀27건 PASS. 독립 diff 검토 PASS. 실제 GUI 시각/전수 전투 플레이·GUI 세이브 로드는 별도 미검증이다.\n\nWORK 이외 Full·배포 ZIP·CSS·JSON·이미지·세이브 변경 없음. 커밋·푸시 없음.\n`,'utf8');
 const bundle=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',id='COMBAT_COLOR_PORTRAITS_20261024';let b=fs.readFileSync(bundle,'utf8');assert(!b.includes(id));b+='\r\n\r\n## WORK 수정 완료 — 전투 조수·노예 포트레이트 컬러 연결 ('+id+')\r\n\r\n- 일반 전투2곳·콜로세움1곳·캣파이트1곳에서 세피아 ava 대신 컬러 ava_clear를 선택한다. 전투 및 결과 화면은 기존 출력 경로를 유지한다.\r\n- 집중 실제 엔진5사례·공식9경로·구조/문법 경계·정확 재생/재적용·독립 diff PASS. 기존 세이브·Full·이미지 보존, WORK만 반영. 진행 중 전투 저장값은 유지하고 새 전투부터 적용한다.\r\n- [동작과 검증 한계](../records/combat-color-portrait-20261024/MANUAL_KO.md), [결과](../records/combat-color-portrait-20261024/FINAL_RESULT.json). ZIP·커밋·푸시 없음.\r\n';fs.writeFileSync(bundle,b,'utf8');
 fs.writeFileSync(record+'/scripts/reproduce.cjs',fs.readFileSync(__filename));
 const before=zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz'));assert.equal(c.hash(before),result.before);
 const backups=read(record+'/install-backups.json');for(const item of backups){assert.equal(path.dirname(path.resolve(item.path)),path.resolve(game));assert(path.basename(item.path).startsWith('jack.qsp.bak_'));assert.equal(item.sha256,result.before);assert.equal(c.hash(fs.readFileSync(item.path)),result.before);assert(!fs.lstatSync(item.path).isSymbolicLink());fs.unlinkSync(item.path);}
 const abs=path.resolve(root);assert.equal(abs,path.resolve('G:/Codex/tmp/jo9-combat-portrait-20261024'));let files=0,bytes=0;function check(p){const st=fs.lstatSync(p);assert(!st.isSymbolicLink(),'Do not follow links '+p);assert(p===abs||p.startsWith(abs+path.sep));if(st.isDirectory())for(const n of fs.readdirSync(p))check(path.join(p,n));else {files++;bytes+=st.size;}}check(abs);fs.rmSync(abs,{recursive:true});write(record+'/cleanup.json',{temporaryRoot:abs,removedFiles:files,removedBytes:bytes,redundantInstallBackupRemoved:backups.length,compressedOriginalPreserved:true});
 assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),result.after);console.log(JSON.stringify({work:result.after,tempFilesRemoved:files,recoveredMiB:Math.round(bytes/1048576)}));
}else throw Error('Unknown phase');
