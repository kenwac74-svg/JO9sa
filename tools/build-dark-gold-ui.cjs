// 현재 QSP와 UI를 백업하고 좌표를 보존한 검정 금장 스킨 후보를 만든다.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('./text-workshop/core.cjs');
const sharp=require('C:/Users/Ken Choung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),game='C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game';
const stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15),out=path.join(root,'build','dark-gold-ui-'+stamp),backup=path.join(root,'backups','dark-gold-ui-'+stamp);
const asset='content/pic/SNKmod/ui/dark-gold-20261008';
fs.mkdirSync(path.join(out,'game',asset),{recursive:true});fs.mkdirSync(path.join(out,'game/css'),{recursive:true});fs.mkdirSync(path.join(backup,'css'),{recursive:true});
const raw=fs.readFileSync(path.join(game,'jack.qsp')),css=fs.readFileSync(path.join(game,'css/base.css'));
fs.writeFileSync(path.join(backup,'jack.qsp'),raw);fs.writeFileSync(path.join(backup,'css/base.css'),css);
fs.copyFileSync(path.join(game,'css/mainScreen.css'),path.join(backup,'css/mainScreen.css'));
const doc=core.parse(raw);assert(core.serialize(doc).equals(raw));
const loc=doc.locations.find(l=>l.name==='main_layout'),before=core.shift(doc.lines[loc.body],5);
const old="if ui_style = 0:$backimage = 'content/pic/ui/classic/bg_main.png'",next="if ui_style = 0:$backimage = '"+asset+"/bg_main.png'";
assert.equal(before.split(old).length-1,1);doc.lines[loc.body]=core.shift(before.replace(old,next),-5);
const candidate=core.serialize(doc);assert(core.serialize(core.parse(candidate)).equals(candidate));
const base=core.parse(raw);for(let i=0;i<base.lines.length;i++)if(i!==loc.body)assert.equal(base.lines[i],doc.lines[i]);
fs.writeFileSync(path.join(out,'game/jack.qsp'),candidate);
const defs='<defs><linearGradient id="surface" x2="1" y2="1"><stop stop-color="#30201c"/><stop offset=".48" stop-color="#131316"/><stop offset="1" stop-color="#080c0f"/></linearGradient><linearGradient id="menu"><stop stop-color="#171416" stop-opacity=".95"/><stop offset=".55" stop-color="#151215" stop-opacity=".84"/><stop offset="1" stop-color="#3b1b20" stop-opacity=".9"/></linearGradient></defs>';
function flour(x,y,s=1,color='#743139'){return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width=".8" opacity=".42"><path d="M0 0C-22-8-4-27-23-39S-42-64-27-82C-12-98-6-76-20-77C-31-78-25-89-20-85M0 0C-18-3-38-5-48-18C-59-35-37-44-32-31C-29-21-44-18-42-27M-11-20C-27-18-37-25-39-37C-26-36-18-30-11-20ZM-20-36C-7-42-7-54-10-62C-22-56-26-48-20-36ZM-29-54C-42-53-51-61-51-71C-39-70-32-64-29-54ZM-28-70C-18-66-11-66-8-72C-18-80-24-77-28-70Z"/><circle cx="-48" cy="-18" r="2"/><circle cx="-2" cy="-2" r="1.5"/></g>`;}
const wrap=(w,h,b)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${b}</svg>`;
const frame=(x,y,w,h)=>`<rect x="${x+.5}" y="${y+.5}" width="${w-1}" height="${h-1}" fill="none" stroke="#ad8248"/><rect x="${x+3.5}" y="${y+3.5}" width="${w-7}" height="${h-7}" fill="none" stroke="#53402b"/>`;
const bg=wrap(1280,800,'<rect width="1280" height="800" fill="url(#surface)"/>'+frame(0,0,1000,40)+frame(1008,0,272,800)+flour(996,37,.8)+flour(1270,790,2)+flour(1270,80,1.6)+flour(985,796,1.3));
const card=wrap(260,248,'<rect width="260" height="248" fill="url(#surface)"/>'+frame(0,0,260,248)+'<path d="M5 34H255" stroke="#735432"/>'+flour(252,239,1.7)+flour(253,32,.8));
// Original bar.png: 409x62, painted frame at x57..313, y5..55. The icon slot stays transparent.
const menu=wrap(409,62,'<rect x="57" y="5" width="256" height="50" fill="url(#menu)"/>'+frame(57,5,256,50)+flour(308,51,.85));
const skin=`\n/* JO9_DARK_GOLD_20261008_BEGIN: appearance only; original icon/portrait rules retained. */
#jo9_master_card,#jo9_slave_card,#jo9_assistant_card{background-image:url("${asset}/card.png")!important;}
#jo9_master_card:before,#jo9_slave_card:before,#jo9_assistant_card:before{color:#efd49b!important;}
#master_short_stat,#slave_short_stat,#assistant_short_stat{color:#e8ddc9!important;}
.upper_container #upper,.upper_container #upper_calories{color:#f0dfbd!important;text-shadow:0 1px 1px #000;}
.menu li a,.snk_menu_label{background-image:url("${asset}/menu.png")!important;}
/* Portrait outer edge: 820 + 150 + 4 = 974. Number buttons originally at 983. */
#stasis_cell_1,#stasis_cell_2,#stasis_cell_3,#stasis_cell_4,#stasis_cell_5,#stasis_cell_6{left:974px!important;}
/* JO9_DARK_GOLD_20261008_END */\n`;
assert(!css.includes(Buffer.from('JO9_DARK_GOLD_20261008_BEGIN')));
fs.writeFileSync(path.join(out,'game/css/base.css'),Buffer.concat([css,Buffer.from(skin)]));fs.writeFileSync(path.join(out,'skin.css'),skin);
(async()=>{for(const [name,svg] of [['bg_main',bg],['card',card],['menu',menu]]){fs.writeFileSync(path.join(out,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(out,'game',asset,name+'.png'));}
const mod={id:'2026-10-08_dark_gold_ui',description:'현재 UI 배치 보존, 홈/도시 배경 프레임과 카드·메뉴 스킨. 보관 초상화 원형 유지, 번호열 9px 밀착.',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits:[{location:'main_layout',field:'body',old,new:next,count:1}]};
fs.writeFileSync(path.join(out,'mod.json'),JSON.stringify(mod,null,2));
const validation={out,backup,asset,qspBefore:core.hash(raw),qspAfter:core.hash(candidate),cssBefore:core.hash(css),cssAfter:core.hash(fs.readFileSync(path.join(out,'game/css/base.css'))),locations:doc.locations.length,changedLocations:['main_layout'],roundtrip:true,unchangedOtherQspFields:true,numberColumnShift:-9};
fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify(validation,null,2));fs.writeFileSync(path.join(root,'tmp/dark-gold-latest.json'),JSON.stringify(validation,null,2));console.log(JSON.stringify(validation));})();
