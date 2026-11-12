# 장악력 대상별 계산 + 잔인함 평판 반영 mod JSON을 만들고, 주어진 qsp 사본들에 적용해 검증하는 스크립트
import sys, json, hashlib, re
sys.path.insert(0, '/home/user/JO9sa/tools')
from qsp_dump import read_locations, sh

ID = 'SUPERMACY_PER_TARGET_20261112'
qsps = sys.argv[1:-1]; out = sys.argv[-1]

def body(path, name):
    return {l['name']: l['body'] for l in read_locations(open(path, 'rb').read())}[name]

base = qsps[0]
ca = body(base, '$calculate_attributes')
start = ca.index('dynamic $replace("\r\n\tmaster_supermacy = (master_cha')
end_marker = "\", 'dyn'+'slave', iif(slave_state > CONST_INT['no_slave'], 'slave', 'assistant'))"
end = ca.index(end_marker, start) + len(end_marker)
old_block = ca[start:end]
inner = old_block[len('dynamic $replace("'):-len(end_marker)]
# 함수 본문: 기존 계산을 그대로 옮기되 결과 변수만 바꾸고, 구타 경험이 없으면 잔인함 평판을 대신 쓴다
inner_fn = inner.replace('master_supermacy', 'jo9_sm_value')
inner_fn = inner_fn.replace("dynslave['beaten_ever']", "iif(dynslave['beaten_ever'] > 0, dynslave['beaten_ever'], iif(jo9_cruel_mercy <= -5, 1, 0))", 1)
fn_body = '\r\n'.join([
    f'! JO9 MOD START {ID} | 장악력을 대상 인물별로 계산한다. args[0] = slave, assistant, room1~room4, cow, farmhand 등 인물 배열 이름',
    '! 구타 경험이 없으면 잔인함 평판(jo9_cruel_mercy <= -5, 결투 처형 소문과 같은 기준)이 같은 역할(+1)을 한다',
    'jo9_sm_value = 0',
    'dynamic $replace("' + inner_fn + "\", 'dyn'+'slave', $args[0])",
    'result = jo9_sm_value',
    f'! JO9 MOD END {ID}'])
new_block = '\r\n'.join([f'! JO9 MOD START {ID}_CALC | 대상별 함수로 계산(메인 노예, 없으면 조수)',
                         "master_supermacy = func('jo9_supermacy', iif(slave_state > CONST_INT['no_slave'], 'slave', 'assistant'))",
                         f'! JO9 MOD END {ID}_CALC'])
F = lambda t: f"func('jo9_supermacy', '{t}')"
edits = [('$calculate_attributes', old_block, new_block)]
# 메인 노예가 아닌 인물에 쓰이던 자리: 그 인물 기준 장악력으로 바꾼다
pairs = [
 ('next_day', "if master_supermacy < 0: dynslave_rate['instinct'] -= max(0, dynslave['ego'] - (2 + dynslave['fear']))", f"if {F('dynslave')} < 0: dynslave_rate['instinct'] -= max(0, dynslave['ego'] - (2 + dynslave['fear']))"),
 ('next_day', "assistant['obedience'] > 7 and master_supermacy > 0", f"assistant['obedience'] > 7 and {F('assistant')} > 0"),
] + [('next_day', f"if master_supermacy > 0: room{i}_rate['instinct'] += 1", f"if {F('room'+str(i))} > 0: room{i}_rate['instinct'] += 1") for i in range(1, 5)] + [
 ('interaction_result', "(dynslave['ego'] - 3) - max(0, min(5, master_supermacy - master_style)) - dynslave['moral']*2", f"(dynslave['ego'] - 3) - max(0, min(5, {F('dynslave')} - master_style)) - dynslave['moral']*2"),
 ('interaction_result', "dynslave['gladiatrix'] > max(0, master_supermacy - master_style)", f"dynslave['gladiatrix'] > max(0, {F('dynslave')} - master_style)"),
 ('interaction_result', "(cow['ego'] - 3) - max(0, min(5, master_supermacy - master_style)) - cow['moral']*2", f"(cow['ego'] - 3) - max(0, min(5, {F('cow')} - master_style)) - cow['moral']*2"),
 ('interaction_result', "cow['gladiatrix'] > max(0, master_supermacy - master_style)", f"cow['gladiatrix'] > max(0, {F('cow')} - master_style)"),
 ('#dynamic', "daily_bonus[$atr] = max(0, min(6 - dynslave['ego'], max(2, master_supermacy/2), daily_bonus[$atr]))", f"daily_bonus[$atr] = max(0, min(6 - dynslave['ego'], max(2, {F('dynslave')}/2), daily_bonus[$atr]))"),
]
# 같은 old가 여러 번 나오면 그 수를 count로 둔다
results = {}
for path in qsps:
    raw = open(path, 'rb').read(); locs = read_locations(raw); bodies = {l['name']: l['body'] for l in locs}
    cnt = []
    for loc, o, n in edits + pairs:
        c = bodies[loc].count(o); cnt.append(c)
        assert c >= 1, (path, loc, o[:60])
        assert bodies[loc].count(n) == 0
    results[path] = cnt
counts = results[qsps[0]]
for p in qsps[1:]:
    assert results[p] == counts, ('count differs', p, results[p], counts)
mod = {'id': '2026-11-12_supermacy_per_target', 'description': '장악력(master_supermacy)을 대상 인물별로 계산(개인실·소·조수·노예 공통 처리의 대상 섞임 버그 수정)하고, 구타 경험이 없으면 잔인함 평판(jo9_cruel_mercy <= -5)을 같은 역할로 반영',
       'target': 'game\\jack.qsp', 'before_sha256': '', 'add_locations': [{'name': 'jo9_supermacy', 'desc': '', 'body': fn_body, 'actions': []}],
       'edits': [{'location': loc, 'field': 'body', 'old': o, 'new': n, 'count': c} for (loc, o, n), c in zip(edits + pairs, counts)], 'after_sha256': ''}
json.dump(mod, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('edits', len(mod['edits']), 'counts', counts)
