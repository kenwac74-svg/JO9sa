'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/chunhyang-random-finish-20261113',D=R+'/records/chunhyang-random-finish-20261113';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);};
if(process.argv[2]==='prepare'){
 const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),'29f4c04892a19afb25c82443a928e5d7895f1a7a24208df670eb3f4032bbbd15');a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));qa.inspectWorld(raw);a(c.serialize(c.parse(raw)).equals(raw));
 fs.mkdirSync(T+'/mods',{recursive:true});fs.mkdirSync(D,{recursive:true});
 const backup=D+'/baseline.qsp.gz';if(fs.existsSync(backup))a(z.gunzipSync(fs.readFileSync(backup)).equals(raw));else fs.writeFileSync(backup,z.gzipSync(raw));
 for(const f of ['assets/runtime-source-2.4.1.json','tools/game-reference/mobs-data.cjs','tools/game-reference/jo9-reference.html']){const dest=D+'/'+f.replaceAll('/','_')+'.before.gz';if(!fs.existsSync(dest))fs.writeFileSync(dest,z.gzipSync(fs.readFileSync(R+'/'+f)));}
 fs.writeFileSync(D+'/DESIGN_PLAN_KO.md',`# 춘향 무작위 일섬과 회피 상성 구현 계획

2026-11-13 사용자 확정. 기준 WORK: ${c.hash(raw)}.

목표: 시작 강제패배를 없애고, 산도의 일섬을 전투 중 회피 자세로 대응하게 한다. 일반공격은 회피 상성 공격으로 통일한다. 능력 70% 미만에서는 6종 강화 99턴으로 시작한다.

확정 세부:
- 기존 5~10 소모 턴의 무작위 간격을 유지한다. 일섬 명중 여부는 능력 확률 대신 방어 자세의 회피 여부로 판정한다. 70% 미만·100% 초과도 동일하다.
- 일섬·연고·일반공격은 한 턴에 하나만 적용한다. 회피 성공·치트 생존에도 미리 계산된 일반 피해와 부가 상태를 비운다.
- 일반공격 세 종류는 속도 상성으로 통일하고, 참격/참격/타격 피해 종류는 유지한다. 일반 적과 공용 피해 공식은 바꾸지 않는다. 옛 세이브의 적 정의는 춘향 init에서 필요한 3종 타입만 갱신한다.
- 70% 미만에 분노·가속·명중·흥분·회피·집중을 각각99턴 부여한다. 유지형 재부여나 별도 피해 배율은 추가하지 않는다. 첫 화면에 “[춘향이 떨고있는 당신을 보더니 피식 웃으며 대검을 겨누었다.]”를 표시하고 이 묶음 강화를 “춘향의 조소”로 표시한다.
- 춘향 자체 유수보의 기존 확률·약화 해제, 연고 보유량/회복 임계, CM 정산, HP0/무적치트 흐름은 보존한다.
- 새 캐릭터 저장값은 만들지 않는다. 임시 판정은 기존 전투 배열/상태값을 사용한다. Full·음원·개인 SAV·커밋·푸시는 범위 밖이다.

순서:
1. 현재본에서 시작 강제패배/회피 방어 부재의 RED를 실제 엔진으로 확인한다.
2. 정확한 본문 차이로 격리 후보와 mod를 만든다. 춘향 배경/영입/다른 전투의 본문은 보존한다.
3. 능력 경계, 모든 자세와 치트, 무작위 재예약, 연고 단일행동, 실제 AI/라운드와 카운터 및 버프 효과를 실제 엔진에서 검증한다.
4. 공식 적용기 재생·재적용 무변경·역검증 후 WORK와 추적 소스/manifest를 맞춘다. MOB 열람표의 춘향 설명도 맞춘다.
5. 재현 코드·검사 결과·최소 복구본을 보존하고 이번 진단 복사본을 정리한다. 실제 개인 SAV/GUI는 별도 확인으로 보고한다.
`);
 console.log(JSON.stringify({prepared:true,before:c.hash(raw),T,D}));
}
module.exports={R,G,T,D,c,qa,rd,wr,body,put};
