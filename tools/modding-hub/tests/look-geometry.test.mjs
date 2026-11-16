import test from 'node:test';
import assert from 'node:assert/strict';
import {FACE_RATIO,clampFaceBox,faceHandleAt,resizeFaceBox,bottomState} from '../overrides/studio-look-geometry.mjs';

test('all four handles resize in both directions while keeping the opposite corner and ratio',()=>{
 const original=[160,110,151], h=Math.round(151*FACE_RATIO);
 for(const corner of ['nw','ne','se','sw']) for(const amount of [-45,70]){
  const sx=corner.endsWith('e')?1:-1,sy=corner.startsWith('s')?1:-1;
  const box=resizeFaceBox(original,corner,sx*amount,sy*amount);
  assert.equal(box[2],151+amount);
  assert.equal(sx>0?box[0]:box[0]+box[2],sx>0?160:311);
  assert.equal(sy>0?box[1]:box[1]+Math.round(box[2]*FACE_RATIO),sy>0?110:110+h);
 }
});
test('face resize stays inside the canvas and handles remain usable at small display scales',()=>{
 for(const corner of ['nw','ne','se','sw']){
  const b=resizeFaceBox([300,200,151],corner,corner.endsWith('e')?5000:-5000,corner.startsWith('s')?5000:-5000);
  assert(b[0]>=0&&b[1]>=0&&b[0]+b[2]<=795&&b[1]+Math.round(b[2]*FACE_RATIO)<=596);
 }
 assert.deepEqual(clampFaceBox([-10,800,900]),[0,1,599]);
 assert.equal(faceHandleAt([100,100,151],247,246,18),'se');
 assert.equal(faceHandleAt([100,100,151],175,175,10),null);
});
test('bottom feedback distinguishes transparent margin, exact fit, overflow and absent content',()=>{
 const bounds={y:20,h:460};
 assert.equal(bottomState({s:1,x:0,y:116},bounds).kind,'aligned');
 assert.equal(bottomState({s:1,x:0,y:110},bounds).kind,'gap');
 assert.equal(bottomState({s:1,x:0,y:120},bounds).kind,'overflow');
 assert.equal(bottomState({s:2,x:0,y:-364},bounds).kind,'aligned');
 assert.equal(bottomState({s:1,x:0,y:115.6},bounds).kind,'aligned');
 assert.equal(bottomState({s:1,x:0,y:0},null).kind,'empty');
});
