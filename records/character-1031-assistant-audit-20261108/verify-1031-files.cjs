const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const work='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/scene-1031-audit-20261108',json=JSON.parse(fs.readFileSync(work+'/json/slaves/1031.json','utf8'));
const refs=Object.entries(json).filter(([k,v])=>typeof v==='string'&&v&&(k.startsWith('indpack_')||['fullimage','fullmade','fullsecretary','fullmistress'].includes(k))).map(([k,v])=>({key:k,file:work+'/content/pic/'+v+'.png'}));
const scenes=fs.readdirSync(work+'/content/pic/girls/sex_scenes/1031').map(n=>({key:n,file:work+'/content/pic/girls/sex_scenes/1031/'+n}));
const table=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let b=0;b<8;b++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
const crc=buf=>{let c=0xffffffff;for(const b of buf)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
const failures=[],sizes={};
for(const ref of [...refs,...scenes])try{
 const b=fs.readFileSync(ref.file);if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('PNG signature');let at=8,end=false,data=[],width=0,height=0;
 while(at+12<=b.length){const n=b.readUInt32BE(at),tag=b.toString('ascii',at+4,at+8),next=at+12+n;if(next>b.length)throw Error('truncated chunk');if(crc(b.subarray(at+4,at+8+n))!==b.readUInt32BE(at+8+n))throw Error('CRC '+tag);if(tag==='IHDR'){width=b.readUInt32BE(at+8);height=b.readUInt32BE(at+12);}if(tag==='IDAT')data.push(b.subarray(at+8,at+8+n));if(tag==='IEND'){end=true;break;}at=next;}
 if(!end||!width||!height||!data.length)throw Error('incomplete PNG');if(!zlib.inflateSync(Buffer.concat(data)).length)throw Error('empty pixels');sizes[width+'x'+height]=(sizes[width+'x'+height]||0)+1;
 }catch(e){failures.push({key:ref.key,error:e.message});}
const result={wardrobeReferences:refs.length,sceneFiles:scenes.length,validated:refs.length+scenes.length-failures.length,failures,sizes};fs.writeFileSync(tmp+'/file-integrity.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
