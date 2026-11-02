'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {materials,potions}=require('../storage-four-columns-20261102/probe.cjs');
const shop=fs.readFileSync('tmp/alchemy-ui-20261103/candidate/shop_general.qsps','utf8');
const values=new Map([['jo9_lab_material_count','97'],['jo9_lab_potion_count','105'],['$skill_grade[brewing_skill]','C'],['fridge["alcohol"]','16'],['$place_name[$place]','연구실'],['$place_location[$place]','바티칸 교외']]);
materials.forEach((v,i)=>values.set(v.replaceAll("'",'"'),String(11+i)));potions.forEach((v,i)=>values.set(v,String(i+1)));
const interpolate=s=>s.replace(/<<([^>]+)>>/g,(_,key)=>{assert(values.has(key),key);return values.get(key);});
const match=shop.match(/ \$jo9_place_live_info = ('<div style="font-family:경기천년제목 Medium[^\r]+\r\n[^\r]+\r\n[^\r]+)/);assert(match);
const parts=[...match[1].matchAll(/'((?:''|[^'])*)'/g)].map(m=>m[1].replaceAll("''","'"));const content=interpolate(parts.join(''));
values.set('$jo9_place_live_info',content);
const container=interpolate(shop.match(/\*p '(<div id="jo9_lab_stock"[^\r]+)'/)[1]);
const fit=shop.match(/\*p '(<style id="jo9_lab_foreground_fit">[^\r]+)'/)[1];
const title=interpolate(shop.slice(shop.indexOf("elseif $place = 'lab':")).match(/\*p '(<div id="side_panel_main"><center><div style="font-size:40px;[^\r]+)'/)[1]);
// Preview evaluates the actual emitted HTML and foreground CSS from the candidate.
// It is a deterministic browser render; native gameplay is tested separately.
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="/game/"><link rel="stylesheet" href="css/base.css"><style>@font-face{font-family:'Sandoll 미생';src:url('fonts/Sandoll 미생.ttf')}@font-face{font-family:'경기천년제목 Medium';src:url('fonts/경기천년제목 Medium.ttf')}html,body{margin:0;padding:0;width:1280px;height:800px;overflow:hidden}body{background:url('content/pic/ui/grimdark/bg.png') no-repeat}.qa-row{white-space:nowrap}</style></head><body><div id="bg"><img src="content/pic/bg/interiors/victorian_lab.png" width="795" height="595"></div><div id="bg"><div id="center_image_alchemist"><img src="content/pic/girls/full/1448_white_long_young.png"></div></div>${fit}${title}${container}<div id="text">연금술 재료를 선택합니다. 캐릭터가 이 대사 영역을 가리지 않는지 확인합니다.</div></body></html>`;
const out='records/alchemy-ui-terms-20261103';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'preview.html'),html);console.log(JSON.stringify({preview:path.resolve(out,'preview.html'),stockColumns:2,materials:7,potions:14}));
if(process.argv.includes('--serve')){
 const http=require('node:http');const cfg=JSON.parse(fs.readFileSync('local.config.json','utf8').replace(/^\uFEFF/,'')),game=path.resolve(cfg.GameRoot,'game');
 const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);if(pathname==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);return;}assert(pathname.startsWith('/game/'));const file=path.resolve(game,pathname.slice(6));assert(file.toLowerCase().startsWith((game+path.sep).toLowerCase()));const ext=path.extname(file).toLowerCase();assert(['.png','.css','.ttf','.otf'].includes(ext));res.setHeader('Content-Type',({'.png':'image/png','.css':'text/css;charset=utf-8','.ttf':'font/ttf','.otf':'font/otf'})[ext]);fs.createReadStream(file).on('error',()=>{res.statusCode=404;res.end();}).pipe(res);}catch{res.statusCode=404;res.end();}});
 server.listen(4107,'127.0.0.1',()=>console.log('Alchemy render preview http://127.0.0.1:4107/'));
}
