import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {applyCoherentConnections,occupationConnectionClass,JOB_COMPATIBILITY_REASONS} from '../dist/background-connections.mjs';
import {buildBackgroundCases} from '../dist/backgrounds.mjs';
import {allowedBackgroundAges} from '../dist/background-settings.mjs';
import {validateState} from '../dist/engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [input,outputDir]=process.argv.slice(2);
if(!input||!outputDir)throw new Error('Usage: node docs/export-background-connections.mjs INPUT_JSON OUTPUT_DIR');
const documents=['backgrounds.json','background-drafts.json'].map(f=>JSON.parse(fs.readFileSync(path.join(root,'dist/data',f))));
const catalogue={...documents[0],records:documents.flatMap(d=>d.records)};
const before=JSON.parse(fs.readFileSync(input)),result=structuredClone(before);
applyCoherentConnections(result.config,catalogue);
const check=structuredClone(result);
check.config.backgroundSettings.links=before.config.backgroundSettings.links;
check.config.backgroundSettings.defaultConnectionsVersion=before.config.backgroundSettings.defaultConnectionsVersion;
check.config.backgroundSettings.ageRules=before.config.backgroundSettings.ageRules;
assert.deepEqual(check,before,'all content except graph/version/new default ages is preserved');
for(const kind of ['world','family','occupation'])for(const[id,rule]of Object.entries(before.config.backgroundSettings.ageRules[kind]))assert.deepEqual(result.config.backgroundSettings.ageRules[kind][id],rule);
validateState(structuredClone(result));
const cases=buildBackgroundCases(catalogue,result.config);
const labels=Object.fromEntries(['world','family','occupation'].map(kind=>[kind,new Map(catalogue.records.filter(r=>r.kind===kind).map(r=>[r.id,r.label]))]));
const name=(kind,id)=>labels[kind].get(id)??id;
const list=(kind,ids)=>ids.map(id=>name(kind,id)).join(' · ');
const links=result.config.backgroundSettings.links;
const lines=['# JO9 세계·출신·직업 연결 검수본','',
 '기준: 사용자가 제공한 전체 설정과 2026-11-12 배경 대사 개정본. 연결만 새로 구성한 파생 설정이며 원본 백업은 보존한다. 게임 본체·세이브에는 미반영이다.','',
 `세계 ${labels.world.size}종 / 출신 ${labels.family.size}종 / 직업 ${labels.occupation.size}종. 세계 대사의 변형을 포함한 기본 허용 조합 ${cases.length.toLocaleString('ko-KR')}개. 개별 연령 조건으로 실제 추첨 대상은 추가로 줄어든다.`, '',
 '## 적용 순서','',
 '세계에서 허용한 출신을 고르고, 그 세계의 직업 목록에서 출신 조건까지 충족하는 직업을 고른다. 마지막으로 세계·출신·직업의 연령 조건을 모두 확인한다. 조건이 없거나 후보가 비면 부적합한 조합을 억지로 만들지 않는다. 세계의 문장 변형은 같은 세계 ID의 연결을 공유한다.', '',
 '직업별 출신 조건이 “세계의 모든 출신”이면 해당 세계 안에서만 제한이 없다는 뜻이다. 모든 세계·모든 출신으로 확장하는 의미가 아니다.','',
 '## 연결 판단 기준',''];
