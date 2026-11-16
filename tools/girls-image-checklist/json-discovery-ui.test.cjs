'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=()=>fs.readFileSync(process.env.JO9_GIRLS_UI||'G:/somi/JO9sa/tools/girls-image-checklist/catalog-girls-checklist.js','utf8');
function functions(text,begin,end,ctx){const s=text.indexOf(begin),e=text.indexOf(end,s);a(s>=0&&e>s,'JSON discovery implementation is missing');vm.createContext(ctx);vm.runInContext(text.slice(s,e),ctx);return ctx;}
function helperContext(){return functions(source(),'  // JO9 MOD START CHECKLIST_JSON_DISCOVERY_20261111','  // JO9 MOD END CHECKLIST_JSON_DISCOVERY_20261111',{});}
function mergeContext(){const data={characters:[{id:1,name:'기존',json:'json/slaves/1.json',refs:{fullimage:'old.png'},assets:['old.png','alias.png'],compatibilityAssets:[{path:'alias.png'}],catalogNote:'사용자 참고',legacyFields:['special'],namedSceneAssets:['named.png']}]};
 const ctx={data,normal:p=>String(p||'').toLowerCase(),files:new Map(),exists:p=>['new.png','old.png','named.png','alias.png'].includes(p),namedLabel:{replaceChildren(){}},namedOnly:{},document:{createTextNode:s=>s},collectActions:()=>new Map(),render(){},Date};
 const helper=helperContext();for(const key of Object.keys(helper))ctx[key]=helper[key];
 functions(source(),'  function mergeCharacterLinks(','  let currentLinksLoading=',ctx);return ctx;}
