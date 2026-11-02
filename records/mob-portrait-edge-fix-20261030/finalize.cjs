'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),a=require('assert/strict');
const H=__dirname,R='G:/somi/JO9sa/records/mob-portrait-edge-fix-20261030';
const read=p=>fs.readFileSync(p),j=p=>JSON.parse(read(p)),hash=p=>crypto.createHash('sha256').update(read(p)).digest('hex');
for(const name of ['png-verification.json','live-verification.json','independent-visual-verification.json','independent-metadata-verification.json'])a.equal(j(H+'/'+name).pass,true,name);
const m=j(H+'/manifest.json'),r=j(H+'/installation.json');a.equal(hash('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),m.qspBefore);
fs.mkdirSync(R,{recursive:true});
for(const f of m.files)for(const key of ['alphaPath','changeBandPath','protectedCorePath']){
 const src=f[key],dest=R+'/masks/'+path.basename(path.dirname(src))+'/'+path.basename(src);fs.mkdirSync(path.dirname(dest),{recursive:true});
 if(fs.existsSync(src)){fs.copyFileSync(src,dest);a.equal(hash(src),hash(dest));}else a(fs.existsSync(dest));
}
r.status='VERIFIED';r.verification={png:'png-verification.json',http:'live-verification.json',visual:'independent-visual-verification.json',metadata:'independent-metadata-verification.json'};fs.writeFileSync(H+'/installation.json',JSON.stringify(r,null,2));
let n=0,bytes=0;
function save(dir,rel=''){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const src=path.join(dir,e.name),rpath=path.join(rel,e.name);a(!e.isSymbolicLink());
  if(e.isDirectory()){if(e.name!=='registered-rgba')save(src,rpath);continue;}
  if(!/\.(?:json|md|py|cjs|ps1|png|jpg)$/.test(e.name))continue;
  if(rel.startsWith('prototype-agent')&&/\.(?:png|jpg)$/.test(e.name))continue;
  const b=read(src);a(b.length<2*1024*1024,rpath);const dst=path.join(R,rpath);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,b);a.equal(hash(src),hash(dst));n++;bytes+=b.length;
 }
}
save(H);console.log(JSON.stringify({status:'VERIFIED_RECORDS_SAVED',files:n,bytes,masks:90,record:R}));
