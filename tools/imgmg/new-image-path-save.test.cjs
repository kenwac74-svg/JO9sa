'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('existing PIC writer creates nested new paths and rejects concurrent existing targets',()=>{
 const base='G:/Codex/tmp/new-image-path-20261108';fs.mkdirSync(base,{recursive:true});const home=fs.mkdtempSync(base+'/save-'),game=home+'/game',cat=home+'/catalog';
 fs.mkdirSync(game+'/content/pic',{recursive:true});fs.mkdirSync(cat,{recursive:true});
 fs.writeFileSync(cat+'/catalog_merge_vs_original.html','var D=[];\nvar MR="fixture";');fs.writeFileSync(cat+'/catalog_status.js','window.CATALOG_STATUS={"items":{}};');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAOElEQVR4nO3QsREAMAgDMUJJTZ39twyXKWjkBd6nU31fLC434w4QIECAAAECBAgQIECAAAECX2AA6DMBe1+fSFcAAAAASUVORK5CYII=','base64'),core='G:/somi/JO9sa/tools/text-workshop',api=require(core+'/pic-local.cjs').create(game,cat,require(core+'/catalog.cjs').create(cat)),job={path:'new folder/깊은 폴더/my-file.png',before:null,createMissing:true,width:32,height:32,data:png.toString('base64'),cap:80000};
 const r=api.apply([job]);a.equal(r.status,'applied');a(!r.catalogWarning,r.catalogWarning);a.deepEqual(fs.readFileSync(game+'/content/pic/'+job.path),png);a.equal(r.files[0].existed,false);a.equal(api.scan(true)[0].path,job.path);
 a.throws(()=>api.apply([job]),/이미지가 바뀌었습니다/);a.throws(()=>api.apply([{...job,path:'other.png',createMissing:false}]),/생성 승인/);a.throws(()=>api.apply([{...job,path:'../outside.png'}]),/잘못된 PIC/);
 const resolved=path.resolve(home);a(resolved.startsWith(path.resolve(base)+path.sep));fs.rmSync(resolved,{recursive:true});
});
