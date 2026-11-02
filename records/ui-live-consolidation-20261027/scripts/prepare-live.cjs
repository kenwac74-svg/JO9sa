'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const source='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/ui-live-consolidation-20261027',out=tmp+'/game',rec='G:/somi/JO9sa/records/ui-live-consolidation-20261027',c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(rec+'/scripts',{recursive:true});
for(const name of ['engine','css','json']){const src=source+'/'+name,dest=out+'/'+name;a(fs.existsSync(src));if(!fs.existsSync(dest))fs.cpSync(src,dest,{recursive:true,dereference:true});}
for(const name of ['content','fonts']){const dest=out+'/'+name;if(!fs.existsSync(dest))fs.symlinkSync(source+'/'+name,dest,'junction');}
fs.copyFileSync(source+'/jack.qsp',out+'/jack.qsp');
const config=fs.readFileSync(source+'/config.xml');a.equal(config[0],255);a.equal(config[1],254);const xml=config.toString('utf16le').replace(/title="[^"]*"/,'title="JO9 UI 배치 실플레이 확인"');fs.writeFileSync(out+'/config.xml',Buffer.from(xml,'utf16le'));
fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const wanted=['JO9_GOLD_AP_CHECK_20261026.sav','JO9_TEST_ALL_REGIONS.sav','20_traits_overflow_merge.sav','26_master_inventory.sav','18_essence-purchase-use.sav','25_milkshop.sav','06_fog-hint-ap-fame.sav'],found=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(wanted.includes(e.name))found.push(p);}}
walk(source+'/save');fs.mkdirSync(out+'/save',{recursive:true});
const saves=[];for(const src of found){const dst=out+'/save/'+path.basename(src);a(!saves.some(x=>x.target===dst),'Ambiguous sample save');fs.copyFileSync(src,dst);const hash=c.hash(fs.readFileSync(src));a.equal(c.hash(fs.readFileSync(dst)),hash);saves.push({source:src,target:dst,sha256:hash});}
const report={game:out,source,qsp:c.hash(fs.readFileSync(out+'/jack.qsp')),engine:c.hash(fs.readFileSync(out+'/engine/jack.exe')),configEncoding:'UTF-16LE BOM preserved',realCopied:['engine','css','json','jack.qsp','config.xml','save samples'],readOnlyResourceJunctions:['content','fonts'],saves,limits:['Only the cloned game may be loaded in the audit window. Never write through content/fonts junctions.','All audit save writes stay in this clone; source saves are not changed.']};
fs.writeFileSync(rec+'/live-workspace.json',JSON.stringify(report,null,2)+'\n');fs.copyFileSync(__filename,rec+'/scripts/prepare-live.cjs');console.log(JSON.stringify({game:out,samples:saves.map(x=>path.basename(x.target)),qsp:report.qsp}));
