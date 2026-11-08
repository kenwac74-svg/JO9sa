'use strict';
// 사운드 청취 목록(청취_목록.html)을 기록 문서에서 만든다.
// - 전투 효과음·몬스터 등장음: records/audio-planning-20261106 의 Pixabay 후보 (내려받지 않고 원본 페이지로 연결)
// - 지역 BGM 비교: docs/NEXT_PATCH_AUDIO_20261106_KO.md 의 표 + 현재 WORK MP3 재생
// 게임 파일은 읽기만 한다. 실행: node tools/sound-audition/build.cjs
const fs = require('fs'), path = require('path');
const { scriptJson } = require('./audio-library.cjs');
let R = path.resolve(__dirname, '../..'), out = path.join(__dirname, '청취_목록.html');
for (let i = 2; i < process.argv.length; i++) {
  const flag = process.argv[i];
  if (!['--repo', '--out'].includes(flag) || !process.argv[i + 1]) throw new Error('사용법: node build.cjs [--repo 저장소] [--out HTML경로]');
  if (flag === '--repo') R = path.resolve(process.argv[++i]);
  else out = path.resolve(process.argv[++i]);
}
const rec = R + '/records/audio-planning-20261106';
const cand = JSON.parse(fs.readFileSync(rec + '/pixabay-candidates.json', 'utf8'));
const md = fs.readFileSync(rec + '/MONSTER_INTRO_SFX_KO.md', 'utf8');
const doc = fs.readFileSync(R + '/docs/NEXT_PATCH_AUDIO_20261106_KO.md', 'utf8');
const cfg = JSON.parse(fs.readFileSync(R + '/local.config.json', 'utf8').replace(/^﻿/, ''));
const snd = path.join(cfg.GameRoot, 'game', 'content', 'snd');
const fileUrl = p => 'file:///' + p.split(path.sep).map((seg, i) => i === 0 ? seg : encodeURIComponent(seg)).join('/');
const approvalPath = path.join(__dirname, 'approved-selections.json');
const approved = fs.existsSync(approvalPath) ? JSON.parse(fs.readFileSync(approvalPath, 'utf8')) : { entries: [], extraCandidates: [], decisions: [] };
const approvedByKey = new Map((approved.entries || []).map(entry => [entry.key, entry]));
for (const candidate of approved.extraCandidates || []) if (!cand.candidates.some(item => item.url === candidate.url)) cand.candidates.push(candidate);

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tableRows = (text, headerRe) => text.split(/\r?\n/)
  .filter(l => /^\| /.test(l) && !headerRe.test(l) && !/^\|\s*-/.test(l))
  .map(l => l.split('|').slice(1, -1).map(x => x.trim()));

// Pixabay 후보 칸: "3초 · 제작자 · [제목](url)" 또는 "3초 · 제작자 · **메모** · [제목](url)"
const cell = c => {
  if (c === '—') return null;
  const m = c.match(/^(\d+)초 · ([^·]+?) · (?:\*\*(.+?)\*\* · )?\[(.+?)\]\((.+?)\)$/);
  return m && { seconds: +m[1], creator: m[2].trim(), note: m[3] || '', title: m[4], url: m[5] };
};
const slot = (key, filename = '', baseline = '') => `<div class="local-slot" data-row-key="${esc(key)}" data-filename="${esc(filename)}" data-baseline="${esc(baseline)}"></div>`;
const pick = (t, key) => {
  if (!t) return '<span class="none">—</span>';
  const chosen = approvedByKey.get(key);
  const baseline = chosen ? fileUrl(path.join(snd, chosen.filename)) : '';
  const selected = chosen ? `<div class="approved-audio"><b>${esc(chosen.label)}</b><span> · ${esc(chosen.sourceName)} → ${esc(chosen.filename)}</span><audio controls preload="none" src="${esc(baseline)}"></audio></div>` : '';
  const comparison = chosen && chosen.sourcePage !== t.url ? '이전 후보 비교: ' : '';
  return selected + `<a class="snd" href="${esc(t.url)}" target="_blank" rel="noopener"><b>${esc(comparison + t.title)}</b><span>${t.seconds}초 · ${esc(t.creator)}${t.note ? ' · <em>' + esc(t.note) + '</em>' : ''}</span></a>${slot(key, chosen?.filename || '', baseline)}`;
};
const table = (head, body) => `<div class="wrap"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;

// 전투 효과음
const combat = cand.combatSelection.assets.map(x =>
  `<tr><td>${esc(x.label)}</td><td>${esc(x.when)}</td><td>${pick(x, 'combat:' + x.label)}${x.selectedBy === 'user' ? '<span class="tag">사용자 지정</span>' : ''}</td></tr>`).join('');
const others = cand.candidates.filter(c => !cand.combatSelection.assets.some(a => a.url === c.url))
  .map(c => `<tr><td><code>${esc(c.role === 'defeat' ? '게임오버' : c.role)}</code></td><td>${pick(c, 'other:' + c.role + ':' + c.url)}</td></tr>`).join('');

// 몬스터 등장음
let mobs = '', mobCount = 0;
for (const part of md.split(/\r?\n## /).slice(1)) {
  const name = part.split(/\r?\n/)[0].trim();
  const rows = tableRows(part, /^\| 몬스터/).map(c => ({ name: c[0], key: c[1].replace(/`/g, ''), a: cell(c[3]), b: cell(c[4]) }));
  if (!rows.length) continue;
  mobCount += rows.reduce((t, r) => t + !!r.a + !!r.b, 0);
  mobs += `<h2>${esc(name)} 등장음</h2>` + table(['몬스터', '게임 키', '후보 A', '후보 B'],
    rows.map(r => `<tr><td>${esc(r.name)}</td><td><code>${esc(r.key)}</code></td><td>${pick(r.a, 'monster:' + r.key + ':a')}</td><td>${pick(r.b, 'monster:' + r.key + ':b')}</td></tr>`).join(''));
}

