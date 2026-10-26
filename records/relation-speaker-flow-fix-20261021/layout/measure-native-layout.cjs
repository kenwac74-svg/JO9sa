'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const {chromium} = require(process.env.JO9_PLAYWRIGHT || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const game = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const out = path.resolve(__dirname);
const expected = path.resolve('G:/Codex/tmp/relation-speaker-flow-fix-20261021/layout');
if (out !== expected) throw Error('Unexpected output directory');
const fixturesPath = process.argv[2];
if (!fixturesPath) throw Error('Usage: node measure-native-layout.cjs fixtures.json');
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8').replace(/^\uFEFF/, ''));
if (!Array.isArray(fixtures.cases) || !fixtures.cases.length) throw Error('No cases');
const cssFile = path.join(game,'css/base.css');
const css = fs.readFileSync(cssFile,'utf8');
const font = '경기천년제목 Medium.ttf';
const face = '@font-face{font-family:"경기천년제목 Medium";src:url("/game/fonts/'+encodeURIComponent(font)+'");font-weight:normal;font-style:normal;}';
const head = '<!doctype html><meta charset="utf-8"><title>JO9 relation layout measurement</title><style>'+face+'\n'+css+'</style>';
const trim = s => s.replace(/^(\s|&nbsp;|<[bB][rR]\s*\/?>)+/, '');
let html = head+'<div id="text"></div>';
const server = http.createServer((req,res)=>{
  if (req.url === '/') {res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html);}
  const raw = decodeURIComponent(req.url.split('?')[0]);
  if (!raw.startsWith('/game/')) {res.writeHead(404);return res.end();}
  const resource = path.resolve(game,raw.slice(6));
  if (!resource.startsWith(path.resolve(game)+path.sep)) {res.writeHead(403);return res.end();}
  try { const mime = /\.css$/i.test(resource)?'text/css':/\.ttf$/i.test(resource)?'font/ttf':/\.png$/i.test(resource)?'image/png':'application/octet-stream';res.setHeader('Content-Type',mime);res.end(fs.readFileSync(resource)); } catch {res.writeHead(404);res.end();}
});
(async()=>{
 let context;
 try {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address = 'http://127.0.0.1:'+server.address().port;
  const browserTmp=path.join(out,'browser-tmp');fs.mkdirSync(browserTmp,{recursive:true});
  context=await chromium.launchPersistentContext(path.join(out,'browser-profile'), {executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,viewport:{width:1280,height:800},deviceScaleFactor:1,env:{...process.env,TEMP:browserTmp,TMP:browserTmp},args:['--disable-background-networking','--disable-component-update','--no-first-run']});
  const page=await context.newPage();
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==address)return route.abort();const p=u.pathname;if(p.startsWith('/content/')||p.startsWith('/fonts/'))return route.continue({url:address+'/game'+p});return route.continue();});
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  await page.goto(address,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.load('18px "경기천년제목 Medium"'));
  await page.evaluate(()=>document.fonts.ready);
  const results=[];
  for(const fixture of fixtures.cases){
   if(!/^[a-zA-Z0-9_.-]+$/.test(fixture.id))throw Error('Unsafe fixture id');
   for(const version of ['baseline','candidate']){
    if(typeof fixture[version]!=='string')throw Error('Missing '+fixture.id+' '+version);
    await page.evaluate(html=>document.getElementById('text').innerHTML=html,trim(fixture[version]));
    await page.evaluate(()=>Promise.all([...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r;}))));
    const metrics=await page.evaluate(()=>{
     const el=document.getElementById('text'),s=getComputedStyle(el),box=el.getBoundingClientRect();
     const range=document.createRange();range.selectNodeContents(el);const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);
     const lines=[];for(const r of rects){let row=lines.find(l=>Math.abs(l.top-r.top)<2);if(!row){row={top:r.top,bottom:r.bottom,left:r.left,right:r.right};lines.push(row);}else {row.bottom=Math.max(row.bottom,r.bottom);row.right=Math.max(row.right,r.right);row.left=Math.min(row.left,r.left);}}
     const contentBottom=rects.length?Math.max(...rects.map(r=>r.bottom)):box.top;
     const contentRight=rects.length?Math.max(...rects.map(r=>r.right)):box.left;
     const pseudo=getComputedStyle(document.body,'::after');const overlayTop=pseudo.display==='none'?800:parseFloat(pseudo.top);
     return {box:{x:box.x,y:box.y,width:box.width,height:box.height,bottom:box.bottom},font:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,overflow:s.overflow,fontLoaded:document.fonts.check('18px "경기천년제목 Medium"'),contentBottom,contentRight,viewportBottom:innerHeight,bottomOverlayTop:overlayTop,exceedsViewport:contentBottom>innerHeight,exceedsBottomOverlay:contentBottom>overlayTop,exceedsBox:contentBottom>box.bottom,horizontalOverflow:contentRight>box.right+0.5,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,nonEmptyTextRows:lines.length,lines,plainText:el.innerText};
    });
    const filename=fixture.id+'.'+version+'.png';
    await page.screenshot({path:path.join(out,filename),clip:{x:20,y:600,width:800,height:200}});
    results.push({id:fixture.id,page:fixture.page,version,description:fixture.description||'',inputChars:fixture[version].length,screenshot:filename,...metrics});
   }
  }
  const result={source:fixtures.source||null,fixtureFile:fs.realpathSync(fixturesPath),css:cssFile,cssSha256:crypto.createHash('sha256').update(css).digest('hex'),font:path.join(game,'fonts',font),browser:await context.browser().version(),viewport:{width:1280,height:800},scope:'Headless Edge CSS/font proxy using native QSP text fixtures. Not a QtFastQSP visual proof.',pageErrors,results};
  fs.writeFileSync(path.join(out,'layout-results.json'),JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify({cases:fixtures.cases.length,measurements:results.length,browser:result.browser,pageErrors,overflow:results.filter(r=>r.exceedsViewport||r.exceedsBottomOverlay||r.horizontalOverflow).map(r=>({id:r.id,version:r.version,bottom:r.contentBottom,rows:r.nonEmptyTextRows,overlayTop:r.bottomOverlayTop}))}));
 } finally {if(context)await context.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
