// 필로우토크 샘플 생성기: 과거 경험 공식 결과와 노예 성격 유형·말투로 "노예와 대화한다" 메뉴의 과거 경험 이야기를 고른다
// 규칙 근거: design/slave-voice 브랜치 DIALOGUE_GENERATION_RULES.md(유형 9종, 말투 3종, 존댓말만). 성인(연령 코드 0·2)만 대상.

// 3.1 유형 판정: 드러냄 = 성격 + 감수성, 내세움 = 자아 + 태도 (0~3 낮음, 4~6 보통, 7~10 높음)
const band=v=>v<=3?0:v<=6?1:2;
const TYPES=[['doll','meek','fragile'],['calm','plain','frank'],['ice','proud','flame']];
export const TYPE_NAME={ice:'얼음',proud:'도도',flame:'불꽃',calm:'관조',plain:'평범',frank:'솔직',doll:'인형',meek:'순종',fragile:'여린'};
export function voiceType(s){return TYPES[band((s.ego??0)+(s.pride??0))][band((s.temper??0)+(s.sensitivity??0))];}

// 2.1 말투 3종(직업 기준): 1 합니다체, 2 해요체, 3 투박한 해요체
const FORMAL=['maid','valertry','secretary','nun','policewoman','mind_contol','time_plice','jailer','academy','mech'];
const ROUGH=['tribal_girl','thief','beggar','gypsy','whore','markitane','brothel','thug','brigand','punk','contraband'];
export const STYLE_NAME={1:'합니다체',2:'해요체',3:'투박한 해요체'};
export function speechStyle(occupation){return FORMAL.includes(occupation)?1:ROUGH.includes(occupation)?3:2;}

// 유형별로 실제 횟수를 어떻게 말하는가: 부풀림(×), 줄임, 정확
const SPIN={flame:300,proud:150,frank:100,plain:100,calm:100,ice:100,meek:70,fragile:50,doll:100};
const EXACT=['ice','calm'];
export function toldCount(type,n){return Math.max(n>0?1:0,Math.round(n*SPIN[type]/100));}
// 어림 낱말: '쯤·정도' 같은 꾸밈은 원고 쪽에서 붙이므로 여기서는 붙이지 않는다
export function countWords(n){
 if(n<=0)return '한 번도';
 if(n<=3)return ['한 번','두 번','세 번'][n-1];
 if(n<10)return '몇 번';if(n<20)return '열댓 번';if(n<30)return '스무 번';if(n<40)return '서른 번';if(n<70)return '쉰 번';
 if(n<150)return '백 번';if(n<1000)return '수백 번';return '천 번';
}

