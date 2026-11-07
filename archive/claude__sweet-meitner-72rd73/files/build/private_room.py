"""Private-room UI overlay and scoped reuse of original active-slave actions.

Applied after R3 path conversion; release R3 remains the default build.
UI generation stays separate from the small original-instance target bridge.
No generic Actor refactor; approved diet effects live in private_room_diet.py.
"""
from pathlib import Path
import json
import re
import private_room_diet
import private_room_birth

HERE = Path(__file__).parent / 'private_room'
ASSETS = ('buttons/room_diet.png', 'ui/private_room_notice.png', 'ui/z_pregnant.png')


def between(text, start, end):
    a = text.index(start)
    return text[a:text.index(end, a)]


def emit(html):
    return "*p '" + html.replace("'", "''") + "'\n"


def button(image, tip, command=None, cls=''):
    attrs = f' class="snk_button {cls}" tooltip-data="{tip}"'
    if command:
        return f'<a{attrs} href="EXEC: {command}"><img src="{image}"></a>'
    return f'<span{attrs} aria-disabled="true"><img src="{image}"></span>'


def snk(image):
    return 'content/pic/SNKmod/' + image


def view_command(view=''):
    return "gt $curloc, '" + view + "'"


def action_command(number, menu):
    return f"gs 'snk_room_bridge', 'enter', {number}, {menu} & gt 'menu_form'"


def fertility(actor, output, private=False):
    """Keep knowledge gates, special fertility types, and visible pregnancy in ONE slot.

    R3's slave pregnancy disclosure reads assistant[pregnant_revealed]. Keep that
    legacy gate here (not a reproductive-logic bug-fix). Private rooms retain the
    original doctor/nurse >3 and pregnant >9 gate. No hidden infertility is exposed.
    """
    a = actor
    if private:
        visible = f"(master_medic > 3 or assistant['nurse'] > 3) and {a}['pregnant'] > 9"
    else:
        visible = f"inventory['stethoscope'] ! 0 and (({a}['parasite'] > 0 and (master_medic > 3 or assistant['nurse'] > 3)) or ({a}['parasite'] <= 0 and {a}['pregnant'] > 0 and {a}['vaginal_modification'] ! 4 and {a}['fertility'] = 0 and assistant['pregnant_revealed'] > 0))"
    cases = [
        (visible, 'z_pregnant', '임신중'),
        (f"{a}['fertility'] < 0 and {a}['fertility_revealed'] > 0 and ({a}['fertility'] = -1 or {a}['fertility'] = -3)", 'Fer_PregX', '임신 불가'),
        (f"{a}['fertility'] = -2", 'Fer_Mi', '임신 불가'),
        (f"{a}['fertility'] = -1 and {a}['fertility_revealed'] < 1", 'Fer_PregS', '안전일'),
        (f"{a}['fertility'] = -3", 'Fer_Milk', '착유용 젖소'),
        (f"{a}['fertility'] < 0", 'Fer_Normal', '임신률 저하'),
        (f"{a}['fertility'] = 1 and {a}['fertility_revealed'] > 0", 'Fer_PregEg', '산란기'),
    ]
    if private:
        cases += [(f"(master_medic > 3 or assistant['nurse'] > 3) and {a}['pregnant'] <= 9 and {a}['ovulation'] > 2", 'Fer_PregS', '안전일'),
                  (f"(master_medic > 3 or assistant['nurse'] > 3) and {a}['pregnant'] <= 9 and {a}['ovulation'] >= 0 and {a}['ovulation'] <= 2", 'Fer_PregO', '배란기')]
    lines = []
    for i, (condition, image, label) in enumerate(cases):
        lines += [('if ' if i == 0 else 'elseif ') + condition + ':',
                  f" $snk_fertility_image = '{image}' & $snk_fertility_tip = '{label}'"]
    lines += ['else', " $snk_fertility_image = '" + ('Fer_Normal' if private else 'Fer_PregO') + "' & $snk_fertility_tip = '" + ('평시' if private else '가임기') + "'", 'end']
    # Literal image paths let package verification check every possible file.
    for image in ['z_pregnant', 'Fer_PregX', 'Fer_Mi', 'Fer_PregS', 'Fer_Milk', 'Fer_Normal', 'Fer_PregEg', 'Fer_PregO']:
        html = f'<div class="snk_fertility tooltip-left-small-button" tooltip-data="<<$snk_fertility_tip>>"><img src="{snk("ui/" + image + ".png")}"></div>'
        lines += [f"if $snk_fertility_image = '{image}': {output} '{html}'"]
    return '\n'.join(lines) + '\n'


def main_status(text):
    for actor, temp in [('slave', '$tmp_s'), ('assistant', '$tmp_a')]:
        old = between(text, f"\tif {actor}['fertility'] < 0:", f"\tif {actor}['arousal'] = 0:")
        text = text.replace(old, fertility(actor, temp + ' +='), 1)
        # Pregnancy is now rendered in the fertility slot. Keep Ill's enclosing
        # stethoscope gate and its original disclosure conditions unchanged.
        old = between(text, f"\t\tif {actor}['parasite'] > 0:", f"\t\tif {actor}['ill'] ! 0:")
        text = text.replace(old, '', 1)
    # Original master Ill and Wound shared one ID and overlapped.
    start = text.index('if master_ill ! 0:')
    text = text[:start] + text[start:].replace('id = "master_info_wounds"', 'id = "master_info_ill"', 1)
    return text


