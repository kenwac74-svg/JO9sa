// 검정 금장 시안을 되돌리고 승인된 번호열 위치와 상태줄 글자 효과만 남긴다.
'use strict';const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),c=require('./text-workshop/core.cjs');
const root=path.resolve(__dirname,'..'),game='C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game',old=JSON.parse(fs.readFileSync(path.join(root,'tmp/dark-gold-latest.json')));
const stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15),out=path.join(root,'build','original-ui-retained-'+stamp),backup=path.join(root,'backups','original-ui-retained-'+stamp);
const q=fs.readFileSync(path.join(game,'jack.qsp')),css=fs.readFileSync(path.join(game,'css/base.css'));assert.equal(c.hash(q),old.qspAfter);assert.equal(c.hash(css),old.cssAfter);
fs.mkdirSync(path.join(out,'game/css'),{recursive:true});fs.mkdirSync(path.join(backup,'css'),{recursive:true});fs.writeFileSync(path.join(backup,'jack.qsp'),q);fs.writeFileSync(path.join(backup,'css/base.css'),css);
const doc=c.parse(q);assert(c.serialize(doc).equals(q));const loc=doc.locations.find(l=>l.name==='main_layout'),body=c.shift(doc.lines[loc.body],5);
const oldText="if ui_style = 0:$backimage = '"+old.asset+"/bg_main.png'",newText="if ui_style = 0:$backimage = 'content/pic/ui/classic/bg_main.png'";assert.equal(body.split(oldText).length-1,1);doc.lines[loc.body]=c.shift(body.replace(oldText,newText),-5);
const candidate=c.serialize(doc);assert(c.serialize(c.parse(candidate)).equals(candidate));assert.equal(c.hash(candidate),old.qspBefore);
const block=/\n\/\* JO9_DARK_GOLD_20261008_BEGIN[\s\S]*?\/\* JO9_DARK_GOLD_20261008_END \*\/\n/;const text=css.toString('utf8');assert.equal((text.match(/JO9_DARK_GOLD_20261008_BEGIN/g)||[]).length,1);
const restored=text.replace(block,'');assert.equal(c.hash(Buffer.from(restored)),old.cssBefore);
const keep=`\n/* JO9_RETAINED_UI_ADJUSTMENTS_20261008_BEGIN */
/* Preserve original font, size, line-height and all icon/portrait artwork. */
.upper_container #upper,.upper_container #upper_calories{color:#3b2718!important;text-shadow:0 1px 1px #000;}
/* Only the six number buttons move; portrait visible outer edge is x974. */
#stasis_cell_1,#stasis_cell_2,#stasis_cell_3,#stasis_cell_4,#stasis_cell_5,#stasis_cell_6{left:974px!important;}
/* JO9_RETAINED_UI_ADJUSTMENTS_20261008_END */\n`;
fs.writeFileSync(path.join(out,'game/jack.qsp'),candidate);fs.writeFileSync(path.join(out,'game/css/base.css'),restored+keep);fs.writeFileSync(path.join(out,'retained.css'),keep);
const v={out,backup,qspBefore:c.hash(q),qspAfter:c.hash(candidate),cssBefore:c.hash(css),cssAfter:c.hash(Buffer.from(restored+keep)),originalQspRestored:true,originalCssPrefixRestored:true,retained:['number-column-left-974','original-font','text-shadow-0-1px-1px-black'],statusColor:'#3b2718'};
fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify(v,null,2));fs.writeFileSync(path.join(root,'tmp/retained-ui-latest.json'),JSON.stringify(v,null,2));
fs.writeFileSync(path.join(root,'mods/2026-10-08_ui_keep_adjustments.json'),JSON.stringify({id:'2026-10-08_ui_keep_adjustments',description:'검정 금장 시안 원복, 번호열 위치와 상태줄 효과만 유지',before_sha256:v.qspBefore,after_sha256:v.qspAfter,edits:[{location:'main_layout',field:'body',old:oldText,new:newText,count:1}]},null,2));console.log(JSON.stringify(v));
