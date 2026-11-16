'use strict';
const fs=require('fs'),a=require('assert/strict'),z=require('zlib'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/reward22-resume-20261116',H=__dirname,D=R+'/records/reward22-restored-20261116';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),load=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const prep=load(H+'/prepared.json'),patch=load(H+'/patch.json'),before=fs.readFileSync(W+'/jack.qsp'),after=fs.readFileSync(T+'/candidate.qsp'),source=fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp');
a.equal(c.hash(before),prep.before);a.equal(c.hash(source),prep.sourceBefore);a.equal(c.hash(after),prep.after);qa.inspectWorld(after);
const green=load(H+'/green-results.json');a.equal(green.length,4);a(green.every(x=>x.pass));a(prep.testedCodeIdenticalAfterFormatting);
const inverse=c.parse(after);for(const e of [...patch.edits].reverse()){const l=inverse.locations.find(l=>l.name===e.location),b=c.shift(inverse.lines[l.body],5);a.equal(b.split(e.new).length,2);inverse.lines[l.body]=c.shift(b.replace(e.new,()=>e.old),-5);}a(c.serialize(inverse).equals(before));
const manifestPath=R+'/assets/runtime-source-2.4.1.json',manifestRaw=fs.readFileSync(manifestPath),manifest=JSON.parse(manifestRaw);a.equal(manifest.sourceQspSha256,prep.sourceBefore);
a(!fs.existsSync(D),'Do not overwrite an existing restoration record');fs.mkdirSync(D,{recursive:true});
fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(manifestRaw));
for(const name of ['patch.json','prepared.json','red-results.json','green-results.json','native.cjs','prepare.cjs','install.cjs'])fs.copyFileSync(H+'/'+name,D+'/'+name);
for(const name of fs.readdirSync(T))if(name.endsWith('-stderr.log'))fs.copyFileSync(T+'/'+name,D+'/'+name);
fs.writeFileSync(R+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(W+'/jack.qsp',after);fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',after);
manifest.sourceQspSha256=prep.after;manifest.snapshotDate='2026-11-16';const row=manifest.files.find(r=>r.runtimePath==='jack.qsp');a(row);row.sha256=prep.after;row.bytes=after.length;
manifest.latestReward22Restore={mod:patch.id,report:'records/reward22-restored-20261116/REPORT_KO.md',variants:18,restoredTextFields:72,previousEmergencyExclusionSupersededForFutureRelease:true,existingPatch2ZipUnchanged:true};
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
const report=`# 2.2.3 대사·동작 복원 재개 완료

2026-11-16 사용자 재개 지시. 앞서 승인한 young/milf 성인 범위 남주 보상 18종과 2.2.3 행동력 규칙을 적용했다.
기존 모욕 조교 3개 정신상태·원문 12개는 이미 WORK에 있어 그대로 보존했다.

## 변경 범위

- #var_base: 원문 문구 72개 및 이미지 키/폴더, 소리 참조, 동작 플래그. 기존 후보 발동 조건·추첨·기본 보상값은 유지한다.
- interaction: 선택된 이미지 값을 읽어 조수 합성 경로를 판정한다. 원래 배열 자체를 검사하던 오류를 고쳤다.
- 기존 원고의 첫 중복 대입 오류는 옮기지 않고 최초 설명을 사용한다. 그림 두 종류는 현행 하위폴더로 연결한다. 신규 이미지나 음원은 만들지 않았다.
- 주대상과 해당 보조대상에 기존 승인된 성인 범위를 적용한다. 여성 주인공·그 외 경로의 원문과 동작은 보존한다. 이는 원본 2.2.3의 조건을 새로 주장하는 것이 아니라 앞서 승인된 복원 범위다.
- jo9_slave_death에는 공식 적용을 막던 기존 lone LF 두 곳만 CRLF로 정리했다. 문구·선택지·효과는 유지하며 최신 수동 메뉴 문구도 그대로다.

## 행동력과 저장

18종 중 3/4/15번은 반지 없이 주인공 행동력 1, 7번은 채찍 기술 D 이상이면 0.5, 16번은 결박 기술 B 이상이면 0.5다. 나머지는 0.5다. 황소 반지는 여기에서 0.5를 줄이며 기존 반회 누적·무한 행동력 치트를 그대로 사용한다. 노예의 기본 소모 공식은 바꾸지 않았다.
새 저장 필드·새 QSP 위치·새 계산 공식은 없다. 실제 경과 상태의 보상 후보 등록을 다시 평가하면 적용되며 게임 재실행 후 세이브를 불러온다. 이미 열려 있던 보상 대화는 다시 나갔다 들어오는 편이 확실하다.

## 검증과 한계

미수정 코드에서 원문 불일치·행동력 할인·조수 이미지 선택의 예상 RED 실패를 확인했다.
실제 엔진 최종 4개 진단 PASS: 성인 2종의 18×8필드 일치, 행동력 72조합, 실제 조건식에서 추출한 참여자 조건 27조합, 선택 이미지 경로 3조합. 총 assert 662개. 기존 이미지 경로 111개 존재 확인.
이후 줄바꿈 두 개만 정리한 최종 QSP와 엔진 검증 코드의 #var_base/interaction/#dynamic 본문이 동일함을 확인해 엔진 검사를 반복하지 않았다.
공식 apply_mods.ps1 DryRun으로 정확 재생과 재적용 건너뜀을 확인했고 전체 구조·CRLF·바이트 왕복·역적용도 통과했다. 실제 개인 SAV의 전 과정 UI/청음 플레이는 미검증이다.

## 버전과 배포

WORK ${prep.before} → ${prep.after}.
이전 추적 사본 ${prep.sourceBefore}에서 최신 수동 편집을 보존한 WORK와 이번 복원본으로 동기화했다. WORK·추적 사본·소스 원장 일치.
기존 사운드·목표창·기타 수동 편집은 보존했다. 기존 긴급 2차 ZIP은 바꾸지 않았다. 긴급 패치에서만 적용했던 2.2 복원 제외는 이번 재개 이후 배포를 새로 요청할 때 다시 제외하지 않는다. 이번 작업 자체는 새 배포 승인이나 ZIP 재제작이 아니다.
Full·음원·개인 저장·커밋·푸시 변경 없음.

## 유지보수와 복구

입력은 기존 인물 속성·선호·공개 여부·추가 참여자와 주인공 기술/반지 상태다. 반환은 기존 후보 배열 8종의 값과 기존 동작 플래그이며 interaction과 interaction_result의 기존 수용/반응/비용 경로가 소비한다. 후보 선택 후 이미지에는 display_pic를 사용한다.
롤백은 이 폴더 patch.json의 세 edit를 현재 해시에 맞춰 역검토한다. 대사 등록과 선택 이미지 분기를 함께 검토하고, 소스 전체 구버전 복사로 되돌리지 않는다. 조수 분기만 남기거나 원문 플래그만 제거하면 문구와 화면/비용이 다시 어긋날 수 있다.
시나리오 눈검사는 보상 문구·그림 일치, 조수 관련 장면, 비용 증가 항목 두 번 사용 후 행동력의 3가지만 사용자가 확인하면 된다.
`;
fs.writeFileSync(D+'/REPORT_KO.md',report);fs.writeFileSync(H+'/REPORT_KO.md',report);
const indexPath=R+'/docs/SESSION_HANDOFF_INDEX.md';let index=fs.readFileSync(indexPath,'utf8');a(!index.includes('REWARD22_RESUMED_20261116'));
index+='\n\n### 2026-11-16 2.2.3 복원 재개 (REWARD22_RESUMED_20261116)\n\n성인 범위 남주 보상18종의 원문72개·이미지/동작/기존 2.2.3 비용을 WORK·추적 소스에 반영. 모욕 조교12문구는 기존 적용 유지. 실제 엔진662 assert/공식 재생·멱등·구조 확인. 이전 긴급2차 ZIP은 그대로이며, 이후 새 배포시 해당 복원 제외를 반복하지 않는다. 세이브/Full/음원/커밋푸시 없음. [상세](../records/reward22-restored-20261116/REPORT_KO.md).\n';fs.writeFileSync(indexPath,index);
a.equal(c.hash(fs.readFileSync(W+'/jack.qsp')),prep.after);a(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp').equals(after));
const result={work:prep.after,sourceSynchronized:true,variants:18,textFields:72,nativeFixturesPassed:4,nativeAssertions:662,officialReplayAndIdempotence:true,existingPatch2ZipUnchanged:true};
fs.writeFileSync(D+'/installed.json',JSON.stringify(result,null,2)+'\n');fs.writeFileSync(H+'/installed.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
