import * as Phaser from 'phaser';
import { createTilesetTexture, TILE_PX, TILE } from '../utils/TileRenderer.js';
import { FIELD_MAP, MAP_COLS, MAP_ROWS, WALL_TILES } from '../maps/fieldMapData.js';

const PLAYER_SPEED = 200;
const PLAYER_SIZE = 28;

export class FieldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FieldScene' });
  }

  create() {
    // タイルセットテクスチャをコードで生成
    createTilesetTexture(this);

    // タイルマップ構築
    const map = this.make.tilemap({
      data: FIELD_MAP,
      tileWidth: TILE_PX,
      tileHeight: TILE_PX,
    });
    const tileset = map.addTilesetImage('tileset', 'tileset', TILE_PX, TILE_PX, 0, 0);
    this.layer = map.createLayer(0, tileset, 0, 0);

    // 衝突タイル設定
    this.layer.setCollision(WALL_TILES);

    // 水タイルのアニメーション（揺らめき）
    this.waterTime = 0;

    // 仮プレイヤー（緑の四角）
    const startX = 25 * TILE_PX + TILE_PX / 2;
    const startY = 17 * TILE_PX + TILE_PX / 2;
    this.player = this.physics.add.rectangle(startX, startY, PLAYER_SIZE, PLAYER_SIZE, 0x22dd44);
    this.player.setDepth(10);

    // プレイヤーとマップの衝突
    this.physics.add.collider(this.player, this.layer);

    // カメラ設定
    const mapW = MAP_COLS * TILE_PX;
    const mapH = MAP_ROWS * TILE_PX;
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(400);

    // キーボード入力（Session03で InputManager に移行）
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // ミニマップ（右上の小窓）
    this.createMinimap(mapW, mapH);

    // 操作ガイド
    this.add.text(12, 12, '矢印 / WASD で移動', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(100);
  }

  createMinimap(mapW, mapH) {
    const mmW = 160;
    const mmH = 100;
    const mmX = this.scale.width - mmW - 10;
    const mmY = 10;

    // ミニマップカメラ
    this.miniCam = this.cameras.add(mmX, mmY, mmW, mmH);
    this.miniCam.setZoom(mmW / mapW);
    this.miniCam.setBounds(0, 0, mapW, mapH);
    this.miniCam.startFollow(this.player, true);
    this.miniCam.setBackgroundColor('#000000');

    // 枠線
    const border = this.add.rectangle(
      mmX + mmW / 2, mmY + mmH / 2, mmW + 2, mmH + 2, 0xffffff, 0.6
    ).setScrollFactor(0).setDepth(99);
  }

  update(time, delta) {
    const body = this.player.body;
    body.setVelocity(0);

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;

    let vx = 0, vy = 0;
    if (left)  vx -= PLAYER_SPEED;
    if (right) vx += PLAYER_SPEED;
    if (up)    vy -= PLAYER_SPEED;
    if (down)  vy += PLAYER_SPEED;

    // 斜め移動の速度を正規化
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    body.setVelocity(vx, vy);

    // 水タイルのゆらめき（色調変化）
    this.waterTime += delta;
    if (this.waterTime > 500) {
      this.waterTime = 0;
      this.layer.forEachTile(tile => {
        if (tile.index === TILE.WATER) {
          const t = (Date.now() / 1000) % 1;
          tile.tint = t < 0.5 ? 0xaaccff : 0x88aaee;
        }
      });
    }
  }
}
