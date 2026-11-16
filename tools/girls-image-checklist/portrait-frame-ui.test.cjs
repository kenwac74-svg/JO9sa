'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=()=>fs.readFileSync(process.env.JO9_GIRLS_FRAME_UI||'G:/somi/JO9sa/tools/girls-image-checklist/catalog-girls-checklist.js','utf8');
function node(tag,text){return{tag,textContent:text||'',dataset:{},children:[],append(...v){this.children.push(...v);},showModal(){this.open=true;},close(){this.open=false;this.onclose?.();},remove(){this.removed=true;}};}
function fixture(){const dialogs=[];const ctx={node,document:{body:{append(d){dialogs.push(d);}}}};const text=source(),start=text.indexOf('  function portraitFramePreview('),end=text.indexOf('  async function addPortraitFrame(',start);a(start>=0,'portrait preview feature is missing');vm.createContext(ctx);vm.runInContext(text.slice(start,end),ctx);return{ctx,dialogs};}
test('portrait preview compares originals, warns about uncertain/shared frames, and cancel returns false',async()=>{
 const f=fixture(),p=f.ctx.portraitFramePreview({originalData:'AAA',data:'BBB',changed:true,frameState:'uncertain',sharedWith:[2]},'컬러 초상'),d=f.dialogs[0];a(d.open);const all=JSON.stringify(d);a(all.includes('원본'));a(all.includes('테두리'));a(all.includes('불확실'));a(all.includes('2'));d.children.find(x=>x.tag==='button'&&x.textContent==='취소').onclick();a.equal(await p,false);a(d.removed);
});
test('known frame preserves the file and the Apply action stays disabled',async()=>{
 const f=fixture(),p=f.ctx.portraitFramePreview({originalData:'AAA',data:'AAA',changed:false,frameState:'framed',sharedWith:[]},'흑백 초상'),d=f.dialogs[0];const yes=d.children.find(x=>x.textContent==='테두리 적용');a(yes.disabled);d.oncancel({preventDefault(){}});a.equal(await p,false);
});
test('all three portrait fields gain a real button while standing images keep their prior controls',()=>{
 const text=source();const start=text.indexOf('  function slot('),end=text.indexOf('  // JO9 MOD START CHECKLIST_DRESSED_LOOK',start);const ctx={node,ruleNote:()=>null,images:{checked:false},info:()=>'',exists:()=>true,live:true,put(){},imageLinkButton:()=>node('button','파일 선택·연결'),addPortraitFrame(){}};vm.createContext(ctx);vm.runInContext(text.slice(start,end),ctx);
 for(const field of ['seed_ava_clear','seed_ava_gray','seed_ava','fullimage']){const s=ctx.slot({id:1},field,'girls/face/test.png','있음','ok',field);a.equal(s.children.some(x=>x.textContent==='자동 테두리 만들기'),field!=='fullimage');}
});
test('cancel ends the preparing status and releases the busy guard without applying',async()=>{
 const text=source(),start=text.indexOf('  async function addPortraitFrame('),end=text.indexOf('  // JO9 MOD END CHECKLIST_PORTRAIT_FRAME',start);
 const ctx={busy:false,live:true,message:{textContent:''},portraitFramePreview:async()=>false,statusApi:async action=>{if(action==='character-images/read')return{characters:[{jsonSha256:'json'}]};if(action==='portrait-frame/preview')return{changed:true};throw Error('cancel must not apply');}};
 vm.createContext(ctx);vm.runInContext(text.slice(start,end),ctx);await ctx.addPortraitFrame({id:2574},'seed_ava_clear','컬러 초상');a.equal(ctx.busy,false);a.match(ctx.message.textContent,/취소/);a.doesNotMatch(ctx.message.textContent,/준비/);
});
