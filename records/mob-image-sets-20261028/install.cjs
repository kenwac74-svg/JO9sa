'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',cat=game+'/modtools/catalog',tmp='G:/Codex/tmp/mob-sets-20261028';
const patch=require('./patch.json'),manifest=require('./manifest.json'),record=repo+'/records/mob-image-sets-20261028';
const reports=fs.readdirSync('G:/Codex/tmp/mob-sets-gate-20261028').map(n=>'G:/Codex/tmp/mob-sets-gate-20261028/'+n+'/report.json').filter(p=>fs.existsSync(p)).map(p=>({p,r:JSON.parse(fs.readFileSync(p))}));
const passed=reports.find(x=>x.r.verdict==='PASS'&&JSON.stringify(x.r).includes(patch.after_sha256));a(passed,'Official PASS required');a(require('./native-report.json').pass);a(require('./browser-report.json').pass);
const previousPath=record+'/installation.json',previous=fs.existsSync(previousPath)?JSON.parse(fs.readFileSync(previousPath)):null;
const expectedWork=previous?.qspAfter||patch.before_sha256;
a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),expectedWork,'WORK changed');a.equal(c.hash(fs.readFileSync(tmp+'/candidate.qsp')),patch.after_sha256);
const htmlPath=cat+'/catalog_merge_vs_original.html',statusPath=cat+'/catalog_status.js',beforeHTML=fs.readFileSync(htmlPath),beforeStatus=fs.readFileSync(statusPath);
let html=beforeHTML.toString('utf8');if(previous){const pattern=/<!-- MOB_SET_CATALOG_DATA_20261028 -->[\s\S]*?\/\* JO9 MOD END MOB_SET_CATALOG_20261028 \*\/[\s\r\n]*<\/script>\s*/;a(pattern.test(html));html=html.replace(pattern,'');}else a(!html.includes('MOB_SET_CATALOG_DATA_20261028'));const match=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);a(match);const rows=JSON.parse(match[1]),keys=new Set(rows.map(r=>r[0].toLowerCase())),added=[];
for(const e of manifest.entries)for(const role of ['portrait','standing','defeat']){const s=e[role];if(!s)continue;const p=s.path.replaceAll('/','\\');if(keys.has(p.toLowerCase()))continue;keys.add(p.toLowerCase());rows.push([p,'a','etc',s.bytes||0,0,s.width||795,s.height||596,'']);added.push({path:p,missing:!s.exists});}
html=html.replace(match[1],()=>JSON.stringify(rows));
const js=fs.readFileSync(__dirname+'/catalog-mob-sets.js','utf8');const injection='<!-- MOB_SET_CATALOG_DATA_20261028 -->\n<script>window.JO9_MOB_SETS='+JSON.stringify(manifest).replaceAll('<','\\u003c')+';</script>\n<script>'+js+'</script>\n';a(html.match(/<\/body>/i));html=html.replace(/<\/body>/i,()=>injection+'</body>');
const status=require(repo+'/tools/text-workshop/catalog.cjs').parseStatus(beforeStatus.toString('utf8'));for(const x of added)if(x.missing&&!status.items[x.path])status.items[x.path]=['todo'];status.savedAt=Date.now();
const protectedFiles=[game+'/css/base.css',game+'/content/js/jo9_battle_log.js',game+'/save/1.sav',game+'/save/JO9_GOLD_AP_CHECK_20261026.sav','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'];
const protectedHashes=protectedFiles.map(p=>[p,c.hash(fs.readFileSync(p))]);
fs.mkdirSync(record,{recursive:true});const backup=game+'/jack.qsp.bak_mob_sets_20261028';if(previous)a.equal(c.hash(fs.readFileSync(backup)),patch.before_sha256);else fs.copyFileSync(game+'/jack.qsp',backup,fs.constants.COPYFILE_EXCL);
const catBackup=cat+'/image_work/backups/mob-sets-20261028';fs.mkdirSync(catBackup,{recursive:true});if(!previous){fs.writeFileSync(catBackup+'/catalog_merge_vs_original.html',beforeHTML,{flag:'wx'});fs.writeFileSync(catBackup+'/catalog_status.js',beforeStatus,{flag:'wx'});}
// Recheck immediately before replacing either user-maintained file.
a(fs.readFileSync(htmlPath).equals(beforeHTML));a(fs.readFileSync(statusPath).equals(beforeStatus));a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),expectedWork);
const atomic=require(repo+'/tools/text-workshop/catalog.cjs').atomic;atomic(game+'/jack.qsp',fs.readFileSync(tmp+'/candidate.qsp'));atomic(htmlPath,html);atomic(statusPath,'window.CATALOG_STATUS='+JSON.stringify(status)+';\n');
fs.writeFileSync(repo+'/mods/2026-10-28_mob_set_slots.json',JSON.stringify(patch,null,2));fs.mkdirSync(repo+'/tools/mob-image-sets',{recursive:true});fs.copyFileSync(__dirname+'/catalog-mob-sets.js',repo+'/tools/mob-image-sets/catalog-mob-sets.js');
for(const f of fs.readdirSync(__dirname).filter(f=>/\.(cjs|js|json|md|log)$/.test(f)))fs.copyFileSync(__dirname+'/'+f,record+'/'+f);
fs.copyFileSync(passed.p,record+'/official-report.json');
const result={status:'APPLIED',qspBefore:patch.before_sha256,qspAfter:patch.after_sha256,backup,catalogBackup:catBackup,rowsAdded:added.length,summary:manifest.summary,protected:protectedHashes.map(([p,h])=>({path:p,unchanged:h===c.hash(fs.readFileSync(p))}))};a(result.protected.every(x=>x.unchanged));fs.writeFileSync(record+'/installation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));

