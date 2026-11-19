'use strict';
// Prepare editable placeholders only. Existing user images are never overwritten.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function prepare(game,catalogRoot,kind='single'){
 if(!['single','group'].includes(kind))throw Error('Choose single or group page images');
 const dir=path.join(path.resolve(game),'content/pic/scene/VIP'),source=path.join(dir,'VIP3.png');
 const original=fs.readFileSync(source);
 if(!original.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('VIP3 source is not PNG');
 const record={source:'content/pic/scene/VIP/VIP3.png',sourceSha256:sha(original),files:[]};
 const stem=kind==='group'?'salongroup':'salononeg';
 for(const name of [stem+'01.png',stem+'02.png']){
  const dest=path.join(dir,name),created=!fs.existsSync(dest);
  if(created)fs.copyFileSync(source,dest,fs.constants.COPYFILE_EXCL);
  const b=fs.readFileSync(dest);if(!b.subarray(0,8).equals(original.subarray(0,8)))throw Error('Page target is not PNG');
  record.files.push({path:'content/pic/scene/VIP/'+name,created,placeholder:sha(b)===record.sourceSha256,sha256:sha(b),bytes:b.length,width:b.readUInt32BE(16),height:b.readUInt32BE(20)});
 }
 if(catalogRoot){
  const file=path.join(catalogRoot,'catalog_merge_vs_original.html'),html=fs.readFileSync(file,'utf8'),m=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);
  if(!m)throw Error('Catalog format not recognized');
  const rows=JSON.parse(m[1]),before=rows.length;
  for(const item of record.files){const rel=item.path.replaceAll('/','\\');if(!rows.some(r=>r[0]===rel))rows.push([rel,'a','etc',item.bytes,0,item.width,item.height,'']);}
  if(rows.length!==before){
   const backup=file+'.bak_salon_pages_'+new Date().toISOString().replace(/[:.]/g,'-');
   fs.copyFileSync(file,backup,fs.constants.COPYFILE_EXCL);
   const temp=file+'.salon-pages.tmp';fs.writeFileSync(temp,html.replace(m[1],JSON.stringify(rows)),{flag:'wx'});fs.renameSync(temp,file);
  }
  record.catalogRowsAdded=rows.length-before;
 }
 if(sha(fs.readFileSync(source))!==record.sourceSha256)throw Error('VIP3 unexpectedly changed');
 return record;
}
module.exports={prepare};
if(require.main===module){console.log(JSON.stringify(prepare(process.argv[2],process.argv[3],process.argv[4]),null,2));}
