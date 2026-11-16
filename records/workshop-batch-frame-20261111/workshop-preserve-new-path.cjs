'use strict';
const fs=require('fs'),assert=require('assert/strict'),cp=require('child_process'),vm=require('vm');
const source='G:/somi/JO9sa/tools/image-workshop/place/JO9_Place_Workshop.html';
const generated='G:/Codex/tmp/jo9-workshop-batch-frame-20261111/generated-before.js';
const deployed='G:/somi/JO9sa/tools/local-workspace/catalog-seed/catalog_editor.js';
const moduleFile='G:/somi/JO9sa/tools/imgmg/workshop-new-path.js';
const normalize=s=>s.replace(/\r\n/g,'\n');
const a=normalize(fs.readFileSync(generated,'utf8')),b=normalize(fs.readFileSync(deployed,'utf8'));
function decoded(text){const line=text.split('\n')[1];return{css:JSON.parse(line.match(/st\.textContent=("(?:[^"\\]|\\.)*")/)[1]),markup:JSON.parse(line.match(/insertAdjacentHTML\('beforeend',("(?:[^"\\]|\\.)*")/)[1])};}
const ad=decoded(a),bd=decoded(b);console.log('Decoded CSS identical:',ad.css===bd.css);
if(ad.markup!==bd.markup){let s=0;while(ad.markup[s]===bd.markup[s])s++;let z=0;while(ad.markup.at(-1-z)===bd.markup.at(-1-z))z++;console.log('Markup delta:',JSON.stringify(ad.markup.slice(Math.max(0,s-100),ad.markup.length-z+100)),JSON.stringify(bd.markup.slice(Math.max(0,s-100),bd.markup.length-z+100)));}
const py=`import json,sys,difflib
d=json.load(sys.stdin);a=d['a'].split('\\n');b=d['b'].split('\\n')
json.dump([{'tag':t,'i':i,'j':j,'before':a[max(0,i-3):i],'old':a[i:j],'new':b[x:y],'after':a[j:j+3]} for t,i,j,x,y in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes() if t!='equal'],sys.stdout,ensure_ascii=False)`;
const diff=cp.spawnSync('C:/Users/User/AppData/Local/Programs/Python/Python314/python.exe',['-c',py],{input:JSON.stringify({a,b}),encoding:'utf8',windowsHide:true,env:{...process.env,PYTHONIOENCODING:'utf-8'},maxBuffer:2*1024*1024});assert.equal(diff.status,0,diff.stderr);
const changes=JSON.parse(diff.stdout),raw=fs.readFileSync(source),html=raw.toString('utf8'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,5);
let main=normalize(scripts[3][1]),applied=[];
for(const change of changes){
 const old=change.old.join('\n'),next=change.new.join('\n');
 if(old.includes('st.textContent=')||old.includes('const PLAY_URL='))continue;
 if(next.includes('// JO9 MOD START WORKSHOP_NEW_IMAGE_PATH_20261108'))continue;
 if(old){assert.equal(main.split(old).length-1,1,'Unique original source anchor: '+old.slice(0,100));main=main.replace(old,()=>next);applied.push({tag:change.tag,line:change.i+1,oldLines:change.old.length,newLines:change.new.length});continue;}
 let matched=false;
 for(let size=1;size<=3&&!matched;size++){
  const left=change.before.slice(-size).join('\n'),right=change.after.slice(0,size).join('\n'),anchor=left+'\n'+right;
  if(main.split(anchor).length-1!==1)continue;
  main=main.replace(anchor,()=>left+'\n'+next+'\n'+right);matched=true;
 }
 assert(matched,'Insertion anchor '+change.i);applied.push({tag:change.tag,line:change.i+1,newLines:change.new.length});
}
assert(!main.includes('WORKSHOP_NEW_IMAGE_PATH_20261108'));
let moduleSource=normalize(fs.readFileSync(moduleFile,'utf8'));
const oldParent="$('wsdialog').insertAdjacentHTML('beforeend',";
assert.equal(moduleSource.split(oldParent).length-1,1);moduleSource=moduleSource.replace(oldParent,"($('wsdialog')||document.body).insertAdjacentHTML('beforeend',");
main=main.trimEnd()+'\n\n'+moduleSource+'\n';new vm.Script(main);
let out=html.slice(0,scripts[3].index+8)+main.replace(/\n/g,'\r\n')+html.slice(scripts[3].index+8+scripts[3][1].length);
const outs=[...out.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(outs.length,5);for(const i of [0,1,2,4])assert.equal(outs[i][1],scripts[i][1]);
assert(out.includes('WORKSHOP_BATCH_FRAME_20261111'));assert(out.includes('WORKSHOP_BATCH_FRAME_CORE_20261111'));
console.log('Preserved source patches:',JSON.stringify(applied));
if(process.argv.includes('--apply')){
 const backup='G:/somi/JO9_work_backups/workshop-batch-frame-20261111/';fs.mkdirSync(backup,{recursive:true});
 if(!fs.existsSync(backup+'JO9_Place_Workshop.before-new-path.html'))fs.writeFileSync(backup+'JO9_Place_Workshop.before-new-path.html',raw);
 if(!fs.existsSync(backup+'workshop-new-path.before.js'))fs.copyFileSync(moduleFile,backup+'workshop-new-path.before.js');
 assert(fs.readFileSync(source).equals(raw),'Source changed during preservation');fs.writeFileSync(source,out);fs.writeFileSync(moduleFile,moduleSource.replace(/\n/g,'\r\n'));
 console.log('Source main and standalone dialog parent updated.');
}
