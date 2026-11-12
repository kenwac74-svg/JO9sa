# 순찰 성기사단 처형·구한 여자 감방 가둠에 악명(-0.5)을 붙이는 mod JSON을 만들고 qsp 사본들에서 위치를 확인하는 스크립트
import sys, json
sys.path.insert(0, '/home/user/JO9sa/tools')
from qsp_dump import read_locations

ID = 'CRUEL_MERCY_PATROL_PRISON_20261112'
qsps = sys.argv[1:-1]; out = sys.argv[-1]
fate_old = "! JO9 MOD END CRUEL_MERCY_RULES_20261101\r\n! JO9 MOD END CRUEL_MERCY_20261029"
fate_new = fate_old + "\r\n" + "\r\n".join([
    f"! JO9 MOD START {ID} | 순찰 전투: 타우루스 가문 성기사단(도주 노예를 회수하던 정당한 순찰)을 처형하면 악명 -0.5",
    "! 다른 순찰 적(장기 사냥꾼, 식인종 무리, 짐승족 무리, 괴물, 퀘스트 몬스터)은 0",
    "if jo9_fate['mode'] = 1 and jo9_bf_choice = 1 and $враг[1] = 'паладин': gs 'jo9_cruel_mercy_apply', -1",
    f"! JO9 MOD END {ID}"])
prison_old = "if interaction_city = 61133:\r\n\tdynamic $swap_slave_instances, 'slave', 'prisoner'"
prison_new = "\r\n".join([
    "if interaction_city = 61133:",
    f"! JO9 MOD START {ID}_PRISON | 구한 여자를 죄 없이 감방에 가두면 악명 -0.5(전리품이 남아 있을 때 한 번)",
    "\tif stock_state = CONST_INT['slave_exist'] and hunting_prize >= 1: gs 'jo9_cruel_mercy_apply', -1",
    f"! JO9 MOD END {ID}_PRISON",
    "\tdynamic $swap_slave_instances, 'slave', 'prisoner'"])
edits = [('jo9_battle_fate', fate_old, fate_new), ('interaction_city', prison_old, prison_new)]
for p in qsps:
    b = {l['name']: l['body'] for l in read_locations(open(p, 'rb').read())}
    for loc, o, n in edits:
        assert b[loc].count(o) == 1, (p, loc, b[loc].count(o)); assert b[loc].count(n) == 0
mod = {'id': '2026-11-12_cruel_mercy_patrol_prison', 'description': '악명(jo9_cruel_mercy): 안개 경계 순찰에서 타우루스 가문 성기사단을 처형하면 -0.5, 순찰에서 구한 여자를 감방에 가두면 -0.5(사용자 결정 2026-11-12)',
       'target': 'game\\jack.qsp', 'before_sha256': '', 'edits': [{'location': l, 'field': 'body', 'old': o, 'new': n, 'count': 1} for l, o, n in edits], 'after_sha256': ''}
json.dump(mod, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok', len(edits))