test('numberless JSON has a file identity while numeric IDs remain comparable and labels hide storage keys',()=>{
 const c=helperContext();a.equal(c.characterNumber({id:3040}),3040);a.equal(c.characterNumber({id:'json:heroine.json',characterNumber:null}),null);a.equal(c.characterNumber({id:'json:3040_extra.json',characterNumber:3040}),3040);
 a.equal(c.characterLabel({id:'json:heroine.json',characterNumber:null}),'번호 없음');
 const list=[{id:'json:zeta.json',name:'나',json:'json/slaves/zeta.json'},{id:3040,name:'춘향'},{id:'json:alpha.json',name:'가',json:'json/slaves/alpha.json'},{id:1,name:'기존'}];
 a.deepEqual(list.sort((x,y)=>c.compareCharacters(x,y,'id')).map(x=>x.id),[1,3040,'json:alpha.json','json:zeta.json']);
 a.deepEqual(list.sort((x,y)=>c.compareCharacters(x,y,'id-desc')).map(x=>x.id),[3040,1,'json:alpha.json','json:zeta.json']);
});
test('full JSON discovery appends and updates new records without duplicates or losing existing metadata',()=>{
 const c=mergeContext();c.mergeCharacterLinks({files:['new.png','old.png','named.png','alias.png'],characters:[{id:1,refs:{fullimage:'new.png'},assets:['new.png']},{id:3040,name:'춘향',refs:{fullimage:'new.png'},json:'json/slaves/3040_chunhyang.json'},{id:'json:heroine.json',characterNumber:null,name:'번호 없는 인물',json:'json/slaves/heroine.json',refs:{fullimage:'new.png'}}]});
 a.equal(c.data.characters.length,3);const old=c.data.characters[0];a.equal(old.catalogNote,'사용자 참고');a.deepEqual(Array.from(old.legacyFields),['special']);a(!old.assets.includes('alias.png'));a(old.assets.includes('named.png'));a(old.assets.includes('new.png'));
 const none=c.data.characters.find(x=>typeof x.id==='string');a(Array.isArray(none.assets));a.equal(none.random,false);a.deepEqual(JSON.parse(JSON.stringify(none.refs)),{fullimage:'new.png'});
 c.mergeCharacterLinks({characters:[{id:3040,name:'춘향 갱신',refs:{}}]});a.equal(c.data.characters.length,3);a.equal(c.data.characters.find(x=>x.id===3040).name,'춘향 갱신');
});
test('refresh requests all JSON files rather than restricting discovery to manifest IDs',async()=>{
 const text=source(),seen=[],ctx={live:true,currentLinksLoading:false,statusApi:async(route,input)=>{seen.push({route,input});return{characters:[],files:[],errors:[]};},mergeCharacterLinks(){},message:{},data:{characters:[{id:1}]}};
 functions(text,'  async function readCurrentLinks(','  function imageLinkButton(',ctx);await ctx.readCurrentLinks(true);a.equal(seen.length,1);a.equal(seen[0].route,'character-images/read');a.equal(Object.hasOwn(seen[0].input,'ids'),false);a.equal(seen[0].input.rescan,true);
});
test('a numeric identity changing to duplicate-file identities updates its JSON card without a phantom record',()=>{
 const c=mergeContext();c.data.characters=[{id:3040,name:'춘향',json:'json/slaves/3040_chunhyang.json',refs:{fullimage:'old.png'},assets:[],catalogNote:'기존 메모'}];
 const current={characters:[{id:'json:3040_chunhyang.json',characterNumber:3040,name:'춘향',json:'json/slaves/3040_chunhyang.json',refs:{}},{id:'json:3040_other.json',characterNumber:3040,name:'다른 인물',json:'json/slaves/3040_other.json',refs:{}}]};
 c.mergeCharacterLinks(current);a.equal(c.data.characters.length,2);a(!c.data.characters.some(x=>x.id===3040));const previous=c.data.characters.find(x=>x.id==='json:3040_chunhyang.json');a.equal(previous.catalogNote,'기존 메모');a.deepEqual(Array.from(previous.previousCharacterIds),[3040]);a.deepEqual(Array.from(c.data.characters.find(x=>x.id==='json:3040_other.json').previousCharacterIds),[]);
 c.mergeCharacterLinks(current);a.equal(c.data.characters.length,2);a.deepEqual(Array.from(previous.previousCharacterIds),[3040]);
});
test('old numeric tags remain visibly archived without assigning them to a newly duplicated file',()=>{
 const text=source(),ctx={statusState:{characterItems:{'3040':['done','todo']}},flagSpecs:[['done','완료'],['todo','작업필요']],node:(tag,value)=>({tag,textContent:value})};
 functions(text,'  function previousTagNote(','  function render()',ctx);const before=JSON.stringify(ctx.statusState);
 const note=ctx.previousTagNote({id:'json:3040_chunhyang.json',previousCharacterIds:[3040]});a(note.textContent.includes('3040'));a(note.textContent.includes('완료'));a(note.textContent.includes('작업필요'));a.equal(ctx.previousTagNote({id:'json:3040_other.json',previousCharacterIds:[]}),null);a.equal(JSON.stringify(ctx.statusState),before);a(!ctx.statusState.characterItems['json:3040_chunhyang.json']);
});
test('numberless names and JSON filenames are searchable and numeric rows still search by their number',()=>{
 const helpers=helperContext(),ctx={...helpers,data:{characters:[{id:3040,name:'춘향',json:'json/slaves/3040_chunhyang.json',refs:{},assets:[]},{id:'json:heroine.json',characterNumber:null,name:'독립 인물',json:'json/slaves/heroine.json',refs:{},assets:[]}]},appliedSearch:'heroine',namedOnly:{checked:false},selectedTag:'',filter:{value:'all'},sort:{value:'id'},evaluation:()=>({}),statusState:{}};
 functions(source(),'  function chooseRows()','  function assetUrl(',ctx);a.equal(ctx.chooseRows()[0].id,'json:heroine.json');ctx.appliedSearch='3040';a.equal(ctx.chooseRows()[0].id,3040);ctx.appliedSearch='독립';a.equal(ctx.chooseRows()[0].id,'json:heroine.json');
});
test('render does not invent numbered action paths for a JSON without a number',()=>{
 const helpers=helperContext(),paths=[];
 function node(tag,text,className){return{tag,textContent:text||'',className,dataset:{},children:[],append(...values){this.children.push(...values);},replaceChildren(...values){this.children=values;}};}
 const unnumbered={id:'json:heroine.json',characterNumber:null,name:'독립 인물',json:'json/slaves/heroine.json',refs:{},assets:[]};
 const ctx={...helpers,node,window:{},dirty:false,chooseRows:()=>[unnumbered],page:0,pageSize:12,data:{characters:[unnumbered]},evaluation:()=>({}),status:{},pager:node('div'),list:node('div'),tags:()=>node('div'),previousTagNote:()=>null,pathWarningBox:()=>null,full:()=>'',exists:()=>false,slot:()=>node('div'),dressed:()=>node('div'),roles:[],outfits:[],actionsById:new Map(),actionFamilies:['clean'],actionNames:{},fieldLabels:{},syncTags(){},pathRow:(path)=>{paths.push(path);return node('div');}};
 functions(source(),'  function render()','  async function rescan()',ctx);ctx.render();a.equal(paths.length,0);a(JSON.stringify(ctx.list).includes('번호 없음'));a(!JSON.stringify(ctx.list).includes('girls/sex_scenes/json:'));
});
