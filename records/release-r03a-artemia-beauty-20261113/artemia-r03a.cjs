'use strict';
const fs=require('fs'),a=require('assert/strict'),z=require('zlib');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/release-r03a-artemia-beauty-20261113',T='G:/Codex/tmp/release-r03a-artemia-beauty-20261113';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sv=require(R+'/tools/qa/save-codec.cjs');
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(nl(s),-5);};
if(require.main===module&&process.argv[2]==='prepare'){
 const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),'f03580b7d55d7100fe29e5ce1a2f9c8cb4bc8dd6bc1323478a89579a8073d14e');a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(rd(R+'/assets/runtime-source-2.4.1.json').sourceQspSha256,c.hash(raw));qa.inspectWorld(raw);
 fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/native',{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});if(!fs.existsSync(D+'/baseline.qsp.gz'))fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));else a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(raw));if(!fs.existsSync(D+'/manifest.before.json.gz'))fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));
 fs.writeFileSync(D+'/PLAN_KO.md',`# R03-1 아르테미아 최저 외모5

2026-11-13 사용자가 외모5이상으로 수정하도록 승인했다. 기존 잘못된 비교식 demand['min_beauty'] > 4를 해당 고객에 한해 =5로 바꾸고, $ongload에서 알려진 옛 요구 콜백의 그 구문만 갱신한다. 다른 조건·NPC·가격·프리셋·거래 완료·개인SAV·진행은 수정하지 않는다.

순서: 기존 정의의 최소값이 저장되지 않는 RED 확인 → 정확2개 편집 후보 → 정의/캐시와 실제 납품검사의 외모4/5/6 경계 확인 → 공식재생/재적용/역검증/구조 → WORK/추적/manifest 적용 → R03-1 결과와 남은R03을체크리스트에구분. 전체NPC요구나기술조건을이번한건에묶어수정하지않는다. 새저장필드·Full·음원·커밋푸시없음.
`);
 const sp=R+'/records/release-prep-20261113/checklist.json',s=rd(sp),e=s.items.find(x=>x.id==='R03');e.status='진행 중';e.notes='R03-1 아르테미아 최저 외모5 이상 사용자 승인. 해당 항목만 수정·검증 중,나머지 R03 별도 검토.';s.history.push({date:'2026-11-13',item:'R03-1',decision:'외모5이상으로 수정 승인'});wr(sp,s);console.log(JSON.stringify({before:c.hash(raw),D,T}));
}
module.exports={R,G,D,T,c,qa,sv,rd,wr,nl,q,body,put};
