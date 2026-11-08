'use strict';
const fs=require('fs'),a=require('assert/strict'),{test}=require('node:test');
const root=process.env.JO9_FLOW_UI_ROOT||'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop',html=fs.readFileSync(root+'/index.html','utf8');
test('기존 장면 흐름은 수정 전용 패널 밖의 공유 화면이다',()=>{
 const at=html.lastIndexOf('<div',html.indexOf('id="workshopEditPanel"')),re=/<div\b[^>]*>|<\/div>/g;re.lastIndex=at;let depth=0,end=at;for(let m;(m=re.exec(html));){depth+=m[0].startsWith('</')?-1:1;if(!depth){end=re.lastIndex;break;}}
 a(!html.slice(at,end).includes('id="navigation"'),'flow must not be inside the edit-only panel');
 a(!/function renderPreview\(\)\{[^\n]*current\(\)!=='edit'/.test(html),'script must render the same scene preview');
 a(!html.includes("if(window.JO9WorkshopUI.current()==='script')box.scrollIntoView"));
});
test('표식은 같은 대사라도 지정한 이벤트/판본에서만 보인다',()=>{
 const {rangeRoles}=require(root+'/workshop-ui.js'),selection={hash:'h',fieldIndex:2,start:20},point={selection,location:'town',sceneId:10},context={location:'#txt_man',flow:{usage:{location:'town',sceneId:10}}};
 a.deepEqual(rangeRoles('h:2:20',context,{start:point}),['start']);a.deepEqual(rangeRoles('h:2:20',context,{start:point,end:point}),['start','end']);
 a.deepEqual(rangeRoles('h:2:20',{...context,flow:{usage:{location:'town',sceneId:11}}},{start:point}),[]);a.deepEqual(rangeRoles('other:2:20',context,{start:point}),[]);
 a.deepEqual(rangeRoles('h:2:20',context,null),[]);
});
test('대사별 지정 버튼은 그 대사 선택이 끝난 뒤 마무리를 지정한다',async()=>{
 const vm=require('vm'),calls=[];let release;const gate=new Promise(r=>release=r);
 const node=()=>({dataset:{},children:[],append(...xs){this.children.push(...xs);}}),container=node(),entry={id:'clicked-page'};
 const doc={createElement:node,querySelectorAll:()=>[]};const scope={document:doc,key:e=>e.id,$:()=>({childElementCount:0}),say:e=>{throw Error(e);},selectEntry:async(e,s)=>{calls.push(['select',e.id,s]);await gate;calls.push(['ready',e.id]);},window:{JO9WorkshopUI:{current:()=> 'script'},JO9ScriptRange:{mark:async role=>calls.push(['mark',role])}}};vm.createContext(scope);
 const start=html.indexOf('let rangeSelecting=false;'),end=html.indexOf("window.addEventListener('jo9:range-changed'",start);a(start>=0&&end>start);vm.runInContext(html.slice(start,end),scope);
 scope.appendRangeActions(container,entry,'scene-2');const job=container.children[0].children[1].onclick();a.deepEqual(calls,[['select','clicked-page','scene-2']]);release();await job;a.deepEqual(calls,[['select','clicked-page','scene-2'],['ready','clicked-page'],['mark','end']]);
});
test('현재·다음·전체 대사에 직접 시작/마무리 지정과 표식을 연결한다',()=>{
 a(html.includes('appendRangeActions(card,v.entry,sceneId)'));a(html.includes('appendRangeActions(b,selection,c.scene.id)'));
 a(html.includes('처음 대사'));a(html.includes('마지막 대사'));a(html.includes('data-range-key')||html.includes('dataset.rangeKey'));
 a(!html.includes("v.entry.text.slice(0,240)+'…'"),'do not truncate the only text used to choose an endpoint');
});
