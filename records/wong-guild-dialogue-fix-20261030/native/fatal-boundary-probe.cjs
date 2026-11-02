'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const root='G:/Codex/tmp/jo9-wong-fix-20261030/native-regression',p=root+'/parasite-repeat-fatal.qsp',d=c.parse(fs.readFileSync(p));
const l=d.locations.find(z=>z.name==='end_day_screen'),b=c.shift(d.lines[l.body],5),anchor='dynamic $death, $text[3]';if(b.split(anchor).length!==2)throw Error('Fatal call anchor');
const mark="msg 'JO9_QA_WONGFIX_TRACE_FATAL|REP=<<guild_reputation_rate>>|ILL=<<gave_guild_ill_slave>>|PARA=<<gave_guild_parasite_slave>>|WARN=<<parasite_slave_warned_before>>|DEATHLEN=<<len($death)>>|TEXT3LEN=<<len($text[3])>>|LOC=<<$curloc>>'\r\n\t\t\t";
d.lines[l.body]=c.shift(b.replace(anchor,mark+anchor),-5);const bytes=c.serialize(d);qa.inspectWorld(bytes);fs.writeFileSync(p,bytes);
fs.writeFileSync(root+'/plan-fatal-boundary.json',JSON.stringify([{name:'parasite-repeat-fatal',file:p,marker:'JO9_QA_WONGFIX_TRACE_FATAL',checkpoint:'Direct native trace before unmodified dynamic death call'}],null,2)+'\n');console.log(JSON.stringify({prepared:true,sha:c.hash(bytes)}));
