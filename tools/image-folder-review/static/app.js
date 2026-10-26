'use strict';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => Number(value || 0).toLocaleString('ko-KR');
const labels = {original:'원본 유지',comparison:'비교본 유지',defer:'보류',unreviewed:'미검토',mixed:'혼합 선택',review:'재검토 필요'};
const state = {token:'',pid:'',data:null,page:1,saving:false,scanning:false,sequence:0,signature:'',viewerRow:null,polling:false,groupLimits:{}};
const filterIds = ['comparison-only','original-only','hash-different','hash-same'];
const hashLabels = {same:'해시 일치',different:'해시 불일치',pending:'해시 확인 중',error:'해시 확인 오류'};
function resetFilters() {for(const id of filterIds)$(id).value='all';$('review-filter').value='all';$('search').value='';}
function hashBadge(row) {return hashLabels[row.hash_status]?`<span class="hash-badge hash-${row.hash_status}">${hashLabels[row.hash_status]}</span>`:'';}

async function api(path, body) {
  const response = await fetch(path, body === undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json','X-Review-Token':state.token},body:JSON.stringify(body)});
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error?.message || '요청을 처리하지 못했습니다.');
  return data;
}
function notice(message, error=false, target='notice') {
  const element=$(target); element.hidden=!message; element.textContent=message || ''; element.classList.toggle('error',error);
}
function saveState(kind, message) {$('save-state').dataset.state=kind;$('save-state').textContent=message;}
function asset(file, original=false) {return `/asset/${state.pid}/${file.id}?mode=${original?'original':'thumb'}&v=${state.data?.project.scan.scanned_at || 0}`;}
function fullPath(file) {return state.data.project[file.side+'_root'].replace(/[\\/]$/,'')+'/'+file.relative_path;}
function findRow(id) {return state.data?.groups.flatMap(g=>g.rows).find(r=>r.id===id);}
function metadata(file) {
  const t=file.thumbnail || {};
  if(t.error)return '읽기 오류 · '+t.error;
  const dimensions=t.width?`${number(t.width)} × ${number(t.height)} · `:'';
  const bytes=file.size >= 1048576 ? (file.size/1048576).toFixed(1)+' MB' : Math.max(1,Math.round(file.size/1024))+' KB';
  return dimensions+bytes+(t.frames>1?' · 대표 첫 프레임':'')+(!t.width?' · 썸네일 준비 중':'');
}
function choices(row, group=false) {
  const scope=group?'group':'row';
  return `<div class="choices ${group?'group-decisions':'row-decisions'}">${['original','comparison','defer'].map(choice=>{
    const checked=group?row.decision_summary===choice:row.decision===choice;
    const disabled=state.saving || state.scanning || (!group && choice!=='defer' && !row[choice]);
    return `<label class="choice"><input type="checkbox" value="${choice}" data-scope="${scope}" data-id="${esc(row.id)}" ${checked?'checked':''} ${disabled?'disabled':''} aria-label="${group?'표시된 항목 전체 ':''}${labels[choice]}">${labels[choice]}</label>`;
  }).join('')}</div>`;
}
function fileSide(row, side) {
  const f=row[side];
  const heading=`<div class="side-heading"><i class="side-dot ${side}-dot"></i>${side==='original'?'원본':'비교본'}</div>`;
  if(!f)return `<div class="image-side">${heading}<div class="missing">파일 없음</div><div class="file-label">이쪽 폴더에는 대응 파일이 없습니다.</div></div>`;
  return `<div class="image-side">${heading}<button class="thumb" data-open-row="${esc(row.id)}" aria-label="${esc(f.relative_path)} 확대 비교"><img class="thumbnail" loading="lazy" decoding="async" data-file-id="${f.id}" data-request-sha="${f.thumbnail?.sha256 || ''}" src="${asset(f)}" alt="${esc(f.relative_path)}"></button><div class="file-label ${row.hash_status==='different'?'hash-different':''}" title="${esc(fullPath(f))}">${esc(f.relative_path)}</div><div class="image-meta ${f.thumbnail?.error?'error':''}" data-file="${esc(f.id)}">${esc(metadata(f))}</div></div>`;
}
function renderGroups() {
  const groups=state.data.groups;
  $('groups').innerHTML=groups.length?groups.map(g=>{
    const shown=g.rows.slice(0,state.groupLimits[g.id] || 20), remaining=g.rows.length-shown.length;
    return `<article class="group" data-name="${esc(g.name)}" data-dir="${esc(g.relative_dir)}"><div class="group-heading"><div class="group-title">${g.relative_dir?`<span class="subdir">${esc(g.relative_dir)}</span>`:''}<h2>${esc(g.name)}<span class="group-state ${g.decision_summary}">${labels[g.decision_summary] || '미검토'}</span></h2></div><div class="group-actions"><span class="group-count">표시 ${number(g.rows.length)} / 전체 ${number(g.total_rows)}개</span>${choices(g,true)}</div></div>${shown.map(r=>`<section class="pair-row" data-row="${r.id}" data-variant="${esc(r.variant_key)}"><div class="row-heading"><div><span class="variant-label">${esc(r.variant_key || '기본 파일')}</span>${hashBadge(r)}${r.review_required?'<span class="review-badge">파일 또는 대조 쌍이 바뀌었습니다 · 재검토</span>':''}</div>${choices(r)}</div><div class="image-pair">${fileSide(r,'original')}${fileSide(r,'comparison')}</div></section>`).join('')}${remaining?`<div class="group-more"><span>${number(shown.length)} / ${number(g.rows.length)}개 표시 · 그룹 선택은 필터에 맞는 항목 전체에 적용됩니다.</span><button data-more="${g.id}">${number(Math.min(20,remaining))}개 더 보기</button></div>`:''}</article>`;
  }).join(''):'<div class="no-results">조건에 맞는 그룹이 없습니다.</div>';
  if($('viewer').open)updateViewerChoices();
}
function updateHeader() {
  const p=state.data.project, s=p.stats, t=state.data.thumbnails;
  $('review-workspace').hidden=false; $('empty').hidden=true;
  $('project-roots').hidden=false;
  $('project-roots').innerHTML=`<div class="root-path"><strong>원본</strong>${esc(p.original_root)}</div><div class="root-path"><strong>비교</strong>${esc(p.comparison_root)}</div>`;
  $('overview').innerHTML=[['이미지 파일',s.files],['번호 그룹',s.groups],['비교 항목',s.rows],['검토됨',s.reviewed],['미검토',s.unreviewed],['보류',s.deferred],['재검토',s.review_required]].map(([label,value])=>`<div class="stat"><span>${label}</span><b>${number(value)}</b></div>`).join('');
  $('thumb-progress').textContent=`썸네일 ${number(t.ready+t.failed)} / ${number(t.total)}${t.failed?' · 읽기 오류 '+number(t.failed):''}`;
  $('thumbnail-progress').max=Math.max(t.total,1);$('thumbnail-progress').value=t.ready+t.failed;
  $('result-count').textContent=`${number(state.data.total_groups)}개 그룹 · ${number(state.data.total_rows)}개 항목${$('search').value?' · 검색 결과':''}`;
  const h=state.data.hash_counts;
  $('hash-progress').textContent=`동일 파일명 SHA-256: 일치 ${number(h.same)} · 불일치 ${number(h.different)} · 확인 중 ${number(h.pending)} · 오류 ${number(h.error)}. 확인 중·오류는 일치/불일치 골라보기에서 제외됩니다.`;
  $('page-count').textContent=`${state.data.page} / ${state.data.pages}`;
  $('previous-page').disabled=state.data.page<=1; $('next-page').disabled=state.data.page>=state.data.pages;
  $('export-json').href=`/api/projects/${state.pid}/export?format=json`;
  $('export-csv').href=`/api/projects/${state.pid}/export?format=csv`;
  $('rescan').disabled=state.saving||state.scanning;
  const issueCount=p.scan.issues.length+t.failed;
  $('show-issues').textContent=`검사 알림${issueCount?' '+number(issueCount):''}`;
}
function params() {return new URLSearchParams({page:state.page,q:$('search').value,review:$('review-filter').value,...Object.fromEntries(filterIds.map(id=>[id.replaceAll('-','_'),$(id).value]))});}
async function loadPage(render=true) {
  if(!state.pid)return;
  const seq=++state.sequence;
  const data=await api(`/api/projects/${state.pid}?${params()}`);
  if(seq!==state.sequence)return;
  const signature=JSON.stringify(data.groups.map(g=>[g.id,g.decision_summary,g.rows.map(r=>[r.id,r.decision,r.review_required,r.hash_status])]));
  const redraw=render || signature!==state.signature;
  state.data=data;state.page=data.page;state.signature=signature;
  updateHeader();
  if(redraw)renderGroups();
  else for(const g of data.groups)for(const r of g.rows)for(const side of ['original','comparison']){
    const f=r[side]; if(!f)continue;
    const node=document.querySelector(`.image-meta[data-file="${f.id}"]`);
    if(node){node.textContent=metadata(f);node.classList.toggle('error',Boolean(f.thumbnail?.error));}
    const img=document.querySelector(`img.thumbnail[data-file-id="${f.id}"]`);
    if(img && f.thumbnail?.sha256 && img.dataset.requestSha!==f.thumbnail.sha256){img.dataset.requestSha=f.thumbnail.sha256;img.src=asset(f)+'&sha='+f.thumbnail.sha256;}
  }
}
async function refreshProjects() {
  const data=await api('/api/projects');
  $('projects').innerHTML=data.projects.length?'<option value="">폴더쌍 선택</option>'+data.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join(''):'<option value="">등록된 폴더쌍 없음</option>';
  $('projects').value=state.pid;
  return data.projects;
}
async function openProject(pid) {
  if(!pid)return;
  state.pid=pid;state.page=1;state.signature='';state.scanning=false;state.groupLimits={};
  localStorage.setItem('folder-review.active',pid);$('projects').value=pid;
  resetFilters();
  notice('');notice('',false,'status');
  await loadPage();$('registration').open=false;
}
async function waitForScan(jid,pid) {
  state.scanning=true;$('rescan').disabled=true;
  if(state.data)renderGroups();
  try {
    for(;;){
      const {job}=await api('/api/jobs/'+jid);
      if(state.pid!==pid)return;
      notice(job.message,job.status==='failed','status');
      if(job.status==='failed')throw new Error(job.message);
      if(job.status==='ready')break;
      await new Promise(r=>setTimeout(r,400));
    }
    state.scanning=false;
    await loadPage();await refreshProjects();
    notice('목록 검사가 끝났습니다. 썸네일은 화면에 보이는 파일부터 자동으로 생성합니다.',false,'status');
  } finally {
    state.scanning=false;$('rescan').disabled=false;
    if(state.pid===pid){try{await loadPage();}catch{};}
  }
}
async function changeDecision(input) {
  if(state.saving || state.scanning)return;
  const isGroup=input.dataset.scope==='group';
  const group=isGroup?state.data.groups.find(g=>g.id===input.dataset.id):null;
  const ids=group?group.rows.map(r=>r.id):[input.dataset.id];
  const choice=input.checked?input.value:null;
  const versions={};
  for(const rid of ids){const row=findRow(rid);if(!row)continue;for(const side of ['original','comparison']){
    const f=row[side];if(!f)continue;
    const img=document.querySelector(`img.thumbnail[data-file-id="${f.id}"]`);
    const hash=img?.dataset.renderedSha || f.thumbnail?.sha256;
    if(hash)versions[f.id]=hash;
  }}
  state.saving=true;saveState('saving','선택 저장 중…');
  document.querySelectorAll('.choices input').forEach(x=>x.disabled=true);
  $('rescan').disabled=true;
  try{
    const result=await api(`/api/projects/${state.pid}/decisions`,{row_ids:ids,choice,versions});
    state.saving=false;
    await loadPage();
    saveState('saved','자동 저장됨 · '+new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
    notice(`${number(result.applied)}개 항목에 적용했습니다.${result.skipped?' 선택한 쪽의 파일이 없는 '+number(result.skipped)+'개는 건너뛰었습니다.':''}`);
  }catch(error){
    state.saving=false;saveState('failed','저장 실패 · 선택을 확인해 주세요');notice(error.message,true);
    try{await loadPage();}catch{}
  }finally{state.saving=false;$('rescan').disabled=false;}
}
function updateViewerChoices(){const row=findRow(state.viewerRow);$('viewer-choices').innerHTML=row?choices(row):'';}
function openViewer(rid){
  const row=findRow(rid);if(!row)return;
  state.viewerRow=rid;
  $('viewer-title').textContent=(row.original||row.comparison).relative_path;
  $('viewer-images').classList.remove('natural');
  for(const side of ['original','comparison']){
    const f=row[side],image=$('viewer-'+side);
    image.hidden=!f;$('viewer-'+side+'-missing').hidden=Boolean(f);
    if(f){image.src=asset(f,true);$('viewer-'+side+'-path').textContent=fullPath(f);}
    else{image.removeAttribute('src');$('viewer-'+side+'-path').textContent='이쪽 폴더에는 파일이 없습니다.';}
  }
  updateViewerChoices();$('viewer').showModal();
}
async function showIssues(){
  try{
    const data=await api(`/api/projects/${state.pid}/errors`);
    $('issues-summary').textContent=`이미지가 아닌 파일 ${number(state.data.project.stats.ignored)}개는 제외했습니다. 읽기 오류·연결 경로 알림 ${number(data.issues.length)}건.`;
    $('issues-list').innerHTML=data.issues.length?data.issues.map(i=>`<div class="issue"><strong>${i.side==='original'?'원본':'비교본'} · ${esc(i.path)}</strong><br>${esc(i.message)}</div>`).join(''):'<p>검사 알림이 없습니다.</p>';
    $('issues-dialog').showModal();
  }catch(error){notice(error.message,true);}
}

$('register-form').addEventListener('submit',async event=>{
  event.preventDefault();$('register-button').disabled=true;notice('');
  try{
    const data=await api('/api/projects',{name:$('project-name').value,original:$('original-root').value,comparison:$('comparison-root').value});
    state.pid=data.project.id;state.page=1;state.signature='';state.data=null;state.groupLimits={};
    $('groups').innerHTML='';$('registration').open=false;
    resetFilters();
    localStorage.setItem('folder-review.active',state.pid);
    await refreshProjects();await waitForScan(data.job_id,state.pid);
  }catch(error){notice(error.message,true);$('registration').open=true;}
  finally{$('register-button').disabled=false;}
});
document.addEventListener('click',async event=>{
  const pick=event.target.closest('[data-pick]');
  if(pick){
    const target=$(pick.dataset.pick+'-root');pick.disabled=true;const text=pick.textContent;pick.textContent='선택 중…';
    try{const data=await api('/api/pick-folder',{initial:target.value || null});if(data.path)target.value=data.path;else notice('폴더 선택을 취소했습니다.');}
    catch(error){notice(error.message,true);}finally{pick.disabled=false;pick.textContent=text;}
  }
  const thumb=event.target.closest('[data-open-row]');if(thumb)openViewer(thumb.dataset.openRow);
  const more=event.target.closest('[data-more]');if(more){state.groupLimits[more.dataset.more]=(state.groupLimits[more.dataset.more] || 20)+20;renderGroups();}
});
document.addEventListener('load',event=>{const image=event.target;if(image.matches?.('img.thumbnail') && image.dataset.requestSha)image.dataset.renderedSha=image.dataset.requestSha;},true);
document.addEventListener('change',event=>{if(event.target.matches('.choices input'))void changeDecision(event.target);});
$('projects').addEventListener('change',()=>openProject($('projects').value).catch(e=>notice(e.message,true)));
$('new-project').addEventListener('click',()=>{$('registration').open=true;$('original-root').focus();});
$('rescan').addEventListener('click',async()=>{try{notice('');const {job_id}=await api(`/api/projects/${state.pid}/rescan`,{});await waitForScan(job_id,state.pid);}catch(error){notice(error.message,true);}});
let searchTimer;
$('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.page=1;loadPage().catch(e=>notice(e.message,true));},180);});
for(const id of [...filterIds,'review-filter'])$(id).addEventListener('change',()=>{clearTimeout(searchTimer);state.page=1;state.groupLimits={};loadPage().catch(e=>notice(e.message,true));});
$('reset-filters').addEventListener('click',()=>{clearTimeout(searchTimer);resetFilters();state.page=1;state.groupLimits={};loadPage().catch(e=>notice(e.message,true));});
for(const [id,delta] of [['previous-page',-1],['next-page',1]])$(id).addEventListener('click',()=>{state.page+=delta;loadPage().then(()=>document.querySelector('.toolbar').scrollIntoView()).catch(e=>notice(e.message,true));});
$('close-viewer').addEventListener('click',()=>$('viewer').close());
$('fit-view').addEventListener('click',()=>$('viewer-images').classList.remove('natural'));
$('natural-view').addEventListener('click',()=>$('viewer-images').classList.add('natural'));
$('show-issues').addEventListener('click',showIssues);
$('close-issues').addEventListener('click',()=>$('issues-dialog').close());
setInterval(async()=>{
  if(!state.pid||state.saving||state.scanning||state.polling||document.hidden)return;
  state.polling=true;try{await loadPage(false);}catch(error){notice(error.message,true);}finally{state.polling=false;}
},2500);
(async()=>{
  try{
    const status=await api('/api/status');state.token=status.token;
    const projects=await refreshProjects();
    const remembered=localStorage.getItem('folder-review.active');
    const project=projects.find(p=>p.id===remembered)||projects[0];
    if(project)await openProject(project.id);
  }catch(error){notice(error.message,true);}
})();