def menu_item(icon, label, tip, command=None):
    opening = '$menu_item_' + icon
    if command:
        tag = f'<a class="snk_menu_label" tooltip-data="{tip}" href="EXEC: {command}">{label}</a></li>'
    else:
        opening = f"$replace({opening}, '<li', '<li class=\"snk_disabled\"')"
        tag = f'<span class="snk_menu_label" aria-disabled="true" tooltip-data="{tip}">{label}</span></li>'
    return "$text_display += " + opening + " + '" + tag.replace("'", "''") + "'\n"


def room_body(number, original, main, status):
    a = f'room{number}'
    loc = f'slave_private_room{number}'
    # Retain pass-out, mood, and room text initialization from the original room.
    text = original[:original.index("*p '<div id = \"bg\">")]
    text = "gs 'snk_room_diet_migrate'\n$snk_room_view = $args[0]\n" + text
    text += f"$return_lock = '{loc}'\n"
    text += emit('<div id="snk_private_room">')
    text += emit('<div id="snk_room_bg"><img src="content/pic/bg/sboudoir.png"></div>')
    # Respect the existing full-image suppression setting.
    text += f"if {a}_state = CONST_INT['slave_exist'] and nsfw = 0:\n"
    text += emit(f'<div id="snk_room_character"><img src="content/pic/<<${a}["fullimage"]>>.png"></div>') + 'end\n'
    text += emit('<div id="jo9_master_card"></div><div id="jo9_slave_card"></div>')
    text += emit(f'<div id="snk_room_slave_name">개인실{number}:<<${a}_name>></div>')

    # Main card renderer, unchanged AP calculation and master status fields.
    text += between(main, "*p '<div id = \"master_short_ava\">", '!ImperatorAugustus: consolidated assistant')
    spells = between(main, "$active_spell = ''", '!ImperatorAugustus: consolidated master')
    spells = spells.replace("slave[", a + '[').replace("$active_spell += '</div>'", '')
    text += spells
    text += between(status, 'if master_wounds ! 0:', '!-------------------------------------------- Master Management - end')

    # Same portrait/AP/status structure as main, with explicit room reads only.
    text += f"if {a}_state = CONST_INT['slave_exist']:\n"
    text += emit(f'<div id="slave_short_ava"><a href="EXEC: gs \'snk_room_bridge\', \'portrait\', {number}"><img src="<<${a}[\'ava_clear\']>>.png"></a></div>')
    ap = between(main, '! JO9_UI_V192_AP_slave', '\n\t\t$tooltip_text =')
    ap = ap.replace("slave[", a + '[')
    text += ap + '\n'
    # The same three state rows as main: mood, behavior evaluation, hygiene.
    text += f"snk_room_eval = 0\nif {a}['virtue'] > 0: snk_room_eval = {a}['virtue']\nif {a}['sin'] > 0: snk_room_eval = 5 + {a}['sin']\n"
    state_rows = between(main[main.index('! JO9_UI_V192_AP_slave'):], '\n\t\t$tooltip_text =', '\n\tif exam_in_progress = 1:')
    text += state_rows.replace('slave[', a + '[').replace('$slave_name', '$' + a + '_name').replace('slave_mood_plus', a + '_mood_plus').replace('[eval]', '[snk_room_eval]') + '\n'
    for condition, portrait, label in [('no_slave', 'content/pic/blank_ava.png', '빈 개인실'), ('slave_faint', f'<<${a}[\'ava\']>>.png', '기절'), ('slave_dead', f'<<${a}[\'ava_gray\']>>.png', '사망')]:
        text += f"elseif {a}_state = CONST_INT['{condition}']:\n"
        text += emit(f'<div id="slave_short_ava"><img src="{portrait}"></div><div id="slave_short_stat">{label}</div>')
    text += 'end\n'
    text += f"if {a}_state > CONST_INT['no_slave']:\n"
    text += emit('<div id="slinfo_block">')
    text += emit(button('content/pic/ui/jon-UIadds/equipment.png', '소지품창', f"gs 'snk_room_bridge', 'inventory', {number}"))
    virgin = between(status, "\tif slave['virginity'] = 1:", "if inventory['stethoscope']")
    # main_status places its first fertility if immediately after virginity.
    virgin = virgin.replace("$tmp_s +=", '*p').replace("slave[", a + '[')
    text += virgin
    text += fertility(a, '*p', private=True)
    arousal = between(status, "\tif slave['arousal'] = 0:", '\t$tmpbrand_s =')
    arousal = arousal.replace('$tmp_s +=', '*p').replace('slave[', a + '[').replace('$slave_milk_quantity', '$' + a + '_milk_quantity')
    text += arousal + emit('</div>')
    brand = between(status, '\t$tmpbrand_s =', "\t*p '<div id=\"slinfo_block\">")
    text += brand.replace('slave[', a + '[')
    text += f"gs '$slave_price', '{a}'\n"
    text += emit('<div id="slinfo_rank" tooltip-data="등급"><<$rating[rating]>></div>')
    for stat, id_, label in [('ill', 'slinfo_ill', '질병'), ('wounds', 'slinfo_wounds', '상처')]:
        condition = f"{a}['{stat}'] ! 0"
        if stat == 'ill': condition += " and (master_medic > 2 or assistant['nurse'] > 2)"
        text += f'if {condition}:\n' + emit(f'<div id="{id_}" tooltip-data="{label}"><img src="content/pic/buttons/z_{stat}.png"></div>') + 'end\n'
    text += 'end\n'

    punish = '개인실에서 특별 대우 중인 노예는 처벌 또는 처분할 수 없습니다.'
    influence = '개인실에서 특별 대우 중인 노예에게는 영향력을 행사할 수 없습니다.'
    socialize = '개인실에서 특별 대우 중인 노예에게는 사회화 교육을 지시할 수 없습니다.'
    text += emit('<div id="snk_room_quick">')
    text += emit(button(snk('buttons/room_diet.png'), '식사 설정', view_command('diet')))
    text += f"if {a}_state = CONST_INT['slave_exist']:\n"
    text += emit(button(snk('ui/action_reward.png'), '보상', action_command(number, 15)))
    text += 'else\n' + emit(button(snk('ui/action_reward.png'), '행동할 수 있는 노예가 없습니다.', cls='snk_disabled')) + 'end\n'
    text += f"if {a}_state > CONST_INT['no_slave'] and {a}['hygiene'] > 0:\n"
    text += emit(button(snk('ui/action_wash.png'), '씻게 한다', f"interaction = menu_bath_R{number} & gt 'interaction'"))
    text += 'else\n' + emit(button(snk('ui/action_wash.png'), '씻기가 필요한 개인실 노예가 없습니다.', cls='snk_disabled')) + 'end\n'
    text += f"if {a}_state = CONST_INT['slave_exist'] and {a}['lactation'] > 0:\n"
    text += f"if {a}['milk_summ'] >= 10:\n"
    text += emit(button(snk('ui/action_milking.png'), '노예 착유', f"interaction = {595 + number} & gt 'interaction'"))
    text += 'else\n' + emit(button(snk('ui/action_milking_gray.png'), '젖이 부족함', cls='snk_disabled')) + 'end\nend\n'
    text += emit('</div>')
    text += f"if (exam_in_progress = 1 or (exam_in_progress = 0 and $master_head_gear = 'raven_crown')) and {a}_state = CONST_INT['slave_exist']:\n"
    text += emit('<div id="debug_info">' + button(snk('ui/action_info_s.png'), '종합정보 : 개인실 노예', f"gs 'snk_room_bridge', 'summary', {number}") + '</div>') + 'end\n'
    text += f"if {a}_state = CONST_INT['slave_exist']:\n"
    text += emit('<div id="snk_room_header_actions">' + button(snk('ui/action_question.png'), '질문', action_command(number, 111)) + '</div>') + 'end\n'

    # Original menu shapes/icons; approved actions enter the scoped target bridge.
    text += "$text_display = ''\nfunc('$menu', '===BEGIN===', 'column_0')\n"
    allocation = between(original, f"\nif {a}_state = CONST_INT['no_slave']:\n", f"!\tif {a}_state = CONST_INT['slave_exist']:")
    text += allocation
    text += "if $snk_room_view = 'talk':\n"
    text += menu_item('talk', '질문', '원작 질문 메뉴', action_command(number, 111))
    text += menu_item('slave_act', '활동 지시로', '개인실 활동 지시', view_command())
    text += 'else\n'
    text += menu_item('talk', '회화한다', '개인실 회화 메뉴', view_command('talk'))
    # Verified original room-specific sex route, with its original availability.
    text += f"if {a}_state > CONST_INT['no_slave'] and master_excitement >= 0:\n"
    sex_id = re.search(r'interaction = (\d+).*?maidsex\.png', original).group(1)
    text += menu_item('sex', '섹스한다', '기존 개인실 상호작용', f"interaction = {sex_id} & gt 'interaction'")
    text += 'else\n' + menu_item('sex_gray', '섹스 불가', '기존 상호작용 조건이 충족되지 않았습니다.') + 'end\n'
    for icon, label, menu in [('lesson','교육 활동',12), ('sex_edu','성교육',13), ('tutor','가정교사',17), ('reward','칭찬',15)]:
        condition = f"{a}_state = CONST_INT['slave_exist']"
        if menu in (12, 13, 17): condition += f" and {a}['energy'] > -4"
        if menu == 17: condition += ' and sparks >= coach_price[0]'
        text += f'if {condition}:\n'
        text += menu_item(icon, label, '기존 ' + label + ' 메뉴', action_command(number, menu))
        text += 'else\n' + menu_item(icon, label, '행동 가능한 대상·행동력·비용 조건이 필요합니다.') + 'end\n'
    text += "end\nfunc('$menu', '===END===')\n" + emit('<div id="snk_room_menu"><<$text_display>></div>')

    text += notice_body()
    text += "if $snk_room_view = 'diet':\n" + emit('<div class="snk_room_overlay" id="snk_room_diet"><h2>식사 설정</h2>')
    text += emit('<div class="snk_close">' + button('content/pic/buttons/close_button.png', '식사 설정 닫기', view_command()) + '</div>')
    text += f"if {a}_state > CONST_INT['no_slave']:\n"
    for index, value, label in [(2, 1, '일반식'), (3, 0, '고열량식'), (4, 2, '특별식단')]:
        text += emit('<div class="snk_diet_row">')
        text += f"if {a}_ration = {value}:\n"
        text += emit(button('content/pic/buttons/sel_button.png', label + ' 선택됨', view_command('diet')) + label + {1:' · 2 스파크/일',0:' · 4 스파크/일',2:' · 8 스파크/일'}[value])
        text += 'else\n'
        text += emit(button('content/pic/buttons/unsel_button.png', label, f"{a}['special_diet_days'] = 0 & {a}_ration = {value} & ${a}_info_text = ${a}_ration[{index}] & {view_command('diet')}") + label + {1:' · 2 스파크/일',0:' · 4 스파크/일',2:' · 8 스파크/일'}[value]) + 'end\n'
        text += emit('</div>')
    text += 'else\n' + emit('<p>개인실이 비어 있습니다.</p>') + 'end\n'
    # Selection links apply the ration immediately; X only closes the popup.
    text += emit('</div>') + 'end\n'

    # Read-only information pane; never call slave-only debug_info/interaction_city.
    text += f"if $snk_room_view = 'info' and {a}_state > CONST_INT['no_slave']:\n"
    text += emit(f'<div class="snk_room_overlay" id="snk_room_info"><h2><<${a}_name>></h2>')
    text += emit('<div class="snk_close">' + button('content/pic/buttons/close_button.png', '정보 닫기', view_command()) + '</div>')
    text += f"gs '$slave_price', '{a}'\n" + emit('<p>등급 <<$rating[rating]>></p>')
    for label, field in [('기분','mood'), ('체력','stamina'), ('흥분','arousal'), ('위생','hygiene')]:
        text += emit(f'<p>{label} : <<{a}[\'{field}\']>></p>')
    text += "if exam_in_progress = 1 or (exam_in_progress = 0 and $master_head_gear = 'raven_crown'):\n"
    # Preserve every numeric field from the original crown information page.
    # Format a copy of the psychological label: debug_info mutates the original.
    text += f"$snk_info_psy_status = ${a}_psy_status\n"
    for value, label in [('servile','노예근성'), ('obedient','복종중'), ('optimistic','긍정적'), ('soft','상냥함'), ('docile','온순함'), ('reluctant','거리감'), ('resistant','저항심'), ('arrogant','혐오감'), ('hateful','증오심'), ('frightened','두려움'), ('lachrymose','슬퍼함'), ('depresive','우울증'), ('broken','정신병'), ('hysteric','관심병'), ('horny','발정중')]:
        text += f"if $snk_info_psy_status = '{value}': $snk_info_psy_status = '{label}'\n"
    text += emit('<p>정신 상태 : <<$snk_info_psy_status>></p>')
    text += emit(f'<p>현재 복종도 : <<{a}["obedience"]>> · 성교육 계 : <<{a}["sex_sum"]>></p>')
    text += emit('<div class="snk_info_values">')
    for label, field in [('기분','mood'), ('흥분','arousal'), ('두려움','fear'), ('절망','angst'), ('응석','spoil'), ('헌신','moral'), ('사육','instinct'), ('습관','custom'), ('인식','rational')]:
        text += emit(f'<p>{label} : <<{a}["{field}"]>> / 단계 <<{a}_rate["{field}"]>></p>')
    text += emit('</div><p>장악력 영향 : <<master_supermacy>></p>')
    text += 'end\n'
    milk_id = re.search(r'interaction = (\d+).*?ui overhaul\\milking\.png', original)
    if milk_id:
        text += f"if {a}['lactation'] >= 1 and {a}_state ! CONST_INT['slave_faint'] and {a}['milk_summ'] >= 10:\n"
        text += emit(button('content/pic/ui overhaul/milking.png', '직접 젖 짜내기', f"interaction = {milk_id.group(1)} & gt 'interaction'")) + 'end\n'
    text += emit(f'<p><<${a}_features_list>></p></div>') + 'end\n'
    text += f"$snk_room_last_text[{number}] = ${a}_info_text\n"
    text += emit(f'<div id="text"><<${a}_info_text>></div>') + f"${a}_info_text = ''\n"
    text += between(original, 'if cheat_no_starve = 0', f'if {a}_state > CONST_INT[\'no_slave\'] and {a}["hygiene"]')
    text += emit('<div id="snk_room_home">' + button(snk('ui/home.png'), '1층으로 돌아가기', "menu_form = 0 & gt 'menu_form'") + '</div></div>')
    # Remove the superseded custom information popup, not just its entry links.
    start = text.index("if $snk_room_view = 'info' and")
    end = text.index(f'$snk_room_last_text[{number}]', start)
    text = text[:start] + text[end:]
    text = text.replace("master_stat_screen = 0 & gt ''master_stat''", f"gs ''snk_room_bridge'', ''master'', {number}")
    return text


