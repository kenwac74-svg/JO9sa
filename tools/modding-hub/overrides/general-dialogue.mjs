// JO9 MOD GENERAL_DIALOGUE_DB_20261115: source text editing and shared-character questions.
import {speechPresentation,reformProfile,previewVoice,previewSpeech,plainSpeech,plainPastSpeech,plainPrincessPastSpeech,CASUAL_OCC,EXPRESSION_LABEL,ordinary} from './speech-reform.mjs';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const QUESTION_TABS=[['1112','인상 묻기'],['1115','불만 묻기'],['1113','요구 묻기'],['1114','희망사항 묻기'],['1116','기분 묻기'],['1111','과거 묻기'],['1117','조수/노예에 대해'],['sex','성경험 묻기']];
export const QUESTION_NAMES=Object.fromEntries([...QUESTION_TABS,['1118','노예에 대해 묻기']]);
export function generalSlot(q){if(!/^111[2-8]$/.test(String(q)))throw Error('일반 질문 번호가 아닙니다.');return 'general.'+q;}
export function splitTalkLines(lines={}){const general={},other={};for(const [k,v] of Object.entries(lines)){if(/^general\.111[2-8]$/.test(k))general[k.slice(8)]=v;else other[k]=v;}return {general,other};}
export function mergeTalkLines(lines={},general={}){return {...lines,...Object.fromEntries(Object.entries(general).filter(([q])=>/^111[2-8]$/.test(q)).map(([q,text])=>[generalSlot(q),text]))};}
async function call(url,body){const r=await fetch(url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'대사 DB를 읽지 못했습니다.');return data;}
const endpoint='/api/general-dialogue';
const plain=t=>String(t).replace(/<<.*?>>|<[^>]*>/g,m=>m.startsWith('<<')?m:/^<br\s*\/?>$/i.test(m)?'\n':'');
export const shown=(t,name)=>plain(String(t).replaceAll('<<$slave_name>>',name||'{이름}').replaceAll('{이름}',name||'{이름}'));
const options=(items,current,empty='전체')=>`<option value="">${e(empty)}</option>`+items.map(([k,l])=>`<option value="${e(k)}" ${String(k)===String(current)?'selected':''}>${e(l)}</option>`).join('');
const metaText=r=>`${r.source}:${r.line} · ${r.role??''} · 성격 ${r.types??'*'} · 관계 ${r.relations??'*'} · 말투 ${r.tone||'공통'} · 표현 ${r.level??0}`;

const reformQuestions=new Set(['1111','1112','1114']);
const reformSpeakers={
 luminous:{name:'루미너스',id:3002,unique:true},
 shiru:{name:'시루',id:1448,unique:true},
 kyaru:{name:'캬루',id:2621,unique:true},
 vasilisa:{name:'바실리사',id:2610,unique:true},
 lana:{name:'라나',id:2620,unique:true},
 rias:{name:'리아스',id:3010,unique:true},
 diana:{name:'다이아나',id:3021,unique:true},
 iris:{name:'이리스',id:3023,unique:true},
 echidna:{name:'에키드나',id:3012,unique:true},
 felicity:{name:'펠리시티',id:2572,unique:true},
 julia:{name:'줄리아',id:2576,unique:true},
 yasmin:{name:'야즈민',id:2574,unique:true},
 olga:{name:'올가',id:8901,unique:true},
 mprincess:{name:'일반 공주',id:1001,occupation:'mprincess',family:'mprincess',world:'highfantasy'},
 barbarian_princess:{name:'야만족 공주',id:1001,occupation:'barbarian_princess',family:'barbarian_king',world:'barbarian'},
 poor_wife:{name:'야만족 왕가 출신 평민',id:1001,occupation:'poor_wife',family:'barbarian_king'}
};
// These examples are part of the editor. Talkbooks and WORK dialogue never read them.
const voiceExamples={
 felicity:{
  '1112':'네가 한 약속은 기억하고 있다. 끝까지 지키는지 두고 보겠어.',
  '1114':'아버지께 내가 무사하다는 소식을 전하고 싶다. 전령을 불러라.',
  '1111':'나는 순백색 대도시의 공주다. 아버지가 자리를 비운 틈에 밀수꾼들에게 붙잡혔지.'
 },
 julia:{
  '1112':['낯선 곳이지만 오빠가 있어서 마음이 놓여.','낯선 곳에서 이야기할 사람이 생겨서 다행이에요.'],
  '1114':['오빠, 우리 어릴 때 이야기 좀 더 해 줘.','제가 자란 곳 이야기를 조금 더 나누고 싶어요.'],
  '1111':['오빠도 기억하지? 우린 같은 곳에서 자랐잖아.','여기서 다시 만난 사람과는 어릴 때부터 알던 사이예요.']
 },
 yasmin:{
  '1112':'판단은 빠르십니다. 다만 지시는 한 번에 알아들을 수 있게 내리십시오.',
  '1114':'이곳의 지도를 보여 주십시오. 움직이기 전에 지형부터 확인하겠습니다.',
  '1111':'어머니 의회에서 날개의 사령관으로 임명받았습니다. 보급할 행성에 내렸다가 안개에 들어왔습니다.'
 },
 olga:{
  '1112':'이곳에서 제 처지가 어떤지 압니다. 당신이 어떤 사람인지는 시간을 두고 살펴보겠습니다.',
  '1114':'이곳의 사정을 조금 더 알고 싶습니다. 그다음 제가 할 수 있는 일을 정하겠습니다.',
  '1111':'북방의 다크엘프를 다스렸습니다. 그때가 있었고, 지금은 여기에 있습니다.'
 }
};
const reformHeightLabels={1:'격식 존댓말',2:'존댓말',3:'반말'};
const reformSettings=new WeakMap();
const PLAIN_STYLE_BY_ID=new Map([
 [3002,'strong'],[2610,'strong'],[2620,'strong'],[3010,'strong'],[3021,'strong'],[3023,'strong'],[3012,'strong'],[2572,'strong'],
 [2621,'familiar'],[1448,'familiar'],[2576,'familiar']
]);
const PLAIN_STYLE_LABEL={strong:'강반말투',familiar:'친반말투'};

export function plainVoiceVariant(actor,speech=speechPresentation(actor)){
 return speech.style===3?PLAIN_STYLE_BY_ID.get(Number(actor.id??actor.type))??'':'';
}

export function recognitionDraft(row,actor,speech=speechPresentation(actor)){
 if(row?.key!=='body_relation_docile_core_hesitant_3')return '';
 const variant=plainVoiceVariant(actor,speech);
 if(variant==='strong')return '흠, 이제는 내 마스터로 인정하겠다.';
 return variant==='familiar'?'저기… 이젠 내 마스터처럼 모셔야 하는 거겠지?':'';
}

const STRONG_ENDINGS={
 '하고 싶어':'하고 싶다','보고 싶어':'보고 싶다','잘 모르겠어':'잘 모르겠다','모르겠어':'모르겠다',
 '않겠어':'않겠다','알겠어':'알겠다','있겠어':'있겠다','해 주겠어':'해 주겠다','해 줄게':'해 주겠다',
 '보여 줄게':'보여 주겠다','알려 줄게':'알려 주겠다','조금 더 볼게':'조금 더 보겠다',
 '않았어':'않았다','아니었어':'아니었다','있었어':'있었다','없었어':'없었다','했어':'했다','왔어':'왔다',
 '아니야':'아니다','해야 해':'해야 한다','하면 돼':'하면 된다','좋아':'좋다','없는데':'없군',
 '있는데':'있군','없어':'없다','있어':'있다','같아':'같다','않아':'않는다','맞아':'맞다','몰라':'모른다',
 '할 거야':'하겠다','거야':'거다','잖아':'잖나','바라겠어':'바라겠나','싶어':'싶다',
 '생각 마':'생각 마라','그만해':'그만해라','하지 마':'하지 마라'
};
const strongEndingPattern=new RegExp('('+Object.keys(STRONG_ENDINGS).sort((a,b)=>b.length-a.length).join('|')+')(?=\\s*(?:[.!?…~,;:！？，]|$))','gu');
export function renderStrongPreview(text){
 return String(text).split(/(“[^”]*”|‘[^’]*’|"[^"]*"|'[^']*')/u).map((part,index)=>
  index%2?part:part.replace(strongEndingPattern,(_,ending)=>STRONG_ENDINGS[ending])).join('');
}

const DIFFIDENT_ACTION=/눈치(?:를)?\s*(?:보|살피)|주눅|주춤|쭈뼛|우물쭈물|소극|위축|움츠|웅크|시선(?:을)?\s*(?:낮추|내리|피하|떨구|비키|바닥에)|바닥(?:을|에)\s*(?:바라|보|시선)|고개를\s*(?:숙|푹|깊)|공손|죄송|순종|억지로 기세|압도당|풀이 죽|숨을 죽|눈을\s*내리(?:깔|깐|까)|조심스레|조심스럽/u;
const STATE_ACTION={
 frightened:'숨을 고르고 시선을 든다.',
 lachrymose:'낮고 가라앉은 목소리로 말을 잇는다.',
 depresive:'잠시 말을 멈췄다가 짧게 입을 연다.',
 broken:'한동안 말을 멈춘 뒤 짧게 답한다.',
 resistant:'고개를 젓고 말을 짧게 끊는다.',
 hateful:'차가운 눈빛으로 상대를 바라본다.'
};

