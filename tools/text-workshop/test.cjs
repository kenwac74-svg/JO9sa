'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const c=require('./core.cjs');
function fixture(){return Buffer.from(['QSPGAME','header','',c.shift('2',-5),c.shift('first',-5),c.shift('설명 😀',-5),c.shift("! '주석'\n*pl '같은 대사'\n*pl '같은 대사'\n*pl '이름 <<$name>><br>그의 ''말''이다'",-5),c.shift('1',-5),c.shift('image.png',-5),c.shift('행동',-5),c.shift("*pl '행동 코드'",-5),c.shift('second',-5),'',c.shift('*pl "같은 대사"',-5),c.shift('0',-5),''].join('\r\n'),'utf16le');}
test('바이트 왕복, 행동 데이터, 유니코드 보존',()=>{const raw=fixture(),d=c.parse(raw);assert.deepEqual(c.serialize(d),raw);assert.equal(d.locations.length,2);assert.equal(c.entries(d).some(e=>e.text==='주석'),false);assert.equal(c.entries(d).some(e=>e.text==='행동 코드'),false);});
test('반복 원문의 지정된 문자열 하나만 수정 / 따옴표와 줄바꿈',()=>{const d=c.parse(fixture()),e=c.entries(d).filter(e=>e.text==='같은 대사')[1];const p=c.prepare(d,{...e,hash:d.hash},"새 '대사'\n둘째 줄");const values=c.entries(c.parse(p.raw)).map(e=>e.text);assert.equal(values.filter(v=>v==='같은 대사').length,2);assert.ok(values.includes("새 '대사'\n둘째 줄"));assert.equal(c.shift(c.parse(p.raw).lines[8],5),'image.png');});
test('태그/변수 손상과 오래된 선택 거부',()=>{const d=c.parse(fixture()),e=c.entries(d).find(e=>e.text.includes('<<'));assert.throws(()=>c.prepare(d,{...e,hash:d.hash},'태그 삭제'),/변수/);assert.throws(()=>c.prepare(d,{...e,hash:'stale'},e.text+'!'),/변경/);const p=c.prepare(d,{...e,hash:d.hash},"이름 <<$name>><br>그의 '말'을 다듬었다");assert.ok(p.raw);});
test('로컬 서버 반영, 백업, 내보내기, 충돌 거부, 복원',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-text-test-'));const game=path.join(dir,'game'),runtime=path.join(dir,'runtime');fs.mkdirSync(game);const file=path.join(game,'jack.qsp');const original=fixture();fs.writeFileSync(file,original);
 const child=spawn(process.execPath,[path.join(__dirname,'server.cjs'),'--game-dir',game,'--runtime',runtime],{stdio:['ignore','pipe','pipe']});let errors='';child.stderr.on('data',b=>errors+=b);
 try{
  const ready=await new Promise((resolve,reject)=>{let s='';const timeout=setTimeout(()=>reject(Error('시작 시간 초과 '+errors)),10000);child.once('exit',()=>{clearTimeout(timeout);reject(Error(errors));});child.stdout.on('data',b=>{s+=b;if(s.includes('\n')){clearTimeout(timeout);resolve(JSON.parse(s.trim()));}});});
  const html=await(await fetch(ready.url)).text();const token=html.match(/const token='([a-f0-9]+)'/)[1];const base=ready.url.slice(0,-1);
  async function api(p,data){const r=await fetch(base+p,{method:data?'POST':'GET',headers:{'X-JO9-Token':token,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return {status:r.status,value:await r.json()};}
  assert.equal((await fetch(base+'/api/state')).status,403);
  let result=await api('/api/search?q='+encodeURIComponent('같은 대사'));assert.equal(result.value.total,3);
  const selected=result.value.results[1];let preview=await api('/api/preview',{selection:selected,replacement:'검증용 수정문'});assert.equal(preview.status,200);
  const context=await api('/api/context',{selection:selected});assert.equal(context.status,200);assert.equal(context.value.previous.text,'같은 대사');
  const opened=await api('/api/scene',{hash:context.value.hash,destination:{location:'first',sceneId:context.value.scene.id}});assert.equal(opened.status,200);
  assert.equal((await api('/api/scene',{hash:'stale',destination:{location:'first',sceneId:'root'}})).status,400);
  fs.writeFileSync(file,Buffer.concat([original,Buffer.from([0,0])]));let stale=await api('/api/apply',{id:preview.value.id,approved:true});assert.equal(stale.status,400);assert.equal(fs.readdirSync(path.join(runtime,'backups')).length,0);fs.writeFileSync(file,original);
  preview=await api('/api/preview',{selection:selected,replacement:'검증용 수정문'});
  const denied=await api('/api/apply',{id:preview.value.id,approved:false});assert.equal(denied.status,400);
  const applied=await api('/api/apply',{id:preview.value.id,approved:true});assert.equal(applied.status,200);assert.deepEqual(fs.readFileSync(path.join(runtime,'backups',applied.value.id+'.qsp')),original);
  assert.equal(applied.value.selection.text,'검증용 수정문');assert.equal(applied.value.selection.hash,applied.value.after);
  assert.equal(c.entries(c.parse(fs.readFileSync(file))).filter(e=>e.text==='같은 대사').length,2);
  const exported=await api('/api/export?id='+applied.value.id);assert.equal(exported.status,200);assert.equal(exported.value.edits[0].count,1);
  {const ed=exported.value.edits[0],before=c.shift(c.parse(original).lines[ed.location==='first'?6:12],5);assert.ok(ed.old.length<before.length,'전체 필드가 아니라 일부만');assert.equal(before.split(ed.old).length-1,1,'old는 필드에서 한 번만');assert.ok(ed.new.includes('검증용 수정문'));assert.equal(exported.value.target,'game\\jack.qsp');}
  result=await api('/api/search?q='+encodeURIComponent('검증용'));preview=await api('/api/preview',{selection:result.value.results[0],replacement:'둘째 수정'});const next=await api('/api/apply',{id:preview.value.id,approved:true});assert.equal(next.status,200);
  assert.equal((await api('/api/restore',{id:applied.value.id})).status,400);
  assert.equal((await api('/api/restore',{id:next.value.id})).status,200);
  assert.equal((await api('/api/restore',{id:applied.value.id})).status,200);assert.deepEqual(fs.readFileSync(file),original);
 }finally{child.kill();await new Promise(resolve=>child.exitCode!==null?resolve():child.once('exit',resolve));fs.rmSync(dir,{recursive:true,force:true});}
});
test('게임에 보이는 대사와 코드 문자열 구분',()=>{
 const d=e=>c.isDialogue({field:'body',text:e});
 for(const s of ['안녕하세요','<b>이름</b>: <<$name>>님','You don’t own a dog','<font color="red">The Slums are dangerous</font>'])assert.equal(d(s),true,s);
 for(const s of ['slave, assistant','icon tooltip-right','scene\\whore_redlight\\whore_redlight-111','bg.png','$menu',"gs 'x'",'<br>','interaction','<div class="a" tooltip-data="질병"><img src="a.png"></div>','x = 1'])assert.equal(d(s),false,s);
 assert.equal(c.isDialogue({field:'desc',text:'anything'}),true);
});
test('최소 수정 조각은 필드에서 한 번만 나오는 구간까지 넓힌다',()=>{
 const oldF="*pl '같은 대사'\n*pl '같은 대사'\n*pl '끝'",start=oldF.indexOf("같은 대사",8),end=start+5,enc='새 대사';
 const newF=oldF.slice(0,start)+enc+oldF.slice(end);const p=c.minimalEdit(oldF,newF,start,end,start+enc.length);
 assert.equal(oldF.split(p.old).length-1,1);assert.equal(oldF.replace(p.old,p.new),newF);
});