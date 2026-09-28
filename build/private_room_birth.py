"""Dispatch the original private-room childbirth events and retain room ownership."""
import re


def apply(result, base):
    checks = "if snk_birth_active > 0: exit\n"
    # During a submenu the resident is temporarily in slave, not roomN.
    checks += "snk_birth_due = 0\n"
    checks += "if snk_room_target > 0 and slave['pregnant'] >= 150: snk_birth_due = snk_room_target\n"
    for n in range(1, 5):
        checks += f"if snk_birth_due = 0 and snk_room_target ! {n} and room{n}_state = CONST_INT['slave_exist'] and room{n}['pregnant'] >= 150: snk_birth_due = {n}\n"
    checks += "if snk_birth_due = 0: exit\ngs 'snk_room_bridge', 'leave'\n"
    checks += "snk_birth_active = snk_birth_due\nis_home = 1\ncity_district = -1\n"
    for n in range(1, 5):
        checks += f"if snk_birth_due = {n}:\n room{n}['pregnant'] = 0\n room{n}['아기'] += 1\n interaction = {9913+n}\nend\n"
    checks += "$return_lock = 'snk_room_birth_return'\nkillvar '$text'\ngt 'interaction'\n"
    result['snk_room_birth_check'] = checks
    result['snk_room_birth_return'] = """if snk_birth_active < 1 or snk_birth_active > 4: gt 'menu_form'
$snk_birth_destination = 'slave_private_room' + str(snk_birth_active)
snk_birth_active = 0
snk_birth_due = 0
killvar '$text'
killobj
menu_form = 0
is_home = 1
city_district = -1
$return_lock = $snk_birth_destination
gt $snk_birth_destination
"""
    for n in range(1, 5):
        name = f'slave_private_room{n}'
        result[name] = "gs 'snk_room_birth_check'\n" + result[name]
    result['snk_room_menu_screen'] = "gs 'snk_room_birth_check'\n" + result['snk_room_menu_screen']
    # Replace original room dispatch to give 1F-triggered births the same return.
    main = result['main_screen']
    a = main.index("if room1['pregnant'] >= 150:")
    b = main.index('!100', a)
    result['main_screen'] = main[:a] + "gs 'snk_room_birth_check'\n\n" + main[b:]
    # ESC while viewing childbirth returns to the same room, not 1F/city.
    result['menu_form'] = "if snk_birth_active > 0: gt 'snk_room_birth_return'\n" + result['menu_form']
    body = result.get('interaction', base['interaction'])
    # Use existing narrative as template, resolving target names at event start.
    original_text = base['#txt_man']
    template = re.findall(r"^\$pregnant_slave_care_N\[(\d+)\] = (.*)$", original_text, re.M)
    assert len(template) == 6
    for n in range(1, 5):
        body = body.replace(f'room{n}_mood = -8', f"room{n}['mood'] = -8")
        assignment = '\n'.join(f"$pregnant_room{n}_care_N[{i}] = {value.replace('$slave_name', f'$room{n}_name')}" for i, value in template)
        marker = f"\t\tcopyarr '$text', '$pregnant_room{n}_care_N'"
        assert body.count(marker) == 1
        body = body.replace(marker, assignment + '\n' + marker)
    result['interaction'] = body
