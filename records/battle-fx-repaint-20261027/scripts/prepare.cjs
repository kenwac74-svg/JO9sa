'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/battle-fx-repaint-20261027',rec=repo+'/records/battle-fx-repaint-20261027',hash=p=>c.hash(fs.readFileSync(p)),cr=s=>s.replace(/\r?\n/g,'\r\n');
const qsp=hash(work+'/jack.qsp'),beforeCss=hash(work+'/css/base.css'),beforeJs=hash(work+'/content/js/jo9_battle_log.js');a.equal(qsp,'7c366e1ae35a5922e32052847bceb28737ddab32c3861b19bbefd7661b45c2b7');a.equal(beforeCss,'4121a2175e61a9c99fb7032735bf292a60b7a14a476311ed384987df06629774');a.equal(beforeJs,'b4656fe77009e0df0d3eef45f2c8d2c96d9454cd98e1d6bb8cab7aa5070f8eb7');
const backup='G:/somi/JO9_work_backups/battle_fx_repaint_'+new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);for(const rel of ['css/base.css','content/js/jo9_battle_log.js']){const tracked=repo+'/'+(rel.startsWith('css/')?'assets/css-2.4/'+rel.slice(4):'assets/'+rel);a.equal(hash(tracked),hash(work+'/'+rel));fs.mkdirSync(path.dirname(backup+'/'+rel),{recursive:true});fs.copyFileSync(work+'/'+rel,backup+'/'+rel);}
const oldCss=fs.readFileSync(work+'/css/base.css','utf8'),start=oldCss.indexOf('.jo9-battle-v01 .jo9-battle-hit{'),end=oldCss.indexOf('.jo9-battle-result #fight_options',start);a(start>0&&end>start);const oldFx=oldCss.slice(start,end);a.equal((oldFx.match(/@(?:-webkit-)?keyframes/g)||[]).length,4);
const newFx=cr(`/* JO9 MOD START BATTLE_FX_STATIC_LIFETIME_20261027
   Fixed-size paint with a single visibility deadline; no animated opacity or transform. */
.jo9-battle-v01 .jo9-battle-hit{position:absolute;left:390px;top:70px;width:500px;height:460px;z-index:5;pointer-events:none;visibility:hidden;opacity:1;-webkit-transform:none;transform:none;-webkit-animation:none;animation:none;-webkit-transition:none;transition:none;}
.jo9-battle-v01 .jo9-battle-player-hit{position:absolute;left:1037px;top:0;width:243px;height:440px;background:rgba(179,23,23,.45);z-index:6;pointer-events:none;visibility:hidden;opacity:1;-webkit-transform:none;transform:none;-webkit-animation:none;animation:none;-webkit-transition:none;transition:none;}
/* JO9 MOD END BATTLE_FX_STATIC_LIFETIME_20261027 */
`);
const css=oldCss.slice(0,start)+newFx+oldCss.slice(end);a(!/keyframes jo9-battle-(slash|flash)/.test(css));
const oldJs=fs.readFileSync(work+'/content/js/jo9_battle_log.js');
const fxJs=cr(`
/* JO9 MOD START BATTLE_FX_STATIC_LIFETIME_20261027 */
(function () {
 'use strict';
 var root=document.getElementById('jo9_battle_test_v01');
 var layer=root&&root.querySelector('#jo9_battle_fx_layer');
 if(!layer)return;
 function play(node,milliseconds){
  if(!node||node.__jo9StaticFxPlayed)return;
  node.__jo9StaticFxPlayed=true;
  node.style.visibility='visible';
  setTimeout(function(){
   if(document.getElementById('jo9_battle_test_v01')!==root)return;
   if(node.parentNode===layer)node.style.visibility='hidden';
  },milliseconds);
 }
 play(layer.querySelector('.jo9-battle-hit'),600);
 play(layer.querySelector('.jo9-battle-player-hit'),500);
}());
/* JO9 MOD END BATTLE_FX_STATIC_LIFETIME_20261027 */
`);
const js=Buffer.concat([oldJs,Buffer.from(fxJs)]);for(const [rel,data] of [['css/base.css',Buffer.from(css)],['content/js/jo9_battle_log.js',js]]){fs.mkdirSync(path.dirname(tmp+'/candidate/'+rel),{recursive:true});fs.writeFileSync(tmp+'/candidate/'+rel,data);}
fs.mkdirSync(rec+'/scripts',{recursive:true});const report={status:'CANDIDATE',qspUnchanged:qsp,engineUnchanged:hash(work+'/engine/jack.exe'),cssBefore:beforeCss,cssAfter:c.hash(Buffer.from(css)),jsBefore:beforeJs,jsAfter:c.hash(js),backup,enemyDurationMs:600,playerDurationMs:500,scope:'Replace only the two FX CSS animations with fixed-size visibility lifetime. Existing QSP rendering, logs, colors, fonts, skins, positions and callbacks unchanged.'};fs.writeFileSync(rec+'/candidate.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync(rec+'/fx-before.css',oldFx);fs.writeFileSync(rec+'/scripts/static-fx.css',newFx);fs.writeFileSync(rec+'/scripts/static-fx.js',fxJs);fs.copyFileSync(__filename,rec+'/scripts/prepare.cjs');console.log(JSON.stringify(report));