def notice_body():
    text = emit('<div id="snk_room_notice">')
    text += "if snk_room_notice_open = 1:\n"
    text += emit('<img class="snk_notice_image" src="' + snk('ui/private_room_notice.png') + '">')
    text += emit('<div class="snk_close">' + button('content/pic/buttons/close_button.png', '안내 닫기', 'snk_room_notice_open = 0 & gt $curloc') + '</div>')
    text += 'else\n'
    text += emit('<div class="snk_close">' + button('content/pic/buttons/debug_button.png', '개인실 주요 변경사항', 'snk_room_notice_open = 1 & gt $curloc') + '</div>')
    return text + 'end\n' + emit('</div>')


def approved_menus(menu_body):
    """Follow existing menu constants from the six approved entry points only."""
    constants = json.loads((HERE.parents[1] / 'resources/private_room/menu_item_snapshot.json').read_text(encoding='utf-8-sig'))
    constants = {k.lower(): v for k, v in constants.items()}
    def value(token):
        return int(token) if token.isdigit() else constants.get(token.lower())
    matches = list(re.finditer(r'^if menu_form\s*=\s*(\w+)\s*:', menu_body, re.I | re.M))
    blocks = {}
    for i, m in enumerate(matches):
        k = value(m.group(1))
        if k is not None: blocks[k] = menu_body[m.end():matches[i+1].start() if i+1 < len(matches) else len(menu_body)]
    allowed = {111, 12, 13, 17, 15}
    queue = list(allowed)
    interactions = set()
    while queue:
        n = queue.pop()
        if n not in blocks: raise ValueError('Missing original menu: ' + str(n))
        block = blocks[n]
        destinations = re.findall(r"func\('\$menu',\s*'menu_form',\s*\$\w+,\s*(\w+)", block, re.I)
        destinations += re.findall(r'menu_form\s*=\s*(\w+)', block, re.I)
        for dest in destinations:
            child = value(dest)
            if child in (0, 1, 11): continue  # Parents are added after the approved subtree.
            if child is None or child in (2, 14, 18, 112, 900):
                raise ValueError('Unapproved menu edge: ' + dest)
            if child not in allowed:
                allowed.add(child)
                queue.append(child)
        for name in re.findall(r"func\('\$menu',\s*'goto',\s*\$\w+,\s*(\w+),\s*'interaction'", block, re.I) + re.findall(r'interaction\s*=\s*(\w+)', block, re.I):
            num = value(name)
            if num is not None: interactions.add(num)
    # Keep original Back steps. Their forbidden actions are filtered in menu_form.
    allowed.update((1, 11))
    return sorted(allowed), sorted(interactions)


