'use strict';
// 현재 가격식의 기존 수치와 호출 단계를 조사 기록에 남기며 게임 파일은 변경하지 않는다.
const fs=require('node:fs'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qsp='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const expected='c362bde0e8cf814e3e28efd594e27482ef33ea0fa3a5b142f95c96164c5ea3eb';
const raw=fs.readFileSync(qsp),d=c.parse(raw);
const body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5).split('\r\n');
assert.equal(c.hash(raw),expected);assert(c.serialize(d).equals(raw));assert.equal(d.locations.length,267);
const txt=body('#static_txt'),base=body('#static_base'),value=body('jo9_traits_value');
const table=name=>{
  const rows=[];
  for(const line of txt){const m=line.match(new RegExp('^\\s*'+name+'\\[(\\d+)\\]\\s*=\\s*(\\d+)\\b'));if(m)rows[+m[1]]=+m[2];}
  assert.equal(rows.length,11);assert(rows.every(Number.isInteger));return rows;
};
const common=table('common_price'),discount=table('discount_price');
assert.deepEqual(common,[5,500,750,850,1000,2000,3500,4000,5500,6500,8000]);
for(let i=1;i<11;i++)assert.equal(discount[i],common[i]*70/100);
const labels=[];
for(const line of txt){const m=line.match(/^\s*\$rating\[(\d+)\].*?,\s*'([^']*)'\s*\)/);if(m)labels[+m[1]]=m[2].replace(/<[^>]*>/g,'');}
assert.equal(labels.length,11);
const rates=[20,25,30,40,45,50,55,70,75,90,100];
const rawFields=[...new Set(base.slice(1173,1241).flatMap(x=>[...x.matchAll(/dynslave\['([^']+)'\]/g)].map(m=>m[1])))];
for(const key of ['stamina','base_beauty','temper','intellect','ego','pride','grace','dexterity','fame'])assert(rawFields.includes(key));
assert(!rawFields.includes('service'));assert(!rawFields.includes('cook'));assert(!rawFields.includes('moral'));
assert(base.some(x=>x.includes('slaveprice = (slave_base_price*3)/2')));
assert(base.some(x=>x.includes('if rating = 0 or is_stock = 1:')));
assert(base.some(x=>x.includes('slaveprice * 20/100')));
assert(body('slave_auction_sell').some(x=>x.includes('sell_price = slaveprice/2')));
assert(value.some(x=>x.includes("['jo9_versatile']")&&x.includes('result += result / 4')));
const priceTable=common.map((x,i)=>({rating:i,label:labels[i],common:x,discount:discount[i],auction:Math.trunc(x/2),traderRatingPercent:rates[i]}));
const examples=priceTable.map(x=>({...x,intrinsicStatBase:1000,beforeRank:1500,legacyTrader:Math.trunc(Math.trunc(1500*x.traderRatingPercent/100)/2),guildResale:x.rating>0?x.auction:null}));
const result={date:'2026-10-24',status:'READ_ONLY_FORMULA_AUDIT_COMPLETE',qsp,sha256:expected,locations:267,roundtrip:true,engineExecuted:false,runtimeChanged:false,newScoringFormulaImplemented:false,rawFields,priceTable,arithmeticOnlyExamples:examples,
  evidence:{core:{location:'#static_base',bodyRange:[1145,1406]},traitHelper:{location:'jo9_traits_value',bodyRange:[20,81]},rankTables:{location:'#static_txt',bodyRanges:[[25,48],[78,101],[129,139]]},trader:{location:'slave_auction_sell',bodyRange:[14,21]},guildResale:{location:'interaction_city',bodyRange:[12859,12886]},privateNegotiated:{location:'interaction_city',bodyRange:[12368,12505]},privateDirect:{location:'interaction_city',bodyRange:[12587,12601]},liquidation:{location:'jo9_liquidation_sale',bodyRange:[79,82]}},
  findings:[
    'Existing raw attribute/personality valuation and rank calculation already exist; no purchase price history needed.',
    'Skills enter rank through skill_sum/max_skill and sex_sum/max_sex, not direct raw cash additions.',
    'Current 20 percent applies to rank0 OR stock mode, not exactly disobedience.',
    'Lowest rank can also result from stamina, skill, appearance or attribute requirements despite obedience.',
    'Full pre-rank base alone would omit skill differentiation between equally built trained actors.',
    'Private buyer and guild use separate rating price tables, not shared slaveprice cash.',
    'Versatile25 applies once per eligible current route; quote-based reuse would require removing redundant table-route modifiers.',
    'Private direct options912/913 lack direct versatile25; do not silently treat that as repaired.',
    'discount_price is70percent for ratings1..10, auction_price is integer50percent; comments are not all current.',
    'Generic trait cash modifiers do not cover all trait axes; indirect stat/skill/obedience effects must not be counted twice.'
  ],
  confirmedDesignNotYetApplied:{dealerRoles:['잡파','웡 나으리','발랄라이카','나타샤'],noAcquisitionCostBasis:true,untrainedRecognizedFraction:0.2,untrainedMeansRawMaterial:true,ordinaryDealerRequiresOwnershipBrand:true,smugglerRequiresNoOwnershipBrand:true,decorativeTattooPreferenceOutOfScope:true,newBuybackServicesDeferred:true,reuseExistingWeightsAndPriceLogicFirst:true,merchantPayoutRates:'NOT_DECIDED',allTraitAdditionalWeights:'NOT_DECIDED'},
  reviewers:['/root/resale_price_paths','/root/resale_save_provenance']};
const md=`# 기존 노예 가치·판매가 산식 조사\n\n2026-10-24. 최신 WORK ${expected}를 읽기 전용으로 대조했다. 267로케이션, 무수정 바이트 왕복 일치. 게임·세이브 변경과 엔진 실행은 하지 않았다. 예제는 소스 식의 정수 산술 대조이며 실제 결제 플레이 검사가 아니다.\n\n## 결론\n\n기존 가치산정 산식이 이미 있다. 새 점수표를 처음부터 만드는 것보다 기존 속성별 가산·감산, 기술을 포함한 종합등급 판정, 등급별 거래가격표와 특성 우대를 재사용하는 것이 적합하다. 다만 현재는 한 가지 정가가 모든 거래를 지배하지 않고, 노예상 평가와 개인/길드 가격표가 분리되어 있다.\n\n## 1. 속성 기본 평가 B\n\n#static_base의 $update_slave_price:1173~1249가 계산한다. 체력·기본외모·체형·흉터·멍·세련도·이국성·감수성·지성·성격·자아·태도·명성 등에 정해진 스파크를 더하거나 뺀다. 품위와 손재주는 각각±10이다. 최소값은 max(20, 기존 처분 평가액)이며 이후 다재다능25%가 한 번 들어간다.\n\n실제 직접 읽는 키:${rawFields.join(', ')}.\n\n새로운 구입 이력이나 인물별 저장키는 이 평가에 필요 없다.\n\n## 2. 기술과 복종의 현재 반영\n\n일반기술14종의 합계와 최고기술 개수, ST9종의 합계와 최고기술 개수, 복종·일부 신체/기초속성 문턱이 종합등급을 결정한다(#static_base:1257~1375). 기술 한 단계당 고정 스파크를 더하는 식이 아니라 등급을 통해 가격에 간접 반영된다.\n\n따라서 1.5×B만 떼어 정가로 쓰고 기존 등급 처리를 모두 버리면, 같은 신체·기초성격을 가진 복종 노예의 기술 차이가 가격에서 빠진다. 반대로 등급표와 같은 기술을 다시 별도 점수로 더하면 의도하지 않은 중복 평가가 생길 수 있다.\n\n## 3. 노예상 쪽 계산\n\n1. 전체 평가 후보액 U=max(30, floor(B×3/2)).\n2. 종합등급에 따라 아래20~100%를 적용한다. 실제로는 최저금액/처분평가 하한도 남는다.\n3. 잡파의 실지급 제시가는 그 결과의 절반이다. 특수 흥정 프리미엄은 별도다.\n\n기존20%는 **불복종 전용 감액이 아니다**. rating=0이거나 is_stock=1이면 적용한다. 잡파는 낙인이 없으면 stock모드를 켜므로 이미 훈련됐어도 이 구간에 들어갈 수 있다. 최저등급도 복종 부족뿐 아니라 체력·기술·외모 등으로 발생할 수 있다. 새 불복종20%를 이 뒤에 기계적으로 곱하면 중복 감액이 된다.\n\n## 4. 개인·길드의 등급 가격표\n\n| 등급 | 개인 기준가 | 계약 등 기준가 | 길드 재매입 기준가 | 기존 속성평가 인정률 |\n|---|---:|---:|---:|---:|\n${priceTable.map(x=>`|${x.label}|${x.common}|${x.discount}|${x.auction}|${x.traderRatingPercent}%|`).join('\n')}\n\ncommon_price가 개인 구매자의 요구 등급 기준가다. discount_price는 등급1~10에서70%, auction_price는 정수 나눗셈50%다. 최저등급의 auction_price는5/2=2이며 오래된 주석의5와 다르다. 계약 쪽 일부 주석도 discount_price를50%라고 하지만 실제 표는70%다. 길드의 공개 경매는 이 표를 토대로 입찰을 계산하므로 고정 재매입과 다르다.\n\n기본 평가 B=1000, 특수 우대·하한 미발동, 보유 인물 평가라고 가정하면 D+에서 잡파225, 웡375, 요구 D+ 고객 기준가750이다. 같은 노예에 서로 다른 계산 경로가 사용되기 때문이다. 개인의 요구 등급·전문화·취향·자금·흥정과 거래 자격은 따로 적용된다.\n\n## 5. 특성 반영 상태\n\n- 품위·손재주: 기본 평가에 각각±10.\n- 다재다능: 기존 해당 거래의 기본값+25%. 현재 핵심 계산과 각 거래가 서로 다른 출발값을 쓰므로 단순히 함수 호출이 두 곳 있다는 이유로 이중 지급이라고 단정하면 안 된다.\n- 절세미인: 현재 외모 재계산과 별도 거래 우대층을 함께 보유한다. 기존 시장/경매 특별 배수는 그대로 별도 확인해야 한다.\n- 강한 복종심·노예근성 등은 현재 복종 기반에, 학습·업무 특성은 성장/성과에 간접 영향을 준다. 모든 일반 특성에 직접적인 가격 가산·감산이 있는 것은 아니다.\n- 개인 거래도 세부 분기가 다르다. 흥정911과 일부 고정 판매는 다재다능 보정을 하지만, 정가/할인 선택912·913은 해당 직접25% 보정을 쓰지 않는다. 이번 조사는 이 차이를 고친 것이 아니다.\n\n## 재사용 방향과 미확정 부분\n\n기존 속성 금액표·기술합/종합등급 판정·common_price 계열·특수 우대부터 차용한다. 기존 상인의 등급 감가·무낙인 재고 감가·절반 지급을 공통 고유 정가와 섞지 않고 거래 단계로 분리하는 안을 검토한다. 사용자 확정인 불복종 정가20% 인정은 별도 상태 보정이며, 기존 F/stock20%와 같은 조건으로 취급하면 안 된다. 등급 가격표의 F→D 급등(5→500)과 일반 특성의 직접 가격 누락도 아직 조정하지 않았다.\n\n확정된 대상은 잡파·웡·발랄라이카·나타샤이며 새 재매입 기능은 보류다. 새 설계에서 발랄라이카는 비낙인, 나머지는 낙인 상품을 취급하는 방향이지만 현재 코드가 이미 그렇다는 뜻은 아니다. 구입액 이력은 사용하지 않는다. 장식 문신 고객 취향은 이번 설계에서 제외한다. 거래처별 지급률·추가 특성 가중치·두 기존 가격 방식의 결합 방법은 아직 미확정이다. 새 가중치/새 정가식·WORK 적용은 하지 않았다.\n`;
const out=process.argv[2]||'G:/somi/JO9sa/records/slave-price-formula-audit-20261024';
assert(!fs.existsSync(out),'Do not overwrite an earlier audit');
fs.mkdirSync(out+'/scripts',{recursive:true});
fs.writeFileSync(out+'/CURRENT_FORMULA_KO.md',md.replace(/\n/g,'\r\n'));
fs.writeFileSync(out+'/audit.json',JSON.stringify(result,null,2)+'\n');
fs.copyFileSync(__filename,out+'/scripts/reproduce.cjs');
assert.equal(c.hash(fs.readFileSync(qsp)),expected);
console.log(JSON.stringify({status:result.status,sha256:expected,rawFields:rawFields.length,priceRows:priceTable.length,out,runtimeChanged:false}));
