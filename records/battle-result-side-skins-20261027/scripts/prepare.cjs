'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/battle-result-side-skins-20261027',rec=repo+'/records/battle-result-side-skins-20261027',hash=p=>c.hash(fs.readFileSync(p));
const before=hash(work+'/css/base.css');a.equal(before,'a6e5032d8ec55f17662b5bd64a00dbe065030a6f4fe808ddb63df10801760e2f');a.equal(hash(repo+'/assets/css-2.4/base.css'),before);
const backup='G:/somi/JO9_work_backups/battle_result_side_skins_'+new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);fs.mkdirSync(backup+'/css',{recursive:true});fs.copyFileSync(work+'/css/base.css',backup+'/css/base.css');
const delta=`
/* JO9 MOD START BATTLE_RESULT_SIDE_SKINS_20261027
   Reuse the existing parchment and riveted frames below result portraits.
   Decorative pseudo-elements do not change layout or receive pointer input. */
.jo9-battle-result::before,
.jo9-battle-result::after{
 content:"";
 display:block;
 position:absolute;
 top:440px;
 height:360px;
 margin:0;
 padding:0;
 border:0;
 pointer-events:none;
 z-index:0;
 background-image:url('content/pic/ui/grimdark/bg_stat.png');
 background-repeat:no-repeat;
}
.jo9-battle-result::before{
 left:0;
 width:242px;
 background-size:1291px 360px;
 background-position:left top;
}
.jo9-battle-result::after{
 left:1037px;
 width:243px;
 background-size:1329px 360px;
 background-position:right top;
}
/* JO9 MOD END BATTLE_RESULT_SIDE_SKINS_20261027 */
`.replace(/\r?\n/g,'\r\n');
const raw=fs.readFileSync(work+'/css/base.css');a(!raw.toString('utf8').includes('BATTLE_RESULT_SIDE_SKINS_20261027'));const css=Buffer.concat([raw,Buffer.from(delta)]);fs.mkdirSync(tmp+'/candidate/css',{recursive:true});fs.writeFileSync(tmp+'/candidate/css/base.css',css);fs.mkdirSync(rec+'/scripts',{recursive:true});
const result={status:'CANDIDATE',qspUnchanged:hash(work+'/jack.qsp'),jsUnchanged:hash(work+'/content/js/jo9_battle_log.js'),cssBefore:before,cssAfter:c.hash(css),backup,newImages:0,existingImage:'content/pic/ui/grimdark/bg_stat.png',imageHash:hash(work+'/content/pic/ui/grimdark/bg_stat.png'),scope:'Three result-scoped decorative CSS rules only; existing CSS bytes, icon and text geometry unchanged.'};fs.writeFileSync(rec+'/candidate.json',JSON.stringify(result,null,2)+'\n');fs.writeFileSync(rec+'/scripts/side-skins.css',delta);fs.copyFileSync(__filename,rec+'/scripts/prepare.cjs');console.log(JSON.stringify(result));
