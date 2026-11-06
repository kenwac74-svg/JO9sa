'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),repo='G:/somi/JO9sa',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const paths=['menu_icon.json','menu_item.json','slaves/2581_marirose.json','slaves/2582_rachel.json','slaves/2583_galateya.json','slaves/2584_venera.json','slaves/2622_sense.json','slaves/8889_kikuchiyo.json','slaves/8902_RiceShower.json','slave_index.json','slaves/0_template.json'];
const ps=`Add-Type -AssemblyName System.IO.Compression.FileSystem
$z=[System.IO.Compression.ZipFile]::OpenRead('G:/somi/JO9_2.4.1_Patch_20261105_r2/JO9_2.4.1_Patch_20261105_r2.zip')
$out=@();foreach($p in @(${paths.map(s=>"'"+s+"'").join(',')})){$e=$z.GetEntry('game/json/'+$p);if($null -ne $e){$ms=[System.IO.MemoryStream]::new();$s=$e.Open();$s.CopyTo($ms);$s.Dispose();$out+=@{path=$p;base64=[Convert]::ToBase64String($ms.ToArray())};$ms.Dispose()}}
$z.Dispose();$out|ConvertTo-Json -Compress`;
const pr=spawnSync('powershell.exe',['-NoProfile','-Command',ps],{encoding:'utf8',maxBuffer:4*1024*1024});if(pr.status!==0)throw Error(pr.stderr);
const zipped=new Map(JSON.parse(pr.stdout.trim()).map(x=>[x.path,Buffer.from(x.base64,'base64')]));
function duplicates(raw){
 const text=raw.toString('utf8').replace(/^\uFEFF/,''),tokens=text.match(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\],:]/g);let i=0;const dup=[];
 function val(at){const token=tokens[i++];if(token==='{'){const obj={},values=new Map();if(tokens[i]==='}'){i++;return obj;}while(true){const k=JSON.parse(tokens[i++]);assert.equal(tokens[i++],':');const v=val(at+'.'+k);if(!values.has(k))values.set(k,[]);values.get(k).push(v);obj[k]=v;const d=tokens[i++];if(d==='}')break;assert.equal(d,',');}for(const[k,vs]of values)if(vs.length>1)dup.push({objectPath:at,key:k,values:vs,extraOccurrences:vs.length-1});return obj;}if(token==='['){const a=[];if(tokens[i]===']'){i++;return a;}while(true){a.push(val(at+'['+a.length+']'));const d=tokens[i++];if(d===']')break;assert.equal(d,',');}return a;}return JSON.parse(token);}
 const parsed=val('$');assert.equal(i,tokens.length);assert.deepEqual(parsed,JSON.parse(text));return dup.sort((a,b)=>(a.objectPath+'.'+a.key).localeCompare(b.objectPath+'.'+b.key));
}
const manifest=JSON.parse(fs.readFileSync(path.resolve(root,'../release-patch-20261105/qa-game/json-source-manifest.json'),'utf8'));
const rows=[];
for(const p of paths.slice(0,9)){
 const latest=zipped.get(p);if(!latest)throw Error('ZIP entry missing '+p);
 const g=spawnSync('git',['-C',repo,'show','49458e6:assets/json/'+p],{maxBuffer:4*1024*1024});if(g.status!==0)throw Error('git show failed '+p+g.stderr);
 const latestDup=duplicates(latest),baselineDup=duplicates(g.stdout),same=JSON.stringify(latestDup)===JSON.stringify(baselineDup);
 rows.push({path:'game/json/'+p,baselineGit:'49458e6:assets/json/'+p,zipSha256:hash(latest),baselineSha256:hash(g.stdout),wholeFileUnchanged:latest.equals(g.stdout),matchesPriorReleaseLedger:hash(latest)===manifest.files.find(x=>x.path===p)?.sha256,latestDuplicateGroups:latestDup,baselineDuplicateGroups:baselineDup,duplicateGroupsUnchanged:same,status:same?'PRE_EXISTING_DATA_WARNING':'NEW_OR_CHANGED_DATA_WARNING'});
}
const workQsp='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(workQsp);assert.equal(hash(raw),'f9abbda0c5881886424709f68986398ff9527328213dfea4fc770eb4a02f2536');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),doc=core.parse(raw),sourceEvidence=[],zeroTypeReferences=[],seedLoadCallers=[];
for(const l of doc.locations){const lines=core.shift(doc.lines[l.body],5).split('\r\n');for(let i=0;i<lines.length;i++){
 if((l.name==='generate_stock'&&/special_stock > 0|stock_type =|gs 'get_stock_seed'/.test(lines[i]))||(l.name==='get_stock_seed'&&/stock\['age'\] = seed_age/.test(lines[i])))sourceEvidence.push({location:l.name,line:i+1,text:lines[i],context:lines.slice(Math.max(0,i-2),i+3)});
 if(/\b(?:special_stock|stock_type)\s*=\s*0\b/.test(lines[i]))zeroTypeReferences.push({location:l.name,line:i+1,text:lines[i]});
 if(l.name!=='generate_stock'&&/gs\s+'get_stock_seed'/i.test(lines[i]))seedLoadCallers.push({location:l.name,line:i+1,text:lines[i],context:lines.slice(Math.max(0,i-5),i+2)});
}}
const result={createdAt:new Date().toISOString(),scope:'Read-only direct ZIP versus git 49458e6 object; no runtime edits or game EXE.',rows,totalLatestDuplicateGroups:rows.reduce((n,r)=>n+r.latestDuplicateGroups.length,0),totalLatestDuplicateExtraOccurrences:rows.reduce((n,r)=>n+r.latestDuplicateGroups.reduce((v,x)=>v+x.extraOccurrences,0),0),allDuplicateGroupsUnchanged:rows.every(x=>x.duplicateGroupsUnchanged),indexJson:JSON.parse(zipped.get('slave_index.json').toString('utf8').replace(/^\uFEFF/,'')),templateJsonSha256:hash(zipped.get('slaves/0_template.json')),qspHash:hash(raw),sourceEvidence,zeroTypeReferences,seedLoadCallers,templateClassification:{status:'TEMPLATE_NONPLAYABLE_DEFAULT',normalGenerationExcludesZero:true,evidence:'generate_stock accepts explicit special_stock only when >0; otherwise ranges begin at1,1001,2001. get_stock_seed reads the selected stock_type arrays.',limits:'Native engine JSON loading may still populate seed index0. This is not a claim that arbitrary external/manual saved state can never request stock_type0; normal generation excludes it.'}};
fs.writeFileSync(path.join(__dirname,'data-classification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({rows:rows.map(r=>({path:r.path,wholeFileUnchanged:r.wholeFileUnchanged,duplicateGroupsUnchanged:r.duplicateGroupsUnchanged,duplicates:r.latestDuplicateGroups})),totalExtra:result.totalLatestDuplicateExtraOccurrences,indexJson:result.indexJson,sourceEvidence},null,2));
