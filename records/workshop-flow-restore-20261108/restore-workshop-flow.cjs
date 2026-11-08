'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),a=require('assert/strict'),vm=require('vm');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/workshop-flow-restore-20261108',O=R+'/records/workshop-flow-restore-20261108',before=JSON.parse(fs.readFileSync(O+'/before.json','utf8'));
function original(root,n){return z.gunzipSync(fs.readFileSync(O+'/before/'+before[root+'/'+n]+'.gz')).toString('utf8').replace(/\r\n/g,'\n');}
function replace(s,old,next){a.equal(s.split(old).length-1,1,old.slice(0,100));return s.replace(old,()=>next);}
function element(s,tag,start){const at=s.indexOf(start);a(at>=0,start);const re=new RegExp('<'+tag+'\\b[^>]*>|</'+tag+'>','g');re.lastIndex=at;let d=0;for(let m;(m=re.exec(s));){d+=m[0].startsWith('</')?-1:1;if(!d)return s.slice(at,re.lastIndex);}throw Error('Unclosed '+start);}
const roles=`function rangeRoles(entryKey,context,points){
  if(!context||!points)return [];const usage=context.flow?.usage,location=usage?.location||context.location,sceneId=usage?.sceneId||context.scene?.id;
  return ['start','end'].filter(role=>{const p=points[role],e=p?.selection;return e&&p.location===location&&String(p.sceneId)===String(sceneId)&&entryKey===e.hash+':'+e.fieldIndex+':'+e.start;});
 }`;
