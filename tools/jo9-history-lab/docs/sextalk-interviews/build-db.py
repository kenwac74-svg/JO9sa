# 파싱한 인터뷰(posts.json)의 모든 문항·대답에 고유 키를 주고 주제·표시 가능 여부([표시불가] 사유)로 분류하는 창작물 DB 빌드 스크립트
# 사용: python3 -I build-db.py <posts.json> <출력 폴더>
import sys, json, re, collections, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import adapt  # noqa: E402  세계별 각색 등급
import hashlib

# 고정 질문지 번호 → 주제 키(섹스토크 기획 v0 4장과 연결). None = 통째로 제외
TOPICS = {
    1: 'first_age',               # 첫 경험 나이: 게임 미반영, 모든 나이 수치가 19 이상인 대답만
    2: 'first_time',              # 첫 경험 묘사
    3: 'age_gap',                 # 나이 차: 게임 미반영, 모든 나이 수치가 19 이상인 대답만
    4: 'max_night',               # 한 상대 최다 횟수
    5: 'uniform',                 # 교복: 학생 시절이 섞이면 [표시불가]
    6: 'finish_pref',             # 피니시 선호
    7: 'want',                    # 해 보고 싶은 것
    8: 'never',                   # 절대 싫은 것
    9: 'partners',                # 상대 수
    10: 'orgasm',                 # 오르가즘
    11: 'squirt',                 # 분출
    12: 'memorable_line',         # 남자가 한 말 중 기억에 남는 것
    13: 'swallow',                # 삼킴·맛
    14: 'kink',                   # 자기 취향
    15: 'signature',              # 18번 기술
    16: 'anal',                   # 애널
    17: 'deepthroat',             # 딥스로트
    18: 'dirty_talk',             # 색드립
    19: 'odd_place',              # 특이한 장소
    20: 'worst_man',              # 최악의 남자
    21: 'best_man',               # 최고의 남자
    22: 'group',                  # 다인 경험
    23: 'max_day_people',         # 하루 최다 상대
    24: 'side_partner',           # 애인·남편 외 상대
    25: 'swap',                   # 스와핑
    26: 'sm',                     # SM
    27: 'exhibition',             # 촬영·노출 → 게임에서는 구경꾼 앞
    28: 'turn_on',                # 흥분 포인트
    29: 'sns_meet',               # 온라인 만남: 게임 미반영(현대 SNS 전용)
    30: 'taboo_list',             # 근친·조건·즉석·클럽·다인종·수간 보기 목록: 항목을 가를 수 없어 문항 전체 [표시불가]
    31: 'sns_creeps',             # 온라인 찌질남: 게임 미반영(현대 SNS 전용)
    32: 'last_word',              # 마지막 한마디
}
# 대답 단위 제외: 미성년 암시, 근친, 수간
MINOR = re.compile(r'중학|중딩|고등|고딩|초등|초딩|학생\s*때|학생때|교복|여고|남고|고[123]|중[123]|(?<!\d)1[0-7]\s*(살|세)|미성년|사춘기|수능|입시|학원|열(한|두|세|네|다섯|여섯|일곱)\s*살|학교\s*(때|다닐)|담임|선생님이랑|수학여행')
INCEST = re.compile(r'근친|친오빠|친동생|친척|사촌|친아빠|아빠랑|아버지랑|삼촌')
BESTIAL = re.compile(r'수간|강아지|애완견|개랑|개한테|말이랑|햄스터')
# 학교·어린 시절은 대학 언급이 없으면 보수적으로 뺀다
YOUNG = re.compile(r'어릴|어렸|어린 ?나이|나이가 어려')
SCHOOL = re.compile(r'학교|학생|교실|과방|운동부')
UNIV = re.compile(r'대학|대학교|과 ?선배|과 ?동기|조교|강의실|과방|단과대|에브리타임|MT')
# 게임에 넣지 않고 정리만 하는 주제
NOT_IN_GAME = {'first_age', 'age_gap', 'sns_meet', 'sns_creeps', 'taboo_list'}
PLACEHOLDER = '[이 대사는 표시 불가합니다.]'
# 사유 코드: 원문을 DB에 싣지 않는 사유(본문 자리에 PLACEHOLDER) / 원문은 싣되 표시하지 않는 사유
TEXT_WITHHELD = {'minor', 'bestiality'}
# 내부 분류코드(게임 화면에는 보이지 않음). 키 → 코드는 blocked-index.json으로 찾는다
BLOCK_CODE = {'minor': 'B1', 'bestiality': 'B2', 'incest': 'B3', 'taboo_list': 'B4', 'modern_sns': 'B5', 'empty': 'B9'}
REASON_KO = {'minor': '청소년기·미성년', 'bestiality': '수간', 'incest': '근친', 'taboo_list': '금기 보기 목록 문항', 'modern_sns': '현대 SNS 소재', 'empty': '빈 대답'}
AGE_TOPICS = {'first_age', 'age_gap'}
NUM2 = re.compile(r'(?<!\d)(\d{1,2})(?!\d)')
HANDLE = re.compile(r'@[A-Za-z0-9_]+')
NUM = re.compile(r'(\d+)\s*(번|명|회|발|시간)')