export function revisePlainAction(text,actor,speech=speechPresentation(actor)){
 if(speech.style!==3)return text;
 const direction=STATE_ACTION[actor.psy_status]??
  (plainVoiceVariant(actor,speech)==='strong'?'말을 고르고 단정하게 답한다.':'생각을 정리하고 말을 꺼낸다.');
 return String(text).split(/(“[^”]*”|‘[^’]*’|"[^"]*"|'[^']*')/u)
  .map((part,index)=>index%2?part:part.replace(/\(([^()\r\n]*)\)/gu,(cue,action)=>
   DIFFIDENT_ACTION.test(action)?'('+direction+')':cue)).join('');
}

function ordinaryPrincess(actor,profile=reformProfile(actor)){
 return actor.unique!==true&&actor.fixedSexTalk!==true&&CASUAL_OCC.includes(profile);
}

export function sharedNoWishDraft(role,actor,speech=speechPresentation(actor)){
 if(speech.style!==3||!/^native_1114_no_like(?:_gentle)?_core$/.test(role))return '';
 const strong=plainVoiceVariant(actor,speech)==='strong'||(speech.strict&&ordinaryPrincess(actor));
 if(speech.expression==='fearful')return strong
  ?'지금은 마음이 어수선하다. 무엇을 배울지는 마음을 가다듬은 뒤에 정하겠다.'
  :'지금은 마음이 어수선해. 좀 가라앉으면 뭘 배울지 생각할게.';
 if(speech.expression==='sad')return strong
  ?'오늘은 새로 배울 것을 정할 마음이 없다. 다음에 생각하겠다.'
  :'오늘은 뭘 더 배우고 싶은지 생각이 안 나. 다음에 정할래.';
 return strong
  ?'흠, 아직은 나한테 무슨 일이 맞는지 잘 모르겠다. 딱히 떠오르는 건 없군.'
  :'저기… 아직은 무슨 일이 나한테 맞는지 잘 모르겠어. 딱히 떠오르는 건 없는데?';
}

const DISLIKE_DRAFT={
 strong:{
  resistant:['무엇을 말할지는 내가 정한다. 지금은 대답하지 않겠다.','따로 꼽을 불만은 없다. 내 판단은 내가 내린다.'],
  hateful:['너한테 내 속을 털어놓을 생각은 없다. 그만 물어라.','따로 꼽을 불만은 없다. 너를 좋게 볼 이유도 없다.']
 },
 familiar:{
  resistant:['어디까지 말할지는 내가 정할게. 지금은 여기까지야.','딱히 꼽을 불만은 없어. 내 판단은 내가 할게.'],
  hateful:['너한테 속 얘기할 생각 없어. 그만 물어.','따로 꼽을 불만은 없어. 널 좋게 볼 이유도 없고.']
 },
 2:{
  resistant:['어디까지 말할지는 제가 정할게요. 지금은 답하고 싶지 않아요.','따로 꼽을 불만은 없어요. 제 판단은 제가 할게요.'],
  hateful:['당신한테 속 얘기까지 할 생각은 없어요. 그만 물어요.','따로 꼽을 불만은 없어요. 당신을 좋게 볼 이유도 없고요.']
 },
 1:{
  resistant:['어디까지 말할지는 제가 결정하겠습니다. 지금은 답하지 않겠습니다.','따로 언급할 불만은 없습니다. 제 판단은 제가 내리겠습니다.'],
  hateful:['당신에게 속내를 밝힐 생각은 없습니다. 질문은 여기서 끝내십시오.','따로 언급할 불만은 없습니다. 당신을 좋게 볼 이유도 없습니다.']
 }
};

export function sharedDislikeDraft(role,actor,speech=speechPresentation(actor)){
 if(!['resistant','hateful'].includes(actor.psy_status))return '';
 if(role!=='native_1115_hide_dislikes_core'&&role!=='native_1115_no_dislike_core')return '';
 const style=speech.style===3?(plainVoiceVariant(actor,speech)||'familiar'):speech.style;
 return DISLIKE_DRAFT[style][actor.psy_status][role==='native_1115_hide_dislikes_core'?0:1];
}

const LUMINOUS_PAST={
 normal:{
  world:'나는 신성 루베리오 제국을 다스렸다. 모든 뱀파이어의 여주인이자 가장 오래된 마왕 중 하나다.',
  family:'나는 순혈의 시조 뱀파이어다. 내 일족은 수가 적어도 무적이라 할 만큼 강하다. 천 년에 걸쳐 이 세상의 모든 지식을 터득했지.',
  occupation:'내 세계로 돌아가 나를 추방한 용사에게 복수할 것이다. 이곳에선 예전 힘을 쓸 수 없으니 이 세계의 마법이 필요하다. 가르쳐 준다면 그 대가로 복종하겠다.'
 },
 rough:{
  world:'신성 루베리오 제국은 내가 다스렸다. 모든 뱀파이어의 여주인이자 가장 오래된 마왕 가운데 하나라는 것도 기억해 둬라.',
  family:'내가 순혈의 시조 뱀파이어다. 우리 일족이 적다고 얕보지 마라. 무적에 가까운 일족이고, 나는 이 세상의 모든 지식을 터득하는 데 천 년을 썼다.',
  occupation:'내 세계로 돌아가 나를 추방한 용사에게 복수할 것이다. 이곳에선 예전 힘을 쓸 수 없으니 이 세계의 마법을 가르쳐라. 거래의 대가는 내 복종이다.'
 },
 soft:{
  world:'신성 루베리오 제국은 내가 다스리던 곳이다. 모든 뱀파이어의 여주인이자 가장 오래된 마왕 중 하나지. 내가 떠난 뒤 제국은 어찌 되었을까, 가끔 생각한다.',
  family:'나는 순혈의 시조 뱀파이어다. 수가 적어도 내 일족의 힘은 무적에 가깝지. 이 세상의 모든 지식을 터득하는 데는 천 년이 걸렸다.',
  occupation:'나를 추방한 용사에게 복수하러 내 세계로 돌아갈 생각이다. 지금은 힘을 못 쓰지만 이 세계의 마법을 익힐 길은 있지. 네가 가르쳐 준다면 그 대가로 복종하겠다.'
 },
 fearful:{
  world:'신성 루베리오 제국을 다스린 건 나다. 모든 뱀파이어의 여주인이자 가장 오래된 마왕 가운데 하나지. …잠시 숨을 고르고 계속 말하겠다.',
  family:'순혈의 시조 뱀파이어다. 숫자가 적다고 해서 내 일족의 힘을 낮춰 보지 마라. 무적에 가까운 일족이고, 나는 천 년에 걸쳐 이 세상의 모든 지식을 터득했다.',
  occupation:'그 용사에게 추방되던 일을 떠올리면 아직 숨이 가빠진다. 이곳에선 힘을 쓸 수 없다. 네가 이 세계의 마법을 가르치면 그 대가로 복종하겠다. 귀환도 복수도 내가 해낼 일이다.'
 },
 sad:{
  world:'나는 신성 루베리오 제국을 다스렸다. 모든 뱀파이어의 여주인이자 가장 오래된 마왕 중 하나다. …오늘은 궁정이 그립군.',
  family:'나는 순혈의 시조 뱀파이어다. 수가 적어도 내 일족은 무적이라 할 만큼 강하다. 천 년에 걸쳐 이 세상의 모든 지식을 터득했지. 오늘따라 일족이 생각나는군.',
  occupation:'내 세계로 돌아가 나를 추방한 용사에게 복수할 생각은 여전하다. 이곳에서는 힘을 쓸 수 없군. 이 세계의 마법을 가르쳐 준다면 대가로 복종하겠다.'
 },
 depresive:{
  world:'신성 루베리오 제국은 내가 다스렸다. 모든 뱀파이어의 여주인이자 가장 오래된 마왕 중 하나다. …오늘은 그 이야기를 길게 할 힘이 없군.',
  family:'순혈의 시조 뱀파이어다. 수는 적어도 내 일족은 무적에 가까웠지. 이 세상의 모든 지식은 천 년에 걸쳐 터득했다.',
  occupation:'이곳에선 내 힘을 쓸 수 없다. 이 세계의 마법을 배우는 대가로 복종하겠다. 내 세계로 돌아가 나를 추방한 용사에게 복수한다. 그 뜻까지 꺾인 건 아니다.'
 },
 broken:{
  world:'…신성 루베리오 제국. 내가 다스리던 곳이다. 모든 뱀파이어의 여주인이고, 가장 오래된 마왕 가운데 하나지.',
  family:'나는 순혈의 시조 뱀파이어다. 내 일족은 적지만 무적에 가깝다. 천 년 동안 이 세상의 모든 지식을 터득했지. …여기까지는 기억난다.',
  occupation:'용사가 나를 추방했다. 이곳에선 힘을 쓸 수 없다. 이 세계의 마법을 배운다면 대가로 복종하겠다. …돌아가서 용사에게 복수한다. 내가 하려던 일은 그거다.'
 }
};
const STRONG_STATE={
 docile:['네 말을 듣고 있다. 너에 대한 판단은 서두르지 않겠다.','조용하군. 이 정도면 생각을 정리하기에 충분하다.'],
 soft:['너와 말하는 일이 전만큼 낯설지는 않군. 오늘은 조금 더 들어 보겠다.','마음이 한결 누그러졌다. 이런 때라면 이야기가 길어져도 좋겠군.'],
 optimistic:['네게서 뜻밖의 가능성이 보이는군. 어디까지 갈 수 있는지 지켜보겠다.','일이 풀릴 여지는 있다. 다음에 움직일 때부터 살펴보지.'],
 obedient:['지금은 네 지시에 따를 생각이다. 무엇을 맡길지 분명히 말해라.','마음은 가라앉아 있다. 해야 할 일부터 끝내겠다.'],
 servile:['지금 내 처지에서 네 지시를 거스르기 어렵다는 건 안다. 그만큼은 인정하지.','기운이 많이 꺾였군. 지금은 하루를 버티는 데 힘을 쓰겠다.'],
 horny:['지금은 네 목소리에도 자꾸 신경이 가는군. 판단은 마음이 가라앉은 뒤에 하겠다.','마음이 들떠 한 가지에 집중하기 어렵군. 잠시 숨을 고르겠다.'],
 reluctant:['네 말은 알아들었다. 선뜻 마음이 갈 만한 이야기는 아니군.','마음이 내키지 않는다. 지금은 꼭 필요한 일부터 하겠다.'],
 arrogant:['그 정도면 내 인정을 받을 만하다고 생각하나? 내 기준은 더 높다.','이 정도로 내 기세가 꺾일 줄 알았나? 나는 여전히 나다.'],
 hateful:['너를 보는 것만으로 불쾌하다. 내 생각이 쉽게 바뀔 일은 없겠군.','불쾌함이 좀처럼 가시지 않는다. 지금은 네 얼굴도 보고 싶지 않군.'],
 resistant:['나를 설득하려면 지시부터 멈춰라. 내 답은 내가 정한다.','신경이 곤두서는군. 어디까지 받아들일지는 내가 정하겠다.'],
 hysteric:['말을 멈춰라! 네 목소리가 들릴 때마다 머릿속이 더 어지럽다.','생각이 한꺼번에 치밀어 오르는군. …더 가까이 오지 마라.'],
 lachrymose:['네 말을 들었다. …눈물이 멎으면 대답하겠다.','눈물이 멎지 않는군. 오늘 이야기는 여기까지 하겠다.'],
 frightened:['거기 서 있어라. 네가 갑자기 움직이면 지금은 판단하기 어렵다.','작은 소리에도 몸이 굳는군. 잠시 숨을 고르겠다.'],
 depresive:['네가 어떤 사람인지 따져 볼 마음이 나지 않는군. 이 질문은 미뤄 두겠다.','무엇을 해도 마음이 움직이지 않는다. 오늘은 하던 일부터 하나씩 마치겠다.'],
 broken:['네 말은 들린다. 뜻을 붙잡기가 어렵군. 판단은 할 수 없다.','생각이 자꾸 끊긴다. 지금은 한 문장씩 말하는 것만으로 벅차군.']
};
const FAMILIAR_STATE={
 2621:{
  docile:['너랑은 말이 통하는 것 같네. 일단 그 정도면 됐어.','오늘은 조용해서 편하네. 이대로 좀 있고 싶어.'],
  soft:['네가 있으면 덜 심심하긴 해. 흥, 딱 그 정도야.','오늘은 말이 좀 잘 나오네. 같이 앉아 있어도 돼.'],
  optimistic:['네가 한 말대로 되면 꽤 괜찮겠네. 어디 한번 보자고.','이번엔 일이 좀 풀릴 것 같아. 지금부터 뭘 할지 생각해 볼래.'],
  obedient:['이번엔 네 말대로 할게. 할 일은 똑바로 알려 줘.','마음은 가라앉았어. 정해진 일부터 끝내고 쉴래.'],
  servile:['지금은 네 말에 토 달 기운도 없어. 듣고 있으니까 계속해.','오늘은 부딪칠 기운이 없어. 조용히 지내고 싶어.'],
  horny:['오늘은 괜히 신경이 쓰이네. 흥, 잠깐 딴생각 좀 할래.','왜 이렇게 들뜨지? 가만히 있기가 힘드네. 잠깐 걸어야겠어.'],
  reluctant:['네가 무슨 말을 하는지는 알아. 듣고 보니 썩 내키진 않네.','뭐 하나 선뜻 손이 안 가네. 꼭 해야 하는 것부터 할래.'],
  arrogant:['그 정도로 날 감탄시킬 수 있을 줄 알았어? 난 보는 눈이 높거든.','흥, 이 정도에 내가 기죽을 줄 알았어? 아직 멀었거든.'],
  hateful:['너랑 말 섞는 것만으로 기분이 상해. 오늘은 내 앞에 오지 마.','네 얼굴만 봐도 속이 뒤틀려. 한동안 혼자 있을래.'],
  resistant:['시키는 대로 말하라고? 내 대답은 내가 정해.','신경이 곤두서 있어. 밀어붙일수록 더 단단히 버틸 거야.'],
  hysteric:['잠깐, 말을 한꺼번에 쏟아내지 마! 머릿속이 뒤죽박죽이야.','생각이 마구 튀어서 하나도 못 잡겠어. 다들 잠깐 멈춰!'],
  lachrymose:['네 말은 들었어. …눈물부터 닦고 답할래.','눈물이 자꾸 나네. 오늘 얘기는 여기까지만 할래.'],
  frightened:['거기 있어. 갑자기 다가오면 내가 하려던 말도 놓쳐.','작은 소리에도 흠칫하게 돼. 잠깐 숨 좀 고를래.'],
  depresive:['오늘은 너한테 어떤 인상을 받았는지 생각할 마음도 안 나.','뭘 해도 재미가 없어. 당장 할 수 있는 일부터 조금씩 할래.'],
  broken:['네 목소리는 들려. 무슨 뜻인지는 자꾸 놓치네. 지금은 답이 안 나와.','생각이 자꾸 중간에서 끊겨. 한마디만 할게. 오늘은 여기까지야.']
 },
 1448:{
  docile:['너랑은 어렵게 말할 필요 없을 것 같아. 필요한 건 바로 말해 줘.','지금은 편안해. 평소처럼 지내면 될 것 같아.'],
  soft:['요즘은 네가 옆에 있어도 마음이 편해. 할 말이 있으면 들어 줄게.','오늘은 너랑 얘기하고 싶네. 조금 더 앉아 있어도 좋아.'],
  optimistic:['너랑은 앞으로 재미있는 일이 좀 생길 것 같아.','내일은 뭘 할지 벌써 생각하고 있어. 좀 기대되네.'],
  obedient:['네가 뭘 원하는지 알겠어. 지금은 네 판단을 따를게.','할 일이 분명하니까 마음이 편해. 먼저 그거부터 할게.'],
  servile:['네 말에 맞춰 움직일게. 지금은 더 얽히고 싶지 않아.','지금은 다툴 힘이 없어. 할 일이 있으면 그거부터 끝낼게.'],
  horny:['네 말 듣고 있어. 다만 오늘은 한 가지에 집중하기가 좀 힘드네.','이상하게 가만히 있기가 힘들어. 잠깐 움직이고 오는 게 낫겠어.'],
  reluctant:['네 말에 썩 마음이 내키진 않아. 그래도 듣고 나서 내가 정할게.','아직 선뜻 마음이 움직이진 않아. 조금 더 생각할래.'],
  arrogant:['날 너무 낮게 봤다면 네가 잘못 본 거야. 내 몫은 알아서 해.','내가 할 수 있는 일은 알아. 지금도 그 생각은 그대로야.'],
  hateful:['네가 하는 말은 믿지 않아. 더 가까이 오지 마.','네 목소리를 듣는 것만으로도 화가 나. 지금은 말 걸지 마.'],
  resistant:['네 말은 들었어. 따르겠다고 한 적은 없어.','내가 정할 일은 내가 정할 거야. 그 생각은 안 바뀌어.'],
  hysteric:['지금은 네 말이 귀에 안 들어와. 한꺼번에 말하지 마.','머릿속이 어수선하고 손도 떨려. 잠깐 숨부터 고를게.'],
  lachrymose:['오늘은 너에 대해 길게 말 못 하겠어. 그냥 곁에 있어도 괜찮아.','가라앉는 줄 알았는데 눈물이 또 나네. 잠깐 이대로 있을게.'],
  frightened:['네가 다음에 뭘 할지 모르겠어. 갑자기 다가오진 마.','몸에 힘이 들어가서 잘 안 풀려. 숨부터 고르고 얘기할게.'],
  depresive:['지금은 네가 어떤 사람인지 생각할 기운도 없어. 네 얘기는 들었어.','뭘 하려고 해도 마음이 잘 안 움직여. 오늘은 조용히 있고 싶어.'],
  broken:['네 얼굴은 보여. 무슨 말을 했는지는 잘 모르겠어.','아무것도 잘 느껴지지 않아. 지금은 더 말 못 하겠어.']
 },
 2576:{
  docile:['오빠랑 얘기하면 생각을 숨길 필요가 없어서 편해.','기분은 괜찮아. 지금처럼 조용히 지내는 것도 좋아.'],
  soft:['오빠가 바로 답하라고 재촉하지 않으면 나도 편하게 말할 수 있어.','마음이 한결 편해졌어. 조금 더 얘기하다 가도 좋겠다.'],
  optimistic:['오빠 생각도 들어 볼래. 오늘은 둘이 얘기하면 답이 나올 것 같아.','기분 좋아. 미뤄 둔 일도 오늘은 하나쯤 끝낼 수 있을 것 같아.'],
  obedient:['이번엔 오빠 말대로 해 볼래. 해 보고 다른 생각이 들면 얘기할게.','할 일이 분명해서 마음이 편해. 하나씩 해 보려고.'],
  servile:['오빠가 어떻게 볼지 먼저 생각하게 돼. 그래도 내 생각은 말해 둘게.','오빠 말 한마디에 기분이 오르내려. 나도 그게 신경 쓰여.'],
  horny:['오빠 말은 듣고 있어. 오늘은 자꾸 딴생각이 나서 집중이 잘 안 돼.','가만히 있기가 어렵네. 잠깐 걷고 오면 나아질 것 같아.'],
  reluctant:['오빠 말이라고 다 마음에 드는 건 아니야. 일단 듣고는 있어.','할 일은 하겠는데 썩 내키진 않아. 좀 뜸을 들이고 싶어.'],
  arrogant:['오빠도 내게 배울 게 있을걸? 그렇게 놀란 얼굴 하지 마.','오늘은 내 판단이 맞을 것 같아. 내가 먼저 해 볼래.'],
  hateful:['오빠라고 부른다고 내 마음까지 풀린 건 아니야. 지금은 얼굴만 봐도 화가 나.','지금은 오빠랑 같은 방에 있는 것도 싫어. 혼자 있을래.'],
  resistant:['지금 오빠 말에는 동의 못 해. 내 몫은 내가 정할 거야.','마음이 불편해도 할 말은 할 거야. 여기서 밀리고 싶지 않아.'],
  hysteric:['오빠, 한꺼번에 말하지 마. 뭐부터 답해야 할지 모르겠어.','생각이 너무 빨리 돌아. 잠깐 아무 말 없이 있을래.'],
  lachrymose:['오빠, 눈물이 나서 말이 끊기네. 내 생각은 좀 진정되면 말할게.','눈물이 자꾸 나와. 괜찮은 척은 오늘 그만할래.'],
  frightened:['오빠, 갑자기 다가오면 놀라. 거기서 얘기해.','작은 소리에도 자꾸 몸이 굳어. 잠깐 숨을 고르고 나서 움직일래.'],
  depresive:['오빠가 어떤 사람인지 생각해 볼 기운이 없어. 오늘은 그 얘기 미뤄 둘래.','평소 하던 일도 오늘은 멀게 느껴져. 하나만 해 보고 좀 쉬려고.'],
  broken:['오빠, 무슨 말을 해야 할지 모르겠어. 오늘은 여기까지만 할래.','아무 생각도 잘 이어지지 않아. 지금은 조용히 있을래.']
 }
};
const FAMILIAR_QUESTIONS={
 2621:{
  noRequest:'지금 네게 시킬 일은 없어. 생기면 내가 먼저 말할게.',
  hideDislikes:'불만이야 있을 수 있지. 흥, 그걸 전부 네게 말할 생각은 없어.',
  noDislike:'딱히 따로 걸리는 건 없어. 뭐가 생기면 그때 말할게.',
  wish:topic=>topic+' 수업은 좀 더 듣고 싶어. 내가 골랐으니까 끝까지 해 볼 거야.',
  refusal:'오늘은 그 얘기 안 할래. 말할 때가 되면 내가 먼저 꺼낼게.'
 },
 1448:{
  noRequest:'지금은 따로 바라는 게 없어. 필요한 게 있으면 말할게.',
  hideDislikes:'말할 수 있는 일은 말할게. 그 얘긴 지금 하고 싶지 않아.',
  noDislike:'딱히 불편한 건 없어. 있으면 내가 먼저 말할게.',
  wish:topic=>topic+' 수업을 더 받고 싶어. 서두르지 않고 차근차근 익힐래.',
  refusal:'그 얘긴 지금 안 할래. 다음에 내가 먼저 말할게.'
 },
 2576:{
  wish:topic=>'오빠, '+topic+' 수업은 더 듣고 싶어.'
 }
};

const JULIA_COMPLAINT={
 docile:['얘기는 들었어. 이건 좀 더 생각해 보고 말할래.','지금 딱히 마음에 걸리는 건 없어.'],
 soft:['오빠랑 얘기하는 건 편해. 그래도 그 얘긴 조금 뒤에 할래.','괜찮아. 마음에 걸리는 게 생기면 오빠한테 먼저 말할게.'],
 optimistic:['잘 풀릴 수도 있잖아. 지금은 이 얘길 좀 더 지켜보고 싶어.','딱히 불만은 없어. 앞으로 어떻게 될지가 더 궁금해.'],
 obedient:['오빠가 물어본 건 알아. 이건 내가 정리하고 말할래.','지금은 따로 할 말 없어. 하던 일부터 마저 할게.'],
 servile:['오빠가 어떻게 받아들일지 자꾸 생각하게 돼. 이 얘긴 지금 하지 않을래.','오빠 말이 자꾸 신경 쓰여. 지금 따로 말할 불만은 없어.'],
 horny:['마음이 들떠서 생각이 잘 안 정리돼. 그 얘긴 나중에 하자.','기분이 좀 들뜨긴 했는데, 따로 마음에 걸리는 건 없어.'],
 reluctant:['굳이 지금 얘기하고 싶진 않아. 이건 넘어가자.','딱히 불만은 없어. 오래 얘기할 마음도 없고.'],
 arrogant:['오빠가 묻는다고 다 말해 줄 줄 알았어? 말할 건 내가 골라.','굳이 불만을 찾아낼 필요는 없잖아. 없다고 했으면 없다는 거야.'],
 hateful:['오빠한테 내 속을 털어놓고 싶지 않아. 그만 물어.','따로 꼽을 불만은 없어. 그래도 지금은 오빠랑 말 섞기 싫어.'],
 resistant:['왜 꼭 지금 대답해야 해? 어디까지 말할지는 내가 정해.','따로 불만은 없어. 그래도 내 대답은 내가 고를 거야.'],
 hysteric:['오빠, 잠깐. 지금 하나씩 따질 정신이 아니야. 그 얘긴 멈춰.','말부터 좀 멈춰 봐. 머리가 복잡해서 그렇지, 따로 꼽을 불만은 없어.'],
 lachrymose:['지금 꺼내면 말이 자꾸 끊길 것 같아. 눈물 닦고 나서 얘기할래.','눈물이 자꾸 나네. 불만은 없어. 잠깐 이대로 있을래.'],
 frightened:['갑자기 그렇게 물으면 놀라잖아. 숨 좀 고르고 나서 말할게.','지금은 좀 놀랐어. 마음에 걸리는 일은 없어.'],
 depresive:['그 얘기까지 할 힘이 없어. 오늘은 그냥 두자.','뭐가 걸리는지 따질 마음도 안 나. 지금 딱히 불만은 없어.'],
 broken:['잠깐. 말이 잘 안 이어져. 지금은 여기까지만 할래.','…딱히 없어. 지금은 길게 말하기 어려워.']
};
const JULIA_PLANS={
 docile:['오빠한테 지금 부탁할 건 없어. 필요하면 그때 말할게.','딱히 배우고 싶은 건 없어. 생각나면 얘기할게.','서두르지 않고 조금씩 익혀 볼래.'],
 soft:['지금은 따로 바라는 거 없어. 생각나면 오빠한테 먼저 말할게.','오빠랑 얘기하고 있으니까 마음이 편하네. 수업은 아직 고른 게 없어.','차근차근 배우면 재미있을 것 같아.'],
 optimistic:['지금 부탁할 건 없어. 오늘은 내가 먼저 해 볼 수 있을 것 같아.','아직 하나로 못 정했어. 좀 더 살펴보면 마음에 드는 게 생길 것 같아.','생각보다 잘할 수 있을지도 몰라. 한번 해 볼래.'],
 obedient:['부탁할 건 없어. 정해진 일부터 마저 할게.','따로 정해 둔 수업은 없어. 오늘 해야 할 일부터 끝낼래.','할 일이 정리되면 바로 시작해 볼래.'],
 servile:['지금은 내 쪽에서 바라는 게 없어. 생각나면 내가 말을 꺼낼게.','내가 뭘 좋아하는지부터 생각해 봐야겠어. 아직 고른 건 없어.','이번 수업은 내가 고른 거야. 끝까지 해 보고 싶어.'],
 horny:['오늘은 자꾸 딴생각이 나네. 오빠한테 따로 바라는 건 없어.','마음이 좀 들뜨긴 했는데, 배울 건 아직 못 정했어.','마음을 좀 가라앉히고 나서 집중해 볼래.'],
 reluctant:['지금은 부탁할 것 없어. 굳이 만들어서 말하고 싶진 않아.','아직 마음이 가는 수업은 없어. 좀 더 생각해 볼래.','당장 시작할지는 좀 더 생각해 볼게.'],
 arrogant:['지금은 부탁할 거 없어. 내 몫은 내가 알아서 할 수 있어.','오빠가 골라 줄 필요 없어. 아직 내 눈에 들어온 게 없거든.','내가 어디까지 해낼 수 있는지 오빠도 두고 봐.'],
 hateful:['너한테 바라는 건 없어. 더 묻지 마.','배우고 싶은 건 아직 없어. 이 얘기도 그만하자.','배우고 싶다는 말까지만 할게. 이 얘기는 여기서 끝내자.'],
 resistant:['지금 요구할 건 없어. 필요하면 내가 직접 말할 거야.','내가 고른 수업은 아직 없어. 오빠가 대신 정하지 마.','배우는 건 내 선택이야. 시작할 때도 내가 정할 거야.'],
 hysteric:['지금은 부탁할 것 없어. 오빠, 질문은 하나씩 해.','생각이 너무 많아서 지금은 수업 하나도 못 고르겠어.','한꺼번에 말하지 말고, 어디부터 배우는지만 알려 줘.'],
 lachrymose:['오빠, 지금 따로 바라는 건 없어. …눈물부터 닦을게.','오늘은 뭘 배우고 싶은지까지 생각하기 어렵네. 아직 정한 건 없어.','눈물이 그치면 차근차근 해 볼래. 배우고 싶은 건 여전해.'],
 frightened:['지금 부탁할 건 없어. 오빠, 거기서 말해. 갑자기 다가오면 놀라.','지금은 뭘 배울지 못 정하겠어. 숨 좀 고르고 나서 생각할래.','오늘은 갑자기 시작하면 놀랄 것 같아. 시작할 때 먼저 알려 줘.'],
 depresive:['지금은 뭘 부탁할 마음도 안 들어. 생각나면 나중에 말할게.','새로 배우고 싶은 건 아직 없어. 오늘은 하던 일 하나면 충분해.','한꺼번에 다 할 힘은 없어. 한 가지부터 조금씩 해 볼래.'],
 broken:['오빠, 지금 부탁할 건 없어. …오늘은 이만할래.','아직 고른 수업은 없어. 지금은 뭘 더 정하기 어렵네.','지금은 여기까지만 말할게. 배우고 싶다는 건 알아 둬.']
};
const JULIA_PAST_INTRO={
 docile:'오빠랑 같이 자란 얘기지? 내가 기억하는 대로 말할게.',
 soft:'같이 자란 얘기를 꺼내니까 마음이 좀 편해지네. 오늘은 차근차근 얘기해 볼게.',
 optimistic:'우리 옛날 얘기? 오빠가 기억하는 것도 들어 보고 싶어. 내가 먼저 말할게.',
 obedient:'오빠가 궁금해하는 건 알아. 기억나는 것부터 순서대로 말할게.',
 servile:'오빠가 그때 일을 어떻게 기억하는지 신경 쓰여. 나도 내 기억대로 얘기할게.',
 horny:'오늘은 자꾸 딴생각이 나네. 같이 자랐을 때부터 하나씩 떠올려 볼게.',
 reluctant:'그 얘기가 지금 꼭 필요해? 알았어. 내가 기억하는 것부터 말할래.',
 arrogant:'오빠보다 내가 더 또렷하게 기억하는 것도 있잖아. 이번엔 내 얘기부터 들어 봐.',
 hateful:'같이 자랐다는 건 기억해. 지금도 화가 나니까, 내가 기억하는 것만 말할게.',
 resistant:'우리 얘기라면 내가 할 말도 있어. 오빠가 먼저 결론 내리지 마.',
 hysteric:'오빠, 질문 하나씩 해. …어디부터였지? 같이 자랄 때부터 얘기할게.',
 lachrymose:'같이 자랐던 때를 떠올리니까 또 눈물이 나네. 잠깐 닦고 이야기할게.',
 frightened:'갑자기 옛날 얘기를 꺼내니까 놀랐어. 오빠, 거기서 들어. 내가 말할게.',
 depresive:'옛날 얘기를 꺼낼 기운이 별로 없어. 기억나는 것부터 짧게 말할게.',
 broken:'기억이 자꾸 끊겨. …그래도 우리가 같이 자란 건 알아. 거기부터 말할게.'
};
const JULIA_STATE_LABEL={
 docile:'온순함',soft:'부드러움',optimistic:'낙관',obedient:'순종',servile:'비굴',horny:'발정',reluctant:'마지못함',
 arrogant:'오만',hateful:'증오',resistant:'저항',hysteric:'히스테리',lachrymose:'눈물',frightened:'겁먹음',depresive:'우울',broken:'무너짐'
};

export function juliaPastIntro(actor){
 if(previewVoice(actor)!=='julia'||actor.addressee!=='protagonist')return '';
 return JULIA_PAST_INTRO[actor.psy_status]??JULIA_PAST_INTRO.docile;
}

export function familiarCurrentDraft(question,actor,{role=''}={}){
 const speech=speechPresentation(actor);
 if(plainVoiceVariant(actor,speech)!=='familiar')return '';
 const id=Number(actor.id??actor.type);
 const states=FAMILIAR_STATE[id], lines=FAMILIAR_QUESTIONS[id];
 const state=states[actor.psy_status]??states.docile;
 const juliaPlans=id===2576?(JULIA_PLANS[actor.psy_status]??JULIA_PLANS.docile):null;
 const juliaComplaint=id===2576?(JULIA_COMPLAINT[actor.psy_status]??JULIA_COMPLAINT.docile):null;
 const lead=speech.strict?(id===1448?'잘 들어. 한 번만 말할 거야. ':'내 말부터 끝까지 들어. '):'';
 switch(question){
  case '1112': return lead+state[0];
  case '1116': return lead+state[1];
  case '1113': return role.startsWith('native_1113_no_need')?lead+(juliaPlans?.[0]??lines.noRequest):'';
  case '1115':
   if(role==='native_1115_hide_dislikes_core')return lead+(juliaComplaint?.[0]??(sharedDislikeDraft(role,actor,speech)||lines.hideDislikes));
   if(role==='native_1115_no_dislike_core')return lead+(juliaComplaint?.[1]??(sharedDislikeDraft(role,actor,speech)||lines.noDislike));
   return '';
  case '1114': {
   if(/^native_1114_no_like(?:_gentle)?_core$/.test(role))return lead+(juliaPlans?.[1]??sharedNoWishDraft(role,actor,speech));
   const skill=role.match(/^native_1114_(\w+)_like_core$/u)?.[1];
   const topic=skill==='music'?'음악':skill==='enchanter'?'마법':WISH_TOPICS[skill];
   return topic?lead+lines.wish(topic)+(juliaPlans?' '+juliaPlans[2]:''):'';
  }
  default: return '';
 }
}

export function familiarRefusalDraft(actor){
 const speech=speechPresentation(actor);
 if(plainVoiceVariant(actor,speech)!=='familiar')return '';
 if(speech.strict)return '내가 어디까지 말할지는 내가 정할게. 그만 물어.';
 const id=Number(actor.id??actor.type);
 if(id===2576)return (JULIA_COMPLAINT[actor.psy_status]??JULIA_COMPLAINT.docile)[0];
 return FAMILIAR_QUESTIONS[id].refusal;
}

const LUMINOUS_CURRENT={
 fearful:{
  lessonImpression:'네가 수련 시간을 내준 건 기억한다. …지금은 인기척이 신경 쓰이는군. 마음을 가다듬으면 마저 이야기하겠다.',
  hiddenDislike:'마음에 걸리는 건 있다. 지금은 그 얘길 꺼낼 때가 아니다.',
  noDislike:'네게 따로 지적할 일은 없다. 지금 신경이 곤두선 건 그와 별개다.',
  noRequest:'지금 네게 요구할 것은 없다. 필요하면 내가 말하겠다.',
  noWish:'다음에 무엇을 배울지는 아직 정하지 않았다. 마음이 가라앉으면 내가 고르겠다.',
  music:'음악은 마저 배우겠다. 다음엔 첫 음을 내기 전에 알려라. 갑작스러운 소리에 아직 손이 떨리는군.',
  magic:'이 세계의 주문은 마저 익히겠다. 시전하기 전에 알려라. 손의 떨림이 멎으면 내가 이어서 해 보지.',
  refusal:'지금은 답하지 않겠다. 마음을 가다듬고 나서 이야기하지.'
 },
 sad:{
  lessonImpression:'수련 시간을 내준 일은 기억하고 있다. 고맙다는 말은 해 두지. 오늘은 거기까지다.',
  hiddenDislike:'마음에 걸리는 일이야 있지. 오늘은 그 이야기를 꺼내지 않겠다.',
  noDislike:'네게 불만을 말할 일은 없다. 다만 오늘은 말이 길어지지 않는군.',
  noRequest:'오늘은 따로 요구할 게 없다. 필요한 일이 생기면 내가 말하지.',
  noWish:'오늘은 새로 배울 것을 정할 마음이 들지 않는군. 나중에 다시 생각하겠다.',
  music:'음악은 계속 익힐 생각이다. 오늘은 말보다 선율이 편하군. 다음에는 지난 곡부터 이어서 연주하지.',
  magic:'이 세계의 주문은 끝까지 익히겠다. 오늘은 마법서를 내 곁에 두어라. 내일 다시 펼쳐 보지.',
  refusal:'오늘은 그 이야기를 꺼낼 마음이 없군. 다음에 묻도록 해라.'
 }
};
const WISH_TOPICS={
 sport:'운동',expression:'화술',pet:'애완 훈련',dressage:'경마 훈련',cowSK:'착유',nurse:'간호',
 service:'살림',cook:'요리',gladiatrix:'전투술',art:'미술',calisthenics:'무용',secretary:'사무'
};

export function luminousPastDraft(actor,speech=speechPresentation(actor)){
 if(reformProfile(actor)!=='luminous'||Number(actor.age)===1)return null;
 const mode=speech.expression==='original'?actor.psy_status:speech.expression;
 const row=LUMINOUS_PAST[mode];
 return row?['world','family','occupation'].map(field=>row[field]):null;
}

export function strongRefusalDraft(actor,speech=speechPresentation(actor)){
 if(speech.strict)return '내가 대답할 범위는 내가 정한다. 그 질문은 거둬라.';
 if(speech.expression==='original')return '…지금은 말을 잇기 어렵군. 그 질문에는 답하지 않겠다.';
 return LUMINOUS_CURRENT[speech.expression]?.refusal??'그 질문에는 대답하지 않겠다. 여기까지 하자.';
}

export function strongCurrentDraft(question,actor,{role='',basedOnLesson=false}={}){
 const speech=speechPresentation(actor);
 if(plainVoiceVariant(actor,speech)!=='strong')return '';
 const row=LUMINOUS_CURRENT[speech.expression];
 const state=STRONG_STATE[actor.psy_status]??STRONG_STATE.docile;
 const lead=speech.strict?'똑바로 듣도록 해라. ':'';
 switch(question){
  case '1112': return lead+(basedOnLesson
   ?row?.lessonImpression??'수련할 시간을 내준 건 기억하겠다. '+state[0]:state[0]);
  case '1113':
   return role.startsWith('native_1113_no_need')?lead+(row?.noRequest??'지금 네게 요구할 것은 없다. 필요해지면 내가 말하겠다.'):'';
  case '1115': {
   const distinct=sharedDislikeDraft(role,actor,speech);
   if(distinct)return lead+distinct;
   if(role==='native_1115_hide_dislikes_core')
    return lead+(row?.hiddenDislike??'무엇이 마음에 걸리는지는 내가 판단한다. 네게 털어놓을 생각은 없다.');
   return role==='native_1115_no_dislike_core'?lead+(row?.noDislike??'지금 따로 꼽을 불만은 없다. 말할 일이 생기면 그때 말하겠다.'):'';
  }
  case '1116': return lead+state[1];
  case '1114': {
   if(role.startsWith('native_1114_no_like'))return lead+(row?.noWish??sharedNoWishDraft(role,actor,speech));
   const skill=basedOnLesson?'enchanter':role.match(/^native_1114_(\w+)_like_core$/u)?.[1];
   if(skill==='music')return lead+(row?.music??'이곳의 음악을 더 익히고 싶다. 다음엔 내 손으로 한 곡을 끝까지 연주해 보겠다.');
   if(skill==='enchanter')return lead+(row?.magic??'이 세계의 마법을 더 익히겠다. 다음에는 주문을 처음부터 내 힘으로 펼쳐 보겠다.');
   const topic=WISH_TOPICS[skill];
   if(!topic)return '';
   if(speech.expression==='fearful')
    return topic+' 수업은 마저 들을 생각이다. 지금은 손이 떨리니, 서두르지 않고 하나씩 익히겠다.';
   if(speech.expression==='sad')
    return topic+' 수업은 계속 듣겠다. 오늘은 지난 수업부터 조용히 되짚어 보고 싶군.';
   return lead+topic+' 수업을 더 듣겠다. 어디까지 익힐 수 있는지 직접 확인하고 싶군.';
  }
  default: return '';
 }
}

let reformRequest;
function fetchReform(){
 if(!reformRequest)reformRequest=call(endpoint+'/reform').finally(()=>{reformRequest=null;});
 return reformRequest;
}

const wishSkills=['sport','expression','pet','dressage','cowSK','nurse','service','cook','gladiatrix','enchanter','art','music','calisthenics','secretary'];
const deferentialStates=new Set(['obedient','servile','horny']);
// Mirrors the trait gates in WORK chose_answer. Multi-page history is still computed by the game.
const topicAttitudes=['abuse','darkness','blood','fire','water','vermin','deprivation'];
const numberField=(actor,key)=>Number(actor[key]??0);
const topicRoles=(question,keys)=>keys.map(key=>'native_'+question+'_'+key+'_core');

function comfortValue(value){
 if(value('jo9_work_ethic')>0||value('passion_comfort')<0)return -1;
 if(value('jo9_focus')>0)return 0;
 return value('jo9_work_ethic')<0||value('passion_comfort')>0?1:0;
}

function attentionValue(value,key){
 const raw=value(key);
 const attention=value('jo9_attention')===1||value('abuse_attitude')===-1||value('passion_fame')===1;
 if(!attention)return raw;
 if(key==='abuse_attitude'&&(raw===-1||raw===0))return -1;
 if(key==='passion_fame'&&(raw===0||raw===1))return 1;
 return raw;
}

function requirementTopics(value){
 const keys=[];
 if(comfortValue(value)===1)keys.push('comfort');
 if(value('passion_luxury')===1)keys.push('luxury');
 if(value('passion_sweets')===1)keys.push('sweets');
 if(attentionValue(value,'passion_fame')===1)keys.push('fame');
 if(value('custom')>1)keys.push(...topicAttitudes.filter(key=>value(key+'_attitude')===2));
 const arousal=value('arousal'), obedience=value('obedience');
 if(value('nymphomania')>0&&arousal>1&&value('instinct')>2&&value('sex_sum')>5)keys.push('nymphomania');
 if(value('homosexualism')===2&&arousal>1&&value('sex_sum')>0)keys.push('homosexualism');
 if(value('exhibitionism')===2&&arousal>2&&obedience>20)keys.push('exhibitionism');
 if(value('perversion')===2&&arousal>3&&obedience>40)keys.push('perversion');
 return keys.map(key=>key+'_need');
}

function dislikeTopics(value){
 const keys=[], arousal=value('arousal');
 if(value('nymphomania')<0&&arousal>0)keys.push('nymphomania');
 if(value('homosexualism')===-1&&arousal>0)keys.push('homosexualism');
 if(value('exhibitionism')===-1&&arousal>1)keys.push('exhibitionism');
 if(value('perversion')===-1&&arousal>2)keys.push('perversion');
 if(comfortValue(value)===-1)keys.push('comfort');
 for(const key of ['luxury','sweets','fame'])if(value('passion_'+key)===-1)keys.push(key);
 if(value('instinct')>0)keys.push(...topicAttitudes.filter(key=>
  (key==='abuse'?attentionValue(value,'abuse_attitude'):value(key+'_attitude'))===-1));
 return keys.map(key=>key+'_dislike');
}

// Existing moodlets in WORK order. Only actual active values use their event-specific lines.
const moodletKeys=[
 'pos_slave_winner pos_multiple_orgasm pos_slave_kannabis pos_slave_opium pos_slave_alco pos_no_punish pos_ineffective_punishment pos_gentle pos_praise pos_slave_date',
 'pos_games pos_dessert pos_reward pos_spellguarded pos_cookie pos_sleep pos_slept_with_master pos_job pos_cow pos_barn pos_slave_clean pos_well_rested pos_orgasm pos_clothes pos_pony pos_slave_love pos_moral',
 'pos_sa_promote pos_sa_friendship pos_sa_love pos_sa_sadist pos_sa_enemy_prisoned pos_sa_enemy_punished pos_slave_love2 pos_slave_love3 pos_slave_love4 pos_slave_love5 pos_slave_love6 pos_master_vampire',
 'neg_slave neg_angst neg_fear neg_slave_meth neg_slave_opium neg_slave_koffe neg_slave_alco neg_slave_loser neg_slave_wounded neg_ugly neg_hungry neg_starvation neg_exhausted neg_raped neg_defloration',
 'neg_barn_plus neg_barn neg_cow neg_pain neg_forced neg_spellbound neg_shame neg_no_praise neg_abuse neg_disgust neg_slave_food neg_bad_sleep neg_slept_with_master neg_slave_mess neg_slave_ill neg_slave_dirty neg_menstruation',
 'neg_job neg_prisoner neg_naked neg_clothes neg_horny neg_rules neg_spoil neg_cheap_gift neg_cheap_reward neg_pony_died neg_master_vampire neg_sa_catfight neg_sa_love_lost2 neg_sa_jealous neg_sa_nonfriendly neg_sa_rivalry',
 'neg_sa_demote neg_sa_friend_prisoned neg_sa_friend_punished neg_sa_love_lost1 neg_sa_ill neg_not_sleep_together neg_another_sleep_together'
].join(' ').split(' ');
const STATE_MOOD_PREVIEW={
 resistant:['지금은 제 마음을 설명하고 싶지 않습니다. 좀 더 생각해 보겠습니다.','지금은 제 기분까지 말씀드리고 싶지 않아요. 좀 더 생각해 볼게요.','지금은 내 기분까지 말하고 싶지 않아. 좀 더 생각해 볼게.'],
 hateful:['기분을 물으셨군요. 지금은 그 이야기를 나누고 싶지 않습니다.','지금 어떤 기분인지 당신한테 털어놓을 생각은 없어요.','지금 어떤 기분인지 너한테 털어놓을 생각은 없어.'],
 optimistic:['앞으로는 조금 나아질 것 같습니다. 그렇게 생각하니 마음이 놓입니다.','조금씩 나아질 거라고 생각하니 마음이 좀 놓여요.','조금씩 나아질 거라고 생각하니 마음이 좀 놓여.'],
 lachrymose:['오늘은 자꾸 눈물이 납니다. 잠시 마음을 가라앉히고 싶습니다.','오늘은 자꾸 눈물이 나요. 잠깐 마음부터 가라앉히고 싶어요.','오늘은 자꾸 눈물이 나. 잠깐 마음부터 가라앉히고 싶어.']
};

export function simulatorMoodStateLine(role,style){
 return STATE_MOOD_PREVIEW[role.slice('preview_1116_'.length)]?.[style-1]??'';
}

export function simulatorPreviewRoles(question,actor={}, {statePreview=true}={}){
 const psy=actor.psy_status, general=actor.unique!==true&&actor.fixedSexTalk!==true&&ordinary(actor), value=key=>numberField(actor,key);
 if(question==='1116'){
  if(general){
   if(psy==='broken')return topicRoles(question,['slave_neg_']);
   const active=moodletKeys.filter(key=>value(key)>0);
   if(active.length)return topicRoles(question,active.map(key=>'slave_'+key));
   if(statePreview&&Object.hasOwn(STATE_MOOD_PREVIEW,psy))return ['preview_1116_'+psy];
   if(!statePreview)return topicRoles(question,['slave_pos_']);
  }
  if(value('neg_angst')>0||psy==='depresive')return ['native_1116_slave_neg_angst_core'];
  if(value('neg_fear')>0||psy==='frightened')return ['native_1116_slave_neg_fear_core'];
  return ['native_1116_slave_pos__core'];
 }
 if(question==='1112')return ['fact_relation_'+(psy||'docile')+'_core'];
 if(question==='1113'){
  const topics=general?requirementTopics(value):[];
  return topicRoles(question,topics.length?topics:[deferentialStates.has(psy)?'no_need_gentle':'no_need']);
 }
 if(question==='1114'){
  const known=wishSkills.filter(key=>value(key+'_affinity')>0);
  return topicRoles(question,known.length?known.map(key=>key+'_like'):[deferentialStates.has(psy)?'no_like_gentle':'no_like']);
 }
 if(question==='1115'){
  if(actor.obedience!=null&&value('obedience')<value('intellect')-value('temperament'))return topicRoles(question,['hide_dislikes']);
  const topics=general?dislikeTopics(value):[];
  return topicRoles(question,topics.length?topics:['no_dislike']);
 }
 return [];
}

export function selectSimulatorRow(rows,role,context){
 const tone=Number(context.tone),type=context.type,relation=context.relation;
 const matches=(rule,value)=>!rule||rule==='*'||String(rule).split('|').includes(value);
 const pool=rows.filter(row=>row.role===role&&Number(row.tone)===tone);
 const variant=type==='proud'||type==='flame'||type==='frank'?'direct':type==='fragile'||type==='meek'?'hesitant':'reserved';
 return pool.find(row=>matches(row.types,type)&&matches(row.relations,relation)&&row.key.includes(`_${variant}_`))
  ??pool.find(row=>matches(row.types,type)&&matches(row.relations,relation))
  ??(role.startsWith('native_1115_')?null:pool.find(row=>matches(row.types,type)))??null;
}

function qspTextLiteral(hits,location,marker){
 const row=hits.find(line=>line.location===location&&line.text.trimStart().startsWith(marker));
 const literal=row?.text.trim().slice(marker.length).match(/^'((?:[^']|'')*)'$/u);
 return literal?.[1].replaceAll("''","'")??'';
}

