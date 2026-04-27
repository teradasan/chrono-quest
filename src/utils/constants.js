export const GAME = {
  WIDTH: 960,
  HEIGHT: 540,
  TILE_SIZE: 16,
  SCALE: 3,
};

export const PLAYER = {
  SPEED: 160,
  DASH_SPEED: 300,
  HP_MAX: 10,
  MP_MAX: 50,
};

export const WEAPONS = [
  { id: 'sword',    name: '片手剣',   type: 'melee' },
  { id: 'greatsword', name: '大剣',   type: 'melee' },
  { id: 'dagger',   name: '短剣',     type: 'melee' },
  { id: 'spear',    name: '槍',       type: 'melee' },
  { id: 'axe',      name: '斧',       type: 'melee' },
  { id: 'hammer',   name: 'ハンマー', type: 'melee' },
  { id: 'whip',     name: '鞭',       type: 'melee' },
  { id: 'dual',     name: '二刀流',   type: 'melee' },
  { id: 'scythe',   name: '鎌',       type: 'melee' },
  { id: 'gauntlet', name: '鉄拳',     type: 'melee' },
];

export const SKILL_CONFIG = {
  mode: 'free',      // 'free' | 'gold' | 'item' | 'disabled'
  goldCost: 0,
  requiredItem: null,
};

export const BUTTONS = {
  A: 0,   // 攻撃/インタラクト
  B: 1,   // 回避
  X: 2,   // アイテム使用
  Y: 3,   // 武器ホットスワップ
  L1: 4,  // ロックオン
  R1: 5,  // スキル1
  L2: 6,  // ダッシュ
  R2: 7,  // スキル2
  SELECT: 8,  // マップ
  START: 9,   // システムメニュー
};
