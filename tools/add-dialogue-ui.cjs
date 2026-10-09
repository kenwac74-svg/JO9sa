// 기존 편집 흐름에 대사 추가 입력과 미리보기 버튼을 연결한다.
const fs=require('node:fs'),p=require('node:path').join(__dirname,'text-workshop/index.html');let s=fs.readFileSync(p,'utf8');
const marker='<div id="difference" hidden>';
if(s.includes('id="additionText"'))throw Error('Already added');
s=s.replace(marker,`<details id="additionBox"><summary>＋ 대사 추가</summary><p class="muted">선택한 원문은 그대로 두고 새 대사를 추가합니다. 다음 페이지는 그림·소리 번호도 함께 이동합니다. 조건이나 페이지별 실행 동작이 복잡한 장면은 문단 추가를 사용하세요.</p><label>추가 방식<select id="additionMode"><option value="page">선택한 대사 뒤에 다음 페이지 추가</option><option value="paragraph">현재 대사 끝에 문단 추가</option></select></label><label>새 대사<textarea id="additionText" placeholder="추가할 새 대사를 입력하세요"></textarea></label><button type="button" id="additionPreview">대사 추가 미리보기</button></details>`+marker);
s=s.replace("context=c;selection=c.selection||null;invalidate();", "const previousKey=selection?key(selection):null;context=c;selection=c.selection||null;if(previousKey!==(selection?key(selection):null)){$('additionText').value='';$('additionBox').open=false;}invalidate();");
const hook="action('preview',async()=>";
const code=`$('additionText').oninput=()=>invalidate();$('additionMode').onchange=()=>invalidate();
action('additionPreview',async()=>{if(!selection)throw Error('기준 대사를 선택하세요.');invalidate();const p=await api('/api/preview',{operation:'add',selection,addition:$('additionText').value,additionMode:$('additionMode').value});previewId=p.id;$('difference').hidden=false;$('diff').textContent='위치: '+p.location+' / '+p.line+'행\\n추가 방식: '+(p.operation==='page'?'다음 페이지 ('+p.page+'번)':'현재 대사에 문단')+'\\n\\n기존 대사:\\n'+p.old+'\\n\\n반영 내용:\\n'+p.new;say('대사 추가 미리보기입니다. 내용을 확인한 뒤 승인하면 백업 후 반영합니다.');});
`;
if(!s.includes(hook))throw Error('Preview hook missing');s=s.replace(hook,code+hook);fs.writeFileSync(p,s);
