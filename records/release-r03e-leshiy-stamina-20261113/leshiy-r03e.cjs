'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/release-r03e-leshiy-stamina-20261113',T='G:/Codex/tmp/release-r03e-leshiy-stamina-20261113';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sv=require(R+'/tools/qa/save-codec.cjs');
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(nl(s),-5);};
const legacy="demand['min_stamina'] > 3",current="demand['min_stamina'] = 4";
if(require.main===module&&process.argv[2]==='prepare'){
 const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),'1efab505a81b43dced363335b265f5f9399570ed07ac7b59a1e979cfe4ac059f');a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(rd(R+'/assets/runtime-source-2.4.1.json').sourceQspSha256,c.hash(raw));qa.inspectWorld(raw);a(c.serialize(c.parse(raw)).equals(raw));
 fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/native',{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});a(!fs.existsSync(D+'/baseline.qsp.gz'));fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));
 fs.writeFileSync(D+'/PLAN_KO.md',`# R03-5 레시 체력 최저4\n\n2026-11-13 사용자 승인: 다른 고객의 기존 동작을 유지하며 레시만 체력4이상으로 적용한다. 기존 레시 요구의 >3 비교식을 =4로 바꾸고 실제 납품에서는 레시인 경우에만 해당 최저값을 검사한다. 대소문자가 섞인 실제 Leshiy 식별자도 같은 고객으로 판정한다.\n\n실행 #npc_base의 레시 요구 정의,slave_sell_chek의 공통 건강검사 직후 고객 범위가 명시된 검사,$ongload의 알려진 옛 레시 요구 문자열만 변경한다. 감수성 상한3·다른 기술/특성·전체 평가·가격·다른 고객·인물·재산·진행과 별도 사용자 요구값은 유지한다. 새 인물별 필드·로케이션은 추가하지 않는다.\n\n실제 성인 합성 인물에서 체력3/4 및 식별자 표기,기존 감수성/간호 조건,다른 고객의 기존 거래,옛 요구 캐시2회로드와 수동편집 보존을 RED→수정후 비교한다. 공식 재생/멱등/구조/역검증 후 WORK·소스·원장·체크리스트를 맞추고 이번 임시 사본만 정리한다. 개인 SAV/GUI/전체출고검증·Full·음원·커밋푸시·마이그레이션 구현은 별도다.\n`);
 const p=R+'/records/release-prep-20261113/checklist.json',s=rd(p),e=s.items.find(x=>x.id==='R03');e.status='진행 중';e.notes='R03-1~4 완료. R03-5 레시만 체력4이상 사용자 승인, 실제 납품/옛요구 캐시 검증 중.';s.history.push({date:'2026-11-13',item:'R03-5',decision:'다른 고객 유지·레시만 체력4이상 적용 승인'});wr(p,s);console.log(JSON.stringify({before:c.hash(raw),D,T}));
}
module.exports={R,G,D,T,c,qa,sv,rd,wr,nl,q,body,put,legacy,current};
