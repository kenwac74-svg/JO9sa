'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=__dirname,read=n=>JSON.parse(fs.readFileSync(root+'/'+n,'utf8'));
const world=read('world/world-review.json'),family=read('family/family-review.json'),occupation=read('occupation/review.json');
const groups=[['세계',world.rows,40],['가족',family.rows,55],['직업',occupation.rows,60]];
const normalize=r=>{const v=r.recommendation;return v==='adopt_new'||v==='adopt'?'adopt':v==='keep_old'||v==='keep'||v==='keep_native'||v==='keepold'?'keep':v;};
const labels={adopt:'신안 기반 채택 권고',merge:'사실을 골라 병합',keep:'현행 사실 중심 유지',uncertain:'확인 보류'};
const rows=groups.flatMap(([group,a,n])=>{if(a.length!==n)throw Error(group+' coverage');return a.map(r=>({group,key:r.key,decision:normalize(r),reason:r.reason,classification:r.classification||r.classifications||[],old:r.old||r.oldFacts||'',difference:group==='세계'?r.incoming:group==='직업'?r.newDifference:'',evidence:r.primary_evidence||r.evidence||[]}));});
const counts={};for(const r of rows){if(!labels[r.decision])throw Error('Unknown recommendation '+r.decision);counts[r.decision]=(counts[r.decision]||0)+1;}
if(rows.length!==155||new Set(rows.map(r=>r.group+'|'+r.key)).size!==155)throw Error('Invalid full coverage');
const currentHash=c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
if(currentHash!=='ae591ef904a5fe0f4cbac3454815ac36cd1475464689869bb75c94e3e7fe7826')throw Error('Work changed during review');
const highlights=[
 ['사업가 가족','조선공학 부품 ↔ 자동차 부품','자동차 쪽 권고','2.3의 별도 한국어 설명·현재 대사 조각에 자동차가 있고 현대/사이버펑크 가족 배정과도 맞는다. 원어 오역 확정은 유보하며, 개인교사 등 다른 추가 설정은 별도로 판단한다.'],
 ['사관학교·메카 조종사','졸업 여부·로봇 형태의 명료화','새 설명의 핵심 채택','생성 코드의 직업명이 사관학교 졸업생·거대 인간형 전투 로봇 조종사를 지지한다. 새로 덧붙인 임관 시점이나 개별 조난 사건까지 확정하지는 않는다.'],
 ['다크 판타지·산업 전쟁 세계','같은 위협·전쟁을 더 생생하게 설명','어울리는 보강 채택','해당 차원의 위협과 생성 성향에 맞는 확장이다. 모든 세계를 같은 생활상으로 만들 필요는 없다. 선택한 확장은 원작 확인 사실과 구분한 편집 권고다.'],
 ['경찰 가족·사냥꾼 가족','보통 또는 넉넉한 생활 → 궁핍한 생활','기존 생활 수준 유지','출신 가정의 형편을 바꾸는 수정이다. 풍족했던 과거와 현재의 대비도 인물의 개성으로 남기는 편이 낫다.'],
 ['교도관 가족','근무지 주거 제공 → 관사 거주 의무','기존 제공 규정 유지','편의 제공과 강제 거주는 다른 제도다. 현재 자료만으로 법의 효과까지 바꿀 근거가 없다.'],
 ['유토피아·시인 가족','예술 중시 → 예술만 교육 / 병적 집착','예술 문화는 살리고 단정은 축소','목가적 세계라는 생성 분류와 높은 지성·감수성에 맞는 다양성을 유지한다. 과목을 오직 하나로 제한하거나 가족의 문화가 병적이라는 평가를 고정하지 않는다.'],
 ['산적 출신','주민과 거래하며 겨울 은신 → 빈민을 돕는 의적','기존의 독특한 거래 관계 유지','호혜적 거래와 자선 동기는 다르다. 살인을 피한다는 개성도 새 원고에서 잃지 않는 편이 좋다.'],
 ['제독·소행성 가족','직위·함종 승격 / 또래가 적음 → 전혀 없음','기존 범위를 두고 문장 병합','대제독·순양함·귀족학교 같은 세부와 모든 또래의 부재는 별도 설정이다. 여러 우주 문명에 걸쳐 쓰이는 배경의 범위를 불필요하게 좁히지 않는다.'],
 ['복제인간','신경 학습·운동 기술 → 복종 코드','학습 이력 유지','생성값은 자존심4·습관5·헌신1·공포0이다. 폭넓은 기술 학습을 현 주인에게 무조건 복종하는 상태와 같게 만들지 않는다. 기억이 적다는 사실도 평생 한 번도 밖을 보지 않았다는 뜻으로 확정하지 않는다.'],
 ['여러 직업의 끝맺음','과거 직업 뒤에 현재 감방·처우·공포·무력감 추가','과거 이력과 현재 반응 분리','과거의 조난 경위는 배경이 될 수 있다. 현재 맡은 일·주인에 대한 감정·이미 겪은 훈련은 플레이에 따라 바뀌므로 직업만으로 고정하지 않는다.']
];
const intro='155행(세계40·가족55·직업60)을 현재 기본문·화면용 대사 조각·생성 코드와 대조했다. 새 설정도 출신 차원과 직업·능력에 맞으면 채택을 권고한다. 현재와 다르다는 이유만으로 오역 또는 잘못된 설정이라고 판단하지 않았다. 아래 판정은 검토 권고이며 게임에 반영된 결과가 아니다.';
const summary='신안 기반 채택 '+counts.adopt+' / 사실 병합 '+counts.merge+' / 현행 사실 중심 유지 '+counts.keep+' / 확인 보류 '+counts.uncertain+' = 155행';
const conclusion='기존 한국어의 글자 그대로를 지키기보다 출신별 고유 사실과 인물의 관점을 살리는 편이 게임에 맞는다. 차원·가족·직업의 차이가 분명해지고, 주인과의 관계에 따라 현재 반응이 달라지는 방향을 권고한다.';
let md='# 02번 출신155행 — 설정 적합성 검토\n\n'+intro+'\n\n**권고 집계:** '+summary+'\n\n원어 러시아어/영어 출신 자료는 확보하지 못했다. 별도 2.3 한국어와 현재 생성값은 비교 근거이며 원어 충실도를 확정하는 증거는 아니다. 여성 경로는 참고로만 읽었고 재활성화하지 않았다. 일반152개의 조각1368개와 복제인간 직접 저장3개를 추출·대조했지만 실제 게임 화면·기존 세이브 실행 검사는 하지 않았다.\n\n## 주요 판단\n\n| 대상 | 달라진 설정 | 권고 | 이유 |\n|---|---|---|---|\n'+highlights.map(r=>'| '+r.join(' | ')+' |').join('\n')+'\n\n## 분야별 권고\n\n| 범위 | 신안 기반 채택 | 사실 병합 | 현행 사실 유지 | 보류 |\n|---|---:|---:|---:|---:|\n';
for(const [group,a]of groups){const k={adopt:0,merge:0,keep:0,uncertain:0};for(const r of a)k[normalize(r)]++;md+='| '+group+' | '+[k.adopt,k.merge,k.keep,k.uncertain].join(' | ')+' |\n';}
md+='\n‘유지’는 예전 남성 기본문의 오역까지 보존하자는 뜻이 아니다. 이미 개선된 실제 대사 조각의 사실을 기준으로 문체를 다듬을 수 있다. ‘채택’도 현재 관계·말투 분기를 없애고 원고 문단을 매번 그대로 출력하자는 뜻이 아니다.\n\n## 판단을 유보한 두 직업\n\n- rich_wife: 기존 번역의 관용구가 불명확하다. 새 원고의 특정 행위·배우자 연령·현재 대우까지 한꺼번에 확정하지 않는다.\n- time_plice: 시간 여행의 금지/통제 의미가 불분명하다. 경찰의 예외 권한일 수 있어 단순 모순으로 보지 않고, 새 차원 물리·도착 경위는 별도 검토한다.\n\n## 검토와 구현의 경계\n\n아직 게임에는 적용하지 않았다. 사용자 확정은 기존 설정과 조합 구조를 유지하며 변경 설정의 게임 적합성을 검토한다는 원칙이다. 이 문서의 개별 권고는 확정된 새 설정과 구분한다.\n\n후속 구현 시152개 일반 배경은 현재 조각 경로로, 복제인간3개는 직접 저장 경로로 다뤄야 한다. 사업가 가족 businessman/buissinesman 키 불일치와 기존 저장의 문구 갱신도 별도 기술 항목이다. 이번 검토에서 코드·필드·저장값은 바꾸지 않았다.\n\n'+conclusion+'\n\n기준 Work SHA256: `'+currentHash+'`.\n\n상세 근거: world/WORLD_REVIEW_KO.md, family/family-review.ko.md, occupation/REVIEW_KO.md 및 각 전수 판정 JSON.\n';
fs.writeFileSync(root+'/REPORT_KO.md',md);
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const cells=a=>'<tr>'+a.map(s=>'<td>'+esc(s)+'</td>').join('')+'</tr>';
const table=(h,rs)=>'<div class="scroll"><table><thead><tr>'+h.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rs.map(cells).join('')+'</tbody></table></div>';
let html='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>출신155행 설정 검토</title><style>body{font:16px/1.75 system-ui,sans-serif;background:#f3f5f8;color:#1c2939;max-width:1250px;margin:auto;padding:28px}h1{font-size:29px}h2{font-size:22px;margin-top:32px}p{max-width:1100px}.box{padding:18px 24px;background:white;border:1px solid #ccd6e2;border-radius:10px;margin:20px 0}.scroll{overflow:auto}table{border-collapse:collapse;background:white;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #d9e1eb}th{background:#e4ebf4}td:first-child{width:145px}code{font-size:12px;overflow-wrap:anywhere}.decision{color:#1c577a;font-weight:700}details{margin:24px 0}summary{cursor:pointer;font-weight:700}small{color:#64758b}li{margin:8px 0}@media(max-width:700px){body{padding:14px}table{min-width:850px}}</style><h1>02번 출신155행 — 설정 적합성 검토</h1><div class="box"><p>'+esc(intro)+'</p><p class="decision">'+esc(summary)+'</p><p>아직 게임에 적용하지 않았습니다. 권고는 기존 관계·말투·조각 출력 구조를 유지하는 전제입니다.</p></div><h2>주요 판단</h2>'+table(['대상','달라진 설정','권고','게임과의 정합성'],highlights)+'<h2>155행 전수 판정</h2><p>기존 사실 유지도 문체 수정은 가능합니다. 신안 채택도 원고 문단의 고정 출력을 뜻하지 않습니다. 설정과 현재 관계를 구분합니다.</p>';
for(const [group]of groups)html+='<details><summary>'+group+' — '+rows.filter(r=>r.group===group).length+'행 펼치기</summary>'+table(['키','권고','분류','판단 근거'],rows.filter(r=>r.group===group).map(r=>[r.key,labels[r.decision],r.classification.join(' · '),r.reason]))+'</details>';
html+='<div class="box"><h2>보류·근거·검증 범위</h2><p>rich_wife의 관용구와 time_plice의 금지/통제 의미는 원어 확인이 필요합니다.</p><p>러시아어·영어 출신 원어는 확보하지 못했습니다. 현재 코드·기존 화면용 조각·2.3의 별도 한국어 설명을 근거로 한 편집 권고입니다. 일반 배경 조각1368개를 추출했지만 실제 화면과 기존 세이브의 출신 응답을 모두 실행한 검사는 아닙니다.</p><p>사업가 가족의 키 불일치와 기존 저장 갱신은 후속 구현 시 별도로 다룰 기술 항목입니다.</p><p>'+esc(conclusion)+'</p><small>Work SHA256: '+currentHash+'</small></div></html>';
fs.writeFileSync(root+'/REPORT_KO.html',html);fs.writeFileSync(root+'/all-155-recommendations.json',JSON.stringify({scope:'REVIEW_ONLY_NO_GAME_CHANGES',hash:currentHash,counts,rows,highlights},null,2));
console.log(JSON.stringify({coverage:rows.length,counts,hash:currentHash,report:root+'/REPORT_KO.html',gameChanged:false}));
