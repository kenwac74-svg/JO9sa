"""Approved room diet rules, save migration, and original daily accounting."""
import re


def migration():
    lines = ["if snk_room_diet_version < 1:"]
    for n in range(1, 5):
        a = f'room{n}'
        lines += [f" if {a}_ration = -1 or {a}_ration = 2: {a}_ration = 1",
                  f" {a}['special_diet_days'] = 0"]
    return '\n'.join(lines + [' snk_room_diet_version = 1', 'end', ''])


def daily(a):
    return f'''! SNK_DIET_BEGIN_{a}
if {a}_state = CONST_INT['slave_exist']:
 {a}_rate['hygiene'] += 12 + {a}['wounds']
 dynamic $replace($next_day_starvation_effects, 'dyn'+'slave', '{a}'), ({a}_ration + 1)
 if {a}_ration = 0:
  {a}['calories'] = 6 + {a}['lactation']
  total_food_cost += 4
 else
  if {a}['fat'] > 1: {a}['calories'] = -6
  if {a}['fat'] = 0: {a}['calories'] = 6
  if {a}['fat'] = 1: {a}['calories'] = 3
  if {a}_ration = 1:
   if {a}['time_in_barn'] < 10: {a}['neg_slave_food'] = 1
   total_food_cost += 2
  elseif {a}_ration = 2:
   total_food_cost += 8
  end
 end
 if {a}['neg_hungry'] > 0: {a}['calories'] += {a}['stamina']
 if {a}_ration = 2:
  {a}['special_diet_days'] += 1
  if {a}['special_diet_days'] >= 5:
   {a}['pos_cookie'] = max({a}['pos_cookie'], 1)
   {a}_rate['spoil'] += 1 + {a}['moral']
  end
  if {a}['special_diet_days'] >= 10: {a}['pos_dessert'] = max({a}['pos_dessert'], 1)
 else
  {a}['special_diet_days'] = 0
 end
elseif {a}_state = CONST_INT['no_slave'] or {a}_state = CONST_INT['slave_dead']:
 {a}['special_diet_days'] = 0
end
! SNK_DIET_END_{a}
'''


def apply(result, base):
    result['snk_room_diet_migrate'] = migration()
    result['$newloc'] = "gs 'snk_room_diet_migrate'\n" + base['$newloc']
    day = base['next_day']
    start = day.index("if room1_state > CONST_INT['no_slave']:\n\troom1_rate['hygiene']")
    end = day.index('!Barn stuff goes here', start)
    result['next_day'] = "gs 'snk_room_diet_migrate'\n" + day[:start] + '\n'.join(daily(f'room{n}') for n in range(1,5)) + '\n' + day[end:]
    # Real allocation/departure only; temporary UI target swaps keep the streak.
    interaction = base['interaction']
    for n in range(1,5):
        for x,y in [('slave', f'room{n}'), (f'room{n}', 'slave')]:
            old = f"dynamic $swap_slave_instances, '{x}', '{y}'"
            assert interaction.count(old) == 1
            interaction = interaction.replace(old, f"{x}['special_diet_days'] = 0 & {y}['special_diet_days'] = 0\n    " + old)
    result['interaction'] = interaction
    for name in ('#txt_man', '#txt_woman'):
        text = result.get(name, base[name])
        for n in range(1,5):
            for index, label in [(1,'일반식: 하루 2 스파크'),(2,'일반식: 하루 2 스파크. 기존 체형 관리 식단.'),(3,'고열량식: 하루 4 스파크. 체중 증가와 수유를 위한 식단.'),(4,'특별식단: 하루 8 스파크. 5일부터 특별대우 기분 효과와 응석 증가, 10일부터 추가 기분 효과.')]:
                text = re.sub(rf"^\$room{n}_ration\[{index}\] = .*?$", lambda _: f"$room{n}_ration[{index}] = '<br> {label}'", text, flags=re.M)
        result[name] = text
