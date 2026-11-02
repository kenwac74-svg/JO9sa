"""Read-only arithmetic/flag model of the verified Wong event, not a QSP run.

Writes only this output folder. The source extraction and original-vs-WORK
comparison were performed with qsp_dump.py.read_locations in memory.
"""
import json
from pathlib import Path

HERE=Path(__file__).resolve().parent
CAPS=(5,15,30,60,120)
def grade(rate):return sum(rate>=x for x in CAPS)
def visit(rate,ill=0,parasite=0,guard=0,warned=0):
    result=dict(visited=False,rate=rate,grade=grade(rate),ill=ill,parasite=parasite,guard=guard,warned=warned,gameOver=False)
    if guard!=0 or (ill<=0 and parasite<=0):return result
    if ill>0 and parasite>0 and ill==parasite:penalty=90
    elif parasite>0:penalty=80
    else:penalty=10*ill
    result.update(visited=True,rate=rate-min(rate,penalty),grade=grade(rate-min(rate,penalty)))
    if parasite>0 and warned==1:
        result['gameOver']=True
        # The game-over dynamic call may transfer control before later reset;
        # this model deliberately does not promise those resets in this branch.
        return result
    result.update(ill=0,parasite=0,guard=1,warned=1 if parasite>0 else warned)
    return result

cases=[]
def expect(name,actual,expected):
    ok=all(actual.get(k)==v for k,v in expected.items());cases.append(dict(name=name,pass_=ok,actual=actual,expected=expected));assert ok,name
expect('ill_1_darkblue_30_to_purple_20',visit(30,ill=1),dict(visited=True,rate=20,grade=2,ill=0,parasite=0,guard=1))
expect('parasite_1_lightblue_100_to_purple_20',visit(100,parasite=1),dict(visited=True,rate=20,grade=2,ill=0,parasite=0,guard=1,warned=1))
expect('equal_ill_parasite_penalty90',visit(110,ill=1,parasite=1),dict(rate=20,grade=2,warned=1))
expect('unequal_ill_parasite_uses_parasite80_branch',visit(110,ill=2,parasite=1),dict(rate=30,grade=3))
expect('floor_zero',visit(5,ill=1),dict(rate=0,grade=0))
expect('same_day_guard_prevents_second_visit',visit(30,ill=1,guard=1),dict(visited=False,rate=30,ill=1))
first=visit(30,ill=1)
expect('next_day_no_new_delivery_no_visit',visit(first['rate'],ill=first['ill'],parasite=first['parasite'],guard=0,warned=first['warned']),dict(visited=False,rate=20))
expect('restore_base_rate_without_rearming_does_not_repeat',visit(30,ill=0,parasite=0,guard=0),dict(visited=False,rate=30,grade=3))
expect('new_infected_delivery_rearms_visit',visit(30,ill=1,parasite=0,guard=0),dict(visited=True,rate=20,grade=2))
expect('repeat_parasite_after_warning_is_gameover',visit(100,parasite=1,warned=1),dict(visited=True,gameOver=True))
report={'pass':True,'type':'arithmetic-and-flag-model-only','actualQSPExecution':False,'cases':cases,'limit':'Demonstrates formulas and intended re-arm/reset flow. Does not reproduce the reported repeating in-game visit or diagnose engine/UI control transfer.'}
(HERE/'logic-formula-model-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pass':True,'modelCases':len(cases),'actualQSPExecution':False}))
