'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',rec=repo+'/records/canvas-layer-alignment-20261027',tmp='G:/Codex/tmp/canvas-layer-alignment-20261027',work='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(repo+'/tools/text-workshop/core.cjs'),j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),before=j(rec+'/before.json'),cr=s=>s.replace(/\r?\n/g,'\r\n');
const raw=fs.readFileSync(before.backup+'/jack.qsp'),d=c.parse(raw);a(c.serialize(d).equals(raw));a.equal(c.hash(fs.readFileSync(work+'/jack.qsp')),before.qsp);
const l=d.locations.find(x=>x.name==='exit'),old=c.shift(d.lines[l.body],5),mark=s=>cr('! JO9 MOD START FULLSCREEN_LAYER_ORIGIN_20261027\n'+s+'\n! JO9 MOD END FULLSCREEN_LAYER_ORIGIN_20261027');
const needle="gs '_layout'";a.equal(old.split(needle).length,2);
let next=old.replace(needle,needle+'\r\n'+mark("MAINDESC_X = 0\nMAINDESC_Y = 0\n*p '<div id=\"jo9_gameover_stage\">'"));
const bg='<div id = "bg"><img src="content/pic/bg/game_over.png"></div>';a(next.includes(bg));
next=next.replace(bg,'<div id = "bg" class="jo9_gameover_background"><img src="content/pic/bg/game_over.png"></div>');
const bgLine='*p func(\'interior_change\', \'jo9_html\', \'<div id = "bg" class="jo9_gameover_background"><img src="content/pic/bg/game_over.png"></div>\')';
a(next.includes(bgLine));next=next.replace(bgLine,mark(bgLine));
next=next.replace('! JO9 MOD END PROFILE_POLISH_20261025_R3',mark("*p '</div>'")+'\r\n! JO9 MOD END PROFILE_POLISH_20261025_R3');
next=cr(next);d.lines[l.body]=c.shift(next,-5);const candidate=c.serialize(d),hash=c.hash(candidate);a(c.serialize(c.parse(candidate)).equals(candidate));
const css=fs.readFileSync(before.backup+'/css/base.css');a.equal(c.hash(css),before.css);
const delta=cr(`
/* JO9 MOD START FULLSCREEN_LAYER_ORIGIN_20261027 */
/* Fullscreen scenes use the viewport; the shared 795px cutscene box remains unchanged. */
#jo9_gameover_stage{position:fixed!important;left:0!important;top:0!important;width:1280px!important;height:800px!important;display:block!important;margin:0!important;padding:0!important;box-sizing:border-box;overflow:hidden;background:#090705;z-index:1;}
#jo9_gameover_stage div{display:block!important;}
#jo9_gameover_stage #bg.jo9_gameover_background{position:absolute;left:0;top:0;width:100%;height:100%;margin:0;padding:0;overflow:hidden;font-size:40px;z-index:0;}
#jo9_gameover_stage #bg.jo9_gameover_background>img{position:absolute;left:0;top:0;display:block;width:100%;height:100%;margin:0;padding:0;border:0;pointer-events:none;}
#jo9_gameover_stage #jo9_gameover_message{left:50%!important;margin-left:-415px!important;top:30%!important;max-height:22.5%!important;z-index:1;}
#jo9_gameover_stage #jo9_gameover_menu{left:8.59375%!important;top:63.125%!important;z-index:1;}
/* JO9 MOD END FULLSCREEN_LAYER_ORIGIN_20261027 */
`);
fs.mkdirSync(tmp+'/candidate/css',{recursive:true});fs.mkdirSync(tmp+'/mods',{recursive:true});fs.mkdirSync(rec+'/scripts',{recursive:true});
const patch={id:'2026-10-27_fullscreen_layer_origin',before_sha256:before.qsp,after_sha256:hash,edits:[{location:'exit',field:'body',old,new:next,count:1}]};
const patchFile='2026-10-27_fullscreen_layer_origin.json';fs.writeFileSync(tmp+'/mods/'+patchFile,JSON.stringify(patch,null,2)+'\n');fs.copyFileSync(before.backup+'/jack.qsp',tmp+'/candidate/jack.qsp');
const p=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',tmp+'/candidate/jack.qsp','-ModsDir',tmp+'/mods'],{encoding:'utf8',windowsHide:true,timeout:60000});a.equal(p.status,0,p.stdout+p.stderr);a.equal(c.hash(fs.readFileSync(tmp+'/candidate/jack.qsp')),hash);
const finalCss=Buffer.concat([css,Buffer.from(delta)]);fs.writeFileSync(tmp+'/candidate/css/base.css',finalCss);fs.copyFileSync(tmp+'/mods/'+patchFile,repo+'/mods/'+patchFile);fs.writeFileSync(rec+'/scripts/fullscreen-layer.css',delta);
fs.copyFileSync(__filename,rec+'/scripts/build.cjs');
fs.writeFileSync(rec+'/candidate.json',JSON.stringify({qsp:hash,css:c.hash(finalCss),candidate:tmp+'/candidate/jack.qsp',changedLocations:['exit'],scope:'Gameover fullscreen stage only; all previous battle UI code preserved; original cutscene #bg rules unchanged.'},null,2)+'\n');console.log(JSON.stringify({qsp:hash,css:c.hash(finalCss),candidate:tmp+'/candidate/jack.qsp'}));
