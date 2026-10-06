/* 체크리스트와 이미지 교체기가 함께 사용하는 PIC 연결. */
(function(){
 'use strict';
 const ui=id=>document.getElementById(id),listeners=new Set();
 const state={root:null,index:[],ready:false,busy:false,phase:'idle',message:'PIC 폴더를 한 번 등록하면 교체기가 같은 연결을 사용합니다.',error:false};
 const cacheKey='pic:file:///'+String(window.MR||'G:/somi/JO9/game').replace(/\\/g,'/').replace(/\/$/,'')+'/';
 let saved=null,generation=0;
 function paint(){
  const status=ui('catalogPicStatus');
  if(status){status.textContent=state.message;status.style.color=state.error?'#ffb7a7':state.ready?'#b6d5a6':'#eff1e9';}
  for(const id of ['catalogPicConnect','catalogPicChoose','catalogPicRescan'])if(ui(id))ui(id).disabled=state.busy||(id==='catalogPicRescan'&&!state.root);
  if(ui('catalogPicConnect'))ui('catalogPicConnect').textContent=state.ready?'PIC 연결 확인':saved?'저장된 PIC 연결':'PIC 폴더 등록';
  for(const fn of listeners){try{fn(state)}catch(e){console.error('PIC 연결 화면 갱신 오류',e)}}
 }
 function update(changes){Object.assign(state,changes);paint()}
 function bounded(p,label,ms=30000){return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error(label+' 응답이 없습니다. 다시 등록해 주세요.')),ms);
  Promise.resolve(p).then(v=>{clearTimeout(timer);resolve(v)},e=>{clearTimeout(timer);reject(e)})
 })}
 function store(mode,value){return new Promise((resolve,reject)=>{
  let req,db,tx,done=false;
  const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);if(error&&tx)try{tx.abort()}catch{};if(db)db.close();error?reject(error):resolve(result)};
  const timer=setTimeout(()=>finish(Error('PIC 목록 저장소가 응답하지 않습니다.')),5000);
  try{
   req=indexedDB.open('jo9-catalog-pic',1);
   req.onblocked=()=>finish(Error('PIC 목록 저장소가 다른 창에서 잠겨 있습니다.'));
   req.onerror=()=>finish(req.error||Error('PIC 목록 저장소를 열지 못했습니다.'));
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('folders'))req.result.createObjectStore('folders')};
   req.onsuccess=()=>{
    db=req.result;if(done){db.close();return;}
    db.onversionchange=()=>db.close();
    try{
     tx=db.transaction('folders',mode);const table=tx.objectStore('folders');
     const request=mode==='readonly'?table.get(cacheKey):table.put(value,cacheKey);let result;
     request.onsuccess=()=>result=request.result;
     request.onerror=()=>finish(request.error||Error('PIC 목록 저장소 작업 실패'));
     tx.oncomplete=()=>finish(null,result);
     tx.onabort=tx.onerror=()=>finish(tx.error||Error('PIC 목록 저장소 작업 중단'));
    }catch(e){finish(e)}
   };
  }catch(e){finish(e)}
 })}
 function cached(value){
  if(!value?.root||value.root.name?.toLowerCase()!=='pic'||!Array.isArray(value.index)||!value.index.length)return null;
  const index=[];
  for(const item of value.index){
   const path=item?.path;
   if(typeof path!=='string'||/[\\:]/.test(path)||path.split('/').some(p=>!p||p==='.'||p==='..')||!/\.png$/i.test(path))return null;
   index.push({path,name:path.split('/').pop()});
  }
  return {root:value.root,index};
 }
 async function scan(root){
  const index=[];let folders=0,entries=0;
  async function walk(dir,prefix=''){
   update({message:'PIC 전체 검색 · PNG '+index.length.toLocaleString()+'개 · '+(prefix||'pic')});
   const iterator=dir.entries()[Symbol.asyncIterator]();
   for(;;){
    const next=await bounded(iterator.next(),prefix||'pic');if(next.done)break;
    const [name,handle]=next.value;
    if(handle.kind==='directory'){
     if(/^_JO9|^__JO9|^\.git$|backup/i.test(name))continue;
     folders++;await walk(handle,prefix+name+'/');
    }else if(/\.png$/i.test(name))index.push({path:prefix+name,name});
    if(++entries%200===0){update({message:'PIC 전체 검색 · PNG '+index.length.toLocaleString()+'개 · '+folders+'개 폴더'});await new Promise(r=>setTimeout(r,0))}
   }
  }
  await walk(root);
  if(!index.length)throw Error('선택한 PIC 폴더에서 PNG를 찾지 못했습니다.');
  return index.sort((a,b)=>a.path.localeCompare(b.path));
 }
 function complete(root,index,text){
  saved={root,index};
  update({root,index,ready:true,busy:false,phase:'ready',error:false,message:'PIC 연결 완료 · PNG '+index.length.toLocaleString()+'개 · '+text});
 }
 async function connect(options={}){
  if(state.busy)return;
  if(window.JO9WS?.state?.busy){update({message:'이미지 교체 작업이 끝난 뒤 PIC 연결을 변경하세요.',error:true});return;}
  const run=++generation;
  update({busy:true,phase:'selecting',error:false,message:'PIC 폴더 선택 또는 권한 승인 대기…'});
  let root,index;
  try{
   if(window.JO9_LOCAL_PIC){const found=await bounded(window.JO9_LOCAL_PIC.connect(options.rescan),'로컬 PIC 연결');complete(found.root,found.index,'로컬 서버에서 연결 · 폴더 권한창 없이 작업합니다.');return;}
   if(location.protocol==='http:'&&location.hostname==='127.0.0.1')throw Error('로컬 PIC 연결 모듈이 준비되지 않았습니다. 체크리스트를 새로고침해 주세요.');
   const previous=options.choose?null:state.root?{root:state.root,index:state.index}:saved;
   // 저장소를 기다리지 않고 클릭 안에서 바로 선택기/권한 요청을 호출한다.
   if(previous){
    root=previous.root;
    if(await bounded(root.requestPermission({mode:'readwrite'}),'PIC 폴더 권한')!=='granted')throw Error('PIC 폴더 권한이 거부됐습니다. 「폴더 다시 선택」으로 등록하세요.');
    if(!options.rescan)index=previous.index;
   }else{
    if(!window.showDirectoryPicker)throw Error('이 브라우저는 폴더 연결을 지원하지 않습니다.');
    root=await window.showDirectoryPicker({id:'jo9-pic',mode:'readwrite'});
   }
   if(root.name?.toLowerCase()!=='pic')throw Error('game/content/pic 폴더 자체를 선택하세요.');
   update({phase:'checking',message:'PIC 폴더 선택 완료 · 경로 확인 중…'});
   await bounded(root.getDirectoryHandle('bg'),'PIC의 bg 폴더');
   if(!index){update({phase:'scanning'});index=await scan(root)}
   complete(root,index,'교체기가 이 연결을 함께 사용합니다.');
   // 저장 실패가 연결 완료와 버튼 복귀를 막지 않도록 별도로 저장한다.
   store('readwrite',{root,index,savedAt:Date.now()}).then(()=>{
    if(run===generation&&state.root===root)update({message:'PIC 연결 완료 · PNG '+index.length.toLocaleString()+'개 · 다음에도 이 목록을 재사용합니다.'})
   }).catch(()=>{
    if(run===generation&&state.root===root)update({message:'PIC 연결 완료 · PNG '+index.length.toLocaleString()+'개 · 이번 창에서 기억합니다. 브라우저가 영구 저장을 완료하지 못했습니다.'})
   });
  }catch(e){
   update({busy:false,phase:state.ready?'ready':'error',error:e.name!=='AbortError',message:e.name==='AbortError'?'폴더 선택 취소 · 기존 연결을 유지합니다.':'PIC 연결 실패: '+(e.message||String(e))});
  }
 }
 window.JO9PIC={state,connect,rescan:()=>connect({rescan:true}),subscribe(fn){listeners.add(fn);fn(state);return()=>listeners.delete(fn)}};
 if(ui('catalogPicConnect'))ui('catalogPicConnect').onclick=()=>connect();
 if(ui('catalogPicChoose'))ui('catalogPicChoose').onclick=()=>connect({choose:true});
 if(ui('catalogPicRescan'))ui('catalogPicRescan').onclick=()=>connect({rescan:true});
 paint();
 const restoreGeneration=generation;
 if(window.JO9_LOCAL_PIC){connect();return;}
 store('readonly').then(async value=>{
  const found=cached(value);if(!found||generation!==restoreGeneration)return;
  saved=found;paint();
  const permission=await bounded(found.root.queryPermission({mode:'readwrite'}),'저장된 PIC 권한',5000);
  if(generation!==restoreGeneration)return;
  if(permission==='granted')complete(found.root,found.index,'저장된 전체 목록 복원 · 파일이 바뀌면 전체 다시 읽기를 누르세요.');
  else update({message:'저장된 PIC 전체 목록이 있습니다. 「저장된 PIC 연결」을 눌러 권한을 승인하세요.'});
 }).catch(()=>{if(generation===restoreGeneration&&!state.ready&&!state.busy)update({message:'PIC 폴더를 등록하세요. 저장소가 응답하지 않아도 폴더 연결은 가능합니다.'})});
})();
