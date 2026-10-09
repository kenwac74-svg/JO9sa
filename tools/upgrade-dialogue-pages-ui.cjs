'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const file=path.join(__dirname,'text-workshop/index.html');let html=fs.readFileSync(file,'utf8');
function replace(old,value){if(!html.includes(old))throw Error('UI 수정 기준이 바뀌었습니다: '+old.slice(0,70));html=html.replace(old,value);}
replace('선택한 원문은 그대로 두고 새 대사를 추가합니다. 다음 페이지는 그림·소리 번호도 함께 이동합니다. 조건이나 페이지별 실행 동작이 복잡한 장면은 문단 추가를 사용하세요.','선택한 원문은 그대로 두고 새 대사를 추가합니다. 다음 페이지 추가는 뒤쪽 대사·페이지 조건·그림·소리·실행 처리를 함께 조정합니다. 새 페이지는 앞 페이지의 그림을 이어받으며 실행 처리와 소리는 복제하지 않습니다.');
replace("let drafts={};try{drafts=JSON.parse(sessionStorage.getItem('jo9-text-drafts')||'{}');}catch{}", "let drafts={},additionDrafts={};try{drafts=JSON.parse(sessionStorage.getItem('jo9-text-drafts')||'{}');additionDrafts=JSON.parse(sessionStorage.getItem('jo9-addition-drafts')||'{}');}catch{}");
replace('function persist(){',"function rememberAddition(){if(!selection)return;additionDrafts[key(selection)]={text:$('additionText').value,mode:$('additionMode').value};try{sessionStorage.setItem('jo9-addition-drafts',JSON.stringify(additionDrafts));}catch{}}\nfunction persist(){");
replace("if(previousKey!==(selection?key(selection):null)){$('additionText').value='';$('additionBox').open=false;}","if(previousKey!==(selection?key(selection):null)){const draft=selection?additionDrafts[key(selection)]:null;$('additionText').value=draft?.text||'';$('additionMode').value=draft?.mode||'page';$('additionBox').open=!!draft?.text;}");
replace("$('additionText').oninput=()=>invalidate();$('additionMode').onchange=()=>invalidate();", "$('additionText').oninput=()=>{rememberAddition();invalidate();};$('additionMode').onchange=()=>{rememberAddition();invalidate();};");
replace("+'\\n\\n기존 대사:\\n'+p.old", "+(p.adjustments?.length?'\\n\\n함께 조정한 연결:\\n'+p.adjustments.map(x=>'• '+x).join('\\n'):'')+'\\n\\n기존 대사:\\n'+p.old");
replace('if(oldKey)delete drafts[oldKey];','if(oldKey){delete drafts[oldKey];delete additionDrafts[oldKey];try{sessionStorage.setItem(\'jo9-addition-drafts\',JSON.stringify(additionDrafts));}catch{}}');
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))if(m[1].trim())new vm.Script(m[1]);
fs.writeFileSync(file,html);console.log('PASS: page-adjustment preview and addition draft persistence UI');
