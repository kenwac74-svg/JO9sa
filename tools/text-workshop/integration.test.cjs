'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const core=require('./core.cjs'),scenes=require('./scenes.cjs'),catalog=require('./catalog.cjs');
function fixture(){const defs=[['texts',`if hero_choice < 100:
 $greeting[1]='가게 앞에 도착했다.'
 $greeting[2]='어서 오세요, 손님.'
 $greeting[3]='원하시는 상품을 골라 주세요.'
 if reputation < -2:
  $greeting[2]='오늘은 문을 닫았습니다.'
  $greeting[3]='다음에 다시 찾아와 주세요.'
 end
end`],['shop',`if shop = 2:
 $special_image[1]='bg/shop-1.png'
 $special_image[2]='bg/shop-2.png'
 $special_image[3]='bg/shop-3.png'
 copyarr '$text', '$greeting'
end
if shop = 3:
 $special_image[2]='bg/shop-r_<<rand(1,picMax[''shop-r''])>>.png'
 copyarr '$text', '$greeting'
end`]];const lines=['QSPGAME','header','',core.shift(String(defs.length),-5)];for(const [n,b] of defs)lines.push(core.shift(n,-5),'',core.shift(b,-5),core.shift('0',-5));lines.push('');return Buffer.from(lines.join('\r\n'),'utf16le');}
function catalogFiles(root,records){fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'catalog_merge_vs_original.html'),'<!doctype html><script>var D='+JSON.stringify(records)+';\nvar MR="test", OR="original";</script><script src="catalog_work_codes.js"></script><script src="catalog_workshop_config.js"></script><script src="catalog_workshop.js"></script>');fs.writeFileSync(path.join(root,'catalog_status.js'),'window.CATALOG_STATUS={"savedAt":1,"items":{}};');}
const record=(p,parent='')=>[p,'r','ui',100,100,795,596,parent];
test('대사 배열의 실제 copyarr 장면, 같은 단계의 조건별 교체, 다음 단계 분기를 묶는다',()=>{const doc=core.parse(fixture()),entries=core.entries(doc),nav=scenes.buildNavigator(doc,entries),entry=entries.find(e=>e.text==='어서 오세요, 손님.');const c=nav.context({...entry,hash:doc.hash});assert.equal(c.flow.selected,2);assert.equal(c.flow.usages.length,2);assert.equal(c.flow.stages[1].variants.length,2);assert.equal(c.flow.stages[1].variants[1].conditions[0],'reputation < -2');assert.equal(c.flow.stages[2].variants.length,2);assert.equal(c.next.text,'원하시는 상품을 골라 주세요.');assert.deepEqual(c.images.map(x=>x.path),['bg/shop-2.png']);assert.equal(nav.context({...entry,hash:doc.hash},undefined,'text',c.flow.usages[1].id).images[0].random,true);});
test('부모 배경은 인물 그림과 함께 유지하고 형제 조건의 그림은 이어받지 않는다',()=>{const a=scenes.analyse('room',`if hero < 10:
 $place='room'
 if room = 1:
  $special_bg='scene/old.png'
 end
 if room = 2:
  $special_bg='characters/new.png'
  *pl '현재 방에 들어갔다.'
 end
end`),s=a.scenes.find(x=>x.condition==='room = 2');assert.deepEqual(scenes.sceneImages(a,s).map(x=>typeof x==='string'?x:x.path),['characters/new.png','bg\\room']);});
test('작업 번호 유지·짝 그림 공유, 상태 병합·백업, 다른 상태를 지우지 않는다',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-catalog-'));try{const records=[record('content\\pic\\bg\\shop-2.png'),record('content\\pic\\ui overhaul\\icon.png'),record('content\\pic\\ui\\shop.png','content\\pic\\bg\\shop-2.png')];catalogFiles(dir,records);const store=catalog.create(dir),p=records[0][0],child=records[2][0];assert.equal(store.meta(p).code,'bg-0001');assert.equal(store.meta(records[1][0]).code,'UO-0001');assert.equal(store.meta(child).unitCode,store.meta(p).code);assert.match(store.meta(child).code,/^UI-/);
 store.update([{path:p,flag:'ore',expected:false,checked:true}]);store.update([{path:p,flag:'done',expected:false,checked:true}]);assert.deepEqual(store.meta(p).flags,['done','ore']);assert.ok(store.meta(child).flags.includes('done'));store.update([{path:child,flag:'done',expected:true,checked:true}]);store.update([{path:p,flag:'done',expected:true,checked:false}]);assert.ok(store.meta(child).flags.includes('done'),'수동 완료한 짝 그림 유지');assert.deepEqual(store.meta(p).flags,['ore']);
 const code=store.meta(p).code;records.unshift(record('content\\pic\\bg\\aaa.png'));catalogFiles(dir,records);assert.equal(store.meta(p).code,code);assert.equal(store.meta(records[0][0]).code,'bg-0002');assert.ok(fs.readdirSync(path.join(dir,'image_work','status_backups')).length>=4);assert.throws(()=>store.update([{path:'..\\bad',flag:'done',expected:false,checked:true}]),/항목/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('공유 서버: 최신 플레이 그림·단계/랜덤 구분·카탈로그 진입·origin/token/경로 방어',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-integrated-')),game=path.join(dir,'game'),cat=path.join(dir,'IMGMG'),runtime=path.join(dir,'runtime');fs.mkdirSync(path.join(game,'content','pic','bg'),{recursive:true});fs.writeFileSync(path.join(game,'jack.qsp'),fixture());for(const n of ['shop-1.png','shop-2.png','shop-3.png','shop-r_1.png','shop-r_2.png'])fs.writeFileSync(path.join(game,'content','pic','bg',n),Buffer.from(n));catalogFiles(cat,['shop-1.png','shop-2.png','shop-3.png','shop-r_1.png','shop-r_2.png'].map(n=>record('content\\pic\\bg\\'+n)));
 const child=spawn(process.execPath,[path.join(__dirname,'server.cjs'),'--game-dir',game,'--runtime',runtime,'--catalog-dir',cat],{stdio:['ignore','pipe','pipe']});let errors='';child.stderr.on('data',b=>errors+=b);
 try{const ready=await new Promise((resolve,reject)=>{let out='';const t=setTimeout(()=>reject(Error(errors||'시작 시간 초과')),15000);child.once('exit',()=>{clearTimeout(t);reject(Error(errors));});child.stdout.on('data',b=>{out+=b;if(out.includes('\n')){clearTimeout(t);resolve(JSON.parse(out.trim()));}});});const html=await(await fetch(ready.url)).text(),token=html.match(/const token='([a-f0-9]+)'/)[1];const api=async(p,data,origin)=>{const r=await fetch(ready.url+p,{method:data?'POST':'GET',headers:{'X-JO9-Token':token,...(origin?{Origin:origin}:{}),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});return {r,v:await r.json()};};
 const search=await api('api/search?q='+encodeURIComponent('어서 오세요')),c=(await api('api/context',{selection:search.v.results[0]})).v;assert.equal(c.images.length,1);assert.equal(c.images[0].path,'bg\\shop-2.png');assert.match(c.images[0].work.code,/^bg-/);assert.equal(await(await fetch(ready.url+c.images[0].url.slice(1))).text(),'shop-2.png');
 const random=(await api('api/context',{selection:search.v.results[0],usageId:c.flow.usages[1].id})).v;assert.equal(random.images.length,2);assert.ok(random.images.every(x=>x.random));assert.ok(random.images.every(x=>!x.path.includes('shop-1')));
 const state=await api('api/catalog/state',null,'null');assert.equal(state.r.headers.get('access-control-allow-origin'),'null');assert.equal((await api('api/state',null,'null')).r.status,403);assert.equal((await api('api/catalog/state',null,'https://evil.example')).r.status,403);assert.equal((await fetch(ready.url+'api/catalog/state')).status,403);
 const p='content\\pic\\bg\\shop-2.png';assert.equal((await api('api/catalog/status',{actions:[{path:p,flag:'done',checked:true,expected:false}]},'null')).v.items[p][0],'done');assert.equal((await fetch(ready.url+'api/catalog-asset?t='+token+'&p='+encodeURIComponent('content/pic/../../jack.qsp'))).status,404);
 const page=await(await fetch(ready.url+'catalog?image='+encodeURIComponent(p))).text();assert.match(page,/window.JO9_CATALOG_BRIDGE=/);assert.equal(core.hash(fs.readFileSync(path.join(game,'jack.qsp'))),core.hash(fixture()));
 }finally{child.kill();await new Promise(r=>child.once('exit',r));fs.rmSync(dir,{recursive:true,force:true});}
});
module.exports={fixture,catalogFiles,record};
