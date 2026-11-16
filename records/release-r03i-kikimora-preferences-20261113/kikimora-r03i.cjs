'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/release-r03i-kikimora-preferences-20261113',T='G:/Codex/tmp/release-r03i-kikimora-preferences-20261113';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sv=require(R+'/tools/qa/save-codec.cjs');
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(nl(s),-5);};
const limits={sensitivity:4,temper:4,expression:4,music:4,oral:5,petting:5,roleplay:4,fetishism:5};
if(require.main===module&&process.argv[2]==='prepare'){
 const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),'081e888dc651332c5683a24cd0f6366c2d1f2751b30e9f406f4428427a5230a1');a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(rd(R+'/assets/runtime-source-2.4.1.json').sourceQspSha256,c.hash(raw));qa.inspectWorld(raw);a(c.serialize(c.parse(raw)).equals(raw));
 fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/native',{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});a(!fs.existsSync(D+'/baseline.qsp.gz'));fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));
 fs.writeFileSync(D+'/PLAN_KO.md',`# R03-9 키키모라 선호8종 최저값\n\n2026-11-13 사용자 승인: 감수성/성격/화술/음악/역할놀이 최저4,구강/애무/페티시즘 최저5. 실행 #npc_base 선호 정의와 알려진 옛 저장 선호 표현만 수정한다. 외모4·다른 요구·분류·대사·가격·인물·재산·진행을 유지한다.\n\n성인 합성 인물의 실제 납품에서8종 최저-1/최저 및 전부 최저값,다른 고객 거래와 옛 선호2회로드/수동 편집 보존을 RED→수정후 검증한다. 공식 재생/멱등/역검증·구조 뒤 WORK·소스·원장·문서를 맞추고 임시 사본을 정리한다. 새 인물별 필드/로케이션은 없다. 개인 SAV/GUI/최종 전체출고검증·Full·음원·커밋푸시는 별도다.\n`);
 const p=R+'/records/release-prep-20261113/checklist.json',s=rd(p),e=s.items.find(x=>x.id==='R03');e.status='진행 중';e.notes='R03-1~8 완료. R03-9 선호8종 최저4/5 사용자 승인, 실제 납품/옛선호 갱신 검증 중.';s.history.push({date:'2026-11-13',item:'R03-9',decision:'기존 부등호대로 최저4/5 적용 승인'});wr(p,s);console.log(JSON.stringify({before:c.hash(raw),limits,D,T}));
}
module.exports={R,G,D,T,c,qa,sv,rd,wr,nl,q,body,put,limits};
