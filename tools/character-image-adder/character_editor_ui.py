"""One-window character library, full-body crop editor and save workflow."""
import math
import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

from PIL import Image, ImageTk


class CharacterEditor:
    PAGE_SIZE = 24

    def __init__(self, window, backend, game_root=None):
        self.window = window
        self.api = backend
        self.paths = backend.GamePaths(game_root) if game_root else None
        self.mode = tk.StringVar(window, value="new")
        self.edit_id = None
        self.loaded_data = None
        self.full_orig = self.full_path = self.face_path = self.existing_face = None
        self.face_rect = None
        self.full_changed = self.face_changed = False
        self.outfit_paths = {}
        self.library = []
        self.page = 0
        self.images = {}
        self.search_job = None
        self.canvas_geometry = (1.0, 0, 0, 1, 1)
        self.drag_start = self.drag_item = None
        self.build()
        if self.paths:
            self.refresh_library()
        self.update_mode()

    def build(self):
        w = self.window
        w.title("잭오나인 캐릭터 추가 · 통합 편집 · 최종 크기 저장")
        height = min(860, max(640, w.winfo_screenheight() - 90))
        width = min(1200, max(1000, w.winfo_screenwidth() - 70))
        w.geometry("%dx%d" % (width, height))
        w.minsize(min(1000, width), min(690, height))
        w.columnconfigure(0, weight=1)
        w.rowconfigure(2, weight=1)
        top = ttk.Frame(w, padding=(10, 8, 10, 2))
        top.grid(row=0, column=0, sticky="ew")
        top.columnconfigure(1, weight=1)
        ttk.Label(top, text="게임 폴더").grid(row=0, column=0, sticky="w")
        self.game_var = tk.StringVar(value=self.paths.root if self.paths else "먼저 game 폴더를 선택하세요")
        ttk.Label(top, textvariable=self.game_var, foreground="#267144").grid(row=0, column=1, sticky="w", padx=8)
        ttk.Button(top, text="폴더 선택", command=self.pick_game).grid(row=0, column=2)

        bar = ttk.Frame(w, padding=(10, 5))
        bar.grid(row=1, column=0, sticky="ew")
        bar.columnconfigure(5, weight=1)
        ttk.Button(bar, text="＋ 새 캐릭터", command=self.new_character).grid(row=0, column=0, padx=(0, 14))
        ttk.Label(bar, text="기존 ID").grid(row=0, column=1)
        self.id_var = tk.StringVar()
        entry = ttk.Entry(bar, textvariable=self.id_var, width=8)
        entry.grid(row=0, column=2, padx=5)
        entry.bind("<Return>", lambda event: self.load_existing(self.id_var.get()))
        ttk.Button(bar, text="불러오기", command=lambda: self.load_existing(self.id_var.get())).grid(row=0, column=3)
        ttk.Label(bar, text="또는 왼쪽 얼굴을 클릭하세요", foreground="#666").grid(row=0, column=4, padx=12)
        self.target_var = tk.StringVar()
        ttk.Label(bar, textvariable=self.target_var, foreground="#175d96").grid(row=0, column=5, sticky="e")

        body = ttk.Frame(w, padding=(8, 3))
        body.grid(row=2, column=0, sticky="nsew")
        body.columnconfigure(1, weight=1)
        body.rowconfigure(0, weight=1)
        self.build_library(body)
        editor = ttk.Frame(body, padding=(10, 0, 0, 0))
        editor.grid(row=0, column=1, sticky="nsew")
        editor.columnconfigure(0, weight=1)
        editor.rowconfigure(0, weight=1)

        pictures = ttk.LabelFrame(editor, text="전신과 얼굴", padding=8)
        pictures.grid(row=0, column=0, sticky="nsew")
        pictures.columnconfigure(0, weight=1)
        pictures.rowconfigure(1, weight=1)
        tools = ttk.Frame(pictures)
        tools.grid(row=0, column=0, sticky="ew", padx=(0, 10))
        ttk.Button(tools, text="전신 이미지 선택 / 교체", command=self.choose_full).pack(side="left")
        self.full_var = tk.StringVar(value="선택 안 됨")
        ttk.Label(tools, textvariable=self.full_var, foreground="#666").pack(side="left", padx=8)
        self.full_canvas = tk.Canvas(pictures, width=360, height=350, bg="#23272b", highlightthickness=1,
                                     highlightbackground="#67717b", cursor="crosshair")
        self.full_canvas.grid(row=1, column=0, sticky="nsew", padx=(0, 10), pady=5)
        self.full_canvas.bind("<Configure>", lambda event: self.draw_full())
        self.full_canvas.bind("<Button-1>", self.on_press)
        self.full_canvas.bind("<B1-Motion>", self.on_drag)
        self.full_canvas.bind("<ButtonRelease-1>", self.on_release)
        ttk.Label(pictures, text="전신 위에서 얼굴을 정사각형으로 드래그하세요. 다시 드래그하면 위치가 바뀝니다.",
                  foreground="#267144", wraplength=350).grid(row=2, column=0, sticky="w", pady=(0, 2))

        right = ttk.Frame(pictures)
        right.grid(row=0, column=1, rowspan=3, sticky="nsw")
        self.face_source = tk.StringVar(value="full")
        face_modes = ttk.Frame(right)
        face_modes.pack(anchor="w")
        for text, value in [("전신에서 지정", "full"), ("별도 파일", "file"), ("기존 얼굴 유지", "keep")]:
            button = ttk.Radiobutton(face_modes, text=text, value=value, variable=self.face_source,
                                     command=self.change_face_source)
            button.pack(side="left", padx=(0, 7))
            if value == "keep":
                self.keep_face_button = button
        ttk.Button(right, text="별도 얼굴 파일 선택", command=self.choose_face).pack(anchor="w", pady=(7, 2))
        self.face_var = tk.StringVar(value="얼굴 영역을 지정하세요")
        ttk.Label(right, textvariable=self.face_var, wraplength=330, foreground="#666").pack(anchor="w")
        variants = ttk.Frame(right)
        variants.pack(anchor="w", pady=8)
        self.face_labels = {}
        for index, (key, text) in enumerate([("clear", "원본"), ("gray", "흑백"), ("sepia", "세피아")]):
            frame = ttk.Frame(variants)
            frame.grid(row=0, column=index, padx=(0, 10))
            label = tk.Label(frame, bg="#23272b", bd=1, relief="solid")
            label.pack()
            ttk.Label(frame, text=text).pack(pady=2)
            self.face_labels[key] = label

        ttk.Label(right, text="전신과 얼굴을 함께 저장합니다.\n기존 편집에서는 ID·분류·등록 범위를 유지합니다.",
                  foreground="#666", justify="left").pack(anchor="w", pady=10)

        info = ttk.LabelFrame(editor, text="캐릭터 정보", padding=(6, 3))
        info.grid(row=1, column=0, sticky="ew", pady=(6, 0))
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
        for row, values in enumerate(rows):
            for col, (label, var, choices) in enumerate([values[:3], values[3:]]):
                ttk.Label(info, text=label).grid(row=row, column=col * 2, sticky="e", padx=5, pady=2)
                box = ttk.Combobox(info, textvariable=var, values=choices, state="readonly", width=14)
                box.grid(row=row, column=col * 2 + 1, sticky="w", padx=(0, 12))
                if col == 0:
                    self.classification_boxes.append(box)
        self.id_info = tk.StringVar()
        ttk.Label(info, textvariable=self.id_info, foreground="#175d96").grid(row=3, column=0, columnspan=4, sticky="w", pady=3, padx=4)
        for var in [self.color_var, self.length_var, self.age_var]:
            var.trace_add("write", lambda *args: self.update_id_info())

        clothes = ttk.LabelFrame(info, text="복장 · 선택한 항목만 변경", padding=7)
        clothes.grid(row=0, column=4, rowspan=4, sticky="ne", padx=(12, 0))
        self.outfit_vars = {}
        for row, (field, label, sub) in enumerate(self.api.OUTFITS):
            ttk.Label(clothes, text=label, width=5).grid(row=row, column=0, sticky="w")
            ttk.Button(clothes, text="선택", width=5, command=lambda f=field: self.choose_outfit(f)).grid(row=row, column=1, padx=3)
            ttk.Button(clothes, text="지우기", width=5, command=lambda f=field: self.clear_outfit(f)).grid(row=row, column=2, padx=3)
            value = tk.StringVar(value="없음")
            self.outfit_vars[field] = value
            ttk.Label(clothes, textvariable=value, width=12, foreground="#666").grid(row=row, column=3, sticky="w", padx=3)

        options = ttk.Frame(editor, padding=(0, 4))
        options.grid(row=2, column=0, sticky="ew")
        available = self.api.rembg_available()
        self.cutout_var = tk.BooleanVar(value=available)
        self.resize_face_var = tk.BooleanVar(value=True)
        self.register_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(options, text="배경 자동 제거" + ("" if available else " (rembg 미설치)"),
                        variable=self.cutout_var, state="normal" if available else "disabled").grid(row=0, column=0, sticky="w", padx=3)
        ttk.Label(options, text="저장 시 795×596 · 원본 비율 유지").grid(row=0, column=1, sticky="w", padx=8)
        ttk.Checkbutton(options, text="얼굴 표준 크기 (151×150)", variable=self.resize_face_var).grid(row=1, column=0, sticky="w", padx=3)
        self.register_button = ttk.Checkbutton(options, text="새 캐릭터를 랜덤 등장 풀에 등록", variable=self.register_var)
        self.register_button.grid(row=1, column=1, sticky="w", padx=8)

        actions = ttk.Frame(editor, padding=(0, 3))
        actions.grid(row=3, column=0, sticky="ew")
        actions.columnconfigure(3, weight=1)
        self.save_button = ttk.Button(actions, text="캐릭터 추가", command=self.save_current)
        self.save_button.grid(row=0, column=0, padx=(0, 7))
        ttk.Button(actions, text="저장 내용 미리보기", command=self.preview_save).grid(row=0, column=1, padx=(0, 7))
        ttk.Button(actions, text="변경 취소", command=self.discard_changes).grid(row=0, column=2)
        self.delete_button = ttk.Button(actions, text="캐릭터 삭제", command=self.delete_current)
        self.delete_button.grid(row=0, column=4)

        log_frame = ttk.LabelFrame(w, text="작업 로그", padding=4)
        log_frame.grid(row=3, column=0, sticky="ew", padx=8, pady=(2, 5))
        self.logbox = tk.Text(log_frame, height=3, bg="#20262c", fg="#e6edf3", wrap="word", relief="flat")
        self.logbox.pack(fill="both", expand=True)
        self.status = tk.StringVar(value="게임 폴더를 선택한 뒤 새 이미지를 넣거나 왼쪽 목록에서 기존 캐릭터를 고르세요.")
        ttk.Label(w, textvariable=self.status, padding=(10, 2)).grid(row=4, column=0, sticky="ew")
        w.protocol("WM_DELETE_WINDOW", self.close)
        self.refresh_face_preview()

    def build_library(self, parent):
        frame = ttk.LabelFrame(parent, text="기존 캐릭터 · 클릭해서 편집", padding=6)
        frame.grid(row=0, column=0, sticky="nsew")
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(4, weight=1)
        self.search_var = tk.StringVar()
        search = ttk.Entry(frame, textvariable=self.search_var, width=27)
        search.grid(row=0, column=0, columnspan=2, sticky="ew", pady=3)
        ttk.Label(frame, text="ID · 이름 · 파일명 검색", foreground="#666").grid(row=1, column=0, columnspan=2, sticky="w")
        filters = ttk.Frame(frame)
        filters.grid(row=2, column=0, columnspan=2, sticky="ew", pady=5)
        self.filter_age = tk.StringVar(value="전체")
        self.filter_color = tk.StringVar(value="전체")
        for col, (var, values) in enumerate([(self.filter_age, ["전체"] + list(self.api.AGE_INFO)),
                                            (self.filter_color, ["전체"] + self.api.HAIR_COLORS)]):
            ttk.Combobox(filters, textvariable=var, values=values, state="readonly", width=10).grid(row=0, column=col, padx=2)
            var.trace_add("write", self.queue_search)
        self.library_count = tk.StringVar(value="게임 폴더를 선택하세요")
        ttk.Label(frame, textvariable=self.library_count, foreground="#175d96").grid(row=3, column=0, columnspan=2, sticky="w", pady=3)
        self.library_canvas = tk.Canvas(frame, bg="#e7eaee", highlightthickness=0, width=228)
        self.library_canvas.grid(row=4, column=0, sticky="nsew")
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=self.library_canvas.yview)
        scrollbar.grid(row=4, column=1, sticky="ns")
        self.library_canvas.configure(yscrollcommand=scrollbar.set)
        self.library_inner = ttk.Frame(self.library_canvas)
        self.library_canvas.create_window((0, 0), window=self.library_inner, anchor="nw")
        self.library_inner.bind("<Configure>", lambda event: self.library_canvas.configure(scrollregion=self.library_canvas.bbox("all")))
        self.library_canvas.bind("<MouseWheel>", self.scroll_library)
        pager = ttk.Frame(frame)
        pager.grid(row=5, column=0, columnspan=2, sticky="ew", pady=(6, 0))
        ttk.Button(pager, text="◀", width=4, command=lambda: self.move_page(-1)).pack(side="left")
        ttk.Button(pager, text="새로고침", command=self.refresh_library).pack(side="left", padx=6)
        ttk.Button(pager, text="▶", width=4, command=lambda: self.move_page(1)).pack(side="right")
        self.search_var.trace_add("write", self.queue_search)

    def log(self, text):
        self.logbox.insert("end", str(text) + "\n")
        self.logbox.see("end")
        self.window.update_idletasks()

    def error(self, text):
        self.status.set(str(text))
        self.log("[!] " + str(text))
        messagebox.showerror("확인", str(text), parent=self.window)
        return False

    def dirty(self):
        if self.full_changed or self.face_changed or self.outfit_paths:
            return True
        return bool(self.loaded_data and self.changed_attributes())

    def discard_allowed(self):
        return not self.dirty() or messagebox.askyesno("저장하지 않은 변경", "저장하지 않은 변경을 버리고 계속할까요?", parent=self.window)

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
            self.page = 0
            self.render_library()
        except Exception as exc:
            self.error("캐릭터 목록을 읽을 수 없습니다: " + str(exc))

    def filtered_library(self):
        words = self.search_var.get().lower().split()
        age, color = self.filter_age.get(), self.filter_color.get()
        return [item for item in self.library
                if (age == "전체" or item["age"] == age)
                and (color == "전체" or item["color"] == color)
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
                image.thumbnail((74, 74), Image.LANCZOS)
                tile = Image.new("RGBA", (76, 76), (215, 220, 226, 255))
                tile.alpha_composite(image, ((76 - image.width) // 2, (76 - image.height) // 2))
            except Exception:
                tile = Image.new("RGBA", (76, 76), (160, 169, 180, 255))
            photo = ImageTk.PhotoImage(tile)
            self.images["library"].append(photo)
            name = item.get("name") or item["base"]
            label = "%d · %s" % (item["id"], name[:11])
            button = tk.Button(self.library_inner, image=photo, text=label, compound="top", width=103, height=103,
                               bg="#dbe8f5" if self.edit_id == item["id"] else "#f5f6f8", relief="flat", bd=1,
                               command=lambda sid=item["id"]: self.load_existing(sid))
            button.grid(row=i // 2, column=i % 2, padx=3, pady=3)
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

    def reset_images(self):
        self.full_orig = self.full_path = self.face_path = self.existing_face = None
        self.face_rect = None
        self.full_changed = self.face_changed = False
        self.outfit_paths.clear()
        self.full_var.set("선택 안 됨")
        self.face_source.set("full")
        for value in self.outfit_vars.values():
            value.set("없음")
        self.draw_full()
        self.refresh_face_preview()

    def new_character(self, confirm=True):
        if confirm and not self.discard_allowed():
            return False
        self.mode.set("new")
        self.edit_id = self.loaded_data = None
        self.id_var.set("")
        self.reset_images()
        for var, choices, default in [(self.color_var, self.api.HAIR_COLORS, "black"),
                                      (self.length_var, self.api.HAIR_LENGTHS, "long"),
                                      (self.age_var, self.api.AGE_INFO, "loli"),
                                      (self.boobs_var, self.api.BOOBS_SIZES, "3"),
                                      (self.boobsimg_var, self.api.BOOBS_IMGS, "boobs_D"),
                                      (self.pussy_var, self.api.PUSSY_IMGS, "pussy_l1")]:
            if var.get() not in choices:
                var.set(default)
        self.update_mode()
        self.status.set("신규 추가 · 전신을 선택하고 얼굴 영역을 지정하세요.")
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
        self.mode.set("edit")
        self.edit_id, self.loaded_data = sid, data
        self.reset_images()
        self.id_var.set(str(sid))
        self.loaded_json = filename
        try:
            self.full_orig = self.api._load_rgba(self.api._abs_from_gamepath(self.paths.root, data.get("fullimage", "")))
            self.full_var.set("현재 전신 · 교체할 수 있음")
        except Exception:
            self.full_var.set("기존 전신 없음 · 새 이미지를 선택하세요")
        try:
            reference = data.get("seed_ava_clear") or "content/pic/girls/face/" + self.api.slave_base_name(data)
            self.existing_face = self.api._load_rgba(self.api._abs_from_gamepath(self.paths.root, reference))
        except Exception:
            self.existing_face = None
        self.face_source.set("keep")
        for field, value in [("seed_boobs", self.boobs_var), ("seed_boobs_img", self.boobsimg_var), ("seed_pussy_img", self.pussy_var)]:
            value.set(str(data.get(field, "")))
        match = next((item for item in self.library if item["id"] == sid), {})
        self.color_var.set(match.get("color") or "고유 이미지")
        self.length_var.set(match.get("length") or "고유 이미지")
        self.age_var.set(match.get("age") or "고유 캐릭터")
        self.refresh_outfits()
        self.update_mode()
        self.draw_full()
        self.refresh_face_preview()
        self.status.set("ID %d 편집 · 전신을 교체한 뒤 얼굴 영역을 지정하고 저장하세요." % sid)
        self.log("불러옴: %s · %s" % (os.path.basename(filename), data.get("seed_name", self.api.slave_base_name(data))))
        return True

    def update_mode(self):
        editing = self.mode.get() == "edit"
        self.save_button.configure(text="ID %d 변경사항 저장" % self.edit_id if editing else "캐릭터 추가")
        self.delete_button.configure(state="normal" if editing else "disabled")
        self.register_button.configure(state="disabled" if editing else "normal")
        self.keep_face_button.configure(state="normal" if editing else "disabled")
        for box in self.classification_boxes:
            box.configure(state="disabled" if editing else "readonly")
        self.target_var.set("편집 중: ID %d · %s" % (self.edit_id, self.loaded_data.get("seed_name", "")) if editing else "새 캐릭터 추가 모드")
        self.update_id_info()

    def update_id_info(self):
        if not hasattr(self, "id_info"):
            return
        if self.mode.get() == "edit" and self.loaded_data:
            self.id_info.set("ID·파일명 유지: " + os.path.basename(getattr(self, "loaded_json", "")))
        elif not self.paths:
            self.id_info.set("게임 폴더를 먼저 선택하세요.")
        else:
            try:
                sid, prefix, base, category = self.api.plan_add(self.paths, self.age_var.get(), self.color_var.get(), self.length_var.get())
                self.id_info.set("새 ID %d → %s.png" % (sid, base))
            except Exception as exc:
                self.id_info.set("추가 번호 확인: " + str(exc))

    def pick_image(self, title):
        return filedialog.askopenfilename(title=title, parent=self.window,
                    filetypes=[("이미지", "*.png *.jpg *.jpeg *.webp *.bmp"), ("모든 파일", "*.*")])

    def choose_full(self):
        path = self.pick_image("새 전신 이미지 선택")
        if path:
            try:
                self.set_full_image(path)
            except Exception as exc:
                self.error("이미지를 열 수 없습니다: " + str(exc))

    def set_full_image(self, path):
        image = self.api._load_rgba(path)
        self.full_orig, self.full_path = image, path
        self.full_changed = True
        self.face_changed = True
        self.face_rect = self.face_path = None
        self.face_source.set("full")
        self.full_var.set(os.path.basename(path)[:34])
        self.draw_full()
        self.refresh_face_preview()
        self.status.set("원본 크기·구도로 얼굴을 지정하세요 · 저장 직전에만 전체를 795×596으로 맞춥니다.")

    def choose_face(self):
        path = self.pick_image("별도 얼굴 이미지 선택")
        if not path:
            return
        try:
            self.api._load_rgba(path)
        except Exception as exc:
            self.error("얼굴 이미지를 열 수 없습니다: " + str(exc))
            return
        self.face_path = path
        self.face_source.set("file")
        self.face_changed = True
        self.refresh_face_preview()

    def change_face_source(self):
        self.face_changed = self.face_source.get() != "keep"
        self.refresh_face_preview()

    def choose_outfit(self, field):
        path = self.pick_image(self.api.OUTFIT_LABELS[field] + " 복장 선택")
        if not path:
            return
        try:
            self.api._load_rgba(path)
        except Exception as exc:
            self.error("복장 이미지를 열 수 없습니다: " + str(exc))
            return
        self.outfit_paths[field] = path
        self.refresh_outfits()

    def clear_outfit(self, field):
        if self.mode.get() == "edit" and self.loaded_data.get(field):
            if self.outfit_paths.get(field) is None and field in self.outfit_paths:
                self.outfit_paths.pop(field)
            else:
                self.outfit_paths[field] = None
        else:
            self.outfit_paths.pop(field, None)
        self.refresh_outfits()

    def refresh_outfits(self):
        for field, value in self.outfit_vars.items():
            if field in self.outfit_paths:
                source = self.outfit_paths[field]
                value.set("삭제 예정 · 다시 눌러 취소" if source is None else "교체: " + os.path.basename(source)[:12])
            else:
                value.set("기존 복장 유지" if self.loaded_data and self.loaded_data.get(field) else "없음")

    def draw_full(self):
        if not hasattr(self, "full_canvas"):
            return
        canvas = self.full_canvas
        canvas.delete("all")
        self.drag_item = None
        if self.full_orig is None:
            canvas.create_text(max(1, canvas.winfo_width()) // 2, max(1, canvas.winfo_height()) // 2,
                               text="전신 이미지 선택\n또는 왼쪽 캐릭터 불러오기", fill="#c8d3dd", justify="center")
            return
        cw = max(120, canvas.winfo_width())
        ch = max(120, canvas.winfo_height())
        width, height = self.full_orig.size
        scale = min(cw / width, ch / height)
        dw, dh = max(1, int(width * scale)), max(1, int(height * scale))
        image = self.full_orig.resize((dw, dh), Image.LANCZOS)
        photo = ImageTk.PhotoImage(image)
        self.images["full"] = photo
        ox, oy = (cw - dw) // 2, (ch - dh) // 2
        self.canvas_geometry = (scale, ox, oy, dw, dh)
        canvas.create_image(ox, oy, anchor="nw", image=photo)
        if self.face_rect:
            x0, y0, x1, y1 = self.face_rect
            self.drag_item = canvas.create_rectangle(ox + x0 * scale, oy + y0 * scale,
                                ox + x1 * scale, oy + y1 * scale, outline="#5bf699", width=2)

    def clamp_point(self, x, y):
        scale, ox, oy, dw, dh = self.canvas_geometry
        return max(ox, min(ox + dw, x)), max(oy, min(oy + dh, y))

    def on_press(self, event):
        if self.full_orig is None:
            return
        self.face_source.set("full")
        self.drag_start = self.clamp_point(event.x, event.y)
        self.face_rect = None
        if self.drag_item:
            self.full_canvas.delete(self.drag_item)
        x, y = self.drag_start
        self.drag_item = self.full_canvas.create_rectangle(x, y, x, y, outline="#5bf699", width=2)

    def on_drag(self, event):
        if self.drag_start is None or self.drag_item is None:
            return
        sx, sy = self.drag_start
        mx, my = self.clamp_point(event.x, event.y)
        dx, dy = mx - sx, my - sy
        size = max(abs(dx), abs(dy))
        ex, ey = self.clamp_point(sx + (size if dx >= 0 else -size), sy + (size if dy >= 0 else -size))
        size = min(abs(ex - sx), abs(ey - sy))
        ex, ey = sx + (size if dx >= 0 else -size), sy + (size if dy >= 0 else -size)
        self.full_canvas.coords(self.drag_item, sx, sy, ex, ey)

    def on_release(self, event):
        if self.drag_start is None or self.drag_item is None:
            return
        self.on_drag(event)
        x0, y0, x1, y1 = self.full_canvas.coords(self.drag_item)
        self.drag_start = None
        if abs(x1 - x0) < 5 or abs(y1 - y0) < 5:
            self.refresh_face_preview()
            return
        scale, ox, oy, dw, dh = self.canvas_geometry
        box = (int((min(x0, x1) - ox) / scale), int((min(y0, y1) - oy) / scale),
               int((max(x0, x1) - ox) / scale), int((max(y0, y1) - oy) / scale))
        self.set_face_selection(box)

    def set_face_selection(self, box):
        if self.full_orig is None:
            raise ValueError("전신 이미지가 없습니다.")
        x0, y0, x1, y1 = map(int, box)
        if not (0 <= x0 < x1 <= self.full_orig.width and 0 <= y0 < y1 <= self.full_orig.height):
            raise ValueError("얼굴 영역을 이미지 안에 지정하세요.")
        self.face_rect = (x0, y0, x1, y1)
        self.face_source.set("full")
        self.face_changed = True
        self.draw_full()
        self.refresh_face_preview()
        self.status.set("얼굴 영역 지정됨 · 원본/흑백/세피아를 확인하고 저장하세요.")

    def get_face_crop(self):
        source = self.face_source.get()
        if source == "full":
            return self.full_orig.crop(self.face_rect).convert("RGBA") if self.full_orig is not None and self.face_rect else None
        if source == "file":
            return self.api._load_rgba(self.face_path) if self.face_path else None
        return self.existing_face.copy() if self.existing_face is not None else None

    def refresh_face_preview(self):
        if not hasattr(self, "face_labels"):
            return
        crop = self.get_face_crop()
        if self.face_source.get() == "keep":
            self.face_var.set("현재 얼굴을 유지합니다.")
        elif self.face_source.get() == "file":
            self.face_var.set(os.path.basename(self.face_path) if self.face_path else "얼굴 파일을 선택하세요.")
        else:
            self.face_var.set("얼굴 영역 지정 완료" if crop is not None else "전신에서 얼굴 영역을 드래그하세요.")
        if crop is None:
            previews = {key: Image.new("RGBA", (92, 92), (35, 39, 43, 255)) for key in self.face_labels}
        else:
            if self.resize_face_var.get() and crop.size != self.api.FACE_SIZE:
                crop = crop.resize(self.api.FACE_SIZE, Image.LANCZOS)
            # Render each variant at a fixed preview size; saved dimensions follow the option.
            previews = {"clear": crop, "gray": self.api.to_grayscale(crop), "sepia": self.api.to_sepia(crop)}
        for key, image in previews.items():
            image = image.copy()
            image.thumbnail((92, 92), Image.LANCZOS)
            tile = Image.new("RGBA", (92, 92), (35, 39, 43, 255))
            tile.alpha_composite(image, ((92 - image.width) // 2, (92 - image.height) // 2))
            photo = ImageTk.PhotoImage(tile)
            self.images["face_" + key] = photo
            self.face_labels[key].configure(image=photo)

    def changed_attributes(self):
        current = {"seed_boobs": self.boobs_var.get(), "seed_boobs_img": self.boobsimg_var.get(), "seed_pussy_img": self.pussy_var.get()}
        return {field: value for field, value in current.items() if str((self.loaded_data or {}).get(field, "")) != value}

    def perform_save(self, dry_run=False):
        if not self.paths:
            raise ValueError("게임 폴더를 먼저 선택하세요.")
        crop = self.get_face_crop()
        if self.mode.get() == "new":
            if not self.full_path:
                raise ValueError("전신 이미지를 선택하세요.")
            if crop is None:
                raise ValueError("전신에서 얼굴 영역을 지정하거나 별도 얼굴 파일을 선택하세요.")
            return self.api.add_character(self.paths, self.full_orig, None,
                        self.color_var.get(), self.length_var.get(), self.age_var.get(),
                        self.boobs_var.get(), self.boobsimg_var.get(), self.pussy_var.get(),
                        resize_full=True, resize_face=self.resize_face_var.get(),
                        register_pool=self.register_var.get(), auto_cutout=self.cutout_var.get(),
                        face_image=crop, outfits={k: v for k, v in self.outfit_paths.items() if v},
                        log=self.log, dry_run=dry_run)
        if (self.face_changed or (self.full_changed and self.face_source.get() != "keep")) and crop is None:
            raise ValueError("새 전신의 얼굴 영역을 지정한 뒤 저장하세요.")
        return self.api.save_existing_character(self.paths, self.edit_id,
                    full_path=self.full_orig if self.full_changed else None,
                    face_image=crop if self.face_changed else None,
                    attributes=self.changed_attributes(), outfits=dict(self.outfit_paths),
                    resize_full=True, resize_face=self.resize_face_var.get(),
                    auto_cutout=self.cutout_var.get(), log=self.log, dry_run=dry_run)

    def save_current(self):
        try:
            result = self.perform_save()
        except Exception as exc:
            return self.error("저장하지 못했습니다: " + str(exc))
        sid = result["id"]
        self.full_changed = self.face_changed = False
        self.outfit_paths.clear()
        self.refresh_library()
        self.load_existing(sid, confirm=False)
        self.status.set("ID %d 저장 완료 · 같은 화면에서 계속 편집할 수 있습니다." % sid)
        return result

    def preview_save(self):
        try:
            result = self.perform_save(dry_run=True)
            if self.mode.get() == "edit":
                for path in result["files"]:
                    self.log("  " + os.path.relpath(path, self.paths.root))
            self.status.set("미리보기 완료 · 실제 파일은 변경하지 않았습니다.")
            return result
        except Exception as exc:
            return self.error("미리보기: " + str(exc))

    def discard_changes(self):
        if not self.discard_allowed():
            return
        if self.mode.get() == "edit":
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
        try:
            self.api.delete_character(self.paths, self.edit_id, mode=mode, log=self.log)
        except Exception as exc:
            self.error("삭제 실패: " + str(exc))
            return
        self.new_character(confirm=False)
        self.refresh_library()

    def close(self):
        if self.discard_allowed():
            if self.search_job:
                self.window.after_cancel(self.search_job)
            self.window.destroy()
