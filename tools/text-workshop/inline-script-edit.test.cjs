'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root=process.env.JO9_INLINE_ROOT||'G:/somi/JO9sa/tools/text-workshop';
const ui=require(root+'/script-review.js');
const original='# 각본 ID: 0123456789abcdef\r\n\\==== [S1] town ====\r\n\r\n\\---- [S1-P1] ----\\\r\n(조건: visit = 1)\r\n가: 원문 하나\r\n\r\n(S1-P1-V1 · 조건: night) 대체문\r\n가: 야간 판본\r\n\r\n---- [S1-P2] ----\r\n나: 원문 둘\r\n\r\n▶ 다음 장면\r\n';
test('카드 수정은 지정 페이지 본문만 바꾸고 ID/조건/분기/다른 판본을 보존한다',()=>{
 const changed=ui.replaceBlock(original,'S1-P1','가: 고친 말\n두 번째 줄');a.equal(changed,original.replace('가: 원문 하나','가: 고친 말\r\n두 번째 줄'));
 a.equal(ui.replaceBlock(changed,'S1-P1-V1','가: 고친 야간'),changed.replace('가: 야간 판본','가: 고친 야간'));
});
test('빈 페이지와 장면문구도 편집하고 중복ID/없는ID/본문의 새 구분선은 거부한다',()=>{
 a.equal(ui.replaceBlock('---- [S1-P1] ----','S1-P1','새 본문'),'---- [S1-P1] ----\n새 본문\n');
 a.equal(ui.replaceBlock('---- [S1-P1] ----\n\n[S1-L1 · 장면 문구]\n기존\n','S1-L1','새 문구'),'---- [S1-P1] ----\n\n[S1-L1 · 장면 문구]\n새 문구\n');
 a.throws(()=>ui.replaceBlock(original,'S2-P1','x'),/번호|페이지/);a.throws(()=>ui.replaceBlock(original+'---- [S1-P1] ----\nx','S1-P1','x'),/중복/);a.throws(()=>ui.replaceBlock(original,'S1-P1','가: 말\n---- [S2-P1] ----'),/구분선|메타/);
});
function setup(){
 const nodes=new Map(),listeners={};
 function node(tag='div'){return {tag,type:'',value:'',checked:false,disabled:false,hidden:false,textContent:'',style:{},children:[],dataset:{},listeners:{},append(...xs){this.children.push(...xs);},replaceChildren(...xs){this.children=xs;},setAttribute(){},addEventListener(n,fn){this.listeners[n]=fn;},querySelectorAll(selector){const out=[];const tags=selector.split(',');const visit=e=>{if(e&&typeof e==='object'){if(tags.includes(e.tag))out.push(e);e.children?.forEach(visit);}};this.children.forEach(visit);return out;}};}
 const $=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 for(const id of ['scriptApproved','scriptAllowMissing','scriptRevalidate'])$(id).type='checkbox';
 $('scriptAdapted').value='# 각본 ID: 0123456789abcdef\n---- [S1-P1] ----\n가: 초안 하나\n\n---- [S1-P2] ----\n나: 초안 둘\n';$('scriptImportId').value='0123456789abcdef';$('scriptLayoutWidth').value='720';$('scriptLayoutHeight').value='480';$('scriptLayoutFont').value='18';
 const calls=[];const scope={window:{JO9ScriptReview:{...ui,draw:()=>[]},addEventListener:(n,fn)=>listeners[n]=fn,dispatchEvent(){}},document:{getElementById:$,createElement:node},sessionStorage:{getItem:()=>null,setItem(){}},Event:class{},api:async(url,data)=>{calls.push({url,data});return {id:'review',count:2,unchanged:0,missing:0,checks:{},changes:[{id:'S1-P1',location:'town',line:1,oldPlain:'가: 원문 하나',newPlain:'가: 초안 하나',warnings:[],excluded:false},{id:'S1-P2',location:'town',line:2,oldPlain:'나: 원문 둘',newPlain:'나: 초안 둘',warnings:[],excluded:false}]};}};
 vm.runInNewContext(fs.readFileSync(root+'/script-import-ui.js','utf8'),scope);return {$,calls};
}
test('오른쪽 카드 입력은 다른 카드를 지우지 않고 전체각본과 동기화하며 승인을 무효화한다',async()=>{
 const {$,calls}=setup();await $('scriptPreview').onclick();const editors=$('scriptChanges').querySelectorAll('textarea');a.equal(editors.length,2,'right columns must be real editors');
 $('scriptApproved').checked=true;$('scriptApproved').onchange();a.equal($('scriptApply').disabled,false);
 editors[0].value='가: 직접 수정';editors[0].oninput();a($('scriptAdapted').value.includes('가: 직접 수정'));a.equal($('scriptChanges').querySelectorAll('textarea').length,2);a.equal($('scriptApproved').checked,false);a.equal($('scriptApply').disabled,true);
 editors[1].value='나: 두 번째 직접 수정';editors[1].oninput();a($('scriptAdapted').value.includes('나: 두 번째 직접 수정'));await $('scriptApply').onclick();a.equal(calls.length,1);await $('scriptPreview').onclick();a(calls.at(-1).data.text.includes('가: 직접 수정'));a(calls.at(-1).data.text.includes('나: 두 번째 직접 수정'));
});
test('카드에서 잘못된 구분선을 입력하면 재검토와 반영을 막고 수정하면 다시 허용한다',async()=>{
 const {$}=setup();await $('scriptPreview').onclick();const editor=$('scriptChanges').querySelectorAll('textarea')[0];a(editor);editor.value='---- [S9-P9] ----';editor.oninput();a.equal($('scriptPreview').disabled,true);a.equal($('scriptApply').disabled,true);editor.value='가: 바로잡음';editor.oninput();a.equal($('scriptPreview').disabled,false);a($('scriptAdapted').value.includes('가: 바로잡음'));
});
test('잘못된 카드 입력을 전체 각본에서 고쳐도 검토 버튼을 다시 쓸 수 있다',async()=>{
 const {$}=setup();await $('scriptPreview').onclick();const editor=$('scriptChanges').querySelectorAll('textarea')[0];a(editor);editor.value='---- [S9-P9] ----';editor.oninput();a.equal($('scriptPreview').disabled,true);$('scriptAdapted').listeners.input();a.equal($('scriptPreview').disabled,false);
});
test('직접 편집 뒤 다시 검토해도 사용자가 제외한 페이지 선택은 유지한다',async()=>{
 const {$,calls}=setup();await $('scriptPreview').onclick();const check=$('scriptChanges').querySelectorAll('input')[0];check.checked=false;await check.onchange();const editor=$('scriptChanges').querySelectorAll('textarea')[1];a(editor);editor.value='나: 계속 편집';editor.oninput();await $('scriptPreview').onclick();a(calls.at(-1).data.exclude.includes('S1-P1'));
});
