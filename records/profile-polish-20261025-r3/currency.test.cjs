'use strict';
const assert=require('node:assert/strict'),{transform,scan}=require('./currency.cjs');
const cases=[
 ['구매자 소문을 듣는다 (10스파크)','구매자 소문을 듣는다 ($10)'],
 ['우유 캔 (25$)','우유 캔 ($25)'],
 ['밀린 비용 <<jo9_lq["bill"]>>스파크','밀린 비용 $<<jo9_lq["bill"]>>'],
 ['가정교사 (<<coach_price[0]>>-<<coach_price[5]>>$)','가정교사 ($<<coach_price[0]>>-<<coach_price[5]>>)'],
 ['<b><<rent>></b> 스파크를 냅니다.','<b>$<<rent>></b>를 냅니다.'],
 ['<b>10</b> - <b>20</b> 스파크','<b>$10</b> - <b>20</b>'],
 ['<<$slave_name>>의 가격은 <<price>>$다.','<<$slave_name>>의 가격은 $<<price>>다.'],
 ['$sparks, $50, copyarr "$" + $role, money123$foo','$sparks, $50, copyarr "$" + $role, money123$foo'],
 ['<<iif(x > 0, "100$", "200 스파크")>>','<<iif(x > 0, "$100", "$200")>>'],
 ["<<iif(x, 'a > b', $str(price))>>스파크","$<<iif(x, 'a > b', $str(price))>>"],
 ['비용: -500스파크 / 1,000$','비용: -$500 / $1,000'],
 ['스파크의 힘, 스파크가 부족하다.','스파크의 힘, 스파크가 부족하다.'],
 ['<br>세력: 타우루스 대가문<br>스파크: 8000','<br>세력: 타우루스 대가문<br>보유금: $8000'],
 ['스파크: <<sparks>>','보유금: $<<sparks>>'],
 ['스파크: $8,000','보유금: $8,000'],
 ['스파크: 8000스파크','보유금: $8000'],
 ['스파크: 충분함 / <font>스파크:</font>','스파크: 충분함 / <font>스파크:</font>'],
 ['x <<broken 100$','x <<broken 100$'],
];
for(const [a,b]of cases){assert.equal(transform(a),b,a);assert.equal(transform(b),b,'idempotence: '+b);}
assert.equal(scan('x <<broken 100$').skipped!==null,true);
console.log(JSON.stringify({pass:true,cases:cases.length,idempotence:true}));
