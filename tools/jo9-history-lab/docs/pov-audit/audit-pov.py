# jack.qsp의 게임 텍스트에서 인칭·시점 혼재 후보를 찾아 목록(md·json)으로 내는 읽기 전용 검사 도구
# 사용: python3 -I audit-pov.py <jack.qsp> <출력 폴더>
import sys, json, re, collections, hashlib, pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[4] / 'tools'))
from qsp_dump import read_locations  # noqa: E402

# 문자열 리터럴: '...'(''는 이스케이프) 와 "..."
LIT = re.compile(r"'((?:[^']|'')*)'|\"((?:[^\"]|\"\")*)\"")
HANGUL = re.compile(r'[가-힣]')
TAG = re.compile(r'<[^>]*>')
# 2인칭 "당신" 외의 2인칭(너 계열). "너무" 등 오탐을 피하려고 조사 붙은 형태만 본다
NEO = re.compile(r'(?<![가-힣])(너는|너를|너도|너에게|너한테|너랑|널|네가|네게|니가|너의|너 같은)')
DANGSIN = re.compile(r'당신')
# 주인공 1인칭 서술 후보(따옴표 밖). "나는"은 동사 '나다'(코피가 나는)와 구별이 안 돼 뺀다
NA = re.compile(r'(?<![가-힣])(내가|나를|나의|난 )')
QUOTE = re.compile(r'[“"「『][^”"」』]*[”"」』]')
SPEAKER = re.compile(r'^\s*(&nbsp;)*\s*\[[^\]]+\]')  # [이름] 이름표로 시작하는 대사

# 노예·조수가 주인에게 하는 말이 모인 location. 그 밖의 NPC가 주인공을 "당신"이라 부르는 것은 혼재가 아니다(R1이 아니면)
SLAVE_VOICE = {'#txt_man', '#txt_woman', '#txt_2_man', '#txt_2_woman', '#moodlet_base', 'moodlets'}

RULES = {
    'R1': '같은 문장 묶음에 "당신"과 "너/널/네가" 계열이 섞임',
    'R2': '노예·조수 대사에서 주인을 "당신"이라 부름(노예 대사 location만)',
    'R3': '이름표·따옴표 없는 문장에 "당신"과 1인칭 "내가/나를/나의"가 함께 나옴(신뢰 낮음: 이름표 없는 NPC 대사 포함)',
    'R4': '"주인공"이라는 메타 지칭(UI 표시 포함)',
}


def literals(body):
    for i, line in enumerate(body.splitlines()):
        s = line.strip()
        if s.startswith('!'):
            continue
        for m in LIT.finditer(line):
            t = m.group(1) if m.group(1) is not None else m.group(2)
            t = t.replace("''", "'").replace('""', '"')
            if HANGUL.search(t):
                yield i, TAG.sub(' ', t.replace('<br>', ' / '))


def classify(t):
    hits = []
    outside = QUOTE.sub(' ', t)
    quoted = ' '.join(QUOTE.findall(t))
    if DANGSIN.search(t) and NEO.search(t):
        hits.append('R1')
    if (SPEAKER.match(t) and DANGSIN.search(t)) or DANGSIN.search(quoted):
        hits.append('R2')  # location 필터는 main에서
    if not SPEAKER.match(t) and DANGSIN.search(outside) and NA.search(outside):
        hits.append('R3')
    if '주인공' in outside:
        hits.append('R4')
    return hits


def main(qsp, out):
    raw = open(qsp, 'rb').read()
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    rows = []
    for loc in read_locations(raw):
        for i, t in literals(loc['body']):
            for r in classify(t):
                if r == 'R2' and loc['name'] not in SLAVE_VOICE:
                    continue
                rows.append({'rule': r, 'location': loc['name'], 'line': i, 'text': t})
    meta = {'qsp_sha256': hashlib.sha256(raw).hexdigest(), 'rules': RULES, 'count': len(rows)}
    json.dump({'meta': meta, 'rows': rows}, open(out / 'pov-audit.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    by_rule = collections.Counter(r['rule'] for r in rows)
    by_loc = collections.Counter((r['rule'], r['location']) for r in rows)
    md = ['<!-- jack.qsp 인칭·시점 혼재 후보 목록 (audit-pov.py 자동 생성, 수정하지 말 것) -->',
          '# 인칭·시점 혼재 후보 목록', '',
          f'- 대상 qsp SHA-256: `{meta["qsp_sha256"]}`',
          '- 읽기 전용 검사 결과이며 후보(오탐 포함)다. 고칠지는 항목별로 사람이 판단한다.',
          '- 일반 NPC가 주인공을 "당신"이라 부르는 것은 정상으로 보고 세지 않는다. 같은 화자가 "당신"과 "너/네가"를 섞을 때만 R1로 센다.', '',
          '| 규칙 | 내용 | 건수 |', '|---|---|---|']
    md += [f'| {k} | {v} | {by_rule.get(k, 0)} |' for k, v in RULES.items()]
    for k in RULES:
        md += ['', f'## {k}. {RULES[k]}', '', '| location | 건수 |', '|---|---|']
        md += [f'| `{loc}` | {n} |' for (r, loc), n in by_loc.most_common() if r == k]
        md += ['', '예시(앞 15건):', '']
        md += [f'- `{x["location"]}:{x["line"]}` {x["text"][:140]}' for x in [x for x in rows if x['rule'] == k][:15]]
    (out / 'POV_AUDIT_KO.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print(dict(by_rule), 'total', len(rows))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
