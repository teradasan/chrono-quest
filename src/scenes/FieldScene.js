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

    // ゲームパッドデバッグ表示
    this.padDebug = this.add.text(
      12, this.scale.height - 12,
      '',
      { fontSize: '10px', fontFamily: 'monospace', color: '#ffff44', backgroundColor: '#00000099', padding: { x: 6, y: 4 } }
    ).setOrigin(0, 1).setScrollFactor(0).setDepth(100);

    // ゲームパッド接続イベント
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

    // ゲームパッドデバッグ表示（Raw Gamepad API で直接確認）
    try {
      const rawPads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      const raw = rawPads[0]; // 最初に見つかったパッドを使用
      if (raw) {
        // 押されているボタン（value > 0.1）
        const rawBtns = raw.buttons
          .map((b, i) => b.value > 0.1 ? `${i}(${b.value.toFixed(1)})` : null)
          .filter(Boolean);
        // 動いている軸（|value| > 0.1）
        const rawAxes = Array.from(raw.axes)
          .map((v, i) => Math.abs(v) > 0.1 ? `A${i}:${v.toFixed(2)}` : null)
          .filter(Boolean);
        const lines = [
          `[RAW] ${raw.id.slice(0, 32)}`,
          `Btns(${raw.buttons.length}): ${rawBtns.join(' ') || '(なし)'}`,
          `Axes(${raw.axes.length}): ${rawAxes.join(' ') || '(動きなし)'}`,
          `mapping: ${raw.mapping || 'none'}`,
        ];
        this.padDebug.setText(lines.join('\n'));
      } else {
        this.padDebug.setText('ゲームパッド未検出 (何かボタンを押してください)');
      }
    } catch (e) {
      this.padDebug.setText(`PADエラー: ${e.message}`);
    }

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
