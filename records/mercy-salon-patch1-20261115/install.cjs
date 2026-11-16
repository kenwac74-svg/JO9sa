'use strict';
const fs=require('node:fs'),z=require('node:zlib'),a=require('node:assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/mercy-salon-patch1-20261115',T='G:/Codex/tmp/mercy-salon-patch1-20261115';
const c=require(R+'/tools/text-workshop/core.cjs'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,j)=>fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
const prep=read(D+'/prepared.json'),mod=read(D+'/change.json'),raw=fs.readFileSync(T+'/work-after.qsp');
a.equal(c.hash(raw),prep.afterWork);a(read(T+'/green/client-results.json').every(r=>r.pass));a.equal(read(T+'/green/fixture.json').assertions,99);a.equal(read(T+'/green/fixture.json').sha256,prep.afterDistribution);
const dd=c.parse(raw),excluded=read(R+'/records/hotfix-cumulative-20261115/distribution-exclusion-mod.json');
for(const e of excluded.edits){a.equal(e.field,'body');const l=dd.locations.find(l=>l.name===e.location),b=c.shift(dd.lines[l.body],5);a.equal(b.split(e.old).length-1,e.count);dd.lines[l.body]=c.shift(b.split(e.old).join(e.new),-5);}
a.equal(c.hash(c.serialize(dd)),prep.afterDistribution,'Distribution-only 2.2 exclusion must remain exact');
const paths=[W+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp'];for(const p of paths)a.equal(c.hash(fs.readFileSync(p)),prep.beforeWork,p+' changed');
const metadata=[];for(const rel of ['assets/runtime-source-2.4.1.json','assets/runtime-manifests/2.4.2-work.json']){const p=R+'/'+rel,old=fs.readFileSync(p);fs.writeFileSync(D+'/'+rel.split('/').pop()+'.before.gz',z.gzipSync(old));const j=read(p),before=j.sourceQspSha256;j.sourceQspSha256=prep.afterWork;let rows=0;for(const row of j.files||[])if(row.path==='game/jack.qsp'||row.path==='jack.qsp'||row.runtimePath==='jack.qsp'){row.sha256=prep.afterWork;row.bytes=raw.length;rows++;}j.mercySalonRestore={date:'2026-11-15',record:'records/mercy-salon-patch1-20261115/REPORT_KO.md',after:prep.afterWork,newSaveFields:0};metadata.push({path:p,previousSourceHash:before,updatedQspRows:rows,data:j});}
for(const p of paths)fs.writeFileSync(p,raw);for(const m of metadata)write(m.path,m.data);write(R+'/mods/'+mod.id+'.json',mod);
for(const p of paths)a.equal(c.hash(fs.readFileSync(p)),prep.afterWork);
for(const mode of ['red','green'])for(const name of ['client-results.json','fixture.json','allure-stderr.log']){const from=T+'/'+mode+'/'+name;fs.copyFileSync(from,D+'/'+mode+'-'+name);}
write(D+'/installed.json',{...prep,installed:true,workSourceMatch:true,targetedNativeAssertions:99,targetedNativePass:true,exactReplay:true,idempotent:true,distributionTextExclusionUnchanged:true,metadata:metadata.map(({data,...rest})=>rest),personalSavesChanged:false,FullChanged:false,oldArchivesChanged:false,committed:false,pushed:false});
console.log(JSON.stringify({installed:true,workSourceMatch:true,workSha256:prep.afterWork,distributionSha256:prep.afterDistribution}));
