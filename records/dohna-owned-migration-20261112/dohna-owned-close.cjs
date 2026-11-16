const fs=require('fs'),a=require('assert/strict'),path=require('path'),z=require('zlib');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/dohna-owned-migration-20261112',T='G:/Codex/tmp/dohna-owned-migration-20261112';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),p=rd(D+'/plan.json'),v=rd(D+'/verification.json'),raw=fs.readFileSync(G+'/jack.qsp'),d=c.parse(raw),base=c.parse(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')));
const body=(doc,n)=>c.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
a.equal(c.hash(raw),p.after);a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a(c.serialize(d).equals(raw));qa.inspectWorld(raw);
a.equal(d.locations.length,base.locations.length+1);for(const l of base.locations)if(!['$newloc','$ongload'].includes(l.name))a.equal(body(d,l.name),body(base,l.name),'unrelated location '+l.name);
const meta=rd(R+'/assets/runtime-source-2.4.1.json');a.equal(meta.sourceQspSha256,p.after);a.equal(meta.files.find(e=>e.runtimePath==='jack.qsp').sha256,p.after);a.equal(v.failures,0);a.equal(v.checks,1182);
for(const row of p.rows)a.equal(c.hash(fs.readFileSync(G+'/json/slaves/'+row.file)),row.hash);
const report=`# 도나도나 기존 보유 인물 1회 갱신 — WORK 반영

사용자 승인: “기존에 육성한 능력치랑 진행 기록은 유지하고, 이미 영입한 도나도나 캐릭터들도 한 번만 갱신”. WORK와 추적 QSP/manifest에 반영했다. 개인 SAV 파일을 직접 편집하지 않았다.

## 사용

1. 게임을 완전히 종료하고 최신 WORK의 일반 EXE를 다시 실행한다. 이미 실행 중인 게임에는 새 QSP가 자동으로 들어가지 않는다.
2. 기존 세이브를 불러온다. 불러오기 콜백 또는 이후 장면 전환에서 보유 캐릭터를 갱신한다. 새 게임은 필요 없다.
3. 인물 정보에서 새 특성·능력을 확인하고 평소처럼 저장한다. 완료 표시는 세이브마다 저장되며 저장 전 옛 세이브로 다시 돌아가면 그 세이브에서는 처음 적용된다.

## 적용 규칙

대상은 내부 번호8877~8899의23명이다. 표시 이름을 바꿔도 번호로 구분한다. 공식 보유29역할(일반·조수·개인실4·감옥·농장·농장 관리·냉동18)과 개인실 임시 보관 snk_parked_slave를 포함한30칸을 확인한다. 상태>0의 실제 점유된 생존 인물만 갱신한다. 상점 stock, 선택용/판매용 임시 복사본, 대상 외 번호와 빈칸/사망 인물은 변경하지 않는다.

이전 능력 정합성·특성 지정·후속3명 프리셋의 확정 필드 합집합을 현재 WORK JSON과 대조했다. 새 초기값보다 낮은 능력·기술은 높이고 이미 높은 값은 유지한다. 따라서 신규 생성에서 외모4로 낮췄더라도 기존 세이브의 외모5는 내려가지 않는다. 성격·감수성·자아 등 변경된 숫자 속성도 승인한 같은 max(현재,새 기준) 규칙을 따른다. 기분 기준 문자열 psy_basic은 갱신하지 않는다.

지정 특성의 열거값은 최신 설정으로 반영한다. 지정되지 않은 다른 특성은 유지하고, 양립할 수 없는 충돌은 원래 정리 함수로 정리한다. 린의 지정 반항심/자유로운 성향을 지우는 기존 강제 복종 성향은 제거한다. 미스트레스의 기존 젖소 적성과 워커홀릭 충돌은 확정 프리셋대로 정리한다. 일반 공개 단계와 단계형 강화 수치는 낮추지 않는다. 발견 완료된 특성을 잠재 상태로 되돌리거나 보상을 반복 지급하지 않는다.

이름·이미지·외형 분류·장비·인벤토리·나이·소유일수·관계·헌신·경험/행동 이력·퀘스트 진행·현재 체력/기분/행동력은 초기화하지 않는다. 초기 캐릭터를 새로 생성해서 교체하는 동작도 없다. JSON/이미지/음원은 이번 작업에서 변경하지 않았다.

## 저장과 실행 구조

- 새 로케이션: jo9_dohna_migrate. 인자 all은30개 보유 칸 순회, 역할명은 해당 인물 갱신. 비허용 역할은 종료한다. 입력은 기존 역할의 state/type/배열 값과 plan.json에 기록한 현재 프리셋 수치다.
- 부작용은 지정 필드 갱신·필수 충돌 정리·캐릭터 배열의 jo9_dohna_preset_rev=1 기록이다. 기존 역할 swap/copy가 이 배열 전체를 옮기므로 완료 표시가 캐릭터와 함께 이동한다. 추가 저장 값은 캐릭터당 정수1개이며 전역 완료 표시를 사용하지 않는다.
- $ongload와 $newloc 선두에 같은 호출을 넣었다. 반복 호출은 완료 인물을 수정하지 않는다. 옛 세이브의 seed 배열이 오래됐어도 갱신값은 새 QSP의 확정 스냅샷에서 얻으므로 JSON 전체 재로드/다른 캐릭터 초기값 덮어쓰기를 하지 않는다.
- 의존 함수: jo9_traits의 activity_repair/attention_repair/repair_exclusions. 현재 프리셋이 다음에 변경돼도 이미 완료된 인물에 자동 반복 적용되지는 않는다. 새 갱신은 별도 revision 설계가 필요하다.
- 모드 mods/${p.mod.id}.json. 표식 DOHNA_OWNED_MIGRATION_20261112 / DOHNA_OWNED_LOAD_20261112. 제거하려면 두 콜백과 새 로케이션을 함께 제거해야 한다. 이미 저장된 갱신 결과는 코드를 제거해도 자동 복원되지 않는다.

## 검증과 한계

- 실제 FastQSP에서 수정 전1181단언 중422건 누락을 확인했다. 최종 후보는1182단언, 실패0. 23명 낮은/높은 수치·진행/이름/장비 보존·30보유 칸·비대상/미영입/빈칸/사망·두 콜백의 실제 삽입 호출·같은 세이브 내 반복 호출·원래 역할 swap·지정 특성 충돌·발견 완료 상태 보존을 검사했다.
- 실제 엔진이 쓴 SAV에서 완료 표시1, 변경 후 플레이값2, 진행4321 저장을 확인했다. SAV codec 왕복 시 바이트 일치. 단독 전역 표시가 아닌 캐릭터 배열 값으로 저장됨을 확인했다.
- 자동 OPENGAME 전체 재불러오기 실험은 엔진이 생성된 파일을 열지 못했다. 이 실험은 통과로 계산하지 않았다. optional-opengame-*에 별도 실패 기록을 보존했다. 개인 세이브의 전체 불러오기·실제 UI/장기 플레이는 미검증이다. 콜백 함수 실행 및 SAV에 저장되는 값의 보존과 구분한다.
- 공식 apply_mods.ps1 재생은 기록된 후보 해시와 일치했고 재적용은 쓰지 않는 무변경이었다. QSP 구조/CRLF/왕복·신규 로케이션 삭제와 두 변경본문 역적용 시 기준 QSP 바이트 일치. 이번 외 모든 기존 로케이션 본문 보존.
- WORK/추적 QSP/manifest 일치,23개 JSON 해시 유지,최종 독립 읽기 검토에서 중대한 누락/부작용 발견 없음. 전체 배포 출고 검사는 하지 않았다.

현재 QSP SHA-256: ${p.after}.

최소 복구본 baseline.qsp.gz, manifest 이전 gzip,필드별 plan.json,핵심 재현 스크립트·엔진 로그를 보존했다. 후속 변경 뒤에는 전체 과거 파일로 덮지 말고 이번 차이를 검토해 되돌린다. Full·순정·개인SAV·음원은 수정하지 않았고 커밋·푸시하지 않았다.
`;
fs.writeFileSync(D+'/REPORT_KO.md',report);fs.writeFileSync(D+'/review.json',JSON.stringify({reviewer:'independent read-only subagent',findings:[],limitation:'Full OPENGAME reload unverified'},null,2)+'\n');
let design=fs.readFileSync(D+'/DESIGN_PLAN_KO.md','utf8').replaceAll('- [ ]','- [x]').replace('저장후 재로드 검증','엔진 SAV 저장 값·반복 콜백 검증; 전체 OPENGAME 미검증');fs.writeFileSync(D+'/DESIGN_PLAN_KO.md',design);
const index=R+'/docs/SESSION_HANDOFF_INDEX.md',entry=`## 2026-11-12 Codex: 도나도나 기존 영입 인물 1회 갱신\n\n[사용법·보존 규칙·실행·검증·복구](../records/dohna-owned-migration-20261112/REPORT_KO.md). 승인한23명에 현재보다 낮은 초기 능력/기술만 보강하고 지정 특성/충돌을 반영.30보유 역할·캐릭터별 revision1로 이동/재호출 후 반복 방지.이름/관계/장비/소유일/헌신/진행 유지.실제 엔진1182단언0실패·SAV완료표시저장·공식재생/멱등/역검증 통과.전체 OPENGAME/개인SAV/UI 미검증. WORK/추적 QSP/manifest 반영; JSON/Full/음원/커밋푸시 없음.\n\n`;
a(!fs.readFileSync(index,'utf8').includes('## 2026-11-12 Codex: 도나도나 기존 영입 인물 1회 갱신'));fs.writeFileSync(index,entry+fs.readFileSync(index,'utf8'));
const prior=R+'/records/dohna-adult-presets-20261112/REPORT_KO.md';fs.writeFileSync(prior,`> 후속: [기존 세이브의 보유 인물 1회 갱신 구현](../dohna-owned-migration-20261112/REPORT_KO.md). 아래 신규 영입 한정은 당시 작업 범위이며, 기존 인물 갱신이 별도 추가됐다.\n\n`+fs.readFileSync(prior,'utf8'));
for(const file of ['dohna-owned-migration.cjs','dohna-owned-close.cjs'])fs.copyFileSync(file,D+'/'+file);
const resolved=fs.realpathSync(T),parent=fs.realpathSync('G:/Codex/tmp');a.equal(path.dirname(resolved).toLowerCase(),parent.toLowerCase());a.equal(path.basename(resolved),'dohna-owned-migration-20261112');
function noLinks(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const pth=path.join(dir,f.name);a(!fs.lstatSync(pth).isSymbolicLink(),'no reparse traversal');if(f.isDirectory())noLinks(pth);}}noLinks(resolved);fs.rmSync(resolved,{recursive:true});a(!fs.existsSync(T));fs.writeFileSync(D+'/cleanup.txt','이번 작업의 격리 진단 QSP·시험 SAV·재생성 가능한 복사본만 정리했다. 원본·개인 SAV·최소 복구 자료는 보존했다.\n');
console.log('Verified WORK/source/manifest, preserved all unrelated bodies/23 JSONs, wrote handoff/report and removed only task diagnostics');
