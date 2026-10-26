'use strict';
const fs=require('fs'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',c=require(repo+'/tools/text-workshop/core.cjs'),game='G:/somi/Jack O Nine Tails v2.4_work/game';
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),'afb2b9eccbe02193f77fefea4a990081616a79eb84ed14fe2d8f0bbd3cf2d1fc');
fs.writeFileSync(repo+'/records/fame-content-audit-20261024/USER_REVISION_20261024_KO.md',`# 사용자 후속 기준 — 2026-10-24

현재는 조사·기획 기록이며 게임 코드를 적용한 문서가 아니다.

- 캣파이트는 참가 제한이 있는 낮은 수준의 대회이므로 콜로세움보다 적은 명성 보상을 준다. 기존 승리당+4안은 철회한다. 승리당 fame 누적+2는 새 제안이며 아직 수치 확정·적용하지 않았다.
- 안개 전투의 일반+1/강적+2/보스+4 전투당 상시 지급안은 철회한다. 사용자는 최고 난이도 괴물 승리 때 약10% 확률의 목격자 상황과 소량 명성을 요청했다. 누적+1과 단일 거대 안개괴물만 대상인 안은 검토 제안이다. 기존 소스에는 일관된 난이도 순위가 없으므로 대상 집합은 미확정이다.
- 목격자 상황 문구 제안: 안개 너머에서 싸움을 지켜보던 여행자가 그녀를 향해 경탄을 보냈다. 이 무용담은 도시에서도 회자될 것이다. (개인 명성 누적 +1)
- 다재다능의 부여 시 명성 한 단계 상승은 이전 별도 승인으로 WORK 적용 완료이며 이 조사와 구분한다.
- 정액랠리 우승+10은 앞선 제안 상태를 유지한다. 이 후속 지시만으로 미승인 수치까지 적용하지 않았다.

캣파이트에서 승리1회를 두 번 집계하는 기존 결함을 발견했다. 현재 exit와 남/여 성공결과에서 각각 catfight_level을 올려 무패 시0→2→4다. 패배는 값을 낮추므로 평생 누적3승과도 다르다. 정리·새 누적카운터·기존세이브 이관은 별도 결정 대상이다. 보호 순정 G:/somi/JO9O/game/jack.qsp에서도 exit92, interaction_city16237/16465의 동일 증가를 읽기 전용으로 확인했다. 원본은 수정하지 않았다.

근거는 CATFIGHT_DESIGN_KO.md, FOG_WITNESS_DESIGN_KO.md에 있다. 커밋·푸시하지 않는다.
`);
const issue=repo+'/docs/PENDING_ISSUES_20261015.md',id='CATFIGHT_DOUBLE_LEVEL_20261024';let b=fs.readFileSync(issue,'utf8');if(!b.includes(id)){b+='\r\n\r\n## 확인됨·수리 미적용 — 캣파이트 승리 단계 이중 증가 ('+id+')\r\n\r\n- 공통 전투 종료와 남/여 승리 결과가 catfight_level을 각각+1하여 정상 무패 진행이0→2→4가 된다. 다음출전은 level<3 조건에 차단되어 실제2승에 막힌다. 패배시 감소도 있어 순수누적승수로 볼수없다.\r\n- 보호 순정JO9O에서도 동일증가3지점을읽기전용확인. 현재 WORK/기존세이브는변경하지않음. 수리범위와기존승수처리는미확정.\r\n- [조건·보상 연결·검증 설계](../records/fame-content-audit-20261024/CATFIGHT_DESIGN_KO.md).\r\n';fs.writeFileSync(issue,b);}
const proposal=repo+'/records/fame-content-audit-20261024/PROPOSAL_KO.md';let p=fs.readFileSync(proposal,'utf8');if(!p.includes('USER_REVISION_20261024_KO.md')){const e=p.indexOf('\n')+1;p=p.slice(0,e)+'\n> 후속 사용자 지시로 안개 상시 보상·캣파이트+4안은 철회했다. [최신 변경 기준](USER_REVISION_20261024_KO.md)을 우선한다.\n'+p.slice(e);fs.writeFileSync(proposal,p);}
fs.mkdirSync(repo+'/records/fame-content-audit-20261024/scripts',{recursive:true});fs.copyFileSync(__filename,repo+'/records/fame-content-audit-20261024/scripts/record-user-revisions.cjs');
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),'afb2b9eccbe02193f77fefea4a990081616a79eb84ed14fe2d8f0bbd3cf2d1fc');fs.unlinkSync(__filename);console.log('Recorded user revisions and existing counter defect; runtime unchanged');
