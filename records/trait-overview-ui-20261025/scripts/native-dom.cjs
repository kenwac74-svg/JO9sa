'use strict';
// Real QtWebKit DOM probe; production resources and diagnostic QSP copies only.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),game='G:/somi/Jack O Nine Tails v2.4_work/game',rec='G:/somi/JO9sa/records/trait-overview-ui-20261025',base='G:/Codex/tmp/jo9-trait-overview-20261025',out=base+'/native-dom',src=__dirname;
const q=s=>"'"+String(s).replace(/'/g,"''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n'),hash=c.hash(fs.readFileSync(game+'/jack.qsp'));
const runOnly=process.argv.includes('--run'),messages=process.argv.includes('--messages'),plan=[];fs.mkdirSync(out,{recursive:true});fs.mkdirSync(rec+'/evidence',{recursive:true});
for(const rel of ['config.xml','css/base.css','fonts/경기천년제목 Medium.ttf','fonts/Sandoll 미생.ttf','content/pic/ui/grimdark/bg_stat.png','content/pic/ui/grimdark/bg/page_blank.png','content/pic/buttons/close_button.png','content/pic/msg_bg.png','content/pic/buttons/ok-icon.png']){const dest=out+'/'+rel;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(game+'/'+rel,dest);}
for(const [from,to]of [['jo9_traits_view.js','content/js/jo9_traits_view.js'],['jo9_traits_view.css','css/jo9_traits_view.css']]){fs.mkdirSync(path.dirname(out+'/'+to),{recursive:true});fs.copyFileSync(src+'/'+from,out+'/'+to);}
fs.cpSync(base+'/focus/json',out+'/json',{recursive:true});fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const diagnostic=String.raw`(function(){
 function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}
 function fail(code){var a=document.createElement('a');a.href='EXEC: msg '+String.fromCharCode(39)+'FAIL_TRAITDOM_JS_'+String(code).replace(/[^A-Za-z0-9_]/g,'_')+String.fromCharCode(39);document.body.appendChild(a);click(a)}
 window.onerror=function(message,url,line){if(/msg\.style/.test(String(message)))return false;fail('LINE_'+line+'_'+String(message).slice(0,100));return false};
 var tries=0;function done(){
  var actualMessage=document.getElementById('__message__');if(actualMessage){var actualClose=document.querySelector('a[href="api/closemsg"]');if(actualClose){var image=actualClose.querySelector('img')||actualClose,r=image.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(actualClose.contains(hit)){click(actualClose);return}}setTimeout(done,30);return}
  var api=window.JO9TraitView;if(!api||api.root.getAttribute('data-ready')!=='1'){if(++tries<100)setTimeout(done,30);else fail('NO_API');return}
  api.measure();var root=api.root,left=api.list.children,total=left.length,ordinary=0,titles=0,statesFirst=true,seenOther=false,visibleFits=true,links=true,i;
  var column=root.parentElement,limit=api.footer.getBoundingClientRect().top-4,cb=column.getBoundingClientRect();
  for(i=0;i<left.length;i++){var kind=left[i].getAttribute('data-kind');if(kind==='state'&&seenOther)statesFirst=false;if(kind!=='state')seenOther=true;if(kind==='title')titles++;else ordinary++;
   if(getComputedStyle(left[i]).display!=='none'&&left[i].getBoundingClientRect().bottom>limit+.1)visibleFits=false;
   if(!(parseInt(left[i].getAttribute('data-index'),10)>0))links=false;
  }
  var footer=api.footer.getBoundingClientRect(),closedOK=total>=16&&root.getAttribute('data-overflow')==='1'&&!api.footer.hidden&&footer.bottom<=cb.bottom+.1&&visibleFits&&statesFirst&&links;
  if(root.getAttribute('data-open')==='0'){
   var maxBottom=0,visibleCount=0;for(i=0;i<left.length;i++){if(getComputedStyle(left[i]).display!=='none'){maxBottom=Math.max(maxBottom,left[i].getBoundingClientRect().bottom);visibleCount++}}
   var cs=getComputedStyle(column),details=[total,root.getAttribute('data-overflow'),api.footer.hidden,footer.top,footer.bottom,cb.top,cb.bottom,cb.height,column.offsetHeight,cs.position,cs.top,cs.height,cs.display,visibleCount,maxBottom,visibleFits,statesFirst,links].join(',');
   var h=document.getElementById('jo9_tv_heading');h.setAttribute('href','EXEC: $qa_dom_closed_debug='+String.fromCharCode(39)+details+String.fromCharCode(39)+' & qa_dom_closed='+Number(closedOK)+' & '+h.getAttribute('href').replace(/^exec:\s*/i,''));click(h);return;
  }
  var cols=api.columns,panel=api.panel.getBoundingClientRect(),orderedOK=cols[0].children.length+cols[1].children.length===ordinary&&cols[2].children.length===titles;
  var all=[];for(i=0;i<3;i++){for(var k=0;k<cols[i].children.length;k++){var n=cols[i].children[k];all.push(n);if(i===2&&n.getAttribute('data-kind')!=='title')orderedOK=false}}
  var first=parseInt(all[0].getAttribute('data-index'),10),fonts=true;
  for(i=0;i<all.length;i++){var s=getComputedStyle(all[i]);if(s.fontSize!==getComputedStyle(column).fontSize||s.fontFamily!==getComputedStyle(column).fontFamily)fonts=false}
  var m=document.createElement('div');m.id='__message__';m.style.cssText='position:fixed;left:200px;top:0;width:500px;height:375px;background:#eee';m.innerHTML='<a href="api/closemsg" style="position:absolute;top:340px;left:250px;width:32px;height:32px;background:#111">OK</a>';document.body.appendChild(m);
  var hit=document.elementFromPoint(462,352),layer=m.contains(hit);m.querySelector('a').onclick=function(e){e.preventDefault();m.parentNode.removeChild(m)};click(m.querySelector('a'));layer=layer&&!document.getElementById('__message__')&&!api.panel.hidden;
  var openOK=closedOK&&!api.panel.hidden&&orderedOK&&fonts&&panel.left===245&&panel.top===35&&panel.width===795&&panel.height===595&&document.getElementById('info').getBoundingClientRect().top>=panel.bottom&&layer;
  var openedDetails=[closedOK,api.panel.hidden,orderedOK,fonts,panel.left,panel.top,panel.right,panel.bottom,panel.width,panel.height,api.panel.offsetHeight,getComputedStyle(api.panel).height,getComputedStyle(api.panel).display,document.getElementById('info').getBoundingClientRect().top,layer,visibleFits,statesFirst,links,footer.bottom,cb.bottom].join(',');
  var callback=document.getElementById('qa_dom_callback');callback.setAttribute('href','EXEC: $qa_dom_open_debug='+String.fromCharCode(39)+openedDetails+String.fromCharCode(39)+' & qa_dom_opened='+Number(openOK)+' & qa_dom_first='+first+' & qa_dom_total='+total+' & qa_dom_titles='+titles+' & gs '+String.fromCharCode(39)+'qa_dom_done'+String.fromCharCode(39));click(callback);
 }setTimeout(done,150);
}());`;
for(const role of ['slave','assistant']){
 const d=c.parse(fs.readFileSync(base+'/focus/'+role+'-overflow.qsp')),loc=d.locations.find(l=>l.name==='Start'),start=c.shift(d.lines[loc.body],5),tag='QA_STORY_'+role+'-overflow',at=start.indexOf(tag),end=start.indexOf("gs '"+role+"_stat'",at);a(at>0&&end>at,'Fixture profile entry missing');
 // FastQSP turns literal QSP description newlines into <br>, including script text.
 const html='<!--J9DOM_DIAG_BEGIN--><a id="qa_dom_callback" href="#" style="display:none">callback</a><script type="text/javascript">'+diagnostic.replace(/\r?\n/g,' ')+'</script><!--J9DOM_DIAG_END-->';
 d.lines[loc.body]=c.shift(cr(start.slice(0,end+("gs '"+role+"_stat'").length)+"\nqa_dom_closed=0\nqa_dom_opened=0\n*p "+q(html)+'\n'),-5);
 const marker='JO9_QA_'+(messages?'TRAITMSG':'TRAITDOM')+'_'+role+'_overflow_COMPLETE';
 let callback="if qa_dom_closed!1 or qa_dom_opened!1 or qa_dom_first<=0: msg 'FAIL_TRAITDOM_LAYOUT_<<qa_dom_closed>>_<<qa_dom_opened>>_<<qa_dom_first>> CLOSED=<<$qa_dom_closed_debug>> OPEN=<<$qa_dom_open_debug>>' & exit\n";
 if(!messages)callback+="local $qa_clean=$replace($maintxt,$strfind($maintxt,'(?s)<!--J9DOM_DIAG_BEGIN-->.*?<!--J9DOM_DIAG_END-->'),'')\n*clr\n*p $qa_clean\n";
 callback+="gs 'jo9_traits_view','info',qa_dom_first\nif $info_text='' or instr($maintxt,'data-open=\"1\"')=0: msg 'FAIL_TRAITDOM_INFO' & exit\n";
 if(messages){
  const finalScript="(function(){var n=0;function f(){var a=window.JO9TraitView;if(!a){if(++n<100)setTimeout(f,30);return}if(a.root.getAttribute('data-open')!=='1'||a.panel.hidden)return;var l=document.createElement('a');l.href=\"EXEC: gs 'qa_dom_finish'\";document.body.appendChild(l);var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);l.dispatchEvent(e)}setTimeout(f,150)}());";
  callback+="gs 'jo9_traits_view','remember'\ndynamic $msg,'QA_TRAIT_MSG_ONE'\ndynamic $msg,'QA_TRAIT_MSG_TWO'\nqa_dom_after_messages=1\n*clr\ngs '"+role+"_stat'\n*p "+q('<script type="text/javascript">'+finalScript+'</script>')+'\nexit';
  const finish="if qa_dom_after_messages!1 or instr($maintxt,'data-open=\"1\"')=0: msg 'FAIL_TRAITMSG_REOPEN' & exit\nmsg '"+marker+"'\nexit";
  d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift('qa_dom_finish',-5),c.shift('',-5),c.shift(cr(finish),-5),c.shift('0',-5));d.locations=c.parse(c.serialize(d)).locations;
 }else callback+="savegame "+q(role+'-dom-after-info.sav')+"\nmsg '"+marker+"'\nexit";
 d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift('qa_dom_done',-5),c.shift('',-5),c.shift(cr(callback),-5),c.shift('0',-5));
 const name=role+(messages?'-msg':'-dom'),file=out+'/'+name+'.qsp',raw=c.serialize(d);c.parse(raw);fs.writeFileSync(file,raw);plan.push({name,file,marker,checkpoint:'Real native production ES5 DOM: sidebar overflow, status order, positive descriptions, 3-column overview, exact geometry, font parity, '+(messages?'two actual native MSG dialogs acknowledged only when close control is topmost and remembered profile reopens':'engine message-layer replay and existing helper description callback')});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2)+'\n');fs.writeFileSync(rec+'/evidence/native-dom-diagnostic.js',diagnostic);
