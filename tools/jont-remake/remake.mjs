#!/usr/bin/env node
// JoNT 캐릭터 그림 다시 그리기
//  1) describe : 원본 폴더 그림을 OpenRouter 비전 모델로 "장면 프롬프트"로 푼다 (원본 캐릭터 외형은 빼고)
//  2) generate : 지정한 캐릭터 외형 + 장면 프롬프트로 Mage.space API에 그리게 하고, 같은 파일 이름(번호만 바꿈)으로 저장
//
// 사용:  node remake.mjs <describe|generate|all|status> [--config config.json] [--limit N] [--only key1,key2] [--dry-run] [--force]
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'

// ── 안전장치 (설정으로 끌 수 없음) ─────────────────────────────
const SAFE_POS_TAGS = 'adult, mature female'
const SAFE_POS_PROSE = 'Every person in the image is clearly an adult.'
const SAFE_NEG = 'child, loli, underage, young girl, kid, toddler, teen, aged down, petite child body'
const AGE_WORDS = /\b(loli|lolita|child|children|kid|kids|toddler|underage|minor|teen|teenage|young girl|little girl|schoolgirl|elementary|shota|aged down)\b/i
// 기본으로 건너뛰는 커맨드: 폭력·고문·자해, 강간, 동물과의 성행위, 배설 계열
const EXCLUDED = new Set(['rape', 'suicide', 'beat', 'hit', 'slap', 'whip', 'lash', 'cane', 'belt', 'spank', 'slipper', 'branding', 'rack', 'rope_rack', 'rope_saddle', 'woodhorse', 'hang_legs', 'painful', 'selfpain', 'pinch', 'acetic_infusion', 'urine', 'public_urinal', 'public_use', 'humiliation', 'enema', 'fisting', 'analfisting', 'bondage_milk', 'dog', 'horse', 'pig', 'spider', 'tentacles'])

// setx 로 넣은 키는 이미 열린 창에 안 보이므로, Windows 사용자 환경변수에서 한 번 더 읽는다
import { execFileSync } from 'node:child_process'
for (const name of ['MAGE_API_KEY', 'OPENROUTER_API_KEY']) {
  if (process.env[name] || process.platform !== 'win32') continue
  try {
    const v = execFileSync('powershell', ['-NoProfile', '-Command', `[Environment]::GetEnvironmentVariable('${name}','User')`], { encoding: 'utf8' }).trim()
    if (v) process.env[name] = v
  } catch { }
}

// 외부 회사 모델이라 성인 그림을 막는 Mage 모델: 목록에서 제외
const CENSORED_ARCH = new Set(['gpt_image_2', 'grok_image', 'nano_banana_v2', 'seedream', 'minimax_h3_image'])

// ── 인자·설정 ────────────────────────────────────────────────
const argv = process.argv.slice(2)
const cmd = argv[0]
const flag = (n) => argv.includes('--' + n)
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d }
if (!['describe', 'export', 'serve', 'generate', 'all', 'status', 'models', 'try-model', 'pick-model'].includes(cmd)) {
  console.log('사용법: node remake.mjs <describe|serve|export|pick-model|generate|all|status|models|try-model> [--config config.json] [--limit N] [--only key1,key2] [--model ID] [--dry-run] [--force]')
  console.log('  serve               : 작업표를 로컬 서버로 열기 (샘플 이미지 해석 가능, --port 8790)')
  console.log('  pick-model          : OpenRouter 해석 모델 고르기 (--find 이름, --set 모델ID)')
  console.log('  describe            : 원본 그림 → 장면 프롬프트 (OpenRouter)')
  console.log('  export              : 웹에서 쓸 프롬프트 목록 (HTML·CSV·JSON)')
  console.log('  models              : API가 받는 모델·model_id 목록 (--find 이름 으로 거르기)')
  console.log('  try-model --id <ID> : 그 model_id 를 API가 받는지 한 장으로 시험 (거절되면 Gems 안 나감)')
  process.exit(1)
}

