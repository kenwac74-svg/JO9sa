
(function(root){
 'use strict';
 var titles={direct:'표시 코드 연결',random:'무작위 후보',dynamic:'동적 조건 확인 필요',definition:'정의부 등록',alternate:'전환용 추가 컷',unlinked:'실행 연결 미확인'};
 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function reviewFor(r){if(!r)return '';var body='<p><b>이유:</b> '+esc(r.reason)+'</p><p><b>다음 할 일:</b> '+esc(r.nextStep)+'</p><p><b>삭제 판정:</b> '+esc(r.deleteDecision)+'</p>';
  if(r.stale)return '<aside class="jo9-scene-review is-stale"><strong>조치 재확인 필요</strong><p>'+esc((r.staleReasons||[]).join(' · '))+' 이후의 권장 처리는 다시 확인해야 합니다. 현재 파일을 유지하세요.</p><details><summary>지난 검토: '+esc(r.label)+'</summary>'+body+'</details></aside>';
  return '<aside class="jo9-scene-review" data-review-action="'+esc(r.action)+'"><strong>권장 처리: '+esc(r.label)+'</strong>'+body+'</aside>';
 }
 function indexFor(entries){var list=Object.keys(entries).map(function(key){return entries[key];}).filter(function(e){return e.review;});if(!list.length)return '';var groups={};list.forEach(function(e){var label=e.review.stale?'조치 재확인 필요':e.review.label;(groups[label]||(groups[label]=[])).push(e);});return '<details class="jo9-scene-review-index"><summary>처리 주석 달린 이미지 '+list.length+'개 보기</summary><p>이름을 누르면 해당 이미지 카드로 이동합니다.</p>'+Object.keys(groups).map(function(label){return '<details><summary>'+esc(label)+' · '+groups[label].length+'개</summary><ul>'+groups[label].map(function(e){return '<li><a href="?image='+encodeURIComponent(e.path)+'">'+esc(e.path.replace(/^content\/pic\/scene\//i,''))+'</a></li>';}).join('')+'</ul></details>';}).join('')+'</details>';}
 function htmlFor(e){if(!e)return '';var out='<section class="jo9-scene-conditions" data-scene-path="'+esc(e.path)+'">'+reviewFor(e.review)+'<p class="jo9-scene-condition-summary"><b>등장·재현 조건</b> <span class="jo9-scene-condition-status">'+esc(titles[e.status]||e.status)+'</span><br>'+esc(e.summary)+'</p>';
  if(e.references.length||e.alternates.length){out+='<details><summary>상세 조건·메뉴·코드 근거 ('+e.references.length+')</summary>';
   e.references.forEach(function(r){out+='<div class="jo9-scene-condition-source"><b>'+esc(r.itemName||r.location)+' · '+r.line+'행</b>';
    if(r.menus&&r.menus.length){out+='<p>진입 메뉴: '+r.menus.map(function(m){return esc(m.label);}).join(' / ')+'</p>';r.menus.forEach(function(m){if(m.conditions&&m.conditions.length)out+='<p class="jo9-scene-condition-code">메뉴 표시 조건: '+esc(m.conditions.join(' AND '))+'</p>';});}
    if(r.slot)out+='<p>장면 진행: '+r.slot+'페이지의 이미지</p>';
    if(r.placeCandidates&&r.placeCandidates.length)out+='<p>장소 코드: '+esc(r.placeCandidates.join(' / '))+'</p>';
    if(r.conditions&&r.conditions.length){out+='<ul>';r.conditions.forEach(function(t){out+='<li><code>'+esc(t)+'</code></li>';});out+='</ul>';}else out+='<p>이 참조 지점에 직접 걸린 IF 조건은 없습니다. 상위 호출 조건을 함께 확인해야 합니다.</p>';
    if(r.upstream&&r.upstream.length){out+='<details><summary>이 이벤트로 이어지는 진행 조건 ('+r.upstream.length+')</summary>';r.upstream.forEach(function(u){out+='<p><b>'+esc(u.location)+' · '+u.line+'행</b><br><code>'+esc(u.conditions.join(' AND ')||'직접 IF 조건 없음 · 상위 호출 확인 필요')+'</code></p>';});out+='<p>이벤트 번호를 지정하는 코드 기준입니다. 이후 분기나 동적 호출에 따라 실제 진행이 달라질 수 있습니다.</p></details>';}
    if(r.note)out+='<p>'+esc(r.note)+'</p>';if(r.definedAt)out+='<p>이미지명 정의: '+esc(r.definedAt.location)+' · '+r.definedAt.line+'행</p>';
    out+='<p class="jo9-scene-condition-code">경로식: '+esc(r.pathExpression)+'</p></div>';
   });
   if(e.alternates.length)out+='<p>기본 컷: '+e.alternates.map(esc).join(' / ')+' — 이 컷이 실제로 열려야 이미지 전환을 쓸 수 있습니다.</p>';
   out+='</details>';
  }
  if(e.status==='unlinked')out+='<p>파일명에 번호가 있다는 사실만으로 무작위 등장하거나 불필요한 파일이라고 단정하지 않습니다.</p>';
  return out+'</section>';
 }
 if(typeof module==='object'&&module.exports){module.exports={htmlFor:htmlFor,escape:esc,indexFor:indexFor};return;}
 if(!root||!root.document||!root.JO9_SCENE_CONDITIONS)return;
 var data=root.JO9_SCENE_CONDITIONS,document=root.document;
 if(root.JO9_SCENE_CONDITIONS_UI)return;
 root.JO9_SCENE_CONDITIONS_UI={data:data,htmlFor:htmlFor,indexFor:indexFor,attachGallery:attachGallery};
 var css=document.createElement('style');css.textContent='.jo9-scene-conditions{margin:10px 12px;padding:10px 12px;border:1px solid #6d6251;background:#25282e;color:#e7e0d4;line-height:1.5;overflow-wrap:anywhere}.jo9-scene-conditions p{margin:4px 0}.jo9-scene-conditions details{margin-top:7px}.jo9-scene-conditions summary{cursor:pointer;color:#a7cbed}.jo9-scene-conditions ul{margin:5px 0;padding-left:22px}.jo9-scene-conditions code{white-space:pre-wrap;color:#d4dce9;font:12px Consolas,monospace}.jo9-scene-condition-status{display:inline-block;background:#494333;color:#fae7ad;padding:1px 6px;border-radius:3px;font-size:12px}.jo9-scene-condition-source{border-top:1px solid #514d44;margin:7px 0;padding-top:7px}.jo9-scene-condition-code{font:12px Consolas,monospace;color:#bcc8d9}.jo9-scene-condition-banner{margin:8px;padding:9px;background:#252e34;color:#d9e8ed;border:1px solid #657a83;line-height:1.45}.jo9-scene-condition-banner.is-stale{background:#613323;color:#fff2c2}';document.head.appendChild(css);
 css.textContent+='.jo9-scene-review{padding:10px;margin-bottom:10px;border:1px solid #77815e;border-left:4px solid #a4b67b;background:#202d25;color:#f1f0d9}.jo9-scene-review strong{font-size:14px}.jo9-scene-review[data-review-action="duplicate_cleanup"]{border-color:#bc9b60;background:#352e20}.jo9-scene-review.is-stale{border-color:#b89369;background:#392d22}.jo9-scene-review-index{margin:8px;padding:10px;background:#252e34;color:#e5e7dd;border:1px solid #657a83;line-height:1.6}.jo9-scene-review-index summary{cursor:pointer}.jo9-scene-review-index a{color:#c9dcab}.jo9-scene-review-index ul{max-height:280px;overflow:auto}';
 function attachGallery(){if(attachGallery.done||typeof root.rowHtml!=='function')return;attachGallery.done=true;var previous=root.rowHtml;
 root.rowHtml=function(d,i,kid){var html=previous(d,i,kid),key=String(d[0]).replace(/\\/g,'/').toLowerCase(),e=data.entries[key];if(!e)return html;var at=html.indexOf('<div class="kids">');if(at<0)at=html.lastIndexOf('</div>');return at<0?html+htmlFor(e):html.slice(0,at)+htmlFor(e)+html.slice(at);};
 var host=document.getElementById('jo9-catalog-panel-gallery')||document.getElementById('main')||document.body;
 var banner=document.createElement('div');banner.className='jo9-scene-condition-banner';banner.id='jo9-scene-condition-banner';banner.textContent='씬 이미지 '+data.total+'개 · 등장·재현 조건은 각 이미지 카드에 표시됩니다. QSP 정적 분석 기준이며 실제 세이브에서 실행을 보장하는 표시는 아닙니다. 분석 기준 '+data.qspSha256.slice(0,12);host.insertBefore(banner,host.firstChild);
 if(typeof root.render==='function')root.render();
 var cfg=root.JO9_CATALOG_BRIDGE;if(cfg&&root.fetch)root.fetch(cfg.url+'api/state',{headers:{'X-JO9-Token':cfg.token}}).then(function(r){if(!r.ok)throw Error('state unavailable');return r.json();}).then(function(s){if(s.hash&&s.hash!==data.qspSha256){banner.className+=' is-stale';banner.textContent='QSP가 변경되었습니다. 아래 조건은 이전 파일('+data.qspSha256.slice(0,12)+') 기준이므로 재분석이 필요합니다.';}}).catch(function(){banner.textContent+=' · 현재 QSP 버전 비교는 연결 후 가능합니다.';});
 }
 if(!root.JO9_CATALOG_TABS)attachGallery();
}(typeof window==='undefined'?null:window));
