"""JO9 2.4.1 normal-screen save compatibility. No gameplay/CRC execution."""
import argparse, array, collections, hashlib, json, os, pathlib, re, sys, tempfile

def _shift(text, delta):
    data=array.array('H');data.frombytes(text.encode('utf-16-le','surrogatepass'))
    if sys.byteorder!='little':data.byteswap()
    for i in range(len(data)):data[i]=(data[i]+delta)&65535
    if sys.byteorder!='little':data.byteswap()
    return data.tobytes().decode('utf-16-le','surrogatepass')

def decode(s):return _shift(s,5)
def encode(s):return _shift(str(s),-5)

def parse_save(raw):
    if len(raw)>250*1024*1024 or len(raw)%2:raise ValueError('지원하지 않는 저장 파일 크기입니다.')
    try:lines=raw.decode('utf-16-le','surrogatepass').split('\r\n')
    except UnicodeError as e:raise ValueError('저장 파일을 읽을 수 없습니다.') from e
    if len(lines)<21 or lines[:2]!=['QSPSAVEDGAME','5.7.0']:raise ValueError('QSP 5.7.0 형식의 2.4.1 저장 파일이 필요합니다.')
    def number(i,bounded=True):
        if i>=len(lines):raise ValueError('저장 파일이 잘렸습니다.')
        s=decode(lines[i])
        if not re.fullmatch(r'[0-9]+',s):raise ValueError('저장 구조의 개수 값이 올바르지 않습니다.')
        n=int(s)
        if bounded and n>len(lines):raise ValueError('저장 구조의 개수 범위를 벗어났습니다.')
        return n
    text_positions=[6,8,9];p=17
    playlists=number(16);text_positions.extend(range(p,p+playlists));p+=playlists
    includes=number(p);p+=1;text_positions.extend(range(p,p+includes));p+=includes
    actions=number(p);p+=1
    for _ in range(actions):
        text_positions.extend([p,p+1]);p+=2;n=number(p);p+=1
        for __ in range(n):text_positions.append(p);p+=2
        text_positions.extend(range(p,p+4));p+=4
    objects=number(p);p+=1;text_positions.extend(range(p,p+2*objects));p+=objects*2
    start=p;count=number(p);p+=1;variables=[]
    for _ in range(count):
        slot=number(p,False);p+=1
        if p>=len(lines):raise ValueError('변수 이름이 없습니다.')
        name=decode(lines[p]);p+=1
        n=number(p);p+=1;values=[]
        for __ in range(n):
            if p+1>=len(lines):raise ValueError('변수 값이 잘렸습니다.')
            values.append([decode(lines[p]),decode(lines[p+1])]);p+=2
        n=number(p);p+=1;idx=[]
        for __ in range(n):
            k=number(p);p+=1
            if p>=len(lines) or k>=len(values):raise ValueError('배열 인덱스가 올바르지 않습니다.')
            idx.append([k,decode(lines[p])]);p+=1
        variables.append({'slot':slot,'name':name,'values':values,'idx':idx})
    if p!=len(lines)-1 or lines[p]!='':raise ValueError('저장 파일의 끝이 일치하지 않습니다.')
    return {'lines':lines,'start':start,'vars':variables,'text_positions':text_positions}

def serialize_save(doc):
    out=doc['lines'][:doc['start']]+[encode(len(doc['vars']))]
    for v in doc['vars']:
        out.extend([encode(v['slot']),encode(v['name']),encode(len(v['values']))])
        for n,t in v['values']:out.extend([encode(n),encode(t)])
        out.append(encode(len(v['idx'])))
        for n,k in v['idx']:out.extend([encode(n),encode(k)])
    out.append('');return '\r\n'.join(out).encode('utf-16-le','surrogatepass')

def value(doc,name,key=None):
    v=next((v for v in doc['vars'] if v['name'].upper()==name.upper()),None)
    if v is None:return ['0','']
    i=0 if key is None else next((n for n,k in v['idx'] if k.upper()==key.upper()),-1)
    return v['values'][i] if 0<=i<len(v['values']) else ['0','']

def _normal(s):return re.sub(r'/+','/',s.replace('\\','/')).lower()

