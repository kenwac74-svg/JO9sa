'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),{test}=require('node:test');
const root=process.env.JO9_CATALOG_TEST_ROOT||'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog';
const html=fs.readFileSync(path.join(root,'catalog_merge_vs_original.html'),'utf8');
test('탭과 빈 패널을 초기 HTML에 선언하고 load 후 재배치를 제거한다',()=>{
 a.ok(/<nav id="jo9CatalogTabs"/.test(html));a.ok(/<section id="jo9-catalog-panel-gallery"/.test(html));
 a.doesNotMatch(html,/window\.addEventListener\('load',init\)/);a.doesNotMatch(html,/while\(main\.firstChild\)/);a.doesNotMatch(html,/jo9-catalog-panel>details>summary/);
});
test('목록 코드와 데이터는 탭 템플릿 안에만 있고 기존 분석 형식은 유지한다',()=>{
 for(const key of ['gallery','girls','pack','mob','notes','conditions'])a.ok(new RegExp('<template id="jo9-catalog-module-'+key+'">').test(html),key);
 a.ok(html.indexOf('id="jo9CatalogTabs"')<html.indexOf('var D='));
 const outside=html.replace(/<template id="jo9-catalog-module-[\w-]+">[\s\S]*?<\/template>/g,'');
 a.doesNotMatch(outside,/var D=\[/);a.doesNotMatch(outside,/window\.JO9_GIRLS_CHECKLIST=/);
 const rows=JSON.parse(html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/)[1]);a.ok(rows.length>40000);
});
test('HTTP 첫 응답은 다른 탭의 데이터와 그림 없이 탭 틀만 보낸다',()=>{
 const tabs=require('./catalog-tabs.cjs'),shell=tabs.shell(html);a.ok(shell.length<18000);a.ok(!shell.includes('var D='));a.ok(!shell.includes('JO9_GIRLS_CHECKLIST='));a.ok(!/<img\b/.test(shell));
 for(const key of ['gallery','girls','pack','mob','notes','conditions'])a.ok(tabs.payload(html,key));a.equal(tabs.payload(html,'../server.cjs'),null);
 a.ok(!tabs.payload(html,'gallery',true).includes('src="catalog_workshop_config.js"'),'HTTP bridge is already in the shell head');
});
test('전체 이미지·노예·MOB·추가팩·씬 조건 원천 데이터는 바뀌지 않는다',()=>{
 const record='G:/somi/JO9sa/records/catalog-native-tabs-20261108',installation=JSON.parse(fs.readFileSync(record+'/installation.json','utf8'));
 const baseline=installation.changes.find(e=>e.target.includes('v2.4_work/')&&e.target.endsWith('catalog_merge_vs_original.html')).before;
 const before=require('zlib').gunzipSync(fs.readFileSync(record+'/before/'+baseline+'.gz')).toString('utf8');
 for(const re of [/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/,/window\.JO9_GIRLS_CHECKLIST=([\s\S]*?);\s*<\/script>/,/window\.JO9_MOB_SETS=([\s\S]*?);\s*<\/script>/,/window\.JO9_ADDITIONAL_PACK=([\s\S]*?);\s*<\/script>/,/window\.JO9_SCENE_CONDITIONS=([\s\S]*?);\s*<\/script>/])a.deepEqual(JSON.parse(html.match(re)[1]),JSON.parse(before.match(re)[1]));
});
