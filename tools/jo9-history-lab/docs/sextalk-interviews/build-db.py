# 파싱한 인터뷰(posts.json)를 섹스토크 주제별 리소스 DB로 정리하고 제외 대상(미성년 암시·근친·수간·온라인 전용)을 걸러 내는 스크립트
# 사용: python3 -I build-db.py <posts.json> <출력 폴더>
import sys, json, re, collections, pathlib

# 고정 질문지 번호 → 주제 키(섹스토크 기획 v0 4장과 연결). None = 통째로 제외
TOPICS = {
    1: 'first_age',               # 첫 경험 나이: 게임 미반영, 모든 나이 수치가 19 이상인 대답만
    2: 'first_time',              # 첫 경험 묘사
    3: 'age_gap',                 # 나이 차: 게임 미반영, 모든 나이 수치가 19 이상인 대답만
    4: 'max_night',               # 한 상대 최다 횟수
    5: None,                      # 교복·학생 때: 학생 시절 경험과 분리할 수 없어 통째로 제외
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
    30: None,                     # 근친·수간이 든 보기 목록: 대답이 번호만 쓰거나("1,5") 섞여 있어 항목을 가를 수 없으므로 통째로 제외
    31: 'sns_creeps',             # 온라인 찌질남: 게임 미반영(현대 SNS 전용)
    32: 'last_word',              # 마지막 한마디
}
# 대답 단위 제외: 미성년 암시, 근친, 수간
MINOR = re.compile(r'중학|중딩|고등|고딩|초등|초딩|학생\s*때|학생때|교복|여고|남고|고[123]|중[123]|(?<!\d)1[0-7]\s*(살|세)|미성년|사춘기|수능|입시|학원|열(한|두|세|네|다섯|여섯|일곱)\s*살|학교\s*(때|다닐)|담임|선생님이랑|수학여행')
TABOO = re.compile(r'근친|친오빠|친동생|친척|사촌|친아빠|아빠랑|아버지랑|삼촌|수간|강아지|애완견|개랑|개한테|말이랑')
# 학교·어린 시절은 대학 언급이 없으면 보수적으로 뺀다
YOUNG = re.compile(r'어릴|어렸|어린 ?나이|나이가 어려')
SCHOOL = re.compile(r'학교|학생|교실|과방|운동부')
UNIV = re.compile(r'대학|대학교|과 ?선배|과 ?동기|조교|강의실|과방|단과대|에브리타임|MT')
# 게임에 넣지 않고 정리만 하는 주제
NOT_IN_GAME = {'first_age', 'age_gap', 'sns_meet', 'sns_creeps'}
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

def main(src, out):
    posts = json.load(open(src, encoding='utf-8'))
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    rows, drop = [], collections.Counter()
    for p in posts:
        pid = f'p{p["idx"]:04d}'
        for x in p['qa']:
            topic = TOPICS.get(x['n'], 'extra')
            a = HANDLE.sub('@…', x['a']).strip()
            if topic is None: drop['topic_excluded'] += 1; continue
            if not a: drop['empty'] += 1; continue
            if MINOR.search(a): drop['minor'] += 1; continue
            if TABOO.search(a): drop['taboo'] += 1; continue
            if topic in AGE_TOPICS and any(int(n) < 19 for n in NUM2.findall(a)): drop['age_under_19_or_ambiguous'] += 1; continue
            if YOUNG.search(a) or (SCHOOL.search(a) and not UNIV.search(a)): drop['young_or_school'] += 1; continue
            rows.append({'id': f'{pid}.q{x["n"]:02d}', 'post': pid, 'q': x['n'], 'topic': topic,
                         'answer': a, 'game': topic not in NOT_IN_GAME, 'len': len(a), 'nums': [f'{n}{u}' for n, u in NUM.findall(a)], 'tone': tone(a)})
    by_topic = collections.Counter(r['topic'] for r in rows)
    meta = {'schema': 'jo9-sextalk-interview-db/v1', 'posts': len(posts), 'rows': len(rows), 'dropped': dict(drop),
            'topics': {k: v for k, v in TOPICS.items()}, 'note': '창작 경험담 형식 인터뷰(저작권자=사용자). 게임 대사로는 세계관에 맞게 다시 쓴다.'}
    json.dump({'meta': meta, 'rows': rows}, open(out / 'interview-db.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    md = ['<!-- 섹스토크 인터뷰 리소스 DB 요약 (build-db.py 자동 생성) -->', '# 섹스토크 인터뷰 리소스 DB 요약', '',
          f'- 글 {len(posts)}편, 사용 가능 대답 {len(rows)}개. 제외: {dict(drop)}', '- 게임 미반영(정리만, `game: false`): 1 첫 경험 나이·3 나이 차(나이 수치가 모두 19 이상인 대답만), 29·31 현대 SNS 주제', '- 제외: 질문 단위(5 교복, 30 근친·수간 보기), 대답 단위(미성년 암시·근친·수간 단어, 어린 시절 언급, 대학 언급 없는 학교)', '',
          '| 질문 | 주제 키 | 대답 수 | 평균 길이 | 반말(존댓말 표지 없음) 비율 | 얼버무림 비율 |', '|---|---|---|---|---|---|']
    for n, k in TOPICS.items():
        if k is None: md.append(f'| Q{n} | (제외) | 0 | | | |'); continue
        if k in NOT_IN_GAME: k_label = f'`{k}` (게임 미반영)'
        else: k_label = f'`{k}`'
        rs = [r for r in rows if r['topic'] == k]
        if not rs: continue
        avg = sum(r['len'] for r in rs) // len(rs)
        cas = sum('casual' in r['tone'] for r in rs) * 100 // len(rs)
        hed = sum('hedge' in r['tone'] for r in rs) * 100 // len(rs)
        md.append(f'| Q{n} | {k_label} | {len(rs)} | {avg} | {cas}% | {hed}% |')
    (out / 'INTERVIEW_DB_KO.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print(meta['rows'], dict(drop), dict(by_topic.most_common(5)))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
