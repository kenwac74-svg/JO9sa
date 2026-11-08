'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('./staged/audio-library.cjs');
test('explicit sound decisions update only their roles and retain unrelated user work',()=>{
 assert.equal(typeof A.applyDecisions,'function','approval merge is missing');
 const file=A.describeFile({name:'gsid.mp3',relativePath:'gsid.mp3',size:123,lastModified:7});
 const saved={version:1,files:[],assignments:{},reviews:{'monster:garsid:a':'hold',other:'remake'}};
 const decision={id:'new-two',files:[file],assignments:{'monster:garsid:a':file.id},reviews:{'monster:garsid:a':'adopted',hammer:'adopted'}};
 const r=A.applyDecisions(saved,[decision],[]);
 assert.equal(r.state.reviews['monster:garsid:a'],'adopted');assert.equal(r.state.reviews.hammer,'adopted');assert.equal(r.state.reviews.other,'remake');
 assert.equal(r.state.assignments['monster:garsid:a'],file.id);assert.deepEqual(r.appliedIds,['new-two']);assert.equal(saved.reviews['monster:garsid:a'],'hold');
});
test('a later manual review survives reload after a decision has been applied once',()=>{
 assert.equal(typeof A.applyDecisions,'function','approval merge is missing');
 const saved={version:1,files:[],assignments:{},reviews:{hammer:'hold',other:'adopted'}};
 const r=A.applyDecisions(saved,[{id:'done',reviews:{hammer:'adopted'}}],['done']);
 assert.deepEqual(r.state.reviews,saved.reviews);assert.deepEqual(r.appliedIds,['done']);
});