def bridge_body(allowed):
    """A scoped use of the game's existing instance swap, not a new actor model.

    Park the original active slave outside the game's ordinary slots during the
    action so she cannot receive room duties, rewards, or lesson counters.
    """
    # FastQSP limits a compiled expression to 100 items. Keep each membership
    # comparison independent; the previous 28-way OR required 111 items.
    allowed_checks = '\n'.join(f'  if menu_form = {n}: exit' for n in allowed)
    combat = ['начать_бой', 'боевой_интерфейс', 'атака_игрока', 'ход_противников',
              'конец_раунда', 'конец_боя', 'выход_из_боя', 'передышка', 'сменить_оружие',
              'сменить_оружие_основное', 'сменить_оружие_вторичное', 'суперудары', 'инвентарь']
    combat_test = ' or '.join("$args[1] = '" + name + "'" for name in combat)
    return f'''! SNKmod private-room target bridge
if $args[0] = 'master':
 $snk_master_return = 'slave_private_room' + str(args[1])
 gs 'snk_room_bridge', 'leave'
 master_stat_screen = 0
 gt 'master_stat'
end
if $args[0] = 'master_close':
 $snk_master_destination = $snk_master_return
 $snk_master_return = ''
 $equip_choice = ''
 gt $snk_master_destination
end
if $args[0] = 'summary':
 if snk_room_target > 0:
  gs 'debug_info', 'snk_popup', 'slave'
 else
  gs 'debug_info', 'snk_popup', 'room' + str(args[1])
 end
 exit
end
if $args[0] = 'portrait':
 $snk_room_info_kind = $args[0]
 if snk_room_target = 0: gs 'snk_room_bridge', 'enter', args[1], 1
 if snk_room_target = 0: exit
 snk_room_inventory = 1
 $info_text = ''
 $equip_choice = ''
 if $snk_room_info_kind = 'portrait':
  slave_stat_screen = 0
  gt 'slave_stat'
 end
 $snk_room_saved_psy = $slave_psy_status
 snk_room_debug_open = 1
 gt 'debug_info'
end
if $args[0] = 'inventory':
 if snk_room_target = 0: gs 'snk_room_bridge', 'enter', args[1], 1
 if snk_room_target = 0: exit
 snk_room_inventory = 1
 slave_stat_screen = 2
 $equip_choice = ''
 $info_text = ''
 gt 'slave_stat'
end
if $args[0] = 'inventory_close':
 $equip_choice = ''
 $info_text = ''
 gs 'snk_room_bridge', 'leave'
 gt $snk_room_return
end
if $args[0] = 'enter':
 if snk_room_target > 0: exit
 if args[1] < 1 or args[1] > 4: exit
 $snk_room_actor = 'room' + str(args[1])
 snk_room_requested_menu = args[2]
 dynamic 'snk_room_can_act = <<$snk_room_actor>>_state'
 if snk_room_can_act ! CONST_INT['slave_exist']:
  msg '개인실 노예가 행동할 수 없는 상태입니다.'
  gt 'slave_private_room' + str(args[1])
 end
 dynamic 'snk_room_energy = <<$snk_room_actor>>["energy"]'
 if (args[2] = 12 or args[2] = 13 or args[2] = 17) and snk_room_energy <= -4:
  msg '행동력이 부족해서 교육을 시작할 수 없습니다.'
  gt 'slave_private_room' + str(args[1])
 end
 if args[2] = 17 and sparks < coach_price[0]:
  msg '가정교사를 부를 스파크가 부족합니다.'
  gt 'slave_private_room' + str(args[1])
 end
 snk_room_target = args[1]
 $snk_room_return = 'slave_private_room' + str(snk_room_target)
 $snk_room_old_onnewloc = $onnewloc
 ! All named properties, rates, inventory, names, and history counters travel
 ! through the exact original $slave_vars list used by room allocation.
 dynamic $swap_slave_instances, 'slave', $snk_room_actor
 dynamic $swap_slave_instances, $snk_room_actor, 'snk_parked_slave'
 menu_form = snk_room_requested_menu
 dynamic '$<<$snk_room_actor>>_info_text = ""'
 ! This is already a room in the home; do not let stale city state close its menu.
 is_home = 1
 city_district = -1
 $return_lock = $snk_room_return
 exit
end
if $args[0] = 'leave':
 if snk_room_target = 0: exit
 if snk_room_debug_open = 1:
  $slave_psy_status = $snk_room_saved_psy
  snk_room_debug_open = 0
 end
 ! The original cow lesson temporarily swaps its subject once more.
 if cow_lesson_in_progress = 1:
  dynamic $swap_slave_instances, 'slave', 'cow'
  cow_lesson_in_progress = 0
 end
 dynamic $swap_slave_instances, 'slave', $snk_room_actor
 dynamic $swap_slave_instances, 'slave', 'snk_parked_slave'
 snk_room_target = 0
 snk_room_inventory = 0
 $onnewloc = $snk_room_old_onnewloc
 killvar '$snk_room_old_onnewloc'
 ! Leave an empty parked instance; never an extra copy of a character.
 exit
end
if $args[0] = 'room_sex' and snk_room_target > 0:
 if master_excitement < 0 or slave['energy'] <= -4 or slave_state ! CONST_INT['slave_exist']:
  menu_form = 1
  gt 'menu_form'
 end
 snk_room_original_interaction = 1026 + snk_room_target
 gs 'snk_room_bridge', 'leave'
 interaction = snk_room_original_interaction
 gt 'interaction'
end
if $args[0] = 'guard' and snk_room_target > 0:
 if snk_room_inventory = 1:
  if $args[1] = 'slave_stat': exit
  if $args[1] = 'debug_info': exit
  if $args[1] = 'item_change' and slot >= 20 and slot <= 35: exit
  snk_room_inventory = 0
 end
 if $args[1] = 'menu_form':
  if (menu_form = 12 or menu_form = 13 or menu_form = 17) and slave['energy'] <= -4: menu_form = 1
  if menu_form = 17 and sparks < coach_price[0]: menu_form = 1
{allowed_checks}
  gs 'snk_room_bridge', 'leave'
  gt $snk_room_return
 end
 if $args[1] = 'main_screen': exit
 if $args[1] = 'interaction' or $args[1] = 'interaction_result' or $args[1] = 'interaction_screen': exit
 if $args[1] = 'interaction.relations' or $args[1] = 'teach_screen': exit
 if instr($args[1], 'sex_') = 1 or instr($args[1], 'lesson.') = 1: exit
 ! An original lesson refusal can start combat. Keep that original consequence
 ! attached to the room subject until its original return to menu_form.
 if $fight_return = 'menu_form' and $враг[1] = 'воспитуемая':
  if {combat_test}: exit
  if $args[1] = 'interaction_city' and (interaction_city = 901 or interaction_city = 902 or interaction_city = 903 or interaction_city = 143): exit
  if $args[1] = 'shop_general' and get_weapon = 1: exit
  if ($args[1] = 'interaction_result_city' or $args[1] = 'interaction_screen_city') and interaction_city = 143: exit
 end
 ! Preserve the original game-over outcome instead of returning a dead player
 ! to the room. Restore ownership before the exit location executes.
 if $args[1] = 'exit':
  gs 'snk_room_bridge', 'leave'
  exit
 end
 ! Original unmet lesson prerequisites send their message to slave_stat.
 ! Keep the message while returning to this room rather than exposing jobs.
 if $args[1] = 'slave_stat' and $info_text ! '':
  $snk_room_feedback = $info_text
  $info_text = ''
  gs 'snk_room_bridge', 'leave'
  dynamic '$<<$snk_room_actor>>_info_text = $snk_room_feedback'
  killvar '$snk_room_feedback'
  gt $snk_room_return
 end
 ! Stop a navigation/shortcut before the destination code can use the wrong
 ! actor. Normal completion, ESC, a different room, and load redirects all
 ! pass this guard before the original location body.
 gs 'snk_room_bridge', 'leave'
 gt $snk_room_return
end
'''


