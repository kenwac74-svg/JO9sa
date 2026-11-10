'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const core=require('./core.cjs');
const modulePath='./script-game-layout.cjs';
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-game-layout-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.mkdirSync(path.join(root,'css'));fs.mkdirSync(path.join(root,'fonts'));fs.mkdirSync(path.join(root,'content/pic/ui/grimdark'),{recursive:true});fs.mkdirSync(path.join(root,'content/pic/ui/panels/bg_legacy'),{recursive:true});
 fs.writeFileSync(path.join(root,'config.xml'),'<game width="1280" height="800"/>');
 fs.writeFileSync(path.join(root,'css/base.css'),'#text{left:30px;top:615px;width:740px;height:185px;font-size:18px;font-family:경기천년제목 Medium;margin-top:6px;line-height:130%} #bg_blue_script{left:30px;top:20px;width:770px;height:575px;font-size:18px;font-family:경기천년제목 Medium;margin-top:6px;line-height:130%;color:#191970}');
 fs.writeFileSync(path.join(root,'fonts/경기천년제목 Medium.ttf'),'fixture-font');fs.writeFileSync(path.join(root,'content/pic/ui/grimdark/bg.png'),'fixture-image');fs.writeFileSync(path.join(root,'content/pic/ui/panels/bg_legacy/page_blank.png'),'fixture-paper');
 const body="ui_style = 2\nif ui_style = 2:$backimage = 'content/pic/ui/grimdark/bg.png'";
 const doc=core.parse(core.serialize({lines:['QSPGAME','','',core.shift('1',-5),core.shift('_layout',-5),'',core.shift(body,-5),core.shift('0',-5),'']}));return {root,doc};
}
test('WORK 설정·CSS를 읽어 실제 대사창과 종이 영역의 좌표·크기를 반환한다',t=>{
 const {root,doc}=fixture(t),r=require(modulePath).load(root,doc,'test-token');
 assert.deepEqual(r.canvas,{width:1280,height:800});
 assert.deepEqual(r.profiles.dialogue.rect,{left:30,top:621,width:740,height:185});
 assert.equal(r.profiles.dialogue.fontSize,18);assert.equal(r.profiles.dialogue.lineHeight,'130%');assert.equal(r.profiles.dialogue.visibleHeight,179);
 assert.deepEqual(r.profiles.paper.rect,{left:30,top:26,width:770,height:575});
 assert.match(r.frameUrl,/grimdark/);assert.match(r.profiles.paper.paperUrl,/page_blank/);assert.match(r.profiles.dialogue.fontUrl,/script-layout-font/);
});
test('CSS의 같은 선택자 후속 변경을 반영하고 문맥 한정 선택자는 일반 대사창에 적용하지 않는다',t=>{
 const {root,doc}=fixture(t);fs.appendFileSync(path.join(root,'css/base.css'),'#text{width:700px;font-size:20px} #snk_private_room #text{width:200px}');
 const r=require(modulePath).load(root,doc,'test-token');assert.equal(r.profiles.dialogue.rect.width,700);assert.equal(r.profiles.dialogue.fontSize,20);
});
test('프로필·설치 글꼴만 허용하고 임의 경로는 읽지 않는다',t=>{
 const {root}=fixture(t),m=require(modulePath);assert.equal(m.fontFile(root,'dialogue'),path.join(root,'fonts/경기천년제목 Medium.ttf'));
 assert.throws(()=>m.fontFile(root,'../../config.xml'),/프로필/);
 fs.appendFileSync(path.join(root,'css/base.css'),'#text{font-family:"../../secret"}');assert.throws(()=>m.fontFile(root,'dialogue'),/글꼴/);
});
test('빠진 크기를 임의의 정상 게임 크기로 보고하지 않는다',t=>{
 const {root,doc}=fixture(t);fs.writeFileSync(path.join(root,'css/base.css'),'#text{width:740px}');assert.throws(()=>require(modulePath).load(root,doc,'test-token'),/CSS|크기/);
});
test('실제 설치본의 UTF-16 설정과 CSS도 BOM에 맞춰 읽는다',t=>{
 const {root,doc}=fixture(t);for(const name of ['config.xml','css/base.css']){const file=path.join(root,name),text=fs.readFileSync(file,'utf8');fs.writeFileSync(file,Buffer.from('\uFEFF'+text,'utf16le'));}
 const r=require(modulePath).load(root,doc,'test-token');assert.equal(r.canvas.width,1280);assert.equal(r.profiles.dialogue.rect.width,740);
});
