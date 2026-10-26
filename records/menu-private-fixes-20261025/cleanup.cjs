'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const roots=['G:/Codex/tmp/menu-private-fixes-20261025','G:/Codex/tmp/menu-private-release-20261025'];
const record='G:/somi/JO9sa/records/menu-private-fixes-20261025';
const execute=process.argv.includes('--execute'),normalize=s=>path.resolve(s).replace(/\\/g,'/').toLowerCase();
const totals={files:0,bytes:0,directories:0,links:0},checked=[];
function walk(p,root,mutate){
 assert(normalize(p)===normalize(root)||normalize(p).startsWith(normalize(root)+'/'));
 const st=fs.lstatSync(p);
 if(st.isSymbolicLink()){totals.links++;if(mutate){try{fs.unlinkSync(p);}catch(e){if(e.code!=='EPERM'&&e.code!=='EISDIR')throw e;fs.rmdirSync(p);}}return;}
 if(st.isDirectory()){totals.directories++;for(const n of fs.readdirSync(p))walk(path.join(p,n),root,mutate);if(mutate)fs.rmdirSync(p);return;}
 assert(st.isFile(),'Unexpected file type: '+p);totals.files++;totals.bytes+=st.size;if(mutate)fs.unlinkSync(p);
}
if(execute){const result=JSON.parse(fs.readFileSync(record+'/FINAL_RESULT.json','utf8'));assert.equal(result.status,'APPLIED_AND_VERIFIED');assert.equal(result.runtimeWritten,true);assert(fs.existsSync(record+'/quota-native-report.json'));assert(fs.existsSync(record+'/private-native-report.json'));}
for(const root of roots){if(!fs.existsSync(root)){checked.push({root,exists:false});continue;}assert(!fs.lstatSync(root).isSymbolicLink());assert.equal(normalize(fs.realpathSync(root)),normalize(root),'Task root resolves elsewhere');checked.push({root,resolved:fs.realpathSync(root)});walk(root,root,execute);}
const report={status:execute?'CLEANED':'DRY_RUN',execute,roots:checked,...totals,followedLinks:false,preserved:'WORK, existing saves, protected originals, final records, source patch and unique before backup'};
if(execute){assert(roots.every(p=>!fs.existsSync(p)));fs.writeFileSync(record+'/CLEANUP_RESULT.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
