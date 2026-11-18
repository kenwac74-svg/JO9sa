"""Use the same image-sharing resolver as the checklist; never evaluate game text."""
import json
from pathlib import Path
import shutil
import subprocess


class AppearanceSharing:
    def __init__(self, core_path):
        self.core_path = Path(core_path).resolve()

    def call(self, game, action, **fields):
        node = shutil.which('node')
        if not node:
            raise ValueError('공유 이미지 연결을 확인하려면 Node.js가 필요합니다.')
        request = {'game': str(Path(game).resolve()), 'action': action, **fields}
        proc = subprocess.run(
            [node, str(self.core_path)], input=json.dumps(request, ensure_ascii=False),
            capture_output=True, text=True, encoding='utf-8', timeout=30,
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        if proc.returncode:
            try:
                message = json.loads(proc.stderr).get('error')
            except (ValueError, AttributeError):
                message = '공유 이미지 연결을 확인하지 못했습니다.'
            raise ValueError(message)
        return json.loads(proc.stdout)

    def resolve_data(self, paths, sid, data=None):
        fields = {'id': int(sid)}
        if data is not None:
            fields['dataOverride'] = data
        return self.call(paths.root, 'resolve', **fields)

    def request(self, game, sid, body):
        action = body.get('action', 'read')
        if action not in ('read', 'preview', 'apply'):
            raise ValueError('공유 설정 동작을 확인하세요.')
        if action == 'read':
            return self.call(game, 'describe', id=int(sid))
        allowed = ('peerIds', 'expectedHash', 'policyHash', 'planHash')
        return self.call(game, action, id=int(sid),
                         **{key: body[key] for key in allowed if key in body})

    def materialize_group(self, game, sid):
        ids = self.call(game, 'targets', id=int(sid))
        return self.call(game, 'materialize', ids=ids)
