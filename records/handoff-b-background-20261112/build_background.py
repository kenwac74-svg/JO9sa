"""Prepare the approved B background module; never writes the live game.

Inputs are current WORK and frozen Git objects. Output is a declarative mod plus
an audit and the precise authority snapshot needed to reproduce this module.
"""
import argparse
from array import array
import copy
import functools
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.dont_write_bytecode = True
REPO = Path('G:/somi/JO9sa')
WORK = Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')
BASE_SHA = 'a4d1985cba2f3071405fe8e6ac3edd47a1e29c1693dd84e7485b131974665a72'
REF = '66178cf5'
PREFIX = 'tools/jo9-history-lab/'
NL = '\r\n'
MOD_ID = 'B_BACKGROUND_INITIAL_ATTRIBUTES_20261112'
CORE = {'stamina', 'beauty', 'base_beauty', 'sensitivity', 'intellect', 'temper',
        'ego', 'pride', 'custom', 'rational', 'instinct', 'style', 'stylish',
        'fat', 'fame', 'exotic', 'base_exotic'}
NAMES = ['아우렐리아', '클라우디아', '코르넬리아', '율리아', '리비아', '옥타비아',
         '발레리아', '플라비아', '마르키아', '루키아', '세르비아', '테렌티아',
         '파비아', '아이밀리아', '카이킬리아', '도미티아', '안토니아', '폼페이아',
         '칼푸르니아', '루틸리아', '비비아', '툴리아', '술피키아', '카시아']


def git_bytes(path, ref=REF):
    return subprocess.check_output(['git', '--git-dir=' + str(REPO / '.git'),
                                    'show', ref + ':' + path])


def sh(text, amount):
    # QSP cipher shifts UTF-16 code units, including surrogate pairs.
    raw = text.encode('utf-16-le', errors='surrogatepass')
    units = array('H')
    units.frombytes(raw)
    out = array('H', ((u + amount) & 65535 for u in units))
    return out.tobytes().decode('utf-16-le', errors='surrogatepass')


def parse(raw):
    fields = raw.decode('utf-16-le', errors='surrogatepass').split(NL)
    assert fields[0] == 'QSPGAME'
    count, cursor, locs = int(sh(fields[3], 5)), 4, []
    for _ in range(count):
        name, desc, body = [sh(x, 5) for x in fields[cursor:cursor + 3]]
        acts = int(sh(fields[cursor + 3], 5))
        actions = [[sh(x, 5) for x in fields[cursor + 4 + i * 3:cursor + 7 + i * 3]]
                   for i in range(acts)]
        locs.append({'name': name, 'desc': desc, 'body': body, 'actions': actions})
        cursor += 4 + acts * 3
    assert cursor == len(fields) - 1 and fields[cursor] == ''
    return fields[:3], locs


def serialize(header, locs):
    fields = header + [sh(str(len(locs)), -5)]
    for loc in locs:
        fields += [sh(loc[k], -5) for k in ['name', 'desc', 'body']]
        fields += [sh(str(len(loc['actions'])), -5)]
        for action in loc['actions']:
            fields += [sh(x, -5) for x in action]
    return (NL.join(fields) + NL).encode('utf-16-le', errors='surrogatepass')


def q(text):
    return "'" + str(text).replace("'", "''") + "'"


@functools.lru_cache(maxsize=1)
def _source_snapshot():
    src = json.loads(git_bytes(PREFIX + 'dist/data/backgrounds.json'))
    drafts = json.loads(git_bytes(PREFIX + 'dist/data/background-drafts.json'))
    final = json.loads(git_bytes(PREFIX + 'presets/잭오나_전체설정_연결검수_20261112.json'))
    settings = final['config']['backgroundSettings']
    records = src['records'] + drafts['records']
    for record in records:
        key = record['id'] + ':' + str(record['variant']) if record['kind'] == 'world' else record['id']
        record['text'] = settings['texts'].get(record['kind'], {}).get(key, record['text'])
    assert len(records) == 163
    return {'sourceRef': REF, 'sourceCommit': subprocess.check_output(
        ['git', '--git-dir=' + str(REPO / '.git'), 'rev-parse', REF], text=True).strip(),
        'records': records, 'settings': settings, 'worldPool': src['worldPool'] + ['earth_rome']}


