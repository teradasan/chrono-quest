export const TILE_PX = 48; // 16px * scale3

export const TILE = {
  GRASS: 0,
  WALL: 1,
  WATER: 2,
  PATH: 3,
  TALL_GRASS: 4,
  SAND: 5,
};

const NUM_TILES = 6;

export function createTilesetTexture(scene) {
  const w = TILE_PX * NUM_TILES;
  const h = TILE_PX;
  const canvas = scene.textures.createCanvas('tileset', w, h);
  const ctx = canvas.getContext();

  drawGrass(ctx, TILE_PX * TILE.GRASS);
  drawWall(ctx, TILE_PX * TILE.WALL);
  drawWater(ctx, TILE_PX * TILE.WATER);
  drawPath(ctx, TILE_PX * TILE.PATH);
  drawTallGrass(ctx, TILE_PX * TILE.TALL_GRASS);
  drawSand(ctx, TILE_PX * TILE.SAND);

  canvas.refresh();
}

function drawGrass(ctx, ox) {
  const s = TILE_PX;
  ctx.fillStyle = '#4a8c3f';
  ctx.fillRect(ox, 0, s, s);

  ctx.fillStyle = '#3a7c2f';
  [[4,8,3,3],[14,3,2,5],[24,16,3,3],[36,6,2,4],[42,24,3,3]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );

  ctx.fillStyle = '#5aac4a';
  [[8,3,2,7],[19,11,2,6],[30,2,2,8],[40,18,2,6]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );
}

function drawWall(ctx, ox) {
  const s = TILE_PX;
  ctx.fillStyle = '#6a6a7a';
  ctx.fillRect(ox, 0, s, s);

  ctx.fillStyle = '#4a4a5a';
  [[0,0,s,2],[0,0,2,s],[0,s-2,s,2],[s-2,0,2,s]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );

  ctx.fillStyle = '#5a5a6a';
  [[4,4,18,18],[26,4,18,18],[4,26,18,18],[26,26,18,18]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );

  ctx.fillStyle = '#7a7a8a';
  [[5,5,4,4],[27,5,4,4],[5,27,4,4],[27,27,4,4]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );
}

function drawWater(ctx, ox) {
  const s = TILE_PX;
  ctx.fillStyle = '#1a4a9a';
  ctx.fillRect(ox, 0, s, s);

  ctx.fillStyle = '#2255aa';
  [[2,6,12,4],[18,14,14,4],[8,24,10,4],[28,34,12,4]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );

  ctx.fillStyle = '#4477cc';
  [[3,7,6,2],[20,15,6,2],[10,25,4,2],[30,35,5,2]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );
}

function drawPath(ctx, ox) {
  const s = TILE_PX;
  ctx.fillStyle = '#a08050';
  ctx.fillRect(ox, 0, s, s);

  ctx.fillStyle = '#907040';
  [[4,4,3,3],[14,18,4,4],[28,8,3,3],[36,28,4,3],[20,36,3,3]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );

  ctx.fillStyle = '#b09060';
  [[8,12,2,2],[22,6,2,2],[32,22,2,2],[10,34,2,2],[40,14,2,2]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );
}

function drawTallGrass(ctx, ox) {
  const s = TILE_PX;
  ctx.fillStyle = '#3a7c2f';
  ctx.fillRect(ox, 0, s, s);

  ctx.fillStyle = '#2a6c1f';
  [[3,4,3,3],[13,8,2,3],[23,3,3,3],[33,6,2,4],[43,10,3,3]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );

  ctx.fillStyle = '#4aac3a';
  [[5,0,2,12],[12,4,2,10],[20,0,2,14],[28,2,2,12],[36,0,2,13],[44,3,2,10]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );

  ctx.fillStyle = '#5abc4a';
  [[6,0,1,8],[13,2,1,7],[21,0,1,9],[29,1,1,8]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );
}

function drawSand(ctx, ox) {
  const s = TILE_PX;
  ctx.fillStyle = '#c8a860';
  ctx.fillRect(ox, 0, s, s);

  ctx.fillStyle = '#b89850';
  [[6,6,3,3],[18,20,4,3],[30,10,3,4],[40,30,4,3]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );

  ctx.fillStyle = '#d8b870';
  [[10,14,2,2],[24,4,2,2],[36,22,2,2],[14,36,2,2]].forEach(
    ([dx,dy,w,h]) => ctx.fillRect(ox+dx, dy, w, h)
  );
}
