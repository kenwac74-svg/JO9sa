// 필로우토크 조립기 시제품: 과거 경험 공식 결과를 "노예와 대화한다"의 과거 성경험 이야기로 조립한다
// 게임 대사 조립 규칙(SLAVE_DIALOGUE_ASSEMBLY_RULES_CURRENT_20261112)을 따른다: 성격 9유형, 말투 번호, 관계 모드, 감정 깊이,
// 메타데이터가 붙은 조각 행을 거르고 최근 2회를 피해 추첨한다. 성인(연령 코드 0·2) 랜덤 노예만 대상.

// 4장 성격 9유형: E = temper + sensitivity, A = ego + pride (3 이하 낮음, 4~6 중간, 7 이상 높음)
// 대상: 랜덤 노예와 유니크 노예. 유니크는 고정 배경이라 과거 경험 값은 공식이 아니라 지정값(jo9_initial_history 등)을 쓴다.
const band=v=>v<=3?0:v<=6?1:2;
const TYPES=[['doll','meek','fragile'],['calm','plain','frank'],['ice','proud','flame']];
export const TYPE_NAME={ice:'얼음',proud:'도도',flame:'불꽃',calm:'관조',plain:'평범',frank:'솔직',doll:'인형',meek:'순종',fragile:'여린'};
export const TYPE_KEYS=Object.keys(TYPE_NAME);
// 유니크 노예는 유형을 지정할 수 있다(사용자 결정 2026-11-12). 값: 캐릭터 JSON seed_jo9_voice_type / 인물 jo9_voice_type. 지정이 없으면 성격 값으로 계산한다.
export function voiceType(s){
 if(TYPE_KEYS.includes(s.jo9_voice_type))return s.jo9_voice_type;
 return TYPES[band((s.ego??0)+(s.pride??0))][band((s.temper??0)+(s.sensitivity??0))];
}

// 5장 말투: 1 격식 존댓말, 2 일반 존댓말. 일반 노예에는 반말(3)을 쓰지 않는다(사용자 최신 기준).
// 게임의 말투3 직업도 필로우토크에서는 2로 둔다. 1/2 구분 정리는 게임 쪽 과제로 남아 있다.
const FORMAL=['maid','valertry','secretary','nun','policewoman','mind_contol','time_plice','jailer','academy','mech'];
export const STYLE_NAME={1:'격식 존댓말',2:'일반 존댓말'};
export function speechStyle(occupation){return FORMAL.includes(occupation)?1:2;}

// 6장 관계 모드
export const MODE_NAME={hostile:'적대',fearful:'두려움',bleak:'우울',broken:'무너짐',hopeful:'기대',duty:'의무',loyal:'헌신',neutral:'중립'};
export const PSY_STATUS=['reluctant','arrogant','hateful','resistant','hysteric','lachrymose','frightened','depresive','broken','optimistic','obedient','servile','horny','docile','soft'];
export function relationMode(s){
 const p=s.psy_status??'docile';
 if(['reluctant','arrogant','hateful','resistant','hysteric'].includes(p))return 'hostile';
 if(['lachrymose','frightened'].includes(p))return 'fearful';
 if(p==='depresive')return 'bleak';if(p==='broken')return 'broken';if(p==='optimistic')return 'hopeful';
 if(['obedient','servile','horny'].includes(p))return (s.moral??0)>=4?'loyal':'duty';
 return 'neutral';
}
// 7장 감정 깊이(0 감춤, 1 암시, 2 드러냄)
export function depthOf(s,emo){
 const moral=s.moral??0,pride=s.pride??0,fear=s.fear??0;
 const v=emo==='vulnerable'?2*moral-pride-2*(fear>=4?1:0):emo==='hostile'?(s.ego??0)+(s.temper??0)-2*fear:2*moral+(s.sensitivity??0)-pride;
 return v<4?0:v<8?1:2;
}

// 유형별로 실제 횟수를 어떻게 말하는가(/100)
const SPIN={flame:300,proud:150,frank:100,plain:100,calm:100,ice:100,meek:70,fragile:50,doll:100};
export function toldCount(type,n){return Math.max(n>0?1:0,Math.round(n*SPIN[type]/100));}
export function countWords(n){
 if(n<=0)return '한 번도';
 if(n<=3)return ['한 번','두 번','세 번'][n-1];
 if(n<10)return '몇 번';if(n<20)return '열댓 번';if(n<30)return '스무 번';if(n<40)return '서른 번';if(n<70)return '쉰 번';
 if(n<150)return '백 번';if(n<1000)return '수백 번';return '천 번';
}

