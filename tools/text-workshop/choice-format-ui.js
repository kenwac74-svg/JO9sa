/* JO9 MOD START CHOICE_FORMAT_UI_20261118 */
(()=>{'use strict';
 const el=id=>document.getElementById(id),names=['fontFamily','fontSize','letterSpacing','lineHeight','paragraphGap','color'],ids={fontFamily:'choiceFormatFontFamily',fontSize:'choiceFormatFontSize',letterSpacing:'choiceFormatLetterSpacing',lineHeight:'choiceFormatLineHeight',paragraphGap:'choiceFormatParagraphGap',color:'choiceFormatColor'},storage='jo9-choice-format-drafts';
 let formatDrafts={},choices=[],activeChoice=null,currentKey=null,revision=0,optionsVersion=0,owned=null,busy=false,layout=null,fontsReady=false,resetAll=false;
 try{formatDrafts=JSON.parse(sessionStorage.getItem(storage)||'{}');if(!formatDrafts||typeof formatDrafts!=='object'||Array.isArray(formatDrafts))formatDrafts={};}catch{}
 const normalize=value=>Object.fromEntries(names.map(name=>{const raw=value?.[name];if(raw===undefined||raw===null||String(raw).trim()==='')return[name,''];const text=String(raw).trim();return[name,!['fontFamily','color'].includes(name)&&Number.isFinite(Number(text))?Number(text):text];}));
 const read=()=>normalize(Object.fromEntries(names.map(name=>[name,el(ids[name]).value]))),choiceKey=c=>key(c.selection)+':'+c.anchorIndex;
 function formStyle(style){const value=normalize(style),ranges={fontSize:[6,120],letterSpacing:[-10,40],lineHeight:[0.5,4],paragraphGap:[-120,240]};for(const [name,[min,max]]of Object.entries(ranges))if(value[name]!==''&&(typeof value[name]!=='number'||value[name]<min||value[name]>max))value[name]='';if(value.color&&!/^#[a-f\d]{3}(?:[a-f\d]{3})?$/i.test(value.color))value.color='';return value;}
 function patch(){const value=read(),base=formStyle(activeChoice?.style),out=resetAll?normalize({}):{};for(const name of names)if(value[name]!==base[name]||resetAll)out[name]=value[name];return out;}
 function save(){try{sessionStorage.setItem(storage,JSON.stringify(formatDrafts));}catch{}}
 function rememberFormat(){if(!activeChoice)return;const id=choiceKey(activeChoice),style=patch();if(!Object.keys(style).length)delete formatDrafts[id];else formatDrafts[id]={selection:activeChoice.selection,anchorIndex:activeChoice.anchorIndex,style,resetAll};save();}
 function cancelPreview(){revision++;owned=null;el('choiceFormatPreviewBox').hidden=true;}
 function syncColorPicker(value){const hex=String(value||'').trim();if(/^#[a-f\d]{6}$/i.test(hex))el('choiceFormatColorPicker').value=hex;else if(/^#[a-f\d]{3}$/i.test(hex))el('choiceFormatColorPicker').value='#'+[...hex.slice(1)].map(c=>c+c).join('');}
 function changed(){if(busy)return;syncColorPicker(el(ids.color).value);cancelPreview();invalidate();rememberFormat();}
 function enable(){const disabled=busy||!activeChoice;for(const name of names)el(ids[name]).disabled=disabled;el('choiceFormatColorPicker').disabled=disabled;el('choiceFormatReset').disabled=disabled;el('choiceFormatPreview').disabled=disabled;el('choiceFormatTarget').disabled=busy||!choices.length;}
 function status(text,bad=false){el('choiceFormatStatus').textContent=text;el('choiceFormatStatus').className=bad?'error':'muted';}
 function fill(choice){activeChoice=choice||null;const draft=choice&&formatDrafts[choiceKey(choice)];resetAll=!!draft?.resetAll;const style={...(resetAll?normalize({}):formStyle(choice?.style)),...draft?.style};for(const name of names)el(ids[name]).value=style[name];syncColorPicker(style.color||'#0000ff');enable();}
 async function loadOptions(){
  const source=selection;if(!source){choices=[];fill(null);el('choiceFormatTarget').replaceChildren();status('대사를 먼저 선택하세요.');return;}
  const stamp=++optionsVersion,sourceKey=key(source);choices=[];fill(null);el('choiceFormatTarget').replaceChildren();status('현재 페이지의 선택지를 읽고 있습니다.');
  try{const result=await api('/api/choice-format/options',{selection:source,sceneId:context?.scene?.id,usageId:context?.flow?.usage?.id});if(stamp!==optionsVersion||!selection||key(selection)!==sourceKey)return;
   layout=result.gameLayout||null;fontsReady=false;if(layout&&window.JO9ScriptReview?.loadGameFonts)fontsReady=await window.JO9ScriptReview.loadGameFonts(document,layout);if(stamp!==optionsVersion||!selection||key(selection)!==sourceKey)return;
   choices=(result.choices||[]).filter(c=>c.selection&&Number.isInteger(c.anchorIndex));const picker=el('choiceFormatTarget');picker.replaceChildren();for(const choice of choices){const option=document.createElement('option');option.value=String(choice.id);option.textContent=String(choice.label||'선택지')+' · '+(choice.sourceLine||choice.selection.line||'?')+'행';picker.append(option);}
   const selected=choices.find(c=>key(c.selection)===sourceKey)||choices[0];if(selected)picker.value=String(selected.id);fill(selected);status(selected?'선택한 선택지의 서식만 바꿉니다. 미리보기 후 아래 승인·반영을 사용하세요.':result.message||'이 페이지에서 서식을 편집할 기존 HTML 선택지를 찾지 못했습니다.');
  }catch(error){if(stamp===optionsVersion){choices=[];fill(null);status(error.message,true);}}
 }
 function sync(){const next=selection?key(selection)+'|'+(context?.scene?.id??'')+'|'+(context?.flow?.usage?.id??''):'';if(next===currentKey)return;if(!busy)rememberFormat();currentKey=next;cancelPreview();loadOptions();}
 for(const name of names)el(ids[name]).addEventListener('input',changed);
 el('choiceFormatColorPicker').addEventListener('input',()=>{el(ids.color).value=el('choiceFormatColorPicker').value;changed();});
 el('choiceFormatReset').onclick=()=>{if(busy||!activeChoice)return;resetAll=true;for(const name of names)el(ids[name]).value='';changed();};
 el('choiceFormatTarget').addEventListener('change',()=>{if(busy)return;rememberFormat();cancelPreview();invalidate();fill(choices.find(c=>String(c.id)===el('choiceFormatTarget').value));});
 window.addEventListener('jo9:selection',sync);window.addEventListener('jo9:single-preview',cancelPreview);window.addEventListener('jo9:text-changed',()=>{cancelPreview();optionsVersion++;});
 function drawPreview(choice,style){
  const host=el('choiceFormatPreviewText'),sample=el('choiceFormatSample'),profile=layout?.profiles?.dialogue;
  Object.assign(host.style,{fontFamily:profile?'"'+profile.fontFamily+'"':'',fontSize:profile?profile.fontSize+'px':'',lineHeight:profile?.lineHeight||'',color:profile?.color||'',maxWidth:profile?.rect?.width?profile.rect.width+'px':''});
  sample.textContent=String(choice.label||activeChoice?.label||'선택지');const s=normalize(style),length=value=>value===''?'':typeof value==='number'?value+'px':value;Object.assign(sample.style,{fontFamily:s.fontFamily,fontSize:length(s.fontSize),letterSpacing:length(s.letterSpacing),lineHeight:s.lineHeight===''?'':String(s.lineHeight),marginBottom:length(s.paragraphGap),color:s.color||'#0000ff'});
  el('choiceFormatPreviewNote').textContent=profile?'현재 WORK 게임 글꼴·크기 기준 참고 미리보기'+(fontsReady?'':' · 게임 글꼴 로드 미확인')+' · 창이 좁으면 미리보기 폭이 줄어듭니다. 원래 줄바꿈과 실제 게임 배치는 게임에서 확인하세요.':'선택지 서식 참고 미리보기 · 현재 게임의 기본 글꼴 정보를 읽지 못했습니다. 실제 게임 배치는 게임에서 확인하세요.';el('choiceFormatPreviewBox').hidden=false;
 }
 el('choiceFormatPreview').onclick=async()=>{
  if(busy)return;const button=el('choiceFormatPreview');button.disabled=true;
  try{if(!activeChoice||!selection)throw Error('서식을 바꿀 선택지를 먼저 고르세요.');rememberFormat();invalidate();cancelPreview();const target=activeChoice,targetKey=choiceKey(target),sourceKey=key(selection),style=patch(),pending=api('/api/preview',{operation:'choice-format',selection:target.selection,choiceFormat:{anchorIndex:target.anchorIndex,style}}),stamp=++revision,p=await pending;
   if(stamp!==revision||!activeChoice||choiceKey(activeChoice)!==targetKey||!selection||key(selection)!==sourceKey)return;
   previewId=p.id;owned={id:p.id,target,style:p.choiceFormat?.style||style,preview:p};el('difference').hidden=false;el('diff').textContent='위치: '+p.location+' / '+p.line+'행\n선택지: '+target.label+'\n\n원문:\n'+p.old+'\n\n수정문:\n'+p.new;drawPreview(p.choiceFormat||target,owned.style);say('선택지 서식 미리보기입니다. 아래 승인 체크 후 기존 반영 버튼을 누르면 이 선택지 한 곳을 저장합니다.');
  }catch(error){say(error.message,true);}finally{enable();}
 };
 const ownsPreview=id=>!!owned&&owned.id===id;
 function rebase(entry,before,after){if(!entry||!after)return null;if(key(entry)===key(before))return{...after};const delta=after.end-before.end,shift=entry.fieldIndex===before.fieldIndex&&entry.start>=before.end?delta:0;return{...entry,hash:after.hash,start:entry.start+shift,end:entry.end+shift};}
 function rebaseScene(id,location,before,after){const match=String(id||'').match(/^(condition:)?(\d+)$/);return location===before.location&&match&&Number(match[2])>=before.end?(match[1]||'')+(Number(match[2])+after.end-before.end):id;}
 function rebaseFormatDrafts(before,after,submitted){const next={};for(const [id,draft]of Object.entries(formatDrafts)){if(id===submitted)continue;if(after&&draft.selection?.hash===before.hash){const moved={...draft,selection:rebase(draft.selection,before,after)};next[choiceKey(moved)]=moved;}else next[id]=draft;}formatDrafts=next;save();}
 function captureDraft(main){return{replacement:el('replacement').value,textDirty:el('replacement').value!==main?.text,addition:el('additionText').value,additionMode:el('additionMode').value,additionOpen:el('additionBox').open,choiceLabel:el('choiceLabel').value,choiceActionCode:el('choiceActionCode').value,choiceCondition:el('choiceCondition').value,choiceOpen:el('choiceAdditionBox').open};}
 function restoreDraft(draft,text){el('replacement').value=draft.textDirty?draft.replacement:text;el('additionText').value=draft.addition;el('additionMode').value=draft.additionMode;el('additionBox').open=draft.additionOpen;for(const id of ['choiceLabel','choiceActionCode','choiceCondition'])el(id).value=draft[id];el('choiceAdditionBox').open=draft.choiceOpen;rememberAddition();window.JO9ChoiceEditor?.remember();if(typeof remember==='function')remember();}
 async function apply(){
  if(!ownsPreview(previewId)||!el('approved').checked)throw Error('선택지 서식 미리보기와 승인이 필요합니다.');if(busy)return;
  rememberFormat();const submitted=owned,before=submitted.target.selection,originalMain=selection,originalContext=context;let saved=false,draft=captureDraft(selection),moved=null;
  busy=true;enable();try{
   const result=await api('/api/apply',{id:submitted.id,approved:true});saved=true;const main=selection||originalMain,current=context||originalContext;draft=captureDraft(main);rebaseFormatDrafts(before,result.selection,choiceKey(submitted.target));window.dispatchEvent(new Event('jo9:text-changed'));invalidate();visits=[];
   if(!result.selection)throw Error('저장된 선택지의 새 원문 위치를 다시 확인해야 합니다.');moved=rebase(main,before,result.selection);const sceneId=rebaseScene(current?.scene?.id,current?.location||main?.location,before,result.selection),usage=current?.flow?.usage,usageId=usage?.location&&usage?.sceneId!==undefined?usage.location+':'+rebaseScene(usage.sceneId,usage.location,before,result.selection):usage?.id;render(await api('/api/context',{selection:moved,sceneId,usageId,mode:mode()}));restoreDraft(draft,moved.text);
   await refresh();await state();say('선택지 서식을 반영했습니다. 작성 중인 본문·추가 초안은 유지했습니다. 변경 기록: '+result.id);
  }catch(error){if(saved)restoreDraft(draft,moved?.text||draft.replacement);say((saved?'저장은 완료됐지만 화면 갱신을 마치지 못했습니다. 작성 중인 초안을 보존한 뒤 새로고침하세요. ':'')+error.message,true);}finally{busy=false;enable();}
 }
 window.JO9ChoiceFormat={dirty:()=>choices.some(c=>!!formatDrafts[choiceKey(c)])||!!activeChoice&&!!Object.keys(patch()).length,remember:rememberFormat,ownsPreview,apply};sync();
})();
/* JO9 MOD END CHOICE_FORMAT_UI_20261118 */
