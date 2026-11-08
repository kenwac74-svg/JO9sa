'use strict';
const fs=require('fs'),a=require('assert/strict'),path=require('path'),vm=require('vm');
const T='G:/Codex/tmp/catalog-native-tabs-20261108';
function replace(s,old,next){a.equal(s.split(old).length-1,1,'anchor '+old.slice(0,100));return s.replace(old,()=>next);}
const wrap=code=>'<script>\n'+code+'\n</script>';
const external=src=>'<script src="'+src+'"></script>';
function transform(original){
 const scripts=[...original.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];a.equal(scripts.length,16);
 const body=scripts.map(m=>m[2]);
 const main=original.indexOf('<div id="main">'),first=scripts[0].index;
 let markup=original.slice(main+'<div id="main">'.length,first).trim();a.ok(markup.endsWith('</div>'));markup=markup.slice(0,-6).replace(/\n\s*\n/g,'\n').replace(/<h1>이미지 패치 작업 체크리스트<\/h1>/,'');
 let core=body[1];core=replace(core,'function render(){',"function render(){\n  if(!window.JO9_CATALOG_GALLERY_READY||window.JO9_CATALOG_TABS.current()!=='gallery'){window.JO9_CATALOG_GALLERY_DIRTY=true;return;}window.JO9_CATALOG_GALLERY_DIRTY=false;");
 const pick=core.match(/function pick\(p\)\{[^\n]*\}/)[0];core=replace(core,pick,pick.replace('drawTree();filter();','drawTree();if(window.JO9_CATALOG_SEARCH)window.JO9_CATALOG_SEARCH.run();else filter();'));
 const urlStart='function url(p){';core=replace(core,urlStart,urlStart+"if(window.JO9_CATALOG_BRIDGE&&(p.indexOf(MR+'\\\\')===0||p.indexOf(OR+'\\\\')===0)){var orig=p.indexOf(OR+'\\\\')===0,cfg=window.JO9_CATALOG_BRIDGE;return cfg.url+'api/catalog-asset?t='+encodeURIComponent(cfg.token)+'&original='+(orig?'1':'0')+'&p='+encodeURIComponent(p.substring((orig?OR:MR).length+1));}");
 let girls=body[12];girls=replace(girls,"const root = node('details');","const root = node('section');");girls=replace(girls,"root.append(node('summary', '전체 캐릭터 이미지 보완 목록'));","root.append(node('h2', '전체 캐릭터 이미지 보완 목록'));" );
 const from=girls.indexOf("  const host = document.getElementById('main') || document.body;"),to=girls.indexOf("  const intro =",from);a.ok(from>0&&to>from);
 girls=girls.slice(0,from)+"  const host = document.getElementById('jo9-catalog-panel-girls') || document.body;\n  host.append(root);\n"+girls.slice(to);
 girls=replace(girls,"  function render() {","  function render() {\n    if(window.JO9_CATALOG_TABS&&window.JO9_CATALOG_TABS.current()!=='girls'){dirty=true;return;}dirty=false;");
 girls=replace(girls,'  let page = 0, version = Date.now(), busy = false;','  let page = 0, version = Date.now(), busy = false, dirty=false;');
 girls=replace(girls,"  root.open=new URLSearchParams(location.search).get('girlssets')==='1'||!window.JO9_CATALOG_BRIDGE;","  document.addEventListener('jo9:catalog-tab',e=>{if(e.detail==='girls'&&dirty)render();});");
 girls=replace(girls,"if(live){refreshTags();window.addEventListener('focus',refreshTags);setInterval(refreshTags,5000);}","if(live){refreshTags();const activeRefresh=()=>{if(!window.JO9_CATALOG_TABS||window.JO9_CATALOG_TABS.current()==='girls')refreshTags();};window.addEventListener('focus',activeRefresh);setInterval(activeRefresh,5000);}");
 let mob=body[8];mob=replace(mob,"const root=node('details');root.id='jo9-mob-sets';","const root=node('section');root.id='jo9-mob-sets';");
 mob=replace(mob,"(document.getElementById('main')||document.body).prepend(root);","document.getElementById('jo9-catalog-panel-mob').append(root);");
 mob=mob.replace(/root\.append\(node\('summary',/g,"root.append(node('h2',");
 mob=replace(mob,"root.addEventListener('toggle',()=>{if(root.open&&!loaded)sync();});refresh.onclick=sync;", "document.addEventListener('jo9:catalog-tab',e=>{if(e.detail==='mob'&&dirty)render();});refresh.onclick=sync;");
 mob=replace(mob,"if(new URLSearchParams(location.search).get('mobsets')==='1')root.open=true;","sync();");
 const renderAt=mob.indexOf(' function render(){');a.ok(renderAt>0);mob=replace(mob,' function render(){'," let dirty=false;\n function render(){\n  if(window.JO9_CATALOG_TABS.current()!=='mob'){dirty=true;return;}dirty=false;");
 let pack=body[10];pack=replace(pack,"const root=node('details');","const root=node('section');");pack=replace(pack,"root.append(node('summary',","root.append(node('h2',");
 pack=replace(pack,pack.match(/img\.src=url\(MR[^;]+;/)[0],"img.src=window.JO9_CATALOG_ASSET(f.runtimePath);");
 pack=replace(pack,"root.addEventListener('toggle',()=>{if(root.open)render();});(document.getElementById('main')||document.body).prepend(root);","document.getElementById('jo9-catalog-panel-pack').append(root);render();");
 // Shared scene formatting/data is loaded only by gallery or notes; attaching cards is explicit.
 let conditions=body[15];conditions=replace(conditions,"||typeof root.rowHtml!=='function'",'');
 conditions=replace(conditions,'var data=root.JO9_SCENE_CONDITIONS,document=root.document,previous=root.rowHtml;','var data=root.JO9_SCENE_CONDITIONS,document=root.document;');
 conditions=replace(conditions,'root.JO9_SCENE_CONDITIONS_UI={data:data,htmlFor:htmlFor};','root.JO9_SCENE_CONDITIONS_UI={data:data,htmlFor:htmlFor,indexFor:indexFor,attachGallery:attachGallery};');
 const hook=conditions.indexOf(' root.rowHtml=function'),hookEnd=conditions.indexOf(" css.textContent+=",hook);a.ok(hookEnd>hook);const hookBody=conditions.slice(hook,hookEnd);conditions=conditions.slice(0,hook)+conditions.slice(hookEnd);
 const hostStart=conditions.indexOf(" var host=document.getElementById('main')"),reviewAt=conditions.indexOf(' var reviewIndex=',hostStart),renderAt2=conditions.indexOf(" if(typeof root.render",reviewAt);a.ok(renderAt2>reviewAt);
 conditions=conditions.slice(0,reviewAt)+conditions.slice(renderAt2);
 const installAt=conditions.indexOf(" var host=document.getElementById('main')");
 conditions=conditions.slice(0,installAt)+" function attachGallery(){if(attachGallery.done||typeof root.rowHtml!=='function')return;attachGallery.done=true;var previous=root.rowHtml;\n"+hookBody+conditions.slice(installAt);
 conditions=conditions.replace("var host=document.getElementById('main')||document.body;","var host=document.getElementById('jo9-catalog-panel-gallery')||document.getElementById('main')||document.body;");
 conditions=replace(conditions,"}(typeof window==='undefined'?null:window));"," }\n if(!root.JO9_CATALOG_TABS)attachGallery();\n}(typeof window==='undefined'?null:window));");
 const conditionsSrc=external('catalog-tab/conditions');
 const finish=`window.JO9_SCENE_CONDITIONS_UI.attachGallery();
const nativePick=window.pick;window.pick=function(p){if(window.JO9_CATALOG_TABS.current()!=='gallery')return window.JO9_CATALOG_TABS.activate('gallery').then(()=>nativePick(p));return nativePick(p);};
document.addEventListener('jo9:catalog-tab',e=>{if(e.detail==='gallery'&&window.JO9_CATALOG_GALLERY_DIRTY)render();});
window.JO9_CATALOG_GALLERY_READY=true;render();`;
 const gallery=[markup,wrap('window.JO9_CATALOG_GALLERY_READY=false;'),external('catalog_status.js'),wrap(core),wrap(body[3]),external('catalog_work_codes.js'),external('catalog_workshop_config.js'),external('catalog_workshop.js'),conditionsSrc,external('catalog_cuts.js'),external('catalog-cut-conditions.js'),wrap(body[2]),wrap(finish)].join('\n');
 const notes=conditionsSrc+wrap(`(function(){const ui=window.JO9_SCENE_CONDITIONS_UI,host=document.getElementById('jo9-catalog-panel-notes');host.innerHTML='<h2>처리 주석</h2>'+ui.indexFor(ui.data.entries);const index=host.querySelector('details');if(index)index.open=true;host.addEventListener('click',e=>{const link=e.target.closest('a[href]');if(!link)return;const url=new URL(link.href,location.href),image=url.searchParams.get('image');if(!image)return;e.preventDefault();url.searchParams.set('catalogtab','gallery');history.replaceState(null,'',url);window.JO9_CATALOG_TABS.activate('gallery').then(()=>window.JO9_CATALOG_LOCATE?.(image));});})();`);
 const modules={gallery,girls:'<!-- JO9 GIRLS CHECKLIST START 20261104 -->\n'+wrap(body[11])+wrap(girls)+'\n<!-- JO9 GIRLS CHECKLIST END 20261104 -->',pack:wrap(body[9])+wrap(pack),mob:wrap(body[7])+wrap(mob),notes,conditions:'<!-- JO9_SCENE_CONDITIONS_START -->\n'+wrap(body[14])+wrap(conditions)+'\n<!-- JO9_SCENE_CONDITIONS_END -->'};
 const keys=[['gallery','전체 이미지'],['girls','노예 이미지'],['pack','추가 이미지팩'],['mob','전투 MOB'],['notes','처리 주석']];
 const nav='<nav id="jo9CatalogTabs" role="tablist" aria-label="이미지 목록">'+keys.map(([k,label])=>'<button type="button" role="tab" id="jo9-catalog-tab-'+k+'" aria-controls="jo9-catalog-panel-'+k+'" aria-selected="false">'+label+'</button>').join('')+'</nav>';
 let head=original.slice(0,original.indexOf('</head>')).replace(/\n\s*\n/g,'\n');
 head+=`\n<!-- JO9 MOD START NATIVE_CATALOG_TABS_20261108 -->\n<style>
#jo9CatalogTabs{display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:#202b38;border-bottom:2px solid #987445;margin-bottom:14px}
#jo9CatalogTabs button{padding:11px 18px;background:#303d4e;color:#eee;border:1px solid #71849c;border-radius:5px 5px 0 0;cursor:pointer;font-size:15px}
#jo9CatalogTabs button[aria-selected=true]{background:#e5c28a;color:#211c16;font-weight:bold}
.jo9-catalog-panel{min-height:100px}#jo9CatalogLoadStatus:empty{display:none}
#jo9GalleryNav,#jo9GirlsNav{display:block;width:100%;padding:9px;margin-bottom:8px;text-align:left}
</style></head><body>\n<div id="side"><button type="button" id="jo9GalleryNav">전체 이미지 폴더</button><button type="button" id="jo9GirlsNav">캐릭터 이미지 세트</button><div class="tree" id="tree" hidden></div></div>\n<main id="main"><h1>이미지 패치 작업 체크리스트</h1>${nav}<p id="jo9CatalogLoadStatus" role="status" aria-live="polite"></p>`;
 let html=head+keys.map(([k])=>'<section id="jo9-catalog-panel-'+k+'" class="jo9-catalog-panel" role="tabpanel" aria-labelledby="jo9-catalog-tab-'+k+'" hidden></section>').join('\n')+'</main>\n';
 // Keep data once, in inert source templates. Backend tools can still read/write them.
 for(const [key,payload]of Object.entries(modules))html+='<template id="jo9-catalog-module-'+key+'">\n'+payload+'\n</template>\n';
 html+=wrap(`window.JO9_CATALOG_ASSET=function(p){const c=window.JO9_CATALOG_BRIDGE;if(c)return c.url+'api/pic?t='+encodeURIComponent(c.token)+'&p='+encodeURIComponent(p)+'&v='+Date.now();return 'file:///'+('@GAME@/'+p).replace(/\\\\/g,'/');};`)+external('catalog-tabs.js')+'\n<!-- JO9 MOD END NATIVE_CATALOG_TABS_20261108 -->\n</body></html>\n';
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc=/.test(m[1]))new vm.Script(m[2]);
 fs.writeFileSync(T+'/catalog-girls-checklist.js',girls);fs.writeFileSync(T+'/catalog-scene-conditions.js',conditions);
 return html;
}
for(const [i,name]of [[0,'work'],[1,'seed']]){fs.mkdirSync(T+'/'+name,{recursive:true});const source=fs.readFileSync(T+'/'+i+'-catalog_merge_vs_original.html','utf8');fs.writeFileSync(T+'/'+name+'/catalog_merge_vs_original.html',transform(source));}
// Keep manual search committed when navigating from an image link or directory.
let workshop=fs.readFileSync(T+'/2-catalog_workshop.js','utf8');workshop=replace(workshop,'  applyCodesOffline();','  window.JO9_CATALOG_LOCATE=locate;\n  applyCodesOffline();');
workshop=replace(workshop,"el('q').value=parent;filter();","el('q').value=parent;if(window.JO9_CATALOG_SEARCH)window.JO9_CATALOG_SEARCH.run();else filter();");
workshop=replace(workshop,"main.insertBefore(bar,main.firstChild);","var gallery=document.getElementById('jo9-catalog-panel-gallery')||main;gallery.insertBefore(bar,gallery.firstChild);");
fs.writeFileSync(T+'/catalog_workshop.js',workshop);
const helper="const catalogTabs=require('./catalog-tabs.cjs'); // JO9 MOD NATIVE_CATALOG_TABS_20261108\n";
let server=fs.readFileSync(T+'/4-server.cjs','utf8');server=replace(server,"const catalogModule=require('./catalog.cjs');",helper+"const catalogModule=require('./catalog.cjs');");
server=replace(server,"      html=html.replace(/<\\/body>/i,'<script src=\"catalog_grok.js\"></script><script src=\"catalog_cuts.js\"></script><script src=\"catalog-cut-conditions.js\"></script></body>');","      const nativeCatalog=catalogTabs.native(html);html=catalogTabs.shell(html);\n      html=html.replace(/<\\/body>/i,nativeCatalog?'<script src=\"catalog_grok.js\"></script></body>':'<script src=\"catalog_grok.js\"></script><script src=\"catalog_cuts.js\"></script><script src=\"catalog-cut-conditions.js\"></script></body>');");
server=replace(server,"    const catalogFiles=['catalog_cuts.js'",`    if(req.method==='GET'&&url.pathname.startsWith('/catalog-tab/')){
      const key=url.pathname.slice('/catalog-tab/'.length),html=fs.readFileSync(path.join(catalogRoot,'catalog_merge_vs_original.html'),'utf8'),payload=catalogTabs.payload(html,key,true);
      if(payload===null){res.writeHead(404);res.end();return;}
      const code=key==='conditions'?[...payload.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)].map(m=>m[1]).join('\\n'):payload;
      res.writeHead(200,{'Content-Type':key==='conditions'?'text/javascript; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(code);return;
    }
    const catalogFiles=['catalog-tabs.js','catalog_cuts.js'`);
new vm.Script(server);fs.writeFileSync(T+'/server.cjs',server);
let generate=fs.readFileSync('G:/somi/JO9sa/tools/scene-image-conditions/generate.cjs','utf8');
generate=replace(generate,"html=html.replace(/<!-- JO9_SCENE_CONDITIONS_START -->[\\s\\S]*?<!-- JO9_SCENE_CONDITIONS_END -->\\s*/g,'');html+='\\n'+block+'\\n';", "if(html.includes('<template id=\"jo9-catalog-module-conditions\">')){html=html.replace(/<!-- JO9_SCENE_CONDITIONS_START -->[\\s\\S]*?<!-- JO9_SCENE_CONDITIONS_END -->/,()=>block);}else{html=html.replace(/<!-- JO9_SCENE_CONDITIONS_START -->[\\s\\S]*?<!-- JO9_SCENE_CONDITIONS_END -->\\s*/g,'');html+='\\n'+block+'\\n';}");
new vm.Script(generate);fs.writeFileSync(T+'/generate.cjs',generate);
for(const name of ['catalog-tabs.js','catalog-tabs.cjs'])fs.copyFileSync(path.join(__dirname,name),T+'/'+name);
console.log('Native tab candidates built; data stays in inert source templates');
