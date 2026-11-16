'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const {R,G,T,D,c,rd,wr}=require('./chun-random-task.cjs'),p=rd(D+'/plan.json'),v=rd(D+'/verification.json'),proof=rd(D+'/native-candidate-report.json');
a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);a.equal(rd(R+'/assets/runtime-source-2.4.1.json').sourceQspSha256,p.after);a.equal(proof.passed,true);a.equal(proof.assertions,184);
fs.writeFileSync(D+'/REPORT_KO.md',`# 춘향 전투: 무작위 일섬·회피 상성·춘향의 조소

2026-11-13 사용자 지시에 따라 WORK와 추적 QSP·manifest에 반영했다. 기준 ${p.before} → ${p.after}. 커밋·푸시·Full·음원·개인 SAV 수정은 없다.

## 게임에서 달라지는 점

- 능력비율70% 미만의 시작 강제패배를 없앴다. 모든 능력 구간에서 일단 전투에 들어간다.
- 산도의 일섬은 기존의5~10 소모 턴 무작위 간격으로 나온다. 회피 자세면 결정타를 피하고, 막기·반격 자세면 남은 HP만큼 피해를 받아 HP0 패배 판정으로 이어진다. 능력치100% 초과의 기존 면제와70~100%의 추가 명중 추첨을 제거했다. 무적 치트의 피해 배율은 유지한다.
- 일섬을 피한 턴에는 일반공격이 추가되지 않는다. 연고 사용도 공격 대신 한 행동이다. 미리 계산된 일반 피해·상태·지속시간을 비운다.
- 일반공격3종은 모두 속도 상성으로 계산한다. 회피 자세 상대의 피해 수정자가+1이며, 다른 수정자가 없으면2배다. 힘·상태·저항 등 기존 수정자는 그대로 합산한다. 참격/참격/타격이라는 피해 종류는 유지했다. 회피 고정으로 일반공격을 버티는 전략은 가능하지만 추가 피해를 감수한다.
- 시작 능력비율70% 미만이면 분노·가속·명중·흥분·회피·집중을 각각99턴으로 부여한다. “춘향의 조소” 한 배지로 표시하고, 누르면 여섯 효과와 각각 남은 시간을 보여준다. 별도 공격 배율을 덧붙이거나 매턴 버프를 재부여하지 않는다.
- 이 조건의 첫 화면에 사용자 원고 “[춘향이 떨고있는 당신을 보더니 피식 웃으며 대검을 겨누었다.]”를 표시한다.

## 보존한 규칙

춘향 자체 회피인 유수보의 기존 확률·공격1회 무효·약화 제거는 그대로다. 연고3개/하드6개,60/90/60 임계와 회복 효과,CM 비용·사망 정산·클럽 소유/영입,주인공 능력비율 계산식은 유지했다. 유수보는70~100% 구간의110−R 확률이며 이 밖에서는0이다. 이번 일섬의 방어 방식과 구분한다.

## 코드·입력·반환·부작용

mod는 mods/${p.id}.json, 정확 편집7개·기존 본문3개다. jo9_chun_battle의 init은 전투 시작 능력/적ID를 읽어 저능력 강화와3개 공격 타입을 설정한다. 옛 캐시에서도 새 대결은 속도 상성을 쓰도록 필요한 타입만 갱신한다. after_player는 기존 예약 턴과 회피 자세를 읽어 일섬/연고/일반공격 중 하나를 선택한다. clear_attack은 적1번의 임시 피해/상태 payload를 비운다. mockery는 현재 대상·시작 비율·턴·버프 잔여에서 배지 표시 여부1/0을 반환한다. mockery_info는 설명 메시지만 표시한다.

#противники의 춘향 기본 공격 타입2곳과 боевой_интерфейс의 긍정 상태 표시 블록을 맞췄다. 다른 적의 데이터·공용 피해 계산·일반 AI·라운드 처리·클럽/인물 프로필 본문은 보존했다. 새 영구 캐릭터 필드나 저장 버전은 없다. 배지는 기존 상태에서 계산하며99턴 뒤에는 재부여된 다른 강화로 되살아나지 않는다.

제거할 때는3개 본문의 패치 차이와 MOB 설명을 함께 역검토한다. 이후 수동 변경이 있으면 전체 이전 QSP로 덮지 않는다. 전투 도중 저장한 캐시의 모든 조합은 별도 미검증이므로 수정본은 게임을 완전히 재시작해 새 대결로 확인한다.

## 검증·한계

현재 기준본에서699능력 단위로 시작하면HP0이 되는 RED를 실제 엔진에서 확인했다. 후보 실제 엔진4그룹184검사는 모두 통과했다: 시작 경계·원고·배지24,능력/자세/치트96,실제 AI·피해공식·6강화 효과43,실제 방어/특수공격/라운드의 단일행동21. 70% 경계·100% 초과·99/98턴·연고/일섬 우선순위도 포함한다. native-candidate-report.json과 재현 스크립트·로그를 보존했다.

공식 적용기 재생·재적용 무변경·바이트 역적용·구조/왕복을 통과했다. 독립 리뷰에서 기능상 결함을 발견하지 않았다. 실제 WORK에 공식 적용기로 반영한 뒤 추적 QSP/manifest의 동일 해시를 확인했다. 개인 SAV의 전체 로드와 실제 화면 배치/툴팁 클릭은 시각 검사하지 않았다. 전체 배포 출고검사는 별도다.

MOB 열람표의 춘향 설명도 새 규칙으로 갱신했다. 직전 B에서 승인·갱신된 특성 설명4개가 원본JSON에만 있고 HTML에는 남아 있던 차이를 확인해 같은4개 문구만 HTML에 전달했다. 다른 특성/아이템/마법 행과 개인 아이디어는 보존했다.

확인 경로: 게임을 완전히 종료·재시작→춘향에게 새 결투 신청. 저능력 시작 대사/조소 배지,회피 자세의 일섬 방어,일반공격의 회피 상성 피해를 확인한다.
`);
const idx=R+'/docs/SESSION_HANDOFF_INDEX.md',entry='## 2026-11-13 Codex: 춘향 무작위 일섬·회피 상성·조소\n\n[수정·사용·보존·검증](../records/chunhyang-random-finish-20261113/REPORT_KO.md). 시작즉사 제거,모든능력에서5~10턴무작위일섬/회피자세만방어,일반3종속도상성,70%미만6버프99턴과춘향의조소배지/시작원고. 일섬·연고단일행동,CM/치트/유수보/영입보존.실제엔진4그룹184검사·공식재생/멱등/역검증통과,개인SAV/화면시각검사미실시. WORK/소스/manifest일치2ad5be48. MOB표와직전B설명4개의HTML동기화. Full/음원/커밋푸시없음.\n\n';let index=fs.readFileSync(idx,'utf8');if(!index.startsWith(entry))fs.writeFileSync(idx,entry+index);
for(const f of ['chun-random-task.cjs','chun-random-build.cjs','chun-random-install.cjs','chun-random-close.cjs','chun-random-native.cjs']){if(fs.existsSync(f))fs.copyFileSync(f,D+'/'+f);}
if(fs.existsSync(T)){const root=fs.realpathSync(T);a.equal(path.dirname(root).toLowerCase(),fs.realpathSync('G:/Codex/tmp').toLowerCase());a.equal(path.basename(root),'chunhyang-random-finish-20261113');function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const x=path.join(dir,e.name);a(!fs.lstatSync(x).isSymbolicLink(),x);if(e.isDirectory())scan(x);}}scan(root);fs.rmSync(root,{recursive:true});}
v.finalVerified={work:c.hash(fs.readFileSync(G+'/jack.qsp')),source:c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),manifest:rd(R+'/assets/runtime-source-2.4.1.json').sourceQspSha256,nativeAssertions:184,tempRemoved:!fs.existsSync(T)};wr(D+'/verification.json',v);console.log(JSON.stringify(v.finalVerified));
