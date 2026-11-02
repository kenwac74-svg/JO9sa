'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const root='G:/Codex/tmp/jo9-wong-fix-20261030/native-regression',p=root+'/parasite-repeat-fatal.qsp',d=c.parse(fs.readFileSync(p));
const l=d.locations.find(z=>z.name==='end_day_screen'),b=c.shift(d.lines[l.body],5),anchor="JO9_QA_WONGFIX_TRACE_FATAL|REP=";if(b.split(anchor).length!==2)throw Error('Trace anchor');
d.lines[l.body]=c.shift(b.replace(anchor,'JO9_QA_WONGFIX_TRACE_FATAL|DEATH_VALUE=<<$death>>|REP='),-5);const bytes=c.serialize(d);qa.inspectWorld(bytes);fs.writeFileSync(p,bytes);console.log(JSON.stringify({prepared:true,sha:c.hash(bytes)}));
