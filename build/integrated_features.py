from __future__ import annotations
import html
import re

KURA_PORTRAITS = (
    'content/pic/master/master_edward.png',
    'content/pic/master/master_edward_sepia.png',
)

KURA_BLOCK = r'''$sepia_ava_path[13] = 'content\pic\master\master_edward_sepia.png'
$clear_ava_path[13] = 'content\pic\master\master_edward.png'
$master_base_name[13] = '쿠라'
$hero_description[13] = '   본명 카일 윈스턴. 지구 24의 거대도시 메가델피아에서 강화인간 용병으로 이름을 날린 뒤 탄트라 서비스를 세웠다. 회사는 도시 매춘 산업의 약 95%를 장악했고, 그는 2조 달러가 넘는 자산을 축적했다. 하지만 목표는 한 도시가 아니라 세계의 매춘 산업 전체다.<br>' + _
'<br>   코드네임 쿠라. 안개와 마법을 연구해 지구 24와 불멸의 로마를 잇는 비밀 통로를 완성했다. 로마에서 노예를 훈련하고 창관 사업을 장악한 뒤 인력과 기술을 지구로 가져갈 계획이며, 여러 사람이 통과할 수 있도록 통로를 개량할 협력자도 찾고 있다. 전투·의술·마법 지식과 충분한 자금을 준비해 왔다.<br>' + _
'<br>세력: 무소속 (세르피스 가문과 우호)<br>스파크: 20000'
$hero_difficulty[13] = '<font color="#009900">매우 쉬운 난이도</font>'
$master_version_stats[13] = {
master_str = 5
master_cha = 5
master_style = 4
master_libido = 4
master_tutor = 5
master_fighter = 5
master_butler = 3
master_artdirector = 3
master_medic = 4
master_mage = 3
master_torture = 5
master_domination = 5
master_bondage = 5
master_flagelation = 4
master_petting = 5
master_oral = 5
master_penetration = 5
master_fetish = 5

$master_armor = 'без_брони'
$master_cloth = 'fancy_suit'
$master_wpn = 'катана'
$master_left_wpn = 'катана'
$master_right_wpn = 'безоружный'
$master_leg_wpn = 'кинжал'

тонизируюзщий_эликсир = 10
целительный_бальзам = 10
sparks = 20000

faction_fame['neutral'] = 0
faction_fame['taurus'] = 0
faction_fame['serpis'] = 3
faction_fame['korvus'] = 0
faction_fame['kamira'] = 0

noble_status = 0
debt = 0
debt_count = 0
debt_history = 0
master_vampire = 0
}'''.replace('\n', '\r\n')

SCROLL_AVA_BLOCK = r'''$scroll_ava = {
    IF hero_choice < 18:
        hero_choice += 1
    else
        hero_choice = 1
    END
    gt $curloc
}
$scroll_ava_back = {
    IF hero_choice > 1 and hero_choice <= 18:
        hero_choice -= 1
    else
        hero_choice = 18
    END
    gt $curloc
}'''.replace('\n', '\r\n')

NAME_START_BLOCK = r'''$name_and_start = {
	if hero_choice = 13:
		$estate = 'serpis_house'
		$starting_area = '<font color="6B0084">뱀자리 구역</font>'
	else
		$estate = 'slum_house'
		$starting_area = '<font color="cd0000">The Slums</font>'
	end
	!$a = input ('Give your character a name. Please try to keep this shorter than 14 characters.')
	!if $a !'': $master_name = $a
	gt 'start_game'
}'''.replace('\n', '\r\n')


def _replace_span(text: str, pattern: str, replacement: str, label: str) -> str:
    new, n = re.subn(pattern, lambda _m: replacement, text, count=1, flags=re.S)
    if n != 1:
        raise RuntimeError(f'integrated feature anchor not found exactly once: {label} ({n})')
    return new


def apply_kura(texts: dict[str, str]) -> dict[str, str]:
    out = {}

    body = texts['main_menu']
    if 'gt "hero_customization_man"' not in body:
        old = 'func(\'$menu\', \'exec_options\', $menu_item_Storyselect, \'gt "hero_customization"\', \'일반 시작\')'
        if old not in body:
            raise RuntimeError('Kura: main_menu story-start anchor not found')
        body = body.replace(old, old.replace('hero_customization"', 'hero_customization_man"'), 1)
    out['main_menu'] = body

    body = texts['init_custom_game']
    if 'hero_choice = 1 &! Personal patch: custom protagonist is male-only' not in body:
        anchor = 'get_initial_slave = 0\r\n'
        if anchor not in body:
            raise RuntimeError('Kura: init_custom_game anchor not found')
        body = body.replace(anchor, anchor + 'hero_choice = 1 &! Personal patch: custom protagonist is male-only\r\n', 1)
    out['init_custom_game'] = body

    body = texts['#dynamic']
    if 'IF hero_choice < 18:' not in body:
        body = _replace_span(body, r'\$scroll_ava = \{.*?\r\n\}\r\n\$scroll_ava_back = \{.*?\r\n\}', SCROLL_AVA_BLOCK, 'scroll_ava')
    if "if hero_choice = 13:\r\n\t\t$estate = 'serpis_house'" not in body:
        body = _replace_span(body, r'\$name_and_start = \{.*?\r\n\}', NAME_START_BLOCK, 'name_and_start')
    out['#dynamic'] = body

    body = texts['#masters_base']
    if "$master_base_name[13] = '쿠라'" not in body:
        body = _replace_span(
            body,
            r"\$sepia_ava_path\[13\] = .*?\r\n\}\r\n\r\n\$sepia_ava_path\[14\]",
            KURA_BLOCK + "\r\n\r\n$sepia_ava_path[14]",
            'master 13 block',
        )
    else:
        checks = [
            "sparks = 20000", "faction_fame['serpis'] = 3", "master_str = 5",
            "master_fighter = 5", "$master_wpn = 'катана'", "$master_leg_wpn = 'кинжал'",
            "тонизируюзщий_эликсир = 10", "целительный_бальзам = 10",
        ]
        if not all(x in body for x in checks):
            raise RuntimeError('Kura: existing master 13 block does not match approved settings')
    out['#masters_base'] = body
    return out


