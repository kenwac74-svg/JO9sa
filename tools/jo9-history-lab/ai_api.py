# OpenRouter·Venice·Gemini(OpenAI 호환) 채팅 호출과 Kindroid 자리, 키 읽기, 번역 기록 연결을 담당하는 AI API 연결부(표준 라이브러리만 사용)
# 사용: python3 -I ai_api.py providers | chat <제공처> <모델> "<말>" | part <제공처> <모델> <언어> <부분 키> [--dry-run]
import argparse, json, os, pathlib, sys, time, urllib.error, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
CONFIG = HERE / 'ai-providers.json'
# git 제외 키 파일. 단독 실행기는 설정 파일(studio.local.json) 옆에 둔다
LOCAL = pathlib.Path(os.environ.get('JO9_AI_LOCAL') or (pathlib.Path(os.environ['JO9_STUDIO_SETTINGS']).with_name('ai.local.json') if os.environ.get('JO9_STUDIO_SETTINGS') else HERE / 'ai.local.json'))
INTERVIEWS = HERE / 'docs' / 'sextalk-interviews'
TIMEOUT = 120


class AiError(Exception):
    pass


def providers():
    return json.loads(CONFIG.read_text(encoding='utf-8'))['providers']


def api_key(name, cfg):
    """환경 변수 → ai.local.json 순. 키 값은 어디에도 출력하지 않는다."""
    key = os.environ.get(cfg.get('keyEnv', ''), '')
    if not key and LOCAL.is_file():
        key = json.loads(LOCAL.read_text(encoding='utf-8')).get('keys', {}).get(name, '')
    if not key:
        raise AiError(f'{name} 키가 없습니다. 환경 변수 {cfg.get("keyEnv")} 또는 ai.local.json 에 넣으세요.')
    return key.strip()


def chat(name, model, messages, base_url=None, retries=2, **opts):
    """OpenAI 방식 채팅 호출. 돌려주는 값 {text, model, usage, id}. 429·5xx는 짧게 쉬며 다시 시도."""
    cfg = providers().get(name)
    if cfg is None:
        raise AiError('없는 제공처: ' + name)
    if cfg['kind'] != 'openai':
        raise AiError(f'{name}: 번역 호출용이 아닙니다. 편집기의 \'AI 연결\' 탭 입력창에서 직접 설정해 쓰세요.')
    if not model:
        raise AiError('모델 이름이 필요합니다.')
    url = (base_url or cfg['baseUrl']).rstrip('/') + '/chat/completions'
    if not url.startswith('https://') and not url.startswith('http://127.0.0.1'):
        raise AiError('https 주소만 허용합니다.')
    body = json.dumps({'model': model, 'messages': messages, **opts}).encode('utf-8')
    headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + api_key(name, cfg), **cfg.get('headers', {})}
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=body, headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                d = json.loads(r.read().decode('utf-8'))
            break
        except urllib.error.HTTPError as e:
            detail = e.read().decode('utf-8', 'replace')[:300]
            if e.code in (429, 500, 502, 503, 504) and attempt < retries:
                time.sleep(2 * (attempt + 1)); continue
            raise AiError(f'{name} HTTP {e.code}: {detail}')
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt < retries:
                time.sleep(2 * (attempt + 1)); continue
            raise AiError(f'{name} 연결 실패: {e}')
    try:
        text = d['choices'][0]['message']['content']
    except (KeyError, IndexError, TypeError):
        raise AiError(f'{name}: 예상과 다른 응답 형식')
    return {'text': text, 'model': d.get('model', model), 'usage': d.get('usage'), 'id': d.get('id')}


# ---------------------------------------------------------------- Kindroid: 사용자가 입력창에 직접 적은 설정으로만 호출(주소·헤더·본문 모양을 추측하지 않는다)
MASK = '••••••••'


def _local():
    return json.loads(LOCAL.read_text(encoding='utf-8')) if LOCAL.is_file() else {}


def kindroid_get():
    """저장된 Kindroid 설정. 헤더 값(키)은 가리고 저장 여부만 알린다."""
    c = _local().get('kindroid', {})
    return {'url': c.get('url', ''), 'headers': [{'name': n, 'value': MASK if v else '', 'saved': bool(v)} for n, v in c.get('headers', {}).items()],
            'body': c.get('body', ''), 'path': c.get('path', '')}


