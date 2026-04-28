import * as Phaser from 'phaser';
import { createTilesetTexture, TILE_PX, TILE } from '../utils/TileRenderer.js';
import { FIELD_MAP, MAP_COLS, MAP_ROWS, WALL_TILES } from '../maps/fieldMapData.js';
import { InputManager, ACTION } from '../systems/InputManager.js';

const PLAYER_SPEED = 200;
const PLAYER_SIZE  = 28;

export class FieldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FieldScene' });
  }

  create() {
    createTilesetTexture(this);

    // タイルマップ構築
    const map = this.make.tilemap({
      data: FIELD_MAP,
      tileWidth: TILE_PX,
      tileHeight: TILE_PX,
    });
    const tileset = map.addTilesetImage('tileset', 'tileset', TILE_PX, TILE_PX, 0, 0);
    this.layer = map.createLayer(0, tileset, 0, 0);
    this.layer.setCollision(WALL_TILES);

    // 仮プレイヤー（緑の四角）
    const startX = 25 * TILE_PX + TILE_PX / 2;
    const startY = 17 * TILE_PX + TILE_PX / 2;
    this.player = this.add.rectangle(startX, startY, PLAYER_SIZE, PLAYER_SIZE, 0x22dd44);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(false);
    this.player.setDepth(10);
    this.physics.add.collider(this.player, this.layer);

    // カメラ
    const mapW = MAP_COLS * TILE_PX;
    const mapH = MAP_ROWS * TILE_PX;
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(400);

    // InputManager 初期化
    this.input$ = new InputManager(this);

    // ミニマップ
    this.createMinimap(mapW, mapH);

    // 操作ガイドUI
    this.createGuide();

    // 水アニメーション用
    this.waterTime = 0;
  }

  createMinimap(mapW, mapH) {
    const mmW = 160, mmH = 100;
    const mmX = this.scale.width - mmW - 10;
    const mmY = 10;

    this.miniCam = this.cameras.add(mmX, mmY, mmW, mmH);
    this.miniCam.setZoom(mmW / mapW);
    this.miniCam.setBounds(0, 0, mapW, mapH);
    this.miniCam.startFollow(this.player, true);
    this.miniCam.setBackgroundColor('#111111');

    const border = this.add.graphics();
    border.lineStyle(2, 0xffffff, 0.7);
    border.strokeRect(mmX - 1, mmY - 1, mmW + 2, mmH + 2);
    border.setScrollFactor(0).setDepth(99);
    this.miniCam.ignore(border);
  }

  createGuide() {
    const lines = [
      '── 操作 ──────────────────',
      '移動     : 矢印/WASD | Dパッド',
      'ダッシュ : Shift     | L2',
      'スキル1  : R         | R1',
      'スキル2  : F         | R2',
      'メニュー : Esc       | Start',
      'マップ   : M         | Select',
    ];
    this.add.text(12, 12, lines.join('\n'), {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#dddddd',
      backgroundColor: '#00000099',
      padding: { x: 8, y: 6 },
      lineSpacing: 3,
    }).setScrollFactor(0).setDepth(100);

    // ゲームパッド接続ログ
    this.input.gamepad.on('connected', (pad) => {
      console.log('Gamepad connected:', pad.id);
    });
  }

  update(time, delta) {
    const input = this.input$;
    input.update(delta);

    // 移動
    const { x, y } = input.getAxis();
    const speed = input.isDown(ACTION.DASH) ? PLAYER_SPEED * 1.9 : PLAYER_SPEED;
    this.player.body.setVelocity(x * speed, y * speed);

    // 水タイルのゆらめき
    this.waterTime += delta;
    if (this.waterTime > 600) {
      this.waterTime = 0;
      const tint = (Date.now() % 1200) < 600 ? 0xaaccff : 0x88aaee;
      this.layer.forEachTile(tile => {
        if (tile.index === TILE.WATER) tile.tint = tint;
      });
    }
  }

  shutdown() {
    this.input$?.destroy();
  }
}
