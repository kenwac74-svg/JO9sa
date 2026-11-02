/* JO9 MOD START MOB_PORTRAIT_CROP_20261030 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.JO9MobPortraitCrop=factory();}(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 function square(width,height,size,x,y){
  if(![width,height,size,x,y].every(Number.isFinite)||width<=0||height<=0)throw Error('이미지 선택 범위를 확인하세요.');
  const side=clamp(size,Math.min(1,width,height),Math.min(width,height));return{x:clamp(x,0,width-side),y:clamp(y,0,height-side),size:side};
 }
 const initial=(w,h)=>{const s=Math.min(w,h)*.55;return square(w,h,s,(w-s)/2,Math.max(0,h*.23-s/2));};
 function resize(rect,corner,x,y,width,height){
  const left=corner===0||corner===2,top=corner<2,ax=left?rect.x+rect.size:rect.x,ay=top?rect.y+rect.size:rect.y;
  const limit=Math.min(left?ax:width-ax,top?ay:height-ay),side=clamp(Math.max(left?ax-x:x-ax,top?ay-y:y-ay),Math.min(1,limit),limit);
  return square(width,height,side,left?ax-side:ax,top?ay-side:ay);
 }
 function fromDrag(x1,y1,x2,y2,w,h){const left=x2<x1,top=y2<y1,limit=Math.min(left?x1:w-x1,top?y1:h-y1),s=Math.max(.001,Math.min(limit,Math.max(Math.abs(x2-x1),Math.abs(y2-y1))));return square(w,h,s,left?x1-s:x1,top?y1-s:y1);}
 async function image(blob){const url=URL.createObjectURL(blob);try{const im=new Image();im.src=url;await im.decode();return im;}finally{URL.revokeObjectURL(url);}}
 function drawPortrait(source,rect,frame,meta,canvas){
  canvas.width=canvas.height=150;const cx=canvas.getContext('2d');if(!cx)throw Error('초상 미리보기를 만들 수 없습니다.');
  cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';const b=meta.innerBounds;
  cx.clearRect(0,0,150,150);cx.drawImage(source,rect.x,rect.y,rect.size,rect.size,b.x,b.y,b.width,b.height);
  const out=cx.getImageData(0,0,150,150),shell=frame.data;
  // Keep exact shell RGBA; only the original frame's empty aperture receives face pixels.
  for(let i=0;i<shell.length;i+=4)if(shell[i+3])for(let k=0;k<4;k++)out.data[i+k]=shell[i+k];
  cx.putImageData(out,0,0);return canvas;
 }
 async function open(options){
  const frames=window.JO9_MOB_PORTRAIT_FRAMES&&window.JO9_MOB_PORTRAIT_FRAMES.frames;
  if(!frames)throw Error('포트레이트 편집기를 새로고침한 뒤 다시 열어 주세요.');
  const category=options.frameClass||'default',meta=frames[category];if(!meta)throw Error('등록된 포트레이트 프레임을 확인하세요: '+category);
  const source=await image(options.file),shellImage=new Image();shellImage.src='data:image/png;base64,'+meta.framePng;await shellImage.decode();
  const temp=document.createElement('canvas');temp.width=temp.height=150;temp.getContext('2d').drawImage(shellImage,0,0);const frame=temp.getContext('2d').getImageData(0,0,150,150);
  const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const dialog=node('dialog');dialog.setAttribute('aria-label','MOB 포트레이트 얼굴 영역 선택');dialog.style.cssText='background:#20242b;color:#eee;border:2px solid #987445;padding:16px;width:min(1040px,92vw);max-width:94vw;max-height:92vh;overflow:auto;box-sizing:border-box';
  const heading=node('h3','얼굴 영역 선택 · 프레임 자동 적용'),description=node('p',options.path+(options.shared?' · 공유 파일: 연결된 모든 적에 적용됩니다.':''));description.style.overflowWrap='anywhere';
  const layout=node('div'),left=node('div'),right=node('div'),canvas=node('canvas'),preview=node('canvas'),note=node('p');
  layout.style.cssText='display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start';left.style.cssText='flex:1 1 360px;min-width:0';right.style.cssText='flex:0 0 180px';
  const scale=Math.min(1,720/source.width,430/source.height);canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));canvas.tabIndex=0;canvas.setAttribute('aria-label','얼굴 영역 선택');
  canvas.style.cssText='display:block;max-width:100%;height:auto;touch-action:none;cursor:crosshair;background:repeating-conic-gradient(#444 0% 25%,#555 0% 50%) 0/16px 16px;outline-offset:3px';
  preview.setAttribute('aria-label','프레임 적용 미리보기');preview.style.cssText='display:block;width:150px;height:150px;background:repeating-conic-gradient(#444 0% 25%,#555 0% 50%) 0/12px 12px';
  const range=node('input'),rangeLabel=node('label','선택 범위 '),reset=node('button','크기·위치 초기화'),yes=node('button','WORK에 반영'),no=node('button','취소'),message=node('p');
  range.type='range';range.min=5;range.max=100;range.step=1;range.setAttribute('aria-label','얼굴 선택 범위 크기');range.style.width='100%';rangeLabel.append(range);
  for(const n of [reset,yes,no])n.type='button';yes.style.cssText='margin-right:10px;padding:8px 18px';no.style.cssText='padding:8px 18px';
  left.append(canvas,node('p','사각형 안을 드래그해 이동하고 모서리로 크기를 조절하세요. 바깥을 드래그하면 새 범위를 고릅니다. 방향키로도 이동할 수 있습니다.'));
  right.append(node('strong','저장 미리보기 · 150×150'),preview,node('p','프레임: '+meta.label),rangeLabel,reset,note);
  layout.append(left,right);dialog.append(heading,description,layout,node('p','얼굴과 머리카락이 프레임 안에 들어오도록 조절하세요. 시작 위치는 추천 범위이며 자동 얼굴 인식 결과가 아닙니다. 선택 영역의 배경·투명도는 유지합니다.'),node('p','반영할 때 기존 원본 백업과 이미지 패치 기록을 남깁니다.'),message,yes,no);document.body.append(dialog);
  let rect=initial(source.width,source.height),start=null,settled=false,exporting=false;
  const point=e=>{const b=canvas.getBoundingClientRect();return{x:clamp((e.clientX-b.left)*source.width/b.width,0,source.width),y:clamp((e.clientY-b.top)*source.height/b.height,0,source.height)};};
  function paint(){
   const cx=canvas.getContext('2d'),sx=canvas.width/source.width,sy=canvas.height/source.height,r={x:rect.x*sx,y:rect.y*sy,w:rect.size*sx,h:rect.size*sy};
   cx.clearRect(0,0,canvas.width,canvas.height);cx.drawImage(source,0,0,canvas.width,canvas.height);cx.fillStyle='rgba(0,0,0,.55)';cx.fillRect(0,0,canvas.width,r.y);cx.fillRect(0,r.y+r.h,canvas.width,canvas.height-r.y-r.h);cx.fillRect(0,r.y,r.x,r.h);cx.fillRect(r.x+r.w,r.y,canvas.width-r.x-r.w,r.h);cx.strokeStyle='#afff77';cx.lineWidth=2;cx.strokeRect(r.x,r.y,r.w,r.h);cx.fillStyle='#afff77';
   for(const [x,y]of [[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h]])cx.fillRect(x-4,y-4,8,8);
   range.value=Math.round(rect.size/Math.min(source.width,source.height)*100);note.textContent='선택 '+Math.round(rect.size)+'×'+Math.round(rect.size)+' → 150×150';drawPortrait(source,rect,frame,meta,preview);
  }
  canvas.onpointerdown=e=>{if(settled||exporting)return;canvas.focus();const p=point(e),b=canvas.getBoundingClientRect(),hit=10*source.width/b.width,corners=[[rect.x,rect.y],[rect.x+rect.size,rect.y],[rect.x,rect.y+rect.size],[rect.x+rect.size,rect.y+rect.size]],corner=corners.findIndex(([x,y])=>Math.abs(p.x-x)<=hit&&Math.abs(p.y-y)<=hit);start={...p,rect:{...rect},corner,mode:corner>=0?'resize':p.x>=rect.x&&p.x<=rect.x+rect.size&&p.y>=rect.y&&p.y<=rect.y+rect.size?'move':'new'};canvas.setPointerCapture(e.pointerId);e.preventDefault();};
  canvas.onpointermove=e=>{if(!start||exporting)return;const p=point(e),s=start;if(s.mode==='move')rect=square(source.width,source.height,s.rect.size,s.rect.x+p.x-s.x,s.rect.y+p.y-s.y);else if(s.mode==='resize')rect=resize(s.rect,s.corner,p.x,p.y,source.width,source.height);else rect=fromDrag(s.x,s.y,p.x,p.y,source.width,source.height);paint();};
  canvas.onpointerup=canvas.onpointercancel=()=>{start=null;};
  canvas.onkeydown=e=>{if(exporting)return;const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!d)return;e.preventDefault();const step=(e.shiftKey?10:1)*Math.max(1,Math.min(source.width,source.height)/150);rect=square(source.width,source.height,rect.size,rect.x+d[0]*step,rect.y+d[1]*step);paint();};
  range.oninput=()=>{if(exporting)return;const side=Number(range.value)*Math.min(source.width,source.height)/100;rect=square(source.width,source.height,side,rect.x+(rect.size-side)/2,rect.y+(rect.size-side)/2);paint();};
  reset.onclick=()=>{if(exporting)return;rect=initial(source.width,source.height);paint();};paint();
  return await new Promise(resolve=>{
   const finish=value=>{if(settled)return;settled=true;dialog.close();dialog.remove();resolve(value);};
   no.onclick=()=>finish(null);dialog.oncancel=e=>{e.preventDefault();finish(null);};dialog.onclose=()=>finish(null);
   yes.onclick=async()=>{if(exporting||settled)return;const approvedCrop={...rect};exporting=true;start=null;yes.disabled=range.disabled=reset.disabled=true;message.textContent='PNG를 준비하고 있습니다.';try{const blob=await new Promise(r=>preview.toBlob(r,'image/png'));if(!blob)throw Error('PNG를 만들 수 없습니다.');const data=new Uint8Array(await blob.arrayBuffer());finish({blob,data,crop:approvedCrop,frameClass:category});}catch(e){message.textContent=e.message;exporting=false;yes.disabled=range.disabled=reset.disabled=false;}};
   dialog.showModal();
  });
 }
 return{square,initial,resize,fromDrag,drawPortrait,open};
}));
/* JO9 MOD END MOB_PORTRAIT_CROP_20261030 */