// pick-model: OpenRouter 의 이미지 입력 모델을 보여 주고, 고른 모델을 config.json 에 저장
if (cmd === 'pick-model') {
  const cfgP = path.resolve(opt('config', path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'config.json')))
  // 2026-11-15 2571 폴더 시험 결과 (성인 장면 통과 · 정확도)
  const TESTED = {
    'x-ai/grok-4.7': '추천 · 가장 정밀',
    'x-ai/grok-4.3': '추천 · 정확, 4.7의 절반 값',
    'qwen/qwen3-vl-235b-a22b-instruct': '통과 · 체위 표기가 가끔 엇갈림',
    'minimax/minimax-m3.1-flash': '통과 · 싸고 복장 자세함, 상대 인물을 놓침',
    'mistralai/mistral-medium-3-5': '통과 · 상대 인물을 놓침',
    'z-ai/glm-4.6v': '일부 거부',
    'google/gemini-2.5-flash': '성인 장면 거부',
  }
  const j = await (await fetch('https://openrouter.ai/api/v1/models')).json()
  const find = (opt('find', '') || '').toLowerCase()
  const per = m => { const i = +m.pricing.prompt * 1e6, o = +m.pricing.completion * 1e6; return { i, o, img: i * 1.5e-3 + o * 0.7e-3 } } // 그림 1장 ≈ 입력 1.5k · 출력 0.7k 토큰
  let list = j.data.filter(m => (m.architecture?.input_modalities || []).includes('image'))
    .filter(m => !find || (m.id + ' ' + m.name).toLowerCase().includes(find))
  const order = Object.keys(TESTED), rank = id => (order.indexOf(id) + 1) || 999
  list.sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id))
  const setId = opt('set', '')
  const save = id => {
    const txt = fs.readFileSync(cfgP, 'utf8')
    const out = txt.replace(/("openrouter"\s*:\s*\{[\s\S]*?"model"\s*:\s*")([^"]*)(")/, `$1${id}$3`)
    fs.writeFileSync(cfgP, out)
    console.log(`\n해석 모델을 ${id} 로 저장했어요 (${cfgP})`)
  }
  if (setId) {
    if (!j.data.some(m => m.id === setId)) { console.error(`OpenRouter 에 ${setId} 모델이 없어요.`); process.exit(1) }
    save(setId); process.exit(0)
  }
  const cur = (() => { try { return JSON.parse(fs.readFileSync(cfgP, 'utf8').replace(/^﻿/, '')).openrouter?.model } catch { return '' } })()
  list.forEach((m, i) => {
    const p = per(m)
    console.log(`${String(i + 1).padStart(3)}. ${m.id === cur ? '▶ ' : '  '}${m.id.padEnd(46)} 517장 약 $${(p.img * 517).toFixed(2).padStart(6)}  ${TESTED[m.id] || ''}`)
  })
  console.log(`\n지금 모델: ${cur || '(없음)'} · 이미지 입력 모델 ${list.length}개${find ? ` ("${find}" 검색)` : ''}`)
  if (!process.stdin.isTTY) { console.log('번호로 고르려면 터미널에서 직접 실행하거나, --set <모델ID> 를 쓰세요.'); process.exit(0) }
  const rl = (await import('node:readline/promises')).createInterface({ input: process.stdin, output: process.stdout })
  const ans = (await rl.question('번호 또는 모델 ID (그냥 Enter = 그대로): ')).trim(); rl.close()
  if (!ans) process.exit(0)
  const chosen = /^\d+$/.test(ans) ? list[+ans - 1]?.id : ans
  if (!chosen || !j.data.some(m => m.id === chosen)) { console.error('목록에 없는 선택이에요.'); process.exit(1) }
  save(chosen); process.exit(0)
}

// models: GET /v1/architectures 를 읽어 성인 그림이 되는 모델만 보여 준다
if (cmd === 'models' || cmd === 'try-model') {
  const cfgP = path.resolve(opt('config', path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'config.json')))
  const cfg = fs.existsSync(cfgP) ? JSON.parse(fs.readFileSync(cfgP, 'utf8').replace(/^﻿/, '')) : {}
  const key = process.env.MAGE_API_KEY || cfg.mage?.apiKey
  if (!key) { console.error('MAGE_API_KEY 가 없어요.'); process.exit(1) }
  const H = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  if (cmd === 'models') {
    const r = await fetch('https://api.mage.space/v1/architectures', { headers: H })
    const raw = await r.text()
    const dir = path.join(path.dirname(cfgP), 'work'); fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'architectures.json'), raw)
    let body; try { body = JSON.parse(raw) } catch { console.log(raw.slice(0, 2000)); process.exit(1) }
    const arr = Array.isArray(body) ? body : body.data || body.architectures || Object.values(body)
    const find = (opt('find', '') || '').toLowerCase()
    for (const a of Array.isArray(arr) ? arr : []) {
      const id = a.id || a.architecture || a.name
      if (CENSORED_ARCH.has(id)) continue
      const s = JSON.stringify(a)
      // model_id 의 enum 과, 이름이 붙어 있으면 이름도 함께
      const enums = [...s.matchAll(/"model_id"[\s\S]*?"enum"\s*:\s*\[([^\]]*)\]/g)].flatMap(m => m[1].split(',').map(x => x.trim().replace(/^"|"$/g, '')))
      const names = [...s.matchAll(/"(?:name|title|label|display_name)"\s*:\s*"([^"]+)"/g)].map(m => m[1])
      const hay = (id + ' ' + names.join(' ') + ' ' + enums.join(' ')).toLowerCase()
      if (find && !hay.includes(find)) continue
      console.log(`\n■ ${id}  (model_id ${enums.length}개)`)
      enums.slice(0, 200).forEach(e => console.log('   ' + e))
      if (names.length) console.log('   이름: ' + [...new Set(names)].slice(0, 60).join(' | '))
    }
    console.log(`\n전체 응답 저장: ${path.join(dir, 'architectures.json')}`)
    process.exit(0)
  }
  // try-model: 아주 짧은 프롬프트로 한 장. model_id 가 틀리면 400 invalid_config (과금 없음)
  const arch = opt('arch', cfg.mage?.architecture || 'sdxl_plus')
  if (CENSORED_ARCH.has(arch)) { console.error(`${arch} 는 제외한 모델이에요.`); process.exit(1) }
  const id = opt('id', '')
  const r = await fetch(`https://api.mage.space/v1/${arch}/generate`, { method: 'POST', headers: H, body: JSON.stringify({ prompt: 'adult woman, portrait, simple background', aspect_ratio: '1:1', ...(id ? { model_id: id } : {}) }) })
  const t = await r.text()
  console.log(`HTTP ${r.status}\n${t.slice(0, 1500)}`)
  process.exit(r.ok ? 0 : 1)
}
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const configPath = path.resolve(opt('config', path.join(here, 'config.json')))
if (!fs.existsSync(configPath)) { console.error(`설정 파일이 없어요: ${configPath}\nconfig.example.json 을 복사해서 config.json 을 만드세요.`); process.exit(1) }
const C = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^﻿/, ''))
if (opt('model', '')) C.openrouter.model = opt('model', '')
const LIMIT = Number(opt('limit', 0)) || Infinity
const ONLY = opt('only', '') ? new Set(opt('only', '').split(',').map(s => s.trim())) : null
const DRY = flag('dry-run')
const FORCE = flag('force')

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || C.openrouter?.apiKey || ''
const MAGE_KEY = process.env.MAGE_API_KEY || C.mage?.apiKey || ''

