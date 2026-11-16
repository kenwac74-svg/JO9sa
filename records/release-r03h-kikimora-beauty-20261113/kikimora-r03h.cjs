'use strict';
const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/release-r03h-kikimora-beauty-20261113',T='G:/Codex/tmp/release-r03h-kikimora-beauty-20261113';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sv=require(R+'/tools/qa/save-codec.cjs');
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(nl(s),-5);};
const legacy="demand['min_beauty'] > 3",current="demand['min_beauty'] = 4";
if(require.main===module&&process.argv[2]==='prepare'){
 const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),'1ec9e14bb0e95716f4041362e25c811351862a5a7c022615663fc9c42f1fa2b4');a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(rd(R+'/assets/runtime-source-2.4.1.json').sourceQspSha256,c.hash(raw));qa.inspectWorld(raw);a(c.serialize(c.parse(raw)).equals(raw));
 fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/native',{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});a(!fs.existsSync(D+'/baseline.qsp.gz'));fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));
 fs.writeFileSync(D+'/PLAN_KO.md',`# R03-8 키키모라 최저 외모4\n\n2026-11-13 사용자 승인: 기존 >3 뜻대로 외모4이상을 저장해 현재 납품검사에 연결한다. 실행 #npc_base의 해당 요구 정의와 $ongload의 알려진 옛 요구 문자열만 변경한다. 다른 기술 비교식·요구·분류·대사·가격·인물·재산·진행과 사용자 편집은 유지한다.\n\n성인 합성 인물의 실제 납품에서 외모3/4/5,기존 다른 요구/고객과 옛 콜백2회로드·수동 편집을 RED→수정후 비교한다. 공식 재생/멱등/역검증·구조 후 WORK·소스·원장·문서를 맞추고 이번 임시 사본만 정리한다. 새 인물별 필드/로케이션은 없다. 개인 SAV/GUI/전체출고검증·Full·음원·커밋푸시·최종 마이그레이션은 별도다.\n`);
 const p=R+'/records/release-prep-20261113/checklist.json',s=rd(p),e=s.items.find(x=>x.id==='R03');e.status='진행 중';e.notes='R03-1~7 완료. R03-8 키키모라 외모4이상 사용자 승인, 실제 납품·옛 요구 갱신 검증 중.';s.history.push({date:'2026-11-13',item:'R03-8',decision:'키키모라 외모4이상 승인'});wr(p,s);console.log(JSON.stringify({before:c.hash(raw),D,T}));
}
module.exports={R,G,D,T,c,qa,sv,rd,wr,nl,q,body,put,legacy,current};
