const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const file='G:/somi/JO9sa/tools/image-workshop/place/JO9_Place_Workshop.html';let text=fs.readFileSync(file,'utf8');
function replace(old,value){assert.equal(text.split(old).length-1,1,old.slice(0,95));text=text.replace(old,()=>value);}
const oldButton='<button data-lock id="process" class="primary">규격 맞추기</button>';
replace(oldButton,oldButton+'<button data-lock id="batchframe" type="button" disabled>선택 이미지 테두리 만들기</button>');
replace("$('connect').onclick=connect;$('process').onclick=processAll;","$('connect').onclick=connect;$('process').onclick=processAll;$('batchframe').onclick=makeSelectedFrames;");
replace("$('process').disabled=S.busy||!targets.length;","$('process').disabled=S.busy||!targets.length;\r\n  $('batchframe').disabled=S.busy||!canBatchFrames();");
replace(" const mappedRel=relPicPath(s.mappedPath);"," const mappedRel=relPicPath(s.mappedPath);\r\n if(s.frameOnly)return[{path:mappedRel,name:mappedRel.split('/').pop()}];");
replace('function changed(){const r=S.edit;',"function changed(event){const r=S.edit;r.options.frameOnly=false;if(event?.target?.id==='frame')r.options.makeFrame=false;");
replace("${r.options?.frame?' · 테두리 보존':''}","${r.options?.makeFrame?' · 게임 테두리 생성':r.options?.frame?' · 원본 테두리 보존':''}");
const exportLine='window.JO9Workshop={state:S,add,processAll,compress,selectTarget,render,rebuild,screen:ScreenContext,refreshLaunch};';
const feature=fs.readFileSync(__dirname+'/workshop-batch-frame.js','utf8').replace(/\r\n|\n/g,'\r\n');
replace(exportLine,feature+'\r\n'+exportLine.replace('processAll,','processAll,makeSelectedFrames,'));
replace("await root.getDirectoryHandle('bg');await root.getDirectoryHandle('ui overhaul')","await root.getDirectoryHandle('bg');try{await root.getDirectoryHandle('ui overhaul')}catch(error){if(error.name!=='NotFoundError')throw error;await(await root.getDirectoryHandle('ui')).getDirectoryHandle('legacy_overhaul')}");
const scripts=[...text.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,5);for(const script of scripts)new vm.Script(script[1]);
assert.equal((text.match(/id="batchframe"/g)||[]).length,1);
fs.writeFileSync(file,text);console.log('Source UI updated; one global batch frame button.');
