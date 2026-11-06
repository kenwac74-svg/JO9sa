'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process');
const here=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',local=path.resolve(here,'../girls-checklist-20261104');
const record=repo+'/records/felicity-size-match-20261105',recovery='G:/somi/JO9resource/character_originals/felicity_size_match_20261105';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const put=(file,data)=>{fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.felicity-fit.tmp';assert.ok(!fs.existsSync(tmp));fs.writeFileSync(tmp,data);fs.renameSync(tmp,file);};
const plan=JSON.parse(fs.readFileSync(here+'/prepared.json'));
const qsp=hash(fs.readFileSync(game+'/jack.qsp')),json=hash(fs.readFileSync(game+'/json/slaves/2572_felicity.json'));
const statusPath=game+'/modtools/catalog/catalog_status.js',status=fs.readFileSync(statusPath);
const sourcePath=repo+'/assets/runtime-source-2.4.1.json',source=JSON.parse(fs.readFileSync(sourcePath));
assert.equal(plan.files.length,5);
for(const f of plan.files){
 assert.ok(/^content\/pic\/girls\/full\/(?:felicity_blond_long(?:_young)?\.png|(?:maid|mistress|secretary)\/felicity\.png)$/.test(f.path));
 assert.equal(hash(fs.readFileSync(game+'/'+f.path)),f.before,'WORK changed since preparation: '+f.path);
 assert.equal(hash(fs.readFileSync(here+'/images/'+f.path)),f.after);
 assert.ok(source.files.filter(x=>x.runtimePath===f.path).length<=1);
}
const applied=[];
for(const f of plan.files){
 const work=game+'/'+f.path,tracked=repo+'/assets/'+f.path,b=fs.readFileSync(work),beforePath=recovery+'/'+f.before+'.png';
 fs.mkdirSync(recovery,{recursive:true});if(!fs.existsSync(beforePath))fs.writeFileSync(beforePath,b,{flag:'wx'});assert.equal(hash(fs.readFileSync(beforePath)),f.before);
 let trackedBefore=null,trackedBeforePath=null;
 if(fs.existsSync(tracked)){
  const old=fs.readFileSync(tracked);trackedBefore=hash(old);
  if(trackedBefore!==f.before){trackedBeforePath=recovery+'/'+trackedBefore+'.png';if(!fs.existsSync(trackedBeforePath))fs.writeFileSync(trackedBeforePath,old,{flag:'wx'});}
 }
 const next=fs.readFileSync(here+'/images/'+f.path);put(work,next);put(tracked,next);
 let resource=source.files.find(x=>x.runtimePath===f.path);
 if(!resource){resource={runtimePath:f.path};source.files.push(resource);}
 Object.assign(resource,{repositoryPath:'assets/'+f.path,bytes:next.length,sha256:f.after});
 applied.push({...f,path:f.path.slice('content/pic/'.length),runtimePath:f.path,bytes:next.length,width:795,height:596,beforePath,trackedBefore,trackedBeforePath});
}
put(sourcePath,JSON.stringify(source,null,2)+'\n');
const manifest={id:plan.id,created:new Date().toISOString(),scope:'WORK and tracked source only; 5 PNG paths / 4 unique images',qspSha256:qsp,jsonSha256:json,files:applied};
const tracker=require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,game+'/modtools/catalog');
tracker.record(manifest,'replace');
put(here+'/applied.json',JSON.stringify(manifest,null,2)+'\n');put(record+'/applied.json',JSON.stringify(manifest,null,2)+'\n');
for(const script of ['build_inventory.py','build_pages.py']){
 const result=cp.execFileSync('py',['-3','-B','-X','utf8',local+'/'+script],{encoding:'utf8'});console.log(result.trim());
}
const block=/<!-- JO9 GIRLS CHECKLIST START 20261104 -->[\s\S]*?<!-- JO9 GIRLS CHECKLIST END 20261104 -->/g;
const payload=fs.readFileSync(local+'/catalog.updated.html','utf8').match(block);assert.equal(payload.length,1);
const dre=/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
const catalogs=[];
for(const file of [game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']){
 const old=fs.readFileSync(file,'utf8');assert.equal((old.match(block)||[]).length,1);
 const m=old.match(dre);assert.ok(m);let data=m[1];const rows=JSON.parse(data);
 let changed=0;
 for(const f of applied){
  const row=rows.find(x=>x[0].replaceAll('\\','/').toLowerCase()===f.runtimePath.toLowerCase());assert.ok(row,'Catalog path absent: '+f.path);
  const updated=[...row];updated[3]=f.bytes;updated[5]=795;updated[6]=596;
  const needle=JSON.stringify(row);assert.equal(data.split(needle).length-1,1);data=data.replace(needle,JSON.stringify(updated));changed++;
 }
 let next=old.replace(m[1],()=>data).replace(block,()=>payload[0]);
 const strip=s=>s.replace(block,'').replace(dre,'__IMAGE_ROWS__');assert.equal(strip(old),strip(next));
 for(const js of next.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(js[1].trim())new Function(js[1]);
 put(file,next);catalogs.push({path:file,rows:changed,unrelatedHtmlPreserved:true});
}
put(game+'/modtools/catalog/JO9_캐릭터_이미지체크리스트.html',fs.readFileSync(local+'/JO9_캐릭터_이미지체크리스트.html'));
put(repo+'/tools/girls-image-checklist/manifest.json',fs.readFileSync(local+'/manifest.json'));
const latest=JSON.parse(fs.readFileSync(local+'/manifest.json'));assert.equal(latest.characters.filter(c=>c.hasFixedName).length,107);
assert.ok(status.equals(fs.readFileSync(statusPath)));assert.equal(hash(fs.readFileSync(game+'/jack.qsp')),qsp);assert.equal(hash(fs.readFileSync(game+'/json/slaves/2572_felicity.json')),json);
for(const f of applied){assert.equal(hash(fs.readFileSync(game+'/'+f.runtimePath)),f.after);assert.equal(hash(fs.readFileSync(repo+'/assets/'+f.runtimePath)),f.after);}
const note='- 2572 펠리시티의 기본 전신을 새 그림으로 교체하고 하녀·도미나·비서 복장을 795×596 안에서 같은 머리 높이와 인물 크기에 맞췄습니다.\n';
const changelog=path.dirname(game)+'/CHANGELOG_KO.md',ch=fs.readFileSync(changelog,'utf8');assert.ok(ch.startsWith('[신규 업데이트]'));
if(!ch.includes(note.trim()))put(changelog,ch.replace(/^(\[신규 업데이트\]\r?\n)/,m=>m+note));
const append=(file,heading,body)=>{const old=fs.readFileSync(file,'utf8');if(!old.includes(heading))put(file,old+'\n\n'+heading+'\n\n'+body+'\n');};
append(repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md','## 2026-11-05 펠리시티 전신·역할 복장 정렬','2572 기본 전신2주소를 사용자 첨부 PNG 바이트 그대로 교체하고, 기존 하녀·도미나·비서3장은 비율을 유지해1.36배 확대·이동했습니다. 인물 끝과 화면 아래 사이에 투명한 띠가 생기지 않도록 배치했습니다. 총5경로를 WORK·추적 PNG·runtime-source·개인 패치 원장·이미지 체크리스트에 등록했습니다. [기록](../records/felicity-size-match-20261105/REPORT_KO.md). 초상·QSP·JSON·Full·ZIP·커밋푸시 변경없음.');
append(repo+'/docs/SESSION_HANDOFF_INDEX.md','## 2026-11-05 펠리시티 기본·복장 크기 맞춤','[반영 기록](../records/felicity-size-match-20261105/REPORT_KO.md): 기본 전신2주소와 역할 복장3주소,795×596. 기존 얼굴·복장·포즈와 투명 경계 보존,WORK/소스/체크리스트/차기 패치 등록.');
put(record+'/REPORT_KO.md','# 펠리시티2572 전신 교체·역할 복장 정렬 — 2026-11-05\n\n사용자 첨부795×596 PNG를 기본 전신의 두 호출 주소에 바이트 그대로 넣었습니다. JSON에 등록된 하녀·도미나·비서3장은 기존 채택 그림에서 균일1.36배 확대 후 각각 위치를 조정했습니다. 머리 높이와 얼굴 크기를 새 기본에 가깝게 맞췄고, 원본 그림의 하단 절단선이 화면 안에 떠 있지 않게 화면 아래까지 배치했습니다. 얼굴·의상·포즈를 새로 그리거나 검은색 임계값으로 누끼를 따지 않았습니다.\n\n알파를 사전 곱한 색으로 한 번 확대하여 투명 픽셀의 숨은 RGB가 경계로 번지는 것을 방지했습니다. 교체 원본4종은 게임 밖에 해시 단위로 보관하고 applied.json에 복원 주소·이전/현재 해시·변환값을 남겼습니다. 옛 기본 두 경로는 호환용으로 모두 유지합니다. 별도 얼굴 초상과 사용되지 않는 작업 후보는 이번 범위에 포함하지 않았습니다.\n\n5장 파일 규격·WORK와 추적 소스/패치 등록 해시를 확인하고, 저장 결과를 회색 배경의 실제 크기와 확대 경계로 확인했습니다. 카탈로그·독립 HTML·관리 시드를 갱신했으며 기존 사용자 태그·이름 필터와 QSP·2572 JSON은 보존했습니다. 실제 EXE 화면의 옷 변경은 사용자 확인 대상입니다. Full 배포 폴더·ZIP·커밋·푸시는 수행하지 않았습니다.\n');
for(const f of ['prepare.py','install.cjs','review.jpg','prepared.json'])put(record+'/'+f,fs.readFileSync(here+'/'+f));
const result={status:'APPLIED',pngPaths:5,uniqueImages:4,outfits:3,size:[795,596],catalogs,qspUnchanged:qsp,jsonUnchanged:json,tagsPreserved:true,namedFilterCount:107,fullTouched:false};
put(here+'/verification.json',JSON.stringify(result,null,2)+'\n');put(record+'/verification.json',JSON.stringify(result,null,2)+'\n');
fs.unlinkSync(local+'/catalog.updated.html');
console.log(JSON.stringify(result,null,2));
