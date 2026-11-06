'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const candidatePath=process.env.CATALOG_CANDIDATE_PATH||(fs.existsSync(path.join(__dirname,'catalog.cjs'))?path.join(__dirname,'catalog.cjs'):path.resolve(__dirname,'../text-workshop/catalog.cjs'));
const baselineRelative=path.resolve(__dirname,'../../records/girls-checklist-20261104/catalog-before-status-extension.cjs');
const baselinePath=process.env.CATALOG_BASELINE_PATH||(fs.existsSync(baselineRelative)?baselineRelative:'G:/somi/JO9sa/records/girls-checklist-20261104/catalog-before-status-extension.cjs');
const installedRelative=path.resolve(__dirname,'../text-workshop/catalog.cjs');
const installedPath=process.env.CATALOG_SOURCE_PATH||(fs.existsSync(installedRelative)?installedRelative:'G:/somi/JO9sa/tools/text-workshop/catalog.cjs');
const candidate=require(candidatePath);
const baseline=require(baselinePath);
const expectedBaselineSha='7de1deba590b5f16b2f92c76cd9507a463e2eddf13a6ec8c6b062e59214a808e';
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const initialInstalledSha=sha(fs.readFileSync(installedPath));
const canonical=p=>candidate.normalize('content/pic/'+p);
const image=(p,flag,checked=true,expected=!checked)=>({path:p,flag,checked,expected});
const character=(id,flag,checked=true,expected=!checked)=>({characterId:id,flag,checked,expected});
const parent=canonical('girls/full/0001_base.png'),child=canonical('girls/full/0001_base (2).png'),manual=canonical('girls/full/0001_base (3).png');
const orphan=canonical('girls/full/cloth/missing_user_tag.png');
const records=[[parent],[child,0,0,0,0,0,0,parent],[manual,0,0,0,0,0,0,parent],['content\\pic\\bg\\unchanged.jpg']];
const manifest={characters:[{id:1,refs:{full:'girls/full/0001_base.png'},assets:[parent]},{id:2,refs:{full:'girls/full/0001_base.png'},assets:[parent]},{id:3,refs:{full:'characters/other.png'},assets:[]}],files:['girls/sex_scenes/1/1_bath_1.png']};
const manifestText=JSON.stringify(manifest);
const initialState={savedAt:100,items:{[parent]:['wip'],[manual]:['done'],[orphan]:['todo','spare']},characterItems:{'3':['ore']},customMetadata:{preserve:'사용자 메모'}};
const report={baselinePath,baselineSha:sha(fs.readFileSync(baselinePath)),sourcePath:installedPath,sourceSha:initialInstalledSha,installedPath,installedSha:initialInstalledSha,candidatePath,candidateSha:sha(fs.readFileSync(candidatePath)),checks:[],writes:[],pngOrQspWrites:[],fixtureCleanup:false};
function fixture(label,embedded=true){
  const root=fs.mkdtempSync(path.join(__dirname,'isolated-'+label+'-'));
  const html='<!doctype html><script>var D='+JSON.stringify(records)+';\nvar MR=[];</script>'+(embedded?'\n<script>window.JO9_GIRLS_CHECKLIST='+manifestText+';</script>':'');
  fs.writeFileSync(path.join(root,'catalog_merge_vs_original.html'),html);
  fs.writeFileSync(path.join(root,'catalog_status.js'),'window.CATALOG_STATUS='+JSON.stringify(initialState)+';\n');
  fs.mkdirSync(path.join(root,'game','content','pic','girls','full'),{recursive:true});
  fs.writeFileSync(path.join(root,'game','jack.qsp'),'DO NOT CHANGE QSP');
  fs.writeFileSync(path.join(root,'game','content','pic','girls','full','0001_base.png'),'DO NOT CHANGE PNG');
  return root;
}
function fingerprints(root){const result={};function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else result[path.relative(root,file).replace(/\\/g,'/')]=sha(fs.readFileSync(file));}}walk(root);return result;}
test('캐릭터 ID별 독립 상태와 기존 파일 상태 저장 회귀 검증',async t=>{
  assert.equal(report.baselineSha,expectedBaselineSha);
  const root=fixture('characters'),oldRoot=fixture('baseline',false),newRoot=fixture('compat',false);
  const initial=fingerprints(root),oldFiles=fingerprints(oldRoot),newFiles=fingerprints(newRoot);
  const write=fs.writeFileSync,rename=fs.renameSync,parse=JSON.parse;let parses=0;
  fs.writeFileSync=function(file,...args){report.writes.push(String(file));return write.call(this,file,...args);};
  fs.renameSync=function(from,to,...args){report.writes.push(String(to));return rename.call(this,from,to,...args);};
  JSON.parse=function(text,...args){if(text===manifestText)parses++;return parse.call(this,text,...args);};
  try{
    const c=candidate.create(root);assert.equal(c.load(),true);const originalCodes=c.snapshot().codes;
    await t.test('공유 이미지를 쓰는 ID도 별개 8태그·그림 상태 보존',()=>{
      const actions=candidate.FLAGS.map(flag=>character(1,flag));actions.push(character(2,'wip'));
      const result=c.update(actions);assert.deepEqual(result.characterItems['1'],candidate.FLAGS);assert.deepEqual(result.characterItems['2'],['wip']);assert.deepEqual(result.characterItems['3'],['ore']);
      assert.deepEqual(result.items,initialState.items);assert.deepEqual(result.autoDone,{});assert.deepEqual(result.codes,originalCodes);assert.deepEqual(result.customMetadata,initialState.customMetadata);
      assert.equal(c.meta(parent).flags.includes('done'),false);assert.equal(result.items[child],undefined);
      report.checks.push('All 8 flags independent by character ID; shared images and other IDs unaffected; all existing image flags preserved');
    });
    await t.test('캐릭터 태그 저장·해제·빈 ID 정리·새 인스턴스 재로드',()=>{
      let result=candidate.create(root).snapshot();assert.deepEqual(result.characterItems['1'],candidate.FLAGS);
      result=c.update(candidate.FLAGS.map(flag=>character(1,flag,false,true)));assert.equal(result.characterItems['1'],undefined);
      const reload=candidate.create(root).snapshot();assert.deepEqual(reload.characterItems,{'2':['wip'],'3':['ore']});assert.deepEqual(reload.items,initialState.items);
      report.checks.push('Character flags save/unset/reload; empty ID removed; other IDs and pre-existing orphan image tags retained');
    });
    await t.test('미등록·비정수 ID와 모호한 입력 거절·혼합 배치 원자성',()=>{
      const rejected=[999,-1,1.5,'1',null,undefined,{},[],NaN,Number.MAX_SAFE_INTEGER+1];
      const status=path.join(root,'catalog_status.js'),before=fs.readFileSync(status);
      for(const id of rejected)assert.throws(()=>c.update([character(id,'done')]),/캐릭터 ID/);
      assert.throws(()=>c.update([{...character(1,'done'),path:parent}]),/캐릭터 ID/);
      assert.throws(()=>c.update([character(1,'invalid')]),/카탈로그 항목/);
      assert.throws(()=>c.update([image(parent,'done'),character(2,'todo'),character(999,'done')]),/캐릭터 ID/);
      assert.throws(()=>c.update([character(1,'done'),image(orphan,'done')]),/카탈로그 항목/,'D 미등록 이미지의 쓰기 허용 확장은 없어야 합니다.');
      assert.throws(()=>c.update([image('girls/sex_scenes/1/1_bath.png','todo')]),/카탈로그 항목/);
      assert.throws(()=>c.update([image('content/pic/girls/../full/0001_base.png','todo')]),/카탈로그 항목/);
      assert.ok(before.equals(fs.readFileSync(status)));
      report.checks.push('Unregistered/non-integer IDs and characterId+path rejected; invalid mixed batches leave status bytes unchanged; per-file manifest extension removed');
    });
    await t.test('유효 혼합 배치와 기존 D 하위 자동 완료·수동 완료 보존',()=>{
      let result=c.update([image(parent,'done'),character(2,'todo')]);
      assert.deepEqual(result.items[parent],['done','wip']);assert.deepEqual(result.items[child],['done']);assert.equal(result.autoDone[child],parent);
      assert.deepEqual(result.items[manual],['done']);assert.equal(result.autoDone[manual],undefined);assert.deepEqual(result.characterItems['2'],['wip','todo']);
      result=c.update([image(parent,'done',false,true),character(1,'done')]);
      assert.deepEqual(result.items[parent],['wip']);assert.equal(result.items[child],undefined);assert.deepEqual(result.items[manual],['done']);assert.deepEqual(result.items[orphan],['todo','spare']);
      assert.deepEqual(result.characterItems['1'],['done']);assert.deepEqual(result.characterItems['2'],['wip','todo']);assert.equal(result.autoDone['1'],undefined);
      report.checks.push('Valid mixed batch saves both collections; D done-child add/remove unchanged and character done never propagates');
    });
    await t.test('manifest는 로드당 1회·기존 원본 API·이미지 동작 동일',()=>{
      assert.equal(parses,3,'기존 인스턴스는 반복 update마다 manifest를 다시 분석하면 안 됩니다.');
      const a=baseline.create(oldRoot),b=candidate.create(newRoot);
      for(const actions of [[image(parent,'done')],[image(parent,'done',false,true)],[image('content/pic/bg/unchanged.jpg','branch')],[image(child,'wip')]]){
        const x=a.update(actions),y=b.update(actions);delete x.savedAt;delete y.savedAt;assert.deepEqual(y,x);
      }
      assert.deepEqual(a.meta(parent).flags,b.meta(parent).flags);assert.deepEqual(a.snapshot().codes,b.snapshot().codes);assert.deepEqual(Object.keys(candidate).sort(),Object.keys(baseline).sort());
      assert.throws(()=>b.update([character(1,'done')]),/캐릭터 ID/,'manifest가 없으면 신규 캐릭터 상태는 허용하지 않습니다.');
      report.checks.push('Manifest ID set parsed once per load; unchanged create/export/meta/snapshot API and exact baseline image state behavior');
    });
    await t.test('HTML·D·QSP·PNG·실제 소스 무변경 및 기존 상태 백업',()=>{
      for(const [base,before] of [[root,initial],[oldRoot,oldFiles],[newRoot,newFiles]]){
        const after=fingerprints(base);
        for(const [file,hash] of Object.entries(before)){if(file==='catalog_status.js')continue;assert.equal(after[file],hash,file+'가 변경되었습니다.');}
        for(const file of Object.keys(after))assert.ok(file in before||file==='catalog_work_ids.json'||file.startsWith('image_work/status_backups/'),'예상 밖 생성: '+file);
      }
      const backups=fs.readdirSync(path.join(root,'image_work','status_backups'));assert.ok(backups.length>0);
      assert.ok(backups.some(file=>candidate.parseStatus(fs.readFileSync(path.join(root,'image_work','status_backups',file),'utf8')).savedAt===initialState.savedAt));
      report.pngOrQspWrites=report.writes.filter(p=>/\.(?:png|qsp)(?:\.|$)/i.test(p));assert.deepEqual(report.pngOrQspWrites,[]);assert.ok(report.writes.every(p=>[root,oldRoot,newRoot].some(base=>p.startsWith(base+path.sep))));
      assert.equal(sha(fs.readFileSync(baselinePath)),expectedBaselineSha);assert.equal(sha(fs.readFileSync(installedPath)),initialInstalledSha);
      report.checks.push('PNG/QSP writes=0; HTML/D and actual source unchanged; prior status backup preserved');
    });
  }finally{
    fs.writeFileSync=write;fs.renameSync=rename;JSON.parse=parse;
    for(const dir of [root,oldRoot,newRoot]){const resolved=fs.realpathSync(dir);assert.equal(path.dirname(resolved),fs.realpathSync(__dirname));assert.ok(path.basename(resolved).startsWith('isolated-'));fs.rmSync(resolved,{recursive:true,force:true});}
    report.fixtureCleanup=true;report.writeCount=report.writes.length;delete report.writes;fs.writeFileSync(path.join(__dirname,'test-report.json'),JSON.stringify(report,null,2)+'\n');
  }
});
