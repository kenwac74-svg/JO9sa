'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');
const {htmlFor,indexFor}=require('./catalog-scene-conditions.js');
const base=()=>({path:'content/pic/scene/a.png',status:'unlinked',summary:'연결 미확인',references:[],alternates:[]});
test('card gives a concrete action, reason, next step and deletion decision without executable markup',()=>{
 const html=htmlFor({...base(),review:{action:'duplicate_cleanup',label:'중복 정리 후보',reason:'현재 경로의 사본과 같음',
  nextStep:'<script>bad()</script>를 실행하지 않고 사본을 비교',deleteDecision:'삭제 확정 아님',stale:false}});
 a(html.includes('권장 처리'));a(html.includes('중복 정리 후보'));a(html.includes('다음 할 일'));a(html.includes('삭제 판정'));
 a(html.includes('&lt;script&gt;'));a(!html.includes('<script>bad()'));
});
test('stale action notes lead with recheck instead of an old cleanup recommendation',()=>{
 const html=htmlFor({...base(),review:{action:'duplicate_cleanup',label:'중복 정리 후보',reason:'old',nextStep:'old action',
  deleteDecision:'미확정',stale:true,staleReasons:['이미지 변경']}});
 a(html.includes('조치 재확인 필요'));a(html.indexOf('조치 재확인 필요')<html.indexOf('중복 정리 후보'));
});
test('an already connected item can display its completed action note',()=>{
 const html=htmlFor({...base(),status:'direct',review:{action:'keep_connected',label:'유지 · 연결 완료',reason:'연결됨',
  nextStep:'정보창의 그림 확인',deleteDecision:'유지',stale:false}});
 a(html.includes('유지 · 연결 완료'));a(html.includes('정보창의 그림 확인'));
});
test('review index groups annotated files and links to the encoded existing image route',()=>{
 const path='content/pic/scene/item/a & b.png',e={...base(),path,review:{label:'비교 후 선택'}};
 const html=indexFor({one:e,two:base()});a(html.includes('이미지 1개'));a(html.includes('?image='+encodeURIComponent(path)));
 a(html.includes('a &amp; b.png'));a(!html.includes('undefined'));
});
