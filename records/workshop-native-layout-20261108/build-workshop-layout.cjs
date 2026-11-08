'use strict';
const fs=require('fs'),vm=require('vm'),a=require('assert/strict'),path=require('path');
const T='G:/Codex/tmp/workshop-native-layout-20261108';
const beforeFile=fs.existsSync(T+'/before.json')?T+'/before.json':path.join(__dirname,'before.json');
const before=JSON.parse(fs.readFileSync(beforeFile,'utf8'));for(const id of ['source','work'])fs.mkdirSync(T+'/'+id,{recursive:true});
function original(id,name){const root=id==='source'?'G:/somi/JO9sa/tools/text-workshop':'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop';const h=before[root+'/'+name];a(h,name);return require('zlib').gunzipSync(fs.readFileSync('G:/somi/JO9sa/records/workshop-native-layout-20261108/before/'+h+'.gz')).toString('utf8').replace(/\r\n/g,'\n');}
function replace(s,old,next){a.equal(s.split(old).length-1,1,'anchor '+old.slice(0,100));return s.replace(old,()=>next);}
function expression(s,start,end){const at=s.indexOf(start);a(at>=0,start);const stop=s.indexOf(end,at+start.length);a(stop>at,end);return {start:at,end:stop+end.length,value:vm.runInNewContext(s.slice(at+start.length,stop),{},{timeout:1000})};}
function element(s,tag,start){const at=typeof start==='number'?start:s.indexOf(start);a(at>=0,'element '+start);const re=new RegExp('<'+tag+'\\b[^>]*>|</'+tag+'>','g');re.lastIndex=at;let depth=0,end;for(let m;(m=re.exec(s));){if(m[0].startsWith('</'))depth--;else depth++;if(depth===0){end=re.lastIndex;break;}}a(end>at);return s.slice(at,end);}
// Resolve repeated declarations once into each component's normal stylesheet rules.
function stylesheet(css){
 css=css.replace(/\/\*[\s\S]*?\*\//g,'');const rules=new Map(),media=[];let at=0;
 while(at<css.length){const open=css.indexOf('{',at);if(open<0)break;const selector=css.slice(at,open).trim();let depth=1,end=open+1;for(;end<css.length&&depth;end++){if(css[end]==='{')depth++;if(css[end]==='}')depth--;}const body=css.slice(open+1,end-1);at=end;
  if(selector.startsWith('@')){media.push(selector+'{'+stylesheet(body)+'}');continue;}
  for(let key of selector.split(',').map(s=>s.trim()).filter(Boolean)){
   if(key==='#zoom')key='#zoom:not([hidden])';
   if(['.bulkSelection','.bulkPager','.bulkApproval'].includes(key))key='#batchReplaceBox '+key;
   const props=rules.get(key)||new Map();for(const decl of body.split(';')){const colon=decl.indexOf(':');if(colon<0)continue;props.set(decl.slice(0,colon).trim(),decl.slice(colon+1).trim().replace(/\s*!important/g,''));}rules.set(key,props);
  }
 }
 return [...rules].map(([key,props])=>key+'{'+[...props].map(([k,v])=>k+':'+v).join(';')+'}').join('\n')+'\n'+media.join('\n');
}
for(const id of ['source','work']){
 const base=T+'/'+id,oldIndex=original(id,'index.html');let html=oldIndex,range=original(id,'script-range.js'),advanced=original(id,'script-export.js'),ai=original(id,'dialogue-ai.js'),variables=original(id,'variable-inspector.js');
 const oldCss=html.match(/<style>([\s\S]*?)<\/style>/)[1];
 const rangeCss=expression(range,"css.textContent=",";document.head.append(css);").value.split('\n').filter(line=>!line.startsWith('html[data-jo9-workshop-mode')).join('\n');
 const rangeMarkup=expression(range,'box.innerHTML=',";\n $('state').after(tabs,box);").value.replace('① 아래에서','① 위에서');
 const advancedCss=expression(advanced,'css.textContent = ',';\n  document.head.append(css);').value;
 const advancedMarkup=expression(advanced,'box.innerHTML = ',';\n  const anchor').value;
 const journalMarkup=expression(ai,'box.innerHTML=',';\n document.getElementById(\'editor\').prepend(box);').value;
 const aiMarkup=expression(ai,'panel.innerHTML=',';\n document.body.append(panel);').value.replace('<div class="aiBody">','<div class="aiBody" id="aiBody">');
 // Markup is declared once. These modules only bind behavior and dynamic results.
 const rBegin=range.indexOf(" const css=node('style');"),rEnd=range.indexOf(" let mode='script'",rBegin);a(rBegin>0&&rEnd>rBegin);
 range=range.slice(0,rBegin)+" const box=$('scriptRangeBox');\n"+range.slice(rEnd).replace("let mode='script',startPoint",'let startPoint');
 const taskBegin=range.indexOf(' function task(value)'),taskEnd=range.indexOf(' function buttons()',taskBegin);a(taskEnd>taskBegin);range=range.slice(0,taskBegin)+range.slice(taskEnd);
 range=replace(range,"if(mode==='script')box.scrollIntoView", "if(window.JO9WorkshopUI.current()==='script')box.scrollIntoView");
 const eBegin=advanced.indexOf("  const css = document.createElement('style');"),eEnd=advanced.indexOf('  const $ = id =>',eBegin);a(eEnd>eBegin);
 advanced=advanced.slice(0,eBegin)+"  const box=document.getElementById('scriptExportBox');\n"+advanced.slice(eEnd);
 const oldExportHook="  const previous = window.JO9_VARIABLE_SELECT;\n  // 장면이 바뀌면 출력 결과만 비운다. 붙여 넣은 각색본과 마지막 각본 ID는 유지한다.\n  window.JO9_VARIABLE_SELECT = function (c) { if (typeof previous === 'function') previous(c); reset(); };";
 advanced=replace(advanced.replace(/\r\n/g,'\n'),oldExportHook,"  // 장면이 바뀌면 출력 결과만 비우고 각색본·각본 ID는 유지한다.\n  window.addEventListener('jo9:selection',()=>reset());");
 const jBegin=ai.indexOf(" const box=document.createElement('section');box.id='journalKeywords';"),jEnd=ai.indexOf(' const get=id=>',jBegin);a(jEnd>jBegin);ai=ai.slice(0,jBegin)+" const box=document.getElementById('journalKeywords');\n"+ai.slice(jEnd);
 const aiBegin=ai.indexOf(" const style=document.createElement('style');"),aiEnd=ai.indexOf(' const el=id=>',aiBegin);a(aiEnd>aiBegin);ai=ai.slice(0,aiBegin)+" const panel=document.getElementById('dialogueAI');\n"+ai.slice(aiEnd);
 ai=replace(ai,' window.JO9_DIALOGUE_AI_SELECT=function(){'," window.JO9_DIALOGUE_AI_SELECT=function(){\n   if(window.JO9WorkshopUI.current()!=='edit')return;");
 const layout=ai.match(/ function layout\(\)\{[^\n]+\}/)[0];
 ai=replace(ai,layout," function layout(){const size=window.JO9WorkshopUI.dockHeight(height,closed,innerHeight);height=size.expanded;panel.style.height=size.height+'px';el('aiBody').hidden=closed;el('aiCollapse').textContent=closed?'펼치기':'접기';el('aiCollapse').setAttribute('aria-expanded',String(!closed));if(closed)el('aiSettings').hidden=true;try{localStorage.setItem('jo9DialogueAI',JSON.stringify({height,closed}));}catch{}}");
 ai=replace(ai,"window.addEventListener('resize',layout);layout();loadModels();window.JO9_DIALOGUE_AI_SELECT();", "window.addEventListener('resize',layout);let settingsStarted=false;function editOpened(){if(window.JO9WorkshopUI.current()!=='edit')return;layout();window.JO9_DIALOGUE_AI_SELECT();if(!settingsStarted){settingsStarted=true;loadModels();}}window.addEventListener('jo9:workshop-mode',editOpened);layout();editOpened();");
 variables=replace(variables,'  window.JO9_VARIABLE_SELECT(context);',"  window.addEventListener('jo9:selection',e=>window.JO9_VARIABLE_SELECT(e.detail));\n  window.JO9_VARIABLE_SELECT(context);");
 // Keep form/approval/draft storage code; render expensive game preview only in its task.
 html=replace(html,' renderGame(c);window.dispatchEvent(new CustomEvent(\'jo9:selection\',{detail:c}));if(window.JO9_VARIABLE_SELECT)window.JO9_VARIABLE_SELECT(c);if(window.JO9_DIALOGUE_AI_SELECT)window.JO9_DIALOGUE_AI_SELECT();'," renderPreview();window.dispatchEvent(new CustomEvent('jo9:selection',{detail:c}));");
 html=replace(html,'function render(c){',"function renderPreview(){if(!context||window.JO9WorkshopUI.current()!=='edit')return;renderGame(context);if(window.JO9_DIALOGUE_AI_SELECT)window.JO9_DIALOGUE_AI_SELECT();}\nwindow.addEventListener('jo9:workshop-mode',e=>{if(e.detail==='edit')renderPreview();});\nfunction render(c){");
 html=replace(html,"if(fromSearch){$('editor').scrollIntoView", "if(fromSearch){(window.JO9WorkshopUI.current()==='script'?$('scriptRangeBox'):$('editor')).scrollIntoView");
 // Initial DOM: shared search + explicit task panels + a real dock row.
 const sharedSearch=element(html,'section','<section><h2>1. 게임에서 본 원문 찾기').replace('<section>','<section id="searchPanel">');
 const bulk=element(html,'section','<section><details id="batchReplaceBox">');
 let editor=element(html,'section','<section id="editor"');editor=editor.replace('<section id="editor" hidden>','<section id="editor" hidden><section id="journalKeywords">'+journalMarkup+'</section>');
 let navigation=element(html,'section','<section id="navigation"');navigation=replace(navigation,'<div id="sceneTexts"></div></details>', '<div id="sceneTexts"></div></details><details id="scriptExportBox">'+advancedMarkup+'</details>');
 const history=element(html,'section','<section><details id="historyBox">');
 const tail=html.slice(html.indexOf('<script src="editing-tools.js">')).replace('</script></html>','</script>').replace(/\r\n/g,'\n');
 const uiCss=`\nhtml,body{height:100%;overflow:hidden}#workshopApp{height:100dvh;display:grid;grid-template-rows:minmax(0,1fr) auto}#workshopScroll{min-height:0;overflow:auto;overscroll-behavior:contain}#workshopEditPanel{min-width:0}#dialogueAI:not([hidden]){position:relative;z-index:8;background:#172438;border-top:2px solid #5a7a99;padding:12px;display:flex;flex-direction:column;min-height:48px}.aiBody{display:grid;grid-template-columns:210px 1fr 1fr;gap:12px;min-height:0;flex:1;overflow:auto}.aiBody textarea{height:100%;min-height:95px}.aiBody img{width:100%;height:120px;object-fit:contain}.aiBody label{display:flex;flex-direction:column;min-height:0}.aiHead{display:flex;gap:10px;align-items:center;margin-bottom:8px}#aiStatus{flex:1;font-size:13px}#aiSettings{position:absolute;bottom:55px;left:12px;width:min(500px,95vw);max-height:80vh;overflow:auto;background:#23344e;padding:16px;border:1px solid #8095af;border-radius:8px;z-index:9}#aiGrip{position:absolute;top:0;left:0;right:0;height:8px;cursor:ns-resize;touch-action:none}#aiReference{font-size:12px;overflow-wrap:anywhere}@media(max-width:700px){.aiBody{grid-template-columns:140px 1fr}.aiBody>label:last-child{grid-column:1/-1}}`;
 const css='/* JO9 MOD WORKSHOP_NATIVE_LAYOUT_20261108 */\n'+stylesheet(oldCss+'\n'+rangeCss+'\n'+advancedCss+'\n'+uiCss)+'\n[hidden]{display:none}\n';
 const header='<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>JO9 대사 편집실</title><link rel="stylesheet" href="workshop.css"></head><body>\n';
 const tabs='<nav id="rangeTaskTabs" role="tablist" aria-label="편집 작업"><button type="button" role="tab" id="workshopScriptTab" aria-controls="workshopScriptPanel" aria-selected="true">각본 파일 만들기</button><button type="button" role="tab" id="workshopEditTab" aria-controls="workshopEditPanel" aria-selected="false">대사 수정·반영</button></nav>';
 const initial=header+'<!-- JO9 MOD START WORKSHOP_NATIVE_LAYOUT_20261108 -->\n<div id="workshopApp"><div id="workshopScroll"><main><h1>JO9 대사 편집실</h1><p>대사를 찾아 각본으로 저장하거나 수정합니다. 각색 요청은 전송 버튼을 누를 때만 실행하며, 승인한 수정문을 현재 QSP에 저장합니다.</p><div id="state" class="muted">게임 파일을 읽고 있습니다.</div>'+tabs+sharedSearch+'\n<div id="workshopScriptPanel" role="tabpanel" aria-labelledby="workshopScriptTab"><section id="scriptRangeBox">'+rangeMarkup+'</section></div>\n<div id="workshopEditPanel" role="tabpanel" aria-labelledby="workshopEditTab" hidden>'+editor+navigation+bulk+history+'</div><div id="message" role="status" aria-live="polite"></div></main></div><aside id="dialogueAI" aria-label="AI 대사 각색" hidden>'+aiMarkup+'</aside></div>\n<div id="zoom" hidden><img alt=""></div>\n<!-- JO9 MOD END WORKSHOP_NATIVE_LAYOUT_20261108 -->\n<script src="workshop-ui.js"></script>\n';
 html=initial+tail+'\n</body></html>\n';
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc=/.test(m[1]))new vm.Script(m[2]);
 for(const [name,s]of [['index.html',html],['workshop.css',css],['script-range.js',range],['script-export.js',advanced],['dialogue-ai.js',ai],['variable-inspector.js',variables]]){if(name.endsWith('.js'))new vm.Script(s);fs.writeFileSync(base+'/'+name,s);}
 const journalStart=ai.indexOf("(function(){\n 'use strict';\n const model=window.JO9_JOURNAL;"),journalEnd=ai.indexOf('/* JO9_JOURNAL_END */',journalStart);a(journalEnd>journalStart);fs.writeFileSync(base+'/journal-keywords-ui.js',ai.slice(journalStart,journalEnd).trim()+'\n');
 fs.copyFileSync(__dirname+'/workshop-ui.js',base+'/workshop-ui.js');
 let server=original(id,'server.cjs');server=replace(server,"['/script-export.js','/dialogue-ai.js'", "['/workshop-ui.js','/script-export.js','/dialogue-ai.js'");
 const anchor="    // JO9 MOD START: text-batch-replace-20261018-static";
 server=replace(server,anchor,"    if(req.method==='GET'&&url.pathname==='/workshop.css'){res.writeHead(200,{'Content-Type':'text/css; charset=utf-8','Cache-Control':'no-store'});res.end(fs.readFileSync(path.join(__dirname,'workshop.css'),'utf8'));return;}\n"+anchor);new vm.Script(server);fs.writeFileSync(base+'/server.cjs',server);
}
console.log('Static workshop components and dock layout candidates ready');
