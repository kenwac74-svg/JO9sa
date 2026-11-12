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
 flame:{2:'{B}은 넘게 박혔다니까요! 제 보지 맛 한 번 본 놈들은 다 줄 서서 또 왔고요. 못 믿으시겠어요?',1:'{B}은 넘게 박혔습니다. 제 보지 맛을 본 놈들은 전부 다시 찾아왔습니다. 의심하십니까?',3:'{B}은 넘게 박혔다고요! 한 번 따먹은 놈들은 다 다시 기어 왔어요. 안 믿기죠?'},
 proud:{2:'{N}이요. 제 몸에 자지 넣어 본 남자들이 많긴 하죠. 그래도 그 숫자로 저를 걸레 취급하진 마세요.',1:'{N}입니다. 제게 자지를 넣어 본 남자가 적지는 않죠. 그렇다고 걸레 취급은 사양하겠습니다.',3:'{N}이요. 저한테 박아 본 놈들이 꽤 되죠. 그래도 걸레 취급하면 곤란해요.'},
 frank:{2:'음, {N}? 세어 본 건 아닌데 대충 그쯤 박혔을걸요! 솔직히 좋아서 한 것도 꽤 돼요.',1:'{N}쯤입니다. 정확히 세지는 않았지만, 좋아서 벌린 적도 꽤 됩니다.',3:'{N}? 대충 그쯤 박혔을걸요. 솔직히 좋아서 다리 벌린 적도 많고요.'},
 plain:{2:'{N} 정도 했을 거예요. 남자가 넣고, 흔들고, 싸고. 다 비슷했어요.',1:'{N} 정도입니다. 넣고, 흔들고, 싸고. 다 비슷했습니다.',3:'{N} 정도요. 넣고 흔들고 싸고, 다 거기서 거기였어요.'},
 calm:{2:'{X}번이에요. 자지가 들어온 횟수로 따지면요.',1:'{X}번입니다. 삽입된 횟수 기준입니다.',3:'{X}번이요. 박힌 걸로 치면요.'},
 ice:{2:'{X}번. 다 제 몸 위에서 헐떡이다 싸고 끝났죠. 더 궁금하세요?',1:'{X}번입니다. 전부 제 위에서 싸고 끝났습니다. 그게 전부입니다.',3:'{X}번. 다 싸고 끝났어요. 됐죠?'},
 meek:{2:'그게… {N}쯤이에요. 시키는 대로 다리 벌렸을 뿐이에요…',1:'그것이… {N}쯤입니다. 시키는 대로 다리를 벌렸을 뿐입니다…',3:'그게… {N}쯤이요. 시키는 대로 벌렸을 뿐이에요…'},
 fragile:{2:'저… {N}쯤요… 그, 그게… 넣는다고 하면 거절을 못 해서…',1:'저… {N}쯤입니다… 넣겠다고 하시면 거절을 못 해서…',3:'저… {N}쯤요… 넣는다는데 거절을 못 해서요…'},
 doll:{2:'…{N}요. 넣으면, 받았어요.',1:'…{N}입니다. 넣으시면, 받았습니다.',3:'…{N}요. 넣으면 받았어요.'}
};
// 여린·순종이 줄여 말해도 많은 경우(말한 횟수 50 이상): "많지 않다"고 하면 앞뒤가 안 맞아 따로 둔다
const COUNT_HIGH={
 meek:{2:'그게… {N}쯤이에요. 하루에도 몇 번씩 박혔으니까… 저도 모르게 그렇게 됐어요.',1:'그것이… {N}쯤입니다. 하루에도 몇 번씩 받았으니… 저도 모르게 그렇게 되었습니다.',3:'그게… {N}쯤이요. 하루에도 몇 번씩 박혔으니까요…'},
 fragile:{2:'저… {N}쯤요… 보지가 마를 날이 없었어요… 세어 보면 너무 부끄러워요…',1:'저… {N}쯤입니다… 마를 날이 없었습니다… 세어 보면 너무 부끄럽습니다…',3:'저… {N}쯤요… 마를 날이 없었어요… 세면 너무 창피해요…'}
};
// 처녀(경험 0)
const NONE={
 flame:{2:'한 번도 없어요. 아무 자지나 받아 주는 걸레가 아니라서요. 불만 있어요?',1:'한 번도 없습니다. 아무 자지나 받는 걸레가 아니라서요. 불만이라도 있습니까?',3:'한 번도 없어요. 아무 놈한테나 벌리는 걸레가 아니거든요. 불만 있어요?'},
 proud:{2:'없어요. 제 보지에 넣을 자격이 있는 남자를 아직 못 만났을 뿐이에요.',1:'없습니다. 제게 넣을 자격이 있는 남자를 아직 만나지 못했을 뿐입니다.',3:'없어요. 저한테 박을 자격 있는 놈을 아직 못 만났을 뿐이에요.'},
 frank:{2:'한 번도 없어요! 혼자 손가락으로 만져 본 게 전부예요. 사실 진짜 자지는 어떤지 궁금하긴 해요.',1:'한 번도 없습니다. 혼자 만져 본 게 전부입니다. 솔직히 진짜는 어떤지 궁금합니다.',3:'한 번도 없어요. 혼자 만져 본 게 다예요. 진짜 자지는 어떤지 궁금하긴 해요.'},
 plain:{2:'아직 아무것도 안 넣어 봤어요. 처녀예요.',1:'아직 아무것도 넣어 본 적 없습니다. 처녀입니다.',3:'아직 아무것도 안 넣어 봤어요. 처녀예요.'},
 calm:{2:'없어요. 제 보지는 아직 아무도 안 썼어요.',1:'없습니다. 아직 아무도 쓰지 않았습니다.',3:'없어요. 아직 아무도 안 썼어요.'},
 ice:{2:'없어요. 그쪽이 처음이 되겠네요. 기대는 하지 마시고요.',1:'없습니다. 주인님이 처음이 되시겠군요. 기대는 하지 마십시오.',3:'없어요. 그쪽이 처음이겠네요. 기대는 마시고요.'},
 meek:{2:'저는… 아직 한 번도… 처음은 주인님이 가져가 주세요…',1:'저는… 아직 한 번도 없습니다… 처음은 주인님께서 가져가 주십시오…',3:'저는… 아직 한 번도요… 처음은 주인님이 가져가 주세요…'},
 fragile:{2:'저, 저는… 한 번도 없어요… 그렇게 큰 게 들어가면 찢어질 것 같아서 무서워요…',1:'저, 저는… 한 번도 없습니다… 그렇게 큰 것이 들어오면 찢어질 것 같아 무섭습니다…',3:'저, 저는… 한 번도 없어요… 그렇게 큰 게 들어오면 찢어질 것 같아서요…'},
 doll:{2:'…없어요. 처녀예요.',1:'…없습니다. 처녀입니다.',3:'…없어요. 처녀예요.'}
};
// 화제 한마디(해요체 원고. 합니다체·투박체 변환은 다음 단계에서 유형별로 쓴다)
const TOPIC={
 married:{loud:'남편이요? 밤마다 제 보지에 박아 대느라 정신을 못 차렸죠. 지금 생각하면 자지는 별거 없었는데.',soft:'남편이랑… 밤마다 했어요. 다리 벌리고 누워 있으면 알아서 싸고 잤어요…',flat:'남편과 결혼해 있는 동안 했어요. 부부니까 매일 밤 벌렸죠.'},
 birth:{loud:'남편 정액 받아서 애도 {C}{이나} 쌌어요. 그래도 보지는 아직 쫀쫀하다고요.',soft:'남편 아이를… {C} 낳았어요. 그렇게 받아 냈는데도… 젖은 아직 나와요…',flat:'남편 아이는 {C} 낳았어요. 안에 싸는 걸 매번 받았으니까요.'},
 sexWork:{loud:'손님들이 저만 찾았어요. 하룻밤에 자지 열 개는 기본으로 받았고, 다들 제 안에다 싸고 울면서 갔다니까요.',soft:'돈만 내면… 누구 자지든 받아야 했어요. 냄새나는 놈도, 거친 놈도요…',flat:'돈 받고 벌렸어요. 손님이 넣고 싸면 다음 손님 받고, 그게 일이었어요.'},
 sameSex:{loud:'여자랑도 해 봤어요. 보지 핥아 주는 건 남자보다 여자가 훨씬 잘하던데요?',soft:'여자랑도… 몇 번… 서로 핥아 주고 그랬어요… 이상하게 보진 마세요…',flat:'상대가 여자였던 적도 많아요. 손가락이랑 혀로 하는 거죠.'},
 oral:{loud:'입으로 빨아 주는 건 자신 있어요. 목구멍까지 넣어 줘도 끄떡없고, 다들 제 입에 싸고 못 버텼거든요.',soft:'입으로… 빠는 게 제일 많았어요… 입안에 싸면 삼키라고 해서…',flat:'입으로 빨아 준 게 가장 많았어요. 정액 맛은 다 거기서 거기더군요.'},
 anal:{loud:'후장도 뚫렸어요. 뒤로 쑤시는 거 좋아하는 놈들 많더라고요. 저는 이제 그쪽이 더 잘 느껴요.',soft:'뒤로도… 넣었어요. 처음엔 찢어질 것 같았는데… 지금은…',flat:'엉덩이로 받은 적도 꽤 돼요. 앞이 쉴 때는 뒤로 했죠.'}
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
