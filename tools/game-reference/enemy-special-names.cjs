'use strict';

// JO9 MOD START ENEMY_SPECIAL_NAMES_20261111
// Reference labels only; the QSP attack definitions and effects remain unchanged.
// Share a name when attack type, damage type and target/status sets match.
// Damage and duration values remain visible in the attack data.
const SPECIAL_NAMES = Object.freeze({
  'безумный_архимаг:1': '빙결속박',
  'безумный_архимаг:2': '화염폭발',
  'безумный_архимаг:3': '뇌전일격',
  'исчадие_молодь:1': '정신파쇄',
  'исчадие:1': '정신파쇄',
  'исчадие:2': '안개적응',
  'чудовщиное_исчадие:1': '정신파쇄',
  'чудовщиное_исчадие:2': '안개적응',
  'чудовщиное_исчадие:3': '쇠약관통',
  'вампир:1': '정신쇠약',
  'вервольф:1': '맹렬참격',
  'лич:1': '정신파쇄',
  'ogre:1': '분쇄일격',
  'warg:1': '위압포효',
  'champion_corvus:1': '정신쇠약',
  'champion_kamira:1': '탈력강타',
  'champion_serpis:1': '고통속검',
  'champion_taurus:1': '전신붕괴',
  'champion_vatican:1': '고통속검',
  'champion_absolute:1': '파멸참격',
  'исчадие_арены:1': '정신교란',
  'исчадие_арены:2': '안개적응',
  'gladiatrix1:1': '고통속검',
  'gladiatrix2:1': '전신붕괴',
  'gladiatrix3:1': '고통속검',
  'egeya:1': '파멸참격',
  'vatican_paladin:1': '파멸참격',
  'strazhnik:1': '고통강타',
  'grinch:1': '파멸참격',
  'erza:1': '파멸참격'
});

// Champion qualifiers use the short $склонение_моб labels; numbered gladiatrix
// labels distinguish definitions whose two short in-game labels are identical.
const PERFORMER_LABELS = Object.freeze({
  'безумный_архимаг': '광기의 대마법사',
  'исчадие_молодь': '성장기 안개 괴물',
  'исчадие': '안개 괴물',
  'чудовщиное_исчадие': '거대 안개 괴물',
  'вампир': '흡혈귀',
  'вервольф': '늑대인간',
  'лич': '리치',
  'ogre': '오우거',
  'warg': '와그',
  'champion_corvus': '유혈 숙녀(특급 투사)',
  'champion_kamira': '식인 여성(특급 투사)',
  'champion_serpis': '해적 공주(특급 투사)',
  'champion_taurus': '강철 여왕(특급 투사)',
  'champion_vatican': '바티칸 여기사(특급 투사)',
  'champion_absolute': '최후의 심판자',
  'исчадие_арены': '아레나 안개 괴물',
  'gladiatrix1': '여검투사 1',
  'gladiatrix2': '여검투사 2',
  'gladiatrix3': '여검투사 3',
  'egeya': '에게야',
  'vatican_paladin': '바티칸 성기사',
  'strazhnik': '포탈 가디언',
  'grinch': '그린치',
  'erza': '엘자'
});

module.exports = { SPECIAL_NAMES, PERFORMER_LABELS };
// JO9 MOD END ENEMY_SPECIAL_NAMES_20261111
