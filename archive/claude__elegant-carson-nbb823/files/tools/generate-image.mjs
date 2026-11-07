import { OpenRouter } from '@openrouter/sdk';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const prompt = process.argv.slice(2).join(' ').trim();
const outputDir = fileURLToPath(new URL('../generated-images/', import.meta.url));

async function main() {
  if (!prompt || prompt === '--help') {
    console.log('사용법: node tools/generate-image.mjs "만들고 싶은 이미지 설명"');
    console.log(`저장 폴더: ${outputDir}`);
    return;
  }
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('현재 터미널에 API 키가 없습니다. $env:OPENROUTER_API_KEY = "발급받은키" 실행 후 다시 시도하세요.');
  }
  const client = new OpenRouter({ apiKey });
  console.log('Grok Imagine으로 이미지 1장을 생성합니다. 완료되면 API 사용료가 발생합니다.');
  const result = await client.images.generate({
    imageGenerationRequest: {
      model: 'x-ai/grok-imagine-image-2.0',
      prompt,
      n: 1,
      stream: false,
    },
  });
  if (!result.data?.length) throw new Error('API가 이미지를 반환하지 않았습니다.');
  await mkdir(outputDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  for (const [index, image] of result.data.entries()) {
    const bytes = Buffer.from(image.b64Json, 'base64');
    if (!bytes.length) throw new Error('빈 이미지 응답입니다.');
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[image.mediaType]
      ?? (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png'
        : bytes[0] === 255 && bytes[1] === 216 ? 'jpg'
          : bytes.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : 'bin');
    const output = path.join(outputDir, `grok-${stamp}-${index + 1}.${ext}`);
    await writeFile(output, bytes, { flag: 'wx' });
    console.log(`저장 완료: ${output}`);
  }
  if (result.usage?.cost != null) console.log(`API 비용: $${result.usage.cost}`);
}

main().catch(error => {
  // 응답 본문이나 인증 헤더를 출력하지 않습니다.
  const status = error.statusCode ?? error.status;
  if (status) {
    const hint = { 401: 'API 키를 확인하세요.', 402: 'OpenRouter 크레딧을 확인하세요.', 429: '잠시 후 다시 시도하세요.' }[status] ?? '모델 지원 여부와 OpenRouter 상태를 확인하세요.';
    console.error(`생성 실패 (HTTP ${status}): ${hint}`);
  } else {
    console.error(`생성 실패: ${String(error.message).replace(/sk-or-[A-Za-z0-9_-]+/g, '[숨김]')}`);
  }
  process.exitCode = 1;
});
