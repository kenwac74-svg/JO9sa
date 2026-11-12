# 파싱한 인터뷰(posts.json)의 모든 문항·대답에 고유 키를 주고 주제·표시 가능 여부([표시불가] 사유)로 분류하는 창작물 DB 빌드 스크립트
# 사용: python3 -I build-db.py <posts.json> <출력 폴더>
import sys, json, re, collections, pathlib

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
            withheld = any(r in TEXT_WITHHELD for r in rs)
            row = {'id': key, 'post': pid, 'q': x['n'], 'topic': topic,
                   'display': not rs, 'tags': (['표시불가'] if rs else []) + rs, 'block': [BLOCK_CODE[r] for r in rs],
                   'game': not rs and topic not in NOT_IN_GAME,
                   'answer': PLACEHOLDER if withheld else a, 'text_withheld': withheld}
            if a and not withheld:
                row.update({'len': len(a), 'nums': [f'{n}{u}' for n, u in NUM.findall(a)], 'tone': tone(a)})
            rows.append(row)
    by_reason = collections.Counter(r for x in rows for r in x['tags'] if r != '표시불가')
    meta = {'schema': 'jo9-sextalk-interview-db/v2', 'posts': len(posts), 'rows': len(rows),
            'display': sum(x['display'] for x in rows), 'game': sum(x['game'] for x in rows),
            'blocked_by_reason': dict(by_reason), 'placeholder': PLACEHOLDER, 'reasons': REASON_KO,
            'topics': {k: v for k, v in TOPICS.items()},
            'note': '사용자 창작물(경험담 형식 인터뷰) DB. 모든 대답에 고유 키를 준다. [표시불가] 중 청소년기·수간 사유는 원문을 싣지 않고 자리표시 문구만 둔다(원문은 원본 블로그에 있음).'}
    meta['block_codes'] = {c: REASON_KO[r] for r, c in BLOCK_CODE.items()}
    json.dump({'meta': meta, 'rows': rows}, open(out / 'interview-db.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    index = {'schema': 'jo9-blocked-index/v1', 'codes': meta['block_codes'],
             'keys': {x['id']: x['block'] for x in rows if x['block']}}
    json.dump(index, open(out / 'blocked-index.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    md = ['<!-- 섹스토크 인터뷰 창작물 DB 요약 (build-db.py 자동 생성) -->', '# 섹스토크 인터뷰 창작물 DB 요약', '',
          f'- 글 {len(posts)}편, 문항·대답 {len(rows)}개 전부에 고유 키(`p글번호.q문항번호`, 같은 글에 같은 번호가 또 있으면 `.2`)를 준다.',
          f'- 표시 가능 {meta["display"]}개, 그중 게임용 {meta["game"]}개. [표시불가] {len(rows) - meta["display"]}개.',
          f'- [표시불가] 사유별(중복 가능): ' + ', '.join(f'{REASON_KO[k]} {v}' for k, v in by_reason.most_common()),
          '- 내부 분류코드(게임 화면에는 보이지 않음): ' + ', '.join(f'{c} {REASON_KO[r]}' for r, c in BLOCK_CODE.items()) + '. 키 → 코드 색인: `blocked-index.json`',
          f'- 청소년기·수간 사유는 원문 대신 `{PLACEHOLDER}`만 싣는다. 근친·금기 목록·SNS·빈 대답은 원문을 싣되 표시하지 않는다.', '',
          '| 질문 | 주제 키 | 전체 | 표시 가능 | 게임용 | [표시불가] 청소년기 | 평균 길이 | 얼버무림 비율 |', '|---|---|---|---|---|---|---|---|']
    for n, k in TOPICS.items():
        rs = [r for r in rows if r['q'] == n]
        ok = [r for r in rs if r['display']]
        avg = sum(r['len'] for r in ok) // len(ok) if ok else 0
        hed = sum('hedge' in r['tone'] for r in ok) * 100 // len(ok) if ok else 0
        md.append(f'| Q{n} | `{k}` | {len(rs)} | {len(ok)} | {sum(r["game"] for r in rs)} | {sum("minor" in r["tags"] for r in rs)} | {avg} | {hed}% |')
    (out / 'INTERVIEW_DB_KO.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print(len(rows), meta['display'], meta['game'], dict(by_reason))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
