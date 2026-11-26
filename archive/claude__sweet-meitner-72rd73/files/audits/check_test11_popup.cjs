const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=path.resolve(__dirname,'../dist/private-room-test11/preview');
const pic='G:/somi/JO9/game/content/pic';
const pkg=path.resolve(base,'../JO9_UI_v1_9_14_SNKmod_R3_private_room_dev/payload');
let fragment=fs.readFileSync(path.join(__dirname,'test11-summary-fragment.html'),'utf8');
// FastQSP displays QSP *NL line endings as line breaks; emulate for HTML QA.
fragment=fragment.replace(/\r?\n/g,'<br>');
fragment=fragment.replace(/src\s*=\s*"([^"]+)"/g,(_,src)=>{
 src=src.replace(/\\/g,'/');
 const f=src.startsWith('content/pic/SNKmod/')?path.join(pkg,src):src==='.png'||src==='content/pic/girls/face/0.png'?path.join(pic,'girls/face/kikuchiyo.png'):path.join(pic,src.replace('content/pic/',''));
 return `src="${pathToFileURL(f).href}"`;
});
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.goto(pathToFileURL(path.join(base,'private-room.html')).href);
 const brand=await page.locator('#slinfo_brand').boundingBox();
 if(Math.abs(brand.x+brand.width-990)>1)throw Error('Brand is not anchored to portrait right edge');
 await page.evaluate(f=>document.body.insertAdjacentHTML('beforeend',f),fragment);
 await page.locator('#snk_summary_layer img').first().waitFor();
 const hit=await page.evaluate(()=>{const e=document.elementFromPoint(931,556);return !!e.closest('#snk_summary_close a')});
 if(!hit)throw Error('Close button is covered');
 const broken=await page.locator('img').evaluateAll(xs=>xs.filter(x=>!x.complete||!x.naturalWidth).map(x=>x.src));
 if(broken.length)throw Error('Missing images: '+broken);
 await page.screenshot({path:path.join(base,'private-room-summary.png')});
 await page.locator('#snk_summary_close a').hover();
 await page.screenshot({path:path.join(base,'private-room-summary-tooltip.png')});
 console.log(JSON.stringify({brandRight:brand.x+brand.width,closeHit:hit,backgroundPreserved:await page.locator('#snk_private_room').isVisible(),broken}));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
