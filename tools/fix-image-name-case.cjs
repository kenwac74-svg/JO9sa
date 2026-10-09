'use strict';
const fs=require('node:fs');
function patchWorkshop(s){return s.replace("const norm=s=>s.normalize('NFC').toLowerCase();","const norm=s=>s.normalize('NFC');").replaceAll(".replace(/_(gray|sepia)(?=\\.png$)/i,'').toLowerCase()",".replace(/_(gray|sepia)(?=\\.png$)/i,'')").replace("d[0].toLowerCase()===p.replace(/\\//g,'\\\\').toLowerCase()","d[0]===p.replace(/\\//g,'\\\\')");}
function patchPic(s){return s.replace('x[0].toLowerCase()===rel.toLowerCase()','x[0]===rel').replace('x.relative_path.toLowerCase()===rel.toLowerCase()','x.relative_path===rel');}
module.exports={patchWorkshop,patchPic};
if(require.main===module)for(const file of process.argv.slice(2)){const old=fs.readFileSync(file,'utf8'),next=file.endsWith('pic-local.cjs')?patchPic(old):patchWorkshop(old);if(old!==next){fs.copyFileSync(file,file+'.bak_case_'+Date.now());fs.writeFileSync(file,next);}}
