const fs=require('node:fs'),a=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const tmp='G:/Codex/tmp/checklist-role-status-20261108',record='G:/somi/JO9sa/records/checklist-role-status-20261108',root='G:/somi/JO9sa/tools/girls-image-checklist',plan=JSON.parse(fs.readFileSync(tmp+'/plan.json','utf8')),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const dataRe=/(window\.JO9_GIRLS_CHECKLIST\s*=\s*)([\s\S]*?)(;\s*<\/script\s*>)/i,codeRe=/\/\* JO9 MOD START GIRLS_CHARACTER_CHECKLIST_20261104 \*\/[\s\S]*?\/\* JO9 MOD END GIRLS_CHARACTER_CHECKLIST_20261104 \*\//;
const withoutFlags=d=>{for(const c of d.characters)for(const r of Object.values(c.effectiveRoles||{})){delete r.menuAvailable;delete r.menuIssue;}return d;};
for(const [p,h]of Object.entries(plan.before))a.equal(hash(p),h,'Concurrent change '+p);
for(const row of plan.staged){const old=fs.readFileSync(row.path,'utf8'),next=fs.readFileSync(row.file,'utf8');a.equal(hash(row.file),row.hash);
 if(row.path.endsWith('.html')){a.equal(old.replace(dataRe,'DATA').replace(codeRe,'UI'),next.replace(dataRe,'DATA').replace(codeRe,'UI'),'outside checklist modified');a.deepEqual(withoutFlags(JSON.parse(old.match(dataRe)[2])),withoutFlags(JSON.parse(next.match(dataRe)[2])));new vm.Script(next.match(codeRe)[0]);}
 if(row.path.endsWith('manifest.json'))a.deepEqual(withoutFlags(JSON.parse(old)),withoutFlags(JSON.parse(next)));
}
new vm.Script(fs.readFileSync(plan.staged[0].file,'utf8'));
for(const row of plan.staged)fs.copyFileSync(row.file,row.path);
fs.copyFileSync(process.cwd()+'/checklist-role-status.test.cjs',root+'/checklist-role-status.test.cjs');
fs.writeFileSync(record+'/installation.json',JSON.stringify(plan,null,2));console.log('Installed checklist-only correction; unrelated data and catalog markup preserved.');
