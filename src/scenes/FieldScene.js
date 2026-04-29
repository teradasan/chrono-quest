import * as Phaser from 'phaser';
import { createTilesetTexture, TILE_PX, TILE } from '../utils/TileRenderer.js';
import { FIELD_MAP, MAP_COLS, MAP_ROWS, WALL_TILES } from '../maps/fieldMapData.js';
import { InputManager, ACTION } from '../systems/InputManager.js';
import { Player, createPlayerTexture } from '../entities/Player.js';
import { CombatManager } from '../systems/CombatManager.js';
import { EnemyManager } from '../systems/EnemyManager.js';

const CHARGE_THRESHOLD = 600; // チャージ攻撃に必要な押しっぱなし時間(ms)

// プレイヤー開始タイル
const START_TX = 25;
const START_TY = 17;

const T = (tx, ty) => [tx * TILE_PX + TILE_PX / 2, ty * TILE_PX + TILE_PX / 2];

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
    const [startX, startY] = T(START_TX, START_TY);
    this.player = new Player(this, startX, startY);
    this.physics.add.collider(this.player, this.layer);

    // 戦闘システム
    this.combat = new CombatManager(this, this.player);

    // ダミー標的（近接攻撃の練習用・スタート地点の真横）
    this.dummies = this._createDummies();
    this.combat.setDummyGroup(this.dummies);

    // 敵 AI
    this.enemyMgr = new EnemyManager(this, this.player, this.layer);
    this._spawnEnemies();
    this.combat.setEnemyGroup(this.enemyMgr.getGroup());

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

  // ── 敵の配置 ─────────────────────────────
  // プレイヤースタート: tile(25,17)
  // 各エリアに1体ずつ配置（探索しながら遭遇できる距離）

  _spawnEnemies() {
    const M = this.enemyMgr;

    // ── パトロール型 × 2 ──────────────────
    // 北西エリア: tile(20,11) を中心に東西を往復
    const [px1, py1] = T(20, 11);
    M.spawnPatrol(px1, py1, [T(17, 11), T(23, 11)]);

    // 南東エリア: tile(31,22) を中心に東西を往復
    const [px2, py2] = T(31, 22);
    M.spawnPatrol(px2, py2, [T(28, 22), T(34, 22)]);

    // ── 突進型 × 1 ────────────────────────
    // 南西エリア: tile(19,23)
    const [rx, ry] = T(19, 23);
    M.spawnRush(rx, ry);

    // ── 遠距離型 × 1 ──────────────────────
    // 北東エリア: tile(32,12)
    const [mgx, mgy] = T(32, 12);
    M.spawnRanged(mgx, mgy);
  }

  // ── ダミー標的生成（攻撃テスト用）────────

  _createDummies() {
    const group = this.add.group();
    const positions = [
      [START_TX * TILE_PX - 80, START_TY * TILE_PX - 60],
      [START_TX * TILE_PX + 100, START_TY * TILE_PX - 40],
      [START_TX * TILE_PX,       START_TY * TILE_PX + 100],
    ];

    positions.forEach(([x, y]) => {
      const base  = this.add.rectangle(x, y + 18, 20, 10, 0x5c3010, 1).setDepth(8);
      const dummy = this.add.container(x, y).setDepth(9);

      const pole   = this.add.rectangle(0,  10, 6, 30, 0x8b6014);
      const body   = this.add.rectangle(0,  -4, 22, 26, 0xd4a060);
      const head   = this.add.circle(0, -20, 10, 0xd4a060);
      const eye1   = this.add.rectangle(-4, -22, 4, 4, 0x333333);
      const eye2   = this.add.rectangle( 4, -22, 4, 4, 0x333333);
      const mouth  = this.add.rectangle(0, -16, 8, 3, 0x333333);
      const cross1 = this.add.rectangle(0,  -4, 24, 3, 0xcc4400).setAngle(45);
      const cross2 = this.add.rectangle(0,  -4, 24, 3, 0xcc4400).setAngle(-45);
      dummy.add([pole, body, head, eye1, eye2, mouth, cross1, cross2]);

      const hitRect = this.add.rectangle(x, y - 4, 22, 40, 0xff0000, 0).setDepth(9);
      hitRect.hp         = 10;
      hitRect.hpMax      = 10;
      hitRect._container = dummy;
      hitRect._base      = base;

      hitRect.takeDamage = function (amount) {
        this.hp -= amount;
        this.scene?.tweens?.add({
          targets: this._container,
          x: { from: this._container.x - 4, to: this._container.x + 4 },
          duration: 60, yoyo: true, repeat: 2,
        });
        if (this.hp <= 0) {
          this.scene?.tweens?.add({
            targets: [this._container, this._base],
            alpha: 0, y: '-=20', duration: 400,
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
      '攻撃     : Z/Enter  | B',
      'チャージ : 長押し→離す',
      '回避     : X         | A',
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
  }

  update(time, delta) {
    const input = this.input$;

    // holdMs は input.update() で _attackHoldMs がリセットされる前に取得する
    const holdMs = input.getAttackHoldMs();

    input.update(delta);

    // ── ロックオン ──────────────────────────
    const lockHeld = input.isDown(ACTION.LOCK_ON);
    this.combat.updateLockOn(lockHeld, this.enemyMgr.getGroup());
    this.player.setLockOnActive(lockHeld && !!this.combat.lockTarget);

    // ── 攻撃入力 ───────────────────────────
    const attackUp = input.isJustUp(ACTION.ATTACK);

    if (input.isDown(ACTION.ATTACK) && holdMs > 0 && this.combat.canAttack()) {
      this.combat.showChargeEffect(holdMs);
    } else {
      this.combat.clearChargeEffect();
    }

    if (attackUp && this.combat.canAttack()) {
      if (holdMs >= CHARGE_THRESHOLD) {
        this.combat.startAttack(true);
      } else if (holdMs > 0) {
        this.combat.startAttack(false);
      }
    }

    // ── プレイヤー更新 ──────────────────────
    this.player.update(delta, input);

    // ── 敵 AI 更新 ──────────────────────────
    this.enemyMgr.update(delta);

    // ── 戦闘更新（敵グループを渡す）──────────
    this.combat.update(delta, this.enemyMgr.getGroup());

    // ── フレーム末：ゲームパッド prev 保存 ───
    this.input$.endFrame();

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
    this.enemyMgr?.destroy();
  }
}
