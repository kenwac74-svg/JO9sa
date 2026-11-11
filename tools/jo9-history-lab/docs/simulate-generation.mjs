// 게임 generate_stock(최신 qsp 2026-11-11)의 처녀 여부·성 기술·임신 생성 부분을 그대로 옮긴 시뮬레이터. 공식 검증과 수치 조정용
// 옮긴 범위: 직업 블록(690~990행 중 성 관련), crushboss 블록(1160~1285행 중 성 관련), 불임(1148~1158행). 랜덤 템플릿에는 seed_sub_* 값이 없어 0에서 시작한다.
export const VIRGIN_RESET=['bride','nun','sorceress','barbarian_princess','mprincess'];
const BRIDE_TO_WIFE={poor_bride:'poor_wife',noble_bride:'noble_wife',rich_bride:'rich_wife'};
const SEX_WORK=['whore','markitane','brothel'];
const WIVES=['poor_wife','noble_wife','rich_wife'];

export function simulateStock(poolOccupation,metaType,rand){
 const s={occupation:poolOccupation,age:metaType===3?2:0,virginity:0,fertility:0,pregnant:0,parasite:0};
 const sub=k=>s[k]??0,add=(k,v)=>{s[k]=sub(k)+v;};
 const reset=()=>{s.virginity=0;s.sub_vaginal=0;s.sub_anal=0;s.sub_bj=0;};
 const occ=poolOccupation;
 if(VIRGIN_RESET.includes(occ))reset();
 else if(BRIDE_TO_WIFE[occ]){if(metaType===3)s.occupation=BRIDE_TO_WIFE[occ];else reset();}
 else if(occ==='viking_wife'){s.virginity=2;if(sub('sub_hug')<4)add('sub_hug',1);if(sub('sub_kiss')<4)add('sub_kiss',2);if(sub('sub_vaginal')<4)add('sub_vaginal',2);}
 else if(SEX_WORK.includes(occ)){
  s.virginity=2;
  if(sub('sub_hug')<5)add('sub_hug',1);if(sub('sub_hug')<3)add('sub_hug',1);
  if(sub('sub_kiss')<5)add('sub_kiss',1);if(sub('sub_kiss')<2)add('sub_kiss',1);
  if(sub('sub_bj')<4)add('sub_bj',2);if(sub('sub_vaginal')<4)add('sub_vaginal',2);if(sub('sub_vaginal')<3)add('sub_vaginal',1);if(sub('sub_anal')<5)add('sub_anal',1);
 }
 else if(WIVES.includes(occ)){s.virginity=2;if(sub('sub_hug')<5)add('sub_hug',1);if(sub('sub_kiss')<4)add('sub_kiss',2);if(sub('sub_vaginal')<4)add('sub_vaginal',2);}
 else if(occ==='avanturiste'){if(sub('sub_hug')<5)add('sub_hug',1);if(sub('sub_kiss')<5)add('sub_kiss',1);}
 else if(occ==='major'){if(sub('sub_bj')<5)add('sub_bj',1);if(sub('sub_hug')<5)add('sub_hug',1);if(sub('sub_kiss')<5)add('sub_kiss',1);}
 // 불임
 if(rand(1,15)===3)s.fertility=-1;
 const a=metaType===3?8:10;
 if(metaType===2){
  if(rand(1,4)===1)add('sub_anal',1);if(rand(1,3)===1)add('sub_bj',1);
  if(rand(1,4)===1){s.virginity=2;if(sub('sub_hug')<2)add('sub_hug',1);if(sub('sub_kiss')<2)add('sub_kiss',1);if(sub('sub_vaginal')<1)add('sub_vaginal',1);if(rand(1,3)===1)add('sub_anal',1);if(rand(1,3)===1)add('sub_bj',1);}
 }else if(metaType===3){
  if(sub('sub_hug')<3)add('sub_hug',1);if(sub('sub_kiss')<3)add('sub_kiss',1);
  if(rand(1,4)===1)add('sub_anal',1);if(rand(1,3)===1)add('sub_bj',1);
  if(rand(1,4)>1){s.virginity=2;if(sub('sub_hug')<4)add('sub_hug',1);if(sub('sub_kiss')<4)add('sub_kiss',1);if(sub('sub_vaginal')<3)add('sub_vaginal',2);if(rand(1,3)===1)add('sub_anal',1);if(rand(1,4)===1)add('sub_anal',1);if(rand(1,2)===1)add('sub_bj',1);if(rand(1,3)===1)add('sub_bj',1);}
 }
 // 1226행: 처녀면 연령별 확률로 비처녀
 if(s.virginity===0){if(metaType===2&&rand(1,100)<=50)s.virginity=2;else if(metaType===3&&rand(1,100)<=80)s.virginity=2;}
 if(s.virginity>1){
  for(const k of ['sub_vaginal','sub_hug','sub_kiss','sub_bj','sub_anal','sub_hj','sub_fj','sub_paizuri','sub_tongue','sub_dt','sub_asslik','sub_fisting'])if(rand(1,a)===1)add(k,rand(1,3));
  if(rand(1,8)===4)s.parasite=1;else if(s.fertility===0&&rand(1,12)===6)s.pregnant=1;
 }
 return s;
}