// 조각 행은 규칙 시험용 프리셋 초안이다(규칙: docs/JO9_Pillow_Talk_Rules_v1_20261112.md). 최종 원고·튜닝은 사용자가 편집기에서 한다.
// 조각 행: [역할, 유형('*' 공통), 관계(공백 구분, '*' 모두), 감정(-/vulnerable/hostile/positive), 깊이, 말투2 문장, 말투1 문장]
// {N} 어림 낱말, {X} 정확한 숫자, {C} 아이 수, {이나} 조사
const ALL='*',WARM='hopeful duty loyal neutral',LOW='fearful bleak broken',COLD='hostile';
const ROWS=[
 // 거절: 적대이면서 말할 생각이 없을 때(적대 깊이 0)
 ['refuse','*',COLD,'hostile',0,'…그걸 왜 당신한테 말해야 하죠?','…그것을 왜 말씀드려야 합니까?'],
 ['refuse','*',COLD,'hostile',0,'제 몸은 이미 가져갔잖아요. 과거까지 달라는 건가요?','몸은 이미 가져가셨지요. 과거까지 내놓으라는 겁니까?'],
 // 횟수(경험 있음)
 ['count','flame',ALL,'-',0,'{N}은 넘게 박혔다니까요! 제 보지 한 번 맛본 놈들은 자지 세우고 줄 서서 또 왔어요.','{N}은 넘게 박혔습니다. 제 보지 맛을 본 놈들은 전부 자지를 세우고 다시 찾아왔습니다.'],
 ['count','flame',ALL,'-',0,'{N}? 우습게 넘죠. 셋이서 앞뒤로 쑤셔 대도 먼저 나가떨어진 건 늘 그놈들이었어요.','{N}은 가볍게 넘습니다. 셋이 달려들어도 먼저 나가떨어진 쪽은 늘 그들이었습니다.'],
 ['count','proud',ALL,'-',0,'{N}이요. 제 보지에 자지 넣어 본 남자야 많죠. 그렇다고 아무 데나 싸지르는 변기 취급은 마세요.','{N}입니다. 제게 자지를 넣어 본 남자는 많지요. 그렇다고 변기 취급은 사양하겠습니다.'],
 ['count','proud',ALL,'-',0,'{N}쯤 되나요. 다들 제 위에서 헐떡이다 3분도 못 버티고 쌌어요. 그걸 남자라고.','{N}쯤 됩니다. 대부분 제 위에서 3분도 버티지 못하고 쌌습니다. 한심하더군요.'],
 ['count','frank',WARM,'-',0,'음, {N}? 세어 본 건 아닌데 그쯤 박혔을걸요! 솔직히 좋아서 먼저 다리 벌린 것도 꽤 돼요.','{N}쯤입니다. 세지는 않았지만, 좋아서 먼저 다리를 벌린 적도 꽤 됩니다.'],
 ['count','frank',ALL,'-',0,'{N} 정도요. 굵은 자지 만나면 저도 모르게 허리가 먼저 움직였어요.','{N} 정도입니다. 굵은 것을 만나면 저도 모르게 허리가 먼저 움직였습니다.'],
 ['count','plain',ALL,'-',0,'{N} 정도 했을 거예요. 넣고, 흔들고, 안에 싸고. 다 비슷했어요.','{N} 정도입니다. 넣고, 흔들고, 안에 싸고. 다 비슷했습니다.'],
 ['count','plain',ALL,'-',0,'{N}쯤요. 누워서 벌리고 있으면 알아서들 싸고 가던데요.','{N}쯤입니다. 누워서 벌리고 있으면 알아서 싸고 갔습니다.'],
 ['count','calm',ALL,'-',0,'{X}번이에요. 그중 절반쯤은 안에 받았고요.','{X}번입니다. 그중 절반쯤은 안에 받았습니다.'],
 ['count','calm',ALL,'-',0,'{X}번. 기억나는 자지는 별로 없어요.','{X}번입니다. 기억에 남는 것은 거의 없습니다.'],
 ['count','ice',ALL,'-',0,'{X}번. 다 제 위에서 개처럼 헐떡이다 싸고 끝났죠.','{X}번입니다. 전부 제 위에서 헐떡이다 싸고 끝났습니다.'],
 ['count','ice',ALL,'-',0,'{X}번. 저를 가게 만든 놈은 하나도 없었어요.','{X}번입니다. 저를 절정에 보낸 자는 없었습니다.'],
 ['count','meek',ALL,'-',0,'그게… {N}쯤이에요. 시키는 대로 다리 벌리고, 시키는 대로 빨았어요…','그것이… {N}쯤입니다. 시키는 대로 벌리고, 시키는 대로 빨았습니다…'],
 ['count','fragile',ALL,'-',0,'저… {N}쯤요… 그렇게 많진 않아요…','저… {N}쯤입니다… 그렇게 많지는 않습니다…'],
 ['count','fragile',ALL,'vulnerable',1,'{N}쯤… 처음엔 너무 아파서 피가 났는데… 그 뒤로는… 젖어 버려서…','{N}쯤입니다… 처음엔 아파서 피가 났는데… 그 뒤로는… 젖어 버려서…'],
 ['count','fragile',LOW,'vulnerable',2,'저… {N}쯤요… 넣는다고 하면 거절을 못 해서… 울면서 받은 적도 있어요…','저… {N}쯤입니다… 거절을 못 해서… 울면서 받은 적도 있습니다…'],
 ['count','doll',ALL,'-',0,'…{N}요. 넣으면, 받았어요.','…{N}입니다. 넣으시면, 받았습니다.'],
 ['count','*',COLD,'hostile',1,'{N}쯤이요. 당신 같은 놈들한테 잔뜩 박혔죠. 하나같이 싸고 나면 거만하게 굴더군요.','{N}쯤입니다. 당신 같은 자들에게 잔뜩 박혔습니다. 싸고 나면 하나같이 거만하더군요.'],
 ['count','*','broken','-',0,'…{N}요. 세는 건… 그만뒀어요.','…{N}입니다. 세는 것은… 그만두었습니다.'],
 // 여린·순종이 줄여 말해도 많을 때(말한 횟수 50 이상)
 ['countHigh','meek',ALL,'-',0,'그게… {N}쯤이에요. 하루에도 몇 번씩 박혔으니까… 저도 모르게 그렇게 됐어요.','그것이… {N}쯤입니다. 하루에도 몇 번씩 받았으니… 저도 모르게 그렇게 되었습니다.'],
 ['countHigh','fragile',ALL,'vulnerable',1,'저… {N}쯤요… 보지가 마를 날이 없었어요… 세어 보면 너무 부끄러워요…','저… {N}쯤입니다… 마를 날이 없었습니다… 세어 보면 너무 부끄럽습니다…'],
 ['countHigh','fragile',ALL,'-',0,'저… {N}쯤요… 많았어요…','저… {N}쯤입니다… 많았습니다…'],
 // 유부녀 횟수: 남편 기준
 ['countMarried','flame proud frank',ALL,'-',0,'남편한테만 {N}은 박혔죠. 그 사람은 제 보지 없으면 잠을 못 잤으니까요.','남편에게만 {N}은 박혔습니다. 그 사람은 제 몸 없이는 잠을 못 잤습니다.'],
 ['countMarried','flame proud frank',ALL,'-',0,'{N}? 남편이 밤마다 올라탔으니 그 정도는 되죠. 그 작은 자지로 참 부지런도 했어요.','{N}입니다. 남편이 밤마다 올라탔으니까요. 그 작은 것으로 참 부지런했지요.'],
 ['countMarried','*',ALL,'-',0,'남편이랑 {N} 정도 했어요. 결혼했으니 밤마다 벌리는 게 일이었죠.','남편과 {N} 정도 했습니다. 결혼했으니 밤마다 벌리는 것이 일이었습니다.'],
 ['countMarried','meek fragile',ALL,'-',0,'남편이랑… {N}쯤요… 그 사람 말고는 아무도 몰라요…','남편과… {N}쯤입니다… 그 사람 말고는 아무도 모릅니다…'],
 // 경험 없음(처녀)
 ['none','flame',ALL,'-',0,'한 번도 없어요. 아무 자지나 받아 주는 걸레가 아니라서요. 불만 있어요?','한 번도 없습니다. 아무 자지나 받는 걸레가 아니라서요.'],
 ['none','proud',ALL,'-',0,'없어요. 제 보지에 넣을 자격이 있는 남자를 아직 못 만났을 뿐이에요.','없습니다. 제게 넣을 자격이 있는 남자를 아직 만나지 못했을 뿐입니다.'],
 ['none','frank',ALL,'-',0,'한 번도 없어요! 밤에 혼자 손가락 넣어 본 게 전부예요. 진짜 자지는 얼마나 굵은지 궁금해요.','한 번도 없습니다. 혼자 손가락을 넣어 본 게 전부입니다. 진짜는 어떤지 궁금합니다.'],
 ['none','*',ALL,'-',0,'아직 아무것도 안 넣어 봤어요. 처녀막도 그대로예요.','아직 아무것도 넣어 본 적 없습니다. 처녀막도 그대로입니다.'],
 ['none','ice calm',ALL,'-',0,'없어요. 제 보지는 아직 아무도 안 썼어요.','없습니다. 아직 아무도 쓰지 않았습니다.'],
 ['none','*',WARM,'positive',1,'저는… 아직 한 번도… 제 처녀는 주인님이 뚫어 주세요…','저는… 아직 한 번도 없습니다… 제 처녀는 주인님께서 가져가 주십시오…'],
 ['none','*',LOW,'vulnerable',1,'저, 저는… 한 번도 없어요… 그렇게 큰 게 들어오면 찢어질 것 같아서 무서워요…','저, 저는… 한 번도 없습니다… 그렇게 큰 것이 들어오면 찢어질 것 같아 무섭습니다…'],
 ['none','*',COLD,'hostile',1,'없어요. 당신이 첫 번째가 되겠죠. 억지로 뚫어 놓고 자랑이나 하세요.','없습니다. 억지로 뚫으시고 자랑이나 하시지요.'],
 // 화제: 유부녀
 ['married','flame proud frank',ALL,'-',0,'남편이 저를 얼마나 밝혔는지 아세요? 부엌에서도 치마 걷고 박았다니까요.','남편이 저를 얼마나 밝혔는지 모르실 겁니다. 부엌에서도 치마를 걷고 박았습니다.'],
 ['married','*',ALL,'-',0,'결혼해 있는 동안은 매일 밤 남편 자지를 받았어요. 부부니까요.','결혼해 있는 동안은 매일 밤 남편을 받았습니다. 부부였으니까요.'],
 ['married','meek fragile doll',ALL,'-',0,'남편이랑… 밤마다 했어요. 다리 벌리고 누워 있으면 알아서 싸고 잤어요…','남편과… 밤마다 했습니다. 누워 있으면 알아서 싸고 잤습니다…'],
 ['birth','flame proud frank',ALL,'-',0,'남편 정액 받아서 애도 {C}{이나} 쌌어요. 그래도 보지는 아직 쫀쫀하다고요.','남편의 아이도 {C}{이나} 낳았습니다. 그래도 몸은 아직 쓸 만합니다.'],
 ['birth','*',ALL,'-',0,'남편 아이는 {C} 낳았어요. 매번 안에 싸는 걸 받았으니까요.','남편의 아이는 {C} 낳았습니다. 매번 안에 받았으니까요.'],
 ['birth','*',LOW,'vulnerable',1,'남편 아이를… {C} 낳았어요. 지금은 어디서 어떻게 지낼지… 젖은 아직 나와요…','남편의 아이를… {C} 낳았습니다. 지금은 어찌 지내는지… 젖은 아직 나옵니다…'],
 // 화제: 성인 접객업
 ['sexWork','flame proud',ALL,'-',0,'하룻밤에 자지 열 개는 기본으로 받았어요. 다들 제 안에다 싸고 다리 풀려서 기어 나갔다니까요.','하룻밤에 열 명은 기본으로 받았습니다. 다들 제 안에 싸고 다리가 풀려서 나갔습니다.'],
 ['sexWork','*',ALL,'-',0,'돈 받고 벌렸어요. 손님이 넣고 싸면 씻고 다음 손님. 그게 일이었어요.','돈을 받고 벌렸습니다. 손님이 싸면 씻고 다음 손님. 그것이 일이었습니다.'],
 ['sexWork','*',LOW,'vulnerable',1,'돈만 내면… 누구 자지든 받아야 했어요. 냄새나는 놈도, 때리는 놈도요…','돈만 내면… 누구든 받아야 했습니다. 냄새나는 자도, 때리는 자도…'],
 // 화제: 동성·구강·애널
 ['sameSex','*',ALL,'-',0,'상대가 여자였던 적도 많아요. 손가락이랑 혀로 서로 가게 해 주는 거죠.','상대가 여자였던 적도 많습니다. 손가락과 혀로 서로 절정에 보내는 것이지요.'],
 ['sameSex','flame frank',ALL,'-',0,'여자랑도 해 봤어요. 보지 핥아 주는 건 남자보다 여자가 훨씬 잘하던데요?','여자와도 해 봤습니다. 핥는 솜씨는 남자보다 여자가 훨씬 낫더군요.'],
 ['oral','flame proud frank',ALL,'-',0,'입으로 빨아 주는 건 자신 있어요. 목구멍 끝까지 쑤셔 넣어도 끄떡없고, 다들 제 입에 싸고 못 버텼거든요.','입으로 하는 것은 자신 있습니다. 목 끝까지 넣어도 끄떡없고, 다들 제 입에 싸고 버티지 못했습니다.'],
 ['oral','*',ALL,'-',0,'입으로 빨아 준 게 가장 많았어요. 정액 맛은 다 거기서 거기더군요.','입으로 한 것이 가장 많았습니다. 정액 맛은 다 거기서 거기더군요.'],
 ['oral','meek fragile',ALL,'-',0,'입으로… 빠는 게 제일 많았어요… 입안에 싸면 삼키라고 해서… 다 삼켰어요…','입으로… 하는 것이 제일 많았습니다… 삼키라고 하셔서… 다 삼켰습니다…'],
 ['anal','flame proud frank',ALL,'-',0,'후장도 뚫렸어요. 뒤로 쑤시는 거 좋아하는 놈들 많더라고요. 저는 이제 그쪽이 더 잘 느껴요.','뒤도 뚫렸습니다. 뒤로 쑤시는 것을 좋아하는 자들이 많더군요. 이제는 그쪽이 더 잘 느껴집니다.'],
 ['anal','*',ALL,'-',0,'엉덩이로 받은 적도 꽤 돼요. 앞이 쉴 때는 뒤로 했죠.','엉덩이로 받은 적도 꽤 됩니다. 앞이 쉴 때는 뒤로 했습니다.'],
 ['anal','*',LOW,'vulnerable',1,'뒤로도… 넣었어요. 처음엔 찢어질 것 같았는데… 지금은… 거기만 만져도…','뒤로도… 받았습니다. 처음엔 찢어질 것 같았는데… 지금은…'],
 // 화제: 성욕 특성(nymphomania 2 정액 중독, 1 색정광, -1 불감증, -2 석녀)
 ['libido2','*',WARM,'positive',1,'정액 냄새만 맡아도 보지가 젖어요. 안에 싸 주는 게 제일 좋아요. 주인님 것도 빨리 받고 싶어요.','정액 냄새만 맡아도 젖습니다. 안에 받는 것이 제일 좋습니다. 주인님 것도 어서 받고 싶습니다.'],
 ['libido2','*',ALL,'-',0,'정액을 받지 않은 날은 하루 종일 몸이 근질거려요.','정액을 받지 않은 날은 하루 종일 몸이 근질거립니다.'],
 ['libido2','*',COLD,'hostile',1,'정액 없으면 몸이 달아오르는 건 맞아요. 그렇다고 당신 걸 원한다는 뜻은 아니에요.','정액이 없으면 몸이 달아오르는 것은 맞습니다. 그렇다고 당신 것을 원한다는 뜻은 아닙니다.'],
 ['libido1','*',ALL,'-',0,'솔직히 하루라도 안 박히면 미칠 것 같아요. 그래서 그렇게 많이 한 거예요.','솔직히 하루라도 받지 않으면 견디기 힘듭니다. 그래서 그렇게 많이 했습니다.'],
 ['libido1','meek fragile',ALL,'vulnerable',1,'저… 사실 혼자서도 매일 만져요… 참을 수가 없어서…','저… 사실 혼자서도 매일 만집니다… 참을 수가 없어서…'],
 ['libido-1','*',ALL,'-',0,'해도 별 느낌은 없었어요. 그냥 끝나길 기다렸죠.','해도 별 느낌은 없었습니다. 그저 끝나기를 기다렸습니다.'],
 ['libido-1','flame proud ice',ALL,'-',0,'박아 대는 건 상관없는데 저는 별 느낌 없어요. 다들 혼자 좋다고 헐떡이더군요.','넣는 것은 상관없지만 저는 별 느낌이 없습니다. 다들 혼자 좋다고 헐떡이더군요.'],
 ['libido-2','*',ALL,'-',0,'아무리 쑤셔 봐도 저는 안 젖어요. 그래서 다들 침 발라서 넣더군요.','아무리 넣어도 저는 젖지 않습니다. 그래서 다들 침을 발라 넣더군요.'],
 ['libido-2','meek fragile',ALL,'vulnerable',1,'저는… 아무 느낌이 없어요… 그래서 미안해요…','저는… 아무 느낌이 없습니다… 그래서 죄송합니다…']
].map(([role,type,rel,emo,depth,s2,s1],i)=>({id:`pt${String(i+1).padStart(3,'0')}`,role,types:type==='*'?null:type.split(' '),rels:rel==='*'?null:rel.split(' '),emo,depth,text:{1:s1,2:s2}}));
export const ROW_COUNT=ROWS.length;