// 지역 BGM
const sndFiles = fs.existsSync(snd) ? fs.readdirSync(snd) : [];
const player = (name, key) => {
  // Keep review/assignment keys stable while resolving the current WORK music format.
  const mp3Name = name.replace(/\.wav$/i, '.mp3');
  const real = sndFiles.find(x => x.toLowerCase() === mp3Name.toLowerCase())
    || sndFiles.find(x => x.toLowerCase() === name.toLowerCase());
  const baseline = real ? fileUrl(path.join(snd, real)) : '';
  return (real
    ? `<div class="bgm"><code>${esc(real)}</code><audio controls preload="none" src="${esc(fileUrl(path.join(snd, real)))}"></audio></div>`
    : `<div class="bgm"><code>${esc(name)}</code> <span class="none">파일 없음</span></div>`) + slot(key, real || name, baseline);
};
const sec = (doc.split('## 지역별 BGM 재배치 검토 순서')[1] || '').split(/\r?\n## /)[0];
const wavs = s => [...s.matchAll(/`([^`]+\.wav)`/g)].map(m => m[1]);
const bgmSeen = new Set(['chinatown.wav']);
const bgmRows = tableRows(sec, /^\| 공간/).map(c => {
  const files = [...new Set([...wavs(c[1]), ...wavs(c[2])])];
  files.forEach(f => bgmSeen.add(f.toLowerCase()));
  return `<tr><td>${esc(c[0])}</td><td>${esc(c[1].replace(/`/g, ''))}</td><td>${files.map(file => player(file, 'bgm:' + c[0] + ':' + file.toLowerCase())).join('') || '—'}</td></tr>`;
}).join('') + `<tr><td>미연결 후보</td><td>장소 미정</td><td>${player('chinatown.wav', 'bgm:unassigned:chinatown.wav')}</td></tr>` + `<tr><td>게임오버 화면</td><td>해당 화면에서만 재생</td><td>${player('gameoverbgm.mp3', 'bgm:gameover:gameoverbgm.mp3')}</td></tr>`;

const inlineScript = source => source.replace(/<\/script/gi, '<\\/script');
const config = { storageKey: 'jo9-sound-audition-v1', reviews: [['remake', '재제작'], ['adopted', '채택'], ['hold', '보류']], decisions: approved.decisions || [] };
const libraryScript = 'window.JO9AudioConfig=' + scriptJson(config) + ';\n' + fs.readFileSync(path.join(__dirname, 'audio-library.cjs'), 'utf8');
const browserScript = fs.readFileSync(path.join(__dirname, 'browser.js'), 'utf8');

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JO9 사운드 청취 목록</title><style>
:root{--bg:#f6f4ef;--fg:#222;--mut:#6b6558;--line:#ddd6c8;--card:#fff;--acc:#8a5a12}
@media (prefers-color-scheme:dark){:root{--bg:#17150f;--fg:#eee8dc;--mut:#a59c8a;--line:#3a352a;--card:#211e17;--acc:#e0b062}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 "Malgun Gothic",system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:20px 16px 60px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:28px 0 8px;color:var(--acc)}
.lead{color:var(--mut);margin:0 0 6px}table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line)}
th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:12px;color:var(--mut);font-weight:600}
code{font-size:12px;color:var(--mut)}a.snd{display:block;color:var(--fg);text-decoration:none}a.snd:hover b{color:var(--acc);text-decoration:underline}
a.snd span{display:block;font-size:12px;color:var(--mut)}.none{color:var(--mut)}.tag{display:inline-block;margin-top:2px;font-size:11px;padding:0 6px;border:1px solid var(--acc);color:var(--acc);border-radius:9px}
.wrap{overflow-x:auto}.bgm{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0}.bgm code{min-width:120px}.bgm audio{height:30px;max-width:100%}
nav a{color:var(--acc);margin-right:12px}button,select{font:inherit;color:var(--fg);background:var(--card);border:1px solid var(--line);border-radius:5px;padding:5px 8px}button{cursor:pointer}button:hover{border-color:var(--acc)}button:disabled{opacity:.5;cursor:default}
.toolbar,.local-controls,.reviews{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.toolbar{margin:14px 0 8px}.local-slot{border-top:1px dashed var(--line);margin:7px 0 12px;padding-top:7px}.local-controls select{max-width:240px;min-width:140px}.local-info{font-size:12px;color:var(--mut);margin:5px 0}.local-slot audio,.personal-item audio{height:32px;max-width:100%}.reviews{margin-top:6px}.review{font-size:12px}.review.selected{border-color:var(--acc);background:var(--acc);color:var(--bg);font-weight:bold}.personal-item{padding:9px 0;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:10px;align-items:center}.personal-item code{overflow-wrap:anywhere;flex:1 1 220px}.personal-item .reviews{margin:0}#library-message:empty{display:none}
</style></head><body><main>
<h1>JO9 사운드 청취 목록</h1>
<p class="lead">다음 패치 사운드 후보입니다. 효과음 항목은 Pixabay 원본 페이지가 새 창에서 열리고 그 페이지 플레이어로 듣습니다(길이는 페이지 표시 기준). 지역 BGM은 게임 폴더의 원본을 이 페이지에서 바로 재생합니다. 게임에는 아무것도 적용되지 않았습니다.</p>
<p class="lead">전투 결과 효과음 ${cand.combatSelection.assets.length}개 · 몬스터 등장음 ${mobCount}개 · 지역 BGM ${bgmSeen.size}곡 · 기타 효과음 후보 ${cand.candidates.length - cand.combatSelection.assets.length}개</p>
<div class="toolbar"><button id="folder-button" type="button">폴더 선택</button><button id="files-button" type="button">음원 파일 추가</button><button id="export-button" type="button">설정 내보내기</button><button id="import-button" type="button">설정 불러오기</button></div>
<input id="folder-input" type="file" webkitdirectory directory multiple hidden><input id="files-input" type="file" accept="audio/*,.wav,.mp3,.ogg,.oga,.opus,.m4a,.aac,.flac,.aif,.aiff,.webm,.weba" multiple hidden><input id="row-file-input" type="file" accept="audio/*,.wav,.mp3,.ogg,.oga,.opus,.m4a,.aac,.flac,.aif,.aiff,.webm,.weba" hidden><input id="settings-input" type="file" accept="application/json,.json" hidden>
<p class="lead">내 폴더·파일은 이 브라우저에서만 재생합니다. 이름·상대경로·배정·검토 상태만 저장하며 음원 데이터는 복사하거나 업로드하지 않습니다. 다시 열면 재생할 폴더/파일을 재선택하세요. 폴더 선택이 지원되지 않으면 음원 파일 추가를 사용하세요.</p>
<p class="lead">각 음원의 재제작·채택·보류는 검토 표시이며 게임에 적용하지 않습니다. 같은 버튼을 다시 누르면 해제됩니다.</p>
<p id="library-status" class="lead" aria-live="polite"></p><p id="library-message" class="local-info" role="status"></p>
<nav><a href="#personal">내 음원</a><a href="#combat">전투 효과음</a><a href="#bgm">지역 BGM</a><a href="#mob">몬스터 등장음</a><a href="#etc">기타 후보</a></nav>
<h2 id="personal">내 음원</h2><div id="personal-audio"></div>
<h2 id="combat">전투 결과 효과음 (선정안)</h2>${table(['사건', '재생 시점', '음원'], combat)}
<h2 id="bgm">지역 BGM — 기존 곡 먼저 비교</h2><p class="lead">파일이 커서 재생 버튼을 누를 때만 불러옵니다.</p>${table(['공간', '현재 기본음악', '들어볼 곡'], bgmRows)}
<div id="mob">${mobs}</div>
<h2 id="etc">기타 전투 효과음 후보</h2>${table(['역할', '음원'], others)}
<p class="lead" style="margin-top:24px">출처: records/audio-planning-20261106, docs/NEXT_PATCH_AUDIO_20261106_KO.md · <a href="${esc(cand.sourceLicensePage)}" target="_blank" rel="noopener">Pixabay 라이선스 요약</a></p>
</main><script>${inlineScript(libraryScript)}</script><script>${inlineScript(browserScript)}</script></body></html>`;
fs.writeFileSync(out, html);
console.log(JSON.stringify({ out, combat: cand.combatSelection.assets.length, monster: mobCount, bgm: bgmSeen.size }));