def load_sources():
    return copy.deepcopy(_source_snapshot())


def allowed(data, world, family, occupation, age):
    links, age_rules = data['settings']['links'], data['settings']['ageRules']
    if family not in links['worldFamilies'].get(world, []):
        return False
    if occupation not in links['worldOccupations'].get(world, []):
        return False
    rule = links['occupationFamilies'].get(world + ':' + occupation, {})
    required = rule.get('required')
    if required is not None and family not in required:
        return False
    if family in rule.get('rejected', []):
        return False
    records = {(r['kind'], r['id']): r for r in data['records']}
    for kind, rid in [('world', world), ('family', family), ('occupation', occupation)]:
        rule = age_rules.get(kind, {}).get(rid, {})
        if rule.get('required') and age not in rule['required']:
            return False
        if age in rule.get('rejected', []):
            return False
        if age == 1 and records[kind, rid].get('adultOnly'):
            return False
    return True


def candidate_tables(data):
    links = data['settings']['links']
    tables = {}
    for world in dict.fromkeys(data['worldPool']):
        for age in [0, 1, 2]:
            families = {}
            for family in links['worldFamilies'].get(world, []):
                jobs = [o for o in links['worldOccupations'].get(world, [])
                        if allowed(data, world, family, o, age)]
                if jobs:
                    families[family] = jobs
            tables[world, age] = families
    return tables


def build_helper(data, tables):
    refresh = ["if $args[0] = 'refresh':", " local $dynslave_name = ''"]
    originals = {(x['kind'], x['id'], x.get('variant')): x['old']
                 for x in data.get('originalTextLines', [])}
    for record in data['records']:
        new = text_line(record)
        left, value = new.split(' = ', 1)
        old = originals.get((record['kind'], record['id'], record.get('variant')))
        if old:
            old_left, old_value = old.split(' = ', 1)
            refresh.append(' if ' + old_left + ' = ' + old_value + ': ' + new)
        elif not str(record['source']).startswith('#static_txt:'):
            refresh.append(' if ' + left + " = '': " + new)
    refresh.append(" if arrsize('$roman_name') <= 1:")
    refresh += ['  $roman_name[' + str(i + 1) + '] = ' + q(name) for i, name in enumerate(NAMES)]
    refresh += [' end', ' result = 1', ' exit', 'end']
    lines = ['! JO9 MOD START B_BACKGROUND_SELECTOR_20261112'] + refresh + [
             "if $args[0] = 'pick':",
             ' local $j9bg_rest = $args[1]',
             " if $j9bg_rest = '': $result = '' & exit",
             ' local $j9bg_items', ' local j9bg_count = 0',
             ' local j9bg_sep = 0', ':j9bg_split',
             " j9bg_sep = instr($j9bg_rest, '|')",
             ' if j9bg_sep = 0:',
             '  $j9bg_items[j9bg_count] = $j9bg_rest',
             '  j9bg_count += 1', ' else',
             '  $j9bg_items[j9bg_count] = $mid($j9bg_rest, 1, j9bg_sep - 1)',
             '  j9bg_count += 1',
             '  $j9bg_rest = $mid($j9bg_rest, j9bg_sep + 1)',
             "  jump 'j9bg_split'", ' end',
             ' $result = $j9bg_items[rand(0, j9bg_count - 1)]', ' exit', 'end',
             "if $args[0] = 'select':", " gs 'jo9_background_b', 'refresh'", ' result = 0',
             ' local j9bg_age = stock[\'age\']',
             " local $j9bg_worlds = $func('jo9_background_b', 'worlds', j9bg_age)",
             " if $j9bg_worlds = '': result = 0 & exit",
             " $stock_world = $func('jo9_background_b', 'pick', $j9bg_worlds)",
             " local $j9bg_families = $func('jo9_background_b', 'families', $stock_world, j9bg_age)",
             " if $j9bg_families = '': result = 0 & exit",
             " $stock_family = $func('jo9_background_b', 'pick', $j9bg_families)",
             " local $j9bg_jobs = $func('jo9_background_b', 'occupations', $stock_world, $stock_family, j9bg_age)",
             " if $j9bg_jobs = '': result = 0 & exit",
             " $stock_occupation = $func('jo9_background_b', 'pick', $j9bg_jobs)",
             ' local j9bg_variants = 3',
             " if $stock_world = 'earth_rome': j9bg_variants = 1",
             ' local j9bg_variant = rand(1, j9bg_variants)',
             ' dynamic "$stock_world_description = $<<$stock_world>>_description[j9bg_variant]"',
             ' $stock_family_description = $family_description[$stock_family]',
             ' $stock_occupation_description = $occupation_description[$stock_occupation]',
             " if $stock_world_description = '' or $stock_family_description = '' or $stock_occupation_description = '': result = 0 & exit",
             " stock['jo9_bg_random'] = 1", ' result = 1', ' exit', 'end',
             "if $args[0] = 'worlds':"]
    for age in [0, 1, 2]:
        values = [w for w in data['worldPool'] if tables[w, age]]
        lines.append(' if args[1] = ' + str(age) + ': $result = ' + q('|'.join(values)) + ' & exit')
    lines += [" $result = ''", ' exit', 'end', "if $args[0] = 'families':"]
    for (world, age), families in tables.items():
        lines.append(' if $args[1] = ' + q(world) + ' and args[2] = ' + str(age) +
                     ': $result = ' + q('|'.join(families)) + ' & exit')
    lines += [" $result = ''", ' exit', 'end', "if $args[0] = 'occupations':"]
    for (world, age), families in tables.items():
        for family, jobs in families.items():
            lines.append(' if $args[1] = ' + q(world) + ' and $args[2] = ' + q(family) +
                         ' and args[3] = ' + str(age) + ': $result = ' + q('|'.join(jobs)) + ' & exit')
    lines += [" $result = ''", ' exit', 'end', '! JO9 MOD END B_BACKGROUND_SELECTOR_20261112']
    return NL.join(lines)


