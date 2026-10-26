const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const out='G:/Codex/tmp/jo9-collar-runtime-20261025/load';
for(const n of ['pending-yes','pending-no','accepted','refunded']){const file=out+'/'+n+'-load.qsp',d=c.parse(fs.readFileSync(file)),l=d.locations.find(l=>l.name==='Start');
 d.lines[l.body]=c.shift("usehtml=1\r\n*p '<h2>금장 목줄 수정 저장 불러오기 테스트</h2><p>Game 메뉴에서 격리된 테스트 세이브를 불러옵니다.</p>'",-5);fs.writeFileSync(file,c.serialize(d));}
fs.writeFileSync(out+'/config.xml','<game width="1280" height="800" title="JO9 collar save-load test" icon="icon.ico"/>\r\n');
console.log('Prepared interactive isolated save-load fixtures');
