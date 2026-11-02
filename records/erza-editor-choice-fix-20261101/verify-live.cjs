'use strict';
const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
(async()=>{
 const base='http://127.0.0.1:3813',html=await(await fetch(base+'/')).text(),token=html.match(/(?:const|let|var)\s+token\s*=\s*['"]([^'"]+)['"]/i)?.[1];a(token,'session token');
 async function api(url,data){const r=await fetch(base+url,{method:data?'POST':'GET',headers:{'X-JO9-Token':token,...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});const v=await r.json();a(r.ok,JSON.stringify(v));return v;}
 const state=await api('/api/state'),raw=fs.readFileSync(state.target),hash=c.hash(raw);a.equal(state.hash,hash);
 const search=await api('/api/search?q='+encodeURIComponent('생기 없는 몸을 실망스러운 눈으로 바라본다')+'&mode=text');a.equal(search.total,1);const selection=search.results[0];
 const modes=[];
 for(const mode of ['text','all']){
  const view=await api('/api/context',{selection,mode});
  const choices=view.branches.filter(x=>x.kind==='choice');a.equal(choices.length,2);
  a(view.screen.some(e=>e.text.includes('생기 없는 몸을 실망스러운 눈으로 바라본다')&&e.text.includes('#긍정적 선택지')&&e.text.includes('#부정적 선택지')),'same-screen choices absent '+mode);
  const destinations=[];
  for(const choice of choices){const destination=choice.destinations[0];a(destination,'missing destination');const next=await api('/api/scene',{hash,destination,mode});const result=(next.screen||[]).map(e=>e.text).join('');a(result.includes(choice.label.includes('긍정')?'#긍정적 선택 결과':'#부정적 선택 결과'));destinations.push({label:choice.label,title:destination.title,result,images:next.images.map(x=>({path:x.path,exists:x.exists}))});}
  modes.push({mode,scene:view.scene,choices:destinations});
 }
 a.equal(c.hash(fs.readFileSync(state.target)),hash,'QSP changed during read-only check');
 const report={pass:true,url:base,target:state.target,hash,modes,qspWritten:false,editorCodeWritten:false,storageCleared:false};fs.writeFileSync(__dirname+'/live-api-report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({pass:true,target:state.target,hash,modes:modes.map(x=>({mode:x.mode,scene:x.scene.title,choices:x.choices.map(y=>({label:y.label,result:y.result}))}))}));
})().catch(e=>{console.error(e);process.exitCode=1});
