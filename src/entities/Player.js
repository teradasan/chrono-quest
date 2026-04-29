import * as Phaser from 'phaser';
import { ACTION } from '../systems/InputManager.js';

// ──────────────────────────────────────────
//  スプライトアトラス定数
// ──────────────────────────────────────────
const FW = 48;          // フレーム幅
const FH = 48;          // フレーム高さ
const WALK_FRAMES = 4;  // 方向ごとのウォークフレーム数

// アトラス行番号
const ROW = { DOWN: 0, UP: 1, LEFT: 2, RIGHT: 3, DODGE: 4 };

// キャラクター色
const C = {
  skin:    '#f4c28a',
  hair:    '#4a2e0a',
  hat:     '#3a7c2f',
  tunic:   '#4a8c3f',
  tunic2:  '#3a6c2f',
  belt:    '#8b6914',
  pants:   '#d4c080',
  boots:   '#5c3010',
  eye:     '#1a1a3e',
  sword:   '#c8c8d8',
  hilt:    '#8b6914',
};

// ──────────────────────────────────────────
//  テクスチャ生成
// ──────────────────────────────────────────
export function createPlayerTexture(scene) {
  const canvas = scene.textures.createCanvas('player', FW * WALK_FRAMES, FH * 5);
  const ctx = canvas.getContext();
  ctx.imageSmoothingEnabled = false;

  for (let f = 0; f < WALK_FRAMES; f++) {
    drawDown (ctx, f * FW, ROW.DOWN  * FH, f);
    drawUp   (ctx, f * FW, ROW.UP    * FH, f);
    drawLeft (ctx, f * FW, ROW.LEFT  * FH, f);
    drawRight(ctx, f * FW, ROW.RIGHT * FH, f);
    drawDodge(ctx, f * FW, ROW.DODGE * FH, f);
  }

  canvas.refresh();

  // フレームデータを手動登録（これがないと全フレームが1枚絵として表示される）
  const texture = scene.textures.get('player');
  const ROWS = 5;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < WALK_FRAMES; col++) {
      const frameIndex = row * WALK_FRAMES + col;
      texture.add(frameIndex, 0, col * FW, row * FH, FW, FH);
    }
  }
}

// ── 共通ヘルパー ──────────────────────────
function px(ctx, color, x, y, w = 2, h = 2) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function legOffset(frame) {
  // 歩行フレームで左右の足が交互に動く
  return [0, 3, 0, -3][frame] ?? 0;
}

// ── 下向き ────────────────────────────────
function drawDown(ctx, ox, oy, frame) {
  const cx = ox + 24;
  const lo = legOffset(frame);

  // 影
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, oy + 44, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 足
  px(ctx, C.pants, cx - 7, oy + 30, 5, 10 + lo);
  px(ctx, C.pants, cx + 2, oy + 30, 5, 10 - lo);
  px(ctx, C.boots, cx - 8, oy + 38 + lo, 6, 4);
  px(ctx, C.boots, cx + 2, oy + 38 - lo, 6, 4);

  // 胴体
  px(ctx, C.tunic,  cx - 8, oy + 18, 16, 14);
  px(ctx, C.tunic2, cx - 8, oy + 28,  7,  4);
  px(ctx, C.tunic2, cx + 1, oy + 28,  7,  4);
  px(ctx, C.belt,   cx - 8, oy + 28, 16,  2);

  // 腕
  px(ctx, C.skin, cx - 11, oy + 19, 4, 10);
  px(ctx, C.skin, cx +  7, oy + 19, 4, 10);

  // 首
  px(ctx, C.skin, cx - 3, oy + 13, 6, 6);

  // 頭
  px(ctx, C.skin, cx - 7, oy + 4, 14, 12);
  // 耳
  px(ctx, C.skin, cx - 9, oy + 7, 2, 4);
  px(ctx, C.skin, cx + 7, oy + 7, 2, 4);
  // 目
  px(ctx, C.eye, cx - 5, oy + 9, 3, 3);
  px(ctx, C.eye, cx + 2, oy + 9, 3, 3);
  // 口
  px(ctx, C.hair, cx - 2, oy + 13, 4, 1);

  // 帽子
  px(ctx, C.hat, cx - 8, oy + 2, 16, 5);
  px(ctx, C.hat, cx - 5, oy + 0, 10, 3);
  // 帽子先端
  px(ctx, C.hat, cx + 4, oy - 2, 3, 3);
}

