const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const catalog=require('./catalog.cjs');
test('삭제 예정 태그 저장·복원·해제, 다른 상태와 파일 유지',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-delete-tag-'));
 try{const rel='content\\pic\\bg\\example.png';fs.writeFileSync(path.join(dir,'catalog_merge_vs_original.html'),'var D='+JSON.stringify([[rel,'o','orig',1,1,795,596,'']])+';\nvar MR="test";');fs.writeFileSync(path.join(dir,'catalog_status.js'),'window.CATALOG_STATUS={"savedAt":1,"items":{}};');const image=path.join(dir,'example.png');fs.writeFileSync(image,'must remain');
 const store=catalog.create(dir);store.update([{path:rel,flag:'spare',checked:true,expected:false}]);store.update([{path:rel,flag:'delete',checked:true,expected:false}]);assert.deepEqual(store.meta(rel).flags,['spare','delete']);assert.deepEqual(catalog.create(dir).meta(rel).flags,['spare','delete']);assert.equal(fs.readFileSync(image,'utf8'),'must remain');store.update([{path:rel,flag:'delete',checked:false,expected:true}]);assert.deepEqual(store.meta(rel).flags,['spare']);assert.equal(fs.readFileSync(image,'utf8'),'must remain');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
