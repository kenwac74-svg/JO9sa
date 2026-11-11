/* Tab visibility changes only; iframe, files, canvases and dialogue drafts stay alive. */
(()=>{'use strict';
 const host=document.createElement('header');host.id='jo9-workshop-bar';host.setAttribute('aria-label','통합 WORKSHOP');
 const top=document.createElement('div');top.className='jo9-workshop-top';const title=document.createElement('strong');title.textContent='JO9 WORKSHOP · 2.4.0.0';top.append(title);
 const tabs=document.createElement('div');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','편집 도구');top.append(tabs);
 const controls=document.createElement('div');controls.className='jo9-workshop-controls';const status=document.createElement('span');status.id='jo9-live-status';status.setAttribute('role','status');status.textContent='SHOW HTML 감지를 기다립니다.';
 const followLabel=document.createElement('label'),follow=document.createElement('input');follow.type='checkbox';follow.checked=true;follow.id='jo9-follow-scene';followLabel.append(follow,document.createTextNode('현재 장면 따라가기'));
 const reload=document.createElement('button');reload.type='button';reload.textContent='감지 결과 갱신';controls.append(status,followLabel,reload);host.append(top,controls);
 const candidates=document.createElement('details');candidates.id='jo9-live-candidates';const summary=document.createElement('summary');summary.textContent='감지된 대사';candidates.append(summary);const text=document.createElement('p');text.id='jo9-live-text';candidates.append(text);const choices=document.createElement('div');choices.id='jo9-live-choices';candidates.append(choices);host.append(candidates);
 const panel=document.createElement('section');panel.id='jo9-image-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-label','이미지 교체');panel.hidden=true;
 const empty=document.createElement('p');empty.textContent='이미지 서버 연결을 기다립니다. 게임의 WORKSHOP 메뉴로 현재 화면을 감지해 주세요.';panel.append(empty);
 const frame=document.createElement('iframe');frame.id='jo9-image-frame';frame.title='이미지 교체기';frame.hidden=true;panel.append(frame);
 const style=document.createElement('style');style.textContent=`#jo9-workshop-bar{position:sticky;top:0;z-index:9999;background:#111a29;border:1px solid #41516b;border-radius:10px;padding:12px 16px;margin:0 0 12px;color:#edf4ff}#jo9-workshop-bar .jo9-workshop-top,#jo9-workshop-bar .jo9-workshop-controls{display:flex;align-items:center;gap:14px;flex-wrap:wrap}#jo9-workshop-bar .jo9-workshop-controls{margin-top:8px;font-size:13px}#jo9-workshop-bar button{padding:7px 14px;margin-right:6px;cursor:pointer}#jo9-workshop-bar [aria-selected=true]{background:#2d6972;border-color:#7cccc1;color:white}#jo9-live-status{flex:1;min-width:200px}#jo9-live-text{max-height:100px;overflow:auto;white-space:pre-wrap}#jo9-live-choices{display:flex;gap:6px;flex-wrap:wrap}#jo9-live-candidates>summary{margin-top:6px;cursor:pointer}#jo9-image-frame{width:100%;height:calc(100vh - 166px);min-height:500px;border:0;border-radius:8px;background:#182018}body.jo9-workshop-image>:not(#jo9-workshop-bar):not(#jo9-image-panel):not(script):not(style){display:none!important}#jo9-image-panel[hidden]{display:none!important}`;
 for(const child of document.body.children)if(!['SCRIPT','STYLE','LINK'].includes(child.tagName))child.setAttribute('data-jo9-dialogue','');document.head.append(style);document.body.prepend(host,panel);
 const buttons={},scrolls={image:0,dialogue:0};let active='dialogue',seen='',latest=null,busy=false,lastLoaded='',requestRunning=false;
 function tab(name){if(!['image','dialogue'].includes(name))name='dialogue';scrolls[active]=window.scrollY;active=name;document.body.classList.toggle('jo9-workshop-image',name==='image');panel.hidden=name!=='image';for(const [key,b]of Object.entries(buttons))b.setAttribute('aria-selected',String(key===name));try{sessionStorage.setItem('jo9-workshop-tab',name);}catch{}window.scrollTo(0,scrolls[name]);}
 for(const [name,label]of [['image','이미지 교체'],['dialogue','대사 편집']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('role','tab');b.onclick=()=>tab(name);tabs.append(b);buttons[name]=b;}
 function dirty(){return window.JO9_WORKSHOP_EDITOR?.dirty()||false;}
 async function load(candidate,explicit=false){if(busy)return;if(dirty()){status.textContent='작성 중인 수정문을 보존했습니다. 반영하거나 원문으로 되돌린 뒤 현재 장면을 불러오세요.';return;}
  busy=true;const snapshotId=latest.id;try{await window.JO9_WORKSHOP_EDITOR.ready;if(dirty()){status.textContent='작성 중인 수정문을 보존했습니다. 현재 장면을 불러오려면 작성 내용을 먼저 정리하세요.';return;}await window.JO9_WORKSHOP_EDITOR.load(candidate,snapshotId);lastLoaded=snapshotId;status.textContent='현재 장면 연결: '+candidate.selection.location+' · '+candidate.sceneTitle;if(explicit)tab('dialogue');}catch(e){status.textContent=e.message;}finally{busy=false;}
 }
 function show(s){latest=s;const url=s.imageWorkshopUrl;if(url&&/^\/workshop-image\/\?workshop_token=[a-f0-9]{48}$/.test(url)){if(frame.getAttribute('src')!==url)frame.src=url;frame.hidden=false;empty.hidden=true;}else{frame.hidden=true;empty.hidden=false;}
  text.textContent=s.text||s.referenceText||'';choices.replaceChildren();
  for(const c of s.candidates||[]){const b=document.createElement('button');b.type='button';b.textContent=c.selection.location+' · '+c.sceneTitle+' · '+c.selection.line+'행';b.onclick=()=>load(c,true);choices.append(b);}
  summary.textContent='감지된 대사 · '+(s.total??s.candidates?.length??0)+'개 후보';
  if(s.status!=='ok'){status.textContent=s.status==='detect_error'?'감지 오류: '+s.error:s.status==='snapshot_required'?'게임의 WORKSHOP 메뉴를 눌러 SHOW HTML을 다시 감지해 주세요.':'SHOW HTML 감지를 기다립니다.';return;}
  if(!s.candidates?.length){status.textContent='화면은 감지했으나 일치하는 편집 원문이 없습니다. 대사 탭에서 직접 검색할 수 있습니다.';return;}
  if(!s.confident){status.textContent=s.incomplete?'대사 후보가 많아 자동 선택하지 않습니다. 감지된 후보를 확인하거나 대사 탭에서 직접 검색하세요.':'현재 대사에 여러 장면이 연결됩니다. 감지된 대사에서 대상을 선택하세요.';return;}
  status.textContent=dirty()?'새 장면 감지됨 · 작성 중인 수정문을 보존했습니다.':'현재 장면 감지됨 · '+s.candidates[0].sceneTitle;
  if(follow.checked&&lastLoaded!==s.id&&!dirty())load(s.candidates[0]);
 }
 async function poll(force=false){if(requestRunning)return;requestRunning=true;try{const s=await window.JO9_WORKSHOP_EDITOR.api('/api/workshop/context'+(!force&&seen?'?since='+encodeURIComponent(seen):''));if(!s.unchanged){seen=s.id;show(s);}}catch(e){status.textContent='WORKSHOP 연결 확인: '+e.message;}finally{requestRunning=false;}}
 reload.onclick=()=>poll(true);follow.onchange=()=>{if(follow.checked&&latest?.confident)load(latest.candidates[0]);};
 let savedTab='dialogue';try{savedTab=sessionStorage.getItem('jo9-workshop-tab')||'dialogue';}catch{}tab(location.pathname==='/workshop'?'image':savedTab);
 window.JO9_UNIFIED_WORKSHOP={tab,poll,get active(){return active;},get snapshot(){return latest;}};
 poll();setInterval(poll,1000);
})();