// ── 上向き ────────────────────────────────
function drawUp(ctx, ox, oy, frame) {
  const cx = ox + 24;
  const lo = legOffset(frame);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, oy + 44, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  px(ctx, C.pants, cx - 7, oy + 30, 5, 10 + lo);
  px(ctx, C.pants, cx + 2, oy + 30, 5, 10 - lo);
  px(ctx, C.boots, cx - 8, oy + 38 + lo, 6, 4);
  px(ctx, C.boots, cx + 2, oy + 38 - lo, 6, 4);

  px(ctx, C.tunic,  cx - 8, oy + 18, 16, 12);
  px(ctx, C.belt,   cx - 8, oy + 28, 16,  2);
  px(ctx, C.skin, cx - 11, oy + 19, 4, 10);
  px(ctx, C.skin, cx +  7, oy + 19, 4, 10);

  // 後頭部（髪のみ）
  px(ctx, C.hair, cx - 7, oy + 4, 14, 14);
  px(ctx, C.skin, cx - 5, oy + 8, 10, 8);
  px(ctx, C.hair, cx - 7, oy + 4, 14,  5);
  px(ctx, C.hat,  cx - 8, oy + 2, 16,  5);
  px(ctx, C.hat,  cx - 5, oy + 0, 10,  3);
  px(ctx, C.hat,  cx + 4, oy - 2,  3,  3);
}

// ── 左向き ────────────────────────────────
function drawLeft(ctx, ox, oy, frame) {
  const cx = ox + 22;
  const lo = legOffset(frame);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, oy + 44, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 足（前後）
  px(ctx, C.pants, cx - 4, oy + 30, 5, 10 + lo);
  px(ctx, C.pants, cx + 1, oy + 30, 5, 10 - lo);
  px(ctx, C.boots, cx - 5, oy + 38 + lo, 6, 4);
  px(ctx, C.boots, cx,     oy + 38 - lo, 6, 4);

  // 胴体
  px(ctx, C.tunic,  cx - 6, oy + 18, 14, 12);
  px(ctx, C.belt,   cx - 6, oy + 28, 14,  2);

  // 奥の腕
  px(ctx, C.tunic2, cx + 6, oy + 19, 4, 9);
  // 手前の腕
  px(ctx, C.skin, cx - 8, oy + 19, 4, 10);

  // 剣（右手に持つ）
  px(ctx, C.sword, cx - 12, oy + 22, 2, 16);
  px(ctx, C.hilt,  cx - 15, oy + 24, 8,  2);

  // 首
  px(ctx, C.skin, cx - 2, oy + 13, 5, 5);

  // 頭（横向き）
  px(ctx, C.skin, cx - 5, oy + 4, 12, 12);
  px(ctx, C.skin, cx - 7, oy + 7,  2,  5); // 鼻
  // 耳
  px(ctx, C.skin, cx + 6, oy + 7,  2,  4);
  // 目
  px(ctx, C.eye,  cx - 4, oy + 8,  3,  3);

  // 帽子
  px(ctx, C.hat, cx - 6, oy + 2, 14, 5);
  px(ctx, C.hat, cx - 3, oy + 0, 10, 3);
  px(ctx, C.hat, cx + 6, oy - 2,  3, 4);
}

// ── 右向き（左の鏡像） ────────────────────
function drawRight(ctx, ox, oy, frame) {
  // 左向きを描いてから水平反転
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = FW; tmpCanvas.height = FH;
  const tmpCtx = tmpCanvas.getContext('2d');
  tmpCtx.imageSmoothingEnabled = false;
  drawLeft(tmpCtx, 0, 0, frame);

  ctx.save();
  ctx.translate(ox + FW, oy);
  ctx.scale(-1, 1);
  ctx.drawImage(tmpCanvas, 0, 0);
  ctx.restore();
}