def migrate(raw,rules):
    doc=parse_save(raw)
    if serialize_save(doc)!=raw:raise ValueError('저장 파일 왕복 보존 검사에 실패했습니다.')
    loc=decode(doc['lines'][10]).lower();place=value(doc,'place')[1].lower()
    combat={'боевой_интерфейс','начать_бой','конец_раунда','атака_игрока','конец_боя','battle_screen','chunhyang_battle','бой','battle','fight'}
    if loc in combat or place in combat:raise ValueError('전투 중 저장은 지원하지 않습니다. 전투를 끝내고 일반 화면에서 다시 저장해 주세요.')
    rev=value(doc,'code_rev')[1]
    if rev and rev not in ('2.4.1','2.4.2'):raise ValueError('이 도구의 지원 대상은 2.4.1 저장 파일입니다.')
    paths={}
    def add(old,new):
        key=_normal(old)
        if key in paths and paths[key]!=new:raise ValueError('충돌하는 경로 변환 규칙입니다.')
        if _normal(new)==key:return
        paths[key]=new
    for r in rules.get('paths',[]):
        add(r['old'],r['new'])
        for prefix in ('content/','content/pic/','content/snd/'):
            if r['old'].lower().startswith(prefix) and r['new'].lower().startswith(prefix):add(r['old'][len(prefix):],r['new'][len(prefix):])
    for old,new in list(paths.items()):
        if _normal(new) in paths:raise ValueError('연속/순환 경로 규칙은 지원하지 않습니다.')
    roots=sorted({p.split('/')[0] for p in paths if '/' in p},key=len,reverse=True)
    token=re.compile(r'(?<![\w./\\:-])(?:'+('|'.join(re.escape(r) for r in roots) or '(?!)')+r')[/\\][^\r\n\"\'<>;{}]*?\.(?:png|jpe?g|gif|webp|bmp|svg|ico|cur|avif|mp3|wav|ogg|json)(?![\w.])',re.I)
    changes=collections.Counter()
    def replace_path(s):
        def resolve(old):
            new=paths.get(_normal(old))
            if new is None:return old
            if '\\' in old and '/' not in old:new=new.replace('/','\\')
            changes[('path',old,new)]+=1;return new
        if _normal(s) in paths:return resolve(s)
        return token.sub(lambda m:resolve(m.group(0)),s)
    for i in doc['text_positions']:doc['lines'][i]=encode(replace_path(decode(doc['lines'][i])))
    for v in doc['vars']:
        for p in v['values']:
            if p[1]:p[1]=replace_path(p[1])
    grouped=collections.defaultdict(list)
    for v in doc['vars']:grouped[v['name'].upper()].append(v)
    byname={k:vv[0] for k,vv in grouped.items() if len(vv)==1}
    for t in doc['vars']:
        if not t['name'].upper().endswith('_TYPE') or not t['values'] or t['name'].upper() not in byname:continue
        role=t['name'][:-5];actor=byname.get(role.upper());rule=rules.get('actors',{}).get(t['values'][0][0])
        if actor is None or not rule or not any(k.upper() in {'ID','STAMINA','BEAUTY'} for _,k in actor['idx']):continue
        names=rule.get('old_names',[]);newname=rule.get('new_name','')
        nv=byname.get((role+'_NAME').upper())
        if nv and nv['values'] and newname and nv['values'][0][1] in names:
            old=nv['values'][0][1];nv['values'][0][1]=newname;changes[('default_name',old,newname)]+=1
        for n,k in actor['idx']:
            p=actor['values'][n]
            if k.upper()=='NAME' and newname and p[1] in names:
                old=p[1];p[1]=newname;changes[('default_name',old,newname)]+=1
            for r in rule.get('fields',{}).get(k.upper(),[]):
                if _normal(p[1])==_normal(r['old']):
                    old=p[1];p[1]=r['new'];changes[('default_image',old,p[1])]+=1;break
    out=serialize_save(doc);again=parse_save(out)
    if serialize_save(again)!=out:raise ValueError('변환 결과를 다시 읽을 수 없습니다.')
    report={'source_sha256':hashlib.sha256(raw).hexdigest(),'output_sha256':hashlib.sha256(out).hexdigest(),'change_count':sum(changes.values()),'changes':[{'kind':k,'old':o,'new':n,'count':v} for (k,o,n),v in changes.items()],'numeric_values_preserved':True,'crc_preserved':True,'source_game_version':rev or 'not recorded','supported_save_format':'5.7.0'}
    return out,report

def convert_file(source,target,rules):
    source=pathlib.Path(source).resolve();target=pathlib.Path(target).resolve()
    if source==target:raise ValueError('원본과 다른 새 파일 이름을 선택해 주세요.')
    if target.exists():raise FileExistsError('이미 있는 출력 파일은 덮어쓰지 않습니다.')
    raw=source.read_bytes();out,report=migrate(raw,rules)
    temporary=None
    try:
        with tempfile.NamedTemporaryFile(mode='wb',prefix=target.name+'.',suffix='.tmp',dir=target.parent,delete=False) as f:
            temporary=pathlib.Path(f.name);f.write(out);f.flush();os.fsync(f.fileno())
        if hashlib.sha256(source.read_bytes()).hexdigest()!=report['source_sha256']:raise ValueError('변환 중 원본이 바뀌었습니다. 게임을 종료하고 다시 시도해 주세요.')
        if os.name=='nt':os.rename(temporary,target)
        else:os.link(temporary,target);temporary.unlink()
        temporary=None
    except Exception:
        if temporary is not None and temporary.exists():temporary.unlink()
        raise
    return report

def _rules_path():
    base=pathlib.Path(getattr(sys,'_MEIPASS',pathlib.Path(__file__).parent))
    return base/'save242-rules.json'

