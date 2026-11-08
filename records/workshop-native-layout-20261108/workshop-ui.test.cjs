'use strict';
const a=require('assert/strict'),{test}=require('node:test'),{create,dockHeight}=require('./workshop-ui.js');
global.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init.detail;}};
function setup(){const nodes={},events=[];for(const id of ['workshopScriptTab','workshopEditTab','workshopScriptPanel','workshopEditPanel','dialogueAI','rangeTaskTabs','replacement','additionText','aiCommand','aiReply','scriptAdapted'])nodes[id]={hidden:false,tabIndex:0,attrs:{},value:'draft:'+id,setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this[k]=fn;},focus(){this.focused=true;}};const ui=create({getElementById:id=>nodes[id]},{dispatchEvent:e=>events.push(e)});return {nodes,events,ui};}
test('초기 각본 모드와 수정 모드는 소유 패널·AI 도크를 함께 전환한다',()=>{
 const {nodes:n,ui,events}=setup();a.equal(ui.current(),'script');a(n.workshopEditPanel.hidden);a(n.dialogueAI.hidden);a(!n.workshopScriptPanel.hidden);
 n.workshopEditTab.onclick();a.equal(ui.current(),'edit');a(n.workshopScriptPanel.hidden);a(!n.dialogueAI.hidden);a(!n.workshopEditPanel.hidden);a.equal(n.workshopEditTab.attrs['aria-selected'],'true');a.equal(events.at(-1).detail,'edit');
});
test('탭을 왕복해도 수정 초안·추가 대사·AI 요청/응답·각색본을 건드리지 않는다',()=>{
 const {nodes:n,ui}=setup(),ids=['replacement','additionText','aiCommand','aiReply','scriptAdapted'];const before=ids.map(id=>n[id].value);ui.choose('edit');ui.choose('script');ui.choose('edit');a.deepEqual(ids.map(id=>n[id].value),before);
});
test('키보드 탭 이동과 잘못된 모드의 기본값을 처리한다',()=>{
 const {nodes:n,ui}=setup();n.rangeTaskTabs.keydown({key:'End',preventDefault(){}});a.equal(ui.current(),'edit');a(n.workshopEditTab.focused);ui.choose('unknown');a.equal(ui.current(),'script');
});
test('AI 높이 범위와 접기·펼치기의 확장 높이를 보존한다',()=>{
 a.deepEqual(dockHeight(330,false,720),{expanded:330,height:330});a.deepEqual(dockHeight(330,true,720),{expanded:330,height:48});a.equal(dockHeight(999,false,720).height,620);a.equal(dockHeight(12,false,720).height,180);
});
