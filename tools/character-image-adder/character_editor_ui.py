"""One-window character library, slot (outfit) viewer, size alignment, face box, clone and work log."""
import json
import math
import os
import sys
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import tkinter.font as tkfont

from PIL import Image, ImageTk

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)
import align_core as align  # noqa: E402
from tool_log import ToolLog, describe_files, diff_fields  # noqa: E402

CANVAS_W, CANVAS_H = align.W, align.H
FACE_RATIO = 150.0 / 151.0
SLOT_KEYS = ["base", "title", "maid", "secr", "dom"]
OUTFIT_SLOT_KEYS = ["title", "maid", "secr", "dom"]
OUTFIT_JSON_FIELD = {"maid": "fullmade", "secr": "fullsecretary", "dom": "fullmistress"}


def file_key(path):
    try:
        stat = os.stat(path)
        return "%s|%d|%d" % (os.path.basename(path), stat.st_size, int(stat.st_mtime * 1000))
    except OSError:
        return os.path.basename(path)


class CharacterEditor:
    PAGE_SIZE = 24

    def __init__(self, window, backend, game_root=None):
        self.window = window
        self.api = backend
        self.paths = backend.GamePaths(game_root) if game_root else None
        self.mode = tk.StringVar(window, value="new")
        self.edit_id = None
        self.loaded_data = None
        self.loaded_json = ""
        self.slots = {key: self.blank_slot() for key in SLOT_KEYS}
        self.existing_face = None
        self.face_source = tk.StringVar(window, value="full")
        self.face_file = None
        self.face_box = None            # [x, y, width] in 795x596 coordinates of the composed base image
        self.face_changed = False
        self.face_size_pref = None
        self.library = []
        self.page = 0
        self.images = {}
        self.search_job = None
        self.ref_index = None
        self.pending_logs = {}
        self.pick_mode = None
        self.pick_points = []
        self.drag = None
        self.canvas_geometry = (1.0, 0, 0)
        self.rules = {"top": align.DEFAULT_TOP, "headSize": align.DEFAULT_HEAD}
        self.stat_vars = {}
        self.stat_original = {}
        self.clone_dirty = False
        self.tool_log = ToolLog(_HERE)
        settings = self.tool_log.read_settings()
        try:
            self.face_size_pref = int(settings.get("face_size", 0)) or None
        except (TypeError, ValueError):
            self.face_size_pref = None
        if self.paths:
            self.tool_log.game_root = self.paths.root
        self.build()
        self.identity_original = self.identity_values()
        if self.paths:
            self.refresh_library()
        self.update_mode()
        self.tool_log.event("session_start", note="도구 시작")

    # ------------------------------------------------------------------ 기본 구조
    @staticmethod
    def blank_slot():
        return {"raw": None, "existing": None, "ref": None, "field": None, "src_path": None, "src_key": None,
                "t": None, "changed": False, "removed": False, "cache": None}

    def queue_log(self, name, callback, delay=700):
        """같은 이름의 기록은 연속 입력 동안 한 줄로 합치고, 화면 전환 전에는 flush_logs 로 바로 남긴다."""
        old = self.pending_logs.pop(name, None)
        if old:
            self.window.after_cancel(old[0])

        def fire():
            self.pending_logs.pop(name, None)
            callback()
        self.pending_logs[name] = (self.window.after(delay, fire), callback)

    def flush_logs(self):
        for name, (job, callback) in list(self.pending_logs.items()):
            self.window.after_cancel(job)
            self.pending_logs.pop(name, None)
            callback()

    def log_event(self, action, **fields):
        fields.setdefault("id", self.edit_id)
        if self.loaded_data and "name" not in fields:
            fields["name"] = self.loaded_data.get("seed_name") or None
        record = self.tool_log.event(action, **fields)
        if self.tool_log.last_error:
            self.status.set("작업 기록을 쓰지 못했습니다: " + self.tool_log.last_error)
        return record

    # ------------------------------------------------------------------ 화면 구성
    def build(self):
        w = self.window
        w.title("잭오나인 캐릭터 추가 · 통합 편집 · 최종 크기 저장")
        height = min(930, max(700, w.winfo_screenheight() - 80))
        width = min(1640, max(1180, w.winfo_screenwidth() - 40))
        w.geometry("%dx%d+10+10" % (width, height))
        w.minsize(min(1100, width), min(700, height))
        w.columnconfigure(0, weight=1)
        w.rowconfigure(1, weight=1)

        top = ttk.Frame(w, padding=(10, 6, 10, 2))
        top.grid(row=0, column=0, sticky="ew")
        top.columnconfigure(5, weight=1)
        ttk.Button(top, text="＋ 새 캐릭터", command=self.new_character).grid(row=0, column=0, padx=(0, 8))
        self.clone_button = ttk.Button(top, text="이 캐릭터 복제", command=self.start_clone)
        self.clone_button.grid(row=0, column=1, padx=(0, 14))
        ttk.Label(top, text="기존 ID").grid(row=0, column=2)
        self.id_var = tk.StringVar()
        entry = ttk.Entry(top, textvariable=self.id_var, width=8)
        entry.grid(row=0, column=3, padx=4)
        entry.bind("<Return>", lambda event: self.load_existing(self.id_var.get()))
        ttk.Button(top, text="불러오기", command=lambda: self.load_existing(self.id_var.get())).grid(row=0, column=4)
        self.target_var = tk.StringVar()
        ttk.Label(top, textvariable=self.target_var, foreground="#175d96").grid(row=0, column=5, sticky="e", padx=8)
        self.game_var = tk.StringVar(value=self.paths.root if self.paths else "먼저 game 폴더를 선택하세요")
        ttk.Label(top, text="게임 폴더", foreground="#555").grid(row=0, column=6, padx=(10, 4))
        ttk.Label(top, textvariable=self.game_var, foreground="#267144", width=34, anchor="w").grid(row=0, column=7)
        ttk.Button(top, text="폴더 선택", command=self.pick_game).grid(row=0, column=8, padx=(4, 0))

        body = ttk.Frame(w, padding=(8, 3))
        body.grid(row=1, column=0, sticky="nsew")
        body.columnconfigure(1, weight=1)
        body.rowconfigure(0, weight=1)
        self.build_library(body)
        self.build_center(body)
        self.build_side(body)

        lower = ttk.Frame(w, padding=(8, 0))
        lower.grid(row=2, column=0, sticky="ew")
        lower.columnconfigure(0, weight=1)
        self.build_info(lower)

        options = ttk.Frame(w, padding=(10, 4))
        options.grid(row=3, column=0, sticky="ew")
        options.columnconfigure(4, weight=1)
        available = self.api.rembg_available()
        self.cutout_var = tk.BooleanVar(value=available)
        self.resize_face_var = tk.BooleanVar(value=True)
        self.register_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(options, text="배경 자동 제거" + ("" if available else " (rembg 미설치)"), variable=self.cutout_var,
                        state="normal" if available else "disabled").grid(row=0, column=0, padx=(0, 12))
        ttk.Checkbutton(options, text="얼굴 표준 크기 (151×150)", variable=self.resize_face_var).grid(row=0, column=1, padx=(0, 12))
        self.register_button = ttk.Checkbutton(options, text="새 캐릭터를 랜덤 등장 풀에 등록", variable=self.register_var)
        self.register_button.grid(row=0, column=2, padx=(0, 12))
        ttk.Label(options, text="저장 시 795×596", foreground="#777").grid(row=0, column=3)
        self.save_button = ttk.Button(options, text="캐릭터 추가", command=self.save_current)
        self.save_button.grid(row=0, column=5, padx=(0, 6))
        ttk.Button(options, text="저장 내용 미리보기", command=self.preview_save).grid(row=0, column=6, padx=(0, 6))
        ttk.Button(options, text="변경 취소", command=self.discard_changes).grid(row=0, column=7, padx=(0, 18))
        self.delete_button = ttk.Button(options, text="캐릭터 삭제", command=self.delete_current)
        self.delete_button.grid(row=0, column=8)

        log_frame = ttk.Frame(w, padding=(8, 0))
        log_frame.grid(row=4, column=0, sticky="ew")
        log_frame.columnconfigure(1, weight=1)
        self.log_open = tk.BooleanVar(value=False)
        self.log_toggle = ttk.Button(log_frame, text="로그 펼치기 ▸", width=12, command=self.toggle_log)
        self.log_toggle.grid(row=0, column=0)
        self.last_log = tk.StringVar(value="")
        ttk.Label(log_frame, textvariable=self.last_log, foreground="#555").grid(row=0, column=1, sticky="w", padx=8)
        ttk.Button(log_frame, text="기존 기록 가져오기", command=self.import_legacy_logs).grid(row=0, column=2, padx=(0, 8))
        ttk.Label(log_frame, text="통합 작업 기록: 작업기록\\통합작업기록.md", foreground="#999").grid(row=0, column=3, sticky="e")
        self.logbox = tk.Text(log_frame, height=7, bg="#20262c", fg="#e6edf3", wrap="word", relief="flat")
        self.status = tk.StringVar(value="게임 폴더를 선택한 뒤 새 이미지를 넣거나 왼쪽 목록에서 기존 캐릭터를 고르세요.")
        ttk.Label(w, textvariable=self.status, padding=(10, 2)).grid(row=5, column=0, sticky="ew")
        w.protocol("WM_DELETE_WINDOW", self.close)
        self.refresh_face_preview()
        self.refresh_slot_widgets()
        self.window.after(50, self.fit_notebook)

    def import_legacy_logs(self):
        paths = filedialog.askopenfilenames(title="규격 통일기의 jo9_project.json / manifest.json 선택", parent=self.window,
                                            filetypes=[("JSON", "*.json"), ("모든 파일", "*.*")])
        if not paths:
            return
        project = manifest = None
        for path in paths:
            try:
                with open(path, "r", encoding="utf-8") as stream:
                    data = json.load(stream)
            except (OSError, ValueError) as exc:
                self.error("읽을 수 없는 파일: %s (%s)" % (os.path.basename(path), exc))
                return
            if isinstance(data, dict) and "history" in data:
                project = path
            elif isinstance(data, dict) and "items" in data:
                manifest = path
        if not project and not manifest:
            self.error("규격 통일기의 jo9_project.json 또는 manifest.json 이 아닙니다.")
            return
        try:
            count = self.tool_log.import_legacy(project, manifest)
        except Exception as exc:
            self.error("가져오기 실패: " + str(exc))
            return
        self.log_event("legacy_import", id=None, name=None, files=[p for p in (project, manifest) if p],
                       note="기존 규격 통일기 기록 %d건 가져옴" % count)
        self.status.set("기존 기록 %d건을 통합 로그에 가져왔습니다." % count)

    def toggle_log(self):
        if self.log_open.get():
            self.logbox.grid_remove()
            self.log_open.set(False)
            self.log_toggle.configure(text="로그 펼치기 ▸")
        else:
            self.logbox.grid(row=1, column=0, columnspan=3, sticky="ew", pady=(2, 4))
            self.log_open.set(True)
            self.log_toggle.configure(text="로그 접기 ▾")

    # -- 왼쪽: 기존 캐릭터 -----------------------------------------------------
    def build_library(self, parent):
        frame = ttk.LabelFrame(parent, text="기존 캐릭터", padding=5)
        frame.grid(row=0, column=0, sticky="nsew")
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(4, weight=1)
        self.search_var = tk.StringVar()
        ttk.Entry(frame, textvariable=self.search_var, width=24).grid(row=0, column=0, columnspan=2, sticky="ew", pady=2)
        ttk.Label(frame, text="ID · 이름 · 파일명 검색", foreground="#666").grid(row=1, column=0, columnspan=2, sticky="w")
        filters = ttk.Frame(frame)
        filters.grid(row=2, column=0, columnspan=2, sticky="ew", pady=3)
        self.filter_age = tk.StringVar(value="전체")
        self.filter_color = tk.StringVar(value="전체")
        for col, (var, values) in enumerate([(self.filter_age, ["전체"] + list(self.api.AGE_INFO)),
                                            (self.filter_color, ["전체"] + self.api.HAIR_COLORS)]):
            ttk.Combobox(filters, textvariable=var, values=values, state="readonly", width=9).grid(row=0, column=col, padx=2)
            var.trace_add("write", self.queue_search)
        self.library_count = tk.StringVar(value="게임 폴더를 선택하세요")
        ttk.Label(frame, textvariable=self.library_count, foreground="#175d96").grid(row=3, column=0, columnspan=2, sticky="w")
        self.library_canvas = tk.Canvas(frame, bg="#e7eaee", highlightthickness=0, width=222)
        self.library_canvas.grid(row=4, column=0, sticky="nsew")
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=self.library_canvas.yview)
        scrollbar.grid(row=4, column=1, sticky="ns")
        self.library_canvas.configure(yscrollcommand=scrollbar.set)
        self.library_inner = ttk.Frame(self.library_canvas)
        self.library_canvas.create_window((0, 0), window=self.library_inner, anchor="nw")
        self.library_inner.bind("<Configure>", lambda event: self.library_canvas.configure(scrollregion=self.library_canvas.bbox("all")))
        self.library_canvas.bind("<MouseWheel>", self.scroll_library)
        pager = ttk.Frame(frame)
        pager.grid(row=5, column=0, columnspan=2, sticky="ew", pady=(5, 0))
        ttk.Button(pager, text="◀", width=4, command=lambda: self.move_page(-1)).pack(side="left")
        ttk.Button(pager, text="새로고침", command=self.refresh_library).pack(side="left", padx=5)
        ttk.Button(pager, text="▶", width=4, command=lambda: self.move_page(1)).pack(side="right")
        self.search_var.trace_add("write", self.queue_search)

    # -- 가운데: 전신 창 ----------------------------------------------------------
    def build_center(self, parent):
        center = ttk.LabelFrame(parent, text="전신 · 복장 (탭으로 바꿔 보기)", padding=6)
        center.grid(row=0, column=1, sticky="nsew", padx=8)
        center.columnconfigure(0, weight=1)
        center.rowconfigure(1, weight=1)
        bar = ttk.Frame(center)
        bar.grid(row=0, column=0, sticky="ew")
        self.slot_var = tk.StringVar(value="base")
        self.slot_buttons = {}
        short = {"base": "기본(알몸)", "title": "타이틀", "maid": "하녀", "secr": "비서", "dom": "도미나"}
        for col, key in enumerate(SLOT_KEYS):
            button = ttk.Radiobutton(bar, text=short[key], value=key, variable=self.slot_var, style="Toolbutton",
                                     command=self.on_slot_change)
            button.grid(row=0, column=col, padx=(0, 3))
            self.slot_buttons[key] = button
        self.align_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(bar, text="크기 맞춤", variable=self.align_var, style="Toolbutton",
                        command=self.toggle_align).grid(row=0, column=6, padx=(14, 4))
        ttk.Button(bar, text="이 이미지 선택 / 교체", command=self.choose_slot_image).grid(row=0, column=7, padx=(4, 0))
        bar.columnconfigure(8, weight=1)
        self.slot_note = tk.StringVar()
        ttk.Label(bar, textvariable=self.slot_note, foreground="#666").grid(row=0, column=8, sticky="e")

        self.full_canvas = tk.Canvas(center, width=640, height=480, bg="#1d2126", highlightthickness=2,
                                     highlightbackground="#67717b", highlightcolor="#3da05f", cursor="crosshair", takefocus=1)
        self.full_canvas.grid(row=1, column=0, sticky="nsew", pady=5)
        self.full_canvas.bind("<Configure>", lambda event: self.draw_full())
        self.full_canvas.bind("<Button-1>", self.on_press)
        self.full_canvas.bind("<B1-Motion>", self.on_drag)
        self.full_canvas.bind("<ButtonRelease-1>", self.on_release)
        self.full_canvas.bind("<MouseWheel>", self.on_wheel)
        self.full_canvas.bind("<Key>", self.on_key)
        self.full_canvas.bind("<Escape>", lambda event: self.cancel_pick())

        self.align_frame = ttk.Frame(center)
        self.align_frame.grid(row=2, column=0, sticky="ew")
        self.build_align_panel(self.align_frame)
        self.align_frame.grid_remove()
        self.hint_var = tk.StringVar()
        ttk.Label(center, textvariable=self.hint_var, foreground="#267144", wraplength=720, justify="left").grid(row=3, column=0, sticky="w")
        self.share_var = tk.StringVar()
        ttk.Label(center, textvariable=self.share_var, foreground="#b35c00", wraplength=720, justify="left").grid(row=4, column=0, sticky="w")

    def build_align_panel(self, frame):
        self.s_var, self.x_var, self.y_var = tk.StringVar(), tk.StringVar(), tk.StringVar()
        row = ttk.Frame(frame)
        row.pack(fill="x", pady=(2, 2))
        for text, var in (("배율", self.s_var), ("X", self.x_var), ("Y", self.y_var)):
            ttk.Label(row, text=text).pack(side="left", padx=(6, 2))
            entry = ttk.Entry(row, textvariable=var, width=9)
            entry.pack(side="left")
            entry.bind("<Return>", lambda event: self.apply_entries())
            entry.bind("<FocusOut>", lambda event: self.apply_entries())
        ttk.Label(row, text="상단").pack(side="left", padx=(12, 2))
        self.top_var = tk.StringVar(value=str(align.DEFAULT_TOP))
        ttk.Spinbox(row, from_=10, to=50, width=4, textvariable=self.top_var, command=self.on_rules_change).pack(side="left")
        ttk.Label(row, text="머리 크기").pack(side="left", padx=(10, 2))
        self.head_var = tk.StringVar(value=str(align.DEFAULT_HEAD))
        ttk.Spinbox(row, from_=60, to=400, width=5, textvariable=self.head_var, command=self.on_rules_change).pack(side="left")
        row2 = ttk.Frame(frame)
        row2.pack(fill="x", pady=2)
        ttk.Button(row2, text="정수리 → 하단 컷", command=lambda: self.start_pick("crown_cut")).pack(side="left", padx=(6, 3))
        ttk.Button(row2, text="정수리 → 턱 (머리 크기)", command=lambda: self.start_pick("crown_chin")).pack(side="left", padx=3)
        ttk.Button(row2, text="투명 여백 정렬", command=self.align_by_bounds).pack(side="left", padx=3)
        ttk.Button(row2, text="기본 비율로", command=self.reset_transform).pack(side="left", padx=3)
        ttk.Button(row2, text="수치 복사 → 다른 복장", command=self.copy_transform_dialog).pack(side="left", padx=(12, 3))
        ttk.Button(row2, text="저장된 수치 적용", command=self.apply_saved_alignment).pack(side="left", padx=3)

    # -- 오른쪽: 얼굴, 복장 ---------------------------------------------------------
    def build_side(self, parent):
        side = ttk.Frame(parent)
        side.grid(row=0, column=2, sticky="nsew")
        face = ttk.LabelFrame(side, text="얼굴", padding=6)
        face.pack(fill="x")
        modes = ttk.Frame(face)
        modes.pack(anchor="w")
        self.keep_face_button = None
        for text, value in [("전신에서 지정", "full"), ("별도 파일", "file"), ("기존 유지", "keep")]:
            button = ttk.Radiobutton(modes, text=text, value=value, variable=self.face_source, command=self.change_face_source)
            button.pack(side="left", padx=(0, 6))
            if value == "keep":
                self.keep_face_button = button
        ttk.Button(face, text="별도 얼굴 파일 선택", command=self.choose_face).pack(anchor="w", pady=(5, 2))
        self.face_var = tk.StringVar(value="전신에서 얼굴 박스를 맞추세요")
        ttk.Label(face, textvariable=self.face_var, wraplength=250, foreground="#666").pack(anchor="w")
        variants = ttk.Frame(face)
        variants.pack(anchor="w", pady=6)
        self.face_labels = {}
        for index, (key, text) in enumerate([("clear", "원본"), ("gray", "흑백"), ("sepia", "세피아")]):
            cell = ttk.Frame(variants)
            cell.grid(row=0, column=index, padx=(0, 6))
            label = tk.Label(cell, bg="#23272b", bd=1, relief="solid")
            label.pack()
            ttk.Label(cell, text=text).pack()
            self.face_labels[key] = label
        ttk.Label(face, text="박스: 방향키 1px (Shift 10px) · + − 크기 · R 처음 위치 · 휠 크기",
                  foreground="#888", wraplength=250, justify="left").pack(anchor="w")

        outfits = ttk.LabelFrame(side, text="복장 · 옷 입은 모습", padding=6)
        outfits.pack(fill="x", pady=(8, 0))
        outfits.columnconfigure(1, weight=1)
        self.slot_state = {}
        for row, key in enumerate(OUTFIT_SLOT_KEYS):
            label = ttk.Label(outfits, text=self.api.SLOT_LABELS[key].split("(")[0], width=7, cursor="hand2")
            label.grid(row=row, column=0, sticky="w", pady=2)
            label.bind("<Button-1>", lambda event, k=key: self.show_slot(k))
            state = tk.StringVar(value="없음")
            ttk.Label(outfits, textvariable=state, foreground="#666", width=16).grid(row=row, column=1, sticky="w")
            ttk.Button(outfits, text="선택", width=5, command=lambda k=key: self.choose_slot_image(k)).grid(row=row, column=2, padx=2)
            ttk.Button(outfits, text="×", width=3, command=lambda k=key: self.clear_slot(k)).grid(row=row, column=3)
            self.slot_state[key] = state
        ttk.Label(outfits, text="이름을 누르면 중앙에서 바로 확인", foreground="#888").grid(row=len(OUTFIT_SLOT_KEYS), column=0, columnspan=4, sticky="w", pady=(4, 0))

    # -- 아래: 정보 탭 ------------------------------------------------------------------
    def build_info(self, parent):
        self.nb = ttk.Notebook(parent)
        self.nb.grid(row=0, column=0, sticky="ew")
        tab_info = ttk.Frame(self.nb, padding=(8, 6))
        tab_story = ttk.Frame(self.nb, padding=(8, 6))
        tab_stats = ttk.Frame(self.nb, padding=(8, 6))
        self.nb.add(tab_info, text="캐릭터 정보")
        self.nb.add(tab_story, text="고유 캐릭터 · 이름 · 이야기")
        self.nb.add(tab_stats, text="능력치 (복제본)")
        self.nb.bind("<<NotebookTabChanged>>", lambda event: self.fit_notebook())
        self.color_var = tk.StringVar(value="black")
        self.length_var = tk.StringVar(value="long")
        self.age_var = tk.StringVar(value="loli")
        self.boobs_var = tk.StringVar(value="3")
        self.boobsimg_var = tk.StringVar(value="boobs_D")
        self.pussy_var = tk.StringVar(value="pussy_l1")
        self.classification_boxes = []
        rows = [("머리색", self.color_var, self.api.HAIR_COLORS, "가슴 크기", self.boobs_var, self.api.BOOBS_SIZES),
                ("머리길이", self.length_var, self.api.HAIR_LENGTHS, "가슴 이미지", self.boobsimg_var, self.api.BOOBS_IMGS),
                ("나이 분류", self.age_var, list(self.api.AGE_INFO), "성기 이미지", self.pussy_var, self.api.PUSSY_IMGS)]
        grid = ttk.Frame(tab_info)
        grid.pack(anchor="w")
        for row_index, values in enumerate(rows):
            for col, (label, var, choices) in enumerate([values[:3], values[3:]]):
                ttk.Label(grid, text=label).grid(row=row_index, column=col * 2, sticky="e", padx=5, pady=1)
                box = ttk.Combobox(grid, textvariable=var, values=choices, state="readonly", width=14)
                box.grid(row=row_index, column=col * 2 + 1, sticky="w", padx=(0, 18))
                if col == 0:
                    self.classification_boxes.append(box)
        self.id_info = tk.StringVar()
        ttk.Label(tab_info, textvariable=self.id_info, foreground="#175d96").pack(anchor="w", pady=(4, 0))
        for var in [self.color_var, self.length_var, self.age_var]:
            var.trace_add("write", lambda *args: self.update_id_info())

        self.unique_var = tk.BooleanVar(value=False)
        self.unique_name_var = tk.StringVar()
        self.unique_slug_var = tk.StringVar()
        self.unique_id_var = tk.StringVar()
        self.unique_check = ttk.Checkbutton(tab_story, text="고유 캐릭터 (랜덤 등장 안 함)", variable=self.unique_var, command=self.toggle_unique)
        self.unique_check.grid(row=0, column=0, columnspan=6, sticky="w")
        self.unique_entries = []
        for col, (label, var, width) in enumerate([("표시 이름", self.unique_name_var, 14), ("파일 이름(영문)", self.unique_slug_var, 14),
                                                   ("번호(비우면 자동)", self.unique_id_var, 8)]):
            ttk.Label(tab_story, text=label).grid(row=1, column=col * 2, sticky="e", padx=(0, 3), pady=2)
            entry = ttk.Entry(tab_story, textvariable=var, width=width, state="disabled")
            entry.grid(row=1, column=col * 2 + 1, sticky="w", padx=(0, 12))
            self.unique_entries.append(entry)
        self.story_boxes = {}
        for row, (key, field, label) in enumerate(self.api.STORY_FIELDS, start=2):
            ttk.Label(tab_story, text=label).grid(row=row, column=0, sticky="ne", padx=(0, 3), pady=2)
            box = tk.Text(tab_story, width=110, height=3, wrap="word", state="disabled", font=tkfont.nametofont("TkDefaultFont"))
            box.grid(row=row, column=1, columnspan=5, sticky="w", pady=2)
            self.story_boxes[key] = box
        ttk.Label(tab_story, text="빈 칸은 기존 내용을 그대로 둡니다. 줄바꿈은 게임에서 줄바꿈(<br>)이 됩니다.", foreground="#666").grid(row=5, column=0, columnspan=6, sticky="w")
        for var in (self.unique_slug_var, self.unique_id_var, self.unique_var):
            var.trace_add("write", lambda *args: self.update_id_info())

        self.stats_tab = tab_stats
        self.stats_info = tk.StringVar(value="기존 캐릭터를 불러온 뒤 '이 캐릭터 복제'를 누르면 여기서 능력치를 고칠 수 있습니다.")
        ttk.Label(tab_stats, textvariable=self.stats_info, foreground="#175d96").pack(anchor="w")
        holder = ttk.Frame(tab_stats)
        holder.pack(fill="x")
        self.stats_canvas = tk.Canvas(holder, height=96, highlightthickness=0)
        scroll = ttk.Scrollbar(holder, orient="vertical", command=self.stats_canvas.yview)
        self.stats_canvas.configure(yscrollcommand=scroll.set)
        self.stats_canvas.pack(side="left", fill="x", expand=True)
        scroll.pack(side="right", fill="y")
        self.stats_inner = ttk.Frame(self.stats_canvas)
        self.stats_canvas.create_window((0, 0), window=self.stats_inner, anchor="nw")
        self.stats_inner.bind("<Configure>", lambda event: self.stats_canvas.configure(scrollregion=self.stats_canvas.bbox("all")))
        self.stats_canvas.bind("<MouseWheel>", lambda event: self.stats_canvas.yview_scroll(-int(event.delta / 120), "units"))

    def fit_notebook(self):
        """선택한 탭의 높이에 맞춰 노트북을 줄여 중앙 전신창이 더 넓게 쓰이게 한다."""
        try:
            tab = self.window.nametowidget(self.nb.select())
            tab.update_idletasks()
            self.nb.configure(height=tab.winfo_reqheight() + 4)
        except tk.TclError:
            pass

    # ------------------------------------------------------------------ 기록·메시지
    def log(self, text):
        text = str(text)
        self.logbox.insert("end", text + "\n")
        self.logbox.see("end")
        self.last_log.set(text.strip().splitlines()[0][:110] if text.strip() else "")
        self.window.update_idletasks()

    def error(self, text):
        self.status.set(str(text))
        self.log("[!] " + str(text))
        messagebox.showerror("확인", str(text), parent=self.window)
        return False

    def dirty(self):
        if any(s["changed"] for s in self.slots.values()) or self.face_changed or self.clone_dirty:
            return True
        if self.identity_values() != self.identity_original:
            return True
        return bool(self.loaded_data and self.mode.get() == "edit" and self.changed_attributes())

    def discard_allowed(self):
        return not self.dirty() or messagebox.askyesno("저장하지 않은 변경", "저장하지 않은 변경을 버리고 계속할까요?", parent=self.window)

    # ------------------------------------------------------------------ 게임 폴더·목록
    def pick_game(self):
        path = filedialog.askdirectory(title="game 폴더 선택", parent=self.window)
        if not path:
            return
        if not self.api._looks_like_game_root(path):
            self.error("content/pic/girls/full과 json/slaves가 있는 game 폴더를 선택하세요.")
            return
        if not self.discard_allowed():
            return
        self.paths = self.api.GamePaths(path)
        self.game_var.set(path)
        self.tool_log.game_root = path
        self.log_event("game_folder", note="게임 폴더 지정: " + path, id=None)
        self.new_character(confirm=False)
        self.refresh_library()

    def queue_search(self, *args):
        if self.search_job:
            self.window.after_cancel(self.search_job)
        self.search_job = self.window.after(180, self.search_now)

    def search_now(self):
        self.search_job = None
        self.page = 0
        self.render_library()

    def refresh_library(self):
        if not self.paths:
            return
        try:
            self.library = self.api.scan_characters(self.paths)
            self.ref_index = None
            self.page = 0
            self.render_library()
        except Exception as exc:
            self.error("캐릭터 목록을 읽을 수 없습니다: " + str(exc))

    def filtered_library(self):
        words = self.search_var.get().lower().split()
        age, color = self.filter_age.get(), self.filter_color.get()
        return [item for item in self.library
                if (age == "전체" or item["age"] == age) and (color == "전체" or item["color"] == color)
                and all(word in (str(item["id"]) + " " + item.get("name", "") + " " + item["base"] + " " + item.get("json_file", "")).lower() for word in words)]

    def render_library(self):
        if not self.paths:
            return
        for widget in self.library_inner.winfo_children():
            widget.destroy()
        self.images["library"] = []
        items = self.filtered_library()
        pages = max(1, math.ceil(len(items) / self.PAGE_SIZE))
        self.page = min(self.page, pages - 1)
        self.library_count.set("%s명 · %d / %d쪽" % (format(len(items), ","), self.page + 1, pages))
        for i, item in enumerate(items[self.page * self.PAGE_SIZE:(self.page + 1) * self.PAGE_SIZE]):
            try:
                with Image.open(item["face"]) as source:
                    image = source.convert("RGBA")
                image.thumbnail((70, 70), Image.LANCZOS)
                tile = Image.new("RGBA", (72, 72), (215, 220, 226, 255))
                tile.alpha_composite(image, ((72 - image.width) // 2, (72 - image.height) // 2))
            except Exception:
                tile = Image.new("RGBA", (72, 72), (160, 169, 180, 255))
            photo = ImageTk.PhotoImage(tile)
            self.images["library"].append(photo)
            name = item.get("name") or item["base"]
            button = tk.Button(self.library_inner, image=photo, text="%d · %s" % (item["id"], name[:10]), compound="top", width=98, height=98,
                               bg="#dbe8f5" if self.edit_id == item["id"] else "#f5f6f8", relief="flat", bd=1,
                               command=lambda sid=item["id"]: self.load_existing(sid))
            button.grid(row=i // 2, column=i % 2, padx=2, pady=2)
            button.bind("<MouseWheel>", self.scroll_library)
        if not items:
            ttk.Label(self.library_inner, text="검색 결과가 없습니다.", padding=12).grid(row=0, column=0)
        self.library_canvas.yview_moveto(0)

    def scroll_library(self, event):
        self.library_canvas.yview_scroll(-int(event.delta / 120), "units")
        return "break"

    def move_page(self, amount):
        pages = max(1, math.ceil(len(self.filtered_library()) / self.PAGE_SIZE))
        self.page = max(0, min(pages - 1, self.page + amount))
        self.render_library()

    # ------------------------------------------------------------------ 모드 전환
    def reset_images(self):
        self.slots = {key: self.blank_slot() for key in SLOT_KEYS}
        self.existing_face = None
        self.face_file = None
        self.face_box = None
        self.face_changed = False
        self.face_source.set("full")
        self.clone_dirty = False
        self.pick_mode = None
        self.align_var.set(False)
        self.align_frame.grid_remove()
        self.slot_var.set("base")
        self.draw_full()
        self.refresh_face_preview()
        self.refresh_slot_widgets()

    def new_character(self, confirm=True):
        if confirm and not self.discard_allowed():
            return False
        self.flush_logs()
        self.mode.set("new")
        self.unique_var.set(False)
        for var in (self.unique_name_var, self.unique_slug_var, self.unique_id_var):
            var.set("")
        self.set_story_values({})
        self.identity_original = self.identity_values()
        self.edit_id = self.loaded_data = None
        self.id_var.set("")
        self.reset_images()
        for var, choices, default in [(self.color_var, self.api.HAIR_COLORS, "black"), (self.length_var, self.api.HAIR_LENGTHS, "long"),
                                      (self.age_var, self.api.AGE_INFO, "loli"), (self.boobs_var, self.api.BOOBS_SIZES, "3"),
                                      (self.boobsimg_var, self.api.BOOBS_IMGS, "boobs_D"), (self.pussy_var, self.api.PUSSY_IMGS, "pussy_l1")]:
            if var.get() not in choices:
                var.set(default)
        self.clear_stats()
        self.update_mode()
        self.status.set("신규 추가 · 전신을 선택하고 얼굴 박스를 맞추세요.")
        self.log_event("new_mode", id=None, name=None, note="새 캐릭터 시작")
        return True

    def load_existing(self, sid, confirm=True):
        if not self.paths:
            return self.error("게임 폴더를 먼저 선택하세요.")
        try:
            sid = int(sid)
            data, filename = self.api.read_slave(self.paths, sid)
        except Exception as exc:
            return self.error("불러오기 실패: " + str(exc))
        if confirm and not self.discard_allowed():
            return False
        self.flush_logs()
        self.mode.set("edit")
        self.edit_id, self.loaded_data = sid, data
        self.reset_images()
        self.id_var.set(str(sid))
        self.loaded_json = filename
        self.clear_stats()
        dedicated = self.api.is_dedicated(self.paths, sid)
        for key in SLOT_KEYS:
            field, reference = self.api.slot_reference(data, key, dedicated)
            slot = self.slots[key]
            slot["field"], slot["ref"] = field, reference
            if reference:
                try:
                    slot["existing"] = self.api._load_rgba(self.api._abs_from_gamepath(self.paths.root, reference))
                except Exception:
                    slot["existing"] = None
        try:
            reference = data.get("seed_ava_clear") or "content/pic/girls/face/" + self.api.slave_base_name(data)
            self.existing_face = self.api._load_rgba(self.api._abs_from_gamepath(self.paths.root, reference))
        except Exception:
            self.existing_face = None
        self.face_source.set("keep" if self.existing_face is not None else "full")
        for field, value in [("seed_boobs", self.boobs_var), ("seed_boobs_img", self.boobsimg_var), ("seed_pussy_img", self.pussy_var)]:
            value.set(str(data.get(field, "")))
        match = next((item for item in self.library if item["id"] == sid), {})
        self.color_var.set(match.get("color") or "고유 이미지")
        self.length_var.set(match.get("length") or "고유 이미지")
        self.age_var.set(match.get("age") or "고유 캐릭터")
        stem = os.path.splitext(os.path.basename(filename))[0]
        slug = stem.split("_", 1)[1] if "_" in stem else ""
        self.unique_name_var.set(str(data.get("seed_name", "")))
        self.unique_slug_var.set(slug)
        self.unique_id_var.set(str(sid))
        self.unique_var.set(False)
        self.set_story_values({key: self.api.story_to_display(data.get(field, "")) for key, field, _label in self.api.STORY_FIELDS})
        self.identity_original = self.identity_values()
        self.ref_index = None
        self.update_mode()
        self.refresh_slot_widgets()
        self.draw_full()
        self.refresh_face_preview()
        self.status.set("ID %d 편집 · 탭으로 복장을 보고, 교체한 뒤 저장하세요." % sid)
        self.log("불러옴: %s · %s" % (os.path.basename(filename), data.get("seed_name", self.api.slave_base_name(data))))
        self.log_event("load", json=os.path.basename(filename), dedicated=dedicated,
                       note="기존 캐릭터 불러옴", slots={k: self.slots[k]["ref"] for k in SLOT_KEYS if self.slots[k]["ref"]})
        return True

    def start_clone(self):
        self.flush_logs()
        if self.mode.get() != "edit" or self.loaded_data is None:
            self.error("먼저 왼쪽 목록이나 ID 입력으로 복제할 캐릭터를 불러오세요.")
            return
        if self.dirty():
            if not messagebox.askyesno("복제", "저장하지 않은 변경이 있습니다.\n\n이미지·이름·파일 이름·번호·외모 변경은 버리고 원본을 복제합니다.\n입력한 이야기는 복제본으로 가져옵니다.\n\n계속할까요?", parent=self.window):
                return
        original_story = dict(self.identity_original["story"])
        source_id = self.edit_id
        data = self.loaded_data
        for slot in self.slots.values():
            slot.update(raw=None, src_path=None, src_key=None, t=None, changed=False, removed=False, cache=None)
        self.face_changed = False
        self.face_source.set("keep" if self.existing_face is not None else "full")
        self.mode.set("clone")
        self.unique_var.set(True)
        stem = os.path.splitext(os.path.basename(self.loaded_json))[0]
        slug = stem.split("_", 1)[1] if "_" in stem else ""
        self.unique_name_var.set(str(data.get("seed_name", "")))
        self.unique_slug_var.set((slug or "clone") + "_2")
        self.unique_id_var.set("")
        self.identity_original = self.identity_values()
        self.identity_original["story"] = original_story
        self.build_stats(data)
        self.clone_dirty = False
        self.update_mode()
        self.refresh_slot_widgets()
        self.draw_full()
        self.nb.select(1)
        self.window.after(30, self.fit_notebook)
        self.status.set("ID %d 복제 중 · 이름·이야기·능력치만 고치면 이미지는 원본과 공유됩니다." % source_id)
        self.log_event("clone_start", id=source_id, note="복제 시작")

    # -- 능력치 -----------------------------------------------------------------------
    def clear_stats(self):
        for widget in self.stats_inner.winfo_children():
            widget.destroy()
        self.stat_vars = {}
        self.stat_original = {}
        self.stats_info.set("기존 캐릭터를 불러온 뒤 '이 캐릭터 복제'를 누르면 여기서 능력치를 고칠 수 있습니다.")
        self.nb.tab(2, state="disabled")

    def build_stats(self, data):
        self.clear_stats()
        keys = self.api.stat_keys(data)
        for index, key in enumerate(keys):
            var = tk.StringVar(value=str(data[key]))
            self.stat_vars[key] = var
            self.stat_original[key] = int(data[key])
            col = index % 4
            row = index // 4
            ttk.Label(self.stats_inner, text=key.replace("seed_", ""), width=20, anchor="e").grid(row=row, column=col * 2, padx=(6, 2), pady=1)
            ttk.Spinbox(self.stats_inner, from_=-999, to=999, width=6, textvariable=var, command=self.on_stats_change).grid(row=row, column=col * 2 + 1, padx=(0, 6))
            var.trace_add("write", lambda *args: self.on_stats_change())
        self.nb.tab(2, state="normal")
        if keys:
            self.on_stats_change()
        else:
            self.stats_info.set("이 캐릭터에는 고정 능력치(seed_*)가 없어 게임이 무작위로 정합니다. 복제본도 같습니다.")

    def stat_overrides(self):
        out = {}
        for key, var in self.stat_vars.items():
            try:
                value = int(str(var.get()).strip())
            except ValueError:
                continue
            if value != self.stat_original.get(key):
                out[key] = value
        return out

    def on_stats_change(self):
        if self.stat_vars:
            self.stats_info.set("복제본 능력치 · 원본과 다른 항목 %d개 (원본 캐릭터는 바뀌지 않습니다)" % len(self.stat_overrides()))
            self.clone_dirty = True

    # ------------------------------------------------------------------ 모드 표시
    def toggle_unique(self):
        if self.unique_var.get() and self.mode.get() == "new":
            self.register_var.set(False)
        self.update_mode()

    def story_values(self):
        return {key: box.get("1.0", "end").strip() for key, box in self.story_boxes.items()}

    def identity_values(self):
        """저장 형식과 별도로 현재 입력을 비교해 지운 문장도 미저장 변경으로 확인한다."""
        return {"name": self.unique_name_var.get(), "slug": self.unique_slug_var.get(),
                "id": self.unique_id_var.get(), "story": self.story_values()}

    def changed_story(self):
        """원본과 표시 문장이 달라진 항목만 돌려준다(안 고친 문단은 JSON 원문을 그대로 보존)."""
        original = self.loaded_data or {}
        out = {}
        for key, field, _label in self.api.STORY_FIELDS:
            now = self.story_values().get(key, "")
            if now and now != self.api.story_to_display(original.get(field, "")):
                out[key] = now
        return out

    def set_story_values(self, values):
        for key, box in self.story_boxes.items():
            state = str(box.cget("state"))
            box.configure(state="normal")
            box.delete("1.0", "end")
            box.insert("1.0", values.get(key, ""))
            box.configure(state=state)

    def unique_options(self):
        if self.mode.get() != "new" or not self.unique_var.get():
            return None
        return {"name": self.unique_name_var.get(), "slug": self.unique_slug_var.get(), "id": self.unique_id_var.get().strip(), "story": self.story_values()}

    def identity_options(self):
        if self.mode.get() != "edit" or not self.unique_var.get():
            return None
        return {"name": self.unique_name_var.get(), "slug": self.unique_slug_var.get(), "story": self.changed_story()}

    def update_mode(self):
        mode = self.mode.get()
        editing = mode == "edit"
        cloning = mode == "clone"
        self.unique_check.configure(state="disabled" if cloning else "normal")
        for index, entry in enumerate(self.unique_entries):
            locked = editing and index == 2
            entry.configure(state="normal" if (self.unique_var.get() and not locked) else "disabled")
        for box in self.story_boxes.values():
            box.configure(state="normal" if self.unique_var.get() else "disabled")
        if cloning:
            self.save_button.configure(text="복제본 저장 (새 ID)")
        elif editing:
            self.save_button.configure(text="ID %d 변경사항 저장" % self.edit_id)
        else:
            self.save_button.configure(text="캐릭터 추가")
        self.delete_button.configure(state="normal" if editing else "disabled")
        self.clone_button.configure(state="normal" if editing else "disabled")
        self.register_button.configure(state="normal" if mode == "new" else "disabled")
        if self.keep_face_button is not None:
            self.keep_face_button.configure(state="normal" if (editing or cloning) else "disabled")
        for box in self.classification_boxes:
            box.configure(state="disabled" if (editing or cloning) else "readonly")
        if cloning:
            self.target_var.set("복제 중: ID %s → 새 ID" % self.edit_id)
        elif editing:
            self.target_var.set("편집 중: ID %d · %s" % (self.edit_id, self.loaded_data.get("seed_name", "")))
        else:
            self.target_var.set("새 캐릭터 추가 모드")
        self.update_id_info()

    def update_id_info(self):
        if not hasattr(self, "id_info"):
            return
        mode = self.mode.get()
        if mode == "edit" and self.loaded_data:
            self.id_info.set("ID·파일명 유지: " + os.path.basename(getattr(self, "loaded_json", "")))
        elif mode == "clone":
            self.id_info.set("복제본은 새 고유 번호와 새 JSON 파일이 만들어지고, 랜덤 등장 풀에는 들어가지 않습니다.")
        elif not self.paths:
            self.id_info.set("게임 폴더를 먼저 선택하세요.")
        else:
            try:
                sid, prefix, base, category = self.api.plan_add(self.paths, self.age_var.get(), self.color_var.get(), self.length_var.get())
                unique = self.unique_options()
                if unique:
                    sid = self.api.plan_unique_id(self.paths, unique["id"])
                    prefix = self.api.free_file_prefix(self.paths, sid, category)
                    base = "%04d_%s" % (prefix, category)
                    slug = self.api.clean_unique_slug(unique["slug"])
                    self.id_info.set("고유 ID %d → %s.json · %s.png" % (sid, ("%d_%s" % (sid, slug)) if slug else sid, base))
                else:
                    self.id_info.set("새 ID %d → %s.png" % (sid, base))
            except Exception as exc:
                self.id_info.set("추가 번호 확인: " + str(exc))

    # ------------------------------------------------------------------ 슬롯(탭) 처리
    def current_slot(self):
        return self.slots[self.slot_var.get()]

    def show_slot(self, key):
        self.slot_var.set(key)
        self.on_slot_change()

    def on_slot_change(self):
        self.flush_logs()
        self.pick_mode = None
        self.pick_points = []
        self.refresh_align_entries()
        self.draw_full()
        self.refresh_slot_widgets()

    def slot_source(self, key):
        slot = self.slots[key]
        if slot["removed"]:
            return None
        return slot["raw"] if slot["raw"] is not None else slot["existing"]

    def slot_composed(self, key, quality=Image.LANCZOS):
        """슬롯의 795×596 결과 이미지(맞춤 반영). 없으면 None."""
        slot = self.slots[key]
        raw = self.slot_source(key)
        if raw is None:
            return None
        t = slot["t"]
        token = (id(raw), None if t is None else (round(t["s"], 5), round(t["x"], 2), round(t["y"], 2)), quality)
        if slot["cache"] and slot["cache"][0] == token:
            return slot["cache"][1]
        if t is not None:
            image = align.apply_transform(raw, t, resample=quality)
        elif raw.size == (CANVAS_W, CANVAS_H):
            image = raw
        else:
            image = self.api.compose_full(raw)
        slot["cache"] = (token, image)
        return image

    def slot_state_text(self, key):
        slot = self.slots[key]
        cloning = self.mode.get() == "clone"
        if slot["removed"]:
            return "삭제 예정 · × 로 취소"
        if slot["changed"] and slot["raw"] is not None:
            text = "복제본 전용 저장 예정" if cloning else "교체 예정"
            return text + (" · 맞춤" if slot["t"] else "")
        if slot["changed"]:
            return "맞춤 다시 저장 예정"
        if slot["existing"] is not None:
            return "원본과 공유" if cloning else "연결됨"
        if slot["ref"]:
            return "연결됨 (파일 없음)"
        return "없음"

    def refresh_slot_widgets(self):
        for key in OUTFIT_SLOT_KEYS:
            self.slot_state[key].set(self.slot_state_text(key))
        key = self.slot_var.get()
        self.slot_note.set(self.slot_state_text(key))
        for k, button in self.slot_buttons.items():
            has = self.slot_source(k) is not None
            button.configure(text=("● " if has else "") + {"base": "기본(알몸)", "title": "타이틀", "maid": "하녀", "secr": "비서", "dom": "도미나"}[k])
        self.refresh_share_note()
        self.refresh_hint()

    def refresh_share_note(self):
        self.share_var.set("")
        if self.mode.get() not in ("edit", "clone") or not self.paths or self.edit_id is None:
            return
        slot = self.current_slot()
        if not slot["ref"]:
            return
        try:
            if self.ref_index is None:
                self.ref_index = self.api.build_ref_index(self.paths)
            users = sorted(self.ref_index.get(self.api._norm_ref(slot["ref"]), set()) - {self.edit_id})
        except Exception:
            return
        warning = self.api.rule_warning(self.paths, self.edit_id, self.slot_var.get(), slot["ref"])
        parts = []
        if users:
            parts.append("이미지 공유 중: ID " + ", ".join(str(u) for u in users[:12]) + (" 외" if len(users) > 12 else "")
                         + (" · 교체하면 이 캐릭터들에도 반영됩니다" if self.mode.get() == "edit" else ""))
        if warning:
            parts.append("경로 규칙 경고: " + warning)
        parts.append("연결 경로: " + slot["ref"])
        self.share_var.set("\n".join(parts))

    def refresh_hint(self):
        key = self.slot_var.get()
        if self.align_var.get():
            if self.pick_mode == "crown_cut":
                text = "정수리 중앙을 클릭하세요" if not self.pick_points else "하단 컷(무릎 위) 지점을 클릭하세요"
            elif self.pick_mode == "crown_chin":
                text = "정수리 중앙을 클릭하세요" if not self.pick_points else "턱 끝을 클릭하세요"
            else:
                text = "크기 맞춤 · 드래그 이동 · 휠 확대 · 방향키 1px(Shift 10px) · + − 1% · 가이드: 가운데선, 머리 상단 10~50"
        elif key == "base":
            text = "얼굴 박스: 안쪽 드래그 이동 · 모서리 드래그 크기 · 바깥 드래그 새로 그리기 · 방향키/+−/R"
        else:
            text = "이 탭은 보기·교체용입니다. 얼굴 박스는 기본(알몸) 탭에서 조절합니다."
        self.hint_var.set(text)

    def choose_slot_image(self, key=None):
        key = key or self.slot_var.get()
        path = self.pick_image(self.api.SLOT_LABELS[key] + " 이미지 선택")
        if not path:
            return
        try:
            image = self.api._load_rgba(path)
        except Exception as exc:
            self.error("이미지를 열 수 없습니다: " + str(exc))
            return
        slot = self.slots[key]
        slot.update(raw=image, src_path=path, src_key=file_key(path), t=None, changed=True, removed=False, cache=None)
        self.show_slot(key)
        if key == "base":
            self.reset_face_box(force=True)
            if self.face_source.get() == "keep":
                self.face_source.set("full")
            self.face_changed = True
        self.refresh_face_preview()
        self.refresh_slot_widgets()
        self.status.set("%s 이미지를 불러왔습니다 · 저장 직전에만 795×596으로 맞춥니다." % self.api.SLOT_LABELS[key])
        self.log_event("image_select", slot=key, source=slot["src_key"], source_size=list(image.size), path=path,
                       note="이미지 선택")

    def clear_slot(self, key):
        slot = self.slots[key]
        if slot["removed"]:
            slot["removed"] = False
            slot["changed"] = slot["raw"] is not None or slot["t"] is not None
        elif slot["raw"] is not None:
            slot.update(raw=None, src_path=None, src_key=None, t=None, changed=False, cache=None)
        elif slot["existing"] is not None and self.mode.get() == "edit":
            slot["removed"] = True
            slot["changed"] = True
        self.log_event("slot_clear", slot=key, note="슬롯 지우기/취소")
        self.refresh_slot_widgets()
        self.draw_full()

    def pick_image(self, title):
        return filedialog.askopenfilename(title=title, parent=self.window,
                                          filetypes=[("이미지", "*.png *.jpg *.jpeg *.webp *.bmp"), ("모든 파일", "*.*")])

    # ------------------------------------------------------------------ 캔버스 그리기
    def draw_full(self):
        if not hasattr(self, "full_canvas"):
            return
        canvas = self.full_canvas
        canvas.delete("all")
        cw, ch = max(200, canvas.winfo_width()), max(150, canvas.winfo_height())
        scale = min((cw - 8) / CANVAS_W, (ch - 8) / CANVAS_H)
        dw, dh = int(CANVAS_W * scale), int(CANVAS_H * scale)
        ox, oy = (cw - dw) // 2, (ch - dh) // 2
        self.canvas_geometry = (scale, ox, oy)
        canvas.create_rectangle(ox, oy, ox + dw, oy + dh, fill="#2b3036", outline="#4a525b")
        key = self.slot_var.get()
        image = self.slot_composed(key, Image.BILINEAR if self.drag else Image.LANCZOS)
        if image is None:
            canvas.create_text(cw // 2, ch // 2, fill="#c8d3dd", justify="center",
                               text="%s 이미지 없음\n'이 이미지 선택 / 교체'로 추가하거나\n왼쪽에서 캐릭터를 불러오세요" % self.api.SLOT_LABELS[key])
            return
        photo = ImageTk.PhotoImage(image.resize((dw, dh), Image.BILINEAR))
        self.images["full"] = photo
        canvas.create_image(ox, oy, anchor="nw", image=photo)
        if self.align_var.get():
            self.draw_guides(ox, oy, scale)
        elif key == "base" and self.face_source.get() == "full" and self.face_box:
            self.draw_face_box(ox, oy, scale)

    def draw_guides(self, ox, oy, scale):
        c = self.full_canvas
        x = ox + align.W / 2 * scale
        c.create_line(x, oy, x, oy + align.H * scale, fill="#5bf699", dash=(4, 3))
        try:
            top = int(float(self.top_var.get()))
        except ValueError:
            top = align.DEFAULT_TOP
        for value, color in ((10, "#556b7a"), (50, "#556b7a"), (top, "#f0c040")):
            y = oy + value * scale
            c.create_line(ox, y, ox + align.W * scale, y, fill=color, dash=(3, 3))
        c.create_text(ox + 4, oy + top * scale - 8, anchor="w", fill="#f0c040", text="머리 상단 %d" % top, font=("", 8))
        for point in self.pick_points:
            px, py = ox + point[0] * scale, oy + point[1] * scale
            c.create_oval(px - 4, py - 4, px + 4, py + 4, outline="#ff6b6b", width=2)

    def draw_face_box(self, ox, oy, scale):
        x, y, w = self.face_box
        h = self.face_height(w)
        c = self.full_canvas
        x0, y0, x1, y1 = ox + x * scale, oy + y * scale, ox + (x + w) * scale, oy + (y + h) * scale
        c.create_rectangle(x0, y0, x1, y1, outline="#5bf699", width=2)
        for hx, hy in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)):
            c.create_rectangle(hx - 4, hy - 4, hx + 4, hy + 4, fill="#5bf699", outline="#1d2126")
        c.create_text(x0, max(oy + 8, y0 - 9), anchor="w", fill="#5bf699", font=("", 8),
                      text="%d, %d · %d×%d" % (x, y, w, h))

    # ------------------------------------------------------------------ 얼굴 박스
    @staticmethod
    def face_height(width):
        return max(1, int(round(width * FACE_RATIO)))

    def reset_face_box(self, force=False):
        image = self.slot_composed("base")
        if image is None:
            self.face_box = None
            return
        if self.face_box and not force:
            return
        bounds = align.alpha_bounds(image)
        width = self.face_size_pref or int(round(align.H * 0.2 * 151 / 150))
        width = max(24, min(width, align.W - 2))
        if bounds["w"] > 0 and bounds["transparent"] > 0.05:
            cx, y = bounds["x"] + bounds["w"] / 2, bounds["y"]
        else:
            cx, y = align.W / 2, 24
        x = int(round(cx - width / 2))
        self.face_box = [x, int(y), width]
        self.clamp_face_box()

    def clamp_face_box(self):
        if not self.face_box:
            return
        x, y, w = self.face_box
        w = max(16, min(w, align.W, int(align.H / FACE_RATIO)))
        h = self.face_height(w)
        x = max(0, min(align.W - w, x))
        y = max(0, min(align.H - h, y))
        self.face_box = [int(x), int(y), int(w)]

    def remember_face_size(self):
        if self.face_box:
            self.face_size_pref = int(self.face_box[2])
            settings = self.tool_log.read_settings()
            settings["face_size"] = self.face_size_pref
            self.tool_log.write_settings(settings)

    def face_box_changed(self):
        self.clamp_face_box()
        self.face_source.set("full")
        self.face_changed = True
        self.draw_full()
        self.refresh_face_preview()

    def get_face_crop(self):
        source = self.face_source.get()
        if source == "full":
            image = self.slot_composed("base")
            if image is None or not self.face_box:
                return None
            x, y, w = self.face_box
            return image.crop((x, y, x + w, y + self.face_height(w))).convert("RGBA")
        if source == "file":
            return self.api._load_rgba(self.face_file) if self.face_file else None
        return self.existing_face.copy() if self.existing_face is not None else None

    def change_face_source(self):
        if self.face_source.get() == "full":
            self.reset_face_box()
            self.face_changed = True
        else:
            self.face_changed = self.face_source.get() != "keep"
        self.draw_full()
        self.refresh_face_preview()

    def choose_face(self):
        path = self.pick_image("별도 얼굴 이미지 선택")
        if not path:
            return
        try:
            self.api._load_rgba(path)
        except Exception as exc:
            self.error("얼굴 이미지를 열 수 없습니다: " + str(exc))
            return
        self.face_file = path
        self.face_source.set("file")
        self.face_changed = True
        self.refresh_face_preview()
        self.log_event("face_file", source=file_key(path), note="별도 얼굴 파일 선택")

    def refresh_face_preview(self):
        if not hasattr(self, "face_labels"):
            return
        source = self.face_source.get()
        crop = None
        try:
            crop = self.get_face_crop()
        except Exception:
            crop = None
        if source == "keep":
            self.face_var.set("현재 얼굴을 유지합니다.")
        elif source == "file":
            self.face_var.set(os.path.basename(self.face_file) if self.face_file else "얼굴 파일을 선택하세요.")
        else:
            self.face_var.set("얼굴 박스 지정됨 (%d, %d · %d px)" % tuple(self.face_box) if (crop is not None and self.face_box) else "기본(알몸) 탭에서 얼굴 박스를 맞추세요.")
        size = 64
        if crop is None:
            previews = {key: Image.new("RGBA", (size, size), (35, 39, 43, 255)) for key in self.face_labels}
        else:
            if self.resize_face_var.get() and crop.size != self.api.FACE_SIZE:
                crop = crop.resize(self.api.FACE_SIZE, Image.LANCZOS)
            previews = {"clear": crop, "gray": self.api.to_grayscale(crop), "sepia": self.api.to_sepia(crop)}
        for key, image in previews.items():
            image = image.copy()
            image.thumbnail((size, size), Image.LANCZOS)
            tile = Image.new("RGBA", (size, size), (35, 39, 43, 255))
            tile.alpha_composite(image, ((size - image.width) // 2, (size - image.height) // 2))
            photo = ImageTk.PhotoImage(tile)
            self.images["face_" + key] = photo
            self.face_labels[key].configure(image=photo)

    # ------------------------------------------------------------------ 마우스·키보드
    def to_image(self, x, y):
        scale, ox, oy = self.canvas_geometry
        return (x - ox) / scale, (y - oy) / scale

    def on_press(self, event):
        self.full_canvas.focus_set()
        ix, iy = self.to_image(event.x, event.y)
        key = self.slot_var.get()
        if self.align_var.get():
            if self.pick_mode:
                self.add_pick_point(ix, iy)
                return
            slot = self.slots[key]
            if self.slot_source(key) is None:
                return
            self.ensure_transform(key)
            self.drag = {"kind": "image", "start": (ix, iy), "t0": dict(slot["t"])}
            return
        if key != "base" or self.slot_source("base") is None:
            return
        if self.face_source.get() != "full":
            self.face_source.set("full")
        if not self.face_box:
            self.reset_face_box()
        handle = self.hit_face_box(ix, iy)
        if handle == "move":
            self.drag = {"kind": "face_move", "start": (ix, iy), "box0": list(self.face_box)}
        elif handle:
            x, y, w = self.face_box
            h = self.face_height(w)
            corners = {"nw": (x + w, y + h), "ne": (x, y + h), "sw": (x + w, y), "se": (x, y)}
            self.drag = {"kind": "face_size", "anchor": corners[handle], "handle": handle}
        else:
            self.drag = {"kind": "face_new", "start": (ix, iy)}
            self.face_box = [int(ix), int(iy), 16]
        self.face_box_changed()

    def hit_face_box(self, ix, iy):
        if not self.face_box:
            return None
        scale = self.canvas_geometry[0]
        x, y, w = self.face_box
        h = self.face_height(w)
        tol = 9 / scale
        for name, (cx, cy) in {"nw": (x, y), "ne": (x + w, y), "sw": (x, y + h), "se": (x + w, y + h)}.items():
            if abs(ix - cx) <= tol and abs(iy - cy) <= tol:
                return name
        if x <= ix <= x + w and y <= iy <= y + h:
            return "move"
        return None

    def on_drag(self, event):
        if not self.drag:
            return
        ix, iy = self.to_image(event.x, event.y)
        kind = self.drag["kind"]
        if kind == "image":
            sx, sy = self.drag["start"]
            t0 = self.drag["t0"]
            slot = self.current_slot()
            slot["t"] = {"s": t0["s"], "x": t0["x"] + (ix - sx), "y": t0["y"] + (iy - sy)}
            slot["changed"] = True
            self.refresh_align_entries()
            self.draw_full()
        elif kind == "face_move":
            sx, sy = self.drag["start"]
            b0 = self.drag["box0"]
            self.face_box = [b0[0] + int(round(ix - sx)), b0[1] + int(round(iy - sy)), b0[2]]
            self.face_box_changed()
        elif kind == "face_size":
            ax, ay = self.drag["anchor"]
            w = max(16, int(max(abs(ix - ax), abs(iy - ay) / FACE_RATIO)))
            h = self.face_height(w)
            x = ax - w if ix < ax else ax
            y = ay - h if iy < ay else ay
            self.face_box = [int(x), int(y), w]
            self.face_box_changed()
        elif kind == "face_new":
            sx, sy = self.drag["start"]
            w = max(16, int(max(abs(ix - sx), abs(iy - sy) / FACE_RATIO)))
            h = self.face_height(w)
            x = sx - w if ix < sx else sx
            y = sy - h if iy < sy else sy
            self.face_box = [int(x), int(y), w]
            self.face_box_changed()

    def on_release(self, event):
        if not self.drag:
            return
        kind = self.drag["kind"]
        self.drag = None
        if kind == "image":
            self.draw_full()
            self.refresh_slot_widgets()
            self.log_align("드래그")
        else:
            self.remember_face_size()
            self.draw_full()
            self.log_event("face_box", box=list(self.face_box), note="얼굴 박스 지정")

    def on_wheel(self, event):
        steps = event.delta / 120.0
        key = self.slot_var.get()
        if self.align_var.get():
            if self.slot_source(key) is None or self.pick_mode:
                return "break"
            ix, iy = self.to_image(event.x, event.y)
            slot = self.slots[key]
            self.ensure_transform(key)
            t = slot["t"]
            factor = 1.03 ** steps
            s2 = max(0.05, min(12, t["s"] * factor))
            ratio = s2 / t["s"]
            slot["t"] = {"s": s2, "x": ix - (ix - t["x"]) * ratio, "y": iy - (iy - t["y"]) * ratio}
            slot["changed"] = True
            self.after_align_change("휠")
        elif key == "base" and self.face_box and self.face_source.get() == "full":
            self.resize_face_box(int(2 * steps) or (2 if steps > 0 else -2), recenter=True)
            self.queue_face_log()
        return "break"

    def on_key(self, event):
        shift = bool(event.state & 0x1)
        step = 10 if shift else 1
        sym = event.keysym
        key = self.slot_var.get()
        if self.align_var.get() and self.slot_source(key) is not None and not self.pick_mode:
            if sym in ("Left", "Right", "Up", "Down"):
                self.ensure_transform(key)
                t = self.slots[key]["t"]
                dx = {"Left": -step, "Right": step}.get(sym, 0)
                dy = {"Up": -step, "Down": step}.get(sym, 0)
                self.slots[key]["t"] = {"s": t["s"], "x": t["x"] + dx, "y": t["y"] + dy}
                self.slots[key]["changed"] = True
                self.after_align_change("키보드 이동")
                return "break"
            if sym in ("plus", "equal", "KP_Add", "minus", "KP_Subtract"):
                self.ensure_transform(key)
                t = self.slots[key]["t"]
                factor = 1.01 if sym in ("plus", "equal", "KP_Add") else 1 / 1.01
                if shift:
                    factor = factor ** 5
                s2 = max(0.05, min(12, t["s"] * factor))
                ratio = s2 / t["s"]
                cx, cy = align.W / 2, align.H / 2
                self.slots[key]["t"] = {"s": s2, "x": cx - (cx - t["x"]) * ratio, "y": cy - (cy - t["y"]) * ratio}
                self.slots[key]["changed"] = True
                self.after_align_change("키보드 확대")
                return "break"
            return None
        if key == "base" and self.face_source.get() == "full" and self.slot_source("base") is not None and not self.align_var.get():
            if not self.face_box:
                self.reset_face_box()
            if sym in ("Left", "Right", "Up", "Down"):
                x, y, w = self.face_box
                self.face_box = [x + {"Left": -step, "Right": step}.get(sym, 0), y + {"Up": -step, "Down": step}.get(sym, 0), w]
                self.face_box_changed()
                self.queue_face_log()
                return "break"
            if sym in ("plus", "equal", "KP_Add"):
                self.resize_face_box(step)
                self.queue_face_log()
                return "break"
            if sym in ("minus", "KP_Subtract"):
                self.resize_face_box(-step)
                self.queue_face_log()
                return "break"
            if sym in ("r", "R"):
                self.reset_face_box(force=True)
                self.face_box_changed()
                self.queue_face_log()
                return "break"
        return None

    def resize_face_box(self, delta, recenter=True):
        if not self.face_box:
            return
        x, y, w = self.face_box
        w2 = max(16, w + delta)
        if recenter:
            x -= (w2 - w) // 2
            y -= (self.face_height(w2) - self.face_height(w)) // 2
        self.face_box = [x, y, w2]
        self.face_box_changed()
        self.remember_face_size()

    def queue_face_log(self):
        box = list(self.face_box) if self.face_box else None
        self.queue_log("face_box", lambda: self.log_event("face_box", box=box, note="얼굴 박스 지정"))

    # ------------------------------------------------------------------ 크기 맞춤
    def toggle_align(self):
        if self.align_var.get():
            key = self.slot_var.get()
            if self.slot_source(key) is None:
                self.align_var.set(False)
                self.status.set("이 탭에 이미지가 없습니다. 먼저 이미지를 선택하세요.")
                return
            self.ensure_transform(key)
            self.align_frame.grid()
            self.full_canvas.focus_set()
        else:
            self.align_frame.grid_remove()
            self.pick_mode = None
            self.pick_points = []
        self.refresh_align_entries()
        self.draw_full()
        self.refresh_hint()

    def ensure_transform(self, key):
        slot = self.slots[key]
        if slot["t"] is None:
            raw = self.slot_source(key)
            slot["t"] = align.contain_transform(raw.size)
            slot["raw"] = raw if slot["raw"] is None else slot["raw"]
            slot["changed"] = True
            slot["cache"] = None
        return slot["t"]

    def refresh_align_entries(self):
        key = self.slot_var.get()
        t = self.slots[key]["t"] if self.slot_source(key) is not None else None
        if t:
            self.s_var.set("%.4f" % t["s"])
            self.x_var.set("%.1f" % t["x"])
            self.y_var.set("%.1f" % t["y"])
        else:
            for var in (self.s_var, self.x_var, self.y_var):
                var.set("")

    def apply_entries(self):
        if not self.align_var.get():
            return
        key = self.slot_var.get()
        if self.slot_source(key) is None:
            return
        try:
            t = align.check_transform({"s": float(self.s_var.get()), "x": float(self.x_var.get()), "y": float(self.y_var.get())})
        except ValueError:
            self.refresh_align_entries()
            return
        slot = self.slots[key]
        if slot["t"] and all(abs(slot["t"][k] - t[k]) < 1e-6 for k in "sxy"):
            return
        self.ensure_transform(key)
        slot["t"] = t
        slot["changed"] = True
        self.after_align_change("숫자 입력")

    def on_rules_change(self):
        try:
            self.rules = {"top": max(10, min(50, int(float(self.top_var.get())))), "headSize": max(60, int(float(self.head_var.get())))}
        except ValueError:
            return
        self.draw_full()

    def current_rules(self):
        self.on_rules_change()
        return dict(self.rules)

    def after_align_change(self, method):
        self.refresh_align_entries()
        self.draw_full()
        self.refresh_slot_widgets()
        if self.slot_var.get() == "base":
            self.refresh_face_preview()
        key = self.slot_var.get()
        self.queue_log("align:" + key, lambda: self.log_align(method, key))

    def log_align(self, method, key=None):
        key = key or self.slot_var.get()
        slot = self.slots[key]
        if slot["t"] is None:
            return
        raw = self.slot_source(key)
        self.log_event("align", slot=key, source=slot["src_key"] or slot["ref"], source_size=list(raw.size) if raw is not None else None,
                       method=method, transform=align.round_transform(slot["t"]), rules=self.current_rules())

    def reset_transform(self):
        key = self.slot_var.get()
        raw = self.slot_source(key)
        if raw is None:
            return
        slot = self.slots[key]
        slot["t"] = align.contain_transform(raw.size)
        slot["changed"] = True
        self.after_align_change("기본 비율")

    def align_by_bounds(self):
        key = self.slot_var.get()
        raw = self.slot_source(key)
        if raw is None:
            return
        slot = self.slots[key]
        self.ensure_transform(key)
        bounds = align.alpha_bounds(raw)
        if bounds["w"] == 0:
            self.status.set("투명하지 않은 영역이 없어 여백 정렬을 할 수 없습니다.")
            return
        slot["t"] = align.align_bounds(bounds, slot["t"]["s"], self.current_rules()["top"])
        slot["changed"] = True
        self.after_align_change("투명 여백 정렬")

    def start_pick(self, mode):
        key = self.slot_var.get()
        if self.slot_source(key) is None:
            return
        self.ensure_transform(key)
        self.pick_mode = mode
        self.pick_points = []
        self.full_canvas.focus_set()
        self.refresh_hint()
        self.draw_full()

    def cancel_pick(self):
        self.pick_mode = None
        self.pick_points = []
        self.refresh_hint()
        self.draw_full()

    def add_pick_point(self, ix, iy):
        key = self.slot_var.get()
        slot = self.slots[key]
        t = slot["t"]
        self.pick_points.append((ix, iy))
        if len(self.pick_points) < 2:
            self.refresh_hint()
            self.draw_full()
            return
        # 캔버스 좌표 -> 원본 좌표
        raw_points = [((px - t["x"]) / t["s"], (py - t["y"]) / t["s"]) for px, py in self.pick_points]
        rules = self.current_rules()
        mode = self.pick_mode
        try:
            if mode == "crown_cut":
                slot["t"] = align.fit_landmarks(raw_points[0], raw_points[1], rules["top"])
                method = "정수리→하단 컷"
            else:
                a, b = raw_points
                if b[1] - a[1] < 8:
                    raise ValueError("두 번째 점은 정수리보다 아래에 찍어 주세요.")
                s = rules["headSize"] / (b[1] - a[1])
                slot["t"] = align.check_transform({"s": s, "x": align.W / 2 - a[0] * s, "y": rules["top"] - a[1] * s})
                method = "정수리→턱(머리 크기)"
        except ValueError as exc:
            self.status.set(str(exc))
            self.cancel_pick()
            return
        slot["changed"] = True
        points = [[round(p[0], 1), round(p[1], 1)] for p in raw_points]
        self.pick_mode = None
        self.pick_points = []
        self.refresh_align_entries()
        self.draw_full()
        self.refresh_slot_widgets()
        self.refresh_face_preview()
        self.log_event("align", slot=key, source=slot["src_key"] or slot["ref"], source_size=list(self.slot_source(key).size),
                       method=method, anchors=points, transform=align.round_transform(slot["t"]), rules=rules)

    def copy_transform_dialog(self):
        key = self.slot_var.get()
        source = self.slot_source(key)
        t = self.slots[key]["t"]
        if source is None or t is None:
            self.status.set("복사할 맞춤 수치가 없습니다. 먼저 이 탭을 맞추세요.")
            return
        targets = [k for k in SLOT_KEYS if k != key and self.slot_source(k) is not None]
        if not targets:
            self.status.set("복사할 다른 이미지가 없습니다.")
            return
        dialog = tk.Toplevel(self.window)
        dialog.title("맞춤 수치 복사")
        dialog.transient(self.window)
        dialog.grab_set()
        ttk.Label(dialog, text="%s 의 수치(배율 %.4f, X %.1f, Y %.1f)를\n복사할 탭을 고르세요.\n해상도가 다르면 결과 크기가 같아지도록 배율을 보정합니다." %
                  (self.api.SLOT_LABELS[key], t["s"], t["x"], t["y"]), padding=10).pack()
        checks = {}
        for k in targets:
            checks[k] = tk.BooleanVar(value=True)
            ttk.Checkbutton(dialog, text="%s  (%d×%d)" % (self.api.SLOT_LABELS[k], *self.slot_source(k).size), variable=checks[k]).pack(anchor="w", padx=14)
        ttk.Label(dialog, text="복사한 탭은 저장할 때 새 맞춤으로 다시 저장됩니다.", foreground="#b35c00", padding=(10, 6)).pack()

        def apply():
            chosen = [k for k, var in checks.items() if var.get()]
            dialog.destroy()
            if not chosen:
                return
            done = []
            for k in chosen:
                dest = self.slot_source(k)
                new_t = align.rescale_for_size(t, source.size, dest.size)
                self.slots[k].update(t=new_t, changed=True, cache=None)
                if self.slots[k]["raw"] is None:
                    self.slots[k]["raw"] = dest
                done.append({"slot": k, "transform": align.round_transform(new_t), "size": list(dest.size)})
            self.log_event("copy_transform", slot=key, transform=align.round_transform(t), source_size=list(source.size),
                           copy_to=[d["slot"] for d in done], targets=done, rules=self.current_rules())
            self.refresh_slot_widgets()
            self.draw_full()
            self.status.set("수치를 %d개 탭에 복사했습니다." % len(done))

        ttk.Button(dialog, text="복사", command=apply).pack(pady=8)

    def apply_saved_alignment(self):
        key = self.slot_var.get()
        if self.edit_id is None:
            self.status.set("저장된 수치는 기존 캐릭터를 불러온 뒤에 쓸 수 있습니다.")
            return
        saved = self.tool_log.alignment_for(self.edit_id, key)
        source = self.slot_source(key)
        if not saved or source is None:
            self.status.set("이 캐릭터의 저장된 맞춤 수치가 없습니다.")
            return
        size = saved.get("source_size") or list(source.size)
        new_t = align.rescale_for_size(saved["transform"], tuple(size), source.size)
        self.ensure_transform(key)
        self.slots[key]["t"] = new_t
        self.slots[key]["changed"] = True
        self.after_align_change("저장된 수치 적용")
        self.status.set("저장된 맞춤 수치를 적용했습니다. (%s, %s)" % (saved.get("ts", ""), saved.get("source", "")))

    # ------------------------------------------------------------------ 저장
    def changed_attributes(self):
        current = {"seed_boobs": self.boobs_var.get(), "seed_boobs_img": self.boobsimg_var.get(), "seed_pussy_img": self.pussy_var.get()}
        return {field: value for field, value in current.items() if str((self.loaded_data or {}).get(field, "")) != value}

    def final_slot_image(self, key):
        """저장할 795×596 이미지. 새 이미지에만 배경 제거를 적용한다."""
        slot = self.slots[key]
        raw = self.slot_source(key)
        if raw is None:
            return None
        if slot["raw"] is not None and slot["src_path"] and self.cutout_var.get() and self.api.rembg_available():
            self.log("   ... %s 배경 제거 중" % self.api.SLOT_LABELS[key])
            raw = self.api.remove_bg(raw)
        if slot["t"] is not None:
            return align.apply_transform(raw, slot["t"])
        return raw if raw.size == (CANVAS_W, CANVAS_H) else self.api.compose_full(raw)

    def collect_slot_images(self):
        images = {}
        for key in SLOT_KEYS:
            slot = self.slots[key]
            if slot["removed"]:
                images[key] = None
            elif slot["changed"]:
                images[key] = self.final_slot_image(key)
        return images

    def perform_save(self, dry_run=False):
        if not self.paths:
            raise ValueError("게임 폴더를 먼저 선택하세요.")
        mode = self.mode.get()
        crop = None
        if self.face_changed or mode == "new":
            crop = self.get_face_crop()
        images = self.collect_slot_images()
        if mode == "new":
            base = images.get("base")
            if base is None:
                raise ValueError("기본(알몸) 전신 이미지를 선택하세요.")
            if crop is None:
                raise ValueError("얼굴 박스를 맞추거나 별도 얼굴 파일을 선택하세요.")
            outfits = {self.api.SLOT_FIELDS[k][0]: images[k] for k in ("maid", "secr", "dom") if images.get(k) is not None}
            return self.api.add_character(self.paths, base, None, self.color_var.get(), self.length_var.get(), self.age_var.get(),
                                          self.boobs_var.get(), self.boobsimg_var.get(), self.pussy_var.get(),
                                          resize_full=True, resize_face=self.resize_face_var.get(),
                                          register_pool=self.register_var.get(), auto_cutout=False, face_image=crop,
                                          outfits=outfits, title=images.get("title"), log=self.log, dry_run=dry_run,
                                          unique=self.unique_options())
        if self.face_changed and crop is None and self.face_source.get() != "keep":
            raise ValueError("얼굴 박스를 맞춘 뒤 저장하세요.")
        face = crop if (self.face_changed and self.face_source.get() != "keep") else None
        if face is not None and self.resize_face_var.get() is False:
            pass
        if mode == "clone":
            return self.api.clone_character(self.paths, self.edit_id, name=self.unique_name_var.get(), slug=self.unique_slug_var.get(),
                                            new_id=self.unique_id_var.get().strip(), story=self.changed_story(),
                                            seed_overrides=self.stat_overrides(),
                                            slot_images={k: v for k, v in images.items() if v is not None},
                                            face_image=face, log=self.log, dry_run=dry_run)
        return self.api.save_character_slots(self.paths, self.edit_id, slot_images=images, face_image=face,
                                             attributes=self.changed_attributes(), identity=self.identity_options(),
                                             log=self.log, dry_run=dry_run)

    def save_summary(self):
        mode = self.mode.get()
        slots = {}
        for key in SLOT_KEYS:
            slot = self.slots[key]
            if slot["changed"] or slot["removed"]:
                raw = self.slot_source(key)
                slots[key] = {"action": "remove" if slot["removed"] else ("replace" if slot["raw"] is not None and slot["src_path"] else "realign"),
                              "source": slot["src_key"] or slot["ref"], "source_size": list(raw.size) if raw is not None else None,
                              "transform": align.round_transform(slot["t"]) if slot["t"] else None}
        return {"mode": mode, "slots": slots, "face": {"source": self.face_source.get(), "box": list(self.face_box) if self.face_box else None,
                                                       "changed": self.face_changed},
                "options": {"cutout": bool(self.cutout_var.get()), "face_standard": bool(self.resize_face_var.get()),
                            "register_pool": bool(self.register_var.get())}, "rules": self.current_rules()}

    def save_current(self):
        self.flush_logs()
        mode = self.mode.get()
        summary = self.save_summary()
        source_id = self.edit_id
        try:
            preview = self.perform_save(dry_run=True)
        except Exception as exc:
            self.log_event("save_error", error=str(exc), stage="preview", **summary)
            return self.error("저장하지 못했습니다: " + str(exc))
        shared = preview.get("shared_with") if mode == "edit" else None
        preserved = preview.get("preserved_shared_with") if mode == "edit" else None
        if shared or preserved:
            notes = []
            if shared:
                notes.append("같은 이미지를 쓰는 다른 캐릭터에도 반영됩니다:\nID %s" % ", ".join(str(x) for x in shared[:20]))
            if preserved:
                notes.append("다른 캐릭터(ID %s)도 쓰는 PNG는 보존하고, 이 캐릭터의 이미지 연결만 해제합니다." % ", ".join(str(x) for x in preserved[:20]))
            text = "\n\n".join(notes) + "\n\n그대로 저장할까요?"
            if not messagebox.askyesno("공유 이미지 변경", text, parent=self.window):
                return None
        self.log_event("save_start", id=source_id,
                       files=[os.path.relpath(p, self.paths.root).replace("\\", "/") for p in preview.get("files", [])],
                       shared_with=shared or None, preserved_shared_with=preserved or None, warnings=preview.get("warnings") or None, **summary)
        try:
            result = self.perform_save()
        except Exception as exc:
            self.log_event("save_error", error=str(exc), stage="write", **summary)
            return self.error("저장하지 못했습니다: " + str(exc))
        sid = result["id"]
        data = result.get("data") or {}
        name = data.get("seed_name") or (self.loaded_data or {}).get("seed_name")
        changes = diff_fields(result.get("before"), data) if result.get("before") is not None else None
        self.log_event("save", id=sid, name=name, result_mode=mode, source_id=source_id if mode == "clone" else None,
                       files=describe_files(result.get("files", []), self.paths.root), json_changes=changes or None,
                       shared_with=result.get("shared_with") or None, preserved_shared_with=result.get("preserved_shared_with") or None,
                       warnings=result.get("warnings") or None, **summary)
        targets = result.get("targets") or {}
        for key, info in summary["slots"].items():
            if info.get("transform"):
                self.tool_log.remember_alignment(sid, name, key, info["transform"], summary["rules"], source=info.get("source"),
                                                 output=targets.get(key) or (data.get(self.api.SLOT_FIELDS[key][0]) if key != "base" else data.get("fullimage")),
                                                 source_size=info.get("source_size"))
        for slot in self.slots.values():
            slot.update(changed=False, removed=False)
        self.face_changed = False
        self.clone_dirty = False
        self.ref_index = None
        self.refresh_library()
        self.load_existing(sid, confirm=False)
        self.status.set("ID %d 저장 완료 · 같은 화면에서 계속 편집할 수 있습니다." % sid)
        return result

    def preview_save(self):
        try:
            result = self.perform_save(dry_run=True)
            base = self.paths.root
            for path in result.get("files", []):
                self.log("  " + os.path.relpath(path, base))
            for note in result.get("warnings") or []:
                self.log("  [주의] " + note)
            self.status.set("미리보기 완료 · 실제 파일은 변경하지 않았습니다.")
            self.log_event("preview", **self.save_summary(), files=[os.path.relpath(p, base).replace("\\", "/") for p in result.get("files", [])])
            return result
        except Exception as exc:
            return self.error("미리보기: " + str(exc))

    def discard_changes(self):
        if not self.discard_allowed():
            return
        if self.mode.get() in ("edit", "clone"):
            self.load_existing(self.edit_id, confirm=False)
        else:
            self.new_character(confirm=False)

    def delete_current(self):
        if self.edit_id is None:
            return
        mode = "safe"
        band, key, first = self.api.band_and_key(self.edit_id)
        try:
            last = int(self.api.read_index(self.paths).get(key, first - 1)) if band else None
        except Exception as exc:
            self.error("삭제 범위를 확인할 수 없습니다: " + str(exc))
            return
        if band and first <= self.edit_id < last:
            answer = messagebox.askyesnocancel("중간 번호 삭제", "중간 번호 ID %d를 삭제합니다.\n\n[예] 번호를 유지하고 이웃 데이터로 빈칸 채우기\n[아니오] 마지막 번호를 이동해 등록 수 줄이기\n[취소] 삭제하지 않기\n\n번호 이동은 기존 세이브에 영향을 줄 수 있습니다." % self.edit_id, parent=self.window)
            if answer is None:
                return
            mode = "safe" if answer else "swap"
        if not messagebox.askyesno("캐릭터 삭제", "ID %d의 캐릭터 데이터와 이미지를 삭제할까요?\n저장하지 않은 변경은 버립니다." % self.edit_id, parent=self.window):
            return
        sid, name = self.edit_id, (self.loaded_data or {}).get("seed_name")
        try:
            users = self.api.shared_image_users(self.paths, sid)
        except Exception:
            users = []
        if users and not messagebox.askyesno("공유 이미지 보존", "이 캐릭터의 이미지를 다른 캐릭터(ID %s)도 쓰고 있습니다.\n공유 PNG는 보존하고 이 캐릭터의 데이터와 단독 이미지만 삭제합니다. 계속할까요?" % ", ".join(str(u) for u in users[:12]), parent=self.window):
            return
        self.log_event("delete_start", id=sid, name=name, mode=mode, shared_with=users or None)
        try:
            self.api.delete_character(self.paths, sid, mode=mode, log=self.log)
        except Exception as exc:
            self.log_event("delete_error", id=sid, name=name, error=str(exc))
            self.error("삭제 실패: " + str(exc))
            return
        self.log_event("delete", id=sid, name=name, mode=mode, shared_with=users or None)
        self.new_character(confirm=False)
        self.refresh_library()

    def close(self):
        if self.discard_allowed():
            self.flush_logs()
            if self.search_job:
                self.window.after_cancel(self.search_job)
            self.log_event("session_end", id=None, name=None, note="도구 종료")
            self.window.destroy()