def gui(rules):
    import tkinter as tk
    import threading,queue
    from tkinter import filedialog,messagebox,ttk
    root=tk.Tk();root.title('JO9 2.4.2 세이브 이어하기');root.geometry('690x350')
    src=tk.StringVar();status=tk.StringVar(value='2.4.1에서 전투를 끝내고 일반 화면에서 저장한 파일을 선택해 주세요.');busy=[False]
    def run(job,done):
        if busy[0]:return
        busy[0]=True;status.set('처리 중입니다. 저장 파일 크기에 따라 잠시 걸릴 수 있습니다.');mail=queue.Queue()
        def worker():
            try:mail.put((True,job()))
            except Exception as e:mail.put((False,str(e)))
        def poll():
            try:ok,result=mail.get_nowait()
            except queue.Empty:root.after(100,poll);return
            busy[0]=False
            if ok:done(result)
            else:status.set('중단했습니다. 원본은 변경하지 않았습니다.');messagebox.showerror('처리 중단',result)
        threading.Thread(target=worker,daemon=True).start();root.after(100,poll)
    ttk.Label(root,text='2.4.1 → 2.4.2 저장 이어하기',font=('Malgun Gothic',16,'bold')).pack(pady=(22,12))
    ttk.Label(root,text='원본은 보존합니다. 사용자 작명·육성·장비·진행은 유지합니다.').pack()
    frame=ttk.Frame(root);frame.pack(fill='x',padx=24,pady=22)
    ttk.Entry(frame,textvariable=src,state='readonly').pack(side='left',expand=True,fill='x')
    def pick():
        if busy[0]:return
        p=filedialog.askopenfilename(title='2.4.1 세이브 선택',filetypes=[('JO9 저장 파일','*.sav')])
        if p:src.set(p);status.set('검사를 눌러 변경할 이름과 경로의 수를 확인하세요.')
    ttk.Button(frame,text='세이브 선택',command=pick).pack(side='right',padx=(8,0))
    def inspect():
        try:
            if not src.get():raise ValueError('세이브를 먼저 선택해 주세요.')
            p=pathlib.Path(src.get())
            run(lambda:migrate(p.read_bytes(),rules)[1],lambda r:status.set('검사 완료: 알려진 이름·경로 '+str(r['change_count'])+'곳을 변환합니다. 원본은 변경하지 않았습니다.'))
        except Exception as e:messagebox.showerror('검사 중단',str(e))
    def convert():
        try:
            if busy[0]:return
            if not src.get():raise ValueError('세이브를 먼저 선택해 주세요.')
            p=pathlib.Path(src.get());target=filedialog.asksaveasfilename(title='새 이름으로 저장',initialfile=p.stem+'_242.sav',defaultextension='.sav',filetypes=[('JO9 저장 파일','*.sav')])
            if not target:return
            def done(r):
                status.set('변환 완료. 새 파일을 2.4.2의 game/save에 두고 불러오세요.');messagebox.showinfo('변환 완료','원본은 그대로 보존했습니다.\n새 세이브: '+target+'\n변경: '+str(r['change_count'])+'곳')
            run(lambda:convert_file(p,target,rules),done)
        except Exception as e:messagebox.showerror('변환 중단',str(e))
    buttons=ttk.Frame(root);buttons.pack(pady=6);ttk.Button(buttons,text='검사',command=inspect).pack(side='left',padx=8);ttk.Button(buttons,text='새 파일로 변환',command=convert).pack(side='left',padx=8)
    ttk.Label(root,textvariable=status,wraplength=640,justify='center').pack(pady=18,padx=24)
    def close():
        if busy[0]:messagebox.showinfo('처리 중','저장 파일 처리가 끝난 뒤 종료해 주세요.')
        else:root.destroy()
    root.protocol('WM_DELETE_WINDOW',close);root.mainloop()

def main():
    p=argparse.ArgumentParser();p.add_argument('--input');p.add_argument('--output');p.add_argument('--rules');p.add_argument('--report');args=p.parse_args()
    report_path=None
    def write_report(data):
        if report_path is not None:
            with report_path.open('x',encoding='utf-8') as f:json.dump(data,f,ensure_ascii=False,indent=2);f.write('\n')
    try:
        if args.report:
            candidate=pathlib.Path(args.report).resolve()
            protected=[pathlib.Path(v).resolve() for v in (args.input,args.output,args.rules or _rules_path()) if v]
            if candidate in protected:raise ValueError('보고서는 세이브·출력·규칙 파일과 다른 새 이름을 사용해야 합니다.')
            if candidate.exists():raise FileExistsError('기존 보고서 파일도 덮어쓰지 않습니다. 새 파일 이름을 선택해 주세요.')
            if not candidate.parent.is_dir():raise ValueError('보고서를 저장할 폴더가 없습니다.')
            report_path=candidate
        rules=json.loads(pathlib.Path(args.rules or _rules_path()).read_text('utf-8-sig'))
        if not args.input:gui(rules);return 0
        if args.output:r=convert_file(args.input,args.output,rules)
        else:_,r=migrate(pathlib.Path(args.input).read_bytes(),rules)
        write_report(r)
        if sys.stdout:print(json.dumps({'change_count':r['change_count'],'source_preserved':True},ensure_ascii=False))
        return 0
    except Exception as e:
        try:write_report({'error':str(e)})
        except OSError:pass
        if sys.stderr:print(str(e),file=sys.stderr)
        return 2

if __name__=='__main__':sys.exit(main())
