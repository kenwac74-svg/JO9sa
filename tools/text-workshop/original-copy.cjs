'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function copyOriginal(source,game,catalogRoot,replaceHash){
  const content=path.join(game,'content'),folder=path.join(content,'modworkpic');
  const realGame=fs.realpathSync(game),realContent=fs.realpathSync(content);
  if(!realContent.startsWith(realGame+path.sep))throw Error('게임 content 경로를 확인하세요.');
  fs.mkdirSync(folder,{recursive:true});
  if(fs.lstatSync(folder).isSymbolicLink()||!fs.realpathSync(folder).startsWith(realContent+path.sep))throw Error('작업폴더 연결 경로는 사용할 수 없습니다.');
  const name=path.basename(source),destination=path.join(folder,name),data=fs.readFileSync(source);
  if(fs.existsSync(destination)){
    if(fs.lstatSync(destination).isSymbolicLink()||!fs.statSync(destination).isFile())throw Error('대상 파일 경로를 확인하세요.');
    const previous=fs.readFileSync(destination),previousHash=hash(previous);
    if(previous.equals(data))return{ok:true,unchanged:true,name,destination};
    if(!replaceHash)return{conflict:true,name,hash:previousHash};
    if(replaceHash!==previousHash)throw Error('확인 중 대상 파일이 변경됐습니다. 다시 복사하세요.');
    const backups=path.join(catalogRoot,'image_work','backups','original_copy');
    fs.mkdirSync(backups,{recursive:true});
    fs.writeFileSync(path.join(backups,Date.now()+'_'+crypto.randomBytes(4).toString('hex')+'_'+name),previous,{flag:'wx'});
    fs.writeFileSync(destination,data);
  }else fs.writeFileSync(destination,data,{flag:'wx'});
  if(!fs.readFileSync(destination).equals(data))throw Error('복사 결과가 원본과 다릅니다.');
  return{ok:true,name,destination};
}
module.exports={copyOriginal};