def text_locator(record):
    if record['kind'] == 'world':
        return r'^\$' + re.escape(record['id']) + r'_description\[' + str(record['variant']) + r'\] = [^\r\n]*'
    array = 'family_description' if record['kind'] == 'family' else 'occupation_description'
    return r'^\$' + array + r'\[[\"\x27]' + re.escape(record['id']) + r'[\"\x27]\] = [^\r\n]*'


def text_line(record):
    text = record['text']
    assert text.startswith('{이름}\n')
    text = '<<$dynslave_name>><br>' + text[len('{이름}\n'):].replace('\n', '<br>')
    if record['kind'] == 'world':
        left = '$' + record['id'] + '_description[' + str(record['variant']) + ']'
    else:
        left = '$' + record['kind'] + '_description["' + record['id'] + '"]'
        if record['kind'] == 'occupation':
            left = '$occupation_description["' + record['id'] + '"]'
    return left + ' = ' + q(text)


def guard_offsets(segment):
    lines = segment.split(NL)
    output, changed, grouped = [], [], False
    pattern = re.compile(r"stock(?:_rate)?\[['\"](" + '|'.join(sorted(CORE)) + r")[\"']\]\s*(?:[+\-*/]?=)")
    for line in lines:
        targeted = not line.lstrip().startswith('!') and bool(pattern.search(line))
        if targeted and not grouped:
            output.append(" if stock['jo9_bg_random'] ! 1:")
            grouped = True
        if not targeted and grouped:
            output.append(' end')
            grouped = False
        output.append(line)
        if targeted:
            changed.append(line)
    if grouped:
        output.append(' end')
    return NL.join(output), changed


