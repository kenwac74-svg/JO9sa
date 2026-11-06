'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const local=path.resolve(__dirname,'../girls-checklist-20261104'),repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const record=repo+'/records/girls-named-filter-20261105',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const test=JSON.parse(fs.readFileSync(__dirname+'/check-report.json'));assert.equal(test.status,'PASS');
const manifest=JSON.parse(fs.readFileSync(local+'/manifest.json'));assert.equal(manifest.characters.filter(c=>c.hasFixedName).length,107);
const beforeQsp=hash(fs.readFileSync(game+'/jack.qsp'));assert.equal(manifest.qspSha,beforeQsp);
for(const c of manifest.characters)assert.equal(hash(fs.readFileSync(game+'/'+c.json)),c.jsonSha256);
const status=fs.readFileSync(game+'/modtools/catalog/catalog_status.js');
const block=/<!-- JO9 GIRLS CHECKLIST START 20261104 -->[\s\S]*?<!-- JO9 GIRLS CHECKLIST END 20261104 -->/g;
const payload=fs.readFileSync(local+'/catalog.updated.html','utf8').match(block);assert.equal(payload.length,1);
const put=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});const t=p+'.named-filter.tmp';assert.ok(!fs.existsSync(t));fs.writeFileSync(t,b);fs.renameSync(t,p);};
const catalogs=[];
for(const file of [game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']){
 const html=fs.readFileSync(file,'utf8');assert.equal((html.match(block)||[]).length,1);
 const next=html.replace(block,()=>payload[0]);assert.equal(next.replace(block,''),html.replace(block,''));
 for(const s of next.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(s[1].trim())new Function(s[1]);
 put(file,next);catalogs.push({path:file,unrelatedHtmlPreserved:true,sha256:hash(Buffer.from(next))});
}
put(game+'/modtools/catalog/JO9_캐릭터_이미지체크리스트.html',fs.readFileSync(local+'/JO9_캐릭터_이미지체크리스트.html'));
for(const f of ['manifest.json','build_inventory.py','build_pages.py','catalog-girls-checklist.js'])put(repo+'/tools/girls-image-checklist/'+f,fs.readFileSync(local+'/'+f));
for(const f of ['check.cjs','check-report.json','install.cjs'])put(record+'/'+f,fs.readFileSync(__dirname+'/'+f));
assert.equal(hash(fs.readFileSync(game+'/jack.qsp')),beforeQsp);assert.ok(status.equals(fs.readFileSync(game+'/modtools/catalog/catalog_status.js')));
const report={namedCharacters:107,criterion:'Nonempty seed_name in current character JSON, not a filename fallback; named random template 1448 included.',browserChecks:test.checks.length,catalogs,gameQspUnchanged:beforeQsp,allCharacterJsonPreserved:true,userTagsPreserved:true,fullTouched:false};
put(__dirname+'/installed.json',JSON.stringify(report,null,2)+'\n');put(record+'/installed.json',JSON.stringify(report,null,2)+'\n');
put(record+'/REPORT_KO.md','# 이름 있는 유니크 필터 — 2026-11-05\n\n캐릭터 이미지 체크리스트 상단에 이름 있는 유니크만 체크박스를 추가했습니다. JSON의 seed_name이 비어 있지 않은107개를 표시하며, 파일명·ID에서 만든 표시명은 제외합니다. 무작위 범위에 있으면서 고정 이름이 있는1448 시루도 포함합니다. 체크 시 전체 상태로 전환해 모든 이름 있는 캐릭터를 표시하고, 이후 검색·정렬·상태 필터를 함께 사용할 수 있습니다.\n\n현재 WORK 자료를 쓴 격리 브라우저에서 이름 필터·검색·이름순·페이지 이동·태그 조합·해제 복원6항목을 확인했습니다. 웹 카탈로그·시드·독립 HTML·생성기·manifest를 갱신했으며 게임 QSP·캐릭터 JSON·이미지·사용자 태그와 Full은 변경하지 않았습니다.\n');
fs.unlinkSync(local+'/catalog.updated.html');
console.log(JSON.stringify(report,null,2));
