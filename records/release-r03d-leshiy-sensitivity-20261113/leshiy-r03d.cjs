'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/release-r03d-leshiy-sensitivity-20261113',T='G:/Codex/tmp/release-r03d-leshiy-sensitivity-20261113';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sv=require(R+'/tools/qa/save-codec.cjs');
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(nl(s),-5);};
const legacy="stat_importance['sensitivity'] < 4",current="stat_importance['max_sensitivity'] = 3";
if(require.main===module&&process.argv[2]==='prepare'){
 const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),'4f2b7a9d4d664800a541e3cd47211c14f9097172279eeb410e473e99e7bc5c78');a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(rd(R+'/assets/runtime-source-2.4.1.json').sourceQspSha256,c.hash(raw));qa.inspectWorld(raw);a(c.serialize(c.parse(raw)).equals(raw));
 fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/native',{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});a(!fs.existsSync(D+'/baseline.qsp.gz'));fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));
 fs.writeFileSync(D+'/PLAN_KO.md',`# R03-4 레시 감수성 상한\n\n2026-11-13 사용자 승인: 감수성3이하 허용,4이상 거절. 최저값3으로 바꾸면 반대 방향이 되므로 기존 임시 stat_importance에 max_sensitivity 상한을 둔다. 해당 표는 각 납품 검사 시작에 killvar로 초기화되며 새 인물별 영구 필드는 추가하지 않는다.\n\n실행 중인 #npc_base 레시 선호 정의, 기존 slave_sell_chek의 선호 적용 직후 상한 검사, $ongload의 알려진 옛 레시 선호 문자열 치환만 변경한다. 별도 사용자 조건은 유지한다. 호출되지 않는 구 #npc_base_woman을 비롯한 다른 본문·고객 요구·체력/인지도/등급·가격·완료 거래·보상·인물·진행은 유지한다.\n\n실제 엔진 RED → 정확3개 편집 후보 → 감수성0/3/4/5,다른 고객/기술 거절 유지,알려진 옛 캐시의2회로드와 사용자 편집 보존 → 공식 재생/멱등/역검증·구조 → WORK·소스·원장·체크리스트 → 이번 임시 사본 정리. 개인 SAV/GUI/전체 출고 검증·Full·음원·커밋푸시·최종 마이그레이션은 이번 범위가 아니다.\n`);
 const p=R+'/records/release-prep-20261113/checklist.json',s=rd(p),e=s.items.find(x=>x.id==='R03');e.status='진행 중';e.notes='R03-1~3 완료. R03-4 레시 감수성3이하 상한 사용자 승인, 정의/실제납품/옛선호캐시 검증 중.';s.history.push({date:'2026-11-13',item:'R03-4',decision:'감수성3이하 상한 적용 승인'});wr(p,s);console.log(JSON.stringify({before:c.hash(raw),D,T}));
}
module.exports={R,G,D,T,c,qa,sv,rd,wr,nl,q,body,put,legacy,current};
