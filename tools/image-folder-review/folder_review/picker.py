"""A native folder picker isolated from the web-server threads."""

import json
import subprocess
import sys


def pick_folder(initial: str | None = None) -> dict:
    command = [sys.executable, '-X', 'utf8', '-m', 'folder_review.picker', initial or '']
    result = subprocess.run(command, capture_output=True, text=True, encoding='utf-8',
                            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    if result.returncode:
        raise RuntimeError('폴더 선택창을 열지 못했습니다. 경로를 직접 입력할 수 있습니다. ' + result.stderr.strip())
    return json.loads(result.stdout)


def main():
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    try:
        path = filedialog.askdirectory(parent=root, title='이미지 폴더 선택',
                                        initialdir=sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else None,
                                        mustexist=True)
        print(json.dumps({'cancelled': not bool(path), 'path': path or None, 'error': None}, ensure_ascii=False))
    finally:
        root.destroy()


if __name__ == '__main__':
    main()