@functools.lru_cache(maxsize=1)
def _build_module():
    data, raw = load_sources(), WORK.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE_SHA, 'WORK baseline changed; rebuild after review'
    header, locs = parse(raw)
    assert serialize(header, locs) == raw
    before = copy.deepcopy(locs)
    byname = {l['name']: l for l in locs}
    current = byname['#static_txt']['body']
    original_body = next(l['body'] for l in parse(git_bytes('assets/runtime/2.4.1/jack.qsp', '607c7ec6'))[1]
                         if l['name'] == '#static_txt')
    edits, conflicts, source_lines, new_lines = [], [], [], []

    def edit(location, old, new, reason):
        body = byname[location]['body']
        assert body.count(old) == 1, (location, reason, body.count(old))
        assert old != new
        edits.append({'location': location, 'field': 'body', 'old': old, 'new': new,
                      'count': 1, 'reason': reason})
        byname[location]['body'] = body.replace(old, new)

    for record in data['records']:
        actual = re.findall(text_locator(record), current, re.M)
        replacement = text_line(record)
        if str(record['source']).startswith('#static_txt:'):
            original = re.findall(text_locator(record), original_body, re.M)
            assert len(actual) == len(original) == 1, record
            if actual != original:
                conflicts.append({'kind': record['kind'], 'id': record['id']})
            source_lines.append({'kind': record['kind'], 'id': record['id'],
                                 'variant': record.get('variant'), 'source': record['source'], 'old': actual[0]})
            edit('#static_txt', actual[0], replacement, 'approved background text ' + record['id'])
        else:
            assert not actual, record
            new_lines.append(replacement)
    assert not conflicts, ('manual background text edits need reconciliation', conflicts)
    assert len(source_lines) == 152 and len(new_lines) == 11

    tables = candidate_tables(data)
    links = data['settings']['links']
    pools = {'origin_world': data['worldPool']}
    pools.update({w + '_family': fs for w, fs in links['worldFamilies'].items()})
    for family in dict.fromkeys(r['id'] for r in data['records'] if r['kind'] == 'family'):
        jobs = []
        for families in tables.values():
            jobs += families.get(family, [])
        pools[family + '_occupation'] = list(dict.fromkeys(jobs))
    for pool, values in pools.items():
        pattern = r'^\$' + re.escape(pool) + r'\[\d+\] = [^\r\n]*(?:\r?\n|$)'
        matches = list(re.finditer(pattern, byname['#static_txt']['body'], re.M))
        replacement = NL.join('$' + pool + '[' + str(i + 1) + '] = ' + q(v) for i, v in enumerate(values))
        if matches:
            start, end = matches[0].start(), matches[-1].end()
            old = byname['#static_txt']['body'][start:end].rstrip('\r\n')
            # Existing pool definitions are a single contiguous block.
            assert all(re.match(r'^\$' + re.escape(pool) + r'\[', x) for x in old.split(NL)), pool
            if old != replacement:
                edit('#static_txt', old, replacement, 'v2 union pool ' + pool)
        else:
            new_lines += replacement.split(NL)
    new_lines += ['$roman_name[' + str(i + 1) + '] = ' + q(name) for i, name in enumerate(NAMES)]
    static_anchor = byname['#static_txt']['body'].split(NL)[-1]
    if not static_anchor.strip():
        static_anchor = byname['#static_txt']['body'].split(NL)[-2] + NL
    edit('#static_txt', static_anchor, static_anchor + NL + '! JO9 MOD START B_BACKGROUND_NEW_IDS_20261112' +
         NL + NL.join(new_lines) + NL + '! JO9 MOD END B_BACKGROUND_NEW_IDS_20261112', 'new IDs and Roman name pool')

    g = byname['generate_stock']['body']
    start = g.index('!CREATING RANDOM BACKGROUND IF NOT PRESET')
    end = g.index("if $stock_world = 'prehistoric':", start)
    old = g[start:end]
    hook = ['! JO9 MOD START B_BACKGROUND_SELECTION_20261112',
            "stock['jo9_bg_random'] = 0",
            "if special_stock = 0 and creating_clone = 0 and $stock_world_description = '' and $stock_family_description = '' and $stock_occupation_description = '':",
            " if func('jo9_background_b', 'select') = 0:",
            '  stock_state = 0',
            "  msg '현재 연령과 승인된 연결 조건을 만족하는 배경 후보가 없어 생성을 중단했습니다.'",
            '  exit', ' end', 'end', '! JO9 MOD END B_BACKGROUND_SELECTION_20261112']
    edit('generate_stock', old, NL.join(hook) + NL + old, 'fully random generation uses validated v2 candidates')
    rome = ["elseif $stock_world = 'earth_rome':", " $namebase = 'roman'", ' stock["nation_index"] = 10',
            ' stock["world_index"] = 4', " $stock_world_auk = '지구의 고대 로마'",
            " if stock['stamina'] < 5: stock['stamina'] += 1",
            " if stock['ego'] > 1: stock['ego'] -= 1", " if stock['intellect'] > 1: stock['intellect'] -= 1"]
    anchor = "elseif $stock_world = 'medieval':" + NL + "\t$namebase = 'medieval'"
    edit('generate_stock', anchor, NL.join(rome) + NL + anchor, 'Rome world adjustment and independent name/nation group')
    anchor = "\t$stock_world_auk = '전통적인 농경 세계'" + NL + "\tif stock['temper'] < 5: stock['temper'] -= 1"
    edit('generate_stock', anchor, anchor.replace("stock['temper'] < 5", "stock['temper'] > 1"), 'medieval temper lower-bound correction')

    # Preserve all explicitly preset/fixed/clone initialization by guarding only
    # the now-retired origin/occupation stat adjustments for new random stock.
    g = byname['generate_stock']['body']
    family_start = g.index("if $stock_family = 'tribe':")
    occupation_start = g.index('!OCCUPATION', family_start)
    fertility_start = g.index('!FERTILITY', occupation_start)
    family_old, job_old = g[family_start:occupation_start], g[occupation_start:fertility_start]
    family_new, removed_family = guard_offsets(family_old)
    job_new, removed_job = guard_offsets(job_old)
    family_meta = ["elseif $stock_family = 'ancient_noble':", ' stock["family_index"] = 2',
                   " $stock_family_auk = '고대 귀족의 딸'", "elseif $stock_family = 'ancient_citizen':",
                   ' stock["family_index"] = 3', " $stock_family_auk = '자유시민의 딸'",
                   "elseif $stock_family = 'roman_freedslave':", ' stock["family_index"] = 4',
                   " $stock_family_auk = '해방노예의 딸'"]
    cut = family_new.rfind(NL + 'end')
    assert cut > 0
    family_new = family_new[:cut] + NL + NL.join(family_meta) + family_new[cut:]
    edit('generate_stock', family_old, '! JO9 MOD START B_BACKGROUND_INITIAL_ATTRIBUTES_20261112' + NL +
         '! JO9 MOD START B_BACKGROUND_ORIGIN_STATS_20261112' + NL +
         family_new + '! JO9 MOD END B_BACKGROUND_ORIGIN_STATS_20261112' + NL + NL,
         'remove random origin numerical attribute adjustments; new origin labels and existing class indices')
    # New work indices reuse corresponding existing categories, without bonuses.
    jobs = [('courtesan', '고급 에스코트', 3), ('serial_killer', '살인마', 5),
            ('gang_member', '폭력조직 조직원', 5), ('mafia_boss', '폭력조직 간부', 2),
            ('former_slave', '노예', 4), ('schoolgirl', '여학생', 5), ('dancer', '무용가', 3)]
    job_meta = []
    # v2 already selected an approved final ID. Keep the old age-based rename
    # only for fixed/preset initialization outside this new random path.
    assert job_new.count('if meta_type = 3:' + NL) == 3
    job_new = job_new.replace('if meta_type = 3:' + NL,
                             "if meta_type = 3 and stock['jo9_bg_random'] ! 1:" + NL)
    for rid, label, index in jobs:
        job_meta += ['elseif $stock_occupation = ' + q(rid) + ':',
                     ' stock["work_index"] = ' + str(index), ' $stock_occupation_auk = ' + q(label)]
    cut = job_new.rfind(NL + 'end')
    job_new = job_new[:cut] + NL + NL.join(job_meta) + job_new[cut:]
    edit('generate_stock', job_old, '! JO9 MOD START B_BACKGROUND_OCCUPATION_STATS_20261112' + NL + job_new +
         '! JO9 MOD END B_BACKGROUND_OCCUPATION_STATS_20261112' + NL +
         '! JO9 MOD END B_BACKGROUND_INITIAL_ATTRIBUTES_20261112' + NL + NL,
         'remove random occupation numerical attribute adjustments; new job labels and existing class indices')

    data['originalTextLines'] = source_lines
    helper = {'name': 'jo9_background_b', 'desc': '', 'body': build_helper(data, tables), 'actions': []}
    locs.append(helper)
    after_raw = serialize(header, locs)
    # Reverse each exact edit, remove appended location and assert true byte identity.
    reverse = copy.deepcopy(locs[:-1]); reverse_by = {l['name']: l for l in reverse}
    for e in reversed(edits):
        assert reverse_by[e['location']]['body'].count(e['new']) == 1
        reverse_by[e['location']]['body'] = reverse_by[e['location']]['body'].replace(e['new'], e['old'])
    assert serialize(header, reverse) == raw
    protected = ['! JO9 MOD START EGEYA_PRESET_PROFILE_20261026',
                 '! JO9 MOD START CHUNHYANG_PROFILE_CALL_20261112']
    oldg = next(l['body'] for l in before if l['name'] == 'generate_stock')
    newg = byname['generate_stock']['body']
    protected_ok = all(oldg[oldg.index(marker):].split('! JO9 MOD END', 1)[0] in newg for marker in protected)
    assert all(l == next(x for x in locs if x['name'] == l['name']) for l in before
               if l['name'] not in ['#static_txt', 'generate_stock'])
    module = {'id': MOD_ID, 'before_sha256': BASE_SHA, 'after_sha256': hashlib.sha256(after_raw).hexdigest(),
              'description': 'Approved B1/B2 texts, connections, 11 IDs and world-only initial attribute offsets.',
              'edits': edits, 'add_locations': [helper]}
    audit = {'baseline': str(WORK), 'beforeSha256': BASE_SHA, 'moduleOnlyAfterSha256': module['after_sha256'],
             'sourceCommit': data['sourceCommit'], 'existingTexts': 152, 'newTexts': 11,
             'manualTextConflicts': conflicts, 'guardedInitialAttributeLines': len(removed_family) + len(removed_job),
             'guardedFamilyLines': removed_family, 'guardedOccupationLines': removed_job,
             'coreAttributeKeys': sorted(CORE), 'alteredSkillLines': 0,
             'roundtripByteIdentical': True, 'reverseByteIdentical': True, 'allEditsExactlyMatched': True,
             'fixedProfileFragmentsPreserved': protected_ok,
             'oldCacheExactTextGuards': len(source_lines),
             'oldCacheRefresh': 'At random selection only; exact historic global strings update, new slots only when empty, Roman names only if absent; owned copies unchanged.',
             'persistentNewFields': {"instance['jo9_bg_random']": '1 only for fully random new backgrounds; otherwise0'},
             'existingSavedIdentityReused': ['$instance_world', '$instance_family', '$instance_occupation'],
             'worldWeights': {w: data['worldPool'].count(w) for w in dict.fromkeys(data['worldPool'])},
             'candidateCounts': {w + ':' + str(a): {'families': len(fs), 'combinations': sum(map(len, fs.values()))}
                                 for (w, a), fs in tables.items()},
             'romeMetadata': {'namebase': 'roman', 'nationIndex': 10, 'worldDevelopmentIndex': 4,
                              'names': NAMES, 'namesAreNeutralAuthoredExamples': True},
             'newOriginClassIndices': {'ancient_noble': 2, 'ancient_citizen': 3, 'roman_freedslave': 4},
             'newOccupationClassIndices': {rid: index for rid, label, index in jobs},
             'engineExecution': 'NOT_RUN', 'runtimeWrites': False}
    return {'module': module, 'audit': audit, 'snapshot': dict(data, originalTextLines=source_lines)}


