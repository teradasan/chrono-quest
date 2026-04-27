import { TILE } from '../utils/TileRenderer.js';

export const MAP_COLS = 50;
export const MAP_ROWS = 35;

// 仕様: 0=草 1=壁 2=水 3=道 4=背の高い草 5=砂
const G = TILE.GRASS;
const W = TILE.WALL;
const Wt = TILE.WATER;
const P = TILE.PATH;
const T = TILE.TALL_GRASS;
const S = TILE.SAND;

export const FIELD_MAP = buildMap();

function buildMap() {
  // 全マスを草で初期化
  const map = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(G));

  // 外周を壁に
  for (let c = 0; c < MAP_COLS; c++) { map[0][c] = W; map[MAP_ROWS - 1][c] = W; }
  for (let r = 0; r < MAP_ROWS; r++) { map[r][0] = W; map[r][MAP_COLS - 1] = W; }

  // 横断する道（行17）
  for (let c = 1; c < MAP_COLS - 1; c++) map[17][c] = P;

  // 縦断する道（列25）
  for (let r = 1; r < MAP_ROWS - 1; r++) map[r][25] = P;

  // 湖（左下エリア 行22-30、列4-14）
  for (let r = 22; r <= 30; r++)
    for (let c = 4; c <= 14; c++)
      map[r][c] = Wt;

  // 湖周囲を砂に
  for (let r = 21; r <= 31; r++)
    for (let c = 3; c <= 15; c++)
      if (map[r][c] === G) map[r][c] = S;

  // 背の高い草ゾーン
  fillRect(map, 4,  4,  9,  11, T, [G]);
  fillRect(map, 4,  28, 9,  40, T, [G]);
  fillRect(map, 20, 30, 28, 44, T, [G]);
  fillRect(map, 10, 10, 15, 20, T, [G]);

  // 岩の塊
  const rocks = [
    [8,35],[8,36],[9,35],[9,36],
    [21,20],[21,21],[22,20],
    [3,14],[3,15],[4,14],
    [28,30],[28,31],[29,30],[29,31],[29,32],
    [5,44],[6,44],[6,45],[7,44],
    [12,36],[13,36],[13,37],
  ];
  for (const [r, c] of rocks)
    if (map[r][c] !== P) map[r][c] = W;

  return map;
}

function fillRect(map, r1, c1, r2, c2, tile, allowedOver) {
  for (let r = r1; r <= r2; r++)
    for (let c = c1; c <= c2; c++)
      if (allowedOver.includes(map[r][c])) map[r][c] = tile;
}

// 壁タイルのインデックス一覧（衝突判定用）
export const WALL_TILES = [TILE.WALL, TILE.WATER];
