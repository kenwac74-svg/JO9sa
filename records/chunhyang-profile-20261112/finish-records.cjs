'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),cp=require('child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/chunhyang-profile-20261112',tmp='G:/Codex/tmp/chunhyang-profile-20261112',dir=repo+'/tools/game-reference';
const c=require(repo+'/tools/text-workshop/core.cjs'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\ufeff/,'')),write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),hash=p=>c.hash(fs.readFileSync(p));
const final=read(rec+'/final-prepared.json'),profile=read(rec+'/profile.json'),bg=read(rec+'/background-approved.json');
let extract=fs.readFileSync(dir+'/extract-traits.cjs','utf8');
extract=extract.replace("function categoryFor(field) {","function categoryFor(field) {\n  if (field === 'jo9_sando') return '특수특성';");
extract=extract.replace("const specific = {","const specific = {\n  '산도': ['춘향(3040번)의 전용 특성이다. 새 인물 생성 및 기존 인물의 일반 갱신 때 부여한다. 최대 체력·최대 스태미나·정상 사기를 기존 특성 보정 후 각각 20% 늘린다.', 'jo9_chunhyang_profile · jo9_traits_value · jo9_traits_combat'],");
extract=extract.replace("투기장 단계 9 이상에서 표시된다. 에게야 영입 이벤트는 9단계로 설정한다.","투기장 단계 9 이상에서 표시된다. 에게야 영입 이벤트와 춘향(3040번) 초기 설정은 9단계로 설정한다. 춘향의 기존 9단계 이상 경력은 보존한다.");
const biNote="춘향(3040번)은 처음부터 양성애자를 보유하되 숨김 상태로 시작하며 기존 발견 조건 또는 레벨리오로 표시된다.";
extract=extract.replace("assert.ok(result.every(row => row.price && row.acquisition));","for (const row of result) if (row.name === '양성애자') { row.acquisition += ' "+biNote+"'; row.acquisitionSource += ' · jo9_chunhyang_profile'; }\nassert.ok(result.every(row => row.price && row.acquisition));");
fs.writeFileSync(dir+'/extract-traits.cjs',extract);
// Extract to a temporary destination, selecting only this task's changed rows for the live table.
let staged=extract.replace("path.join(__dirname, 'traits.json')",JSON.stringify(tmp+'/extracted-traits.json'));
fs.writeFileSync(dir+'/extract-chunhyang-stage.cjs',staged);
const r=cp.spawnSync(process.execPath,[dir+'/extract-chunhyang-stage.cjs',game+'/jack.qsp'],{encoding:'utf8',windowsHide:true});fs.unlinkSync(dir+'/extract-chunhyang-stage.cjs');assert.equal(r.status,0,r.stderr);fs.writeFileSync(rec+'/extract.log',r.stdout+r.stderr);
const generated=read(tmp+'/extracted-traits.json'),traits=read(dir+'/traits.json'),selected=['산도','아레나 그랜드 챔피언','양성애자'];
for(const name of selected){const row=generated.rows.find(x=>x.name===name);assert(row,name);const i=traits.rows.findIndex(x=>x.name===name);if(i<0)traits.rows.push(row);else traits.rows[i]=row;}
assert.equal(traits.rows.length,129);traits.latestChunhyangProfile={date:'2026-11-12',sourceQspSha256:final.after,scope:'Partial refresh: Sando, Grand Champion and latent bisexual acquisition. Other rows retain previous source snapshots.'};write(dir+'/traits.json',traits);
const note='영입 인물 프로필 구현 완료(2026-11-12): 사용자 확정 일반 능력·17개 일반 특성·전용 산도·아레나 그랜드 챔피언(9단계). 양성애자는 처음부터 숨김 보유, 경험 없음·관련 기술 전부 F. 산도는 기존 보정 후 최대 체력·최대 스태미나·정상 사기 각각 +20%. 기존 인물의 학습·경험 이력은 초기화하지 않습니다.';
const lore='승인 배경: 대쥬신제국 암행어사 문수의 호위무사 산도 → 악당의 계략으로 로마 유입 → 여주인의 검투 노예 → 콜로세움 최고 챔피언으로 자유 획득 → 에게야가 떠난 캣파이트 클럽 매입.';
let mobsSource=fs.readFileSync(dir+'/mobs-data.cjs','utf8');mobsSource=mobsSource.replace("notes: ['화염", "notes: ["+JSON.stringify(note)+", "+JSON.stringify(lore)+", '화염");fs.writeFileSync(dir+'/mobs-data.cjs',mobsSource);
let html=fs.readFileSync(dir+'/jo9-reference.html','utf8');const re=/(<script id="reference-data" type="application\/json">)([\s\S]*?)(<\/script>)/;const match=html.match(re);assert(match);const data=JSON.parse(match[2]),unchanged={items:JSON.stringify(data.items),spells:JSON.stringify(data.spells),enemies:JSON.stringify(data.enemies)};
data.traits=traits;const mobs=data.mobs||data.mob;assert(mobs);const chun=mobs.rows.find(x=>x.id==='chunhyang');assert(chun);chun.notes=chun.notes.filter(x=>!x.startsWith('영입 인물 프로필')).concat(note,lore);mobs.plannedUpdated='2026-11-12';mobs.latestAcquiredProfile=traits.latestChunhyangProfile;html=html.replace(re,(_,start,text,end)=>start+JSON.stringify(data).replace(/</g,'\\u003c')+end);fs.writeFileSync(dir+'/jo9-reference.html',html);
const embedded=JSON.parse(html.match(re)[2]);for(const [k,v]of Object.entries(unchanged))assert.equal(JSON.stringify(embedded[k]),v,k);
let snapshot=read(dir+'/snapshot.json');snapshot.traits=129;snapshot.chunhyangProfileUpdate=traits.latestChunhyangProfile;for(const file of snapshot.files){file.sha256=hash(dir+'/'+file.file);file.bytes=fs.statSync(dir+'/'+file.file).size;}write(dir+'/snapshot.json',snapshot);
for(const name of ['jo9-reference.html','snapshot.json'])fs.copyFileSync(dir+'/'+name,game+'/modtools/game-reference/'+name);
const planning=repo+'/records/catfight-successor-planning-20261111',proposal=read(planning+'/character-proposal-20261112.json');
proposal.status='ACQUIRED_PROFILE_IMPLEMENTED_BOSS_AND_RECRUITMENT_PENDING';proposal.previousProposalSuperseded=true;proposal.qspSha=final.after;proposal.characterJsonSha=hash(game+'/json/slaves/3040_chunhyang.json');proposal.latestApprovedProfile=profile;proposal.approvedBackground=bg.paragraphs;proposal.latestRevision={date:'2026-11-12',status:'USER_CONFIRMED_APPLIED',report:'records/chunhyang-profile-20261112/REPORT_KO.md',bossImplementation:false};proposal.appliedSubset={qspSha:final.after,report:'records/chunhyang-profile-20261112/REPORT_KO.md',fullNewActorProfile:true,bossAndRecruitment:false};write(planning+'/character-proposal-20261112.json',proposal);
const banner='> 2026-11-12 최신: 아래 초기 제안은 사용자 지정 프로필과 승인 배경으로 대체되었습니다. 영입 인물 데이터·산도·숨김 양성애자·아레나 그랜드 챔피언은 WORK 반영 완료입니다. 보스 AI·클럽 승계·영입 경로는 별도 미구현입니다. [최종 반영 기록](../chunhyang-profile-20261112/REPORT_KO.md)\n\n';
const proposalMd=planning+'/CHARACTER_PROPOSAL_KO_20261112.md';fs.writeFileSync(proposalMd,banner+fs.readFileSync(proposalMd,'utf8'));
const report=[
'# 춘향 3040 최종 인물 설정 반영',
'',
'2026-11-12 사용자 지정 프로필, 산도 +20%, 승인 배경 3항목, 숨김 양성애자, 최고 아레나 경력을 WORK 및 추적 소스에 반영했다. 이 보고서는 앞선 일반 제안과 배경 미승인 상태를 대체한다.',
'',
'## 확정된 동작',
'',
'- 일반 능력·기술·특성 전체 수치는 [profile.json](profile.json), 실제 생성 입력은 [candidate-character.json](candidate-character.json). S=5, A=4, B=3, C=2, D=1, F=0. 미모는 기본5에 절세미인 보정이 붙는다. 독특함5는 현행 게임에서 몽환적임으로 표시된다.',
'- 사용자가 지정한 일반 특성16개에 양성애자1개를 추가했다. 양성애자는 처음부터 값1·발견값0으로 숨겨 보유하며, 기존 발견 또는 레벨리오가 표시한다. 새 후천 획득 이벤트를 만들지 않았다.',
'- 산도(jo9_sando=1)는 다른 전투 보정을 합친 뒤 최대 체력·최대 스태미나·정상 사기 각각 ×6/5를 적용한다. 정수 나눗셈은 마지막에 하며, 반복 화면 갱신으로 중첩하지 않는다. 일반 노예/조수/개인실 동료에 같은 계산을 사용한다. 주인공 본인·고정 보스 수치는 변경하지 않았다.',
'- 최고 아레나 경력은 기존 아레나 그랜드 챔피언 칭호(arena_level≥9)를 사용한다. 새 춘향은9, 기존 춘향은 갱신 때 최소9로 올리며9보다 높은 경력은 보존한다. 기존 아레나 경력 관련 판정에도 반영된다. 별도 중복 특성이나 전투 보너스를 추가하지 않았다.',
'- 전체 프로필 고정은 새 인물 생성·비복제에만 적용한다. 기존3040의 배운 기술·경험을 초기화하지 않는다. 기존 인물에는 일반 갱신으로 산도와 최소 아레나 경력을 부여한다.',
'',
'## 승인 배경',
'',
...Object.entries(bg.paragraphs).flatMap(([key,value])=>[key+':',value,'']),
'## 구현·호출·저장·제거',
'',
'generate_stock 말미에서 stock_type3040·creating_clone0일 때 jo9_chunhyang_profile(init)을 호출한다. 입력은 생성 중 stock/stock_rate와 기존 능력 계산식이며 반환값 없이 해당 인물 값을 설정한다. 산도·챔피언 갱신은 jo9_traits_value(refresh), 산도 설명/목록은 jo9_traits, 전투 배율은 jo9_traits_combat(setup)에 연결했다. 기존 인물 복사·저장 체계를 그대로 사용하며 별도 전역 배열이나 새 세이브 형식은 없다.',
'',
'mods는 기본 프로필 → 승인 배경/숨김 양성애자 → 챔피언 순서다. 새 helper의 후속 변경은 공식 적용기의 전체 본문 발전 규칙으로 기록해 재적용 충돌과 산도 중복 삽입을 막았다. helper만 삭제하면 생성 호출이 실패한다. 제거하려면 각 모드의 호출·특성·전투 보정을 함께 역변경해야 하며 기존 저장 값은 별도 마이그레이션 대상이다.',
'',
'## 검증',
'',
'실제 설치 엔진3경로·209단언 통과: 생성 helper/실제 generate_stock/전투 계산. 생성 경로는 무관한 가격 평가만 격리했으며 JSON 수치 seed를 진단 입력으로 사용했다. 숨김 양성애자·모든 기술/특성·경험0·그랜드 챔피언 표시·높은 아레나 경력과 기존 학습/경험 보존·다른 인물/복제 가드·6개 역할의 산도 배율 및 반복 호출을 검사했다. 합성 SAV에 산도 저장을 확인했다.',
'',
'공식 mods 재생·재적용 동일 해시, QSP 왕복/구조, 기존4개 location 변경+helper1개 추가, 적 정의·명기 로직·기존 이미지/나이/체형 정보 보존을 확인했다. WORK/추적/메타 해시는 '+final.after+' 이다. 열람표 산도/챔피언/양성애자와 MOB의 영입 인물 상태를 갱신하고 아이템·마법·적 데이터는 보존했다.',
'',
'실제 GUI와 사용자의 기존 SAV 불러오기는 미검증이다. 일반 EXE에서 춘향 신규 생성 → 인물 특성의 산도·그랜드 챔피언과 숨김 양성애자 → 세계/출신/직업 문구를 확인하면 된다.',
'',
'산도20%가 에게야보다 모든 자원을 높인다는 뜻은 아니다. 같은 기본 자원100에서 건강체질+광전사+용감함+산도는144/216/270, 건강체질+역전의 용사+용감함은180/180/225다. 사용자 지정 광전사·산도20%를 유지했고 별도 추가 보정은 하지 않았다.',
'',
'춘향 보스 AI·클럽 승계·영입 이벤트·연고 사용은 아직 미구현이다. 이 작업은 영입 인물 프로필이다. Full·음원·사용자 SAV·커밋·푸시는 변경하지 않았다.',
'',
'## 복구·재현',
'',
'before.qsp.gz는 작업 전2698fcb4 QSP, before-final.qsp.gz는 첫 단계ab9529b9 QSP이며 before/에는 원래 JSON·원장이 있다. task.cjs·approved-background.cjs·finalize.cjs·finish-records.cjs에 재현 절차, final-verification.json과 native-installed.json에 검증 근거를 남겼다.',
''
].join('\n');fs.writeFileSync(rec+'/REPORT_KO.md',report);
const index=repo+'/docs/SESSION_HANDOFF_INDEX.md',entry='## 2026-11-12 Codex: 춘향 전체 프로필·승인 배경·산도·최고 챔피언\n\n[반영·동작·사용·검증·복구](../records/chunhyang-profile-20261112/REPORT_KO.md). 사용자 지정 일반 능력·17일반특성·산도20%·경험없음/관련기술F·숨김양성애자·승인3배경을 반영했다. 최고칭호는 기존 아레나 그랜드 챔피언(arena_level9)을 재사용하며 높은기록/기존학습 보존. 실제 설치 엔진3경로209단언·합성SAV·공식재생/재적용·구조 검사 통과. 열람표129특성/MOB상태 갱신. WORK/추적/메타4dd9c9d8 일치. GUI/기존SAV로드 미검증. 춘향 보스AI/영입은 미구현, Full·음원·커밋푸시 없음.\n\n';fs.writeFileSync(index,entry+fs.readFileSync(index,'utf8'));
for(const [src,dst]of [['chunhyang-profile-task.cjs','task.cjs'],['approve-chunhyang-background.cjs','approved-background.cjs'],['finalize-chunhyang.cjs','finalize.cjs'],['finish-chunhyang-records.cjs','finish-records.cjs']])fs.copyFileSync(src,rec+'/'+dst);
write(rec+'/reference-verification.json',{pass:true,traits:129,updated:selected,otherItemsSpellsEnemiesPreserved:true,workHtmlMatches:hash(dir+'/jo9-reference.html')===hash(game+'/modtools/game-reference/jo9-reference.html'),sourceSnapshot:'Other row snapshots explicitly retained',browserVisualTested:false});
console.log(JSON.stringify({recorded:true,referenceTraits:129,approvedBackground:true,champion:9,hash:final.after}));