def build_module():
    return copy.deepcopy(_build_module())


def native_fixture(raw, output, old_cache=False):
    header, locs = parse(raw)
    if old_cache:
        historic = next(l['body'] for l in parse(git_bytes('assets/runtime/2.4.1/jack.qsp', '607c7ec6'))[1]
                        if l['name'] == '#static_txt')
        next(l for l in locs if l['name'] == '#static_txt')['body'] = historic
    code = ['killall', "$onnewloc = ''", "$ongload = ''", "$counter = ''", 'settimer 0',
            'qa_checks = 0', 'qa_failed = 0', "gs '#static_base'", "gs '#dynamic'", "gs '#static_txt'"]

    def check(expression, label):
        code.extend(['qa_checks += 1', 'if (' + expression + ') = 0:',
                     ' qa_failed += 1', ' $qa_errors[] = ' + q(label), 'end'])

    check("loc('jo9_background_b')", 'production helper present')
    if old_cache:
        code += ["$dynslave_name = 'RESTORED_NAME'", "$slave_world_description = 'OWNED_STORY_COPY'",
                 "$family_description['tribe'] = 'MANUAL_GLOBAL_BACKGROUND'",
                 "gs 'jo9_background_b', 'refresh'"]
        check("$dynslave_name = 'RESTORED_NAME'", 'refresh restores temporary name context')
        check("$slave_world_description = 'OWNED_STORY_COPY'", 'owned description copy preserved')
        check("$family_description['tribe'] = 'MANUAL_GLOBAL_BACKGROUND'", 'manual old global preserved')
        code.append("local $dynslave_name = ''")
        for record in load_sources()['records']:
            if record['kind'] == 'family' and record['id'] == 'tribe':
                continue
            left, value = text_line(record).split(' = ', 1)
            # Static templates are intentionally initialized with an empty name,
            # while the caller name is preserved by the LOCAL in refresh.
            check(left + ' = ' + value, 'historic global refreshed: ' + record['id'])
        code += ["$occupation_description['courtesan'] = 'MANUAL_NEW_SLOT'", "$roman_name[1] = 'MANUAL_ROMAN_NAME'",
                 "gs 'jo9_background_b', 'refresh'"]
        check("$occupation_description['courtesan'] = 'MANUAL_NEW_SLOT'", 'custom new text slot preserved')
        check("$roman_name[1] = 'MANUAL_ROMAN_NAME'", 'custom existing Roman pool preserved')
    check("arrsize('$roman_name') = 25", 'Roman pool has24 entries at1..24')
    if old_cache:
        check("instr($func('jo9_background_b', 'worlds', 0), 'earth_rome') > 0", 'Rome weighted slot works without static reload')
    else:
        check("arrsize('$origin_world') = 20", 'existing18 weighted slots plusRome')
    check("$func('jo9_background_b', 'pick', 'one') = 'one'", 'singleton pick')
    check("$func('jo9_background_b', 'pick', '') = ''", 'empty pick')
    check("$func('jo9_background_b', 'worlds', 99) = ''", 'unknown age rejects')
    check("$func('jo9_background_b', 'families', 'missing_world', 0) = ''", 'unknown world rejects')
    code.extend(["stock['age'] = 99", "qa_actual = func('jo9_background_b', 'select')"])
    check('qa_actual = 0', 'unsupported age has explicit no-candidate failure')
    code.extend(['qa_i = 0', 'qa_rome = 0', ':j9bg_qa_loop',
                 "stock['age'] = qa_i mod 3", "stock['jo9_bg_random'] = 0",
                 "qa_actual = func('jo9_background_b', 'select')"])
    check('qa_actual = 1', 'random helper succeeds for each supported age')
    check("stock['jo9_bg_random'] = 1", 'random flag marked')
    check("$stock_world_description ! '' and $stock_family_description ! '' and $stock_occupation_description ! ''",
          'all selected IDs have texts')
    code.extend(["if $stock_occupation = 'schoolgirl' or $stock_occupation = 'tribal_girl':"])
    check("stock['age'] = 0", 'schoolgirl/tribal girl approvedage0 only')
    code.extend(['end', "if $stock_occupation = 'mafia_boss':"])
    check("stock['age'] = 2", 'mafia boss approvedage2 only')
    code.extend(['end', "if $stock_occupation = 'gang_member':"])
    check("stock['age'] ! 2", 'gang member excludesmature')
    code.extend(['end', "if $stock_occupation = 'courtesan' or $stock_occupation = 'former_slave':"])
    check("stock['age'] ! 1", 'adult-only newjobs excludeage1')
    code.extend(['end', "if $stock_world = 'earth_rome': qa_rome += 1", 'qa_i += 1',
                 "if qa_i < 600: jump 'j9bg_qa_loop'"])
    check('qa_rome > 0', 'Rome weightedslot reachable')
    code += ["savegame 'qa.sav'", "if qa_failed > 0: msg 'FAIL background B ' + str(qa_failed) & exit",
             "msg 'JO9_QA_BACKGROUNDB_generation_COMPLETE'", 'exit']
    next(l for l in locs if l['name'] == 'Start')['body'] = NL.join(code)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(serialize(header, locs))
    shutil.copyfile(WORK.parent / 'config.xml', output.parent / 'config.xml')
    (output.parent / 'FastQSP.ini').write_bytes(b'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n')
    plan = [{'name': 'background-b', 'file': str(output),
             'marker': 'JO9_QA_BACKGROUNDB_generation_COMPLETE',
             'checkpoint': 'real production selector, all ages, Roman slot, empty and invalid pools'}]
    (output.parent / 'plan.json').write_text(json.dumps(plan, indent=2) + '\n', encoding='utf-8')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--out', type=Path, required=True)
    p.add_argument('--fixture', type=Path)
    p.add_argument('--native-fixture', type=Path)
    p.add_argument('--old-cache-fixture', type=Path)
    args = p.parse_args()
    assert args.out.resolve() != WORK.parent.resolve()
    result = build_module()
    args.out.mkdir(parents=True, exist_ok=True)
    for key, name in [('module', 'B_BACKGROUND_MODULE.json'), ('audit', 'BACKGROUND_AUDIT.json'),
                      ('snapshot', 'BACKGROUND_AUTHORITY_SNAPSHOT.json')]:
        (args.out / name).write_text(json.dumps(result[key], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if args.fixture or args.native_fixture or args.old_cache_fixture:
        assert not args.fixture or args.fixture.resolve() != WORK.resolve()
        header, locs = parse(WORK.read_bytes()); byname = {l['name']: l for l in locs}
        for e in result['module']['edits']:
            body = byname[e['location']]['body']
            assert body.count(e['old']) == e['count']
            byname[e['location']]['body'] = body.replace(e['old'], e['new'])
        locs += result['module']['add_locations']
        fixture_raw = serialize(header, locs)
        if args.fixture:
            args.fixture.parent.mkdir(parents=True, exist_ok=True)
            args.fixture.write_bytes(fixture_raw)
        if args.native_fixture:
            assert args.native_fixture.resolve() != WORK.resolve()
            native_fixture(fixture_raw, args.native_fixture)
        if args.old_cache_fixture:
            assert args.old_cache_fixture.resolve() != WORK.resolve()
            native_fixture(fixture_raw, args.old_cache_fixture, old_cache=True)
    print(json.dumps({'edits': len(result['module']['edits']),
                      'guardedAttributeLines': result['audit']['guardedInitialAttributeLines'],
                      'moduleOnlyAfterSha256': result['module']['after_sha256']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