def kindroid_save(cfg):
    old = _local()
    prev = old.get('kindroid', {}).get('headers', {})
    headers = {}
    for h in cfg.get('headers', []):
        n = str(h.get('name', '')).strip()
        if not n:
            continue
        if not all(c.isalnum() or c in '-_' for c in n):
            raise AiError('헤더 이름은 영문·숫자·-·_ 만 쓸 수 있습니다: ' + n)
        v = h.get('value', '')
        headers[n] = prev.get(n, '') if v == MASK else str(v)  # 가려진 값 그대로면 기존 값 유지
    url = str(cfg.get('url', '')).strip()
    if url and not (url.startswith('https://') or url.startswith('http://127.0.0.1')):
        raise AiError('주소는 https:// 로 시작해야 합니다.')
    body = str(cfg.get('body', '')).strip()
    if body:
        try:
            json.loads(body)
        except ValueError:
            raise AiError('요청 본문이 JSON 형식이 아닙니다.')
    old['kindroid'] = {'url': url, 'headers': headers, 'body': body, 'path': str(cfg.get('path', '')).strip()}
    tmp = LOCAL.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(old, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    os.replace(tmp, LOCAL)
    return kindroid_get()


def _fill(node, message):
    if isinstance(node, str):
        return node.replace('{message}', message)
    if isinstance(node, list):
        return [_fill(x, message) for x in node]
    if isinstance(node, dict):
        return {k: _fill(v, message) for k, v in node.items()}
    return node


def _dig(node, path):
    for part in path.split('.'):
        node = node[int(part)] if isinstance(node, list) else node[part]
    return node


def kindroid_send(message):
    """입력창 설정대로 POST 한다. 본문 안의 {message}를 보낼 말로 바꾸고, 응답 경로가 있으면 그 칸만 꺼낸다."""
    c = _local().get('kindroid', {})
    if not c.get('url'):
        raise AiError('Kindroid 주소가 입력되지 않았습니다.')
    body = json.dumps(_fill(json.loads(c['body'] or '{"message": "{message}"}'), message), ensure_ascii=False).encode('utf-8')
    headers = {'Content-Type': 'application/json', **c.get('headers', {})}
    req = urllib.request.Request(c['url'], data=body, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            raw = r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        raise AiError(f'Kindroid HTTP {e.code}: {e.read().decode("utf-8", "replace")[:300]}')
    except (urllib.error.URLError, TimeoutError) as e:
        raise AiError(f'Kindroid 연결 실패: {e}')
    text = raw
    if c.get('path'):
        try:
            text = str(_dig(json.loads(raw), c['path']))
        except (ValueError, KeyError, IndexError, TypeError):
            raise AiError('응답에서 입력한 경로를 찾지 못했습니다. 전체 응답: ' + raw[:300])
    return {'text': text, 'raw': raw[:2000]}


def part_source(key):
    """번역 대상 부분의 원문. 번역 목록에 없는 키(표시불가 B1·B2 등)는 보내지 않는다([클로드 정책준수])."""
    sys.path.insert(0, str(INTERVIEWS))
    import importlib.util
    spec = importlib.util.spec_from_file_location('i18n_tools', INTERVIEWS / 'i18n-tools.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    src, _ = mod.source_parts()
    if key not in src:
        raise AiError('번역 대상이 아닌 키입니다(표시불가이거나 없는 키). 보내지 않습니다.')
    return src[key], mod


def cmd_part(a, base_url=None):
    text, mod = part_source(a.key)
    msgs = [{'role': 'system', 'content': f'Translate the Korean text into {a.lang}. Output only the translation.'}, {'role': 'user', 'content': text}]
    if a.dry_run:
        print(json.dumps(msgs, ensure_ascii=False)); return
    r = chat(a.provider, a.model, msgs, base_url=base_url)
    mod.cmd_set(argparse.Namespace(lang=a.lang, key=a.key, text=r['text'].strip(), status='machine', model=f'{a.provider}/{r["model"]}'))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('providers')
    c = sub.add_parser('chat'); c.add_argument('provider'); c.add_argument('model'); c.add_argument('text'); c.add_argument('--base-url')
    p = sub.add_parser('part'); p.add_argument('provider'); p.add_argument('model'); p.add_argument('lang'); p.add_argument('key'); p.add_argument('--dry-run', action='store_true'); p.add_argument('--base-url')
    a = ap.parse_args(argv)
    try:
        if a.cmd == 'providers':
            for n, c in providers().items():
                have = bool(os.environ.get(c.get('keyEnv', ''))) or (LOCAL.is_file() and bool(json.loads(LOCAL.read_text(encoding='utf-8')).get('keys', {}).get(n)))
                print(f'{n}\t{c["kind"]}\t{"확인됨" if c["verified"] else "미확인"}\t키 {"있음" if have else "없음"}\t{c["baseUrl"] or "-"}')
        elif a.cmd == 'chat':
            r = chat(a.provider, a.model, [{'role': 'user', 'content': a.text}], base_url=a.base_url)
            print(r['text']); print('--', r['model'], r['usage'], file=sys.stderr)
        else:
            cmd_part(a, a.base_url)
    except AiError as e:
        sys.exit(str(e))


if __name__ == '__main__':
    main()
