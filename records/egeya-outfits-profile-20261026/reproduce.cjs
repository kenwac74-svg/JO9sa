'use strict';
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/egeya-outfits-20261026',rec=repo+'/records/egeya-outfits-profile-20261026';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s,-5);
const jsonPath=game+'/json/slaves/2579_egeya.json';
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(rec),'Do not overwrite an earlier task record');
 const raw=fs.readFileSync(game+'/jack.qsp'),fragment=read(tmp+'/qsp-fragment.json');assert.equal(c.hash(raw),fragment.before_sha256);qa.inspectWorld(raw);
 const d=c.parse(raw),prior=c.parse(raw);for(const e of fragment.edits){const b=get(d,e.location);assert.equal(b.split(e.old).length-1,e.count);set(d,e.location,b.split(e.old).join(e.new));}
 const candidate=c.serialize(d);qa.inspectWorld(candidate);assert(c.serialize(c.parse(candidate)).equals(candidate));assert.equal(d.locations.length,prior.locations.length);
 for(const l of d.locations)if(!fragment.edits.some(e=>e.location===l.name))assert.equal(get(d,l.name),get(prior,l.name));
 const images=read(tmp+'/assets-manifest.json');assert(images.source_zip_unchanged&&images.loose_originals_unchanged);assert.equal(c.hash(fs.readFileSync(images.source_zip)),images.source_zip_sha256_before);
 const originalJson=fs.readFileSync(jsonPath),j=JSON.parse(originalJson.toString('utf8')),oldJson=JSON.parse(originalJson.toString('utf8'));
 assert.equal(j.seed_name,'Egeya');assert.equal(j.fullimage,'girls/full/egeya_blond_long');
 j.seed_name='에게야';
 for(const [key,role]of [['fullmade','maid'],['fullsecretary','secr'],['fullmistress','dom'],['indpack_title','naked'],['indpack_naked','naked'],['indpack_maid','maid'],['indpack_secr','secr'],['indpack_dom','dom']]){assert(!Object.hasOwn(j,key));j[key]='girls/full/2579/2579_full_'+role;}
 assert(!Object.hasOwn(j,'indpack_info'));j.indpack_info={girl_id:2579,pack_author:'User supplied',pack_description:'에게야 복장 4종',pack_name:'2579_Egeya',pack_type:0,pack_uid:'{'+crypto.randomUUID().toUpperCase()+'}',pack_ver:1};
 const changedKeys=Object.keys(j).filter(k=>JSON.stringify(j[k])!==JSON.stringify(oldJson[k]));assert.equal(changedKeys.length,10);for(const [k,v]of Object.entries(oldJson))if(k!=='seed_name')assert.deepEqual(j[k],v);
 const nextJson=Buffer.from(JSON.stringify(j,null,4).replace(/\n/g,'\r\n')+'\r\n','utf8');
 for(const im of images.artifacts){assert.equal(c.hash(fs.readFileSync(im.output_path)),im.output_sha256);assert.deepEqual(im.output_dimensions,[795,596]);assert(!fs.existsSync(game+'/'+im.output_relative_path));}
 fs.mkdirSync(rec,{recursive:true});fs.mkdirSync(tmp+'/patches',{recursive:true});fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(raw,{level:9}));fs.writeFileSync(rec+'/2579_egeya.before.json',originalJson);fs.writeFileSync(rec+'/2579_egeya.after.json',nextJson);fs.writeFileSync(tmp+'/before.qsp',raw);fs.writeFileSync(tmp+'/candidate.qsp',candidate);
 const patch={...fragment,after_sha256:c.hash(candidate)};write(rec+'/patch.json',patch);write(repo+'/mods/'+fragment.id+'.json',patch);write(tmp+'/patches/'+fragment.id+'.json',patch);write(rec+'/assets-manifest.json',images);
 const protection=read(repo+'/records/anes-rumor-voice-20261026/protected.json').map(f=>({path:f.path,sha256:c.hash(fs.readFileSync(f.path))}));write(rec+'/protected.json',protection);
 write(rec+'/prepared.json',{before:c.hash(raw),after:c.hash(candidate),json:{path:jsonPath,before:c.hash(originalJson),after:c.hash(nextJson),changedKeys},assets:images.artifacts.map(im=>({path:game+'/'+im.output_relative_path,sha256:im.output_sha256})),newLocations:0,newPersistentQspKeys:0,traits:'Only fresh non-clone Egeya creation gets constitution1/combat_trait3. Existing arena9 acquisition preserved.',legacyNames:'Known default spellings only; custom names and old actor traits untouched.',npcAfterAcquisition:'Current egeya_lose gate disables the club; no replacement NPC implementation.'});
 fs.copyFileSync(__filename,rec+'/reproduce.cjs');
 for(const im of images.artifacts){const dest=game+'/'+im.output_relative_path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(im.output_path,dest);assert.equal(c.hash(fs.readFileSync(dest)),im.output_sha256);}
 fs.writeFileSync(jsonPath,nextJson);assert.equal(c.hash(fs.readFileSync(jsonPath)),c.hash(nextJson));
 console.log(JSON.stringify({candidate:tmp+'/candidate.qsp',before:c.hash(raw),after:c.hash(candidate),stagedRuntimeAssets:4,jsonInstalled:true,qspInstalled:false,record:rec}));
}else if(process.argv[2]==='install'){
 const report=read(process.argv[3]);assert.equal(report.verdict,'PASS');const targeted=read(tmp+'/native/run/client-results.json');assert.equal(targeted.length,9);assert(targeted.every(x=>x.pass),'Targeted native tests must pass');const prep=read(rec+'/prepared.json'),candidate=fs.readFileSync(tmp+'/candidate.qsp');assert.equal(c.hash(candidate),prep.after);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),prep.before,'WORK changed during tests');assert.equal(c.hash(fs.readFileSync(jsonPath)),prep.json.after);
 for(const f of [...read(rec+'/protected.json'),...prep.assets])assert.equal(c.hash(fs.readFileSync(f.path)),f.sha256,f.path);
 fs.copyFileSync(process.argv[3],rec+'/release-report.json');write(rec+'/native-client-results.json',targeted);fs.copyFileSync(__filename,rec+'/reproduce.cjs');fs.writeFileSync(game+'/jack.qsp',candidate);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),prep.after);console.log(JSON.stringify({installed:true,hash:prep.after}));
}else throw Error('Use prepare or install <release report>');
