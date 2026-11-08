const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),zlib=require('node:zlib');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',record=repo+'/records/workshop-range-output-20261108',tmp='G:/Codex/tmp/workshop-range-output-20261108';
const root=repo+'/tools/text-workshop',installed=work+'/modtools/text-workshop';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.mkdirSync(record+'/before',{recursive:true});fs.mkdirSync(tmp,{recursive:true});
const before={};for(const p of [work+'/jack.qsp',work+'/modtools/catalog/catalog_status.js',...[root,installed].flatMap(d=>['index.html','script-range.js','server.cjs'].map(n=>d+'/'+n))]){before[p]=hash(p);if(!p.endsWith('.qsp')&&!p.endsWith('catalog_status.js'))fs.writeFileSync(record+'/before/'+before[p]+'.gz',zlib.gzipSync(fs.readFileSync(p)));}
fs.writeFileSync(record+'/before.json',JSON.stringify(before,null,2));
let ui=fs.readFileSync(root+'/script-range.js','utf8');
ui=ui.replace('busy=false,pending=false;','busy=false,pending=false,lastResult=null;');
ui=ui.replace('choices=saved.choices||{};','choices=saved.choices||{};lastResult=saved.result||null;');
ui=ui.replace('end:endPoint,choices}', 'end:endPoint,choices,result:lastResult}');
ui=ui.replace("$('rangeSave').disabled=busy||pending||!startPoint||!endPoint;", "$('rangeSave').disabled=busy||pending||!startPoint||!endPoint;$('rangePreview').disabled=$('rangeSave').disabled;$('rangeDownload').disabled=busy||pending||!lastResult;");
const pos=ui.indexOf(' const summary=');
ui=ui.slice(0,pos)+` function output(r){
  $('rangeText').value=r?.text||'';
  $('rangeSavedPath').textContent=r?.savedPath?'저장 위치: '+r.savedPath:'아직 파일로 저장하지 않았습니다. 각본 파일 저장을 누르면 아래 안내 폴더에 TXT를 만듭니다.';
  if(r){$('rangePreviewBox').open=true;}
 }
 function clearOutput(){lastResult=null;output(null);}
`+ui.slice(pos);
ui=ui.replace('startPoint=endPoint=null;choices={};persist();', 'startPoint=endPoint=null;choices={};clearOutput();persist();');
ui=ui.replace("choices={};persist();$('rangePrompt').replaceChildren();$('rangeText').value='';labels();", "choices={};clearOutput();persist();$('rangePrompt').replaceChildren();labels();");
ui=ui.replace('async function make(){','async function make(saveFile){');
ui=ui.replace('start:startPoint,end:endPoint,choices});','start:startPoint,end:endPoint,choices,save:saveFile===true});');
ui=ui.replace('persist();make();','persist();return make(saveFile);');
const old="$('rangeText').value=r.text;download(r);$('rangeStatus').textContent='각본 파일을 저장했습니다. 장면 '+r.stats.scenes+'개 · 대사 '+r.stats.pages+'개 · 선택한 분기 '+r.stats.choices+'개. 마무리 뒤의 대사는 제외했습니다.';";
if(!ui.includes(old))throw Error('UI output baseline mismatch');
ui=ui.replace(old,`if(r.status!=='ready'||!r.text)throw Error('각본 내용을 만들지 못했습니다. 시작과 마무리를 확인하세요.');
   lastResult=r;output(r);persist();
   $('rangeStatus').textContent=(r.savedPath?'각본 파일을 저장했습니다.':'각본 미리보기를 만들었습니다. 아직 파일 저장 전입니다.')+' 장면 '+r.stats.scenes+'개 · 대사 '+r.stats.pages+'개 · 선택한 분기 '+r.stats.choices+'개. 마무리 뒤의 대사는 제외했습니다.';
   $('rangePreviewBox').scrollIntoView({block:'nearest'});`);
