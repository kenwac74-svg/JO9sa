// CSS/layout proof using the same selectors and packaged art. NOT a game capture.
// node preview.cjs <node-modules> <development-package> <game-pic-directory>
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require(path.join(process.argv[2],'playwright'));
const pkg=path.resolve(process.argv[3]),game=path.resolve(process.argv[4]);
const out=path.resolve(pkg,'../preview');fs.mkdirSync(out,{recursive:true});
const file=p=>pathToFileURL(p).href;
const art=p=>file(path.join(pkg,'payload/content/pic/SNKmod',p));
const original=p=>file(path.join(game,p));
const button=(src,tip,action='',disabled=false)=>`<${disabled?'span':'a'} class="snk_button ${disabled?'snk_disabled':''}" title="${tip}" tooltip-data="${tip}" ${action?'data-view="'+action+'"':''}><img src="${src}" alt="${tip}"></${disabled?'span':'a'}>`;
const ap=who=>`<div id="jo9_ap_${who}" class="jo9_ap"><a><span class="jo9_ap_cells">${Array.from({length:5},()=>'<span class="jo9_ap_cell jo9_ap_green"></span>').join('')}</span></a></div>`;
const menuIcons=JSON.parse(fs.readFileSync(path.join(pkg,'payload/json/menu_icon.json'),'utf8')).menu_item;
let css=fs.readFileSync(path.join(pkg,'payload/css/base.css'),'utf8');
css=css.replace(/url\((['"]?)(content\/pic\/SNKmod\/[^)'"]+)\1\)/gi,(_,q,p)=>`url("${file(path.join(pkg,'payload',p))}")`);
css=css.replace(/url\((['"]?)(content\/pic\/[^)'"]+)\1\)/gi,(_,q,p)=>`url("${original(p.slice('content/pic/'.length))}")`);
const rows=[['allocate','방 비우기'],['talk','회화한다'],['sex','섹스한다'],['lesson','교육 활동'],['sex_edu','성교육'],['tutor','가정교사'],['reward','칭찬']];
const menu=rows.map(([icon,label,disabled])=>{
 let li=menuIcons['menu_item_'+icon].replace(/content\/pic\//g,original('')+'/');
 if(disabled) li=li.replace('<li','<li class="snk_disabled"');
 return li+`<${disabled?'span':'a'} class="snk_menu_label">${label}</${disabled?'span':'a'}></li>`;
}).join('');
const header=`<!doctype html><meta charset="UTF-8"><title>JO9 개인실 패키지 CSS 검증</title><style>${css}\nhtml,body{margin:0!important;padding:0!important;width:1280px!important;height:800px!important;overflow:hidden!important;background:url('${art('ui/bg.png')}') 0 0/1280px 800px!important}.snk_room_overlay{display:none}.snk_room_overlay.open{display:block}</style>`;
const html=header+`<div id="snk_private_room">
<div id="snk_room_bg"><img src="${original('bg/sboudoir.png')}"></div>
<div id="snk_room_character"><img src="${original('girls/full/secretary/kikuchiyo.png')}"></div>
<div id="jo9_master_card"></div><div id="jo9_slave_card"></div><div id="snk_room_slave_name">개인실1:키쿠치요</div>
<div id="master_short_ava"><img src="${original('master/master_noble.png')}"></div>
<div id="slave_short_ava"><img src="${original('girls/face/kikuchiyo.png')}"></div>
${ap('master')}${ap('slave')}
<div id="master_short_stat"><a style="color:green">차분함</a><br>보통<br><span style="color:blue">청결함</span></div>
<div id="slave_short_stat"><a style="color:green">차분함</a><br>공로[1]<br><span style="color:blue">청결함</span></div>
<div id="slinfo_ill"><img src="${original('buttons/z_ill.png')}"></div>
<div id="slinfo_wounds"><img src="${original('buttons/z_wounds.png')}"></div>
<div id="slinfo_rank">S+</div><div id="slinfo_brand">문신</div>
<div id="slinfo_block">${['Vir_Ocr.png','Arouse1.png'].map(p=>`<div><img src="${fs.existsSync(path.join(pkg,'payload/content/pic/SNKmod/ui',p))?art('ui/'+p):original('ui/jon-UIadds/'+p)}"></div>`).join('')}<div class="snk_fertility"><img src="${art('ui/z_pregnant.png')}"></div></div>
<div id="snk_room_quick">${button(art('buttons/room_diet.png'),'식사 설정','diet')}${button(art('ui/action_reward.png'),'보상')}${button(art('ui/action_wash.png'),'씻게 한다')}</div>
<div id="debug_info">${button(art('ui/action_info_s.png'),'종합정보')}</div>
<div id="snk_room_header_actions">${button(art('ui/action_question.png'),'질문')}</div>
<div id="snk_room_menu"><div class="menu menu_column_0"><ul>${menu}</ul></div><div id="Back_Reward"><a style="padding-top:75px" tooltip-data="뒤로"><img src="${original('ui overhaul/back.png')}"></a></div><div id="cancel_Reward"><a style="padding-top:75px" tooltip-data="취소"><img src="${original('ui overhaul/cancel.png')}"></a></div></div>
<div id="snk_room_notice"><img class="snk_notice_image" id="notice_content" src="${art('ui/private_room_notice.png')}" style="display:none"><div class="snk_close">${button(original('buttons/debug_button.png'),'개인실 주요 변경사항','notice')}</div></div>
<div class="snk_room_overlay" id="snk_room_diet"><h2>식사 설정</h2><div class="snk_close">${button(art('buttons/close_button.png'),'닫기','close')}</div>${['일반식 · 2 스파크/일','고열량식 · 4 스파크/일','특별식단 · 8 스파크/일'].map((s,i)=>`<div class="snk_diet_row">${button(art('buttons/'+(i?'unsel':'sel')+'_button.png'),s)}${s}</div>`).join('')}</div>
<div id="text">개인실 대사 표시 영역입니다. 인물의 상태와 행동 결과가 이곳에 표시됩니다. 긴 문장은 이 영역 안에서 확인합니다.</div>
<div id="snk_room_home">${button(art('ui/home.png'),'1층으로 돌아가기')}</div></div>
<script>document.addEventListener('click',e=>{const a=e.target.closest('[data-view]');if(!a)return;const v=a.dataset.view;if(v==='notice'){const t=document.querySelector('#notice_content');const open=t.style.display==='none';t.style.display=open?'block':'none';a.setAttribute('tooltip-data',open?'안내 닫기':'개인실 주요 변경사항');a.title=open?'안내 닫기':'개인실 주요 변경사항';a.querySelector('img').src=open?'${art('buttons/close_button.png')}':'${original('buttons/debug_button.png')}';return}const target=v==='close'?null:document.querySelector('#snk_room_'+v);const wasOpen=target&&target.classList.contains('open');document.querySelectorAll('.snk_room_overlay').forEach(x=>x.classList.remove('open'));if(target&&!wasOpen)target.classList.add('open')})</script>`;
fs.writeFileSync(path.join(out,'private-room.html'),html);
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
 await page.goto(file(path.join(out,'private-room.html')));
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:path.join(out,'private-room.png')});
 const geometry=await page.evaluate(()=>{
  const r=id=>document.getElementById(id).getBoundingClientRect();
  const m=r('text'),h=r('snk_room_home'),c=r('jo9_master_card'),s=r('snk_room_bg');
  return {originalText:m.x===30&&m.y===615&&m.width===740,scene:s.width===795&&s.height===595,homeFits:h.right<=799&&h.bottom<=781,cardFits:c.bottom<=780,bar:getComputedStyle(document.querySelector('#jo9_ap_master>a')).height===getComputedStyle(document.querySelector('#jo9_ap_master')).height};
 });
 if(Object.values(geometry).some(x=>!x))throw Error('Layout bounds failed: '+JSON.stringify(geometry));
 const nav=await page.evaluate(()=>['Back_Reward','cancel_Reward'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return [r.x,r.y,r.width,r.height]}));
 if(JSON.stringify(nav)!==JSON.stringify([[4,330,24,56],[4,392,24,56]]))throw Error('Navigation bounds: '+JSON.stringify(nav));
 const preg=await page.locator('.snk_fertility img').boundingBox();if(preg.width>28.01||preg.height>30.01)throw Error('Pregnancy icon exceeds slot');
 await page.locator('[data-view="diet"]').hover();
 const tooltip=await page.locator('[data-view="diet"]').evaluate(e=>({host:getComputedStyle(e).zIndex,parent:getComputedStyle(e.parentElement).zIndex,tip:getComputedStyle(e,'::after').zIndex,shown:getComputedStyle(e,'::after').visibility}));
 if(+tooltip.tip<2147483647||tooltip.shown==='hidden')throw Error('Tooltip layer failed: '+JSON.stringify(tooltip));
 await page.screenshot({path:path.join(out,'private-room-tooltip.png')});
 await page.mouse.move(700,700);

 for(const v of ['diet','notice']){
   await page.locator(`[data-view="${v}"]`).click();
   if(!await page.locator(v==='notice'?'#notice_content':'#snk_room_'+v).isVisible())throw Error('Overlay did not open: '+v);
   await page.mouse.move(790,580);
   await page.screenshot({path:path.join(out,`private-room-${v}.png`)});
   if(v==='diet'){
     for(const [x,y] of [[790,80],[500,785],[400,80]]){
       await page.mouse.move(x,y);
       const visible=await page.evaluate(()=>!!document.elementFromPoint(500,300).closest('#snk_room_diet'));
       if(!visible)throw Error('Background covered dialog');
     }
   }
   await page.locator(`[data-view="${v}"]`).click();
   if(await page.locator(v==='notice'?'#notice_content':'#snk_room_'+v).isVisible())throw Error('Overlay did not toggle closed: '+v);
 }
 const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src));
 await page.setViewportSize({width:960,height:600});
 await page.evaluate(()=>{document.body.style.transform='scale(.75)';document.body.style.transformOrigin='top left';});
 await page.screenshot({path:path.join(out,'private-room-small.png')});
 console.log(JSON.stringify({out,broken,overlayToggles:'pass',sizes:['1280x800','960x600']}));
 await browser.close();if(broken.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
