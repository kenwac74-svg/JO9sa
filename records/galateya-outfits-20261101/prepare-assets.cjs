'use strict';
// Deterministic asset framing: uniform scale and translation only; no repainting.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),crypto=require('node:crypto');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const ROOT=__dirname,GAME='G:/somi/Jack O Nine Tails v2.4_work/game';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),j=p=>JSON.parse(read(p).toString('utf8').replace(/^\uFEFF/,''));
const SOURCES={naked:'content/pic/characters/galateya.png',maid:'content/modworkpic/galateya_made.png',secr:'content/modworkpic/galateya_sec.png',dom:'content/modworkpic/galateya_dom.png'};
function eyes(raw,w,h){
 const mask=new Uint8Array(w*h),seen=new Uint8Array(w*h),components=[];
 for(let y=0;y<Math.floor(h*.4);y++)for(let x=Math.floor(w*.25);x<Math.floor(w*.75);x++){
  const i=(y*w+x)*4,r=raw[i],g=raw[i+1],b=raw[i+2];
  if(raw[i+3]>180&&g>75&&b>95&&b>r*1.25&&g>r*1.12&&b>g*1.06)mask[y*w+x]=1;
 }
 for(let i=0;i<mask.length;i++)if(mask[i]&&!seen[i]){
  const queue=[i];seen[i]=1;let count=0,xsum=0,ysum=0;
  while(queue.length){const k=queue.pop(),x=k%w,y=Math.floor(k/w);count++;xsum+=x;ysum+=y;
   for(const delta of [-1,1,-w,w]){const n=k+delta;if(n>=0&&n<mask.length&&mask[n]&&!seen[n]&&Math.abs(n%w-x)<=1){seen[n]=1;queue.push(n);}}
  }
  if(count>=10)components.push({pixels:count,x:xsum/count,y:ysum/count});
 }
 const pair=components.sort((x,y)=>y.pixels-x.pixels).slice(0,2).sort((x,y)=>x.x-y.x);a.equal(pair.length,2);
 a(Math.abs(pair[0].y-pair[1].y)<h*.07);a(pair[1].x-pair[0].x>w*.04&&pair[1].x-pair[0].x<w*.14);
 return {pair,center:{x:(pair[0].x+pair[1].x)/2,y:(pair[0].y+pair[1].y)/2},distance:Math.hypot(pair[0].x-pair[1].x,pair[0].y-pair[1].y)};
}
async function prepare(){
 const jsonPath=GAME+'/json/slaves/2583_galateya.json',jsonBefore=read(jsonPath),before=j(jsonPath);
 const sources={};
 for(const [key,rel] of Object.entries(SOURCES)){
  const bytes=read(GAME+'/'+rel),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  sources[key]={path:rel,bytes:bytes.length,sha256:hash(bytes),size:[info.width,info.height],eyes:eyes(data,info.width,info.height)};
 }
 const reference=sources.naked.eyes,assets=[],stage=ROOT+'/staged';fs.mkdirSync(stage,{recursive:true});
 for(const key of ['maid','secr','dom']){
  const input=sources[key],scale=reference.distance/input.eyes.distance,w=Math.round(input.size[0]*scale),h=Math.round(input.size[1]*scale);
  const sx=w/input.size[0],sy=h/input.size[1],left=Math.round(reference.center.x-input.eyes.center.x*sx);
  // Keep the complete hair/headpiece inside the frame; a small eye-height difference is intentional.
  const top=Math.max(8,Math.round(reference.center.y-input.eyes.center.y*sy));
  const resized=await sharp(read(GAME+'/'+input.path)).resize(w,h,{kernel:'lanczos3'}).toBuffer();
  const crop={left:Math.max(0,-left),top:Math.max(0,-top),width:Math.min(w,795-left)-Math.max(0,-left),height:Math.min(h,596-top)-Math.max(0,-top)};
  a(crop.width>0&&crop.height>0);
  const visible=await sharp(resized).extract(crop).toBuffer();
  const result=await sharp({create:{width:795,height:596,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:visible,left:Math.max(0,left),top:Math.max(0,top)}]).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
  const name='2583_full_'+key+'.png',rel='content/pic/girls/full/2583/'+name,p=stage+'/'+name;
  fs.writeFileSync(p,result);const meta=await sharp(p).metadata();a.equal(meta.width,795);a.equal(meta.height,596);a.equal(meta.channels,4);
  const finalEye={x:input.eyes.center.x*sx+left,y:input.eyes.center.y*sy+top};
  a(Math.abs(finalEye.x-reference.center.x)<1);a(Math.abs(finalEye.y-reference.center.y)<15);
  assets.push({role:key,path:rel,staged:p,bytes:result.length,sha256:hash(result),source:input.path,sourceSha256:input.sha256,
    dimensions:[795,596],transform:{kind:'uniform-scale-and-translate',scale,resized:[w,h],left,top,crop,eyeCenter:finalEye,eyeHeightDelta:finalEye.y-reference.center.y}});
 }
 const added={
  fullmade:'girls/full/2583/2583_full_maid',fullsecretary:'girls/full/2583/2583_full_secr',fullmistress:'girls/full/2583/2583_full_dom',
  indpack_title:'characters/galateya',indpack_naked:'characters/galateya',
  indpack_maid:'girls/full/2583/2583_full_maid',indpack_secr:'girls/full/2583/2583_full_secr',indpack_dom:'girls/full/2583/2583_full_dom',
  indpack_info:{girl_id:2583,pack_author:'User supplied',pack_description:'갈라테야 복장 4종',pack_name:'2583_Galateya',pack_type:0,pack_uid:'{F2A88F20-C8AB-49AA-9280-3DB972EF72A1}',pack_ver:1}
 };
 for(const key of Object.keys(added))a(!(key in before),'Existing costume registration must be reviewed: '+key);
 const text=jsonBefore.toString('utf8'),eol=text.includes('\r\n')?'\r\n':'\n',anchor='  "fullimage": "girls/full/galateya_purple_long",';
 a.equal(text.split(anchor).length,2);const insertion=Object.entries(added).map(([k,v])=>'  '+JSON.stringify(k)+': '+JSON.stringify(v)+',').join(eol)+eol;
 const afterRaw=Buffer.from(text.replace(anchor,insertion+anchor),'utf8'),after=JSON.parse(afterRaw.toString('utf8'));
 for(const [key,value] of Object.entries(before))a.deepEqual(after[key],value,'Existing JSON value changed: '+key);
 a.equal(afterRaw.toString('utf8').replace(insertion,''),text,'Original JSON bytes/text must remain untouched');
 const jsonStaged=stage+'/2583_galateya.json';fs.writeFileSync(jsonStaged,afterRaw);
 const protectedPaths=[GAME+'/jack.qsp',GAME+'/content/pic/characters/galateya.png',GAME+'/content/pic/girls/full/galateya_purple_long.png',
  ...Object.values(SOURCES).map(p=>GAME+'/'+p),...['galateya.png','galateya_gray.png','galateya_sepia.png'].map(n=>GAME+'/content/pic/girls/face/'+n),
  'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/BUILD_MANIFEST.json'];
 const protectedFiles=[...new Set(protectedPaths)].map(p=>({path:p,sha256:hash(read(p))}));
 const manifest={id:'GALATEYA_OUTFITS_20261101',created:new Date().toISOString(),game:GAME,assets,sources,
  json:{path:'json/slaves/2583_galateya.json',staged:jsonStaged,before:hash(jsonBefore),after:hash(afterRaw),addedKeys:Object.keys(added),unchangedExistingKeys:Object.keys(before).length},
  protected:protectedFiles,reference:{path:SOURCES.naked,eyes:reference},limits:['Original face, body proportions, pose, clothing and alpha are retained; only uniform raster scaling, translation and viewport cropping are performed.','The secretary costume still uses the existing UI label determined by age. No age/attribute/QSP/save changes.','Game restart is needed to reload the character JSON. No GUI save/load compatibility claim.']};
 fs.writeFileSync(ROOT+'/assets-prepared.json',JSON.stringify(manifest,null,2)+'\n');
 const tiles=[];let index=0;
 for(const [role,p] of [['naked',GAME+'/'+SOURCES.naked],...assets.map(x=>[x.role,x.staged])]){
  const x=(index%2)*397,y=Math.floor(index/2)*322;
  const label=Buffer.from('<svg width="397" height="24"><rect width="397" height="24" fill="#181d19"/><text x="10" y="18" fill="#eadab6" font-size="15">'+role+'</text></svg>');
  tiles.push({input:label,left:x,top:y});tiles.push({input:await sharp(p).resize(397,298).flatten({background:'#534838'}).png().toBuffer(),left:x,top:y+24});index++;
 }
 await sharp({create:{width:794,height:644,channels:3,background:'#181d19'}}).composite(tiles).jpeg({quality:90}).toFile(ROOT+'/framing-final.jpg');
 for(const item of protectedFiles)a.equal(hash(read(item.path)),item.sha256);
 console.log(JSON.stringify({prepared:true,assets:assets.map(x=>({role:x.role,path:x.path,bytes:x.bytes,scale:x.transform.scale,top:x.transform.top,eyeHeightDelta:x.transform.eyeHeightDelta})),jsonAdded:Object.keys(added),protectedUnchanged:true}));
}
prepare().catch(e=>{console.error(e.stack);process.exitCode=1;});
