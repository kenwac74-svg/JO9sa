'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',O=__dirname;
const c=require(R+'/tools/text-workshop/core.cjs'),sc=require(R+'/tools/qa/save-codec.cjs');
const crc=require('../colosseum-slave-death-save-20261029/native-helper/fastqsp-crc.cjs');
const baseline=JSON.parse(fs.readFileSync(O+'/root-snapshot.json','utf8'));
const made=JSON.parse(fs.readFileSync(O+'/created.json','utf8'));
const expected='6bb939464a7370526ced33c6b51fcb4f0b5023b94bbe1d1bd78dba6bec44398d';
for(const g of baseline.games)a.equal(c.hash(fs.readFileSync(g.path)),g.sha256,g.path+' unchanged');
a.equal(made.sourceSha256,expected);a.equal(made.sourceUnchanged,true);a.equal(made.created.length,2);
const observedChanges=[];
const installBaseline=baseline.existingSaves.map(f=>{const st=fs.statSync(G+'/save/'+f.name);if(st.size!==f.bytes||st.mtimeMs!==f.mtimeMs){a(['auto_day.sav','auto_day_end.sav','auto_decade.sav'].includes(f.name),'Unexpected existing file change: '+f.name);observedChanges.push({name:f.name,beforeBytes:f.bytes,currentBytes:st.size,beforeMtimeMs:f.mtimeMs,currentMtimeMs:st.mtimeMs,origin:'not attributed; preserve current file'});}return{name:f.name,bytes:st.size,mtimeMs:st.mtimeMs};});
function sameExisting(){for(const f of installBaseline){const st=fs.statSync(G+'/save/'+f.name);a.equal(st.size,f.bytes,f.name+' bytes');a.equal(st.mtimeMs,f.mtimeMs,f.name+' mtime');}}
sameExisting();
const value=(s,n,k)=>sc.value(s,n,k)[0];
const prepared=[];
for(const row of made.created){
 const guardian=row.id==='guardian';a(guardian||row.id==='paladin');
 const name=guardian?'TC_09_PORTAL_GUARDIAN_EVENT.sav':'TC_10_VATICAN_PALADIN_EVENT.sav';a.equal(row.name,name);
 const target=G+'/save/'+name;a(!fs.existsSync(target),'Refuse overwrite: '+target);
 const raw=fs.readFileSync(row.file),s=sc.parse(raw);a.equal(c.hash(raw),row.sha256);a.equal(raw.length,row.bytes);a(sc.serialize(s).equals(raw));
 a(crc.verify(G+'/jack.qsp',row.file).pass,'Current WORK CRC matches');
 a.equal(sc.dec(s.lines[10]),'city_screen');a.equal(sc.value(s,'place')[1],'fogs_district');
 for(const [n,v] of Object.entries({city_form:120,city_district:6,hero_choice:13,game_difficulty:0,difficulty_setting:0,cheat_fight_dif:0,master_energy:5,master_half_action:0,sparks:10000,slave_type:2579,assistant_type:2571,slave_state:1,assistant_state:1,get_weapon:0,colosseum_fight:0,exam_in_progress:0,end_of_the_day:0,end_day_phase:0,snk_room_target:0,snk_room_inventory:0,'количество_врагов':0,'бой_с_паладином':guardian?2:1,'бой_с_паладиом':0,'бой_со_стражником':0}))a.equal(value(s,n),String(v),n);
 for(const role of ['slave','assistant'])a.equal(value(s,role,'age'),'2',role+' adult');
 a.equal(sc.value(s,'ongload')[1],'$ongload');a.equal(sc.value(s,'counter')[1],'');a.equal(sc.value(s,'onnewloc')[1],'');a.equal(sc.value(s,'ongsave')[1],'');
 a.equal(sc.value(s,'code_rev')[1],'2.4.1');
 const quest=s.vars.find(v=>v.name==='QUEST').values[17][1];a(quest);a.equal(value(s,'active',quest),'2');a.equal(value(s,'npc_progress','pope'),'2');
 a(sc.value(s,'text_display')[1].includes('6217'),'Portal Zone menu is cached');
 const emptySelectors=s.vars.filter(v=>/^TC_PORTAL/.test(v.name));a(emptySelectors.length<=1);for(const v of emptySelectors){a.equal(v.name,'TC_PORTAL');a.equal(v.values.length,0);a.equal(v.idx.length,0);}
 a(!s.vars.some(v=>v.values.some(x=>/tc_portal|JO9_QA_PORTALSAVE|FAIL_PORTAL_/i.test(x[1]))),'No diagnostic script');
 const route=row.route;a.equal(route.actualCityMenuLink,true);a.equal(route.introPages,3);a.equal(route.preparation,guardian?6216:6215);a.equal(route.enemy,guardian?'strazhnik':'vatican_paladin');a.equal(route.weaponMenu,true);a.equal(row.nativeCrcMatchesHelper,true);
 const factory=made.tempRoot+'/'+row.id+'-factory.qsp',nativeRaw=fs.readFileSync(row.nativeOriginal),native=sc.parse(nativeRaw);a.equal(Number(sc.dec(native.lines[2])),crc.crc(fs.readFileSync(factory)),'Exact native factory CRC proof');
 const restored=sc.parse(raw);restored.lines[2]=native.lines[2];a(sc.serialize(restored).equals(nativeRaw),'Only world CRC changed; all native variable slots are kept');
 prepared.push({...row,target,quest17:quest,emptySelectorSlots:emptySelectors.length,allIndependentChecksPassed:true});
}
// All inputs are preflighted before writing either new destination. Existing
// saves are never opened for writing or replaced.
for(const row of prepared){fs.copyFileSync(row.file,row.target,fs.constants.COPYFILE_EXCL);a.equal(c.hash(fs.readFileSync(row.target)),row.sha256);a(crc.verify(G+'/jack.qsp',row.target).pass);fs.unlinkSync(row.file);}
sameExisting();
for(const g of baseline.games)a.equal(c.hash(fs.readFileSync(g.path)),g.sha256);
const report={status:'INSTALLED',at:new Date().toISOString(),worldSha256:expected,worldCrc:crc.crc(fs.readFileSync(G+'/jack.qsp')),files:prepared.map(x=>({file:x.target,bytes:x.bytes,sha256:x.sha256,location:'city_screen',cityForm:120,place:'fogs_district',quest17:x.quest17,paladinStage:x.paladin,route:x.route,emptySelectorSlots:x.emptySelectorSlots})),nativeCrcAlgorithmVerified:true,serializationRoundtrip:true,nativeVariableSlotsPreserved:true,existingFilesPreservedDuringInstall:installBaseline.length,observedExistingAutoSaveChangesBeforeInstall:observedChanges,productionQspUnchanged:true,fullWritten:false,originalWritten:false,guiLoadVerified:false,nativeObjectClickVerified:false,combatPlayed:false};
fs.writeFileSync(O+'/FINAL_RESULT.json',JSON.stringify(report,null,2)+'\n');
const manual='# 포털 가디언·바티칸 성기사 테스트 세이브\n\nWORK의 Jack-o-nine-tails.exe에서 불러온다. 두 파일 모두 안개 지역의 일반 메뉴이며 아직 전투 상대를 만나지 않은 상태다. 보통 난이도, 남자 주인공 잭, 행동력 5, 소지금 $10,000, 글라디우스를 준비했다. 성인 에게야가 노예, 성인 이사벨라가 조수다.\n\n| 파일 | 불러온 뒤 진행 | 확인할 내용 |\n|---|---|---|\n| TC_09_PORTAL_GUARDIAN_EVENT.sav | 포털 지대 → 도입 3쪽 → 경비와 싸운다 | 포털 가디언의 설명·전신 → 싸운다 → 무기 선택·전투 화면 |\n| TC_10_VATICAN_PALADIN_EVENT.sav | 포털 지대 → 도입 3쪽 → 성기사와 싸운다 | 바티칸 성기사의 설명·전신 → 싸운다 → 무기 선택·전투 화면 |\n\n교황의 사전 대화를 마친 테스트 상태다. 가디언 쪽은 성기사를 통과한 퀘스트 단계로 설정했다. 앞선 퀘스트 전 과정을 자연 진행한 저장은 아니며, 이벤트 진입과 전투 화면을 바로 확인하기 위한 표본이다.\n\n자동 확인: 설치된 실제 엔진으로 새 게임 초기화와 SAVEGAME, 일반 메뉴의 포털 이동 콜백, 도입 3쪽, 상대별 메뉴 콜백·전투 준비·무기 선택 화면을 확인했다. 도입 다음 버튼은 진단용 선택 입력으로 원래 분기 본문을 실행했다. 실제 마우스 클릭, 일반 exe에서의 SAV 불러오기, 전투 승패 진행과 이미지 구도는 수동 확인 항목이다. 최종 저장에는 실행되는 진단 코드를 남기지 않았고 현재 WORK QSP 체크섬과 저장 형식 왕복을 검증했다. 원본 엔진의 변수 조회를 보존하기 위해 값이 없는 진단용 이름 슬롯 한 개는 그대로 유지했다.\n\nWORK QSP·Full·원본과 기존 세이브는 수정하지 않았다.\n';
fs.writeFileSync(O+'/TEST_KO.md',manual);
const rec=R+'/records/portal-paladin-event-saves-20261102';fs.mkdirSync(rec,{recursive:true});
for(const name of fs.readdirSync(O)){const f=O+'/'+name;if(fs.statSync(f).isFile()&&/\.(?:cjs|json|log|md)$/.test(name))fs.copyFileSync(f,rec+'/'+name);}
console.log(JSON.stringify(report));