def tone(a):
    t = []
    if re.search(r'ㅋ|ㅎ', a): t.append('laugh')
    if re.search(r'[~]', a): t.append('tilde')
    if re.search(r'\?!|!\?|\?\?', a): t.append('exclaim_q')
    if re.search(r'아마|정도|쯤|모르겠|기억이|애매|글쎄', a): t.append('hedge')
    if re.search(r'노코|노 코멘트|패스|비밀', a): t.append('no_comment')
    if re.search(r'요(?=[\s.!?~,;)ㅋㅎ^]|$)|습니다|니다', a, re.M): t.append('polite')
    else: t.append('casual')
    return t

PART_SPLIT = re.compile(r'\n+|(?<=[.!?~…])\s+|(?=(?<!\d)\d\)\s*)')


def split_parts(a):
    """대답을 줄·문장·보기 번호(1) 2) …) 단위로 나눈다. 키 .sNN의 기준."""
    return [s.strip() for s in PART_SPLIT.split(a) if s and s.strip()]


# [클로드 정책준수] 최소 가림(2026-11-13 사용자 확정 지침 CLAUDE_POLICY_GUIDE_KO.md): 청소년기·수간 대답도 행과 원문은 싣고,
# 문제되는 단어·문장만 같은 글자 수의 *로 바꾼다. 나이 문항은 19 미만 나이 낱말만, 그 밖의 문항은 해당 문장과
# 같은 대답 안의 성행위 묘사 문장(맥락상 같은 사건)만 가린다. 나머지 문장은 그대로 둔다.
SEXUAL = re.compile(r'섹스|섹|삽입|보지|자지|좆|사정|질싸|입싸|싸달|싸줘|쌌|오르가|가슴|젖|애무|펠라|오랄|콘돔|노콘|피임|처녀|아다|순결|첫\s*경험|자위|혼자\s*하|키스|알몸|나체|따먹|박[아히았혔고는]|빨[아았리]|빠는|핥|넣[어었고]|벗[기겨었고]|만지|만졌|만져|애액|정액|발기|신음|떡|씹|강간|성폭|성추행|강제로|당했|당한|잤|관계|흥분|야하|야한|야동|침대|모텔|\d+\s*발|빼고|뺐|빼니|피가|피\s*났|하혈|아팠|아파서|들어오|들어왔|들어가|느낌|싸고|흘러|젖었|대줬|대주|박힘|박혀|꼴려|쑤시|삼키|입으로|후배위|정상위|기승위|뒷치기|페팅|동정|벗[고어]')
AGE_NUM = re.compile(r'(?<!\d)(\d{1,2})(?!\d|\))')
GAP_WORDS = r'(차이|차|위|아래|어린|어려|많|연상|연하|터울)'
NOT_AGE_AFTER = re.compile(r'\s*(월|학번|년|번|명|회|시간|개월|달|일|주|분|cm|키로|kg|발|' + GAP_WORDS[1:-1] + r'|살\s*' + GAP_WORDS + r')')
KOR_TEEN = re.compile(r'열\W{0,3}\s*(한|하나|둘|두|셋|세|넷|네|다섯|여섯|일곱|여덟)(?![가-힣]*아홉)|십\s*(일|이|삼|사|오|육|칠|팔)\s*(살|세)')
CHILD = re.compile(r'(?<![가-힣])(한|두|세|네|다섯|여섯|일곱|여덟|아홉)\s*살(?!\s*' + GAP_WORDS + r')|미자|유년기|유치원|꼬마|어린이')
WORD_MAX = 30  # 나이 문항에서 이 길이 이하의 목록형 부분은 낱말만 가린다