def _collect_item_descriptions(texts: dict[str, str]) -> dict[str, str]:
    result: dict[str, str] = {}
    direct = re.compile(r"\$item_description\['([^']+)'\]\s*=\s*'((?:''|[^'])*)'")
    ib = re.compile(r"dynamic \$ib_cycle,\s*'([^']+)',\s*'((?:''|[^'])*)',\s*[^,]+,\s*'((?:''|[^'])*)',\s*'((?:''|[^'])*)'")
    for body in texts.values():
        for m in direct.finditer(body):
            result[m.group(1).lower()] = m.group(2).replace("''", "'")
        for m in ib.finditer(body):
            result[m.group(1).lower()] = m.group(3).replace("''", "'")
    return result


def _tooltip_text(value: str) -> str:
    value = re.sub(r'<br\s*/?>', ' ', value, flags=re.I)
    value = re.sub(r'<[^>]*>', '', value)
    value = html.unescape(value)
    value = re.sub(r'\s+', ' ', value).strip()
    return html.escape(value, quote=True)


def apply_equipment_tooltips(texts: dict[str, str]) -> dict[str, str]:
    descriptions = _collect_item_descriptions(texts)
    body = texts['#dynamic']
    if '$get_non_combat_equipment = {\r\n\t$tooltip_text = $item_description[$args[0]]' in body:
        return {'#dynamic': body}

    literal_link = re.compile(r'''(<a )(href = "EXEC: \$new_item = ''([^']+)''[^"]*">)''')
    excluded = {'без_брони', 'безоружный', 'пусто', 'man_rugs', 'none'}
    changed = 0
    lines = []
    for line in body.split('\r\n'):
        if '$equip_choice +=' in line and 'class="tooltip-left"' not in line:
            m = literal_link.search(line)
            if m:
                item = m.group(3)
                desc = descriptions.get(item.lower())
                if desc and item.lower() not in excluded:
                    tip = _tooltip_text(desc)
                    line = line[:m.start()] + m.group(1) + f'class="tooltip-left" tooltip-data="{tip}" ' + m.group(2) + line[m.end():]
                    changed += 1
        lines.append(line)
    body = '\r\n'.join(lines)
    if changed != 379:
        raise RuntimeError(f'Equipment tooltip direct-link count changed: expected 379, got {changed}')

    old = '''$get_non_combat_equipment = {\r
\t$equip_choice += '<a href = "EXEC: $new_item = ''<<$args[0]>>'' & slot = <<args[1]>> & gt ''item_change'', <<args[4]>>"><<iif($args[2] ! "", $args[2], $item_name[$args[0]])>></a>' + iif(args[3] = 0, dyneval($replace($dyn_aurabound_tooltip, 'dyn'+'slave', 'dynslave'), $args[0], '', args[4]), '') + '<br>'\r
}'''
    new = '''$get_non_combat_equipment = {\r
\t$tooltip_text = $item_description[$args[0]]\r
\t$tooltip_text = $replace($tooltip_text, '<br>', ' ')\r
\t$tooltip_text = $replace($tooltip_text, '<Br>', ' ')\r
\t$tooltip_text = $replace($tooltip_text, '<b>', '')\r
\t$tooltip_text = $replace($tooltip_text, '</b>', '')\r
\t$tooltip_text = $replace($tooltip_text, '<u>', '')\r
\t$tooltip_text = $replace($tooltip_text, '</u>', '')\r
\t$tooltip_text = $replace($tooltip_text, '<font size = 3%>', '')\r
\t$tooltip_text = $replace($tooltip_text, '</font>', '')\r
\t$tooltip_text = $replace($tooltip_text, '"', '&quot;')\r
\t$equip_choice += '<a class="tooltip-left" tooltip-data="<<$tooltip_text>>" href = "EXEC: $new_item = ''<<$args[0]>>'' & slot = <<args[1]>> & gt ''item_change'', <<args[4]>>"><<iif($args[2] ! "", $args[2], $item_name[$args[0]])>></a>' + iif(args[3] = 0, dyneval($replace($dyn_aurabound_tooltip, 'dyn'+'slave', 'dynslave'), $args[0], '', args[4]), '') + '<br>'\r
}'''
    if body.count(old) != 1:
        raise RuntimeError('Equipment tooltip shared helper anchor not found exactly once')
    body = body.replace(old, new, 1)
    return {'#dynamic': body}


def apply(texts: dict[str, str]) -> dict[str, str]:
    kura = apply_kura(texts)
    working = dict(texts)
    working.update(kura)
    working.update(apply_equipment_tooltips(working))
    names = {'main_menu', 'init_custom_game', '#dynamic', '#masters_base'}
    return {name: working[name] for name in names}
