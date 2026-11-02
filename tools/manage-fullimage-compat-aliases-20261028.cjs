'use strict';
// Apply only an approved, pinned compatibility manifest. Never overwrite an image.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function fail(message){throw Error(message);}
function inside(root,file){const rel=path.relative(root,file);return rel!==''&&!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel);}
function resolveFile(game,relative){
 if(typeof relative!=='string'||relative.includes('\\')||path.isAbsolute(relative)||relative.split('/').some(x=>!x||x==='..'||x==='.')||!relative.startsWith('content/pic/girls/full/'))fail('Invalid manifest image path');
 const file=path.resolve(game,relative),parent=fs.realpathSync(path.dirname(file));if(!inside(game,parent))fail('Image parent outside game');
 if(fs.existsSync(file)){if(fs.lstatSync(file).isSymbolicLink()||!inside(game,fs.realpathSync(file)))fail('Image link outside scope');}
 return file;
}
function main(){
 const options={};for(let i=2;i<process.argv.length;i++){const arg=process.argv[i];if(arg==='--apply'){options.apply=true;continue;}if(!['--game','--manifest','--out'].includes(arg)||!process.argv[i+1])fail('Unknown/missing argument');options[arg.slice(2)]=process.argv[++i];}
 if(!options.game||!options.manifest||!options.out)fail('Use --game --manifest --out, optionally --apply');
 const game=fs.realpathSync(options.game),manifestPath=path.resolve(options.manifest),manifestBytes=fs.readFileSync(manifestPath),m=JSON.parse(manifestBytes.toString('utf8').replace(/^\uFEFF/,'')),out=path.resolve(options.out);
 if(m.schema!==1||m.id!=='2026-10-28_fullimage_compatibility'||m.status!=='APPROVED'||m.count!==23||m.files.length!==23||m.classification!=='KEEP')fail('Unexpected approved manifest');
 if(inside(game,out))fail('Report must stay outside the game');
 const seen=new Set(),rows=[];
 // Validate the entire plan before creating any image.
 for(const row of m.files){
  if(row.field!=='fullimage'||row.classification!=='KEEP'||!row.intentionalDuplicate)fail('Unexpected manifest entry');
  if(seen.has(row.compatibility.toLowerCase()))fail('Duplicate destination');seen.add(row.compatibility.toLowerCase());
  const source=resolveFile(game,row.source),target=resolveFile(game,row.compatibility),sourceBytes=fs.readFileSync(source),sourceHash=hash(sourceBytes);
  if(sourceHash!==row.sha256||sourceBytes.length!==row.bytes)fail('Source changed; review required: '+row.source);
  if(sourceBytes.subarray(1,4).toString()!=='PNG'||sourceBytes.readUInt32BE(16)!==row.width||sourceBytes.readUInt32BE(20)!==row.height)fail('Source PNG mismatch');
  if(!/^json\/slaves\/\d+\.json$/.test(row.json))fail('Unexpected JSON path');
  const json=JSON.parse(fs.readFileSync(path.join(game,row.json),'utf8').replace(/^\uFEFF/,''));
  if(json.fullimage!==row.jsonValue||json.indpack_title!==row.sourceValue||'content/pic/'+json.fullimage+'.png'!==row.compatibility||'content/pic/'+json.indpack_title+'.png'!==row.source)fail('Consumer reference changed; review required: '+row.json);
  const exists=fs.existsSync(target),targetHash=exists?hash(fs.readFileSync(target)):null;
  if(exists&&targetHash!==row.sha256)fail('Existing different image will not be overwritten: '+row.compatibility);
  rows.push({...row,sourceAbsolute:source,targetAbsolute:target,sourceBytes,existed:exists,created:false,verified:exists});
 }
 const report=()=>({schema:1,manifest:manifestPath,manifestSha256:hash(manifestBytes),mode:options.apply?'apply':'verify',status:rows.every(x=>x.verified)?'PASS':'MISSING',count:rows.length,created:rows.filter(x=>x.created).length,bytesCreated:rows.filter(x=>x.created).reduce((n,x)=>n+x.bytes,0),files:rows.map(({sourceBytes,...row})=>row)});
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify({...report(),phase:'validated-before-copy'},null,2)+'\n');
 try{
  for(const row of rows){
   if(options.apply&&!row.existed){
    // wx is exclusive: a concurrent user image is never overwritten.
    try{fs.writeFileSync(row.targetAbsolute,row.sourceBytes,{flag:'wx'});row.created=true;}catch(e){if(e.code!=='EEXIST')throw e;}
   }
   row.verified=fs.existsSync(row.targetAbsolute)&&hash(fs.readFileSync(row.targetAbsolute))===row.sha256;
   if(options.apply&&!row.verified)fail('Compatibility copy verification failed: '+row.compatibility);
  }
 }catch(error){fs.writeFileSync(out,JSON.stringify({...report(),status:'FAIL',error:error.message},null,2)+'\n');throw error;}
 const result=report();fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,mode:result.mode,count:result.count,created:result.created,bytesCreated:result.bytesCreated}));if(result.status!=='PASS')process.exitCode=2;
}
try{main();}catch(error){console.error(error.message);process.exitCode=1;}