for(const text of Object.values(JOB_COMPATIBILITY_REASONS))lines.push('- '+text);
lines.push('- 부모 직업이 다르거나 가난하다는 이유만으로 이후 교육과 전문직 진입을 금지하지 않는다. 단, 출생 신분·혼인 재산을 직접 전제한 직업은 해당 출신이 필요하다.');
lines.push('- 유니크 캐릭터의 특별한 설정이나 몰락·입양·신분 상승 같은 별도 사건은 기본 추첨에 가정하지 않는다. 필요한 경우 사용자가 연결을 직접 조정한다.');
lines.push('- 여학생·무용가를 현재 목록에 추가했다. 소녀는 중세 이전 세계, 여학생은 중세 및 이후 세계에 연결하고 기존 승인대로 seed_age 0 기본 조건을 둔다. 이미 사용자가 지정한 연령 조건은 덮어쓰지 않는다.');
lines.push('', '## 대표 차단 사례','',
 '| 조합 | 처리 이유 |','|---|---|',
 '| 원시 부족 세계 + 선반공·해커 | 공장 설비·컴퓨터 없음 |',
 '| 봉건 농경 세계 + 여마법사의 제자 | 실제 마법을 전제하지 않는 세계 |',
 '| 기업 지배 정보 세계 + 궤도농장·우주군 | 해당 세계 대사에 성간·궤도 진출 근거 없음 |',
 '| 평민·거리 고아 출신 + 공주 | 출생 신분 조건 불일치 |',
 '| 고대 로마 + 성의 하녀·영주의 아내 | 현재 직업 대사가 봉건 성·영주 생활을 전제 |',
 '| 풍요로운 미래 세계 + 거지·범죄·경찰 | 현재 세계 대사의 빈곤·범죄·군경 부재와 불일치 |',
 '| 근대 산업 세계 + 노예 | 승인된 노예제 세계 범위 밖 |', '',
 '## 세계별 연결 요약','',
 '| 세계 | 출신 수 | 직업 수 | 허용 조합 수 |','|---|---:|---:|---:|');
for(const world of Object.keys(links.worldFamilies))lines.push(`| ${name('world',world)} | ${links.worldFamilies[world].length} | ${links.worldOccupations[world].length} | ${cases.filter(r=>r.world.id===world).length} |`);
for(const world of Object.keys(links.worldFamilies)){
 lines.push('',`## ${name('world',world)} · \`${world}\``, '', '**출신:** '+list('family',links.worldFamilies[world]), '',
  '| 직업 | 출신 허용 조건 |','|---|---|');
 for(const job of links.worldOccupations[world]){
  const rule=links.occupationFamilies[world+':'+job];
  lines.push(`| ${name('occupation',job)} | ${rule.required===null?'세계의 모든 출신':list('family',rule.required)} |`);
 }
}
lines.push('', '## 보존과 조정','',
 '- 대사 161개 수정값, 배경 배수와 범위, 직업 계수, 스킬·특성 값, 캐릭터 데이터와 보관함은 유지했다. 이번에 추가한 두 직업은 편집기 기본 대사를 사용한다.',
 '- 기존 직업의 연령 조건은 유지했다. 빠져 있던 소녀·여학생 기본 연령 조건 등은 미지정 항목에만 채운다.',
 '- 이전 세계별 직업 합집합과 과거 출신별 연결은 검수된 명시적 연결로 대체한다. 기존 캐릭터의 과거 메모·확정 통계를 자동으로 재작성하지 않는다.',
 '- 편집기 “검수 연결 적용”은 현재 데이터의 연결만 교체하므로, 이 백업 이후 편집한 대사·수치를 보존하며 적용할 수 있다.',
 '- 이후 “대사·연결 편집”에서 세계별 출신·직업 목록과 직업별 출신 허용/거부를 수정할 수 있다. 사용자가 명시적으로 바꾼 예외는 다음 실행 시 자동으로 되돌리지 않는다.',
 '- 다른 기술 수준의 새 세계나 새 직업을 추가할 때는 연결 검토를 거친다. 검토되지 않은 새 ID를 자동으로 모든 세계에 배정하지 않는다.','');
fs.mkdirSync(outputDir,{recursive:true});
fs.writeFileSync(path.join(outputDir,'잭오나_전체설정_연결검수_20261112.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(outputDir,'JO9_세계출신직업_연결표_20261112.md'),lines.join('\n'));
console.log(JSON.stringify({worlds:labels.world.size,families:labels.family.size,jobs:labels.occupation.size,cases:cases.length,ageEligibleCases:cases.filter(r=>allowedBackgroundAges(result.config,r).length).length,onlyChanged:'links/version + missing approved age defaults'},null,2));