const srcDir = path.resolve(C.sourceFolder)
const srcId = C.sourceId || path.basename(srcDir)
const tgtId = String(C.target.id)
const outDir = path.resolve(C.outputFolder || path.join(path.dirname(srcDir), tgtId))
const workDir = path.resolve(here, 'work', `${srcId}_to_${tgtId}`)
fs.mkdirSync(workDir, { recursive: true })
const statePath = path.join(workDir, 'state.json')
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { items: {} }
const saveState = () => fs.writeFileSync(statePath, JSON.stringify(state, null, 2))

if (CENSORED_ARCH.has(C.mage.architecture)) {
  console.error(`mage.architecture "${C.mage.architecture}" 는 성인 그림을 막는 모델이라 쓰지 않아요. stable_diffusion_xl · sdxl_plus · anima 등을 고르세요.`)
  process.exit(1)
}
for (const k of ['tags', 'prose', 'trigger']) {
  if (AGE_WORDS.test(C.target[k] || '')) { console.error(`target.${k} 에 아동을 뜻하는 말이 있어요. 성인 캐릭터만 만들 수 있어요.`); process.exit(1) }
}

// ── 원본 목록 ────────────────────────────────────────────────
const IMG = /\.(png|jpe?g|webp)$/i
function keyOf(file) {
  let b = file.replace(IMG, '')
  if (b.startsWith(srcId + '_')) b = b.slice(srcId.length + 1)
  return b.replace(/_\d+$/, '')
}
function outName(file) {
  const ext = '.png'
  const base = file.replace(IMG, '')
  return (base.startsWith(srcId + '_') ? tgtId + base.slice(srcId.length) : `${tgtId}_${base}`) + ext
}
const files = fs.readdirSync(srcDir).filter(f => IMG.test(f)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
const list = files.map(f => ({ file: f, key: keyOf(f), out: outName(f) }))
  .filter(x => !ONLY || ONLY.has(x.key))
const skippedKeys = [...new Set(list.filter(x => EXCLUDED.has(x.key)).map(x => x.key))]
const work = list.filter(x => !EXCLUDED.has(x.key))

// ── 도구 ────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms))
const mimeOf = f => /\.png$/i.test(f) ? 'image/png' : /\.webp$/i.test(f) ? 'image/webp' : 'image/jpeg'
const dataUrl = f => `data:${mimeOf(f)};base64,${fs.readFileSync(f).toString('base64')}`
function pngSize(f) {
  const d = Buffer.alloc(24); const fd = fs.openSync(f, 'r'); fs.readSync(fd, d, 0, 24, 0); fs.closeSync(fd)
  return d.toString('ascii', 1, 4) === 'PNG' ? { w: d.readUInt32BE(16), h: d.readUInt32BE(20) } : null
}
let sharp = null
for (const p of [C.sharpPath, path.join(here, 'node_modules', 'sharp'), path.resolve(here, '..', 'Sixth Sense 1.0 배포용', 'easygen', 'node_modules', 'sharp')].filter(Boolean)) {
  try { sharp = createRequire(import.meta.url)(p); break } catch { }
}
async function fetchJson(url, init, tries = 4) {
  let last
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, init)
      const text = await r.text()
      let body; try { body = JSON.parse(text) } catch { body = { raw: text } }
      if (r.status === 429 || r.status >= 500) { last = new Error(`HTTP ${r.status} ${text.slice(0, 300)}`); await sleep(2000 * 2 ** i); continue }
      return { status: r.status, body }
    } catch (e) { last = e; await sleep(2000 * 2 ** i) }
  }
  throw last
}
async function pool(items, n, fn) {
  let i = 0
  await Promise.all(Array.from({ length: Math.max(1, n) }, async () => { while (i < items.length) { const it = items[i++]; await fn(it) } }))
}