ui=ui.replace("}catch(e){$('rangeStatus').textContent=e.message;}\n  finally{busy=false;buttons();}\n }\n $('rangeSave').onclick=make;", `}catch(e){
   if(/QSP가 바뀌|대사 원문이 바뀌/.test(e.message)){startPoint=endPoint=null;choices={};clearOutput();persist();labels();}
   $('rangeStatus').textContent=e.message+' 저장되지 않았습니다.';
  }finally{busy=false;buttons();}
 }
 $('rangePreview').onclick=()=>make(false);
 $('rangeSave').onclick=()=>make(true);
 $('rangeDownload').onclick=()=>{if(!lastResult||busy||pending)return;download(lastResult);$('rangeStatus').textContent='브라우저에 TXT 다운로드를 요청했습니다. 브라우저의 다운로드 폴더 또는 저장 대화상자를 확인하세요.';};`);
ui=ui.replace("choices={};persist();$('rangePrompt').replaceChildren();$('rangeText').value='';", "choices={};clearOutput();persist();$('rangePrompt').replaceChildren();");
ui=ui.replace('labels();if(typeof context', "output(lastResult);labels();if(typeof context");
let html=fs.readFileSync(root+'/index.html','utf8');
html=html.replace('<button type="button" id="rangeSave"','<button type="button" id="rangePreview" disabled>각본 미리보기</button><button type="button" id="rangeSave"');
html=html.replace('<details><summary>저장한 각본 미리보기</summary><textarea id="rangeText" readonly spellcheck="false"></textarea></details>', '<p class="muted">저장 폴더: 대사 편집실의 runtime/script-exports · 저장 후 전체 경로를 표시합니다. 브라우저로 별도 내려받으면 브라우저의 다운로드 폴더에 저장됩니다.</p><p id="rangeSavedPath" role="status">아직 파일로 저장하지 않았습니다.</p><details id="rangePreviewBox"><summary>각본 내용 미리보기</summary><textarea id="rangeText" aria-label="각본 내용 미리보기" readonly spellcheck="false" placeholder="시작과 마무리를 지정한 뒤 각본 미리보기 또는 각본 파일 저장을 누르세요."></textarea><button type="button" id="rangeDownload" disabled>TXT 별도 내려받기</button></details>');
let server=fs.readFileSync(root+'/server.cjs','utf8');
server=server.replace("const scriptImport=require('./script-import.cjs');", "const rangeOutput=require('./range-output.cjs'); // JO9 MOD RANGE_OUTPUT_20261108\nconst scriptImport=require('./script-import.cjs');");
server=server.replace("json(res,200,{...r,...(r.status==='ready'?{exportId}:{})});return;", "const saved=r.status==='ready'&&input.save===true?rangeOutput.save(runtime,exportId,r):{};\n      json(res,200,{...r,...(r.status==='ready'?{exportId}:{}),...saved});return;");
const moduleText=`'use strict';
// JO9 MOD START RANGE_OUTPUT_20261108: exact generated script, local-only output.
const fs=require('node:fs'),path=require('node:path');
function save(runtime,id,result){
 if(!/^[a-f0-9]{16}$/.test(id)||result?.status!=='ready'||typeof result.text!=='string'||!result.text.trim())throw Error('완성된 각본만 저장할 수 있습니다.');
 const dir=path.join(runtime,'script-exports');fs.mkdirSync(dir,{recursive:true});
 const fileName='JO9_각본_'+id+'.txt',savedPath=path.resolve(dir,fileName);
 fs.writeFileSync(savedPath,'\\uFEFF'+result.text.replace(/\\r?\\n/g,'\\r\\n'),{encoding:'utf8',flag:'wx'});
 return {savedPath,fileName};
}
module.exports={save};
// JO9 MOD END RANGE_OUTPUT_20261108
`;
for(const [n,t]of Object.entries({'index.html':html,'script-range.js':ui,'server.cjs':server,'range-output.cjs':moduleText}))fs.writeFileSync(tmp+'/'+n,t);
fs.copyFileSync(process.cwd()+'/range-output.test.cjs',tmp+'/range-output.test.cjs');
console.log('Prepared candidates: '+tmp);
