"""Exercise real integrated HTTP routes against a tiny disposable game fixture."""
import io
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

HERE = Path(__file__).resolve().parents[1]
LIVE = Path('G:/somi/JO9sa/tools/modding-hub')
STUDIO = Path('G:/Codex/tmp/claude-character-studio-e0edb064/tools/jo9-history-lab')
sys.path[:0] = [str(HERE), str(LIVE), str(STUDIO)]
import master_editor
spec = importlib.util.spec_from_file_location('background_hub_candidate', HERE / 'server.py')
hub = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hub)


class Overlay:
    def __truediv__(self, name):
        candidate = HERE / name
        return candidate if candidate.exists() else LIVE / name


class QuietHelper:
    def __init__(self, *args):
        pass
    def close(self):
        pass


class BackgroundHttp(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'json/slaves').mkdir(parents=True)
        self.character = self.root / 'json/slaves/3100_unique.json'
        self.character.write_text(json.dumps({'seed_name': 'Unique', 'seed_stamina': 9, 'seed_world_description': 'Manual lore'}), 'utf-8')
        (self.root / 'jack.qsp').write_bytes(master_editor.make_fixture({'#masters_base': '', 'init_game': ''}))
        urls = self.root / 'urls.json'
        urls.write_text('{}', 'utf-8')
        self.patches = [patch.object(hub, 'HERE', Overlay()), patch.object(hub, 'HelperDashboard', QuietHelper)]
        for current in self.patches:
            current.start()
            self.addCleanup(current.stop)
        self.server = hub.create_server(STUDIO, Path('G:/somi/JO9sa'), urls, 0)
        base = sys.modules['studio_server']
        self.assertIsNotNone(base.api, base.BACKEND_ERROR)
        game = base.api.GamePaths(str(self.root))
        for current in [patch.object(base, 'paths', return_value=game), patch.object(base, 'game_status', return_value={'ok': True, 'root': str(self.root)})]:
            current.start()
            self.addCleanup(current.stop)
        self.addCleanup(self.server.server_close)

    def call(self, path, body=None):
        payload = b'' if body is None else json.dumps(body).encode('utf-8')
        method = 'GET' if body is None else 'POST'
        request = (f'{method} {path} HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n'
                   f'Content-Length: {len(payload)}\r\nConnection: close\r\n\r\n').encode() + payload
        class StreamSocket:
            def __init__(self):
                self.response = bytearray()
            def makefile(self, *_args):
                return io.BytesIO(request)
            def sendall(self, block):
                self.response.extend(block)
        connection = StreamSocket()
        self.server.RequestHandlerClass(connection, ('127.0.0.1', 0), self.server)
        header, raw = bytes(connection.response).split(b'\r\n\r\n', 1)
        return int(header.split(b' ', 2)[1]), json.loads(raw)

    def test_picker_save_refreshes_revision_then_common_save_keeps_metadata(self):
        status, actor = self.call('/api/char/3100')
        self.assertEqual(status, 200, actor)
        status, saved = self.call('/api/talkbook/3100', {'revision': actor['revision'], 'applyBackground': True,
            'book': {'background': {'world': 'earth_rome', 'family': 'ancient_citizen', 'occupation': 'courtesan'}}})
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['character']['data']['seed_world'], 'earth_rome')
        self.assertNotEqual(saved['revision'], actor['revision'])
        status, stale = self.call('/api/char/3100/fields', {'revision': actor['revision'], 'set': {'seed_stamina': 3}})
        self.assertEqual(status, 400, stale)
        status, fields = self.call('/api/char/3100/fields', {'revision': saved['revision'], 'set': {'seed_stamina': 8}})
        self.assertEqual(status, 200, fields)
        self.assertEqual(fields['character']['data']['seed_world'], 'earth_rome')
        self.assertEqual(fields['character']['data']['seed_world_description'], 'Manual lore')
        status, changed = self.call('/api/char/3100/fields', {'revision': fields['character']['revision'], 'set': {'seed_world': 'modern'}})
        self.assertEqual(status, 200, changed)
        self.assertEqual(changed['character']['data']['seed_world'], 'modern')

    def test_served_seed_whitelist_matches_backend_and_unknown_ids_fail(self):
        status, keys = self.call('/v/fixture/data/game-seed-keys.json')
        self.assertEqual(status, 200)
        self.assertTrue(set(('world', 'family', 'occupation', 'background_fixed')).issubset(keys['keys']))
        status, actor = self.call('/api/char/3100')
        before = self.character.read_bytes()
        status, result = self.call('/api/char/3100/fields', {'revision': actor['revision'], 'set': {'seed_family': 'peasant'}})
        self.assertEqual(status, 400, result)
        self.assertEqual(self.character.read_bytes(), before)


if __name__ == '__main__':
    unittest.main()