// 10장 후보 필터: 역할, 말투(행마다 1·2 원고가 있다), 유형(전용 → 공통), 관계, 깊이
function candidates(role,ctx){
 const ok=r=>r.role===role&&(!r.rels||r.rels.includes(ctx.mode))&&(r.emo==='-'||r.depth<=depthOf(ctx.stock,r.emo));
 const own=ROWS.filter(r=>ok(r)&&r.types?.includes(ctx.type)),common=ROWS.filter(r=>ok(r)&&!r.types);
 return [own,common];
}
// 반복 회피: 최근 2회 → 직전 1회 → 허용 순서, 전용 → 공통 순서(규칙 10장 표)
function pickRow(role,ctx){
 const [own,common]=candidates(role,ctx),last=ctx.history??[];
 for(const avoid of [last.slice(-2),last.slice(-1),[]])for(const pool of [own,common]){
  const free=pool.filter(r=>!avoid.includes(r.id));
  if(free.length){const r=free[Math.floor(ctx.rand()*free.length)];ctx.used.push(r.id);return r;}
 }
 return null;
}
const hasBatchim=w=>{const c=w.charCodeAt(w.length-1)-0xAC00;return c>=0&&c<11172&&c%28!==0;};
const childWords=n=>['','하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉'][n]??`${n}명`;

