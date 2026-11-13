// 캐릭터 시뮬레이터: 위는 게임에 보이는 캐릭터 정보·배경·과거 경험·필로우토크, 아래 고정 패널은 생성·입력·내부 설정을 맡는다
import {pastHistory,tierOf} from './past-history.mjs';
import {pastFacts,packFacts,firstTimeLine,SKILL_NAME} from './past-facts.mjs';
import {pillowTalk,voiceType,relationMode,speechStyle,TYPE_NAME,STYLE_NAME,MODE_NAME} from './pillow-talk.mjs';
import {loadSimData,esc as e,rng,getFormula,onFormulaChange} from './sim-data.mjs';
import {editedBackgroundText,validateBackgroundSettings,textKey} from './background-settings.mjs';

const KEY='jo9-character-v1';
const GRADE='FDCBAS';
const LV={
 base_beauty:['외모',['추함','평범함','귀여움','예쁨','아름다움','눈부심','절세의 미모']],
 base_exotic:['독특함',['평범함','색다름','신비로움','오묘함','이국적임','몽환적임','신화적임','완벽함']],
 style:['세련됨',['촌스러움','무난함','평범함','세련됨','근사함','우아함','아름다움','눈부심','품격있음']],
 temper:['성격',['무관심함','차가움','내성적임','수동적임','적극적임','열정적임']],
 pride:['태도',['개방적','솔직함','의존적','당당함','건방짐','오만함']],
 sensitivity:['감수성',['무정함','냉담함','둔감함','민감함','다감함','여림']],
 ego:['자아',['우유부단','겁쟁이','소심함','주관적','단호함','완고함']],
 stamina:['체력',['죽어감','쇠약함','평범함','건강함','강인함','근육질']],
 fat:['체형',['앙상한','모델 체형','날씬한','육감적인','통통한','비만']]
};
// 섹스토크 대화 조건(기획 6.1): 절망·응석·인식·헌신·두려움과 관계 상태
const TALK={moral:'헌신',angst:'절망',spoil:'응석',rational:'인식',fear:'두려움'};
const PSY={docile:'온순함',soft:'부드러움',optimistic:'낙관',obedient:'순종',servile:'비굴',horny:'발정',reluctant:'마지못함',arrogant:'오만',hateful:'증오',resistant:'저항',hysteric:'히스테리',lachrymose:'눈물',frightened:'겁먹음',depresive:'우울',broken:'무너짐'};
const STATE_WORDS={'처녀':['virginity',0],'비처녀':['virginity',2],'불임':['fertility',-1],'임신 가능':['fertility',0],'임신 중':['pregnant',1],'클론':['clone',1],'연령 0':['age',0],'연령 2':['age',2]};
// 섹스토크 주제(기획 6.1 헌신 등급표): [헌신, 칸 id, 이름, 원본 DB 주제 키들, 주인공 질문 선택지]
export const SLOTS=[
 [1,'first_time','첫 경험',['first_time'],'처음은 언제였는지 묻는다'],[1,'max_night','하룻밤 최다',['max_night'],'하룻밤에 가장 많이 한 게 몇 번인지 묻는다'],
 [2,'partners','상대 수',['partners'],'지금까지 몇 명과 했는지 묻는다'],[2,'odd_place','특이한 장소',['odd_place'],'가장 이상한 곳이 어디였는지 묻는다'],[2,'orgasm','오르가즘·분출',['orgasm','squirt'],'가 본 적이 있는지 묻는다'],
 [3,'finish','피니시·삼킴',['finish_pref','swallow'],'어디에 싸 주는 게 좋은지 묻는다'],[3,'signature','18번 기술',['signature'],'가장 자신 있는 기술을 묻는다'],[3,'dirty_talk','색드립',['dirty_talk'],'할 때 무슨 말을 하는지 묻는다'],[3,'anal','애널',['anal'],'뒤로도 해 봤는지 묻는다'],[3,'deepthroat','딥스로트',['deepthroat'],'목 깊이 넣어 봤는지 묻는다'],[3,'memorable_line','남자가 한 말',['memorable_line'],'남자가 했던 말 중 기억나는 걸 묻는다'],
 [4,'kink','자기 취향·흥분 포인트',['kink','turn_on'],'자기만의 취향을 묻는다'],[4,'worst_man','최악의 남자',['worst_man'],'최악이었던 남자를 묻는다'],[4,'best_man','최고의 남자',['best_man'],'최고였던 남자를 묻는다'],[4,'want','해 보고 싶은 것',['want'],'해 보고 싶은 걸 묻는다'],[4,'never','절대 싫은 것',['never'],'절대 싫은 걸 묻는다'],
 [5,'group','다인 경험',['group','max_day_people'],'여럿이서 해 봤는지 묻는다'],[5,'side_partner','애인·남편 외 상대',['side_partner'],'남편(애인) 말고 다른 남자가 있었는지 묻는다'],[5,'sm','SM',['sm'],'맞으면서 하는 건 어떤지 묻는다'],[5,'exhibition','노출',['exhibition'],'남들 앞에서 해 봤는지 묻는다'],[5,'xeno','이종 경험',[],'사람이 아닌 것과 해 본 적 있는지 묻는다'],[5,'fetish','변태 성욕·페티시',['kink'],'남들이 모르는 성벽이 있는지 묻는다']];
const TYPE_GROUP={flame:'hot',proud:'hot',frank:'hot',ice:'cold',calm:'cold',plain:'cold',meek:'soft',fragile:'soft',doll:'soft'};
const REL_GROUP={hopeful:'warm',duty:'warm',loyal:'warm',neutral:'warm',fearful:'low',bleak:'low',broken:'low',hostile:'hostile'};
const KINDS=[['world','세계'],['family','출신'],['occupation','직업경력']];
const hashSeed=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};