def filter_room_menus(body):
    """Filter before $menu runs so forbidden rows never register shortcut links.

    Preserve original parent menus, conditions, and Back/Cancel links. Other
    screens still execute every original statement exactly as before.
    """
    forbidden = re.compile(r'\$menu_item_(?:sex(?:_gray)?|punish|get_rid_of|vampire_bite(?:_gray)?|affect|socialize)\b', re.I)
    rows = []
    parent_menu = False
    for row in body.splitlines():
        start = re.match(r'^if menu_form\s*=\s*(\w+)\s*:', row, re.I)
        if start: parent_menu = start.group(1).lower() in ('1', '11', 'menu_talk')
        if parent_menu and forbidden.search(row) and re.search(r"func\('\$menu'", row, re.I):
            if re.search(r'\$menu_item_sex\s*,', row, re.I):
                rows.extend([
                    '! SNK_ROOM_SEX_BEGIN',
                    "if snk_room_target > 0 and master_excitement >= 0: func('$menu', 'exec', $menu_item_sex, 'gs ''snk_room_bridge'', ''room_sex''', '섹스한다', '기존 개인실 상호작용')",
                    "if snk_room_target > 0 and master_excitement < 0: func('$menu', 'exec', $menu_item_sex_gray, '', '섹스 불가', '기존 상호작용 조건이 충족되지 않았습니다.')",
                    '! SNK_ROOM_SEX_END',
                ])
            row = re.match(r'\s*', row).group() + 'if snk_room_target = 0: ' + row.lstrip()
        # The private menu renderer already paints the resident. Do not append
        # a second full-image layer over its buttons.
        if "func('display_fullimage', 'slave', 'center_image_home')" in row:
            row = row.replace('if nsfw = 0:', 'if nsfw = 0 and snk_room_target = 0:')
        rows.append(row)
    return '\n'.join(rows) + ('\n' if body.endswith('\n') else '')


