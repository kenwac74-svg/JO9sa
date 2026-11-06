# -*- coding: utf-8 -*-
"""
잭오나인테일즈 씬(scene) 이미지 추가 도구
========================================
씬은 캐릭터와 달리 json 등록/인덱스가 필요 없다. 파일 이름만 규칙에 맞춰
해당 폴더에 넣으면 게임이 폴더를 세어 자동 인식한다(picMax).

파일 이름 규칙:
  · 특정 : <행위>_<머리색>_<길이>_<나이>.png     예) bj_black_long_young.png
  · 공용 : <행위>_general_<나이>.png              예) bj_general_young.png  (모든 머리색 공용)
  · 2인  : <행위>_<A조합>~<B조합>.png             예) lesbian_black_long_loli~black_short_young.png
  · 여러 장이면 뒤에 _2, _3 ... 자동 증가

이 파일은 add_character.py 와 같은 폴더(picture_modding)에 둔다.
"""

import os
import re

from PIL import Image

import add_character as core   # 게임 경로 탐지/상수 재사용

HAIR_COLORS = core.HAIR_COLORS
HAIR_LENGTHS = core.HAIR_LENGTHS
AGES = list(core.AGE_INFO.keys())   # loli, young, milf

# 씬 종류(라벨) -> girls 아래 실제 폴더, 표준 크기
SCENE_KINDS = [
    ("일반 (목욕/요리/일상)", "normal_scenes", (795, 596)),
    ("성행위", "sex_scenes", (795, 596)),
    ("고문", "torture_scenes", (800, 600)),
    ("보상", "reward_scenes", (795, 596)),
]
LABEL_TO_FOLDER = {lbl: fol for lbl, fol, _sz in SCENE_KINDS}
FOLDER_TO_SIZE = {fol: sz for _lbl, fol, sz in SCENE_KINDS}

_CAT_RE = re.compile(
    r'_((general|black|blond|blonde|blue|brown|green|pink|purple|red|white)'
    r'(_(long|short))?_(loli|young|milf))')


def scan_acts(paths, folder):
    """폴더의 기존 파일에서 행위(act) 이름 목록을 뽑는다."""
    d = os.path.join(paths.girls_dir, folder)
    if not os.path.isdir(d):
        return []
    acts = set()
    for f in os.listdir(d):
        if not f.lower().endswith(".png"):
            continue
        name = f[:-4].split("~")[0]        # 첫 배우 부분만
        m = _CAT_RE.search("_" + name)
        if not m:
            continue                        # 표준 카테고리(색_길이_나이/general)가 없으면 제외
        act = ("_" + name)[:m.start()].lstrip("_")
        if act:
            acts.add(act)
    return sorted(acts)


def build_category(kind, color, length, age):
    """kind='general' 또는 'specific' -> 카테고리 문자열."""
    if kind == "general":
        return "general_" + age
    return "%s_%s_%s" % (color, length, age)


def scene_next_name(paths, folder, act, cat, cat2=None):
    """겹치지 않는 다음 파일 이름(확장자 제외)을 만든다."""
    d = os.path.join(paths.girls_dir, folder)
    base = act + "_" + cat + (("~" + cat2) if cat2 else "")

    def exists(nm):
        return os.path.exists(os.path.join(d, nm + ".png"))

    if not exists(base):
        return base
    n = 2
    while exists("%s_%d" % (base, n)):
        n += 1
    return "%s_%d" % (base, n)


def add_scene(paths, folder, act, cat, image_path, cat2=None,
              resize=False, log=print):
    """씬 이미지 한 장을 추가한다. 성공 시 최종 파일 이름 반환."""
    if not act:
        raise ValueError("행위(act)를 지정하세요.")
    d = os.path.join(paths.girls_dir, folder)
    os.makedirs(d, exist_ok=True)
    name = scene_next_name(paths, folder, act, cat, cat2)
    out = os.path.join(d, name + ".png")

    img = Image.open(image_path).convert("RGBA")
    if resize:
        size = FOLDER_TO_SIZE.get(folder, (795, 596))
        # 비율 유지: 표준 크기보다 크면 그 안에 들어가도록 축소(찌그러지지 않음)
        if img.width > size[0] or img.height > size[1]:
            img.thumbnail(size, Image.LANCZOS)
    img.save(out)
    log("[OK] 저장: %s/%s.png  (%dx%d)" % (folder, name, *img.size))
    return name


# ---------------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------------

