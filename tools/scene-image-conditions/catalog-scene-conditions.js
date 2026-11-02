(function(root){
 'use strict';
 var titles={direct:'표시 코드 연결',random:'무작위 후보',dynamic:'동적 조건 확인 필요',definition:'정의부 등록',alternate:'전환용 추가 컷',unlinked:'실행 연결 미확인'};
 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function htmlFor(e){if(!e)return '';var out='<section class="jo9-scene-conditions" data-scene-path="'+esc(e.path)+'"><p class="jo9-scene-condition-summary"><b>등장·재현 조건</b> <span class="jo9-scene-condition-status">'+esc(titles[e.status]||e.status)+'</span><br>'+esc(e.summary)+'</p>';
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
 if(typeof module==='object'&&module.exports){module.exports={htmlFor:htmlFor,escape:esc};return;}
 if(!root||!root.document||!root.JO9_SCENE_CONDITIONS||typeof root.rowHtml!=='function')return;
 var data=root.JO9_SCENE_CONDITIONS,document=root.document,previous=root.rowHtml;
 if(root.JO9_SCENE_CONDITIONS_UI)return;
 root.JO9_SCENE_CONDITIONS_UI={data:data,htmlFor:htmlFor};
 var css=document.createElement('style');css.textContent='.jo9-scene-conditions{margin:10px 12px;padding:10px 12px;border:1px solid #6d6251;background:#25282e;color:#e7e0d4;line-height:1.5;overflow-wrap:anywhere}.jo9-scene-conditions p{margin:4px 0}.jo9-scene-conditions details{margin-top:7px}.jo9-scene-conditions summary{cursor:pointer;color:#a7cbed}.jo9-scene-conditions ul{margin:5px 0;padding-left:22px}.jo9-scene-conditions code{white-space:pre-wrap;color:#d4dce9;font:12px Consolas,monospace}.jo9-scene-condition-status{display:inline-block;background:#494333;color:#fae7ad;padding:1px 6px;border-radius:3px;font-size:12px}.jo9-scene-condition-source{border-top:1px solid #514d44;margin:7px 0;padding-top:7px}.jo9-scene-condition-code{font:12px Consolas,monospace;color:#bcc8d9}.jo9-scene-condition-banner{margin:8px;padding:9px;background:#252e34;color:#d9e8ed;border:1px solid #657a83;line-height:1.45}.jo9-scene-condition-banner.is-stale{background:#613323;color:#fff2c2}';document.head.appendChild(css);
 root.rowHtml=function(d,i,kid){var html=previous(d,i,kid),key=String(d[0]).replace(/\\/g,'/').toLowerCase(),e=data.entries[key];if(!e)return html;var at=html.indexOf('<div class="kids">');if(at<0)at=html.lastIndexOf('</div>');return at<0?html+htmlFor(e):html.slice(0,at)+htmlFor(e)+html.slice(at);};
 var banner=document.createElement('div');banner.className='jo9-scene-condition-banner';banner.id='jo9-scene-condition-banner';banner.textContent='씬 이미지 '+data.total+'개 · 등장·재현 조건은 각 이미지 카드에 표시됩니다. QSP 정적 분석 기준이며 실제 세이브에서 실행을 보장하는 표시는 아닙니다. 분석 기준 '+data.qspSha256.slice(0,12);document.body.insertBefore(banner,document.body.firstChild);
 if(typeof root.render==='function')root.render();
 var cfg=root.JO9_CATALOG_BRIDGE;if(cfg&&root.fetch)root.fetch(cfg.url+'api/state',{headers:{'X-JO9-Token':cfg.token}}).then(function(r){if(!r.ok)throw Error('state unavailable');return r.json();}).then(function(s){if(s.hash&&s.hash!==data.qspSha256){banner.className+=' is-stale';banner.textContent='QSP가 변경되었습니다. 아래 조건은 이전 파일('+data.qspSha256.slice(0,12)+') 기준이므로 재분석이 필요합니다.';}}).catch(function(){banner.textContent+=' · 현재 QSP 버전 비교는 연결 후 가능합니다.';});
}(typeof window==='undefined'?null:window));