// ── 回避（ローリング） ────────────────────
function drawDodge(ctx, ox, oy, frame) {
  const cx = ox + 24;
  const cy = oy + 28;
  const angle = (frame / WALK_FRAMES) * Math.PI * 2;
  const tilt = Math.sin(angle) * 6;

  ctx.save();
  ctx.translate(cx, cy + tilt);
  ctx.rotate(angle * 0.5);

  // 丸まった体
  ctx.fillStyle = C.tunic;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // 頭
  ctx.fillStyle = C.skin;
  ctx.beginPath();
  ctx.ellipse(-4, -6, 6, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = C.hat;
  ctx.beginPath();
  ctx.ellipse(-4, -10, 6, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 影（回避中は薄め）
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, oy + 44, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ──────────────────────────────────────────
//  Player クラス
// ──────────────────────────────────────────
const SPEED        = 200;
const DASH_SPEED   = 360;
const DODGE_SPEED  = 380;
const DODGE_MS     = 400;   // 回避の継続時間
const DODGE_IFRAMES= 350;   // 無敵フレーム時間
const DODGE_COOLDOWN = 700; // 次の回避まで
const CHARGE_MS    = 600;   // チャージ攻撃判定時間

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // ヒットボックスをスプライトより小さく
    this.body.setSize(22, 22);
    this.body.setOffset(13, 22);
    this.setDepth(10);

    this._setupAnimations(scene);

    // 状態
    this.state     = 'idle';   // idle | walk | dash | dodge | attack | charge_wind | charge_release
    this.dir       = 'down';   // up | down | left | right
    this.hp        = 10;
    this.hpMax     = 10;
    this.invincible = false;

    // タイマー
    this._dodgeTimer    = 0;
    this._dodgeCooldown = 0;
    this._dodgeVx       = 0;
    this._dodgeVy       = 0;
    this._blinkTimer    = 0;

    // 攻撃状態フラグ（CombatManagerから制御）
    this._attackTint = false;
  }

  // ── アニメーション定義 ──────────────────
  _setupAnimations(scene) {
    const mkAnim = (key, row, start, end, rate, repeat = -1) => {
      if (scene.anims.exists(key)) return;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers('player', {
          frames: Array.from({ length: end - start + 1 }, (_, i) => row * WALK_FRAMES + start + i),
        }),
        frameRate: rate,
        repeat,
      });
    };

    mkAnim('walk_down',  ROW.DOWN,  0, 3, 8);
    mkAnim('walk_up',    ROW.UP,    0, 3, 8);
    mkAnim('walk_left',  ROW.LEFT,  0, 3, 8);
    mkAnim('walk_right', ROW.RIGHT, 0, 3, 8);
    mkAnim('idle_down',  ROW.DOWN,  0, 0, 4);
    mkAnim('idle_up',    ROW.UP,    0, 0, 4);
    mkAnim('idle_left',  ROW.LEFT,  0, 0, 4);
    mkAnim('idle_right', ROW.RIGHT, 0, 0, 4);
    mkAnim('dodge',      ROW.DODGE, 0, 3, 12, 0);
  }

  // ── 毎フレーム呼ぶ ─────────────────────
  update(delta, inputManager) {
    this._dodgeCooldown = Math.max(0, this._dodgeCooldown - delta);

    if (this.state === 'dodge') {
      this._updateDodge(delta);
      return;
    }

    // 攻撃中は移動を制限（ただし完全停止ではなく遅くする）
    const attacking = this.state === 'attack' || this.state === 'charge_release';

    const { x, y } = inputManager.getAxis();
    const moving    = x !== 0 || y !== 0;
    const dashing   = inputManager.isDown(ACTION.DASH) && !attacking;
    const dodgeJust = inputManager.isJustDown(ACTION.DODGE);

    // 回避開始（攻撃中は不可・静止中は向いている方向へ）
    if (dodgeJust && this._dodgeCooldown <= 0 && !attacking) {
      const dodgeX = moving ? x : (this.dir === 'left' ? -1 : this.dir === 'right' ? 1 : 0);
      const dodgeY = moving ? y : (this.dir === 'up'   ? -1 : this.dir === 'down'  ? 1 : 0);
      this._startDodge(dodgeX, dodgeY);
      return;
    }

    // 移動速度（攻撃中は遅くなる）
    const speed = attacking ? SPEED * 0.3 : (dashing ? DASH_SPEED : SPEED);
    this.body.setVelocity(x * speed, y * speed);

    // ロックオン中でなければ向き更新
    if (moving && !this._lockOnActive) this._updateDir(x, y);

    // 状態・アニメ更新（攻撃中は変更しない）
    if (!attacking) {
      const newState = moving ? (dashing ? 'dash' : 'walk') : 'idle';
      if (newState !== this.state || this._dirChanged) {
        this.state = newState;
        this._dirChanged = false;
        this._playAnim();
      }
    }

    // 無敵中の点滅
    if (this.invincible && !this._attackTint) {
      this._blinkTimer += delta;
      this.setAlpha(Math.floor(this._blinkTimer / 80) % 2 === 0 ? 1 : 0.3);
    }
  }

  // ── CombatManagerから呼ばれるコールバック ──
  onAttackStart(isCharge) {
    this.state = isCharge ? 'charge_release' : 'attack';
    this._attackTint = true;
    this.setTint(isCharge ? 0xff8800 : 0xffddaa);
    this.body.setVelocity(0, 0);
  }

  onAttackEnd() {
    this._attackTint = false;
    this.clearTint();
    this.state = 'idle';
    this._playAnim();
  }

  setLockOnActive(active) {
    this._lockOnActive = active;
  }

  // ── 回避処理 ────────────────────────────
  _startDodge(dx, dy) {
    this.state       = 'dodge';
    this._dodgeTimer = DODGE_MS;
    this._dodgeCooldown = DODGE_COOLDOWN;
    this._dodgeVx    = dx * DODGE_SPEED;
    this._dodgeVy    = dy * DODGE_SPEED;
    this.invincible  = true;
    this._blinkTimer = 0;
    this.play('dodge');
  }

  _updateDodge(delta) {
    this._dodgeTimer -= delta;
    this.body.setVelocity(this._dodgeVx, this._dodgeVy);

    // 無敵フレーム終了
    if (this._dodgeTimer < DODGE_MS - DODGE_IFRAMES && this.invincible) {
      this.invincible = false;
      this.setAlpha(1);
    }

    // 回避終了
    if (this._dodgeTimer <= 0) {
      this.state = 'idle';
      this.body.setVelocity(0, 0);
      this._playAnim();
    }
  }

  // ── 向き・アニメ ─────────────────────────
  _updateDir(x, y) {
    let newDir = this.dir;
    if (Math.abs(x) > Math.abs(y)) {
      newDir = x < 0 ? 'left' : 'right';
    } else {
      newDir = y < 0 ? 'up' : 'down';
    }
    if (newDir !== this.dir) {
      this.dir = newDir;
      this._dirChanged = true;
    }
  }

  _playAnim() {
    const prefix = this.state === 'idle' ? 'idle' : 'walk';
    const key = `${prefix}_${this.dir}`;
    if (this.anims.currentAnim?.key !== key) this.play(key);
  }

  // ── ダメージ受け ─────────────────────────
  takeDamage(amount) {
    if (this.invincible) return false;
    this.hp = Math.max(0, this.hp - amount);

    // HUD・ダメージフラッシュ通知
    this.scene.events.emit('playerDamaged', this.hp);

    if (this.hp <= 0) {
      // 死亡通知（FieldScene が受け取ってゲームオーバーへ）
      this.scene.events.emit('playerDied');
      return true;
    }

    this.invincible = true;
    this._blinkTimer = 0;
    this.scene.time.delayedCall(1000, () => {
      if (!this.active) return;
      this.invincible = false;
      this.setAlpha(1);
    });
    return true;
  }
}
