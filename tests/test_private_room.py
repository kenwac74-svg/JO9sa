"""Static UI and target-bridge invariants. Not a QSP interpreter/in-game test.

python tests/test_private_room.py --pkg <development output> --qsp <FIX6 qsp>
"""
import argparse
import copy
import json
import re
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(REPO / 'build'), str(REPO / 'tools')]
import private_room
from qsp_dump import read_locations


def strip_strings(line):
    result = ''
    quote = None
    i = 0
    while i < len(line):
        c = line[i]
        if quote:
            if c == quote:
                if i + 1 < len(line) and line[i+1] == quote:
                    i += 2
                    continue
                quote = None
        else:
            if c == '!' and (not result.strip() or result.rstrip().endswith('&')): break
            if c in "'\"": quote = c
            else: result += c
        i += 1
    return result.strip().lower(), quote


class PrivateRoomTests(unittest.TestCase):
    def test_room_inventory_uses_original_equipment_and_scoped_return(self):
        for n in range(1, 5):
            self.assertIn(f"''inventory'', {n}", bodies[f'slave_private_room{n}'])
        self.assertIn("''inventory'', snk_room_target", bodies['snk_room_menu_screen'])
        bridge = bodies['snk_room_bridge']
        self.assertIn("slave_stat_screen = 2", bridge)
        self.assertIn("if $args[1] = 'item_change' and slot >= 20 and slot <= 35: exit", bridge)
        self.assertIn("snk_room_inventory = 0", bridge)
        self.assertIn("''inventory_close''", bodies['slave_stat'])
        self.assertIn("elseif exam_in_progress = 1:", bodies['slave_stat'])
        original_equipment = private_room.between(baseline['slave_stat'].replace('\r\n', '\n'), 'if slave_stat_screen = 2:', '!Slave Aura Tab')
        self.assertIn(original_equipment, bodies['slave_stat'].replace('\r\n', '\n'))
        self.assertEqual(bodies['item_change'].split('\n', 1)[1].replace('\r\n', '\n'), baseline['item_change'].replace('\r\n', '\n'))

    def test_room_generated_blocks_balance(self):
        for name in [f'slave_private_room{n}' for n in range(1,5)] + ['snk_room_bridge', 'snk_room_menu_screen']:
            stack = []
            for lineno, raw in enumerate(bodies[name].splitlines(), 1):
                line, quote = strip_strings(raw)
                self.assertIsNone(quote, (name, lineno, 'unclosed string'))
                if re.match(r'^(if|for)\b.*:\s*$', line): stack.append(lineno)
                elif line == 'end':
                    self.assertTrue(stack, (name, lineno, 'unexpected end'))
                    stack.pop()
            self.assertEqual(stack, [], (name, stack))

    def test_room_targets_and_existing_routes(self):
        for n in range(1,5):
            body = bodies[f'slave_private_room{n}']
            self.assertIn(f'interaction = menu_bath_R{n}', body)
            self.assertNotIn(f'room{n}_ration = -1', body)
            self.assertIn(f"room{n}['special_diet_days'] = 0", body.replace("''", "'"))
            self.assertIn(f'interaction = {1026+n}', body)
            for menu in (111,12,13,17,15):
                self.assertIn(f"''enter'', {n}, {menu}", body)
            # Fast reward and activity praise are separately connected.
            self.assertGreaterEqual(body.count(f"''enter'', {n}, 15"), 2)
            for m in range(1,5):
                if m != n: self.assertNotRegex(body, rf'\broom{m}(?:\[|_state|_ration)')
            for text in ['cleans_rule', 'cooks_rule', 'postitute_rule', 'tentacle_rule', 'washes_master_rule', '조교 중인 다른', '준비 중', 'jo9_v16_master_actions']:
                self.assertNotIn(text, body)
            self.assertNotRegex(body, r"(?:slave|assistant)\['(?:mood|energy|virtue|sin)'\]\s*[-+]?=")

    def test_forbidden_entries_are_hidden(self):
        for n in range(1,5):
            body = bodies[f'slave_private_room{n}']
            for forbidden in ('action_social.png', 'action_influence.png', 'menu_item_affect', 'menu_item_socialize'):
                self.assertNotIn(forbidden, body)

    def test_original_menu_graph_and_escape_guards(self):
        allowed, interactions = private_room.approved_menus(originals['menu_form'])
        self.assertTrue({1,11,12,13,15,17,111,151,156,1233}.issubset(allowed))
        self.assertTrue({14,18,112,900}.isdisjoint(allowed))
        self.assertIn(1562, interactions)  # actual original praise handler
        for name in originals:
            self.assertTrue(bodies[name].startswith('if snk_room_target > 0 and $curloc = '), name)
        self.assertIn("$onnewloc = $snk_room_old_onnewloc", bodies['snk_room_bridge'])

    def test_exception_routes_and_crown_information(self):
        bridge = bodies['snk_room_bridge']
        # Original refusals can proceed through weapon choice and combat exit.
        for name in ['начать_бой','выход_из_боя','shop_general','interaction_result_city','interaction_screen_city']:
            self.assertIn(name, originals)
            self.assertIn("$args[1] = '" + name + "'", bridge)
        self.assertIn("interaction_city = 143", bridge)
        self.assertIn("$snk_room_feedback = $info_text", bridge)
        self.assertIn("if $args[1] = 'exit':", bridge)
        for n in range(1,5):
            body = bodies[f'slave_private_room{n}']
            self.assertIn('if snk_room_notice_open = 1:', body)
            self.assertIn('snk_room_notice_open = 0', body)
            self.assertIn('snk_room_notice_open = 1', body)
            self.assertNotIn('snk_room_title', body)
            self.assertNotIn('action_punish.png', body)
            self.assertNotIn('menu_item_punish', body)
            self.assertNotIn('menu_item_get_rid_of', body)
            self.assertIn("gs '_layout'", body)
            self.assertNotIn("gs 'main_layout'", body)
            self.assertNotIn('snk_room_lower', body)
            self.assertNotIn('snk_room_panel', body)
            self.assertIn('id="text"', body)
            self.assertIn('content/pic/SNKmod/ui/home.png', body)
            self.assertIn('private_room_notice.png', body)
            self.assertIn(f"''portrait'', {n}", body)
            self.assertIn(f"''summary'', {n}", body)
            self.assertNotIn('snk_info_values', body)
            self.assertNotRegex(body, rf'\$room{n}_psy_status\s*=')

    def test_two_step_bridge_keeps_every_instance_field(self):
        fields = re.findall(r"\$(?:playable|slave)_vars\[\] = '([^']+)'", originals['#static_base'])
        self.assertGreater(len(fields), 20)
        # Use the exact original game's field registry and the bridge's actual
        # swap sequence; include nested numeric/string properties and histories.
        for room in ['room1','room2','room3','room4']:
            state = {a: {f: {'number': i, 'string': a+f, 'history': [i, i+9]} for i,f in enumerate(fields)} for a in ['slave',room]}
            state['snk_parked_slave'] = {}
            active_before, room_before = copy.deepcopy(state['slave']), copy.deepcopy(state[room])
            def swap(x,y): state[x],state[y] = state[y],state[x]
            swap('slave',room)
            swap(room,'snk_parked_slave')
            self.assertEqual(state[room], {})
            self.assertEqual(state['slave'], room_before)
            state['slave']['instance']['number'] += 1
            state['slave']['instance_already_done_total']['history'].append(1562)
            swap('slave',room)
            swap('slave','snk_parked_slave')
            self.assertEqual(state['slave'], active_before)
            self.assertEqual(state['snk_parked_slave'], {})
            self.assertEqual(state[room]['instance']['number'], room_before['instance']['number'] + 1)

    def test_assets_sizes_and_original_menu_icon_variables(self):
        icons = {k.lower() for k in json.loads((REPO/'resources/originals/json/menu_icon.json').read_text(encoding='utf-8-sig'))['menu_item']}
        for n in range(1,5):
            for name in re.findall(r'\$(menu_item_\w+)',bodies[f'slave_private_room{n}']):
                self.assertIn(name.lower(), icons)
        for rel, dimensions, maximum in [('buttons/room_diet.png',(32,32),4096),('ui/private_room_notice.png',(426,242),35297)]:
            data = (pkg/'payload/content/pic/SNKmod'/rel).read_bytes()
            self.assertEqual(data[:8], b'\x89PNG\r\n\x1a\n')
            self.assertEqual((int.from_bytes(data[16:20],'big'),int.from_bytes(data[20:24],'big')), dimensions)
            self.assertLessEqual(len(data), maximum)

    def test_main_status_and_sleep(self):
        status = bodies['sjm_UI_UIadds']
        self.assertNotIn('id = "slinfo_pregnant"', status)
        self.assertNotIn('id = "asinfo_pregnant"', status)
        self.assertIn('id = "master_info_ill"', status)
        self.assertIn("assistant['pregnant_revealed'] > 0", status) # original gate preserved
        self.assertIn('개인 침대<br>', bodies['slave_stat'])
        for name in ['#txt_man','#txt_woman']:
            self.assertIn("$slave_sleep_condition[5] = '<br> 그녀만을", bodies[name])
        # No game logic edits below the entry guard in these shared routines.
        for name in ['interaction_result','#dynamic','#static_base','sex_initiate','sex_end']:
            self.assertEqual(bodies[name].split('\n',1)[1].replace('\r\n','\n'), baseline[name].replace('\r\n','\n'))

    def test_menu_filter_preserves_original_statements_and_shortcut_guards(self):
        modified = bodies['menu_form'].split('\n',1)[1].replace('\r\n','\n')
        modified = modified.replace("if $snk_master_return ! '': gs 'snk_room_bridge', 'master_close'\n", '')
        modified = modified.replace("if snk_birth_active > 0: gt 'snk_room_birth_return'\n", '')
        restored = re.sub(r'! SNK_ROOM_SEX_BEGIN\n.*?! SNK_ROOM_SEX_END\n', '', modified, flags=re.S)
        restored = restored.replace('if snk_room_target = 0: ', '').replace('if nsfw = 0 and snk_room_target = 0:', 'if nsfw = 0:')
        self.assertEqual(restored, baseline['menu_form'].replace('\r\n','\n'))
        # Forbidden rows must be gated before FUNC registers any keyboard link.
        parents = private_room.between(modified, 'if menu_form = 1:', '!개인실') + private_room.between(modified, 'if menu_form = menu_talk:', '!main menu - Slave activities - Conduct a lesson')
        for token in ('$menu_item_punish', '$menu_item_get_rid_of', '$menu_item_Affect', '$menu_item_socialize'):
            lines = [s for s in parents.splitlines() if re.search(re.escape(token) + r'\b', s, re.I) and "func('$menu'" in s.lower()]
            self.assertTrue(lines, token)
            self.assertTrue(all('if snk_room_target = 0:' in s for s in lines), token)
        self.assertIn('menu_form = 11', modified)
        self.assertIn('menu_form = 1', bodies['snk_room_bridge'])

    def test_submenu_preserves_controls_and_restores_target_on_exit(self):
        screen = bodies['snk_room_menu_screen']
        for element in ('snk_room_quick','snk_room_header_actions','debug_info','text','snk_room_home'):
            self.assertIn(f'id="{element}"', screen)
        self.assertNotIn("$text_display = ''", screen)
        self.assertIn("menu_form = 111 & gt ''menu_form''", screen)
        self.assertIn("menu_form = 15 & gt ''menu_form''", screen)
        self.assertNotIn("''enter'', 1,", screen)
        self.assertNotIn('개인실로 돌아가기', screen)
        self.assertIn("''leave'' & menu_form = 0 & gt ''menu_form''", screen)
        self.assertIn('menu_bath_R<<snk_room_target>>', screen)
        self.assertIn("''leave'' & interaction = snk_room_wash_action", screen)
        for view in ('diet',):
            self.assertIn(f"''leave'' & gt $snk_room_return, ''{view}''", screen)
        for n in range(1,5):
            body=bodies[f'slave_private_room{n}']
            self.assertIn(f'$snk_room_last_text[{n}] = $room{n}_info_text',body)
            diet=private_room.between(body,"if $snk_room_view = 'diet':", f'$snk_room_last_text[{n}]')
            self.assertNotIn('ok-icon.png',diet)
            self.assertIn(f'room{n}_ration = ',diet)
        icon=pkg/'payload/content/pic/SNKmod/ui/z_pregnant.png'
        self.assertEqual(icon.read_bytes(),(REPO/'resources/private_room/content/pic/ui/z_pregnant.png').read_bytes())
        self.assertIn("$snk_fertility_image = 'z_pregnant'",screen)
        self.assertNotIn('ui/Preg_s.png',screen)

    def test_allowed_menu_checks_fit_fastqsp_expression_limit(self):
        bridge = bodies['snk_room_bridge']
        guard = private_room.between(bridge, "if $args[1] = 'menu_form':", "  gs 'snk_room_bridge', 'leave'")
        allowed, _ = private_room.approved_menus(baseline['menu_form'])
        checks = re.findall(r'^  if menu_form = (\d+): exit\r?$', guard, re.M)
        self.assertEqual([int(n) for n in checks], allowed)
        self.assertNotRegex(guard, r'if menu_form = \d+ or menu_form')

    def test_exhaustion_and_tutor_cost_checked_at_entry(self):
        for n in range(1,5):
            body = bodies[f'slave_private_room{n}']
            for menu in (12,13,17):
                command = f"''enter'', {n}, {menu}"
                at = body.index(command)
                self.assertIn(f"room{n}['energy'] > -4", body[at-300:at])
            at = body.index(f"''enter'', {n}, 17")
            self.assertIn('sparks >= coach_price[0]', body[at-300:at])
        bridge = bodies['snk_room_bridge']
        self.assertLess(bridge.index('snk_room_energy <= -4'), bridge.index("dynamic $swap_slave_instances"))
        self.assertIn('city_district = -1', bridge)
        self.assertIn('menu_form = snk_room_requested_menu', bridge)


if __name__ == '__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--pkg',type=Path,required=True)
    ap.add_argument('--qsp',type=Path,required=True)
    ap.add_argument('--baseline',type=Path,default=REPO/'dist/private-room-baseline/JO9_UI_v1_9_14_SNKmod_R3')
    args=ap.parse_args()
    pkg=args.pkg
    bodies={p['Name']:p['Text'] for p in json.loads((pkg/'qsp-patches.json').read_text(encoding='utf-8'))}
    originals={p['name']:p['body'] for p in read_locations(args.qsp.read_bytes())}
    baseline=originals.copy()
    for rule in json.loads((args.baseline/'path-rules.json').read_text(encoding='utf-8')):
        baseline[rule['Location']]=baseline[rule['Location']].replace(rule['Find'],rule['Replace'])
    for patch in json.loads((args.baseline/'qsp-patches.json').read_text(encoding='utf-8')):
        baseline[patch['Name']]=patch['Text']
    baseline = {k: v.replace('SNKmod/content/pic/', 'content/pic/SNKmod/').replace('SNKmod\\content\\pic\\', 'content\\pic\\SNKmod\\') for k,v in baseline.items()}
    unittest.main(argv=[sys.argv[0]])
