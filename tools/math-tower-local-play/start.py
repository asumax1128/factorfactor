"""Private LAN mock play server. All game files require a runtime login code.
No cloud services, production Firebase, third-party packages or public tunnel.
"""
import argparse,html,http.server,json,secrets,socket,threading,time,urllib.parse
from http.cookies import SimpleCookie
from pathlib import Path
BASE=Path(__file__).resolve().parent/'site'
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(BASE),**kwargs)
    def log_message(self,*args):pass # Never log login codes or cookies.
    def authenticated(self):
        c=SimpleCookie()
        try:c.load(self.headers.get('Cookie',''))
        except Exception:return False
        return 'tower_session' in c and secrets.compare_digest(c['tower_session'].value,self.server.session)
    def reply(self,status,body,ctype='text/html; charset=utf-8',cookie=None):
        self.send_response(status);self.send_header('Content-Type',ctype);self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Referrer-Policy','same-origin')
        if cookie:self.send_header('Set-Cookie',cookie)
        self.end_headers();self.wfile.write(body.encode())
    def login(self, status=200):
        self.reply(status,'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>数学の塔 ローカル試遊</title><h1>ローカル試遊の入室</h1><p>PCの起動画面に表示された入室コードを入力してください。本番の先生パスワードではありません。</p><form method="post" action="/login"><input name="code" type="password" autocomplete="off" required><button>入室</button></form>')
    def do_GET(self):
        if not self.authenticated():return self.login(200 if self.path == "/" else 401)
        if urllib.parse.urlsplit(self.path).path=='/health':return self.reply(200,'{"mode":"local-mock"}','application/json')
        p=urllib.parse.urlsplit(self.path).path
        target=(BASE/urllib.parse.unquote(p).lstrip('/')).resolve()
        if not target.is_relative_to(BASE.resolve()):return self.reply(403,'Forbidden')
        if p=='/':self.path='/index.html'
        elif target.is_dir():return self.reply(403,'Directory listing disabled')
        return super().do_GET()
    def do_HEAD(self):
        if not self.authenticated():self.send_response(401);self.end_headers();return
        self.send_response(405);self.end_headers()
    def end_headers(self):
        self.send_header('Cache-Control','no-store');super().end_headers()
    def do_POST(self):
        if self.path!='/login':return self.reply(404,'Not found')
        # Avoid a website on another origin submitting/guessing the LAN login.
        origin=self.headers.get('Origin')
        if origin and origin!='http://'+self.headers.get('Host',''):return self.reply(403,'Origin rejected')
        try:size=int(self.headers.get('Content-Length','0'))
        except ValueError:return self.reply(400,'Invalid length')
        if size<0 or size>256:return self.reply(413,'Too large')
        code=urllib.parse.parse_qs(self.rfile.read(size).decode()).get('code',[''])[0]
        if not secrets.compare_digest(code,self.server.code):time.sleep(.3);return self.login(401)
        self.send_response(303);self.send_header('Location','/');self.send_header('Set-Cookie','tower_session='+self.server.session+'; HttpOnly; SameSite=Strict; Path=/');self.end_headers()
def create_server(host,port):
    s=http.server.ThreadingHTTPServer((host,port),Handler);s.code=secrets.token_urlsafe(18);s.session=secrets.token_urlsafe(32);return s
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--lan',action='store_true');p.add_argument('--port',type=int,default=8765);a=p.parse_args()
    server=create_server('0.0.0.0' if a.lan else '127.0.0.1',a.port)
    print('PC: http://127.0.0.1:'+str(a.port),flush=True)
    if a.lan:
        print('iPhone: PCのWi-Fi IPv4アドレスを使い http://PCのIP:'+str(a.port)+' を開いてください。',flush=True)
        print('信頼できる同一Wi-Fi内のみ。ルーターのポート転送や公開トンネルを設定しないでください。',flush=True)
    print('入室コード（本番パスワードではありません）: '+server.code,flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
