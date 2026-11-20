// WORK defaults plus character rules that apply only to editor previews.
export const CASUAL_UNIQUE = [3002, 2610, 2620, 3010, 3021, 3023, 2621, 3012, 1448];
export const CASUAL_OCC = ['mprincess', 'barbarian_princess'];
const PLAIN_ACTORS = new Set(CASUAL_UNIQUE);
const PRINCESS_JOBS = new Set(CASUAL_OCC);
const FORMAL_JOBS = new Set(['maid','valertry','secretary','nun','policewoman','mind_contol','time_plice','jailer','academy','mech']);
const HOSTILE = new Set(['reluctant','arrogant','hateful','resistant','hysteric']);
const actorId = actor => Number(actor.id ?? actor.type) || 0;
const PREVIEW_VOICES = new Map([[2572,'felicity'],[2576,'julia'],[2574,'yasmin'],[8901,'olga']]);
export const previewVoice = (actor = {}) => PREVIEW_VOICES.get(actorId(actor)) ?? '';

// Ordinary ids follow the current WORK pool and its explicit unique exclusions.
export function ordinary(actor) {
 const id = actorId(actor);
 if (!id) return !actor.unique;
 return id !== 1448 && id !== 1450 && (
  (id >= 1 && id <= 247) || (id >= 1001 && id <= 1462) ||
  (id >= 2001 && id <= 2340) || (id >= 4000 && id <= 4727)
 );
}
export function speechRegister(actor = {}) {
 const voice=previewVoice(actor);
 if (voice==='felicity') return 3;
 if (voice==='julia') return actor.addressee==='protagonist'?3:2;
 if (voice==='yasmin'||voice==='olga') return 1;
 if (PLAIN_ACTORS.has(actorId(actor)) || Number(actor.jo9_plain_tone) > 0 ||
     (ordinary(actor) && PRINCESS_JOBS.has(actor.occupation))) return 3;
 return FORMAL_JOBS.has(actor.occupation) ? 1 : 2;
}
export function speechPresentation(actor = {}) {
 const style = speechRegister(actor);
 const voice=previewVoice(actor);
 if (voice==='yasmin'||voice==='olga') return {style,expression:voice==='yasmin'?'firm':'calm',strict:false};
 const strict = style === 3 && voice!=='julia' && Number(actor.humility_rule) === 1;
 const psy = actor.psy_status;
 const moral = Number(actor.moral) || 0;
 const hostile = HOSTILE.has(psy);
 let expression = 'normal';
 if (strict) expression = 'rough';
 else if (psy === 'frightened') expression = 'fearful';
 else if (psy === 'lachrymose') expression = 'sad';
 else if (psy === 'depresive' || psy === 'broken') expression = 'original';
 else if (moral <= 1 && hostile) expression = 'rough';
 else if (moral >= 3 && !hostile) expression = 'soft';
 return {style, expression, strict};
}
export function reformProfile(actor = {}) {
 if (actorId(actor) === 3002) return 'luminous';
 if (actorId(actor) === 1448) return 'shiru';
 if (!ordinary(actor)) return '';
 if (PRINCESS_JOBS.has(actor.occupation)) return actor.occupation;
 if (actor.occupation === 'poor_wife' && actor.family === 'barbarian_king' && speechRegister(actor) !== 3) return 'poor_wife';
 return '';
}
export const EXPRESSION_LABEL = {normal:'평소',rough:'거침',soft:'부드러움',fearful:'겁먹음',sad:'슬퍼함',original:'기존 상태 응답',firm:'단호함',calm:'담담함'};

const REFUSALS = {
 angst: ['말씀 드리고 싶어도… 기억이 안 납니다.', '말하고 싶어도… 기억이 안 나.'],
 spoil: ['몰라요, 말하기 싫어요. 흥~', '몰라, 말하기 싫어. 흥~'],
 rational: ['그런 은밀한 제 비밀에 대해서 대답할 의무는 없습니다.', '그런 은밀한 내 비밀까지 대답할 의무는 없어.']
};
const PREVIEW_REFUSALS={
 yasmin:{angst:'기억나지 않습니다. 그게 전부입니다.',spoil:'그 질문에는 답하지 않겠습니다.',rational:'제 사적인 일입니다. 답할 의무는 없습니다.'},
 olga:{angst:'기억이 나지 않습니다.',spoil:'그 이야기는 하고 싶지 않습니다.',rational:'그건 제 사적인 이야기입니다. 말씀드릴 의무는 없습니다.'}
};
export function interviewGate(state) {
 if (state.angst >= 3) return 'angst';
 if (state.spoil >= 3) return 'spoil';
 if (state.rational <= 2) return 'rational';
 return null;
}