export async function createCharacterView(api){
 const D=await loadSimData();
 const get=async f=>{const r=await fetch('./data/'+f);if(!r.ok)throw new Error(f+'를 읽지 못했습니다.');return r.json();};
 const [CAT,FACTS,XENO,FIRST,IV,TRAITS,BG,BGD,REFS,ACQ]=await Promise.all(['background-categories.json','past-facts.json','xeno-talk-drafts.json','first-time-drafts.json','first-time-interviews.json','traits.json','backgrounds.json','background-drafts.json','interview-refs.json','acquisition-routes.json'].map(get));
 const RECORDS=[...BG.records,...BGD.records];
 const traitRows=TRAITS.rows.filter(r=>r.binding&&!r.binding.key.includes('['));
 const traitOn=(ch,r)=>{
  const b=r.binding;if(ch[b.key]===undefined)return false;
  // 정신 상태(sanity)는 생성 단계에서 0(미설정)이라 0이면 보이지 않는다
  if(b.key==='sanity'&&!Number(ch.sanity))return false;
  const v=Number(ch[b.key]);
  return b.op==='>'?v>b.threshold:b.op==='<'?v<b.threshold:b.op==='>='?v>=b.threshold:b.op==='range'?v>=b.min&&v<=b.max:v===b.threshold;
 };
 // 입력 사전: 특성 이름, 스킬·속성·대화 상태 이름, 상태 낱말
 const SKILL_BY_NAME=Object.fromEntries(Object.entries(SKILL_NAME).map(([k,n])=>[n,k]));
 const ATTR_BY_NAME=Object.fromEntries(Object.entries(LV).map(([k,[n]])=>[n,k]));
 const TALK_BY_NAME=Object.fromEntries(Object.entries(TALK).map(([k,n])=>[n,k]));
 const PSY_BY_NAME=Object.fromEntries(Object.entries(PSY).map(([k,n])=>[n,k]));
 const DICT=[...traitRows.map(r=>r.name),...Object.keys(STATE_WORDS),...Object.keys(PSY_BY_NAME).map(n=>'관계 '+n),...Object.keys(SKILL_BY_NAME).map(n=>n+' 0~5 또는 F~S'),...Object.keys(ATTR_BY_NAME).map(n=>n+' 숫자'),...Object.keys(TALK_BY_NAME).map(n=>n+' 숫자')];

 const blank=()=>({source:'new',name:'',type:'',world:'',family:'',occupation:'',age:0,virginity:2,fertility:0,pregnant:0,clone:0,worldVariant:null,unique:null});
 let st=null;try{st=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
 if(!st?.ch)st={ch:blank(),locks:{},seed:'1',acq:{},talk:{psy_status:'docile',moral:3,angst:0,spoil:0,rational:3,fear:0},overrides:{},owner:{},panel:'background',big:{},unknown:[],pt:1,draws:0};
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st));}catch{}};
 const ch=()=>st.ch;
 const id='character';
 api.tabNames[id]=['캐릭터 시뮬레이터','캐릭터 시뮬레이터','랜덤 노예를 뽑거나 유니크를 불러와 게임에 보일 정보와 필로우토크를 확인하세요.'];
 document.querySelector('.sidebar nav').insertAdjacentHTML('afterbegin',`<button data-tab="${id}" class="nav-button"><span>◆</span>캐릭터 시뮬레이터</button>`);
 document.querySelector('main footer').insertAdjacentHTML('beforebegin',`<section id="${id}" class="tab-panel cv" hidden><div class="cv-main"></div><div class="cv-dock"></div><input type="file" accept=".json,application/json" hidden id="cvUniqueFile"></section>`);
 const root=document.getElementById(id),main=root.querySelector('.cv-main'),dock=root.querySelector('.cv-dock');
 // 탭이 보일 때만 하단 패널을 띄운다
 new MutationObserver(()=>document.body.classList.toggle('cv-open',!root.hidden)).observe(root,{attributes:true,attributeFilter:['hidden']});

 const nameOf=(kind,v)=>D.name(kind,v);
 const catOf=(kind,v)=>CAT[kind].find(c=>c.members.includes(v));
 const stockForFormula=()=>({...ch(),...st.talk});
 function recordFor(kind){
  const c=ch();if(!c[kind])return null;
  const list=RECORDS.filter(r=>r.kind===kind&&r.id===c[kind]);if(!list.length)return null;
  if(kind!=='world')return list[0];
  return list.find(r=>r.variant===c.worldVariant)??list[0];
 }
 // 배경 대사: 유니크는 JSON 원문(수정본 우선), 랜덤은 배경 설정 목록의 대사(수정본 우선)
 function backgroundText(kind){
  const c=ch();
  if(c.unique){const u=c.unique;return {text:u.texts[kind]??'',original:u.original[kind]??'',edited:u.texts[kind]!==u.original[kind],label:'유니크 고정 설정',source:u.fileName};}
  const r=recordFor(kind);if(!r)return null;
  const cfg=api.getState().config;
  return {text:editedBackgroundText(cfg,r),original:r.text,edited:editedBackgroundText(cfg,r)!==r.text,label:`${r.label??nameOf(kind,r.id)} · ${r.id}`,source:r.source,record:r};
 }
 function saveBackgroundText(kind,value){
  const c=ch();
  if(c.unique){c.unique.texts[kind]=value;save();return;}
  const r=recordFor(kind);if(!r)return;
  const s=api.getState(),next=structuredClone(s.config);validateBackgroundSettings(next);
  if(value===r.text)delete next.backgroundSettings.texts[kind][textKey(r)];else next.backgroundSettings.texts[kind][textKey(r)]=value;
  validateBackgroundSettings(next);s.config=next;api.save();
 }

 // 현재 캐릭터의 과거 경험·사실·필로우토크
 function compute(){
  const c=ch(),f=getFormula(D.formula);
  if(!c.world&&!c.unique)return null;
  const s=stockForFormula(),r=pastHistory(s,f,'cv|'+st.seed);
  const ov=st.overrides;
  for(const k of ['intimacy','pregnancies','births'])if(ov[k]!==undefined&&ov[k]!=='')r[k]=Number(ov[k]);
  const fx=r.excluded?null:pastFacts(s,r,f,FACTS,'cv|'+st.seed,st.acq,IV);
  return {r,fx,f,s};
 }
 function talkGate(){
  const t=st.talk;
  if(t.angst>=3)return '말씀 드리고 싶어도… 기억이 안 납니다.';
  if(t.spoil>=3)return '몰라요, 말하기 싫어요. 흥~';
  if(t.rational<=2)return '그런 은밀한 제 비밀에 대해서 대답할 의무는 없습니다.';
  return null;
 }
 // 주제마다 이 노예가 참조할 원본 DB 대답(같은 노예·같은 시드면 언제나 같은 대답)
 function refFor(slot,fx,salt=''){
  if(slot==='first_time'&&fx?.fields.first_age_ref)return `${fx.fields.first_age_ref}.q02`;
  const keys=SLOTS.find(x=>x[1]===slot)[3];if(!keys.length)return null;
  const pool=keys.flatMap(k=>REFS.topics[k]??[]);if(!pool.length)return null;
  return pool[Math.floor(rng(hashSeed(`${st.seed}|${ch().type}|${ch().name}|ref|${slot}${salt}`))()*pool.length)];
 }
 const charKey=()=>`${ch().type}|${ch().name}|${st.seed}`;
 function refHtml(key){
  const r=REFS.rows[key];if(!r)return '';
  const url=REFS.urls[r.u],blocked=r.b.length?r.b.map(c=>`${c} ${REFS.blockNames[c]??''}`).join(', '):'';
  return `<details class="cv-ref"><summary>원본 DB <code>${e(key)}</code>${blocked?` <span class="badge muted" title="표시 불가 사유: ${e(blocked)}">표시 불가</span>`:''}</summary>
   <div class="cv-ref-body">${r.t===null?`<p class="fine-print"><span class="badge muted">클로드 정책준수</span> 이 대답은 원문을 싣지 않았습니다(${e(blocked)}). 원본 글의 Q${r.q}${r.o>1?` (${r.o}번째)`:''} 대답에서 확인하세요. 부분 키: ${r.p.map(e).join(', ')}</p>`:`<p class="cv-ref-text">${e(r.t)}</p>${r.m?'<p class="fine-print"><span class="badge muted">클로드 정책준수</span> * 부분은 가린 자리입니다. 원문은 원본 글에서 보세요.</p>':''}${blocked?`<p class="fine-print">게임 표시 불가: ${e(blocked)}</p>`:''}`}
   <a href="${e(url)}" target="_blank" rel="noopener">원본 글 열기 (Q${r.q})</a></div></details>`;
 }
 function generatedLines(cx){
  const {r,fx,s}=cx,c=ch(),out={};
  const rand=rng(hashSeed(st.seed+'|pt'+st.pt));
  const ty=voiceType(s),style=speechStyle(s.occupation),grp=TYPE_GROUP[ty],rel=REL_GROUP[relationMode(s)];
  if(fx?.fields.first_band==='teen')out.first_time={blocked:'B1 청소년기',text:'[이 대사는 표시 불가합니다.]'};
  else if(fx?.fields.first_band==='adult')out.first_time={text:FIRST.userAuthoredWorlds.includes(c.world)?'':firstTimeLine(FACTS,FIRST,fx.fields,grp,style,rand)??'',note:FIRST.userAuthoredWorlds.includes(c.world)?'이 세계는 사용자 작성 칸':''};
  const pt=pillowTalk(s,r,tierOf(cx.f,'occupation',s.occupation).name,rand,[]);if(pt)out.partners={text:pt.lines.join(' ')};
  if(fx&&fx.fields.xeno!=='none'){
   if(fx.blocked.xeno)out.xeno={blocked:fx.blocked.xeno,text:'[이 대사는 표시 불가합니다.]'};
   else{const cand=XENO.rows.filter(x=>x.case===fx.fields.xeno&&x.rels===rel&&(x.types===grp||x.types==='*'));out.xeno={text:cand.length?cand[Math.floor(rand()*cand.length)].text[style].replaceAll('{괴물}',FACTS.xeno.patrolScenes[st.acq?.scene]?.label??'괴물'):'',note:fx.fields.xeno==='patrol_warg'?'와그 대사는 사용자 작성 칸':''};}
  }else out.xeno={text:'',note:'이 노예는 이종 경험이 없습니다'};
  if(fx?.fields.home_animal)out.xeno={blocked:'B2 수간(살던 세상의 동물 경험)',text:'[이 대사는 표시 불가합니다.]'};
  return {out,ty,style};
 }
 // 거짓말(사용자 결정 2026-11-12 개정): 장악력 < 0이면 거짓말(게임의 '장악력 < 0 → 사육 감소'와 같은 선). 새로 만들지 않고 기존 답 중 오답(다른 표본 노예의 사실로 만든 답, 같은 주제의 다른 원본)을 가져온다. 이전 진실과의 모순은 따지지 않는다
 const lying=()=>(Number(st.talk.supermacy)||0)<0;
 function lieCx(cx){
  const R=rng(hashSeed(`${charKey()}|lie`)),row=D.rows[Math.floor(R()*D.rows.length)];
  const s={...row,...st.talk,jo9_voice_type:cx.s.jo9_voice_type,occupation:cx.s.occupation,temper:cx.s.temper,sensitivity:cx.s.sensitivity,ego:cx.s.ego,pride:cx.s.pride};
  const r=pastHistory(s,cx.f,'lie|'+st.seed),fx=r.excluded?null:pastFacts(s,r,cx.f,FACTS,'lie|'+st.seed,{},IV);
  return {r,fx,f:cx.f,s};
 }
 const PAGE=8;
 function pillowHtml(cx){
  if(!cx)return '<p class="muted-text">캐릭터를 뽑거나 불러오면 필로우토크가 나옵니다.</p>';
  const {r,s}=cx,c=ch();
  // [클로드 정책 거부] 제외 연령(공식 데이터 excludedAges)은 자동 대사·과거 경험을 만들지 않는다. 대사집에서 직접 쓰는 것은 막지 않는다
  if(r.excluded)return `<p class="muted-text">연령 코드 ${e(r.age??c.age)}은(는) 제외 연령(공식 데이터 excludedAges)이라 이 편집기가 자동으로 만들지 않습니다. 직접 쓰려면 캐릭터 편집 › 대사집을 쓰세요.</p>`;
  const gate=talkGate(),moral=Math.max(0,Math.min(5,Number(st.talk.moral)||0)),who=e(c.name||'이 노예');
  const open=gate?[]:SLOTS.filter(x=>x[0]<=moral),pages=Math.max(1,Math.ceil(open.length/PAGE)),page=Math.min(st.qpage??0,pages-1);
  const truth=generatedLines(cx),lie=lying()&&!gate?generatedLines(lieCx(cx)):null,edits=st.ptEdits?.[charKey()]??{};
  const slot=open.find(x=>x[1]===st.ask);
  let say='',editor='';
  if(gate)say=e(gate);
  else if(st.ask==='__end')say='<span class="gm-muted">(대화를 끝냈습니다)</span>';
  else if(!slot)say='<span class="gm-muted">(오른쪽에서 질문을 고르세요)</span>';
  else{
   const [lv,id,label]=slot,g=(lie??truth).out[id]??{text:''},tg=truth.out[id]??{text:''},edited=edits[id]!==undefined,text=edited?edits[id]:g.text;
   const ref=refFor(id,lie?null:cx.fx,lie?'|lie':''),truthRef=lie?refFor(id,cx.fx):null;
   say=text?e(text):'<span class="gm-muted">(대사 없음: 아래에서 원본을 보고 각색해 넣으세요)</span>';
   editor=`<div class="cv-slot"><div class="cv-slot-head"><b>${e(label)}</b> <small>헌신 ${lv}</small>${g.blocked?` <span class="badge muted" title="표시 불가 사유: ${e(g.blocked)}">표시 불가</span>`:''}${lie?` <span class="badge" title="장악력 ${st.talk.supermacy??0} < 0: 거짓말(다른 노예의 답). 진실: ${e(tg.text||'(대사 없음)')}${truthRef?' / 진실 원본 '+e(truthRef):''}">거짓말</span>`:''}${edited?' <span class="badge">수정됨</span>':''}${g.note?` <small class="fine-print">${e(g.note)}</small>`:''}</div>
    <textarea class="cv-slot-text" data-cv-pt="${id}" rows="3" placeholder="대사 없음: 원본을 보고 각색해 넣으세요" ${g.blocked?'readonly title="표시 불가 사유: '+e(g.blocked)+'"':''}>${e(text)}</textarea>
    <div class="cv-slot-foot">${edited?`<button class="text-button" data-cv-act="pt-reset" data-slot="${id}">생성 대사로 되돌리기</button>`:''}${ref?refHtml(ref):'<small class="fine-print">원본 DB 대응 문항 없음</small>'}</div></div>`;
  }
  const qs=open.slice(page*PAGE,page*PAGE+PAGE);
  return `<div class="gm"><div class="gm-left"><div class="gm-stage"><div class="gm-name">${who}</div><div class="cv-meta">${e(TYPE_NAME[truth.ty])} · ${e(MODE_NAME[relationMode(s)])} · ${e(STYLE_NAME[truth.style])} · 헌신 ${moral} · 두려움 ${st.talk.fear??0} · 장악력 ${st.talk.supermacy??0}${lying()&&!gate?' · <b class="gm-lie">거짓말 중</b>':''}</div></div>
    <div class="gm-say"><div class="gm-who">[${who}]</div><div>${say}</div></div></div>
   <div class="gm-side"><div class="gm-title">내 방</div><div class="gm-subtitle">섹스토크 중</div>
    <div class="gm-qs">${qs.map(([lv,id,,,q])=>`<button class="gm-q ${st.ask===id?'on':''}" data-cv-ask="${id}">${e(q)}</button>`).join('')}
     ${!gate&&open.length<SLOTS.length?`<div class="gm-muted">헌신이 오르면 질문 ${SLOTS.length-open.length}개가 더 열립니다.</div>`:''}</div>
    ${pages>1?`<div class="gm-pager"><button class="gm-link" data-cv-qpage="${page-1}" ${page===0?'disabled':''}>◀ 이전 질문</button> - <button class="gm-link" data-cv-qpage="${page+1}" ${page>=pages-1?'disabled':''}>다음 질문 ▶</button></div>`:''}
    <button class="gm-q gm-end" data-cv-ask="__end">대화를 끝낸다</button></div></div>
   ${editor}`;
 }

 // 영입 때 저장할 섹스토크 사실(초기값 시뮬레이터에서 옮김). 산출 과정은 마우스를 올리면 보인다
 function factsCard(cx){
  if(!cx?.fx)return '';
  const v=cx.fx.fields,L=(g,k)=>FACTS[g]?.labels?.[k]??k,trace=[...cx.r.trace,...cx.fx.trace].join('\n');
  const rows=[['이종 경험',L('xeno',v.xeno),cx.fx.blocked.xeno],['살던 세상의 동물 경험',v.home_animal?'있음':'없음',v.home_animal?'B2 수간':''],['페티시',v.fetish.length?v.fetish.map(k=>FACTS.fetish.candidates.find(c=>c.key===k)?.name??k).join(', '):'없음'],
   ['첫 경험',v.first_band==='teen'?'청소년기':v.first_band==='adult'?`성인 이후 · ${v.first_age}세`:'없음',v.first_band==='teen'?'B1 청소년기':''],
   ...(v.first_band==='none'?[]:[['첫 상대 · 방식 · 장소',`${L('firstWho',v.first_who)} · ${L('firstHow',v.first_how)} · ${L('firstWhere',v.first_where)}`],['상대 수 · 하룻밤 최다',`${v.partners}명 · ${v.max_night}회`],['다인 경험 · 하루 최다',`${L('group',v.group)} · ${v.max_day_people}명`],['오르가즘 · 분출',`${L('orgasm',v.orgasm)} · ${v.squirt?'있음':'없음'}`],['피니시 · 삼킴',`${L('finish',v.finish)} · ${v.swallow?'삼킴':'뱉음'}`],['18번 기술',SKILL_NAME[v.signature]??'없음'],['절대 싫은 것 · 해 보고 싶은 것',`${v.never?L('actLabels',v.never):'없음'} · ${v.want?L('actLabels',v.want):'없음'}`]])];
  return `<article class="card"><div class="card-head"><h2><span class="index">04</span>저장할 섹스토크 사실</h2><span class="badge muted cv-tip" title="${e(trace)}">산출 과정 ⓘ</span></div><div class="card-body"><table class="cv-info"><tbody>${rows.map(([a,b,blk])=>`<tr><td>${e(a)}</td><td>${e(b)}${blk?` <span class="badge muted" title="표시 불가 사유: ${e(blk)}">표시 불가</span>`:''}</td></tr>`).join('')}</tbody></table><div class="fine-print cv-tip" title="${e(packFacts(v))}">저장 문자열 ${new TextEncoder().encode(packFacts(v)).length}바이트 ⓘ</div></div></article>`;
 }

 // ── 위: 게임에 보이는 정보 ──
 function renderMain(){
  const c=ch(),cx=compute();
  // 유니크도 세계·출신·직업을 정하면 그 값을 보여 준다(사용자 지시 2026-11-12). 정하지 않았으면 '유니크 고정 설정(분류 없음)'
  const bgLine=kind=>{if(c.unique&&!c[kind])return '유니크 고정 설정(분류 없음)';if(!c[kind])return '—';const cat=catOf(kind,c[kind]);return `${cat?e(cat.label)+' › ':''}${e(nameOf(kind,c[kind]))}`;};
  const traits=traitRows.filter(r=>r.category!=='상태'&&traitOn(c,r)),states=traitRows.filter(r=>r.category==='상태'&&traitOn(c,r));
  const skills=Object.entries(SKILL_NAME).filter(([k])=>Number(c[k]??0)>0);
  const attrs=Object.entries(LV).filter(([k])=>c[k]!==undefined);
  const r=cx?.r,fx=cx?.fx?.fields;
  main.innerHTML=`<div class="cv-grid">
  <article class="card"><div class="card-head"><h2><span class="index">01</span>${e(c.name||'이름 없음')}</h2><span class="badge ${c.source==='unique'?'blue':c.source==='random'?'green':'muted'}">${{unique:'유니크',random:'랜덤 생성',new:'새로 만들기'}[c.source]}</span></div><div class="card-body">
   <table class="cv-info"><tbody>
    <tr><td>캐릭터 ID</td><td>${e(c.type||'—')}</td></tr>
    ${KINDS.map(([k,l])=>`<tr><td>${l}</td><td>${bgLine(k)}</td></tr>`).join('')}
    <tr><td>연령 · 처녀</td><td>${e(c.age)} · ${c.virginity>1?'비처녀':'처녀'}${c.fertility<0?' · 불임':''}${c.pregnant>0?' · 임신 중':''}${c.clone?' · 클론':''}</td></tr>
    ${attrs.length?`<tr><td>기본 속성</td><td>${attrs.map(([k,[n,lv]])=>`${n} ${e(lv[c[k]]??c[k])}`).join(' · ')}</td></tr>`:''}
   </tbody></table>
   <div class="section-label">특성 ${traits.length}개</div><div class="tag-list">${traits.map(t=>`<button class="tag" data-cv-trait-off="${e(t.id)}" title="${e(t.description)}">${e(t.name)} ×</button>`).join('')||'<span class="fine-print">없음</span>'}</div>
   ${states.length?`<div class="section-label">상태</div><div class="tag-list">${states.map(t=>`<button class="tag" data-cv-trait-off="${e(t.id)}" title="${e(t.description)}">${e(t.name)} ×</button>`).join('')}</div>`:''}
   <div class="section-label">성 기술</div><div class="cv-skills">${skills.map(([k,n])=>`<span>${e(n)} <b>${GRADE[Math.min(5,c[k])]}</b></span>`).join('')||'<span class="fine-print">모두 F</span>'}</div>
  </div></article>
  <article class="card"><div class="card-head"><h2><span class="index">02</span>배경</h2><span class="badge muted">고정한 항목은 랜덤 생성 때 유지</span></div><div class="card-body cv-bg">${KINDS.map(([k,l])=>{const b=backgroundText(k);return `<section class="cv-bg-row"><div class="cv-bg-head"><div><div class="section-label">${l}${b?' · '+e(b.label):''}</div><small class="source-line">${e(b?.source??'')}</small></div><label class="cv-lock"><input type="checkbox" data-cv-lock="${k}" ${st.locks[k]?'checked':''} ${c.unique?'disabled':''}> 고정</label></div>
    ${b?`<textarea data-cv-text="${k}" maxlength="4000">${e(b.text)}</textarea><div class="cv-bg-actions">${b.edited?'<span class="badge">수정됨</span>':''}<button class="button secondary" data-cv-act="text-save" data-kind="${k}">저장하기</button><button class="button secondary" data-cv-act="text-restore" data-kind="${k}" ${b.edited?'':'disabled'}>복원</button><span class="fine-print">저장하면 같은 항목의 모든 조합에 적용 · {이름}은 이름 자리표시자</span></div>`:'<p class="fine-print">아래 패널에서 고르세요.</p>'}</section>`;}).join('')}</div></article>
  <article class="card"><div class="card-head"><h2><span class="index">03</span>영입 전 과거 경험</h2>${Object.values(st.overrides).some(v=>v!==undefined&&v!=='')?'<span class="badge blue">직접 지정 포함</span>':''}</div><div class="card-body">
   ${!r?'<p class="muted-text">캐릭터를 뽑거나 불러오세요.</p>':r.excluded?'<p class="muted-text">제외 연령(공식 데이터 excludedAges)이라 과거 경험을 자동 계산하지 않습니다.</p>':`<div class="result-summary">
    <div class="summary-tile featured"><span class="summary-label">성경험 총횟수</span><span class="summary-value">${r.intimacy}<small>회</small></span></div>
    <div class="summary-tile"><span class="summary-label">질 · 구강 · 애널</span><span class="summary-value sim-small">${r.acts?`${r.acts.vaginal} · ${r.acts.oral} · ${r.acts.anal}`:'—'}</span></div>
    <div class="summary-tile"><span class="summary-label">상대 수</span><span class="summary-value sim-small">${fx?.partners??0}명</span></div>
    <div class="summary-tile"><span class="summary-label">임신 · 출산</span><span class="summary-value sim-small">${r.pregnancies===null?'미상':`${r.pregnancies} · ${r.births}`}</span></div>
    <div class="summary-tile"><span class="summary-label">첫 경험</span><span class="summary-value sim-small">${fx?.first_band==='adult'?fx.first_age+'세':fx?.first_band==='teen'?'표시 불가':'없음'}</span></div>
   </div>`}
   <div class="section-label">소속 이후 누적 기록</div><div class="cv-skills">${[['income','수익'],['pregnancies','임신'],['births','출산'],['abortions','낙태'],['children','자녀']].map(([k,l])=>`<span>${l} <b>${e(st.owner[k]??0)}</b></span>`).join('')}</div>
  </div></article>
  ${factsCard(cx)}
  <article class="card cv-wide"><div class="card-head"><h2><span class="index">05</span>필로우토크 (게임 화면)</h2><button class="button secondary" data-cv-act="pt-again">다른 대사 뽑기</button></div><div class="card-body">${pillowHtml(cx)}</div></article>
  </div>`;
 }

 // ── 아래 고정 패널: 생성·입력·내부 설정 ──
 const PANELS=[['background','배경 선택'],['input','특성·스킬 입력'],['internal','대화 상태·내부 설정'],['json','JSON 편집']];
 function pickerHtml(kind,label){
  const c=ch(),sel={world:c.world,family:c.family,occupation:c.occupation};
  // 위에서 아래로 고른다: 세계는 언제나 전부, 출신은 고른 세계에 연결된 것, 직업은 고른 세계·출신에 연결된 것
  const upper=kind==='world'?{}:kind==='family'?{world:sel.world}:{world:sel.world,family:sel.family};
  const allowed=new Set(D.optionsV2(kind,upper)); // 확정 연결표 v2(신규 ID 포함)
  const groups=CAT[kind];const open=st.big[kind]??catOf(kind,c[kind])?.id??null;
  const g=groups.find(x=>x.id===open);
  return `<div class="cv-pick"><div class="cv-pick-label">${label}${c[kind]?` <b>${e(nameOf(kind,c[kind]))}</b>`:''}</div>
   <div class="cv-chips">${groups.map(x=>{const n=x.members.filter(m=>allowed.has(m)).length;return `<button class="cv-chip ${x.id===open?'on':''}" data-cv-big="${kind}:${x.id}" ${n?'':'disabled'}>${e(x.label)} <small>${n}</small></button>`;}).join('')}</div>
   ${g?`<div class="cv-chips sub">${g.members.map(m=>`<button class="cv-chip ${c[kind]===m?'on':''}" data-cv-set="${kind}:${m}" ${allowed.has(m)?'':'disabled'}>${e(nameOf(kind,m))}</button>`).join('')}</div>`:''}</div>`;
 }
 function panelBody(){
  const c=ch(),cx=compute();
  if(st.panel==='background')return `${c.unique?'<p class="fine-print">유니크는 고정 설정을 씁니다. 과거 경험 계산용으로 세계·출신·직업을 고를 수 있습니다.</p>':''}
   ${pickerHtml('world','세계')}${pickerHtml('family','출신')}${pickerHtml('occupation','직업')}
   <div class="cv-pick"><div class="cv-pick-label">연령 코드</div><div class="cv-chips">${[0,1,2].map(a=>`<button class="cv-chip ${c.age===a?'on':''}" data-cv-age="${a}">${a}${getFormula(D.formula).excludedAges.includes(a)?' (자동 계산 제외)':''}</button>`).join('')}<span class="fine-print">연령 코드 0 젊음 · 1 소녀 · 2 원숙. 자동 계산 제외 연령은 공식 데이터 excludedAges로 정합니다.</span></div></div>`;
  if(st.panel==='input')return `<p class="fine-print">게임 용어를 그대로 입력하세요. 쉼표로 여러 개를 한 번에 넣을 수 있습니다. 예: <code>겁쟁이, 펠라 4, 애널 B, 외모 3, 처녀, 헌신 4, 관계 순종</code></p>
   <div class="cv-input-row"><input id="cvTerm" list="cvDict" placeholder="특성·스킬·속성·상태 입력 후 Enter" autocomplete="off"><button class="button primary" data-cv-act="term">입력</button></div>
   <datalist id="cvDict">${DICT.map(x=>`<option value="${e(x.replace(/ (0~5 또는 F~S|숫자)$/,' '))}">${e(x)}</option>`).join('')}</datalist>
   ${st.unknown.length?`<div class="warning">모르는 용어(넣지 않음): ${st.unknown.map(e).join(', ')}</div>`:''}
   <p class="fine-print">특성을 지우려면 위 캐릭터 카드의 특성 버튼(×)을 누르세요.</p>`;
  if(st.panel==='internal'){
   const t=st.talk,num=(k,v,attrs='')=>`<input type="number" data-cv-num="${k}" value="${e(v??'')}" ${attrs}>`;
   return `<div class="cv-form">
    <label>관계 상태<select data-cv-psy>${Object.entries(PSY).map(([k,n])=>`<option value="${k}" ${t.psy_status===k?'selected':''}>${n}</option>`).join('')}</select></label>
    ${Object.entries(TALK).map(([k,n])=>`<label>${n} 등급${num('talk.'+k,t[k],'min="0" max="5" step="1"')}</label>`).join('')}
    <label title="0 미만이면 섹스토크에서 거짓말">이 노예에 대한 장악력${num('talk.supermacy',t.supermacy??0,'min="-30" max="30" step="1"')}</label>
    <label>말하기 유형(유니크 지정)<select data-cv-voice><option value="">성격으로 계산</option>${Object.entries(TYPE_NAME).map(([k,n])=>`<option value="${k}" ${c.jo9_voice_type===k?'selected':''}>${n}</option>`).join('')}</select></label>
    <label>고정 난수 시드<input data-cv-seed value="${e(st.seed)}" maxlength="40"></label>
    <label title="게임 안에서 노예를 얻는 경로(acquisition-routes.json). ★ = 다른 세상에서 바로 넘어온 상태">영입 경로<select data-cv-route>${ACQ.groups.map(g=>`<optgroup label="${e(g.label)}">${g.routes.map(r=>`<option value="${r.key}" title="${e(r.source)}" ${(st.acq.route??'other')===r.key?'selected':''}>${e(r.label)}${r.fresh?' ★':''}</option>`).join('')}</optgroup>`).join('')}</select></label>
    ${st.acq.route==='event'?`<label>이벤트<select data-cv-event><option value="">선택</option>${ACQ.events.map(v=>`<option value="${v.key}" title="${e(v.source)}" ${st.acq.event===v.key?'selected':''}>${e(v.label)}</option>`).join('')}</select></label>`:''}
    ${st.acq.route==='patrol'?`<label>순찰 장면<select data-cv-scene><option value="">선택</option>${Object.entries(FACTS.xeno.patrolScenes).map(([k,v])=>`<option value="${k}" ${st.acq.scene===k?'selected':''}>${k} ${e(v.label)}</option>`).join('')}</select></label>`:''}
   </div>
   <div class="section-label">과거 경력 값 직접 지정 (빈칸 = 공식)</div><div class="cv-form">${[['intimacy','성경험 총횟수'],['pregnancies','임신'],['births','출산']].map(([k,l])=>`<label>${l}${num('overrides.'+k,st.overrides[k],'min="0" step="1" placeholder="공식"')}</label>`).join('')}</div>
   <div class="section-label">소속 이후 누적 기록</div><div class="cv-form">${[['income','수익'],['pregnancies','임신'],['births','출산'],['abortions','낙태'],['children','자녀']].map(([k,l])=>`<label>${l}${num('owner.'+k,st.owner[k],'min="0" step="1"')}</label>`).join('')}</div>
   <p class="fine-print">공식 계수는 "산식 계수" 탭에서 바꿉니다(이 브라우저에 저장, 여기에도 바로 적용). 전투 관련 항목은 이 패널에서 뺐습니다.</p>`;
  }
  return `<p class="fine-print">현재 캐릭터를 캐릭터 JSON(seed_ 키) 형식으로 보여 줍니다. 고친 뒤 [적용]을 누르면 캐릭터에 반영됩니다.</p>
   <textarea id="cvJson" class="cv-json">${e(JSON.stringify(toJson(),null,1))}</textarea>
   <div class="cv-bg-actions"><button class="button primary" data-cv-act="json-apply">적용</button><button class="button secondary" data-cv-act="json-download">↓ JSON 저장</button></div>`;
 }
 function renderDock(){
  dock.innerHTML=`<div class="cv-dock-head"><div class="cv-actions"><button class="button secondary" data-cv-act="new">새로 만들기</button><button class="button primary" data-cv-act="random">⚄ 랜덤 생성하기</button><button class="button secondary" data-cv-act="unique">↑ 유니크 불러오기</button><button class="button secondary" data-cv-act="panel" data-panel="json">{ } JSON 편집</button></div>
   <div class="cv-tabs">${PANELS.map(([k,l])=>`<button class="cv-tab ${st.panel===k?'on':''}" data-cv-act="panel" data-panel="${k}">${l}</button>`).join('')}<button class="cv-tab" data-cv-act="fold">${st.folded?'▲ 펼치기':'▼ 접기'}</button></div></div>
   <div class="cv-dock-body" ${st.folded?'hidden':''}>${panelBody()}</div>`;
  root.classList.toggle('cv-folded',!!st.folded);
 }
 function render(){renderMain();renderDock();}

 // 캐릭터 JSON(seed_ 키)으로 내보내기·불러오기
 const SEED_KEYS=()=>[...new Set(['age','virginity','fertility','pregnant','clone',...Object.keys(LV),...Object.keys(SKILL_NAME),...traitRows.map(r=>r.binding.key)])];
 function toJson(){
  const c=ch(),out={seed_name:c.name};
  if(c.type!=='')out.jo9_type=c.type;
  for(const k of ['world','family','occupation'])if(c[k])out['jo9_'+k]=c[k];
  for(const k of SEED_KEYS())if(c[k]!==undefined)out['seed_'+k]=c[k];
  if(c.jo9_voice_type)out.seed_jo9_voice_type=c.jo9_voice_type;
  if(c.unique)for(const [k]of KINDS)out[`seed_${k}_description`]=c.unique.texts[k];
  return out;
 }
 function fromJson(d,fileName){
  const c=blank(),num=fileName?.match(/^(\d+)/)?.[1];
  c.name=String(d.seed_name??d.name??'');c.type=d.jo9_type??num??'';
  for(const k of ['world','family','occupation'])if(d['jo9_'+k])c[k]=d['jo9_'+k];
  for(const k of SEED_KEYS())if(typeof d['seed_'+k]==='number')c[k]=d['seed_'+k];
  // 유니크 JSON은 기본 외모·독특함을 seed_beauty·seed_exotic으로 둔다
  if(c.base_beauty===undefined&&typeof d.seed_beauty==='number')c.base_beauty=d.seed_beauty;
  if(c.base_exotic===undefined&&typeof d.seed_exotic==='number')c.base_exotic=d.seed_exotic;
  if(typeof d.seed_jo9_voice_type==='string')c.jo9_voice_type=d.seed_jo9_voice_type;
  const texts={};for(const [k]of KINDS)if(typeof d[`seed_${k}_description`]==='string')texts[k]=d[`seed_${k}_description`];
  if(Object.keys(texts).length){c.unique={fileName:fileName??'',texts:{...texts},original:{...texts}};c.source='unique';}
  else c.source=fileName?'unique':'new';
  return c;
 }

 function randomCharacter(){
  const c=ch(),lock=st.locks;
  const pool=D.rows.filter(r=>KINDS.every(([k])=>!lock[k]||!c[k]||r[k]===c[k]));
  if(!pool.length){api.toast('고정한 배경 조합에 맞는 표본이 없습니다. 고정을 풀어 보세요.');return;}
  st.draws=(st.draws??0)+1;const R=rng(Date.now()^st.draws),row=pool[Math.floor(R()*pool.length)];
  const variants=RECORDS.filter(r=>r.kind==='world'&&r.id===row.world).map(r=>r.variant);
  st.ch={...blank(),...row,source:'random',name:row.name??'',type:String(row.type??''),worldVariant:variants.length?variants[Math.floor(R()*variants.length)]:null};
  st.seed=String(st.draws);st.overrides={};st.pt=1;
  if(!row.name)api.toast('이 표본에는 이름이 없습니다(이름 포함 표본으로 다시 만들어야 합니다).');
 }
 function applyTerms(raw){
  const c=ch(),unknown=[];
  for(const tok of raw.split(/[,，]/).map(s=>s.trim()).filter(Boolean)){
   const trait=traitRows.find(r=>r.name===tok);
   if(trait){
    // 같은 키의 다른 특성은 함께 바뀐다(한 키에 한 값)
    c[trait.binding.key]=trait.binding.setValue;continue;
   }
   if(STATE_WORDS[tok]){const [k,v]=STATE_WORDS[tok];c[k]=v;continue;}
   const rel=tok.match(/^관계\s+(.+)$/);if(rel&&PSY_BY_NAME[rel[1]]){st.talk.psy_status=PSY_BY_NAME[rel[1]];continue;}
   const m=tok.match(/^(.+?)\s*([0-9]+|[FDCBASfdcbas])$/);
   if(m){
    const name=m[1].trim(),raw=m[2].toUpperCase(),v=/\d/.test(raw)?Number(raw):GRADE.indexOf(raw);
    if(SKILL_BY_NAME[name]&&v>=0&&v<=5){c[SKILL_BY_NAME[name]]=v;continue;}
    if(ATTR_BY_NAME[name]){const k=ATTR_BY_NAME[name];if(v>=0&&v<LV[k][1].length){c[k]=v;continue;}}
    if(TALK_BY_NAME[name]&&v>=0&&v<=5){st.talk[TALK_BY_NAME[name]]=v;continue;}
   }
   unknown.push(tok);
  }
  st.unknown=unknown;
 }

 root.addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;
  if(b.dataset.cvTraitOff){const t=traitRows.find(r=>r.id===b.dataset.cvTraitOff);if(t){ch()[t.binding.key]=0;}save();render();return;}
  if(b.dataset.cvBig){const [k,g]=b.dataset.cvBig.split(':');st.big[k]=st.big[k]===g?null:g;save();renderDock();return;}
  if(b.dataset.cvSet){const [k,v]=b.dataset.cvSet.split(':');const c=ch();c[k]=c[k]===v?'':v;const sel={world:c.world,family:c.family,occupation:c.occupation};D.pruneV2(sel,k);Object.assign(c,sel);if(k==='world'){const vs=RECORDS.filter(r=>r.kind==='world'&&r.id===c.world);c.worldVariant=vs[0]?.variant??null;}if(c.source==='new'&&!c.name)c.name='';save();render();return;}
  if(b.dataset.cvAsk){st.ask=b.dataset.cvAsk;save();renderMain();return;}
  if(b.dataset.cvQpage!==undefined){st.qpage=Math.max(0,Number(b.dataset.cvQpage));save();renderMain();return;}
  if(b.dataset.cvAge!==undefined){ch().age=Number(b.dataset.cvAge);save();render();return;}
  const a=b.dataset.cvAct;if(!a)return;
  if(a==='new'){api.confirmAction('새로 만들기','현재 캐릭터의 값을 모두 지우고 처음 상태로 돌아갑니다. 배경 대사 수정본과 공식 계수는 유지합니다.',()=>{st={...st,ch:blank(),locks:{},acq:{},overrides:{},owner:{},unknown:[],big:{},talk:{psy_status:'docile',moral:3,angst:0,spoil:0,rational:3,fear:0},seed:'1',pt:1};save();render();});return;}
  if(a==='random')randomCharacter();
  if(a==='unique'){root.querySelector('#cvUniqueFile').click();return;}
  if(a==='panel'){st.panel=b.dataset.panel;st.folded=false;}
  if(a==='fold')st.folded=!st.folded;
  if(a==='pt-again')st.pt=(st.pt??1)+1;
  if(a==='pt-reset'){const m=st.ptEdits?.[charKey()];if(m)delete m[b.dataset.slot];}
  if(a==='term'){applyTerms(root.querySelector('#cvTerm').value);}
  if(a==='text-save'){const k=b.dataset.kind,v=root.querySelector(`[data-cv-text="${k}"]`).value;if(!v.trim()){api.toast('대사는 비워둘 수 없습니다.');return;}saveBackgroundText(k,v);api.toast('대사를 저장했습니다.');}
  if(a==='text-restore'){const k=b.dataset.kind,bt=backgroundText(k);if(bt)saveBackgroundText(k,bt.original);api.toast('원문으로 복원했습니다.');}
  if(a==='json-apply'){try{const d=JSON.parse(root.querySelector('#cvJson').value);const prev=ch();const next=fromJson(d,prev.unique?.fileName);if(prev.unique&&next.unique)next.unique.original=prev.unique.original;next.source=prev.source;st.ch=next;api.toast('JSON을 적용했습니다.');}catch(err){api.toast('JSON을 읽지 못했습니다: '+err.message);return;}}
  if(a==='json-download'){const blob=new Blob([JSON.stringify(toJson(),null,1)],{type:'application/json'}),u=URL.createObjectURL(blob),l=document.createElement('a');l.href=u;l.download=`${ch().type||'character'}_${ch().name||'jo9'}.json`;l.click();setTimeout(()=>URL.revokeObjectURL(u),1000);return;}
  save();render();
 });
 root.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.target.id==='cvTerm'){applyTerms(ev.target.value);save();render();root.querySelector('#cvTerm')?.focus();}});
 root.addEventListener('change',ev=>{
  const t=ev.target;
  if(t.dataset.cvLock){st.locks[t.dataset.cvLock]=t.checked;save();return;}
  // 칸을 벗어날 때(blur) 바로 다시 그리면 클릭한 버튼이 사라지므로 다음 틱에 그린다
  if(t.dataset.cvPt){((st.ptEdits??={})[charKey()]??={})[t.dataset.cvPt]=t.value;save();setTimeout(renderMain,0);return;}
  if(t.dataset.cvNum){const [grp,k]=t.dataset.cvNum.split('.');const v=t.value===''?undefined:k==='supermacy'?Math.trunc(Number(t.value)):Math.max(0,Math.trunc(Number(t.value)));if(t.value!==''&&!Number.isFinite(Number(t.value)))return;st[grp][k]=v;}
  else if(t.dataset.cvPsy!==undefined)st.talk.psy_status=t.value;
  else if(t.dataset.cvVoice!==undefined){if(t.value)ch().jo9_voice_type=t.value;else delete ch().jo9_voice_type;}
  else if(t.dataset.cvSeed!==undefined)st.seed=t.value.slice(0,40)||'1';
  else if(t.dataset.cvRoute!==undefined)st.acq={route:t.value,scene:st.acq.scene??'',event:st.acq.event??''};
  else if(t.dataset.cvEvent!==undefined)st.acq={...st.acq,route:'event',event:t.value};
  else if(t.dataset.cvScene!==undefined)st.acq={route:'patrol',scene:t.value};
  else return;
  save();setTimeout(render,0);
 });
 root.querySelector('#cvUniqueFile').addEventListener('change',async ev=>{
  const f=ev.target.files[0];ev.target.value='';if(!f)return;
  try{if(f.size>5*1024*1024)throw new Error('5MB 이하 파일만 읽습니다.');const d=JSON.parse((await f.text()).replace(/^﻿/,''));st.ch=fromJson(d,f.name);st.ch.source='unique';st.overrides={};st.pt=1;save();render();api.toast(`${st.ch.name||f.name}을(를) 불러왔습니다.`);}
  catch(err){api.toast('유니크 JSON을 읽지 못했습니다: '+err.message);}
 });
 onFormulaChange(render);
 render();
 // 통합 편집(캐릭터 편집 탭)과 잇는 다리: 게임 캐릭터 JSON + 대사집을 시뮬레이터로 열고, 시뮬레이터 결과를 대사집으로 돌려준다
 function loadGameCharacter(d,fileName,book={}){
  const bg=book.background??{};
  st.ch=fromJson({...d,jo9_type:String(book.id??''),jo9_world:bg.world??'',jo9_family:bg.family??'',jo9_occupation:bg.occupation??''},fileName);
  st.ch.source='unique';st.overrides={...(book.overrides??{})};st.pt=1;
  if(book.seed)st.seed=String(book.seed);
  st.acq={...(book.acq??{})};
  if(book.lines&&Object.keys(book.lines).length)((st.ptEdits??={})[charKey()]={...book.lines});
  save();render();
 }
 function exportTalk(){
  const c=ch(),cx=compute();
  return {id:String(c.type??''),name:c.name,background:{world:c.world||'',family:c.family||'',occupation:c.occupation||''},seed:st.seed,acq:{...st.acq},overrides:{...st.overrides},
   lines:{...(st.ptEdits?.[charKey()]??{})},facts:cx?.fx?{fields:cx.fx.fields,blocked:cx.fx.blocked}:null,excluded:!!cx?.r?.excluded,
   history:cx?.r&&!cx.r.excluded?{intimacy:cx.r.intimacy,acts:cx.r.acts,pregnancies:cx.r.pregnancies,births:cx.r.births}:null,
   // 원본 DB 연결 코드: 칸마다 창작물 DB 키와 표시불가 코드만(문장 없음). 연령 코드 1도 키·분류 코드는 남긴다(사용자 지시 2026-11-12)
   refs:Object.fromEntries(SLOTS.map(([,id])=>{const k=refFor(id,cx?.fx);const r=k?REFS.rows[k]:null;return [id,k?{key:k,blocked:r?.b??[]}:null];}).filter(([,v])=>v))};
 }
 return {render,loadGameCharacter,exportTalk};
}
