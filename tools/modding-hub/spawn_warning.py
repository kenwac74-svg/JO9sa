"""Read-only notice for the installed ordinary random-stock selection policy.

This recognizes the reviewed selector/pool structure, not arbitrary QSP code.
Changed control flow is reported as unknown. No game or character data is saved.
"""
import hashlib
import json
from pathlib import Path
import re
import threading

from master_editor import QspDocument

UNKNOWN = '일반 등장 제외 설정을 확인할 수 없습니다'
EXPOSED = '유니크 캐릭터가 일반 랜덤 등장 후보에 포함됩니다. 일반 등장 제외 설정을 확인하세요.'
PICK = "iffunc('jo9_random_stock_allowed',stock_type)=0:jump'loop_type'"
FALLBACK = "iffunc('jo9_random_stock_allowed',stock_type)=1:"
# Fingerprints cover executable selection control flow, with the two inspected
# gate statements removed/replaced. Comments and formatting do not affect them.
SELECTOR = 'c022cab894de278f59a744e0e1ffae2bf5c9beeaf79b98b6176b1505bfd537d1'
POOL = '24375b411256bb56535ef779d7c0a17c5e6adb94415a4b307db49bfa167503ad'


def _lines(text):
    return [re.sub(r'\s+', '', line.split('&!')[0]).lower()
            for line in text.splitlines()
            if line.strip() and not line.lstrip().startswith('!')]


def _hash(lines):
    return hashlib.sha256('\n'.join(lines).encode('utf-8')).hexdigest()


def _inspect(doc, index):
    body = doc.body('generate_stock')
    start = body.index('if special_stock > 0:')
    stop = body.find("gs 'get_stock_seed'", start)
    lines = _lines(body[start:stop if stop >= 0 else len(body)])
    pick = lines.count(PICK) == 1
    fallback = lines.count(FALLBACK) == 1
    # The recognized unguarded fallback retains its positive-ID safety check.
    skeleton = ['if__fallback__:' if line in (FALLBACK, 'ifstock_type>0:') else line
                for line in lines if line != PICK]
    if _hash(skeleton) != SELECTOR or _hash(_lines(doc.body('jo9_mob_pool'))) != POOL:
        raise ValueError('Unsupported random selection control flow')
    ranges = []
    for name, floor in (('loli', 0), ('young', 1462), ('milf', 2340)):
        first, last = index[name + '_first'], index[name + '_last']
        if type(first) is not int or type(last) is not int or first < 1 or last < first:
            raise ValueError('Invalid random pool bounds')
        ranges.append((first, max(last, floor)))
    ranges.extend(((4000, 4179), (4180, 4439), (4440, 4727)))
    denied = None
    if 'jo9_random_stock_allowed' not in doc.index:
        denied = set()
    else:
        helper = _lines(doc.body('jo9_random_stock_allowed'))
        if helper == ['result=1']:
            denied = set()
        elif len(helper) == 3 and helper[:2] == ['result=1', 'ifargs[0]<=0:result=0&exit']:
            match = re.fullmatch(r"ifinstr\('\|([0-9|]+)\|','\|'\+str\(args\[0\]\)\+'\|'\)>0:result=0", helper[2])
            if match:
                denied = {int(value) for value in match[1].split('|')}
    return {'ranges': ranges, 'candidateGuard': pick, 'fallbackGuard': fallback,
            'denied': denied}


class SpawnPolicy:
    def __init__(self, registry_path=None):
        registry = json.loads(Path(registry_path or Path(__file__).with_name(
            'spawn-policy-registry.json')).read_text(encoding='utf-8'))
        self.unique_ids = frozenset(registry['uniqueIds'])
        self.repeatable_ids = frozenset(registry['repeatableIds'])
        self._cache = {}
        self._lock = threading.RLock()

    def _snapshot(self, root):
        root = Path(root).resolve()
        qsp, index = root / 'jack.qsp', root / 'json/slave_index.json'
        try:
            key = tuple((p.stat().st_mtime_ns, p.stat().st_size) for p in (qsp, index))
            with self._lock:
                cached = self._cache.get(root)
                if cached and cached[0] == key:
                    return cached[1]
                try:
                    snapshot = _inspect(QspDocument(qsp.read_bytes()),
                                        json.loads(index.read_text(encoding='utf-8-sig')))
                except (ValueError, KeyError, IndexError, UnicodeError):
                    snapshot = None
                self._cache[root] = (key, snapshot)
                return snapshot
        except OSError:
            return None

    def identity(self, sid, name):
        sid = int(sid)
        if sid in self.unique_ids:
            return True, 'reviewed-id'
        if sid in self.repeatable_ids:
            return False, 'repeatable-template'
        if str(name or '').strip():
            return True, 'named'
        return False, 'generic'

    def read(self, root, sid, data):
        sid = int(sid)
        unique, source = self.identity(sid, data.get('seed_name'))
        row = {'unique': unique, 'warning': '', 'status': 'generic', 'identitySource': source,
               'inRandomPool': None, 'protected': None}
        if not unique:
            return row
        snapshot = self._snapshot(root)
        if snapshot is None:
            row.update(status='unknown', warning=UNKNOWN)
            return row
        in_pool = any(first <= sid <= last for first, last in snapshot['ranges'])
        row.update(inRandomPool=in_pool, candidateGuard=snapshot['candidateGuard'],
                   fallbackGuard=snapshot['fallbackGuard'])
        if not in_pool:
            row.update(status='outside-pool', protected=True)
        elif not snapshot['candidateGuard'] or not snapshot['fallbackGuard']:
            row.update(status='exposed', protected=False, warning=EXPOSED)
        elif snapshot['denied'] is None:
            row.update(status='unknown', warning=UNKNOWN)
        elif sid in snapshot['denied']:
            row.update(status='excluded', protected=True)
        else:
            row.update(status='exposed', protected=False, warning=EXPOSED)
        return row
