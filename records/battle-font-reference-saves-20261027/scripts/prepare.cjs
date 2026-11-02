'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/battle-font-reference-saves-20261027',rec=repo+'/records/battle-font-reference-saves-20261027';
const c=require(repo+'/tools/text-workshop/core.cjs'),hash=p=>c.hash(fs.readFileSync(p)),cr=s=>s.replace(/\r?\n/g,'\r\n');
const qsp=hash(work+'/jack.qsp'),js=hash(work+'/content/js/jo9_battle_log.js'),cssBefore=hash(work+'/css/base.css');
a.equal(qsp,'7c366e1ae35a5922e32052847bceb28737ddab32c3861b19bbefd7661b45c2b7');a.equal(js,'b4656fe77009e0df0d3eef45f2c8d2c96d9454cd98e1d6bb8cab7aa5070f8eb7');a.equal(cssBefore,'6441512de00b91ebc57e509388c7a55a1383a96f76a736703f27eb0a792bb685');a.equal(hash(repo+'/assets/css-2.4/base.css'),cssBefore);
const backup='G:/somi/JO9_work_backups/battle_font_result_'+new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);fs.mkdirSync(backup+'/css',{recursive:true});fs.copyFileSync(work+'/css/base.css',backup+'/css/base.css');
let css=fs.readFileSync(work+'/css/base.css','utf8');
function replace(from,to){from=cr(from);to=cr(to);a.equal(css.split(from).length-1,1,from);css=css.replace(from,to);}
replace('.jo9-battle-result #fight_options,.jo9-battle-result #fight_options_ui2{left:252px;top:620px;width:155px;height:160px;', '.jo9-battle-result #fight_options,.jo9-battle-result #fight_options_ui2{left:43px;top:540px;width:155px;height:160px;');
replace('.jo9-battle-result #fight_subtions{left:880px;top:620px;width:147px;height:160px;', '.jo9-battle-result #fight_subtions{left:1085px;top:540px;width:147px;height:160px;');
replace('.jo9-battle-result #fight_txt{left:423px;top:650px;width:445px;height:132px;', '.jo9-battle-result #fight_txt{left:258px;top:646px;width:763px;height:150px;');
replace('.jo9-battle-result .jo9-battle-result-title{position:absolute;left:423px;top:610px;width:445px;', '.jo9-battle-result .jo9-battle-result-title{position:absolute;left:258px;top:610px;width:763px;');
const start=css.indexOf('/* JO9 MOD START BATTLE_FONT_LAYOUT_20261027'),end=css.indexOf('/* JO9 MOD END BATTLE_FONT_LAYOUT_20261027 */',start)+'/* JO9 MOD END BATTLE_FONT_LAYOUT_20261027 */'.length;a(start>=0&&end>start);
const beforeBlock=css.slice(start,end);
const block=cr(`/* JO9 MOD START BATTLE_FONT_LAYOUT_20261027
   BATTLE_FONT_REFERENCE_RESULT_20261027: attribute values use 20px;
   names stay 26px, and log text restores the original Sandoll 23px. */
.jo9-battle-v01{
 font-family:"경기천년제목 Medium","Malgun Gothic","맑은 고딕",sans-serif;
 font-size:20px;
 line-height:25px;
 white-space:normal;
}
.jo9-battle-v01 #combat_ui_name{
 top:16px;
 height:34px;
 font-size:26px;
 line-height:32px;
}
.jo9-battle-v01 #combat_ui_def{
 height:34px;
 font-size:20px;
 line-height:25px;
}
.jo9-battle-v01 #combat_ui_health,
.jo9-battle-v01 #combat_ui_stamina,
.jo9-battle-v01 #combat_ui_will{font-size:20px;}
.jo9-battle-v01 #combat_ui_conditions{font-size:20px;line-height:25px;}
.jo9-battle-v01 #fight_options,
.jo9-battle-v01 #fight_options_ui2{
 padding:14px;
 font-size:20px;
 line-height:25px;
 overflow:hidden;
 white-space:normal;
}
.jo9-battle-v01 #fight_options>a,
.jo9-battle-v01 #fight_options_ui2>a{
 display:block;
 min-height:44px;
 margin:0 0 8px;
 padding:6px 2px;
 box-sizing:border-box;
 line-height:25px;
}
.jo9-battle-v01 #fight_options>a:last-child,
.jo9-battle-v01 #fight_options_ui2>a:last-child{margin-bottom:0;}
.jo9-battle-v01 #fight_options>br,
.jo9-battle-v01 #fight_options_ui2>br{display:none;}
.jo9-battle-v01 #fight_subtions{
 padding:12px 10px;
 font-size:20px;
 line-height:25px;
 overflow:hidden;
 white-space:normal;
}
.jo9-battle-v01 #fight_subtions>a{
 display:inline;
 min-height:0;
 margin:0;
 padding:0;
 font-size:20px;
 line-height:25px;
}
.jo9-battle-v01 #fight_subtions>a *,
.jo9-battle-v01 #fight_subtions>a font{font-size:inherit;line-height:inherit;}
.jo9-battle-v01 #fight_subtions>font{font-size:20px;line-height:25px;}
.jo9-battle-v01 #fight_subtions>br{display:inline;}
.jo9-battle-v01 #fight_txt{
 font-family:"Sandoll 미생";
 font-size:23px;
 line-height:normal;
 white-space:normal;
 overflow-x:hidden;
 overflow-y:auto;
}
.jo9-battle-result #fight_options,
.jo9-battle-result #fight_options_ui2,
.jo9-battle-result #fight_subtions{padding:0;}
.jo9-battle-result #fight_options>a,
.jo9-battle-result #fight_options_ui2>a,
.jo9-battle-result #fight_subtions>a{min-height:0;margin:0;padding:0;}
.jo9-battle-result #fight_txt{top:646px;height:150px;}
.jo9-battle-result .jo9-battle-result-title{font-size:20px;line-height:26px;}
/* JO9 MOD END BATTLE_FONT_LAYOUT_20261027 */`);
css=css.slice(0,start)+block+css.slice(end);a(!css.includes('BATTLE_LOG_PAGING_20261027'));
fs.mkdirSync(tmp+'/candidate/css',{recursive:true});fs.writeFileSync(tmp+'/candidate/css/base.css',css);fs.mkdirSync(rec+'/scripts',{recursive:true});
const report={status:'CANDIDATE',qspUnchanged:qsp,jsUnchanged:js,cssBefore,cssAfter:hash(tmp+'/candidate/css/base.css'),backup,uiFont:20,nameFont:26,logFont:'Sandoll 미생',logSize:23,resultLog:{left:258,width:763,top:646,height:150},resultIcons:{left:[43,540,155,160],right:[1085,540,147,160]},savesCancelled:true};
fs.writeFileSync(rec+'/candidate.json',JSON.stringify(report,null,2)+'\n');fs.copyFileSync(__filename,rec+'/scripts/prepare.cjs');fs.writeFileSync(rec+'/font-block-before.css',beforeBlock);console.log(JSON.stringify(report));
