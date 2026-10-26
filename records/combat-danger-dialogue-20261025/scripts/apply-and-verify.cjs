'use strict';
const fs=require('node:fs'),z=require('node:zlib'),a=require('node:assert/strict'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/combat-danger-dialogue-20261025',tmp='G:/Codex/tmp/jo9-fog-danger-dialogue-20261025';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const id='2026-10-25_fog_danger_dialogue',read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),cr=s=>s.replace(/\r?\n/g,'\r\n');
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(cr(s),-5);
const spec=read(rec+'/drafts.json'),phase=process.argv[2];
function saveScript(){const dest=rec+'/scripts/apply-and-verify.cjs';if(fs.existsSync(dest)&&fs.realpathSync(dest)===fs.realpathSync(__filename))return;fs.copyFileSync(__filename,dest);}
function protectedFiles(){return [game+'/jack.qsp',game+'/css/base.css',game+'/FastQSP.ini',game+'/../FastQSP.ini','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).map(n=>game+'/save/'+n)].map(path=>({path,sha256:c.hash(fs.readFileSync(path))}));}
function checkProtected(installed=false){for(const f of read(rec+'/application-inputs.json'))if(f.path!==game+'/jack.qsp'||!installed)a.equal(c.hash(fs.readFileSync(f.path)),f.sha256,f.path);}
if(phase==='prepare'){
 a(!fs.existsSync(tmp),'Task temp directory already exists');fs.mkdirSync(tmp+'/patches',{recursive:true});fs.mkdirSync(rec+'/scripts',{recursive:true});fs.mkdirSync(rec+'/evidence',{recursive:true});
 const raw=fs.readFileSync(game+'/jack.qsp');a.equal(c.hash(raw),spec.sourceSha256);a.deepEqual(c.serialize(c.parse(raw)),raw);qa.inspectWorld(raw);fs.writeFileSync(tmp+'/before.qsp',raw);fs.writeFileSync(rec+'/application-before.qsp.gz',z.gzipSync(raw,{level:9}));a.deepEqual(z.gunzipSync(fs.readFileSync(rec+'/application-before.qsp.gz')),raw);write(rec+'/application-inputs.json',protectedFiles());
 const plan='# 안개 전투 위험도 대사 적용 계획\n\nGoal: 승인된15조우 문구를 전투 선택 전 기존 설명에 연결한다.\nArchitecture: interaction_city의15개 기존 대사 리터럴만 편집한다. 새 함수·저장키·조건·UI는 없다.\nTech: QSP 선언형 패치/기존 적용기/실제 FastQSP.\nSpec: records/combat-danger-dialogue-20261025/drafts.json; 사용자2026-10-25 승인.\n\n제약: 안개경계61101~61115만. 투기장/콜로세움/캣파이트 제외. 원래 묘사·고블린2/3치환·가르시드HTML·선택지·능력치·세이브 보존. WORK만,커밋푸시/Full/ZIP 금지. 오래된 조우 화면의 저장된 문구 캐시는 재작성하지 않는다.\n\n- [ ] 최신WORK 정확왕복·압축복구본·76세이브/기타입력 해시 보존.\n- [ ] 승인문구15개만 추가;고블린 치환식은 보존,가르시드는div안쪽. 전체역변환으로 무관코드/모든투기장불변 증명.\n- [ ] 실제 조우16변형→기존shop_general 전체렌더:문구가선택지보다앞/전투미시작/자금AP보존/중복없음 확인.\n- [ ] 공식9경로·문법구조·패치정확재생/멱등성·독립검토.\n- [ ] 기존적용기로WORK반영·해시대조·설명서/작업묶음갱신·임시본정리.\n\nPre-flight: 문구15개는16런타임변형으로소비됨.고블린치환식추가편집불필요.공용배열14의오크/가르시드는별도문구로지정.\n';
 fs.writeFileSync(rec+'/APPLICATION_PLAN_KO.md',cr(plan));fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-25-fog-danger-dialogue.md',cr(plan));saveScript();console.log(JSON.stringify({prepared:true,baseline:c.hash(raw),protectedFiles:protectedFiles().length}));
}else if(phase==='restore'){
 fs.mkdirSync(tmp+'/patches',{recursive:true});const raw=z.gunzipSync(fs.readFileSync(rec+'/application-before.qsp.gz'));a.equal(c.hash(raw),spec.sourceSha256);fs.writeFileSync(tmp+'/before.qsp',raw);console.log('Restored isolated baseline; WORK untouched');
}else if(phase==='build'){
 const raw=fs.readFileSync(tmp+'/before.qsp'),baselineDoc=c.parse(raw),d=c.parse(raw),before=get(d,'interaction_city'),lines=before.split('\r\n'),edits=[];
 for(const draft of spec.drafts){
  for(const t of draft.targets)a.equal(c.hash(Buffer.from(lines[t.line-1],'utf8')),t.originalLineSha256,'approved original line '+t.line);
  const targets=draft.targets.filter(t=>/^\s*\$sp_text\[\d+\]\s*=\s*'/.test(lines[t.line-1]));a.equal(targets.length,1);
  const t=targets[0],old=lines[t.line-1],lits=c.literals(old);a.equal(lits.length,1);const lit=lits[0];a.equal(lit.quote,"'");a(!draft.text.includes("'"));a(!lit.text.includes(draft.text));
  const insertion=lit.text.endsWith('</div>')?lit.end-6:lit.end;
  const newLine=old.slice(0,insertion)+' '+draft.text+old.slice(insertion),tag='FOG_DANGER_'+draft.event;
  const replacement='! JO9 MOD START '+tag+' | '+id+'\r\n'+newLine+'\r\n! JO9 MOD END '+tag;
  a.equal(before.split(old).length-1,1);edits.push({location:'interaction_city',field:'body',old,new:replacement,count:1,patchId:tag});
 }
 let after=before;for(const e of edits)after=after.replace(e.old,e.new);let restored=after;for(const e of edits)restored=restored.replace(e.new,e.old);a.equal(restored,before,'Exact body reverse');set(d,'interaction_city',after);const candidate=c.serialize(d);qa.inspectWorld(candidate);a.equal(d.locations.length,baselineDoc.locations.length);const final=c.parse(candidate);for(const l of d.locations)if(l.name!=='interaction_city')a.equal(get(final,l.name),get(baselineDoc,l.name));
 for(const x of spec.drafts)a.equal(after.split(x.text).length-1,1,'unique hint '+x.event);
 fs.writeFileSync(tmp+'/candidate.qsp',candidate);const patch={id,description:'사용자승인:안개경계15조우의원문을보존하며위험도/상성힌트추가.전투선택전기존대사만수정.투기장/콜로세움/캣파이트/수치/선택지/세이브불변.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits};write(rec+'/application-patch.json',patch);write(tmp+'/patches/'+id+'.json',patch);
 write(rec+'/static-application-check.json',{status:'PASS',locations:d.locations.length,changedBodies:['interaction_city'],changedNarrativeLiterals:edits.length,runtimeVariants:16,exactReverse:true,allOtherLocationsUnchanged:true,goblinCountReplacementPreserved:true,arenaColosseumCatfightUnchanged:true,newLocations:0,newPersistentKeys:0});
 saveScript();console.log(JSON.stringify({built:true,before:patch.before_sha256,after:patch.after_sha256,narrativeLiterals:edits.length,runtimeVariants:16}));
}else if(phase==='focus'){
 const dir=tmp+'/focus';fs.mkdirSync(dir,{recursive:true});fs.cpSync(game+'/json',dir+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const d=c.parse(fs.readFileSync(tmp+'/candidate.qsp')),prime=qa.primeState(sc.parse(fs.readFileSync(game+'/save/1.sav'))).code,cases=[];
 for(const x of spec.drafts){cases.push({...x,day:x.event===61112?2:1,count:x.event===61104?4:x.event===61105?3:x.event===61106?4:x.event===61110?5:x.event===61112?2:x.event===61115?5:1});if(x.event===61112)cases.push({...x,day:1,count:3});}
 let step="qa_step += 1\nif qa_step > 16: msg 'JO9_QA_FOGDANGER_encounters_COMPLETE' & exit\n*clr\n$place='edge_patrol'\nis_home=0\ncolosseum_fight=0\nsnk_room_target=0\nget_weapon=0\nmaster_energy=5\nslave['energy']=4\nassistant['energy']=4\nsparks=1234\ncombatant=77\n$итог_боя='QA_NOT_SELECTED'\ncity_already_done_ever[611]=0\n";
 cases.forEach((x,i)=>{step+=`if qa_step = ${i+1}:\n interaction_city=${x.event}\n day=${x.day}\n qa_expected_count=${x.count}\n $qa_hint='${x.text}'\nend\n`;});step+="gt 'interaction_city'";
 set(d,'Start',"usehtml=1\n"+prime+"\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\n$onnewloc=''\n$counter=''\nsound_on=0\nqa_step=0\nqa_checks=0\ngt 'qa_fog_step'");
 function add(n,s){d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift(n,-5),c.shift('',-5),c.shift(cr(s),-5),c.shift('0',-5));d.locations=c.parse(c.serialize(d)).locations;}
 add('qa_fog_step',step);
 let checks=0;const check=(test,tag)=>{checks++;return `qa_checks += 1\nif (${test})=0: msg 'FAIL_FOGDANGER_${tag}_<<qa_step>>' & exit\n`;};
 let tail='\n';tail+=check('instr($sp_text[sp_txt],$qa_hint)>0','PREP_HINT');tail+=check('instr($maintxt,$qa_hint)>0','RENDER_HINT');tail+=check('instr($maintxt,\'<div id="jo9_scene_menu"\')>instr($maintxt,$qa_hint)','BEFORE_CHOICES');tail+=check("instr($text_display,'혼자 전투에 돌입한다')>0",'EXISTING_FIGHT_CHOICE');tail+=check("master_energy=5 and slave['energy']=4 and assistant['energy']=4 and sparks=1234",'NO_CHARGE');tail+=check("combatant=77 and $итог_боя='QA_NOT_SELECTED'",'NO_COMBAT');tail+=check('количество_врагов=qa_expected_count','ENEMY_COUNT');tail+="if interaction_city=61115:\n"+check("instr($sp_text[sp_txt],$qa_hint)<instr($sp_text[sp_txt],'</div>')",'GARSID_DIV')+'end\n';
 for(const x of spec.drafts)tail+=`if interaction_city ! ${x.event}:\n`+check(`instr($maintxt,'${x.text}')=0`,'NO_OTHER_'+x.event)+'end\n';
 tail+="gt 'qa_fog_step'";set(d,'shop_general',get(d,'shop_general')+tail);
 const failTargets=['начать_бой','$gladiator_fight_start','$catfight_fight_start','colosseum_fight'];for(const n of failTargets)if(d.locations.some(l=>l.name===n))set(d,n,"msg 'FAIL_FOGDANGER_PREMATURE_COMBAT'\nexit");
 const raw=c.serialize(d);qa.inspectWorld(raw);fs.writeFileSync(dir+'/encounters.qsp',raw);write(dir+'/plan.json',[{name:'encounters',file:dir+'/encounters.qsp',marker:'JO9_QA_FOGDANGER_encounters_COMPLETE',checkpoint:'Native 15 fog encounters/16 variants, rendered before choice without starting combat'}]);
 const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','35'],{encoding:'utf8',windowsHide:true,timeout:45000});
 const results=read(dir+'/client-results.json'),log=new TextDecoder('euc-kr').decode(fs.readFileSync(dir+'/encounters-stderr.log')),failure=(log.match(/FAIL_FOGDANGER_[^"\r\n]+/)||[])[0];fs.copyFileSync(dir+'/encounters-stderr.log',rec+'/evidence/native-encounters.log');write(rec+'/native-encounters-results.json',{cases:cases.length,expectedChecks:16*7+1+16*14,exit:run.status,results,failure,limits:'Diagnostic Start/step loop plus final native shop_general assertions; pre-choice combat endpoints fail if invoked. No GUI clicks/save loading.'});a.equal(run.status,0,failure);a.equal(results.length,1);a(results[0].pass,failure);checkProtected();console.log(JSON.stringify({native:'PASS',cases:16,checks:337}));
}else if(phase==='stage'){
 checkProtected();const patch=read(rec+'/application-patch.json');const reports=fs.readdirSync(tmp+'/release').map(n=>tmp+'/release/'+n+'/report.json').filter(fs.existsSync).map(read);const report=reports.find(r=>r.verdict==='PASS'&&r.checks.find(x=>x.name==='inputs-readable').detail.candidate===patch.after_sha256);a(report,'Official release PASS missing');a(read(rec+'/native-encounters-results.json').results.every(x=>x.pass));fs.copyFileSync(report.output+'/report.json',rec+'/application-release-report.json');for(const p of report.client.probes){const f=report.output+'/client/'+p.name+'-stderr.log';if(fs.existsSync(f))fs.copyFileSync(f,rec+'/evidence/client-'+p.name+'.log');}
 fs.copyFileSync(rec+'/application-patch.json',repo+'/mods/'+id+'.json');console.log(JSON.stringify({staged:true,candidate:patch.after_sha256}));
}else if(phase==='finish'){
 const patch=read(rec+'/application-patch.json'),work=fs.readFileSync(game+'/jack.qsp');a.deepEqual(work,fs.readFileSync(tmp+'/candidate.qsp'));a.equal(c.hash(work),patch.after_sha256);checkProtected(true);
 const result={status:'WORK_APPLIED_UNRELEASED',date:'2026-10-25',id,before:patch.before_sha256,after:patch.after_sha256,locations:c.parse(work).locations.length,changedLocation:'interaction_city',narrativeLiterals:15,runtimeVariants:16,arenaColosseumCatfightChanged:false,newLocations:0,newPersistentKeys:0,combatMechanicsChanged:false,officialProbes:9,nativeCases:16,nativeAssertions:337,savesPreserved:read(rec+'/application-inputs.json').filter(x=>/\.sav$/i.test(x.path)).length,commit:false,push:false,Full:false,ZIP:false,guiPlayed:false};write(rec+'/APPLICATION_RESULT.json',result);
 const manual=`# 안개경계 위험도 대사 — WORK 적용

사용자가 2026-10-25 승인한 문구를 안개경계 61101~61115의 기존 상황 묘사에 짧게 연결했다. 거대 안개 괴물은 위압감을, 와그·늑대인간·리치·오우거는 실제 상성의 단서를 담는다. 승인 원고는 DRAFT_KO.md와 drafts.json이다.

## 변경과 호출 관계

패치 ${id}. interaction_city의 기존 sp_text 대사 리터럴 15개만 편집했다. 새 함수·조건·로케이션·저장키·UI·세이브 변환은 없다. 기존 조우 → shop_general의 대사 HTML → 기존 전투/물러남 선택지 순서를 그대로 사용한다. 전투를 선택한 뒤에만 보이는 문구가 아니다. 기존 배경·선택지·인물·피해·승패·상금·행동력도 그대로다.

고블린은 기본 대사 하나를 편집하면 2명/3명 두 변형에 적용된다. 원래 인원수 치환식은 바꾸지 않았다. 가르시드의 힌트는 기존 85% div 안에 연결했다. 오크와 가르시드는 배열번호 14만 공유하며, 각 조우의 원래 문구는 서로 다르다. 그린치의 캐시 구제 경로와 투기장·콜로세움·캣파이트는 변경하지 않았다.

기존 함수의 입력·출력·호출 관계는 변함없다. 원래 조우에 들어갈 때 설명이 sp_text에 할당된다. 따라서 이미 조우 설명 화면에서 저장한 옛 세이브는 저장 당시 문구를 유지할 수 있고, 새 조우부터 갱신된다. 캐시와 기존 세이브를 강제로 재작성하지 않는다. 기능을 제거하려면 이번 패치의 old 문구로 되돌리면 되며 별도 의존성이나 정리할 키는 없다.

## 검증

272개 로케이션 중 interaction_city 본문만 다르다. 승인 문구와 패치 주석을 역변환하면 적용 전 파일과 정확히 같으므로, 전투 산식과 투기장·콜로세움·캣파이트 대사/진입 코드 및 나머지 문자열이 보존됨을 확인했다.

실제 FastQSP에서 원래 조우 16변형 → shop_general 전체 렌더의 337조건 검사가 통과했다. 힌트가 선택지 HTML보다 앞에 있고 원래 전투 선택지가 존재하며, 전투가 시작되지 않았고 자금·행동력이 소모되지 않았음을 확인했다. 고블린 인원수, 다른 조우 힌트 혼입 방지, 가르시드 태그 내부 배치도 확인했다.

공식 9경로, 파일 구조·줄바꿈·인물 JSON 1126개, 정확한 패치 재생과 재적용 검사가 PASS다. 현재 버전 HOME 테스트 세이브를 사용했다. 오래된 1.sav의 버전 알림과 진단본의 조건문 표기는 검사 환경에서만 해결했으며 제품 코드는 고치지 않았다. 세부 내용은 diagnostic-resolution.json에 있다. 기존 세이브 ${result.savesPreserved}개와 Full·설정·CSS의 해시도 보존됐다.

실제 마우스 플레이, 네이티브 화면 배치, 사용자 세이브 GUI 로드의 전수 검증은 하지 않았다. 전체 동적 QSP 문법의 정식 증명도 아니다.

WORK만 적용했다. Full·배포 ZIP·커밋·푸시는 하지 않았다. 최소 복구본 application-before.qsp.gz, 선언형 application-patch.json, 재현용 scripts/apply-and-verify.cjs와 핵심 결과를 보존한다. 재현은 restore → build → focus 순서로 격리본만 만든다.
`;fs.writeFileSync(rec+'/APPLICATION_MANUAL_KO.md',cr(manual));
 for(const p of [rec+'/APPLICATION_PLAN_KO.md',repo+'/docs/superpowers/plans/2026-10-25-fog-danger-dialogue.md'])fs.writeFileSync(p,fs.readFileSync(p,'utf8').replaceAll('- [ ]','- [x]'));
 const heading='FOG_DANGER_DIALOGUE_APPLIED_20261025',note='\r\n\r\n## WORK 적용 — 안개전투 준비 대사 ('+heading+')\r\n\r\n승인된15조우/16변형위험도·상성힌트를기존조우설명에연결했다.전투선택전표시,투기장/콜로세움/캣파이트제외.새함수/영구키0·수치/조건/선택지/세이브불변.실제엔진16변형337조건·공식9경로·문법구조/정확재생/재적용PASS.기존세이브보존,WORK만미배포·Full/ZIP/커밋푸시없음.[설명과한계](../records/combat-danger-dialogue-20261025/APPLICATION_MANUAL_KO.md),[결과](../records/combat-danger-dialogue-20261025/APPLICATION_RESULT.json).\r\n';for(const p of [repo+'/docs/SESSION_HANDOFF_INDEX.md',repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md'])if(!fs.readFileSync(p,'utf8').includes(heading))fs.appendFileSync(p,note);
 const p=repo+'/records/deferred-discussions-20261024/index.json',idx=read(p),row=idx.notDeferred.find(x=>x.title==='전투 전 적 위험도 대사');a(row);row.status='APPLIED';row.note='2026-10-25사용자승인:안개경계15조우/16변형대사만WORK반영.투기장 제외, 상대 승산 계산 없음. records/combat-danger-dialogue-20261025/APPLICATION_RESULT.json. 원본D01수리는보류유지.';fs.writeFileSync(p,JSON.stringify(idx,null,2)+'\n');
 saveScript();console.log(JSON.stringify(result));
}else throw Error('Use prepare / restore / build / focus / stage / finish');
