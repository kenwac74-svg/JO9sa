'use strict';
const path = require('node:path');
const cp = require('node:child_process');
const os = require('node:os');

const MAX_PNG_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const pythonCache = new Map();
function failure(code, message) { const error = new Error(message); error.code = code; return error; }
function pngBuffer(value, label) {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) throw failure('PORTRAIT_INPUT_INVALID', `${label}: PNG 바이트가 필요합니다.`);
  const result = Buffer.from(value);
  if (!result.length || result.length > MAX_PNG_BYTES) throw failure('PORTRAIT_INPUT_INVALID', `${label}: PNG 크기가 허용 범위를 벗어났습니다.`);
  return result;
}
function resolvePython(explicit) {
  const key = explicit || [process.env.JO9_PYTHON, process.env.PYTHON, process.env.LOCALAPPDATA, process.env.PATH].join('|');
  if (pythonCache.has(key)) return pythonCache.get(key);
  const local = process.env.LOCALAPPDATA;
  const localRoots = [...new Set([local, process.env.USERPROFILE && path.join(process.env.USERPROFILE,'AppData','Local'),
    path.join(os.homedir(),'AppData','Local')].filter(Boolean))];
  const candidates = explicit ? [explicit] : [process.env.JO9_PYTHON, process.env.PYTHON,
    ...localRoots.flatMap(root => ['314','313','312','311'].map(v => path.join(root, 'Programs', 'Python', 'Python'+v, 'python.exe'))),
    'python3', 'python'];
  for (const exe of [...new Set(candidates.filter(v => typeof v === 'string' && v.trim()))]) {
    const check = cp.spawnSync(exe, ['-c', 'from PIL import Image; print("JO9_PIL_OK")'], {encoding:'utf8',windowsHide:true,timeout:10000,maxBuffer:16384});
    if (check.status === 0 && check.stdout.trim() === 'JO9_PIL_OK') { pythonCache.set(key, exe); return exe; }
  }
  throw failure('PORTRAIT_PYTHON_UNAVAILABLE', '자동 테두리에는 Pillow가 설치된 Python이 필요합니다.');
}
function run(operation, options) {
  if (!options || typeof options !== 'object') throw failure('PORTRAIT_INPUT_INVALID', '초상 입력이 필요합니다.');
  const pngBytes = pngBuffer(options.pngBytes, '초상');
  const borderWidth = options.borderWidth == null ? 5 : options.borderWidth;
  if (!Number.isInteger(borderWidth) || borderWidth < 1 || borderWidth > 12) throw failure('PORTRAIT_INPUT_INVALID', '테두리 두께가 올바르지 않습니다.');
  if (options.referenceFrames != null && !Array.isArray(options.referenceFrames)) throw failure('PORTRAIT_INPUT_INVALID', '프레임 참조 목록이 올바르지 않습니다.');
  const references = options.referenceFrames || [];
  if (references.length > 16) throw failure('PORTRAIT_INPUT_INVALID', '프레임 참조는 최대 16개입니다.');
  let total = pngBytes.length;
  const refs = references.map((ref, index) => {
    const bytes = pngBuffer(ref?.bytes ?? ref, '참조 프레임'); total += bytes.length;
    return {name: typeof ref?.name === 'string' ? ref.name.slice(0,100) : 'frame-'+index, png:bytes.toString('base64')};
  });
  let frame;
  if (operation === 'compose') { const bytes = pngBuffer(options.frameBytes, '선택 프레임'); total += bytes.length; frame = bytes.toString('base64'); }
  if (total > MAX_TOTAL_BYTES) throw failure('PORTRAIT_INPUT_INVALID', '초상과 프레임 입력 용량이 너무 큽니다.');
  const command = resolvePython(options.pythonExecutable);
  const result = cp.spawnSync(command, [path.join(__dirname, 'portrait-frame.py')], {
    input:JSON.stringify({operation,png:pngBytes.toString('base64'),frame,refs,borderWidth}),
    encoding:'utf8',windowsHide:true,timeout:20000,maxBuffer:2*1024*1024,
    env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',PYTHONIOENCODING:'utf-8'}
  });
  if (result.error || result.status !== 0) throw failure('PORTRAIT_PROCESS_FAILED', '초상 테두리 검사에 실패했습니다. '+String(result.stderr || result.error?.message || '').slice(0,300));
  let data;
  try { data = JSON.parse(result.stdout); } catch { throw failure('PORTRAIT_PROCESS_FAILED', '초상 테두리 검사 결과를 읽을 수 없습니다.'); }
  if (!data.ok) throw failure(data.code || 'PORTRAIT_PROCESS_FAILED', data.message || '초상 테두리 검사에 실패했습니다.');
  delete data.ok;
  if (operation === 'compose') {
    const encoded = data.png; delete data.png;
    data.pngBytes = data.changed ? Buffer.from(encoded, 'base64') : pngBytes;
  }
  return data;
}
function inspectPortraitFrame(options) { return run('inspect', options); }
function composePortraitFrame(options) { return run('compose', options); }
module.exports = {inspectPortraitFrame, composePortraitFrame};
