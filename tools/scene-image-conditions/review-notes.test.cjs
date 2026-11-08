'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');
const {attachReviewNotes}=require('./review-notes.cjs');
const hash='a'.repeat(64),imgHash='b'.repeat(64),key='content/pic/scene/a.png';
const make=()=>({qspSha256:hash,entries:{[key]:{path:key,status:'unlinked'}}});
const source=()=>({schema:1,qspSha256:hash,entries:[{path:key,action:'reserve_event',label:'예비 컷 보관',
 reason:'현재 표에 없음',nextStep:'대응 페이지를 선택한 뒤 채택',deleteDecision:'현재 유지',imageSha256:imgHash}]});
test('persistent review data attaches to the current catalog and survives fresh metadata generation',()=>{
 const s=source(),first=attachReviewNotes(make(),s,()=>imgHash),second=attachReviewNotes(make(),s,()=>imgHash);
 a.deepEqual(first.entries[key].review,second.entries[key].review);a.equal(first.reviewSummary.total,1);a.equal(first.reviewSummary.stale,0);
});
test('changed QSP or replaced image marks the recommendation for rechecking',()=>{
 const m=make();m.qspSha256='c'.repeat(64);const result=attachReviewNotes(m,source(),()=>hash);
 a.deepEqual(result.entries[key].review.staleReasons,['QSP 변경','이미지 변경']);a.equal(result.reviewSummary.stale,1);
});
test('malformed or duplicate review data is rejected instead of partially attaching',()=>{
 const s=source();s.entries.push({...s.entries[0]});const m=make();a.throws(()=>attachReviewNotes(m,s));a.equal(m.entries[key].review,undefined);
 const bad=source();bad.entries[0].action='delete_now';a.throws(()=>attachReviewNotes(make(),bad));
});
test('a file no longer in the inventory is counted without changing another file',()=>{
 const m=make();m.entries={};const result=attachReviewNotes(m,source());a.equal(result.reviewSummary.missing,1);a.equal(result.reviewSummary.total,0);
});
