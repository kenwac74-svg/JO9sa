const fs=require('fs'),http=require('http'),path=require('path');
const game='C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game';
const css=fs.readFileSync(path.join(game,'css/base.css'),'utf8').replace(/url\([^)]*\)/g,'none');
const fonts=fs.readdirSync(path.join(game,'fonts')).filter(x=>/\.(ttf|otf)$/i.test(x));
const faces=fonts.map(f=>`@font-face{font-family:"${f.replace(/\.(ttf|otf)$/i,'')}";src:url('/font/${encodeURIComponent(f)}')}`).join('\n');
const ids=[...new Set([...css.matchAll(/#([\w-]*(?:text|script)[\w-]*)/g)].map(x=>x[1]))];
const html=`<!doctype html><meta charset="utf-8"><title>JO9 텍스트 크기 측정</title><style>${faces}\n${css}</style><main id="report"></main><script>
const ids=${JSON.stringify(ids)},out=[],sample='사냥꾼이 사냥 시작을 선언했다. 그의 조수가 참가자들에게 또 다른 이야기를 들려주었다. 사람들은 서로를 바라보며 고개를 끄덕였다. 마침내 새로운 여정이 시작되었다. ';
function measure(id,parent){
 const p=document.createElement('div');if(parent)p.id=parent;document.body.append(p);const el=document.createElement('div');el.id=id;p.append(el);let c=getComputedStyle(el),r=el.getBoundingClientRect(),padX=parseFloat(c.paddingLeft)+parseFloat(c.paddingRight),padY=parseFloat(c.paddingTop)+parseFloat(c.paddingBottom),borderX=parseFloat(c.borderLeftWidth)+parseFloat(c.borderRightWidth),borderY=parseFloat(c.borderTopWidth)+parseFloat(c.borderBottomWidth);
 const w=r.width-padX-borderX,h=Math.min(r.height,800-r.top)-padY-borderY;
 if(w<=0||h<=0||c.width==='auto'||c.height==='auto'){p.remove();return;}
 const m={selector:(parent?'#'+parent+' ':'')+'#'+id,width:w,height:h,font:c.fontFamily,size:parseFloat(c.fontSize),lineHeight:c.lineHeight,letterSpacing:c.letterSpacing};
 const probe=document.createElement('div');probe.style.cssText='position:absolute;left:0;top:0;margin:0;padding:0;border:0;'+['font-family','font-size','font-weight','font-style','line-height','letter-spacing','word-break','white-space'].map(k=>k+':'+c.getPropertyValue(k)).join(';')+';width:'+w+'px;height:auto;';document.body.append(probe);
 function capacity(text){let lo=0,hi=text.length;while(lo<hi){const mid=Math.ceil((lo+hi)/2);probe.textContent=text.slice(0,mid);if(probe.getBoundingClientRect().height<=h+0.01)lo=mid;else hi=mid-1;}return lo;}
 probe.textContent='가';m.actualLineHeight=probe.getBoundingClientRect().height;m.lines=Math.floor(h/m.actualLineHeight);m.hangulCapacity=capacity('가'.repeat(10000));m.sampleCapacity=capacity(sample.repeat(100));probe.remove();p.remove();out.push(m);
}
Promise.all([...document.fonts].map(f=>f.load())).then(()=>document.fonts.ready).then(()=>{for(const id of ids)measure(id);measure('text','snk_private_room');document.getElementById('report').style.cssText='position:relative;background:white;color:black;font:14px monospace;white-space:pre-wrap';document.getElementById('report').textContent=JSON.stringify(out,null,2);document.title='JO9 텍스트 측정 완료 · '+out.length+'개';});
</script>`;
http.createServer((req,res)=>{if(req.url.startsWith('/font/')){const name=decodeURIComponent(req.url.slice(6));if(!fonts.includes(name)){res.writeHead(404);return res.end();}res.setHeader('Content-Type','font/ttf');return res.end(fs.readFileSync(path.join(game,'fonts',name)));}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);}).listen(3815,'127.0.0.1',()=>console.log('http://127.0.0.1:3815/'));
