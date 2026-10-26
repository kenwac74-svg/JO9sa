"""Bounded background thumbnail queue; originals are never written."""

import hashlib
import itertools
import json
import os
import queue
import threading
import uuid
from pathlib import Path

from PIL import Image, ImageOps

from .catalog import stable_id
from .project_store import asset_path


class ThumbnailCache:
    def __init__(self, cache_dir: Path, workers: int = 2):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.items = {}
        self.queue = queue.PriorityQueue()
        self.sequence = itertools.count()
        self.closed = False
        self.threads = [threading.Thread(target=self._worker, daemon=True) for _ in range(workers)]
        for thread in self.threads:
            thread.start()

    def key(self, file):
        return stable_id('thumb-v1', file['_root'], file['relative_path'], file['size'], file['mtime_ns'])

    def _schedule(self, file, priority=10, verify=False):
        key = self.key(file)
        with self.lock:
            item = self.items.get(key)
            if item and not (verify and item['event'].is_set()):
                if priority == 0 and item['status'] == 'pending':
                    self.queue.put((0, next(self.sequence), key, file))
                return item
            item = {'status': 'pending', 'event': threading.Event(), 'result': {}}
            self.items[key] = item
            meta, image = self.cache_dir / (key + '.json'), self.cache_dir / (key + '.webp')
            if meta.exists() and image.exists() and not verify:
                try:
                    result = json.loads(meta.read_text(encoding='utf-8'))
                    result['path'] = str(image)
                    item.update(status='ready', result=result)
                    item['event'].set()
                    return item
                except (OSError, ValueError):
                    pass
            self.queue.put((priority, next(self.sequence), key, file))
            return item

    def enqueue(self, files: list[dict], verify=False):
        for file in files:
            self._schedule(file, verify=verify)

    def info(self, file):
        with self.lock:
            item = self.items.get(self.key(file))
            if not item:
                return {'status': 'pending'}
            return {'status': item['status']} | {k: v for k, v in item['result'].items() if k != 'path'}

    def get(self, file: dict, priority: bool = False) -> dict:
        item = self._schedule(file, priority=0 if priority else 10)
        if not item['event'].wait(60):
            raise TimeoutError('썸네일을 생성 중입니다. 잠시 후 다시 열어 주세요.')
        return dict(item['result'])

    def progress(self, files):
        info = [self.info(f) for f in files]
        return {'total': len(info), 'ready': sum(i['status'] == 'ready' for i in info),
                'failed': sum(i['status'] == 'failed' for i in info)}

    def _worker(self):
        while not self.closed:
            try:
                _, _, key, file = self.queue.get(timeout=.2)
            except queue.Empty:
                continue
            with self.lock:
                item = self.items[key]
                if item['status'] != 'pending':
                    self.queue.task_done()
                    continue
                item['status'] = 'running'
            try:
                result = self._generate(file, key)
                status = 'ready'
            except Exception as error:
                result = {'error': str(error), 'path': None}
                status = 'failed'
            with self.lock:
                item.update(status=status, result=result)
                item['event'].set()
            self.queue.task_done()

    def _generate(self, file, key):
        p = {file['side'] + '_root': file['_root']}
        source = asset_path(p, file)
        before = source.stat()
        if (before.st_size, before.st_mtime_ns) != (file['size'], file['mtime_ns']):
            raise ValueError('검사 후 파일이 바뀌었습니다. 폴더를 다시 검사해 주세요.')
        with source.open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        meta = self.cache_dir / (key + '.json')
        target = self.cache_dir / (key + '.webp')
        if meta.exists() and target.exists():
            cached = json.loads(meta.read_text(encoding='utf-8'))
            if cached.get('sha256') == digest:
                return cached | {'path': str(target)}
        with Image.open(source) as image:
            frames = getattr(image, 'n_frames', 1)
            corrected = ImageOps.exif_transpose(image)
            width, height = corrected.size
            thumb = corrected.convert('RGBA')
            thumb.thumbnail((480, 480), Image.Resampling.LANCZOS)
            token = uuid.uuid4().hex
            temp = self.cache_dir / (key + '.' + token + '.tmp')
            try:
                thumb.save(temp, format='WEBP', quality=82, method=4)
                after = source.stat()
                if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
                    raise ValueError('읽는 중 파일이 바뀌었습니다. 다시 검사해 주세요.')
                os.replace(temp, target)
            finally:
                if temp.exists():
                    temp.unlink()
        result = {'width': width, 'height': height, 'frames': frames, 'sha256': digest, 'error': None}
        temp_meta = self.cache_dir / (key + '.' + uuid.uuid4().hex + '.tmp')
        try:
            temp_meta.write_text(json.dumps(result), encoding='utf-8')
            os.replace(temp_meta, meta)
        finally:
            if temp_meta.exists():
                temp_meta.unlink()
        return result | {'path': str(target)}

    def close(self):
        self.closed = True
        for thread in self.threads:
            thread.join(timeout=2)
