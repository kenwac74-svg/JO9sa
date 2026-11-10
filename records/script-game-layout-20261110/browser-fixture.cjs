'use strict';
// Read-only browser reproduction. Does not accept or write game changes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const source=path.resolve(__dirname,'../../tools/text-workshop'),game='G:/somi/Jack O Nine Tails v2.4_work/game',runtime='G:/Codex/tmp/jo9-game-layout-20261110';
const core=require(source+'/core.cjs'),moduleLayout=require(source+'/script-game-layout.cjs');
const doc=core.parse(fs.readFileSync(game+'/jack.qsp')),layout=moduleLayout.load(game,doc,'fixture');
layout.frameUrl='/frame.png';for(const p of Object.values(layout.profiles)){p.fontUrl='/font.ttf';if(p.paperUrl)p.paperUrl='/paper.png';}
fs.mkdirSync(runtime,{recursive:true});
const app=`const layout=${JSON.stringify(layout)};
let mode='dialogue',long=false;
async function show(){document.getElementById('host').replaceChildren();const loaded=await JO9ScriptReview.loadGameFonts(document,layout);const text=long?'이 문장은 실제 게임 대사창의 넘침을 확인하기 위한 중립적인 시험 문장입니다. '.repeat(80):'[안내]<br>현재 WORK의 UI 이미지와 게임 글꼴을 사용한 실제 크기 미리보기입니다.<br><b>740×185px 대사창</b>의 줄바꿈과 아래쪽 경계를 확인할 수 있습니다.';const rows=JO9ScriptReview.draw(document,document.getElementById('host'),[{id:'S1-P1',newPlain:'시험',previewText:text,excluded:false}],{},layout,mode);document.getElementById('result').textContent='게임 글꼴 '+(loaded?'로드 완료':'로드 실패')+' · '+(rows[0].vertical?'넘침 경고':'영역 안 표시');}
document.getElementById('long').onclick=()=>{long=!long;show()};document.getElementById('paper').onclick=()=>{mode=mode==='paper'?'dialogue':'paper';show()};show();`;
const html='<!doctype html><html lang="ko"><meta charset="utf-8"><title>게임 UI 1:1 시험</title><link rel="stylesheet" href="/style.css"><body style="overflow:auto;height:auto"><main><h1>현재 WORK 게임 UI · 실제 크기 미리보기</h1><p>1280×800px · 게임 글꼴 사용 · 사용자 원고와 무관한 시험 대사</p><button id="long">긴 대사 전환</button> <button id="paper">종이 화면 전환</button><p id="result" role="status"></p><div id="host"></div></main><script src="/review.js"></script><script src="/app.js"></script></body></html>';
const server=http.createServer((req,res)=>{
 if(req.headers.host!=='127.0.0.1:'+server.address().port){res.writeHead(403);res.end();return;}
 const routes={'/':[html,'text/html; charset=utf-8'],'/app.js':[app,'text/javascript; charset=utf-8'],'/review.js':[fs.readFileSync(source+'/script-review.js'),'text/javascript; charset=utf-8'],'/style.css':[fs.readFileSync(source+'/workshop.css'),'text/css; charset=utf-8'],'/frame.png':[fs.readFileSync(game+'/content/pic/ui/grimdark/bg.png'),'image/png'],'/paper.png':[fs.readFileSync(game+'/content/pic/ui/panels/bg_legacy/page_blank.png'),'image/png'],'/font.ttf':[fs.readFileSync(moduleLayout.fontFile(game,'dialogue')),'font/ttf']};
 const resource=routes[req.url];if(!resource){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':resource[1],'Cache-Control':'no-store'});res.end(resource[0]);
});
server.listen(0,'127.0.0.1',()=>{const info={pid:process.pid,url:'http://127.0.0.1:'+server.address().port};fs.writeFileSync(runtime+'/server.json',JSON.stringify(info));console.log(JSON.stringify(info));});
