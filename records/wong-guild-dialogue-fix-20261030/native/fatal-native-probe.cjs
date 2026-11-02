'use strict';
// Follow-up instrumentation of the already generated fatal fixture only.
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const root='G:/Codex/tmp/jo9-wong-fix-20261030/native-regression',p=root+'/parasite-repeat-fatal.qsp',d=c.parse(fs.readFileSync(p));
const l=d.locations.find(z=>z.name==='exit'),b=c.shift(d.lines[l.body],5);
const msg="\r\nmsg 'JO9_QA_WONGFIX_parasite_repeat_fatal_COMPLETE|DIRECT=1|REP=<<guild_reputation_rate>>|ILL=<<gave_guild_ill_slave>>|PARA=<<gave_guild_parasite_slave>>|GUARD=<<end_day_guild_visit>>|WARN=<<parasite_slave_warned_before>>|NPC=<<$npc_id>>|DAY=<<day>>|EVENTS=<<EndOfDayEventCnt>>|EXPEL=<<iif(instr($args[0], \"방출\")>0,1,0)>>|GAMEOVER=<<iif(instr($args[0], \"Game Over\")>0,1,0)>>|HTML=<<iif(instr($maintxt, \"jo9_gameover_message\")>0,1,0)>>'\r\n";
d.lines[l.body]=c.shift(b+msg,-5);const bytes=c.serialize(d);qa.inspectWorld(bytes);fs.writeFileSync(p,bytes);
const plan=[{name:'parasite-repeat-fatal',file:p,marker:'JO9_QA_WONGFIX_parasite_repeat_fatal_COMPLETE',checkpoint:'Follow-up: direct tail-only native msg assertion after actual $death to exit'}];
fs.writeFileSync(root+'/plan-fatal-probe.json',JSON.stringify(plan,null,2)+'\n');console.log(JSON.stringify({prepared:true,sha:c.hash(bytes)}));