const helpers=`/* JO9 MOD START SHARED_SCENE_RANGE_20261108 */
let rangeSelecting=false;
function refreshRangeMarkers(){
 const state=window.JO9ScriptRange?.state();
 for(const el of document.querySelectorAll('#navigation [data-range-key]')){
  const roles=window.JO9WorkshopUI.rangeRoles(el.dataset.rangeKey,context,state);let badges=el.querySelector(':scope > .rangeRoleBadges');
  if(roles.length){if(!badges){badges=document.createElement('div');badges.className='rangeRoleBadges';el.prepend(badges);}badges.replaceChildren();for(const role of roles){const badge=document.createElement('strong');badge.className='rangeRole-'+role;badge.textContent=role==='start'?'시작지점':'마무리지점';badges.append(badge);}}
  else if(badges)badges.remove();
 }
 for(const actions of document.querySelectorAll('#navigation .rangePickActions'))actions.hidden=window.JO9WorkshopUI.current()!=='script';
}
function appendRangeActions(container,entry,sceneId){
 container.dataset.rangeKey=key(entry);const actions=document.createElement('div');actions.className='rangePickActions';actions.hidden=window.JO9WorkshopUI.current()!=='script';
 for(const [role,label]of [['start','이 대사를 시작으로'],['end','이 대사를 마무리로']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.rangeRole=role;button.disabled=rangeSelecting;
  button.onclick=async()=>{if(rangeSelecting)return;rangeSelecting=true;document.querySelectorAll('#navigation .rangePickActions button').forEach(b=>b.disabled=true);try{await selectEntry(entry,sceneId,false);await window.JO9ScriptRange.mark(role);if($('rangePrompt').childElementCount)$('rangePrompt').scrollIntoView({block:'center'});}catch(e){say(e.message,true);}finally{rangeSelecting=false;document.querySelectorAll('#navigation .rangePickActions button').forEach(b=>b.disabled=false);}};actions.append(button);}
 container.append(actions);
}
window.addEventListener('jo9:range-changed',refreshRangeMarkers);
/* JO9 MOD END SHARED_SCENE_RANGE_20261108 */
`;
for(const [id,root]of [['source',R+'/tools/text-workshop'],['work',W+'/modtools/text-workshop']]){
 fs.mkdirSync(T+'/'+id,{recursive:true});let html=original(root,'index.html'),ui=original(root,'workshop-ui.js'),range=original(root,'script-range.js'),css=original(root,'workshop.css');
 const edit=element(html,'div','<div id="workshopEditPanel"'),editor=element(edit,'section','<section id="editor"'),nav=element(edit,'section','<section id="navigation"'),advanced=element(nav,'details','<details id="scriptExportBox"');
 const tools=edit.slice(0,-6).replace(/^<div[^>]*>/,'').replace(editor,'').replace(nav,'');
 html=replace(html,edit,'<div id="workshopEditPanel" role="tabpanel" aria-labelledby="workshopEditTab" hidden>'+editor+'</div>'+nav.replace(advanced,'')+'<div id="workshopEditTools" hidden>'+advanced+tools+'</div>');
 const script=element(html,'div','<div id="workshopScriptPanel"');html=replace(html,script,'');html=replace(html,'<div id="workshopEditTools"',script+'<div id="workshopEditTools"');
 html=replace(html,'중간에 갈림길이 있으면 물어봅니다.','위 장면에서 대사별 시작·마무리 버튼으로 지정할 수도 있습니다.');
 html=replace(html,'<div class="row"><button type="button" id="rangeSave"', '<div class="row"><button type="button" id="rangeBackToFlow">선택한 대사 흐름으로 돌아가기</button><button type="button" id="rangeSave"');
 html=replace(html,'function routeCard(',helpers+'\nfunction routeCard(');
 html=replace(html,"gameLine(text,compact&&v.entry.text.length>240?v.entry.text.slice(0,240)+'…':v.entry.text);","gameLine(text,v.entry.text);");
 html=replace(html,"pick.textContent=selection&&key(selection)===key(v.entry)?'지금 수정 중':'이 대사 선택'", "pick.textContent=selection&&key(selection)===key(v.entry)?'지금 선택 중':'이 대사 선택'");
 html=replace(html,'card.append(pick);container.append(card);','card.append(pick);appendRangeActions(card,v.entry,sceneId);container.append(card);');
 html=replace(html,'gameLine(b,selection.text);lines.append(b);','gameLine(b,selection.text);appendRangeActions(b,selection,c.scene.id);lines.append(b);');
 html=replace(html,'lines.append(b);}return;}','const row=document.createElement(\'div\');row.append(b);appendRangeActions(row,e,c.scene.id);lines.append(row);}return;}');
 const first=" const prevButton=document.createElement('button');";
 html=replace(html,first," const firstButton=document.createElement('button');firstButton.textContent='처음 대사';firstButton.disabled=at<=0;firstButton.onclick=()=>jumpTo(stages[0]);bar.append(firstButton);\n"+first);
 html=replace(html,'bar.append(nextButton);lines.append(bar);',"bar.append(nextButton);const lastButton=document.createElement('button');lastButton.textContent='마지막 대사';lastButton.disabled=at<0||at===stages.length-1;lastButton.onclick=()=>jumpTo(stages.at(-1));bar.append(lastButton);lines.append(bar);");
 html=replace(html,"fullList();};if(allBox.open)fullList();", "fullList();refreshRangeMarkers();};if(allBox.open)fullList();");
 html=replace(html,"function renderPreview(){if(!context||window.JO9WorkshopUI.current()!=='edit')return;renderGame(context);if(window.JO9_DIALOGUE_AI_SELECT)window.JO9_DIALOGUE_AI_SELECT();}","function renderPreview(){if(!context)return;renderGame(context);refreshRangeMarkers();if(window.JO9_DIALOGUE_AI_SELECT)window.JO9_DIALOGUE_AI_SELECT();}");
 html=replace(html,"window.addEventListener('jo9:workshop-mode',e=>{if(e.detail==='edit')renderPreview();});", "window.addEventListener('jo9:workshop-mode',refreshRangeMarkers);");
 html=replace(html,"(window.JO9WorkshopUI.current()==='script'?$('scriptRangeBox'):$('editor')).scrollIntoView", "$('navigation').scrollIntoView");
 ui=replace(ui,' function create(document,events){',' '+roles+'\n function create(document,events){');
 ui=replace(ui,"get('dialogueAI').hidden=value!=='edit';", "get('dialogueAI').hidden=value!=='edit';if(get('workshopEditTools'))get('workshopEditTools').hidden=value!=='edit';");
 ui=replace(ui,'return {choose,current:()=>selected,dockHeight};','return {choose,current:()=>selected,dockHeight,rangeRoles};');ui=replace(ui,'return {create,dockHeight};','return {create,dockHeight,rangeRoles};');
 range=replace(range,"const summary=p=>p?preview(p.selection.text).slice(0,260):'미지정';","const summary=p=>p?(p.uiStage?p.uiStage.number+' / '+p.uiStage.total+'단계\\n':'')+preview(p.selection.text).slice(0,260):'미지정';");
 range=replace(range,"$('rangeEndLabel').textContent=summary(endPoint);buttons();", "$('rangeEndLabel').textContent=summary(endPoint);buttons();window.dispatchEvent(new Event('jo9:range-changed'));");
 range=replace(range,"labels();if(window.JO9WorkshopUI.current()==='script')box.scrollIntoView({block:'start'});",'labels();');
 range=replace(range,"function accept(role,p){\n  pending=false;", "function accept(role,p){\n  pending=false;const stages=current?.flow?.stages||[],stage=stages.find(s=>s.variants.some(v=>v.entry.fieldIndex===p.selection.fieldIndex&&v.entry.start===p.selection.start));if(stage)p={...p,uiStage:{number:stage.number,total:stages.length}};");
 range=replace(range," window.addEventListener('jo9:selection',event=>select(event.detail));", " $('rangeBackToFlow').onclick=()=>($('gameLines').querySelector('.line.selected')||$('navigation')).scrollIntoView({block:'center'});\n window.JO9ScriptRange={mark,state:()=>({start:startPoint,end:endPoint})};\n window.addEventListener('jo9:selection',event=>select(event.detail));");
 css+='\n/* JO9 MOD SHARED_SCENE_RANGE_20261108 */\n.rangePickActions:not([hidden]){display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.rangePickActions button{margin-top:0;width:auto;font-size:13px}.rangeRoleBadges{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px}.rangeRoleBadges strong{display:inline-block;padding:3px 9px;border-radius:5px;font-size:13px}.rangeRole-start{background:#1d624c;color:#d9fff2}.rangeRole-end{background:#874829;color:#fff0de}\n';
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc=/.test(m[1]))new vm.Script(m[2]);
 for(const [n,s]of [['index.html',html],['workshop-ui.js',ui],['script-range.js',range],['workshop.css',css]]){if(n.endsWith('.js'))new vm.Script(s);fs.writeFileSync(T+'/'+id+'/'+n,s);}
}
console.log('Shared flow candidates ready');