// ── 1단계: 그림 → 장면 프롬프트 (OpenRouter) ─────────────────
// 장면을 항목별로 나눠 받는다. 작업표에서 항목을 골라 켜고 끄거나 의상을 일괄로 바꿀 수 있다.
const FIELDS = [
  ['action', '동작', 'what she is doing / the sex act or activity'],
  ['pose', '자세', 'body position and posture (standing, kneeling, bent over, legs crossed...)'],
  ['expression', '표정', 'facial expression and gaze (no face features)'],
  ['outfit', '의상', 'every garment and accessory she wears: type, colour, material. Write "nude" if she wears nothing'],
  ['outfit_state', '옷 상태', 'how the clothes are worn: open, pulled down, lifted, removed, wet, torn. Empty if worn normally'],
  ['partner', '상대', 'other people and what they do (men are faceless; partly visible partners count). Empty if alone'],
  ['props', '소품', 'objects she holds or that matter in the scene'],
  ['background', '배경', 'place, room, furniture, scenery'],
  ['lighting', '조명', 'light source, time of day, mood of light'],
  ['camera', '구도', 'shot size and camera angle (cowboy shot, from side, from below...)'],
]
const FIELD_IDS = FIELDS.map(f => f[0])

const VISION_SYSTEM = `You turn a reference illustration into a structured image-generation prompt so the SAME scene can be redrawn with a DIFFERENT woman.
Do NOT describe the main woman's identity or looks at all: no hair colour or hairstyle, eye colour, skin tone, ethnicity, face features, makeup, breast size, body type, height or age words. Refer to her only as "the woman" / "she". Her look comes from a separate saved character.
Clothing is REQUIRED and goes only in "outfit" and "outfit_state".
Count people carefully: partners are often only partly visible (a man lying under her, hands or legs at the frame edge). Name the exact sex position or act.
For each field give "tags" (booru / WD14 style, comma-separated, as many as useful) and "text" (one short plain English phrase or sentence). Leave both empty if a field does not apply.
Fields:
${FIELDS.map(([id, , d]) => `- ${id}: ${d}`).join('\n')}
All people must be adults. If anyone looks like a minor, or you are unsure, set "adult_only" to false.
Reply with JSON only, no code fence:
{"adult_only": true, "count": "1girl, solo | 1girl, 1boy | 1girl, multiple boys | 2girls ...", "fields": {${FIELD_IDS.map(id => `"${id}": {"tags": "", "text": ""}`).join(', ')}}}`

async function describe(item) {
  const st = state.items[item.file] ||= {}
  if (st.scene?.fields && !FORCE) return
  if (DRY) { console.log(`[describe] ${item.file} (dry-run)`); return }
  const body = {
    model: C.openrouter.model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: VISION_SYSTEM },
      { role: 'user', content: [
        { type: 'text', text: `Game command for this picture: "${item.key}". ${C.openrouter.extraInstruction || ''}`.trim() },
        { type: 'image_url', image_url: { url: dataUrl(path.join(srcDir, item.file)) } },
      ] },
    ],
  }
  const { status, body: res } = await fetchJson('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json', 'X-Title': 'jont-remake' },
    body: JSON.stringify(body),
  })
  const text = res?.choices?.[0]?.message?.content
  if (status !== 200 || !text) { st.describeError = `HTTP ${status}: ${JSON.stringify(res).slice(0, 300)}`; console.log(`  ✗ ${item.file}: ${st.describeError}`); return }
  const m = String(text).match(/\{[\s\S]*\}/)
  let scene; try { scene = JSON.parse(m ? m[0] : text) } catch { st.describeError = '모델 답이 JSON이 아님: ' + String(text).slice(0, 200); console.log(`  ✗ ${item.file}: ${st.describeError}`); return }
  if (scene.adult_only !== true || AGE_WORDS.test(JSON.stringify(scene.fields || {}))) {
    st.blocked = '미성년자로 보이거나 확실하지 않음 → 건너뜀'; delete st.scene; console.log(`  ⊘ ${item.file}: ${st.blocked}`); return
  }
  const fields = {}
  for (const id of FIELD_IDS) {
    const f = scene.fields?.[id] || {}
    fields[id] = { tags: String(f.tags || '').trim(), text: String(f.text || '').trim() }
  }
  delete st.describeError; delete st.blocked
  st.scene = { count: String(scene.count || '').trim(), fields, model: C.openrouter.model }
  console.log(`  ✓ ${item.file}`)
}

