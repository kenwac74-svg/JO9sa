import http.server,functools,pathlib,json,os
root='G:/somi/JO9_2.4.2_Full_20261113/announcement-assets'
s=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=root))
pathlib.Path('G:/Codex/tmp/full242-packing-20261113/announcement-server.json').write_text(json.dumps({'pid':os.getpid(),'port':s.server_address[1],'root':root}),encoding='utf-8')
s.serve_forever()
