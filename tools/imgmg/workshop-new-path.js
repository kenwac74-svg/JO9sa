// JO9 MOD START WORKSHOP_NEW_IMAGE_PATH_20261108
// New destinations share the existing encoder and PIC writer, but never basename-match.
function newImageSegment(name){
 if(typeof name!=='string'||!name||/[\\/<>:"|?*\x00-\x1f]/.test(name)||/[. ]$/.test(name)||name==='.'||name==='..'||/^(?:_|backup)/i.test(name)||/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))throw Error('폴더·파일 이름을 확인하세요: '+name);
 return name;
}
function newImageDestination(folder,name){
 if(typeof folder!=='string')throw Error('저장 폴더를 선택하세요.');
 const parts=folder?folder.split('/').map(newImageSegment):[];
 newImageSegment(name);
 const file=/\.png$/i.test(name)?name:name.replace(/\.[^.]+$/,'')+'.png';
 newImageSegment(file);return 'content/pic/'+[...parts,file].join('/');
}
let newPathSource=null,newPathFolder='',newPathLoading=false;
const newPathVirtualFolders=new Set();
function ensureNewPathDialog(){
 if($('newpathdialog'))return;
 $('wsdialog').insertAdjacentHTML('beforeend',`<dialog id="newpathdialog" aria-label="새 이미지 저장 폴더 선택"><div class="dialoghead"><h2>새 경로 추가 · 폴더 선택</h2><button id="newpathclose" type="button">취소</button></div><p>파일명은 투입한 이미지 이름을 사용합니다. 저장 형식은 PNG입니다.</p><p class="path" id="newpathfilename"></p><p class="path" id="newpathfolder"></p><button id="newpathparent" type="button">상위 폴더</button><div id="newpathfolders" class="targets" style="margin:12px 0;max-height:36vh"></div><label class="small">선택한 폴더 안에 새 하위 폴더 추가<input id="newpathchild" placeholder="새 폴더 이름" style="width:100%"></label><button id="newpathmkdir" type="button">하위 폴더 추가</button><p class="small">새 폴더는 이미지 저장 시 함께 생성됩니다.</p><p class="path" id="newpathpreview"></p><p class="bad" id="newpatherror" role="status"></p><div class="dialogfooter"><button id="newpathchoose" class="primary" type="button">이 폴더 선택</button></div></dialog>`);
 $('newpathclose').onclick=()=>{$('newpathdialog').close();render();};
 $('newpathparent').onclick=()=>browseNewImageFolder(newPathFolder.split('/').slice(0,-1).join('/'));
 $('newpathfolders').onclick=e=>{const b=e.target.closest('button[data-new-folder]');if(b&&!newPathLoading)browseNewImageFolder(b.dataset.newFolder);};
 $('newpathmkdir').onclick=async()=>{if(newPathLoading)return;try{const name=newImageSegment($('newpathchild').value),next=[newPathFolder,name].filter(Boolean).join('/');newPathVirtualFolders.add(next);$('newpathchild').value='';await browseNewImageFolder(next);}catch(e){$('newpatherror').textContent=e.message;}};
 $('newpathchoose').onclick=async()=>{if(newPathLoading||S.busy||!newPathSource)return;$('newpathchoose').disabled=true;try{
  const s=S.inputs.find(x=>x.id===newPathSource.id);if(!s)throw Error('투입 이미지가 변경됐습니다. 다시 선택하세요.');
  const destination=newImageDestination(newPathFolder,s.file.name),rel=relPicPath(destination);
  try{await C.read(S.root,rel);throw Error('이미 같은 이름의 파일이 있습니다. 다른 폴더 또는 새 이름의 이미지를 선택하세요.');}catch(e){if(e.name!=='NotFoundError')throw e;}
  s.newPathMode=true;s.newFolder=newPathFolder;s.mappedPath=destination;s.faceCrop=null;s.faceDeferred=false;
  await rebuild();$('newpathdialog').close();msg('새 파일 저장 대상: '+destination+' · 규격 맞추기 후 새 파일로 저장하세요.');
 }catch(e){$('newpatherror').textContent=e.message;}finally{$('newpathchoose').disabled=false;}};
 $('newpathdialog').addEventListener('close',()=>render());
}
async function newImageFolderHandle(folder){
 let dir=S.root;
 try{for(const part of folder?folder.split('/'):[])dir=await dir.getDirectoryHandle(part);return dir;}catch(e){if(e.name==='NotFoundError'&&newPathVirtualFolders.has(folder))return null;throw e;}
}
async function browseNewImageFolder(folder){
 if(newPathLoading)return;newPathLoading=true;
 $('newpathchoose').disabled=true;$('newpathmkdir').disabled=true;$('newpathparent').disabled=true;
 try{
  if(folder)folder.split('/').forEach(newImageSegment);
  const dir=await newImageFolderHandle(folder),children=new Set();
  if(dir)for await(const [name,entry]of dir.entries())if(entry.kind==='directory'){try{newImageSegment(name);children.add(name);}catch{}}
  for(const p of newPathVirtualFolders){const parts=p.split('/');if(parts.slice(0,-1).join('/')===folder)children.add(parts.at(-1));}
  newPathFolder=folder;$('newpathfolder').textContent='선택 폴더: content/pic'+(folder?'/'+folder:'');
  $('newpathpreview').textContent='저장 예정: '+newImageDestination(folder,newPathSource.file.name);
  $('newpathfolders').innerHTML=[...children].sort((a,b)=>a.localeCompare(b)).map(name=>'<button type="button" data-new-folder="'+esc([folder,name].filter(Boolean).join('/'))+'">📁 '+esc(name)+'</button>').join('')||'<p class="small">하위 폴더가 없습니다. 이 폴더를 선택하거나 새 하위 폴더를 추가하세요.</p>';
  $('newpatherror').textContent='';$('newpathchoose').disabled=false;$('newpathmkdir').disabled=false;
 }catch(e){$('newpatherror').textContent=e.message;}finally{newPathLoading=false;$('newpathparent').disabled=!newPathFolder;}
}
async function openNewImagePath(s){
 if(!S.root)throw Error('PIC 폴더를 먼저 연결하세요.');
 ensureNewPathDialog();newPathSource=s;
 $('newpathfilename').textContent='파일명: '+newImageDestination('',s.file.name).split('/').pop();
 $('newpathdialog').showModal();
 let start=s.newPathMode?s.newFolder||'':relPicPath(s.mappedPath||'').split('/').slice(0,-1).join('/');
 try{await newImageFolderHandle(start);}catch{start='';}
 await browseNewImageFolder(start);
}
const newPathBaseTargets=sourceTargets;
sourceTargets=function(s){if(s.newPathMode||s.exactNewPath)return s.mappedPath?[{path:relPicPath(s.mappedPath),name:s.mappedPath.split('/').pop()}]:[];return newPathBaseTargets(s);};
const newPathBaseSelect=selectTarget;
selectTarget=async function(row,p){
 const s=S.inputs.find(x=>x.id===row.inputId);if(!s?.newPathMode){row.newFile=false;return newPathBaseSelect(row,p);}
 revoke(row);row.error='';row.target=p;row.meta=null;row.newFile=true;
 if(row.targetUrl)URL.revokeObjectURL(row.targetUrl);row.targetUrl=null;
 try{
  try{await C.describe(S.root,p);throw Error('이미 같은 이름의 파일이 있습니다. 새 경로를 다시 선택하세요.');}catch(e){if(e.name!=='NotFoundError')throw e;}
  row.meta=await missingMeta(row,p);row.cap=outputCap(row.meta);row.options={...defaults(row.meta),frame:false};
 }catch(e){row.error=e.message;}render();
};
const newPathBaseSourceCard=sourceCardHtml;
sourceCardHtml=function(s){
 let html=newPathBaseSourceCard(s);if(s.cutPlan||s.editCut)return html;
 html=html.replace('</select>','<option value="__new_path__" '+(s.newPathMode?'selected':'')+'>＋ 새 경로 추가 · 폴더 선택</option></select>');
 if(s.newPathMode){
  html=html.replace('<div class="warn small">교체 대상을 선택해야 합니다.</div>','<div class="small">새 파일: <b>'+esc(s.mappedPath.split('/').pop())+'</b><br>'+esc(s.mappedPath)+'</div>');
  html=html.replace(/<div class="variation-note">관련 베리에이션 .*?<\/div>/,'<div class="variation-note">새 파일 1개 · 기존 이미지 교체 없음</div>');
  html=html.replace('<button data-action="remove-source"','<button data-action="new-path-folder" '+(S.busy?'disabled':'')+'>저장 폴더 변경</button><button data-action="remove-source"');
 }return html;
};
const newPathBaseTargetCard=targetCardHtml;
targetCardHtml=function(r,dup){let html=newPathBaseTargetCard(r,dup);if(!r.newFile)return html;return html.replace('이 파일 교체','새 파일 저장 대상').replace(/원본 폴더에 파일이 없습니다\.[\s\S]*?원본 테두리 복원 불가/,'선택한 새 경로에 저장 · '+r.meta?.width+'×'+r.meta?.height).replace('<span>대상 없음</span>','<span>새 파일</span>');};
function completeNewPathRows(rows){
 for(const r of rows.filter(r=>r.newFile)){
  const s=S.inputs.find(x=>x.id===r.inputId),full='content/pic/'+r.target;
  if(s){s.newPathMode=false;s.exactNewPath=true;}
  if(!S.index.some(x=>C.norm(x.path)===C.norm(r.target)))S.index.push({path:r.target,name:r.target.split('/').pop()});
  if(!ScreenContext.resources.some(x=>C.norm(x.path)===C.norm(full)))ScreenContext.resources.push({path:full,file:r.target.split('/').pop(),folder:r.target.split('/').slice(0,-1).join('/'),width:r.meta.width,height:r.meta.height});
  SelectedScreenPaths.add(full);
 }
}
// JO9 MOD END WORKSHOP_NEW_IMAGE_PATH_20261108
