'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const R='G:/somi/JO9sa',T='G:/Codex/tmp/dialogue-range-20261108/text-workshop';
fs.mkdirSync(T,{recursive:true});
const baselines={};
for(const name of ['core.cjs','flow.cjs','scenes.cjs','script-export.cjs','script-import.cjs','script-export.test.cjs','server.cjs','script-export.js','index.html']){const b=fs.readFileSync(R+'/tools/text-workshop/'+name);baselines[name]=require('crypto').createHash('sha256').update(b).digest('hex');fs.writeFileSync(T+'/'+name,b);}
fs.writeFileSync(path.dirname(T)+'/baselines.json',JSON.stringify(baselines));
for(const name of ['script-range.cjs','script-range.js','script-range.test.cjs'])fs.copyFileSync(__dirname+'/'+name,T+'/'+name);
function change(file,old,next){const p=T+'/'+file,s=fs.readFileSync(p,'utf8');a.equal(s.split(old).length-1,1,file+' anchor '+old.slice(0,70));fs.writeFileSync(p,s.replace(old,()=>next));}
change('script-export.cjs','  return { script };',"  const selectedRange=require('./script-range.cjs').build(doc,{sceneOf,collect,arrays,pickEdition,stagesOf,branches:h.branches,entries:allEntries,visible:h.visible});\n  return { script,range:selectedRange.range,boundary:selectedRange.boundary };");
change('scenes.cjs','  return {context,open,incoming,script};',[
"  function scriptRange(input){if(input.hash!==doc.hash)throw Error('QSP가 바뀌었습니다. 시작과 마무리를 다시 선택하세요.');return scriptExport.range(input);}",
"  function scriptBoundary(input){if(input.hash!==doc.hash)throw Error('QSP가 바뀌었습니다. 다시 검색해 주세요.');return scriptExport.boundary(input);}",
"  return {context,open,incoming,script,scriptRange,scriptBoundary};"
].join('\n'));
change('server.cjs',"'/batch-replace.js','/catalog-cut-conditions.js'","'/batch-replace.js','/catalog-cut-conditions.js','/script-range.js'");
const anchor="    if(req.method==='POST' && url.pathname==='/api/script'){";
change('server.cjs',anchor,[
"    // JO9 MOD START SCRIPT_RANGE_20261108",
"    if(req.method==='POST'&&url.pathname==='/api/script/boundary'){",
"      const input=await body(req);current();json(res,200,navigator.scriptBoundary(input));return;",
"    }",
"    if(req.method==='POST'&&url.pathname==='/api/script/range'){",
"      const input=await body(req);current();const exportId=crypto.randomBytes(8).toString('hex');",
"      const r=navigator.scriptRange({...input,exportId});",
"      if(r.status==='ready'){",
"        const dir=path.join(runtime,'script-exports');fs.mkdirSync(dir,{recursive:true});",
"        fs.writeFileSync(path.join(dir,exportId+'.json'),JSON.stringify({id:exportId,hash:r.hash,created:new Date().toISOString(),start:input.start,end:input.end,range:true,map:r.map}));",
"      }",
"      json(res,200,{...r,...(r.status==='ready'?{exportId}:{})});return;",
"    }",
"    // JO9 MOD END SCRIPT_RANGE_20261108",
anchor].join('\n'));
change('index.html','<script src="script-export.js"></script>','<script src="script-export.js"></script>\n<script src="script-range.js"></script>');
change('script-export.js','<summary>흐름 전체 각본 · 출력과 각색본 일괄 반영</summary>','<summary>고급 출력 · 각색본 일괄 반영</summary>');
console.log(T);