// ── 2단계: 프롬프트 조립 ─────────────────────────────────────
const split = s => String(s || '').split(',').map(t => t.trim()).filter(Boolean)
const join = (...a) => { const seen = new Set(); return a.flatMap(split).filter(t => { const k = t.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true }).join(', ') }
// 남은 원본 캐릭터 외형(머리·눈·피부·체형)을 걷어 낸다
const IDENTITY = /\b(hair|haired|ponytail|twintails|braid|bangs|eyes|eyed|skin|skinned|tan|tanned|dark-skinned|pale|lips|makeup|freckles|breasts|flat chest|petite|curvy|plump|muscular|slim|slender|thick thighs|wide hips|tall|short stature)\b/i
const IDENTITY_PROSE = /[^.,;]*\b(hair|eyes|skin|lips|freckles|breasts|figure|curvy|slender|petite)\b[^.,;]*[.,;]?/gi
// 머리 장식·안경 같은 복장 태그·말은 외형이 아니라 옷이므로 남긴다
const OUTFIT_OK = /\b(hair (?:ornament|ribbon|flower|bow|clip|band|pin|tie|stick)|hairband|hairclip|headband|eyewear|eyepatch|eye mask|blindfold|skin ?suit|bodysuit|wet hair|messy hair|exposed breasts|breasts out|bare breasts)\b/i
const cleanTags = s => split(s).filter(x => OUTFIT_OK.test(x) || !IDENTITY.test(x)).join(', ')
const cleanText = (s, id) => id === 'outfit' || id === 'outfit_state' ? String(s || '') : String(s || '').replace(IDENTITY_PROSE, ' ').replace(/\s+([.,;])/g, '$1').replace(/\s{2,}/g, ' ').trim()

/** 상태 파일의 장면을 항목별로 정리 (외형 걷어 냄). 예전 형식(tags/prose)도 받아 준다. */
function sceneFields(scene) {
  const out = {}
  if (scene.fields) for (const id of FIELD_IDS) out[id] = { tags: cleanTags(scene.fields[id]?.tags), text: cleanText(scene.fields[id]?.text, id) }
  else { for (const id of FIELD_IDS) out[id] = { tags: '', text: '' }; out.action = { tags: cleanTags(scene.tags), text: cleanText(scene.prose) }; out.camera = { tags: cleanTags(scene.framing), text: '' } }
  return { count: scene.count || '', fields: out }
}
const isNude = f => /\b(nude|naked|nothing)\b/i.test(`${f.outfit.tags} ${f.outfit.text}`)

/** 고른 항목·의상 바꾸기를 반영해 프롬프트를 만든다 (작업표 HTML 도 같은 규칙을 쓴다). */
function buildPrompt(scene, o = {}) {
  const t = C.target, style = o.style || C.style || 'tags'
  const { count, fields } = sceneFields(scene)
  const use = o.use || FIELD_IDS
  const f = JSON.parse(JSON.stringify(fields))
  if (o.outfit && !(o.keepNude !== false && isNude(f))) { f.outfit = { tags: o.outfit, text: `She wears ${o.outfit}.` }; if (o.dropState) f.outfit_state = { tags: '', text: '' } }
  const mention = t.mageMention ? `@${String(t.mageMention).replace(/^@/, '')}` : ''
  const withLook = t.includeAppearance !== false
  if (style === 'prose') {
    const parts = use.map(id => f[id].text).filter(Boolean).map(s => /[.!?]$/.test(s) ? s : s + '.')
    return [mention, C.prosePrefix, withLook && t.prose ? `The woman is ${t.prose}.` : '', ...parts, SAFE_POS_PROSE].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  }
  const tags = join(mention, C.tagPrefix, count, SAFE_POS_TAGS, withLook ? t.trigger : '', withLook ? t.tags : '', ...use.map(id => f[id].tags))
  // Anima 는 괄호를 가중치로 읽어서, 글자 그대로의 괄호가 있으면 400 오류 → 가중치 꼴 (태그:1.2) 이 아닌 괄호만 이스케이프
  return C.mage.architecture === 'anima' ? tags.replace(/\((?![^()]*:\s*[\d.]+\))([^()]*)\)/g, '\\($1\\)') : tags
}
const negative = () => join(C.negative, SAFE_NEG)


// ── 3단계: Mage.space 생성 ───────────────────────────────────
const MAGE = 'https://api.mage.space/v1'
let archFields = null
async function loadArch() {
  try {
    const { status, body } = await fetchJson(`${MAGE}/architectures`, { headers: { Authorization: `Bearer ${MAGE_KEY}` } }, 2)
    if (status !== 200) return
    const arr = Array.isArray(body) ? body : body.data || body.architectures || Object.values(body)
    const a = (Array.isArray(arr) ? arr : []).find(x => x && (x.id === C.mage.architecture || x.architecture === C.mage.architecture || x.name === C.mage.architecture))
    if (a) archFields = JSON.stringify(a)
  } catch { }
}
const hasField = f => archFields ? archFields.includes(`"${f}"`) : null

