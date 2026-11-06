"""Launch either image tool with visible startup diagnostics."""
import faulthandler
import os
from pathlib import Path
import runpy
import sys
import traceback


class StartupOutput:
    def __init__(self, console, log):
        self.console = console
        self.log = log

    def write(self, text):
        if self.console:
            self.console.write(text)
            self.console.flush()
        self.log.write(text)
        self.log.flush()

    def flush(self):
        if self.console:
            self.console.flush()
        self.log.flush()


def main():
    folder = Path(__file__).resolve().parent
    target = sys.argv[1] if len(sys.argv) > 1 else "add_character.py"
    if target not in ("add_character.py", "add_scene.py"):
        print("Unknown tool.", flush=True)
        return 1
    log_path = folder / "startup.log"
    try:
        log = log_path.open("w", encoding="utf-8")
    except OSError:
        print("Could not write startup.log. Diagnostics will appear here.", flush=True)
        log = None
    stdout, stderr = sys.stdout, sys.stderr
    try:
        if log:
            sys.stdout = StartupOutput(stdout, log)
            sys.stderr = StartupOutput(stderr, log)
            faulthandler.enable(file=log)
        print("[1/4] Python: " + sys.executable, flush=True)
        print("Tool folder: " + str(folder), flush=True)
        print("[2/4] Checking Pillow...", flush=True)
        import PIL.Image
        print("[3/4] Checking Tkinter...", flush=True)
        import tkinter
        import PIL.ImageTk
        print("[4/4] Opening " + target + "...", flush=True)
        script = folder / target
        if not script.is_file():
            raise FileNotFoundError(str(script))
        if target == "add_character.py" and not (folder / "character_editor_ui.py").is_file():
            raise FileNotFoundError("character_editor_ui.py must be in the same folder.")
        os.chdir(folder)
        sys.path.insert(0, str(folder))
        sys.argv = [str(script)]
        runpy.run_path(str(script), run_name="__main__")
        return 0
    except Exception:
        traceback.print_exc()
        print("\nStartup failed. Send startup.log or the text above.", flush=True)
        return 1
    finally:
        if log:
            faulthandler.disable()
            sys.stdout, sys.stderr = stdout, stderr
            log.close()


if __name__ == "__main__":
    raise SystemExit(main())
