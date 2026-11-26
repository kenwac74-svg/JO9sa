const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('dist/private-room-work/preview');
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});const p=await b.newPage({viewport:{width:1280,height:800}});await p.goto(pathToFileURL(path.join(out,'private-room.html')).href);
await p.evaluate(()=>{
 const file=s=>'file:///G:/somi/JO9/game/content/pic/'+s;
 document.querySelectorAll('#snk_room_menu li.snk_disabled,#snk_room_quick .snk_disabled').forEach(e=>e.remove());
 document.querySelector('#snk_room_character img').src=file('characters/kikuchiyo.png');
 document.querySelector('#slave_short_ava img').src=file('girls/face/kikuchiyo.png');
 document.querySelector('#snk_room_slave_name').textContent='노예 : 키쿠치요';
 const lower=document.createElement('div');lower.id='proposal_lower';lower.innerHTML='<img src="'+file('bg/page_blank.png')+'">';document.querySelector('#snk_private_room').prepend(lower);
 document.querySelector('#snk_room_message').textContent='키쿠치요는 방 안에서 당신을 바라보고 있다. 개인실의 상태 설명과 행동 결과는 원래처럼 하단 양피지 영역에 표시됩니다. 긴 내용은 이 영역 안에서 스크롤하여 확인합니다.';
 document.querySelector('.snk_notice_image').style.display='none';
 const text=document.createElement('div');text.style.cssText='padding:18px 14px;color:#352719;font:13px/1.7 "Malgun Gothic"';text.innerHTML='<strong style="font-size:17px">개인실 주요 변경사항</strong><br><br>◆ 왼쪽 처벌·처분 메뉴 숨김<br>◆ 하단 양피지 대사 영역 복구<br>◆ 식사 설정 → 보상 → 씻기<br>◆ 툴팁은 가장 위에 표시<br><br><small>개인실 추가 기능 개발 중 by SAnk</small>';document.querySelector('#snk_room_notice').append(text);
});
await p.addStyleTag({content:`
#snk_room_bg{height:596px!important}
#snk_room_character{top:15px!important;height:581px!important}
#snk_private_room #snk_room_menu .menu_column_0{top:65px!important}
#proposal_lower{position:absolute;left:3px;top:596px;width:957px;height:201px;box-sizing:border-box;border-top:12px solid #302d24;border-bottom:9px solid #302d24;z-index:2;box-shadow:inset 0 1px #aa8750}
#proposal_lower>img{position:absolute;width:100%;height:100%;left:0;top:0}
#snk_room_message{left:28px!important;top:625px!important;width:842px!important;height:142px!important;max-height:142px!important;background:none!important;color:#17130d!important;font:16px/1.65 'Malgun Gothic'!important;padding:10px!important}
#snk_room_home{top:730px!important}
`});
await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));await p.mouse.move(1278,798);
const check=await p.evaluate(()=>({hidden:!document.querySelector('#snk_room_menu li.snk_disabled'),menusFit:[...document.querySelectorAll('#snk_room_menu li')].every(e=>e.getBoundingClientRect().bottom<=596),noBroken:[...document.images].every(i=>i.naturalWidth>0)}));if(Object.values(check).some(v=>!v))throw Error(JSON.stringify(check));
fs.writeFileSync(path.join(out,'lower-section-proposal.html'),await p.content());await p.screenshot({path:path.join(out,'lower-section-proposal.png')});console.log(check);await b.close()})();
