const fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const get=url=>require('child_process').execFileSync('curl.exe',['--max-time','10','-fsS',String(url)],{windowsHide:true,maxBuffer:32*1024*1024}).toString('utf8');
 const standalone=get('http://127.0.0.1:8891/');assert(standalone.includes('id="batchframe"')&&standalone.includes('WORKSHOP_BATCH_FRAME_20261111'));
 const html=get('http://127.0.0.1:3813/catalog');const src=[...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>m[1]).find(s=>s.includes('catalog_editor.js'))||'/catalog_editor.js';
 const url=new URL(src,'http://127.0.0.1:3813/catalog'),js=get(url);assert(js.includes('WORKSHOP_BATCH_FRAME_20261111')&&js.includes('WORKSHOP_NEW_IMAGE_PATH_20261108'));
 const report={standaloneServesNewButton:true,catalogServesNewEditor:true,catalogEditorPath:url.pathname,restartRequired:false};
 fs.writeFileSync('G:/somi/JO9sa/records/workshop-batch-frame-20261111/http-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
