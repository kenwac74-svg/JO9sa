const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=__dirname;
test('folder rescan sees added files and revision reads replaced bytes without saving QSP or checklist status',()=>{
 const f=require(base+'/dialogue-image-fixture.cjs').create(),catalog=require(base+'/catalog.cjs').create(f.catalog),pics=require(base+'/pic-local.cjs').create(f.game,f.catalog,catalog),name='scene/preview.png';
 const qsp=fs.readFileSync(f.game+'/jack.qsp'),status=fs.readFileSync(f.catalog+'/catalog_status.js');
 try {
  const first=pics.revisions([name])[name];a(first.bytes>0);pics.scan();
  const added=f.game+'/content/pic/scene/new.png';fs.copyFileSync(f.game+'/content/pic/'+name,added);a(pics.scan(true).some(p=>p.path==='scene/new.png'));
  fs.appendFileSync(f.game+'/content/pic/'+name,Buffer.from('test-only'));const next=pics.revisions([name])[name];a.equal(next.bytes,first.bytes+9);a.notEqual(next.version,first.version);
  a.deepEqual(fs.readFileSync(f.game+'/jack.qsp'),qsp);a.deepEqual(fs.readFileSync(f.catalog+'/catalog_status.js'),status);
 } finally {a(path.resolve(f.home).startsWith(path.resolve('G:/Codex/tmp/dialogue-image-20261108')+path.sep));fs.rmSync(f.home,{recursive:true});}
});
