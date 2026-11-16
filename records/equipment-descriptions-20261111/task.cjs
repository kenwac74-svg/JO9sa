'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto'),vm=require('vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root=repo+'/tools/game-reference';
const record=repo+'/records/equipment-descriptions-20261111',tmp='G:/Codex/tmp/equipment-descriptions-20261111',id='2026-11-11_equipment_effect_descriptions';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
fs.mkdirSync(record+'/before',{recursive:true});fs.mkdirSync(tmp+'/mods',{recursive:true});
const raw=fs.readFileSync(game+'/jack.qsp'),doc=core.parse(raw),sourceBefore=hash(repo+'/assets/runtime/2.4.1/jack.qsp');assert.equal(doc.hash,sourceBefore);
if(fs.existsSync(record+'/before.qsp.gz'))assert(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz')).equals(raw));else fs.writeFileSync(record+'/before.qsp.gz',zlib.gzipSync(raw));fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',record+'/before/runtime-source-2.4.1.json');
for(const f of ['items.input.json','items.json','jo9-reference.html','README.md','snapshot.json'])fs.copyFileSync(root+'/'+f,record+'/before/'+f);
const effects={
 man_rugs:'옷차림 점수 -1. 낡은 옷으로 인한 기분 저하. 별도 전투 능력 보정 없음.',
 comfy_robes:'옷차림 점수 -1, 대상별 장악력 추가 -1. 편안한 옷으로 인한 기분 상승. 별도 전투 능력 보정 없음.',
 fancy_suit:'옷차림 점수 +1. 별도 전투 능력 보정 없음.',
 regal_suit:'옷차림 점수 +2, 대상별 장악력 추가 +1. 불편한 옷으로 인한 기분 저하. 별도 전투 능력 보정 없음.',
 formal_suit:'예술 지식 +1. 전투 피해를 직접 올리는 효과는 없음.',
 aketon:'전투 기술 +1(최대 6). 전투 시작 시 공격·방어 판정과 기본 사기에 반영. 갑옷의 피해 감소와는 별개.',
 livery:'관리 기술 +1. 별도 전투 능력 보정 없음.',
 medic_robes:'의학 지식 +1. 직접 전투의 자동 회복이나 회복 물약 강화 효과는 없음.',
 wizard_robes:'마법 기술 +1. 직접 전투의 기본 공격 피해를 올리는 효과는 없음.',
 miracle_robes:'전투·마법·의학·관리·예술 기술 각 +1(각 최대 6), 옷차림 점수 +2, 기분 상승. 전투 기술 보정은 전투 시작 시 공격·방어 판정과 기본 사기에 반영.',
 raven_crown:'아우스펙스 유지, 마그나 효과 10 유지, 장악력 유물 보너스 +1. 키메라 귀걸이를 함께 착용하면 마그나와 유물 보너스가 피격 후 체력 회복량에 기여. 별도 갑옷 방어력은 없음.',
 chimera_earring:'장악력 유물 보너스 +2. 전투에서 체력 피해를 받은 뒤 체력 회복: 이번 피해와 (지배력+힘+마그나+유물 보너스) 중 작은 값, 최대 체력까지. 타격·정신 피해 경로에는 이 회복이 적용되지 않음. 평시 상처 회복을 돕고 성욕·흥분을 유지. 힘 능력치를 직접 더하지는 않음.',
 snake_amulet:'장악력 유물 보너스 +1. 전투 시작 기본 사기 2배. 별도의 정신 피해 저항이나 고통·공포 면역은 없음.',
 bull_ring:'장악력 유물 보너스 +1. 전투 시작 최대 스태미나 2배. 평시 여러 행동의 행동력 비용을 줄임. 힘·사기를 직접 증가시키는 효과는 없음.',
 obereg:'장악력 유물 보너스 +2, 리벨리스 유지. 평시 질병 감염 위험과 행동력 초과 사용으로 인한 힘 성장치 손실을 막음. 키메라 귀걸이 착용 시 유물 보너스가 피격 후 체력 회복량에 기여. 별도 전투 피해 면역은 없음.'
};
const lore={
 raven_crown:'제작자 발리오스가 큰까마귀 관이라 명명한 인공물이다. 착용하면 타인의 오라를 읽고 자신의 아우라를 강화한다.',
 chimera_earring:'가르시드라는 이름의 쉭쉭대는 괴생물체에게서 받은 귀걸이다. 착용자의 아우라와 회복력을 강화한다.',
 snake_amulet:'세르피스 가문의 현명한 부셴이 제작해 건넨 목걸이다. 착용자의 아우라와 전투 중 사기를 강화한다.',
 bull_ring:'타우루스 가문 장교 아라무스가 건넨 평범한 외형의 반지다. 착용자의 아우라와 지구력을 강화한다.',
 obereg:'전직 검투사 그라쿠스에게 대가로 받은 독특한 형태의 부적이다. 착용자의 아우라를 강화하고 평소 몸을 보호한다.'
};
const loc=doc.locations.find(l=>l.name==='#item_base'),body=core.shift(doc.lines[loc.body],5);let nextBody=body;const edits=[],updates=[];
const re=/^dynamic \$ib_cycle, '([^']+)', '([^']+)', (\d+), '((?:''|[^'])*)', '((?:''|[^'])*)'$/gm;
for(const m of body.matchAll(re)){const key=m[1].toLowerCase();if(!effects[key])continue;const prior=m[4].replaceAll("''", "'"),prefix=lore[key]||prior.replace(/^<br>\s*/,'').split('<br><br>')[0].trim();const description='<br> '+prefix+'<br><br> 효과: '+effects[key];const escaped=description.replaceAll("'","''"),line=m[0].replace("'"+m[4]+"', '"+m[5]+"'","'"+escaped+"', '"+m[5]+"'");assert.notEqual(line,m[0]);const marker='ITEM_EFFECT_DESCRIPTIONS_20261111_'+key;
 const replacement='! JO9 MOD START '+marker+'\r\n'+line+'\r\n! JO9 MOD END '+marker;
 edits.push({location:'#item_base',field:'body',old:m[0],new:replacement,count:1,patchId:marker});updates.push({id:m[1],name:m[2],oldDescription:prior,newDescription:description,price:Number(m[3])});nextBody=nextBody.replace(m[0],replacement);
}
assert.equal(updates.length,15);const expected=core.parse(raw);expected.lines[loc.body]=core.shift(nextBody,-5);const candidate=core.serialize(expected);qa.inspectWorld(candidate);
const mod={id,status:'APPROVED',description:'Clarify the actual effects of the 15 protagonist clothing/artifact items. Display descriptions only; all equipment effects and combat logic preserved.',before_sha256:doc.hash,after_sha256:core.hash(candidate),edits};
write(repo+'/mods/'+id+'.json',mod);write(tmp+'/mods/'+id+'.json',mod);write(record+'/changes.json',updates);
const apply=(file,log)=>{const r=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',file,'-ModsDir',tmp+'/mods'],{encoding:'utf8',maxBuffer:4e6});fs.writeFileSync(record+'/'+log,(r.stdout||'')+(r.stderr||''));assert.equal(r.status,0,'Official apply failed, see '+log);};
fs.copyFileSync(game+'/jack.qsp',tmp+'/replay.qsp');apply(tmp+'/replay.qsp','replay.log');assert(fs.readFileSync(tmp+'/replay.qsp').equals(candidate));apply(tmp+'/replay.qsp','idempotence.log');assert(fs.readFileSync(tmp+'/replay.qsp').equals(candidate));
assert.equal(hash(game+'/jack.qsp'),doc.hash);apply(game+'/jack.qsp','apply.log');assert(fs.readFileSync(game+'/jack.qsp').equals(candidate));
fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');const metaPath=repo+'/assets/runtime-source-2.4.1.json',meta=JSON.parse(fs.readFileSync(metaPath));meta.sourceQspSha256=core.hash(candidate);meta.snapshotDate='2026-11-11';meta.latestEquipmentDescriptions={date:'2026-11-11',mod:id,report:'records/equipment-descriptions-20261111/REPORT_KO.md'};for(const f of meta.files||[])if(f.repositoryPath==='assets/runtime/2.4.1/jack.qsp'){f.sha256=core.hash(candidate);f.bytes=candidate.length;}write(metaPath,meta);
// Keep reference descriptions current while preserving all unrelated databases and manual entries.
const byId=new Map(updates.map(u=>[u.id.toLowerCase(),u]));const patchItems=set=>{let count=0;for(const row of set.rows){const u=byId.get(String(row.id).toLowerCase());if(!u)continue;row.description=u.newDescription.replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'').trim()+'\n기본 가격 '+u.price+'스파크';count++;}assert.equal(count,15);set.latestEquipmentDescriptionUpdate={date:'2026-11-11',sourceQspSha256:core.hash(candidate),items:15};};
for(const f of ['items.input.json','items.json']){const set=JSON.parse(fs.readFileSync(root+'/'+f));patchItems(set);write(root+'/'+f,set);}
const htmlPath=root+'/jo9-reference.html',html=fs.readFileSync(htmlPath,'utf8'),match=html.match(/<script id="reference-data" type="application\/json">([\s\S]*?)<\/script>/);assert(match);const data=JSON.parse(match[1]),beforeData=structuredClone(data);patchItems(data.items);const result=html.replace(match[1],()=>JSON.stringify(data).replaceAll('<','\\u003c'));for(const script of result.matchAll(/<script>\s*([\s\S]+?)<\/script>/g))new vm.Script(script[1]);for(const key of Object.keys(beforeData).filter(k=>k!=='items'))assert.deepEqual(data[key],beforeData[key]);fs.writeFileSync(htmlPath,result);
const snapshotPath=root+'/snapshot.json',snapshot=JSON.parse(fs.readFileSync(snapshotPath));snapshot.equipmentDescriptionUpdate={date:'2026-11-11',sourceQspSha256:core.hash(candidate),items:15};snapshot.files=fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isFile()&&e.name!=='snapshot.json').sort((a,b)=>a.name.localeCompare(b.name)).map(e=>({file:e.name,sha256:hash(root+'/'+e.name),bytes:fs.statSync(root+'/'+e.name).size}));write(snapshotPath,snapshot);for(const f of ['jo9-reference.html','snapshot.json'])fs.copyFileSync(root+'/'+f,game+'/modtools/game-reference/'+f);
const clean=s=>s.replace(/! JO9 MOD START ITEM_EFFECT_DESCRIPTIONS_20261111_.*?\r\n|\r\n! JO9 MOD END ITEM_EFFECT_DESCRIPTIONS_20261111_[^\r\n]*/g,'');let reverted=nextBody;for(const u of updates)reverted=reverted.replace(u.newDescription.replaceAll("'","''"),u.oldDescription.replaceAll("'","''"));assert.equal(clean(reverted),body);
for(let i=0;i<doc.lines.length;i++)if(i!==loc.body)assert.equal(expected.lines[i],doc.lines[i]);qa.inspectWorld(fs.readFileSync(game+'/jack.qsp'));assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),core.hash(candidate));
write(record+'/verification.json',{pass:true,before:doc.hash,after:core.hash(candidate),items:15,changedLocation:'#item_base',descriptionsOnly:true,executableDefinitionsPreserved:true,roundtrip:true,markersAndLineEndings:true,officialReplay:true,idempotent:true,workAndSourceMatch:true,referenceOtherSectionsPreserved:true,gameplayGuiChecked:false,fullTouched:false,audioTouched:false,commit:false,push:false});
// Remove only verified official duplicate backups and exact named temporary task files.
const workBackups=fs.readdirSync(game).filter(n=>/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(n));for(const n of workBackups){const p=path.resolve(game,n);assert.equal(path.dirname(p),path.resolve(game));if(hash(p)===doc.hash&&zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz')).equals(fs.readFileSync(p)))fs.unlinkSync(p);}
for(const dir of [tmp,tmp+'/mods'])for(const name of fs.readdirSync(dir)){const p=path.resolve(dir,name);if(fs.lstatSync(p).isFile()&&(name==='replay.qsp'||/^replay\.qsp\.bak_\d{8}_\d{6}$/.test(name)||name===id+'.json'))fs.unlinkSync(p);}
for(const dir of [tmp+'/mods',tmp]){assert.equal(fs.readdirSync(dir).length,0);assert(!fs.lstatSync(dir).isSymbolicLink());fs.rmdirSync(dir);}
console.log(JSON.stringify({pass:true,items:15,before:doc.hash,after:core.hash(candidate),record}));
