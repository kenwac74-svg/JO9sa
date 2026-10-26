'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const root=__dirname,task='G:/Codex/tmp/bankruptcy-ui-saves-20261025-r2',record='G:/somi/JO9sa/records/bankruptcy-ui-saves-20261025-r2';
const final=read(root+'/FINAL_RESULT.json'),inputs=read(root+'/protected-inputs.json');
assert.equal(final.status,'INSTALLED_AND_ZIP_VERIFIED');
for(const p of inputs)assert.equal(hash(p.path),p.sha256,'Protected input changed: '+p.path);
for(const p of final.files)assert.equal(hash(p.path),p.sha256,'Installed save changed: '+p.file);
assert.equal(hash(final.zip.path),final.zip.sha256);assert.equal(hash(final.guide.path),final.guide.sha256);
assert.equal(read(root+'/GUI_VERIFICATION.json').status,'PASS');
for(const name of ['native-stderr.log','strict-stderr.log'])fs.copyFileSync(task+'/verify/'+name,root+'/'+name,fs.constants.COPYFILE_EXCL);
fs.writeFileSync(root+'/SAVE_LINKS_KO.md','# 새 테스트 세이브 9개\n\n[폴더](<'+final.target+'>) · [ZIP](<'+final.zip.path+'>) · [사용안내](<'+final.guide.path+'>)\n\n'+final.files.map(r=>'- ['+r.file+'](<'+r.path+'>): '+r.title).join('\n')+'\n',{flag:'wx'});
assert(!fs.existsSync(record),'Refuse to overwrite existing task records');fs.mkdirSync(record);
let count=0;for(const ent of fs.readdirSync(root,{withFileTypes:true})){
 assert(ent.isFile()&&!ent.isSymbolicLink());const from=path.join(root,ent.name),to=path.join(record,ent.name);
 fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(from),hash(to));count++;
}
console.log(JSON.stringify({status:'VERIFIED_AND_RECORDED',record,files:count,protected:inputs.length,installed:final.files.length}));