const dislikeNounToken=/<<\s*\$slave_noun1\s*\[\s*slave\s*\[\s*(["'])age\1\s*\]\s*\]\s*>>(예요)?/gu;
export async function loadDislikeFallback(role,appearanceCode,base=''){
 const field=role==='native_1115_hide_dislikes_core'?'hide_dislikes':
  role==='native_1115_no_dislike_core'?'no_dislike':'';
 if(!field)return '';
 const marker='$'+field+' = ';
 const index=appearanceCode==null||appearanceCode===''?NaN:Number(appearanceCode);
 const nounMarker=field==='hide_dislikes'&&Number.isInteger(index)&&index>=0?'$slave_noun1['+index+'] = ':'';
 const q=nounMarker?marker+'|'+nounMarker:marker;
 const {hits}=await call(base+'/api/qsp/search?'+new URLSearchParams({q}));
 const text=qspTextLiteral(hits,'#txt_man',marker);
 const noun=nounMarker?qspTextLiteral(hits,'#var_base',nounMarker):'';
 return text.replace(dislikeNounToken,(_token,_quote,copula)=>
  (noun||'사람')+(copula?(noun?'예요':'이에요'):''));
}

export function renderSpeakerLine(text,actor,name){
 const speech=speechPresentation(actor);
 const source=speech.style===3?String(text).replace(/(^|[.!?…]\s+)전 (?=아주 평범한 )/gu,'$1난 '):text;
 const line=previewVoice(actor)?previewSpeech(source,actor,speech):speech.style===3?plainSpeech(source):source;
 return shown(line,name).replace(/&nbsp;|&#160;|&#x0*a0;|\u00a0/giu,' ').trim();
}

export function selectPastBackground(field,actor,editable,preset){
 if(!editable)return ordinaryPrincess(actor)?preset?.(field,actor)??null:null;
 const authored=editable(field);
 if(authored?.text||(actor.source!=='random'&&actor.fixedSexTalk!==false))return authored;
 const text=actor._runtime?.strings?.[field+'_description'];
 return typeof text==='string'&&text.trim()?{text:text.replaceAll('<<$dynslave_name>>','<<$slave_name>>')}:authored;
}

export function pastPreviewPages(intro,actor,name,getBackground){
 const casual=speechPresentation(actor).style===3;
 const plain=ordinaryPrincess(actor)?plainPrincessPastSpeech:plainPastSpeech;
 const prefix=`[${name||'{이름}'}]\n`;
 const render=text=>{
  const line=shown(casual?plain(text):text,name).replace(/&nbsp;|&#160;/gi,' ').trim();
  return line.startsWith(prefix)?line.slice(prefix.length).trimStart():line;
 };
 const fields=Number(actor.age)===1?['world','family']:['world','family','occupation'];
 const background=getBackground?fields.map(field=>getBackground(field)?.text??''):[];
 return [intro??'',...background].map(render).filter(Boolean);
}

export async function loadLuminousMusicPreview(mode,base=''){
 if(!['normal','rough','soft','fearful','sad'].includes(mode))return '';
 const section="if $args[0]='luminous_music':";
 const state=`if $args[1]='${mode}': $result=`;
 const params=new URLSearchParams({q:`${section}|${state}`});
 const data=await call(`${base}/api/qsp/search?${params}`);
 const hits=data.hits.filter(row=>row.location==='jo9_character_dialogue');
 const anchor=hits.find(row=>row.text.trim()===section);
 if(!anchor)return '';
 const line=hits.find(row=>row.line>anchor.line&&row.line<=anchor.line+6&&row.text.trim().startsWith(state));
 const literal=line?.text.trim().slice(state.length).match(/^'((?:[^']|'')*)'\s*&\s*exit$/u);
 return literal?.[1].replaceAll("''", "'")??'';
}

export function selectReformPreview(data,question,speaker,settings){
 const profile=reformProfile(speaker),speech=speechPresentation(speaker);
 const lesson=profile==='luminous'||profile==='shiru'?'마법':profile?'붕대 감기':'';
 const output={profile,speech,lesson,text:'',type:'',note:''};
 const voice=previewVoice(speaker);
 if(voice==='julia'){
  if(Number(settings.master)!==10)return {...output,unavailable:true,note:'줄리아는 조니의 여동생이며, 바티칸 영입은 조니 전용입니다.'};
  if(settings.previewVersion==='work')return output;
 }
 const sample=voiceExamples[voice]?.[question];
 if(sample){
  if(!settings.responds)output.note='기존 조건에서 답변을 거절하는 상황입니다.';
  else{
   output.text=Array.isArray(sample)?sample[speech.style===3?0:1]:sample;
   if(speech.strict)output.text=previewSpeech(output.text,speaker,speech);
   output.type='편집기 말투 예문';
  }
  return output;
 }
 if(!data?.available){output.note='현재 WORK에서 개편 원고를 찾지 못했습니다.';return output;}
 if(!settings.responds){output.note='기존 조건에서 답변을 거절하는 상황입니다.';return output;}
 if(!profile)output.note='이 화자에게 연결된 개편 시안이 없습니다.';
 else if(speech.expression==='original')output.note='현재 상태에서는 기존 상태 전용 응답을 사용합니다.';
 else if(question==='1111'&&Number(speaker.age)===1){
  output.note='현재 외형 분류에서는 이 과거 시안이 표시되지 않습니다.';
 }else if(question==='1111'&&((profile==='mprincess'&&speaker.family!=='mprincess')||(['barbarian_princess','poor_wife'].includes(profile)&&speaker.family!=='barbarian_king'))){
  output.note='이 과거 시안의 출신 조건과 일치하지 않습니다.';
 }else if(question!=='1111'&&!settings.lesson){
  output.note=`이 시안은 ${lesson} 수업이 끝난 날의 답변입니다.`;
 }else if(question==='1114'&&(!settings.wish||(speech.strict&&ordinaryPrincess(speaker,profile)&&!(Number(speaker.nurse_affinity)>0)))){
  output.note='기존 희망사항에서 같은 주제가 선택되면 이 시안이 표시됩니다.';
 }else{
  const row=data.rows?.find(r=>String(r.question)===question&&r.profile===profile&&r.state===speech.expression);
  if(row){output.text=row.text;output.type='시안 원문';}
  else output.note='이 조건에 해당하는 시안 원문이 없습니다.';
 }
 if(!output.text&&speech.strict){
  output.text=data.strong?.[profile]??data.strong?.fallback??'';
  if(output.text)output.type='예의 강요 도입부';
 }
 return output;
}

export function renderPreviewLines(lines,result,question,speaker){
 const found=lines.filter(Boolean).map(line=>line.text);
 if(result?.type!=='예의 강요 도입부'||!found.length)return found;
 const strictPrincessWish=question==='1114'&&result.speech.strict&&ordinaryPrincess(speaker,result.profile);
 if(strictPrincessWish||!lines.some(line=>line?.authored))found[0]=result.text+' '+found[0];
 return found;
}

function mountReformPreview(body,o){
 const question=o.state.questionId;
 if(question==='sex')return;
 const canReform=reformQuestions.has(question);
 let settings=reformSettings.get(o.state);
 if(!settings){settings={actor:'current',addressee:'protagonist',responds:true,lesson:false,wish:false};reformSettings.set(o.state,settings);}
 const card=document.createElement('article');
 card.className='card';
 card.innerHTML=`<div class="card-head"><h2>${e(QUESTION_NAMES[question]||question)} · 대사 미리보기</h2></div><div class="card-body"><div class="st-row"><label>미리보기 화자<select data-reform-actor><option value="current">현재 캐릭터</option>${Object.entries(reformSpeakers).map(([key,value])=>`<option value="${key}">${e(value.name)}</option>`).join('')}</select></label>${canReform?'<label><input type="checkbox" data-reform-check="responds"> 기존 조건에서 답변 가능</label>':''}${canReform&&question!=='1111'?'<label><input type="checkbox" data-reform-check="lesson"> 당일 직접 수업 완료</label>':''}${question==='1114'?'<label><input type="checkbox" data-reform-check="wish"> 기존 희망에 수업 주제가 선택됨</label>':''}</div><p class="fine-print" data-reform-context></p><div class="gm"><div class="gm-left"><div class="gm-stage"><div class="gm-name" data-reform-name></div><div class="cv-meta" data-reform-meta></div></div><div class="gm-text" data-reform-text aria-live="polite"></div></div></div><p class="fine-print" data-reform-result></p></div>`;
 body.prepend(card);
 const get=key=>card.querySelector(`[data-reform-${key}]`);
 get('actor').closest('label').insertAdjacentHTML('afterend','<label data-reform-audience hidden>대화 상대<select data-reform-addressee><option value="protagonist">주인공</option><option value="other">다른 인물</option></select></label>');
 get('actor').closest('label').insertAdjacentHTML('afterend','<label data-reform-compare hidden>대사 버전<select data-reform-version><option value="draft">시안</option><option value="work">현재 WORK</option></select></label>');
 get('actor').value=settings.actor;
 get('addressee').value=settings.addressee;
 get('version').value=settings.previewVersion??'draft';
 for(const field of card.querySelectorAll('[data-reform-check]'))field.checked=settings[field.dataset.reformCheck];
 let data=null,error='',previewRun=0,page=0;
 async function refresh(){
  const run=++previewRun;
  const context=o.context(), current=context.speaker??{};
  const preset=reformSpeakers[settings.actor];
  const sameActor=!preset||(preset.id===Number(current.id??current.type)&&
   (preset.unique||(preset.occupation===current.occupation&&preset.family===current.family)));
  const currentPast=question==='1111'&&sameActor;
  const selected=preset&&!currentPast&&!(settings.actor==='julia'&&sameActor)?{moral:current.moral,psy_status:current.psy_status,humility_rule:current.humility_rule,age:0,unique:false,jo9_plain_tone:0,...preset}:current;
  const voice=previewVoice(selected);
  const speaker={...selected,addressee:voice==='julia'?settings.addressee:'protagonist'};
  const speech=speechPresentation(speaker);
  const isLuminous=reformProfile(speaker)==='luminous';
  const compareLuminous=isLuminous&&(canReform||['1113','1115','1116'].includes(question));
  const compare=voice==='julia'||compareLuminous||question==='1115'||speech.style===3;
  const useDraft=compare&&settings.previewVersion!=='work';
  const useLuminousDraft=compareLuminous&&useDraft;
  const variant=plainVoiceVariant(speaker,speech);
  const useStrongDraft=useDraft&&variant==='strong';
  const useFamiliarDraft=useDraft&&variant==='familiar';
  const juliaState=useFamiliarDraft&&voice==='julia'?JULIA_STATE_LABEL[speaker.psy_status]:'';
  const names=(!currentPast&&preset?.name)||context.name||'현재 캐릭터';
  const result=voice==='julia'||(canReform&&(!preset||data||voice))?
   selectReformPreview(data,question,speaker,{...settings,master:context.master}):null;
  get('audience').hidden=voice!=='julia';
  get('compare').hidden=!compare;
  for(const field of card.querySelectorAll('[data-reform-check]:not([data-reform-check="responds"])'))field.closest('label').hidden=Boolean(voice);
  get('name').textContent=names;
  get('meta').textContent=[PLAIN_STYLE_LABEL[variant]??reformHeightLabels[speech.style],juliaState||EXPRESSION_LABEL[speech.expression],speech.strict?'예의 강요':''].filter(Boolean).join(' · ');
  get('context').textContent=result?.lesson&&question!=='1111'&&!voice&&(!useLuminousDraft||settings.lesson)?`이 화자의 개편 시안 수업은 ${result.lesson}입니다.`:'';
  get('result').textContent='';
  const show=(lines,note='',labels=[])=>{
   if(!card.isConnected||run!==previewRun)return;
   const index=Math.min(page,Math.max(0,lines.length-1));
    const line=lines[index];
    const acted=line&&useDraft?revisePlainAction(line,speaker,speech):line;
    const displayed=acted&&useStrongDraft?renderStrongPreview(acted):acted;
    get('text').textContent=displayed||note;
   const nav=get('result');
    nav.textContent=lines.length?(line===acted?note:'행동지문 시안 · '+note):'';
   if(lines.length>1){
    const label=document.createElement('span');label.textContent=' '+(labels[index]?labels[index]+' · ':'')+(index+1)+' / '+lines.length+' ';
    const button=(step,text)=>{const el=document.createElement('button');el.type='button';el.className='button secondary';el.textContent=text;el.disabled=!lines[index+step];el.onclick=()=>{page=index+step;show(lines,note,labels);};return el;};
    nav.append(' ',button(-1,'이전'),label,button(1,'다음'));
   }
  };
  if(result?.unavailable){get('meta').textContent='영입 대상 아님';return show([],result.note);}
  if(canReform&&!settings.responds){
   const refusal=useStrongDraft?strongRefusalDraft(speaker,speech):useFamiliarDraft&&familiarRefusalDraft(speaker);
   return refusal?show([refusal],PLAIN_STYLE_LABEL[variant]+' 거절 시안'):show([],result?.note||'기존 조건에서 답변을 거절하는 상황입니다.');
  }
  if(question==='1111'){
   const draft=useLuminousDraft&&luminousPastDraft(speaker,speech);
   if(draft)return show(draft,'루미너스 과거 시안',['세계','출신','직업']);
   if(voice==='julia'&&speaker.addressee==='other')return result?.text?show([result.text],result.type):
    show([],'다른 인물에게 전하는 줄리아의 과거 원문은 등록되어 있지 않습니다.');
   if(!data&&!error&&!voice)return show([],'WORK 원문을 불러오는 중…');
   let background=field=>selectPastBackground(field,speaker,currentPast?o.background:null,o.presetBackground);
   let pastSpeaker=speaker;
   if(variant&&!currentPast){
    try{
     const {data:source}=await call('/api/char/'+Number(speaker.id??speaker.type));
     background=field=>({text:source['seed_'+field+'_description']??''});
     pastSpeaker={...speaker,age:source.seed_age};
    }catch(err){return show([],err.message);}
   }
   const juliaIntro=useFamiliarDraft&&juliaPastIntro(speaker);
   const intro=juliaIntro||result?.text;
   const lines=pastPreviewPages(intro,pastSpeaker,names,background);
   const hasBgPages=Boolean(background)&&lines.length>(intro?1:0);
   const note=juliaIntro?'줄리아 상태별 도입부와 배경 설정 원문':
    hasBgPages?(intro?'도입부와 배경 설정 원문':'배경 설정 원문'):result?.type;
   return show(lines,lines.length?note:error||result?.note||'배경을 지정하면 해당 대사가 표시됩니다.');
  }
  if(result?.text&&result.type!=='예의 강요 도입부'&&!(useFamiliarDraft&&result.type==='편집기 말투 예문')){
   const draft=useLuminousDraft&&strongCurrentDraft(question,speaker,{basedOnLesson:true});
   if(draft)return show([draft],'루미너스 수업 후 대사 시안');
   if(useFamiliarDraft){
    const mood=familiarCurrentDraft('1116',speaker);
    return show([plainSpeech(result.text)+' '+mood],'친반말투 수업 후 시안');
   }
   if(useStrongDraft&&result.type==='편집기 말투 예문'){
    const [,feeling]=STRONG_STATE[speaker.psy_status]??STRONG_STATE.docile;
    return show([plainSpeech(result.text)+' '+feeling],'강반말투 시안');
   }
   return show([speech.style===3?plainSpeech(result.text):result.text],result.type);
  }
  const saved=o.state.generalEdits?.[o.charKey()]?.[question];
  if(!preset&&saved&&!useStrongDraft&&!useFamiliarDraft)return show([renderSpeakerLine(saved,speaker,names)],'이 캐릭터의 편집 대사');
  const roles=simulatorPreviewRoles(question,speaker,{statePreview:!compare||settings.previewVersion!=='work'});
  if(!roles.length)return show([],'상대 인물과 관계 기록이 있어야 결과를 미리 볼 수 있습니다.');
  get('text').textContent='WORK 대사를 불러오는 중…';
  try{
   const loadRow=async role=>{
    const res=await call(endpoint+'/search?'+new URLSearchParams({question,source:'#txt_man',kind:'fragment',q:role,tone:String(speech.style),limit:'100'}));
    return selectSimulatorRow(res.rows,role,{...context,tone:speech.style});
   };
   const lines=await Promise.all(roles.map(async role=>{
    if(role.startsWith('preview_1116_'))return {text:simulatorMoodStateLine(role,speech.style),authored:true,draft:'상태별 기분 시안'};
    const compareRecognition=useDraft&&variant&&role==='fact_relation_docile_core';
    const original=compareRecognition?await loadRow(role):null;
    const recognition=compareRecognition&&recognitionDraft(original,speaker,speech);
    if(recognition)return {text:recognition,authored:true,draft:PLAIN_STYLE_LABEL[variant]+' 시안'};
    const draft=useStrongDraft?strongCurrentDraft(question,speaker,{role}):useFamiliarDraft&&familiarCurrentDraft(question,speaker,{role});
    if(draft)return {text:draft,authored:true,draft:PLAIN_STYLE_LABEL[variant]+' 시안'};
    const shared=useDraft&&(question==='1115'?sharedDislikeDraft(role,speaker,speech):
     question==='1114'?sharedNoWishDraft(role,speaker,speech):'');
    if(shared)return {text:shared,authored:true,draft:question==='1115'?'저항·증오 불만 시안':'반말 희망사항 시안'};
    if(role==='native_1114_music_like_core'&&Number(speaker.id??speaker.type)===3002){
     const text=await loadLuminousMusicPreview(speech.expression);
     if(text)return {text:renderSpeakerLine(text,speaker,names),authored:true};
    }
    const row=compareRecognition?original:await loadRow(role);
    const text=row?.text??(question==='1115'?await loadDislikeFallback(role,speaker.age):'');
    return text?{text:renderSpeakerLine(text,speaker,names)}:null;
   }));
    const found=renderPreviewLines(lines,result,question,speaker);
   const draft=lines.find(line=>line?.draft)?.draft;
   if(draft)return show(found,draft);
   return show(found,found.length?'현재 상태에 맞춘 WORK 대사 예시 · 세이브의 사건 기록은 적용되지 않습니다.':'이 상태에서 표시할 WORK 대사 예시가 없습니다.');
  }catch(err){return show([],err.message);}
 }
 card.addEventListener('change',ev=>{
  const field=ev.target;
  if(field.hasAttribute('data-reform-actor'))settings.actor=field.value;
  else if(field.hasAttribute('data-reform-addressee'))settings.addressee=field.value;
  else if(field.hasAttribute('data-reform-version'))settings.previewVersion=field.value;
  else if(field.dataset.reformCheck)settings[field.dataset.reformCheck]=field.checked;
  page=0;
  refresh();
 });
 refresh();
 if(canReform)fetchReform().then(value=>{if(card.isConnected){data=value;refresh();}}).catch(err=>{if(card.isConnected){error=err.message;refresh();}});
}

export function simulatorMenuHtml(){return `<div class="workspace-subnav workspace-sim-nav" data-workspace-parent="character" hidden><button class="nav-button" data-tab="character" data-sim-section="questions">질문하기</button><div class="workspace-subnav">${QUESTION_TABS.map(([q,label])=>`<button class="nav-button" data-tab="character" data-sim-question="${q}">${e(label)}</button>`).join('')}</div><button class="nav-button" data-tab="character" data-sim-section="records">경력·기록</button></div>`;}

export function createGeneralDbView(api){
 const id='general-dialogue-db';api.tabNames[id]=['게임 DB','일반 대사 DB','현재 WORK의 질문별 대사와 조립 메타데이터를 검색하고 원문을 편집합니다.'];
 const root=document.createElement('section');root.id=id;root.className='tab-panel general-db';root.hidden=true;document.querySelector('main footer').before(root);
 const st={meta:null,rows:[],total:0,offset:0,f:{q:'',question:'',type:'',relation:'',tone:'',kind:''},detail:null,draft:'',dirty:false,message:'',request:0};
 function detail(){const d=st.detail;const box=root.querySelector('[data-gdb-detail]');if(!box)return;
  box.innerHTML=!d?'<p class="fine-print">목록에서 대사를 고르세요.</p>':`<p class="fine-print"><code>${e(d.key)}</code><br>${e(metaText(d))}</p><details><summary>원문</summary><pre class="gdb-original">${e(d.text)}</pre></details><label class="st-story"><span class="section-label">공통 원문 편집</span><textarea data-gdb-text rows="9" maxlength="8000">${e(st.draft)}</textarea></label><p class="fine-print">저장하면 현재 WORK의 이 문장이 바뀝니다. 다른 대사와 조건은 유지하며 최초 백업·변경 기록을 남깁니다.</p><div class="st-row"><button class="button secondary" data-gdb-action="preview">변경 보기</button><button class="button" data-gdb-action="save" ${st.dirty?'':'disabled'}>WORK 원문 저장</button><button class="button secondary" data-gdb-action="use">시뮬레이터에서 사용</button></div><p data-gdb-message class="fine-print">${e(st.message)}</p>`;
 }
 function list(){const box=root.querySelector('[data-gdb-list]');if(!box)return;box.innerHTML=`<p class="fine-print">${st.total.toLocaleString('ko-KR')}개 · ${st.offset+1}~${Math.min(st.offset+st.rows.length,st.total)}</p><div class="gdb-rows">${st.rows.map((r,i)=>`<button class="gdb-row ${st.detail?.id===r.id?'on':''}" data-gdb-row="${i}"><strong>${e(QUESTION_NAMES[r.question]||r.question)}</strong><small>${e(r.key)}</small><span>${e(r.plain.slice(0,130))}</span></button>`).join('')||'<p class="fine-print">맞는 항목이 없습니다.</p>'}</div><div class="st-row"><button class="button secondary" data-gdb-page="-1" ${st.offset?'':'disabled'}>이전</button><button class="button secondary" data-gdb-page="1" ${st.offset+30<st.total?'':'disabled'}>다음</button></div>`;}
 function frame(){root.innerHTML=`<article class="card"><div class="card-head"><h2>대사 검색</h2><span class="badge muted">${st.meta.rows.toLocaleString('ko-KR')}개</span></div><div class="card-body"><p class="fine-print">과거 묻기의 기준은 배경 설정 DB입니다. 아래에는 게임 조립용 원문과 보충 문구도 함께 표시됩니다.</p><div class="st-row"><input data-gdb-filter="q" placeholder="대사·ID·의미 자리 검색" value="${e(st.f.q)}"><select data-gdb-filter="question">${options(Object.entries(st.meta.questions),st.f.question,'질문 전체')}</select><select data-gdb-filter="tone">${options([['1','말투 1 · 격식'],['2','말투 2 · 존대'],['3','말투 3 · 반말']],st.f.tone,'말투 전체')}</select></div><div class="st-row"><select data-gdb-filter="type">${options(st.meta.types.map(k=>[k,k]),st.f.type,'성격 전체')}</select><select data-gdb-filter="relation">${options(st.meta.relations.map(k=>[k,k]),st.f.relation,'관계 전체')}</select><select data-gdb-filter="kind">${options([['fragment','조립 문구'],['original','기존 기본 원문']],st.f.kind,'종류 전체')}</select><button class="button" data-gdb-action="search">검색</button><button class="button secondary" data-tab="backgrounds">배경 설정 DB</button></div></div></article><div class="gdb-columns"><article class="card"><div class="card-head"><h2>대사 목록</h2></div><div class="card-body" data-gdb-list></div></article><article class="card"><div class="card-head"><h2>원문·편집</h2></div><div class="card-body" data-gdb-detail></div></article></div>`;list();detail();}
 async function search(){const request=++st.request;try{const r=await call(endpoint+'/search?'+new URLSearchParams({...st.f,offset:st.offset,limit:30}));if(request!==st.request)return;st.rows=r.rows;st.total=r.total;list();}catch(err){root.querySelector('[data-gdb-list]').textContent=err.message;}}
 root.addEventListener('input',ev=>{const t=ev.target;if(t.dataset.gdbFilter!==undefined)st.f[t.dataset.gdbFilter]=t.value;if(t.hasAttribute('data-gdb-text')){st.draft=t.value;st.dirty=st.draft!==st.detail.text;root.querySelector('[data-gdb-action="save"]').disabled=!st.dirty;}});
 root.addEventListener('change',ev=>{if(ev.target.dataset.gdbFilter!==undefined)st.f[ev.target.dataset.gdbFilter]=ev.target.value;});
 root.addEventListener('click',async ev=>{const b=ev.target.closest('button');if(!b)return;
  if(b.dataset.gdbRow!==undefined){if(st.dirty&&!window.confirm('저장하지 않은 공통 문장을 버리고 다른 항목을 열까요?'))return;st.detail=st.rows[Number(b.dataset.gdbRow)];st.draft=st.detail.text;st.dirty=false;st.message='';list();detail();}
  if(b.dataset.gdbPage){st.offset=Math.max(0,st.offset+Number(b.dataset.gdbPage)*30);search();}
  const a=b.dataset.gdbAction;if(a==='search'){st.offset=0;return search();}
  if(a==='use'&&st.detail){const row={...st.detail,text:st.draft};if(!await api.switchTab('character'))return;const sim=globalThis.__jo9StudioApi?.charView;if(sim?.useGeneralRow)sim.useGeneralRow(row);return;}
  if((a==='preview'||a==='save')&&st.detail){const origin=st.detail.id,sent=st.draft,revision=st.detail.revision;try{const r=await call(endpoint+'/save',{id:origin,text:sent,revision,dryRun:a==='preview'});if(r.saved)search();if(st.detail?.id!==origin)return;st.message=r.saved?'저장했습니다.':r.changes.length?'이 문장 1개를 변경합니다.':'변경 없음';if(r.saved){st.detail=r.row;if(st.draft===sent)st.draft=r.row.text;st.dirty=st.draft!==r.row.text;}else if(st.draft!==sent)st.message='편집 내용이 바뀌었습니다. 다시 변경 보기를 눌러 주세요.';detail();}catch(err){if(st.detail?.id===origin){st.message=err.message;detail();}}}
 });
 let started=false;new MutationObserver(()=>{if(!root.hidden&&!started){started=true;call(endpoint+'/meta').then(m=>{st.meta=m;frame();search();}).catch(err=>{started=false;root.textContent=err.message;});}}).observe(root,{attributes:true,attributeFilter:['hidden']});
 return {root};
}

export function mountQuestionWorkspace(main,o){
 const grid=main.querySelector('.cv-grid');if(!grid)return;const cards=[...grid.children];if(cards.length<4)return;
 const state=o.state;state.workspaceSection??='questions';state.questionId??='1112';state.generalEdits??={};state.generalSources??={};
 const records=cards.slice(2,-1),sex=cards.at(-1);for(const card of [...records,sex])card.remove();
 sex.querySelector('h2').textContent='성경험 묻기 · 섹스토크';
 const section=document.createElement('section');section.className='cv-wide question-workspace';grid.append(section);
 const signal=()=>window.dispatchEvent(new CustomEvent('jo9-simulator-question'));
 const active=q=>state.questionId===q||(q==='1117'&&state.questionId==='1118');
 section.innerHTML=`<div class="st-tabs" aria-label="시뮬레이터 작업"><button data-q-section="questions" class="${state.workspaceSection==='questions'?'on':''}">질문하기</button><button data-q-section="records" class="${state.workspaceSection==='records'?'on':''}">경력·기록</button></div><div class="question-tabs st-tabs" aria-label="질문하기 하위 메뉴" ${state.workspaceSection==='questions'?'':'hidden'}>${QUESTION_TABS.map(([q,l])=>`<button data-q-id="${q}" class="${active(q)?'on':''}">${e(l)}</button>`).join('')}</div><div data-question-body></div>`;
 const body=section.querySelector('[data-question-body]');
 let startSearch;
 if(state.workspaceSection==='records'){body.className='cv-grid';body.append(...records);}
 else if(state.questionId==='sex')body.append(sex);
 else if(state.questionId==='1111'){
  body.innerHTML=`<article class="card"><div class="card-head"><h2>과거 묻기 · 배경 설정 DB</h2></div><div class="card-body"><p class="fine-print">캐릭터 배경 설정과 같은 원문을 사용합니다. 수정·저장하면 공통 배경 표시에도 반영됩니다.</p>${[['world','세계'],['family','출신'],['occupation','직업']].map(([k,label])=>{const b=o.background(k);return `<label class="st-story"><span class="section-label">${label} · ${e(b?.label||'미지정')}</span><textarea data-q-background="${k}" rows="4" maxlength="4000">${e(b?.text||'')}</textarea></label><button class="button secondary" data-q-bg-save="${k}">이 배경 저장</button>`;}).join('')}<p><button class="button secondary" data-tab="backgrounds">배경 설정 DB 열기</button></p></div></article>`;
  body.addEventListener('input',ev=>{if(ev.target.dataset.qBackground)o.setBackgroundDraft(ev.target.dataset.qBackground,ev.target.value);});
 }else{
  const q=state.questionId,c=o.context(),key=o.charKey(),edits=state.generalEdits[key]??={},sources=state.generalSources[key]??={};
  const displayDraft=text=>renderSpeakerLine(text,c.speaker,c.name);
  body.innerHTML=`<article class="card"><div class="card-head"><h2>${e(QUESTION_NAMES[q]||q)}</h2><button class="button secondary" data-tab="general-dialogue-db">일반 대사 DB 열기</button></div><div class="card-body">${q==='1117'||q==='1118'?`<div class="st-tabs"><button data-q-id="1117" class="${q==='1117'?'on':''}">조수에 대해 묻기</button><button data-q-id="1118" class="${q==='1118'?'on':''}">노예에 대해 묻기</button></div>`:''}<p class="fine-print">${e(c.name||'이름 없음')} · 성격 ${e(c.type)} · 관계 ${e(c.relation)} · 말투 ${e(c.tone)}<br>성격·관계·말투로 찾은 편집 후보입니다. 질문의 최종 발동·거절 조건은 게임에서 판정합니다.</p><div class="gdb-sim-columns"><div><div class="st-row"><label>후보 검색<input data-q-search placeholder="문장·ID 검색"></label><button class="button secondary" data-q-search-go>후보 찾기</button></div><div data-q-candidates>원문 후보를 읽는 중…</div></div><div><label class="st-story"><span class="section-label">이 캐릭터의 대사 편집</span><textarea data-q-text rows="10" maxlength="8000" placeholder="직접 쓰거나 왼쪽 후보를 선택하세요">${e(edits[q]??'')}</textarea></label><p class="fine-print" data-q-source>${e(sources[q]||'직접 작성')}</p><button class="button secondary" data-q-clear>이 질문의 개별 대사 지우기</button><p class="fine-print">편집 내용은 브라우저에 보관됩니다. 캐릭터 편집 → 대사집에서 결과를 담아 저장할 수 있습니다.</p><div class="gm"><div class="gm-left"><div class="gm-stage"><div class="gm-name">${e(c.name||'이름 없음')}</div></div><div class="gm-text" data-q-preview>${e(shown(edits[q]??'',c.name))}</div></div></div></div></div></div></article>`;
  body.querySelector('[data-q-preview]').textContent=displayDraft(edits[q]??'');
  const write=(text,source)=>{edits[q]=text;sources[q]=source||'직접 작성';o.save();if(body.querySelector('[data-q-text]').value!==text)body.querySelector('[data-q-text]').value=text;body.querySelector('[data-q-preview]').textContent=displayDraft(text);body.querySelector('[data-q-source]').textContent=sources[q];};
  let request=0,found=[];async function search(){const req=++request;const target=body.querySelector('[data-q-candidates]');try{const res=await call(endpoint+'/search?'+new URLSearchParams({question:q,type:c.type,relation:c.relation,tone:c.tone,kind:'fragment',q:body.querySelector('[data-q-search]').value,limit:30}));if(req!==request||!body.isConnected)return;found=res.rows;target.innerHTML=`<p class="fine-print">${res.total}개 후보 · 최대 30개 표시</p>`+found.map((r,i)=>`<button class="gdb-row" data-q-candidate="${i}" title="${e(metaText(r))}"><small>${e(r.key)}</small><span>${e(shown(r.text,c.name))}</span></button>`).join('');}catch(err){target.textContent=err.message;}}
  body.addEventListener('input',ev=>{if(ev.target.hasAttribute('data-q-text'))write(ev.target.value,sources[q]);});
  body.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;if(b.dataset.qCandidate!==undefined){const r=found[Number(b.dataset.qCandidate)];write(r.text,r.id);}if(b.hasAttribute('data-q-search-go'))search();if(b.hasAttribute('data-q-clear')){edits[q]='';delete sources[q];o.save();body.querySelector('[data-q-text]').value='';body.querySelector('[data-q-preview]').textContent='';body.querySelector('[data-q-source]').textContent='직접 작성';}});
  startSearch=search;
 }
 if(state.workspaceSection==='questions'&&state.questionId!=='sex'){
  const edit=document.createElement('details');
  const summary=document.createElement('summary');
  summary.className='section-label';
  summary.textContent=state.questionId==='1111'?'배경 설정 편집':'후보 검색·대사 편집';
  edit.append(summary,...body.children);
  body.append(edit);
  if(startSearch)edit.addEventListener('toggle',function loadCandidates(){
   if(!edit.open)return;
   edit.removeEventListener('toggle',loadCandidates);
   startSearch();
  });
  mountReformPreview(body,o);
 }
 section.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;if(b.dataset.qSection){state.workspaceSection=b.dataset.qSection;o.save();o.render();signal();}if(b.dataset.qId){state.workspaceSection='questions';state.questionId=b.dataset.qId;o.save();o.render();signal();}if(b.dataset.qBgSave){const k=b.dataset.qBgSave;o.saveBackground(k,body.querySelector(`[data-q-background="${k}"]`).value);}});
}
