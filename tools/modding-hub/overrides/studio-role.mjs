import {describeGameValue,valueBadge,gameRules} from './game-presentation.mjs';
// JO9 MOD MASTER_EDITOR_20261115: role controls share the existing studio classes.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function roleUrl(role,url){
 if(role!=='master')return url;
 if(url==='/api/chars')return '/api/master/chars';
 if(/^\/api\/char\/\d+(?:\/|$)/.test(url))return url.replace('/api/char/','/api/master/');
 const talk=url.match(/^\/api\/talkbook\/(\d+)$/);return talk?'/api/master/'+talk[1]+'/talkbook':url;
}
export function nativeRows(code){
 const rows=[...String(code).matchAll(/^(\s*)([A-Za-z_]\w*)\s*=\s*(-?\d+)\s*(?=&|!|\r?$)/gm)].map(m=>({key:m[2],value:Number(m[3])}));
 const counts=new Map();for(const r of rows)counts.set(r.key,(counts.get(r.key)||0)+1);
 return rows.filter((r,i)=>rows.findIndex(x=>x.key===r.key)===i).map(r=>({...r,repeated:counts.get(r.key)>1}));
}
export function patchNativeStat(code,key,value){
 if(!/^[A-Za-z_]\w*$/.test(key)||!Number.isInteger(value))throw Error('정수 항목을 입력하세요.');
 if(nativeRows(code).find(r=>r.key===key)?.repeated)throw Error('여러 곳에 있는 값입니다. 원본 코드에서 편집하세요.');
 return code.replace(new RegExp('^(\\s*'+key+'\\s*=\\s*)-?\\d+','m'),(_,prefix)=>prefix+value);
}
const CM_KEYS=['jo9_cruel_mercy','jo9_cruel_mercy_half'];
export function cmValue(code,defaults={}){
 const values={...defaults,...Object.fromEntries(nativeRows(code).map(r=>[r.key,r.value]))};
 return (values.jo9_cruel_mercy??0)+(values.jo9_cruel_mercy_half??0)/2;
}
export function patchCm(code,value){
 if(!Number.isFinite(value)||!Number.isSafeInteger(value*2))throw Error('CM은 0.5 단위 숫자로 입력하세요.');
 const whole=Math.trunc(value),half=Math.round((value-whole)*2),newline=code.includes('\r\n')?'\r\n':'\n';
 for(const [key,number] of [[CM_KEYS[0],whole],[CM_KEYS[1],half]]){
  if(nativeRows(code).some(r=>r.key===key))code=patchNativeStat(code,key,number);
  else code+=(code && !code.endsWith('\n')?newline:'')+key+' = '+number;
 }
 return code;
}
const LABELS={master_str:'힘',master_cha:'매력',master_style:'스타일',master_libido:'욕구',master_tutor:'교육',master_fighter:'전투 기술',master_butler:'관리',master_artdirector:'예술',master_medic:'의학',master_mage:'마법',master_torture:'고문',master_domination:'지배',master_bondage:'결박',master_flagelation:'채찍',master_petting:'애무',master_oral:'구강',master_penetration:'삽입',master_fetish:'페티시즘',sparks:'시작 스파크',master_vampire:'뱀파이어'};
export function masterSettings(m,role){
 return `<p class="fine-print">${role==='master'?'마스터 원본 저장 시 게임의 시작 프리셋에 반영됩니다. 이미 시작한 세이브의 주인공은 바꾸지 않습니다.':'이 인물의 마스터 전환용 설정입니다. 현재 노예 JSON과 별도로 보관하며 마스터로 복제할 때 가져갑니다.'}</p><div class="cv-form"><label>마스터 이름<input data-st-master="name" value="${esc(m.name)}" maxlength="100"></label><label>난이도 안내<input data-st-master="difficulty" value="${esc(m.difficulty)}" title="시작 화면의 안내 문구입니다. 실제 전투 난이도 설정과 다릅니다."></label></div><section class="st-story"><div class="section-label">마스터 소개 · 배경 이야기</div><textarea data-st-master="description" rows="6">${esc(m.description)}</textarea></section><details><summary>게임에서 쓰는 초상 경로</summary><div class="cv-form"><label>컬러 초상<input data-st-master="portrait" value="${esc(m.portrait)}"></label><label>세피아 초상<input data-st-master="sepia" value="${esc(m.sepia)}"></label></div><p class="fine-print">이 경로는 QSP의 마스터 소개 초상입니다. 외형 탭의 편집용 이미지와 구분됩니다. 기존 시작 메뉴에 직접 적힌 아이콘 경로는 QSP 이벤트에서 확인하세요.</p></details>`;
}
export function initialValue(row,changes={}){
 if(Object.hasOwn(changes,row.key))return changes[row.key]===null?(row.baseValue??null):changes[row.key];
 return row.value;
}
export function cmInitialChanges(value){
 if(!Number.isFinite(value)||!Number.isSafeInteger(value*2))throw Error('CM은 0.5 단위 숫자로 입력하세요.');
 const whole=Math.trunc(value);return {jo9_cruel_mercy:whole,jo9_cruel_mercy_half:Math.round((value-whole)*2)};
}
export function initialCm(m,defaults,catalog,changes={}){
 const values={...defaults,...Object.fromEntries(nativeRows(m.statsCode).map(r=>[r.key,r.value]))};
 for(const key of CM_KEYS){const row=catalog?.fields.find(r=>r.key===key);if(row)values[key]=initialValue(row,changes)??0;}
 return (values.jo9_cruel_mercy??0)+(values.jo9_cruel_mercy_half??0)/2;
}
function initialControl(row,changes){
 const value=initialValue(row,changes),pending=Object.hasOwn(changes,row.key),reset=pending&&changes[row.key]===null;
 const state=pending?(reset?'표 지정 해제 예정':'변경 예정'):row.override?'개별 지정':row.conditional?'조건에 따라 결정':row.inherited?'공통 초기값':'캐릭터 지정값';
 const source=(row.sources||[]).map(s=>`${s.location}:${s.line} · ${s.expression}${s.conditional?' · 조건: '+(s.conditions||[]).join(' / '):''}`).join('\n');
 const info=`${row.label} · ${row.key}\n${state}\n저장 단계: ${{preset:'캐릭터 시작 코드',description:'선택 후 계산 다음',residence:'거주지 생성 직전',start:'거주지·특수 초기화 다음'}[row.phase]||row.phase}${row.recalculated?'\n게임이 계속 재계산하는 값입니다. 초기 지정이 영구 고정되지는 않습니다.':''}\n${source}`;
 return `<label class="st-stat st-initial-field${pending?' changed':''}" data-initial-row="${esc((row.label+' '+row.key+' '+row.group).toLowerCase())}" title="${esc(info)}"><span>${esc(gameRules().labels[row.key]??row.label)}</span> <small>${esc(row.key)}</small><input ${row.kind==='number'?'type="number" step="1"':'type="text"'} data-st-initial="${esc(row.key)}" value="${esc(value??'')}" placeholder="${value==null?'자동 / 조건값':''}"><small data-game-description>${valueBadge(row.key,value)}</small><small data-initial-state>${esc(state)}${row.recalculated?' · 재계산':''}</small>${value==null?`<small>${esc(row.expression||'자동 계산')}</small>`:''}<button type="button" class="button secondary" data-initial-reset="${esc(row.key)}" ${!row.override&&!pending?'disabled hidden':''} title="표에서 지정한 변경분만 해제합니다. 기존 캐릭터 원본 코드와 공통값으로 돌아갑니다.">표 지정 해제</button></label>`;
}
export function initialFields(catalog,changes={}){
 const rows=(catalog?.fields||[]).filter(r=>!CM_KEYS.includes(r.key));
 const groups=new Map();for(const row of rows){if(!groups.has(row.group))groups.set(row.group,[]);groups.get(row.group).push(row);}
 return `<p class="fine-print">공통 초기값과 캐릭터 지정값 ${rows.length}개 · 항목에 커서를 올리면 변수 의미·출처·저장 단계를 볼 수 있습니다. 표에서 수정한 항목만 저장됩니다. 원본 코드를 직접 수정했다면 저장 후 표에 반영됩니다.</p><label>시작 설정 검색<input data-initial-filter placeholder="이름 또는 변수 검색"></label>${[...groups].map(([name,list])=>`<details data-initial-group ${name==='능력치·상태·경험치'?'open':''}><summary>${esc(name)} · ${list.length}개</summary><div class="st-grid">${list.map(r=>initialControl(r,changes)).join('')}</div></details>`).join('')}`;
}
export function masterStats(m,role,defaults={},catalog=null,changes={}){
 if(catalog?.fields)return `<div class="section-label">${role==='master'?'마스터 시작 능력치·설정':'마스터 전환용 시작 능력치·설정'}</div><p class="fine-print">${role==='master'?'새 게임의 해당 주인공 시작값에 적용합니다. 이미 진행 중인 세이브는 바꾸지 않습니다.':'노예 JSON과 별도로 보관하고 마스터로 복제할 때 적용합니다.'}</p><div class="cv-form"><label title="CM = jo9_cruel_mercy + jo9_cruel_mercy_half / 2 · 음수 Cruel, 양수 Mercy · 0.5 단위 · 선택한 주인공으로 게임을 시작할 때 적용">CM (Cruel &amp; Mercy)<input type="number" step="0.5" data-st-master-cm value="${initialCm(m,defaults,catalog,changes)}"></label><button type="button" class="button secondary" data-initial-reset-cm ${!CM_KEYS.some(k=>Object.hasOwn(changes,k)||catalog.fields.find(r=>r.key===k)?.override)?'disabled':''}>CM 표 지정 해제</button></div>${initialFields(catalog,changes)}<details><summary>시작 효과 원본 코드 직접 편집</summary><textarea class="st-json" data-st-master="statsCode" rows="16" spellcheck="false">${esc(m.statsCode)}</textarea></details>`;
 return `<div class="section-label">${role==='master'?'마스터 시작 능력치':'마스터 전환용 시작 능력치'}</div><p class="fine-print">입력한 정수를 그대로 저장합니다. 장비·세력·시작 자금 및 조건문은 아래 원본 코드에 보존됩니다.</p><div class="cv-form"><label title="CM = jo9_cruel_mercy + jo9_cruel_mercy_half / 2 · 음수는 Cruel(잔혹), 양수는 Mercy(자비) · 0.5 단위">CM (Cruel &amp; Mercy)<input type="number" step="0.5" data-st-master-cm value="${cmValue(m.statsCode,defaults)}" ${nativeRows(m.statsCode).some(r=>CM_KEYS.includes(r.key)&&r.repeated)?'disabled title="여러 곳에서 지정됩니다. 원본 코드로 편집하세요."':''}></label></div><p class="fine-print">CM은 0.5 단위입니다. 별도로 지정하지 않으면 공통 시작 값을 표시합니다.</p><div class="st-grid">${nativeRows(m.statsCode).filter(r=>!CM_KEYS.includes(r.key)).map(r=>`<label class="st-stat" title="${esc(r.key)} · 마스터 시작 프리셋에서 지정하는 값${r.repeated?' · 여러 곳에 있어 원본 코드에서 편집':''}">${esc(LABELS[r.key]||r.key)} <small>${esc(r.key)}</small><input type="number" step="1" data-st-master-stat="${esc(r.key)}" value="${r.value}" ${r.repeated?'disabled':''}></label>`).join('')}</div><details><summary>시작 효과 원본 코드 직접 편집</summary><textarea class="st-json" data-st-master="statsCode" rows="16" spellcheck="false">${esc(m.statsCode)}</textarea></details>`;
}
export function cloneBody(d,revision){
 const include=Object.entries(d.include).filter(([,v])=>v).map(([k])=>k);
 return {targetRole:d.targetRole,name:d.name,slug:d.slug,newId:d.newId || d.result?.id || '',gender:d.gender,include,revision,overrides:include.includes('stats')?d.overrides:{}};
}
export function cloneForm(d){
 const target=d.targetRole==='master'?'마스터':'노예';
 return `<div class="st-preview"><b>${target} 캐릭터로 복제</b><p class="fine-print">원본 인물을 유지하고 새 번호로 만듭니다. 저장하지 않은 변경은 먼저 저장하세요. 선택한 외형 파일은 복제본 전용 경로로 복사하여 원본을 보존합니다.</p><div class="cv-form"><label>새 이름<input data-role-copy="name" value="${esc(d.name)}"></label><label>파일명(영문)<input data-role-copy="slug" value="${esc(d.slug)}" placeholder="비우면 copy"></label><label>새 번호(비우면 자동)<input data-role-copy="newId" value="${esc(d.newId)}"></label>${d.targetRole==='master'?`<label>주인공 성별<select data-role-copy="gender"><option value="male" ${d.gender==='male'?'selected':''}>남주인공</option><option value="female" ${d.gender==='female'?'selected':''}>여주인공</option></select></label>`:''}</div><div class="st-row">${[['appearance','외형'],['background','배경·설정'],['stats','능력치·특성'],['talk','대사집']].map(([key,label])=>`<label class="cv-lock"><input type="checkbox" data-role-include="${key}" ${d.include[key]?'checked':''}>${label}</label>`).join('')}</div><details><summary>능력치 대응표 · 복제할 값 조정</summary><p class="fine-print">완전히 같은 수치 체계가 아니므로 값을 확인하세요. 대응하지 않는 원래 역할의 설정은 보조 자료로 보관합니다.</p><div class="cv-form">${d.rows.map(r=>`<label title="${esc(r.source)} → ${esc(r.target)}">${esc(r.label)}<small>${esc(r.source)} → ${esc(r.target)}</small><input type="number" step="1" data-role-map="${esc(r.target)}" value="${esc(d.overrides[r.target]??r.value)}"></label>`).join('')||'<span class="fine-print">자동 대응되는 값 없음</span>'}</div></details>${d.result?`<p>새 번호 ${d.result.id} · ${esc(d.result.json)}</p>${d.result.warnings.map(w=>`<p class="warning">${esc(w)}</p>`).join('')}`:''}<div class="st-row"><button class="button secondary" data-role-copy-act="preview">복제 미리보기</button><button class="button" data-role-copy-act="save" ${d.result?'':'disabled'}>새 ${target}로 복제</button><button class="button secondary" data-role-copy-act="close">취소</button></div></div>`;
}