def apply(texts):
    """UI overlay plus scoped target guards; original action bodies are retained."""
    base = {k: v.replace('\r\n', '\n') for k, v in texts.items()}
    result = {'sjm_UI_UIadds': main_status(base['sjm_UI_UIadds'])}
    for n in range(1, 5):
        name = f'slave_private_room{n}'
        result[name] = room_body(n, base[name], base['main_screen'], result['sjm_UI_UIadds'])
    result['slave_stat'] = base['slave_stat'].replace('&nbsp&nbsp&nbsp&nbsp&nbsp개인실<br>', '&nbsp&nbsp&nbsp&nbsp&nbsp개인 침대<br>')
    # Only the room inventory changes its close route. Main UI keeps its own.
    old_close = "if exam_in_progress = 1:\n\t*p '<div id = \"close\">"
    assert result['slave_stat'].count(old_close) == 1
    room_close = "if snk_room_inventory = 1:\n" + emit('<div id="close"><a href="EXEC: gs \'snk_room_bridge\', \'inventory_close\'"><img src="content/pic/buttons/close_button.png"></a></div>') + "else" + old_close
    result['slave_stat'] = result['slave_stat'].replace(old_close, room_close)
    description = '그녀만을 위해 배정된 편안하고 부드러운 개인 침대는 노예의 기분을 좋게 만들어준다. 충성스럽고 복종하는 노예에게 어울리는 특별대우이지만, 그렇지 않은 노예는 응석을 부릴 수 있다.'
    for name in ('#txt_man', '#txt_woman'):
        result[name], count = re.subn(r"^\$slave_sleep_condition\[5\] = .*?$", lambda _: "$slave_sleep_condition[5] = '<br> " + description + "'", base[name], flags=re.M)
        assert count == 1, (name, count)
    allowed, interactions = approved_menus(base['menu_form'])
    result['snk_room_bridge'] = bridge_body(allowed)
    result['menu_form'] = filter_room_menus(base['menu_form'])
    # Render the existing submenu against its temporary target, without home
    # shortcuts or jobs that could escape into the active-slave UI.
    card = between(result['slave_private_room1'], "*p '<div id=\"snk_private_room\">", "$text_display = ''\nfunc('$menu', '===BEGIN===', 'column_0')")
    card = card.replace('room1', 'slave').replace('개인실1:', '개인실<<snk_room_target>>:')
    card = card.replace("''inventory'', 1", "''inventory'', snk_room_target")
    for route in ('portrait', 'summary', 'master'):
        card = card.replace(f"''{route}'', 1", f"''{route}'', snk_room_target")
    for view in ('info', 'diet'):
        card = card.replace(f"gt $curloc, ''{view}''", f"gs ''snk_room_bridge'', ''leave'' & gt $snk_room_return, ''{view}''")
    for menu in (15, 111):
        card = card.replace(f"gs ''snk_room_bridge'', ''enter'', 1, {menu} & gt ''menu_form''", f"menu_form = {menu} & gt ''menu_form''")
    card = card.replace("master_stat_screen = 0 & gt ''master_stat''", "gs ''snk_room_bridge'', ''leave'' & master_stat_screen = 0 & gt ''master_stat''")
    card = card.replace("interaction = menu_bath_R1 & gt ''interaction''", "snk_room_wash_action = menu_bath_R<<snk_room_target>> & gs ''snk_room_bridge'', ''leave'' & interaction = snk_room_wash_action & gt ''interaction''")
    card = card.replace("interaction = 596 & gt ''interaction''", "snk_room_milk_action = 595 + snk_room_target & gs ''snk_room_bridge'', ''leave'' & interaction = snk_room_milk_action & gt ''interaction''")
    result['snk_room_menu_screen'] = "gs '_layout'\nslave_mood_plus = iif(slave['mood'] < 0, 5 - slave['mood'], slave['mood'])\n" + card + emit('<div id="snk_room_menu"><<$text_display>></div>')
    result['snk_room_menu_screen'] += notice_body() + emit('<div id="text"><<$snk_room_last_text[snk_room_target]>></div>')
    result['snk_room_menu_screen'] += emit('<div id="snk_room_home">' + button(snk('ui/home.png'), '1층으로 돌아가기', "gs 'snk_room_bridge', 'leave' & menu_form = 0 & gt 'menu_form'") + '</div></div>')
    result['main_screen'] = "if snk_room_target > 0: gs 'snk_room_menu_screen' & exit\n" + base['main_screen']
    # Remove only the tiny status glyphs below the resident strip portraits.
    result['main_screen'] = '\n'.join(row for row in result['main_screen'].split('\n') if not re.search(r'id\s*=\s*"maidroom[234]?_[Piw]"', row))
    result['master_stat'] = base['master_stat'].replace('if exam_in_progress = 1:\n', "if $snk_master_return ! '':\n" + emit('<div id="close"><a href="EXEC: gs \'snk_room_bridge\', \'master_close\'"><img src="content/pic/buttons/close_button.png"></a></div>') + 'elseif exam_in_progress = 1:\n', 1)
    # GS appends the original book content over the existing room. Never run
    # main_layout or GT debug_info for a private-room summary.
    book = base['debug_info'].split("$debug_quit_num =", 1)[0]
    popup = book.replace("gs 'main_layout'", '')
    close = '<div id="snk_summary_close">' + button(snk('buttons/close_button.png'), '닫기', 'gt $curloc') + '</div>'
    branches = "if $args[0] = 'snk_popup':\n"
    for actor in ['slave', 'room1', 'room2', 'room3', 'room4']:
        content = re.sub(r'\bslave', actor, popup)
        content = content.replace("gs '$" + actor + "_price'", "gs '$slave_price', '" + actor + "'")
        branches += f"if $args[1] = '{actor}':\n$snk_summary_saved_psy = ${actor}_psy_status\n"
        branches += emit('<div id="snk_summary_layer"><div class="snk_summary_shield"></div>') + content + emit(close + '</div>')
        branches += f"${actor}_psy_status = $snk_summary_saved_psy\nend\n"
    branches += 'exit\nend\n'
    main_close = close.replace('gt $curloc', "gt 'menu_form'")
    result['debug_info'] = branches + book + emit(main_close)
    result['menu_form'] = "if $snk_master_return ! '': gs 'snk_room_bridge', 'master_close'\n" + result['menu_form']
    private_room_diet.apply(result, base)
    private_room_birth.apply(result, base)
    # Compact, generated entry guard. A GS helper does not trigger it because
    # CURLOC remains its caller. No global $ONNEWLOC hook or engine change.
    for name, body in base.items():
        current = result.get(name, body)
        literal = name.replace("'", "''")
        result[name] = f"if snk_room_target > 0 and $curloc = '{literal}': gs 'snk_room_bridge', 'guard', '{literal}'\n" + current
    return {name: body.replace('\n', '\r\n') for name, body in result.items()}
