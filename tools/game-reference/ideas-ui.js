(function(){
 'use strict';
 const $=id=>document.getElementById(id),panel=$('ideas-panel'),model=window.JO9ReferenceIdeas,clients=window.JO9ReferenceIdeasClient;
 const names={traits:'특성',items:'아이템',spells:'마법'},fields=['kind',...model.fields];
 let adapter;
 try{adapter=location.protocol==='file:'?clients.offlineAdapter(window.localStorage):clients.httpAdapter(window.fetch.bind(window));}
 catch(e){$('idea-message').textContent='브라우저 저장을 사용할 수 없습니다: '+e.message;return;}
 let state={items:[],revision:null},loaded=false,busy=false,editingId=null,clean='',deleteArmed=false;
 function draft(){return Object.fromEntries(fields.map(key=>[key,$('idea-'+key).value]));}
 const dirty=()=>JSON.stringify(draft())!==clean;
 function message(text,error=false){$('idea-message').textContent=text;$('idea-message').classList.toggle('error',error);}
 function resetDelete(){deleteArmed=false;$('idea-delete').textContent='삭제';}
 function setBusy(value){busy=value;for(const el of panel.querySelectorAll('button,input,select,textarea'))el.disabled=value;$('idea-save').disabled=value||!loaded;$('idea-delete').disabled=value||!editingId;$('idea-save').textContent=value?'처리 중…':'아이디어 저장';}
 function setForm(item){
  editingId=item?.id||null;for(const key of fields)$('idea-'+key).value=item?.[key]??(key==='kind'?'traits':'');
  clean=JSON.stringify(draft());resetDelete();$('idea-editor-title').textContent=item?'아이디어 수정':'새 아이디어';$('idea-delete').disabled=!editingId||busy;
 }
 function mayDiscard(){return !dirty()||window.confirm('작성 중인 수정 내용이 있습니다. 저장하지 않고 바꾸시겠습니까?');}
 function renderList(){
  const words=$('idea-search').value.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean),kind=$('idea-filter').value;
  const rows=state.items.filter(item=>(!kind||item.kind===kind)&&words.every(word=>[item.title,item.description,item.effect,item.condition,item.cost,item.notes].join(' ').normalize('NFKC').toLowerCase().includes(word))).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))||a.title.localeCompare(b.title,'ko'));
  const list=$('idea-list');list.replaceChildren();
  for(const item of rows){
   const button=document.createElement('button');button.type='button';button.className='idea-entry';button.disabled=busy;button.setAttribute('aria-current',String(item.id===editingId));
   button.appendChild(document.createElement('strong')).textContent=item.title;
   button.appendChild(document.createElement('span')).textContent=names[item.kind]+' · '+(item.description||item.effect||item.notes||'내용을 추가하세요.').slice(0,90);
   button.addEventListener('click',()=>{if(busy||!mayDiscard())return;setForm(item);renderList();message('저장된 아이디어를 불러왔습니다.');});list.appendChild(button);
  }
  if(!rows.length){const p=document.createElement('p');p.className='coverage';p.textContent=state.items.length?'검색 조건에 맞는 아이디어가 없습니다.':'새 아이디어를 작성하고 저장하세요.';list.appendChild(p);}
  $('idea-count').textContent=rows.length+'개 표시 / 전체 '+state.items.length+'개';$('ideas-tab').querySelector('span').textContent=state.items.length;
 }
 function accept(value){state=value;loaded=true;renderList();$('idea-storage').textContent=adapter.mode==='server'?'개인 파일 저장 · '+value.storagePath:'브라우저 저장 · JSON 백업으로 다른 브라우저에 옮길 수 있습니다.';}
 async function perform(fn){
  if(busy)return;setBusy(true);
  try{await fn();}
  catch(e){if(e.status===409){try{accept(await adapter.read());}catch(readError){message(readError.message,true);return;}}message(e.message||'저장하지 못했습니다. 입력을 유지했습니다.',true);}
  finally{setBusy(false);}
 }
 $('idea-form').addEventListener('submit',event=>{
  event.preventDefault();if(!loaded)return;
  perform(async()=>{const value=draft();model.makeItem(value,{id:editingId||'new'});const beforeIds=new Set(state.items.map(x=>x.id));const result=await adapter.upsert(state.revision,{...value,...(editingId?{id:editingId}:{})});accept(result);const saved=editingId?state.items.find(x=>x.id===editingId):state.items.find(x=>!beforeIds.has(x.id));setForm(saved);renderList();message('저장했습니다.');});
 });
 $('idea-new').addEventListener('click',()=>{if(busy||!mayDiscard())return;setForm(null);renderList();message('새 아이디어를 작성하세요.');$('idea-title').focus();});
 $('idea-cancel').addEventListener('click',()=>{if(busy||!mayDiscard())return;setForm(state.items.find(x=>x.id===editingId)||null);renderList();message('저장된 내용으로 돌아갔습니다.');});
 $('idea-delete').addEventListener('click',()=>{
  if(busy||!editingId)return;
  if(!deleteArmed){deleteArmed=true;$('idea-delete').textContent='삭제 확인';message('이 아이디어와 작성 중인 수정 내용을 삭제하려면 ‘삭제 확인’을 누르세요.');return;}
  perform(async()=>{accept(await adapter.remove(state.revision,editingId));setForm(null);renderList();message('아이디어를 삭제했습니다.');});
 });
 $('idea-reload').addEventListener('click',()=>perform(async()=>{accept(await adapter.read());message('최신 목록을 불러왔습니다. 작성 중인 내용은 유지했습니다.');}));
 $('idea-search').addEventListener('input',renderList);$('idea-filter').addEventListener('change',renderList);
 $('idea-form').addEventListener('input',()=>{resetDelete();message(dirty()?'작성 중인 변경이 있습니다. ‘아이디어 저장’을 눌러 보관하세요.':'저장된 내용과 같습니다.');});
 $('idea-export').addEventListener('click',()=>perform(async()=>{
  accept(await adapter.read());const data={schema:1,items:state.items},blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());a.href=url;a.download='JO9_개인아이디어_'+date+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('개인 아이디어 JSON 백업을 내보냈습니다.');
 }));
 $('idea-import').addEventListener('click',()=>{if(!busy&&loaded)$('idea-file').click();});
 $('idea-file').addEventListener('change',()=>{const file=$('idea-file').files[0];if(!file)return;perform(async()=>{const value=model.document(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));const result=await adapter.import(state.revision,value);accept(result);message(result.added+'개 추가 · 기존 ID '+result.skipped+'개 유지. 작성 중인 내용은 그대로입니다.');});$('idea-file').value='';});
 window.addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue='';}});
 setForm(null);perform(async()=>{accept(await adapter.read());message('아이디어를 작성하고 저장할 수 있습니다.');});
}());
