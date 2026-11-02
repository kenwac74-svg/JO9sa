const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib'),assert=require('assert/strict');
const R='G:/somi/JO9sa/records/isabella-tavern-adoption-20261101';
const W='G:/somi/Jack O Nine Tails v2.4_work/game';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const record=JSON.parse(fs.readFileSync(R+'/asset-change.json','utf8'));
const image=fs.readFileSync(record.target);
assert.equal(sha(image),record.after.sha256);
assert.equal(image.readUInt32BE(16),795);assert.equal(image.readUInt32BE(20),596);assert.equal(image[25],2);
const parse=s=>JSON.parse(s.match(/(?:var|const|let) D\s*=\s*(\[.*?\]);(?:\r?\n|\s*(?:var|const|let) )/s)[1]);
const rows=[];
for(let i=0;i<record.catalogs.length;i++){
 const c=record.catalogs[i],before=parse(zlib.gunzipSync(fs.readFileSync(record.backup+`/catalog-${i}.html.gz`)).toString('utf8')),after=parse(fs.readFileSync(c.path,'utf8'));
 assert.equal(before.length,after.length);
 const changed=before.flatMap((row,j)=>JSON.stringify(row)!==JSON.stringify(after[j])?[j]:[]);assert.equal(changed.length,1);
 assert.deepEqual(after[changed[0]],c.rowAfter);rows.push(after.length);
}
for(const [p,h]of Object.entries(record.protectedUnchanged))assert.equal(sha(fs.readFileSync(p)),h);
async function readback(){
 const response=await fetch('http://127.0.0.1:3813/catalog?v=isabella_tavern_20261101',{signal:AbortSignal.timeout(20000)});assert.equal(response.status,200);
 const served=parse(await response.text()),target=served.filter(x=>x[0].replaceAll('\\','/')==='content/pic/bg/isabella_meeting.png');
 assert.deepEqual(target,[record.catalogs[0].rowAfter]);
 return{status:'PASS',http:response.status,rows:served.length,rowMatchesWork:true};
}
(async()=>{
 const http=await readback();
 const final={status:'PASS',image:{bytes:image.length,sha256:sha(image),width:795,height:596,opaque:true},catalogRowsPreserved:rows,protectedFilesUnchanged:Object.keys(record.protectedUnchanged).length,http,gameplay:'Not replayed'};
 fs.writeFileSync(R+'/final-verification.json',JSON.stringify(final,null,2)+'\n');
 const src=fs.readFileSync(path.join(__dirname,'apply.py'),'utf8').replace('BASE = Path(__file__).resolve().parents[2]',"BASE = Path('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7')");
 fs.writeFileSync(R+'/apply.py',src);fs.copyFileSync(__filename,R+'/finalize.cjs');
 fs.appendFileSync(R+'/REPORT_KO.md','\n최종 재검증: 목록 HTTP 200과 새 bg-0609 행을 확인했다. 최초 연결 중단 기록은 보존하고 final-verification.json에 재확인 결과를 분리했다. WORK에서 수동으로 추가된 2행을 포함한 41,330행과 seed 41,328행의 각 기존 행 수를 그대로 보존했으며 각각 목표 한 행만 변경했다.\n');
 console.log(JSON.stringify(final));
})().catch(e=>{console.error(e);process.exitCode=1});
