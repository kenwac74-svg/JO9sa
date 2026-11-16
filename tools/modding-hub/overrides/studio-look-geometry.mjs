// Canvas coordinates; the saved portrait is always 151 × 150.
export const WIDTH=795, HEIGHT=596, FACE_RATIO=150/151;
export function clampFaceBox([x,y,width]){
 const w=Math.max(16,Math.min(Math.round(width),WIDTH,Math.floor(HEIGHT/FACE_RATIO)));
 const h=Math.round(w*FACE_RATIO);
 return [Math.round(Math.max(0,Math.min(WIDTH-w,x))),Math.round(Math.max(0,Math.min(HEIGHT-h,y))),w];
}
export function faceCorners([x,y,w]){
 const h=Math.round(w*FACE_RATIO);
 return {nw:[x,y],ne:[x+w,y],se:[x+w,y+h],sw:[x,y+h]};
}
export function faceHandleAt(box,x,y,tolerance){
 if(!box)return null;
 let hit=null,distance=Infinity;
 for(const [name,[hx,hy]] of Object.entries(faceCorners(box))){
  const dx=Math.abs(x-hx),dy=Math.abs(y-hy),d=dx*dx+dy*dy;
  if(dx<=tolerance&&dy<=tolerance&&d<distance){hit=name;distance=d;}
 }
 return hit;
}
export function resizeFaceBox(box,corner,dx,dy){
 const points=faceCorners(box),opposite={nw:'se',ne:'sw',se:'nw',sw:'ne'}[corner];
 const [ax,ay]=points[opposite],[hx,hy]=points[corner];
 const sx=corner.endsWith('e')?1:-1,sy=corner.startsWith('s')?1:-1;
 const projected=(sx*(hx+dx-ax)+sy*(hy+dy-ay)*FACE_RATIO)/(1+FACE_RATIO*FACE_RATIO);
 const maxWidth=Math.floor(Math.min(sx>0?WIDTH-ax:ax,(sy>0?HEIGHT-ay:ay)/FACE_RATIO));
 const w=Math.max(16,Math.min(Math.round(projected),maxWidth)),h=Math.round(w*FACE_RATIO);
 return clampFaceBox([sx>0?ax:ax-w,sy>0?ay:ay-h,w]);
}
export function bottomState(transform,bounds){
 if(!transform||!bounds)return {kind:'empty',color:'#737b82',text:'하단: 보이는 이미지 없음'};
 const gap=HEIGHT-(transform.y+(bounds.y+bounds.h)*transform.s);
 if(Math.abs(gap)<=.5)return {kind:'aligned',color:'#65cb88',gap,text:'하단 맞춤'};
 if(gap>0)return {kind:'gap',color:'#ef6969',gap,text:`하단 공백 ${gap.toFixed(1)}px`};
 return {kind:'overflow',color:'#dbb06e',gap,text:`하단 ${(-gap).toFixed(1)}px 잘림`};
}