// Only render common endings and self-reference in the preview. Quoted speakers are independent.
const ENDINGS = new Map(Object.entries({
 '주시겠어요':'줄래', '주실래요':'줄래', '주세요':'줘', '마세요':'마', '하세요':'해',
 '보세요':'봐', '계세요':'있어', '가세요':'가', '오세요':'와', '보십시오':'봐', '하십시오':'해',
 '아니에요':'아니야', '거예요':'거야', '이에요':'이야', '예요':'야', '에요':'야', '이요':'이야',
 '입니다':'이야', '입니까':'이야', '합니다':'해', '합니까':'해', '싶습니다':'싶어',
 '없습니다':'없어', '있습니다':'있어', '됩니다':'돼', '아녜요':'아니야', '인가요':'인가', '건가요':'건가', '나요':'나',
 '세요':'어', '죠':'지'
}));
const endings = new RegExp('('+[...ENDINGS.keys()].sort((a,b)=>b.length-a.length).join('|')+')(?=\\s*(?:[.!?…~,;:！？，]|$))','gu');
const pronouns = new Map(Object.entries({'저는':'나는','제가':'내가','저도':'나도','저를':'나를','저와':'나와','제게':'내게','저한테':'나한테','저에게':'나에게','제':'내'}));
const selfReference = /(^|[^\p{L}\p{N}_])(저는|제가|저도|저를|저와|제게|저한테|저에게|제(?=\s+[가-힣]))(?![\p{L}\p{N}_])/gu;
const clearShortSelf = /(^|[.!?…()]\s+)전(?=\s+(?:원래|아직|정말|이제|그냥|이미|사실)(?![가-힣]))/gu;
const replaceSelfReference=text=>text.replace(selfReference,(_,border,word)=>border+pronouns.get(word)).replace(clearShortSelf,'$1난');
const MASTER_FORMS={
 '주인님께서는':'마스터는', '주인님께서도':'마스터도', '주인님께서':'마스터가', '주인님께':'마스터한테',
 '주인님이랑':'마스터랑', '주인님이라':'마스터라', '주인님이야':'마스터야', '주인님이면':'마스터면',
 '주인님이나':'마스터나', '주인님이시잖아':'마스터잖아', '주인님이시니까':'마스터니까',
 '주인님이십니다':'마스터다', '주인님이시고':'마스터고', '주인님이시며':'마스터며', '주인님이신':'마스터인',
 '주인님이지':'마스터지', '주인님이죠':'마스터지', '주인님이고':'마스터고', '주인님이':'마스터가',
 '주인님은':'마스터는', '주인님과':'마스터와', '주인님을':'마스터를', '주인님으로':'마스터로', '주인님':'마스터'
};
const CASUAL_PHRASES = new Map(Object.entries({
 ...MASTER_FORMS,
 '들려 드리':'들려주', '보여 드리':'보여주', '해 드렸':'해 줬', '해 드리고':'해 주고',
 '드리고 싶':'주고 싶', '해 주셨':'해 줬', '해 주신':'해 준', '해 주실':'해 줄',
 '시키시는':'시키는', '부르시는':'부르는', '말씀하신':'말한', '말씀하시는':'말하는',
 '말씀대로':'말대로', '말씀에':'말에', '말씀은':'말은',
 '말씀을 드리':'말을 하', '말씀 드리':'말하', '말씀드리':'말하',
 '물어보셨':'물어봤', '있으셨':'있었', '벌을 내리셨':'벌을 내렸', ' 드렸':' 줬',
 '그러셨어':'그랬어', '알고 계시잖아':'알고 있잖아', '혼내신':'혼낸',
 '하셨':'했', '하시는':'하는', '하실':'할', '하시고':'하고', '하시면':'하면', '하시니':'하니',
 '드시는 걸':'먹는 걸', '쉬시게':'쉬게', '주셔서':'줘서', '두셔도':'둬도'
}));
function plainSentence(text) {
 for(const [before,after] of CASUAL_PHRASES)text=text.replaceAll(before,after);
 return plainEndings(replaceSelfReference(text));
}
function plainEndings(text) {
 return text
  .replace(endings,(_,ending)=>ENDINGS.get(ending))
  .replace(/([가-힣]+)(?:습니다)(?=\s*(?:[.!?…~,;:！？，]|$))/gu,'$1다')
  .replace(/([가-힣]+)(?:습니까)(?=\s*(?:[.!?…~,;:！？，]|$))/gu,'$1나')
  .replace(/([가-힣])니다(?=\s*(?:[.!?…~,;:！？，]|$))/gu,(match,word)=>{
   const index=word.charCodeAt(0)-0xAC00;
   return index%28===17 ? String.fromCharCode(word.charCodeAt(0)-17)+'다' : match;
  })
  .replace(/(?<!필|중|주|수|담|무|개|민|동|가)요(?=\s*(?:[.!?…~,;:！？，]|$))/gu,'');
}
function editSpeechOutsideQuotes(text,change) {
 return String(text ?? '').split(/(<<[^>]*>>|<[^>]+>|“[^”]*”|‘[^’]*’|"[^"]*"|'[^']*')/gu)
  .map((part,index) => index%2 ? part : change(part)).join('');
}
export const plainSpeech = text => editSpeechOutsideQuotes(text,plainSentence);
function plainPastPart(part) {
 for(const [before,after] of Object.entries(MASTER_FORMS))part=part.replaceAll(before,after);
 return replaceSelfReference(part);
}
export const plainPastSpeech = text => editSpeechOutsideQuotes(text,plainPastPart);
export const plainPrincessPastSpeech = text => editSpeechOutsideQuotes(text,part=>
 plainEndings(plainPastPart(part)
  .replace(/(^|[.!?…\n])((?:\s|&nbsp;|&#160;|&#x0*a0;)*)전(?=\s)(?!\s+세계)/giu,'$1$2난')
  .replace(/(^|[^\p{L}\p{N}_])저희(?=\s|는|가|도|의|를)/gu,'$1우리')));

const FORMAL_SELF={나는:'저는',내가:'제가',나도:'저도',나를:'저를',내게:'제게',내:'제'};
function formalSentence(text) {
 return text.replace(/(^|[.!?…]\s+)(나는|내가|나도|나를|내게|내)(?=\s)/gu,(_,border,word)=>border+FORMAL_SELF[word])
  .replace(/([가-힣]+)(?=\s*(?:[.!?…！？]|$))/gu,word=>{
   if (/(?:았|었|였|겠|했|알|있|없|않|되)지$/u.test(word)) return word.slice(0,-1)+'죠';
   if (!word.endsWith('다')||word.endsWith('니다')||word.length<2) return word;
   const stem=word.slice(0,-1), char=stem.at(-1).charCodeAt(0), final=(char-0xAC00)%28;
   if (final===0||final===4||final===8) {
    if (final===0&&!/(?:하|이|되|가|보|주|오|모르)$/u.test(stem)) return word;
    return stem.slice(0,-1)+String.fromCharCode(char-final+17)+'니다';
   }
   if (final===20||/(?:있|없|않|겠|같|좋|싶|맞|받|맡|읽|먹)$/u.test(stem)) return stem+'습니다';
   return word;
  });
}
const OPENINGS = {
 rough: ['제 말부터 들어 주십시오.','제 말부터 들어 주세요.','내 말부터 똑바로 들어.'],
 soft: ['차분히 이야기해 보지요.','천천히 이야기해 볼게요.','천천히 이야기해 볼게.'],
 fearful: ['…잠시만 기다려 주십시오.','…잠깐만 기다려 주세요.','…잠깐만 기다려 줘.'],
 sad: ['…오늘은 말을 잇기가 힘듭니다.','…오늘은 말이 잘 나오지 않네요.','…오늘은 말이 잘 나오지 않네.'],
 firm: ['분명히 말씀드리겠습니다.']
};
const STRONG = {luminous:'똑바로 듣도록 해라.',shiru:'잘 들어. 한 번만 말할 거야.',mprincess:'내 말을 끝까지 들어.',barbarian_princess:'잘 들어. 말 끊지 마.',felicity:'내 말을 끝까지 듣거라.'};
export function previewSpeech(text, actor = {}, presentation = speechPresentation(actor), refused = false) {
 if (!text?.trim()) return text ?? '';
 const {style, expression, strict} = presentation;
 const voice=previewVoice(actor);
 const body = style===3?plainSpeech(text):voice?editSpeechOutsideQuotes(text,formalSentence):text;
 if (refused && !strict && expression === 'soft') return body;
 const opening = strict ? (STRONG[voice||reformProfile(actor)] ?? '내 말을 똑바로 들어.') : OPENINGS[expression]?.[style-1];
 return opening ? opening+' '+body : body;
}
export function interviewRefusal(reason, actor = {}, presentation = speechPresentation(actor)) {
 const tailored=PREVIEW_REFUSALS[previewVoice(actor)]?.[reason];
 if(tailored)return tailored;
 const line = REFUSALS[reason]?.[presentation.style === 3 ? 1 : 0] ?? '';
 return previewSpeech(line,actor,presentation,true);
}
