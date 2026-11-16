'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {inspectPortraitFrame, composePortraitFrame} = require('./portrait-frame.cjs');

const python = [process.env.JO9_PYTHON, process.env.PYTHON,
  path.join(process.env.LOCALAPPDATA || '', 'Programs/Python/Python314/python.exe'),
  path.join(require('node:os').homedir(),'AppData/Local/Programs/Python/Python314/python.exe'),
  'python3', 'python'].find(exe => {
  if (!exe) return false;
  const r = cp.spawnSync(exe, ['-c', 'from PIL import Image; print("ok")'], {encoding:'utf8',windowsHide:true,timeout:10000});
  return r.status === 0 && r.stdout.trim() === 'ok';
});
assert(python, 'A Python interpreter with Pillow is required');
function fixture(width = 150, height = 150) {
  const code = String.raw`
from PIL import Image
import io,base64,json,sys
w,h=map(int,sys.argv[1:])
source=Image.new('RGBA',(w,h));p=source.load()
for y in range(h):
 for x in range(w): p[x,y]=((x*17+y*3)%256,(x*7+y*19)%256,(x*11+y*13)%256,255)
frame=Image.new('RGBA',(150,150),(17,23,31,255));p=frame.load()
for y in range(150):
 for x in range(150):
  if x<5 or y<5 or x>=145 or y>=145: p[x,y]=(190+(x+y)%25,140+(x*3+y)%30,30+(x+y*2)%20,255)
def png(im):
 b=io.BytesIO();im.save(b,format='PNG');return base64.b64encode(b.getvalue()).decode()
print(json.dumps({'source':png(source),'frame':png(frame)}))`;
  const r=cp.spawnSync(python,['-c',code,String(width),String(height)],{encoding:'utf8',windowsHide:true,timeout:10000,maxBuffer:2*1024*1024});
  assert.equal(r.status,0,r.stderr);
  const data=JSON.parse(r.stdout);
  return {source:Buffer.from(data.source,'base64'),frame:Buffer.from(data.frame,'base64')};
}
function pixelProof(before, after, frame) {
  const script=String.raw`
from PIL import Image
import base64,io,json,sys
d=json.load(sys.stdin)
images=[Image.open(io.BytesIO(base64.b64decode(d[k]))).convert('RGBA') for k in ['before','after','frame']]
a,b,f=images
if f.size!=a.size: f=f.resize(a.size,Image.Resampling.LANCZOS)
w,h=a.size
center=all(a.getpixel((x,y))==b.getpixel((x,y)) for y in range(5,h-5) for x in range(5,w-5))
ring=all(b.getpixel((x,y))==f.getpixel((x,y)) for y in range(h) for x in range(w) if x<5 or x>=w-5 or y<5 or y>=h-5)
print(json.dumps({'center':center,'ring':ring,'size':list(b.size)}))`;
  const r=cp.spawnSync(python,['-c',script],{encoding:'utf8',windowsHide:true,timeout:10000,input:JSON.stringify({before:before.toString('base64'),after:after.toString('base64'),frame:frame.toString('base64')})});
  assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);
}

for (const width of [150,151]) test(`frame copies only outer 5px and preserves the ${width}x150 center`,()=>{
  const f=fixture(width),result=composePortraitFrame({pngBytes:f.source,frameBytes:f.frame,pythonExecutable:python});
  assert.equal(result.changed,true);assert.equal(result.centerPixelsPreserved,true);
  assert.deepEqual(pixelProof(f.source,result.pngBytes,f.frame),{center:true,ring:true,size:[width,150]});
  assert.deepEqual(f.source,fixture(width).source,'Input bytes must not be mutated');
});

test('second application is byte-identical and reports the existing frame',()=>{
  const f=fixture(),first=composePortraitFrame({pngBytes:f.source,frameBytes:f.frame,pythonExecutable:python});
  const second=composePortraitFrame({pngBytes:first.pngBytes,frameBytes:f.frame,pythonExecutable:python});
  assert.equal(second.status,'framed');assert.equal(second.changed,false);assert.deepEqual(second.pngBytes,first.pngBytes);
});

test('a different known frame is preserved instead of being replaced',()=>{
  const f=fixture(),first=composePortraitFrame({pngBytes:f.source,frameBytes:f.frame,pythonExecutable:python});
  const other=fixture(151).source;
  const result=composePortraitFrame({pngBytes:first.pngBytes,frameBytes:other,referenceFrames:[{name:'existing-special',bytes:f.frame}],pythonExecutable:python});
  assert.equal(result.status,'framed');assert.equal(result.matchName,'existing-special');assert.equal(result.changed,false);
  assert.deepEqual(result.pngBytes,first.pngBytes);
});

test('unknown opaque edges remain uncertain for user preview',()=>{
  const f=fixture(),result=inspectPortraitFrame({pngBytes:f.source,referenceFrames:[{name:'game',bytes:f.frame}],pythonExecutable:python});
  assert.equal(result.status,'uncertain');assert.equal(result.width,150);assert.equal(result.height,150);
});

test('Windows Python discovery tolerates redirected LOCALAPPDATA', {skip:process.platform!=='win32'},()=>{
  const f=fixture();
  const script=`const fs=require('fs');const frame=require(${JSON.stringify(path.join(__dirname,'portrait-frame.cjs'))});const r=frame.inspectPortraitFrame({pngBytes:fs.readFileSync(0)});console.log(r.status);`;
  const r=cp.spawnSync(process.execPath,['-e',script],{input:f.source,encoding:'utf8',windowsHide:true,timeout:15000,
    env:{...process.env,JO9_PYTHON:'',PYTHON:'',LOCALAPPDATA:path.join(require('node:os').tmpdir(),'jo9-no-python-install-here'),PATH:''}});
  assert.equal(r.status,0,r.stderr);assert.equal(r.stdout.trim(),'uncertain');
});

test('corrupt PNG and unsupported portrait dimensions are rejected',()=>{
  assert.throws(()=>inspectPortraitFrame({pngBytes:Buffer.from('not png'),pythonExecutable:python}),{code:'PORTRAIT_PNG_INVALID'});
  const f=fixture(160,150);
  assert.throws(()=>composePortraitFrame({pngBytes:f.source,frameBytes:f.frame,pythonExecutable:python}),{code:'PORTRAIT_DIMENSIONS'});
});

test('helper does not change caller files',()=>{
  const base=process.env.JO9_FRAME_TEST_TMP||require('node:os').tmpdir();
  const f=fixture(),dir=fs.mkdtempSync(path.join(base,'jo9-frame-readonly-'));
  const file=path.join(dir,'portrait.png');fs.writeFileSync(file,f.source);
  try { composePortraitFrame({pngBytes:fs.readFileSync(file),frameBytes:f.frame,pythonExecutable:python});assert.deepEqual(fs.readFileSync(file),f.source);assert.deepEqual(fs.readdirSync(dir),['portrait.png']); }
  finally { fs.unlinkSync(file);fs.rmdirSync(dir); }
});
