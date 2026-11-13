// 통합 캐릭터 편집의 외형 편집: 슬롯 이미지 선택·정렬(배율·위치)·얼굴 상자를 브라우저 캔버스로 하고, 원본 + 변환값을 서버로 보내 기존 이미지 도구와 같은 PNG를 만든다
import {esc as e} from './sim-data.mjs';

const W = 795, H = 596, FACE_RATIO = 150 / 151;
const FACE_LABEL = {seed_ava_clear: '얼굴', seed_ava_gray: '흑백', seed_ava: '세피아'};

// 원본이 캔버스 안에 통째로 들어가는 기본 변환(align_core.contain_transform)
const contain = (w, h) => { const s = Math.min(W / w, H / h); return {s, x: (W - w * s) / 2, y: (H - h * s) / 2}; };
const round = t => ({s: Math.round(t.s * 1e4) / 1e4, x: Math.round(t.x * 100) / 100, y: Math.round(t.y * 100) / 100});
const valid = t => Number.isFinite(t.s) && Number.isFinite(t.x) && Number.isFinite(t.y) && t.s >= .05 && t.s <= 12 && Math.abs(t.x) <= 30000 && Math.abs(t.y) <= 30000;
const loadImage = src => new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => bad(new Error('이미지를 읽지 못했습니다.')); im.src = src; });
const readFile = file => new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => bad(r.error); r.readAsDataURL(file); });

