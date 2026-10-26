'use strict';
const fs=require('node:fs'),path=require('node:path');
const sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const dir=process.argv[2];
const files=fs.readdirSync(dir).filter(s=>/-(?:complete|failure)\.sav$/.test(s));
const keys=['SPAWN_SEMEN','SPAWN_MILKED','TENTACLE_STATE','TENTACLE_SIZE','MASTER_ENERGY','INTERACTION','MENU_FORM','QA_QUOTA_STARTED','QA_QUOTA_SEEN','QA_QUOTA_CALLS','QA_QUOTA_PAGES','QA_QUOTA_STALE_RESULT','QA_QUOTA_STALE_LINK','QA_QUOTA_MASTER_AFTER','QA_QUOTA_ACTOR_AFTER','QA_QUOTA_NEXT','QA_QUOTA_REPORTS','DECADE_SEMEN','QA_QUOTA_DECADE_BEFORE'];
for(const file of files){const s=sc.parse(fs.readFileSync(path.join(dir,file))),r={file};for(const k of keys)r[k]=sc.value(s,k)[0];for(const role of ['slave','assistant','room1'])for(const k of ['energy','sub_tentacles','virginity','obedience','age'])r[role+'.'+k]=sc.value(s,role,k)[0];console.log(JSON.stringify(r));}
