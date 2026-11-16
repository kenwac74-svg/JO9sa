'use strict';
const fs=require('fs'),a=require('assert/strict'),z=require('zlib');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/release-r03b-artemia-skills-20261113',T='G:/Codex/tmp/release-r03b-artemia-skills-20261113';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sv=require(R+'/tools/qa/save-codec.cjs');
const limits={music:4,oral:5,penetration:5,petting:5,orgy:5,roleplay:5,xenophily:4,fetishism:4};
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(nl(s),-5);};
if(require.main===module&&process.argv[2]==='prepare'){
 const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),'d64c350069b0a2a1d9e659cf9aad11c401af77bca532329ceafe19347c862ec5');a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a.equal(rd(R+'/assets/runtime-source-2.4.1.json').sourceQspSha256,c.hash(raw));qa.inspectWorld(raw);
 fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/native',{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});if(fs.existsSync(D+'/baseline.qsp.gz'))a(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).equals(raw));else fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));if(!fs.existsSync(D+'/manifest.before.json.gz'))fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));
 fs.writeFileSync(D+'/PLAN_KO.md',`# R03-2 아르테미아 기술 조건

2026-11-13 사용자가 기존 부등호 뜻대로4/5이상 적용을 승인했다. 음악·이종·페티시즘4,애무·구강·삽입·단체·역할놀이5를 최저값으로 저장한다. 음악 중복1줄은 동일 대입으로 유지해 정리 범위를 늘리지 않는다.

현재 #npc_base 정의와 $ongload의 알려진 옛 아르테미아 콜백만 변경한다. 가격/전체등급8/외모5/특성/연령/다른NPC/인물/재산/진행은 유지한다. 새 함수·세이브 필드·변환기·Full·음원·커밋푸시 없음.

순서: 실제 정의가8개 값을 저장하지 않는RED→정확2개 편집 후보→실제 전체납품검사에서각기술의최저-1/최저와전체최저값경계,저장캐시/수동문구보존→공식재생/멱등/구조/역검증→WORK/추적/manifest적용→릴리즈체크리스트 R03-2 완료와잔여구분. 개인SAV/시각/전체출고검증은별도다.
`);
 const sp=R+'/records/release-prep-20261113/checklist.json',s=rd(sp),e=s.items.find(x=>x.id==='R03');e.status='진행 중';e.notes='R03-1 완료. R03-2 아르테미아 기술8종4/5이상 사용자 승인, 해당 정의/캐시/납품경계만 수정 검증 중.';s.history.push({date:'2026-11-13',item:'R03-2',decision:'기존 부등호대로4/5이상 적용 승인'});wr(sp,s);console.log(JSON.stringify({before:c.hash(raw),limits,D,T}));
}
module.exports={R,G,D,T,c,qa,sv,rd,wr,nl,q,body,put,limits};
