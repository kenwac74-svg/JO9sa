/* JO9 MOD START GIRLS_CHARACTER_CHECKLIST_20261104 */
(function girlsChecklist(data) {
  'use strict';
  if (!data || document.getElementById('jo9-girls-checklist')) return;
  const cfg = window.JO9_CATALOG_BRIDGE;
  const live = !!(cfg && cfg.url && cfg.token);
  const normal = p => String(p || '').replace(/\\/g, '/').replace(/^content\/pic\//i, '').toLowerCase();
  const files = new Map(data.files.map(p => [normal(p), p]));
  const exists = p => !!p && files.has(normal(p));
  const node = (tag, text, className) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (className) n.className = className;
    return n;
  };
  const style = node('style');
  style.textContent = `
    #jo9-girls-checklist{margin:16px;padding:16px;background:#181d25;color:#eee;border:2px solid #9d784a;font:15px/1.5 system-ui,sans-serif}
    #jo9-girls-checklist summary{cursor:pointer;font-size:20px;font-weight:700}
    #jo9-girls-checklist .gc-toolbar{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0;align-items:center}
    #jo9-girls-checklist button,#jo9-girls-checklist select,#jo9-girls-checklist input{padding:7px;background:#303946;color:#fff;border:1px solid #8491a1;border-radius:4px}
    #jo9-girls-checklist button:disabled{opacity:.5}
    #jo9-girls-checklist input[type=search]{width:260px}
    #jo9-girls-checklist a{color:#abd5ff}
    #jo9-girls-checklist .gc-card{border-top:1px solid #746446;padding:16px 0}
    #jo9-girls-checklist .gc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
    #jo9-girls-checklist .gc-slot{padding:10px;background:#232b36;border:1px solid #435062;min-width:0}
    #jo9-girls-checklist .gc-slot h4{margin:0 0 8px}
    #jo9-girls-checklist .gc-slot img{display:block;width:100%;height:150px;object-fit:contain;background:#11161d;margin:8px 0}
    #jo9-girls-checklist .gc-path{font:12px/1.5 ui-monospace,monospace;overflow-wrap:anywhere;color:#c3cfdf}
    #jo9-girls-checklist .gc-ok{color:#9bd9ad}
    #jo9-girls-checklist .gc-warn{color:#f5c785}
    #jo9-girls-checklist .gc-error{color:#ff9d99}
    #jo9-girls-checklist .gc-note{color:#bfccd9}
    #jo9-girls-checklist details{margin:10px 0}
    #jo9-girls-checklist details summary{font-size:15px}
    #jo9-girls-checklist .gc-list{max-height:500px;overflow:auto;padding:8px}
    #jo9-girls-checklist .gc-row{display:flex;align-items:center;gap:8px;padding:6px;border-bottom:1px solid #3c4755}
    #jo9-girls-checklist .gc-row .gc-path{flex:1}
    #jo9-girls-checklist .gc-row{flex-wrap:wrap}
    #jo9-girls-checklist .gc-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:9px;flex-basis:100%}
    #jo9-girls-checklist .gc-tags button{padding:4px 6px;font-size:12px;line-height:1.4;cursor:pointer}
    #jo9-girls-checklist .gc-tags button[aria-pressed=true]{background:#36513d;color:#fff;box-shadow:inset 0 0 0 1px currentColor}
    #jo9-girls-checklist .gc-status-filter[aria-pressed=true]{background:#536a39;color:#fff;box-shadow:inset 0 0 0 1px #bed291}
    #jo9GirlsNav{display:block;width:100%;padding:9px;margin:30px 0 10px;background:#293c52;color:#fff;border:1px solid #9d784a;cursor:pointer;text-align:left}
    .gc-preview{max-width:760px;width:90vw;background:#1d2530;color:#eee;border:1px solid #b69a68}
    .gc-preview img{max-width:100%;max-height:56vh;object-fit:contain;background:#111}
    .gc-preview::backdrop{background:#000a}
    .gc-preview button{padding:9px;margin:8px}
  `;
  document.head.append(style);
  const root = node('section');
  root.id = 'jo9-girls-checklist';
  root.append(node('h2', '전체 캐릭터 이미지 보완 목록'));
  const host = document.getElementById('jo9-catalog-panel-girls') || document.body;
  host.append(root);
  const intro = node('p', 'WORK 적용 완료 · 새·옛 복장 등록을 함께 확인하며, 전용 그림이 없으면 기본 전신을 표시합니다.', 'gc-warn');
  root.append(intro, node('p', '태그는 캐릭터 번호별로 저장합니다. 위 상태 버튼을 누르면 해당 태그의 캐릭터만 모아 볼 수 있습니다.', 'gc-note'));
  const toolbar = node('div', undefined, 'gc-toolbar');
  const search = node('input');
  let appliedSearch='';
  const searchGo=node('button','검색');searchGo.type='button';searchGo.id='jo9GirlsSearchGo';
  search.type = 'search'; search.placeholder = '번호 · 이름 · JSON · 파일명 검색';
  const filter = node('select');
  for (const [v, label] of [['issues','보완할 캐릭터'],['all','전체 캐릭터'],['broken','선택 시 그림 누락'],['hidden','그림 있음 · 선택 연결 필요'],['empty','전용 복장 미등록'],['random','무작위 등장 범위'],['special','고유·별도 등록']]) {
    const o = node('option', label); o.value = v; filter.append(o);
  }
  const sort=node('select');sort.setAttribute('aria-label','캐릭터 정렬');
  for(const [value,title] of [['id','번호 오름차순'],['id-desc','번호 내림차순'],['name','이름순']]){
    const option=node('option',title);option.value=value;sort.append(option);
  }
  const namedOnly=node('input');namedOnly.type='checkbox';namedOnly.id='jo9-girls-named-only';
  const namedLabel=node('label');
  namedLabel.textContent=' 이름 있는 유니크만 ('+data.characters.filter(c=>c.hasFixedName).length+')';
  namedLabel.title='JSON에 고정 이름이 등록된 캐릭터만 표시합니다. 무작위로 등장하는 고정 이름 캐릭터도 포함합니다.';
  namedLabel.prepend(namedOnly);
  const images = node('input'); images.type = 'checkbox'; images.checked = true;
  const label = node('label', ' 이미지 미리보기'); label.prepend(images);
  const refresh = node('button', 'WORK 이미지 상태 새로고침');
  refresh.disabled = !live;
  const save = node('button', '현재 목록 HTML 저장');
  filter.value='all';
  toolbar.append(search, searchGo, filter, sort, namedLabel, label, refresh, save);
  root.append(toolbar);
  const tagFilters=node('div',undefined,'gc-toolbar');tagFilters.setAttribute('aria-label','캐릭터 상태 필터');root.append(tagFilters);
  const status = node('p', '', 'gc-note'), message = node('p', '', 'gc-note'), pager = node('div', undefined, 'gc-toolbar'), list = node('div');
  root.append(status, message, pager, list);
  let page = 0, version = Date.now(), busy = false, dirty=false;
  let selectedTag='';
  let statusState=data.checklistStatus||{items:{},savedAt:0},statusReady=!live,statusSaving=false,statusLoading=false;
  const flagSpecs=Array.isArray(window.STS)?window.STS:[
    ['done','완료','#2b8a4a','작업 완료'],['ore','원본re','#a47bce','원본을 바탕으로 재작업'],
    ['mre','머지re','#5a8ec8','현재 그림을 바탕으로 재작업'],['branch','재활용','#c29135','다른 장면이나 편집 자료로 재활용'],
    ['spare','보관','#9d784a','보관 대상으로 표시'],['wip','작업중','#d14a8a','현재 작업 중'],
    ['todo','작업필요','#78818a','보완이 필요한 이미지'],['delete','삭제 예정','#b53b36','정리 대상으로 표시. 체크만으로 삭제하지 않습니다.']];
  async function statusApi(route,payload){
    const response=await fetch(new URL('api/catalog/'+route,cfg.url),{method:payload?'POST':'GET',
      headers:{'X-JO9-Token':cfg.token,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined});
    const value=await response.json();if(!response.ok)throw Error(value.error||'상태 저장에 실패했습니다.');return value;
  }
  function syncTags(){
    root.querySelectorAll('.gc-tag').forEach(button=>{
      const checked=(statusState.characterItems?.[button.dataset.characterId]||[]).includes(button.dataset.flag);
      button.setAttribute('aria-pressed',String(checked));button.textContent=(checked?'☑ ':'☐ ')+button.dataset.label;
      button.disabled=!live||!statusReady||statusSaving;
    });
    tagFilters.querySelectorAll('.gc-status-filter').forEach(button=>{
      const flag=button.dataset.flag,count=data.characters.filter(c=>!flag||(statusState.characterItems?.[String(c.id)]||[]).includes(flag)).length;
      button.textContent=button.dataset.label+' '+count;button.setAttribute('aria-pressed',String(selectedTag===flag));
    });
  }
  async function refreshTags(){
    if(!live||statusLoading||statusSaving)return;statusLoading=true;
    try{const value=await statusApi('state?brief=1');if(!value.available)throw Error('상태 목록 연결을 확인하세요.');
      const changed=JSON.stringify(statusState.characterItems||{})!==JSON.stringify(value.characterItems||{});
      statusState=value;statusReady=true;if(changed)render();else syncTags();
    }catch(error){statusReady=false;syncTags();message.textContent='상태 연결 확인 필요 · '+error.message;}
    finally{statusLoading=false;}
  }
  async function toggleTag(characterId,flag){
    if(!live||statusSaving||!statusReady)return;statusSaving=true;syncTags();
    try{
      if(window.JO9_CATALOG_SAVE)await window.JO9_CATALOG_SAVE();
      statusState=await statusApi('state?brief=1');
      const expected=(statusState.characterItems?.[String(characterId)]||[]).includes(flag);
      const value=await statusApi('status',{actions:[{characterId,flag,expected,checked:!expected}]});
      statusState=value;if(window.JO9_CATALOG_ACCEPT)window.JO9_CATALOG_ACCEPT(value);
      message.textContent='캐릭터 '+characterId+' 상태 저장 완료 · 같은 그림을 사용하는 다른 캐릭터에는 적용되지 않습니다.';
      render();
    }catch(error){message.textContent='상태 저장 실패 · '+error.message;}
    finally{statusSaving=false;syncTags();}
  }
  function tags(characterId){
    const box=node('div',undefined,'gc-tags');box.setAttribute('aria-label','캐릭터 '+characterId+' 작업 상태');
    for(const [flag,label,color,description] of flagSpecs){
      const button=node('button','☐ '+label,'gc-tag');button.type='button';
      button.dataset.characterId=characterId;button.dataset.flag=flag;button.dataset.label=label;
      button.title=flag==='spare'?'이 캐릭터를 보관 대상으로 표시합니다. 이미지나 원본 B컷 연결은 바꾸지 않습니다.':
        flag==='delete'?'이 캐릭터를 정리 검토 대상으로 표시합니다. 체크만으로 캐릭터나 이미지를 삭제하지 않습니다.':description;
      button.style.borderColor=color;button.onclick=()=>toggleTag(characterId,flag);box.append(button);
    }
    return box;
  }
  for(const [flag,label,color] of [['','전체','#8491a1'],...flagSpecs]){
    const button=node('button',label,'gc-status-filter');button.type='button';button.dataset.flag=flag;button.dataset.label=label;
    button.style.borderColor=color;button.onclick=()=>{selectedTag=selectedTag===flag?'':flag;if(selectedTag)filter.value='all';page=0;render();};tagFilters.append(button);
  }
  const pageSize = 12;
  const roles = [
    ['maid', '하녀', 'fullmade', 'indpack_maid'],
    ['secretary', '비서 / 교복', 'fullsecretary', 'indpack_secr'],
    ['mistress', '도미나', 'fullmistress', 'indpack_dom']
  ];
  const fieldLabels = {fullimage:'기본 등록 전신',indpack_title:'전용 타이틀',indpack_naked:'알몸 전신',
    seed_ava_clear:'컬러 초상',seed_ava_gray:'흑백 초상',seed_ava:'세피아 초상'};
  const outfits = [
    ['naked','알몸'],['apron','앞치마'],['maid','하녀'],['secr','비서 / 교복'],['dom','도미나'],
    ['nurse','간호복'],['school','교복'],['sorc','마법사복'],['leotard','레오타드'],
    ['chainmail','사슬갑옷'],['kimono','유카타'],['sundress','원피스'],['lace','레이스 속옷'],
    ['cocktail','칵테일 드레스'],['latex','라텍스'],['exotic','무희복'],['corset','코르셋'],
    ['gorgeous','고급 드레스'],['bride','신부'],['tail','꼬리 장비'],['cow','착유 장비'],
    ['pet','펫슈트'],['restrain','감각차단복']
  ];
  const actionNames = {bath:'목욕',cook:'요리',clean:'청소',rest:'휴식',wash:'씻기',
    gym:'체조',fight:'격투',music:'음악',art:'그림',dance:'춤',nurse:'간호',
    alchemy:'연금술',petplay:'펫플레이',milking:'착유',bondage:'구속'};
  const actionFamily = path => path.split('/').pop().replace(/\.png$/i,'').replace(/^\d+_/,'').replace(/_\d+$/,'');
  const actionFamilies = Array.from(new Set(data.files.filter(p=>/^girls\/sex_scenes\/\d+\/\d+_/i.test(p)).map(actionFamily))).sort();
  function collectActions(){
    const map=new Map();
    for(const p of files.values()){
      const match=normal(p).match(/^girls\/sex_scenes\/(\d+)\/\d+_/);if(!match)continue;
      const key=Number(match[1])+':'+actionFamily(p);if(!map.has(key))map.set(key,[]);map.get(key).push(p);
    }
    return map;
  }
  let actionsById=collectActions();
  function full(c) { return c.refs.indpack_title || c.refs.fullimage || ''; }
  function role(c, spec) {
    const legacy = c.refs[spec[2]] || '', pack = c.refs[spec[3]] || '', path = pack || legacy;
    const moodMissing = ['_horny','_rebel'].some(s => c.refs[spec[3]+s] && !exists(c.refs[spec[3]+s]));
    let state = 'ok', text = '전용 그림 있음';
    if (!path) { state = 'empty'; text = '전용 복장 미등록 · 기본 전신 대체 예정'; }
    else if (!exists(path)) { state = 'broken'; text = '그림 경로 오류 · 기본 전신 대체 예정'; }
    else if (!legacy && pack) { state = 'hidden'; text = '그림 있음 · 복장 선택 연결 필요'; }
    else if (normal(path) === normal(full(c)) || normal(path) === normal(c.refs.fullimage)) {
      state = 'same'; text = '기본 전신과 같은 그림 · 전용 복장 보완 가능';
    }
    if (moodMissing) text += ' · 등록된 상태 변형 누락';
    return {path, legacy, pack, state, text, moodMissing};
  }
  function evaluation(c) {
    const rr = roles.map(r => role(c,r));
    const coreMissing = ['seed_ava_clear','seed_ava_gray','seed_ava'].some(k=>!exists(c.refs[k])) || !exists(full(c));
    return {rr,broken:coreMissing||rr.some(r=>r.state==='broken'||r.moodMissing),
      hidden:rr.some(r=>r.state==='hidden'),empty:rr.some(r=>r.state==='empty'||r.state==='same')};
  }
  function chooseRows() {
    const term = appliedSearch;
    const rows=data.characters.filter(c=>{
      if(namedOnly.checked&&!c.hasFixedName)return false;
      if(selectedTag&&!(statusState.characterItems?.[String(c.id)]||[]).includes(selectedTag))return false;
      if (term) {
        const matches=/^\d+$/.test(term)?c.id===Number(term):
          [c.name,c.json,...Object.values(c.refs),...c.assets].join('\n').toLowerCase().includes(term);
        if(!matches)return false;
      }
      const e=evaluation(c);
      if(filter.value==='all')return true;
      if(filter.value==='random')return c.random;
      if(filter.value==='special')return !c.random;
      if(filter.value==='issues')return e.broken||e.hidden||e.empty;
      return e[filter.value];
    });
    rows.sort(sort.value==='id-desc'?(a,b)=>b.id-a.id:sort.value==='name'?(a,b)=>a.name.localeCompare(b.name,'ko')||a.id-b.id:(a,b)=>a.id-b.id);
    return rows;
  }
  function assetUrl(path) {
    const actual = files.get(normal(path)) || path;
    if(live)return new URL('api/catalog-asset',cfg.url).href+'?t='+encodeURIComponent(cfg.token)+'&original=0&p='+encodeURIComponent('content/pic/'+actual)+'&v='+version;
    return 'file:///'+data.gameRoot.replace(/\\/g,'/').replace(/\/$/,'')+'/content/pic/'+actual.split('/').map(encodeURIComponent).join('/');
  }
  async function api(action, input) {
    const options = {headers:{'X-JO9-Token':cfg.token}};
    if(input!==undefined){ options.method='POST'; options.headers['Content-Type']='application/json'; options.body=JSON.stringify(input); }
    const response=await fetch(new URL('api/catalog/pic/'+action,cfg.url),options);
    const value=await response.json();
    if(!response.ok)throw Error(value.error||'이미지 작업에 실패했습니다.');
    return value;
  }
  function info(path) {
    const used=data.characters.filter(c=>Object.values(c.refs).some(p=>normal(p)===normal(path)));
    return used.length>1?'공유 이미지 · '+used.map(c=>c.id).join(', ')+'에 함께 반영됩니다.':'';
  }
  function preview(canvas, path, shared) {
    return new Promise(resolve=>{
      const dialog=node('dialog'); dialog.className='gc-preview';
      dialog.append(node('h3',exists(path)?'PNG 교체 확인':'누락된 PNG 추가 확인'));
      dialog.append(node('p','content/pic/'+path),node('p','저장 크기 '+canvas.width+'×'+canvas.height+' · 원본 비율 유지'));
      if(shared)dialog.append(node('p',shared));
      const img=node('img');img.src=canvas.toDataURL('image/png');dialog.append(img);
      const yes=node('button','이 PNG 저장'),no=node('button','취소');
      dialog.append(yes,no);document.body.append(dialog);
      let settled=false;
      const finish=value=>{if(settled)return;settled=true;dialog.close();dialog.remove();resolve(value);};
      yes.onclick=()=>finish(true);no.onclick=()=>finish(false);
      dialog.oncancel=e=>{e.preventDefault();finish(false);};dialog.onclose=()=>finish(false);
      dialog.showModal();
    });
  }
  async function put(path, title) {
    if(busy||!live)return;
    const input=node('input');input.type='file';input.accept='image/png';input.style.display='none';root.append(input);
    input.oncancel=()=>input.remove();
    input.onchange=async()=>{
      const file=input.files[0];input.remove();if(!file)return;
      busy=true;message.textContent=title+' PNG를 준비하고 있습니다.';
      try {
        if(file.size>60*1024*1024)throw Error('60MB 이하의 PNG를 선택하세요.');
        const actual=files.get(normal(path))||path;
        const old=await api('file',{path:actual});
        let before=null, width=/girls\/face\//i.test(path)?151:795,height=/girls\/face\//i.test(path)?150:596;
        if(!old.missing){
          const bytes=Uint8Array.from(atob(old.data),c=>c.charCodeAt(0));
          before=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
          const view=new DataView(bytes.buffer);width=view.getUint32(16);height=view.getUint32(20);
        }
        const bitmap=await createImageBitmap(file);
        if(bitmap.width*bitmap.height>32000000){bitmap.close();throw Error('이미지 해상도가 너무 큽니다.');}
        const canvas=node('canvas');canvas.width=width;canvas.height=height;
        const scale=Math.min(width/bitmap.width,height/bitmap.height);
        const drawWidth=bitmap.width*scale,drawHeight=bitmap.height*scale;
        const context=canvas.getContext('2d');context.imageSmoothingQuality='high';
        context.drawImage(bitmap,(width-drawWidth)/2,(height-drawHeight)/2,drawWidth,drawHeight);bitmap.close();
        if(!await preview(canvas,actual,info(path)))return;
        const png=canvas.toDataURL('image/png').split(',')[1];
        const result=await api('apply',{jobs:[{path:actual,before,data:png,width,height,
          cap:60*1024*1024,createMissing:!!old.missing}]});
        files.set(normal(actual),actual);actionsById=collectActions();version=Date.now();
        message.textContent='저장 완료 · '+actual+' · 원본 백업과 이미지 패치 기록이 생성됐습니다.'+(result.catalogWarning?' '+result.catalogWarning:'')+(result.patchWarning?' '+result.patchWarning:'');
        render();
      }catch(e){message.textContent=e.message;}finally{busy=false;}
    };
    input.click();
  }
  function pathRow(path, title) {
    const row=node('div',undefined,'gc-row');
    row.append(node('span',exists(path)?'있음':'없음',exists(path)?'gc-ok':'gc-error'),node('span',title+' · '+path,'gc-path'));
    const b=node('button',exists(path)?'PNG 교체':'PNG 추가');b.disabled=!live;b.onclick=()=>put(path,title);row.append(b);
    return row;
  }
  function slot(c,title,path,text,state) {
    const box=node('div',undefined,'gc-slot');box.append(node('h4',title));
    box.append(node('strong',text,state==='ok'?'gc-ok':state==='broken'?'gc-error':'gc-warn'));
    if(path){
      box.append(node('p',path,'gc-path'));
      if(images.checked&&exists(path)){const img=node('img');img.loading='lazy';img.alt=title;img.src=assetUrl(path);box.append(img);}
      const shared=info(path);if(shared)box.append(node('p',shared,'gc-note'));
      const b=node('button',exists(path)?'PNG 교체':'PNG 추가');b.disabled=!live;b.onclick=()=>put(path,title);box.append(b);
    }else{
      box.append(node('p','경로 등록도 필요한 칸입니다. 캐릭터 이미지추가도구에서 해당 복장을 선택·저장하면 파일과 연결을 함께 만들 수 있습니다.','gc-note'));
    }
    return box;
  }
  function render() {
    if(window.JO9_CATALOG_TABS&&window.JO9_CATALOG_TABS.current()!=='girls'){dirty=true;return;}dirty=false;
    const rows=chooseRows(),pages=Math.max(1,Math.ceil(rows.length/pageSize));
    page=Math.min(page,pages-1);
    const all=data.characters.map(evaluation);
    status.textContent='캐릭터 '+data.characters.length+'명 · 검색 결과 '+rows.length+'명 · 그림 경로 오류 '+all.filter(e=>e.broken).length+'명 · 복장 선택 연결 필요 '+all.filter(e=>e.hidden).length+'명 · 전용 복장 보완 '+all.filter(e=>e.empty).length+'명 (항목 간 중복 가능)';
    pager.replaceChildren();list.replaceChildren();
    const prev=node('button','이전'),next=node('button','다음');prev.disabled=page===0;next.disabled=page+1===pages;
    prev.onclick=()=>{page--;render();};next.onclick=()=>{page++;render();};
    pager.append(prev,node('span',(page+1)+' / '+pages+' 페이지'),next);
    for(const c of rows.slice(page*pageSize,(page+1)*pageSize)){
      const card=node('section',undefined,'gc-card');card.dataset.characterId=c.id;
      const displayName=c.name==='ID '+c.id?'일반 캐릭터':c.name;
      card.append(node('h3',c.id+' · '+displayName),node('p',c.json+' · '+(c.random?'무작위 등장 범위에 포함':'고유 이벤트 / 별도 등록'),'gc-note'),tags(c.id));
      if(c.catalogNote)card.append(node('p',c.catalogNote,'gc-note'));
      const grid=node('div',undefined,'gc-grid');card.append(grid);
      const base=full(c);
      grid.append(slot(c,'기본 전신',base,exists(base)?'기본 전신 있음':'기본 전신 연결 확인 필요',exists(base)?'ok':'broken'));
      for(const [field,title] of [['seed_ava_clear','컬러 초상'],['seed_ava_gray','흑백 초상'],['seed_ava','세피아 초상']]){
        const path=c.refs[field]||'';grid.append(slot(c,title,path,exists(path)?'초상 있음':'초상 추가 / 연결 필요',exists(path)?'ok':'broken'));
      }
      for(const spec of roles){const r=role(c,spec);grid.append(slot(c,spec[1],r.path,r.text,r.state));}
      const clothes=node('details');clothes.append(node('summary','전체 복장 · 일반 / 흥분 / 반항 컷 보유 상태'));
      const clothList=node('div',undefined,'gc-list');
      for(const [key,title] of outfits){
        const field='indpack_'+key, ordinary=c.refs[field];
        const group=node('div');group.append(node('h4',title));
        if(ordinary)group.append(pathRow(ordinary,'일반'));
        else group.append(node('p','일반 전용 컷 미등록 · 기본 전신 또는 기존 역할 그림을 사용','gc-note'));
        for(const [suffix,label] of [['_horny','흥분'],['_rebel','반항']]){
          const variant=c.refs[field+suffix];
          if(variant)group.append(pathRow(variant,label));
          else group.append(node('p',label+' 전용 컷 미등록 · 일반 복장 그림 사용','gc-note'));
        }
        clothList.append(group);
      }
      clothes.append(clothList);card.append(clothes);
      const refs=node('details');refs.append(node('summary','등록된 전신·복장·상태 변형 경로 전체'));
      const refList=node('div',undefined,'gc-list');
      for(const [field,path] of Object.entries(c.refs).filter(([key])=>key.startsWith('indpack_')||['fullimage','fullmade','fullsecretary','fullmistress','fullpregnant'].includes(key)))
        refList.append(pathRow(path,fieldLabels[field]||field));
      refs.append(refList);card.append(refs);
      const scenes=node('details');const actionFiles=Array.from(actionsById.entries()).filter(([key])=>key.startsWith(c.id+':')).flatMap(([,paths])=>paths);
      scenes.append(node('summary','캐릭터 번호별 행동 컷 · '+actionFiles.length+'개'));
      scenes.append(node('p','개별 행동 컷이 없는 행동은 공용 컷에서 선택될 수 있습니다. 원래 모든 행동에 전용 컷이 있어야 하는 것은 아닙니다.','gc-note'));
      const actionSlots=node('details');actionSlots.append(node('summary','행동별 전용 컷 보완 · 없는 컷도 보기'));
      const actionGrid=node('div',undefined,'gc-list');
      for(const action of actionFamilies){
        const candidates=actionsById.get(c.id+':'+action)||[];
        const title=(actionNames[action]||action)+' · '+action;
        if(candidates.length){
          actionGrid.append(node('p',title+' · 전용 컷 '+candidates.length+'개','gc-ok'));
        }else{
          actionGrid.append(pathRow('girls/sex_scenes/'+c.id+'/'+c.id+'_'+action+'.png',title+' · 현재는 공용 컷 사용'));
        }
      }
      actionSlots.append(actionGrid);scenes.append(actionSlots);
      const sceneList=node('div',undefined,'gc-list');for(const p of actionFiles)sceneList.append(pathRow(p,p.split('/').pop()));scenes.append(sceneList);card.append(scenes);
      const old=node('details');old.append(node('summary','이전 개별 장면 등록 · 현재 행동 화면과 연결 확인 필요'));
      const legacy=node('div',undefined,'gc-list');
      for(const key of c.legacyFields||[]){const p=c.refs[key];if(p)legacy.append(pathRow(p,key));}
      old.append(node('p','이 목록의 파일을 채워도 목욕·요리 등 일반 행동이 자동으로 이 경로를 읽지는 않습니다. 현재 행동 컷 경로와 연결을 맞춰야 합니다.','gc-note'),legacy);card.append(old);
      if((c.namedSceneAssets||[]).length){
        const named=node('details');named.append(node('summary','캐릭터 이름 폴더에 있는 장면 · '+c.namedSceneAssets.length+'개'));
        const namedList=node('div',undefined,'gc-list');for(const p of c.namedSceneAssets)namedList.append(pathRow(p,p.split('/').pop()));
        named.append(node('p','파일은 존재하지만 일반 행동에서 사용하는 번호별 컷과 경로가 다를 수 있습니다.','gc-note'),namedList);card.append(named);
      }
      const assets=node('details');assets.append(node('summary',(c.compatibilityAssets?'이 캐릭터의 사용 이미지':'이 번호의 물리 파일 전체')+' · '+c.assets.length+'개'));
      const assetList=node('div',undefined,'gc-list');for(const p of c.assets)assetList.append(pathRow(p,p.split('/').pop()));assets.append(assetList);card.append(assets);
      if((c.compatibilityAssets||[]).length){
        const aliases=node('details');aliases.append(node('summary','옛 저장 호환 경로 · '+c.compatibilityAssets.length+'개'));
        aliases.append(node('p','옛 파일은 저장된 이미지 주소를 위해 보존합니다. 새 그림을 교체할 때 이 주소도 함께 검토해야 하며 자동으로 연동되지는 않습니다.','gc-note'));
        for(const a of c.compatibilityAssets)aliases.append(pathRow(a.path,'옛 주소'),node('p','현재 기준: '+a.canonicalPath,'gc-note'));
        card.append(aliases);
      }
      list.append(card);
    }
    if(!rows.length)list.append(node('p','조건에 맞는 캐릭터가 없습니다.'));
    syncTags();
  }
  async function rescan(){
    if(busy)return;busy=true;refresh.disabled=true;message.textContent='WORK 이미지 파일을 다시 확인하고 있습니다.';
    try{
      const result=await api('index?rescan=1');
      files.clear();for(const f of result.index)files.set(normal(f.path),f.path);
      actionsById=collectActions();
      version=Date.now();message.textContent='이미지 파일 상태를 갱신했습니다. JSON 경로를 새로 등록한 경우에는 목록 재생성이 필요합니다.';
      render();
    }catch(e){message.textContent=e.message;}finally{busy=false;refresh.disabled=false;}
  }
  function download(){
    const snapshot={...data,files:Array.from(files.values()),checklistStatus:statusState,exportedAt:new Date().toISOString()};
    const escaped=JSON.stringify(snapshot).replace(/</g,'\\u003c');
    const html='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JO9 캐릭터 이미지 체크리스트</title><body><script>('+girlsChecklist.toString()+')('+escaped+');<\/script><\/body><\/html>';
    const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
    const a=node('a');a.href=url;a.download='JO9_캐릭터_이미지체크리스트.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const extra=node('details');extra.append(node('summary','JSON 연결 대상이 확인되지 않은 번호 폴더'));
  const extras=node('div',undefined,'gc-list');
  for(const g of data.unknownGroups||[]){extras.append(node('h4','번호 '+g.id));for(const p of g.paths)extras.append(node('p',p,'gc-path'));}
  extra.append(extras);root.append(extra,node('p','조사 기준 '+data.createdAt+' · QSP '+data.qspSha.slice(0,12)+' · 일반 EXE 플레이 화면 확인 전','gc-note'));
  refresh.onclick=rescan;save.onclick=download;
  searchGo.onclick=()=>{appliedSearch=search.value.trim().toLowerCase();page=0;render();};
  filter.onchange=sort.onchange=()=>{page=0;render();};images.onchange=render;
  namedOnly.onchange=()=>{if(namedOnly.checked)filter.value='all';page=0;render();};
  document.addEventListener('jo9:catalog-tab',e=>{if(e.detail==='girls'&&dirty)render();});
  render();
  if(live){refreshTags();const activeRefresh=()=>{if(!window.JO9_CATALOG_TABS||window.JO9_CATALOG_TABS.current()==='girls')refreshTags();};window.addEventListener('focus',activeRefresh);setInterval(activeRefresh,5000);}
})(window.JO9_GIRLS_CHECKLIST);
/* JO9 MOD END GIRLS_CHARACTER_CHECKLIST_20261104 */