def _stars(m):
    return '*' * len(m.group(0))


def _minor_rx(s):
    return (MINOR, YOUNG, BESTIAL, KOR_TEEN, CHILD) + (() if UNIV.search(s) else (SCHOOL,))


def _mask_words(topic, s):
    """문제 낱말(고1·중딩·열여섯·미자 등)과, 나이 문항이면 19 미만 숫자 나이를 같은 글자 수의 *로 바꾼다."""
    t = s
    for rx in _minor_rx(s):
        t = rx.sub(_stars, t)
    if topic in AGE_TOPICS:
        t = AGE_NUM.sub(lambda m: m.group(0) if int(m.group(1)) >= 19 or NOT_AGE_AFTER.match(t, m.end()) else _stars(m), t)
    return t


ADULT = re.compile(r'성인\s*(이\s*)?(된|되|되어|되고|되서)|대학|대딩|졸업|스무|스물|서른|마흔|[2-9]0\s*대|직장|회사|사회인|(?<!\d)(19|[2-9]\d)\s*(살|세)|만\s*(19|[2-9]\d)')  # 화자 자신이 성인인 시기 표지('성인 여동생'·'성인용품'은 아님)
SHORT_MAX = 12  # 문제 대답 안에서 성적 표현 없이 이 길이 이하인 짧은 대답(없음·아니 등)은 보인다


def mask_answer(topic, a):
    """[클로드 정책준수] 최소 가림. 청소년기·수간으로 분류된 대답에만 쓴다. 글자 수가 같아 줄바꿈·띄어쓰기 자리가 유지된다.
    부분(줄·문장·보기)마다:
    1) 문제 낱말(19 미만 나이·학교급·수간 등)이 있는 부분: 나이 문항의 짧은 목록형(WORD_MAX 이하)이고 성행위 표현이 없으면 낱말만 *, 아니면 문장 전체 *.
    2) 문제 낱말이 없는 부분: 성인 시기가 문장에 드러나면(성인·대학·졸업·스무 살·19세 이상 등) 보이고,
       성행위 표현 없는 짧은 대답(SHORT_MAX 이하)도 보인다. 그 밖은 같은 사건의 맥락일 수 있어 문장 전체 *.
    3) 마지막으로 대답 전체에 낱말 가림을 한 번 더 한다(부분 경계에 걸친 '고2' 등)."""
    parts = split_parts(a)
    spans, pos = [], 0
    for s in parts:
        i = a.find(s, pos); spans.append((i, i + len(s))); pos = i + len(s)
    out = list(a)
    for (i, j), s in zip(spans, parts):
        sex = bool(SEXUAL.search(s))
        if _mask_words(topic, s) != s:
            if topic in AGE_TOPICS and not sex and len(s) <= WORD_MAX:
                out[i:j] = _mask_words(topic, s)
            else:
                out[i:j] = '*' * len(s)
        elif not (ADULT.search(s) or (not sex and len(s) <= SHORT_MAX)):
            out[i:j] = '*' * len(s)
    return _mask_words(topic, ''.join(out)), spans


def reasons_of(topic, a):
    r = []
    if not a: r.append('empty')
    if MINOR.search(a) or YOUNG.search(a) or (SCHOOL.search(a) and not UNIV.search(a)) \
            or (topic in AGE_TOPICS and any(int(n) < 19 for n in NUM2.findall(a))):
        r.append('minor')
    if BESTIAL.search(a): r.append('bestiality')
    if INCEST.search(a): r.append('incest')
    if topic == 'taboo_list': r.append('taboo_list')
    if topic in ('sns_meet', 'sns_creeps'): r.append('modern_sns')
    return r