if(!runOnly){console.log(JSON.stringify({prepared:true,out,cases:plan.length,run:'node '+src+'/native-dom.cjs --run'}));process.exit(0);}
let runner='G:/somi/JO9sa/tools/qa/run-client-smoke.ps1';if(messages){let ps=fs.readFileSync(runner,'utf8');a(ps.includes("if($probeLog -match 'showMessage\\(\\)')"));ps=ps.replace("if($probeLog -match 'showMessage\\(\\)')","if($probeLog -match 'showMessage\\(\\), str:\\s*\"FAIL_')");runner=out+'/run-native-msg.ps1';fs.writeFileSync(runner,ps);}
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',runner,'-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:70000});
const results=JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,''));for(const p of plan)for(const s of ['stderr','stdout']){const f=out+'/'+p.name+'-'+s+'.log';if(fs.existsSync(f))fs.copyFileSync(f,rec+'/evidence/'+p.name+'-'+s+'.log');}
const report={status:run.status===0&&results.every(r=>r.pass)?'PASS':'FAIL',method:'Actual installed native QtWebKit executes exact production CSS/ES5 from isolated copied resources; delayed DOM diagnostic validates and synthetically clicks original EXEC links; QSP-only callback confirms flags and actual info helper.',results,stdout:run.stdout,stderr:run.stderr,productionJsSha256:c.hash(fs.readFileSync(src+'/jo9_traits_view.js')),productionCssSha256:c.hash(fs.readFileSync(src+'/jo9_traits_view.css')),workUntouched:c.hash(fs.readFileSync(game+'/jack.qsp'))===hash,actualNativeMessages:messages,limits:[messages?'Two real MSG dialogs use synthetic close clicks gated by native elementFromPoint; final native profile must reopen after remember.':'Message layering uses real native DOM replay of engine message element, not an actual native MSG interaction before final marker.','Representative known-overflow actors only; full callback/actor snapshot coverage is in focused-native.cjs.']};
if(messages){report.testOnlyRunnerOverride="Copied run-client-smoke.ps1 into isolated output; unexpected-message guard matches only showMessage FAIL_ so two known QA help messages can be acknowledged. Completion marker and timeout checks stay unchanged.";report.messageEvidence=plan.map(p=>{const log=fs.readFileSync(out+'/'+p.name+'-stderr.log','utf8');return{name:p.name,firstMessages:(log.match(/showMessage\(\), str:\s*"QA_TRAIT_MSG_ONE"/g)||[]).length,secondMessages:(log.match(/showMessage\(\), str:\s*"QA_TRAIT_MSG_TWO"/g)||[]).length,refreshedOpenProfileCallback:log.includes("exec: gs 'qa_dom_finish'"),completion:log.includes(p.marker)}});}
fs.writeFileSync(rec+(messages?'/native-message-results.json':'/native-dom-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));a.equal(report.status,'PASS');
