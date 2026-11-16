'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/release-r03f-leshiy-unknown-20261113',T='G:/Codex/tmp/release-r03f-leshiy-unknown-20261113';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sv=require(R+'/tools/qa/save-codec.cjs');
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(nl(s),-5);};
if(require.main===module&&process.argv[2]==='prepare'){
 const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),'7b4c58faba105d70eae09ea12f3aa7307d3a044081210f3cdb007212ad5f5b58');a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(rd(R+'/assets/runtime-source-2.4.1.json').sourceQspSha256,c.hash(raw));qa.inspectWorld(raw);a(c.serialize(c.parse(raw)).equals(raw));
 fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/native',{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});a(!fs.existsSync(D+'/baseline.qsp.gz'));fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));
 fs.writeFileSync(D+'/PLAN_KO.md',`# R03-6 레시 무명 요구\n\n2026-11-13 사용자 승인: 인지도0 ‘무명 노예’만 허용하고1이상은 거절한다. 기존 unknown=1 요구가 실제 납품에서 무시되므로 이 요구가 있을 때 기존 fame값이0인지 검사한다. 현재 이 요구를 가진 고객은 레시다.\n\n실제 납품 함수 한 본문만 변경한다. 요구 정의와 저장 콜백은 이미 존재하므로 새 캐시 갱신을 추가하지 않는다. 인지도·체력·감수성·기술·평가·가격·특성·인물·재산·진행은 수정하지 않는다. 다른 고객과 별도 사용자 요구값을 유지하고 새 인물별 필드를 만들지 않는다.\n\n실제 성인 합성 인물의 납품에서 인지도0/1/5 경계와 현재 체력/감수성/간호 조건,다른 고객 거래,기존 저장 요구의2회로드·수동편집 보존을 RED→수정후 비교한다. 공식 재생/멱등/역검증·구조 후 WORK·소스·원장·릴리즈 문서를 맞추고 이번 임시 사본만 정리한다. 개인 SAV/GUI/전체출고검증·Full·음원·커밋푸시·최종 마이그레이션은 별도다.\n`);
 const p=R+'/records/release-prep-20261113/checklist.json',s=rd(p),e=s.items.find(x=>x.id==='R03');e.status='진행 중';e.notes='R03-1~5 완료. R03-6 인지도0 무명 노예만 허용 사용자 승인, 실제 납품과 기존 저장 요구 검증 중.';s.history.push({date:'2026-11-13',item:'R03-6',decision:'인지도0 무명 노예만 허용 승인'});wr(p,s);console.log(JSON.stringify({before:c.hash(raw),D,T}));
}
module.exports={R,G,D,T,c,qa,sv,rd,wr,nl,q,body,put};