def run_gui():
    import tkinter as tk
    from tkinter import ttk, filedialog, messagebox
    from PIL import ImageTk

    root_dir = core.find_game_root()

    win = tk.Tk()
    win.title("잭오나인 씬 추가 도구")
    win.geometry("640x680")

    state = {"paths": core.GamePaths(root_dir) if root_dir else None,
             "image": None, "previews": {}}

    # 게임 폴더
    top = ttk.Frame(win, padding=8)
    top.pack(fill="x")
    ttk.Label(top, text="게임 폴더:").pack(side="left")
    game_var = tk.StringVar(value=root_dir or "(자동 감지 실패 - 직접 선택)")
    ttk.Label(top, textvariable=game_var, foreground="#0a0").pack(side="left", padx=6)

    def pick_game():
        dd = filedialog.askdirectory(title="game 폴더 선택")
        if dd and core._looks_like_game_root(dd):
            state["paths"] = core.GamePaths(dd)
            game_var.set(dd)
            reload_acts()
        elif dd:
            messagebox.showerror("오류", "올바른 game 폴더가 아닙니다.")
    ttk.Button(top, text="변경", command=pick_game).pack(side="left")

    body = ttk.Frame(win, padding=8)
    body.pack(fill="x")

    # 종류(폴더)
    ttk.Label(body, text="씬 종류").grid(row=0, column=0, sticky="e", pady=3)
    kind_var = tk.StringVar(value=SCENE_KINDS[1][0])   # 기본 성행위
    kind_cb = ttk.Combobox(body, textvariable=kind_var, width=22, state="readonly",
                           values=[k[0] for k in SCENE_KINDS])
    kind_cb.grid(row=0, column=1, sticky="w")

    # 행위(act)
    ttk.Label(body, text="행위(act)").grid(row=1, column=0, sticky="e", pady=3)
    act_var = tk.StringVar()
    act_cb = ttk.Combobox(body, textvariable=act_var, width=28)
    act_cb.grid(row=1, column=1, sticky="w")
    ttk.Label(body, text="(목록에서 고르거나 직접 입력)", foreground="#888").grid(row=1, column=2, sticky="w")

    # 카테고리 종류
    ttk.Label(body, text="카테고리").grid(row=2, column=0, sticky="e", pady=3)
    cat_kind = tk.StringVar(value="general")
    ttk.Radiobutton(body, text="공용(general·모든 머리색)", variable=cat_kind,
                    value="general", command=lambda: refresh()).grid(row=2, column=1, sticky="w")
    ttk.Radiobutton(body, text="특정(머리색 지정)", variable=cat_kind,
                    value="specific", command=lambda: refresh()).grid(row=2, column=2, sticky="w")

    # 나이 / 색 / 길이
    ttk.Label(body, text="나이").grid(row=3, column=0, sticky="e", pady=3)
    age_var = tk.StringVar(value="young")
    ttk.Combobox(body, textvariable=age_var, values=AGES, width=8, state="readonly").grid(row=3, column=1, sticky="w")

    ttk.Label(body, text="머리색 / 길이").grid(row=4, column=0, sticky="e", pady=3)
    color_var = tk.StringVar(value="black")
    length_var = tk.StringVar(value="long")
    color_cb = ttk.Combobox(body, textvariable=color_var, values=HAIR_COLORS, width=8, state="readonly")
    color_cb.grid(row=4, column=1, sticky="w")
    length_cb = ttk.Combobox(body, textvariable=length_var, values=HAIR_LENGTHS, width=8, state="readonly")
    length_cb.grid(row=4, column=2, sticky="w")

    # 2인 조합
    two_var = tk.BooleanVar(value=False)
    ttk.Checkbutton(body, text="2인 조합 (~) 씬", variable=two_var,
                    command=lambda: refresh()).grid(row=5, column=1, sticky="w", pady=(6, 0))
    two_frame = ttk.LabelFrame(body, text="상대 캐릭터 조합", padding=4)
    two_frame.grid(row=6, column=0, columnspan=3, sticky="we", pady=3)
    b_kind = tk.StringVar(value="general")
    b_age = tk.StringVar(value="young")
    b_color = tk.StringVar(value="black")
    b_length = tk.StringVar(value="long")
    ttk.Radiobutton(two_frame, text="공용", variable=b_kind, value="general",
                    command=lambda: refresh()).grid(row=0, column=0)
    ttk.Radiobutton(two_frame, text="특정", variable=b_kind, value="specific",
                    command=lambda: refresh()).grid(row=0, column=1)
    ttk.Label(two_frame, text="나이").grid(row=0, column=2)
    ttk.Combobox(two_frame, textvariable=b_age, values=AGES, width=7, state="readonly").grid(row=0, column=3)
    b_color_cb = ttk.Combobox(two_frame, textvariable=b_color, values=HAIR_COLORS, width=7, state="readonly")
    b_color_cb.grid(row=0, column=4)
    b_length_cb = ttk.Combobox(two_frame, textvariable=b_length, values=HAIR_LENGTHS, width=7, state="readonly")
    b_length_cb.grid(row=0, column=5)

    # 이미지 + 미리보기
    imgrow = ttk.Frame(win, padding=8)
    imgrow.pack(fill="x")
    prev = tk.Label(imgrow, text="이미지\n미리보기", width=26, height=8, relief="solid", bg="#222", fg="#888")
    prev.pack(side="left")
    rightcol = ttk.Frame(imgrow)
    rightcol.pack(side="left", padx=10, fill="x", expand=True)
    img_var = tk.StringVar(value="(선택 안 됨)")
    ttk.Button(rightcol, text="씬 이미지 선택", command=lambda: choose_img()).pack(anchor="w")
    ttk.Label(rightcol, textvariable=img_var, wraplength=320).pack(anchor="w")
    resize_var = tk.BooleanVar(value=True)
    ttk.Checkbutton(rightcol, text="큰 이미지는 표준 크기에 맞게 축소(비율 유지·안 찌그러짐)",
                    variable=resize_var).pack(anchor="w", pady=4)
    name_var = tk.StringVar(value="")
    ttk.Label(rightcol, textvariable=name_var, foreground="#06c", wraplength=320).pack(anchor="w")

    def choose_img():
        p = filedialog.askopenfilename(
            title="씬 이미지 선택",
            filetypes=[("이미지", "*.png *.jpg *.jpeg *.webp *.bmp"), ("모든 파일", "*.*")])
        if not p:
            return
        state["image"] = p
        img_var.set(os.path.basename(p))
        try:
            im = Image.open(p).convert("RGBA")
            im.thumbnail((170, 130), Image.LANCZOS)
            ph = ImageTk.PhotoImage(im)
            state["previews"]["img"] = ph
            prev.config(image=ph, text="")
        except Exception:
            prev.config(image="", text="(미리보기 실패)")
        refresh()

    def cur_folder():
        return LABEL_TO_FOLDER[kind_var.get()]

    def reload_acts(*_):
        p = state["paths"]
        if not p:
            return
        act_cb["values"] = scan_acts(p, cur_folder())
        refresh()

    def compute_name():
        p = state["paths"]
        if not p or not act_var.get().strip():
            return None
        cat = build_category(cat_kind.get(), color_var.get(), length_var.get(), age_var.get())
        cat2 = None
        if two_var.get():
            cat2 = build_category(b_kind.get(), b_color.get(), b_length.get(), b_age.get())
        return cur_folder(), scene_next_name(p, cur_folder(), act_var.get().strip(), cat, cat2)

    def refresh(*_):
        # 특정/공용에 따라 색·길이 활성화
        st = "readonly" if cat_kind.get() == "specific" else "disabled"
        color_cb.config(state=st)
        length_cb.config(state=st)
        bst = ("readonly" if (two_var.get() and b_kind.get() == "specific") else "disabled")
        b_color_cb.config(state=bst)
        b_length_cb.config(state=bst)
        res = compute_name()
        if res:
            name_var.set("저장될 파일:  %s/%s.png" % res)
        else:
            name_var.set("행위(act)와 이미지를 지정하세요")

    for v in (kind_var, act_var, cat_kind, age_var, color_var, length_var,
              two_var, b_kind, b_age, b_color, b_length):
        v.trace_add("write", refresh)
    kind_var.trace_add("write", reload_acts)

    # 실행
    btn = ttk.Frame(win, padding=8)
    btn.pack(fill="x")

    def do_add():
        p = state["paths"]
        if not p:
            messagebox.showerror("오류", "게임 폴더를 먼저 지정하세요.")
            return
        if not state["image"]:
            messagebox.showerror("오류", "씬 이미지를 선택하세요.")
            return
        if not act_var.get().strip():
            messagebox.showerror("오류", "행위(act)를 지정하세요.")
            return
        try:
            cat = build_category(cat_kind.get(), color_var.get(), length_var.get(), age_var.get())
            cat2 = None
            if two_var.get():
                cat2 = build_category(b_kind.get(), b_color.get(), b_length.get(), b_age.get())
            add_scene(p, cur_folder(), act_var.get().strip(), cat, state["image"],
                      cat2=cat2, resize=resize_var.get(), log=log_write)
            state["image"] = None
            img_var.set("(선택 안 됨)")
            prev.config(image="", text="이미지\n미리보기")
            refresh()
        except Exception as e:
            import traceback
            log_write("[!] 오류: %s" % e)
            log_write(traceback.format_exc())
            messagebox.showerror("실패", str(e))

    ttk.Button(btn, text="씬 추가하기", command=do_add).pack(side="left")

    logframe = ttk.LabelFrame(win, text="로그", padding=4)
    logframe.pack(fill="both", expand=True, padx=8, pady=4)
    logbox = tk.Text(logframe, height=10, bg="#111", fg="#ddd")
    logbox.pack(fill="both", expand=True)

    def log_write(msg):
        logbox.insert("end", msg + "\n")
        logbox.see("end")
        win.update_idletasks()

    if root_dir:
        log_write("게임 폴더 자동 감지: %s" % root_dir)
        reload_acts()
    else:
        log_write("게임 폴더를 자동으로 찾지 못했습니다. 상단 '변경'으로 지정하세요.")
    refresh()

    win.mainloop()


if __name__ == "__main__":
    run_gui()
