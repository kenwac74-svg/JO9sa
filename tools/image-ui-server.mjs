import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { OpenRouter } from '@openrouter/sdk';
import { spawn } from 'node:child_process';

const port = Number(process.env.JO9_IMAGE_PORT || 3099);
let sessionKey = '';
function cleanKey(value) {
  return value.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
}
const imagePattern = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const server = http.createServer(async (req, res) => {
  const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
  if (req.headers.host !== `127.0.0.1:${port}` && req.headers.host !== `localhost:${port}`) return json(403, { error: '잘못된 접속 주소입니다.' });
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(await readFile(new URL('./image-ui/index.html', import.meta.url)));
  }
  if (req.method === 'GET' && req.url === '/api/status') return json(200, { ready: Boolean(sessionKey || process.env.OPENROUTER_API_KEY) });
  if (req.method !== 'POST') return json(404, { error: '찾을 수 없습니다.' });
  if (req.headers.origin !== `http://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json')) return json(403, { error: '허용되지 않은 요청입니다.' });
  try {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 40 * 1024 * 1024) return json(413, { error: '이미지가 너무 큽니다. 작은 이미지로 시도하세요.' });
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString());
    if (req.url === '/api/key') {
      if (typeof body.key !== 'string' || !body.key.trim()) return json(400, { error: 'API 키를 입력하세요.' });
      const key = cleanKey(body.key);
      if (!/^sk-or-v1-[A-Za-z0-9_-]+$/.test(key)) return json(400, { error: 'OpenRouter에서 발급한 sk-or-v1-로 시작하는 키만 입력하세요. 명령어 전체나 xAI 키를 입력하면 안 됩니다.' });
      const check = await fetch('https://openrouter.ai/api/v1/key', {
        headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000),
      });
      if (!check.ok) return json(400, { error: check.status === 401 ? 'OpenRouter가 키 인증을 거절했습니다 (401). 키가 완전히 복사됐는지, 삭제된 키인지 확인하세요.' : `키 확인 실패 (HTTP ${check.status}). 잠시 후 다시 시도하세요.` });
      sessionKey = key;
      return json(200, { ready: true });
    }
    if (req.url !== '/api/generate') return json(404, { error: '찾을 수 없습니다.' });
    const apiKey = sessionKey || (process.env.OPENROUTER_API_KEY ? cleanKey(process.env.OPENROUTER_API_KEY) : '');
    if (!apiKey) return json(400, { error: 'API 키를 등록하세요.' });
    if (!['img2img', 'inpaint', 'outpaint'].includes(body.mode) || typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 10000) return json(400, { error: '작업 방식과 프롬프트를 확인하세요.' });
    const refs = [body.image, body.face, body.guide].filter(Boolean);
    if (!body.image || refs.some(image => typeof image !== 'string' || !imagePattern.test(image))) return json(400, { error: 'PNG, JPG, WebP 원본 이미지를 선택하세요.' });
    if (body.mode === 'inpaint' && !body.guide) return json(400, { error: '수정 영역을 지정하세요.' });
    let prompt = 'Image 1 is the source composition to edit. ';
    if (body.face) prompt += 'Image 2 is the fixed character identity reference. Preserve that exact character identity, facial proportions, eyes, nose, mouth, and hair across edits. Do not substitute another person. ';
    else prompt += 'Preserve the source character identity and facial features. ';
    if (body.mode === 'inpaint') prompt += `Image ${refs.length} is an editing guide: the red overlay marks the region to change. Return a clean complete image with the same framing as Image 1, with changes only in the marked area. Do not render the red overlay. `;
    if (body.mode === 'outpaint') prompt += 'Image 1 is an expanded canvas. Fill the blank surrounding space naturally, keeping the existing image in its exact position and scale. Return the entire expanded canvas. ';
    prompt += `Requested edit: ${body.prompt.trim()}`;
    const client = new OpenRouter({ apiKey });
    const result = await client.images.generate({ imageGenerationRequest: {
      model: 'x-ai/grok-imagine-image-2.0', prompt, n: 1, stream: false,
      inputReferences: refs.map(url => ({ type: 'image_url', imageUrl: { url } })),
      ...(body.mode === 'outpaint' ? { aspectRatio: body.aspectRatio } : {}),
    } }, { retries: { strategy: 'none' } });
    const image = result.data?.[0];
    if (!image?.b64Json) return json(502, { error: '이미지가 반환되지 않았습니다.' });
    return json(200, { image: `data:${image.mediaType || 'image/png'};base64,${image.b64Json}`, cost: result.usage?.cost });
  } catch (error) {
    const status = error.statusCode ?? error.status;
    const hint = { 401: 'OpenRouter 또는 모델 제공자가 인증을 거절했습니다 (401). API 설정에서 키를 다시 검증하세요. 키 검증이 성공하면 생성 경로의 인증 문제일 수 있습니다.', 402: 'OpenRouter 크레딧이 부족합니다.', 429: '요청 제한입니다. 잠시 후 다시 시도하세요.' }[status];
    json(502, { error: hint || `생성 요청에 실패했습니다${status ? ` (HTTP ${status})` : ''}. OpenRouter 활동 내역과 모델의 참조 이미지 지원을 확인하세요.` });
  }
});
server.listen(port, '127.0.0.1', () => {
  console.log(`JO9 이미지 편집: http://127.0.0.1:${port}\n종료: Ctrl+C`);
  if (process.argv.includes('--open') && process.platform === 'win32') {
    const browser = spawn('explorer.exe', [`http://127.0.0.1:${port}`], { detached: true, stdio: 'ignore', windowsHide: true });
    browser.on('error', () => console.log('위 주소를 브라우저에서 열어주세요.'));
    browser.unref();
  }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? '3099 포트가 사용 중입니다. 기존 화면 서버를 종료하세요.' : '서버를 시작할 수 없습니다.'); process.exitCode = 1; });
