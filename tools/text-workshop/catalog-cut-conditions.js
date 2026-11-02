/* JO9 image appearance rules. Addon: preserves the existing catalog/cut editor. */
(function (root) {
  'use strict';
  const PREFIX = 'jo9-image-condition';
  const normalize = value => String(value || '').replaceAll('\\', '/');
  const eligible = value => /^(?:content\/pic\/)?(?:bg|characters|scene)\/.+\.(?:png|jpe?g|gif|webp|bmp)$/i.test(normalize(value));
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const MORALITY_EXTREMES = Object.freeze([-9999,9999]);
  function moralityValue(value) {
    return Number.isFinite(value) && (MORALITY_EXTREMES.includes(value) || (value >= -10 && value <= 10 && Number.isInteger(value * 2)));
  }
  function moralityChoices(options = {}) {
    const min = Number(options.moralityMin ?? -10), max = Number(options.moralityMax ?? 10), step = Number(options.moralityStep ?? .5);
    const extremes = options.moralityExtremes ?? MORALITY_EXTREMES;
    if (min !== -10 || max !== 10 || step !== .5 || !Array.isArray(extremes) || extremes.length !== 2 || extremes[0] !== -9999 || extremes[1] !== 9999) throw Error('cruel & mercy 선택 범위를 확인할 수 없습니다.');
    const values = [extremes[0]];
    for (let x = min; x <= max; x += step) values.push(x);
    values.push(extremes[1]);
    return values;
  }
  function collectRules(base, rows) {
    const result = [];
    for (const row of rows) {
      if (!row.enabled) continue;
      const rule = {base, path: row.path, morality: null, money: null, rank: null, reputation: null};
      if (row.moralityEnabled) {
        const min = Number(row.moralityMin), max = Number(row.moralityMax);
        if (!moralityValue(min) || !moralityValue(max) || min > max) {
          throw Error(row.file + ': cruel & mercy 범위는 -9999, -10~+10의 0.5 단위 값, +9999 중에서 최솟값이 최댓값 이하여야 합니다.');
        }
        rule.morality = {min, max};
      }
      if (row.moneyEnabled) {
        const raw = String(row.moneyValue).trim(), value = Number(raw);
        if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < 0 || value > 2147483647 || !['ge','le'].includes(row.moneyOp)) {
          throw Error(row.file + ': 보유금은 0~2,147,483,647 사이의 정수와 이상·이하 조건을 입력하세요.');
        }
        rule.money = {op: row.moneyOp, value};
      }
      for (const field of ['rank', 'reputation']) {
        if (row[field] !== '' && row[field] !== null && row[field] !== undefined) {
          const n = Number(row[field]);
          if (!Number.isInteger(n) || n < 0 || n > 5) throw Error(row.file + ': ' + (field === 'rank' ? '계급' : '평판') + '을 다시 선택하세요.');
          rule[field] = n;
        }
      }
      // An enabled row with no active field removes the rule, as does unchecking it.
      if (rule.morality || rule.money || rule.rank !== null || rule.reputation !== null) result.push(rule);
    }
    return result;
  }
  const helpers = {eligible, normalize, escape, collectRules, moralityChoices};
  if (typeof module === 'object' && module.exports) module.exports = helpers;
  if (!root || !root.document || root.JO9_IMAGE_CONDITIONS?.installed) return;
  const doc = root.document;
  let current = null, serial = 0, hooked = false;
  function el(tag, cls, text) {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  async function call(action, payload) {
    const cfg = root.JO9_CATALOG_BRIDGE;
    if (!cfg?.url || !cfg?.token) throw Error('이미지 패치리스트를 편집실 주소에서 다시 열어 주세요.');
    let response;
    try {
      response = await root.fetch(cfg.url + 'api/catalog/cut-conditions/' + action, {
        method: 'POST', headers: {'Content-Type':'application/json','X-JO9-Token':cfg.token}, body: JSON.stringify(payload)
      });
    } catch (error) {
      throw Error('편집실과 연결하지 못했습니다. 입력은 유지되어 있습니다. 서버 연결을 확인한 뒤 다시 저장하세요.');
    }
    let value;
    try { value = await response.json(); }
    catch (error) { throw Error('편집실 응답을 읽지 못했습니다. 입력을 유지한 채 다시 시도하세요.'); }
    if (!response.ok) {
      const message = value.error || '조건을 저장하지 못했습니다.';
      if (response.status === 409 || /해시|바뀌|변경|충돌|hash|conflict/i.test(message)) {
        throw Error(message + ' 입력한 조건은 이 창에 남아 있습니다. 다시 열기 전에 입력 내용을 확인하세요.');
      }
      throw Error(message);
    }
    return value;
  }
  function installStyle() {
    if (doc.getElementById(PREFIX + '-style')) return;
    const style = el('style'); style.id = PREFIX + '-style';
    style.textContent = `
.${PREFIX}-button{margin:5px 5px 3px 0}
.${PREFIX}-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}
.${PREFIX}-dialog{background:#20242b;color:#f1e9dc;border:1px solid #a38b60;border-radius:7px;box-shadow:0 15px 55px #000b;width:min(920px,96vw);max-height:94vh;display:flex;flex-direction:column;font:15px/1.55 system-ui,sans-serif;text-align:left}
.${PREFIX}-head,.${PREFIX}-foot{padding:15px 20px;flex:none}.` + PREFIX + `-head{border-bottom:1px solid #6e6049}.` + PREFIX + `-foot{border-top:1px solid #6e6049;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.${PREFIX}-head h2{font-size:20px;margin:0 0 6px}.` + PREFIX + `-head p{margin:4px 0;overflow-wrap:anywhere}
.${PREFIX}-body{padding:12px 20px;overflow:auto;min-height:100px}.` + PREFIX + `-body p{margin:8px 0}
.${PREFIX}-card{border:1px solid #615842;padding:12px;margin:10px 0;border-radius:4px;min-width:0}.` + PREFIX + `-card legend{padding:0 6px;overflow-wrap:anywhere;max-width:95%}
.${PREFIX}-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 22px;margin-top:10px}.` + PREFIX + `-field{display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0}
.${PREFIX}-dialog input,.${PREFIX}-dialog select,.${PREFIX}-dialog button{font:inherit;color:#f1e9dc;background:#303641;border:1px solid #81745d;border-radius:3px;padding:5px 7px;box-sizing:border-box}.` + PREFIX + `-dialog input[type=checkbox]{width:17px;height:17px;margin:0 6px 0 0;vertical-align:middle}.` + PREFIX + `-dialog input[type=number]{width:140px;max-width:100%}
.${PREFIX}-dialog button{cursor:pointer}.` + PREFIX + `-dialog :disabled{opacity:.48;cursor:default}.` + PREFIX + `-dialog :focus-visible{outline:2px solid #f4cf7c;outline-offset:2px}
.${PREFIX}-hint{color:#c9c1b1;font-size:14px}.` + PREFIX + `-status{flex:1;min-width:180px;white-space:pre-wrap;overflow-wrap:anywhere}.` + PREFIX + `-status[data-error=true]{color:#ffaaaa}.` + PREFIX + `-status[data-saved=true]{color:#a8e4ad}
@media(max-width:650px){.${PREFIX}-fields{grid-template-columns:1fr}.` + PREFIX + `-overlay{padding:7px}.` + PREFIX + `-head,.${PREFIX}-foot,.${PREFIX}-body{padding:11px}}
`;
    doc.head.appendChild(style);
  }
  function option(select, value, label) {
    const node = el('option', '', label); node.value = String(value); select.appendChild(node);
  }
  function labelled(parent, text, control) {
    const label = el('label'); label.append(el('span', '', text), control); parent.appendChild(label); return control;
  }
  function checkbox(parent, text, checked) {
    const label = el('label'), node = el('input'); node.type = 'checkbox'; node.checked = !!checked;
    label.append(node, doc.createTextNode(text)); parent.appendChild(label); return node;
  }
  function status(ctx, message, error, saved) {
    ctx.status.textContent = message; ctx.status.dataset.error = String(!!error); ctx.status.dataset.saved = String(!!saved);
  }
  function updateDisabled(ctx) {
    ctx.save.disabled = ctx.loading || ctx.saving || !ctx.rows.length;
    ctx.close.disabled = ctx.saving;
    for (const row of ctx.rows) {
      row.enabled.disabled = ctx.saving;
      const off = !row.enabled.checked || ctx.saving;
      row.moralityEnabled.disabled = off; row.moneyEnabled.disabled = off;
      row.moralityMin.disabled = row.moralityMax.disabled = off || !row.moralityEnabled.checked;
      row.moneyOp.disabled = row.moneyValue.disabled = off || !row.moneyEnabled.checked;
      row.rank.disabled = row.reputation.disabled = off;
    }
  }
  function close(ctx) {
    if (!ctx || current !== ctx || ctx.saving) return;
    current = null; doc.removeEventListener('keydown', ctx.keydown, true); ctx.overlay.remove();
    if (ctx.previousFocus?.isConnected && typeof ctx.previousFocus.focus === 'function') ctx.previousFocus.focus();
  }
  function readRows(ctx) {
    return ctx.rows.map(row => ({path:row.path,file:row.file,enabled:row.enabled.checked,moralityEnabled:row.moralityEnabled.checked,moralityMin:row.moralityMin.value,moralityMax:row.moralityMax.value,moneyEnabled:row.moneyEnabled.checked,moneyOp:row.moneyOp.value,moneyValue:row.moneyValue.value,rank:row.rank.value,reputation:row.reputation.value}));
  }
  async function save(ctx) {
    if (ctx.saving || ctx.loading || current !== ctx) return;
    let rules;
    try { rules = collectRules(ctx.base, readRows(ctx)); }
    catch (error) { status(ctx, error.message, true); return; }
    ctx.saving = true; updateDisabled(ctx); status(ctx, '조건을 저장하고 게임 연결을 반영하는 중…');
    try {
      const value = await call('save', {base:ctx.base,before:ctx.qspHash,rules});
      if (current !== ctx) return;
      if (value.qspHash || value.hash) ctx.qspHash = value.qspHash || value.hash;
      status(ctx, '저장했습니다. 실행 중인 게임은 다시 실행해야 새 조건이 적용됩니다.', false, true);
    } catch (error) {
      if (current === ctx) status(ctx, error.message, true);
    } finally { ctx.saving = false; if (current === ctx) updateDisabled(ctx); }
  }
  function buildRow(ctx, item, rule, options) {
    const card = el('fieldset', PREFIX + '-card'), legend = el('legend', '', (item.cutIndex === 2 ? 'B컷' : item.cutIndex === 3 ? 'C컷' : '추가 컷 ' + item.cutIndex) + ' · ' + item.file);
    card.dataset.cutPath = item.path; card.appendChild(legend);
    const row = {path:item.path,file:item.file};
    row.enabled = checkbox(card, '이 컷의 등장 조건 사용', !!rule);
    const fields = el('div', PREFIX + '-fields'); card.appendChild(fields);
    const moral = el('div', PREFIX + '-field'); fields.appendChild(moral);
    row.moralityEnabled = checkbox(moral, 'cruel & mercy', !!rule?.morality);
    row.moralityMin = el('select'); row.moralityMin.setAttribute('aria-label', item.file + ' cruel & mercy 최솟값');
    row.moralityMax = el('select'); row.moralityMax.setAttribute('aria-label', item.file + ' cruel & mercy 최댓값');
    const min = Number(options.moralityMin ?? -10), max = Number(options.moralityMax ?? 10), step = Number(options.moralityStep ?? .5);
    for (const x of moralityChoices(options)) { const label = x > 0 ? '+' + x : String(x); option(row.moralityMin,x,label); option(row.moralityMax,x,label); }
    row.moralityMin.value = String(rule?.morality?.min ?? min); row.moralityMax.value = String(rule?.morality?.max ?? max);
    moral.append(row.moralityMin,doc.createTextNode('~'),row.moralityMax);
    const money = el('div', PREFIX + '-field'); fields.appendChild(money);
    row.moneyEnabled = checkbox(money, '보유금', !!rule?.money);
    row.moneyValue = el('input'); row.moneyValue.type='number'; row.moneyValue.min='0'; row.moneyValue.max='2147483647'; row.moneyValue.step='1'; row.moneyValue.value=String(rule?.money?.value ?? 0); row.moneyValue.setAttribute('aria-label',item.file+' 보유금 정수');
    row.moneyOp=el('select'); option(row.moneyOp,'ge','이상'); option(row.moneyOp,'le','이하'); row.moneyOp.value=rule?.money?.op ?? 'ge'; row.moneyOp.setAttribute('aria-label',item.file+' 보유금 비교');
    money.append(row.moneyValue,row.moneyOp);
    for (const field of ['rank','reputation']) {
      const box=el('div',PREFIX+'-field'), select=el('select'); fields.appendChild(box);
      option(select,'','조건 없음');
      for (const value of options[field === 'rank' ? 'ranks' : 'reputations'] || []) option(select,value.value,value.label);
      select.value=rule?.[field] === null || rule?.[field] === undefined ? '' : String(rule[field]);
      labelled(box,field==='rank'?'계급 ':'평판 ',select); select.setAttribute('aria-label',item.file+' '+(field==='rank'?'계급':'평판'));
      row[field]=select;
    }
    for (const node of [row.enabled,row.moralityEnabled,row.moneyEnabled]) node.addEventListener('change',()=>updateDisabled(ctx));
    ctx.rows.push(row); ctx.body.appendChild(card);
  }
  async function open(path) {
    if (!eligible(path)) return null;
    if (current?.saving) return current;
    if (current) close(current);
    installStyle();
    const overlay=el('div',PREFIX+'-overlay'), dialog=el('section',PREFIX+'-dialog'), head=el('header',PREFIX+'-head'), title=el('h2','','이미지 등장 조건 설정');
    title.id=PREFIX+'-title-'+(++serial); dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true'); dialog.setAttribute('aria-labelledby',title.id); dialog.tabIndex=-1;
    head.append(title,el('p','',normalize(path)),el('p',PREFIX+'-hint','설정한 조건을 모두 만족하면 해당 컷을 표시합니다. 여러 컷이 만족하면 번호가 작은 컷을 우선합니다.'));
    const body=el('div',PREFIX+'-body'), foot=el('footer',PREFIX+'-foot'), message=el('span',PREFIX+'-status'), cancel=el('button','','닫기'), submit=el('button','','조건 저장');
    message.setAttribute('role','status'); message.setAttribute('aria-live','polite'); cancel.type=submit.type='button'; foot.append(message,cancel,submit); dialog.append(head,body,foot); overlay.appendChild(dialog);
    const ctx={overlay,dialog,body,status:message,close:cancel,save:submit,rows:[],base:'',qspHash:'',loading:true,saving:false,previousFocus:doc.activeElement}; current=ctx;
    cancel.addEventListener('click',()=>close(ctx)); submit.addEventListener('click',()=>save(ctx)); overlay.addEventListener('click',e=>{if(e.target===overlay)close(ctx);});
    ctx.keydown=e=>{
      if(current!==ctx)return;
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(ctx);return;}
      if(e.key==='Tab'){
        const focusable=[...dialog.querySelectorAll('button,input,select,[tabindex]')].filter(n=>!n.disabled&&n.tabIndex>=0), first=focusable[0],last=focusable.at(-1);
        if(!first){e.preventDefault();dialog.focus();}else if(!dialog.contains(doc.activeElement)){e.preventDefault();(e.shiftKey?last:first).focus();}else if(e.shiftKey&&(doc.activeElement===first||doc.activeElement===dialog)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(doc.activeElement===last||doc.activeElement===dialog)){e.preventDefault();first.focus();}
      }
    };
    doc.addEventListener('keydown',ctx.keydown,true); doc.body.appendChild(overlay); updateDisabled(ctx); status(ctx,'추가 컷과 저장된 조건을 불러오는 중…'); cancel.focus();
    try {
      const data=await call('info',{path:normalize(path)}); if(current!==ctx)return null;
      if(!data.base||!data.qspHash||!Array.isArray(data.family?.items)||!Array.isArray(data.rules))throw Error('등장 조건 응답의 이미지·저장 정보를 확인할 수 없습니다.');
      ctx.base=data.base; ctx.qspHash=data.qspHash;
      body.append(el('p',PREFIX+'-hint','A컷은 기본 그림입니다. 추가 컷의 조건을 모두 비우거나 사용 체크를 해제하면 해당 조건을 삭제합니다. 조건이 없는 이미지의 기존 전환 방식은 유지됩니다.'));
      const variants=data.family.items.filter(x=>Number(x.cutIndex)>1).sort((a,b)=>Number(a.cutIndex)-Number(b.cutIndex));
      if(!variants.length){body.append(el('p','','저장된 추가 컷이 없습니다. ‘전환 컷 추가 (B·C…)’로 그림을 저장한 다음 이 창에서 조건을 지정하세요.'));status(ctx,'추가 컷을 먼저 저장하세요.');}
      else {for(const item of variants)buildRow(ctx,item,data.rules.find(r=>normalize(r.path).toLowerCase()===normalize(item.path).toLowerCase()),data.options||{});status(ctx,'조건을 선택한 뒤 저장하세요.');}
    } catch(error){if(current===ctx)status(ctx,error.message,true);}
    finally{ctx.loading=false;if(current===ctx)updateDisabled(ctx);}
    return ctx;
  }
  function hook() {
    if(hooked||!root.JO9_CATALOG_BRIDGE||typeof root.rowHtml!=='function')return false;
    hooked=true;const previous=root.rowHtml;
    root.rowHtml=function(d){let html=previous.apply(this,arguments);if(eligible(d?.[0])){const button='<button type="button" class="'+PREFIX+'-button" data-jo9-image-condition="'+escape(normalize(d[0]))+'">등장 조건 설정</button>',at=html.lastIndexOf('</div>');html=at<0?html+button:html.slice(0,at)+button+html.slice(at);}return html;};
    if(typeof root.render==='function')root.render();return true;
  }
  doc.addEventListener('click',e=>{const button=e.target.closest?.('[data-jo9-image-condition]');if(!button)return;e.preventDefault();e.stopPropagation();open(button.dataset.jo9ImageCondition);});
  root.JO9_IMAGE_CONDITIONS={installed:true,open,close:()=>close(current),save:()=>current&&save(current),state:()=>current?{open:true,loading:current.loading,saving:current.saving,base:current.base,rows:current.rows.length,status:current.status.textContent}: {open:false},...helpers};
  if(!hook()){let tries=0;const timer=root.setInterval(()=>{if(hook()||++tries>=300)root.clearInterval(timer);},100);}
})(typeof window==='object'?window:null);
