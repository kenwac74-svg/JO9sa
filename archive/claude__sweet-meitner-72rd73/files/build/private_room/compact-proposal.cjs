const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const out=path.resolve('dist/private-room-work/preview'),b=await chromium.launch({headless:true,channel:'msedge'}),p=await b.newPage({viewport:{width:1280,height:800}});await p.goto(pathToFileURL(path.join(out,'lower-section-proposal.html')).href);
await p.evaluate(()=>{
 const root=document.querySelector('#snk_private_room');
 for(const e of [...root.children]){
  if(['snk_room_panel','snk_room_title','snk_room_tools'].includes(e.id))continue;
  const s=getComputedStyle(e);if(parseFloat(s.left)>=975&&s.position==='absolute')e.style.setProperty('top',(parseFloat(s.top)-60)+'px','important');
 }
 document.querySelector('#snk_room_title').remove();document.querySelector('#snk_room_tools').remove();
 const name=document.querySelector('#snk_room_slave_name');name.textContent='개인실1:키쿠치요';name.style.fontSize='15px';
 const n=document.querySelector('#snk_room_notice');n.querySelector('.snk_close').remove();
 const content=n.lastElementChild;content.id='proposal_notice_text';content.style.display='none';
 n.style.setProperty('background','transparent','important');n.style.setProperty('border-color','transparent','important');
 const a=document.createElement('button');a.id='proposal_info';a.textContent='ⓘ';a.setAttribute('aria-label','개인실 주요 변경사항 열기');a.style.cssText='position:absolute;right:5px;top:5px;width:23px;height:23px;padding:0;color:#f1d391;background:#292016;border:1px solid #aa8950;border-radius:2px;font:bold 20px/21px serif;cursor:pointer';n.append(a);
 a.addEventListener('click',()=>{const open=content.style.display==='none';content.style.display=open?'block':'none';a.textContent=open?'×':'ⓘ';a.setAttribute('aria-label',open?'안내 닫기':'개인실 주요 변경사항 열기');});
});
await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:path.join(out,'compact-room-default.png')});await p.screenshot({path:path.join(out,'compact-panel-default.png'),clip:{x:960,y:0,width:320,height:800}});
await p.locator('#proposal_info').click();await p.mouse.move(700,700);if(!await p.locator('#proposal_notice_text').isVisible())throw Error('notice open');await p.screenshot({path:path.join(out,'compact-panel-open.png'),clip:{x:960,y:0,width:320,height:800}});await p.locator('#proposal_info').click();if(await p.locator('#proposal_notice_text').isVisible())throw Error('notice close');
fs.writeFileSync(path.join(out,'compact-room-proposal.html'),await p.content());
const pair=await b.newPage({viewport:{width:680,height:850}});await pair.setContent('<style>body{margin:0;background:#171b16;color:#eadcbe;font:16px sans-serif}.row{display:flex;gap:20px;padding:10px}figure{margin:0}figcaption{height:30px;text-align:center}img{width:320px;height:800px}</style><div class="row"><figure><figcaption>기본 상태 · 안내 숨김</figcaption><img src="'+pathToFileURL(path.join(out,'compact-panel-default.png')).href+'"></figure><figure><figcaption>ⓘ 클릭 · 안내 표시</figcaption><img src="'+pathToFileURL(path.join(out,'compact-panel-open.png')).href+'"></figure></div>');
// Load the comparison as a file so local preview images remain accessible.
fs.writeFileSync(path.join(out,'compact-comparison.html'),await pair.content());await pair.goto(pathToFileURL(path.join(out,'compact-comparison.html')).href);await pair.screenshot({path:path.join(out,'compact-comparison.png')});await b.close();console.log('preview and toggle verification complete')})();
