import concurrent.futures
import http.client
import json
import os
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

from folder_review.catalog import scan_pair
from folder_review.picker import pick_folder
from folder_review.server import ReviewService, make_server
from folder_review.thumbnails import ThumbnailCache
from folder_review.launcher import ensure_server
from folder_review.project_store import asset_path


class ServiceTests(unittest.TestCase):
    def setUp(self):
        temp_root = Path(__file__).resolve().parent / '_tmp'
        temp_root.mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=temp_root)
        self.assertTrue(Path(self.temp.name).resolve().is_relative_to(temp_root))
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.a, self.b = self.root / '원본 이미지', self.root / '비교 이미지'
        self.a.mkdir(); self.b.mkdir()
        self.svc = ReviewService(self.root / 'data')
        self.addCleanup(self.svc.close)

    def image(self, name='girl_3.png', side=None, color='red', size=(900, 300)):
        p = (side or self.a) / name
        Image.new('RGBA', size, color).save(p)
        return p

    def project(self):
        p = self.svc.store.register('검사', str(self.a), str(self.b))
        p = self.svc.store.apply_scan(p['id'], scan_pair(self.a, self.b))
        return p

    def test_thumbnail_bound_alpha_and_cache_reuse(self):
        self.image(color=(255, 0, 0, 0))
        p = self.project(); f = p['groups'][0]['rows'][0]['original'] | {'_root': str(self.a)}
        cache = self.svc.thumbs
        result = cache.get(f, priority=True)
        self.assertEqual((result['width'], result['height']), (900, 300))
        with Image.open(result['path']) as im:
            self.assertLessEqual(max(im.size), 480)
            self.assertEqual(im.getpixel((0, 0))[3], 0)
        timestamp = Path(result['path']).stat().st_mtime_ns
        self.assertEqual(cache.get(f, priority=True)['path'], result['path'])
        self.assertEqual(Path(result['path']).stat().st_mtime_ns, timestamp)

    def test_exif_rotation_and_corrupt_image_isolated(self):
        image = Image.new('RGB', (60, 100), 'blue')
        exif = image.getexif(); exif[274] = 6
        image.save(self.a / 'turn.jpg', exif=exif)
        (self.a / 'broken.png').write_bytes(b'broken')
        p = self.project()
        files = [r['original'] | {'_root': str(self.a)} for g in p['groups'] for r in g['rows']]
        results = {f['relative_path']: self.svc.thumbs.get(f, priority=True) for f in files}
        self.assertEqual((results['turn.jpg']['width'], results['turn.jpg']['height']), (100, 60))
        self.assertTrue(results['broken.png']['error'])

    def test_verify_same_metadata_replaces_thumbnail(self):
        path = self.image(size=(50, 50))
        p = self.project(); f = p['groups'][0]['rows'][0]['original'] | {'_root': str(self.a)}
        first = self.svc.thumbs.get(f, priority=True)
        before = path.stat()
        # BMP has fixed-size uncompressed pixel data.
        path.unlink(); self.image(name='girl_3.bmp', size=(50, 50), color='red')
        p = self.project(); f = p['groups'][0]['rows'][0]['original'] | {'_root': str(self.a)}
        first = self.svc.thumbs.get(f, priority=True)
        path = self.a / 'girl_3.bmp'; before = path.stat()
        Image.new('RGB', (50, 50), 'blue').save(path)
        # Preserve byte length by saving with the same mode.
        if path.stat().st_size != before.st_size:
            Image.new('RGBA', (50, 50), 'blue').save(path)
        os.utime(path, ns=(before.st_atime_ns, before.st_mtime_ns))
        self.svc.thumbs.enqueue([f], verify=True)
        second = self.svc.thumbs.get(f, priority=True)
        self.assertNotEqual(first['sha256'], second['sha256'])

    def test_picker_cancel(self):
        result = type('Result', (), {'stdout': '{"cancelled":true,"path":null,"error":null}', 'returncode': 0, 'stderr': ''})()
        with patch('folder_review.picker.subprocess.run', return_value=result):
            self.assertTrue(pick_folder()['cancelled'])

    def start_server(self):
        server = make_server('127.0.0.1', 0, self.svc)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        return server

    def request(self, server, path, method='GET', body=None, headers=None):
        connection = http.client.HTTPConnection('127.0.0.1', server.server_port, timeout=15)
        h = headers or {}
        if body is not None:
            h = {'Content-Type': 'application/json', 'X-Review-Token': self.svc.token} | h
        connection.request(method, path, json.dumps(body) if body is not None else None, h)
        response = connection.getresponse()
        result = response.status, response.read(), dict(response.getheaders())
        connection.close()
        return result

    def test_http_register_scan_list_decide_export_and_origin(self):
        self.image(); self.image(side=self.b, color='blue')
        server = self.start_server()
        status, data, _ = self.request(server, '/api/projects', 'POST', {'name': '브라우저', 'original': str(self.a), 'comparison': str(self.b)})
        self.assertEqual(status, 202)
        registered = json.loads(data); job = registered['job_id']; pid = registered['project']['id']
        for _ in range(100):
            job_data = json.loads(self.request(server, '/api/jobs/' + job)[1])['job']
            if job_data['status'] in ('ready', 'failed'):
                break
            time.sleep(.02)
        self.assertEqual(job_data['status'], 'ready')
        page = json.loads(self.request(server, '/api/projects/' + pid)[1])
        rid = page['groups'][0]['rows'][0]['id']
        self.assertEqual(page['project']['stats']['files'], 2)
        response = self.request(server, '/api/projects/' + pid + '/decisions', 'POST', {'row_ids': [rid], 'choice': 'comparison'})
        self.assertEqual(response[0], 200)
        self.assertEqual(self.request(server, '/api/projects/' + pid + '/export?format=csv')[0], 200)
        self.assertEqual(self.request(server, '/api/projects', headers={'Origin': 'https://example.com'})[0], 403)
        self.assertEqual(self.request(server, '/api/projects', 'POST', {}, {'X-Review-Token': 'wrong'})[0], 403)
        self.assertEqual(self.request(server, '/api/projects', headers={'Host': 'evil.test'})[0], 403)

    def test_asset_missing_and_link_replacement_refused(self):
        self.image(); p = self.project()
        f = p['groups'][0]['rows'][0]['original']
        server = self.start_server()
        url = '/asset/' + p['id'] + '/' + f['id'] + '?mode=original'
        self.assertEqual(self.request(server, url)[0], 200)
        with patch('folder_review.project_store.is_link', return_value=True):
            self.assertEqual(self.request(server, url)[0], 403)
        self.assertEqual(self.request(server, '/asset/' + p['id'] + '/unknown')[0], 404)

    def test_failed_rescan_preserves_previous_inventory(self):
        self.image(); p = self.project()
        with patch('folder_review.server.scan_pair', side_effect=OSError('not accessible')):
            job = self.svc.start_scan(p['id'])
            for _ in range(100):
                state = self.svc.job(job)
                if state['status'] in ('ready', 'failed'):
                    break
                time.sleep(.01)
            self.assertEqual(state['status'], 'failed')
        self.assertEqual(self.svc.store.get_project(p['id'])['stats']['files'], 1)

    def stop_child(self, pid):
        import signal
        os.kill(pid, signal.SIGTERM)
        time.sleep(.25)

    def test_launcher_reuses_own_instance_with_unicode_data_path(self):
        data = self.root / '한글 공백 데이터'
        first = ensure_server(data, port=0)
        self.addCleanup(self.stop_child, first['pid'])
        second = ensure_server(data, port=0)
        self.assertEqual(first['pid'], second['pid'])
        self.assertEqual(first['url'], second['url'])

    def test_occupied_port_does_not_reuse_foreign_server(self):
        foreign = self.start_server()
        launched = ensure_server(self.root / 'another instance', port=foreign.server_port)
        self.addCleanup(self.stop_child, launched['pid'])
        from urllib.parse import urlsplit
        self.assertNotEqual(urlsplit(launched['url']).port, foreign.server_port)

    def test_replaced_registered_root_refused(self):
        self.image(); self.image(side=self.b)
        p = self.project(); f = p['groups'][0]['rows'][0]['original']
        real_resolve = Path.resolve
        def redirected(path, *args, **kwargs):
            if path == self.a:
                return self.b
            return real_resolve(path, *args, **kwargs)
        with patch.object(Path, 'resolve', redirected):
            with self.assertRaises(PermissionError):
                asset_path(p, f)

    def test_same_metadata_change_cannot_accept_stale_thumbnail(self):
        source = self.a / 'girl_3.bmp'
        Image.new('RGB', (50, 50), 'red').save(source)
        p = self.project(); f = p['groups'][0]['rows'][0]['original']
        server = self.start_server()
        url = '/asset/' + p['id'] + '/' + f['id']
        self.assertEqual(self.request(server, url)[0], 200)
        before = source.stat()
        Image.new('RGB', (50, 50), 'blue').save(source)
        self.assertEqual(before.st_size, source.stat().st_size)
        os.utime(source, ns=(before.st_atime_ns, before.st_mtime_ns))
        response = self.request(server, '/api/projects/' + p['id'] + '/decisions', 'POST', {'row_ids':[p['groups'][0]['rows'][0]['id']], 'choice':'original'})
        self.assertEqual(response[0], 409)
        self.assertIsNone(self.svc.store.get_project(p['id'])['groups'][0]['rows'][0]['decision'])

    def test_tiff_full_view_is_browser_compatible_without_source_change(self):
        import hashlib
        import io
        source = self.a / 'image_3.tiff'
        Image.new('RGB', (70, 40), 'red').save(source)
        before = hashlib.sha256(source.read_bytes()).hexdigest()
        p = self.project(); f = p['groups'][0]['rows'][0]['original']
        server = self.start_server()
        status, content, headers = self.request(server, '/asset/' + p['id'] + '/' + f['id'] + '?mode=original')
        self.assertEqual(status, 200)
        self.assertEqual(headers['Content-Type'], 'image/png')
        with Image.open(io.BytesIO(content)) as image:
            self.assertEqual(image.size, (70,40))
        self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(), before)


if __name__ == '__main__':
    unittest.main()
