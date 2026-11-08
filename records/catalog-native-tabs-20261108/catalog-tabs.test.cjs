'use strict';
const a=require('assert/strict'),{test}=require('node:test'),{create}=require('./catalog-tabs.js');
function setup(responder){
 const nodes=new Map(),calls=[];function node(){return {dataset:{},hidden:true,textContent:'',attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},addEventListener(){},focus(){},append(...c){this.children.push(...c);},replaceChildren(...c){this.children=c;},remove(){},content:{querySelectorAll(){return [];},cloneNode(){return {markup:true};}}};}
 for(const k of ['gallery','girls','pack','mob','notes'])for(const type of ['panel','tab'])nodes.set('jo9-catalog-'+type+'-'+k,node());
 for(const id of ['tree','jo9CatalogTabs','jo9CatalogLoadStatus','jo9GalleryNav','jo9GirlsNav'])nodes.set(id,node());
 const document={getElementById:id=>nodes.get(id),createElement:()=>node(),body:node(),dispatchEvent(){}};
 const env={document,location:{href:'http://localhost/catalog',search:''},history:{replaceState(){}},fetch:async url=>{calls.push(url);return responder?responder(url):{ok:true,text:async()=>'<h2>tab</h2>'};},autoStart:false};
 return {tabs:create(env),nodes,calls};
}
global.CustomEvent=class{constructor(type,input){this.type=type;this.detail=input.detail;}};
test('선택 탭만 불러오고 재방문은 캐시하며 패널 하나만 보인다',async()=>{
 const s=setup();await s.tabs.activate('girls');a.deepEqual(s.calls,['catalog-tab/girls']);a.equal(s.tabs.loaded('gallery'),false);
 await s.tabs.activate('mob');await s.tabs.activate('girls');a.deepEqual(s.calls,['catalog-tab/girls','catalog-tab/mob']);
 a.equal([...s.nodes].filter(([id,n])=>id.includes('-panel-')&&!n.hidden).length,1);a.equal(s.tabs.current(),'girls');
});
test('느린 이전 요청이 나중 선택 탭을 덮거나 렌더하지 않는다',async()=>{
 let release;const s=setup(url=>url.endsWith('gallery')?new Promise(r=>release=()=>r({ok:true,text:async()=>'<h2>old</h2>'})):{ok:true,text:async()=>'<h2>new</h2>'});
 const old=s.tabs.activate('gallery');await s.tabs.activate('girls');release();await old;
 a.equal(s.tabs.current(),'girls');a.equal(s.tabs.loaded('gallery'),false);a.equal(s.nodes.get('jo9-catalog-panel-gallery').children.length,0);
 await s.tabs.activate('gallery');a.equal(s.tabs.loaded('gallery'),true);a.equal(s.calls.length,2);
});
test('같은 탭 중복 요청은 합치고 실패한 요청은 재시도한다',async()=>{
 let count=0;const s=setup(()=>{if(++count===1)throw Error('offline');return {ok:true,text:async()=>'<h2>retry</h2>'};});
 await s.tabs.activate('pack');a.equal(s.tabs.loaded('pack'),false);a.equal(s.nodes.get('jo9-catalog-panel-pack').children[1].textContent,'다시 불러오기');
 await Promise.all([s.tabs.activate('pack'),s.tabs.activate('pack')]);a.equal(s.calls.length,2);a.equal(s.tabs.loaded('pack'),true);
});