def main(src, out):
    posts = json.load(open(src, encoding='utf-8'))
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    rows = []
    for p in posts:
        pid = f'p{p["idx"]:04d}'
        seen = collections.Counter()
        for x in p['qa']:
            seen[x['n']] += 1  # 한 글에 같은 문항 번호가 또 나오면(인터뷰 두 편 등) 키에 차례를 붙인다
            key = f'{pid}.q{x["n"]:02d}' + (f'.{seen[x["n"]]}' if seen[x['n']] > 1 else '')
            topic = TOPICS.get(x['n'], 'extra')
            a = HANDLE.sub('@…', x['a']).strip()
            rs = reasons_of(topic, a)
            masked_rule = any(r in TEXT_WITHHELD for r in rs)
            shown, spans = mask_answer(topic, a) if masked_rule else (a, None)
            withheld = False  # 2026-11-13부터 원문을 통째로 빼지 않는다(가린 부분만 *)
            row = {'id': key, 'post': pid, 'q': x['n'], 'topic': topic,
                   'display': not rs, 'tags': (['표시불가'] if rs else []) + rs, 'block': [BLOCK_CODE[r] for r in rs],
                   'game': not rs and topic not in NOT_IN_GAME,
                   'answer': shown, 'text_withheld': withheld, 'masked': shown != a}
            if shown:
                cats, g = adapt.grades(shown)
                row.update({'len': len(shown), 'modern': cats, 'adapt': g, 'nums': [f'{n}{u}' for n, u in NUM.findall(shown)], 'tone': tone(shown)})
            row['src'] = {'url': p['url'], 'q': x['n'], 'occurrence': seen[x['n']]}
            row['parts'] = []
            src_parts = split_parts(a)
            shown_parts = [shown[i:j] for i, j in spans] if spans else src_parts
            for k, (s, m) in enumerate(zip(src_parts, shown_parts), 1):
                part = {'key': f'{key}.s{k:02d}', 'block': row['block'], 'sha': hashlib.sha256(s.encode('utf-8')).hexdigest()[:12], 'chars': len(s)}
                part['text'] = m
                if m != s:
                    part['masked'] = True
                row['parts'].append(part)
            rows.append(row)
    by_reason = collections.Counter(r for x in rows for r in x['tags'] if r != '표시불가')
    meta = {'schema': 'jo9-sextalk-interview-db/v2', 'posts': len(posts), 'rows': len(rows),
            'display': sum(x['display'] for x in rows), 'game': sum(x['game'] for x in rows),
            'blocked_by_reason': dict(by_reason), 'placeholder': PLACEHOLDER, 'reasons': REASON_KO,
            'topics': {k: v for k, v in TOPICS.items()},
            'note': '사용자 창작물(경험담 형식 인터뷰) DB. 모든 대답에 고유 키를 준다. [표시불가] 중 청소년기·수간 사유는 원문을 싣지 않고 자리표시 문구만 둔다(원문은 원본 블로그에 있음).'}
    meta['adapt'] = {'worlds': adapt.WORLDS, 'grades': adapt.GRADE, 'format': 'adapt는 worlds 순서의 13자. U = 사용자 각색 대상(자동 출력 안 함), 0~3 = A0~A3', 'userAuthoredWorlds': sorted(adapt.USER_WORLDS)}
    meta['block_codes'] = {c: REASON_KO[r] for r, c in BLOCK_CODE.items()}
    json.dump({'meta': meta, 'rows': rows}, open(out / 'interview-db.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    index = {'schema': 'jo9-blocked-index/v1', 'codes': meta['block_codes'],
             'keys': {x['id']: x['block'] for x in rows if x['block']}}
    json.dump(index, open(out / 'blocked-index.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    # 원문을 싣지 않은 부분(B1·B2)의 원본 위치 색인: 키 → 글 주소·문항·차례·부분 번호·글자 수·지문
    loc = {'schema': 'jo9-withheld-locator/v1',
           'note': '[클로드 정책준수]로 *를 친 부분(원문 일부를 가림)의 원본 위치. 원본 글의 해당 문항 대답을 줄·문장·보기 번호로 나눈 sNN번째 부분이고, sha는 그 부분 원문의 SHA-256 앞 12자다.',
           'parts': [{'key': pt['key'], 'block': pt['block'], 'url': x['src']['url'], 'q': x['src']['q'],
                      'occurrence': x['src']['occurrence'], 'part': i, 'chars': pt['chars'], 'sha': pt['sha'], 'topic': x['topic']}
                     for x in rows for i, pt in enumerate(x['parts'], 1) if pt.get('masked')]}
    json.dump(loc, open(out / 'withheld-locator.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    # 첫 경험(Q1 나이·Q2 묘사)이 청소년기(B1)인 인터뷰 번호 목록: 청소년기로 뽑힌 노예가 연결될 인터뷰(키만, 본문 없음)
    teen = sorted({x['post'] for x in rows if x['q'] in (1, 2) and 'B1' in x['block']})
    adult = sorted({x['post'] for x in rows if x['q'] == 2 and x['display']} - set(teen))
    json.dump({'schema': 'jo9-first-time-interviews/v1',
               'note': '첫 경험 문항(Q1 나이, Q2 묘사) 기준 인터뷰 번호. teen = Q1 또는 Q2가 청소년기(B1)인 인터뷰, adult = Q2가 표시 가능하고 B1이 아닌 인터뷰. 키는 인터뷰 번호(p글번호)이고 해당 문항 키는 번호.q01·번호.q02.',
               'teen': teen, 'adult': adult}, open(out / 'first-time-interviews.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    md = ['<!-- 섹스토크 인터뷰 창작물 DB 요약 (build-db.py 자동 생성) -->', '# 섹스토크 인터뷰 창작물 DB 요약', '',
          f'- 글 {len(posts)}편, 문항·대답 {len(rows)}개 전부에 고유 키(`p글번호.q문항번호`, 같은 글에 같은 번호가 또 있으면 `.2`)를 준다.',
          f'- 표시 가능 {meta["display"]}개, 그중 게임용 {meta["game"]}개. [표시불가] {len(rows) - meta["display"]}개.',
          f'- [표시불가] 사유별(중복 가능): ' + ', '.join(f'{REASON_KO[k]} {v}' for k, v in by_reason.most_common()),
          '- 내부 분류코드(게임 화면에는 보이지 않음): ' + ', '.join(f'{c} {REASON_KO[r]}' for r, c in BLOCK_CODE.items()) + '. 키 → 코드 색인: `blocked-index.json`',
          '- 대답은 줄·문장·보기 번호 단위 부분으로 나눠 부분 키(`키.sNN`)를 준다. 부분마다 원문 지문(`sha`, SHA-256 앞 12자)과 글자 수가 있어, 원문을 싣지 않은 부분도 원본(글 주소·문항·차례·부분 번호)에서 찾아 맞춰 볼 수 있다.',
          '- 원문을 싣지 않은 부분의 원본 위치 색인: `withheld-locator.json`(키 → 글 주소·문항·차례·부분 번호·글자 수·지문).',
          '- 청소년기·수간 사유 대답은 문제되는 낱말·문장만 같은 글자 수의 `*`로 가리고([클로드 정책준수]) 나머지는 싣는다. 근친·금기 목록·SNS·빈 대답은 원문을 그대로 싣는다(게임 표시만 안 함).', '',
          '| 질문 | 주제 키 | 전체 | 표시 가능 | 게임용 | [표시불가] 청소년기 | 평균 길이 | 얼버무림 비율 |', '|---|---|---|---|---|---|---|---|']
    for n, k in TOPICS.items():
        rs = [r for r in rows if r['q'] == n]
        ok = [r for r in rs if r['display']]
        avg = sum(r['len'] for r in ok) // len(ok) if ok else 0
        hed = sum('hedge' in r['tone'] for r in ok) * 100 // len(ok) if ok else 0
        md.append(f'| Q{n} | `{k}` | {len(rs)} | {len(ok)} | {sum(r["game"] for r in rs)} | {sum("minor" in r["tags"] for r in rs)} | {avg} | {hed}% |')
    ok = [r for r in rows if r['display']]
    md += ['', '## 세계별 각색 등급 (표시 가능 대답 기준)', '',
           '- U 사용자 각색 대상(선사·고대·중세·마법 시대 6종: 성윤리·생활환경이 달라 자동 출력 안 함, `adapt-user.json`에 사용자가 직접 씀) / A0 그대로 / A1 사전 치환(`adapt-dict.json`) / A2 문장 각색 필요 / A3 그 세계에 없는 소재',
           f'- 현대 소재가 든 대답 {sum(1 for r in ok if r["modern"])}개. 소재별: ' + ', '.join(f'{adapt.DICT["categories"][k]["label"]} {v}' for k, v in collections.Counter(c for r in ok for c in r['modern']).most_common()), '',
           '| 세계 | U | A0 | A1 | A2 | A3 |', '|---|---|---|---|---|---|']
    for i, w in enumerate(adapt.WORLDS):
        cnt = collections.Counter(r['adapt'][i] for r in ok)
        md.append(f'| {adapt.DICT["worldLabels"][w]} | {cnt["U"]} | {cnt["0"]} | {cnt["1"]} | {cnt["2"]} | {cnt["3"]} |')
    (out / 'INTERVIEW_DB_KO.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print(len(rows), meta['display'], meta['game'], dict(by_reason))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
