'use strict';
// Replay actual native profile captures with the exact production CSS/ES5 assets. WORK is read only.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',rec='G:/somi/JO9sa/records/trait-overview-ui-20261025',tmp='G:/Codex/tmp/jo9-trait-overview-20261025/browser',out=__dirname;
const uri=p=>'file:///'+encodeURI(p.replace(/\\/g,'/')),read=p=>fs.readFileSync(p,'utf8');
const baseline=require('G:/somi/JO9sa/tools/text-workshop/core.cjs').hash(fs.readFileSync(game+'/jack.qsp'));
const css=read(game+'/css/base.css'),fonts=['경기천년제목 Medium','Sandoll 미생'].map(n=>'@font-face{font-family:"'+n+'";src:url("'+uri(game+'/fonts/'+n+'.ttf')+'")}').join('');
const cases=[];for(const role of ['slave','assistant'])for(const size of ['short','overflow'])for(const view of ['before','open'])cases.push({name:role+'-'+size+'-'+view,role,size,open:view==='open'});
cases.push({name:'long-name-open',source:'slave-overflow-open',role:'slave',size:'overflow',open:true,variant:'long-name'});
cases.push({name:'legacy-unknown-open',source:'slave-overflow-open',role:'slave',size:'overflow',open:true,variant:'legacy'});
const browser=String.raw`(async function(){
 await document.fonts.load('20px "경기천년제목 Medium"');await document.fonts.ready;
 for(var tries=0;tries<200&&!window.JO9TraitView;tries++)await new Promise(function(r){setTimeout(r,10)});
 if(!window.JO9TraitView)throw Error('Production view did not initialize: '+JSON.stringify(window.__qa_errors||[]));
 var api=window.JO9TraitView,root=api.root,col=root.parentElement,panel=api.panel,source=document.getElementById('jo9_tv_source'),cfg=CASE;
 api.measure();var text=function(n){return(n.textContent||'').trim().replace(/\u00a0/g,' ')},rect=function(n){var r=n.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
 var sourceRows=source.innerHTML.split(/<br\s*\/?\s*>/i).map(function(s){var n=document.createElement('div');n.innerHTML=s;return text(n)}).filter(Boolean);
 var left=Array.from(api.list.children),central=Array.from(panel.querySelectorAll('.jo9_tv_entry')),names=function(ns){return ns.map(text)};
 var ordered=names(left),nonTitles=left.filter(function(n){return n.dataset.kind!=='title'}),titles=left.filter(function(n){return n.dataset.kind==='title'}),columns=api.columns.map(function(n){return Array.from(n.children)});
 var asserts=[],ok=function(v,t){asserts.push({check:t,pass:!!v});if(!v)throw Error(t)};
 ok(sourceRows.length===left.length,'Every original visible source row preserved');ok(sourceRows.slice().sort().join('|')===ordered.slice().sort().join('|'),'No new/revealed labels and no missing visible labels');
 var seenOther=false;ok(left.every(function(n){if(n.dataset.kind==='state')return !seenOther;seenOther=true;return true}),'Status rows precede all nonstatus rows');
 var expectedNonstatus=sourceRows.filter(function(n){return !left.some(function(x){return x.dataset.kind==='state'&&text(x)===n})});
 ok(expectedNonstatus.join('|')===names(left.filter(function(n){return n.dataset.kind!=='state'})).join('|'),'Original nonstatus mixed order preserved');
 ok(names(columns[0].concat(columns[1])).join('|')===names(nonTitles).join('|'),'Columns one then two preserve complete ordinary order');ok(names(columns[2]).join('|')===names(titles).join('|'),'Third column contains only all titles');
 ok(central.length===left.length,'Central overview contains every visible source entry');ok(panel.hidden===!cfg.open,'Requested open state preserved');
 var heading=document.getElementById('jo9_tv_heading');ok(getComputedStyle(heading).textDecorationLine.indexOf('underline')>=0||heading.querySelector('u'),'Title is underlined and always available');
 var expectedIndex=cfg.variant!=='legacy';ok(central.every(function(n){return expectedIndex?Number(n.dataset.index)>0:n.dataset.index==='0'||Number(n.dataset.index)>0}),'Current entries have a valid description index');
 var footer=api.footer,over=root.dataset.overflow==='1',footerRect=rect(footer),columnRect=rect(col);ok(over===(cfg.size==='overflow'),'Actual sidebar overflow detected');ok(footer.hidden===!over,'Footer visible only on overflow');
 var visible=left.filter(function(n){return getComputedStyle(n).display!=='none'}),visibleNames=names(visible);
 ok(visible.every(function(n){var r=rect(n);return r.x>=columnRect.x&&r.right<=columnRect.right+.1&&r.bottom<=(over?footerRect.y-4:columnRect.bottom-10)+.1}),'Every shown sidebar row fully fits without partial rows');
 if(over){ok(footerRect.bottom<=columnRect.bottom+.1&&footerRect.right<=columnRect.right+.1,'Full-view footer fits at sidebar bottom');ok(getComputedStyle(footer).color==='rgb(0, 0, 216)'&&getComputedStyle(footer).textDecorationLine.indexOf('underline')>=0,'Overflow link is blue and underlined');}
 function ink(node){var w=document.createTreeWalker(node,NodeFilter.SHOW_TEXT),r=[],n;while(n=w.nextNode()){if(n.textContent.trim()){var s=getComputedStyle(n.parentElement);r.push([n.textContent,s.fontFamily,s.fontSize,s.color])}}return JSON.stringify(r)}
 // Temporarily expose hidden sidebar rows to compare the same complete item's style, then remeasure.
 var stylePairs=central.map(function(n){var match=left.find(function(x){return text(x)===text(n)}),old=match.style.display;match.style.display='block';var same=ink(n)===ink(match);match.style.display=old;return same});
 ok(stylePairs.every(Boolean),'Every central item preserves sidebar font and colored text');api.measure();
 var callbacks=[];document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(a&&/^exec:/i.test(a.getAttribute('href')||'')){e.preventDefault();callbacks.push(a.getAttribute('href'))}},true);
 heading.click();if(over)footer.click();central.filter(function(n){return Number(n.dataset.index)>0}).forEach(function(n){n.click()});
 ok(callbacks.every(function(s){return /^EXEC:\s*gs\s*'jo9_traits_view'\s*,\s*'(open|info)'(?:\s*,\s*[1-9][0-9]*)?\s*$/i.test(s)}),'All emitted QSP links route through well-formed readonly helper calls');
 if(cfg.open){
  var b=rect(panel),ib=rect(document.getElementById('info'));ok(b.x===245&&b.y===35&&b.width===795&&b.height===595,'Exact original central parchment bounds');ok(ib.y>=b.bottom,'Narrative/description remains below central page');
  ok(columns.every(function(ns){return ns.every(function(n){var r=rect(n);return r.x>=b.x&&r.right<=b.right+.1})}),'All three columns fit original page width');
  var msg=document.createElement('div');msg.id='__message__';msg.style.cssText='position:fixed;top:0;left:200px;width:500px;height:375px;background-image:url(content/pic/msg_bg.png)';
  msg.innerHTML='<div style="position:absolute;top:40px;left:80px;width:370px;height:280px">기존 정보 팝업</div><a href="api/closemsg" style="position:absolute;top:340px;left:250px;width:32px;height:32px"><img src="content/pic/buttons/ok-icon.png" width="32" height="32"></a>';document.body.appendChild(msg);
  var panelSnapshot=panel.innerHTML,infoSnapshot=document.getElementById('info').innerHTML;
  msg.style.setProperty('z-index','auto','important');var before=msg.contains(document.elementFromPoint(462,352));msg.style.removeProperty('z-index');var above=msg.contains(document.elementFromPoint(462,352));
  ok(!before&&above,'Engine message replay reproduces overlap and production z-index fixes it');var close=msg.querySelector('a');close.onclick=function(e){e.preventDefault();msg.remove()};close.click();
  ok(!document.getElementById('__message__')&&!panel.hidden&&panel.innerHTML===panelSnapshot&&document.getElementById('info').innerHTML===infoSnapshot,'Closing existing popup restores unchanged overview and description');
 }
 if(cfg.variant==='legacy'){ok(left.filter(function(n){return n.dataset.kind==='trait'}).length>8,'Legacy general traits above eight remain displayed');ok(ordered.indexOf('QA 알 수 없는 기존 특성')>=0,'Unknown plain saved label remains available');}
 if(cfg.variant==='long-name')ok(ordered.some(function(n){return n.indexOf('QA 매우 긴')===0}),'Long saved labels remain intact');
 document.getElementById('browser-result').textContent=encodeURIComponent(JSON.stringify({name:cfg.name,status:'PASS',assertions:asserts,sourceRows,ordered,visibleNames,columnNames:columns.map(names),fontPairs:stylePairs,overflow:over,footer:over?footerRect:null,column:columnRect,panel:rect(panel),callbacks,loadedFont:document.fonts.check('20px "경기천년제목 Medium"')}));
})().catch(function(e){document.getElementById('browser-result').textContent=encodeURIComponent(JSON.stringify({status:'FAIL',error:e.stack}))});`;
fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(rec+'/evidence',{recursive:true});
const results=[];for(const cfg of cases){
 const file=rec+'/evidence/'+(cfg.source||cfg.name)+'.html';assert(fs.existsSync(file),'Native capture not ready: '+file);
 let html=read(file).replace(/\r?\n/g,'<br>');
 // Replace only current feature asset URLs; leave actual original frame and game asset paths intact.
 html=html.replace(/(?:css\/)?jo9_traits_view\.css/g,uri(out+'/jo9_traits_view.css')).replace(/(?:content\/)?(?:js\/)?jo9_traits_view\.js/g,uri(out+'/jo9_traits_view.js'));
 if(cfg.variant){const at=html.indexOf('<div id="jo9_tv_source">'),end=html.indexOf('</div>',at),raw=html.slice(at,end);assert(at>=0&&end>at);
  const extra=cfg.variant==='legacy'?'<span>QA 알 수 없는 기존 특성</span><br>'+Array.from({length:4},(_,i)=>'<a href="EXEC: msg $NaturalGrace"><font color="#009900">QA 기존 성향 '+i+'</font></a><br>').join(''):'<a href="EXEC: msg $NaturalGrace"><font color="#009900">QA 매우 긴 기존 특성 이름의 줄바꿈 표시 확인용 항목</font></a><br>';
  html=html.slice(0,end)+extra+html.slice(end);assert(raw.length>0);
 }
 const wrap='<!doctype html><meta charset="utf-8"><base href="'+uri(game)+'/"><style>*{padding:0;margin:0}div{margin:0 auto;display:table}'+fonts+css+'html,body{margin:0;padding:0;width:1280px;height:800px;overflow:hidden}body{white-space:pre-wrap;background:url("'+uri(game+'/content/pic/ui/grimdark/bg_stat.png')+'") 0 0/1280px 800px no-repeat}a{color:rgb(0,0,255);text-decoration:none}#jo9_tv_panel{background-image:url("'+uri(game+'/content/pic/ui/grimdark/bg/page_blank.png')+'")!important}#browser-result{display:none}</style><div id="qa_native_maindesc" style="position:fixed;top:1px;left:1px;width:1280px;height:800px">'+html+'</div><pre id="browser-result"></pre><script>'+browser.replace('CASE',JSON.stringify(cfg))+'</script>';
 const target=tmp+'/'+cfg.name+'.html';fs.writeFileSync(target,wrap.replace('<style>','<script>window.__qa_errors=[];window.addEventListener("error",function(e){window.__qa_errors.push([e.message,e.filename,e.lineno,e.colno])});</script><style>'));
 const args=['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--allow-file-access-from-files','--user-data-dir='+tmp+'/edge-'+cfg.name,'--window-size=1280,800','--force-device-scale-factor=1','--virtual-time-budget=5000','--hide-scrollbars','--dump-dom'];
 if(cfg.name==='slave-overflow-open')args.push('--screenshot='+rec+'/evidence/browser-overflow-proof.png');args.push(uri(target));
 const run=cp.spawnSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args,{encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:8*1024*1024});
 const m=(run.stdout||'').match(/<pre id="browser-result">([^<]+)<\/pre>/);const r=m?JSON.parse(decodeURIComponent(m[1])):{status:'FAIL',error:run.stderr||'No browser result'};r.name=cfg.name;results.push(r);if(r.status!=='PASS')break;
}
const report={status:results.length===cases.length&&results.every(r=>r.status==='PASS')?'PASS':'FAIL',method:'Headless Edge replays exact diagnostic HTML emitted by native profile renderer with current production ES5/CSS; engine message HTML replay only, not actual native modal click.',cases:results,limits:['Browser rendering is not native QtWebKit geometry proof.','QSP helper callbacks and actor/money preservation are checked separately by focused-native.cjs.','Long label and legacy unknown variants modify only isolated captured HTML for display stress.'],workUntouched:require('G:/somi/JO9sa/tools/text-workshop/core.cjs').hash(fs.readFileSync(game+'/jack.qsp'))===baseline};
fs.writeFileSync(rec+'/browser-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:results.map(r=>({name:r.name,status:r.status,error:r.error,overflow:r.overflow,visible:r.visibleNames&&r.visibleNames.length,total:r.ordered&&r.ordered.length}))}));assert.equal(report.status,'PASS','See browser-results.json');
