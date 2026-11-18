const fs=require('fs'),vm=require('vm'),a=require('assert/strict'),test=require('node:test');
const root=process.env.JO9_DIRECT_CANDIDATE||'G:/somi/JO9sa/tools/modding-hub';
test('background defaults retry after an initial fetch failure and reuse successful data',async()=>{
 const code=fs.readFileSync(root+'/workspace-app.mjs','utf8'),start=code.indexOf('async function prepareBackgroundDefaults(){'),end=code.indexOf('\nasync function renderAll()',start),fn=code.slice(start,end);let imports=0,fetches=0,fail=true;
 const context={URL,document:{baseURI:'http://127.0.0.1:7689/v/test/'},state:{config:{}},save:()=>{},loadModule:async()=>{imports++;return {applyBackgroundDefaults:()=>false};},fetch:async()=>{fetches++;if(fail){fail=false;throw Error('temporary');}return {json:async()=>({records:[]})};}};
 const run=vm.runInNewContext('let backgroundDefaults;'+fn+';prepareBackgroundDefaults',context);
 await a.rejects(run(),/temporary/);await run();await run();a.equal(imports,2);a.equal(fetches,4);
});
test('delayed question and DB use requests register navigation before waiting for the view',()=>{
 const i=fs.readFileSync(root+'/integration.mjs','utf8'),g=fs.readFileSync(root+'/overrides/general-dialogue.mjs','utf8');
 a(i.includes("if(await api.switchTab('character'))globalThis.__jo9StudioApi"));a(g.includes("if(!await api.switchTab('character'))return;"));
 a(!i.includes("await api.ensureTab('character')"));
});
test('background factory renders its standalone panel on the first visit',async()=>{const code=fs.readFileSync(root+'/workspace-app.mjs','utf8'),line=code.split(/\r?\n/).find(s=>s.trimStart().startsWith('backgrounds:async')),expression=line.trim().slice('backgrounds:'.length).replace(/,$/,'');let rendered=0;const view={render:()=>rendered++};const factory=vm.runInNewContext('let workbench;('+expression+')',{loadModule:async()=>({createWorkbench:async()=>view}),api:{}});a.equal(await factory(),view);a.equal(rendered,1);});
