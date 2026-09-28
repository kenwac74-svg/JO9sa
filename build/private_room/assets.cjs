// Deterministic pixel sizing of the user-approved art and a transparent text layer.
// Usage: node assets.cjs <sharp-module-path> <approved-diet-image>
const fs = require('fs');
const path = require('path');
const sharp = require(process.argv[2]);
const repo = path.resolve(__dirname, '../..');
const dest = path.join(repo, 'resources/private_room/content/pic');
const lines = [
 [20,38,21,'#20190e','개인실 주요 변경사항'],
 [20,78,14,'#282016','◆ 메인 UI의 카드·상태 표시 방식 통합'],
 [20,110,14,'#282016','◆ 식사 설정 → 보상 → 씻기 순서로 배치'],
 [20,142,14,'#282016','◆ 질문·칭찬·교육은 원작 기능 연결'],
 [20,174,14,'#282016','◆ 사회화·영향력·처벌·처분은 숨김'],
];
async function main() {
  for (const sub of ['buttons','ui']) fs.mkdirSync(path.join(dest,sub), {recursive:true});
  if (process.argv[3]) await sharp(process.argv[3]).resize(32,32,{kernel:'lanczos3'}).png({compressionLevel:9,adaptiveFiltering:true}).toFile(path.join(dest,'buttons/room_diet.png'));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="426" height="242"><g font-family="Malgun Gothic,맑은 고딕,sans-serif">${lines.map(([x,y,size,color,s]) => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${s}</text>`).join('')}<text x="406" y="219" text-anchor="end" font-size="11" fill="#594329">개인실 추가 기능 개발 중 by SAnk</text></g></svg>`;
  await sharp(Buffer.from(svg)).png({compressionLevel:9,adaptiveFiltering:true}).toFile(path.join(dest,'ui/private_room_notice.png'));
  for (const file of ['buttons/room_diet.png','ui/private_room_notice.png']) {
    const p=path.join(dest,file), m=await sharp(p).metadata();
    console.log(JSON.stringify({file,width:m.width,height:m.height,bytes:fs.statSync(p).size,alpha:m.hasAlpha}));
  }
}
main().catch(e=>{console.error(e);process.exit(1)});
