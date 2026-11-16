/* JO9 MOD GAME_RESOURCE_SOURCE_20261115 — plugin for the existing image workshop. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.install(root);})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 function matches(index,query){
  const q=String(query||'').trim().toLowerCase(),rank=p=>/^girls\/face\//i.test(p)?0:/^(characters|girls\/full)\//i.test(p)?1:2;
  return index.filter(f=>/\.(png|jpe?g|webp)$/i.test(f.path)&&(!q||f.path.toLowerCase().includes(q))).sort((a,b)=>rank(a.path)-rank(b.path)||a.path.localeCompare(b.path));
 }
 function install(win){
  const doc=win.document;let installed=false;
  const observer=new MutationObserver(()=>mount());observer.observe(doc.documentElement,{childList:true,subtree:true});mount();
  function mount(){
   if(installed)return;const api=win.JO9Workshop,folder=doc.querySelector('#wsdialog #pickfolder')||doc.getElementById('pickfolder');if(!api||!folder)return;
   installed=true;observer.disconnect();const host=folder.closest('#wsdialog')||doc.body;
   const button=doc.createElement('button');button.id='pickgamesource';button.setAttribute('data-lock','');button.textContent='게임 이미지 사용';button.title='현재 PIC 폴더의 초상·전신 등을 교체 소스로 선택합니다.';folder.after(button);
   const dialog=doc.createElement('dialog');dialog.id='gamesourcedialog';dialog.style.cssText='width:min(900px,94vw);max-height:88vh;overflow:auto;padding:18px;background:var(--panel,#232924);color:var(--fg,#eff1e9);border:1px solid var(--line,#414b42);border-radius:10px';
   dialog.innerHTML='<h2>게임 이미지 소스로 선택</h2><p>같은 이름의 초상·전신 등을 찾아 교체 소스로 사용합니다.</p><div style="display:flex;gap:8px"><input id="gamesourcequery" aria-label="게임 이미지 검색어" placeholder="파일명 또는 폴더 검색" style="flex:1"><button type="button" id="gamesourcesearch">검색</button><button type="button" id="gamesourceclose">닫기</button></div><p id="gamesourcestatus" role="status"></p><div style="display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:14px"><div id="gamesourcelist" style="max-height:48vh;overflow:auto"></div><div><img id="gamesourcepreview" alt="선택한 게임 이미지" style="display:none;width:100%;max-height:280px;object-fit:contain"><p id="gamesourcepath" style="overflow-wrap:anywhere"></p><button type="button" id="gamesourceuse" disabled>이 이미지를 소스로 넣기</button></div></div>';
   host.append(dialog);const $=id=>dialog.querySelector('#'+id);let chosen=null,url=null,sequence=0;
   function clear(){sequence++;chosen=null;$('gamesourceuse').disabled=true;$('gamesourcepreview').style.display='none';if(url){URL.revokeObjectURL(url);url=null;}}
   async function select(path){const seq=++sequence;chosen=null;$('gamesourceuse').disabled=true;$('gamesourcestatus').textContent='이미지를 읽는 중…';try{
    let dir=api.state.root;const parts=path.split('/');for(const part of parts.slice(0,-1))dir=await dir.getDirectoryHandle(part);
    const file=await(await dir.getFileHandle(parts.at(-1))).getFile();if(seq!==sequence)return;
    if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(file);chosen={path,file};$('gamesourcepreview').src=url;$('gamesourcepreview').style.display='block';$('gamesourcepath').textContent=path;$('gamesourceuse').disabled=false;$('gamesourcestatus').textContent='소스로 사용할 이미지를 확인하세요.';
   }catch(error){if(seq===sequence)$('gamesourcestatus').textContent=error.message;}}
   function search(){clear();const files=matches(api.state.index,$('gamesourcequery').value);$('gamesourcelist').replaceChildren();$('gamesourcestatus').textContent=files.length+'개 후보'+(files.length>100?' · 앞 100개 표시. 검색어를 좁혀 주세요.':'');for(const file of files.slice(0,100)){const b=doc.createElement('button');b.type='button';b.style.cssText='display:block;width:100%;text-align:left;margin:4px 0;overflow-wrap:anywhere';b.textContent=file.path;b.onclick=()=>select(file.path);$('gamesourcelist').append(b);}}
   button.onclick=()=>{if(api.state.busy)return;dialog.showModal();if(!api.state.root){$('gamesourcestatus').textContent='PIC 폴더를 먼저 연결하세요.';return;}
    const resource=api.screen?.resources?.[0],name=resource?.file||resource?.path?.replaceAll('\\','/').split('/').pop()||'';$('gamesourcequery').value=name.replace(/\.[^.]+$/,'').replace(/_(gray|sepia|ava)$/i,'');search();};
   $('gamesourcesearch').onclick=search;$('gamesourcequery').onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();search();}};
   $('gamesourceclose').onclick=()=>dialog.close();dialog.addEventListener('close',clear);
   $('gamesourceuse').onclick=async()=>{if(!chosen||api.state.busy)return;const pick=chosen;dialog.close();try{await api.add([{file:pick.file,relative:'game/'+pick.path}]);}catch(error){console.error('게임 이미지 추가:',error);}};
  }
 }
 return{matches,install};
});