// 대사 원고: [유형][말투] = 횟수 한마디. {N}=어림 낱말, {X}=정확한 숫자, {B}=과장 낱말
const COUNT={
 flame:{2:'{B}은 넘는다니까요! 못 믿으시겠어요?',1:'{B}은 넘습니다. 의심하시는 겁니까?',3:'{B}은 넘는다고요! 안 믿기죠?'},
 proud:{2:'{N}… 그 정도면 충분하지 않나요? 숫자로 저를 재지 마세요.',1:'{N}입니다. 숫자로 저를 판단하지는 마십시오.',3:'{N}이요. 그걸로 절 재려는 건 아니죠?'},
 frank:{2:'음, {N}? 세어 본 건 아니지만 대충 그쯤이에요!',1:'{N}쯤입니다. 정확히 세어 본 적은 없습니다.',3:'{N}? 대충 그쯤이에요. 세어 본 적은 없고요.'},
 plain:{2:'{N} 정도일 거예요. 특별할 건 없었어요.',1:'{N} 정도입니다. 특별한 일은 아니었습니다.',3:'{N} 정도요. 별거 없었어요.'},
 calm:{2:'{X}번이에요. 그 이상도 이하도 아니고요.',1:'{X}번입니다.',3:'{X}번이요. 딱 그만큼.'},
 ice:{2:'{X}번. 더 궁금한 게 있으세요?',1:'{X}번입니다. 그게 전부입니다.',3:'{X}번. 됐죠?'},
 meek:{2:'그게… {N}쯤이에요. 많지는 않아요.',1:'그것이… {N}쯤입니다. 많지는 않습니다.',3:'그게… {N}쯤이요. 많진 않아요.'},
 fragile:{2:'저… {N}쯤요… 그렇게 많진 않아요…',1:'저… {N}쯤입니다… 많지는 않습니다…',3:'저… {N}쯤요… 많진 않아요…'},
 doll:{2:'…{N}요.',1:'…{N}입니다.',3:'…{N}요.'}
};
// 여린·순종이 줄여 말해도 많은 경우(말한 횟수 50 이상): "많지 않다"고 하면 앞뒤가 안 맞아 따로 둔다
const COUNT_HIGH={
 meek:{2:'그게… {N}쯤이에요. 저도 모르게 그렇게 됐어요.',1:'그것이… {N}쯤입니다. 저도 모르게 그렇게 되었습니다.',3:'그게… {N}쯤이요. 어쩌다 보니 그렇게 됐어요.'},
 fragile:{2:'저… {N}쯤요… 세어 보면 너무 부끄러워요…',1:'저… {N}쯤입니다… 세어 보면 너무 부끄럽습니다…',3:'저… {N}쯤요… 세면 너무 창피해요…'}
};
// 처녀(경험 0)
const NONE={
 flame:{2:'없어요. 그래서 뭐요? 이상해요?',1:'없습니다. 그게 문제라도 됩니까?',3:'없어요. 그래서 뭐요?'},
 proud:{2:'없어요. 아무에게나 허락하지 않았을 뿐이에요.',1:'없습니다. 아무에게나 허락하지 않았을 뿐입니다.',3:'없어요. 아무한테나 안 줬을 뿐이에요.'},
 frank:{2:'한 번도 없어요! 그래서 좀 궁금하긴 해요.',1:'한 번도 없습니다. 솔직히 조금 궁금합니다.',3:'한 번도 없어요. 좀 궁금하긴 해요.'},
 plain:{2:'아직 한 번도 없어요.',1:'아직 한 번도 없습니다.',3:'아직 한 번도 없어요.'},
 calm:{2:'없어요. 그럴 기회가 없었어요.',1:'없습니다. 기회가 없었습니다.',3:'없어요. 기회가 없었고요.'},
 ice:{2:'없어요.',1:'없습니다.',3:'없어요.'},
 meek:{2:'저는… 아직 한 번도…',1:'저는… 아직 한 번도 없습니다…',3:'저는… 아직 한 번도요…'},
 fragile:{2:'저, 저는… 한 번도 없어요… 무서워서…',1:'저, 저는… 한 번도 없습니다… 무서워서…',3:'저, 저는… 한 번도 없어요… 무서워서요…'},
 doll:{2:'…없어요.',1:'…없습니다.',3:'…없어요.'}
};
// 화제 한마디(해요체 원고. 합니다체·투박체 변환은 다음 단계에서 유형별로 쓴다)
const TOPIC={
 married:{loud:'남편이요? 매일 밤 저를 못 놓아줬죠. 그만큼 제가 좋았던 거예요.',soft:'남편이랑… 밤마다요. 그게 부부라고 생각했어요.',flat:'남편과 지낸 동안이에요. 부부였으니까요.'},
 birth:{loud:'아이도 {C}{이나} 낳았어요. 그래도 몸매는 그대로죠?',soft:'아이를… {C} 낳았어요. 지금은 어디서 어떻게 지낼지…',flat:'아이는 {C} 낳았어요.'},
 sexWork:{loud:'손님들이 저만 찾았어요. 그 동네에서 저보다 잘하는 애는 없었다니까요.',soft:'일이었어요… 손님을 가릴 수는 없었어요.',flat:'일이었어요. 손님이 오면 받았고요.'},
 sameSex:{loud:'여자랑도 해 봤어요. 남자보다 낫던데요?',soft:'여자랑도… 몇 번 있었어요. 이상하게 보진 마세요…',flat:'상대가 여자였던 적도 있어요.'},
 oral:{loud:'입으로 하는 건 자신 있어요. 다들 못 버텼거든요.',soft:'입으로… 하는 게 제일 많았어요…',flat:'입으로 한 경우가 가장 많았어요.'},
 anal:{loud:'뒤로도 해 봤어요. 그 정도는 별거 아니에요.',soft:'뒤로도… 해 봤어요. 아팠지만요…',flat:'뒤로 한 적도 꽤 있어요.'}
};
const MOOD={flame:'loud',proud:'loud',frank:'loud',plain:'flat',calm:'flat',ice:'flat',meek:'soft',fragile:'soft',doll:'flat'};
// 마지막 글자 받침 여부(조사 고르기)
const hasBatchim=w=>{const c=w.charCodeAt(w.length-1)-0xAC00;return c>=0&&c<11172&&c%28!==0;};
const childWords=n=>['','하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉'][n]??`${n}명`;

/** result: pastHistory 결과, stock: 영입 처리 후 값, tier: 직업 묶음 이름 */
export function pillowTalk(stock,result,tier){
 if(result.excluded||stock.age===1)return null;
 const type=voiceType(stock),style=speechStyle(stock.occupation),lines=[];
 const n=result.intimacy??0,told=toldCount(type,n);
 const fill=s=>s.replace('{N}',countWords(told)).replace('{X}',String(told)).replace('{B}',countWords(told));
 lines.push(fill(n===0?NONE[type][style]:(told>=50&&COUNT_HIGH[type]?COUNT_HIGH[type]:COUNT[type])[style]));
 if(n>0&&type!=='doll'){
  const m=MOOD[type],acts=result.acts??{},p=result.partners??{};
  if(tier==='married'){lines.push(TOPIC.married[m]);if(result.births>0){const c=childWords(result.births);lines.push(TOPIC.birth[m].replace('{C}',c).replace('{이나}',result.births<2?'':hasBatchim(c)?'이나':'나'));}}
  else if(tier==='sexWork')lines.push(TOPIC.sexWork[m]);
  if(p.sameSex>0&&p.sameSex*3>=n)lines.push(TOPIC.sameSex[m]);
  else if(acts.oral>acts.vaginal&&acts.oral>=acts.anal)lines.push(TOPIC.oral[m]);
  else if(acts.anal>acts.vaginal&&acts.anal>acts.oral)lines.push(TOPIC.anal[m]);
 }
 return {type,style,told,lines:lines.slice(0,3)};
}
