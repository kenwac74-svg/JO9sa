'use strict';
const fs=require('node:fs'),path=require('node:path');
function invalid(){throw Error('아이콘 파일의 경로·형식·크기를 확인해 주세요.');}
function dimensions(raw,ext){
  let width,height;
  if(ext==='.png'){
    if(raw.length<45||!raw.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||raw.toString('ascii',12,16)!=='IHDR'||raw.readUInt32BE(8)!==13||raw.toString('ascii',raw.length-8,raw.length-4)!=='IEND')invalid();
    let at=8,idat=false;while(at<raw.length){if(at+12>raw.length)invalid();const n=raw.readUInt32BE(at),type=raw.toString('ascii',at+4,at+8);if(n>raw.length-at-12)invalid();if(type==='IDAT')idat=true;at+=12+n;if(type==='IEND'&&at!==raw.length)invalid();}if(!idat||at!==raw.length)invalid();width=raw.readUInt32BE(16);height=raw.readUInt32BE(20);
  }else if(ext==='.gif'){
    if(raw.length<14||!/^GIF8[79]a$/.test(raw.toString('ascii',0,6))||raw[raw.length-1]!==59)invalid();width=raw.readUInt16LE(6);height=raw.readUInt16LE(8);
  }else if(ext==='.jpg'||ext==='.jpeg'){
    if(raw.length<12||raw.readUInt16BE(0)!==0xffd8||raw.readUInt16BE(raw.length-2)!==0xffd9)invalid();let at=2;while(at+4<=raw.length){if(raw[at]!==255)invalid();while(raw[at]===255)at++;const marker=raw[at++];if(marker===0xd9||marker===0xda)break;if(marker===0x01||marker>=0xd0&&marker<=0xd8)continue;const n=raw.readUInt16BE(at);if(n<2||at+n>raw.length)invalid();if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){if(n<8)invalid();height=raw.readUInt16BE(at+3);width=raw.readUInt16BE(at+5);break;}at+=n;}
  }else if(ext==='.webp'){
    if(raw.length<25||raw.toString('ascii',0,4)!=='RIFF'||raw.toString('ascii',8,12)!=='WEBP'||raw.readUInt32LE(4)+8!==raw.length)invalid();const kind=raw.toString('ascii',12,16);if(kind==='VP8X'&&raw.length>=30){width=raw.readUIntLE(24,3)+1;height=raw.readUIntLE(27,3)+1;}else if(kind==='VP8L'&&raw[20]===0x2f){width=1+(raw[21]|(raw[22]&63)<<8);height=1+((raw[22]>>6)|raw[23]<<2|(raw[24]&15)<<10);}else if(kind==='VP8 '&&raw.length>=30&&raw.subarray(23,26).equals(Buffer.from([157,1,42]))){width=raw.readUInt16LE(26)&16383;height=raw.readUInt16LE(28)&16383;}else invalid();
  }else invalid();
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>16384||height>16384)invalid();return{width,height};
}
function readIcon(target,given){
  if(typeof given!=='string')invalid();const rel=given.replaceAll('\\','/');if(!rel.startsWith('content/pic/')||rel.includes('\0')||rel.includes(':')||rel.split('/').some(p=>!p||p==='.'||p==='..'))invalid();
  const root=path.resolve(path.dirname(target.path),'content','pic'),file=path.resolve(path.dirname(target.path),rel),ext=path.extname(file).toLowerCase(),types={'.png':'image/png','.gif':'image/gif','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
  if(!types[ext]||!file.toLowerCase().startsWith(root.toLowerCase()+path.sep)||!fs.existsSync(file))throw Error('아이콘 파일이 없습니다: '+given);
  const st=fs.statSync(file);if(!st.isFile()||st.size>20*1024*1024||!fs.realpathSync(file).toLowerCase().startsWith(fs.realpathSync(root).toLowerCase()+path.sep))invalid();
  const raw=fs.readFileSync(file);return{path:file,raw,type:types[ext],...dimensions(raw,ext)};
}
module.exports={readIcon};
