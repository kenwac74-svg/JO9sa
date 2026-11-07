'use strict';

const assert = require('node:assert/strict');

function patchPurchases({ edit, text }) {
  const gold = 50;
  const sparks = 500;
  const servings = 10;
  const lines = (...rows) => rows.join('\r\n');

  function patchSale(scene, replacements, label) {
    const pattern = new RegExp(`^IF interaction_city = ${scene}:\\r\\n[\\s\\S]*?^END(?=\\r?$)`, 'm');
    const before = text('interaction_city').match(pattern)?.[0];
    assert.ok(before, `Missing purchase scene ${scene}`);
    let after = before;
    for (const [old, updated] of replacements) {
      assert.equal(after.split(old).length, 2, `Unexpected scene ${scene} purchase anchor: ${old}`);
      after = after.replace(old, () => updated);
    }
    edit('interaction_city', before, after, label);
  }

  patchSale(30212, [
    [" if gold < 25 and sparks < 250: sp_txt = 3 & gt 'shop_general'",
      ` if gold < ${gold} and sparks < ${sparks}: sp_txt = 3 & gt 'shop_general'`],
    [lines(' IF gold < 25:', '  sparks -= 250', ' else', '  gold -= 25'),
      lines(` IF gold < ${gold}:`, `  sparks -= ${sparks}`, ' else', `  gold -= ${gold}`)],
    ['신선하고 향이 좋은 아그라바 과일입니다.', `신선하고 향이 좋은 아그라바 과일 ${servings}회분입니다.`],
    [" jo9_agraba_stock['fruit'] += 1", ` jo9_agraba_stock['fruit'] += ${servings}`],
  ], 'Agrabah fruit payment and ten servings');

  patchSale(30411, [
    [" if gold < 25: sp_txt = 1 & gt 'shop_general'",
      ` if gold < ${gold}: sp_txt = 1 & gt 'shop_general'`],
    [' gold -= 25', ` gold -= ${gold}`],
    ['아그라바산 특제 와인입니다.', `아그라바산 특제 와인 ${servings}회분입니다.`],
    [" jo9_agraba_stock['wine'] += 1", ` jo9_agraba_stock['wine'] += ${servings}`],
  ], 'Agrabah wine gold-only payment and ten servings');

  edit('#options', lines(
    "IF gold >= 25 or sparks >= 250: FUNC('$menu', 'goto', $menu_item_balsam, 30212, 'interaction_city', 'interaction_city', '신선한 과일 (25)', '아그라바산 고급 과일. 금화가 부족하면 스파크로 결제한다.')",
    "IF gold < 25 and sparks < 250: FUNC('$menu', 'location_gray_tooltip', $menu_item_balsam_gray, empty, '신선한 과일 (25)', '금화나 스파크가 부족하다.')",
  ), lines(
    `IF gold >= ${gold} or sparks >= ${sparks}: FUNC('$menu', 'goto', $menu_item_balsam, 30212, 'interaction_city', 'interaction_city', '신선한 과일 (${gold})', '${servings}회분. 금화 ${gold}개로 결제한다. 금화가 부족하면 ${sparks}스파크로 결제한다.')`,
    `IF gold < ${gold} and sparks < ${sparks}: FUNC('$menu', 'location_gray_tooltip', $menu_item_balsam_gray, empty, '신선한 과일 (${gold})', '금화 ${gold}개 또는 ${sparks}스파크가 필요하다.')`,
  ), 'Agrabah fruit menu and payment explanation');

  edit('#options', lines(
    "IF gold >= 25: FUNC('$menu', 'goto', $menu_item_maslab, 30411, 'interaction_city', 'interaction_city', '아그라바 와인 (25)', '아그라바산 특제 와인. 금화로 구입해 따로 보관한다.')",
    "IF gold < 25: FUNC('$menu', 'location_gray_tooltip', $menu_item_maslab_gray, empty, '아그라바 와인 (25)', '환전소에서 금화를 마련해야 한다.')",
  ), lines(
    `IF gold >= ${gold}: FUNC('$menu', 'goto', $menu_item_maslab, 30411, 'interaction_city', 'interaction_city', '아그라바 와인 (${gold})', '${servings}회분. 금화 ${gold}개로 구입해 따로 보관한다.')`,
    `IF gold < ${gold}: FUNC('$menu', 'location_gray_tooltip', $menu_item_maslab_gray, empty, '아그라바 와인 (${gold})', '금화 ${gold}개가 필요하다. 환전소에서 금화를 마련할 수 있다.')`,
  ), 'Agrabah wine menu and gold-only explanation');
}

module.exports = { patchPurchases };
