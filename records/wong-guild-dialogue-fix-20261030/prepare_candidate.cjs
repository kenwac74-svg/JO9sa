'use strict';
// JO9 MOD START WONG_GUILD_NOTICE_CANDIDATE_20261030
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-wong-fix-20261030';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(game+'/jack.qsp'),before=c.hash(raw);a.equal(before,'1e8e489eb4a2c6412f81af0e50b69d409bc9ffd5d5edb69e2308cd3e9f71bc7c','WORK changed since reproduced defect; review new source before editing');
const d=c.parse(raw);a(c.serialize(d).equals(raw));const loc=d.locations.find(x=>x.name==='end_day_screen');a(loc);
let body=c.shift(d.lines[loc.body],5);
const fatalOld="\t\t\tdynamic $death, $text\r\n\t\telseif gave_guild_parasite_slave > 0:";
const fatalNew="\t\t\t! JO9 MOD START WONG_GUILD_NOTICE_FATAL_TEXT_20261030\r\n\t\t\tdynamic $death, $text[3]\r\n\t\t\t! JO9 MOD END WONG_GUILD_NOTICE_FATAL_TEXT_20261030\r\n\t\telseif gave_guild_parasite_slave > 0:";
const normalOld="\t\tgave_guild_ill_slave = 0\r\n\t\tgave_guild_parasite_slave = 0\r\n\t\tend_day_guild_visit = 1\r\n\t\tjump 'loop' &! assistant_quiet_rule does not suppress this - ImperatorAugustus";
const normalNew="\t\tgave_guild_ill_slave = 0\r\n\t\tgave_guild_parasite_slave = 0\r\n\t\tend_day_guild_visit = 1\r\n\t\t! JO9 MOD START WONG_GUILD_NOTICE_TEXT_20261030\r\n\t\t! Render the existing notice before the daily footer clears its array slots.\r\n\t\t$text = $text[1] + '<br><br>' + $replace($text[2], '</div>', '')\r\n\t\tif $text[3] ! '': $text += '<br><br>' + $text[3]\r\n\t\t! JO9 MOD END WONG_GUILD_NOTICE_TEXT_20261030\r\n\t\tjump 'loop' &! assistant_quiet_rule does not suppress this - ImperatorAugustus";
const edits=[{location:'end_day_screen',field:'body',old:fatalOld,new:fatalNew,count:1},{location:'end_day_screen',field:'body',old:normalOld,new:normalNew,count:1}];
for(const e of edits){a.equal(body.split(e.old).length-1,1,'Unique old anchor');a(!body.includes(e.new),'Candidate already applied');body=body.replace(e.old,e.new);}
d.lines[loc.body]=c.shift(body,-5);const candidate=c.serialize(d);qa.inspectWorld(candidate);
fs.mkdirSync(tmp,{recursive:true});for(const name of ['before.qsp','candidate.qsp']){const p=tmp+'/'+name;a(!fs.existsSync(p),'Existing temporary candidate; inspect before overwrite');fs.writeFileSync(p,raw,{flag:'wx'});}
const patch={id:'2026-10-30_wong_guild_notice_text',description:'Restore Wong daily notice in scalar text and forward the existing expulsion reason; no penalty, trigger, state, save or Angelika changes',before_sha256:before,after_sha256:c.hash(candidate),edits};
const mods=here+'/mods';fs.mkdirSync(mods,{recursive:true});fs.writeFileSync(mods+'/'+patch.id+'.json',JSON.stringify(patch,null,2));
const newloc=d.locations.find(x=>x.name==='$newloc');const cache=Number(c.shift(d.lines[newloc.body],5).match(/jo9_traits_revision\s*=\s*(\d+)/)[1]);
const p={id:'wong-guild-dialogue-fix-20261030',dateKST:'2026-10-30',approval:'적용해',before:tmp+'/before.qsp',candidate:tmp+'/candidate.qsp',mods,patch:mods+'/'+patch.id+'.json',beforeSha256:before,candidateSha256:c.hash(candidate),cacheRevision:cache,engine:game+'/engine/jack.exe',game,stateSave:game+'/save/JO9_GOLD_AP_CHECK_20261026.sav',saveSha256:c.hash(fs.readFileSync(game+'/save/JO9_GOLD_AP_CHECK_20261026.sav')),changedLocations:['end_day_screen'],newPersistentVariables:0,newLocations:0,gameplayMathChanged:false};
fs.writeFileSync(here+'/path.json',JSON.stringify(p,null,2));console.log(JSON.stringify({prepared:true,beforeSha256:before,candidateSha256:p.candidateSha256,edits:2,cacheRevision:cache,tmp}));
// JO9 MOD END WONG_GUILD_NOTICE_CANDIDATE_20261030
