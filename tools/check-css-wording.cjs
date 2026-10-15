// Usage: node tools/check-css-wording.cjs [css directory]
// CSS display literals must be migrated into QSP before commit/push.
const fs=require('fs'),path=require('path');
const root=process.argv[2]||path.join(__dirname,'../assets/css-2.4');
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]).filter(f=>f.endsWith('.css'));
let failed=0;for(const file of files(root)){const text=fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\r\n]/g,' '));for(const m of text.matchAll(/\bcontent\s*:\s*(["'])(.*?)\1/g)){if(!m[2].trim())continue;failed++;console.error(file+':'+(text.slice(0,m.index).split('\n').length)+': move fixed content to QSP: '+m[2]);}}
if(failed){process.exitCode=1;}else console.log('PASS: no fixed display wording in '+root);
