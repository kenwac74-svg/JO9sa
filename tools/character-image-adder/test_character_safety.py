"""Synthetic character save/delete and unsaved-form regressions.

Run with Python -B; fixture game files live only in the task's temporary folder.
"""
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest import mock

from PIL import Image

import add_character as api
import character_editor_ui as ui


TEST_ROOT = Path("G:/Codex/tmp/claude-fix-tests-20261110/character")


class Value:
    def __init__(self, value):
        self.value = value

    def get(self, *args):
        return self.value

    def set(self, value):
        self.value = value

    def cget(self, key):
        return "normal"

    def configure(self, **kwargs):
        pass

    def delete(self, *args):
        self.value = ""

    def insert(self, index, value):
        self.value = value


class CharacterSafetyTests(unittest.TestCase):
    def setUp(self):
        TEST_ROOT.mkdir(parents=True, exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(prefix="character-", dir=TEST_ROOT)
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.paths = api.GamePaths(str(self.root))
        Path(self.paths.slaves_dir).mkdir(parents=True)
        Path(self.paths.full_dir).mkdir(parents=True)
        Path(self.paths.face_dir).mkdir(parents=True)
        Path(self.paths.index_file).write_text(json.dumps({"loli_last": 0, "young_last": 1000,
                                                        "milf_last": 2000}), encoding="utf-8")

    def image(self, reference):
        path = Path(api._abs_from_gamepath(str(self.root), reference))
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            Image.new("RGBA", (2, 3), (13, 27, 41, 201)).save(path)
        return path

    def character(self, sid, **fields):
        data = {"seed_name": "수동 이름", "fullimage": "girls/full/%s_base" % sid,
                "seed_boobs": 3, "seed_boobs_img": "boobs_D", "seed_pussy_img": "pussy_l1",
                "seed_world_description": "수동  문장<br/>둘째 줄<!-- #nwtx author tag -->",
                "seed_family_description": "가족 원문<!-- custom -->",
                "seed_occupation_description": "직업 원문"}
        data.update(fields)
        path = Path(self.paths.slaves_dir) / ("%d_manual.json" % sid)
        # Whitespace and manual text must survive in unrelated files/backups.
        path.write_text(json.dumps(data, ensure_ascii=False, indent=3) + "\n", encoding="utf-8")
        for field in api.IMAGE_FIELDS:
            if data.get(field):
                self.image(data[field])
        return data, path

    def editor(self, data, sid=3101):
        editor = ui.CharacterEditor.__new__(ui.CharacterEditor)
        editor.api, editor.paths = api, self.paths
        editor.loaded_data, editor.edit_id = data, sid
        editor.loaded_json = str(Path(self.paths.slaves_dir) / ("%d_manual.json" % sid))
        editor.slots = {key: ui.CharacterEditor.blank_slot() for key in ui.SLOT_KEYS}
        editor.slots["base"]["ref"] = data["fullimage"]
        editor.face_changed = editor.clone_dirty = False
        editor.mode = Value("edit")
        editor.unique_name_var = Value(data.get("seed_name", ""))
        editor.unique_slug_var = Value("manual")
        editor.unique_id_var = Value(str(sid))
        editor.unique_var = Value(False)
        editor.story_boxes = {key: Value(api.story_to_display(data.get(field, "")))
                              for key, field, _label in api.STORY_FIELDS}
        editor.boobs_var, editor.boobsimg_var, editor.pussy_var = Value("3"), Value("boobs_D"), Value("pussy_l1")
        editor.color_var, editor.length_var, editor.age_var = Value("black"), Value("long"), Value("young")
        editor.id_var, editor.status = Value(str(sid)), Value("")
        editor.identity_original = {"name": editor.unique_name_var.get(), "slug": "manual", "id": str(sid),
                                    "story": editor.story_values()}
        editor.window = object()
        editor.log = lambda *args: None
        editor.log_event = mock.Mock()
        editor.new_character, editor.refresh_library = mock.Mock(), mock.Mock()
        editor.reset_images, editor.clear_stats, editor.update_mode = mock.Mock(), mock.Mock(), mock.Mock()
        editor.refresh_slot_widgets, editor.draw_full, editor.refresh_face_preview = mock.Mock(), mock.Mock(), mock.Mock()
        editor.build_stats, editor.nb, editor.window = mock.Mock(), mock.Mock(), mock.Mock()
        editor.library, editor.existing_face, editor.face_source = [], None, Value("keep")
        editor.flush_logs = mock.Mock()
        editor.search_job = None
        return editor

    def test_shared_slot_unlink_preserves_other_id_and_png(self):
        reference = "girls/full/cloth/shared"
        data, owner = self.character(3101, fullmade=reference, indpack_maid=reference)
        _other, other = self.character(3102, fullsecretary="content/pic/" + reference + ".png")
        png, old_png, old_owner, old_other = self.image(reference), self.image(reference).read_bytes(), owner.read_bytes(), other.read_bytes()
        preview = api.save_character_slots(self.paths, 3101, slot_images={"maid": None}, dry_run=True, log=lambda *args: None)
        self.assertEqual(owner.read_bytes(), old_owner)
        self.assertNotIn(str(png), preview["files"])
        self.assertEqual(preview.get("preserved_shared_with"), [3102])
        result = api.save_character_slots(self.paths, 3101, slot_images={"maid": None}, log=lambda *args: None)
        self.assertEqual(png.read_bytes(), old_png)
        self.assertEqual(other.read_bytes(), old_other)
        self.assertEqual(Path(str(owner) + ".bak").read_bytes(), old_owner)
        self.assertEqual(result["data"]["fullmade"], "")
        self.assertEqual(result["data"]["indpack_maid"], "")
        self.assertEqual(result["data"]["seed_world_description"], data["seed_world_description"])

    def test_unlink_keeps_image_used_by_another_role_on_same_id(self):
        reference = "girls/full/cloth/shared_roles"
        title_reference = "content/pic/girls/full/cloth/../cloth/shared_roles.png"
        self.character(3101, fullmade=reference, indpack_title=title_reference)
        png = self.image(reference)
        before = png.read_bytes()
        api.save_character_slots(self.paths, 3101, slot_images={"maid": None}, log=lambda *args: None)
        self.assertEqual(png.read_bytes(), before)
        self.assertEqual(api.read_slave(self.paths, 3101)[0]["indpack_title"], title_reference)

    def test_shared_physical_path_alias_is_preserved_on_unlink_and_whole_delete(self):
        reference = "girls/full/cloth/shared_alias"
        self.character(3101, fullmade=reference)
        self.character(3102, indpack_maid="girls/full/cloth/../cloth/shared_alias")
        png = self.image_path(reference)
        before = png.read_bytes()
        api.save_character_slots(self.paths, 3101, slot_images={"maid": None}, log=lambda *args: None)
        self.assertEqual(png.read_bytes(), before)
        self.character(3101, fullmade=reference)
        api.delete_character(self.paths, 3101, log=lambda *args: None)
        self.assertEqual(png.read_bytes(), before)

    def test_unlink_unique_image_deletes_it_with_original_json_backup(self):
        reference = "girls/full/cloth/unique"
        _data, owner = self.character(3101, fullmade=reference)
        before = owner.read_bytes()
        api.save_character_slots(self.paths, 3101, slot_images={"maid": None}, log=lambda *args: None)
        self.assertFalse(self.image_path(reference).exists())
        self.assertEqual(Path(str(owner) + ".bak").read_bytes(), before)

    def test_shared_unlink_confirmation_can_cancel_without_writes(self):
        reference = "girls/full/cloth/shared"
        data, owner = self.character(3101, fullmade=reference)
        self.character(3102, indpack_maid=reference)
        editor = self.editor(data)
        editor.save_summary = mock.Mock(return_value={"mode": "edit"})
        editor.perform_save = mock.Mock(side_effect=lambda dry_run=False: api.save_character_slots(
            self.paths, 3101, slot_images={"maid": None}, dry_run=dry_run, log=lambda *args: None))
        before = {path: path.read_bytes() for path in self.root.rglob("*") if path.is_file()}
        with mock.patch.object(ui.messagebox, "askyesno", return_value=False) as ask:
            self.assertIsNone(editor.save_current())
        ask.assert_called_once()
        self.assertIn("보존", ask.call_args.args[1])
        self.assertIn("3102", ask.call_args.args[1])
        editor.perform_save.assert_called_once_with(dry_run=True)
        self.assertEqual(before, {path: path.read_bytes() for path in self.root.rglob("*") if path.is_file()})

    def test_shared_replacement_still_reports_affected_other_ids(self):
        reference = "girls/full/cloth/shared"
        self.character(3101, fullmade=reference)
        _data, other = self.character(3102, fullmade=reference)
        old_other = other.read_bytes()
        new_image = Image.new("RGBA", (2, 3), (211, 57, 71, 255))
        preview = api.save_character_slots(self.paths, 3101, slot_images={"maid": new_image},
                                           dry_run=True, log=lambda *args: None)
        self.assertEqual(preview["shared_with"], [3102])
        self.assertEqual(preview["preserved_shared_with"], [])
        result = api.save_character_slots(self.paths, 3101, slot_images={"maid": new_image}, log=lambda *args: None)
        self.assertEqual(result["data"]["fullmade"], reference)
        with Image.open(self.image_path(reference)) as image:
            self.assertEqual(image.getpixel((0, 0)), (211, 57, 71, 255))
        self.assertEqual(other.read_bytes(), old_other)

    def test_base_title_linkage_and_new_title_keep_existing_naked_semantics(self):
        old = "girls/full/3101_base"
        self.character(3101, fullimage=old, indpack_naked=old, indpack_title=old)
        new_image = Image.new("RGBA", (2, 3), (211, 57, 71, 255))
        base = api.save_character_slots(self.paths, 3101, slot_images={"base": new_image}, log=lambda *args: None)["data"]
        self.assertEqual(base["fullimage"], base["indpack_naked"])
        self.assertEqual(base["fullimage"], base["indpack_title"])
        self.assertTrue(base["fullimage"].startswith("girls/full/"))
        self.character(3102)
        title = api.save_character_slots(self.paths, 3102, slot_images={"title": new_image}, log=lambda *args: None)["data"]
        self.assertEqual(title["fullimage"], "girls/full/3102_base")
        self.assertEqual(title["indpack_naked"], title["fullimage"])
        self.assertTrue(title["indpack_title"].startswith("characters/"))

    def test_dedicated_role_keeps_existing_number_folder_rule(self):
        self.character(3101)
        (Path(self.paths.full_dir) / "3101").mkdir()
        new_image = Image.new("RGBA", (2, 3), (211, 57, 71, 255))
        result = api.save_character_slots(self.paths, 3101, slot_images={"maid": new_image}, log=lambda *args: None)
        self.assertEqual(result["data"]["indpack_maid"], "girls/full/3101/3101_full_maid")
        self.assertEqual(result["data"]["fullimage"], "girls/full/3101_base")

    def test_failed_unique_unlink_restores_png_json_and_backup_state(self):
        reference = "girls/full/cloth/unique"
        _data, owner = self.character(3101, fullmade=reference)
        before = {path: path.read_bytes() for path in self.root.rglob("*") if path.is_file()}
        replace = os.replace

        def fail_json_replace(source, target):
            if os.path.normcase(str(target)) == os.path.normcase(str(owner)):
                raise PermissionError("synthetic write failure")
            return replace(source, target)

        with mock.patch.object(api.os, "replace", side_effect=fail_json_replace):
            with self.assertRaisesRegex(PermissionError, "synthetic write failure"):
                api.save_character_slots(self.paths, 3101, slot_images={"maid": None}, log=lambda *args: None)
        self.assertEqual(before, {path: path.read_bytes() for path in self.root.rglob("*") if path.is_file()})
        self.assertEqual(list(self.root.rglob(".jo9-edit-*")), [])

    def image_path(self, reference):
        return Path(api._abs_from_gamepath(str(self.root), reference))

    def test_whole_delete_keeps_shared_role_and_portrait_but_removes_all_unique_images(self):
        shared_role, shared_face = "girls/full/cloth/shared", "content/pic/girls/face/shared"
        own_fields = {"indpack_naked": "girls/full/3101_naked", "indpack_title": "characters/3101_title",
                      "indpack_maid": shared_role, "indpack_secr": "girls/full/secretary/3101",
                      "indpack_dom": "girls/full/mistress/3101", "seed_ava_clear": shared_face,
                      "seed_ava_gray": "content/pic/girls/face/3101_gray", "seed_ava": "content/pic/girls/face/3101_sepia"}
        owner_data, owner = self.character(3101, **own_fields)
        _other_data, other = self.character(3102, fullmistress="content/pic/" + shared_role + ".png", seed_ava_gray=shared_face)
        old_other = other.read_bytes()
        expected_shared = {self.image_path(shared_role), self.image_path(shared_face)}
        expected_unique = {self.image_path(owner_data[field]) for field in api.IMAGE_FIELDS if owner_data.get(field)} - expected_shared
        before = {path: path.read_bytes() for path in expected_shared}
        api.delete_character(self.paths, 3101, log=lambda *args: None)
        self.assertFalse(owner.exists())
        self.assertEqual(other.read_bytes(), old_other)
        for path, content in before.items():
            self.assertTrue(path.exists(), str(path))
            self.assertEqual(path.read_bytes(), content)
        for path in expected_unique:
            self.assertFalse(path.exists(), str(path))

    def test_whole_delete_preserves_other_ids_implicit_portraits_and_id_zero_refs(self):
        base = "girls/full/same_base"
        self.character(3101, fullimage=base, fullmade="girls/full/cloth/template_shared")
        self.character(3102, fullimage=base)
        self.character(0, fullimage="girls/full/template", indpack_maid="girls/full/cloth/template_shared")
        portraits = [self.image("content/pic/girls/face/same_base" + suffix) for suffix in ("", "_gray", "_sepia")]
        api.delete_character(self.paths, 3101, log=lambda *args: None)
        for path in portraits:
            self.assertTrue(path.exists(), str(path))
        self.assertTrue(self.image_path("girls/full/cloth/template_shared").exists())

    def pool_case(self, mode, sid):
        shared = "girls/full/cloth/shared_pool"
        one, one_path = self.character(1, seed_name="one", fullmade=shared)
        _two, two_path = self.character(2, seed_name="two", fullmade=shared)
        three, three_path = self.character(3, seed_name="three", fullmade=shared)
        index = {"loli_last": 3, "young_last": 1000, "milf_last": 2000}
        Path(self.paths.index_file).write_text(json.dumps(index), encoding="utf-8")
        old_one, old_three = one_path.read_bytes(), three_path.read_bytes()
        api.delete_character(self.paths, sid, mode=mode, log=lambda *args: None)
        self.assertTrue(self.image_path(shared).exists())
        self.assertFalse(self.image_path("girls/full/%d_base" % sid).exists())
        self.assertEqual(one_path.read_bytes(), old_one)
        if sid == 3:
            self.assertFalse(three_path.exists())
            self.assertEqual(api.read_index(self.paths)["loli_last"], 2)
        elif mode == "swap":
            self.assertFalse(three_path.exists())
            self.assertEqual(two_path.read_bytes(), old_three)
            self.assertEqual(api.read_index(self.paths)["loli_last"], 2)
        else:
            self.assertEqual(api.read_slave(self.paths, 2)[0], one)
            self.assertEqual(three_path.read_bytes(), old_three)
            self.assertEqual(api.read_index(self.paths), index)

    def test_safe_middle_delete_keeps_existing_pool_behavior(self):
        self.pool_case("safe", 2)

    def test_swap_middle_delete_keeps_existing_pool_behavior(self):
        self.pool_case("swap", 2)

    def test_end_delete_keeps_existing_pool_behavior(self):
        self.pool_case("safe", 3)

    def test_unchanged_save_writes_nothing_and_preserves_manual_story(self):
        data, owner = self.character(3101)
        editor = self.editor(data)
        editor.unique_var.set(True)
        before = {path: path.read_bytes() for path in self.root.rglob("*") if path.is_file()}
        result = api.save_character_slots(self.paths, 3101, identity=editor.identity_options(), log=lambda *args: None)
        after = {path: path.read_bytes() for path in self.root.rglob("*") if path.is_file()}
        self.assertEqual(result["files"], [])
        self.assertEqual(before, after)
        self.assertEqual(result["data"], data)

    def test_name_slug_id_and_each_story_edit_are_dirty_and_restore_is_clean(self):
        data, _path = self.character(3101)
        editor = self.editor(data)
        variables = [editor.unique_name_var, editor.unique_slug_var, editor.unique_id_var, *editor.story_boxes.values()]
        self.assertFalse(editor.dirty())
        for value in variables:
            original = value.get()
            value.set(original + " changed")
            self.assertTrue(editor.dirty(), original)
            value.set(original)
            self.assertFalse(editor.dirty(), original)

    def test_clearing_story_is_a_form_change_without_changing_blank_save_semantics(self):
        data, _path = self.character(3101)
        editor = self.editor(data)
        editor.story_boxes["world"].set("")
        self.assertTrue(editor.dirty())
        self.assertEqual(editor.changed_story(), {})

    def test_identity_edit_blocks_navigation_and_close_when_discard_declined(self):
        data, _path = self.character(3101)
        for action in ("new_character", "close"):
            with self.subTest(action=action):
                editor = self.editor(data)
                editor.window = mock.Mock()
                editor.unique_name_var.set("바꾼 이름")
                with mock.patch.object(ui.messagebox, "askyesno", return_value=False) as ask:
                    getattr(ui.CharacterEditor, action)(editor)
                ask.assert_called_once()
                editor.window.destroy.assert_not_called()
                self.assertEqual(editor.mode.get(), "edit")

    def test_unchanged_form_does_not_ask_before_discard(self):
        data, _path = self.character(3101)
        editor = self.editor(data)
        with mock.patch.object(ui.messagebox, "askyesno") as ask:
            self.assertTrue(editor.discard_allowed())
        ask.assert_not_called()

    def test_loading_new_and_clone_forms_capture_clean_identity_baselines(self):
        data, _path = self.character(3101)
        editor = self.editor(data)
        editor.unique_name_var.set("discarded draft")
        self.assertTrue(editor.load_existing(3101, confirm=False))
        self.assertFalse(editor.dirty())
        editor.start_clone()
        self.assertEqual(editor.unique_slug_var.get(), "manual_2")
        self.assertFalse(editor.dirty())
        editor.unique_slug_var.set("clone_edit")
        self.assertTrue(editor.dirty())
        ui.CharacterEditor.new_character(editor, confirm=False)
        self.assertFalse(editor.dirty())
        editor.unique_name_var.set("new name")
        self.assertTrue(editor.dirty())

    def test_declining_clone_preserves_identity_only_draft_and_current_mode(self):
        data, _path = self.character(3101)
        for field in ("name", "slug", "id", "world", "family", "occupation"):
            with self.subTest(field=field):
                editor = self.editor(data)
                values = {"name": editor.unique_name_var, "slug": editor.unique_slug_var,
                          "id": editor.unique_id_var, **editor.story_boxes}
                values[field].set(values[field].get() + " edited")
                before = editor.identity_values()
                base_before = dict(editor.slots["base"])
                with mock.patch.object(ui.messagebox, "askyesno", return_value=False) as ask:
                    editor.start_clone()
                ask.assert_called_once()
                self.assertEqual(editor.mode.get(), "edit")
                self.assertEqual(editor.identity_values(), before)
                self.assertEqual(editor.slots["base"], base_before)
                self.assertTrue(editor.dirty())

    def test_accepted_clone_keeps_carried_story_draft_dirty_until_reverted(self):
        data, _path = self.character(3101)
        editor = self.editor(data)
        original_story = editor.story_boxes["world"].get()
        editor.unique_name_var.set("편집한 이름")
        editor.unique_slug_var.set("edited_slug")
        editor.story_boxes["world"].set("복제본에 가져올 이야기")
        with mock.patch.object(ui.messagebox, "askyesno", return_value=True) as ask:
            editor.start_clone()
        ask.assert_called_once()
        self.assertEqual(editor.mode.get(), "clone")
        self.assertEqual(editor.unique_name_var.get(), data["seed_name"])
        self.assertEqual(editor.unique_slug_var.get(), "manual_2")
        self.assertEqual(editor.unique_id_var.get(), "")
        self.assertEqual(editor.story_boxes["world"].get(), "복제본에 가져올 이야기")
        self.assertTrue(editor.dirty())
        with mock.patch.object(ui.messagebox, "askyesno", return_value=False) as discard:
            editor.close()
        discard.assert_called_once()
        editor.window.destroy.assert_not_called()
        editor.story_boxes["world"].set(original_story)
        self.assertFalse(editor.dirty())

    def test_whole_delete_ui_detects_shared_nonbase_image(self):
        data, _path = self.character(3101, indpack_maid="girls/full/cloth/shared")
        self.character(3102, fullsecretary="girls/full/cloth/shared")
        editor = self.editor(data)
        with mock.patch.object(ui.messagebox, "askyesno", return_value=True) as ask:
            editor.delete_current()
        self.assertEqual(ask.call_count, 2)
        self.assertIn("3102", ask.call_args_list[1].args[1])
        self.assertTrue(self.image_path("girls/full/cloth/shared").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
