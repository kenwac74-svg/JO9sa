"""Read-only static preview for the design mockup. No game/file editing API."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

root = Path(__file__).resolve().parent
server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
print(f"http://127.0.0.1:{server.server_port}/", flush=True)
server.serve_forever()
