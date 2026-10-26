'use strict';
// 현재 WORK의 노예 거래 인물 설정과 호출 위치를 읽기 전용으로 조사한다.
const fs = require('node:fs');
const c = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qsp = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw = fs.readFileSync(qsp), world = c.parse(raw);
const body = name => c.shift(world.lines[world.locations.find(x => x.name === name).body], 5).split('\r\n');
const keywords = /노예상|노예 상인|노예 매매|밀수업자|노예중개|재매입상|slave.trader|slaver|smuggl/i;
const names = new Map();
for (const name of ['#npc_base', '#simple_npc', '#masters_base']) {
  const lines = body(name);
  let current = '';
  lines.forEach((line, index) => {
    const found = line.match(/^\s*\$npc_(name|status|info|image|alignment)\[['"]([^'"]+)['"]\]\s*=\s*(.*)/);
    if (found) {
      current = found[2];
      if (!names.has(current)) names.set(current, {id: current, fields: {}, lore: []});
      names.get(current).fields[found[1]] = found[3];
    }
    if (current && keywords.test(line)) names.get(current).lore.push({location: name, line: index + 1});
  });
}
const mode = process.argv[2] || 'lore';
if (mode === 'report' || mode === 'refresh-report') {
  const path=require('node:path'),a=require('node:assert/strict');
  const expected='c362bde0e8cf814e3e28efd594e27482ef33ea0fa3a5b142f95c96164c5ea3eb';
  a.equal(c.hash(raw),expected);a(c.serialize(world).equals(raw));a.equal(world.locations.length,267);
  const record=process.argv[3] || 'G:/somi/JO9sa/records/npc-slave-trade-inventory-20261024';
  a(!fs.existsSync(record) || (mode==='refresh-report' && record==='G:/somi/JO9sa/records/npc-slave-trade-inventory-20261024'),'Do not overwrite an unrelated audit');
  const plain=s=>s?s.trim().replace(/^['"]|['"]$/g,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim():'';
  const nameIndex=new Map();
  for(const n of ['#simple_npc','#npc_base','#masters_base'])for(const line of body(n)) {
    let m=line.match(/^\s*dynamic\s+\$sn_cycle,\s*'([^']+)',\s*'([^']*)'/i);
    if(m)nameIndex.set(m[1],m[2]);
    m=line.match(/^\s*\$npc_name\[['"]([^'"]+)['"]\]\s*=\s*(['"].*)/);
    if(m)nameIndex.set(m[1],plain(m[2]));
  }
  const references=(location,re)=>body(location).map((text,i)=>({line:i+1,text})).filter(x=>!/^\s*!/.test(x.text)&&re.test(x.text));
  const arrayRows=(location,array)=>references(location,new RegExp('^\\s*\\$'+array+'\\[')).map(x=>{
    const m=x.text.match(/\[(\d+)\]\s*=\s*['"]([^'"]+)['"]/);return m?{slot:+m[1],id:m[2],name:nameIndex.get(m[2])||m[2],location,line:x.line}:null;
  }).filter(Boolean);
  const auction=arrayRows('#npc_base','auction_buyer'),repeat=arrayRows('npc_progress','repeat_npc_id');
  const demands=references('#npc_base',/^\s*\$buyer_demand\[/).map(x=>({id:x.text.match(/\[['"]([^'"]+)['"]\]/)[1],location:'#npc_base',line:x.line}));
  const ic=body('interaction_city'),invites=[];
  for(let i=0;i<ic.length;i++)if(/^\s*\$interaction_type\s*=\s*'buyer_invitation'/.test(ic[i])) {
    let start=i,end=i+1;
    while(start>0 && !/^\s*if\s+interaction_city\s*=/i.test(ic[start]))start--;
    while(end<ic.length && !/^\s*if\s+interaction_city\s*=/i.test(ic[end]))end++;
    const window=ic.slice(start,end).join('\n'),m=window.match(/\$npc_id\s*=\s*['"]([^'"]+)['"]/);
    if(m)invites.push({id:m[1],name:nameIndex.get(m[1])||m[1],location:'interaction_city',line:i+1});
  }
  a.equal(auction.length,171);a.equal(new Set(auction.map(x=>x.id)).size,170);a.equal(repeat.length,30);a.equal(new Set(demands.map(x=>x.id)).size,92);a.equal(invites.length,138);a.equal(new Set(invites.map(x=>x.id.toLowerCase())).size,127);
  const E=(location,line,end)=>({location,line,end:end||line});
  const rows=[
    {name:'경매인 잡파',ids:['фарид_аукционщик','zappa'],place:'거래 광장 · 노예 무대',group:'일반 매입·판매',buy:'가능',sell:'가능 · 일일 경매',detail:'낙인 없음은 매입. 낙인 있음은 brand_reputation<=3일 때 거절, >3이면 예외 매입. 파리드 키와 잡파를 두 사람으로 세지 않는다.',refs:[E('#npc_base',695,708),E('slave_auction_sell',14,45),E('slave_auction_sell_end',8,10)]},
    {name:'웡 나으리',ids:['master_vong'],place:'노예상 길드',group:'일반 매입',buy:'가능',sell:'확인 안 됨',detail:'판매부 대표이자 재매입상. 길드 진입 메뉴는 존재 상태와 brand>0을 요구하며, 실제 매입 확인 선택지는 rating>0일 때 생성된다.',refs:[E('#npc_base',421,424),E('guild',22,32),E('interaction_city',12859,12894)]},
    {name:'마스터 스컵스',ids:['master_skups'],place:'노예상 길드',group:'감정·탐색·조달',buy:'일반 매입 경로 미확인',sell:'맞춤 탐색 후 인도',detail:'감정부 대표. 조건에 맞는 인물을 선불 수수료로 찾아 공급한다. 소개에서도 평소 자문과 드문 재판매를 구분한다.',refs:[E('#npc_base',415,418),E('interaction_city',12903,12965),E('expert_to_slave',1,14)]},
    {name:'발랄라이카',ids:['bararaika'],place:'빈민가 · 밀수업자 소굴',group:'밀수 공급',buy:'매입 경로 미확인',sell:'가능 · 복제 및 고정 재고',detail:'밀수업자 우두머리. 플레이어에게 재고를 공급하여 플레이어가 상표를 새기고 재판매하는 설정. 문신 때문에 매입을 거절하는 분기는 확인되지 않았다.',refs:[E('#npc_base',365,368),E('#options',2173,2296),E('#static_txt',1223,1239),E('interaction_city',11495,11537),E('interaction_city',12054,12129)]},
    {name:'나타샤',ids:['natasha'],place:'안개의 경계 · 암시장',group:'암시장 공급',buy:'매입 경로 미확인',sell:'가능 · 일반/특별 재고',detail:'시장 주인의 전속 판매원이며 상태에 노예 상인으로 명시되어 있다. black_market_interface도 같은 암시장 재고의 확장으로, 별도 상인으로 세지 않는다.',refs:[E('#npc_base',371,375),E('#options',6354,6410),E('interaction_city',20014,20745),E('black_market_interface',108,115)]},
    {name:'유전학 교수 바이너',ids:['Viner'],place:'배제 구역 · 동물 농장',group:'전문 재고 공급',buy:'현금 매입 경로 미확인',sell:'가능 · 전문 재고',detail:'동물 농장의 고정 재고를 판매한다. 현재 노예를 잠시 수용하는 동작은 재매입과 다르다.',refs:[E('#options',4941,5004),E('interaction_city',14092,14344)]},
    {name:'쿨라',ids:['kula','kulaside'],place:'팔라티노 언덕 · 비밀 상점',group:'특수 재고 공급',buy:'매입 경로 미확인',sell:'가능 · 고정 재고',detail:'판매 이벤트6236~6257의 22개 분기. 이어지는6258~6261의 네 분기는 번호가 연속이어도 발랄라이카에게 속한다.',refs:[E('#npc_base',679,692),E('interaction_city',11643,12053)]},
    {name:'여주인 안젤리카',ids:['mistress_angelika','госпожа_ангелика'],place:'노예상 길드',group:'길드 계약·중개',buy:'계약 조건 충족 시 인수',sell:'일반 재고 판매 아님',detail:'길드 마스터이자 납품/위탁훈련 계약 담당. 자유로운 도매 매입상 웡 및 경매 서비스와 구분한다.',refs:[E('#masters_base',1862,1873),E('interaction_city',4905,4963),E('interaction_city',5029,5034)]},
    {name:'쿠마',ids:['kuma','kuma1'],place:'교회 관련 장면',group:'설정상 현역 노예상',buy:'거래 메뉴 미확인',sell:'거래 메뉴 미확인',detail:'현재 직업이 노예상이라고 명시되어 있다. 두 ID는 같은 인물이며, 현재 일반 매매 기능이 있다는 뜻은 아니다.',refs:[E('#npc_base',653,667),E('interaction_city',5421,5433)]}
  ];
  const boundaries=[
    {name:'이름 없는 경매 중개인',ids:['Middleman'],role:'길드 경매의 최저가 낙찰 역할',detail:'웡과 동일 인물이라는 코드 연결 없음. 별도 이름 있는 상인으로 세지 않는다.',refs:[E('$guild_auction',67,69)]},
    {name:'수상한 중개인',ids:['broker'],role:'의뢰 알선',detail:'조합 소속 중개인 설정과 퀘스트 제공은 있으나 해당 분기에 매매 이전/대금 지급은 없다.',refs:[E('#npc_base',711,717),E('interaction_city',12195,12211)]},
    {name:'뱀파이어 헌터',ids:['vampire_hunter'],role:'개인 구매자 + 한정 재고 판매',detail:'10011은 반복 개인 매입,10014는 고정 인물 한 명의 판매. 일반 도매상으로 분류하지 않는다.',refs:[E('interaction_city',18984,18990),E('interaction_city',19026,19059)]},
    {name:'래빗 홀의 이름 없는 관리자',ids:[],role:'고정 인물의 한정 양도',detail:'10337→10338의 몸값 거래. 이름 있는 반복 노예상은 아니다.',refs:[E('#options',6958),E('interaction_city',23938,23979)]},
    {name:'도살자',ids:['butcher'],role:'전문 처분 매입',detail:'11544→115441 등에서 대금 지급/인물 제거를 수행하나, 살아 있는 노예를 재판매하는 일반 유통상과 다르다.',refs:[E('interaction_city',877,912)]}
  ];
  const exclusions=[
    {name:'마스터 알렉스',why:'대금을 받는 훈련 서비스; 일반 매입·재고 공급 경로는 미확인',refs:[E('interaction_city',19552,19700)]},
    {name:'인형사',why:'관련 의뢰 제공·결과 확인을 매매로 세지 않음',refs:[E('interaction_city',22460,22493)]},
    {name:'사브리나·제인',why:'과거 길드 교육/졸업 배경만으로 현역 거래 서비스로 분류하지 않음',refs:[E('#npc_base',7481,7491),E('#npc_base',7938,7941)]},
    {name:'슐랴프킨',why:'활성 설정은 화가. 전 길드원 설명이 있는 #npc_base_woman은 현재 호출 미확인',refs:[E('#npc_base',7474,7477)]}
  ];
  a(body('slave_auction_sell').some(x=>x.includes("slave['brand'] > 0 and brand_reputation <= 3")));
  a(body('guild').some(x=>x.includes("slave['brand'] > 0")));
  a(body('#npc_base').some(x=>x.includes("$npc_status['kuma']")&&x.includes('노예상')));
  for(const code of [6258,6259,6260,6261]){
    const start=ic.findIndex(x=>new RegExp('^\\s*if\\s+interaction_city\\s*=\\s*'+code+':','i').test(x));a(start>=0);
    a(ic.slice(start,start+17).some(x=>/\$npc_id\s*=\s*'bararaika'/.test(x)),'Do not attribute consecutive smuggler events to Kula');
  }
  const calls=[];
  for(const l of world.locations)body(l.name).forEach((text,i)=>{if(!/^\s*!/.test(text)&&/\b(?:gs|gt)\s+['"]#npc_base_woman['"]/i.test(text))calls.push({location:l.name,line:i+1});});
  a.equal(calls.length,0);
  const result={date:'2026-10-24',status:'READ_ONLY_AUDIT_COMPLETE',qsp,sha256:c.hash(raw),locations:267,roundtrip:true,engineExecuted:false,runtimeFilesChanged:false,userSavesChanged:false,pricingImplemented:false,coreNamedRoles:rows.length,roles:rows,boundaries,exclusions,registry:{auctionSlots:auction.length,auctionUniqueIds:new Set(auction.map(x=>x.id)).size,buyerDemandUniqueIds:new Set(demands.map(x=>x.id)).size,repeatSlots:repeat.length,buyerInvitationOccurrences:invites.length,buyerInvitationUniqueCaseInsensitiveIds:new Set(invites.map(x=>x.id.toLowerCase())).size,dormantFemaleBaseCallers:calls},limits:['Source and callback audit, not complete GUI playthrough','Registry entries are not counts of reachable unique merchant people','Settings-only, supplier-only, personal-customer and emergency-disposal roles kept distinct']};
  const ref=r=>`${r.location}:${r.line}${r.end!==r.line?'-'+r.end:''}`;
  const md=`# 노예 매매·중개 NPC 전수 조사\n\n2026-10-24 현재 WORK를 읽기 전용으로 조사했다. 가격식·세이브·게임 파일 수정, 엔진 실행, 커밋·푸시는 하지 않았다.\n\n기준 SHA256: ${result.sha256}. 267로케이션, 수정 없는 바이트 왕복 일치. 아래 줄 번호는 디코딩된 로케이션 본문의 1기준 줄이며 QSP 바이너리 전체 행 번호가 아니다.\n\n## 결론\n\n현재 일반적인 즉시 매입 서비스가 확인된 이름 있는 NPC는 **경매인 잡파와 웡 나으리**다. 공급·감정/조달·계약·직업 설정까지 범위를 넓히면 아래9명이 핵심 명단이다. 매입자와 판매자를 같은 뜻으로 쓰지 않는다.\n\n| 인물 | 위치 | 현재 역할 | 내 노예 매입 | 나에게 판매·인도 |\n|---|---|---|---|---|\n${rows.map(x=>`|${x.name}|${x.place}|${x.group}|${x.buy}|${x.sell}|`).join('\n')}\n\n## 인물별 설정·코드 근거\n\n${rows.map(x=>`- **${x.name}** (${x.ids.join(', ')}): ${x.detail} 근거: ${x.refs.map(ref).join(', ')}.`).join('\n\n')}\n\n## 앞선 설명 정정: 낙인 거절\n\n발랄라이카가 노예상 문신을 보고 매입을 거절한다는 앞선 답변은 코드 확인 전에 동의한 것이므로 정정한다. 현재 확인된 분기는 잡파의 slave_auction_sell:34, 조건은 brand>0 AND brand_reputation<=3이다. 같은 본문43~45에서 명성>3일 때 예외 매입한다. 이는 문신형 brand=2만의 조건이 아니라 인장1·문신2·마법3·조합4 등 모든 양수값 조건이다. 발랄라이카의 현재 메뉴는 공급이며, 플레이어에게서 매입하는 분기 자체는 확인되지 않았다.\n\n## 경계·특수 역할\n\n| 인물·역할 | 분류 | 확인 결과 | 근거 |\n|---|---|---|---|\n${boundaries.map(x=>`|${x.name}|${x.role}|${x.detail}|${x.refs.map(ref).join(', ')}|`).join('\n')}\n\n## 개인 고객을 노예상과 구분\n\n맨헌터·조프리·아주라·카가미·브리나·에게야·알리나·발렌티나·엘리자베스 등에게도 실제 반복 매입 경로가 있다. 그러나 자신의 점포·기관·취향에 맞는 인물을 구하는 개별 고객이므로 불특정 재고를 할인 매입하는 도매상으로 묶지 않는다. 별도 자료 registry.json에 현재 활성 등록 ID·이름·출처만 남겼으며 개인의 구체적 취향 대사는 복제하지 않았다.\n\n- 활성 경매 명단:171칸/170고유ID. Varvar_king 중복이 있고 실제 참여는 별도 조건으로 제한된다.\n- 활성 #npc_base의 buyer_demand:92고유ID. #masters_base의 mistress_angelika는 별도 계약 담당이다.\n- npc_progress 반복 고객:30칸. 같은 인물의 여러 주문과 오래된 ID가 있어30명이라는 뜻은 아니다.\n- 현재 검사에서 추출한 buyer_invitation:${invites.length}분기/${new Set(invites.map(x=>x.id.toLowerCase())).size}대소문자 무시 고유ID. 이 수도 상인 직업 인원수가 아니다.\n- #npc_base_woman은 현재 직접 호출0건으로, 그 내부 명단을 활성 인물에 합산하지 않았다.\n\n## 제외·불확실성\n\n${exclusions.map(x=>`- ${x.name}: ${x.why}. 근거:${x.refs.map(ref).join(', ')}.`).join('\n')}\n\n이름 없는 암시장 주인은 나타샤 소개의 배후 소유주이며, 조사한 판매 분기에는 별도 상인 NPC ID가 없다. 잡파의 과거 파리드 키, 쿠마의 두 ID, 쿨라의 보조 ID를 다른 사람으로 세지 않았다. GUI에서 모든 퀘스트·접근 조건을 실플레이한 결과는 아니며, 코드상 정의와 호출·대금·이전 경로를 대조한 결과다.\n\n## 경제 개편에 이어갈 기준\n\n사용자 확정 방향은 현재 성격·능력·기술·특성의 가산·감산으로 공통 고유 정가를 산출한 뒤, **매입 자격 확인 → 해당 구매자의 지급률·취향 가산**을 적용하는 것이다. 구입액 기록은 사용하지 않는다. 장식 문신의 고객 호불호는 이번 검토 대상에서 제외하고 소유 상표 조건만 구분한다. 아직 정가 가중치나 거래처별 지급률을 확정·구현하지 않았다. 현재 목록의 공급자에게 새 재매입 기능을 붙이는 것은 별도의 기능 확장이다.\n`;
  fs.mkdirSync(record+'/scripts',{recursive:true});
  fs.writeFileSync(record+'/README_KO.md',md.replace(/\n/g,'\r\n'));
  fs.writeFileSync(record+'/inventory.json',JSON.stringify(result,null,2)+'\n');
  fs.writeFileSync(record+'/registry.json',JSON.stringify({auction,demands:demands.map(x=>({...x,name:nameIndex.get(x.id)||x.id})),repeat,buyerInvitations:invites},null,2)+'\n');
  fs.copyFileSync(__filename,record+'/scripts/reproduce.cjs');
  a.equal(c.hash(fs.readFileSync(qsp)),expected);
  console.log(JSON.stringify({record,status:result.status,sha256:result.sha256,coreNamedRoles:rows.length,registry:result.registry,runtimeChanged:false}));
} else if (mode === 'lore') {
  console.log(JSON.stringify({sha256: c.hash(raw), locations: world.locations.length, roundtrip: c.serialize(world).equals(raw)}));
  for (const value of names.values()) if (value.lore.length) console.log(JSON.stringify({id:value.id,name:value.fields.name,status:value.fields.status,image:value.fields.image,lore:value.lore}));
} else if (mode === 'body') {
  const name = process.argv[3], start = +process.argv[4], end = +process.argv[5];
  console.log(body(name).map((line, i) => [i + 1, line]).filter(([i]) => i >= start && i <= end).map(([i, line]) => `${i}: ${line}`).join('\n'));
} else if (mode === 'names') {
  for (const id of process.argv.slice(3)) {
    const value=names.get(id);
    console.log(JSON.stringify(value ? {id:value.id,name:value.fields.name,status:value.fields.status,image:value.fields.image,lore:value.lore} : {id,missing:true}));
  }
}
if (c.hash(fs.readFileSync(qsp)) !== c.hash(raw)) throw new Error('WORK changed during read-only audit');
