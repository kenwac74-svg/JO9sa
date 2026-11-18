import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const moduleUrl = new URL('../overrides/background-metadata.mjs', import.meta.url);
async function module() {
 assert(fs.existsSync(moduleUrl), 'canonical background UI helpers are missing');
 return import(moduleUrl);
}

test('canonical read prefers explicit empty slots while retaining group metadata', async () => {
 const {pickerBackground, needsBackgroundApply} = await module();
 const legacy = {world: 'industrial', worldGroup: 'old-group', family: 'clerk', occupation: 'maid'};
 const data = {seed_background_fixed: 1, seed_world: 'modern', seed_family: '', seed_occupation: ''};
 assert.deepEqual(pickerBackground(data, legacy), {world: 'modern', worldGroup: 'old-group'});
 assert.deepEqual(legacy, {world: 'industrial', worldGroup: 'old-group', family: 'clerk', occupation: 'maid'});
 assert.equal(needsBackgroundApply(data, legacy), false);
 assert.equal(needsBackgroundApply({}, legacy), true);
 assert.equal(needsBackgroundApply({}, {worldGroup: 'g'}), false);
 assert.deepEqual(pickerBackground({}, legacy), legacy);
});

test('queued saves run sequentially and a rejected request does not discard the next one', async () => {
 const {serialSaves} = await module();
 const enqueue = serialSaves(), calls = [];
 let release;
 const blocked = new Promise(resolve => { release = resolve; });
 const first = enqueue(async () => { calls.push('first-start'); await blocked; calls.push('first-end'); return 1; });
 const second = enqueue(async () => { calls.push('second'); return 2; });
 await Promise.resolve(); await Promise.resolve();
 assert.deepEqual(calls, ['first-start']);
 release();
 assert.deepEqual(await Promise.all([first, second]), [1, 2]);
 assert.deepEqual(calls, ['first-start', 'first-end', 'second']);
 await assert.rejects(enqueue(async () => { throw Error('stale'); }), /stale/);
 assert.equal(await enqueue(async () => 3), 3);
});

test('real picker autosaves keep the latest selection, dirty stats, and unsaved dialogue', async () => {
 const {serialSaves} = await module();
 const source = fs.readFileSync(new URL('../overrides/studio-view.mjs', import.meta.url), 'utf8');
 const saveTalk = source.slice(source.indexOf(' async function saveTalk('), source.indexOf(' // 편집 중인 캐릭터를 시뮬레이터'));
 const requests = [], releases = [];
 const st = {sel:3100, ch:{id:3100, revision:'r0', data:{seed_stamina:9}}, edits:{set:{seed_stamina:8}},
  talk:{book:{background:{world:'industrial'},lines:{hello:'Saved'}}},
  book:{background:{world:'modern'},lines:{hello:'Unsaved draft'},notes:'Manual draft'},
  bgVersion:1, bgUnsaved:true, bookDirty:true, talkPending:0};
 const context = vm.createContext({st, structuredClone, queueTalk:serialSaves(), isMaster:false, render:()=>{}, api:{toast:()=>{}},
  call:async (_url, body) => { requests.push(structuredClone(body)); await new Promise(resolve => releases.push(resolve));
   return {book:{...body.book,lines:{hello:'Saved'}},path:'sidecar',revision:'r'+requests.length,
    character:{id:3100,revision:'r'+requests.length,data:{seed_stamina:9,seed_world:body.book.background.world}}}; }});
 vm.runInContext(saveTalk+';this.saveTalk=saveTalk',context);
 const first=context.saveTalk(true);
 await Promise.resolve(); await Promise.resolve();
 st.book.background={world:'space'};st.bgVersion=2;
 const second=context.saveTalk(true);
 releases.shift()();
 await first;
 assert.deepEqual(st.book.background,{world:'space'});
 assert.deepEqual(st.edits.set,{seed_stamina:8});
 await Promise.resolve(); await Promise.resolve();
 assert.equal(requests.length,2);
 assert.equal(requests[1].revision,'r1');
 assert.equal(requests[1].book.background.world,'space');
 releases.shift()();
 await second;
 assert.equal(st.book.background.world,'space');
 assert.equal(st.book.lines.hello,'Unsaved draft');
 assert.equal(st.book.notes,'Manual draft');
 assert.equal(st.bookDirty,true);
 assert.equal(st.bgUnsaved,false);
});

test('saving canonical seed fields refreshes picker and simulator selection', async () => {
 const {serialSaves, pickerBackground} = await module();
 const source = fs.readFileSync(new URL('../overrides/studio-view.mjs', import.meta.url), 'utf8');
 const saveNow = source.slice(source.indexOf(' async function saveNow('), source.indexOf(' // ---------------------------------------------------------------- 그리기'));
 const st = {sel:3100,ch:{data:{seed_background_fixed:1,seed_world:'industrial'}},
  edits:{set:{seed_world:'modern'},unset:new Set(),story:{},master:null,initials:{}},
  book:{background:{world:'industrial'}},items:[]};
 let sent;
 const context=vm.createContext({st,queueTalk:serialSaves(),pickerBackground,root:{querySelector:()=>null},
  simulationPatch:()=>({}),call:async()=>({character:{data:{seed_background_fixed:1,seed_world:'modern'}},changes:[],saved:true}),
  blank:()=>({}),sendToSim:()=>{sent=st.book.background.world},api:{toast:()=>{}},isMaster:false,render:()=>{}});
 vm.runInContext(saveNow+';this.saveNow=saveNow',context);
 await context.saveNow();
 assert.equal(st.book.background.world,'modern');
 assert.equal(sent,'modern');
});

test('simulator JSON import prefers canonical IDs and keeps unique lore and values', () => {
 const source=fs.readFileSync(new URL('../overrides/character-view.mjs',import.meta.url),'utf8');
 const fromJson=source.slice(source.indexOf(' function fromJson('),source.indexOf(' function randomCharacter('));
 const context=vm.createContext({blank:()=>({world:'',family:'',occupation:''}),KINDS:[['world'],['family'],['occupation']]});
 vm.runInContext(fromJson+';this.fromJson=fromJson',context);
 const actor=context.fromJson({seed_name:'Unique',seed_world:'earth_rome',seed_family:'',seed_occupation:'courtesan',
  seed_background_fixed:1,jo9_world:'industrial',jo9_family:'clerk',seed_stamina:9,seed_world_description:'Manual lore'},'3100_unique.json');
 assert.equal(actor.world,'earth_rome');assert.equal(actor.family,'');assert.equal(actor.occupation,'courtesan');
 assert.equal(actor.stamina,9);assert.equal(actor.unique.texts.world,'Manual lore');
});
