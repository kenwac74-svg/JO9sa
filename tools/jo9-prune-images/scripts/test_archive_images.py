"""Isolated filesystem behavior checks; never opens the user's JO9 installation."""
import argparse
import os
from pathlib import Path
import tempfile
import unittest
import archive_images as tool


class ArchiveTests(unittest.TestCase):
    @staticmethod
    def qsp_bytes(body='test game code'):
        shift = lambda value: ''.join(chr((ord(c) - 5) & 65535) for c in value)
        fields = ['QSPGAME', '', '', shift('1'), shift('interior_change'), '', shift(body), shift('0'), '']
        return '\r\n'.join(fields).encode('utf-16-le')

    def setUp(self):
        test_root = Path(os.environ.get('JO9_TEST_ROOT', str(Path.cwd()))).resolve()
        self.temp = tempfile.TemporaryDirectory(prefix='jo9-archive-test-', dir=test_root)
        require_test_path = Path(self.temp.name).resolve()
        if require_test_path.parent != test_root:
            raise RuntimeError('Test directory escaped the chosen test root')
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / 'JO9'
        self.pic = self.root / 'game/content/pic/work/example.png'
        self.pic.parent.mkdir(parents=True)
        self.pic.write_bytes(b'original image bytes')
        self.code = self.root / 'game/jack.qsp'
        self.code.write_bytes(self.qsp_bytes())
        self.snap = self.base / 'snapshot.json'
        tool.save(self.snap, tool.snapshot(self.root.resolve(), []), new=True)
        self.audit = self.base / 'audit.json'
        self.rel = self.pic.relative_to(self.root).as_posix()
        tool.save(self.audit, {'root': str(self.root), 'snapshot_sha256': tool.sha(self.snap),
                              'rows': [{'path': self.rel, 'status': 'unreferenced_candidate'}]}, new=True)
        self.review = self.base / 'reviews.json'
        tool.save(self.review, {'audit_root': str(self.root), 'reviews': [{
            'path': self.rel, 'decision': 'move',
            'proofs': {k: f'Isolated fixture evidence for {k}' for k in tool.PROOFS}}]}, new=True)
        self.archive = self.base / 'outside/first-run'
        self.plan = self.base / 'plan.json'
        self.args = argparse.Namespace(snapshot=str(self.snap), audit=str(self.audit),
                                       reviews=str(self.review), archive=str(self.archive),
                                       output=str(self.plan), protect=[])

    def prepare(self):
        return tool.make_plan(self.args)

    def apply(self):
        return tool.apply_plan(argparse.Namespace(plan=str(self.plan)))

    def restore(self):
        return tool.restore(argparse.Namespace(journal=str(self.archive / 'journal.json')))

    def test_plan_is_read_only_and_roundtrip_preserves_bytes(self):
        expected = self.pic.read_bytes()
        result = self.prepare()
        self.assertEqual(result['count'], 1)
        self.assertEqual(result['moved'], 0)
        self.assertFalse(self.archive.exists())
        self.assertEqual(self.pic.read_bytes(), expected)
        self.apply()
        destination = self.archive / 'files' / self.rel
        self.assertFalse(self.pic.exists())
        self.assertEqual(destination.read_bytes(), expected)
        self.assertEqual(tool.read(self.archive / 'journal.json')['status'], 'complete')
        self.restore()
        self.assertEqual(self.pic.read_bytes(), expected)
        self.assertFalse(destination.exists())
        self.assertEqual(tool.read(self.archive / 'journal.json')['status'], 'restored')
        self.restore()  # Restore is repeatable, apply is intentionally not repeatable.

    def test_source_change_stops_before_any_move(self):
        self.prepare()
        self.code.write_bytes(self.qsp_bytes('changed game code'))
        with self.assertRaisesRegex(ValueError, 'snapshot changed'):
            self.apply()
        self.assertTrue(self.pic.exists())
        self.assertFalse(self.archive.exists())

    def test_image_change_same_metadata_still_caught_by_hash(self):
        import os
        self.prepare()
        stat = self.pic.stat()
        self.pic.write_bytes(b'X' * stat.st_size)
        os.utime(self.pic, ns=(stat.st_atime_ns, stat.st_mtime_ns))
        with self.assertRaisesRegex(ValueError, 'Image changed'):
            self.apply()
        self.assertFalse(self.archive.exists())

    def test_archive_inside_game_refused(self):
        self.args.archive = str(self.root / 'reserve')
        with self.assertRaisesRegex(ValueError, 'outside'):
            self.prepare()
        self.assertFalse(self.plan.exists())

    def test_archive_collision_never_overwritten(self):
        self.prepare()
        destination = self.archive / 'files' / self.rel
        destination.parent.mkdir(parents=True)
        destination.write_bytes(b'preserve this existing file')
        with self.assertRaisesRegex(ValueError, 'collision'):
            self.apply()
        self.assertEqual(destination.read_bytes(), b'preserve this existing file')
        self.assertTrue(self.pic.exists())

    def test_restore_collision_preserves_both_files(self):
        self.prepare()
        self.apply()
        self.pic.write_bytes(b'new user content')
        with self.assertRaisesRegex(ValueError, 'collision'):
            self.restore()
        self.assertEqual(self.pic.read_bytes(), b'new user content')
        self.assertTrue((self.archive / 'files' / self.rel).exists())

    def test_candidate_without_dynamic_review_refused(self):
        reviews = tool.read(self.review)
        del reviews['reviews'][0]['proofs']['dynamic']
        tool.save(self.review, reviews)
        with self.assertRaisesRegex(ValueError, 'Incomplete review'):
            self.prepare()

    def test_other_root_or_snapshot_refused(self):
        audit = tool.read(self.audit)
        audit['root'] = str(self.base / 'JO9main')
        tool.save(self.audit, audit)
        with self.assertRaisesRegex(ValueError, 'another JO9 root'):
            self.prepare()
        audit['root'] = str(self.root)
        audit['snapshot_sha256'] = '0' * 64
        tool.save(self.audit, audit)
        with self.assertRaisesRegex(ValueError, 'another snapshot'):
            self.prepare()

    def test_referenced_images_and_path_escape_refused(self):
        audit = tool.read(self.audit)
        audit['rows'][0]['status'] = 'dynamic_possible'
        tool.save(self.audit, audit)
        with self.assertRaisesRegex(ValueError, 'Not an unused candidate'):
            self.prepare()
        for path in ('../escape.png', 'C:/elsewhere/file.png', '/escape.png',
                     'game/../escape.png', 'game/file.png:stream'):
            with self.assertRaises(ValueError):
                tool.relative(path)

    def test_protected_source_and_archive_refused(self):
        self.args.protect = [str(self.pic.parent)]
        with self.assertRaisesRegex(ValueError, 'Protected image'):
            self.prepare()
        self.args.protect = [str(self.archive.parent)]
        with self.assertRaisesRegex(ValueError, 'overlaps protected'):
            self.prepare()

    def test_partial_move_can_be_restored_from_journal(self):
        from unittest.mock import patch
        second = self.pic.with_name('second.png')
        second.write_bytes(b'second image')
        tool.save(self.snap, tool.snapshot(self.root.resolve(), []))
        audit = tool.read(self.audit)
        second_rel = second.relative_to(self.root).as_posix()
        audit['snapshot_sha256'] = tool.sha(self.snap)
        audit['rows'].append({'path': second_rel, 'status': 'unreferenced_candidate'})
        tool.save(self.audit, audit)
        reviews = tool.read(self.review)
        reviews['reviews'].append({'path': second_rel, 'decision': 'move',
                                  'proofs': {k: 'Isolated fixture evidence' for k in tool.PROOFS}})
        tool.save(self.review, reviews)
        self.prepare()
        real_copy = tool.copy_checked

        def fail_second(src, dst, expected):
            if src.name == 'second.png':
                raise OSError('Simulated interruption before second copy')
            return real_copy(src, dst, expected)

        with patch.object(tool, 'copy_checked', side_effect=fail_second):
            with self.assertRaisesRegex(OSError, 'Simulated interruption'):
                self.apply()
        self.assertFalse(self.pic.exists())
        self.assertTrue(second.exists())
        self.assertEqual(tool.read(self.archive / 'journal.json')['status'], 'failed')
        self.restore()
        self.assertEqual(self.pic.read_bytes(), b'original image bytes')
        self.assertEqual(second.read_bytes(), b'second image')

    def test_registered_transition_cannot_be_moved_even_if_candidate(self):
        self.code.write_bytes(self.qsp_bytes("if $jo9_base = 'content/pic/work/example.png':\r\n"
                                            "$jo9_path = 'content/pic/work/example.png'\r\nend"))
        tool.save(self.snap, tool.snapshot(self.root.resolve(), []))
        audit = tool.read(self.audit)
        audit['snapshot_sha256'] = tool.sha(self.snap)
        tool.save(self.audit, audit)
        with self.assertRaisesRegex(ValueError, 'Protected transition image'):
            self.prepare()
        self.assertTrue(self.pic.exists())
        self.assertFalse(self.archive.exists())

    def test_original_cut_manifest_protects_parent_and_alias(self):
        manifest_path = self.root / 'game/modtools/image-original-cuts.json'
        tool.save(manifest_path, {'originals': {}, 'reservations': {'work/example.png': {
            'base': 'work/example.png', 'alias': 'work/example (2).png', 'status': 'missing-original'}}})
        tool.save(self.snap, tool.snapshot(self.root.resolve(), []))
        audit = tool.read(self.audit)
        audit['snapshot_sha256'] = tool.sha(self.snap)
        tool.save(self.audit, audit)
        with self.assertRaisesRegex(ValueError, 'Protected transition image'):
            self.prepare()

    def test_bad_original_binding_stops_audit_without_mutation(self):
        manifest_path = self.root / 'game/modtools/image-original-cuts.json'
        tool.save(manifest_path, {'sourceRoot': str(self.base / 'JO9O/game'),
                                 'originals': {'work/example.png': {'base': 'work/example.png',
                                     'alias': 'work/example (2).png', 'source': 'content/pic/work/example.png'}}})
        with self.assertRaisesRegex(ValueError, 'binding is missing'):
            tool.snapshot(self.root.resolve(), [])
        self.assertTrue(self.pic.exists())

    def test_restore_allowed_when_new_patch_now_uses_archived_image(self):
        self.prepare()
        self.apply()
        self.code.write_bytes(self.qsp_bytes("$jo9_path = 'content/pic/work/example.png'"))
        self.restore()
        self.assertEqual(self.pic.read_bytes(), b'original image bytes')


if __name__ == '__main__':
    unittest.main(verbosity=2)
