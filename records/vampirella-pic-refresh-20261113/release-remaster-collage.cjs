'use strict';
const fs=require('fs'),a=require('assert/strict'),R='G:/somi/JO9sa',D=R+'/records/vampirella-pic-refresh-20261113',p=R+'/records/release-notes-player-20261113/release-categories.cjs';let s=fs.readFileSync(p,'utf8');
a(s.includes("{id:'images',title:'신규 이미지 업데이트'}"));s=s.replace("{id:'images',title:'신규 이미지 업데이트'}","{id:'images',title:'이미지 리마스터'}");const old=s.split('\n').find(l=>l.startsWith(" if(c.id==='images'){"));a(old);const replacement=` if(c.id==='images'){
  html+='<p class="meta">새롭게 단장한 캐릭터들을 한자리에 모았습니다. 초상을 누르면 해당 인물의 변경 내역을 확인할 수 있습니다.</p><div class="gallery" id="portrait-collage" aria-label="이미지 리마스터 캐릭터 모음">';
  const columns=6;
  md+='\\n| '+Array(columns).fill(' ').join(' | ')+' |\\n| '+Array(columns).fill(':---:').join(' | ')+' |\\n';
  for(let i=0;i<portraits.length;i++){
   const p=portraits[i];
   html+='<a class="portrait-card" id="public--'+p.id+'" href="CHANGE_DETAILS_KO.html#'+p.id+'"><img src="'+p.imageData+'" alt="'+esc(p.name)+' 포트레이트" width="96" height="96" loading="lazy"><span class="name">'+esc(p.name)+'</span></a>';
   if(i%columns===0)md+='| ';
   md+='[!['+p.name+'](images/portraits/'+p.imageName+')](CHANGE_DETAILS_KO.html#'+p.id+')<br>**'+p.name+'** | ';
   if(i%columns===columns-1)md+='\\n';
  }
  if(portraits.length%columns)md+=Array(columns-portraits.length%columns).fill(' | ').join('')+'\\n';
  md+='\\n';html+='</div>';
 }`;
s=s.replace(old,replacement);s=s.replace('.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:14px;margin:20px 0 30px}', '.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(116px,1fr));gap:10px;margin:20px 0 30px;padding:16px;background:#f4efe5;border:1px solid var(--line);border-radius:8px}');s=s.replace('.portrait-card{display:flex;flex-direction:column;align-items:center;text-align:center;gap:7px;padding:12px 8px;background:#fffdf8;border:1px solid var(--line);border-radius:4px;text-decoration:none}', '.portrait-card{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:6px 4px;background:transparent;border:1px solid transparent;border-radius:4px;text-decoration:none}');s=s.replace('.portrait-card .name{font-weight:650;font-size:14px;line-height:1.5}', '.portrait-card .name{font-weight:650;font-size:13px;line-height:1.5}');
s=s.replace("a.equal((html.match(/<img\\b/g)||[]).length,portraits.length);", "a.equal((html.match(/<img\\b/g)||[]).length,portraits.length);a.equal((html.match(/id=\"portrait-collage\"/g)||[]).length,1);a.equal((html.match(/class=\"gallery\"/g)||[]).length,1);a.equal((html.match(/class=\"name\"/g)||[]).length,portraits.length);");fs.writeFileSync(p,s);fs.copyFileSync('release-remaster-collage.cjs',D+'/release-remaster-collage.cjs');console.log('One unified remaster gallery; names below images; Markdown six-column table.');