async function generate(item) {
  const st = state.items[item.file] ||= {}
  const dest = path.join(outDir, item.out)
  if (!st.scene) return
  if (fs.existsSync(dest) && !FORCE) { st.done = true; return }
  const prompt = buildPrompt(st.scene)
  const body = { prompt, aspect_ratio: C.mage.aspectRatio || '5:4' }
  if (C.mage.modelId) body.model_id = C.mage.modelId
  if (C.mage.seed != null && C.mage.seed !== '') body.seed = Number(C.mage.seed)
  const sendNeg = hasField('negative_prompt') ?? /^(stable_diffusion|sdxl|anima|chroma)/.test(C.mage.architecture)
  if (sendNeg) body.negative_prompt = negative()
  // 참조 이미지: character = 지정 캐릭터 그림, source = 원본 장면 그림
  const refs = []
  for (const r of C.mage.references || []) {
    if (r === 'character' && C.target.referenceImage) refs.push(/^https?:/.test(C.target.referenceImage) ? C.target.referenceImage : dataUrl(path.resolve(here, C.target.referenceImage)))
    if (r === 'source') refs.push(dataUrl(path.join(srcDir, item.file)))
  }
  if (refs[0]) body.image = refs[0]
  if (refs.length > 1) body.additional_images = refs.slice(1)
  Object.assign(body, C.mage.extra || {})

  if (DRY) { console.log(`\n[generate] ${item.out}\n  PROMPT: ${prompt}\n  NEG: ${body.negative_prompt || '(안 보냄)'}\n  참조 이미지: ${refs.length}장`); return }

  const idem = crypto.createHash('sha256').update(JSON.stringify({ ...body, image: refs.length, additional_images: undefined, f: item.out, v: st.retry || 0 })).digest('hex').slice(0, 64)
  const { status, body: sub } = await fetchJson(`${MAGE}/${C.mage.architecture}/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${MAGE_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': idem },
    body: JSON.stringify(body),
  })
  if (status >= 400 || !sub?.request_id) { st.genError = `HTTP ${status}: ${JSON.stringify(sub).slice(0, 400)}`; console.log(`  ✗ ${item.out}: ${st.genError}`); return }
  gems += Number(sub.billing?.gems_charged || 0)
  let req = sub
  const t0 = Date.now()
  while (!req.result?.url && !['failed', 'error', 'canceled', 'cancelled', 'completed', 'succeeded'].includes(req.status)) {
    if (Date.now() - t0 > 15 * 60_000) { st.genError = '15분 안에 끝나지 않음'; console.log(`  ✗ ${item.out}: ${st.genError}`); return }
    await sleep(3000)
    const r = await fetchJson(sub.status_url || `${MAGE}/requests/${sub.request_id}/status`, { headers: { Authorization: `Bearer ${MAGE_KEY}` } })
    req = r.body
  }
  const url = req.result?.url || req.result?.images?.[0]?.url
  if (!url) {
    st.genError = `${req.status}: ${JSON.stringify(req.error || req).slice(0, 300)}`
    console.log(`  ✗ ${item.out}: ${st.genError}`); return
  }
  const img = Buffer.from(await (await fetch(url)).arrayBuffer())
  fs.mkdirSync(outDir, { recursive: true })
  const size = pngSize(path.join(srcDir, item.file))
  if (sharp && size && C.matchSourceSize !== false) await sharp(img).resize(size.w, size.h, { fit: 'cover', position: 'attention' }).png().toFile(dest)
  else if (sharp) await sharp(img).png().toFile(dest)
  else fs.writeFileSync(dest, img)
  delete st.genError
  st.done = true; st.prompt = prompt; st.requestId = sub.request_id; st.nsfwFlag = req.result?.moderation?.nsfw
  console.log(`  ✓ ${item.out}`)
}
let gems = 0

// ── 실행 ─────────────────────────────────────────────────────
console.log(`원본: ${srcDir} (${files.length}장, 번호 ${srcId})`)
console.log(`대상: ${outDir} (번호 ${tgtId})`)
if (skippedKeys.length) console.log(`기본으로 건너뜀(${list.length - work.length}장): ${skippedKeys.join(', ')}`)
const todo = work.slice(0, LIMIT)

if (cmd === 'status') {
  const s = work.map(x => state.items[x.file] || {})
  console.log(`처리 대상 ${work.length}장 · 장면 해석 완료 ${s.filter(x => x.scene).length} · 막힘 ${s.filter(x => x.blocked).length} · 해석 오류 ${s.filter(x => x.describeError).length} · 생성 완료 ${work.filter(x => fs.existsSync(path.join(outDir, x.out))).length} · 생성 오류 ${s.filter(x => x.genError).length}`)
  process.exit(0)
}
// ── 작업표 자료 · 샘플 라이브러리 ──────────────────────────────
const libraryPath = path.join(here, 'library.json')
const loadLibrary = () => { try { return JSON.parse(fs.readFileSync(libraryPath, 'utf8')) } catch { return { items: [] } } }
const saveLibrary = lib => fs.writeFileSync(libraryPath, JSON.stringify(lib, null, 2))
// 샘플에서 뽑을 수 있는 항목 (작업표의 같은 이름 칸에서 @ 로 불러온다)
const SAMPLE_CATS = {
  background: { label: '배경', prefix: 'bg', ask: 'ONLY the place: location, room or scenery, furniture, architecture, time of day, weather. Ignore every person.' },
  pose: { label: '자세', prefix: 'pose', ask: "ONLY the main woman's body pose and posture: stance, limbs, hands, head tilt, where she sits or leans. No clothes, no looks, no place." },
  expression: { label: '표정', prefix: 'face', ask: "ONLY the main woman's facial expression, gaze direction and mouth. No face features, hair, eye colour or makeup." },
  outfit: { label: '의상', prefix: 'outfit', ask: 'ONLY the clothing and accessories the main woman wears: every garment, type, colour, material, pattern, shoes, jewellery. No body, no looks, no place.' },
  camera: { label: '구도', prefix: 'cam', ask: 'ONLY the camera: shot size (close-up, cowboy shot, full body...), camera angle and height, framing and where the subject sits in the frame.' },
  lighting: { label: '조명', prefix: 'light', ask: 'ONLY the lighting: light sources, direction, colour temperature, time of day, contrast and mood of light.' },
}
async function extractSample(cat, image) {
  const c = SAMPLE_CATS[cat]; if (!c) throw new Error('알 수 없는 항목: ' + cat)
  const sys = `You extract one part of a reference image as an image-generation prompt.
Describe ${c.ask}
Never describe a person's identity or looks (hair, eyes, skin, face features, body type, age words).
If any person in the image looks like a minor, or you are unsure, set "adult_only" to false.
Reply with JSON only: {"adult_only": true, "tags": "booru / WD14 style comma-separated tags", "text": "one plain English sentence"}`
  const { status, body: res } = await fetchJson('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json', 'X-Title': 'jont-remake' },
    body: JSON.stringify({ model: C.openrouter.model, temperature: 0.2, messages: [{ role: 'system', content: sys }, { role: 'user', content: [{ type: 'image_url', image_url: { url: image } }] }] }),
  }, 2)
  const text = res?.choices?.[0]?.message?.content
  if (status !== 200 || !text) throw new Error(`OpenRouter ${status}: ${JSON.stringify(res?.error || res).slice(0, 200)}`)
  const m = String(text).match(/\{[\s\S]*\}/)
  const j = JSON.parse(m ? m[0] : text)
  if (j.adult_only !== true || AGE_WORDS.test(`${j.tags} ${j.text}`)) throw new Error('미성년자로 보이거나 확실하지 않은 이미지라 쓰지 않아요.')
  const keepLooks = cat === 'outfit'
  return { tags: keepLooks ? String(j.tags || '') : cleanTags(j.tags), text: keepLooks ? String(j.text || '') : cleanText(j.text, cat) }
}

const thumbDir = path.join(workDir, 'thumbs')
async function thumbOf(file) {
  if (!sharp) return ''
  const p = path.join(thumbDir, file.replace(IMG, '.jpg'))
  if (!fs.existsSync(p)) { fs.mkdirSync(thumbDir, { recursive: true }); await sharp(path.join(srcDir, file)).resize(320).jpeg({ quality: 72 }).toFile(p) }
  return 'data:image/jpeg;base64,' + fs.readFileSync(p).toString('base64')
}
async function makeData(server) {
  const { pathToFileURL } = await import('node:url')
  const ready = work.filter(x => state.items[x.file]?.scene)
  const thumbs = {}
  await pool(ready, 6, async x => { try { thumbs[x.file] = await thumbOf(x.file) } catch { } })
  const rows = ready.map(x => {
    const { count, fields } = sceneFields(state.items[x.file].scene)
    return { src: x.file, srcUrl: pathToFileURL(path.join(srcDir, x.file)).href, thumb: thumbs[x.file] || '', key: x.key, out: x.out, count, f: fields }
  })
  return {
    server, title: `${srcId} → ${tgtId}`, relOut: path.relative(path.resolve(srcDir, '..', '..'), outDir).replace(/\\/g, '/'),
    missing: work.length - rows.length, oldFormat: ready.filter(x => !state.items[x.file].scene.fields).length,
    tagPrefix: C.tagPrefix || '', prosePrefix: C.prosePrefix || '', mention: C.target.mageMention || '',
    safeTags: SAFE_POS_TAGS, safeProse: SAFE_POS_PROSE, negative: negative(),
    fields: FIELDS.map(([id, lb]) => [id, lb]),
    sampleCats: Object.entries(SAMPLE_CATS).map(([id, c]) => [id, c.label, c.prefix]),
    library: loadLibrary(), rows,
  }
}
const renderWorksheet = data => fs.readFileSync(path.join(here, 'worksheet.html'), 'utf8').replace('/*__DATA__*/null', JSON.stringify(data).replace(/</g, '\\u003c'))

if (cmd === 'export') {
  const data = await makeData(false)
  const rows = data.rows
  // CSV: 항목별 칸 + 조립된 프롬프트 (표 프로그램에서 골라 쓰기)
  const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"'
  const head = ['save_as', 'source', 'command', 'count', 'prompt_tags', 'prompt_prose', 'negative', ...FIELD_IDS.flatMap(id => [id + '_tags', id + '_text'])]
  const csv = rows.map(r => {
    const sc = state.items[r.src].scene
    return [r.out, r.src, r.key, r.count, buildPrompt(sc, { style: 'tags' }), buildPrompt(sc, { style: 'prose' }), negative(), ...FIELD_IDS.flatMap(id => [r.f[id].tags, r.f[id].text])].map(q).join(',')
  })
  fs.writeFileSync(path.join(workDir, 'prompts.csv'), '﻿' + [head.join(','), ...csv].join('\r\n'))
  fs.writeFileSync(path.join(workDir, 'prompts.json'), JSON.stringify(rows.map(({ thumb, srcUrl, ...r }) => r), null, 2))
  const htmlPath = path.join(workDir, 'prompts.html')
  fs.writeFileSync(htmlPath, renderWorksheet(data))
  console.log(`내보낸 장면 ${rows.length}장${data.missing ? ` (아직 해석 안 된 ${data.missing}장은 빠짐)` : ''}`)
  if (data.oldFormat) console.log(`  ! 예전 형식으로 해석된 ${data.oldFormat}장은 항목이 나뉘지 않았어요. describe --force 로 다시 해석하세요.`)
  console.log(`  작업표: ${htmlPath}  (샘플 이미지 해석은 serve 로 열 때만 돼요)\n  CSV  : ${path.join(workDir, 'prompts.csv')}\n  JSON : ${path.join(workDir, 'prompts.json')}`)
  process.exit(0)
}

if (cmd === 'serve') {
  const http = await import('node:http')
  const port = Number(opt('port', 8790))
  const readBody = req => new Promise((res, rej) => { const ch = []; let n = 0; req.on('data', d => { n += d.length; if (n > 25e6) { rej(new Error('too large')); req.destroy() } else ch.push(d) }); req.on('end', () => res(Buffer.concat(ch).toString('utf8'))); req.on('error', rej) })
  const send = (res, code, obj, type = 'application/json; charset=utf-8') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(type.startsWith('application/json') ? JSON.stringify(obj) : obj) }
  const srv = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost')
      if (req.method === 'GET' && url.pathname === '/') return send(res, 200, renderWorksheet(await makeData(true)), 'text/html; charset=utf-8')
      if (req.method === 'GET' && url.pathname === '/api/library') return send(res, 200, loadLibrary())
      if (req.method === 'POST' && url.pathname === '/api/library') {
        const lib = JSON.parse(await readBody(req))
        if (!Array.isArray(lib.items)) return send(res, 400, { error: 'items 가 없어요' })
        saveLibrary({ items: lib.items }); return send(res, 200, { ok: true })
      }
      if (req.method === 'POST' && url.pathname === '/api/extract') {
        if (!OPENROUTER_KEY) return send(res, 400, { error: 'OPENROUTER_API_KEY 가 없어요' })
        const { cat, image } = JSON.parse(await readBody(req))
        if (!/^data:image\//.test(image || '')) return send(res, 400, { error: '이미지가 없어요' })
        return send(res, 200, await extractSample(cat, image))
      }
      send(res, 404, { error: 'not found' })
    } catch (e) { send(res, 500, { error: String(e.message || e) }) }
  })
  srv.listen(port, '127.0.0.1', () => {
    console.log(`작업표: http://127.0.0.1:${port}/   (이 창을 닫으면 꺼져요)`)
    console.log(`샘플 라이브러리: ${libraryPath}`)
  })
  await new Promise(() => { })
}

if (cmd === 'describe' || cmd === 'all') {
  if (!OPENROUTER_KEY && !DRY) { console.error('OPENROUTER_API_KEY 가 없어요.'); process.exit(1) }
  console.log(`\n[1/2] 장면 해석 ${todo.length}장 · 모델 ${C.openrouter.model}`)
  await pool(todo, C.openrouter.concurrency || 3, async it => { await describe(it); saveState() })
}
if (cmd === 'generate' || cmd === 'all') {
  if (!MAGE_KEY && !DRY) { console.error('MAGE_API_KEY 가 없어요.'); process.exit(1) }
  if (!DRY) await loadArch()
  const ready = todo.filter(x => state.items[x.file]?.scene)
  console.log(`\n[2/2] 그림 생성 ${ready.length}장 · ${C.mage.architecture}${C.mage.modelId ? '/' + C.mage.modelId : ''}${sharp ? '' : ' · (sharp 없음: 크기 맞추기 생략)'}`)
  await pool(ready, C.mage.concurrency || 2, async it => { await generate(it); saveState() })
  if (!DRY) console.log(`\n사용한 Gems: ${gems}`)
}
saveState()
console.log(`\n상태 파일: ${statePath}`)