// 투명 여백을 뺀 보이는 영역(align_core.alpha_bounds와 같은 기준: 알파 > 16)
function alphaBounds(im) {
 const k = Math.min(1, 1200 / Math.max(im.naturalWidth, im.naturalHeight));
 const w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
 const c = Object.assign(document.createElement('canvas'), {width: w, height: h}), g = c.getContext('2d', {willReadFrequently: true});
 g.drawImage(im, 0, 0, w, h);
 const a = g.getImageData(0, 0, w, h).data;
 let x0 = w, y0 = h, x1 = -1, y1 = -1, clear = 0;
 for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = a[(y * w + x) * 4 + 3]; if (v < 250) clear++; if (v > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
 if (x1 < 0) return null;
 return {x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k, transparent: clear / (w * h)};
}

export function createLookEditor({toast, call, onSaved, endpoint = c => `/api/char/${c.id}/images`, extra = () => ({})}) {
 const blankFace = () => ({box: null, changed: false, file: null});
 let ch = null, cur = 'base', slots = {}, face = blankFace(), faceMode = false, preview = null, drag = null, pick = null;
 const rules = {top: 24, head: 142}; // 기준: 머리 윗끝 Y, 정수리~턱 높이(Tk 도구 기본값)

 function reset(character) {
  ch = character; cur = 'base'; slots = {}; face = blankFace(); faceMode = false; preview = null;
 }
 const dirty = () => Object.values(slots).some(s => s.changed) || face.changed;
 const slot = k => slots[k] ??= {src: null, img: null, t: null, changed: false, unlink: false};
 // 지금 슬롯의 그림: 새로 고른 이미지 → 기존 이미지(정렬용으로 불러온 것)
 const hasImage = k => !!slot(k).img;

 async function useExisting(k) {
  const s = ch.slots[k];
  if (!s.url) return toast('이 슬롯에는 기존 이미지가 없습니다.');
  const im = await loadImage(s.url);
  Object.assign(slot(k), {src: 'existing', img: im, t: im.naturalWidth === W && im.naturalHeight === H ? {s: 1, x: 0, y: 0} : contain(im.naturalWidth, im.naturalHeight), changed: false, unlink: false});
 }
 async function pickFile(k, file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return toast('PNG·JPG·WEBP·GIF 이미지만 쓸 수 있습니다.');
  const src = await readFile(file), im = await loadImage(src);
  Object.assign(slot(k), {src, img: im, t: contain(im.naturalWidth, im.naturalHeight), changed: true, unlink: false});
  if (k === 'base' && !face.box) resetFace();
 }
 function fit(k, how) {
  const s = slot(k); if (!s.img) return;
  const iw = s.img.naturalWidth, ih = s.img.naturalHeight;
  if (how === 'contain') s.t = contain(iw, ih);
  if (how === 'bounds') {
   // align_core.align_bounds: 지금 배율은 그대로, 보이는 부분의 가로 중심을 397.5에, 윗끝을 기준 Y에
   const b = alphaBounds(s.img); if (!b) return toast('보이는 부분이 없습니다.');
   const sc = s.t.s;
   s.t = {s: sc, x: W / 2 - (b.x + b.w / 2) * sc, y: rules.top - b.y * sc};
  }
  s.changed = true;
 }
 // 얼굴 상자 기본 위치: 기본 슬롯 그림의 보이는 윗부분 가운데(Tk 도구 reset_face_box와 같은 방식)
 function resetFace() {
  const w = Math.round(H * 0.2 * 151 / 150), b = slot('base');
  let cx = W / 2, y = rules.top;
  const bd = b.img ? alphaBounds(b.img) : null;
  if (bd && bd.transparent > 0.05) { cx = b.t.x + (bd.x + bd.w / 2) * b.t.s; y = b.t.y + bd.y * b.t.s; }
  face.box = [Math.round(cx - w / 2), Math.round(y), w];
  clampFace();
 }
 function clampFace() {
  if (!face.box) return;
  let [x, y, w] = face.box;
  w = Math.max(16, Math.min(w, W, Math.floor(H / FACE_RATIO)));
  const h = Math.round(w * FACE_RATIO);
  face.box = [Math.round(Math.max(0, Math.min(W - w, x))), Math.round(Math.max(0, Math.min(H - h, y))), Math.round(w)];
 }

 function html() {
  if (!ch) return '';
  const s = slot(cur), info = ch.slots[cur], changedSlots = Object.entries(slots).filter(([, v]) => v.changed);
  const t = s.t;
  return `<div class="lk">
   <div class="st-tabs lk-slots">${Object.entries(ch.slots).map(([k, v]) => `<button class="${k === cur ? 'on' : ''}" data-lk-slot="${k}">${e(v.label)}${slots[k]?.changed ? ' ●' : ''}</button>`).join('')}</div>
   <div class="lk-body">
    <div class="lk-stage"><canvas width="${W}" height="${H}" tabindex="0" data-lk-canvas></canvas>
     <div class="fine-print">${s.img ? (faceMode ? '얼굴 상자: 끌어서 옮기고, 휠로 크기를 바꿉니다.' : '끌기 = 위치, 휠 = 배율(커서 기준), 화살표 = 1px(Shift 10px). 위 선 = 머리 윗끝 기준(윗끝 Y), 세로선 = 가운데') : info.url ? '이 슬롯의 기존 이미지를 정렬하려면 "기존 이미지 정렬"을 누르세요.' : '이미지를 고르세요.'}</div></div>
    <div class="lk-side">
     <div class="section-label">${e(info.label)} <small class="source-line">${e(info.reference ?? '연결 없음')}</small></div>
     ${info.url && !s.img ? `<img class="lk-thumb" src="${e(info.url)}" alt="">` : ''}
     <div class="st-row"><label class="button secondary">이미지 선택<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-lk-file hidden></label>
      ${info.url ? `<button class="button secondary" data-lk-act="existing">기존 이미지 정렬</button>` : ''}
      ${info.reference && cur !== 'base' ? `<button class="button secondary" data-lk-act="unlink">연결 해제</button>` : ''}</div>
     ${s.unlink ? '<p class="warning">저장하면 이 슬롯의 연결을 끊습니다(다른 캐릭터가 쓰지 않는 파일만 지움).</p>' : ''}
     ${s.img ? `<div class="st-row"><button class="button ${pick?.mode === 'cut' ? '' : 'secondary'}" data-lk-act="pick-cut">두 점: 정수리→하단 컷</button><button class="button ${pick?.mode === 'chin' ? '' : 'secondary'}" data-lk-act="pick-chin">두 점: 정수리→턱</button></div>
      ${pick ? `<p class="warning">${pick.points.length ? '두 번째 점(' + (pick.mode === 'cut' ? '하단 컷' : '턱') + ')을 찍으세요.' : '첫 점(정수리)을 찍으세요.'}</p>` : ''}
      <div class="cv-form lk-num"><label>윗끝 Y<input type="number" step="1" data-lk-rule="top" value="${rules.top}"></label><label>머리 높이<input type="number" step="1" data-lk-rule="head" value="${rules.head}"></label></div>
      <div class="cv-form lk-num"><label>배율<input type="number" step="0.001" data-lk-t="s" value="${t.s.toFixed(4)}"></label><label>X<input type="number" step="1" data-lk-t="x" value="${t.x.toFixed(1)}"></label><label>Y<input type="number" step="1" data-lk-t="y" value="${t.y.toFixed(1)}"></label></div>
      <div class="st-row"><button class="button secondary" data-lk-act="contain">전체 맞춤</button><button class="button secondary" data-lk-act="bounds">투명 여백 기준 정렬</button>${s.changed ? `<button class="button secondary" data-lk-act="undo-slot">이 슬롯 되돌리기</button>` : ''}</div>
      <small class="fine-print">원본 ${s.img.naturalWidth}×${s.img.naturalHeight} → 795×596</small>` : ''}
     ${cur === 'base' ? `<div class="section-label">얼굴(151×150)</div>
      <div class="lk-faces"><canvas width="151" height="150" data-lk-face></canvas>${Object.entries(ch.faces).map(([k, u]) => `<figure>${u ? `<img src="${e(u)}" alt="">` : '<div class="st-empty">없음</div>'}<figcaption>${FACE_LABEL[k]}</figcaption></figure>`).join('')}</div>
      <div class="st-row"><button class="button ${faceMode ? '' : 'secondary'}" data-lk-act="face-mode" ${hasImage('base') ? '' : 'disabled'}>${faceMode ? '얼굴 상자 편집 중' : '얼굴 상자로 만들기'}</button>
       <label class="button secondary">얼굴 파일 선택<input type="file" accept="image/png,image/jpeg,image/webp" data-lk-facefile hidden></label>
       ${face.changed ? '<button class="button secondary" data-lk-act="face-undo">얼굴 되돌리기</button>' : ''}</div>
      ${!hasImage('base') && ch.slots.base.url ? '<small class="fine-print">얼굴 상자는 기본 이미지를 불러온 뒤(기존 이미지 정렬 또는 새 이미지) 쓸 수 있습니다.</small>' : ''}` : ''}
     ${ch.sharedWith.length ? `<p class="warning">같은 이미지를 쓰는 다른 캐릭터: ${ch.sharedWith.join(', ')}. 저장하면 공유 파일은 새 경로로 분리하거나 보존합니다.</p>` : ''}
    </div></div>
   <div class="st-row lk-save">${dirty() ? `<span class="badge">외형 변경: ${changedSlots.map(([k]) => ch.slots[k].label).join(', ')}${face.changed ? (changedSlots.length ? ', ' : '') + '얼굴' : ''}</span>` : '<span class="fine-print">외형 변경 없음</span>'}
    <button class="button" data-lk-act="preview" ${dirty() ? '' : 'disabled'}>외형 저장…</button>${dirty() ? '<button class="button secondary" data-lk-act="discard">외형 변경 버리기</button>' : ''}</div>
   ${preview ? `<div class="st-preview"><b>쓸 파일 ${preview.files.length}개</b><ul>${preview.files.map(f => `<li><code>${e(f)}</code></li>`).join('')}</ul>${preview.warnings.map(w => `<p class="warning">${e(w)}</p>`).join('')}${preview.sharedWith.length ? `<p class="warning">같은 파일을 쓰는 다른 캐릭터: ${preview.sharedWith.join(', ')}</p>` : ''}
    <div class="st-row"><button class="button" data-lk-act="save">게임 파일에 저장</button><button class="button secondary" data-lk-act="cancel">취소</button><span class="fine-print">JSON은 처음 저장할 때 .bak 백업을 남깁니다. 이미지는 덮어씁니다.</span></div></div>` : ''}
  </div>`;
 }

 // 캔버스 그리기: 체크무늬 → 이미지(변환) → 기준선 → 얼굴 상자
 function draw(root) {
  const cv = root.querySelector('[data-lk-canvas]'); if (!cv) return;
  const g = cv.getContext('2d'), s = slot(cur);
  g.clearRect(0, 0, W, H);
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) { g.fillStyle = ((x + y) / 16) % 2 ? '#2a2e32' : '#24282c'; g.fillRect(x, y, 16, 16); }
  if (s.img) { g.imageSmoothingQuality = 'high'; g.drawImage(s.img, s.t.x, s.t.y, s.img.naturalWidth * s.t.s, s.img.naturalHeight * s.t.s); }
  g.strokeStyle = 'rgba(219,176,110,.55)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(0, rules.top + .5); g.lineTo(W, rules.top + .5); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke(); g.setLineDash([]);
  if (pick && s.img) { g.fillStyle = '#dbb06e'; for (const [px, py] of pick.points) { g.beginPath(); g.arc(s.t.x + px * s.t.s, s.t.y + py * s.t.s, 5, 0, 7); g.fill(); } }
  if (cur === 'base' && face.box) {
   const [x, y, w] = face.box, h = Math.round(w * FACE_RATIO);
   g.strokeStyle = faceMode ? '#96bea4' : 'rgba(150,190,164,.5)'; g.lineWidth = 2; g.strokeRect(x + .5, y + .5, w, h); g.lineWidth = 1;
  }
  const fc = root.querySelector('[data-lk-face]');
  if (fc) {
   const fg = fc.getContext('2d'); fg.clearRect(0, 0, 151, 150);
   if (face.file) fg.drawImage(face.file, 0, 0, 151, 150);
   else if (face.box && hasImage('base')) {
    // 기준선·체크무늬 없이 기본 슬롯 그림만 다시 그려 잘라 보여 준다(서버가 실제로 자르는 그림과 같음)
    const b = slot('base'), off = Object.assign(document.createElement('canvas'), {width: W, height: H}), og = off.getContext('2d');
    og.imageSmoothingQuality = 'high'; og.drawImage(b.img, b.t.x, b.t.y, b.img.naturalWidth * b.t.s, b.img.naturalHeight * b.t.s);
    const [x, y, w] = face.box; fg.drawImage(off, x, y, w, Math.round(w * FACE_RATIO), 0, 0, 151, 150);
   }
  }
 }
 function syncInputs(root) {
  const s = slot(cur); if (!s.t) return;
  for (const k of ['s', 'x', 'y']) { const el = root.querySelector(`[data-lk-t="${k}"]`); if (el && document.activeElement !== el) el.value = k === 's' ? s.t.s.toFixed(4) : s.t[k].toFixed(1); }
 }

 // 화면 좌표 → 캔버스 좌표
 const toCanvas = (cv, ev) => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height]; };
 const inFace = (x, y) => { if (!face.box) return false; const [fx, fy, w] = face.box; return x >= fx && x <= fx + w && y >= fy && y <= fy + Math.round(w * FACE_RATIO); };

 function bind(root, rerender) {
  root.addEventListener('pointerdown', ev => {
   const cv = ev.target.closest('[data-lk-canvas]'); if (!cv) return;
   const [x, y] = toCanvas(cv, ev), s = slot(cur);
   if (pick && s.img) {
    // 두 점 맞춤(Tk 도구와 같은 계산): 캔버스 점을 원본 좌표로 바꿔 정수리→하단 컷 또는 정수리→턱
    pick.points.push([(x - s.t.x) / s.t.s, (y - s.t.y) / s.t.s]);
    if (pick.points.length === 2) {
     const [a, b] = pick.points;
     if (b[1] - a[1] < 8) toast('두 번째 점은 정수리보다 아래에 찍어 주세요.');
     else { const sc = pick.mode === 'cut' ? (H - rules.top) / (b[1] - a[1]) : rules.head / (b[1] - a[1]); const n = {s: sc, x: W / 2 - a[0] * sc, y: rules.top - a[1] * sc}; if (valid(n)) { s.t = n; s.changed = true; } else toast('계산한 배율이 범위를 벗어났습니다.'); }
     pick = null; rerender();
    } else draw(root);
    return;
   }
   if (cur === 'base' && faceMode && face.box) drag = {kind: 'face', x, y, box: [...face.box]};
   else if (s.img) drag = {kind: 'img', x, y, t: {...s.t}};
   if (drag) { cv.setPointerCapture(ev.pointerId); cv.focus(); }
  });
  root.addEventListener('pointermove', ev => {
   if (!drag) return;
   const cv = root.querySelector('[data-lk-canvas]'), [x, y] = toCanvas(cv, ev);
   if (drag.kind === 'img') { const s = slot(cur); s.t = {...drag.t, x: drag.t.x + x - drag.x, y: drag.t.y + y - drag.y}; s.changed = true; }
   else { face.box = [drag.box[0] + x - drag.x, drag.box[1] + y - drag.y, drag.box[2]]; clampFace(); face.changed = true; face.file = null; }
   draw(root); syncInputs(root);
  });
  root.addEventListener('pointerup', () => { if (drag) { drag = null; rerender(); } });
  root.addEventListener('wheel', ev => {
   const cv = ev.target.closest('[data-lk-canvas]'); if (!cv) return;
   ev.preventDefault();
   const [x, y] = toCanvas(cv, ev), k = ev.deltaY < 0 ? 1.03 : 1 / 1.03, s = slot(cur);
   if (cur === 'base' && faceMode && face.box) { const [fx, fy, w] = face.box, nw = w * k; face.box = [fx + (w - nw) / 2, fy + (w - nw) * FACE_RATIO / 2, nw]; clampFace(); face.changed = true; face.file = null; }
   else if (s.img) { const t = s.t, ns = Math.max(.05, Math.min(12, t.s * k)); s.t = {s: ns, x: x - (x - t.x) * ns / t.s, y: y - (y - t.y) * ns / t.s}; s.changed = true; }
   draw(root); syncInputs(root); clearTimeout(bind.wt); bind.wt = setTimeout(rerender, 400);
  }, {passive: false});
  root.addEventListener('keydown', ev => {
   if (!ev.target.closest('[data-lk-canvas]')) return;
   const d = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[ev.key]; if (!d) return;
   ev.preventDefault();
   const n = ev.shiftKey ? 10 : 1, s = slot(cur);
   if (cur === 'base' && faceMode && face.box) { face.box = [face.box[0] + d[0] * n, face.box[1] + d[1] * n, face.box[2]]; clampFace(); face.changed = true; face.file = null; }
   else if (s.img) { s.t = {...s.t, x: s.t.x + d[0] * n, y: s.t.y + d[1] * n}; s.changed = true; }
   draw(root); syncInputs(root);
  });
  root.addEventListener('change', async ev => {
   const t = ev.target;
   try {
    if (t.matches('[data-lk-file]')) { await pickFile(cur, t.files[0]); return rerender(); }
    if (t.matches('[data-lk-facefile]')) { const f = t.files[0]; if (!f) return; const src = await readFile(f); face.file = await loadImage(src); face.fileSrc = src; face.changed = true; faceMode = false; return rerender(); }
    if (t.dataset.lkRule) { const v = Math.round(Number(t.value)); if (t.dataset.lkRule === 'top' && v >= 0 && v <= 200) rules.top = v; else if (t.dataset.lkRule === 'head' && v >= 20 && v <= 590) rules.head = v; else toast('윗끝 0~200, 머리 높이 20~590'); draw(root); return; }
    if (t.dataset.lkT) { const s = slot(cur), n = {...s.t, [t.dataset.lkT]: Number(t.value)}; if (!valid(n)) return toast('배율 0.05~12, 위치 ±30000 안의 값을 넣으세요.'); s.t = n; s.changed = true; draw(root); }
   } catch (error) { toast(error.message); }
  });
  root.addEventListener('click', async ev => {
   const b = ev.target.closest('button'); if (!b) return;
   if (b.dataset.lkSlot) { cur = b.dataset.lkSlot; faceMode = faceMode && cur === 'base'; pick = null; return rerender(); }
   const act = b.dataset.lkAct; if (!act) return;
   try {
    if (act === 'existing') { await useExisting(cur); if (cur === 'base' && !face.box) resetFace(); }
    if (act === 'unlink') Object.assign(slot(cur), {src: null, img: null, t: null, changed: true, unlink: true});
    if (act === 'contain' || act === 'bounds') fit(cur, act);
    if (act === 'pick-cut' || act === 'pick-chin') { const mode = act.slice(5); pick = pick?.mode === mode ? null : {mode, points: []}; faceMode = false; }
    if (act === 'undo-slot') delete slots[cur];
    if (act === 'face-mode') { pick = null; faceMode = !faceMode; if (faceMode && !face.box) resetFace(); if (faceMode) { face.file = null; face.changed = true; } }
    if (act === 'face-undo') face = blankFace();
    if (act === 'discard') { slots = {}; face = blankFace(); faceMode = false; preview = null; }
    if (act === 'cancel') preview = null;
    if (act === 'preview') { const r = await call(endpoint(ch), {...payload(), ...extra(), dryRun: true}); preview = {files: r.files ?? [], warnings: [...(r.warnings ?? []), ...(r.log ?? []).filter(x => /주의|경고/.test(x))], sharedWith: r.sharedWith ?? []}; }
    if (act === 'save') {
     const r = await call(endpoint(ch), {...payload(), ...extra()});
     toast(`저장했습니다 · 파일 ${r.files.length}개${r.warnings?.length ? ' · 주의 ' + r.warnings.length + '건' : ''}`);
     if (r.character) reset(r.character);
     onSaved(r); return;
    }
   } catch (error) { toast(error.message); }
   rerender();
  });
 }
 function payload() {
  const out = {slots: {}};
  for (const [k, s] of Object.entries(slots)) {
   if (!s.changed) continue;
   out.slots[k] = s.unlink ? null : {src: s.src, t: round(s.t)};
  }
  if (face.changed) out.face = face.file ? {mode: 'file', src: face.fileSrc} : face.box ? {mode: 'box', box: face.box} : undefined;
  if (out.face && out.face.mode === 'box' && !hasImage('base')) delete out.face;
  return out;
 }
 return {reset, html, draw, bind, dirty};
}
