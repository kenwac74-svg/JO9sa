const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/fertility-kula-wording-20261112',T='G:/Codex/tmp/fertility-kula-wording-20261112',id='2026-11-12_zz_fertility_kula_wording';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n'),body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s,-5),q=s=>"'"+s.replace(/'/g,"''")+"'";
function inspectScope(base,after,edits){
 const before=c.parse(base),next=c.parse(after),allowed=new Set(edits.map(e=>e.location));a.deepEqual(before.locations.map(l=>l.name),next.locations.map(l=>l.name));
 const mask=(n,s)=>n==='sjm_UI_UIadds'?s.replace(/tooltip-data="[^"]*"/g,'tooltip-data="LABEL"'):n==='interaction_city'?s.replace(/^    \$text\[1\] = .*$/gm,'    $text[1] = DIALOGUE'):s.replace(/\$snk_fertility_tip = '[^\r\n]*'/g,'$snk_fertility_tip = LABEL');
 for(const l of before.locations){const old=body(before,l.name),nu=body(next,l.name);if(old!==nu){a(allowed.has(l.name));a.equal(mask(l.name,old),mask(l.name,nu),'Non-display code changed: '+l.name);}else a(!allowed.has(l.name));}
 // Replace only exact recorded display lines back; entire serialized file must recover.
 const restored=c.parse(after);for(const e of [...edits].reverse()){const old=body(restored,e.location);a.equal(old.split(e.new).length-1,e.count);put(restored,e.location,old.split(e.new).join(e.old));}a(c.serialize(restored).equals(base),'Non-target bytes changed');
 return qa.inspectWorld(after);
}
if(process.argv[2]==='prepare'){
 fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});const raw=fs.readFileSync(G+'/jack.qsp');qa.inspectWorld(raw);a.equal(c.hash(raw),c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));const d=c.parse(raw),edits=[];
 function edit(n,old,nu){a.notEqual(old,nu);a.equal(body(d,n).split(old).length-1,1);put(d,n,body(d,n).replace(old,nu));edits.push({location:n,field:'body',old,new:nu,count:1,patchId:'FERTILITY_KULA_WORDING_20261112'});}
 const label=role=>"<<iif("+role+"['fertility_revealed'] > 0, '임신 가능한 체질', '가임성 미확인')>>";
 for(const role of ['slave','assistant']){const lines=body(d,'sjm_UI_UIadds').split('\r\n'),start=lines.findIndex(s=>s.trim()==='if '+role+"['fertility'] < 0:"),end=lines.findIndex((s,i)=>i>start&&s.includes(role+"['arousal']"));a(start>0&&end>start);const chosen=lines.slice(start,end);let ga=0;
 for(const old of chosen){let nu=old;if(old.includes('tooltip-data="안전일"'))nu=old.replace('tooltip-data="안전일"','tooltip-data="가임성 미확인"');if(old.includes('tooltip-data="산란기"'))nu=old.replace('tooltip-data="산란기"','tooltip-data="산란형 체질"');if(old.includes('tooltip-data="가임기"')){ga++;nu=old.replace('tooltip-data="가임기"','tooltip-data="'+(ga===1?'가임성 미확인':label(role).replaceAll("'","''"))+'"');}if(old!==nu)edit('sjm_UI_UIadds',old,nu);}a.equal(ga,2);}
 for(const n of ['slave_private_room1','slave_private_room2','slave_private_room3','slave_private_room4','snk_room_menu_screen']){let safe=0;const role=n==='snk_room_menu_screen'?'slave':'room'+n.slice(-1),lines=body(d,n).split('\r\n');for(let i=0;i<lines.length;i++){const old=lines[i];let nu=old;if(old.includes("$snk_fertility_tip = '안전일'")){safe++;nu=old.replace("$snk_fertility_tip = '안전일'","$snk_fertility_tip = "+q(safe===1?'가임성 미확인':'평상시'));}if(old.includes("$snk_fertility_tip = '산란기'"))nu=old.replace("$snk_fertility_tip = '산란기'","$snk_fertility_tip = '산란형 체질'");if(old.includes("$snk_fertility_tip = '평시'"))nu=old.replace("$snk_fertility_tip = '평시'","$snk_fertility_tip = "+q(label(role)));if(old!==nu)edit(n,lines[i-1]+'\r\n'+old,lines[i-1]+'\r\n'+nu);}a.equal(safe,2);}
 const old=body(d,'interaction_city').split('\r\n').find(s=>s.includes('바로 만삭이 되었답니다 열흘정도 있으면 출산하겠네요'));a(old);const kula="[쿨라]<br>&nbsp;사용인들의 마법 처치가 끝났어요. 현재는 임신 중기 상태예요. 이후 경과는 임신 정보에서 확인해 주세요.</div><!-- #nwtx -->";edit('interaction_city',old,'    $text[1] = '+q(kula));
 const out=c.serialize(d),check=inspectScope(raw,out,edits);a.equal(edits.length,29);a.equal(body(d,'sjm_UI_UIadds').match(/tooltip-data="가임기"|tooltip-data="안전일"/g),null);for(const n of ['slave_private_room1','slave_private_room2','slave_private_room3','slave_private_room4','snk_room_menu_screen'])a(!body(d,n).includes("$snk_fertility_tip = '안전일'"));a.equal(body(d,'interaction_city').split("slave['pregnant'] = 140").length-1,1);
 const mod={id,status:'APPROVED',before_sha256:c.hash(raw),after_sha256:c.hash(out),description:'사용자 승인: 가임성·평상시 표시와 쿨라 실제 효과 안내만 정정. 상태/수치/판정/아이콘/실행 경로 보존.',edits};wr(R+'/mods/'+id+'.json',mod);wr(T+'/mods/'+id+'.json',mod);fs.writeFileSync(T+'/candidate.qsp',raw);fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));wr(D+'/verification.json',{before:c.hash(raw),after:c.hash(out),edits:edits.length,locations:[...new Set(edits.map(e=>e.location))],structure:check,scope:'Only tooltip text and one dialogue line; existing conditions, assignments, resources and non-target bytes preserved',engine:'Not run: low-risk display wording only',gui:'User visual check pending'});console.log(JSON.stringify({edits:edits.length,after:c.hash(out)}));
}else if(process.argv[2]==='finish'){
 const p=rd(D+'/verification.json'),mod=rd(R+'/mods/'+id+'.json'),raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),p.after);a.equal(c.hash(fs.readFileSync(T+'/candidate.qsp')),p.after);const baseline=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));inspectScope(baseline,raw,mod.edits);
 fs.copyFileSync(G+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp');const m=rd(R+'/assets/runtime-source-2.4.1.json');a.equal(m.sourceQspSha256,p.before);m.sourceQspSha256=p.after;for(const f of m.files)if(f.runtimePath==='jack.qsp'){f.sha256=p.after;f.bytes=raw.length;}m.latestFertilityKulaWording={date:'2026-11-12',mod:id,report:'records/fertility-kula-wording-20261112/REPORT_KO.md'};wr(R+'/assets/runtime-source-2.4.1.json',m);fs.copyFileSync('./fertility-wording.cjs',D+'/fertility-wording.cjs');
 const report=`# 가임성 표시·쿨라 안내 문구 정정 — 2026-11-12

사용자 지시: 수치를 건드리지 않고 실제 효과에 맞게 문구만 수정. 최신 WORK를 다시 읽고 WORK/추적 QSP만 맞췄다. Full·JSON·SAV·음원·커밋·푸시는 변경하지 않았다.

## 바뀐 문구

- 노예/조수 기본 아이콘: 가임기는 임신 가능한 체질 또는 가임성 미확인으로 표시한다. 원래 fertility_revealed에 따라 표시 문구만 선택하며 숨겨진 불임이나 임신을 공개하지 않는다.
- 미확인 불임 분기의 안전일은 가임성 미확인으로 표시한다. 기존 아이콘은 유지한다.
- 개인실1~4와 기존 개인실 메뉴: 미확인 가임성과 주기 판정을 구분한다. 원래 의료/배란 조건으로 표시하던 안전일은 평상시로, 평시는 확인된 체질/가임성 미확인으로 정리했다. 실제 배란기 표시는 유지한다.
- 산란기는 시기를 뜻하지 않는 산란형 체질로 정정했다.
- 쿨라951026: “사용인들의 마법 처치가 끝났어요. 현재는 임신 중기 상태예요. 이후 경과는 임신 정보에서 확인해 주세요.”로 수정했다. 근거는 기존 pregnant=140과 임신 중기 표시 기준120, 만삭 기준273이다. 수치·조건을 바꾸거나 출산 시점을 새로 약속하지 않았다. 새 대사의 숨김 nwtx 표시는 유지한다. 툴팁은 HTML을 해석하지 않아 숨김 태그를 값에 넣지 않았다.

## 입출력·유지보수

기존 표시 호출(sjm_UI_UIadds, 개인실1~4, snk_room_menu_screen)과 interaction_city951026에서만 새 문구를 출력한다. 입력은 기존 fertility/fertility_revealed·ovulation·pregnant·의료 조건이며 값을 쓰는 경로는 바꾸지 않았다. 가임성 공개 여부에 따른 iif는 HTML/툴팁 문자열 안의 표시 선택뿐이다. 기존 주기·확률·임신 공개 판정·pregnant=140·비용·상태·이미지 경로는 동일하다. 별도 캐시/마이그레이션이나 영구 변수는 추가하지 않았다. 게임을 재실행하고 화면/장면을 다시 열면 새 QSP 문구를 사용한다. 열린 장면의 옛 text 캐시 자체를 SAV에서 일괄 교체하는 작업은 아니다.

## 검증

29줄·7개 location의 표시문구만 변경했다. 툴팁/설명 값을 마스킹하면 기존 코드와 동일하고, 각 새 줄을 역치환한 QSP가 baseline과 바이트 단위로 동일하다. QSP 왕복·구조·CRLF·마커 경계 통과. 공식 도구의 격리 재생과 재적용·실제 WORK 반영 후 소스/메타 대조를 확인했다.

최종 SHA-256: ${p.after}. 재현 스크립트와 verification.json, 적용 로그를 보존한다. 저위험 문구 수정 기준에 따라 전체 엔진/플레이 검사는 실행하지 않았다. 실제 툴팁/대사창 외형과 사용자 SAV 메뉴 불러오기는 미확인이다.

일반 EXE 재실행 후 ① 노예/조수·개인실 아이콘 툴팁의 체질/미확인 구분 ② 쿨라 서비스 완료 안내의 중기 문구를 확인한다. 쿨라 처리를 확인하려고 새 게임 효과를 실행할 필요 없이 해당 장면을 정상 플레이할 때 확인하면 된다.

복구는 baseline.qsp.gz와 manifest.before.json.gz, 선언형 mod의29개 역치환을 사용한다. 이후 변경이 있으면 전체 과거 QSP를 덮어쓰지 않고 이 문구 변경만 대조한다. 이 패치를 제거하면 옛 안내가 돌아오며 인물 수치/세이브는 바뀌지 않는다.
`;
 fs.writeFileSync(D+'/REPORT_KO.md',report);const f=R+'/docs/SESSION_HANDOFF_INDEX.md',head='## 2026-11-12 Codex: 가임성·쿨라 안내 문구 정정';const idx=fs.readFileSync(f,'utf8');if(!idx.includes(head))fs.writeFileSync(f,head+'\n\n[문구·범위·검증·사용·복구](../records/fertility-kula-wording-20261112/REPORT_KO.md). 사용자 지시로 노예/조수·개인실의 가임기/안전일/산란기 표현과 쿨라의 만삭·열흘 보장을 실제 체질/미확인/평상시·임신중기 안내로 맞췄다. 수치·실행 판정·확률·공개시점·아이콘 보존, 29줄7location 문구범위/바이트역검증·구조/마커·공식재생/재적용 통과. WORK/소스/메타'+p.after.slice(0,8)+' 일치. 전체 엔진/GUI 미실행. Full·음원·커밋푸시 없음.\n\n'+idx);
 const audit=R+'/records/handoff-gap-audit-20261112/REPORT_KO.md';const old=fs.readFileSync(audit,'utf8');if(!old.includes('가임성·쿨라 문구 정정 완료'))fs.writeFileSync(audit,'## 후속 반영 · 2026-11-12\n\n가임성·쿨라 문구 정정 완료: 사용자 승인으로 A01/A02 중 표시·안내만 수정했다. 수치·판정은 보존하며 서비스의 동작 변경은 포함하지 않는다. [반영 기록](../fertility-kula-wording-20261112/REPORT_KO.md). 아래 표는 최초 점검 당시 기록이다.\n\n'+old);
 a.equal(c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);a.equal(rd(R+'/assets/runtime-source-2.4.1.json').sourceQspSha256,p.after);console.log('WORK/source/manifest and display-only scope PASS '+p.after);
}
