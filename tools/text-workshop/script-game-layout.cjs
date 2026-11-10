'use strict';
// JO9 MOD SCRIPT_GAME_LAYOUT_20261110: read installed layout resources, never write them.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),core=require('./core.cjs');
const selectors={dialogue:'#text',paper:'#bg_blue_script'};
const readText=file=>{const bytes=fs.readFileSync(file);return bytes[0]===255&&bytes[1]===254?bytes.subarray(2).toString('utf16le'):bytes.toString('utf8').replace(/^\uFEFF/,'');};
function style(game,id){
 if(!selectors[id])throw Error('지원하지 않는 UI 프로필입니다.');
 const css=readText(path.join(game,'css/base.css')).replace(/\/\*[\s\S]*?\*\//g,''),out={};
 for(const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))if(m[1].split(',').some(s=>s.trim()===selectors[id]))for(const d of m[2].split(';')){const at=d.indexOf(':');if(at>0)out[d.slice(0,at).trim()]=d.slice(at+1).trim().replace(/\s*!important\s*$/i,'');}
 return out;
}
function fontFile(game,id){
 const family=style(game,id)['font-family']?.split(',')[0].trim().replace(/^['"]|['"]$/g,'');
 if(!family||/[\\/:\0]|\.\./.test(family))throw Error('게임 글꼴 경로를 확인할 수 없습니다.');
 const root=fs.realpathSync(path.join(game,'fonts'));
 for(const ext of ['.ttf','.otf']){const file=path.join(root,family+ext);if(fs.existsSync(file)){const real=fs.realpathSync(file);if(path.dirname(real)!==root)throw Error('게임 글꼴 폴더 밖의 경로입니다.');return real;}}
 throw Error('설치된 게임 글꼴이 없습니다: '+family);
}
function load(game,doc,token){
 const xml=readText(path.join(game,'config.xml')),width=Number(xml.match(/\bwidth="(\d+)"/)?.[1]),height=Number(xml.match(/\bheight="(\d+)"/)?.[1]);
 if(!width||!height)throw Error('게임 화면 크기를 확인할 수 없습니다.');
 const layout=doc.locations.find(l=>l.name==='_layout');if(!layout)throw Error('게임 _layout을 찾지 못했습니다.');
 const body=core.shift(doc.lines[layout.body],5),which=body.match(/^\s*ui_style\s*=\s*(\d+)/m)?.[1];
 const frame=body.match(new RegExp('if\\s+ui_style\\s*=\\s*'+which+'\\s*:\\s*\\$backimage\\s*=\\s*[\'\"]([^\'\"]+)[\'\"]','i'))?.[1];
 if(!frame||!frame.startsWith('content/pic/')||frame.includes('..')||!fs.existsSync(path.join(game,frame)))throw Error('현재 게임 UI 이미지를 확인할 수 없습니다.');
 const pic=p=>'/api/pic?t='+encodeURIComponent(token)+'&p='+encodeURIComponent(p.replace(/^content[\\/]pic[\\/]/,''));
 const profiles={};for(const id of Object.keys(selectors)){
  const s=style(game,id),px=(key,optional=false)=>{const value=s[key];if(optional&&value===undefined)return 0;if(!/^-?[\d.]+px$/.test(value||''))throw Error('게임 CSS 크기를 읽을 수 없습니다: '+selectors[id]+' '+key);return parseFloat(value);};
  const rect={left:px('left'),top:px('top')+px('margin-top',true),width:px('width'),height:px('height')},fontSize=px('font-size');
  if(rect.width<=0||rect.height<=0||fontSize<=0)throw Error('게임 CSS 크기가 잘못되었습니다.');
  const file=fontFile(game,id),fontFamily='JO9GameReview_'+crypto.createHash('sha256').update(file).digest('hex').slice(0,12);
  const paper='content/pic/ui/panels/bg_legacy/page_blank.png';if(id==='paper'&&!fs.existsSync(path.join(game,paper)))throw Error('게임 종이 UI 이미지가 없습니다.');
  profiles[id]={id,name:id==='dialogue'?'이미지 아래 대사창':'종이 전체 대사',selector:selectors[id],rect,fontSize,fontFamily,fontName:s['font-family'],lineHeight:s['line-height']||'normal',color:s.color||'#000000',visibleHeight:Math.min(rect.height,height-rect.top),fontUrl:'/api/script-layout-font?t='+encodeURIComponent(token)+'&profile='+id+'&v='+fs.statSync(file).mtimeMs,paperUrl:id==='paper'?pic(paper):null};
 }
 return {canvas:{width,height},frameUrl:pic(frame),profiles,source:'현재 WORK config.xml · css/base.css · fonts'};
}
module.exports={load,fontFile};
