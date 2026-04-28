import * as Phaser from 'phaser';
import { createTilesetTexture, TILE_PX, TILE } from '../utils/TileRenderer.js';
import { FIELD_MAP, MAP_COLS, MAP_ROWS, WALL_TILES } from '../maps/fieldMapData.js';
import { InputManager, ACTION } from '../systems/InputManager.js';
import { Player, createPlayerTexture } from '../entities/Player.js';
import { CombatManager } from '../systems/CombatManager.js';

const CHARGE_THRESHOLD = 600; // チャージ攻撃に必要な押しっぱなし時間(ms)

export class FieldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FieldScene' });
  }

  create() {
    // テクスチャ生成
    createTilesetTexture(this);
    createPlayerTexture(this);

    // タイルマップ
    const map = this.make.tilemap({
      data: FIELD_MAP,
      tileWidth: TILE_PX,
      tileHeight: TILE_PX,
    });
    const tileset = map.addTilesetImage('tileset', 'tileset', TILE_PX, TILE_PX, 0, 0);
    this.layer = map.createLayer(0, tileset, 0, 0);
    this.layer.setCollision(WALL_TILES);

    const mapW = MAP_COLS * TILE_PX;
    const mapH = MAP_ROWS * TILE_PX;
    this.physics.world.setBounds(0, 0, mapW, mapH);

    // プレイヤー
    const startX = 25 * TILE_PX + TILE_PX / 2;
    const startY = 17 * TILE_PX + TILE_PX / 2;
    this.player = new Player(this, startX, startY);
    this.physics.add.collider(this.player, this.layer);

    // 戦闘システム
    this.combat = new CombatManager(this, this.player);

    // ダミー標的（テスト用）
    this.dummies = this._createDummies();
    this.combat.setDummyGroup(this.dummies);

    // カメラ
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(500);

    // 入力
    this.input$ = new InputManager(this);

    // ミニマップ
    this.createMinimap(mapW, mapH);

    // 操作ガイド
    this.createGuide();

    this.waterTime = 0;
  }

  // ── ダミー標的生成 ────────────────────────
  _createDummies() {
    const group = this.add.group();
    const positions = [
      [25 * TILE_PX - 80, 17 * TILE_PX - 60],
      [25 * TILE_PX + 100, 17 * TILE_PX - 40],
      [25 * TILE_PX,       17 * TILE_PX + 100],
    ];

    positions.forEach(([x, y]) => {
      // 土台
      const base = this.add.rectangle(x, y + 18, 20, 10, 0x5c3010, 1).setDepth(8);

      // 標的本体
      const dummy = this.add.container(x, y).setDepth(9);

      // 木の棒
      const pole = this.add.rectangle(0, 10, 6, 30, 0x8b6014);
      // 藁人形
      const body = this.add.rectangle(0, -4, 22, 26, 0xd4a060);
      const head = this.add.circle(0, -20, 10, 0xd4a060);
      // 目
      const eye1 = this.add.rectangle(-4, -22, 4, 4, 0x333333);
      const eye2 = this.add.rectangle( 4, -22, 4, 4, 0x333333);
      // 口
      const mouth = this.add.rectangle(0, -16, 8, 3, 0x333333);
      // ×印
      const cross1 = this.add.rectangle(0, -4, 24, 3, 0xcc4400).setAngle(45);
      const cross2 = this.add.rectangle(0, -4, 24, 3, 0xcc4400).setAngle(-45);

      dummy.add([pole, body, head, eye1, eye2, mouth, cross1, cross2]);

      // 物理判定用（hit判定のみ）
      const hitRect = this.add.rectangle(x, y - 4, 22, 40, 0xff0000, 0);
      hitRect.setDepth(9);
      hitRect.hp = 10;
      hitRect.hpMax = 10;
      hitRect._container = dummy;
      hitRect._base = base;

      hitRect.takeDamage = function(amount) {
        this.hp -= amount;
        // 揺れエフェクト
        this.scene?.tweens?.add({
          targets: this._container,
          x: { from: this._container.x - 4, to: this._container.x + 4 },
          duration: 60,
          yoyo: true,
          repeat: 2,
        });
        if (this.hp <= 0) {
          // 破壊エフェクト
          this.scene?.tweens?.add({
            targets: [this._container, this._base],
            alpha: 0,
            y: '-=20',
            duration: 400,
            onComplete: () => {
              this._container.destroy();
              this._base.destroy();
              this.destroy();
            },
          });
          group.remove(this);
        }
      }.bind(hitRect);
      hitRect.scene = this;

      group.add(hitRect);
    });

    return group;
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
      '移動     : WASD/矢印 | Dパッド',
      'ダッシュ : Shift     | L2',
      '攻撃     : Z/Enter  | A',
      'チャージ : 長押し→離す',
      '回避     : X         | B',
      'ロックオン: Tab      | L1',
    ];
    this.add.text(12, 12, lines.join('\n'), {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#dddddd',
      backgroundColor: '#00000099',
      padding: { x: 8, y: 6 },
      lineSpacing: 3,
    }).setScrollFactor(0).setDepth(100);

    this.input.gamepad.on('connected', pad => console.log('Pad:', pad.id));

    // ゲームパッドボタン番号デバッグ表示（右下に常時表示）
    this._padDebugText = this.add.text(this.scale.width - 12, this.scale.height - 60,
      'PAD: --', {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#aaaaaa',
        backgroundColor: '#00000099',
        padding: { x: 6, y: 4 },
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(100);
  }

  update(time, delta) {
    const input = this.input$;

    // holdMs は input.update() で _attackHoldMs がリセットされる前に取得する
    const holdMs = input.getAttackHoldMs();

    input.update(delta);

    // ── ロックオン ──────────────────────────
    const lockHeld = input.isDown(ACTION.LOCK_ON);
    this.combat.updateLockOn(lockHeld, null);
    this.player.setLockOnActive(lockHeld && !!this.combat.lockTarget);

    // ── 攻撃入力 ───────────────────────────
    const attackDown = input.isJustDown(ACTION.ATTACK);
    const attackUp   = input.isJustUp(ACTION.ATTACK);

    if (input.isDown(ACTION.ATTACK) && holdMs > 0 && this.combat.canAttack()) {
      // チャージ中エフェクト
      this.combat.showChargeEffect(holdMs);
    } else {
      this.combat.clearChargeEffect();
    }

    if (attackUp && this.combat.canAttack()) {
      if (holdMs >= CHARGE_THRESHOLD) {
        this.combat.startAttack(true);  // チャージ攻撃
      } else if (holdMs > 0) {
        this.combat.startAttack(false); // 通常攻撃
      }
    }

    // ── プレイヤー更新 ──────────────────────
    this.player.update(delta, input);

    // ── 戦闘更新 ────────────────────────────
    this.combat.update(delta, null);

    // ── ゲームパッドデバッグ ────────────────
    if (this._padDebugText) {
      const gp  = this.input.gamepad;
      const pad = gp?.pad1 ?? gp?.pad2 ?? gp?.pad3 ?? gp?.pad4;
      if (pad) {
        const pressed = pad.buttons
          .map((b, i) => b.pressed ? i : -1)
          .filter(i => i >= 0);
        const label = pressed.length > 0 ? `BTN: [${pressed.join(',')}]` : 'PAD: OK';
        this._padDebugText.setText(label);
      }
    }

    // ── 水タイルのゆらめき ──────────────────
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
    this.combat?.destroy();
  }
}
