(function(){
 'use strict';
 const model=window.JO9_JOURNAL;
 const box=document.createElement('section');box.id='journalKeywords';
 box.innerHTML='<details><summary>저널 호출 키워드 <span id="journalCount"></span></summary><p class="muted">Kindroid Narrator에 등록한 NPC·장소 저널을 이름으로 호출합니다. 선택한 키워드는 각색 전송과 요청 복사에 포함됩니다.</p><div id="journalSelected" class="row"></div><div class="row"><input id="journalSearch" type="search" placeholder="NPC·장소 이름 검색 또는 키워드 입력" aria-label="저널 키워드 검색"><button id="journalAdd" type="button">직접 추가</button><button id="journalSuggest" type="button">장면에서 다시 추천</button></div><div id="journalOptions" class="row"></div><p id="journalHint" class="muted"></p></details>';
 document.getElementById('editor').prepend(box);
 const get=id=>document.getElementById(id);let chosen=[],suggested=[],sceneKey='';
 let saved={};try{saved=JSON.parse(sessionStorage.getItem('jo9JournalKeywords')||'{}');}catch{}
 function remember(){if(sceneKey){saved[sceneKey]=chosen;try{sessionStorage.setItem('jo9JournalKeywords',JSON.stringify(saved));}catch{}}}
 function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;return b;}
 function add(value){for(const keyword of String(value).split(/[,，\n]/).map(s=>s.trim()).filter(Boolean)){if(keyword.length<2||keyword.length>50){get('journalHint').textContent='키워드는 2~50자로 입력하세요.';continue;}if(!chosen.includes(keyword))chosen.push(keyword);}remember();render();}
 function render(){get('journalCount').textContent=chosen.length?'· '+chosen.length+'개 선택':'· 선택 없음';get('journalSelected').replaceChildren(...chosen.map(k=>button(k+' ×',()=>{chosen=chosen.filter(v=>v!==k);remember();render();})));
  const query=get('journalSearch').value.trim().toLowerCase();
  const matches=model.entries.filter(e=>!chosen.includes(e.name)&&(query?(e.name+' '+e.keywords.join(' ')).toLowerCase().includes(query):suggested.includes(e.name)));
  get('journalOptions').replaceChildren(...matches.slice(0,30).map(e=>button((e.kind==='npc'?'인물 · ':'장소 · ')+e.name,()=>add(e.name))));
  get('journalHint').textContent=query?(matches.length?'검색 '+matches.length+'건'+(matches.length>30?' · 검색어를 더 입력하세요.':''):(chosen.some(k=>k.toLowerCase().includes(query))?'이미 선택한 키워드입니다.':'등록 목록에 없습니다. 직접 추가하려면 Kindroid에 등록된 키워드인지 확인하세요.')):(suggested.length?'장면에서 찾은 키워드를 선택했습니다. 불필요한 키워드는 ×로 빼세요.':'자동으로 확인되는 키워드가 없습니다. NPC·장소 이름을 검색해 추가하세요.');
 }
 window.JO9_JOURNAL_CONTEXT=()=>model.request(chosen);
 window.JO9_JOURNAL_SELECT=function(){const next=selection?selection.location+':'+selection.fieldIndex+':'+selection.start+':'+context?.scene?.id+':'+(context?.flow?.usage?.id||''):'';if(next===sceneKey)return;sceneKey=next;suggested=model.match({selection,context});chosen=Object.hasOwn(saved,next)?[...saved[next]]:[...suggested];get('journalSearch').value='';render();};
 get('journalSearch').oninput=render;get('journalSearch').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();add(e.target.value);e.target.value='';render();}};
 get('journalAdd').onclick=()=>{add(get('journalSearch').value);get('journalSearch').value='';render();};
 get('journalSuggest').onclick=()=>{suggested=model.match({selection,context});chosen=[...new Set([...chosen,...suggested])];remember();render();};
 render();
})();