/** stock: 영입 처리 후 값(+ psy_status·moral·fear), result: 과거 경험 공식 결과, tier: 직업 묶음, rand: 0~1 난수, history: 최근에 쓴 조각 id */
export function pillowTalk(stock,result,tier,rand=Math.random,history=[]){
 if(result.excluded||stock.age===1)return null;
 const ctx={stock,type:voiceType(stock),style:speechStyle(stock.occupation),mode:relationMode(stock),rand,history,used:[]};
 const n=result.intimacy??0,told=toldCount(ctx.type,n),lines=[];
 const say=(role,extra=s=>s)=>{const r=pickRow(role,ctx);if(r)lines.push(extra(r.text[ctx.style].replace('{N}',countWords(told)).replace('{X}',String(told))));return !!r;};
 // 적대이고 적대 깊이 0이면 말하지 않는다(거절)
 if(ctx.mode==='hostile'&&depthOf(stock,'hostile')===0){say('refuse');return {...ctx,told,lines,refused:true};}
 if(n===0)say('none');
 else if(tier==='married'&&ctx.type!=='doll')say('countMarried');
 else if(!(told>=50&&say('countHigh')))say('count');
 if(n>0&&ctx.type!=='doll'&&ctx.mode!=='broken'){
  const acts=result.acts??{},p=result.partners??{},topics=[];
  if(tier==='married'){topics.push('married');if(result.births>0)topics.push('birth');}
  else if(tier==='sexWork')topics.push('sexWork');
  const lib=stock.nymphomania??0;
  if(lib)topics.push('libido'+lib);
  else if(p.sameSex>0&&p.sameSex*3>=n)topics.push('sameSex');
  else if(acts.oral>acts.vaginal&&acts.oral>=acts.anal)topics.push('oral');
  else if(acts.anal>acts.vaginal&&acts.anal>acts.oral)topics.push('anal');
  for(const t of topics.slice(0,2)){
   if(t==='birth'){const c=childWords(result.births);say('birth',s=>s.replace('{C}',c).replace('{이나}',result.births<2?'':hasBatchim(c)?'이나':'나'));}
   else say(t);
  }
 }
 return {...ctx,told,lines,refused:false};
}
